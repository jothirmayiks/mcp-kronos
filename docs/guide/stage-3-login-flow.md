# Stage 3 - Login Flow Design

## What This Stage Covers

With the MCP Platform and the Kronos MCP Server integrated, the final challenge is authentication at the platform entry point: how does a user prove their identity to the MCP Platform, and how does the platform manage their credentials across multiple connected applications?

This stage covers the design decisions, trade-offs, and proposed solutions for this problem - including different client types, multi-app token strategies, OAuth 2.0 flows, and token storage models.

---

## The Problem

### Single App vs. Multiple Apps

The platform currently supports one app per tenant connection. When an AI client connects via SSE, it sends a single JWT in the `Authorization` header. The platform validates this token, builds a session, and uses that same token when forwarding tool calls to the Kronos MCP Server.

This works cleanly for the current setup: GTM tenant has one app (Kronos), and the AI client authenticates with a Kronos JWT directly.

As the platform grows to support multiple apps per tenant — Kronos, Jira, Slack, and others — a new challenge emerges: each app has its own authentication system and expects its own token. The AI client connects once, but the platform must forward tool calls to multiple services, each requiring a different user token.

```
AI client connects once
        │
        ▼
MCP Platform
        ├──► Kronos MCP Server  (expects Kronos JWT)
        ├──► Jira MCP Server    (expects Jira token)
        └──► Slack MCP Server   (expects Slack token)
```

### Two Fundamentally Different Client Types

There is a second dimension to this problem. The type of client connecting to the platform determines what authentication mechanism is even possible. There are two categories:

**Type 1 - Company-Deployed Agent**
A company builds their own AI chatbot and deploys it for their employees. The company's engineering team controls the agent code, configuration, and deployment. Employees interact with the company's chatbot UI, which calls the MCP Platform in the background.

**Type 2 - Individual User via Claude Desktop or Claude.ai**
An individual employee opens Claude Desktop, adds the MCP Platform URL in their settings, and connects directly - with no company-built intermediary in between.

These two client types cannot use the same authentication mechanism. The sections below explain why and what each requires.

---

## Multi-App Token Strategy

Three options have been evaluated for handling multiple app tokens when a single AI client needs to reach multiple services.

---

### Option 1 - Client Sends One Token Per App

**How it works**

The AI client sends a separate token for each app in the request headers. The platform tells the client upfront which tokens it needs, based on which apps the tenant has connected. The client includes all tokens on every request, and the platform selects the correct one when forwarding to each service.

```
Authorization:  Bearer <kronos_token>
X-Jira-Token:  Bearer <jira_token>
```

**Advantages**
- Simple to implement — no new authentication infrastructure required
- Each app continues to validate its own token directly
- Works with apps that have completely different authentication systems

**Disadvantages**
- The client (or the administrator configuring the client) must manage multiple tokens
- Token management overhead scales with the number of apps
- Not viable for clients like Claude Desktop, which cannot handle arbitrary custom headers

**Best suited for:** Early-stage deployments with a small number of apps and different auth systems per app.

---

### Option 2 - Platform Uses Stored Credentials Per App

**How it works**

The AI client sends a single platform token that identifies the user. Each tenant-app connection stores pre-configured service credentials in the platform database. The platform authenticates the user's identity and then uses its own stored credentials when calling each app on their behalf.

```
AI client sends:   Platform JWT (identifies the user)
Platform uses:     Stored API key for Kronos (configured by admin)
                   Stored API key for Jira (configured by admin)
```

**Advantages**
- The client only needs one token — simple from the client's perspective
- Centralised credential management — administrators configure credentials once
- End users do not need to know about individual app credentials

**Disadvantages**
- Apps receive platform credentials rather than user-specific tokens — individual user identity is lost at the app level
- If platform credentials are compromised, all tenants using those apps are affected
- Audit logs at the app level will not reflect individual users

**Best suited for:** Apps that support API keys or service accounts, and internal tooling where per-user audit trails at the app level are not a requirement.

