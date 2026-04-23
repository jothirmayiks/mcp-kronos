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

When an AI client connects to the MCP Platform, the first thing the platform does is identify the tenant via the URL and JWT:

```
Request: POST /t/kronos/mcp/sse
JWT: { "sub": "user-4821", "iss": "https://auth.somecompany.com", "roles": ["MANAGER"] }
```

The tenant slug in the URL tells the platform which company this request belongs to. The JWT is then validated against that tenant's auth config.

---

## Tools Are Always Tenant-Specific

There are no built-in or standard tools on the platform. Every tool is defined per tenant based on what that company's system can do.

A company with a CRM might have:

```
search_contacts, get_contact, create_contact, get_deal_status
```

A logistics company might have:

```
track_shipment, get_inventory_level, get_delivery_estimate
```

A company with an HR platform like Kronos might have:

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
POST /t/{tenantSlug}/mcp/sse
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

---

## End-to-End Flow

<div style="overflow-x:auto;margin-top:1.5rem;">
<svg width="100%" viewBox="0 0 680 1680" role="img" xmlns="http://www.w3.org/2000/svg">
<title>MCP Platform end-to-end flow</title>
<defs>
  <marker id="mcp-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M2 1L8 5L2 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mcp-arr-line"/>
  </marker>
</defs>

<rect x="0" y="0" width="680" height="1680" class="mcp-bg-outer"/>
<rect x="16" y="16" width="648" height="1648" rx="10" class="mcp-bg-inner"/>

<text font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" letter-spacing="2" class="mcp-label" x="40" y="38" dominant-baseline="central">ONE-TIME SETUP</text>
<line x1="40" y1="50" x2="640" y2="50" stroke-width="1" class="mcp-line"/>

<rect x="40" y="62" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="86" text-anchor="middle" dominant-baseline="central">Step 1</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="108" text-anchor="middle" dominant-baseline="central">Admin registers on platform</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="78" dominant-baseline="central">GTM IT admin goes to platform website</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="98" dominant-baseline="central">Creates account for GTM company</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="118" dominant-baseline="central">Gets a tenant profile created</text>
<line x1="140" y1="124" x2="140" y2="146" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#mcp-arr)"/>

<rect x="40" y="146" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="170" text-anchor="middle" dominant-baseline="central">Step 2</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="192" text-anchor="middle" dominant-baseline="central">Admin connects Kronos</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="162" dominant-baseline="central">Provides Kronos API URL</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="182" dominant-baseline="central">Provides auth details (JWKS or secret)</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="202" dominant-baseline="central">Platform now knows how to talk to Kronos</text>
<line x1="140" y1="208" x2="140" y2="230" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#mcp-arr)"/>

<rect x="40" y="230" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="254" text-anchor="middle" dominant-baseline="central">Step 3</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="276" text-anchor="middle" dominant-baseline="central">Admin picks tools to expose</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="246" dominant-baseline="central">Search employees - enabled</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="266" dominant-baseline="central">Get leave balance - enabled</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="286" dominant-baseline="central">Delete employee - left off</text>
<line x1="140" y1="292" x2="140" y2="314" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#mcp-arr)"/>

<rect x="40" y="314" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="338" text-anchor="middle" dominant-baseline="central">Step 4</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="360" text-anchor="middle" dominant-baseline="central">Admin gets MCP endpoint</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="330" dominant-baseline="central">Platform gives GTM their dedicated URL</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="350" dominant-baseline="central">yourmcp.com/t/gtm/mcp/sse</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="370" dominant-baseline="central">Admin passes URL to chat agent developer</text>
<line x1="140" y1="376" x2="140" y2="398" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#mcp-arr)"/>

<rect x="40" y="398" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="422" text-anchor="middle" dominant-baseline="central">Step 5</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="444" text-anchor="middle" dominant-baseline="central">Chat agent is connected</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="414" dominant-baseline="central">GTM developer points chat agent at the URL</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="434" dominant-baseline="central">Chat agent now knows it can use</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="454" dominant-baseline="central">Kronos tools through the platform</text>

<line x1="20" y1="486" x2="660" y2="486" stroke-width="0.8" stroke-dasharray="5 4" class="mcp-divider"/>

<text font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" letter-spacing="2" class="mcp-label" x="40" y="506" dominant-baseline="central">EVERY DAY - EMPLOYEE USING THE CHAT</text>
<line x1="40" y1="518" x2="640" y2="518" stroke-width="1" class="mcp-line"/>

<rect x="40" y="530" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="554" text-anchor="middle" dominant-baseline="central">Step 6</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="576" text-anchor="middle" dominant-baseline="central">Employee opens website</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="546" dominant-baseline="central">Ravi from GTM HR opens internal website</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="566" dominant-baseline="central">Sees the chat agent in the corner</text>
<line x1="140" y1="592" x2="140" y2="614" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#mcp-arr)"/>

<rect x="40" y="614" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="638" text-anchor="middle" dominant-baseline="central">Step 7</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="660" text-anchor="middle" dominant-baseline="central">Employee logs in</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="630" dominant-baseline="central">Ravi logs in with his Kronos credentials</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="650" dominant-baseline="central">Kronos gives back Ravi personal token</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="670" dominant-baseline="central">Chat agent holds this token for the session</text>
<line x1="140" y1="676" x2="140" y2="698" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#mcp-arr)"/>

