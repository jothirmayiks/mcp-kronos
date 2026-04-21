# External Applications - API Key Authentication

## Who Is This?

A **system**, not a person. Examples:

- A partner company's HR platform that wants to sync employee data
- An internal analytics pipeline that queries skills data nightly
- A third-party AI agent platform that needs to call Kronos tools on behalf of their users

These callers do not have a Kronos login. They cannot go through the normal JWT flow because there is no human present to authenticate interactively.

---

## Why API Keys (and Not JWTs)?

| Option | Problem |
|---|---|
| Share a service-account JWT | JWTs expire. The external app has to re-authenticate constantly. Not suitable for machine-to-machine. |
| Issue a long-lived JWT | Defeats the purpose of short-lived tokens. Hard to revoke. |
| **API Key** | Long-lived, scoped to specific permissions, easily revocable. Standard for M2M. ✅ |

---

## Flow

```
┌─────────────────────┐              ┌─────────────────────────┐
│  External App       │              │  Kronos MCP Server      │
│  (Partner System /  │              │  (Spring Boot)          │
│   Integration)      │              │                         │
└──────────┬──────────┘              └──────────┬──────────────┘
           │                                    │
           │  MCP tool call                     │
           │  Authorization: Bearer krn_live_xxxx│
           │───────────────────────────────────►│
           │                                    │
           │                         Detect: not a JWT
           │                         Look up key in DB
           │                         Load: scopes, rate limits,
           │                         owner org, expiry         │
           │                                    │
           │                         Key valid? ─► proceed
           │                         Key invalid? ─► 401
           │                                    │
           │  Tool result                       │
           │◄───────────────────────────────────│
```

---

## API Key Design

### Key Format

```
krn_live_<32-char-random-hex>
```

- `krn_` — product namespace (easy to identify in logs)
- `live_` / `test_` — environment prefix (prevents using a test key in prod)
- 32-char hex — 128 bits of entropy, practically unguessable

### Key Storage

Keys are **never stored in plain text**. The process:

1. On creation: generate key, store `SHA-256(key)` in the database, return the plain-text key **once** to the requester.
2. On validation: hash the incoming key, look up the hash.

```java
// Key issuance (admin endpoint)
public ApiKeyResponse issueKey(String orgName, Set<String> scopes) {
    String rawKey = "krn_live_" + randomHex(32);
    String hashedKey = sha256(rawKey);
    apiKeyRepository.save(new ApiKey(orgName, hashedKey, scopes, Instant.now()));
    return new ApiKeyResponse(rawKey); // shown once, never again
}

// Key validation (auth filter)
public ApiKeyClaims validate(String rawKey) {
    String hash = sha256(rawKey);
    ApiKey key = apiKeyRepository.findByHash(hash)
        .orElseThrow(() -> new UnauthorizedException("Invalid API key"));
    if (key.isRevoked() || key.isExpired()) {
        throw new UnauthorizedException("Key is revoked or expired");
    }
    return new ApiKeyClaims(key.getOrgName(), key.getScopes());
}
```

---

## Scopes

When issuing a key, scopes define what the external app can do. Scopes map directly to MCP tool groups:

| Scope | Tools unlocked |
|---|---|
| `directory:read` | `search_employees`, `get_employee` |
| `timereport:read` | `get_time_report` |
| `timereport:write` | `submit_timesheet_entry` |
| `skills:read` | `get_employee_skills`, `search_by_skill` |
| `admin:all` | All tools (restricted — only internal use) |

A partner company would typically get `directory:read` and `skills:read`. Write scopes are granted only after deliberate review.

---

## Problems and Mitigations

### Problem: API keys are long-lived and can be leaked

**Mitigation:**
- Keys are hashed at rest — a DB breach does not expose working keys
- Short expiry option (e.g. 90-day auto-expiry) with rotation reminders
- Rate limiting per key — a leaked key cannot be abused at scale without triggering alerts
- Audit log shows every call per key — anomalies are visible

### Problem: No way to scope a key to a specific employee's data

**Mitigation:**
- External apps can only read data they are scoped to
- They cannot read individual employee records below the org level unless granted `directory:read`
- Sensitive fields (salary, personal contact info) are never exposed via MCP tools, regardless of scope

### Problem: We have no self-service key management yet

**Mitigation:**
- Phase 1: keys are issued manually by the platform team via an internal admin endpoint
- Phase 2 (future): build a developer portal with self-service key creation, rotation, and scope request workflow

---

## Onboarding a New External App

1. External party contacts the platform team
2. Platform team reviews requested scopes
3. Platform team calls the internal admin endpoint to issue a key
4. Key is shared securely (one-time, e.g. via a secrets manager link)
5. External app includes the key as `Authorization: Bearer <key>` on all MCP requests
