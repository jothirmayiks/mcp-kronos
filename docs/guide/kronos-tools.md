# Kronos Tool Mapping

## How Kronos APIs Map to MCP Tools

This page documents the exact adapter configuration for each Kronos tool - the endpoint templates, response mappers, and Kronos-specific notes.

---

## User Directory

### search_employees

```
Kronos endpoint:  GET /api/employees?q={query}&limit={limit}
Response mapper:  kronos_employee_mapper
Auth required:    Yes (any role)
```

Notes:
- The q parameter does partial matching on name, email, department, and job title
- Results are ordered by relevance score
- Status field values: ACTIVE, ON_LEAVE, REMOTE, OUT_OF_OFFICE

### get_employee

```
Kronos endpoint:  GET /api/employees/{employeeId}
Response mapper:  kronos_employee_mapper
Auth required:    Yes - own profile (EMPLOYEE), team (MANAGER), all (HR_ADMIN)
```

### update_employee_status

```
Kronos endpoint:  PATCH /api/employees/{employeeId}/status
Request body:     { "status": "{status}" }
Response mapper:  kronos_status_result_mapper
Auth required:    Yes - own status (EMPLOYEE/MANAGER), any (HR_ADMIN)
Write flag:       Required
```

Allowed status values: ACTIVE, ON_LEAVE, REMOTE, OUT_OF_OFFICE

---

## Time Report

### get_time_report

```
Kronos endpoint:  GET /api/timereport/{employeeId}?from={fromDate}&to={toDate}
Response mapper:  kronos_timereport_mapper
Auth required:    Yes - own data (EMPLOYEE), team (MANAGER), all (HR_ADMIN)
```

Notes:
- Date format must be YYYY-MM-DD
- Maximum date range: 90 days per request
- Returns entries grouped by project code and date

### submit_timesheet_entry

```
Kronos endpoint:  POST /api/timereport/entries
Request body:     { "employeeId": "{callerId}", "projectCode": "{projectCode}",
                    "date": "{date}", "hours": {hours}, "notes": "{notes}" }
Response mapper:  kronos_entry_result_mapper
Auth required:    Yes - always submits as caller.sub()
Write flag:       Required
```

Notes:
- hours must be between 0.5 and 16
- projectCode is validated against Kronos active project list
- Duplicate entries (same employee + date + project) are rejected with 409

---

## Skills

### get_employee_skills

```
Kronos endpoint:  GET /api/skills/employee/{employeeId}
Response mapper:  kronos_skills_mapper
Auth required:    Yes (any role - skills data is not restricted)
```

Notes:
- Proficiency levels: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
- yearsExperience is self-reported and may be null
- Endorsements may be zero for most employees

### search_by_skill

```
Kronos endpoint:  GET /api/skills/search?skill={skillName}&minLevel={minProficiency}&dept={department}&limit={limit}
Response mapper:  kronos_skill_search_mapper
Auth required:    Yes (any role)
```

Notes:
- Skill name matching is case-insensitive but not synonym-aware
- minLevel maps to integers: BEGINNER=1, INTERMEDIATE=2, ADVANCED=3, EXPERT=4
- department must match Kronos exact department name

---

## Response Mapper Example

```java
@Component("kronos_employee_mapper")
public class KronosEmployeeMapper implements ResponseMapper<EmployeeSummary> {

    @Override
    public List<EmployeeSummary> map(JsonNode response) {
        return StreamSupport
            .stream(response.get("employees").spliterator(), false)
            .map(node -> new EmployeeSummary(
                node.get("id").asText(),
                node.get("fullName").asText(),
                node.get("email").asText(),
                node.get("department").asText(),
                node.get("jobTitle").asText(),
                node.get("location").asText(),
                node.get("status").asText()
                // salary, personalPhone, homeAddress excluded intentionally
            ))
            .collect(Collectors.toList());
    }
}
```
