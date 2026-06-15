# Kitsune CLI — Design Document
**Date:** 2026-06-15  
**Status:** Approved  
**Scope:** All 4 phases (full v1)

---

## Overview

Kitsune is a terminal companion: a fox spirit that renders text inside a cowsay-style speech bubble with ASCII/unicode art, driven by a **persona** that controls tone and mood-based art poses. It works with any piped text and integrates with Claude Code, opencode, and MCP.

---

## Architecture

```
kitsune/
├── bin/kitsune                     # shebang entry point (exists)
├── src/
│   ├── cli.js                      # arg parsing, orchestration (refactor)
│   ├── bubble.js                   # speech bubble renderer (exists, keep)
│   ├── personas.js                 # persona definitions (exists, keep)
│   ├── mood.js                     # heuristic mood detection (exists, keep)
│   ├── color.js                    # NEW: zero-dep ANSI helpers, NO_COLOR support
│   └── summarize.js                # NEW: priority-line heuristic + --smart LLM mode
│   └── installers/
│       ├── claude-code.js          # NEW: writes .claude/settings.json Stop hook
│       ├── opencode.js             # NEW: writes opencode plugin config
│       └── skill.js               # NEW: generates .claude/skills/kitsune/ SKILL.md
├── art/
│   └── fox-ascii.js                # REDESIGN: genuine fox art, all 8 poses
├── mcp/
│   └── server.js                   # NEW: MCP server via @modelcontextprotocol/sdk
└── package.json                    # add @modelcontextprotocol/sdk dependency
```

---

## Phase 1 — Core CLI Polish

### Fox Art Redesign (`art/fox-ascii.js`)
Both `FOX_ASCII` and `FOX_UNICODE` redesigned with **8 poses**: `default`, `happy`, `error`, `thinking`, `roast`, `sleeping`, `wave`, `confused`.

Key design goals:
- Pointed ears, expressive eyes, hint of a fluffy tail
- Each pose visually distinct — eyes/posture/tail convey the mood
- ASCII version safe for any terminal; unicode version uses box-drawing + emoji sparingly
- Consistent width across poses to avoid bubble misalignment

### Color (`src/color.js`)
- Zero dependencies — raw ANSI escape codes only
- Respects `NO_COLOR` env var **and** `--no-color` CLI flag (either disables all color output)
- `stripAnsi(str)` helper for width calculations (always strips before measuring)
- **Per-persona palettes** — color reinforces persona personality:
  - `default` — warm orange fox (`\x1b[33m`), dim white bubble
  - `roast` — cold gray/silver (`\x1b[90m`), muted bubble; detached, unimpressed
  - `zen` — soft blue-green (`\x1b[36m`), calm bubble
  - `hype` — bright yellow/gold (`\x1b[93m`), bold bubble border
  - `noir` — dim white on dark (`\x1b[37m`), understated
- Palette exported as `PERSONA_COLORS[personaKey]` so `cli.js` can pass it to `renderWithArt`

### Summarizer (`src/summarize.js`)
Two modes:

**Heuristic (default):** Priority-line extraction — scan all lines for high-signal patterns in this order:
1. **Test results** — `(\d+) (passed|failed|skipped)`, `PASS`, `FAIL`, `✓`, `✗`, `all \d+ tests`
2. **Error/exception lines** — `^(Error|Exception|TypeError|SyntaxError|fatal):`, `Traceback`, `at line \d+`
3. **File diff counts** — `\d+ files? changed`, `\d+ insertions?`, `\d+ deletions?`
4. **Build/duration** — `build (succeeded|failed)`, `compiled in \d+`, `finished in \d+(ms|s)`
5. **Exit status signals** — `exit code \d+`, `returned \d+`, `status: \d+`
6. **Fallback** — last 3 non-empty lines

Each tier is tried in order; first match wins. Multiple lines from the same tier are joined with " · ".

**Smart mode (`--smart` flag):** If `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` is set, call the API with the persona's `tone` instructions to produce a 1–2 sentence in-persona summary. Falls back silently to heuristic on network error or missing key. Uses claude-haiku-4-5-20251001 for Anthropic (cheap, fast).

### New CLI features
- `--persona list` — prints all personas with name + description
- `--no-color` flag
- `--smart` flag
- Config file: reads `~/.kitsunerc` or `.kitsune.json` in cwd (JSON: `{ persona, width, color, unicode }`)
- `--version` and `--help` with usage examples

---

## Phase 2 — Integrations

### Claude Code Hook Installer (`src/installers/claude-code.js`)
`kitsune install --claude-code [--global]`

- Reads `.claude/settings.json` (or `~/.claude/settings.json` with `--global`)
- Adds a `Stop` hook entry: `{ "type": "command", "command": "kitsune" }`
- Idempotent: checks for existing kitsune entry before writing
- Creates file/dirs if missing
- Prints confirmation with the path written

Schema (verified against Claude Code docs during implementation):
```json
{
  "hooks": {
    "Stop": [{ "matcher": "", "hooks": [{ "type": "command", "command": "kitsune" }] }]
  }
}
```

### Skill Generator (`src/installers/skill.js`)
`kitsune install --skill`

- Writes `.claude/skills/kitsune/SKILL.md` — instructs Claude to pipe casual/fun explanations through kitsune when requested
- Idempotent

### opencode Plugin Installer (`src/installers/opencode.js`)
`kitsune install --opencode`

- Researches opencode plugin API during implementation (config format TBD)
- Generates minimal JS plugin that listens for session-end events
- Falls back to printing a manual install guide if plugin API is unclear

### `kitsune install --all`
Auto-detects which tools are present (`.claude/` dir, opencode config) and runs applicable installers.

---

## Phase 3 — MCP Server

`mcp/server.js` — exposes single tool `kitsune_say(text: string, persona?: string)`:
- Uses `@modelcontextprotocol/sdk` with stdio transport
- Returns rendered bubble+art as a string
- Launched **only** via the explicit `kitsune mcp` subcommand — never triggered by piped input or any other invocation path
- Default `kitsune` (no subcommand) always runs the pipe/render UX; `mcp` is an opt-in server mode
- `cli.js` routes `process.argv[2] === 'mcp'` → `require('../mcp/server.js')` before stdin is touched

---

## Phase 4 — Polish & Ship

- `README.md`: install instructions, persona showcase (rendered in-terminal), integration guide, asciinema placeholder
- `package.json`: `@modelcontextprotocol/sdk` added, `.npmignore`, engines field
- `--version` flag reads from `package.json`

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Runtime | Node.js | npm distribution, fits JS plugin ecosystems |
| Color deps | Zero (raw ANSI) | Keep lightweight, spec requirement |
| Summarizer default | Priority-line heuristic | Better signal extraction than last-N-lines |
| MCP SDK | `@modelcontextprotocol/sdk` | Official, maintained |
| Smart mode LLM | claude-haiku-4-5-20251001 | Cheap + fast for 1-2 sentence summaries |

---

## Success Criteria

- `npm install -g kitsune-cli && echo "hello" | kitsune` works, looks polished (color, clean bubble, recognizable fox)
- All 5 personas produce visibly distinct tone + art pose for the same input
- `kitsune install --claude-code` wires a working Stop hook
- README has demo placeholder + persona showcase
