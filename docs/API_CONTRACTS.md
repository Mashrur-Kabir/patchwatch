# PatchWatch — API Contracts

**What this document is:** the exact shape of every request and response for Phase 1. If the code and this document disagree, fix the code (or fix this document on purpose, together) — don't guess.

---

## 1. How every response is shaped

Every one of our own endpoints (not GitHub's webhook, that one's different — see section 4.2) replies in the same shape.

**Success:**

```json
{
  "success": true,
  "message": "Repos retrieved successfully",
  "data": {}
}
```

**Error:**

```json
{
  "success": false,
  "message": "Workspace not found",
  "errors": [{ "path": "workspaceId", "message": "No workspace with this ID" }]
}
```

`errors` is optional — only present when there's something specific to point at, like a bad field.

**Status codes we use:**

| Code | Means                                        |
| ---- | -------------------------------------------- |
| 200  | Worked, here's your data                     |
| 201  | Something new was created                    |
| 400  | You sent something invalid                   |
| 401  | You're not logged in                         |
| 403  | You're logged in, but not allowed to do this |
| 404  | Doesn't exist                                |
| 409  | Conflict (e.g. already exists)               |
| 429  | Too many requests, slow down                 |
| 500  | Something broke on our end                   |

## 2. Who can call what

Every endpoint below except the two GitHub ones (section 4) requires the person to be logged in (a valid NextAuth session), **and** to be a member of the workspace they're asking about. Some actions also require a specific role (owner, admin, or member — defined in `PROJECT_SPEC.md`). That's called out per endpoint below.

If either check fails, the answer is `401` (not logged in) or `403` (logged in, but not allowed).

## 3. Dashboard endpoints

### `GET /api/workspaces`

List the workspaces the logged-in person belongs to.

- **Who:** any logged-in person.
- **You send:** nothing extra.
- **You get back:** `data` is an array of [Workspace](#workspace) objects.

### `GET /api/workspaces/:workspaceId`

One workspace's full detail.

- **Who:** any member of that workspace.
- **You send:** nothing extra.
- **You get back:** `data` is one [Workspace](#workspace) object, including its members and repo count.

### `POST /api/workspaces/:workspaceId/members`

Invite someone to the workspace.

- **Who:** owner or admin only.
- **You send:**
  ```json
  { "email": "jane@acme.com", "role": "member" }
  ```
- **You get back:** `data` is the new [Member](#member) object. `201`.
- **Errors:** `409` if that email is already a member.

### `GET /api/workspaces/:workspaceId/repos`

List repos connected in this workspace.

- **Who:** any member.
- **You send:** nothing extra.
- **You get back:** `data` is an array of [Repository](#repository) objects.

### `GET /api/workspaces/:workspaceId/repos/:repoId/scans`

List past scans for one repo, newest first.

- **Who:** any member.
- **You send (optional query):** `?limit=20&before=<scanId>` for paging.
- **You get back:** `data` is an array of [ScanRun](#scanrun) objects (without their findings — that's the next endpoint).

### `GET /api/scans/:scanId`

One scan's full detail, including every finding.

- **Who:** any member of the workspace that owns this scan.
- **You send:** nothing extra.
- **You get back:** `data` is one [ScanRun](#scanrun) object, with a `findings` array of [Finding](#finding) objects included.

## 4. GitHub integration endpoints

These two are not called by our own dashboard — GitHub calls them.

### `GET /api/github/install/callback`

Where GitHub sends the person back to, right after they install (or update) the GitHub App on their organization.

- **You receive (query params):** `installation_id`, `setup_action`.
- **What it does:** looks up the repos in that installation via GitHub's API, saves an `Installation` and its `Repository` rows, links them to the person's workspace, then redirects the browser to the dashboard.
- **Not JSON** — this one replies with a redirect, not the envelope above.

### `POST /api/github/webhook`

Where GitHub sends events — the one we care about in Phase 1 is `pull_request` (`opened` and `synchronize`).

- **How we check it's really GitHub:** every request carries a signature (a scrambled code made from the request body and a secret only we and GitHub know). We recompute that signature ourselves and compare. If it doesn't match, we reply `401` immediately and do nothing else — never trust an unsigned request.
- **What it does on a valid `pull_request` event:** replies `200` right away (GitHub expects a fast reply), then separately hands the real work to the background worker.
- **Not the envelope above** — GitHub only cares about the status code, so we keep the body minimal, e.g. `{ "received": true }`.

## 5. The shapes of things

### Workspace

```json
{
  "id": "wrk_123",
  "name": "Acme Engineering",
  "createdAt": "2026-09-01T12:00:00Z",
  "members": [
    /* Member objects, only on the single-workspace endpoint */
  ],
  "repoCount": 3
}
```

### Member

```json
{
  "id": "usr_123",
  "name": "Jane Doe",
  "email": "jane@acme.com",
  "role": "admin"
}
```

`role` is one of: `owner`, `admin`, `member`.

### Repository

```json
{
  "id": "repo_123",
  "fullName": "acme/backend",
  "defaultBranch": "main",
  "isActive": true,
  "lastScanAt": "2026-09-10T09:00:00Z"
}
```

### ScanRun

```json
{
  "id": "scan_123",
  "repositoryId": "repo_123",
  "pullRequestNumber": 42,
  "pullRequestTitle": "Add payment webhook",
  "status": "completed",
  "findingCount": 3,
  "createdAt": "2026-09-10T09:00:00Z",
  "completedAt": "2026-09-10T09:02:14Z",
  "findings": [
    /* Finding objects, only on the single-scan endpoint */
  ]
}
```

`status` is one of: `pending`, `running`, `completed`, `failed`.

### Finding

```json
{
  "id": "find_123",
  "severity": "high",
  "filePath": "src/routes/user.ts",
  "lineStart": 45,
  "lineEnd": 47,
  "message": "Plain-English explanation of the problem",
  "aiSuggestedFix": "Suggested corrected code, or null if the AI step failed",
  "status": "open"
}
```

`severity` is one of: `low`, `medium`, `high`, `critical`. `status` is one of: `open`, `resolved`, `ignored`.

## 6. Related documents

- `PROJECT_SPEC.md` — what we're building and why.
- `ARCHITECTURE.md` — how the pieces are built and how they talk to each other.
- `ROADMAP.md` — day-by-day build order (written next).
