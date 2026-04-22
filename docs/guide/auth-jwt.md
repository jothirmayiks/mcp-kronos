# JWT and SSO Delegation

## Overview

The MCP Platform supports any company that issues standard JWTs. This covers the vast majority of enterprise auth systems including:

- Keycloak
- Auth0
- Okta
- Azure Active Directory
- AWS Cognito
- Custom Spring Security or OAuth2 servers
- Any OAuth 2.0 or OpenID Connect compliant provider

---

## Tenant Identification - URL First

The platform identifies the tenant from the **request URL**, not the token. Every tenant has a dedicated endpoint:

```
POST /t/{tenantSlug}/mcp/sse
```

This means the platform knows which tenant's auth config to use before it opens the JWT. This approach works correctly even if the JWT has no `iss` claim.

---

## Required JWT Claims

| Claim | Required | Description |
|---|---|---|
| sub | Yes | Subject - unique user identifier |
| exp | Yes | Expiry - enforced strictly |
| iss | No | Issuer - validated if present, skipped if missing |
| roles claim | Recommended | User roles - claim name is configurable per tenant |

The `iss` claim is optional because not all auth systems include it. If it is present, it must match the tenant's configured `tokenIssuer` - otherwise the request is rejected. If it is missing, the platform skips the issuer check and proceeds with signature validation only.

---

## Supported Signing Methods

### Option A - Asymmetric (RS256 / ES256) with JWKS (Recommended)

The company's auth server signs JWTs using a private key and exposes the matching public keys at a JWKS endpoint:

```
https://auth.somecompany.com/.well-known/jwks.json
```

The platform fetches these public keys and uses them to verify the token. The company never needs to share any secret.

Configure at tenant registration:

```json
{
  "authMethod": "JWKS",
  "jwksUri": "https://auth.somecompany.com/.well-known/jwks.json",
  "tokenIssuer": "https://auth.somecompany.com"
}
```

The `tokenIssuer` field is optional. If provided, the platform validates the `iss` claim against it. If not provided, the `iss` check is skipped entirely.

This is the preferred approach because:
- No secret needs to be shared
- Key rotation is handled automatically
- Industry standard for OAuth 2.0 and OpenID Connect

---

### Option B - Symmetric (HS256) with Shared Secret (Fallback)

Some older or simpler auth systems sign JWTs using a shared secret. There is no JWKS endpoint.

The company shares their signing secret with the platform team securely via a secrets manager. The secret is stored encrypted per tenant.

Configure at tenant registration:

```json
{
  "authMethod": "HS256_SECRET",
  "tokenIssuer": "https://auth.somecompany.com"
}
```

The `tokenIssuer` is again optional. If the company's tokens have no `iss` claim, simply omit it.

::: warning
HS256 is less secure than RS256/ES256. We recommend encouraging companies to migrate to RS256 where possible.
:::

---

### Option C - No JWT (Needs Discussion)

Some companies use session-based auth or other non-JWT mechanisms. These are not directly compatible with the platform.

Options in this case:

| Approach | Description | Effort |
|---|---|---|
| Add a JWT layer | Company adds a token endpoint to issue JWTs | Low if they already use OAuth 2.0 |
| Token exchange | We build a wrapper that accepts their auth and exchanges it for a JWT | Medium to High |

---

## iss Claim Handling Summary

| Situation | What the platform does |
|---|---|
| iss present and matches tenant tokenIssuer | Validated, proceed |
| iss present but does not match | Rejected with 401 |
| iss missing, tokenIssuer configured | Skip iss check, validate signature only |
| iss missing, no tokenIssuer configured | Skip iss check, validate signature only |

---

## Auth Method Summary

| Situation | Method | Effort |
|---|---|---|
| RS256 or ES256 with JWKS endpoint | Option A | Low - provide the JWKS URL |
| HS256 with shared secret | Option B | Low - share secret securely |
| No JWT at all | Option C | Medium to High - needs discussion |

---

## JWKS Caching

For Option A, the platform caches each tenant's JWKS:

- Refreshes every 60 minutes
- Immediately invalidated if a token fails validation (handles key rotation)

---

## Token Lifetime

The platform enforces the token `exp` claim strictly. There are no grace periods. If a token expires, the next tool call fails with 401 Token expired.

---

## Role Mapping

Each tenant defines how their role names map to the platform's standard roles:

```json
"roleMapping": {
  "staff":     "EMPLOYEE",
  "team_lead": "MANAGER",
  "hr_admin":  "HR_ADMIN"
}
```

| Platform Role | Read own data | Read team data | Read all | Write own | Write any |
|---|---|---|---|---|---|
| EMPLOYEE | Yes | No | No | Yes | No |
| MANAGER | Yes | Yes | No | Yes | No |
| HR_ADMIN | Yes | Yes | Yes | Yes | Yes |

If a user has no roles in their token, they default to EMPLOYEE.

---

## Auth Filter Implementation

```java
@Component
public class McpAuthFilter implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest req, ...) {

        // Step 1: identify tenant from URL path /t/{slug}/mcp/sse
        String slug = extractSlugFromPath(req.getRequestURI());
        Tenant tenant = tenantRegistry.findBySlug(slug)
            .orElseThrow(() -> new UnauthorizedException("Unknown tenant: " + slug));

        if (tenant.getStatus() != TenantStatus.ACTIVE) {
            throw new ForbiddenException("Tenant is not active");
        }

        // Step 2: extract JWT
        String auth = req.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing token");
        }
        String rawToken = auth.substring(7);

        // Step 3: validate iss if present
        String issuer = extractIssuerUnsafe(rawToken); // peek without full validation
        if (issuer != null && tenant.getTokenIssuer() != null) {
            if (!issuer.equals(tenant.getTokenIssuer())) {
                throw new UnauthorizedException("Token issuer does not match tenant");
            }
        }

        // Step 4: validate signature
        Jwt jwt = validateSignature(tenant, rawToken);

        // Step 5: map roles and store context
        List<String> platformRoles = tenant.mapRoles(
            jwt.getClaimAsStringList(tenant.getRoleClaimName()));
        TenantContext.set(tenant, new CallerClaims(jwt.getSubject(), platformRoles));

        return true;
    }
}
```
