# Stage 1 - Kronos MCP Server

## What This Stage Covers

The first implementation phase involved building a standalone MCP server dedicated entirely to Kronos. The goal was to validate the end-to-end flow - AI client calling Kronos tools through the MCP protocol - before introducing any platform-level complexity.

Authentication at this stage was handled by embedding the Kronos JWT directly in the server's environment configuration. One server, one user context, one set of credentials. This was an intentional simplification to keep the initial scope manageable.

---

## What Is the Kronos MCP Server?

The Kronos MCP Server is a FastMCP-based HTTP server that acts as a bridge between an AI assistant (such as Claude) and the Kronos time-tracking and HR system. It exposes Kronos functionality as callable tools - structured functions the AI can invoke in response to natural language queries.

The server handles everything related to Kronos data access: routing tool calls, attaching authentication headers, parsing Kronos API responses, and returning structured results to the AI.

---

## Architecture

```
AI Client (Claude)
      │
      │  MCP Protocol (HTTP)
      ▼
FastMCP Server          ← main.py  (port 8000, path /mcp)
      │
      ├── Tools: User Directory, Time Reports, Projects
      │
      ▼
KronosClient            ← src/kronos/client.py  (async HTTP via httpx)
      │
      ▼
Kronos REST API         (authenticated via JWT)
```

The AI client and the Kronos MCP Server communicate over the MCP protocol via HTTP. The server, in turn, communicates with the Kronos REST API using an async HTTP client with JWT-based authentication.

---

## How It Works

### 1. Configuration - `.env` → `settings.py`

On startup, the server reads three required values from a `.env` file:

| Variable | Purpose |
|---|---|
| `KRONOS_BASE_URL` | The Kronos API base URL |
| `KRONOS_JWT` | A JWT token for authenticating requests to Kronos |
| `WRITE_TOOLS_ENABLED` | Safety flag — write operations are disabled unless explicitly set to `true` |

The user's numeric ID is extracted automatically from the JWT payload claims. No additional API call is needed to determine the current user.

### 2. Server Startup - `main.py`

- A `FastMCP` instance is created with a descriptive system instruction so the AI understands the available capabilities
- All tools are registered from three modules: user directory, time reports, and projects
- A Uvicorn HTTP server starts on `0.0.0.0:8000`, listening at the `/mcp` path

### 3. Tool Execution Flow

When the AI calls a tool, the following happens:

1. FastMCP routes the call to the corresponding Python function
2. The function calls `kronos_client.get()` or `kronos_client.post()` with the relevant Kronos API endpoint
3. The client attaches the JWT to the `Authorization` header and fires an async HTTP request
4. The Kronos API response is parsed - nested `responseData` and `data` fields are unwrapped automatically
5. The tool formats the result as a readable string and returns it to the AI

### 4. Write Protection

Mutating tools (`log_time_entry`, `update_time_entry`, `update_user_details`) check the `WRITE_TOOLS_ENABLED` flag before proceeding. If the flag is `false`, a `WriteProtectedError` is raised with an informative message. This makes it safe to run the server in read-only mode by default, with write access enabled deliberately.

---

## Tools Exposed

Twelve tools are exposed across three categories:

| Category | Tool | Description |
|---|---|---|
| **User Directory** | `get_all_users` | Lists all employees in the organisation |
| | `get_user_profile` | Returns the detailed profile of a specific user |
| | `update_user_details` | Updates personal information for a user *(write)* |
| **Time Reports** | `get_locations` | Lists available work locations |
| | `get_time_overview` | Day-by-day breakdown of logged hours |
| | `log_time_entry` | Records a new time entry *(write)* |
| | `update_time_entry` | Edits an existing time entry *(write)* |
| | `get_week_wise_report` | Weekly time summary |
| | `get_task_wise_report` | Time grouped by task |
| | `get_project_wise_report` | Time grouped by project |
| **Projects** | `get_user_projects_and_tasks` | All projects and tasks assigned to the current user |

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Stateless HTTP** | Every request is self-contained. State lives in the JWT and server settings, not in server memory |
| **Async throughout** | All Kronos API calls use `async/await` via `httpx` for non-blocking I/O |
| **Privacy masking** | Email addresses and phone numbers are partially masked in tool output |
| **Single client instance** | One `KronosClient` is shared across all requests, created on startup and torn down on shutdown via a lifespan context manager |
| **CORS enabled** | The server accepts cross-origin requests, allowing browser-based MCP clients |

---

## Limitations of This Approach

This single-server, credential-in-env design worked well for early validation but introduced constraints that became apparent as the scope expanded:

- **Credentials are server-scoped, not user-scoped.** The JWT in `.env` belongs to one user. Any AI client connecting to this server acts as that user — there is no concept of multiple users with separate identities.
- **No credential rotation.** Updating the JWT requires a server restart. There is no mechanism for per-session token management.
- **Not suitable for production multi-user deployments.** Every user would need their own running server instance with their own `.env`.
- **No platform-level control.** There is no centralised layer for audit logging, rate limiting, or access control across users or tenants.

These limitations are addressed in [Stage 2 — Platform Integration and Auth Refactor](/guide/stage-2-platform-auth).
