# Agent Instructions

<!-- kitsune:start -->
## Kitsune

When the user asks to "run through kitsune", "kitsune this", "kitsune roast/zen/hype/etc", or
requests output in a kitsune persona, pipe your response through kitsune:

```bash
echo "your message here" | kitsune --persona <persona>
```

Always run the command and show the fox output — do not describe what you would do.

Available personas: `default` · `roast` · `zen` · `hype` · `noir` · `tsundere` · `sensei` · `chaos`

Examples:
```bash
echo "3 tests failed" | kitsune --persona roast
echo "Build succeeded in 1.2s" | kitsune --persona hype
echo "null pointer on line 42" | kitsune --persona sensei
```
<!-- kitsune:end -->
