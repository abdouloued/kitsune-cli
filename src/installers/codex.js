'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const MARKER_START = '<!-- kitsune:start -->';
const MARKER_END   = '<!-- kitsune:end -->';

const KITSUNE_BLOCK = `${MARKER_START}
## Kitsune

When the user asks to "run through kitsune", "kitsune this", "kitsune roast/zen/hype/etc", or
requests output in a kitsune persona, pipe your response through kitsune:

\`\`\`bash
echo "your message here" | kitsune --persona <persona>
\`\`\`

Always run the command and show the fox output — do not describe what you would do.

Available personas: \`default\` · \`roast\` · \`zen\` · \`hype\` · \`noir\` · \`tsundere\` · \`sensei\` · \`chaos\`

Examples:
\`\`\`bash
echo "3 tests failed" | kitsune --persona roast
echo "Build succeeded in 1.2s" | kitsune --persona hype
echo "null pointer on line 42" | kitsune --persona sensei
\`\`\`
${MARKER_END}`;

const SKILL_MD = `---
name: kitsune
description: Pipe output through Kitsune, your terminal fox spirit companion. Use when the user asks for a fun, persona-driven summary of CLI output or wants a response delivered in Kitsune's voice.
---

## When to use this skill

Use when the user says things like:
- "run that through kitsune"
- "kitsune roast this"
- "give me the zen version"
- "show me kitsune hype"
- "explain that like kitsune would"
- or any mention of a kitsune persona

## How to use

Take the most recent output, result, or response and pipe it through kitsune:

\`\`\`bash
echo "<content to deliver>" | kitsune --persona <persona>
\`\`\`

If the user didn't specify a persona, use \`default\`.

## Available personas

- \`default\`  — Friendly, concise, lightly playful
- \`roast\`    — Sarcastic, witty, judges your code
- \`zen\`      — Calm, wise, reframes errors as lessons
- \`hype\`     — Over-the-top enthusiastic, celebrates everything
- \`noir\`     — Detective narration, bugs = crimes
- \`tsundere\` — Acts annoyed but secretly cares
- \`sensei\`   — Patient teacher with wisdom and analogy
- \`chaos\`    — Nine-tailed trickster energy, slightly unhinged

## Important

Always run the bash command and show the kitsune output — do not just describe what you would do.
`;

const PLUGIN_JSON = (version) => JSON.stringify({
  name: 'kitsune',
  version,
  description: 'A fox spirit companion for your terminal. Pipe any Codex output through Kitsune to get a persona-driven speech bubble with ASCII fox art.\n\nUsage: echo "output" | kitsune --persona roast\n\nPersonas: default, roast, zen, hype, noir, tsundere, sensei, chaos',
  author: { name: 'kitsune-cli' },
  license: 'MIT',
  keywords: ['terminal', 'fox', 'persona', 'ascii-art', 'fun'],
  skills: './skills/',
  mcpServers: './.mcp.json',
  interface: {
    displayName: 'Kitsune',
    shortDescription: 'Fox spirit companion — wrap Codex output in persona-driven ASCII art',
    longDescription: 'Kitsune is a terminal fox spirit that renders AI/CLI output in a speech bubble with ASCII fox art. Choose from 8 personas (roast, zen, hype, noir, tsundere, sensei, chaos, default) to control the tone and style. Ask Codex to \'run that through kitsune roast\' or \'give me the zen version\' and the fox appears.',
    developerName: 'kitsune-cli',
    category: 'Developer Tools',
    capabilities: ['MCP'],
    defaultPrompt: [
      'Run that through kitsune roast',
      'Give me the zen version of that',
      'Show me the kitsune hype version',
    ],
    brandColor: '#FF6B35',
  },
}, null, 2);

const MCP_JSON = JSON.stringify({
  mcpServers: {
    kitsune: {
      command: 'kitsune',
      args: ['mcp'],
    },
  },
}, null, 2);

/**
 * Appends kitsune instructions to AGENTS.md (idempotent).
 * @param {{ projectDir?: string }} opts
 */
async function installCodex({ projectDir } = {}) {
  const agentsPath = path.join(projectDir || process.cwd(), 'AGENTS.md');

  if (fs.existsSync(agentsPath)) {
    const existing = fs.readFileSync(agentsPath, 'utf8');
    if (existing.includes(MARKER_START)) {
      console.log(`✓ Kitsune already present in ${agentsPath} — skipping`);
      return;
    }
    fs.writeFileSync(agentsPath, existing.trimEnd() + '\n\n' + KITSUNE_BLOCK + '\n');
  } else {
    fs.writeFileSync(agentsPath, '# Agent Instructions\n\n' + KITSUNE_BLOCK + '\n');
  }

  console.log(`✓ Kitsune instructions added to ${agentsPath}`);
}

