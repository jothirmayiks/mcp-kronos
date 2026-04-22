# Phase 3 - Multi-Tenant Ready

## Goal

Prove the platform is truly reusable by onboarding a second company. By the end of Phase 3, a second tenant is live on dev using the same platform infrastructure as Kronos - with zero changes to the core platform code. Only adapter config and response mappers are new.

Prerequisite: Phase 2 complete and deployed to dev.

---

## Why This Phase Matters

Phase 2 proves the platform works for Kronos. Phase 3 proves the platform works as a service - that onboarding a second company is a configuration exercise, not a development project.

If Phase 3 requires significant new platform code to support the second tenant, that is a signal the adapter pattern needs to be redesigned. Phase 3 is as much a validation of the architecture as it is a feature delivery.

---

## Scope

| Task | Included |
|---|---|
| Second tenant registered and auth configured | Yes |
| Adapter config for their available modules | Yes |
| Any new response mappers needed | Yes |
| Read tools tested and active | Yes |
| Onboarding checklist validated end-to-end | Yes |
| Onboarding documentation updated with lessons learned | Yes |

---

## Task Breakdown

### Step 1 - Choose and prepare the second tenant (Days 1-2)

Select a second company or internal system to onboard. Even one module is enough to validate the pattern.

- [ ] Second tenant identified and agreed
- [ ] Required information collected (API base URL, auth method, role names)
- [ ] Network access from MCP Platform to their API confirmed
- [ ] A test JWT from their system obtained

Effort: 1.5 days

---

### Step 2 - Register tenant and configure auth (Days 2-3)

- [ ] Tenant record created via admin endpoint
- [ ] Auth method configured (JWKS or HS256)
- [ ] Role mapping configured
- [ ] Test: their JWT validates correctly
- [ ] Test: their JWT cannot access Kronos tools

Effort: 1 day

---

### Step 3 - Register adapters and mappers (Days 3-6)

- [ ] Adapter endpoint templates registered for each tool
- [ ] Response mappers implemented (reuse built-in or write custom)
- [ ] Each adapter tested via admin test endpoint
- [ ] No changes needed to core platform code - only config and mappers
- [ ] If core platform changes were needed, document the gap and fix it

Effort: 3 days

---

### Step 4 - Activate tools and end-to-end test (Days 6-7)

- [ ] Read tools activated for second tenant
- [ ] End-to-end: AI agent with second tenant JWT can query their data
- [ ] Second tenant cannot see Kronos data
- [ ] Kronos cannot see second tenant data
- [ ] Audit log entries correctly tagged with second tenant slug

Effort: 1.5 days

---

### Step 5 - Retrospective and documentation update (Days 7-8)

- [ ] Retrospective held with team
- [ ] Did onboarding require any core platform changes?
- [ ] Was the adapter config sufficient or did we need custom code?
- [ ] How long did onboarding actually take vs estimate?
- [ ] Onboarding documentation updated with lessons learned
- [ ] Onboarding time recorded as a benchmark

Effort: 1 day

---

### Step 6 - Deploy to dev (Day 8)

- [ ] Platform redeployed with second tenant config
- [ ] Both tenants verified working simultaneously on dev
- [ ] No cross-tenant data leakage confirmed

Effort: 0.5 day

---

## Phase 3 Completion Criteria

1. Second tenant is live on dev alongside Kronos
2. Onboarding required zero changes to core platform code
3. Tenant isolation verified - no cross-tenant data access
4. Onboarding documentation updated and accurate
5. Onboarding time benchmarked for future reference

Total Phase 3 effort: ~8 days

---

## After Phase 3 - What's Next?

| Task | Description |
|---|---|
| Security review | External review of auth, isolation, rate limits |
| Staging deployment | Full integration test with real tenant data |
| Write tool sign-off | Explicit decision per tenant before enabling |
| Production deployment | Planned rollout with monitoring |
| Self-service onboarding portal | Future - companies register themselves |

---

## Full Project Summary

| Phase | Effort |
|---|---|
| Foundation | 2.5 days |
| Phase 1 - Core Platform | 12 days |
| Phase 2 - Kronos as Client #1 | 10 days |
| Phase 3 - Multi-Tenant Ready | 8 days |
| **Total to dev** | **~32 days** |
