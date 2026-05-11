# Stage 2 - Platform Integration and Auth Refactor

## What This Stage Covers

With the standalone Kronos MCP Server validated in Stage 1, the next step was integrating it with the MCP Platform. This required a fundamental shift in how authentication works: rather than the server holding a static credential, it now receives user tokens **per request** from the platform.

The MCP Platform acts as the gateway — it authenticates the user, manages the session, and forwards tool calls to the Kronos MCP Server with the correct token attached as an HTTP header. The server's responsibility is limited strictly to calling Kronos APIs and returning structured results.

---

## What Changed and Why

### Stage 1 model
The server held a single Kronos JWT in `.env`. Every request to the Kronos API used this static credential. The server knew who the "current user" was at startup and never changed.

### Stage 2 model
The server holds **zero user credentials**. On every incoming tool call, it reads the user's token from the request headers. The platform - not the server - is responsible for validating identity and attaching the correct token per user per request.

This change makes the Kronos MCP Server genuinely multi-user: different users can call the same server simultaneously, each with their own Kronos token, and the server routes each call with the correct credential without ever storing any of them.

---

## Configuration Changes

### `.env` - Reduced to Two Values

```env
KRONOS_BASE_URL=https://kronos-test.idc.tarento.com
WRITE_TOOLS_ENABLED=true
```

| Variable | Purpose |
|---|---|
| `KRONOS_BASE_URL` | Default Kronos REST API base URL. This is server configuration, not a credential |
| `WRITE_TOOLS_ENABLED` | Server-level feature flag. Admins control whether write operations are permitted |

`KRONOS_JWT` and `KRONOS_USER_EMAIL` are removed. Credentials belong to the user, not the server.

---

### `src/config/settings.py` - Simplified

```python
class Settings(BaseSettings):
    kronos_base_url: str
    write_tools_enabled: bool = False
```

The settings class now holds only server configuration. It carries no user identity and no credentials.

---

## New: `src/dependencies.py`

This is the most significant new file in Stage 2. It introduces `get_kronos_context()` - the function responsible for extracting user identity from the current request.

```python
def get_kronos_context() -> KronosContext:
    headers = get_http_headers()
    auth = headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise MissingCredentialsError("Authorization")
    access_token = auth[len("Bearer "):]
    claims = _decode_jwt_claims(access_token)
    return KronosContext(
        access_token=access_token,
        user_id=int(claims.get("USER-ID", 0)),
        service_url=headers.get("x-service-url", "") or settings.kronos_base_url,
    )
```

**Why `get_http_headers()`?**
This is FastMCP's built-in function that reads HTTP headers from the current request. Each request carries its own headers, so there is no shared state between users.

**Why decode the JWT here?**
The MCP Platform has already validated the JWT using the configured `hs256_secret`. The Kronos MCP Server does not re-validate — it simply reads the `USER-ID` claim from the already-trusted token. Trust is established at the platform layer.

**Why `MissingCredentialsError` instead of a fallback?**
If no token is present, it indicates a misconfiguration in the platform setup. Failing loudly with a clear error is more useful than silently proceeding with incorrect credentials.

**Why does `service_url` fall back to `settings.kronos_base_url`?**
For single-tenant deployments where all users connect to the same Kronos instance, the `X-Service-Url` header is optional. The fallback ensures the server works without it.

**Why is `user_email` not included in `KronosContext`?**
Email is not present in the Kronos JWT. It is only required in one specific place (`log_time_entry` for generating a reference number) and is fetched from the user profile at that point — not carried in context for every request.

---

## `src/errors/exceptions.py` - New Exception

```python
class MissingCredentialsError(Exception):
    def __init__(self, header_name: str):
        super().__init__(
            f"Required header '{header_name}' was not provided by the gateway."
        )
```

**Why a separate exception class rather than reusing `AuthError`?**
`AuthError` means Kronos rejected the token — an authentication failure at the Kronos API level. `MissingCredentialsError` means the platform did not send the token at all — a configuration problem at the gateway level. These are distinct failure modes with different remediation paths.

