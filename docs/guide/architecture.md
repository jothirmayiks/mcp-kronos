# Architecture

## High-Level Overview

<div style="overflow-x:auto;margin-top:1.5rem;margin-bottom:1.5rem;">
<svg width="100%" viewBox="0 0 680 490" role="img" xmlns="http://www.w3.org/2000/svg">
<title>MCP Platform architecture overview</title>
<defs>
  <marker id="arch-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M2 1L8 5L2 9" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mcp-arr-line"/>
  </marker>
</defs>

<!-- AI Clients box -->
<rect x="20" y="20" width="640" height="70" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" letter-spacing="2" class="mcp-label" x="340" y="38" text-anchor="middle" dominant-baseline="central">AI CLIENTS</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="130" y="66" text-anchor="middle" dominant-baseline="central">Claude Desktop</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="340" y="66" text-anchor="middle" dominant-baseline="central">Custom Chat UI</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="550" y="66" text-anchor="middle" dominant-baseline="central">AI Agent</text>

<!-- Arrows down with URL labels BESIDE them, not on top -->
<line x1="130" y1="90" x2="130" y2="140" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#arch-arr)"/>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="136" y="112" dominant-baseline="central">/t/kronos/mcp/sse</text>

<line x1="340" y1="90" x2="340" y2="140" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#arch-arr)"/>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="346" y="112" dominant-baseline="central">/t/acme/mcp/sse</text>

<line x1="550" y1="90" x2="550" y2="140" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#arch-arr)"/>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="556" y="112" dominant-baseline="central">/t/company-b/mcp/sse</text>

<!-- MCP Platform outer box -->
<rect x="20" y="140" width="640" height="220" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" letter-spacing="2" class="mcp-label" x="340" y="158" text-anchor="middle" dominant-baseline="central">MCP PLATFORM (SPRING BOOT)</text>

<!-- Auth Gateway box -->
<rect x="36" y="172" width="172" height="88" rx="6" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="122" y="190" text-anchor="middle" dominant-baseline="central">Auth Gateway</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="122" y="210" text-anchor="middle" dominant-baseline="central">1. Tenant from URL slug</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="122" y="228" text-anchor="middle" dominant-baseline="central">2. iss check (if present)</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="122" y="246" text-anchor="middle" dominant-baseline="central">3. Signature validation</text>

<!-- Tenant Router box -->
<rect x="254" y="172" width="172" height="88" rx="6" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="340" y="190" text-anchor="middle" dominant-baseline="central">Tenant Router</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="340" y="210" text-anchor="middle" dominant-baseline="central">Loads tenant config</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="340" y="228" text-anchor="middle" dominant-baseline="central">and activated tools</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="340" y="246" text-anchor="middle" dominant-baseline="central">from registry</text>

<!-- Audit box -->
<rect x="472" y="172" width="172" height="88" rx="6" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="558" y="190" text-anchor="middle" dominant-baseline="central">Audit / Rate Limiter</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="558" y="216" text-anchor="middle" dominant-baseline="central">Per tenant,</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="558" y="234" text-anchor="middle" dominant-baseline="central">per user</text>

<!-- Arrow from Tenant Router down to Tool Registry -->
<line x1="340" y1="260" x2="340" y2="282" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#arch-arr)"/>

<!-- Tool Registry box -->
<rect x="36" y="282" width="608" height="62" rx="6" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="340" y="302" text-anchor="middle" dominant-baseline="central">Tool Registry</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="340" y="322" text-anchor="middle" dominant-baseline="central">kronos: search_employees, get_time_report ...     acme: search_contacts ...     company-b: track_shipment ...</text>

<!-- Single arrow exits platform box cleanly -->
<line x1="340" y1="360" x2="340" y2="390" stroke-width="1.4" fill="none" class="mcp-arr-line"/>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="346" y="376" dominant-baseline="central">Internal HTTP via adapter config</text>

<!-- Horizontal distributor line -->
<line x1="110" y1="390" x2="570" y2="390" stroke-width="1" fill="none" class="mcp-arr-line"/>

<!-- Three arrows down from distributor to company boxes -->
<line x1="110" y1="390" x2="110" y2="416" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#arch-arr)"/>
<line x1="340" y1="390" x2="340" y2="416" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#arch-arr)"/>
<line x1="570" y1="390" x2="570" y2="416" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#arch-arr)"/>

