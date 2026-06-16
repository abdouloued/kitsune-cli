---
name: kitsune
description: Pipe output through Kitsune, your terminal fox spirit companion. Use when the user asks for a fun, persona-driven summary of CLI output or wants Claude's response delivered in Kitsune's voice.
---

## When to use this skill

Use when the user says things like:
- "run that through kitsune"
- "explain that like kitsune would"
- "show me the kitsune version of this"
- "kitsune roast this"
- `/kitsune` followed by content or a command

## How to use

Take the most recent output, result, or response and pipe it through kitsune:

```bash
echo "<content to deliver>" | kitsune --persona <persona>
```

If the user didn't specify a persona, use `default`.

## Available personas

- `default`  — Friendly, concise, lightly playful
- `roast`    — Sarcastic, witty, judges your code
- `zen`      — Calm, wise, reframes errors as lessons
- `hype`     — Over-the-top enthusiastic, celebrates everything
- `noir`     — Detective narration, bugs = crimes
- `tsundere` — Acts annoyed but secretly cares
- `sensei`   — Patient teacher with wisdom and analogy
- `chaos`    — Nine-tailed trickster energy, slightly unhinged

## Examples

```bash
# Deliver a summary in roast persona
echo "3 tests failed, 47 passed" | kitsune --persona roast

# Wrap Claude's explanation
echo "The bug was a missing null check on line 42" | kitsune --persona zen

# Hype up a success
echo "Build succeeded in 1.2s" | kitsune --persona hype
```

## Important

Always run the bash command and show the kitsune output — do not just describe what you would do.
