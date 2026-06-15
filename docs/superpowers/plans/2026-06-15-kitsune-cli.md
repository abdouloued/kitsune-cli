# Kitsune CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Kitsune CLI — a terminal fox spirit companion that renders piped text in a persona-driven speech bubble with ASCII/unicode art, color, and integrations for Claude Code, opencode, and MCP.

**Architecture:** Zero-dep core (except `@modelcontextprotocol/sdk` for MCP) built on the existing Node.js scaffold. New modules (`color.js`, `summarize.js`, `installers/`) are isolated units wired together by `cli.js`. MCP server lives in `mcp/server.mjs` (ESM) and is spawned on demand, keeping it isolated from the CJS core.

**Tech Stack:** Node.js ≥18, `@modelcontextprotocol/sdk` (MCP only), `node:test` + `node:assert` for tests (zero test dependencies).

---

## File Map

| File | Status | Purpose |
|------|--------|---------|
| `art/fox-ascii.js` | Modify | Redesigned fox art — 8 poses × 2 modes (ASCII + unicode) |
| `src/color.js` | Create | ANSI helpers, per-persona palettes, NO_COLOR / --no-color support |
| `src/summarize.js` | Create | 5-tier priority heuristic + `--smart` LLM mode |
| `src/bubble.js` | Modify | Add `applyBorderColor` opt (identity default, no breaking changes) |
| `src/cli.js` | Modify | New flags (`--no-color`, `--smart`, `--version`, `--help`), config file, `--persona list`, mcp routing |
| `src/installers/claude-code.js` | Create | Idempotent `.claude/settings.json` hook writer |
| `src/installers/skill.js` | Create | `.claude/skills/kitsune/` SKILL.md generator |
| `src/installers/opencode.js` | Create | opencode plugin writer (with runtime research step) |
| `mcp/server.mjs` | Create | MCP server (`kitsune_say` tool, stdio transport) |
| `tests/color.test.js` | Create | Unit tests for color.js |
| `tests/summarize.test.js` | Create | Unit tests for summarize.js |
| `tests/bubble.test.js` | Create | Unit tests for bubble.js border color |
| `tests/cli.test.js` | Create | Unit tests for parseArgs + loadConfig |
| `tests/installers.test.js` | Create | Integration tests for all three installers |
| `README.md` | Modify | Full install guide, persona showcase, integration docs |
| `package.json` | Modify | engines ≥18, add `@modelcontextprotocol/sdk`, test script, `.npmignore` |

---

## Task 1: Project Setup

**Files:**
- Modify: `package.json`
- Create: `.npmignore`

- [ ] **Step 1: Update package.json**

Replace the entire content of `package.json` with:

```json
{
  "name": "kitsune-cli",
  "version": "0.1.0",
  "description": "A fox spirit companion for your terminal — pipe AI/CLI output through a persona-driven speech bubble",
  "main": "src/cli.js",
  "bin": {
    "kitsune": "./bin/kitsune"
  },
  "scripts": {
    "test": "node --test tests/*.test.js",
    "test:watch": "node --test --watch tests/*.test.js"
  },
  "keywords": ["cli", "ascii-art", "cowsay", "claude-code", "fun", "terminal"],
  "license": "MIT",
  "engines": { "node": ">=18" },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0"
  }
}
```

- [ ] **Step 2: Create `.npmignore`**

```
tests/
docs/
.DS_Store
```

- [ ] **Step 3: Install dependencies**

```bash
cd /Users/abdoulouedraogo/Desktop/kitsune && npm install
```

Expected: `@modelcontextprotocol/sdk` installed in `node_modules/`.

- [ ] **Step 4: Verify test runner works**

```bash
node --version
```

Expected: prints `v18.x.x` or higher.

- [ ] **Step 5: Commit**

```bash
git init && git add package.json package-lock.json .npmignore
git commit -m "chore: project setup — node 18+, mcp sdk, test runner"
```

---

## Task 2: Fox Art Redesign

**Files:**
- Modify: `art/fox-ascii.js`

The existing art is a generic placeholder. Replace with genuine fox art: pointed triangular ears, almond eyes per mood, nose (`^` / `▲`), fluffy tail hint (`~~___~~` / `≋≋≋≋≋≋≋`). Eight poses, consistent 7-line height, max width ~16 chars so the bubble aligns cleanly.

- [ ] **Step 1: Replace `art/fox-ascii.js` entirely**

```js
const FOX_ASCII = {
  // Neutral / idle sitting
  default: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (o)   (o) |',
    '|     ^     |',
    ' \\   ---   / ',
    "  `-------'  ",
    '  ~~_____~~  ',
  ],
  // Success / happy
  happy: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (^)   (^) |',
    '|    \\w/    |',
    ' \\   ~~~   / ',
    "  `-------'  ",
    '  ~~*****~~  ',
  ],
  // Error / frustrated
  error: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (x)   (x) |',
    '|     o     |',
    ' \\   ---   / ',
    "  `-------'  ",
    '  ~~_____~~  ',
  ],
  // Thinking / processing
  thinking: [
    '  /\\     /\\  ?',
    ' /  \\___/  \\ ',
    '| (-)   (-) |',
    '|     .     |',
    ' \\   ...   / ',
    "  `-------'  ",
    '  ~~_____~~  ',
  ],
  // Roast / smug
  roast: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (~)   (^) |',
    '|    ,,,    |',
    ' \\   ---   / ',
    "  `-------'  ",
    '  ~~_____~~  ',
  ],
  // Sleeping / long idle
  sleeping: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (-)   (-) |  Z',
    '|    ---    |  z',
    ' \\   ~~~   / z ',
    "  `-------'   ",
    '  ~~_____~~   ',
  ],
  // Wave / greeting (first run)
  wave: [
    '  /\\     /\\   o/',
    ' /  \\___/  \\   |',
    '| (o)   (o) |  /',
    '|     ^     |    ',
    ' \\   ---   /     ',
    "  `-------'      ",
    '  ~~_____~~      ',
  ],
  // Confused / warning (distinct from hard error)
  confused: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (?)   (o) |',
    '|     ~     |',
    ' \\   ---   / ',
    "  `-------'  ",
    '  ~~_____~~  ',
  ],
};

