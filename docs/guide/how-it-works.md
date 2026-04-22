# How It Works

## The MCP Protocol

MCP defines a standard conversation between an AI client and a server:

```
Client -> Server:  "What can you do?"
Server -> Client:  [list of tools with name, description, JSON Schema]

Client -> Server:  "Call search_contacts with query='Acme'"
Server -> Client:  [structured result]
```

The AI model reads the tool descriptions and decides which tool to call based on the user's intent. In the MCP Platform, this list is dynamically assembled per tenant. Company A gets their tools, Company B gets theirs, and they never overlap.

---

## Multi-Tenancy in Practice

When an AI client connects to the MCP Platform, the first thing the platform does is identify the tenant. This happens via the JWT:

```
JWT payload example:
{
  "sub": "user-4821",
  "iss": "https://auth.somecompany.com",
  "roles": ["MANAGER"],
  "exp": 1714000000
}
```

The `iss` (issuer) claim tells the platform which company this token belongs to. The platform looks up the tenant whose config matches this issuer, validates the token, and from that point on all routing is scoped to that tenant.

---

## Tools Are Always Tenant-Specific

There are no built-in or standard tools on the platform. Every tool is defined per tenant based on what that company's system can do.

A CRM company might have:

```
search_contacts, get_deal_status, create_follow_up
```

A logistics company might have:

```
track_shipment, get_inventory_level, get_delivery_estimate
```

An HR platform like Kronos might have:

```
search_employees, get_time_report, get_employee_skills
```

When a user connects, the model sees only the tools that belong to their company. Nothing else is visible.

---

## Transport Modes

The MCP Platform supports two transport modes.

### HTTP/SSE (for network clients)

Used for web-based AI clients, third-party agent platforms, and any client connecting over the network.

```
POST /mcp/sse
Authorization: Bearer <tenant-jwt>
```

### stdio (for Claude Desktop)

Claude Desktop launches the MCP server as a local process. Configured in claude_desktop_config.json:

```json
{
  "mcpServers": {
    "mcp-platform": {
      "command": "java",
      "args": ["-jar", "/path/to/mcp-platform.jar"],
      "env": {
        "SPRING_AI_MCP_SERVER_TRANSPORT": "STDIO"
      }
    }
  }
}
```

---

## Safety Model

Every tool call on the platform goes through five checks:

```
1. Auth check    - Is the JWT valid for this tenant?
2. Tenant check  - Is this tool activated for this tenant?
3. Role check    - Does this user's role allow this tool call?
4. Input check   - Are the arguments valid?
5. Write flag    - If this is a write tool, is it enabled for this tenant?
```

All five must pass. If any fails, the call is rejected with a clear error message and the attempt is logged.