---

### Option 3 - Token Exchange via SSO (Microsoft / Okta)

**How it works**

All apps and the platform trust a common enterprise identity provider such as Microsoft Azure AD or Okta. The AI client sends one Microsoft or Okta token to the platform. The platform exchanges this master token with each app's authentication server to obtain an app-specific token for that user. Each app issues its own token after verifying the enterprise identity.

```
AI client sends:  Microsoft Azure AD token for User 2762

Platform calls Kronos auth:  "User 2762's Microsoft token → issue Kronos token"
Platform calls Jira auth:    "User 2762's Microsoft token → issue Jira token"
Platform calls Slack auth:   "User 2762's Microsoft token → issue Slack token"

Each app returns a token → platform uses the correct one per tool call
```

**What needs to be built**
- Each app must expose a token exchange endpoint that accepts the enterprise identity token and returns an app-specific token
- The platform calls these exchange endpoints on SSE connection and stores all returned tokens in the session
- Each app's authentication server must be configured to trust the same enterprise identity provider

**Advantages**
- The AI client only needs one token — the enterprise login credential the user already has
- Full user identity is preserved at every app level
- Centralised identity management — adding or removing an employee propagates automatically across all apps
- The most secure and enterprise-grade approach

**Disadvantages**
- Requires all apps to implement a token exchange endpoint
- Requires all apps to be integrated with the same enterprise identity provider
- Significant infrastructure investment upfront

**Best suited for:** Enterprise deployments where all apps are already integrated with a common SSO provider, and the platform is scaling to serve many apps and many tenants.

---

## Client Authentication Design

### Company-Deployed Agent (Type 1)

The company's engineering team registers their agent on the MCP Platform and receives an API key. The agent is deployed server-side with that key configured. When an employee uses the company chatbot, the agent connects to the MCP Platform using the API key to prove that the agent is authorised. The employee's own Kronos JWT is passed per tool call to identify the individual user.

```
SSE connect    → API key (proves the company's agent is authorised)
POST /messages → employee's Kronos JWT (identifies the individual user)
```

This separation works cleanly because the agent is a trusted server-side component owned and managed by the company. The API key establishes agent-level trust; the employee's token establishes user-level trust.

**What needs to be built (simpler - recommended first)**
- `agent_keys` table in the database (tenant, hashed API key, agent name)
- Admin endpoint to generate and revoke API keys per tenant
- SSE connection validates the API key rather than the Kronos JWT
- POST `/messages` extracts and validates the employee's Kronos JWT per request

---

### Individual User via Claude Desktop (Type 2)

An individual employee adds the MCP Platform URL to Claude Desktop and connects directly - there is no company-built agent in between. Claude Desktop follows the OAuth 2.0 standard for MCP server authentication. It does not accept a raw token; it expects a complete browser-based login flow.

**Why the API key approach does not work here**
- The user is not a developer and has no platform account to obtain an API key from
- Claude Desktop provides no UI field for entering a Bearer token manually
- Claude Desktop implements the OAuth 2.0 specification for MCP - this is a requirement of the client, not a design choice that can be bypassed

**The OAuth 2.0 flow for Claude Desktop**

```
1. Employee adds MCP URL in Claude Desktop settings

2. Claude calls the OAuth discovery endpoint:
   GET /.well-known/oauth-authorization-server
   ← Platform returns: login URL, token URL, client metadata

3. Claude opens a browser, redirecting the employee to the login page:
   GET /oauth/authorize?client_id=claude&redirect_uri=...

4. Employee logs in with their Kronos credentials

5. Claude exchanges the authorisation code for a platform token:
   POST /oauth/token { code, client_id, client_secret }
   ← Platform returns: { access_token, refresh_token }

6. Claude uses the platform access token on all subsequent SSE and POST requests

7. The platform maps the platform access token back to the employee's Kronos JWT internally
```

