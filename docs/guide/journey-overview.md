# Implementation Journey

## Overview

This section documents the actual implementation path taken to build and evolve the Kronos MCP integration - from initial planning through to the current state of the platform. Each stage reflects a real phase of work, with decisions, trade-offs, and changes that built on what came before.

The journey moves through four stages:

---

## Stage 0 - Planning Phase

**What it is:** The architectural design and planning work that preceded any implementation.

This covers the overall MCP Platform design: the multi-tenant model, the adapter pattern, how tenant isolation works, the role of the tool registry, and the phased implementation plan. This documentation describes the system as it was designed to be - the foundation for everything that follows.

**Key outputs:** Platform architecture, tenant model, tool design, phased implementation plan (Phase 1-3)

→ See [Introduction](/guide/introduction), [Architecture](/guide/architecture), [Implementation Timeline](/guide/timeline)

---

## Stage 1 - Kronos MCP Server

**What it is:** The first working implementation - a standalone Python MCP server built specifically for Kronos.

Before building the full platform, a dedicated MCP server was built to validate the end-to-end flow: AI client → MCP server → Kronos API. At this stage, authentication was handled by embedding the Kronos JWT directly in the server's environment configuration. The server ran as a single-user service and exposed twelve Kronos tools via the MCP protocol.

**Key characteristics:**
- Credentials configured in `.env` (`KRONOS_JWT`)
- Single user context - one JWT for all requests
- No platform layer - the AI client connects directly to this server
- Twelve tools across three categories: User Directory, Time Reports, Projects

→ See [Stage 1 - Kronos MCP Server](/guide/stage-1-kronos-server)

---

## Stage 2 - Platform Integration and Auth Refactor

**What it is:** The integration of the Kronos MCP Server with the MCP Platform, and the removal of all server-side credential storage.

Once the standalone server was validated, it was connected to the MCP Platform. This required rethinking authentication completely: the server no longer holds any user credentials. Instead, the platform authenticates each user and forwards their Kronos JWT to the server on every request via HTTP headers. The server reads the token from the incoming request, uses it for that call, and discards it.

**Key changes:**
- `KRONOS_JWT` removed from `.env` - the server holds zero credentials
- `src/dependencies.py` introduced - extracts user token from request headers per call
- Every tool calls `get_kronos_context()` to get the current user's token
- `service_url` added as a per-request parameter - supports multi-tenant routing
- Server instructions no longer reference a hardcoded user - identity is per-request

→ See [Stage 2 - Platform Integration and Auth Refactor](/guide/stage-2-platform-auth)

---

## Stage 3 - Login Flow Design

**What it is:** The design and evaluation of authentication strategies at the MCP Platform entry point.

With the platform and server integrated, the next challenge is how users authenticate with the MCP Platform itself - particularly as the platform grows to support multiple apps per tenant. This stage covers the design of multi-app token strategies, the distinction between company-deployed agents and individual Claude Desktop users, the full OAuth 2.0 flow for individual users, and the token storage model for each client type.

**Key topics:**
- Multi-app token strategy - three options evaluated
- Two client types: company-deployed agents vs. individual Claude Desktop users
- OAuth 2.0 endpoints required for Claude Desktop integration
- Agent flow design for Claude, internal agents (Thor), and external company chatbots
- Token storage: platform-side vs. agent-side sealed blobs
- Security model and known limitations

→ See [Stage 3 - Login Flow Design](/guide/stage-3-login-flow)

---

## At a Glance

| Stage | What Changed | Auth Model |
|---|---|---|
| Planning | Architecture and design decisions | — |
| Stage 1 | Standalone Kronos MCP Server | JWT hardcoded in `.env` |
| Stage 2 | Platform integration, server becomes stateless | JWT per request from platform headers |
| Stage 3 | Platform-level auth design | OAuth 2.0 for users; API key for agents |
