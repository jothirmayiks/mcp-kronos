# Open Decisions

This page documents decisions that are **not yet made** and need team input before or alongside implementation. These are not blockers for the MVP but should be resolved before going to production.

---

## 1. What Are Our Potential Clients?

We have not formally defined who the intended consumers of Kronos MCP are. This affects our auth strategy, scope design, rate limits, and marketing/positioning.

### Candidate client types

#### A. Internal AI tooling (Claude Desktop / internal chat)
Internal engineers and employees use Claude or another AI assistant that connects to Kronos MCP to answer HR and project questions.

- **Auth:** Kronos JWT ✅ (already handled)
- **Effort:** Very low
- **Risk:** Low — controlled user base, existing auth
- **Value:** High — immediate productivity gains for employees

#### B. Partner / B2B integrations
External companies that want to sync or query Kronos data programmatically — e.g. a payroll provider, a recruitment platform, a project management tool.

- **Auth:** API Key ✅ (medium effort to build)
- **Effort:** Medium
- **Risk:** Medium — scoped keys limit blast radius, but we're exposing data to third parties
- **Value:** High if we have active partners who need this

#### C. Individual external users (contractors, freelancers)
People who are not Kronos employees but need limited access to specific data about themselves.

- **Auth:** OAuth 2.0 (new infrastructure required)
- **Effort:** High
- **Risk:** Medium — limited to own-data scopes
- **Value:** Medium — depends on how many external contributors we have

#### D. Third-party AI agent platforms
Platforms like Zapier, n8n, or AI agent builders that want to plug into Kronos as a data source for automated workflows.

- **Auth:** API Key (same as B)
- **Effort:** Low incremental — same auth path as B
- **Risk:** Medium — depends on what scopes we grant
- **Value:** High if we want to enable ecosystem integrations

---

### ❓ Decision needed

> **Which client types do we want to support, and in what order?**

Recommended sequencing (subject to team decision):

1. **Internal AI tooling** — lowest effort, immediate value, no external exposure
2. **Partner / B2B integrations** — medium effort, high value, controlled via key issuance
3. **Third-party AI agent platforms** — low incremental effort after #2
4. **Individual external users** — highest effort, needs OAuth infrastructure decision

---

## 2. Read-Only vs Read/Write Access

We have not decided whether external clients should have write access in the initial release.

### Arguments for read-only first

- Lower risk surface — if something goes wrong with an AI-generated tool call, it cannot corrupt data
- Faster to production — no need to validate write flows, idempotency, conflict resolution
- Easier to audit — read queries are safe to log in full; write payloads may contain sensitive data

### Arguments for read/write from day one

- Higher immediate value — "log my timesheet" is the most requested AI assistant feature
- Already feature-flagged — write tools are already gated by `mcp.write-tools.enabled`
- If we only ship reads, partners may not find the integration compelling enough to adopt

### Current stance

Write tools are implemented and feature-flagged **off by default**. The decision to enable them is per-environment. We recommend:

- **Dev:** writes enabled for testing
- **Staging:** writes enabled for QA
- **Production:** start read-only, enable writes after one full sprint of staging validation

---

## 3. Which OAuth Provider for Individual Users?

If and when we support external individual users, we need an OAuth 2.0 authorization server. Three options:

| Option | Pros | Cons |
|---|---|---|
| **Auth0** (managed) | Fast setup, great docs, free tier | Vendor dependency, cost at scale |
| **Keycloak** (self-hosted) | Full control, no vendor lock-in | Ops overhead, our team needs to run it |
| **Spring Authorization Server** | Native to our stack, no new infra vendor | Most manual wiring, longer build time |

### ❓ Decision needed

> **Which OAuth provider do we adopt?** This is only needed for Phase 3+ (individual user auth). It does not block Phase 1 or Phase 2.

Recommendation: Decide this in Sprint 3 before Phase 3 begins. Evaluate Auth0 free tier for proof-of-concept first.

---

## 4. MCP Client Strategy

We have not decided which AI clients to officially support and document.

| Client | Notes |
|---|---|
| **Claude Desktop** | Easiest to demo and test during development. stdio transport. |
| **Custom internal chat UI** | Would require us to build a web UI. Higher effort. |
| **Third-party agent platforms** | HTTP/SSE transport. Standard API key auth. |

### ❓ Decision needed

> **Do we build or buy the chat UI?** If we want internal employees to use Kronos MCP through a web interface, we need to either build one or evaluate existing options (Claude.ai, a Teams bot, etc.).

---

## 5. Deployment Target

The deployment environment for the MCP server has not been decided.

Considerations:
- Should it live in the same infrastructure as the Kronos Play backend?
- Does it need to be in the same network segment for internal HTTP calls?
- Who owns operations? Platform team or DevOps team?

### ❓ Decision needed

> **Where does the MCP server deploy, and who runs it?**

This should be resolved before the Phase 1 deployment milestone.

---

## Tracking These Decisions

| Decision | Status | Owner | Target date |
|---|---|---|---|
| Client types to support | ⏳ Pending | Product + Engineering | Before Phase 2 |
| Read-only vs read/write | ⏳ Pending | Engineering | Before prod deploy |
| OAuth provider | ⏳ Pending | Engineering | Before Phase 3 |
| MCP client strategy | ⏳ Pending | Product | Before Phase 2 |
| Deployment target | ⏳ Pending | DevOps + Engineering | Before Phase 1 deploy |
