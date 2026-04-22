# Connecting APIs

## How the Adapter Works

The adapter config tells the platform how to translate a tool call into an actual HTTP request for a specific company's API.

```
Tool call:  search_contacts(query="Acme", limit=10)
                    |  adapter config
HTTP call:  GET https://api.company.com/v1/contacts?search=Acme&max=10
                    |  response mapper
Tool result: List<ContactSummary>
```

The adapter has two parts:
1. **Endpoint template** - how to build the HTTP request
2. **Response mapper** - how to map their response to the standard DTO

---

## Registering an Adapter

```http
POST /admin/tenants/{tenantId}/adapters
Content-Type: application/json

{
  "toolName": "search_contacts",
  "httpMethod": "GET",
  "endpointTemplate": "/contacts?search={query}&max={limit}",
  "responseMapper": "default_contact_mapper",
  "headers": {
    "X-Internal-Client": "mcp-platform"
  }
}
```

Repeat this for each tool the company wants to activate.

---

## Endpoint Templates

Endpoint templates use `{paramName}` placeholders that map to the tool's input arguments:

| Placeholder | Maps to |
|---|---|
| {query} | The search query string |
| {limit} | Max number of results |
| {id} | A resource identifier |
| {fromDate} | Start date in YYYY-MM-DD format |
| {toDate} | End date in YYYY-MM-DD format |

Each tool defines its own parameters. The template must use the correct parameter names as defined in the tool schema.

---

## Response Mappers

Response mappers translate a company's API response into the DTO the platform expects. The platform ships with a set of built-in mappers and supports custom mappers.

### Built-in mappers

| Mapper | Use when |
|---|---|
| default_employee_mapper | Response has fields like id, name, email, department |
| default_timereport_mapper | Response has entries with date, hours, projectCode |
| default_skills_mapper | Response has skillName, proficiency, endorsements |
| default_contact_mapper | Response has id, name, email, company |

### Custom mapper

If a company's API response is significantly different, a custom mapper can be registered:

```java
@Component("acme_contact_mapper")
public class AcmeContactMapper implements ResponseMapper<ContactSummary> {

    @Override
    public List<ContactSummary> map(JsonNode response) {
        return StreamSupport
            .stream(response.get("results").spliterator(), false)
            .map(node -> new ContactSummary(
                node.get("contact_id").asText(),
                node.get("display_name").asText(),
                node.get("work_email").asText(),
                node.get("organisation").asText()
            ))
            .collect(Collectors.toList());
    }
}
```

---

## Testing the Adapter

After registering adapters, test each one before activating for live traffic:

```http
POST /admin/tenants/{tenantId}/adapters/test
Content-Type: application/json

{
  "toolName": "search_contacts",
  "args": {
    "query": "engineering",
    "limit": 5
  },
  "testJwt": "<a real JWT from their system>"
}
```

This runs the full adapter call and returns the mapped result or a detailed error. Use this to debug endpoint templates and response mappers before go-live.
