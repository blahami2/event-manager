---
name: jira-ticket
description: Create, draft, update, and link Jira tickets for the XP project with proper templates, labels, and components. Use when creating a new Jira ticket, drafting a ticket description from a problem statement, reviewing or improving an existing ticket, linking related issues, or formatting content in Jira wiki markup.
---

# jira-ticket

Create, draft, update, and link Jira tickets for the XP project with proper templates, labels, and components. Use when creating a new Jira ticket, drafting a ticket description from a problem statement, reviewing or improving an existing ticket, linking related issues, or formatting content in Jira wiki markup.

## Project Context

- **Project key**: `XP`

### Jira Instances

| Instance | URL | Scope |
|----------|-----|-------|
| **Jira (Energy DBG)** | `https://jira.deutsche-boerse.com` | Deutsche Börse Group teams — general Energy projects |

## Issue Types

| Type | When to Use |
|------|-------------|
| `Task` | Default for all work items — features, improvements, investigations, chores |
| `Epic` | Groups of related Tasks around a larger goal or technology area |
| `Initiative` | Strategic, cross-Epic objectives (e.g., a yearly target) |
| `Problem` | Triggered by a monitoring alert / production incident callout |
| `Bug` | Regression or broken behaviour (rarely used; prefer `Task` with context) |

> Tasks make up ~92% of all XP tickets. Use `Task` unless you have a clear reason to choose another type.

## Priority

| Priority | Usage |
|----------|-------|
| `Minor` | Default — improvements, non-urgent work (~74% of tickets) |
| `Major` | Significant impact on product / team velocity (~20% of tickets) |
| `Critical` | Production-affecting issues requiring immediate attention (~2%) |

Default to **Minor** unless the requester specifies higher urgency.

## Summary (Title) Conventions

- Write the summary as a short, clear **action or outcome statement** in plain English.
- **No ticket numbers** or assignee names in the summary.
- Optionally prefix with a overall topic or technology area, but keep it concise (e.g. FB4IDA - <summary> or Grafana - <summary>).
- Keep summaries under **80 characters**.

**Good examples:**
```
Binary API - POC - xbid-test - Introduce binary API to the xbid-test project
Grafana - Create alerting dashboard for RIF latency
FB4IDA - model - IDA Bidding Zone
FB4IDA - mapping - Flow calculations on IDA borders
TODO: Add specific examples of good summaries here.
```

## Description Templates

Use the templates from the `templates/` directory:

- **Task** → [templates/task.txt](templates/task.txt) — Use for all new Tasks (standard 3-section template)
- **Problem** → [templates/problem.txt](templates/problem.txt) — For alert callouts (auto-generated or manual)
- **Epic** → [templates/epic.txt](templates/epic.txt) — Free-form paragraph describing goal and scope

### Template Rules — MANDATORY

> **This template structure is non-negotiable.** Every Task ticket MUST follow this exact structure. Do NOT skip sections, reorder them, or use alternative formats.

1. **Always** include all three sections for Tasks in this exact order:
   - `h3. Current situation` — Describe the current state as facts, not opinions.
   - `h3. Desired change` — Describe the desired outcome, not a list of sub-tasks.
   - `h3. Acceptance Criteria` — Bullet-pointed (`*`), concrete, and verifiable items.
2. **Never** omit any section — all three are required even if brief.
3. **Never** merge sections or use different headings (e.g., do not use "Goal" instead of "Desired change").
4. Use `h3.` for section headings (not `h2.` or `##`).
5. Write in **Jira wiki markup** (not Markdown): `h3.`, `h4.`, `*bold*`, `_italic_`, `[link|url]`.
6. For **Problem** tickets, use the Problem template (`templates/problem.txt`) — never the Task template.
7. For **Epic** tickets, use the Epic template (`templates/epic.txt`) — a free-form paragraph.

### Initiative

One or two sentences summarising the strategic objective. Epics will be linked as children.

## Labels

Labels are free-form tags. **Always set at least one Label** when creating a ticket. Use existing labels — do not invent new ones unless no existing label fits.

| Category | Labels (most-used first) |
|----------|--------------------------|
| Topic | `flowbased`, `binary-api`, `IDA` |
| Type | `CR`, `investigation`, `improvement`, `CustomerRequest`, `tech-debt`, `analysis` |
| Category | `backend`, `frontend`, `documentation` |

### Label rules

- Apply **1–5 labels** per ticket (at least 1, typically 2–3).
- Apply a **topic** label when it can be derived from the context or the epic.
- Apply a **type** label when the ticket content matches a known type.
- Do not invent new labels unless no existing label fits.

## Status Workflow

