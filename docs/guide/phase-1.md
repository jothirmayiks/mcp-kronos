# Phase 1 — User Directory

## Goal

Deploy a working MCP server to the **dev environment** with two read tools and one write tool (feature-flagged off) for the User Directory module.

By the end of Phase 1, a developer should be able to open Claude Desktop, ask "Find everyone in the Berlin engineering team", and get a real response from the Kronos User Directory.

---

## Scope

| Tool | Type | Included in Phase 1 |
|---|---|---|
| `search_employees` | Read | ✅ |
| `get_employee` | Read | ✅ |
| `update_employee_status` | Write (flagged) | ✅ (disabled by default) |

---

## Task Breakdown

### Step 1 — Foundation (prerequisite, ~5.5 days)

See [Timeline Overview](/guide/timeline) for the full foundation task list. This must be complete before Step 2 begins.

---

### Step 2 — Stub tool with hardcoded data (Day 1)

Before connecting to real Kronos data, implement `search_employees` with a hardcoded stub response. This validates the MCP server is running and discoverable before introducing the complexity of real API calls.

**Deliverable:** Claude Desktop can ask "What tools do you have?" and see `search_employees`. Asking "Find someone named Anna" returns a stubbed employee record.

**Checklist:**
- [ ] `search_employees` tool defined with correct description and schema
- [ ] Returns hardcoded `List<EmployeeSummary>` with 2–3 sample records
- [ ] MCP server starts, `/mcp/sse` responds
- [ ] Claude Desktop config updated, tool visible in new conversation

**Estimated effort:** 0.5 day

---

### Step 3 — Connect to real Kronos User Directory API (Day 2–3)

Replace the stub with real calls to the Kronos Play API endpoint.

**Deliverable:** `search_employees` returns live data from the Kronos employee database.

**Checklist:**
- [ ] `EmployeeServiceClient` implemented (Feign or RestTemplate)
- [ ] Calls `GET /api/employees?q={query}&limit={limit}` on the Play backend
- [ ] Response mapped to `EmployeeSummary` DTO (sensitive fields excluded)
- [ ] `get_employee` tool implemented, calls `GET /api/employees/{id}`
- [ ] End-to-end test: Claude Desktop query returns real employee data

**Estimated effort:** 1.5 days

---

### Step 4 — Add JWT auth and role checks (Day 3–4)

Wire the JWT filter and add tool-level authorization to `get_employee`.

**Deliverable:** Unauthorized requests are rejected. Employees can only see their own profile unless they have MANAGER or HR_ADMIN role.

**Checklist:**
- [ ] JWKS URI configured, JWT filter active on all endpoints
- [ ] `SecurityContext` populated on each request
- [ ] `get_employee` enforces read access rules
- [ ] Test with expired token → 401
- [ ] Test with valid EMPLOYEE token requesting another employee's profile → tool error
- [ ] Test with valid MANAGER token requesting a team member's profile → success

**Estimated effort:** 1 day

---

### Step 5 — Add write tool (flagged off) + audit log (Day 4–5)

Implement `update_employee_status` with the feature flag check. Verify audit logging captures all invocations.

**Deliverable:** `update_employee_status` is implemented, blocked by the feature flag, and every tool invocation appears in the audit log.

**Checklist:**
- [ ] `update_employee_status` implemented with status allowlist validation
- [ ] Feature flag check at top of write tools
- [ ] AuditAspect confirmed to log: user, tool name, args, outcome, duration
- [ ] Test: call write tool with flag off → graceful error, still logged
- [ ] Test: enable flag in dev, call write tool → success, logged

**Estimated effort:** 1 day

---

### Step 6 — Deploy to dev (Day 5)

Package and deploy the MCP server to the dev environment.

**Checklist:**
- [ ] Application packaged as a fat JAR
- [ ] Environment variables configured for dev (JWKS URI, Play API base URL)
- [ ] Server starts and is reachable from dev network
- [ ] Smoke test: `search_employees` returns live data in dev
- [ ] Audit log is writing to the correct database table in dev

**Estimated effort:** 0.5 day

---

## Phase 1 Completion Criteria

Phase 1 is done when:

1. ✅ `search_employees` returns real Kronos employee data
2. ✅ `get_employee` enforces role-based read access
3. ✅ `update_employee_status` is implemented and gated behind the feature flag
4. ✅ Every tool call is logged in the audit table
5. ✅ Server is deployed and running in the dev environment
6. ✅ A team member can demo the tools via Claude Desktop against dev

---

## Total Phase 1 Effort

| Work | Effort |
|---|---|
| Foundation (shared) | 5.5 days |
| Stub tool | 0.5 day |
| Real API connection | 1.5 days |
| Auth + role checks | 1 day |
| Write tool + audit | 1 day |
| Deploy to dev | 0.5 day |
| **Total** | **~10 days** |

> Foundation days are shared across all phases — they are not repeated in Phase 2 and 3 estimates.
