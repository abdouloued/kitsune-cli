const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { FOX_UNICODE, TAIL_META } = require('../art/fox-ascii');

describe('buildFrame', () => {
  // Force color on for tests
  before(() => { process.env.FORCE_COLOR = '1'; delete require.cache[require.resolve('../src/color')]; });
  after(() => { delete process.env.FORCE_COLOR; delete require.cache[require.resolve('../src/color')]; });

  it('returns same number of lines as input', () => {
    const { buildFrame } = require('../src/animator');
    const lines = FOX_UNICODE.default;
    const result = buildFrame(lines, TAIL_META.default, {}, null);
    assert.equal(result.length, lines.length);
  });

  it('handles tailMeta = null without crashing', () => {
    const { buildFrame } = require('../src/animator');
    const lines = FOX_UNICODE.error;
    assert.doesNotThrow(() => buildFrame(lines, null, {}, null));
    assert.doesNotThrow(() => buildFrame(lines, null, {}, 3));
  });

  it('with sweepPos=null, tail row contains no ≈ character', () => {
    const { buildFrame } = require('../src/animator');
    const { stripAnsi } = require('../src/color');
    const result = buildFrame(FOX_UNICODE.default, TAIL_META.default, {}, null);
    const tailLine = stripAnsi(result[6]);
    assert.ok(!tailLine.includes('≈'), 'no swap char when sweepPos is null');
  });

  it('with sweepPos=0, tail row contains exactly one ≈ character', () => {
    const { buildFrame } = require('../src/animator');
    const { stripAnsi } = require('../src/color');
    const result = buildFrame(FOX_UNICODE.default, TAIL_META.default, {}, 0);
    const tailLine = stripAnsi(result[6]);
    const swapCount = (tailLine.match(/≈/g) || []).length;
    assert.equal(swapCount, 1, 'exactly one ≈ at sweep peak');
  });

  it('non-tail rows are strings (not undefined)', () => {
    const { buildFrame } = require('../src/animator');
    const result = buildFrame(FOX_UNICODE.default, TAIL_META.default, {}, null);
    for (let i = 0; i < 6; i++) {
      assert.equal(typeof result[i], 'string', `row ${i} should be a string`);
    }
  });

  it('returns plain strings when NO_COLOR is set', () => {
    process.env.NO_COLOR = '1';
    delete require.cache[require.resolve('../src/color')];
    delete require.cache[require.resolve('../src/animator')];
    const { buildFrame } = require('../src/animator');
    const result = buildFrame(FOX_UNICODE.default, TAIL_META.default, {}, 4);
    assert.deepEqual(result, [...FOX_UNICODE.default]);
    delete process.env.NO_COLOR;
    delete require.cache[require.resolve('../src/color')];
    delete require.cache[require.resolve('../src/animator')];
  });
});
