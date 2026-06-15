# kitsune-cli

A terminal fox spirit that wraps any CLI output in a persona-driven speech bubble.

```
 _______________
/ 12 tests pass /
\ all green!   /
 ---------------
    \
     \
  /\     /\
 /  \___/  \
| (^)   (^) |
|    \w/    |
 \   ~~~   /
  `-------'
  ~~*****~~
```

## Install

```bash
npm install -g kitsune-cli
```

## Usage

```bash
# Pipe anything through kitsune
echo "Build passed" | kitsune

# Pick a persona
npm test | kitsune --persona roast
claude "fix bug" --print | kitsune --persona zen

# Smart summarization (requires ANTHROPIC_API_KEY or OPENAI_API_KEY)
npm test | kitsune --smart
```

## Personas

```bash
kitsune --persona list
```

| Persona   | Vibe                                              |
|-----------|---------------------------------------------------|
| `default` | Friendly, concise, lightly playful                |
| `roast`   | Sarcastic, witty, judges your code                |
| `zen`     | Calm, wise, reframes errors as lessons            |
| `hype`    | Over-the-top enthusiastic, celebrates everything  |
| `noir`    | Detective narration, bugs = crimes                |

## Claude Code Integration

```bash
kitsune install --claude-code          # add Stop hook to project
kitsune install --claude-code --global # add Stop hook globally
kitsune install --skill                # install Claude Code skill
kitsune install --all                  # install everything detected
```

## opencode Integration

```bash
kitsune install --opencode
```

## MCP Server

Run kitsune as an MCP server exposing the `kitsune_say` tool:

```bash
kitsune mcp
```

Add to your MCP config:

```json
{
  "mcpServers": {
    "kitsune": { "command": "kitsune", "args": ["mcp"] }
  }
}
```

## Config file

Create `.kitsune.json` in your project root or `~/.kitsunerc` globally:

```json
{ "persona": "zen", "width": 50, "unicode": true, "color": true }
```

## Options

```
-p, --persona <name>   Persona (default: default)
-w, --width <n>        Bubble width (default: 40)
--ascii                Force ASCII art
--unicode              Force unicode art
--no-color             Disable color
--smart                LLM summarization (requires API key)
--version              Print version
-h, --help             Show help
```

## License

MIT