---

## `src/kronos/client.py` - `service_url` Added

```python
async def post(
    self,
    path: str,
    body: dict,
    access_token: str,
    service_url: str = ""
) -> dict:
    url = (service_url.rstrip("/") if service_url else self.base_url) + path
```

**Why `service_url` as a parameter instead of always using `self.base_url`?**
Different tenants can point to different Kronos instances. The URL now comes from the request context, not from server-level configuration. This enables multi-tenant routing at the Kronos API level.

**Why rename `jwt` to `access_token`?**
The client does not need to know the token is a JWT. If Kronos ever changes its token format, nothing in the client code breaks — it is simply a token from the client's perspective.

---

## `src/tools/user_directory.py` - `fetch_user_email()` Added

```python
async def fetch_user_email(user_id: int, access_token: str, service_url: str) -> str:
    data = await kronos_client.post(
        "/api/v1/user/getUserProfile",
        {"userId": user_id},
        access_token,
        service_url
    )
    return data.get("email", "")
```

**Why a separate function rather than inline in `log_time_entry`?**
`log_time_entry` lives in `time_report.py`. Fetching a user profile is user directory logic. The function is defined where the concern belongs and imported where needed — this keeps responsibilities clearly separated.

**Why not pass email as a tool parameter?**
A user asking Claude to log time says "log 8 hours today" — they have no knowledge of, or interest in, the `activityRefNumber` format that Kronos requires internally. Deriving the email from the profile inside the tool hides this implementation detail from the user appropriately.

---

## Changes Across All Tools

Every tool now calls `get_kronos_context()` at the beginning of its execution:

```python
async def get_all_users(ctx: Context) -> str:
    try:
        ctx_data = get_kronos_context()
        data = await kronos_client.post("...", {}, ctx_data.access_token, ctx_data.service_url)
        ...
    except MissingCredentialsError as e:
        return str(e)
```

**Why called inside every tool and not once at startup?**
Each request is a different user with a different token. Calling `get_kronos_context()` inside the tool ensures it reads the headers of *that specific request*. If called at startup, no request exists yet and it would read nothing.

**Why inside `try/except`?**
If `get_kronos_context()` raises `MissingCredentialsError`, the exception is caught and returned as a readable message to the AI agent. The agent always receives a meaningful error rather than an unhandled crash.

---

## `main.py` — Instructions Simplified

```python
mcp = FastMCP(
    name="kronos-mcp",
    instructions="You are connected to the Kronos HR platform. You can list employees..."
)
```

In Stage 1, the instructions included a hardcoded user ID:

```python
instructions=f"The currently authenticated user ID is {settings.kronos_user_id}"
```

This was baked in at startup and reflected only a single user. In Stage 2, user identity is determined per request — the server has no reason to know who is logged in at startup time, and the instructions no longer assert a specific user context.

---

## Summary: What Shifted

| Concern | Stage 1 | Stage 2 |
|---|---|---|
| Credential storage | `.env` file on the server | In the request headers, per call |
| User identity | Fixed at startup from JWT payload | Extracted per request from Authorization header |
| Multi-user support | No — one credential for all | Yes — every user brings their own token |
| Trust boundary | The server validates its own credential | The platform validates; the server trusts the platform |
| Kronos API base URL | Fixed in server config | Per-request, falls back to server config |
| Write protection | Feature flag checked per tool | Unchanged — feature flag still in server config |

The Kronos MCP Server is now a stateless, credential-free service. It receives everything it needs on each request and carries nothing between requests. This design is what allows the MCP Platform to serve multiple users through a single server instance without any session state on the server side.

---

## Next: Login Flow Design

With the platform and server integrated, the remaining question is how users authenticate with the MCP Platform itself. This is covered in [Stage 3 — Login Flow Design](/guide/stage-3-login-flow).
