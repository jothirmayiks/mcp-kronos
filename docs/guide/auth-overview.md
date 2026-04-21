# Authentication Overview

## The Three Client Types

Kronos MCP serves three fundamentally different kinds of callers. Each has a different trust model, different onboarding path, and different technical solution for authentication.

```
┌─────────────────────────────────────────────────────────────────┐
│                     WHO IS CALLING?                             │
├─────────────────────┬───────────────────────┬───────────────────┤
│  Kronos User        │  External Application │  External         │
│  (Internal)         │  (B2B / Integration)  │  Individual User  │
├─────────────────────┼───────────────────────┼───────────────────┤
│  Logs into Kronos   │  A system, not a      │  A person who has │
│  already. Has an    │  person. Needs        │  no Kronos login. │
│  existing account.  │  programmatic access. │  External access. │
├─────────────────────┼───────────────────────┼───────────────────┤
│  Auth: JWT          │  Auth: API Key        │  Auth: OAuth 2.0  │
│  (reuse existing)   │  (issued by us)       │  (new — TBD)      │
└─────────────────────┴───────────────────────┴───────────────────┘
```

---

## Summary Table

| | Kronos User | External App | External Individual |
|---|---|---|---|
| **Who** | Internal employee | Partner system / integration | Third-party developer or user |
| **Auth method** | JWT from Kronos login | API Key we issue | OAuth 2.0 token |
| **Onboarding** | Already has account | Contact us, we issue a key | Register via OAuth flow |
| **Token lifetime** | Session-based | Long-lived (revocable) | Short-lived + refresh |
| **Scopes** | Role from Kronos (EMPLOYEE, MANAGER, HR_ADMIN) | Fixed scope at key creation | Consent-based scope |
| **Revocation** | Via Kronos session invalidation | Delete/rotate the key | Revoke OAuth token |
| **Implementation effort** | ✅ Already built | Medium | High (needs new OAuth server) |

---

## How the MCP Server Handles All Three

The MCP server runs a **single auth filter** that detects what kind of credential is present and routes it appropriately:

```java
@Component
public class McpAuthFilter implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest req, ...) {
        String auth = req.getHeader("Authorization");

        if (auth == null) throw new UnauthorizedException("Missing credentials");

        if (auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            if (isApiKey(token)) {
                // API Key path — look up key in DB, load scopes
                handleApiKey(token);
            } else {
                // JWT path — validate signature, load claims
                handleJwt(token);
            }
        } else {
            throw new UnauthorizedException("Unsupported auth scheme");
        }
        return true;
    }
}
```

OAuth tokens (once implemented) are also bearer tokens — the filter will distinguish them by issuer claim in the JWT.

---

## Detailed Pages

Each client type is covered in detail on its own page:

- [Kronos Users (JWT)](/guide/auth-kronos-users) — the simplest path, already mostly built
- [External Applications (API Key)](/guide/auth-external-apps) — medium effort, clear path
- [External Individual Users (OAuth)](/guide/auth-individual-users) — most complex, requires new infrastructure