const FOX_UNICODE = {
  default: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (◕)   (◕) |',
    '|     ▲     |',
    ' \\   ───   / ',
    '  ╰───────╯  ',
    '  ≋≋≋≋≋≋≋≋≋  ',
  ],
  happy: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (◕)   (◕) |',
    '|   ◕‿◕‿◕   |',
    ' \\   ───   / ',
    '  ╰───────╯  ',
    '  ≋≋≋✦✦✦≋≋≋  ',
  ],
  error: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (×)   (×) |',
    '|     ○     |',
    ' \\   ───   / ',
    '  ╰───────╯  ',
    '  ≋≋≋≋≋≋≋≋≋  ',
  ],
  thinking: [
    '  /\\     /\\  ？',
    ' /  \\___/  \\ ',
    '| (◔)   (◔) |',
    '|     ·     |',
    ' \\   ···   / ',
    '  ╰───────╯  ',
    '  ≋≋≋≋≋≋≋≋≋  ',
  ],
  roast: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (─)   (◕) |',
    '|    ‿‿‿    |',
    ' \\   ───   / ',
    '  ╰───────╯  ',
    '  ≋≋≋≋≋≋≋≋≋  ',
  ],
  sleeping: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (─)   (─) |  Z',
    '|    ───    |  z',
    ' \\   ~~~   / z ',
    '  ╰───────╯   ',
    '  ≋≋≋≋≋≋≋≋≋   ',
  ],
  wave: [
    '  /\\     /\\   ○/',
    ' /  \\___/  \\   |',
    '| (◕)   (◕) |  /',
    '|     ▲     |    ',
    ' \\   ───   /     ',
    '  ╰───────╯      ',
    '  ≋≋≋≋≋≋≋≋≋      ',
  ],
  confused: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (？)  (◕) |',
    '|     ～    |',
    ' \\   ───   / ',
    '  ╰───────╯  ',
    '  ≋≋≋≋≋≋≋≋≋  ',
  ],
};