<rect x="40" y="698" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="722" text-anchor="middle" dominant-baseline="central">Step 8</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="744" text-anchor="middle" dominant-baseline="central">Ravi asks a question</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="730" dominant-baseline="central">How many leaves does John have left?</text>
<line x1="140" y1="760" x2="140" y2="782" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#mcp-arr)"/>

<rect x="40" y="782" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="806" text-anchor="middle" dominant-baseline="central">Step 9</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="828" text-anchor="middle" dominant-baseline="central">Chat agent thinks</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="798" dominant-baseline="central">AI reads the question, looks at available tools</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="818" dominant-baseline="central">1. Find John employee ID</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="838" dominant-baseline="central">2. Then get his leave balance</text>
<line x1="140" y1="844" x2="140" y2="866" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#mcp-arr)"/>

<rect x="40" y="866" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="890" text-anchor="middle" dominant-baseline="central">Step 10</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="912" text-anchor="middle" dominant-baseline="central">First tool call to platform</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="882" dominant-baseline="central">Tool: search_employees</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="902" dominant-baseline="central">Query: John engineering, token attached</text>
<line x1="140" y1="928" x2="140" y2="950" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#mcp-arr)"/>

<rect x="40" y="950" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="974" text-anchor="middle" dominant-baseline="central">Step 11</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="996" text-anchor="middle" dominant-baseline="central">Platform calls Kronos</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="966" dominant-baseline="central">Validates request is from GTM tenant</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="986" dominant-baseline="central">Calls Kronos API using Ravi token</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="1006" dominant-baseline="central">Kronos returns John details and ID</text>
<line x1="140" y1="1012" x2="140" y2="1034" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#mcp-arr)"/>

<rect x="40" y="1034" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="1058" text-anchor="middle" dominant-baseline="central">Step 12</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="1080" text-anchor="middle" dominant-baseline="central">Second tool call</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="1050" dominant-baseline="central">Tool: get_leave_balance, using John ID</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="1070" dominant-baseline="central">Ravi token still attached</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="1090" dominant-baseline="central">Kronos returns: 8 days remaining</text>
<line x1="140" y1="1096" x2="140" y2="1118" stroke-width="1.4" fill="none" class="mcp-arr-line" marker-end="url(#mcp-arr)"/>

<rect x="40" y="1118" width="200" height="62" rx="8" stroke-width="1" class="mcp-box-grey"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-title" x="140" y="1142" text-anchor="middle" dominant-baseline="central">Step 13</text>
<text font-family="Inter,system-ui,sans-serif" font-size="12" class="mcp-sub" x="140" y="1164" text-anchor="middle" dominant-baseline="central">Ravi gets his answer</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="1134" dominant-baseline="central">John has 8 leave days remaining,</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="1154" dominant-baseline="central">with 3 already taken.</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="260" y="1174" dominant-baseline="central">Ravi sees this in the chat</text>

<line x1="20" y1="1202" x2="660" y2="1202" stroke-width="0.8" stroke-dasharray="5 4" class="mcp-divider"/>

<text font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" letter-spacing="2" class="mcp-label" x="40" y="1222" dominant-baseline="central">WHAT EACH PARTY DID</text>
<line x1="40" y1="1234" x2="640" y2="1234" stroke-width="1" class="mcp-line"/>

<rect x="40" y="1250" width="600" height="172" rx="8" stroke-width="1" class="mcp-box-white"/>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="60" y="1276" dominant-baseline="central">GTM admin</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="220" y="1276" dominant-baseline="central">Registered once, connected Kronos, picked tools</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="60" y="1300" dominant-baseline="central">GTM developer</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="220" y="1300" dominant-baseline="central">Pointed chat agent at the MCP URL</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="60" y="1324" dominant-baseline="central">Ravi</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="220" y="1324" dominant-baseline="central">Logged in with his own Kronos account</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="60" y="1348" dominant-baseline="central">MCP Platform</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="220" y="1348" dominant-baseline="central">Routed requests, passed token, called Kronos</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="60" y="1372" dominant-baseline="central">Kronos</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="220" y="1372" dominant-baseline="central">Held the actual data, enforced Ravi permissions</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="600" class="mcp-title" x="60" y="1396" dominant-baseline="central">AI chat agent</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-note" x="220" y="1396" dominant-baseline="central">Decided which tools to call, formed the answer</text>

<rect x="40" y="1446" width="600" height="90" rx="8" class="mcp-box-dark"/>
<text font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" class="mcp-insight-title" x="340" y="1472" text-anchor="middle" dominant-baseline="central">The key thing to notice</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-insight-sub1" x="340" y="1496" text-anchor="middle" dominant-baseline="central">Platform passed data through. Kronos got normal API calls.</text>
<text font-family="Inter,system-ui,sans-serif" font-size="13" class="mcp-insight-sub2" x="340" y="1518" text-anchor="middle" dominant-baseline="central">AI never talked to Kronos directly. Everyone did only their own job.</text>

</svg>
</div>