# kitsune-cli

A terminal fox spirit companion that wraps any piped CLI or AI output in a
persona-driven speech bubble with ASCII fox art.

---

## Demo

```
npm test 2>&1 | kitsune --persona roast
```

```
 ________________________________________
/ Oh wow, 3 failures. Truly impressive   \
| work. Have you considered a career in  |
\ interpretive dance instead?            /
 ----------------------------------------
    \
     \
  /\     /\
 /  \___/  \
| (~)   (^) |
|    ,,,    |
 \   ---   /
  `-------'
  ~~_____~~
```

---

## Install

**From npm (recommended):**

```bash
npm install -g kitsune-cli
```

**From source (clone the repo):**

```bash
git clone https://github.com/abdouloued/kitsune-cli.git
cd kitsune-cli
npm install
npm link          # makes `kitsune` available globally
```

**Verify:**

```bash
kitsune --version
```

---

## Quick Start

Pipe any command output through kitsune:

```bash
# Default persona
echo "Build passed" | kitsune

# Roast persona for test failures
npm test | kitsune --persona roast

# Zen for deployment output
git push | kitsune --persona zen

# Claude Code output with smart summarization
claude "fix bug" --print | kitsune --smart

# Codex CLI output
codex run fix-tests | kitsune --persona hype

# opencode session output
opencode run | kitsune --persona noir
```

---

## Personas

List all available personas:

```bash
kitsune --persona list
```

| Key        | Name              | Example output line                                         |
|------------|-------------------|-------------------------------------------------------------|
| `default`  | Kitsune           | "Build passed in 2.3s. All good here."                     |
| `roast`    | Roast Kitsune     | "It passed. Probably a fluke."                              |
| `zen`      | Zen Kitsune       | "The build is green. Let this moment of peace guide you."   |
| `hype`     | Hype Kitsune      | "YESSS!! ALL TESTS PASSING!! YOU ARE UNSTOPPABLE!!"         |
| `noir`     | Noir Kitsune      | "Tests passed. Another case closed. Don't celebrate yet."   |
| `tsundere` | Tsundere Kitsune  | "It passed. Not that I was worried or anything."            |
| `sensei`   | Sensei Kitsune    | "Good. Now ask yourself why it works."                      |
| `chaos`    | Chaos Kitsune     | "THE BUILD IS GREEN. somewhere a butterfly notices."        |

---

## Integrations

### Claude Code

Installs a `Stop` hook so kitsune runs automatically after every Claude Code
session ends.

**Install (project-level):**

```bash
kitsune install --claude-code
```

**Install (global, all projects):**

```bash
kitsune install --claude-code --global
```

**What it does:** Appends the following entry to `.claude/settings.json`
(or `~/.claude/settings.json` for global):

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "KITSUNE_AGENT=claude-code kitsune" }
        ]
      }
    ]
  }
}
```

The `KITSUNE_AGENT` environment variable enables the thinking-transition
animation and keeps the fox on screen for 3 seconds so you can read it.

**Skill (ask Claude Code to invoke kitsune on request):**

```bash
kitsune install --skill
```

After installation you can say _"run that through kitsune roast"_ or _"explain
that like kitsune would"_ and Claude Code will pipe its response through kitsune
automatically.

**Install everything at once:**

```bash
kitsune install --all          # detects Claude Code + opencode, prompts for skill
kitsune install --all --yes    # same, no prompts
```

**Uninstall:**

```bash
kitsune uninstall --claude-code
kitsune uninstall --claude-code --global   # global hook
```

---

### Codex CLI

Codex CLI does not have a hook or plugin system, but you can pipe its output
directly or wrap it in a shell function for automatic kitsune rendering.

**Direct pipe:**

```bash
codex "fix the failing tests" | kitsune --persona sensei
codex run task.md 2>&1 | kitsune --persona roast
```

> Add `2>&1` to capture error output too — Codex writes some output to stderr.

**Shell wrapper** (add to `~/.zshrc` or `~/.bashrc`):

```bash
kx() {
  codex "$@" 2>&1 | kitsune --persona default
}
```

Then use `kx "fix bug"` instead of `codex "fix bug"`.

**With agent animation:**

```bash
codex "fix bug" 2>&1 | KITSUNE_AGENT=codex kitsune --persona sensei
```

Setting `KITSUNE_AGENT` shows the thinking fox while Codex is running, then
transitions to the final pose when it completes.

