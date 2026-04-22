# Defining Tools for a Tenant

## Overview

When onboarding a new tenant, the platform team defines tools based on what the company's APIs expose. There is no fixed list - any API endpoint can become an MCP tool.

The process:
1. Understand what the company's system can do
2. Identify which capabilities are useful to expose to AI agents
3. Define a tool for each capability - name, description, schema, endpoint
4. Register the tool via the admin API
5. Test and activate

---

## Registering a Tool

```http
POST /admin/tenants/{tenantId}/tools/define
Content-Type: application/json

{
  "toolName": "search_contacts",
  "description": "Search the CRM for contacts by name, company, or email. Returns a list of matching contacts with their details and associated company. Use this when the user wants to find a person or look up who to contact.",
  "parameters": [
    {
      "name": "query",
      "type": "string",
      "description": "Name, company, or email to search for",
      "required": true
    },
    {
      "name": "limit",
      "type": "integer",
      "description": "Max results to return. Default 10, max 50.",
      "required": false
    }
  ],
  "httpMethod": "GET",
  "endpointTemplate": "/contacts?search={query}&max={limit}",
  "responseMapper": "default_contact_mapper",
  "isWriteTool": false,
  "ownershipCheck": false
}
```

---

## Writing Good Tool Descriptions

The description is what the AI model reads to decide when to call the tool. A poor description leads to the model calling the wrong tool or not calling it when it should.

Good description:
```
Search the CRM for contacts by name, company, or email.
Returns a list of matching contacts with their details and
associated company. Use this when the user wants to find
a person or look up who to contact at an organisation.
```

Poor description:
```
Search contacts.
```

Rules for good descriptions:
- Explain what the tool returns, not just what it does
- Include examples of when to use it
- Mention what the user might be asking that should trigger this tool
- Be specific about data fields returned

---

## The ownershipCheck Flag

If `ownershipCheck` is true, the platform enforces that non-MANAGER users can only call this tool for their own ID. Set this to true for any tool that returns personal data about a specific user.

```json
"ownershipCheck": true
```

With this flag on, an EMPLOYEE calling `get_report(userId="someone-else")` will receive an error. A MANAGER or HR_ADMIN calling the same will succeed.

---

## Tool Naming Conventions

Use snake_case for tool names. Follow this pattern:

```
{verb}_{noun}

search_contacts
get_contact
create_contact
update_contact_status
track_shipment
get_inventory_level
```

Verbs to use:
- `search` - for list/search operations
- `get` - for fetching a single record
- `create` or `submit` - for creating a new record
- `update` - for modifying an existing record
