# Activating Tools

## How Tool Activation Works

After registering a company and configuring their adapters, you activate the specific tools they want to expose. A tool is only available to a tenant if it is activated and its adapter config is registered.

---

## Activating a Tool

```http
POST /admin/tenants/{tenantId}/tools
Content-Type: application/json

{
  "toolName": "search_contacts",
  "enabled": true,
  "writeEnabled": false
}
```

Repeat for each tool. Read tools can be activated immediately. Write tools require `writeEnabled: true` to be set separately after explicit sign-off.

---

## Read vs Write Tools

| Type | Default state | Requires sign-off |
|---|---|---|
| Read | Enabled at activation | No |
| Write | Disabled by default | Yes |

Write tools are off by default for every tenant. The rule is:

> Read tools can be activated at any point. Write tools require explicit sign-off after successful testing of all read tools.

---

## What the AI Model Sees Per Tenant

When an AI client connects, the platform assembles the tool manifest dynamically based on what that tenant has activated. The model only sees tools from the connected tenant.

Kronos with all tools activated:
```
search_employees, get_employee, get_time_report,
submit_timesheet_entry, get_employee_skills, search_by_skill
```

A CRM company with only read tools:
```
search_contacts, get_contact, get_deal_status
```

---

## Activation Checklist

Before activating any tool for a new tenant:

- [ ] Adapter config registered and tested
- [ ] Response mapper returns correct data with no extra sensitive fields
- [ ] Role mapping verified
- [ ] Read tool tested with a real JWT
- [ ] Audit log shows correct tenant and user on test calls

Before activating write tools:

- [ ] All read tools tested and stable
- [ ] Write adapter config tested in isolation
- [ ] Stakeholder sign-off documented
- [ ] Rollback plan in place

---

## Disabling a Tool

Tools can be disabled at any time:

```http
PATCH /admin/tenants/{tenantId}/tools/{toolName}
Content-Type: application/json

{ "enabled": false }
```

This immediately removes the tool from the tenant's manifest. No data is affected.
