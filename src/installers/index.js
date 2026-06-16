'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const readline = require('readline');

const { installClaudeCode, uninstallClaudeCode } = require('./claude-code');
const { installOpencode,   uninstallOpencode   } = require('./opencode');
const { installSkill,      uninstallSkill      } = require('./skill');
const { installOllama,     uninstallOllama, isOllamaInstalled } = require('./ollama');

function detectOpencodeDir() {
  const candidates = [
    path.join(os.homedir(), '.config', 'opencode'),
    path.join(os.homedir(), '.opencode'),
  ];
  return candidates.find(d => fs.existsSync(d)) || null;
}

function prompt(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

async function installAll({ yes = false, projectDir } = {}) {
  const results = [];

  const claudeDir = path.join(projectDir || process.cwd(), '.claude');
  if (fs.existsSync(claudeDir)) {
    await installClaudeCode({ projectDir });
    results.push('claude-code');
  } else {
    console.log('⊘ .claude/ not found — skipping Claude Code hook');
  }

  const opencodeDir = detectOpencodeDir();
  if (opencodeDir) {
    await installOpencode();
    results.push('opencode');
  } else {
    console.log('⚠ Could not detect opencode config — run kitsune install --opencode manually');
  }

  let installSkillFlag = yes;
  if (!yes) {
    installSkillFlag = await prompt('Install Claude Code skill (SKILL.md)? [y/N] ');
  }

  if (installSkillFlag) {
    await installSkill({ projectDir });
    results.push('skill');
  } else {
    console.log('⊘ Skill skipped');
  }

  // Ollama: install wrappers if ollama binary is present
  if (isOllamaInstalled()) {
    await installOllama();
    results.push('ollama');
  } else {
    console.log('⊘ ollama not found — skipping (run kitsune install --ollama after installing ollama)');
  }

  console.log('\nSummary:', results.length ? results.join(', ') + ' installed' : 'nothing installed');
}

async function uninstallAll({ projectDir } = {}) {
  await uninstallClaudeCode({ projectDir });
  await uninstallOpencode();
  await uninstallSkill({ projectDir });
  await uninstallOllama();
  console.log('\n✓ Uninstall complete');
}

module.exports = { installAll, uninstallAll };
