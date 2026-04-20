---
name: search-repo
description: Search repository for code patterns or text. Use when user asks to search the codebase or find code patterns.
---

# search-repo

Search repository for code patterns or text. Use when user asks to search the codebase or find code patterns.

Search the repository using ripgrep or similar fast search tools.
Use patterns to find code, text, or configuration entries.

Supported search parameters:
- `pattern` (required): Search pattern (regex or plain text)
- `path` (optional): Directory to search in (defaults to repo root)
- `file_pattern` (optional): File pattern to filter (e.g., '*.py', '*.kt')

