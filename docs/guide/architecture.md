# Architecture

## High-Level Overview

```
+------------------------------------------------------------------+
|                         AI CLIENTS                               |
|                                                                  |
|        Claude Desktop      Custom Chat UI      AI Agent          |
+----------------+------------------+------------------+-----------+
                 |                  |                  |
         /t/kronos/mcp/sse   /t/acme/mcp/sse   /t/company-b/mcp/sse
         Bearer <jwt>        Bearer <jwt>       Bearer <jwt>
                 |                  |                  |
                 v                  v                  v
+------------------------------------------------------------------+
|                   MCP PLATFORM (Spring Boot)                     |
|                                                                  |
|  +-----------------+  +------------------+  +----------------+  |
|  |  Auth Gateway   |  |  Tenant Router   |  |  Audit /       |  |
|  |                 |  |                  |  |  Rate Limiter  |  |
|  |  1. Tenant from |  |  Loads tenant    |  |                |  |
|  |     URL slug    |  |  config and      |  |  Per tenant,   |  |
|  |  2. iss check   |  |  activated tools |  |  per user      |  |
|  |     (if present)|  |  from registry   |  |                |  |
|  |  3. Signature   |  |                  |  |                |  |
|  |     validation  |  |                  |  |                |  |
|  +-----------------+  +--------+---------+  +----------------+  |
|                                |                                 |
|  +-----------------------------v------------------------------+  |
|  |                    Tool Registry                           |  |
|  |                                                            |  |
|  |   kronos:     search_employees, get_time_report, ...       |  |
|  |   acme:       search_contacts, get_deal_status, ...        |  |
|  |   company-b:  track_shipment, get_inventory_level, ...     |  |
|  +-----------------------------+------------------------------+  |
+--------------------------------+---------------------------------+
                                 |
           Internal HTTP calls via per-tenant adapter config
                                 |
         +-----------------------+-----------------------+
         v                       v                       v
  +-------------+       +-----------------+     +-------------+
  |   Kronos    |       |   Acme          |     |  Company B  |
  |  (Play API) |       |   (their API)   |     |  (their API)|
  +-------------+       +-----------------+     +-------------+
```

---

## Component Roles

### MCP Platform (Central - Spring Boot)

The single deployable service that powers the entire platform. Responsible for:

- Speaking the MCP protocol over HTTP/SSE or stdio
- Identifying the tenant from the URL path (`/t/{slug}/mcp/sse`)
- Validating the JWT using that tenant's configured auth method
- Looking up which tools that tenant has activated
- Routing tool calls to the correct company API via adapter config
- Logging every invocation with tenant context

### Tenant Registry (Database)

One record per registered company:

```
tenants
  id            UUID
  name          "Kronos"
  slug          "kronos"
  auth_method   "JWKS" or "HS256_SECRET"
  jwks_uri      "https://kronos-auth/.well-known/jwks.json"
  token_issuer  "https://kronos-auth"  (optional)
  api_base_url  "https://kronos-internal/api"
  status        ACTIVE
```

The `token_issuer` field is optional. If set, the platform validates the `iss` claim in the JWT against it. If not set, the `iss` check is skipped.

### Adapter Config (Per Tenant)

Maps tool names to the tenant's specific API endpoints:

```
tenant_adapters
  tenant_id          -> kronos
  tool_name          "search_employees"
  http_method        GET
  endpoint_template  "/employees?q={query}&limit={limit}"
  response_mapper    "kronos_employee_mapper"
```

### Tool Registry (Per Tenant)

Which tools each tenant has activated:

```
tenant_tools
  tenant_id     -> kronos
  tool_name     "search_employees"
  enabled       true
  write_enabled false
```

### Company APIs (External - Untouched)

Each company's backend is completely unchanged. The platform calls it as a trusted external client.

---

## Tenant Isolation

Isolation is enforced at every layer:

| Layer | How isolation is enforced |
|---|---|
| URL | Each tenant has a dedicated endpoint /t/{slug}/mcp/sse |
| Auth | JWT validated against that specific tenant's config only |
| iss check | If iss is present, it must match the tenant - mismatches are rejected |
| Data | Tool calls only reach the specific tenant's registered APIs |
| Audit log | Every entry tagged with tenant_id |
| Rate limits | Per tenant per user |

---

## How a Request Flows

```
1. Request arrives: POST /t/kronos/mcp/sse
   Authorization: Bearer <jwt>

2. Tenant Router:
   -> slug = "kronos" (from URL)
   -> tenant config loaded for Kronos

3. Auth Gateway:
   -> iss claim present? yes -> matches Kronos tokenIssuer? yes -> proceed
   -> iss claim missing? -> skip iss check, proceed
   -> Validate signature using Kronos JWKS (or HS256 secret)
   -> Extract: sub, roles

4. Tool Registry:
   -> Load Kronos activated tools
   -> Return manifest to AI client

5. Tool call executes:
   -> Adapter config for Kronos + this tool loaded
   -> HTTP request built from endpoint template
   -> Kronos API called
   -> Response mapped to standard DTO

6. Result returned to AI client
   -> Logged: tenant=kronos, user=sub, tool=name, outcome=OK
```
