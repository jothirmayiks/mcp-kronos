# Introduction

## What is Kronos MCP?

**Kronos** is our internal employee management platform. Three core data domains:

- **User Directory** — employee profiles, org structure, contact info, reporting lines
- **Time Report** — timesheet logging and reporting per project and employee
- **Skills** — employee skill tags, proficiency levels, and endorsements

**Kronos MCP** is a new, thin **Spring Boot microservice** that wraps these three modules and exposes them as an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server. This makes Kronos data and workflows accessible to AI agents without modifying the existing Kronos backend (Play framework).

---

## Why MCP?

Today, if an engineer wants to build an AI assistant that answers "Which employees in the Build team have React skills and are currently on the bench?", they have to write custom integration code for every tool they build. MCP solves this by providing a **universal, discoverable protocol** between AI models and data sources.

Think of it like this:

> **MCP is USB-C for AI integrations.** Just as USB-C replaced a dozen different cables, MCP replaces bespoke connectors with a single standard that any MCP-aware AI client can use.

Once Kronos MCP is live, any MCP-compatible AI client can discover and use Kronos capabilities without writing new integration code.

---

## What Kronos MCP Is NOT

It is important to be clear about boundaries:

| ✅ What it is | ❌ What it is not |
|---|---|
| A thin adapter in front of existing Kronos APIs | A replacement for the Kronos backend |
| A standard MCP server with tool definitions | A REST API for direct consumption |
| A secure, auditable AI gateway | A way to bypass existing auth |

---

## Key Design Principles

1. **Non-invasive** - The existing Kronos Play backend is untouched. The MCP server calls it as a privileged internal client.
2. **Auth-preserving** - Kronos JWTs are reused where possible. No new identity system is invented unnecessarily.
3. **Incrementally safe** - Write tools are feature-flagged off by default. You can deploy in read-only mode and enable writes deliberately.
4. **Fully audited** - Every tool invocation is logged with user, tool name, arguments, and outcome.
5. **Role-aware** - The MCP server enforces the same permission rules as the Kronos backend, not just proxies requests blindly.
