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
