# External Individual Users — OAuth 2.0

## Who Is This?

An individual person who does **not** have a Kronos account but wants to access Kronos MCP — for example:

- A contractor or freelancer who needs to read their own time report data
- A developer building a personal tool that connects to Kronos
- A partner employee who needs to look up specific project data

This is the most complex client type because:
1. We have **no existing auth infrastructure** for external individuals
2. We cannot issue API keys to individuals (too many, too hard to manage, too easy to leak)
3. We need user-level consent — the person should explicitly approve what data the client app can see

---

## Why Not API Keys for Individuals?

| Problem | Detail |
|---|---|
| Scale | You might have thousands of individual users. Issuing and managing one key per person is operationally unsustainable. |
| Consent | API keys have no concept of "this user approved these specific permissions." |
| Revocation | If a contractor leaves, you need to find and revoke their key. OAuth handles this via token expiry and account deactivation. |
| Security | Individuals are more likely to mishandle long-lived secrets than organizations. |

---

## The Solution: OAuth 2.0 Authorization Code Flow

OAuth 2.0 is the industry standard for delegated access — the same flow behind "Login with Google" or "Connect your Slack." The user authenticates with us, approves a list of scopes (permissions), and receives a short-lived access token.

### Flow

```
┌──────────┐        ┌──────────────────┐        ┌────────────────────┐
│ External │        │  Kronos OAuth    │        │  Kronos MCP        │
│ User     │        │  Server (NEW)    │        │  Server            │
└────┬─────┘        └────────┬─────────┘        └──────────┬─────────┘
     │                       │                             │
     │  1. Click "Connect to Kronos"                       │
     │──────────────────────►│                             │
     │                       │                             │
     │  2. Login page        │                             │
     │◄──────────────────────│                             │
     │                       │                             │
     │  3. Enter credentials + approve scopes              │
     │──────────────────────►│                             │
     │                       │                             │
     │  4. Authorization code │                             │
     │◄──────────────────────│                             │
     │                       │                             │
     │  5. Exchange code for access token + refresh token  │
     │──────────────────────►│                             │
     │                       │                             │
     │  6. Access token (short-lived, e.g. 1hr)            │
     │◄──────────────────────│                             │
     │                       │                             │
     │  7. MCP call with access token                      │
     │────────────────────────────────────────────────────►│
     │                       │                             │
     │                       │  8. Validate token (JWKS)   │
     │                       │◄────────────────────────────│
     │                       │                             │
     │  9. Tool result       │                             │
     │◄────────────────────────────────────────────────────│
```

---

## What We Need to Build

This is the **highest-effort** auth path. It requires new infrastructure that does not currently exist in Kronos:

| Component | Description | Effort |
|---|---|---|
| **OAuth 2.0 Authorization Server** | Issues tokens, handles login + consent screen | High |
| **User registration** | External users need to create an account | Medium |
| **Consent UI** | A screen where users approve scopes | Medium |
| **Token storage** | Access + refresh tokens, revocation list | Medium |
| **JWKS endpoint** | So the MCP server can validate issued tokens | Low (comes with the auth server) |

### Recommended approach

We recommend using an existing OAuth 2.0 server library rather than building from scratch:

| Option | Notes |
|---|---|
| **Keycloak** (open source) | Full-featured, self-hosted. Good if we want full control and are comfortable with ops overhead. |
| **Auth0** (managed) | Fast to set up, excellent docs, free tier for low volume. Reduces ops burden significantly. |
| **Spring Authorization Server** | Native Java/Spring, fits our stack, but requires more manual wiring. |

::: tip Recommendation for MVP
Start with **Auth0 free tier** or **Keycloak** for the OAuth server. This gives us a production-grade auth server without building one. If we later need more control or cost becomes a factor, we can migrate to Spring Authorization Server.
:::

---

## Scopes for Individual Users

Individual users grant scopes via the consent screen. Scopes are the same as API key scopes, but the user sees friendly labels:

| Scope | User-facing label |
|---|---|
| `directory:read` | "View employee directory" |
| `timereport:read` | "Read your time reports" |
| `timereport:write` | "Submit timesheets on your behalf" |
| `skills:read` | "View employee skills" |

::: warning
Write scopes (`timereport:write`) for individual external users should require explicit opt-in and may require additional review. An external user submitting timesheets on behalf of a Kronos employee is a sensitive action.
:::

---

## Problems and Mitigations

### Problem: External users need a Kronos account to log in

**Options:**
- **Federated identity** — Allow users to log in with Google / Microsoft / GitHub. The OAuth server federates to an external IdP. No password management needed on our side.
- **Email + password** — We manage credentials. More work, more liability.
- **Invite-only** — An internal admin must pre-create an external user account before they can OAuth in.

**Recommendation:** Start with invite-only to control scope during MVP. Add social login later.

### Problem: Short-lived access tokens expire — user has to re-auth

**Mitigation:** OAuth 2.0 includes **refresh tokens**. The client app uses the refresh token to silently get a new access token without user interaction. Refresh tokens are long-lived but stored server-side and can be revoked.

### Problem: This is a lot of new infrastructure

**Mitigation:** This is explicitly a **Phase 2+** concern. The MVP focuses on Kronos users (JWT) and external apps (API key). Individual user OAuth is scoped to a later phase.

---

## Current Status

> ⚠️ **Not yet implemented.** Individual user OAuth 2.0 is a future phase. See [Open Decisions](/guide/open-decisions) for discussion on prioritization and provider selection.
