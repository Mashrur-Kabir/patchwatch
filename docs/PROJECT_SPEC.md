# PatchWatch — Project Specification

**What this document is:** the single source of truth for what we are building in Phase 1. If anything in the code disagrees with this document, this document wins — until we change it on purpose, together.

---

## 1. One-line summary

PatchWatch automatically checks GitHub pull requests for security problems and shows the results on a team dashboard.

## 2. The problem

Developers introduce security mistakes without meaning to, and most teams don't have someone reviewing every pull request for security specifically. PatchWatch catches common problems automatically, right when the code is proposed, and gives the team a place to see how they're doing over time.

## 3. Who uses it

- **Developer** — opens a pull request, gets automatic security feedback as comments on that PR.
- **Team lead / manager** — logs into the dashboard, sees findings across all connected repos, and tracks trends over time.

## 4. Phase 1 scope — what we ARE building

- A GitHub App a team can install on their organization or specific repos.
- A webhook that triggers a scan whenever a pull request is opened or updated.
- A scan that runs Semgrep (an existing, free security-scanning tool) on only the changed files.
- An AI-written suggested fix for each finding.
- Results posted back as comments on the pull request.
- Login to a web dashboard using "Sign in with GitHub."
- A dashboard showing: workspaces, connected repos, past scans, findings per pull request, and one simple health number or chart.

## 5. Explicitly OUT of scope for Phase 1 (and why)

| Not building yet                                      | Why                                                                                                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VS Code extension                                     | The pull-request bot already delivers the core value. Adding the extension now would split our attention. Planned for Phase 2.                                      |
| GitLab support                                        | GitLab's webhooks and API are shaped differently from GitHub's. Better to get one provider solid first. Phase 2.                                                    |
| A fine-tuned/custom AI model                          | This needs paid GPU hosting to run. A well-written prompt to a hosted AI model covers Phase 1 needs for free. Only revisit in Phase 3, if there's a real reason to. |
| Deep analytics (trends over months, team comparisons) | This needs weeks of real scan data to mean anything. Phase 2.                                                                                                       |
| Billing or payments                                   | Not needed to prove the idea works.                                                                                                                                 |

## 6. Words we'll use consistently (glossary)

Using the same word for the same thing everywhere — in this document, in the code, and when talking to Antigravity — is what keeps everyone (including the AI agents) from getting confused later.

- **Workspace** — one team using PatchWatch. Owns repos and members.
- **Installation** — the GitHub App's connection to one GitHub organization or account. One workspace has one installation, for now.
- **Repository** — one repo the team has turned scanning on for.
- **Scan run** — one full execution of the pipeline against one pull request.
- **Finding** — one specific problem discovered during a scan run.
- **Member** — a person inside a workspace. Has a role: owner, admin, or member.

## 7. Core user stories for Phase 1

1. As a team lead, I want to sign in with GitHub, so I can reach my team's workspace.
2. As a team lead, I want to install the PatchWatch GitHub App on our organization, so PatchWatch is allowed to scan our repos.
3. As a developer, I want to open a pull request and see security findings appear as comments within a couple of minutes, so I can fix issues before merging.
4. As a developer, I want each finding to come with a suggested fix, so I don't have to research the problem from nothing.
5. As a team lead, I want to see the history of past scans for a repo, so I can tell whether things are improving.
6. As an admin, I want to invite teammates to the workspace with a specific role, so access stays controlled.

## 8. What "done" looks like for Phase 1

- A real GitHub organization can install PatchWatch on itself.
- Opening a pull request against a connected repo triggers a scan within about two minutes, and posts a comment — either the findings, or a clear "no issues found" message.
- The dashboard shows real data from the database, not fake placeholder data.
- Login, roles, rate limiting, and basic automated tests are all working — not just "it worked once on my machine."

## 9. Related documents (written next, in this order)

1. `ARCHITECTURE.md` — how the pieces are built and how they talk to each other.
2. `API_CONTRACTS.md` — the exact shape of every request and response.
3. `prisma/schema` — the actual database design.
4. `ROADMAP.md` — the day-by-day build order.
5. `adr/` — a short note every time we make a decision that changes something in this document.

## 10. Open questions / known risks

- Semgrep might be slow on very large repos. We're already planning to scan only changed files, not the whole repo, to avoid this.
- AI-suggested fixes can occasionally be wrong. Every AI suggestion must be clearly labeled "AI-suggested — please verify" so nobody applies it blindly.
- GitHub limits how many API requests we can make per hour. We'll handle this with polite retries, not by panicking — it won't block Phase 1.
