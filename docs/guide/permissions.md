# Permissions and Roles

## How Permissions Work

Permissions operate at two levels:

1. **Tenant level** - Is this tool activated for this tenant?
2. **User level** - Does this user's role allow this specific call?

Both must pass. A tool that is activated for a tenant can still be blocked at the user level.

---

## Standard Role Permissions

| Tool | EMPLOYEE | MANAGER | HR_ADMIN |
|---|---|---|---|
| search (read, any) | Yes | Yes | Yes |
| get single record - own | Yes | Yes | Yes |
| get single record - team | No | Yes | Yes |
| get single record - any | No | No | Yes |
| write - own record | Yes | Yes | Yes |
| write - any record | No | No | Yes |

These rules apply to all tools regardless of what domain they cover. A tool that returns personal data always follows the same ownership pattern.

---

## How Role Checks Work in Code

Each tool reads from `TenantContext` which is populated by the auth filter:

```java
@Tool(description = "Get report data for an employee...")
public Report get_report(String resourceId, String fromDate, String toDate) {

    CallerClaims caller = TenantContext.getCaller();

    String resolvedId = (resourceId == null || resourceId.isBlank())
        ? caller.sub()
        : resourceId;

    if (!caller.hasRole("MANAGER") && !caller.sub().equals(resolvedId)) {
        throw new McpToolException("You can only view your own data.");
    }

    return adapterService.call(tenant, "get_report",
        Map.of("id", resolvedId, "from", fromDate, "to", toDate));
}
```

---

## Write Tool Protection

Write tools have an extra check - the tenant-level write flag:

```java
TenantTool toolConfig = tenantToolRegistry.get(tenant.getId(), "submit_entry");

if (!toolConfig.isWriteEnabled()) {
    throw new McpToolException(
        "Write tools are not enabled for this tenant. Contact the platform team.");
}
```

Write tools also always bind to the caller's own identity. A user cannot submit data on behalf of someone else:

```java
// Always use caller.sub() for write operations - never trust a client-supplied ID
return adapterService.call(tenant, "submit_entry",
    Map.of("userId", caller.sub(), ...));
```

---

## Sensitive Field Exclusion

Regardless of role, certain fields are never returned by any tool. These are excluded at the response mapper level before data reaches the tool layer. Examples:

- Salary and compensation
- Personal home address
- National ID or tax ID
- Medical or leave reason details

Each tenant's response mapper is responsible for explicitly including only safe fields.

---

## Rate Limits

| Role | Default rate limit |
|---|---|
| EMPLOYEE | 5 calls per second |
| MANAGER | 10 calls per second |
| HR_ADMIN | 20 calls per second |

Rate limits are configurable per tenant at onboarding.

---

## Audit Log

Every tool call is logged regardless of success or failure:

| Field | Example |
|---|---|
| tenant_id | kronos |
| user_id | emp-4821 |
| tool_name | search_employees |
| outcome | OK |
| duration_ms | 142 |

Arguments are stored as a hash to avoid logging sensitive data. Full arguments are only available in a restricted audit store accessible to platform admins.
