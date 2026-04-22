# Tool Design Best Practices

## Keep Tools Focused

Each tool should do one thing well. Avoid building tools that try to serve too many use cases in one call.

Good:
```
search_contacts(query, limit)
get_contact(contactId)
```

Avoid:
```
contacts(action, query, contactId, limit)  <- too generic
```

A focused tool has a clearer description, which means the AI model uses it more accurately.

---

## Always Validate Inputs at the Tool Boundary

The AI model can hallucinate or misformat arguments. Never trust that the model will always send valid data. Validate at the tool level, not just in the downstream API.

Common validations:
- Numeric ranges (e.g. hours must be between 0.5 and 16)
- Enum values (e.g. status must be one of ACTIVE, INACTIVE)
- Date formats (e.g. must be YYYY-MM-DD)
- String length limits

```java
if (hours < 0.5 || hours > 16) {
    throw new McpToolException("Hours must be between 0.5 and 16.");
}

Set<String> validStatuses = Set.of("ACTIVE", "INACTIVE", "PENDING");
if (!validStatuses.contains(status)) {
    throw new McpToolException("Invalid status. Allowed: " + validStatuses);
}
```

---

## Write Tools: Always Use the Caller's Identity

For any write tool that creates or modifies a record on behalf of the user, always use `caller.sub()` as the user identifier. Never trust a user-supplied ID for ownership.

```java
// CORRECT - use the authenticated caller's identity
return adapterService.call(tenant, "submit_entry",
    Map.of("userId", caller.sub(), "data", data));

// WRONG - trusting a client-supplied ID
return adapterService.call(tenant, "submit_entry",
    Map.of("userId", requestedUserId, "data", data));
```

---

## Exclude Sensitive Fields in Response Mappers

Response mappers are the last line of defence before data reaches the AI model. Always explicitly include only the fields you want to expose. Never map the entire API response and filter later.

```java
// CORRECT - explicit safe field selection
return new ContactSummary(
    node.get("id").asText(),
    node.get("name").asText(),
    node.get("work_email").asText(),
    node.get("company").asText()
    // salary, personal_phone, home_address are intentionally NOT mapped
);

// WRONG - mapping everything
return objectMapper.treeToValue(node, ContactSummary.class);
```

---

## Start Read-Only

Always activate read tools first and leave write tools disabled until read tools are tested and stable. This approach:

- Reduces the risk of data corruption during the testing phase
- Gives the tenant confidence in the integration before writes are enabled
- Provides a clear gate for stakeholder sign-off

---

## Limit Results

Always cap the number of results a search tool can return. Large unbounded responses slow down the AI model and increase token usage.

Recommended defaults:
- Default limit: 10
- Maximum limit: 50

```java
int safeLimit = Math.min(limit != null ? limit : 10, 50);
```

---

## Handle Downstream Errors Gracefully

When the tenant's API returns an error, the platform should surface a clear, human-readable message to the AI model - not a raw HTTP error or stack trace.

```java
try {
    return adapterService.call(tenant, toolName, args);
} catch (TenantApiException e) {
    if (e.getStatus() == 404) {
        throw new McpToolException("No record found for the given ID.");
    }
    if (e.getStatus() == 409) {
        throw new McpToolException("A record already exists for this date and project.");
    }
    throw new McpToolException("An error occurred. Please try again shortly.");
}
```