---

### opencode

Installs a plugin that pipes the last 2000 characters of each session through
kitsune when the session ends.

**Install:**

```bash
kitsune install --opencode
```

**What it does:** Writes `kitsune-plugin.js` to your opencode plugins directory
(`~/.opencode/plugins/` or `~/.config/opencode/plugins/`). If the directory
cannot be found, manual instructions are printed.

**Uninstall:**

```bash
kitsune uninstall --opencode
```

---

### Codex CLI

Codex CLI has no hook system. The recommended pattern is a shell wrapper
that pipes Codex output through kitsune.

**Pipe directly in the terminal:**

```bash
codex "fix the failing tests" | kitsune --persona roast
```

**Shell wrapper (add to `.bashrc` / `.zshrc`):**

```bash
kx() {
  codex "$@" | kitsune
}
```

Usage:

```bash
kx "refactor this module"
```

---

### Ollama Agents

Ollama's `ollama launch` command can run local coding agents (Claude Code, OpenCode, Codex, Codex App, OpenClaw, Hermes Agent) with any compatible model. Kitsune wraps each with a shell function that sets `KITSUNE_AGENT` and pipes output automatically.

**Install:**

```bash
kitsune install --ollama
```

This writes `~/.kitsune-ollama.sh`. Add one line to your `~/.zshrc` or `~/.bashrc`:

```bash
source ~/.kitsune-ollama.sh
```

**Usage — one command per agent:**

```bash
ok-claude qwen3.5          # Claude Code via Ollama
ok-opencode qwen3.5        # OpenCode via Ollama
ok-codex qwen3.5           # Codex via Ollama
ok-codex-app qwen3.5       # Codex App via Ollama
ok-openclaw qwen3.5        # OpenClaw via Ollama
ok-hermes qwen3.5          # Hermes Agent via Ollama
```

The model argument is optional — defaults to `qwen3.5`. Pass any model Ollama supports:

```bash
ok-claude llama3.1
ok-hermes mistral
```

Each wrapper sets `KITSUNE_AGENT=ollama-<name>` so you get the thinking→resolved animation and 3-second shimmer after the session ends.

**Works independently of which agents you have installed** — the `ok-*` wrappers call `ollama launch` directly so they work on any machine with Ollama, regardless of whether the underlying agent is also installed natively.

**Uninstall:**

```bash
kitsune uninstall --ollama   # removes ~/.kitsune-ollama.sh
```

Remove the `source` line from your shell config manually.

---

### Cursor

Cursor does not expose a post-session hook. Use kitsune in Cursor's integrated
terminal by piping commands manually:

```bash
npm run build | kitsune --persona hype
```

For repeated use, add the shell wrapper above to your shell profile and it will
be available inside Cursor's terminal.

---

### Windsurf

Same as Cursor — pipe from Windsurf's integrated terminal:

```bash
npm test | kitsune --persona zen
```

Or run any long command and pipe to kitsune:

```bash
cargo build 2>&1 | kitsune --persona sensei
```

---

### MCP Server

Run kitsune as an MCP (Model Context Protocol) server. This exposes a
`kitsune_say(text, persona?)` tool that any MCP-compatible client can call.

