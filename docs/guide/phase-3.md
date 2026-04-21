# Phase 3 — Skills

## Goal

Extend the Kronos MCP server with Skills tools. By the end of Phase 3, anyone with access can ask "Find me a Java expert in the Berlin office" or "What skills does Anna have?" and get a grounded answer from real Kronos data.

Skills is a read-only module in the initial implementation. There are no write tools planned for Phase 3.

**Prerequisite:** Phase 1 and Phase 2 complete and deployed to dev.

---

## Scope

| Tool | Type | Included in Phase 3 |
|---|---|---|
| `get_employee_skills` | Read | ✅ |
| `search_by_skill` | Read | ✅ |

---

## Task Breakdown

### Step 1 — Implement `get_employee_skills` with stub (Day 1)

**Checklist:**
- [ ] Tool defined with correct description and schema
- [ ] Stub returns a hardcoded skill profile
- [ ] Tool discoverable alongside Phase 1 and Phase 2 tools in Claude Desktop

**Estimated effort:** 0.5 day

---

### Step 2 — Connect to Kronos Skills API (Day 1–2)

**Checklist:**
- [ ] `SkillsServiceClient` implemented
- [ ] Calls `GET /api/skills/employee/{employeeId}` on Play
- [ ] Response mapped to `EmployeeSkillProfile` DTO
- [ ] Proficiency levels normalized to `BEGINNER / INTERMEDIATE / ADVANCED / EXPERT`
- [ ] End-to-end test: "What are Anna's skills?" → real data returned

**Estimated effort:** 1 day

---

### Step 3 — Implement `search_by_skill` (Day 2–3)

This tool has slightly more complexity — optional filters for proficiency and department.

**Checklist:**
- [ ] Tool defined with optional `minProficiency` and `department` filters
- [ ] Calls `GET /api/skills/search?skill={name}&minProficiency={level}&dept={dept}&limit={n}` on Play
- [ ] `minProficiency` filter validated against allowed enum values
- [ ] `limit` capped at 50
- [ ] End-to-end test: "Find Python experts in Engineering" → real results

**Estimated effort:** 1 day

---

### Step 4 — Data quality validation (Day 3–4)

Skills data tends to have quality issues (see [Tools — Skills](/guide/tools-skills) for context). Before declaring Phase 3 complete, validate the data in dev.

**Checklist:**
- [ ] Check for skill name inconsistencies (e.g. "JS" vs "JavaScript") — document findings
- [ ] Check for null / missing proficiency levels — confirm DTO handles gracefully
- [ ] Check endorsement data — is it populated or mostly zero?
- [ ] Decide if any normalization is needed at the MCP layer, or if it's a Kronos data quality issue to address separately

**Estimated effort:** 0.5 day

---

### Step 5 — Multi-tool query testing (Day 4)

Phase 3 is the first time all three modules are live together. Test multi-tool chaining queries.

**Test scenarios:**

| Query | Tools expected to be called |
|---|---|
| "Find Java experts in Berlin and check if they logged hours last week" | `search_by_skill` → `get_time_report` for each |
| "What are the skills of everyone on Anna's team?" | `get_employee` → `get_employee_skills` for each direct report |
| "Who in my team has React skills and is currently active?" | `search_by_skill` → `get_employee` to check status |

**Checklist:**
- [ ] All three scenarios tested end-to-end in Claude Desktop
- [ ] Multi-tool responses are accurate and not hallucinated
- [ ] Response times are acceptable (< 5 seconds for 2-tool chains)

**Estimated effort:** 0.5 day

---

### Step 6 — Deploy to dev (Day 4–5)

**Checklist:**
- [ ] Full MCP server (all 3 modules) deployed to dev
- [ ] All 6 tools verified in dev against live Kronos data
- [ ] Audit log covering all 6 tools
- [ ] Rate limits tested

**Estimated effort:** 0.5 day

---

## Phase 3 Completion Criteria

1. ✅ `get_employee_skills` returns real Kronos data
2. ✅ `search_by_skill` works with all optional filters
3. ✅ Multi-tool queries (spanning Directory + Time Report + Skills) return accurate results
4. ✅ All 6 MCP tools are live in dev
5. ✅ No hallucinations in multi-step answers — every fact is tool-grounded

---

## After Phase 3 — What's Next?

After all three modules are on dev, the remaining work before production is:

| Task | Description |
|---|---|
| Security review | External review of auth implementation, API key storage, rate limits |
| Open decisions resolved | See [Open Decisions](/guide/open-decisions) |
| Staging deployment | Full integration test against staging Kronos data |
| Write tool sign-off | Explicit team decision to enable `mcp.write-tools.enabled` in staging |
| Production deployment | Planned rollout with monitoring |
| API key issuance process | Define the workflow for external app onboarding |
| OAuth infrastructure (if needed) | Depends on decision to support individual external users |

---

## Total Phase 3 Effort

| Work | Effort |
|---|---|
| Stub tool | 0.5 day |
| Real API connection | 1 day |
| `search_by_skill` | 1 day |
| Data quality validation | 0.5 day |
| Multi-tool testing | 0.5 day |
| Deploy to dev | 0.5 day |
| **Total** | **~4 days** |

---

## Full Project Summary

| Phase | Effort |
|---|---|
| Foundation | 5.5 days |
| Phase 1 — User Directory | 4.5 days |
| Phase 2 — Time Report | 5 days |
| Phase 3 — Skills | 4 days |
| **Grand Total (to dev)** | **~19 days** |
