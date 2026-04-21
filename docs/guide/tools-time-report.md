# MCP Tools — Time Report

## Module Overview

The Time Report module exposes timesheet data from Kronos. Employees log their working hours against project codes. This module lets AI agents read and submit that data.

**Kronos backend endpoint:** `GET /api/timereport`, `POST /api/timereport/entry`

---

## Tools

### `get_time_report`

Get logged hours for an employee within a date range.

```
Description (what the AI model reads):
  Get time report entries for an employee in a date range.
  Returns logged hours grouped by project code and date.
  Read-only. Only returns data for the authenticated user unless
  the caller has the MANAGER role.
```

**Arguments:**

| Argument | Type | Required | Description |
|---|---|---|---|
| `employeeId` | string (UUID) | ✅ | Employee to fetch. Leave blank = current user |
| `fromDate` | string (ISO date) | ✅ | Start date: `YYYY-MM-DD` |
| `toDate` | string (ISO date) | ✅ | End date: `YYYY-MM-DD` |

**Returns:**

```json
{
  "employeeId": "emp-4821",
  "employeeName": "Anna Müller",
  "fromDate": "2025-04-14",
  "toDate": "2025-04-18",
  "totalHours": 32.0,
  "entries": [
    {
      "date": "2025-04-14",
      "projectCode": "PROJ-ATLAS",
      "hours": 8.0,
      "notes": "Sprint planning + backend work"
    },
    {
      "date": "2025-04-15",
      "projectCode": "INTERNAL-MEETINGS",
      "hours": 4.0,
      "notes": null
    }
  ]
}
```

**Access:**
- `EMPLOYEE` — own data only
- `MANAGER` — own data + direct reports
- `HR_ADMIN` — any employee
- External app (`timereport:read`) — all employees in their authorized scope

---

### `submit_timesheet_entry`

Submit a single timesheet entry for a date and project.

::: warning Write Tool
This tool is controlled by the `mcp.write-tools.enabled` feature flag. It is **disabled by default**.
:::

```
Description:
  Submit a timesheet entry for a specific date and project.
  Mutating operation — creates a new time log record.
  The entry is attached to the authenticated user automatically.
  Cannot submit on behalf of another employee.
```

**Arguments:**

| Argument | Type | Required | Description |
|---|---|---|---|
| `projectCode` | string | ✅ | Project code, e.g. `PROJ-42` |
| `date` | string (ISO date) | ✅ | Date of work: `YYYY-MM-DD` |
| `hours` | number | ✅ | Hours worked. Must be between `0.5` and `16` |
| `notes` | string | ❌ | Description of work done |

**Validation:**
- `hours` must be between `0.5` and `16` — enforced at the tool boundary
- `date` must be a valid ISO date — invalid formats return a descriptive error
- `projectCode` is validated against the list of active projects in Kronos
- The entry is **always** attributed to `caller.sub()` — cannot submit for another employee

**Returns:**

```json
{
  "entryId": "te-9921",
  "status": "CREATED",
  "projectCode": "PROJ-42",
  "date": "2025-04-18",
  "hours": 6.0,
  "notes": "Implemented OAuth filter"
}
```

---

## Java Implementation

```java
@Service
public class TimeReportMcpTools {

    private final TimeReportingClient timeClient;

    @Value("${mcp.write-tools.enabled:false}")
    private boolean writeEnabled;

    @Tool(description = """
        Get time report entries for an employee in a date range.
        Returns logged hours grouped by project code and date.
        Read-only. Only returns data for the authenticated user unless
        the caller has the MANAGER role.
        """)
    public TimeReport get_time_report(
        @ToolParam(description = "Employee ID (UUID). Omit to get your own report.")
        String employeeId,

        @ToolParam(description = "Start date: YYYY-MM-DD")
        String fromDate,

        @ToolParam(description = "End date: YYYY-MM-DD")
        String toDate
    ) {
        JwtClaims caller = SecurityContext.current();

        // Resolve "current user" shorthand
        String resolvedId = (employeeId == null || employeeId.isBlank())
            ? caller.sub()
            : employeeId;

        // Authorization
        if (!caller.hasRole("MANAGER") && !caller.sub().equals(resolvedId)) {
            throw new McpToolException("You can only view your own time report.");
        }

        return timeClient.getReport(resolvedId, fromDate, toDate);
    }

    @Tool(description = """
        Submit a timesheet entry for a specific date and project.
        Mutating — creates a new time log. Entry is attached to you automatically.
        Cannot submit on behalf of another employee.
        """)
    public TimesheetEntryResult submit_timesheet_entry(
        @ToolParam(description = "Project code, e.g. PROJ-42")
        String projectCode,

        @ToolParam(description = "Date of work: YYYY-MM-DD")
        String date,

        @ToolParam(description = "Hours worked. Between 0.5 and 16.")
        double hours,

        @ToolParam(description = "Optional notes describing work done", required = false)
        String notes
    ) {
        if (!writeEnabled) {
            throw new McpToolException("Write tools are disabled in this environment.");
        }
        if (hours < 0.5 || hours > 16) {
            throw new McpToolException("Hours must be between 0.5 and 16.");
        }

        JwtClaims caller = SecurityContext.current();
        return timeClient.submitEntry(caller.sub(), projectCode, date, hours, notes);
    }
}
```

---

## Common AI-Powered Queries This Enables

| User asks | Tools called |
|---|---|
| "Did I submit my timesheet this week?" | `get_time_report(employeeId=<self>, fromDate=Mon, toDate=Fri)` |
| "Show me John's hours for April" | `get_time_report(employeeId=<john-id>, ...)` — requires MANAGER role |
| "Log 6 hours for PROJ-42 today" | `submit_timesheet_entry(projectCode=PROJ-42, date=today, hours=6)` |
| "Who on my team hasn't logged hours this week?" | `get_time_report(...)` for each team member — requires MANAGER role |
