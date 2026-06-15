const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { renderBubble, renderWithArt } = require('../src/bubble');
const { stripAnsi } = require('../src/color');

describe('bubble', () => {
  it('renders single-line bubble with < > delimiters', () => {
    const lines = renderBubble('hello');
    const body = lines.find(l => l.includes('hello'));
    assert.ok(body.startsWith('<'), `expected < but got: ${body}`);
    assert.ok(body.endsWith('>'), `expected > but got: ${body}`);
  });

  it('renders multi-line bubble with / \\ | delimiters', () => {
    const long = 'word '.repeat(20).trim();
    const lines = renderBubble(long, { maxWidth: 20 });
    const firstBody = lines[1];
    assert.ok(firstBody.startsWith('/'), `first body line should start with /: ${firstBody}`);
  });

  it('applies border color when applyBorderColor provided', () => {
    const colored = renderBubble('hi', {
      applyBorderColor: s => '\x1b[33m' + s + '\x1b[0m',
    });
    const topLine = colored[0];
    assert.ok(topLine.includes('\x1b[33m'), 'top line should contain color code');
    assert.ok(stripAnsi(topLine).includes('_'), 'stripped top line should still have underscores');
  });

  it('renderWithArt concatenates bubble + art lines', () => {
    const art = ['  /\\  ', ' |  | '];
    const result = renderWithArt('hi', art);
    assert.ok(result.includes('/\\'));
    assert.ok(result.includes('hi'));
  });
});
