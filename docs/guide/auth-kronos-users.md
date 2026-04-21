# Kronos Users - JWT Authentication

## Who Is This?

An internal employee who already has a Kronos account. They log in via the Kronos web app and receive a JWT. That same JWT is passed to the MCP server — no new auth system needed.

---

## Flow

```
┌──────────┐         ┌───────────────┐         ┌─────────────────┐
│  User    │         │  Kronos App   │         │  Kronos MCP     │
│ (Browser │         │  (Play)       │         │  Server         │
│ /Claude) │         │               │         │  (Spring Boot)  │
└────┬─────┘         └───────┬───────┘         └────────┬────────┘
     │                       │                          │
     │  POST /login           │                          │
     │  {username, password}  │                          │
     │──────────────────────►│                          │
     │                       │                          │
     │  JWT (signed)          │                          │
     │◄──────────────────────│                          │
     │                       │                          │
     │  MCP tool call                                   │
     │  Authorization: Bearer <JWT>                     │
     │─────────────────────────────────────────────────►│
     │                       │                          │
     │                       │  Validate JWT signature  │
     │                       │  (same JWKS endpoint)    │
     │                       │◄─────────────────────────│
     │                       │                          │
     │                       │  Extract: sub, roles     │
     │                       │─────────────────────────►│
     │                       │                          │
     │  Tool result          │                          │
     │◄─────────────────────────────────────────────────│
```

---

## Implementation

The MCP server validates JWTs using the same JWKS endpoint the Kronos Play app uses. No new secret or key is introduced.

```java
// application.properties
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=\
  https://your-auth-server/.well-known/jwks.json
```

```java
@Component
public class McpJwtFilter implements HandlerInterceptor {

    private final JwtDecoder jwtDecoder; // auto-configured from JWKS URI

    @Override
    public boolean preHandle(HttpServletRequest req, ...) {
        String auth = req.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing JWT");
        }
        Jwt jwt = jwtDecoder.decode(auth.substring(7));
        SecurityContext.set(new JwtClaims(jwt));
        return true;
    }
}
```

The `JwtClaims` object wraps the token's `sub` (employee ID) and `roles` claim, which tool-level auth checks use.

---

## What Roles Exist?

Kronos has three roles relevant to MCP:

| Role | Who | What they can do in MCP |
|---|---|---|
| `EMPLOYEE` | Every employee | Read own data, submit own timesheets |
| `MANAGER` | Team leads and above | Read team members' data |
| `HR_ADMIN` | HR department | Read/write any employee's data |

---

## Security Notes

- JWTs are **short-lived** (session lifetime). Expired tokens are rejected.
- The MCP server **never** issues tokens. It only validates them.
- If a Kronos account is deactivated, the JWT stops being issued — the user loses MCP access automatically.
- The `sub` claim in the JWT is the source of truth for "who is calling". A tool cannot be tricked into operating on behalf of another user by passing a different `employeeId` — write tools always use `caller.sub()`.
