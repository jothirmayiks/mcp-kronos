# Phase 2 — Time Report

## Goal

Extend the Kronos MCP server with Time Report tools. By the end of Phase 2, managers can ask "Did my team submit their timesheets this week?" and get a real, grounded answer. The write tool for submitting entries is implemented and can be enabled after validation.

**Prerequisite:** Phase 1 complete and deployed to dev.

---

## Scope

| Tool | Type | Included in Phase 2 |
|---|---|---|
| `get_time_report` | Read | ✅ |
| `submit_timesheet_entry` | Write (flagged) | ✅ (disabled by default) |

---

## Task Breakdown

### Step 1 — Implement `get_time_report` with stub (Day 1)

Same pattern as Phase 1: stub first, then wire to real API.

**Checklist:**
- [ ] Tool defined with correct description, schema, and date validation
- [ ] Stub returns a hardcoded time report for any input
- [ ] Confirm tool is discoverable in Claude Desktop alongside Phase 1 tools

**Estimated effort:** 0.5 day

---

### Step 2 — Connect to Kronos Time Report API (Day 1–2)

Wire the tool to the real time reporting endpoint.

**Checklist:**
- [ ] `TimeReportingClient` implemented
- [ ] Calls `GET /api/timereport/{employeeId}?from={fromDate}&to={toDate}` on Play
- [ ] Response mapped to `TimeReport` DTO
- [ ] "Leave blank for own report" shorthand works correctly (`caller.sub()` resolution)
- [ ] End-to-end test: ask "Show my hours this week" → real data returned

**Estimated effort:** 1 day

---

### Step 3 — Add MANAGER role check (Day 2–3)

`get_time_report` is the first tool with a meaningful role boundary: employees can only see their own data, managers can see their team.

**Checklist:**
- [ ] Role check implemented: non-MANAGER attempting another employee's report → clear error
- [ ] MANAGER requesting a team member's report → success
- [ ] HR_ADMIN requesting any employee's report → success
- [ ] Test all three cases with real tokens in dev

**Estimated effort:** 0.5 day

---

### Step 4 — Implement `submit_timesheet_entry` (Day 3–4)

Implement the write tool with all validations, feature-flagged off.

**Checklist:**
- [ ] Tool defined and feature-flagged
- [ ] `hours` range validation (0.5–16)
- [ ] `date` format validation (ISO date, not in the future by configurable threshold)
- [ ] `projectCode` validated against active project list from Kronos
- [ ] Always uses `caller.sub()` — cannot submit for another employee
- [ ] Test: call with flag off → graceful error
- [ ] Test: enable flag in dev, submit entry → entry appears in Kronos

**Estimated effort:** 1.5 days

---

### Step 5 — Stress test write tool in dev (Day 4–5)

Before this tool ever reaches staging, validate it thoroughly in dev.

**Checklist:**
- [ ] Submit a valid entry → confirm it appears in Kronos UI
- [ ] Submit with invalid `hours` → error, no entry created
- [ ] Submit with nonexistent `projectCode` → error from Play API surfaced correctly
- [ ] Submit the same entry twice (idempotency check) — decide: error or update?
- [ ] Audit log contains full payload for every attempt, success and failure

**Estimated effort:** 1 day

---

### Step 6 — Deploy to dev (Day 5)

Redeploy the updated MCP server to dev with both tools active.

**Checklist:**
- [ ] `get_time_report` working in dev against real data
- [ ] `submit_timesheet_entry` deployed but write flag still off in dev config
- [ ] Enable write flag, manually submit a test entry, confirm in Kronos UI
- [ ] Disable write flag again (default)

**Estimated effort:** 0.5 day

---

## Phase 2 Completion Criteria

1. ✅ `get_time_report` returns real Kronos data with correct role enforcement
2. ✅ `submit_timesheet_entry` passes all validation and stress tests in dev
3. ✅ Write tool creates real records in Kronos when the flag is enabled
4. ✅ All calls are audited
5. ✅ Manager can ask "Show me my team's hours this week" and get a real, accurate answer

---

## Open Decision Gate

Before Phase 2 is deployed to anything beyond dev, the following open decision should be resolved:

> **Are we enabling write access for external clients (API key holders)?**

If yes, the `submit_timesheet_entry` tool needs additional scope checking for API key callers. See [Open Decisions](/guide/open-decisions).

---

## Total Phase 2 Effort

| Work | Effort |
|---|---|
| Stub tool | 0.5 day |
| Real API connection | 1 day |
| Role checks | 0.5 day |
| Write tool implementation | 1.5 days |
| Dev stress testing | 1 day |
| Deploy to dev | 0.5 day |
| **Total** | **~5 days** |
