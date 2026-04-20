---
name: confluence-doc
description: Create and update Confluence documentation — Use when creating or updating pages in Confluence.
---

# confluence-doc

Create and update Confluence documentation — Use when creating or updating pages in Confluence.

## Confluence Instance

- **URL**: `https://confluence.deutsche-boerse.com`
- **Space Key**: `XBID` or as specified per request
- **Parent Pages**: Follow the existing page tree hierarchy

## Confluence Storage Format

When generating Confluence content programmatically:

- Use `<h2>` for section headers
- Use `<ac:structured-macro ac:name="code">` for code blocks
- Use `<ac:structured-macro ac:name="info">` for info panels
- Use `<ac:structured-macro ac:name="warning">` for warning callouts
- Tables use standard HTML `<table>`, `<tr>`, `<th>`, `<td>` tags

## MCP Integration

If the dbgAtlassian MCP server is available, use:
- `confluence_search_pages` — search using CQL; returns id, title, space, excerpt, labels, last-modified, URL. Supports `start` offset for pagination.
- `confluence_get_page` — read a page's full content. Supports `body_format`: `"storage"` (default, raw XML), `"view"` (rendered HTML), or `"export_view"` (clean HTML for processing).
- `confluence_get_child_pages` — list child pages of a given page by `page_id`. Returns id, title, type, space_key, version, URL.
- `confluence_create_page` — create a new page
- `confluence_update_page` — replace content of an existing page
- `confluence_list_spaces` — list all accessible spaces
- `confluence_add_attachment` — attach a file to a page

### Page Placement (Parent Page)

**Always** place pages under the correct parent. The `confluence_create_page` tool
uses the parameter **`parent_page_id`** (not `parent_id`).

Workflow:
1. Search for the parent page by title using `confluence_search_pages`
2. Extract the `id` field from the search result
3. Pass it as `parent_page_id` when calling `confluence_create_page`

```
# Example: find parent page
confluence_search_pages(cql='space = OBSV AND title = "004 - 04 OpenSearch"')
# Returns: {"id": "116723892", ...}

# Create child page — use parent_page_id, NOT parent_id
confluence_create_page(
  space_key="OBSV",
  title="My New Page",
  body="<h1>Content</h1>",
  parent_page_id="116723892"   # ← correct parameter name
)
```

> **Warning:** If `parent_page_id` is omitted or misspelled, the page is created
> at the **space root** with no error. Always verify the parameter name.