**What needs to be built (more complex - recommended second)**
- OAuth 2.0 authorisation server endpoints (discovery, authorize, token)
- Login page where employees enter their Kronos credentials
- Platform-issued short-lived access tokens and refresh tokens
- Mapping table: `platform_token → employee's Kronos JWT`

---

### Comparison

| | Company-Deployed Agent | Claude Desktop (Individual User) |
|---|---|---|
| Who connects | Company's server-side agent | Individual employee directly |
| Credential management | Company's engineering team | The employee themselves |
| Credential type | API key | OAuth 2.0 tokens via browser login |
| Employee involvement in auth | None - agent handles it | Full - employee logs in via browser |
| Platform account required | Yes - company registers their agent | No - employee uses their company credentials |
| Token per user | Passed per tool call | Issued by platform after OAuth login |
| Recommended build order | First | Second |

---

## OAuth 2.0 Endpoints in Detail

The following five endpoints must be implemented to support individual users connecting via Claude Desktop.

---

### 1. `GET /.well-known/oauth-authorization-server`

A static discovery document. Any OAuth 2.0 client - including Claude Desktop - calls this endpoint automatically after receiving a `401` response. It returns the locations of all other auth endpoints.

```json
{
  "issuer": "https://yourmcp.com",
  "authorization_endpoint": "https://yourmcp.com/oauth/authorize",
  "token_endpoint": "https://yourmcp.com/oauth/token",
  "registration_endpoint": "https://yourmcp.com/oauth/register",
  "scopes_supported": ["mcp"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"],
  "code_challenge_methods_supported": ["S256"]
}
```

No logic required - this is a static JSON response that tells clients where your other OAuth endpoints are.

---

### 2. `POST /oauth/register`

Dynamic Client Registration. The AI client calls this endpoint to register itself with the platform before initiating the OAuth flow. The platform assigns a `client_id` and `client_secret` that the client will use throughout the flow.

**Request**
```json
{
  "client_name": "Claude Desktop",
  "redirect_uris": ["claude://oauth/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

**Response**
```json
{
  "client_id": "claude_client_abc",
  "client_secret": "secret_xyz",
  "client_name": "Claude Desktop",
  "redirect_uris": ["claude://oauth/callback"]
}
```

**Platform responsibility:** Generate and store `client_id` and `client_secret` in the `oauth_clients` table. Return the registration details to the client.

---

### 3. `GET /oauth/authorize`

The authorisation endpoint. This is what opens the login UI for the employee. The AI client redirects the employee's browser to this URL with the appropriate parameters.

**Parameters received (as URL query parameters)**
```
response_type=code
client_id=claude_client_abc
redirect_uri=claude://oauth/callback
scope=mcp
state=random_string_xyz
code_challenge=hashed_value
code_challenge_method=S256
```

**Platform responsibility**
1. Display a Kronos login form (username and password, or SSO option)
2. Validate the employee's credentials against the Kronos login API
3. On success, generate a one-time `auth_code`
4. Store a mapping: `auth_code → { kronos_jwt, client_id, redirect_uri, code_challenge }`
5. Redirect the employee back to the client:

```
claude://oauth/callback?code=auth_code_123&state=random_string_xyz
```

The `state` parameter must be returned exactly as received — the client uses it to verify the response belongs to its original request.

---

### 4. `POST /oauth/token` — Authorisation Code Grant

The token exchange endpoint. After receiving the authorisation code, the AI client calls this endpoint server-to-server to exchange it for a platform access token.

**Request**
```
grant_type=authorization_code
code=auth_code_123
redirect_uri=claude://oauth/callback
client_id=claude_client_abc
client_secret=secret_xyz
code_verifier=original_random_value
```

**Platform responsibility**
1. Validate `client_id` and `client_secret`
2. Look up `auth_code_123` in the database
3. Verify the PKCE challenge: `SHA256(code_verifier) === stored code_challenge`
4. Confirm `redirect_uri` matches the registered value
5. Retrieve the Kronos JWT stored against this auth code
6. Generate an MCP access token and refresh token
7. Store the session in `oauth_sessions` (see database schema below)
8. Delete the used auth code — auth codes are single-use
9. Return the token response

**Response**
```json
{
  "access_token": "mcp_token_xyz",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_abc"
}
```

---

### 5. `POST /oauth/token` - Refresh Token Grant

Same endpoint, different grant type. Used to silently renew the MCP access token when it expires, without requiring the employee to log in again.

**Request**
```
grant_type=refresh_token
refresh_token=refresh_abc
client_id=claude_client_abc
client_secret=secret_xyz
```

**Platform responsibility**
1. Validate the `refresh_token` - confirm it exists and has not expired
2. Check whether the Kronos JWT stored in the session is still valid:
   - Still valid → issue a new MCP access token and a new refresh token
   - Expired → return `401`, employee must log in again
3. Return the new token pair

---

## Database Schema for OAuth

```
oauth_clients
  client_id
  client_secret         ← hashed
  client_name
  redirect_uris         ← JSONB array
  created_at