module.exports = { FOX_ASCII, FOX_UNICODE };
```

- [ ] **Step 2: Smoke test all poses render**

```bash
node -e "
const { FOX_ASCII, FOX_UNICODE } = require('./art/fox-ascii');
const poses = ['default','happy','error','thinking','roast','sleeping','wave','confused'];
for (const p of poses) {
  console.log('--- ASCII:', p);
  console.log(FOX_ASCII[p].join('\n'));
  console.log('--- UNICODE:', p);
  console.log(FOX_UNICODE[p].join('\n'));
}
"
```

Expected: all 8 poses print without errors, ears visible as `/\`, each pose visually distinct.

- [ ] **Step 3: Commit**

```bash
git add art/fox-ascii.js
git commit -m "feat: redesign fox art — 8 poses (ASCII + unicode), genuine fox appearance"
```

---

## Task 3: Color System

**Files:**
- Create: `src/color.js`
- Create: `tests/color.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/color.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('color', () => {
  it('stripAnsi removes ANSI codes', () => {
    const { stripAnsi } = require('../src/color');
    assert.equal(stripAnsi('\x1b[33mhello\x1b[0m'), 'hello');
    assert.equal(stripAnsi('no codes'), 'no codes');
  });

  it('colorize returns plain string when NO_COLOR is set', () => {
    process.env.NO_COLOR = '1';
    delete require.cache[require.resolve('../src/color')];
    const { colorize } = require('../src/color');
    assert.equal(colorize('hello', '\x1b[33m'), 'hello');
    delete process.env.NO_COLOR;
    delete require.cache[require.resolve('../src/color')];
  });

  it('colorize wraps with ANSI codes when color enabled', () => {
    delete require.cache[require.resolve('../src/color')];
    const { colorize, COLORS } = require('../src/color');
    const result = colorize('hello', COLORS.orange);
    assert.ok(result.includes('\x1b['), `expected ANSI code in: ${result}`);
    assert.ok(result.includes('hello'));
  });

  it('PERSONA_COLORS has entries for all 5 personas', () => {
    const { PERSONA_COLORS } = require('../src/color');
    for (const key of ['default', 'roast', 'zen', 'hype', 'noir']) {
      assert.ok(PERSONA_COLORS[key], `missing palette for ${key}`);
      assert.ok(PERSONA_COLORS[key].fox, `missing fox color for ${key}`);
      assert.ok(PERSONA_COLORS[key].bubble, `missing bubble color for ${key}`);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
node --test tests/color.test.js
```

Expected: fails with `Cannot find module '../src/color'`.

- [ ] **Step 3: Implement `src/color.js`**

```js
const COLORS = {
  reset:        '\x1b[0m',
  dim:          '\x1b[2m',
  bold:         '\x1b[1m',
  orange:       '\x1b[33m',
  brightOrange: '\x1b[93m',
  gray:         '\x1b[90m',
  cyan:         '\x1b[36m',
  white:        '\x1b[37m',
  brightWhite:  '\x1b[97m',
};

// Per-persona palettes reinforcing each persona's tone visually
const PERSONA_COLORS = {
  default: { fox: COLORS.orange,        bubble: COLORS.dim  },
  roast:   { fox: COLORS.gray,          bubble: COLORS.dim  },
  zen:     { fox: COLORS.cyan,          bubble: COLORS.dim  },
  hype:    { fox: COLORS.brightOrange,  bubble: COLORS.bold },
  noir:    { fox: COLORS.white,         bubble: COLORS.dim  },
};

let _noColorFlag = false;

function setNoColorFlag(val) {
  _noColorFlag = val;
}

function colorEnabled() {
  return !process.env.NO_COLOR && !_noColorFlag;
}

function colorize(str, ...codes) {
  if (!colorEnabled()) return str;
  return codes.join('') + str + COLORS.reset;
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

module.exports = { COLORS, PERSONA_COLORS, colorize, stripAnsi, colorEnabled, setNoColorFlag };
```

- [ ] **Step 4: Run to verify all tests pass**

```bash
node --test tests/color.test.js
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/color.js tests/color.test.js
git commit -m "feat: add color system — per-persona palettes, NO_COLOR/--no-color support"
```

---

## Task 4: Bubble Color Support

**Files:**
- Modify: `src/bubble.js`
- Create: `tests/bubble.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/bubble.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { renderBubble, renderWithArt } = require('../src/bubble');
const { stripAnsi } = require('../src/color');

describe('bubble', () => {
  it('renders single-line bubble with < > delimiters', () => {
    const lines = renderBubble('hello');
    const body = lines.find(l => l.includes('hello'));
    assert.ok(body.startsWith('<'), `expected < but got: ${body}`);
    assert.ok(body.endsWith('>'), `expected > but got: ${body}`);
  });

  it('renders multi-line bubble with / \\ | delimiters', () => {
    const long = 'word '.repeat(20).trim();
    const lines = renderBubble(long, { maxWidth: 20 });
    const firstBody = lines[1];
    assert.ok(firstBody.startsWith('/'), `first body line should start with /: ${firstBody}`);
  });

  it('applies border color when applyBorderColor provided', () => {
    const colored = renderBubble('hi', {
      applyBorderColor: s => '\x1b[33m' + s + '\x1b[0m',
    });
    const topLine = colored[0];
    assert.ok(topLine.includes('\x1b[33m'), 'top line should contain color code');
    assert.ok(stripAnsi(topLine).includes('_'), 'stripped top line should still have underscores');
  });

  it('renderWithArt concatenates bubble + art lines', () => {
    const art = ['  /\\  ', ' |  | '];
    const result = renderWithArt('hi', art);
    assert.ok(result.includes('/\\'));
    assert.ok(result.includes('hi'));
  });
});
```

- [ ] **Step 2: Run to verify some tests fail**

```bash
node --test tests/bubble.test.js
```

Expected: first two tests pass (existing code), third fails (`applyBorderColor` not implemented).

- [ ] **Step 3: Update `src/bubble.js` — replace `renderBubble` only**

Replace only the `renderBubble` function (leave `wrapText` and `renderWithArt` unchanged):

```js
function renderBubble(text, opts = {}) {
  const maxWidth = opts.maxWidth || 40;
  const style = opts.style || 'say';
  const applyBorderColor = opts.applyBorderColor || (s => s);

  const lines = wrapText(text, maxWidth);
  const innerWidth = Math.max(...lines.map(l => l.length));

  const top    = applyBorderColor(' ' + '_'.repeat(innerWidth + 2));
  const bottom = applyBorderColor(' ' + '-'.repeat(innerWidth + 2));

  const body = lines.map((line, i) => {
    const padded = line.padEnd(innerWidth, ' ');
    let left = '|', right = '|';
    if (lines.length === 1)          { left = '<'; right = '>'; }
    else if (i === 0)                { left = '/'; right = '\\'; }
    else if (i === lines.length - 1) { left = '\\'; right = '/'; }
    return applyBorderColor(left) + ' ' + padded + ' ' + applyBorderColor(right);
  });

  const tail = style === 'think'
    ? ['    o', '     o', '      O']
    : ['    \\', '     \\'];

  return [top, ...body, bottom, ...tail];
}
```

- [ ] **Step 4: Run to verify all pass**

```bash
node --test tests/bubble.test.js
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/bubble.js tests/bubble.test.js
git commit -m "feat: add applyBorderColor option to bubble renderer"
```

---

## Task 5: Summarizer

**Files:**
- Create: `src/summarize.js`
- Create: `tests/summarize.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/summarize.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { summarize } = require('../src/summarize');

describe('summarize — tier 1: test results', () => {
  it('extracts passed/failed counts', () => {
    const text = 'compiling...\nsome verbose output\n12 passed, 2 failed\ndone';
    const result = summarize(text);
    assert.ok(result.includes('12 passed'), `got: ${result}`);
  });

  it('extracts PASS keyword line', () => {
    const text = 'running tests\nPASS src/foo.test.js\nsome other line';
    assert.ok(summarize(text).includes('PASS'));
  });
});

describe('summarize — tier 2: error lines', () => {
  it('extracts error line', () => {
    const text = 'starting build\nError: Cannot find module foo\nstacktrace line\nmore stuff';
    assert.ok(summarize(text).includes('Error:'));
  });

  it('extracts TypeError line', () => {
    const text = 'TypeError: undefined is not a function\n  at Object.<anonymous>';
    assert.ok(summarize(text).includes('TypeError:'));
  });
});

describe('summarize — tier 3: file diffs', () => {
  it('extracts file changed count', () => {
    const text = 'M src/foo.js\nM src/bar.js\n2 files changed, 10 insertions(+), 3 deletions(-)';
    assert.ok(summarize(text).includes('2 files changed'));
  });
});

describe('summarize — tier 4: build timing', () => {
  it('extracts build duration line', () => {
    const text = 'webpack compiling...\ncompiled in 4200ms\nmain.js 200kb';
    assert.ok(summarize(text).includes('compiled in'));
  });
});

describe('summarize — tier 5: exit status', () => {
  it('extracts exit code line', () => {
    const text = 'process exited with exit code 1\nsome other stuff';
    assert.ok(summarize(text).includes('exit code'));
  });
});

describe('summarize — fallback', () => {
  it('returns last 3 lines when no tier matches', () => {
    const text = 'line1\nline2\nline3\nline4\nline5';
    const result = summarize(text);
    assert.ok(result.includes('line5'));
    assert.ok(!result.includes('line1'));
  });

  it('returns ... for empty input', () => {
    assert.equal(summarize(''), '...');
    assert.equal(summarize('   \n  \n  '), '...');
  });

  it('joins multiple tier matches with ·', () => {
    const text = '10 passed\n2 failed\n1 skipped';
    const result = summarize(text);
    assert.ok(result.includes(' · '), `expected · separator, got: ${result}`);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
node --test tests/summarize.test.js
```

Expected: fails with `Cannot find module '../src/summarize'`.

- [ ] **Step 3: Implement `src/summarize.js`**

```js
const TIERS = [
  {
    name: 'test-results',
    patterns: [
      /\d+\s+(?:tests?\s+)?passed/i,
      /\d+\s+(?:tests?\s+)?failed/i,
      /\d+\s+(?:tests?\s+)?skipped/i,
      /\bPASS\b/,
      /\bFAIL\b/,
      /[✓✗❌✅]/,
      /all \d+ tests/i,
    ],
  },
  {
    name: 'error',
    patterns: [
      /^(?:Error|Exception|TypeError|SyntaxError|ReferenceError|fatal)[:\s>]/im,
      /Traceback/i,
      /at line \d+/i,
    ],
  },
  {
    name: 'file-diff',
    patterns: [
      /\d+ files? changed/i,
      /\d+ insertions?/i,
      /\d+ deletions?/i,
    ],
  },
  {
    name: 'build',
    patterns: [
      /build (?:succeeded|failed)/i,
      /compiled in \d+/i,
      /finished in \d+(?:ms|s)/i,
      /done in \d+(?:ms|s)?/i,
    ],
  },
  {
    name: 'exit-status',
    patterns: [
      /exit code \d+/i,
      /returned \d+/i,
      /status: \d+/i,
    ],
  },
];

function summarize(text, maxLines = 3) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '...';

  for (const tier of TIERS) {
    const matched = lines.filter(line =>
      tier.patterns.some(p => p.test(line))
    );
    if (matched.length > 0) {
      return matched.slice(0, 3).join(' · ');
    }
  }

  return lines.slice(-maxLines).join(' · ');
}

async function summarizeSmart(text, persona) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!anthropicKey && !openaiKey) return summarize(text);

  try {
    if (anthropicKey) return await _callAnthropic(text, persona, anthropicKey);
    return await _callOpenAI(text, persona, openaiKey);
  } catch {
    return summarize(text);
  }
}

async function _callAnthropic(text, persona, apiKey) {
  const https = require('https');
  const prompt = `${persona.tone}\n\nSummarize this CLI output in 1-2 sentences:\n\n${text.slice(0, 2000)}`;
  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data).content[0].text.trim()); }
        catch { reject(new Error('parse error')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

async function _callOpenAI(text, persona, apiKey) {
  const https = require('https');
  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    max_tokens: 150,
    messages: [
      { role: 'system', content: persona.tone },
      { role: 'user', content: `Summarize this CLI output in 1-2 sentences:\n\n${text.slice(0, 2000)}` },
    ],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data).choices[0].message.content.trim()); }
        catch { reject(new Error('parse error')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

module.exports = { summarize, summarizeSmart };
```

- [ ] **Step 4: Run to verify all tests pass**

```bash
node --test tests/summarize.test.js
```

Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/summarize.js tests/summarize.test.js
git commit -m "feat: add 5-tier priority summarizer + --smart LLM fallback"
```

---

## Task 6: CLI Refactor

**Files:**
- Modify: `src/cli.js`
- Create: `tests/cli.test.js`

Rewrites `src/cli.js` to wire up all new modules and add new flags. The MCP subcommand is routed before stdin is touched.

- [ ] **Step 1: Write the failing tests**

Create `tests/cli.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const fs = require('fs');
const path = require('path');

const { parseArgs, loadConfig } = require('../src/cli');

describe('parseArgs', () => {
  it('defaults', () => {
    const args = parseArgs([]);
    assert.equal(args.persona, 'default');
    assert.equal(args.maxWidth, 40);
    assert.equal(args.unicode, null);
    assert.equal(args.noColor, false);
    assert.equal(args.smart, false);
  });

  it('--persona flag', () => {
    assert.equal(parseArgs(['--persona', 'roast']).persona, 'roast');
    assert.equal(parseArgs(['-p', 'zen']).persona, 'zen');
  });

  it('--persona list sets command', () => {
    assert.equal(parseArgs(['--persona', 'list']).command, 'list-personas');
  });

  it('--width and --ascii/--unicode', () => {
    const a = parseArgs(['--width', '60', '--ascii']);
    assert.equal(a.maxWidth, 60);
    assert.equal(a.unicode, false);
    const b = parseArgs(['--unicode']);
    assert.equal(b.unicode, true);
  });

  it('--no-color flag', () => {
    assert.equal(parseArgs(['--no-color']).noColor, true);
  });

  it('--smart flag', () => {
    assert.equal(parseArgs(['--smart']).smart, true);
  });

  it('--version sets command', () => {
    assert.equal(parseArgs(['--version']).command, 'version');
  });

  it('--help sets command', () => {
    assert.equal(parseArgs(['--help']).command, 'help');
    assert.equal(parseArgs(['-h']).command, 'help');
  });

  it('install subcommand', () => {
    const a = parseArgs(['install', '--claude-code']);
    assert.equal(a.command, 'install');
    assert.equal(a.target, 'claude-code');
  });

  it('mcp subcommand', () => {
    assert.equal(parseArgs(['mcp']).command, 'mcp');
  });
});

describe('loadConfig', () => {
  it('returns empty object when no config file exists', () => {
    const cfg = loadConfig('/tmp/nonexistent-dir-kitsune-test-xyz');
    assert.deepEqual(cfg, {});
  });

  it('reads .kitsune.json from cwd', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitsune-test-'));
    fs.writeFileSync(
      path.join(dir, '.kitsune.json'),
      JSON.stringify({ persona: 'zen', width: 60 })
    );
    const cfg = loadConfig(dir);
    assert.equal(cfg.persona, 'zen');
    assert.equal(cfg.width, 60);
    fs.rmSync(dir, { recursive: true });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
node --test tests/cli.test.js
```

Expected: fails because `parseArgs` and `loadConfig` are not exported.

- [ ] **Step 3: Rewrite `src/cli.js`**

```js
#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const os = require('os');
const { FOX_ASCII, FOX_UNICODE } = require('../art/fox-ascii');
const { renderWithArt } = require('./bubble');
const { PERSONAS, getPersona, getArtPose } = require('./personas');
const { detectMood } = require('./mood');
const { PERSONA_COLORS, colorize, setNoColorFlag } = require('./color');
const { summarize, summarizeSmart } = require('./summarize');

// ── Arg parsing ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    persona: 'default',
    maxWidth: 40,
    unicode: null,
    noColor: false,
    smart: false,
    command: null,
    target: null,
    global: false,
    raw: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--persona' || arg === '-p') {
      const val = argv[++i];
      if (val === 'list') { args.command = 'list-personas'; }
      else { args.persona = val; }
    } else if (arg === '--width' || arg === '-w') {
      args.maxWidth = parseInt(argv[++i], 10) || 40;
    } else if (arg === '--ascii')     { args.unicode = false; }
    else if (arg === '--unicode')     { args.unicode = true; }
    else if (arg === '--no-color')    { args.noColor = true; }
    else if (arg === '--smart')       { args.smart = true; }
    else if (arg === '--version')     { args.command = 'version'; }
    else if (arg === '--help' || arg === '-h') { args.command = 'help'; }
    else if (arg === 'install')       { args.command = 'install'; }
    else if (arg === 'mcp')           { args.command = 'mcp'; }
    else if (arg === '--claude-code') { args.target = 'claude-code'; }
    else if (arg === '--opencode')    { args.target = 'opencode'; }
    else if (arg === '--skill')       { args.target = 'skill'; }
    else if (arg === '--all')         { args.target = 'all'; }
    else if (arg === '--global')      { args.global = true; }
    else { args.raw.push(arg); }
  }

  return args;
}

// ── Config file ───────────────────────────────────────────────────────────────

function loadConfig(cwd) {
  const candidates = [
    path.join(cwd || process.cwd(), '.kitsune.json'),
    path.join(os.homedir(), '.kitsunerc'),
  ];
  for (const f of candidates) {
    if (fs.existsSync(f)) {
      try { return JSON.parse(fs.readFileSync(f, 'utf8')); }
      catch { return {}; }
    }
  }
  return {};
}

// ── Terminal capability ───────────────────────────────────────────────────────

function supportsUnicode() {
  const lang = process.env.LANG || '';
  const lcAll = process.env.LC_ALL || '';
  return /UTF-8/i.test(lang) || /UTF-8/i.test(lcAll);
}

// ── Stdin ─────────────────────────────────────────────────────────────────────

function readStdin() {
  return new Promise(resolve => {
    if (process.stdin.isTTY) { resolve(''); return; }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => { data += c; });
    process.stdin.on('end', () => resolve(data));
  });
}

// ── Subcommand handlers ───────────────────────────────────────────────────────

function printVersion() {
  const { version } = require('../package.json');
  console.log(`kitsune v${version}`);
}

function printHelp() {
  console.log(`
kitsune — a fox spirit for your terminal

USAGE
  <command> | kitsune [options]
  kitsune install --claude-code [--global]
  kitsune install --opencode
  kitsune install --skill
  kitsune install --all
  kitsune mcp
  kitsune --persona list

OPTIONS
  -p, --persona <name>   Persona to use (default: default)
  -w, --width <n>        Bubble width (default: 40)
  --ascii                Force ASCII art
  --unicode              Force unicode art
  --no-color             Disable color output
  --smart                Use LLM to summarize (requires API key)
  --version              Print version
  -h, --help             Show this help

EXAMPLES
  echo "Build passed" | kitsune
  npm test | kitsune --persona roast
  claude "fix bug" --print | kitsune --smart
  kitsune install --claude-code
`.trim());
}

function printPersonaList() {
  console.log('Available personas:\n');
  for (const [key, p] of Object.entries(PERSONAS)) {
    console.log(`  ${key.padEnd(10)} ${p.description}`);
  }
}

async function runInstall(args) {
  const target = args.target || 'claude-code';
  if (target === 'claude-code' || target === 'all') {
    const { installClaudeCode } = require('./installers/claude-code');
    await installClaudeCode({ global: args.global });
  }
  if (target === 'opencode' || target === 'all') {
    const { installOpencode } = require('./installers/opencode');
    await installOpencode();
  }
  if (target === 'skill' || target === 'all') {
    const { installSkill } = require('./installers/skill');
    await installSkill();
  }
}

function runMcp() {
  // Spawn mcp/server.mjs as ESM; inherit stdio so the MCP protocol flows through
  const { spawn } = require('child_process');
  const serverPath = path.join(__dirname, '..', 'mcp', 'server.mjs');
  const child = spawn(process.execPath, [serverPath], { stdio: 'inherit' });
  child.on('exit', code => process.exit(code || 0));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const config = loadConfig();
  const args = parseArgs(process.argv.slice(2));

  // Apply config defaults (CLI flags take precedence)
  if (args.persona === 'default' && config.persona) args.persona = config.persona;
  if (args.maxWidth === 40 && config.width)          args.maxWidth = config.width;
  if (args.unicode === null && config.unicode != null) args.unicode = config.unicode;
  if (!args.noColor && config.color === false)         args.noColor = true;

  // Route subcommands before touching stdin
  if (args.command === 'mcp')           { return runMcp(); }
  if (args.command === 'version')       { return printVersion(); }
  if (args.command === 'help')          { return printHelp(); }
  if (args.command === 'list-personas') { return printPersonaList(); }
  if (args.command === 'install')       { return runInstall(args); }

  setNoColorFlag(args.noColor);

  const input = (await readStdin()) || args.raw.join(' ') || '...';
  const persona = getPersona(args.persona);

  const text = args.smart
    ? await summarizeSmart(input, persona)
    : summarize(input);

  const exitCode = process.env.KITSUNE_EXIT_CODE
    ? parseInt(process.env.KITSUNE_EXIT_CODE, 10)
    : null;
  const mood    = detectMood(input, exitCode);
  const poseKey = getArtPose(args.persona, mood);

  const useUnicode = args.unicode !== null ? args.unicode : supportsUnicode();
  const artSet  = useUnicode ? FOX_UNICODE : FOX_ASCII;
  const artLines = artSet[poseKey] || artSet.default;

  const palette = PERSONA_COLORS[args.persona] || PERSONA_COLORS.default;
  const coloredArt = artLines.map(line => colorize(line, palette.fox));
  const applyBorderColor = s => colorize(s, palette.bubble);

  const output = renderWithArt(text, coloredArt, {
    maxWidth: args.maxWidth,
    applyBorderColor,
  });
  console.log(output);
}

if (require.main === module) {
  main().catch(err => { console.error(err.message); process.exit(1); });
}

module.exports = { parseArgs, loadConfig };
```

- [ ] **Step 4: Run tests**

```bash
node --test tests/cli.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Smoke test end-to-end**

```bash
echo "Build passed all 42 tests" | node src/cli.js --persona hype
echo "Error: cannot find module" | node src/cli.js --persona zen --ascii
node src/cli.js --persona list
node src/cli.js --version
node src/cli.js --help
```

Expected: colored fox + bubble for first two, persona list/version/help printed without errors.

- [ ] **Step 6: Commit**

```bash
git add src/cli.js tests/cli.test.js
git commit -m "feat: refactor cli — color, config, --smart, --no-color, --version, --help, --persona list, mcp routing"
```

---

## Task 7: Claude Code Hook Installer

**Files:**
- Create: `src/installers/claude-code.js`
- Create: `tests/installers.test.js`

**Research note:** Before writing code, verify the exact Claude Code `Stop` hook schema. Run:

```bash
cat ~/.claude/settings.json 2>/dev/null || echo "no global settings"
cat .claude/settings.json 2>/dev/null || echo "no project settings"
```

The expected schema (verify against https://docs.claude.com/en/claude-code/hooks before implementing):

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "kitsune" }
        ]
      }
    ]
  }
}
```

- [ ] **Step 1: Write the failing test**

Create `tests/installers.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { installClaudeCode } = require('../src/installers/claude-code');

describe('installClaudeCode', () => {
  it('creates settings.json with Stop hook when file does not exist', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitsune-cc-'));
    const settingsPath = path.join(dir, '.claude', 'settings.json');
    await installClaudeCode({ projectDir: dir });
    assert.ok(fs.existsSync(settingsPath), 'settings.json should be created');
    const cfg = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.ok(cfg.hooks?.Stop, 'Stop hook should exist');
    const hookCmd = cfg.hooks.Stop[0].hooks[0].command;
    assert.ok(hookCmd.includes('kitsune'), `hook should include kitsune, got: ${hookCmd}`);
    fs.rmSync(dir, { recursive: true });
  });

  it('is idempotent — does not duplicate entries on second run', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitsune-cc-'));
    await installClaudeCode({ projectDir: dir });
    await installClaudeCode({ projectDir: dir });
    const cfg = JSON.parse(fs.readFileSync(
      path.join(dir, '.claude', 'settings.json'), 'utf8'
    ));
    assert.equal(cfg.hooks.Stop.length, 1, 'should have exactly one Stop entry');
    fs.rmSync(dir, { recursive: true });
  });

  it('merges into existing settings.json without clobbering other keys', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitsune-cc-'));
    fs.mkdirSync(path.join(dir, '.claude'));
    fs.writeFileSync(
      path.join(dir, '.claude', 'settings.json'),
      JSON.stringify({ permissions: { allow: ['Bash(*)'] } })
    );
    await installClaudeCode({ projectDir: dir });
    const cfg = JSON.parse(fs.readFileSync(
      path.join(dir, '.claude', 'settings.json'), 'utf8'
    ));
    assert.deepEqual(cfg.permissions?.allow, ['Bash(*)'], 'existing keys should be preserved');
    assert.ok(cfg.hooks?.Stop, 'Stop hook should be added');
    fs.rmSync(dir, { recursive: true });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
node --test tests/installers.test.js
```

Expected: fails with `Cannot find module '../src/installers/claude-code'`.

- [ ] **Step 3: Implement `src/installers/claude-code.js`**

```js
const fs = require('fs');
const path = require('path');
const os = require('os');

function hasKitsuneHook(stopArray) {
  return stopArray.some(entry =>
    Array.isArray(entry.hooks) &&
    entry.hooks.some(h => typeof h.command === 'string' && h.command.includes('kitsune'))
  );
}

async function installClaudeCode({ projectDir, global: isGlobal } = {}) {
  const base = isGlobal
    ? path.join(os.homedir(), '.claude')
    : path.join(projectDir || process.cwd(), '.claude');

  const settingsPath = path.join(base, 'settings.json');

  let existing = {};
  if (fs.existsSync(settingsPath)) {
    try { existing = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); }
    catch { existing = {}; }
  } else {
    fs.mkdirSync(base, { recursive: true });
  }

  if (!existing.hooks) existing.hooks = {};
  if (!existing.hooks.Stop) existing.hooks.Stop = [];

  if (!hasKitsuneHook(existing.hooks.Stop)) {
    existing.hooks.Stop.push({
      matcher: '',
      hooks: [{ type: 'command', command: 'kitsune' }],
    });
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n');
    console.log(`✓ Kitsune Stop hook added to ${settingsPath}`);
  } else {
    console.log(`✓ Kitsune hook already present in ${settingsPath} — skipping`);
  }
}

module.exports = { installClaudeCode };
```

- [ ] **Step 4: Run to verify all tests pass**

```bash
node --test tests/installers.test.js
```

Expected: all 3 tests pass.

- [ ] **Step 5: Manual verify**

```bash
node src/cli.js install --claude-code
cat .claude/settings.json
node src/cli.js install --claude-code  # second run — should say "already present"
```

- [ ] **Step 6: Commit**

```bash
git add src/installers/claude-code.js tests/installers.test.js
git commit -m "feat: claude code hook installer — idempotent Stop hook writer"
```

---

## Task 8: Skill Generator

**Files:**
- Create: `src/installers/skill.js`
- Modify: `tests/installers.test.js`

- [ ] **Step 1: Add failing tests to `tests/installers.test.js`**

Append to the existing file:

```js
const { installSkill } = require('../src/installers/skill');

describe('installSkill', () => {
  it('creates SKILL.md in .claude/skills/kitsune/', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitsune-skill-'));
    await installSkill({ projectDir: dir });
    const skillPath = path.join(dir, '.claude', 'skills', 'kitsune', 'SKILL.md');
    assert.ok(fs.existsSync(skillPath), 'SKILL.md should be created');
    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('kitsune'), 'SKILL.md should mention kitsune');
    fs.rmSync(dir, { recursive: true });
  });

  it('is idempotent — does not throw on second run', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitsune-skill-'));
    await installSkill({ projectDir: dir });
    await assert.doesNotReject(() => installSkill({ projectDir: dir }));
    fs.rmSync(dir, { recursive: true });
  });
});
```

- [ ] **Step 2: Run to verify new tests fail**

```bash
node --test tests/installers.test.js
```

Expected: first 3 pass (claude-code), last 2 fail with module not found.

- [ ] **Step 3: Implement `src/installers/skill.js`**

```js
const fs = require('fs');
const path = require('path');

const SKILL_CONTENT = `---
name: kitsune
description: Pipe output through Kitsune, your terminal fox spirit companion. Use when the user asks for a fun, persona-driven summary of CLI output or wants Claude's response delivered in Kitsune's voice.
---

## When to use this skill

Use when the user asks:
- "explain that like kitsune would"
- "run that through kitsune"
- "show me the kitsune version of this"
- or any variation requesting Kitsune's persona

## How to use

\`\`\`bash
<your command> | kitsune --persona <persona>
\`\`\`

## Available personas

- \`default\` — Friendly, concise, lightly playful
- \`roast\`   — Sarcastic, witty, judges your code
- \`zen\`     — Calm, wise, reframes errors as lessons
- \`hype\`    — Over-the-top enthusiastic, celebrates everything
- \`noir\`    — Detective narration, bugs = crimes

## Example

\`\`\`bash
npm test | kitsune --persona roast
\`\`\`
`;

async function installSkill({ projectDir } = {}) {
  const skillDir = path.join(
    projectDir || process.cwd(),
    '.claude', 'skills', 'kitsune'
  );
  const skillPath = path.join(skillDir, 'SKILL.md');

  fs.mkdirSync(skillDir, { recursive: true });

  if (!fs.existsSync(skillPath)) {
    fs.writeFileSync(skillPath, SKILL_CONTENT);
    console.log(`✓ Kitsune skill written to ${skillPath}`);
  } else {
    console.log(`✓ Kitsune skill already exists at ${skillPath} — skipping`);
  }
}

module.exports = { installSkill };
```

- [ ] **Step 4: Run all installer tests**

```bash
node --test tests/installers.test.js
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/installers/skill.js tests/installers.test.js
git commit -m "feat: skill generator — writes .claude/skills/kitsune/SKILL.md"
```

---

## Task 9: opencode Installer

**Files:**
- Create: `src/installers/opencode.js`
- Modify: `tests/installers.test.js`

**Research step first:**

```bash
opencode --help 2>/dev/null || echo "opencode not installed locally"
ls ~/.opencode/ 2>/dev/null || echo "no ~/.opencode"
ls ~/.config/opencode/ 2>/dev/null || echo "no ~/.config/opencode"
```

Based on findings: if opencode config dir is locatable, write a plugin file there. If not, print clear manual instructions. The plugin uses `spawn` (not `exec`/`execSync`) to avoid shell injection.

- [ ] **Step 1: Add failing test to `tests/installers.test.js`**

Append:

```js
const { installOpencode } = require('../src/installers/opencode');

describe('installOpencode', () => {
  it('runs without throwing even when opencode is not installed', async () => {
    await assert.doesNotReject(() => installOpencode({ dryRun: true }));
  });
});
```

- [ ] **Step 2: Run to verify new test fails**

```bash
node --test tests/installers.test.js
```

Expected: 5 pass, 1 fails (module not found).

- [ ] **Step 3: Implement `src/installers/opencode.js`**

```js
const fs = require('fs');
const path = require('path');
const os = require('os');

function findOpencodeConfigDir() {
  const candidates = [
    path.join(os.homedir(), '.opencode'),
    path.join(os.homedir(), '.config', 'opencode'),
  ];
  return candidates.find(d => fs.existsSync(d)) || null;
}

// Plugin uses spawn (not exec) so no shell-injection surface
const PLUGIN_CONTENT = `// kitsune-plugin.js — auto-generated by kitsune installer
// Pipes session output through kitsune after each session ends.
import { spawn } from 'child_process';

export default {
  name: 'kitsune',
  hooks: {
    afterSession({ output }) {
      const text = (output || '').slice(-2000);
      const kitsune = spawn('kitsune', [], { stdio: ['pipe', 'inherit', 'inherit'] });
      kitsune.stdin.write(text);
      kitsune.stdin.end();
    },
  },
};
`;

const MANUAL_INSTRUCTIONS = `
Kitsune opencode integration — manual setup
─────────────────────────────────────────────
opencode config directory not found. To integrate manually:

1. Find your opencode plugin directory (check \`opencode --help\` or opencode docs)
2. Create a file named \`kitsune-plugin.js\` there with this content:

${PLUGIN_CONTENT}
3. Register it in your opencode config if required.
`;

async function installOpencode({ dryRun } = {}) {
  if (dryRun) {
    console.log('(dry run) Would install opencode kitsune plugin');
    return;
  }

  const configDir = findOpencodeConfigDir();
  if (!configDir) {
    console.log(MANUAL_INSTRUCTIONS);
    return;
  }

  const pluginsDir = path.join(configDir, 'plugins');
  const pluginPath = path.join(pluginsDir, 'kitsune-plugin.js');

  fs.mkdirSync(pluginsDir, { recursive: true });

  if (!fs.existsSync(pluginPath)) {
    fs.writeFileSync(pluginPath, PLUGIN_CONTENT);
    console.log(`✓ opencode kitsune plugin written to ${pluginPath}`);
    console.log('  (register it in your opencode config if required)');
  } else {
    console.log(`✓ opencode plugin already exists at ${pluginPath} — skipping`);
  }
}

module.exports = { installOpencode };
```

- [ ] **Step 4: Run all tests**

```bash
node --test tests/installers.test.js
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/installers/opencode.js tests/installers.test.js
git commit -m "feat: opencode installer — spawn-safe plugin writer with manual fallback"
```

---

## Task 10: MCP Server

**Files:**
- Create: `mcp/server.mjs`

The MCP server is ESM (`.mjs`) so it can use `@modelcontextprotocol/sdk` cleanly. It is only ever launched via `kitsune mcp` — `cli.js` spawns it as a child process with stdio inherited. It never starts on a plain `kitsune` invocation.

- [ ] **Step 1: Verify SDK import paths**

```bash
node -e "
const pkg = require('./node_modules/@modelcontextprotocol/sdk/package.json');
const exp = pkg.exports || {};
console.log(JSON.stringify(Object.keys(exp).slice(0, 20), null, 2));
"
```

Note the exact paths. If the SDK uses `./server/mcp.js` and `./server/stdio.js`, the implementation below is correct. If different, adjust the imports accordingly.

- [ ] **Step 2: Implement `mcp/server.mjs`**

```js
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { FOX_ASCII, FOX_UNICODE } = require('../art/fox-ascii.js');
const { renderWithArt } = require('../src/bubble.js');
const { getPersona, getArtPose } = require('../src/personas.js');
const { detectMood } = require('../src/mood.js');
const { summarize } = require('../src/summarize.js');

function supportsUnicode() {
  return /UTF-8/i.test(process.env.LANG || '') || /UTF-8/i.test(process.env.LC_ALL || '');
}

function render(text, personaKey) {
  const key = personaKey || 'default';
  const persona = getPersona(key);
  const summary = summarize(text);
  const mood = detectMood(text);
  const poseKey = getArtPose(key, mood);
  const artSet = supportsUnicode() ? FOX_UNICODE : FOX_ASCII;
  const art = artSet[poseKey] || artSet.default;
  return renderWithArt(summary, art, { maxWidth: 40 });
}

const server = new McpServer({ name: 'kitsune', version: '0.1.0' });

server.tool(
  'kitsune_say',
  {
    text: z.string().describe('Text to render in the kitsune speech bubble'),
    persona: z.string().optional().describe('Persona: default | roast | zen | hype | noir'),
  },
  async ({ text, persona }) => ({
    content: [{ type: 'text', text: render(text, persona) }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 3: Verify the MCP server lists its tool**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp/server.mjs
```

Expected: JSON response containing `kitsune_say` in the tools list.

- [ ] **Step 4: Test a tool call**

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"kitsune_say","arguments":{"text":"Build succeeded","persona":"hype"}}}\n' | node mcp/server.mjs
```

Expected: JSON response with `content[0].text` containing the rendered fox bubble.

- [ ] **Step 5: Test via `kitsune mcp` subcommand**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node src/cli.js mcp
```

Expected: same JSON response as step 3.

- [ ] **Step 6: Confirm `kitsune` alone (no subcommand) does NOT start the server**

```bash
echo "hello" | node src/cli.js
```

Expected: fox bubble printed, no MCP server started.

- [ ] **Step 7: Commit**

```bash
git add mcp/server.mjs
git commit -m "feat: mcp server — kitsune_say tool via stdio transport"
```

---

## Task 11: Full Test Suite

- [ ] **Step 1: Run all tests**

```bash
node --test tests/*.test.js
```

Expected: all tests pass. Fix any failures before continuing.

- [ ] **Step 2: End-to-end smoke test**

```bash
# All 5 personas
echo "12 passed, 0 failed" | node src/cli.js
echo "Error: cannot find module" | node src/cli.js --persona zen
echo "hello world" | node src/cli.js --persona roast --ascii
echo "big win" | node src/cli.js --persona hype --unicode
echo "the crime remains unsolved" | node src/cli.js --persona noir

# Flags
node src/cli.js --version
node src/cli.js --help
node src/cli.js --persona list

# Color suppression
echo "test" | node src/cli.js --no-color
NO_COLOR=1 echo "test" | node src/cli.js

# Install commands
node src/cli.js install --claude-code
node src/cli.js install --skill
```

Expected: all produce correct output, no JS errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: full test suite passes across all modules"
```

---

## Task 12: README and npm Packaging

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# kitsune-cli

A terminal fox spirit that wraps any CLI output in a persona-driven speech bubble.

## Install

\`\`\`bash
npm install -g kitsune-cli
\`\`\`

## Usage

\`\`\`bash
# Pipe anything through kitsune
echo "Build passed" | kitsune

# Pick a persona
npm test | kitsune --persona roast
claude "fix bug" --print | kitsune --persona zen

# Smart summarization (requires ANTHROPIC_API_KEY or OPENAI_API_KEY)
npm test | kitsune --smart
\`\`\`

## Personas

\`\`\`bash
kitsune --persona list
\`\`\`

| Persona   | Vibe                                              |
|-----------|---------------------------------------------------|
| `default` | Friendly, concise, lightly playful                |
| `roast`   | Sarcastic, witty, judges your code                |
| `zen`     | Calm, wise, reframes errors as lessons            |
| `hype`    | Over-the-top enthusiastic, celebrates everything  |
| `noir`    | Detective narration, bugs = crimes                |

## Claude Code Integration

\`\`\`bash
kitsune install --claude-code         # project hook
kitsune install --claude-code --global  # global hook
kitsune install --skill               # Claude Code skill
\`\`\`

## opencode Integration

\`\`\`bash
kitsune install --opencode
\`\`\`

## Install everything

\`\`\`bash
kitsune install --all
\`\`\`

## MCP Server

\`\`\`bash
kitsune mcp
\`\`\`

Add to your MCP config:

\`\`\`json
{
  "mcpServers": {
    "kitsune": { "command": "kitsune", "args": ["mcp"] }
  }
}
\`\`\`

## Config file

Create `.kitsune.json` in your project or `~/.kitsunerc` globally:

\`\`\`json
{ "persona": "zen", "width": 50, "unicode": true, "color": true }
\`\`\`

## Options

\`\`\`
-p, --persona <name>   Persona (default: default)
-w, --width <n>        Bubble width (default: 40)
--ascii                Force ASCII art
--unicode              Force unicode art
--no-color             Disable color
--smart                LLM summarization
--version              Print version
-h, --help             Show help
\`\`\`

## License

MIT
```

- [ ] **Step 2: Verify `bin/kitsune` is executable**

```bash
head -1 bin/kitsune   # should print #!/usr/bin/env node
chmod +x bin/kitsune
```

- [ ] **Step 3: Test npm pack**

```bash
npm pack --dry-run
```

Expected: `bin/kitsune`, `src/`, `art/`, `mcp/` included; `tests/`, `docs/` excluded.

- [ ] **Step 4: Commit and tag**

```bash
git add README.md bin/kitsune
git commit -m "docs: complete README with install guide, persona showcase, integration docs"
git tag v0.1.0
```

---

## Self-Review

**Spec coverage:**
- [x] Fox art redesign — 8 poses, ASCII + unicode (Task 2)
- [x] Color with per-persona palettes, NO_COLOR + --no-color (Task 3)
- [x] Bubble border color via `applyBorderColor` (Task 4)
- [x] 5-tier heuristic summarizer with explicit pattern list (Task 5)
- [x] `--smart` LLM mode (Anthropic + OpenAI fallback) (Task 5)
- [x] `--persona list` (Task 6)
- [x] Config file `~/.kitsunerc` / `.kitsune.json` (Task 6)
- [x] `--no-color`, `--version`, `--help` (Task 6)
- [x] MCP subcommand routing before stdin (Task 6 `runMcp`)
- [x] Claude Code installer — idempotent, merge-safe (Task 7)
- [x] Skill generator (Task 8)
- [x] opencode installer — spawn-safe, best-effort + fallback (Task 9)
- [x] MCP server with `kitsune_say` tool (Task 10)
- [x] README + npm packaging (Task 12)

**API consistency across tasks:**
- `parseArgs(argv)` → `{ persona, maxWidth, unicode, noColor, smart, command, target, global, raw }`
- `loadConfig(cwd?)` → partial config object (all fields optional)
- `summarize(text, maxLines?)` → `string`
- `summarizeSmart(text, persona)` → `Promise<string>`
- `installClaudeCode({ projectDir?, global? })` → `Promise<void>`
- `installSkill({ projectDir? })` → `Promise<void>`
- `installOpencode({ dryRun? })` → `Promise<void>`
- `PERSONA_COLORS[key]` → `{ fox: string, bubble: string }`
- `applyBorderColor` (bubble opt) → `(s: string) => string`
- `render(text, personaKey)` in `mcp/server.mjs` → `string` (local to server)
