# Introduction

## What is the MCP Platform?

The **MCP Platform** is a **Model Context Protocol as a Service** framework. It allows any company to connect their existing backend systems to AI agents - without rebuilding their APIs, without changing their auth, and without writing MCP server code from scratch.

The platform sits between AI clients (like Claude) and company backends. It handles all the MCP protocol complexity, security, and routing. Companies just register their APIs and define which tools to expose.

---

## The Problem It Solves

Every company that wants to give AI agents access to their data today has to:

1. Learn the MCP protocol
2. Build a custom MCP server
3. Wire it to their backend APIs
4. Implement auth, rate limiting, audit logging
5. Maintain it forever

This is expensive, repetitive, and most companies do not have the expertise. The MCP Platform solves this by doing all of that once, as a shared service.

---

## How It Works

A company registers with the MCP Platform and provides their API endpoints and auth configuration. The platform stores this as a **tenant profile**. When one of their users logs in via their existing system and gets a JWT, they pass that JWT to the MCP Platform. The platform validates it against the company's own auth server, identifies which tenant this is, and routes tool calls to the correct company APIs - returning structured results to the AI agent. The company's users only ever see their own data. Nothing is shared across tenants.

---

## Key Concepts

| Term | Meaning |
|---|---|
| Tenant | A company registered on the MCP Platform |
| Adapter | The per-tenant config that maps a company's APIs to MCP tools |
| Tool | A callable function the AI agent can invoke to get data or perform an action |
| Tool Activation | A tenant choosing which tools to enable |
| Auth Delegation | Using the tenant's own JWT or SSO to authenticate their users |

---

## What the MCP Platform Is NOT

| It is | It is not |
|---|---|
| A multi-tenant MCP gateway | A replacement for any company's backend |
| A configurable tool layer per tenant | A no-code API builder |
| A secure, auditable AI layer | A way to share data between companies |
| Generic - works for any company's system | An HR-only or Kronos-only tool |

---

## Kronos - The Reference Client

Kronos (our internal employee management platform) is **Client #1** on the MCP Platform. It was the first system connected, and every pattern - tool design, auth delegation, role enforcement, audit logging - was proven with Kronos before being offered to other companies.

This means:
- If you want to understand how the platform works, study the Kronos integration
- If you are onboarding a new company, the Kronos adapter is your reference
- Kronos will always be the first to test new platform features

See [Kronos as Client #1](/guide/kronos-overview) for the full Kronos-specific documentation.

---

## Design Principles

1. **Non-invasive** - Companies do not change their existing backends. The platform calls their APIs as an external client.
2. **Auth-preserving** - No new identity system. Each company's existing JWT or SSO is reused.
3. **Incrementally safe** - Write tools are off by default. Companies enable them deliberately.
4. **Fully isolated** - One tenant's data is never accessible to another tenant, at any layer.
5. **Fully audited** - Every tool call is logged with tenant, user, tool, arguments, and outcome.
6. **Generic by design** - Tools are defined per tenant. Any company's API can be connected, not just HR platforms.
