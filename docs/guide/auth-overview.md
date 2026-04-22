# Auth Overview

## One Rule

Every user authenticates with their own company's existing auth system. The MCP Platform never issues tokens, never manages passwords, and never creates user accounts.

This means:
- A Kronos employee uses their Kronos JWT
- A Company B employee uses their Company B JWT
- No external users, no separate login, no new credentials to manage

---

## How the Platform Identifies the Tenant

Before validating a token, the platform needs to know which tenant the request belongs to. This is done using the **URL path**, not the token contents.

Every tenant gets a unique URL path on the platform:

```
POST /t/{tenantSlug}/mcp/sse
Authorization: Bearer <jwt>
```

Examples:
```
POST /t/kronos/mcp/sse
POST /t/acme/mcp/sse
POST /t/company-b/mcp/sse
```

The tenant slug in the URL is the primary source of tenant identity. The platform loads the correct tenant config before even opening the JWT.

---

## Why URL-Based Identification?

The alternative is reading the `iss` (issuer) claim from the JWT to identify the tenant. This has problems:

| Problem | Detail |
|---|---|
| iss may not exist | Some legacy or custom auth systems do not include an iss claim in their JWTs |
| iss may be inconsistent | Some systems include iss in some tokens but not others |
| Guessing is risky | If the platform cannot identify the tenant, it cannot validate the token at all |

Using the URL path avoids all of these problems. The tenant is always explicitly known from the request.

---

## What Happens With the iss Claim

Once the tenant is identified from the URL, the platform validates the JWT using that tenant's configured auth method.

If the JWT includes an `iss` claim, the platform does an additional check:

```
Does the iss claim match the tenant's configured tokenIssuer?
  YES -> proceed
  NO  -> reject with 401 (token does not belong to this tenant)
  MISSING -> skip the iss check, proceed with signature validation only
```

This means:
- Tokens with a matching `iss` - fully validated
- Tokens with a mismatched `iss` - rejected (prevents using one tenant's token on another tenant's endpoint)
- Tokens with no `iss` at all - still work, validated by signature only

---

## Full Auth Flow

```
1. Request arrives at /t/kronos/mcp/sse
   -> Tenant identified from URL: kronos
   -> Kronos tenant config loaded

2. JWT extracted from Authorization header

3. iss claim check (if present):
   -> iss matches kronos tokenIssuer? proceed
   -> iss does not match? reject 401

4. Signature validation:
   -> JWKS method: fetch Kronos public keys, verify signature
   -> HS256 method: use stored secret, verify signature

5. Claims extracted:
   -> sub: user identity
   -> roles: mapped to platform roles

6. Request proceeds scoped to Kronos tenant
```

---

## No Cross-Tenant Access

Even if a user somehow passes a valid Kronos JWT to the Acme endpoint (`/t/acme/mcp/sse`), the request will be rejected because:

- The platform loads Acme's JWKS to validate the token
- A Kronos token will fail signature validation against Acme's JWKS
- If iss is present, it will also fail the issuer check

---

## Supported Auth Methods

| Method | When to use |
|---|---|
| JWKS (RS256 / ES256) | Company uses standard OAuth 2.0 or OpenID Connect - recommended |
| Shared secret (HS256) | Company uses HS256 signing - supported as fallback |
| No JWT | Needs discussion before onboarding can begin |

See [JWT and SSO Delegation](/guide/auth-jwt) for full implementation details.
