const fs = require('fs');
const path = require('path');
const os = require('os');

function hasKitsuneHook(stopArray) {
  return stopArray.some(entry =>
    Array.isArray(entry.hooks) &&
    entry.hooks.some(h => typeof h.command === 'string' && h.command.includes('kitsune'))
  );
}

async function installClaudeCode({ projectDir = null, global: isGlobal = false } = {}) {
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
