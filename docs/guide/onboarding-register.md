# Registering a Company

## Create the Tenant Record

The first step is creating a tenant record in the platform database via the internal admin endpoint.

```http
POST /admin/tenants
Content-Type: application/json
Authorization: Bearer <platform-admin-token>

{
  "name": "Acme Corp",
  "slug": "acme",
  "apiBaseUrl": "https://api.acme.com/v1",
  "authMethod": "JWKS",
  "jwksUri": "https://auth.acme.com/.well-known/jwks.json",
  "tokenIssuer": "https://auth.acme.com",
  "status": "ONBOARDING",
  "roleClaimName": "roles",
  "roleMapping": {
    "EMPLOYEE": "EMPLOYEE",
    "MANAGER": "MANAGER",
    "ADMIN": "HR_ADMIN"
  }
}
```

**Response:**
```json
{
  "tenantId": "tenant-7f3a",
  "name": "Acme Corp",
  "slug": "acme",
  "status": "ONBOARDING",
  "createdAt": "2025-04-21T10:00:00Z"
}
```

Save the `tenantId` - you will need it for subsequent steps.

---

## The Slug

The slug is a short, lowercase identifier used in logs, routing, and the audit trail.

- Lowercase letters, numbers, and hyphens only
- No spaces
- Must be unique across all tenants
- Cannot be changed after go-live

Good: `kronos`, `acme-corp`, `company-b`
Bad: `Kronos`, `acme corp`, `company_b`

---

## Role Mapping

Different companies use different role names in their JWTs. The `roleMapping` field translates their role names into the platform's standard roles:

| Platform role | What it means |
|---|---|
| EMPLOYEE | Regular user - can only access their own data |
| MANAGER | Team lead - can access their team's data |
| HR_ADMIN | Admin - can access all data for write operations |

Example for a company using different role names:

```json
"roleMapping": {
  "staff": "EMPLOYEE",
  "lead": "MANAGER",
  "hr": "HR_ADMIN"
}
```

If a company has no roles in their JWT, all users default to EMPLOYEE.

---

## Tenant Status Lifecycle

```
ONBOARDING -> TESTING -> ACTIVE -> SUSPENDED -> DEACTIVATED
```

| Status | Meaning |
|---|---|
| ONBOARDING | Setup in progress, no live traffic |
| TESTING | Configured, being tested with real data |
| ACTIVE | Live, all activated tools available |
| SUSPENDED | Temporarily blocked |
| DEACTIVATED | Permanently removed |

Only tenants with status ACTIVE can serve tool calls.