```
Backlog → To Do → In Progress → Review → To Test → Testing → Done
                  ↓
                  Waiting   (blocked on external dependency)
All → Done
Done → Backlog
```

- New tickets should be created in **`Backlog`** state.
- `To Do` indicates the ticket has been groomed and is ready for sprint.
- `Waiting` indicates a dependency blocker — add a comment explaining what is being waited on.

## Issue Linking

Use issue links to express relationships between tickets. Links are directional — the meaning depends on which issue is inward vs. outward.

| Link Type | Inward (source) | Outward (target) | When to Use |
|-----------|-----------------|-------------------|-------------|
| `Blocks` | blocks | is blocked by | Target cannot proceed until source is done |
| `Relates` | relates to | relates to | General relationship (default) |
| `Duplicate` | duplicates | is duplicated by | Same issue reported twice |
| `Causes` | causes | is caused by | Root-cause relationship |

### Linking Guidelines

- **Always link related tickets** when creating a new ticket that depends on, blocks, or duplicates another.
- Use `get_issue_link_types` to discover available link types on the instance — the table above shows common ones.
- Use `get_issue_links` to review existing links before adding new ones to avoid duplicates.
- To remove an incorrect link, get the `link_id` from `get_issue_links` and use `delete_issue_link`.
- Add a `comment` when creating a link to explain the relationship if it is not obvious from the issue summaries.
- **Direction matters**: for `"Blocks"`, `inward_issue` blocks `outward_issue` — get the direction right.

## Field Checklist for New Tickets

| Field | Required | Notes |
|-------|----------|-------|
| `Summary` | Yes | Clear, concise, ≤80 chars |
| `Issue Type` | Yes | Default: `Task` |
| `Priority` | Yes | Default: `Minor` |
| `Description` | Yes | **Must** use the matching template — see Template Rules |
| `Labels` | Yes | **Must** set ≥1 label — see Labels section |
| `Assignment Group` | Yes | **Must** always set via `custom_fields`. See field-defaults.json for field ID. Value is `{"value": "DEV"}` unless told otherwise. |
| `Environment` | Optional | If needed, set via `custom_fields`. See field-defaults.json for field ID. Value is `{"value": "<env>"}`. |
| `Assignee` | Recommended | Leave unassigned if unknown |
| `Reporter` | Yes | The person raising the ticket |
| `Epic Link` | Recommended | Link to parent Epic if applicable |

> **Important:** Every new ticket MUST have Labels and Assignment Group set. Never create a ticket without them.

## Jira Wiki Markup

Jira uses **wiki markup**, not Markdown:

| Element | Syntax |
|---------|--------|
| Heading 3 | `h3. Section Title` |
| Heading 4 | `h4. Sub-section` |
| Bold | `*bold text*` |
| Italic | `_italic text_` |
| Bold italic | `+*bold italic*+` |
| Bullet list | ` * item` (leading space + asterisk) |
| Numbered list | ` # item` |
| Link | `[label\|https://url]` |
| Code block | `{code}...{code}` |
| Quote | `{quote}...{quote}` |
| Color | `{color:#FF0000}text{color}` |
| Strikethrough | `-text-` |

## Field Defaults

See [field-defaults.json](field-defaults.json) for default values used when creating tickets programmatically via MCP.

## MCP Integration

Jira interaction is via the **dbgAtlassian** MCP server (`mcp_dbgAtlassian_*` tools).

### Available Tools

| MCP Tool | Description |
|----------|-------------|
| `search_issues` | Search using JQL |
| `get_issue` | Get full issue details (incl. comments) |
| `create_issue` | Create a new issue |
| `update_issue` | Update issue fields |
| `add_comment` | Post a comment (Jira Wiki Markup) |
| `get_transitions` | Get available status transitions |
| `transition_issue` | Transition to a new status |
| `list_projects` | List accessible projects |
| `jira_add_attachment` | Attach a file to an issue |
| `link_issues` | Create a link between two issues (Blocks, Duplicate, Relates, Causes, etc.) |
| `get_issue_links` | Get all links for an issue with direction, type, and linked issue details |
| `get_issue_link_types` | Discover all available link types on the Jira instance |
| `delete_issue_link` | Remove an existing issue link by its link ID |

### Parameter Conventions (Critical)

#### `labels`
- **Format: comma-separated string** — NOT a JSON array.
- Correct: `"Documentation,Training"`
- Wrong: `["Documentation", "Training"]` — produces mangled label names with `[`, `"`, `]` characters.

#### `components`
- **Format: comma-separated string** — e.g. `"OpenSearch,Grafana"`.

