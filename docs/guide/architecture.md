# Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP CLIENTS                          │
│                                                             │
│   Claude Desktop   |   Custom Chat UI   |   External App    │
└────────────┬────────────────┬────────────────┬──────────────┘
             │                │                │
             │  JWT           │  JWT           │  API Key / OAuth Token
             ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│               KRONOS MCP SERVER (Spring Boot)               │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Auth Filter │  │  Tool Layer  │  │  Audit / Rate    │   │
│  │  JWT / API   │  │  (MCP Tools) │  │  Limiter         │   │
│  │  Key / OAuth │  │              │  │                  │   │
│  └──────────────┘  └──────┬───────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
             Internal HTTP calls (privileged client)
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐
  │   Kronos    │   │   Kronos     │   │   Kronos    │
  │  User Dir   │   │  Time Report │   │   Skills    │
  │  (Play API) │   │  (Play API)  │   │  (Play API) │
  └─────────────┘   └──────────────┘   └─────────────┘
```

---

## Component Roles

### MCP Server (New - Spring Boot)

This is the new component we build. It is a **thin adapter**:

- Speaks the MCP protocol over HTTP/SSE (or stdio for Claude Desktop)
- Validates incoming credentials (JWT, API key, or OAuth token)
- Translates MCP tool calls into internal HTTP calls to Kronos Play APIs
- Enforces role-based access at the tool level
- Logs every invocation for audit

It does **not** touch the database directly. All business logic stays in the existing Kronos backend.

### Kronos Backend (Existing - Play Framework)

Completely **unchanged**. The MCP server calls it as a trusted internal client, the same way any other internal service would.

### MCP Clients (Various)

Any MCP-compatible consumer: Claude Desktop, a custom web UI, or a third-party AI agent platform. The client connects to the MCP server, asks "what tools do you have?", receives a manifest, and then calls tools based on user intent.

---

## Why a Separate Spring Boot Service?

We deliberately chose **not** to add MCP directly into the Play monolith because:

1. **Separation of concerns** — The MCP server is an AI-layer concern. Play is the business logic layer.
2. **Independent deployability** — We can deploy, scale, and roll back the MCP server without touching Kronos.
3. **Security boundary** — The MCP server is the only component exposed to external AI clients. Keeping it thin makes it easier to audit and harden.

---

## Data Flow Example

Here is what happens when Claude asks: *"Which employees in the Build team have React skills and are currently on the bench?"*

```
1. User types query in Claude Desktop

2. Claude calls search_employees(query="Build team")
   → MCP server validates JWT
   → MCP server calls GET /api/employees?q=Build+team on Play
   → Returns list of employees in the Build team

3. Claude calls get_employee_skills(employeeIds=[...], skill="React")
   → MCP server validates input
   → MCP server calls GET /api/skills?employeeIds=...&skill=React on Play
   → Returns employees with React skills

4. Claude calls get_employee_status(employeeIds=[...], status="BENCH")
   → MCP server enforces role-based access if required
   → MCP server calls GET /api/employees/status?employeeIds=...&status=BENCH on Play
   → Returns employees currently on the bench

5. Claude filters and synthesizes results
   → Identifies employees who match all three conditions (Build + React + Bench)

6. Claude responds to the user
   → Tool calls can be logged with user, tool name, arguments, and outcome for traceability
```

The model discovers capabilities, chains tool calls, and enforces the auth boundary — no hallucination, because every fact came from a real tool call.
