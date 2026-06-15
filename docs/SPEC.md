# Kitsune CLI — Project Spec & Build Prompt for Claude Code

> Copy this entire document into Claude Code as your starting prompt.
> A working prototype scaffold is already included in this zip under
> `src/`, `art/`, `bin/`, and `package.json` — treat it as a rough draft
> to refine, not a finished product.

---

## 1. Concept

**Kitsune** is a terminal companion: a fox spirit that renders AI/CLI
output inside a speech bubble with ASCII (or unicode) art, using a
selectable **persona** that controls tone, humor, and mood-based poses.

Core use case:

```bash
claude "fix this bug" --print | kitsune
npm test | kitsune --persona roast
codex run task.md | kitsune --persona zen
```

It should also integrate with **Claude Code**, **opencode**, and
(best-effort) **Codex CLI** via hooks/plugins so the fox appears
automatically when an agent finishes a task — not just via manual piping.

---

## 2. Goals & Non-Goals

**Goals:**
- Standalone CLI that works with *any* piped text (cowsay-style, zero
  dependency on any specific agent).
- A small library of fox ASCII/unicode art poses tied to mood
  (success, error, thinking, idle, roast).
- A persona system (5 personas to start: default, roast, zen, hype,
  noir) that changes both the *art pose mapping* and the *tone* of the
  summarized text.
- One-command installers that wire Kitsune into Claude Code (via
  hooks), opencode (via plugin), and provide a SKILL.md for Claude
  Code's skill system.
- Optional MCP server exposing a `kitsune_say(text, persona)` tool.
- Should look great in terminal recordings/GIFs — this is the primary
  driver of shareability, so visual polish + color matters.

**Non-Goals (for v1):**
- No requirement to call an LLM API for summarization — start with
  simple heuristics (last N lines, truncation, pattern matching). LLM
  summarization can be an optional `--smart` flag later using the
  user's existing Claude/OpenAI API key.
- No GUI. Terminal-only.
- No Windows-specific testing required for v1, but don't actively break
  it (avoid OS-specific shell calls where possible).

---

## 3. Architecture

```
kitsune/
├── bin/
│   └── kitsune                 # executable entry point
├── src/
│   ├── cli.js                  # main CLI: arg parsing, stdin reading, orchestration
│   ├── bubble.js               # speech bubble rendering + text wrapping
│   ├── personas.js             # persona definitions (tone + mood->pose mapping)
│   ├── mood.js                 # heuristic mood detection from text/exit codes
│   ├── color.js                # (NEW) ANSI color helpers for fox + bubble
│   ├── summarize.js             # (NEW) extract summarize() out of cli.js, add --smart LLM mode
│   └── installers/              # (NEW) one per integration target
│       ├── claude-code.js       # writes .claude/settings.json hook config
│       ├── opencode.js          # writes opencode plugin config
│       └── skill.js              # generates SKILL.md into .claude/skills/
├── art/
│   └── fox-ascii.js             # ASCII + unicode pose definitions
├── mcp/
│   └── server.js                # (NEW) MCP server exposing kitsune_say tool
├── docs/
│   └── SPEC.md                  # this file
├── package.json
└── README.md
```

---

## 4. What's already scaffolded (review and refine)

The included prototype has working versions of:

- `art/fox-ascii.js` — `FOX_ASCII` and `FOX_UNICODE` objects, each with
  poses: `default`, `happy`, `error`, `thinking`, `roast`, `sleeping`.
  **These are rough placeholder art** — please redesign them to look
  more like an actual fox (pointed ears, fluffy tail, expressive eyes).
  Keep both an ASCII-safe version and a unicode/emoji-enhanced version.

- `src/bubble.js` — `renderBubble(text, opts)` wraps text and draws a
  cowsay-style bubble; `renderWithArt(text, artLines, opts)` combines
  bubble + art. Handles single-line (`< >`) vs multi-line (`/ \`, `| |`,
  `\ /`) bubble borders.

- `src/personas.js` — `PERSONAS` object with 5 personas (default,
  roast, zen, hype, noir), each with `name`, `description`, `tone`
  (instructions for future LLM summarization), and `moods` (mapping
  mood key → art pose key).

- `src/mood.js` — `detectMood(text, exitCode)` — simple regex-based
  mood detection (error patterns, success patterns, fallback neutral).

- `src/cli.js` — wires it all together. Supports `--persona`, `--width`,
  `--ascii`/`--unicode` flags, reads stdin or argv, naive `summarize()`
  (last 3 non-empty lines).

Test it:
```bash
echo "Build passed all tests" | node src/cli.js --persona roast --ascii
echo "Error: fatal exception" | node src/cli.js --persona zen --unicode
```

---

## 5. Build Tasks (in priority order)

### Phase 1 — Polish the core CLI
1. **Redesign fox art**: create genuinely fox-like ASCII art for both
   `FOX_ASCII` and `FOX_UNICODE` sets, all 6 moods. Consider adding 1-2
   more poses: `wave` (greeting on first run) and `confused` (for
   warnings, distinct from hard errors).
2. **Add color** (`src/color.js`): ANSI color codes for fox (orange/
   white/black for kitsune) and bubble border. Respect `NO_COLOR` env
   var and `--no-color` flag. Use a small dependency-free ANSI helper
   (no chalk needed — keep it lightweight).
3. **Improve `summarize()`**: move to `src/summarize.js`. Add:
   - Heuristic mode (default): smarter than "last 3 lines" — detect
     test result summaries, error messages, file change counts, etc.
     and prioritize those lines.
   - `--smart` flag: if `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) is
     set, call the API with the persona's `tone` instructions to
     generate a 1-2 sentence summary in that persona's voice. Fail
     gracefully to heuristic mode if no key / network error.
