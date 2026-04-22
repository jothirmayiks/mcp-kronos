# Phase 1 - Core Platform Infrastructure

## Goal

Build the multi-tenant MCP server foundation. By the end of Phase 1, the platform can accept MCP connections, identify tenants from JWTs, validate tokens, route tool calls via adapter configs, and log every invocation. No real tenants yet - but ready to onboard them.

---

## Scope

| Component | Included |
|---|---|
| Spring Boot project and MCP SDK | Yes |
| Database schema (tenants, adapters, tools) | Yes |
| Tenant registry and admin CRUD endpoints | Yes |
| Auth filter - tenant identification from JWT | Yes |
| JWKS cache per tenant | Yes |
| HS256 shared secret support | Yes |
| Role mapping engine | Yes |
| Adapter executor (calls tenant APIs) | Yes |
| Tool registry per tenant | Yes |
| Audit log aspect | Yes |
| Rate limiter per tenant per user | Yes |
| Write tool feature flag per tenant | Yes |
| Admin test endpoint for adapter validation | Yes |

---

## Task Breakdown

### Step 1 - Project scaffold and database schema (Days 1-2)

- [ ] Spring Boot project created, MCP SDK dependency added
- [ ] Database schema created: tenants, tenant_adapters, tenant_tools
- [ ] JPA entities: Tenant, TenantAdapter, TenantTool
- [ ] Admin CRUD endpoints for tenants
- [ ] MCP server starts, /mcp/sse endpoint responds

Effort: 2 days

---

### Step 2 - Auth filter and tenant identification (Days 3-4)

- [ ] McpAuthFilter reads JWT issuer without full validation
- [ ] Tenant looked up from issuer claim
- [ ] JWKS cache implemented (60-minute TTL)
- [ ] JWT validated against tenant JWKS
- [ ] HS256 shared secret path implemented as fallback
- [ ] TenantContext populated with tenant and caller claims
- [ ] Role mapping applied
- [ ] Test: unknown issuer returns 401
- [ ] Test: expired token returns 401
- [ ] Test: valid token populates TenantContext correctly

Effort: 2 days

---

### Step 3 - Adapter executor (Days 5-7)

- [ ] AdapterService reads adapter config for given tenant and tool
- [ ] Builds HTTP request from endpoint template and tool args
- [ ] Calls tenant API with internal auth headers
- [ ] Calls response mapper to produce standard DTO
- [ ] 4xx from tenant API returns descriptive MCP error
- [ ] 5xx from tenant API returns retryable MCP error
- [ ] Admin test endpoint working

Effort: 3 days

---

### Step 4 - Tool registry, audit log, rate limiter (Days 8-9)

- [ ] TenantToolRegistry returns only activated tools for a tenant
- [ ] MCP manifest assembled dynamically per tenant on connection
- [ ] AuditAspect logs: tenant, user, tool, args hash, outcome, duration
- [ ] TenantRateLimiter enforces per-tenant per-user limits
- [ ] Write flag check in place for all write tools

Effort: 2 days

---

### Step 5 - Deploy to dev (Days 10-11)

- [ ] Application packaged as fat JAR
- [ ] Dev environment variables configured
- [ ] Server starts in dev, /mcp/sse reachable
- [ ] Smoke test: register a test tenant, validate a real JWT, confirm tool manifest returns
- [ ] Audit log writes to dev database

Effort: 1.5 days

---

## Phase 1 Completion Criteria

1. MCP Platform starts and accepts connections
2. JWT from any registered tenant is correctly validated (JWKS and HS256)
3. Tool manifest is dynamically assembled per tenant
4. Adapter executor can call an external API and map the response
5. Every invocation is audited with tenant context
6. Platform deployed and running on dev

Total Phase 1 effort: ~11-12 days
