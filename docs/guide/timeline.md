# Implementation Timeline

## Overview

The implementation is divided into three phases:

```
Week 1-3                  Week 4-6                 Week 7-9
+-------------------+     +------------------+     +------------------+
|  Phase 1          |     |  Phase 2         |     |  Phase 3         |
|                   |     |                  |     |                  |
|  Core Platform    |---->|  Kronos as       |---->|  Multi-Tenant    |
|  Infrastructure   |     |  Client #1       |     |  Ready           |
|                   |     |                  |     |                  |
|  Deploy to Dev    |     |  Deploy to Dev   |     |  Deploy to Dev   |
+-------------------+     +------------------+     +------------------+
```

Each phase ends with a deploy to dev milestone. Production deployment is a separate gate.

---

## Phase Summary

| Phase | Focus | Duration | Key Deliverable |
|---|---|---|---|
| Phase 1 | Core platform infrastructure | 3 weeks | Multi-tenant MCP server running with no real tenant yet |
| Phase 2 | Kronos onboarded as Client #1 | 3 weeks | All Kronos tools live on dev |
| Phase 3 | Platform ready for second tenant | 3 weeks | Second company onboarded, pattern proven repeatable |

---

## Foundation Work (Before Phase 1)

| Task | Effort |
|---|---|
| Spring Boot project scaffold and MCP SDK dependency | 0.5 day |
| Database schema: tenants, tenant_adapters, tenant_tools | 1 day |
| CI/CD pipeline setup | 0.5 day |
| Dev environment setup | 0.5 day |

Foundation total: ~2.5 days

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tenant API response format differs from expected | Medium | Medium | Validate in Phase 2 with real API calls before building mappers |
| JWKS endpoint not accessible from MCP server | Low | High | Confirm network access in Phase 1 |
| Write tool causes data corruption | Low | High | Keep write flag off until Phase 2 validation |
| Second tenant onboarding reveals adapter design gaps | Medium | Medium | Phase 3 explicitly tests repeatability |

---

## Total Estimate

| | Effort |
|---|---|
| Foundation | 2.5 days |
| Phase 1 | ~12 days |
| Phase 2 | ~10 days |
| Phase 3 | ~8 days |
| **Total to dev** | **~32 days** |
