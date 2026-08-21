"""Gemini client.

Part 7B §148: this layer builds prompts, calls the model, validates the JSON
and logs the cost. It never touches the database except to write its own call
log — nothing here decides what gets published.

Structured output is requested via `response_schema`, so the model returns
JSON conforming to our Pydantic model rather than prose we have to salvage.
That removes the single most common failure in an AI pipeline: a perfectly
good extraction wrapped in ```json fences, or an apology instead of an object.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from typing import TypeVar

from google import genai
from google.genai import types
from google.genai.errors import APIError, ClientError
from pydantic import BaseModel, ValidationError
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from ai.prompt_loader import Prompt
from config.settings import get_settings
from core.logging import get_logger

log = get_logger("ai")

TModel = TypeVar("TModel", bound=BaseModel)


class AIExtractionError(RuntimeError):
    """The model could not produce a usable result after retries."""


@dataclass(frozen=True, slots=True)
class AIResult[T: BaseModel]:
    """A validated response plus what it cost."""

    value: T
    prompt_name: str
    prompt_version: str
    model: str
    tokens_input: int
    tokens_output: int
    execution_ms: int


def _silence_afc_notice() -> None:
    """Suppresses the SDK's automatic-function-calling advisory.

    Passing a Pydantic model as `response_schema` makes the SDK log a notice
    recommending `Chat.send_message` instead. It does not apply to structured
    extraction, and it would otherwise print on every page we process.
    """
    logging.getLogger("google_genai.models").setLevel(logging.ERROR)


class GeminiClient:
    def __init__(self) -> None:
        settings = get_settings()
        self._model = settings.gemini_model
        self._client = genai.Client(api_key=settings.gemini_api_key.get_secret_value())

        _silence_afc_notice()

    @property
    def model(self) -> str:
        return self._model

    def generate_structured(
        self,
        prompt: Prompt,
        schema: type[TModel],
        **values: str,
    ) -> AIResult[TModel]:
        """Runs a prompt and returns a validated instance of `schema`."""
        rendered = prompt.render(**values)
        started = time.perf_counter()

        response = self._call(rendered, schema)

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        usage = response.usage_metadata
        text = (response.text or "").strip()

        if not text:
            raise AIExtractionError(f"{prompt.name} {prompt.version}: model returned nothing")

        try:
            value = schema.model_validate_json(text)
        except ValidationError as error:
            # Worth logging the payload: a schema mismatch is nearly always a
            # prompt problem, and the offending JSON is the evidence.
            log.error(
                "{name} {version} returned JSON that failed validation: {error}",
                name=prompt.name,
                version=prompt.version,
                error=error,
                payload=text[:2000],
            )

            raise AIExtractionError(f"{prompt.name} {prompt.version} failed validation") from error

        return AIResult(
            value=value,
            prompt_name=prompt.name,
            prompt_version=prompt.version,
            model=self._model,
            tokens_input=getattr(usage, "prompt_token_count", 0) or 0,
            tokens_output=getattr(usage, "candidates_token_count", 0) or 0,
            execution_ms=elapsed_ms,
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=20),
        # Only transient failures are retried. A 400 means the request is
        # wrong, and sending it twice more just costs time.
        retry=retry_if_exception_type(APIError),
        reraise=True,
    )
    def _call(self, rendered: str, schema: type[BaseModel]) -> types.GenerateContentResponse:
        try:
            return self._client.models.generate_content(
                model=self._model,
                contents=rendered,
                config=types.GenerateContentConfig(
                    # Extraction is a reading task, not a writing one: the same
                    # page must produce the same answer every run.
                    temperature=0.0,
                    response_mime_type="application/json",
                    response_schema=schema,
                ),
            )
        except ClientError as error:
            # 4xx: retrying will not help. Surface it immediately.
            log.error("Gemini rejected the request: {error}", error=error)
            raise AIExtractionError(str(error)) from error


def describe_usage(result: AIResult[BaseModel]) -> str:
    return (
        f"{result.prompt_name} {result.prompt_version} · {result.model} · "
        f"{result.tokens_input}→{result.tokens_output} tokens · {result.execution_ms} ms"
    )


def to_log_row(result: AIResult[BaseModel], grant_id: str | None, status: str) -> dict[str, object]:
    """Shape for `ai_generation_logs` — cost monitoring and prompt debugging."""
    return {
        "grant_id": grant_id,
        "model": result.model,
        "prompt_name": result.prompt_name,
        "prompt_version": result.prompt_version,
        "tokens_input": result.tokens_input,
        "tokens_output": result.tokens_output,
        "execution_ms": result.execution_ms,
        "status": status,
    }


def parse_json_or_none(text: str) -> dict[str, object] | None:
    """Lenient parse for debugging output that failed validation."""
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return None

    return parsed if isinstance(parsed, dict) else None
