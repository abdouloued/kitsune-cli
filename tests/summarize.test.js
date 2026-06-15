const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { summarize } = require('../src/summarize');

describe('summarize — tier 1: test results', () => {
  it('extracts passed/failed counts', () => {
    const text = 'compiling...\nsome verbose output\n12 passed, 2 failed\ndone';
    const result = summarize(text);
    assert.ok(result.includes('12 passed'), `got: ${result}`);
  });

  it('extracts PASS keyword line', () => {
    const text = 'running tests\nPASS src/foo.test.js\nsome other line';
    assert.ok(summarize(text).includes('PASS'));
  });
});

describe('summarize — tier 2: error lines', () => {
  it('extracts error line', () => {
    const text = 'starting build\nError: Cannot find module foo\nstacktrace line\nmore stuff';
    assert.ok(summarize(text).includes('Error:'));
  });

  it('extracts TypeError line', () => {
    const text = 'TypeError: undefined is not a function\n  at Object.<anonymous>';
    assert.ok(summarize(text).includes('TypeError:'));
  });
});

describe('summarize — tier 3: file diffs', () => {
  it('extracts file changed count', () => {
    const text = 'M src/foo.js\nM src/bar.js\n2 files changed, 10 insertions(+), 3 deletions(-)';
    assert.ok(summarize(text).includes('2 files changed'));
  });
});

describe('summarize — tier 4: build timing', () => {
  it('extracts build duration line', () => {
    const text = 'webpack compiling...\ncompiled in 4200ms\nmain.js 200kb';
    assert.ok(summarize(text).includes('compiled in'));
  });
});

describe('summarize — tier 5: exit status', () => {
  it('extracts exit code line', () => {
    const text = 'process exited with exit code 1\nsome other stuff';
    assert.ok(summarize(text).includes('exit code'));
  });
});

describe('summarize — fallback', () => {
  it('returns last 3 lines when no tier matches', () => {
    const text = 'line1\nline2\nline3\nline4\nline5';
    const result = summarize(text);
    assert.ok(result.includes('line5'));
    assert.ok(!result.includes('line1'));
  });

  it('returns ... for empty input', () => {
    assert.equal(summarize(''), '...');
    assert.equal(summarize('   \n  \n  '), '...');
  });

  it('joins multiple tier matches with ·', () => {
    const text = '10 passed\n2 failed\n1 skipped';
    const result = summarize(text);
    assert.ok(result.includes(' · '), `expected · separator, got: ${result}`);
  });
});
