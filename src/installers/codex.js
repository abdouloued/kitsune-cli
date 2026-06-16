'use strict';

const fs   = require('fs');
const path = require('path');

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

module.exports = { installCodex, uninstallCodex };
