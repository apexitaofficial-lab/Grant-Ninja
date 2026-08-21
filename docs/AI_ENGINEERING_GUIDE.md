# AI_ENGINEERING_GUIDE.md

Version: 1.0

Project:
Grant Ninja

Purpose

This document defines how any AI software engineer (Claude Code, Codex,
Cursor, Windsurf, Cline, Roo Code, Gemini CLI, etc.) must approach the
development of Grant Ninja.

This document is mandatory.

The AI should read this document before writing any code.

The objective is consistency, maintainability, scalability and production
quality software.

---

# 1. Primary Goal

Do not generate demo code.

Do not generate MVP shortcuts.

Do not generate hacky solutions.

Generate production-ready software.

Every decision should prioritize:

Maintainability

Scalability

Security

Performance

Developer Experience

Readability

Future Expansion

---

# 2. Think Before Coding

Before writing code the AI should

Read the complete documentation.

Understand the architecture.

Understand dependencies.

Identify reusable components.

Create an implementation plan.

Only then begin coding.

Never randomly create files.

---

# 3. Never Assume

If information is missing

Stop.

Ask.

Never invent

API responses

Database fields

Business rules

URLs

Environment variables

User requirements

---

# 4. Respect the Architecture

Always follow

MASTER_PROJECT_SPEC.md

Never simplify architecture.

Never replace documented technologies.

Never redesign the application without approval.

---

# 5. Build Features

Do not build pages.

Build features.

Example

Wrong

Home Page

Correct

Search Feature

Grant Feature

Country Feature

SEO Feature

Admin Feature

Every feature owns

Components

Types

Hooks

Validation

Actions

Services

---

# 6. Component Philosophy

Components should

Be reusable

Be independent

Have one responsibility

Never contain duplicated code

Prefer composition over inheritance.

---

# 7. Server First

Always prefer

Server Components

Only use Client Components when interaction requires it.

Examples

Forms

Dropdowns

Dialogs

Charts

Animations

Everything else

Server Components.

---

# 8. TypeScript

Strict Mode.

Never disable strict mode.

Never use

any

Always prefer

unknown

or

proper interfaces.

Every object should be typed.

---

# 9. Naming

Names should describe purpose.

Bad

utils.ts

Good

grant-search-service.ts

Bad

data.ts

Good

grant-repository.ts

---

# 10. Folder Organization

Organize by business feature.

Not by file type.

Bad

components/

hooks/

services/

Good

features/

grants/

countries/

search/

admin/

---

# 11. File Size

Preferred

200–300 lines

Maximum

500 lines

If larger

Split.

---

# 12. Functions

Functions should

Do one thing.

Have descriptive names.

Return predictable results.

Avoid deeply nested logic.

Prefer early returns.

---

# 13. Comments

Comment

Why

Not

What

Avoid obvious comments.

Good

// Skip AI generation if page hash is unchanged.

Bad

// Increment counter.

---

# 14. Error Handling

Every async operation

Must

Catch errors

Log errors

Return predictable responses

Display friendly UI

Never silently fail.

---

# 15. Validation

Never trust

User Input

Crawler Output

Gemini Output

API Response

Database Response

Everything should be validated.

---

# 16. Forms

Every form

React Hook Form

Zod

Loading State

Success State

Error State

Disabled State

Accessible Labels

---

# 17. Security

Never expose

Secrets

API Keys

Service Keys

Never trust client input.

Sanitize everything.

---

# 18. Database Access

Never query Supabase directly from components.

Always use

Repository

↓

Service

↓

Server Action

↓

UI

This allows future database migration.

---

# 19. Business Logic

Business logic

Never belongs

Inside

UI Components

Pages

Layouts

Business logic belongs inside

Features

Services

Repositories

---

# 20. Environment Variables

Validate

Every environment variable

During startup.

Fail early.

Never continue with missing secrets.

---

# 21. AI Calls

Never call Gemini directly from UI.

Always use

AI Service

↓

Validation

↓

Repository

↓

Database

Log

Prompt Version

Execution Time

Tokens

Failures

---

# 22. Logging

Every important operation

Should log

Start

Finish

Duration

Errors

Retries

Result

Logs should assist debugging.

---

# 23. Performance

Avoid

Large bundles

Duplicate fetches

Nested requests

Hydration issues

Prefer

Streaming

Lazy Loading

Caching

Pagination

---

# 24. Accessibility

Every page

Keyboard Friendly

