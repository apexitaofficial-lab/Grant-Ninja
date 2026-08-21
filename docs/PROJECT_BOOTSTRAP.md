# PROJECT_BOOTSTRAP.md

Project:
Grant Ninja

Purpose

This document defines the exact sequence for bootstrapping the Grant Ninja
project.

Do not begin implementing business features until every bootstrap task is
completed.

The objective is to ensure every environment is consistent, reproducible,
secure and production-ready.

---

# Bootstrap Workflow

Read documents in this exact order

1.

README.md

↓

2.

MASTER_PROJECT_SPEC.md

↓

3.

AI_ENGINEERING_GUIDE.md

↓

4.

PROJECT_BOOTSTRAP.md

↓

5.

TASKS.md

Only after completing bootstrap may feature development begin.

---

# Phase 1 — Repository Setup

Objectives

Create a clean and reproducible repository.

Tasks

□ Create Git repository

□ Configure default branch

□ Create .gitignore

□ Create README.md

□ Create LICENSE

□ Create docs folder

□ Create frontend folder

□ Create python folder

□ Create deployment folder

□ Create scripts folder

□ Create assets folder

Repository Structure

grant-ninja/

docs/

frontend/

python/

deployment/

scripts/

assets/

---

# Phase 2 — Next.js Setup

Create a new project

Requirements

Next.js 15

TypeScript

App Router

ESLint

Tailwind CSS

src disabled

Turbopack enabled

Use npm unless instructed otherwise.

Verify

□ Project runs

□ No errors

□ Git clean

---

# Phase 3 — Install Core Packages

Install

Tailwind CSS

shadcn/ui

React Hook Form

Zod

TanStack Query

TanStack Table

Framer Motion

Lucide React

Sonner

date-fns

react-markdown

nuqs

Do not install unnecessary dependencies.

---

# Phase 4 — Code Quality

Install

Prettier

ESLint plugins

lint-staged

Husky

Commitlint

Configure

Formatting

Import Order

Strict TypeScript

Line Endings

No unused imports

Verify

□ Lint passes

□ Format passes

---

# Phase 5 — Project Structure

Create folders

app/

components/

features/

hooks/

providers/

services/

types/

config/

constants/

utils/

lib/

styles/

public/

Inside features

home/

search/

grants/

countries/

organizations/

categories/

services/

seo/

admin/

shared/

Do not begin implementation yet.

---

# Phase 6 — Environment Variables

Create

.env.local

Required Variables

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

GEMINI_API_KEY

NEXT_PUBLIC_SITE_URL

NEXT_PUBLIC_SITE_NAME

Validate every environment variable during startup.

Never hardcode secrets.

---

# Phase 7 — shadcn/ui

Initialize shadcn.

Install

Button

Input

Textarea

Dialog

Card

Dropdown

Badge

Toast

Accordion

Tabs

Sheet

Pagination

Tooltip

Skeleton

Table

Use shadcn defaults unless customization is documented.

---

# Phase 8 — Global Layout

Create

Navbar

Footer

Container

Page Wrapper

Main Layout

Metadata

Fonts

Theme

404

Loading

Error

Everything reusable.

---

# Phase 9 — Supabase

Connect project.

Configure

Client

Server Client

Middleware

Authentication

Storage

Repository Layer

Do not access Supabase directly from UI.

---

# Phase 10 — Authentication

Configure

Supabase Auth

Protected Routes

Admin Layout

Role Middleware

Admin only

/public

/admin

Verify login flow.

---

# Phase 11 — Database

Create tables

Countries

States

Organizations

Categories

Grants

Grant AI

Grant SEO

Grant Sources

Crawler Logs

Users

Settings

Audit Logs

Create indexes.

Enable Row Level Security.

Generate migrations.

---

# Phase 12 — Python Platform

Create

Virtual Environment

Install

Crawl4AI

Pydantic

RapidFuzz

Loguru

Playwright

Google Generative AI SDK

python-dotenv

requests

beautifulsoup4

Create

main.py

config.py

settings.py

requirements.txt

Verify

Environment loads successfully.

---

# Phase 13 — AI Integration

Configure

Gemini Flash

Prompt Loader

Prompt Versioning

Retry Logic

Validation

Token Logging

Do not call AI directly from UI.

---

# Phase 14 — Shared Services

Create

Logger

Config

Repository Base

HTTP Client

Error Handler

Utilities

Everything reusable.

---

# Phase 15 — Development Standards

Verify

Strict TypeScript

No any

Repository Pattern

Server Actions

Feature Architecture

No duplicated code

---

# Phase 16 — Initial Testing

Verify

Application starts

Python starts

Supabase connected

Authentication works

Environment valid

Build passes

Lint passes

No console errors

---

# Phase 17 — Deployment Preparation

Prepare

Dockerfile (optional)

Nginx configuration

PM2 configuration

Python service

Cron examples

Environment documentation

Hostinger VPS deployment notes

Do not deploy yet.

---

# Phase 18 — Ready for Development

When all bootstrap tasks are complete

Update

TASKS.md

Mark Bootstrap Complete.

Only then begin implementing business features.

---

# Bootstrap Completion Checklist

✓ Repository Created

✓ Next.js Installed

✓ Python Environment Ready

✓ Crawl4AI Installed

✓ Gemini Connected

✓ Supabase Connected

✓ Authentication Ready

✓ Database Ready

✓ shadcn Installed

✓ Layout Ready

✓ Build Successful

✓ Lint Successful

✓ Environment Validated

✓ Documentation Complete

The project is now ready for feature development.

End of PROJECT_BOOTSTRAP.md