/**
 * Removes the kitsune block from AGENTS.md.
 * @param {{ projectDir?: string }} opts
 */
async function uninstallCodex({ projectDir } = {}) {
  const agentsPath = path.join(projectDir || process.cwd(), 'AGENTS.md');

  if (!fs.existsSync(agentsPath)) {
    console.log(`⊘ ${agentsPath} not found — nothing to remove`);
    return;
  }

  const content = fs.readFileSync(agentsPath, 'utf8');
  if (!content.includes(MARKER_START)) {
    console.log(`⊘ Kitsune block not found in ${agentsPath} — nothing to remove`);
    return;
  }

  const cleaned = content
    .replace(new RegExp(`\\n*${MARKER_START}[\\s\\S]*?${MARKER_END}\\n?`, 'm'), '')
    .trimEnd();

  if (cleaned.trim() === '# Agent Instructions') {
    fs.rmSync(agentsPath);
    console.log(`✓ Removed ${agentsPath} (was only kitsune content)`);
  } else {
    fs.writeFileSync(agentsPath, cleaned + '\n');
    console.log(`✓ Removed kitsune block from ${agentsPath}`);
  }
}

/**
 * Installs kitsune as a Codex personal plugin.
 * Writes plugin files to ~/.codex/plugins/cache/personal/kitsune/<version>/
 * and registers it in ~/.codex/config.toml.
 */
async function installCodexPlugin() {
  const { version } = require('../../package.json');
  const pluginDir = path.join(os.homedir(), '.codex', 'plugins', 'cache', 'personal', 'kitsune', version);
  const configPath = path.join(os.homedir(), '.codex', 'config.toml');

  if (!fs.existsSync(path.join(os.homedir(), '.codex'))) {
    console.log('⊘ Codex not found (~/.codex missing) — skipping plugin install');
    return;
  }

  // Write plugin files
  fs.mkdirSync(path.join(pluginDir, '.codex-plugin'), { recursive: true });
  fs.mkdirSync(path.join(pluginDir, 'skills', 'kitsune'), { recursive: true });

  fs.writeFileSync(path.join(pluginDir, '.codex-plugin', 'plugin.json'), PLUGIN_JSON(version));
  fs.writeFileSync(path.join(pluginDir, '.mcp.json'), MCP_JSON);
  fs.writeFileSync(path.join(pluginDir, 'skills', 'kitsune', 'SKILL.md'), SKILL_MD);

  // Register in config.toml
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    if (!config.includes('[plugins."kitsune@personal"]')) {
      // Insert after the first [plugins. entry, or append
      const pluginMatch = config.match(/\[plugins\."[^"]+@[^"]+"\]/);
      if (pluginMatch) {
        const idx = config.indexOf(pluginMatch[0]);
        const before = config.slice(0, idx);
        const after = config.slice(idx);
        fs.writeFileSync(configPath, before + '[plugins."kitsune@personal"]\nenabled = true\n\n' + after);
      } else {
        fs.writeFileSync(configPath, config.trimEnd() + '\n\n[plugins."kitsune@personal"]\nenabled = true\n');
      }
    } else {
      console.log('✓ kitsune@personal already registered in config.toml — skipping');
    }
  }

  console.log(`✓ Kitsune Codex plugin installed to ${pluginDir}`);
  console.log('  Restart Codex to see Kitsune in the plugins list.');
}

/**
 * Removes the kitsune Codex plugin.
 */
async function uninstallCodexPlugin() {
  const { version } = require('../../package.json');
  const pluginDir = path.join(os.homedir(), '.codex', 'plugins', 'cache', 'personal', 'kitsune', version);
  const configPath = path.join(os.homedir(), '.codex', 'config.toml');

  if (fs.existsSync(pluginDir)) {
    fs.rmSync(pluginDir, { recursive: true, force: true });
    // Remove parent dir if empty
    const parentDir = path.dirname(pluginDir);
    if (fs.existsSync(parentDir) && fs.readdirSync(parentDir).length === 0) {
      fs.rmSync(parentDir, { recursive: true, force: true });
    }
    console.log(`✓ Removed Codex plugin at ${pluginDir}`);
  } else {
    console.log('⊘ Codex plugin not found — nothing to remove');
  }

  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    if (config.includes('[plugins."kitsune@personal"]')) {
      const cleaned = config.replace(/\n*\[plugins\."kitsune@personal"\]\nenabled = true\n?/g, '\n');
      fs.writeFileSync(configPath, cleaned);
      console.log('✓ Removed kitsune@personal from config.toml');
    }
  }
}

module.exports = { installCodex, uninstallCodex, installCodexPlugin, uninstallCodexPlugin };
