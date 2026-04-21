# How It Works

## The MCP Protocol - A Quick Primer

MCP defines a standard conversation between an AI client and a server:

```
Client → Server:  "What can you do?"
Server → Client:  [list of tools, each with name, description, JSON Schema]

Client → Server:  "Call search_employees with query='Build'"
Server → Client:  [structured result]
```

The key insight is that **the AI model reads the tool descriptions** and decides which tool to call based on user intent - not because the developer hardcoded "if user says X, call tool Y". This makes the integration flexible and composable.

---

## Tool Anatomy

Each MCP tool has three parts:

| Part | Purpose | Example |
|---|---|---|
| **Name** | Unique identifier | `search_employees` |
| **Description** | Natural language - the model reads this | "Search the employee directory by name, department, or job title..." |
| **JSON Schema** | Defines the arguments the model must supply | `{ query: string, limit?: integer }` |

The description is the most important part. A well-written description means the model calls the right tool at the right time.

---

## MCP Transport Modes

The MCP server supports two transport modes depending on the client:

### HTTP/SSE (for network clients)

Used when the MCP client connects over the network — a custom web UI, third-party app, or remote Claude instance.

```
POST /mcp/sse
Authorization: Bearer <jwt-or-api-key>
```

### stdio (for Claude Desktop)

Claude Desktop launches the MCP server as a local child process and communicates over stdin/stdout. This is configured in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kronos": {
      "command": "java",
      "args": ["-jar", "/path/to/kronos-mcp-server.jar"],
      "env": {
        "SPRING_AI_MCP_SERVER_TRANSPORT": "STDIO"
      }
    }
  }
}
```

---

## What the Model Sees

When a user connects an MCP-aware AI client to Kronos MCP, the model automatically discovers the available tools. A conversation might look like:

> **User:** Find me everyone in the product team with Python skills.
>
> **Model (internally):** I have `search_employees` and `get_employee_skills`. I'll search the product team first, then check skills.
>
> *calls `search_employees(query="product team")`*
> *calls `get_employee_skills(employeeId="...")` for each result*
>
> **Model:** Here are 5 people in the product team with Python skills: [list]

The user never sees the tool calls — just the final grounded answer. Every fact in that answer came from a real API call, not a hallucination.

---

## Safety Model

MCP tool calls are not free-form code execution. Every tool:

1. **Validates its inputs** at the tool boundary (not just trusting the model's output)
2. **Checks the caller's role** from the JWT/token claims
3. **Logs the invocation** regardless of success or failure
4. **Can be disabled** individually or globally via feature flags

Write tools (submit timesheet, update status) are **off by default** and must be explicitly enabled per environment.
