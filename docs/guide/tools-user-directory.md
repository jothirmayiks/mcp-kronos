# MCP Tools — User Directory

## Module Overview

The User Directory module exposes Kronos employee data to AI agents. It is the foundation of the MCP integration — most multi-step queries will start with a directory lookup before calling other tools.

**Kronos backend endpoint:** `GET /api/employees`

---

## Tools

### `search_employees`

Search the employee directory by name, department, or job title.

```
Description (what the AI model reads):
  Search the employee directory by name, department, or job title.
  Returns a list of matching employees with contact info and reporting line.
  Use this when the user asks who works in a team, who to contact, or
  wants to look someone up.
```

**Arguments:**

| Argument | Type | Required | Description |
|---|---|---|---|
| `query` | string | ✅ | Partial or full name, department, or job title |
| `limit` | integer | ❌ | Max results. Default 10, max 50 |

**Returns:**

```json
[
  {
    "employeeId": "emp-4821",
    "fullName": "Anna Müller",
    "email": "anna.mueller@company.com",
    "department": "Engineering",
    "jobTitle": "Engineering Lead",
    "location": "Berlin",
    "reportsTo": {
      "employeeId": "emp-1042",
      "fullName": "Klaus Weber"
    }
  }
]
```

**Access:** All authenticated callers with `directory:read` scope or a Kronos JWT.

---

### `get_employee`

Fetch a single employee's full profile by employee ID.

```
Description:
  Get the full profile of an employee by their ID.
  Returns contact information, department, job title, location,
  manager, and direct reports.
  Use this when you already have an employee ID and need their details.
```

**Arguments:**

| Argument | Type | Required | Description |
|---|---|---|---|
| `employeeId` | string (UUID) | ✅ | The employee's unique ID |

**Returns:**

```json
{
  "employeeId": "emp-4821",
  "fullName": "Anna Müller",
  "email": "anna.mueller@company.com",
  "department": "Engineering",
  "jobTitle": "Engineering Lead",
  "location": "Berlin",
  "status": "ACTIVE",
  "startDate": "2019-03-15",
  "reportsTo": { ... },
  "directReports": [ ... ]
}
```

**Access:** Employees can read their own profile. Managers can read their team. HR Admin can read all.

---

### `update_employee_status`

Update an employee's status field.

::: warning Write Tool
This tool is controlled by the `mcp.write-tools.enabled` feature flag. It is **disabled by default**.
:::

```
Description:
  Update an employee's profile status field.
  Allowed status values: ACTIVE, ON_LEAVE, REMOTE, OUT_OF_OFFICE.
  An employee can only update their own status.
  HR_ADMIN role can update any employee's status.
```

**Arguments:**

| Argument | Type | Required | Description |
|---|---|---|---|
| `employeeId` | string (UUID) | ✅ | Employee to update |
| `status` | string (enum) | ✅ | One of: `ACTIVE`, `ON_LEAVE`, `REMOTE`, `OUT_OF_OFFICE` |

**Validation:**
- Status must be one of the four allowed values — any other string returns an error
- Non-HR_ADMIN callers can only update their own status
- External apps and individuals cannot call this tool

---

## Java Implementation

```java
@Service
public class UserDirectoryMcpTools {

    private final EmployeeServiceClient employeeService;

    @Tool(description = """
        Search the employee directory by name, department, or job title.
        Returns a list of matching employees with contact info and reporting line.
        Use this when the user asks who works in a team, who to contact, or
        wants to look someone up.
        """)
    public List<EmployeeSummary> search_employees(
        @ToolParam(description = "Partial or full name, department, or job title to search for")
        String query,

        @ToolParam(description = "Max number of results. Default 10, max 50.", required = false)
        Integer limit
    ) {
        int safeLimit = Math.min(limit != null ? limit : 10, 50);
        return employeeService.search(query, safeLimit);
    }

    @Tool(description = """
        Get the full profile of an employee by their ID.
        Returns contact information, department, job title, location,
        manager, and direct reports.
        """)
    public EmployeeProfile get_employee(
        @ToolParam(description = "The employee's UUID, e.g. emp-4821")
        String employeeId
    ) {
        JwtClaims caller = SecurityContext.current();
        enforceReadAccess(caller, employeeId);
        return employeeService.getProfile(employeeId);
    }

    @Tool(description = """
        Update an employee's profile status field.
        Allowed values: ACTIVE, ON_LEAVE, REMOTE, OUT_OF_OFFICE.
        Employees can only update their own status.
        HR_ADMIN can update any.
        """)
    public EmployeeStatusResult update_employee_status(
        @ToolParam(description = "Employee ID to update") String employeeId,
        @ToolParam(description = "New status: ACTIVE, ON_LEAVE, REMOTE, or OUT_OF_OFFICE") String status
    ) {
        if (!writeEnabled) throw new McpToolException("Write tools disabled.");

        Set<String> allowed = Set.of("ACTIVE", "ON_LEAVE", "REMOTE", "OUT_OF_OFFICE");
        if (!allowed.contains(status)) {
            throw new McpToolException("Invalid status. Allowed: " + allowed);
        }

        JwtClaims caller = SecurityContext.current();
        if (!caller.hasRole("HR_ADMIN") && !caller.sub().equals(employeeId)) {
            throw new McpToolException("You can only update your own status.");
        }

        return employeeService.updateStatus(employeeId, status);
    }
}
```

---

## MCP-Safe Response DTO

The Play API may return more fields than we want to expose. We use a dedicated DTO for MCP responses that explicitly includes only safe fields:

```java
public record EmployeeSummary(
    String employeeId,
    String fullName,
    String email,
    String department,
    String jobTitle,
    String location,
    String status,
    ManagerRef reportsTo
    // NOTE: salary, personalPhone, homeAddress, taxId are intentionally excluded
) {}
```
