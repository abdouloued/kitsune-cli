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
    catch (err) {
      throw new Error(`Cannot parse ${settingsPath}: ${err.message}\nFix the JSON manually before running kitsune install.`);
    }
  } else {
    fs.mkdirSync(base, { recursive: true });
  }

  if (!existing.hooks) existing.hooks = {};
  if (!existing.hooks.Stop) existing.hooks.Stop = [];

  if (!hasKitsuneHook(existing.hooks.Stop)) {
    existing.hooks.Stop.push({
      matcher: '',
      hooks: [{ type: 'command', command: 'KITSUNE_AGENT=claude-code kitsune' }],
    });
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n');
    console.log(`✓ Kitsune Stop hook added to ${settingsPath}`);
  } else {
    console.log(`✓ Kitsune hook already present in ${settingsPath} — skipping`);
  }
}

async function uninstallClaudeCode({ projectDir = null, global: isGlobal = false } = {}) {
  const base = isGlobal
    ? path.join(os.homedir(), '.claude')
    : path.join(projectDir || process.cwd(), '.claude');
  const settingsPath = path.join(base, 'settings.json');

  if (!fs.existsSync(settingsPath)) {
    console.log(`⊘ No settings.json found at ${settingsPath} — nothing to remove`);
    return;
  }

  let existing;
  try { existing = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); }
  catch (err) { throw new Error(`Cannot parse ${settingsPath}: ${err.message}`); }

  const stop = existing.hooks?.Stop;
  if (!Array.isArray(stop)) {
    console.log(`⊘ No Stop hooks in ${settingsPath} — nothing to remove`);
    return;
  }

  const before = stop.length;
  existing.hooks.Stop = stop.filter(entry =>
    !Array.isArray(entry.hooks) ||
    !entry.hooks.some(h => typeof h.command === 'string' && h.command.includes('kitsune'))
  );

  if (existing.hooks.Stop.length === before) {
    console.log(`⊘ Kitsune hook not found in ${settingsPath} — nothing to remove`);
    return;
  }

  fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n');
  console.log(`✓ Removed kitsune hook from ${settingsPath}`);
}

module.exports = { installClaudeCode, uninstallClaudeCode };
