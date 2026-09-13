# PatchWatch — Roadmap (Phase 1)

**What this document is:** the day-by-day build order for the slice defined in `PROJECT_SPEC.md`.

**How to use it:** each checkbox below should become one small task brief handed to Antigravity — not the whole day at once. Pick one box, turn it into a brief, implement, verify, commit, check the box, move to the next.

---

## Days 1–2 — Foundations

- [ ] Scaffold the monorepo: `apps/web`, `apps/worker`, `apps/vscode-extension` (empty for now), and all the `packages/` folders from `ARCHITECTURE.md`
- [ ] `docker-compose.yml` with local Postgres + Redis
- [ ] Prisma schema v1: `User`, `Account`, `Session` (needed by NextAuth), `Workspace`, `WorkspaceMember`, `Installation`, `Repository`, `ScanRun`, `Finding` — matching the shapes in `API_CONTRACTS.md`
- [ ] NextAuth wired up with GitHub sign-in, a basic protected `/dashboard` page
- [ ] Repo hygiene: `.gitignore`, branch protection on `main`, PR template, commitlint, a CI check that just lints and type-checks for now

## Days 3–4 — GitHub App & multi-tenancy

- [ ] Register the GitHub App on GitHub itself (permissions: read code, write pull request comments; subscribe to `pull_request` events)
- [ ] Use [smee.io](https://smee.io) to forward GitHub's webhook to your own machine while developing
- [ ] Build `GET /api/github/install/callback` — saves the `Installation` and its `Repository` rows, links them to a `Workspace`
- [ ] Add the membership check (RBAC) middleware every workspace route will use
- [ ] Build `POST /api/github/webhook` — check the signature, reply fast — don't process the job yet, that's Day 7

## Days 5–6 — Detection engine

- [ ] `packages/detection-engine` — runs `semgrep --config auto --json`, turns the raw output into the `Finding` shape from `API_CONTRACTS.md`
- [ ] First Trigger.dev task in `apps/worker`, `analyzePullRequest` — fetches only the changed files for a pull request and runs the detection engine on them

## Day 7 — Orchestration & baseline security

- [ ] Wire the webhook handler to actually start the `analyzePullRequest` task
- [ ] Rate limiting on the webhook route and any public route
- [ ] Structured logging, tagged with GitHub's delivery ID so one pull request's scan can be traced end to end
- [ ] Validation (Zod, from `packages/shared-types`) on every route and the webhook payload

## Day 8 — AI layer

- [ ] `packages/ai-client` — takes one `Finding` plus its surrounding code, returns a checked `{ explanation, suggestedFix }`
- [ ] Guardrail: if the AI call fails or times out, the scan still finishes — `aiSuggestedFix` just comes back empty, it never blocks the real result

## Day 9 — Close the loop

- [ ] Post the scan results as a comment on the pull request
- [ ] Save the `ScanRun` and its `Finding`s to the database
- [ ] Compute the finding count and one simple health number for the repo

## Day 10 — Dashboard v1

- [ ] Build the five read endpoints from `API_CONTRACTS.md` (workspaces, one workspace, repos, scans, one scan)
- [ ] Dashboard pages: workspace switcher, repo list, scan history table, one scan's finding detail view

## Day 11 — Testing

- [ ] Unit tests for the detection engine's output parser and the AI response checker
- [ ] One integration test: simulate a real webhook end-to-end against a test database
- [ ] One end-to-end test: log in, see the dashboard

## Day 12 — Observability & caching

- [ ] Error tracking wired into both `apps/web` and `apps/worker`
- [ ] Cache GitHub API responses in Redis for a short time, so we don't ask the same question twice in a row
- [ ] A simple `/api/health` endpoint

## Day 13 — CI/CD & deploy

- [ ] CI runs lint, type-check, tests, and build on every pull request
- [ ] Deploy: `apps/web` to Vercel, `apps/worker` to Trigger.dev, database to Neon, Redis to Upstash
- [ ] All secrets live in each platform's own settings — never committed to git

## Day 14 — Polish

- [ ] README with setup steps and a screenshot or two
- [ ] Write down any decision that changed along the way, in a short note
- [ ] A short, written Phase 2 plan (VS Code extension, GitLab, deeper analytics)

## What "Phase 1 is done" means

See `PROJECT_SPEC.md`, section 8 — don't repeat it here, just check against it before calling this finished.

## Related documents

- `PROJECT_SPEC.md` — what we're building and why.
- `ARCHITECTURE.md` — how the pieces are built and how they talk to each other.
- `API_CONTRACTS.md` — exact request/response shapes.