Screen Reader Friendly

Semantic HTML

Visible Focus

ARIA Labels

High Contrast

---

# 25. Testing Mindset

Every feature should be written as if it will be tested.

Predictable outputs.

Small functions.

Minimal side effects.

---

# 26. Refactoring

If duplicated logic appears

Refactor immediately.

Never copy-paste code.

---

# 27. Git Philosophy

Every commit

Should represent

One logical change.

Examples

feat(search)

feat(admin)

fix(crawler)

refactor(ai)

---

# 28. Before Marking Feature Complete

Verify

✓ Mobile

✓ Desktop

✓ Responsive

✓ Error Handling

✓ Loading

✓ Accessibility

✓ SEO

✓ Types

✓ Logging

✓ Documentation

---

# 29. AI Behaviour

The AI should behave like

Senior Software Architect

↓

Senior Backend Engineer

↓

Senior Frontend Engineer

↓

Senior DevOps Engineer

↓

Senior QA Engineer

Not

Junior Developer

Never rush.

Prefer quality over speed.

---

# 30. Golden Rule

If there are two possible implementations

Always choose

The cleaner

More scalable

More maintainable solution

Even if it requires slightly more work.

Long-term maintainability is more important than short-term speed.

---

End of AI_ENGINEERING_GUIDE.md
Part 1

Next:

Project Coding Standards

Naming Conventions

Architecture Rules

Next.js Rules

Python Rules

Supabase Rules

Testing Rules

Deployment Rules

Code Review Checklist

---

# Part 2 – Engineering Standards & Development Workflow

This section defines the engineering standards that every contributor,
human or AI, must follow while developing Grant Ninja.

These rules ensure consistency across the codebase.

---

# 31. Software Architecture

The application follows a layered architecture.

Presentation Layer

↓

Application Layer

↓

Business Logic Layer

↓

Repository Layer

↓

Database

UI components should never communicate directly with the database.

Every request should flow through the architecture.

---

# 32. Feature-Driven Development

Every business capability is implemented as a feature.

Example

features/

    grants/

    search/

    countries/

    organizations/

    categories/

    admin/

    ai/

    seo/

Every feature owns

Components

Actions

Hooks

Schemas

Services

Types

Utilities

Tests

Documentation

Never split a feature across unrelated folders.

---

# 33. Single Source of Truth

Every business rule should exist in only one location.

Examples

Grant Status

Validation Rules

Country List

SEO Defaults

Environment Variables

Duplicate business logic is prohibited.

---

# 34. Reusable Components

Every reusable UI component belongs inside

/components/ui

Examples

Button

Input

Card

Badge

Dialog

Table

Pagination

Toast

Avatar

Tooltip

Components should never depend on business logic.

---

# 35. Feature Components

Feature-specific components belong inside

/features/<feature>/components

Example

features/grants/components/grant-card.tsx

These components may understand Grant data.

Generic components may not.

---

# 36. Server Actions

Preferred architecture

Page

↓

Server Action

↓

Service

↓

Repository

↓

Supabase

Never call repositories directly from pages.

Server Actions perform

Validation

Authentication

Authorization

Error Handling

Logging

---

# 37. Repository Pattern

Repositories isolate the database.

Example

GrantRepository

CountryRepository

OrganizationRepository

CategoryRepository

CrawlerRepository

MediaRepository

If the database changes in the future,

only repositories should require modification.

---

# 38. Service Layer

Services contain business logic.

Examples

GrantService

SearchService

SEOService

AISummaryService

CrawlerService

NotificationService

Repositories should never contain business rules.

---

# 39. Validation Layer

Validation occurs before every write.

Preferred

Zod (Frontend)

Pydantic (Python)

Database Constraints

Never trust incoming data.

---

# 40. Error Strategy

Expected Errors

↓

Display friendly message

Unexpected Errors

↓

Log

↓

Report

↓

Return generic error

Never expose stack traces.

---

# 41. Logging Standards

Every important action logs

Timestamp

User

Feature

Action

Duration

Status

Error (if applicable)

Logs should be structured.

Preferred format

JSON

---

# 42. API Design

Internal communication

Server Actions

External communication

API Routes

Future integrations

REST API

Webhook Endpoints

Never create unnecessary APIs.

---

# 43. Database Transactions

Whenever multiple records change together,

use transactions.

Examples

Publish Grant

↓

Grant

SEO

History

Search Index

Audit Log

Either everything succeeds,

