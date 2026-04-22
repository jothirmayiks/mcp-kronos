# Onboarding Overview

## What Does Onboarding Mean?

Onboarding is the process of registering a new company (tenant) on the MCP Platform so their users can access their data through AI agents.

It has five steps:

```
Step 1 - Register the company
         Create a tenant record with name, slug, and contact info

Step 2 - Connect their APIs
         Provide the base URL of their backend APIs
         Map each tool to their specific endpoint

Step 3 - Configure auth
         Provide JWKS URI, shared secret, or discuss alternatives

Step 4 - Activate tools
         Define and enable tools based on their system's capabilities

Step 5 - Test and go live
         Verify tool calls return correct data
         Enable write tools deliberately after validation
```

---

## Who Does the Onboarding?

In the current phase, onboarding is done **manually by the platform team**. There is no self-service portal yet.

| Phase | Onboarding method |
|---|---|
| Now (MVP) | Platform team does it manually via admin endpoints |
| Future | Self-service developer portal where companies register themselves |

---

## What the Company Needs to Provide

| Information | Example | Why needed |
|---|---|---|
| Company name | "Acme Corp" | Display name in the platform |
| Slug | "acme" | Used in routing and logs |
| API base URL | https://api.acme.com/v1 | Where the platform calls their APIs |
| Auth method | JWKS or HS256 | How their JWTs are signed |
| JWKS URI or secret | depends on auth method | To validate their JWTs |
| Token issuer | https://auth.acme.com | To identify this tenant from the JWT iss claim |
| Role claim name | roles or authorities | Where roles are stored in their JWT |
| Role values | EMPLOYEE, MANAGER | What role names they use |

---

## What the Company Does NOT Need to Do

- Change their existing backend
- Install any library or agent
- Create new API endpoints
- Change their authentication system
- Write any MCP code

Their existing systems stay exactly as they are. The platform adapts to them.

---

## Onboarding Checklist

- [ ] Collect all required information
- [ ] Create tenant record via admin endpoint
- [ ] Configure adapter - map tools to their API endpoints
- [ ] Configure auth - JWKS URI or shared secret
- [ ] Activate read tools
- [ ] Test each read tool with a real JWT from their system
- [ ] Verify data returns correctly and sensitive fields are excluded
- [ ] Confirm audit log entries are tagged with correct tenant
- [ ] Activate write tools only after explicit sign-off
- [ ] Document any quirks of their API
