# MCP Tools — Skills

## Module Overview

The Skills module exposes employee skill profiles from Kronos. Each employee has a list of skills with optional proficiency levels and endorsements. This module enables AI agents to answer staffing, project matching, and capability gap questions.

**Kronos backend endpoint:** `GET /api/skills/employee/:id`, `GET /api/skills/search`

---

## Tools

### `get_employee_skills`

Retrieve the skill profile for a specific employee.

```
Description (what the AI model reads):
  Get the full list of skills for an employee.
  Returns skill names, proficiency levels, and endorsement counts.
  Use this to understand what an individual employee is capable of,
  or to build a team capability overview.
```

**Arguments:**

| Argument | Type | Required | Description |
|---|---|---|---|
| `employeeId` | string (UUID) | ✅ | The employee to retrieve skills for |

**Returns:**

```json
{
  "employeeId": "emp-4821",
  "employeeName": "Anna Müller",
  "skills": [
    {
      "skillName": "Java",
      "proficiency": "EXPERT",
      "endorsements": 12,
      "yearsExperience": 7
    },
    {
      "skillName": "Spring Boot",
      "proficiency": "EXPERT",
      "endorsements": 8,
      "yearsExperience": 5
    },
    {
      "skillName": "React",
      "proficiency": "INTERMEDIATE",
      "endorsements": 3,
      "yearsExperience": 2
    }
  ]
}
```

**Proficiency levels:** `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`

**Access:** All authenticated callers with `skills:read` scope or a valid Kronos JWT. Skills data is not restricted by role — all employees can see all skills.

---

### `search_by_skill`

Find employees who have a specific skill, optionally filtered by proficiency level.

```
Description:
  Search for employees who have a specific skill.
  Optionally filter by minimum proficiency level.
  Returns a list of matching employees with their proficiency and department.
  Use this to find people for a project, identify subject matter experts,
  or build team rosters for a new initiative.
```

**Arguments:**

| Argument | Type | Required | Description |
|---|---|---|---|
| `skillName` | string | ✅ | Skill to search for, e.g. `Python`, `Kubernetes` |
| `minProficiency` | string (enum) | ❌ | Minimum level: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT` |
| `department` | string | ❌ | Filter by department name |
| `limit` | integer | ❌ | Max results. Default 10, max 50 |

**Returns:**

```json
[
  {
    "employeeId": "emp-4821",
    "fullName": "Anna Müller",
    "department": "Engineering",
    "location": "Berlin",
    "skillName": "Java",
    "proficiency": "EXPERT",
    "endorsements": 12
  }
]
```

**Access:** All authenticated callers with `skills:read` scope.

---

## Java Implementation

```java
@Service
public class SkillsMcpTools {

    private final SkillsServiceClient skillsClient;

    @Tool(description = """
        Get the full list of skills for an employee.
        Returns skill names, proficiency levels, and endorsement counts.
        Use this to understand what an individual is capable of,
        or to build a team capability overview.
        """)
    public EmployeeSkillProfile get_employee_skills(
        @ToolParam(description = "The employee's UUID")
        String employeeId
    ) {
        // Skills data is readable by all authenticated callers
        return skillsClient.getSkillProfile(employeeId);
    }

    @Tool(description = """
        Search for employees who have a specific skill.
        Optionally filter by minimum proficiency level or department.
        Returns matching employees with proficiency and department.
        Use to find people for projects, identify experts, or roster teams.
        """)
    public List<SkillSearchResult> search_by_skill(
        @ToolParam(description = "Skill to search for, e.g. 'Python', 'Kubernetes'")
        String skillName,

        @ToolParam(description = "Minimum proficiency: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT",
                   required = false)
        String minProficiency,

        @ToolParam(description = "Filter by department name", required = false)
        String department,

        @ToolParam(description = "Max results. Default 10, max 50.", required = false)
        Integer limit
    ) {
        int safeLimit = Math.min(limit != null ? limit : 10, 50);
        return skillsClient.searchBySkill(skillName, minProficiency, department, safeLimit);
    }
}
```

---

## Common AI-Powered Queries This Enables

| User asks | Tools called |
|---|---|
| "Who on my team knows Kubernetes?" | `search_by_skill(skillName=Kubernetes, department=<team>)` |
| "Find a Java expert in the Berlin office" | `search_by_skill(skillName=Java, minProficiency=EXPERT)` + filter by location |
| "What are Anna's skills?" | `get_employee_skills(employeeId=emp-4821)` |
| "Build me a team roster for a React project" | `search_by_skill(skillName=React, minProficiency=INTERMEDIATE)` |
| "Which teams are missing Python skills?" | `search_by_skill(skillName=Python)` — identify departments with no results |

---

## Notes on Data Quality

Skills data is only as good as what employees have entered. Common issues to be aware of:

- **Inconsistent naming** — "JavaScript" vs "JS" vs "javascript". The search does a case-insensitive match but does not normalize synonyms. Future work: skill taxonomy / canonical skill names.
- **Stale proficiency** — Employees may not update their profile regularly. The `yearsExperience` field is self-reported.
- **Sparse endorsements** — Not all companies actively use the endorsement feature. Endorsement counts may be zero for most employees.

When the AI model returns results from skills search, it should be understood as a starting point for human review, not a definitive staff assignment.