or everything rolls back.

---

# 44. Naming Standards

Variables

camelCase

Functions

camelCase

Types

PascalCase

Interfaces

PascalCase

Components

PascalCase

Folders

kebab-case

Files

kebab-case

Environment Variables

UPPER_CASE

---

# 45. Imports

Import order

1.

External libraries

2.

Shared libraries

3.

Feature imports

4.

Relative imports

Avoid circular dependencies.

---

# 46. Constants

Magic values are prohibited.

Example

Bad

if (status == 2)

Good

if (status === GrantStatus.PUBLISHED)

Every constant should be named.

---

# 47. Async Programming

Prefer

async / await

Avoid nested Promise chains.

Every async function should

Handle errors

Return predictable values

Timeout appropriately

---

# 48. Code Duplication

Before writing new code,

search for existing implementations.

If similar logic exists,

reuse it.

Never duplicate large blocks of code.

---

# 49. Feature Completion Checklist

A feature is complete only when

✓ Business logic implemented

✓ Database connected

✓ Validation added

✓ Error handling implemented

✓ Loading state implemented

✓ Empty state implemented

✓ Responsive

✓ Accessible

✓ SEO compliant

✓ Types complete

✓ Documentation updated

---

# 50. AI Development Workflow

Before implementing a feature

Step 1

Read the related section in

MASTER_PROJECT_SPEC.md

↓

Step 2

Understand dependencies

↓

Step 3

List required files

↓

Step 4

Implement database layer

↓

Step 5

Implement business logic

↓

Step 6

Implement UI

↓

Step 7

Add validation

↓

Step 8

Handle loading & errors

↓

Step 9

Review implementation

↓

Step 10

Mark task complete

Never skip steps.

---

# 51. Pull Request Standards

Every logical feature should be developed independently.

Examples

feat(grants)

feat(search)

feat(admin)

fix(ai)

refactor(crawler)

Avoid mixing unrelated changes.

---

# 52. Definition of Done

A task is considered complete only when

✓ Code compiles

✓ No TypeScript errors

✓ No lint errors

✓ Responsive

✓ Accessibility verified

✓ Documentation updated

✓ Matches specification

✓ Ready for production

---

# End of Part 2

---

# Part 3 – AI Engineering Mindset

This section defines how the AI should think while developing the application.

The objective is not to generate code quickly.

The objective is to generate software that another senior engineer would
be happy to maintain years later.

Quality always takes priority over speed.

---

# 53. Understand Before Building

Never start coding immediately.

Always perform the following steps first.

1.

Read the relevant sections of

MASTER_PROJECT_SPEC.md

↓

2.

Understand the business objective.

↓

3.

Understand how the feature fits into the entire application.

↓

4.

Identify dependencies.

↓

5.

Estimate complexity.

↓

6.

Create an implementation plan.

Only after completing these steps should development begin.

---

# 54. Think Like a Software Architect

When implementing any feature, ask:

Why does this feature exist?

Can it be reused?

Will it scale?

Will another developer understand it?

Can it support future requirements?

Never optimize only for the current requirement.

Design for future expansion whenever practical.

---

# 55. Break Large Problems Into Smaller Tasks

Large features should never be implemented all at once.

Example

Grant Detail Page

↓

Create Database Query

↓

Create Server Action

↓

Create Types

↓

Create Layout

↓

Create Components

↓

Create SEO

↓

Create Schema

↓

Testing

↓

Review

Each task should be independently verifiable.

---

# 56. Reuse Before Creating

Before creating

Component

Hook

Service

Repository

Utility

Search the project.

If a reusable implementation already exists,

reuse or extend it.

Never duplicate functionality.

---

# 57. Follow Existing Patterns

Maintain consistency.

If similar features already exist,

follow the same architecture.

Avoid introducing multiple solutions to the same problem.

Consistency is more valuable than personal preference.

---

# 58. Build Generic Solutions

Avoid writing code that only works for one page.

Example

Bad

GrantButton

Good

Button

Example

Bad

CaliforniaFilter

Good

LocationFilter

Design for reuse.

---

# 59. Minimize Complexity

Prefer

Simple code

Readable code

Predictable code

Avoid

Deep nesting

Over-engineering

Premature optimization

Complex abstractions without clear benefit.

---

# 60. Self Review Before Continuing

After completing each feature,

review the implementation.

Ask:

Does this match the specification?

Is anything duplicated?

Can this be simplified?

