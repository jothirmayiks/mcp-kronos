# Permissions Matrix

## Overview

Access control in Kronos MCP operates at two levels:

1. **Auth-level** — Is the caller authenticated at all? (JWT valid, API key valid, OAuth token valid)
2. **Tool-level** — Does this specific caller have permission to run this specific tool with these specific arguments?

Both levels must pass for a tool call to succeed.

---

## Full Permissions Matrix

| Tool | Kronos Employee | Kronos Manager | Kronos HR Admin | External App (read scope) | External App (write scope) | External Individual |
|---|---|---|---|---|---|---|
| `search_employees` | ✅ Own dept only | ✅ All | ✅ All | ✅ (directory:read) | — | ✅ (directory:read) |
| `get_employee` | ✅ Own profile | ✅ Team | ✅ All | ✅ (directory:read) | — | ✅ (directory:read) |
| `get_time_report` | ✅ Own only | ✅ Team | ✅ All | ✅ (timereport:read) | — | ✅ Own only |
| `submit_timesheet_entry` | ✅ Own only | ✅ Own only | ✅ Any | ❌ | ✅ (timereport:write) | ⚠️ Own only (Phase 2+) |
| `get_employee_skills` | ✅ All | ✅ All | ✅ All | ✅ (skills:read) | — | ✅ (skills:read) |
| `search_by_skill` | ✅ All | ✅ All | ✅ All | ✅ (skills:read) | — | ✅ (skills:read) |
| `update_employee_status` | ✅ Own only | ✅ Own only | ✅ Any | ❌ | ❌ | ❌ |

**Legend:** ✅ Allowed | ❌ Not allowed | ⚠️ Conditional / future

---

## Write Tools Are Feature-Flagged

All write tools (`submit_timesheet_entry`, `update_employee_status`) are controlled by a feature flag that defaults to `false`. You must explicitly enable them per environment.

```properties
# application.properties
mcp.write-tools.enabled=false
```

This means you can deploy the MCP server to production in read-only mode and enable writes deliberately after validation.

---

## How Tool-Level Auth is Enforced

Each tool checks the `SecurityContext` populated by the auth filter. Example from `get_time_report`:

```java
@Tool(description = "Get time report entries for an employee...")
public TimeReport get_time_report(String employeeId, String fromDate, String toDate) {

    JwtClaims caller = SecurityContext.current();

    // Non-managers can only see their own data
    if (!caller.hasRole("MANAGER") && !caller.sub().equals(employeeId)) {
        throw new McpToolException("You can only view your own time report.");
    }

    return timeClient.getReport(employeeId, fromDate, toDate);
}
```

Write tools additionally check the feature flag:

```java
@Tool(description = "Submit a timesheet entry...")
public TimesheetEntryResult submit_timesheet_entry(...) {

    if (!writeEnabled) {
        throw new McpToolException("Write tools are disabled in this environment.");
    }

    JwtClaims caller = SecurityContext.current();
    // Always bind to caller.sub() — never trust client-supplied employeeId for writes
    return timeClient.submitEntry(caller.sub(), projectCode, date, hours, notes);
}
```

---

## Sensitive Field Exclusions

Regardless of role or scope, the following fields are **never** returned by any MCP tool:

- Salary and compensation data
- Personal home address
- Personal phone number
- National ID / tax ID numbers
- Medical / leave reason details

These fields exist in the Kronos database but are explicitly excluded from the MCP tool response models. The Play API endpoints called by the MCP server use dedicated MCP-safe response DTOs that omit these fields.

---

## Rate Limits

All callers are subject to rate limits enforced at the tool level:

| Caller type | Rate limit |
|---|---|
| Kronos user (JWT) | 10 calls/second per user |
| External app (API key) | 5 calls/second per key (configurable at key creation) |
| External individual (OAuth) | 2 calls/second per user |

Rate limit exceeded responses return a `McpToolException` with a human-readable message. The AI model will surface this to the user.
