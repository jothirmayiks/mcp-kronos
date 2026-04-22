# How Tools Work

## What Is an MCP Tool?

An MCP tool is a callable function that an AI agent can invoke to get real data or perform an action. Tools are the bridge between the AI model and a company's backend systems.

Each tool has three parts:

| Part | Purpose | Example |
|---|---|---|
| Name | Unique identifier | search_contacts |
| Description | The AI model reads this to decide when to call the tool | Search the CRM for contacts by name or company |
| Schema | Defines the arguments the model must supply | query and optional limit |

The description is the most important part. A well-written description means the model calls the right tool at the right time.

---

## Tools Are Always Tenant-Specific

The MCP Platform does not ship with a fixed set of tools. Every tool is defined per tenant based on what that company's system can do.

A company with a CRM might have search_contacts, get_contact, get_deal_status.

A logistics company might have track_shipment, get_inventory_level, get_delivery_estimate.

A company with an HR platform like Kronos might have search_employees, get_time_report, get_employee_skills.

None of these are built into the platform. They are all configured at onboarding based on what the tenant's APIs expose.

---

## How the AI Model Discovers Tools

When an AI client connects with a valid JWT, the platform:

1. Identifies the tenant from the URL slug
2. Looks up which tools that tenant has activated
3. Returns a tool manifest - a list of tool names, descriptions, and schemas

The AI model reads this manifest and knows what it can do for this specific tenant. It will only call tools that are in that tenant's manifest.

---

## Read Tools vs Write Tools

| Type | What it does | Default state |
|---|---|---|
| Read | Retrieves data with no side effects | Enabled at activation |
| Write | Creates or modifies data | Disabled by default |

Write tools are disabled by default for every tenant. They must be explicitly enabled after read tools are tested and stable.

---

## Tool Lifecycle

1. **Onboarding** - Platform team defines tools based on the company's API. Read tools activated. Write tools defined but disabled.

2. **Testing** - Read tools verified with real data. Write tools tested in isolation in dev.

3. **Go-live** - Read tools live. Write tools enabled only after explicit sign-off.

4. **Ongoing** - New tools added at any time. Tools disabled instantly without code changes.
