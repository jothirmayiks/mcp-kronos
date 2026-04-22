# Phase 2 - Kronos Onboarded as Client #1

## Goal

Onboard Kronos as the first real tenant on the MCP Platform. By the end of Phase 2, all Kronos tools are live on dev, a Kronos user can query real Kronos data through an AI client, and write tools have been validated.

Prerequisite: Phase 1 complete and deployed to dev.

---

## Scope

| Task | Included |
|---|---|
| Kronos tenant registration | Yes |
| Kronos adapter config for all tools | Yes |
| Kronos response mappers | Yes |
| All read tools tested and active | Yes |
| Write tools tested (flag still off by default) | Yes |
| AI client demo working against dev | Yes |

---

## Task Breakdown

### Step 1 - Register Kronos tenant and validate auth (Days 1-2)

- [ ] Kronos tenant record created via admin endpoint
- [ ] JWKS URI and token issuer configured
- [ ] Role mapping configured
- [ ] Test: authenticate with a real Kronos JWT, TenantContext shows tenant=kronos
- [ ] Test: Kronos JWT cannot access a different tenant's tools

Effort: 1.5 days

---

### Step 2 - User Directory adapter and mappers (Days 2-4)

- [ ] search_employees adapter config registered
- [ ] get_employee adapter config registered
- [ ] update_employee_status adapter config registered (write flag off)
- [ ] kronos_employee_mapper implemented and tested
- [ ] End-to-end: "Find everyone in Berlin engineering" returns real Kronos data
- [ ] Role check: EMPLOYEE cannot fetch another employee's profile
- [ ] Role check: MANAGER can fetch team member's profile

Effort: 2 days

---

### Step 3 - Time Report adapter and mappers (Days 4-6)

- [ ] get_time_report adapter config registered
- [ ] submit_timesheet_entry adapter config registered (write flag off)
- [ ] kronos_timereport_mapper implemented and tested
- [ ] Date format handling validated (YYYY-MM-DD)
- [ ] End-to-end: "Show my hours this week" returns real Kronos data
- [ ] Write tool: enable flag in dev, submit entry, confirm it appears in Kronos UI
- [ ] Write tool: disable flag again after testing

Effort: 2 days

---

### Step 4 - Skills adapter and mappers (Days 6-7)

- [ ] get_employee_skills adapter config registered
- [ ] search_by_skill adapter config registered
- [ ] Skills mappers implemented and tested
- [ ] End-to-end: "Find Java experts in Engineering" returns real Kronos data

Effort: 1.5 days

---

### Step 5 - Multi-tool query testing and demo (Days 8-9)

Test chained queries that span multiple tools:

- [ ] "Who in Berlin engineering has React skills and logged hours last week?" returns correct chained result
- [ ] "What are Anna's skills and who does she report to?" returns correct chained result
- [ ] All responses are grounded - no hallucinated facts
- [ ] Audit log shows full chain of tool calls per conversation turn

Effort: 1.5 days

---

### Step 6 - Deploy to dev (Day 10)

- [ ] Platform redeployed with Kronos adapter configs
- [ ] All tools verified in dev against live Kronos data
- [ ] Write flag remains off in dev config

Effort: 0.5 day

---

## Phase 2 Completion Criteria

1. Kronos is registered as an active tenant
2. All read tools return real Kronos data with correct role enforcement
3. Write tools implemented, tested in isolation, and left off by default
4. Multi-tool chained queries work correctly
5. AI client demo works against dev

Total Phase 2 effort: ~10 days