**Add to Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "kitsune": {
      "command": "kitsune",
      "args": ["mcp"]
    }
  }
}
```

**Add to Claude Code** (`.claude/settings.json` or `~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "kitsune": {
      "command": "kitsune",
      "args": ["mcp"],
      "type": "stdio"
    }
  }
}
```

Once registered, the AI can call `kitsune_say` directly:

```
kitsune_say("All tests passed", "roast")
→ renders the roast fox in a speech bubble as text
```

Personas available: `default` · `roast` · `zen` · `hype` · `noir` · `tsundere` · `sensei` · `chaos`

---

### Claude Code Skill

Install a SKILL.md file so Claude Code knows when and how to pipe output
through kitsune.

**Install:**

```bash
kitsune install --skill
```

**What it does:** Writes `.claude/skills/kitsune/SKILL.md` to your current
project. Claude Code will use the skill when you ask things like:

- "explain that like kitsune would"
- "run that through kitsune"
- "show me the kitsune version of this"
- "roast my test output"

**Uninstall:**

```bash
kitsune uninstall --skill
```

---

## Install All (unified installer)

Detect and install every available integration in one command:

```bash
kitsune install --all
```

- If `.claude/` exists in the current directory, the Claude Code hook is added.
- If opencode config is detected (`~/.opencode` or `~/.config/opencode`), the
  opencode plugin is written.
- Prompts whether to install the Claude Code skill (skip the prompt with
  `--yes` / `-y`).

**With auto-confirm:**

```bash
kitsune install --all --yes
```

**Uninstall everything:**

```bash
kitsune uninstall
```

---

## Configuration

Create `.kitsune.json` in your project root, or `~/.kitsunerc` globally.
CLI flags always take precedence over config file values.

| Key       | Type    | Default     | Description                                      |
|-----------|---------|-------------|--------------------------------------------------|
| `persona` | string  | `"default"` | Default persona key                              |
| `width`   | number  | `40`        | Speech bubble width in characters                |
| `unicode` | boolean | auto-detect | `true` forces unicode art, `false` forces ASCII  |
| `color`   | boolean | `true`      | Set to `false` to disable all color output       |

**Example `.kitsune.json`:**

```json
{
  "persona": "zen",
  "width": 50,
  "unicode": true,
  "color": true
}
```

Config file is resolved by looking for `.kitsune.json` in the current working
directory first, then `~/.kitsunerc`.

---

## Flags Reference

| Flag                    | Short | Description                                              |
|-------------------------|-------|----------------------------------------------------------|
| `--persona <name>`      | `-p`  | Persona to use (default: `default`). Use `list` to list. |
| `--width <n>`           | `-w`  | Speech bubble width (default: `40`)                      |
| `--ascii`               |       | Force ASCII art (ignores terminal unicode support)       |
| `--unicode`             |       | Force unicode art                                        |
| `--no-color`            |       | Disable all color output                                 |
| `--smart`               |       | Use LLM to summarize input (requires API key)            |
| `--agent <name>`        |       | Set agent name; enables thinking transition animation    |
| `--no-animation`        |       | Disable tail shimmer and thinking transition             |
| `--yes` / `-y`          |       | Auto-confirm prompts (used with `install --all`)         |
| `--version`             |       | Print kitsune version and exit                           |
| `--help`                | `-h`  | Show help text and exit                                  |

**Subcommands:**

| Subcommand                          | Description                                   |
|-------------------------------------|-----------------------------------------------|
| `kitsune install --claude-code`     | Install Claude Code Stop hook (project)       |
| `kitsune install --claude-code --global` | Install Claude Code Stop hook (global)   |
| `kitsune install --opencode`        | Install opencode plugin                       |
| `kitsune install --skill`           | Install Claude Code skill (SKILL.md)          |
| `kitsune install --all [--yes]`     | Install all detected integrations             |
| `kitsune uninstall [--claude-code]` | Remove Claude Code hook                       |
| `kitsune uninstall --opencode`      | Remove opencode plugin                        |
| `kitsune uninstall --skill`         | Remove SKILL.md                               |
| `kitsune uninstall`                 | Remove all integrations                       |
| `kitsune mcp`                       | Start MCP server                              |
| `kitsune --persona list`            | Print all available personas                  |

---

## How It Works

```
CLI command output
       |
       v
   [ stdin pipe ]
       |
       v
  kitsune reads input
       |
       +---> detectMood()  --------> mood key (success / error / thinking / neutral)
       |
       +---> getArtPose()  --------> art pose key (happy / roast / error / default ...)
       |
       +---> summarize()   --------> trimmed text (or LLM summary if --smart)
       |
       v
  renderWithArt()
  +---------------------------+
  |  speech bubble with text  |
  |  fox ASCII / unicode art  |
  |  persona color palette    |
  +---------------------------+
       |
       v
   stdout (with optional tail shimmer animation on TTY)
```

**Mood detection** reads exit codes (via `KITSUNE_EXIT_CODE` env var) and
keyword patterns in the input text (error, warning, success, etc.).

**Animation** (tail shimmer and thinking transition) only runs when stdout is a
TTY and `--no-animation` is not set. In agent mode (`--agent` or
`KITSUNE_AGENT`), a thinking transition plays first, then the fox stays on
screen for 3 seconds.

---

## Contributing

See [docs/SPEC.md](docs/SPEC.md) for the full project specification, including
architecture decisions, persona tone guidelines, art pose mapping, and the
animation system design.

```bash
git clone https://github.com/your-org/kitsune-cli
cd kitsune-cli
npm install
npm test
```

---

## License

MIT