#### `epic_key` (linking to an Epic)
- Use the `epic_key` parameter in **both** `create_issue` and `update_issue`.
- Correct: pass `epic_key = "M7O-1331"` directly.
- Wrong: `epic_link` is not a valid parameter — it is silently ignored.

#### `epic_name` (creating an Epic)
- Required when `issue_type = "Epic"`. The short name displayed on the board.
- If omitted for Epics, defaults to the summary.

#### `fields` (filtering response fields)
- `get_issue`: pass a list of field names (e.g. `["summary", "status", "customfield_10650"]`) to get raw field values. Pass `["*all"]` for everything. Omit for the default formatted representation.
- `search_issues`: pass a comma-separated string (e.g. `"summary,status,labels"`). Defaults to standard fields.

#### `custom_fields` (advanced)
- Available on `create_issue` and `update_issue`.
- A dict of additional fields merged into the API payload. Overrides named params if keys overlap.

#### `story_points` (update_issue only)
- Use `-1` to keep existing (default), `0` to clear, or a positive number to set.

#### `transition_issue`
- Uses **`status`** parameter with the target status name (case-insensitive).
- The server auto-matches the status name to the correct transition — no need to look up transition IDs.

#### `link_issues`
- **`inward_issue`** (required): The source issue key (e.g. `"XP-100"`).
- **`outward_issue`** (required): The target issue key (e.g. `"XP-200"`).
- **`link_type`** (optional, default `"Relates"`): Link type name — e.g. `"Blocks"`, `"Duplicate"`, `"Relates"`, `"Causes"`.
- **`comment`** (optional): A comment to attach to the link.
- Direction matters: for `"Blocks"`, `inward_issue` blocks `outward_issue`.
- Use `get_issue_link_types` to discover available link types on the instance.

#### `get_issue_links`
- **`issue_key`** (required): Returns all inward and outward links with link type, direction label, linked issue key/summary/status/priority, and `link_id`.

#### `delete_issue_link`
- **`link_id`** (required): The numeric link ID obtained from `get_issue_links`.

### Examples

#### Search issues
```
search_issues(
  jql = "project = M7O AND status = Open ORDER BY created DESC",
  max_results = 5,
  fields = "summary,status,priority,labels"
)
```

#### Get issue with specific fields
```
get_issue(
  issue_key = "M7O-1386",
  fields = ["summary", "status", "customfield_10650"]
)
```

#### Create a Task under an Epic
```
create_issue(
  project_key = "M7O",
  summary     = "Build alert templates for etcd component",
  issue_type  = "Task",
  priority    = "Minor",
  labels      = "Alerting,Grafana",
  epic_key    = "M7O-1345",
  description = "h3. Current situation\r\nNo alert templates for etcd.\r\nh3. Desired change\r\nCreate etcd alert template.\r\nh3. Acceptance Criteria\r\n * Alert template created"
)
```

#### Update an issue (set epic link, labels, components, story points)
```
update_issue(
  issue_key    = "M7O-1386",
  labels       = "Dashboard,Grafana",
  components   = "Grafana,OpenSearch",
  epic_key     = "M7O-1345",
  assignee     = "et916",
  story_points = 3
)
```

#### Post a comment (Jira Wiki Markup)
```
add_comment(
  issue_key = "M7O-1386",
  body      = "h3. Implementation Complete\n*Files changed:* 45 new template files\n*Branch:* {{M7O-1345/yaml-driven-alert-templating}}"
)
```

#### Transition an issue
```
transition_issue(
  issue_key = "M7O-1386",
  status    = "Done"
)
```

#### Link two issues
```
link_issues(
  inward_issue  = "XP-100",
  outward_issue = "XP-200",
  link_type     = "Blocks",
  comment       = "XP-100 must be completed before XP-200 can start"
)
```

#### Get all links for an issue
```
get_issue_links(issue_key = "XP-100")
```

#### Discover available link types
```
get_issue_link_types()
```

#### Remove a link
```
# First get the link_id from get_issue_links, then:
delete_issue_link(link_id = "12345")
```

### Issue Type Names (XP Project)

The server uses **type names** (not IDs):

| Type | When to Use |
|------|-------------|
| `Task` | **Default** — features, improvements, chores (~92% of tickets) |
| `Bug` | Regressions, broken behaviour |
| `Epic` | Groups of related Tasks |
| `Story` | User stories |
| `Sub-task` | Child of a Task or Story |

### Status Transitions — Common XP Flows

| Transition | Typical Use |
|------------|------------|
| To Do → In Progress | Start work |
| In Progress → Review | Put work to review |
| Open → Closed | Close without work |

> Use `get_transitions(issue_key = "XP-XXXX")` to see available transitions for the issue's current state.