oauth_auth_codes
  code                  ← single-use
  client_id
  kronos_jwt            ← temporary storage only
  user_sub
  connection_id
  code_challenge        ← for PKCE verification
  redirect_uri
  expires_at            ← short-lived, 5–10 minutes
  used_at               ← marked used, never reused

oauth_sessions
  mcp_access_token
  refresh_token
  client_id
  connection_id
  user_sub
  kronos_jwt            ← encrypted at rest
  kronos_jwt_expires
  expires_at
  created_at
```

---

## Agent Types and Their Flows

### Agent Type 1 - Claude Desktop

**First connection (one-time)**

1. Employee adds the MCP Platform URL in Claude Desktop settings
2. Claude calls the OAuth discovery endpoint
3. Claude registers as a client and receives `client_id` and `client_secret`
4. Claude opens a browser login popup; employee logs in with Kronos credentials
5. Platform issues an auth code; Claude exchanges it for an MCP access token
6. Platform stores the Kronos JWT against the session (encrypted)
7. Popup closes; Claude proceeds with the original tool call

**Every subsequent request**

```
Employee → Claude → MCP Platform
                      → Validates MCP access token
                      → Identifies employee from session
                      → Retrieves and decrypts Kronos JWT from database
                      → Calls Kronos MCP Server with token
                      → Returns result
                      → Audit log written
                      → Token discarded from memory
```

**Token expiry**
- *Access token expires (~1 hour):* Platform silently refreshes using the stored refresh token and retries — employee notices nothing
- *Refresh token expires (~30–90 days):* Platform returns a re-authentication signal; Claude prompts the employee to reconnect — takes approximately 30 seconds

**Key constraint:** Claude Desktop has no persistent storage outside of the platform. The Kronos JWT must be stored in the platform database. If the platform database is compromised, these tokens are at risk. This is an inherent limitation of this client type.

---

### Agent Type 2 - Thor (Company-Built Custom Chatbot)

**Setup (one-time, done by the engineering team)**

The company registers Thor with the MCP Platform via an admin endpoint and receives an `agent_id` and `agent_secret`. Thor stores these credentials in its own configuration.

**First connection per user**

1. Employee logs into Thor using their company credentials; Thor holds a company-issued JWT
2. Employee asks a question; Thor calls the MCP Platform with the agent JWT and the employee's identity
3. Platform detects no existing Kronos connection for this employee — returns `auth_required` with a login URL
4. Thor shows the employee a "Connect Kronos" button
5. Employee clicks; browser opens the MCP Platform login page; employee logs into Kronos
6. Platform receives the Kronos token, encrypts it into a **sealed blob**, and sends the sealed blob to Thor via SSE
7. Thor stores the sealed blob in its own database against the employee's identity
8. The platform immediately discards the real token from memory

**Every subsequent request**

```
Employee → Thor → MCP Platform
                    Authorization: Bearer <thor-agent-jwt>
                    X-User-Identity: john@company.com
                    X-Connection-Token: <sealed_blob>