<!-- Company boxes -->
<rect x="20" y="416" width="180" height="56" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="110" y="438" text-anchor="middle" dominant-baseline="central">Kronos</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="110" y="458" text-anchor="middle" dominant-baseline="central">Play API</text>

<rect x="250" y="416" width="180" height="56" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="340" y="438" text-anchor="middle" dominant-baseline="central">Acme</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="340" y="458" text-anchor="middle" dominant-baseline="central">their API</text>

<rect x="480" y="416" width="180" height="56" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="570" y="438" text-anchor="middle" dominant-baseline="central">Company B</text>
<text font-family="Inter,system-ui,sans-serif" font-size="11" class="mcp-sub" x="570" y="458" text-anchor="middle" dominant-baseline="central">their API</text>

</svg>
</div>

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

<div style="overflow-x:auto;margin-top:1.5rem;margin-bottom:1.5rem;">
<svg width="100%" viewBox="0 0 680 320" role="img" xmlns="http://www.w3.org/2000/svg">
<title>MCP Platform request flow</title>
<defs>
  <marker id="flow-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M2 1L8 5L2 9" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mcp-arr-line"/>
  </marker>
</defs>

<!-- Row 1: steps 1-4 -->
<rect x="20" y="20" width="130" height="60" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" class="mcp-title" x="85" y="42" text-anchor="middle" dominant-baseline="central">1. Request</text>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="85" y="62" text-anchor="middle" dominant-baseline="central">POST /t/kronos/mcp/sse</text>
<line x1="150" y1="50" x2="170" y2="50" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#flow-arr)"/>

<rect x="170" y="20" width="130" height="60" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" class="mcp-title" x="235" y="42" text-anchor="middle" dominant-baseline="central">2. Tenant Router</text>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="235" y="62" text-anchor="middle" dominant-baseline="central">slug = "kronos"</text>
<line x1="300" y1="50" x2="320" y2="50" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#flow-arr)"/>

<rect x="320" y="20" width="130" height="60" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" class="mcp-title" x="385" y="42" text-anchor="middle" dominant-baseline="central">3. Auth Gateway</text>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="385" y="62" text-anchor="middle" dominant-baseline="central">Validate JWT + roles</text>
<line x1="450" y1="50" x2="470" y2="50" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#flow-arr)"/>

<rect x="470" y="20" width="190" height="60" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" class="mcp-title" x="565" y="42" text-anchor="middle" dominant-baseline="central">4. Tool Registry</text>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="565" y="62" text-anchor="middle" dominant-baseline="central">Load Kronos tools manifest</text>

<!-- Down arrow from step 4 -->
<line x1="565" y1="80" x2="565" y2="110" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#flow-arr)"/>

<!-- Row 2: steps 5-7 right to left -->
<rect x="470" y="110" width="190" height="60" rx="8" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" class="mcp-title" x="565" y="132" text-anchor="middle" dominant-baseline="central">5. Tool Executes</text>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="565" y="152" text-anchor="middle" dominant-baseline="central">Adapter config + API call</text>
<line x1="470" y1="140" x2="450" y2="140" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#flow-arr)"/>

<rect x="270" y="110" width="180" height="60" rx="8" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" class="mcp-title" x="360" y="132" text-anchor="middle" dominant-baseline="central">6. Kronos API</text>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="360" y="152" text-anchor="middle" dominant-baseline="central">Returns real data</text>
<line x1="270" y1="140" x2="250" y2="140" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#flow-arr)"/>

<rect x="20" y="110" width="230" height="60" rx="8" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" class="mcp-title" x="135" y="132" text-anchor="middle" dominant-baseline="central">7. Response to AI client</text>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="135" y="152" text-anchor="middle" dominant-baseline="central">Structured result returned</text>

<!-- Down arrow to audit -->
<line x1="340" y1="170" x2="340" y2="210" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#flow-arr)"/>

<!-- Audit log -->
<rect x="20" y="210" width="640" height="50" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" class="mcp-title" x="340" y="228" text-anchor="middle" dominant-baseline="central">Audit Log</text>
<text font-family="Inter,system-ui,sans-serif" font-size="10" class="mcp-sub" x="340" y="248" text-anchor="middle" dominant-baseline="central">tenant=kronos     user=sub     tool=name     outcome=OK     duration=142ms</text>

</svg>
</div>