Is it fully typed?

Is it responsive?

Is it accessible?

Could another developer understand this easily?

Only continue if the answer is yes.

---

# 61. Protect the Architecture

Never violate architectural boundaries.

Example

UI

↓

Server Action

↓

Service

↓

Repository

↓

Database

Do not skip layers.

Do not access the database directly from UI components.

---

# 62. Detect Technical Debt

Whenever you notice

Duplicated logic

Large files

Complex functions

Circular dependencies

Repeated validation

Repeated queries

Recommend a refactor before continuing.

Never allow technical debt to accumulate.

---

# 63. Prefer Composition

Prefer

Small reusable components

Instead of

Large monolithic components.

Example

Grant Page

↓

Grant Header

Funding Summary

Eligibility

Documents

FAQ

Answer Capsules

CTA

Compose features from smaller pieces.

---

# 64. Respect Single Responsibility

Each file should have one clear purpose.

Bad

grant.ts

Contains

Database

UI

Validation

Helpers

Good

grant-repository.ts

grant-service.ts

grant-schema.ts

grant-card.tsx

grant-actions.ts

Each file should answer one question.

---

# 65. Write Code for Humans

Assume another senior engineer will maintain the code.

Prioritize

Readable names

Clear structure

Predictable flow

Minimal surprises

Avoid clever code.

Prefer obvious code.

---

# 66. Review Dependencies

Before installing a new package,

ask

Does the project already solve this problem?

Can native JavaScript solve it?

Is the package actively maintained?

Will this increase bundle size?

Minimize unnecessary dependencies.

---

# 67. Never Ignore Errors

Errors are valuable.

Every unexpected error should

Be logged

Contain context

Be recoverable where possible

Never swallow exceptions silently.

---

# 68. Handle Edge Cases

Always consider

Empty data

Large datasets

Slow network

Missing fields

Invalid AI output

Permission failures

Unexpected user behavior

Applications should fail gracefully.

---

# 69. Think in Features, Not Pages

A page is only a composition of features.

Examples

Search

Pagination

Grant Card

Filters

Breadcrumbs

Schema

FAQ

Each feature should be reusable elsewhere.

---

# 70. Validate Before Persisting

Never write data directly into the database.

Validation order

Input

↓

Schema Validation

↓

Business Rules

↓

Repository

↓

Database

Never bypass validation.

---

# 71. Keep Context

When interrupted,

before continuing,

review

MASTER_PROJECT_SPEC.md

AI_ENGINEERING_GUIDE.md

TASKS.md

Resume from the last completed task.

Never assume previous context is still accurate.

---

# 72. Definition of Engineering Excellence

Engineering excellence means

Readable

Reusable

Scalable

Secure

Well Tested

Accessible

Documented

Performant

Predictable

Maintainable

Every implementation should aim for this standard.

---

# 73. Decision Making Framework

When multiple implementations are possible,

choose the one that is

Simpler

More maintainable

More reusable

Better documented

Easier to test

Avoid choosing the shortest solution if it sacrifices quality.

---

# 74. Stop and Ask

Pause implementation and request clarification if

Business requirements conflict

Documentation is ambiguous

Security implications are unclear

Multiple architectural approaches exist

Data requirements are incomplete

Never guess critical business logic.

---

# 75. Continuous Improvement

After completing a feature,

consider

Can performance improve?

Can readability improve?

Can duplication be removed?

Can accessibility improve?

Can documentation improve?

Refactor before moving on.

---

# End of Part 3

---

# Part 4 – Autonomous Execution Framework

This section defines the execution methodology the AI should follow while
developing the application.

The AI should not behave like a code generator.

The AI should behave like a Senior Technical Lead responsible for delivering
production-quality software.

Never rush implementation.

Always prioritize correctness, maintainability and scalability.

---

# 76. Project Startup Workflow

When starting the project

Step 1

Read

README.md

↓

Step 2

Read

MASTER_PROJECT_SPEC.md

↓

Step 3

Read

AI_ENGINEERING_GUIDE.md

↓

Step 4

Read

TASKS.md

↓

Step 5

Understand

Architecture

↓

Step 6

Identify

Current Task

↓

Step 7

Estimate Dependencies

↓

Step 8

Create Implementation Plan

↓

Step 9

Begin Development

Never start coding before completing this workflow.

---

# 77. Feature Planning Workflow

Before implementing any feature

Identify

Business Goal

↓

Identify

