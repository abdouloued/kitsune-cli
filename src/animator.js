// src/animator.js — fox art colorization, tail shimmer, thinking transition
//
// smoke test:
//   node -e "const {buildFrame}=require('./src/animator');const {FOX_UNICODE,TAIL_META}=require('./art/fox-ascii');buildFrame(FOX_UNICODE.default,TAIL_META.default,{},3).forEach(l=>process.stdout.write(l+'\n'))"

'use strict';

const { COLORS, rgb, colorEnabled } = require('./color');

// Fox body color zones by row index (rows 0-5; row 6 is tail, handled separately)
const BODY_ROW_COLORS = [
  [240, 180,  60],  // row 0 — ears (amber)
  [224, 123,  42],  // row 1 — head (orange)
  [224, 123,  42],  // row 2 — eyes (orange)
  [255, 240, 210],  // row 3 — snout/nose (cream)
  [255, 240, 210],  // row 4 — belly (cream)
  [224, 123,  42],  // row 5 — base (orange)
];

// Shimmer color stops
const TAIL_BASE  = [240, 180,  60];  // ≋ resting color (amber)
const TAIL_FLANK = [248, 210, 100];  // one position either side of peak
const TAIL_PEAK  = [255, 240, 180];  // brightest point — char swaps ≋→≈

let _shimmerInterval = null;

/**
 * Builds one colored frame of fox art. Safe to call with tailMeta = null.
 * @param {string[]} lines - raw art strings (from FOX_UNICODE)
 * @param {object|null} tailMeta - TAIL_META entry for this pose, or null
 * @param {object} _palette - persona palette (reserved for future border tinting)
 * @param {number|null} sweepPos - shimmer peak index into shimmerPositions, or null for base color
 * @returns {string[]} colored lines, same length as input
 */
function buildFrame(lines, tailMeta, _palette, sweepPos) {
  if (!colorEnabled()) return [...lines];

  return lines.map((line, rowIdx) => {
    if (tailMeta && tailMeta.rowIndices.includes(rowIdx)) {
      const posInMeta = tailMeta.rowIndices.indexOf(rowIdx);
      const shimmerPositions = tailMeta.shimmerPositions[posInMeta];
      return _buildTailRow(line, shimmerPositions, sweepPos);
    }
    const [r, g, b] = BODY_ROW_COLORS[rowIdx] || [224, 123, 42];
    return rgb(r, g, b) + line + COLORS.reset;
  });
}

/**
 * Builds a single tail row with the shimmer sweep applied.
 * @param {string} line - raw tail line
 * @param {number[]} shimmerPositions - char indices of ≋ in this row
 * @param {number|null} sweepPos - peak index, or null for base color throughout
 * @returns {string}
 */
function _buildTailRow(line, shimmerPositions, sweepPos) {
  const chars = [...line];
  const shimSet = new Set(shimmerPositions);

  const peakCharIdx  = sweepPos != null ? shimmerPositions[sweepPos % shimmerPositions.length] : -1;
  const flankIndices = sweepPos != null ? new Set([
    shimmerPositions[(sweepPos - 1 + shimmerPositions.length) % shimmerPositions.length],
    shimmerPositions[(sweepPos + 1) % shimmerPositions.length],
  ]) : new Set();

  let out = '';
  for (let i = 0; i < chars.length; i++) {
    if (!shimSet.has(i)) {
      out += chars[i];
    } else if (sweepPos != null && i === peakCharIdx) {
      out += rgb(...TAIL_PEAK) + '≈' + COLORS.reset;
    } else if (sweepPos != null && flankIndices.has(i)) {
      out += rgb(...TAIL_FLANK) + chars[i] + COLORS.reset;
    } else {
      out += rgb(...TAIL_BASE) + chars[i] + COLORS.reset;
    }
  }
  return out;
}

/**
 * Starts the tail shimmer loop. The interval is unref'd so it won't block process exit.
 * In agent mode, cli.js adds its own keepalive. Returns a stop function.
 * @param {string[]} artLines - raw art for this pose
 * @param {object|null} tailMeta - TAIL_META entry, or null (no-op if null)
 * @param {object} palette - persona palette
 * @returns {() => void} stop function
 */
function startTailShimmer(artLines, tailMeta, palette) {
  if (!tailMeta || !process.stdout.isTTY) return () => {};

  const shimmerPositions = tailMeta.shimmerPositions[0];
  let sweepPos = 0;

  _shimmerInterval = setInterval(() => {
    sweepPos = (sweepPos + 1) % shimmerPositions.length;
    const frame = buildFrame(artLines, tailMeta, palette, sweepPos);
    const tailLine = frame[tailMeta.rowIndices[0]];
    // Cursor sits one line below the last output line (tail). Move up, clear, rewrite.
    process.stdout.write('\x1b[1A\x1b[2K\r' + tailLine + '\n');
  }, 100);

  _shimmerInterval.unref();

  return stopAnimation;
}

/**
 * Renders the thinking pose for 500ms then erases it, leaving the cursor where it started.
 * Call this before the final render when KITSUNE_AGENT is set.
 * @param {string[]} thinkingLines - FOX_UNICODE.thinking (or FOX_ASCII equivalent)
 * @param {object|null} thinkingMeta - TAIL_META.thinking
 * @param {object} palette - persona palette
 * @returns {Promise<void>}
 */
async function thinkingTransition(thinkingLines, thinkingMeta, palette) {
  if (!process.stdout.isTTY) return;

  const frame = buildFrame(thinkingLines, thinkingMeta, palette, null);
  const numLines = frame.length;

  process.stdout.write(frame.join('\n') + '\n');
  await new Promise(resolve => setTimeout(resolve, 500));

  // Erase: move to top of block, clear each line, return to top
  process.stdout.write(`\x1b[${numLines}A`);
  for (let i = 0; i < numLines; i++) {
    process.stdout.write('\x1b[2K\r\n');
  }
  process.stdout.write(`\x1b[${numLines}A`);
}

/**
 * Stops the active shimmer interval. Safe to call multiple times.
 */
function stopAnimation() {
  if (_shimmerInterval) {
    clearInterval(_shimmerInterval);
    _shimmerInterval = null;
  }
}

module.exports = { buildFrame, startTailShimmer, thinkingTransition, stopAnimation };
