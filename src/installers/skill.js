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

async function uninstallSkill({ projectDir } = {}) {
  const skillPath = path.join(
    projectDir || process.cwd(),
    '.claude', 'skills', 'kitsune', 'SKILL.md'
  );
  if (!fs.existsSync(skillPath)) {
    console.log(`⊘ SKILL.md not found at ${skillPath} — nothing to remove`);
    return;
  }
  fs.rmSync(skillPath);
  console.log(`✓ Removed kitsune skill at ${skillPath}`);
}

module.exports = { installSkill, uninstallSkill };
