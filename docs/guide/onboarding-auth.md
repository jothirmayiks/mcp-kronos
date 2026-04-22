# Auth Configuration

## How Auth Delegation Works

The MCP Platform does not issue tokens or manage passwords. It delegates authentication entirely to each company's existing auth system.

When a user makes an MCP tool call, they include their existing JWT. The platform:

1. Reads the `iss` (issuer) claim from the token
2. Looks up the tenant whose tokenIssuer matches
3. Validates the token using the tenant's configured auth method
4. Extracts the user's ID (sub) and roles
5. Proceeds with the tool call scoped to that tenant

---

## Supported Auth Methods

### Method 1 - JWKS (Recommended)

The company's auth server signs JWTs using RS256 or ES256 and exposes public keys at a JWKS URL:

```
https://auth.somecompany.com/.well-known/jwks.json
```

The platform fetches these public keys and uses them to verify the token. No secret is shared.

Configure at onboarding:

```json
{
  "authMethod": "JWKS",
  "jwksUri": "https://auth.somecompany.com/.well-known/jwks.json",
  "tokenIssuer": "https://auth.somecompany.com"
}
```

This is the preferred method because:
- No secret needs to be shared
- Key rotation is handled automatically
- Industry standard for OAuth 2.0 / OpenID Connect

---

### Method 2 - Shared Secret / HS256 (Fallback)

Some older auth systems sign JWTs using HS256 - a shared secret used to both sign and verify. There is no JWKS endpoint.

The company shares their signing secret with the platform team securely (via a secrets manager, never via email or chat). The secret is stored encrypted per tenant.

Configure at onboarding:

```json
{
  "authMethod": "HS256_SECRET",
  "tokenIssuer": "https://auth.somecompany.com"
}
```

The secret itself is stored separately via the secrets admin endpoint - never in the tenant config JSON.

::: warning
HS256 is less secure than RS256/ES256. The shared secret must be treated with the same care as a password. We recommend encouraging companies to migrate to RS256 if possible.
:::

---

### Method 3 - No JWT (Needs Discussion)

Some companies use session-based auth or other non-JWT mechanisms. These are not directly compatible with the platform.

Options in this case:

| Approach | Description | Effort |
|---|---|---|
| Add a JWT layer | The company adds a token endpoint to their auth system that issues JWTs | Low if they already use OAuth 2.0 |
| Token exchange | We build a wrapper that accepts their auth and exchanges it for a platform JWT | Medium to High |

Companies in this situation need to discuss with the platform team before onboarding can begin.

---

## JWKS Caching

For Method 1, the platform caches each tenant's JWKS to avoid fetching on every request:

- Cache refreshes every 60 minutes
- Cache is immediately invalidated if a token fails validation (handles key rotation)

---

## What Happens If a Token Is Invalid

| Failure | Response |
|---|---|
| No token provided | 401 - Missing token |
| Issuer not registered | 401 - Unknown tenant |
| Token signature invalid | 401 - Invalid token |
| Token expired | 401 - Token expired |
| Tenant is SUSPENDED | 403 - Tenant suspended |

All failures are logged with the tenant slug and failure reason.

---

## Security Notes

- The platform never stores JWTs - they are validated in memory and discarded
- JWKS fetches use HTTPS only - HTTP JWKS URIs are rejected at registration
- The `sub` claim is the source of truth for user identity
- Token expiry is always enforced with no bypass
- If a company deactivates a user, their tokens stop being issued - they automatically lose MCP access