4. **Add `--persona list`**: prints all available personas with
   descriptions.
5. **Config file support**: read `~/.kitsunerc` or
   `.kitsune.json` in cwd for default persona, width, color preferences.

### Phase 2 — Integrations
6. **Claude Code hook installer** (`src/installers/claude-code.js`):
   - `kitsune install --claude-code` writes/updates
     `.claude/settings.json` (or global `~/.claude/settings.json` with
     `--global`) to add a `Stop` (or `SubagentStop`) hook that pipes
     the final assistant message through `kitsune`.
   - Research the current Claude Code hooks schema before implementing
     — confirm exact hook event names and config format via Claude
     Code docs (https://docs.claude.com) since this may have changed.
   - Should be idempotent (don't duplicate hook entries on re-run).
7. **SKILL.md generator** (`src/installers/skill.js`):
   - `kitsune install --skill` generates a `SKILL.md` (and
     supporting script) into `.claude/skills/kitsune/` that instructs
     Claude to pipe casual/fun responses through `kitsune` when the
     user asks for it (e.g., "explain that like kitsune would").
8. **opencode plugin installer** (`src/installers/opencode.js`):
   - Research opencode's current plugin API/config format. Generate a
     minimal TS/JS plugin that listens for session-end events and
     prints the kitsune-wrapped summary.
9. **`kitsune install --all`**: auto-detect which tools are present
   (check for `.claude/`, opencode config dirs, etc.) and run all
   applicable installers.

### Phase 3 — MCP server
10. **`mcp/server.js`**: implement an MCP server exposing a single tool
    `kitsune_say(text: string, persona?: string)` that returns the
    rendered bubble+art as text. Use the official MCP SDK
    (`@modelcontextprotocol/sdk`). Add a `kitsune mcp` subcommand to
    launch it via stdio transport.

### Phase 4 — Polish & ship
11. **README.md**: install instructions, GIF/asciinema demo placeholder,
    persona showcase (render each persona's `happy` pose with example
    text), integration instructions for Claude Code/opencode/Codex.
12. **Package for npm**: ensure `bin/kitsune` shebang works cross-
    platform, add `.npmignore`, test `npm pack` + global install.
13. **Add a `--version` and `--help` with examples.**

---

## 6. Persona Reference (current definitions)

| Key       | Name           | Vibe                                              |
|-----------|----------------|---------------------------------------------------|
| `default` | Kitsune        | Friendly, concise, lightly playful                |
| `roast`   | Roast Kitsune  | Sarcastic, witty, judges your code                |
| `zen`     | Zen Kitsune    | Calm, wise, reframes errors as lessons            |
| `hype`    | Hype Kitsune   | Over-the-top enthusiastic, celebrates everything  |
| `noir`    | Noir Kitsune   | Detective narration, bugs = crimes                |

Feel free to propose 1-2 additional personas if a natural fit emerges
(e.g., a "tsundere" or "sensei" persona could fit the kitsune theme
well), but keep the initial set small and polished rather than adding
many shallow options.

---

## 7. Open Questions for Claude Code to resolve during build

- Confirm current Claude Code hooks configuration format (event names,
  JSON schema, global vs project config precedence) via
  https://docs.claude.com before implementing the installer — don't
  rely on potentially outdated assumptions.
- Confirm opencode's plugin API surface similarly.
- Decide: Go vs Node for final distribution? The prototype is Node
  (easy npm distribution, fits JS-based plugin ecosystems for opencode/
  Claude Code). Recommend sticking with Node unless there's a strong
  reason to switch — note this in README either way.
- Decide on package name availability (`kitsune`, `kitsune-cli`,
  `@yourscope/kitsune`) — check npm registry.

---

## 8. Success Criteria for v1

- `npm install -g kitsune-cli && echo "hello" | kitsune` works out of
  the box with default persona and looks polished (color, clean
  bubble, recognizable fox).
- All 5 personas produce visibly distinct tone + art pose for the same
  input.
- `kitsune install --claude-code` successfully wires up a working hook
  in a test project (verify by running a Claude Code session and
  observing the fox appear after a response).
- README has a clear demo (asciinema/GIF) showing the cowsay-style pipe
  usage AND the Claude Code integration.
