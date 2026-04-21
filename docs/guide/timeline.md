# Implementation Timeline

## Overview

The implementation is divided into three phases, each corresponding to one Kronos module. The phases are sequential — each one builds the foundation the next depends on.

```
Week 1-2          Week 3-4           Week 5-6
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│  Phase 1    │   │   Phase 2    │   │   Phase 3    │
│             │   │              │   │              │
│  User       │──►│  Time Report │──►│   Skills     │
│  Directory  │   │              │   │              │
│             │   │              │   │              │
│  Deploy to  │   │  Deploy to   │   │  Deploy to   │
│  Dev        │   │  Dev         │   │  Dev         │
└─────────────┘   └──────────────┘   └──────────────┘
```

Each phase ends with a **deploy to dev** milestone. Production deployment is a separate gate that requires:
- Stakeholder sign-off on open decisions
- Security review
- Audit log validation

---

## What All Three Phases Share

Before Phase 1 starts, the following **foundation work** must be completed. This is one-time effort that all phases build on.

| Task | Description | Effort |
|---|---|---|
| Spring Boot project scaffold | Create new repo, add MCP SDK dependency, set up CI | 0.5 day |
| JWT auth filter | Validate Kronos JWTs via JWKS endpoint | 1 day |
| SecurityContext | Thread-local holder for caller claims | 0.5 day |
| Audit log aspect | AOP-based logging for all tool calls | 1 day |
| Rate limiter | Per-user Caffeine-based token bucket | 0.5 day |
| Feature flag setup | `mcp.write-tools.enabled` config | 0.5 day |
| Internal HTTP clients | Feign or RestTemplate clients to call Play APIs | 1 day |
| Dev environment setup | Run MCP server locally, connect to Claude Desktop | 0.5 day |

**Foundation total: ~5.5 days**

---

## Summary Table

| Phase | Module | Duration | Key deliverable |
|---|---|---|---|
| Foundation | Shared infrastructure | 5–6 days | Running MCP server with auth |
| Phase 1 | User Directory | 4–5 days | `search_employees`, `get_employee` on dev |
| Phase 2 | Time Report | 5–6 days | `get_time_report`, `submit_timesheet_entry` on dev |
| Phase 3 | Skills | 4–5 days | `get_employee_skills`, `search_by_skill` on dev |
| **Total** | | **~18–22 days** | Full MCP server on dev |

Detailed breakdown for each phase is on its own page.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Play API response format differs from expected | Medium | Medium | Validate with real API calls in Phase 1 before building more tools |
| JWT JWKS endpoint not accessible from MCP server network | Low | High | Confirm network access in foundation sprint |
| Write tool causes data corruption | Low | High | Keep `mcp.write-tools.enabled=false` in prod until fully validated |
| MCP SDK version incompatibility | Low | Medium | Pin dependency version, test on Day 1 |
| Open decisions not resolved before Phase 2 | Medium | Medium | Schedule decision meeting at end of Phase 1 |