User Story

↓

Identify

Database Changes

↓

Identify

Backend Changes

↓

Identify

Frontend Changes

↓

Identify

SEO Requirements

↓

Identify

Testing Requirements

↓

Estimate Complexity

Only then begin coding.

---

# 78. Dependency Analysis

Every feature should answer

What already exists?

What can be reused?

What must be created?

What should not be modified?

Never duplicate functionality.

---

# 79. File Planning

Before creating files

Generate a file plan.

Example

Create

grant-card.tsx

grant-table.tsx

grant-repository.ts

grant-service.ts

grant-actions.ts

grant-schema.ts

Do not create unnecessary files.

---

# 80. Development Order

Always implement features in this order

Database

↓

Repository

↓

Service

↓

Validation

↓

Server Action

↓

UI

↓

SEO

↓

Testing

↓

Documentation

Skipping layers is prohibited.

---

# 81. Component Creation Strategy

When building UI

Look for

Existing Components

↓

Reuse

↓

Extend

↓

Only create new components if necessary

Avoid component duplication.

---

# 82. Backend Before Frontend

Never build UI that depends on unfinished backend logic.

Preferred order

Database

↓

Repository

↓

Business Logic

↓

Server Actions

↓

UI

↓

Testing

---

# 83. Validation Workflow

Every write operation

↓

Input Validation

↓

Business Validation

↓

Authorization

↓

Repository

↓

Database

Validation should never occur only at the UI layer.

---

# 84. Self Verification

After completing a feature

Verify

Business Requirements

Architecture

Type Safety

Responsive Design

Accessibility

SEO

Error Handling

Performance

Only continue if all checks pass.

---

# 85. Automatic Refactoring

Whenever

Duplicate code

Large files

Complex logic

Repeated validation

Repeated queries

Repeated UI

are detected,

refactor before continuing.

---

# 86. Context Recovery

If development is interrupted

Resume using

README.md

↓

TASKS.md

↓

MASTER_PROJECT_SPEC.md

↓

Last Git Commit

↓

Current Feature

Never continue based on memory alone.

---

# 87. Working in Small Increments

Large features should be divided into

Planning

↓

Backend

↓

Frontend

↓

Testing

↓

Review

↓

Completion

Never attempt large monolithic implementations.

---

# 88. Progress Tracking

After every completed task

Update

TASKS.md

Mark

Completed

In Progress

Blocked

Every completed feature should be traceable.

---

# 89. Change Management

Before changing existing code

Ask

Will this break another feature?

Should this be reused?

Is there a cleaner abstraction?

Avoid unnecessary rewrites.

---

# 90. Error Recovery Strategy

When implementation fails

Stop

↓

Read Logs

↓

Identify Root Cause

↓

Fix Cause

↓

Retest

Never hide errors with workarounds.

---

# 91. Technical Debt Detection

Continuously monitor

Large Components

Large Services

Duplicate Queries

Unused Code

Unused Packages

Circular Dependencies

Magic Strings

Magic Numbers

Refactor immediately.

---

# 92. Quality Gates

A feature cannot be considered complete unless

✓ TypeScript passes

✓ Lint passes

✓ Build passes

✓ Responsive

✓ Accessible

✓ SEO complete

✓ Loading state

✓ Empty state

✓ Error state

✓ Documentation updated

---

# 93. Documentation Rules

Every significant module should include

Purpose

Responsibilities

Dependencies

Expected Inputs

Expected Outputs

Future Considerations

The codebase should remain self-explanatory.

---

# 94. AI Review Checklist

Before marking a task complete, ask:

Does this follow the specification?

Does this introduce duplication?

Can another engineer understand it easily?

Does it follow the repository pattern?

Are all edge cases handled?

Is validation complete?

Is error handling complete?

Is it production-ready?

If any answer is "No", continue improving.

---

# 95. Project Completion Checklist

The project is complete only when

✓ All tasks in TASKS.md are complete

✓ Build succeeds

✓ No lint errors

✓ No TypeScript errors

✓ Documentation updated

✓ Deployment successful

✓ Acceptance criteria satisfied

✓ Ready for production

---

# 96. Golden Principle

The AI is not rewarded for writing more code.

The AI is rewarded for producing software that is

Simple

Reliable

Maintainable

Scalable

Reusable

Well Documented

Production Ready

Whenever there is a choice between

Shorter code

or

Better architecture

Always choose the better architecture.

---

# End of Part 4
