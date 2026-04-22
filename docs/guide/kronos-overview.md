# Kronos - Reference Client

## What Is Kronos in This Context?

Kronos is our internal employee management platform. It manages employee profiles, timesheets, and skills data. It is also **Client #1** on the MCP Platform - the first company onboarded and the reference implementation for everything the platform does.

Every pattern in the MCP Platform was proven with Kronos first:
- The adapter pattern was designed around Kronos's Play API structure
- The role model (EMPLOYEE / MANAGER / HR_ADMIN) was derived from Kronos's auth
- The audit log, rate limiting, and write-flag safety were all validated against Kronos

When you want to understand how something works on the platform, look at how Kronos is configured.

---

## Kronos Tenant Profile

```json
{
  "tenantId": "tenant-kronos",
  "name": "Kronos",
  "slug": "kronos",
  "apiBaseUrl": "https://kronos-internal/api",
  "authMethod": "JWKS",
  "jwksUri": "https://kronos-auth/.well-known/jwks.json",
  "tokenIssuer": "https://kronos-auth",
  "status": "ACTIVE",
  "roleClaimName": "roles",
  "roleMapping": {
    "EMPLOYEE": "EMPLOYEE",
    "MANAGER": "MANAGER",
    "HR_ADMIN": "HR_ADMIN"
  }
}
```

---

## Kronos Activated Tools

| Tool | Enabled | Write Enabled |
|---|---|---|
| search_employees | Yes | - |
| get_employee | Yes | - |
| update_employee_status | Yes | No (requires sign-off) |
| get_time_report | Yes | - |
| submit_timesheet_entry | Yes | No (requires sign-off) |
| get_employee_skills | Yes | - |
| search_by_skill | Yes | - |

---

## Kronos Backend

The Kronos backend is built on the **Play Framework (Scala)**. It is completely unchanged by the MCP Platform. The platform calls it as an external HTTP client using the adapter config.

The MCP Platform's Spring Boot service and the Kronos Play backend are separate deployments that communicate over internal HTTP. This separation means:

- Kronos can be deployed and updated independently
- The MCP Platform can be updated without touching Kronos
- If the MCP Platform has an incident, Kronos continues functioning normally

---

## What a Kronos User Experience Looks Like

A Kronos employee opens an AI client with the MCP Platform configured. They can now ask:

> "Who in the Berlin engineering team submitted timesheets last week?"

The AI:
1. Calls `search_employees(query="Berlin engineering")`
2. Identifies the team lead: Anna Muller (emp-4821)
3. Calls `get_time_report(employeeId="emp-4821", fromDate="...", toDate="...")`
4. Returns: "Anna submitted 32 hours last week across 3 projects."

Every fact came from a real Kronos API call. No hallucination. Full audit trail.

---

## Kronos as a Template for New Clients

When onboarding a new company, use Kronos as the reference:

1. Do they have an employee or user directory? Map to search and get tools
2. Do they have time or activity logging? Map to report tools
3. Do they have a skills or capability system? Map to skills tools
4. Do they have something unique? Define a custom tool following the same patterns

The Kronos adapter config and response mappers are the concrete examples to refer to when building adapters for new tenants.
