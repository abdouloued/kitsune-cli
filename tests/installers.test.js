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
