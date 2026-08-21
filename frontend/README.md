# Grant Ninja — Frontend

Next.js 15 (App Router) application for the public grants platform and the admin portal.

Read `/docs` before changing anything here — in particular `MASTER_PROJECT_SPEC.md`,
`AI_ENGINEERING_GUIDE.md` and `UI_UX_DESIGN_SYSTEM.md`.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the real keys
npm run dev
```

## Scripts

| Script                 | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Dev server on http://localhost:3000          |
| `npm run build`        | Production build                             |
| `npm run typecheck`    | `tsc --noEmit`                               |
| `npm run lint`         | ESLint                                       |
| `npm run lint:fix`     | ESLint with autofix                          |
| `npm run format`       | Prettier write                               |
| `npm run format:check` | Prettier check                               |
| `npm run verify`       | typecheck + lint + format check (pre-commit) |

## Architecture

Requests flow in one direction and no layer may be skipped
(`AI_ENGINEERING_GUIDE.md` §18/§61):

```
UI (Server Component) -> Server Action -> Service -> Repository -> Supabase
```

| Path          | Holds                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `app/`        | Routing only. No business logic.                                                                                          |
| `features/`   | One folder per business capability, owning its own components, actions, services, repositories, schemas, types and hooks. |
| `components/` | Reusable UI with no business knowledge. `components/ui` is vendored shadcn.                                               |
| `lib/`        | Supabase clients, logger, errors, base repository. Never imports UI.                                                      |
| `config/`     | Environment validation, routes, site config.                                                                              |
| `providers/`  | Application-wide React providers.                                                                                         |

Server Components are the default. Reach for `"use client"` only when the
component needs state, effects or browser APIs.

## Do not add a route-level `loading.tsx`

A `loading.tsx` beside `app/(public)/grants/(index)/page.tsx` broke hydration
for that entire route on Next 15.5 with Turbopack. The page rendered and was
fully indexable, but its Suspense content streamed into a hidden container and
never got moved into place, so **no client component on the route ever
hydrated** — filters, search and sort all rendered as dead HTML.

There was no error in the console or the server log. The tell is React's
boundary marker in the DOM: `<!--$~-->` with the fallback still in place.

Removing the file fixed it immediately. If a listing skeleton is wanted later,
verify hydration afterwards — check that a client control has a
`__reactFiber$…` property — rather than assuming it still works.

## Conventions

- Strict TypeScript. `any` is an ESLint error — use `unknown` or a real type.
- Files and folders are `kebab-case`; components and types are `PascalCase`.
- Never query Supabase from a component. Go through a repository.
- Every async operation logs and returns a predictable `ActionResult`.
- `components/ui/**` is vendored shadcn code and is excluded from lint and format.
