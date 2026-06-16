#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const os = require('os');
const { FOX_ASCII, FOX_UNICODE, TAIL_META } = require('../art/fox-ascii');
const { renderWithArt } = require('./bubble');
const { PERSONAS, getPersona, getArtPose } = require('./personas');
const { detectMood } = require('./mood');
const { PERSONA_COLORS, colorize, setNoColorFlag } = require('./color');
const { summarize, summarizeSmart } = require('./summarize');
const { buildFrame, startTailShimmer, thinkingTransition, stopAnimation } = require('./animator');

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
    agent: null,
    noAnimation: false,
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
    else if (arg === '--agent')         { args.agent = argv[++i]; }
    else if (arg === '--no-animation')  { args.noAnimation = true; }
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
  const header = colorize(
    'KEY        NAME                VIBE',
    PERSONA_COLORS.default.bubble
  );
  const divider = '─────────  ──────────────────  ─────────────────────────────────────────';
  console.log('\nAvailable personas:\n');
  console.log(header);
  console.log(divider);
  for (const [key, p] of Object.entries(PERSONAS)) {
    console.log(`${key.padEnd(10)} ${p.name.padEnd(19)} ${p.description}`);
  }
  console.log('');
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
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
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

  setNoColorFlag(args.noColor);

  // Route subcommands before touching stdin
  if (args.command === 'mcp')           { return runMcp(); }
  if (args.command === 'version')       { return printVersion(); }
  if (args.command === 'help')          { return printHelp(); }
  if (args.command === 'list-personas') { return printPersonaList(); }
  if (args.command === 'install')       { return runInstall(args); }

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
  const artSet     = useUnicode ? FOX_UNICODE : FOX_ASCII;
  const artLines   = artSet[poseKey] || artSet.default;
  const tailMeta   = useUnicode ? (TAIL_META[poseKey] || null) : null;

  const palette          = PERSONA_COLORS[args.persona] || PERSONA_COLORS.default;
  const applyBorderColor = s => colorize(s, palette.bubble);

  const isAnimated = process.stdout.isTTY && !args.noAnimation;
  const agentName  = process.env.KITSUNE_AGENT || args.agent;

  // Thinking transition — only in agent mode on TTY
  if (isAnimated && agentName) {
    const thinkLines = artSet.thinking;
    const thinkMeta  = useUnicode ? (TAIL_META.thinking || null) : null;
    await thinkingTransition(thinkLines, thinkMeta, palette);
  }

  const framedArt = buildFrame(artLines, tailMeta, palette, null);
  const output    = renderWithArt(text, framedArt, { maxWidth: args.maxWidth, applyBorderColor });
  process.stdout.write(output + '\n');

  if (isAnimated) {
    const stop = startTailShimmer(artLines, tailMeta, palette);
    process.on('exit', stop);
    // In agent mode, stay alive 3s so the shimmer is visible
    if (agentName) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  stopAnimation();
}

if (require.main === module) {
  main().catch(err => { console.error(err.message); process.exit(1); });
}

module.exports = { parseArgs, loadConfig, main };