Platform:
  → Validates thor-agent-jwt
  → Decrypts sealed blob → recovers employee's Kronos JWT
  → Calls Kronos MCP Server with real token
  → Discards real token from memory immediately
  → Returns result + updated sealed blob (if token was refreshed)

Thor:
  → Updates stored sealed blob if it changed
  → Returns result to employee
```

**Key advantage:** The platform stores **nothing** sensitive. The sealed blob in Thor's database is unreadable without the platform's master decryption key — if Thor's database is compromised, the blobs are useless to an attacker.

---

### Agent Type 3 — External Company's Chatbot

The flow is identical to the Thor flow. The difference is organisational — it is a different company's system integrating with the platform rather than an internal tool.

The external company registers their agent, receives an `agent_id` and `agent_secret`, and implements the same minimal integration:

1. Send agent credentials on every request
2. Handle `auth_required` — open the login URL in a popup
3. Handle `reauth_required` — show the user a reconnect button
4. If using agent-side token storage — store and resend the sealed blob per user

No changes are required to the external company's existing authentication system or backend APIs.

---

## Token Storage Decision Matrix

| Situation | Storage Mode | Reason |
|---|---|---|
| Claude Desktop as the client | Platform stores tokens | No alternative - Claude has no persistent storage |
| Thor or internal company chatbot | Agent stores sealed blobs | More secure; platform holds nothing sensitive |
| External enterprise company | Agent stores sealed blobs | Compliance requirement |
| External small company | Platform stores tokens | Lower integration effort |
| Company that refuses any code changes | Cannot integrate | Unavoidable - some integration work is required on any platform |

---

## Security Model

**Platform-mode storage (for Claude Desktop)**
- Kronos JWTs are encrypted with AES-256 before being written to the database
- The encryption key is stored in a secrets manager, not in the database
- A database breach alone is not sufficient to access real tokens — the secrets manager key is also required

**Agent-mode storage (for Thor and external agents)**
- The platform stores no real tokens at all
- Sealed blobs stored in the agent's database are unreadable without the platform's master key
- In memory: the real token exists only for the duration of a single API call and is discarded immediately afterward

---

## Known Limitations

**Fundamental constraints (cannot be fully resolved)**
- Claude Desktop forces token storage on the platform - there is no way to avoid this given Claude's architecture
- Agents that refuse to make any code changes cannot be integrated
- If both the platform database and the secrets manager are breached simultaneously in platform-mode, tokens are exposed
- Users must reconnect every 30-90 days when their refresh token expires
- Every new connected application requires a one-time OAuth registration in that application's developer portal

**Design constraints (can be improved in future iterations)**
- If the platform goes down, all agents lose access to their connected tools
- The secrets manager is a single point of failure for token decryption
- Token refresh failures require retry logic and error handling
- Sealed blobs grow in size as users connect more applications

**Compliance constraints**
- Platform-mode token storage may not satisfy GDPR requirements for certain organisations — a self-hosted deployment option addresses this
- Some enterprises require on-premise deployment
- Audit logs contain user identity and require a data retention policy

---

## Summary

| | Claude Desktop | Thor (Internal Agent) | External Agent |
|---|---|---|---|
| Token stored by | MCP Platform | Thor's database (sealed blob) | Their database (sealed blob) |
| Code changes required | None | Minimal (MCP client integration) | Minimal (MCP client integration) |
| Security level | Moderate | High | High |
| Enterprise-friendly | No | Yes | Yes |
| Platform stores real token | Yes | No | No |
| Permissions enforced by | Kronos API | Kronos API | Kronos API |
| User reconnect frequency | Every 30-90 days | Every 30-90 days | Every 30-90 days |

**Recommended build order:**
1. **Company-deployed agent flow first** - simpler to implement, covers the primary use case, and delivers a working end-to-end product faster
2. **OAuth 2.0 flow for individual Claude Desktop users second** - correct long-term direction, but significant additional infrastructure; treat as a separate phase once the agent flow is stable
