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

describe('rgb', () => {
  it('returns a 24-bit foreground ANSI escape code', () => {
    delete require.cache[require.resolve('../src/color')];
    const { rgb } = require('../src/color');
    const code = rgb(224, 123, 42);
    assert.equal(code, '\x1b[38;2;224;123;42m');
  });

  it('returns empty string when NO_COLOR is set', () => {
    process.env.NO_COLOR = '1';
    delete require.cache[require.resolve('../src/color')];
    const { rgb } = require('../src/color');
    assert.equal(rgb(255, 0, 0), '');
    delete process.env.NO_COLOR;
    delete require.cache[require.resolve('../src/color')];
  });

  it('colorizeRgb wraps string with 24-bit color and reset', () => {
    delete require.cache[require.resolve('../src/color')];
    const { colorizeRgb } = require('../src/color');
    const result = colorizeRgb('hello', 240, 180, 60);
    assert.ok(result.startsWith('\x1b[38;2;240;180;60m'), 'should start with rgb escape');
    assert.ok(result.includes('hello'));
    assert.ok(result.endsWith('\x1b[0m'), 'should end with reset');
  });
});
