const COLORS = {
  reset:        '\x1b[0m',
  dim:          '\x1b[2m',
  bold:         '\x1b[1m',
  orange:       '\x1b[33m',
  brightOrange: '\x1b[93m',
  gray:         '\x1b[90m',
  cyan:         '\x1b[36m',
  white:        '\x1b[37m',
  brightWhite:  '\x1b[97m',
};

// Per-persona palettes — color reinforces each persona's tone visually:
// roast = cold gray (detached), zen = calm cyan, hype = bright warm, noir = understated white
const PERSONA_COLORS = {
  default: { fox: COLORS.orange,        bubble: COLORS.dim  },
  roast:   { fox: COLORS.gray,          bubble: COLORS.dim  },
  zen:     { fox: COLORS.cyan,          bubble: COLORS.dim  },
  hype:    { fox: COLORS.brightOrange,  bubble: COLORS.bold },
  noir:    { fox: COLORS.white,         bubble: COLORS.dim  },
};

let _noColorFlag = false;

function setNoColorFlag(val) {
  _noColorFlag = val;
}

function colorEnabled() {
  return !process.env.NO_COLOR && !_noColorFlag;
}

function colorize(str, ...codes) {
  if (!colorEnabled()) return str;
  return codes.join('') + str + COLORS.reset;
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Returns a 24-bit foreground ANSI escape code, or '' when color is disabled.
 * @param {number} r @param {number} g @param {number} b
 * @returns {string}
 */
function rgb(r, g, b) {
  if (!colorEnabled()) return '';
  return `\x1b[38;2;${r};${g};${b}m`;
}

/**
 * Wraps a string with a 24-bit foreground color and reset.
 * @param {string} str @param {number} r @param {number} g @param {number} b
 * @returns {string}
 */
function colorizeRgb(str, r, g, b) {
  if (!colorEnabled()) return str;
  return `\x1b[38;2;${r};${g};${b}m${str}${COLORS.reset}`;
}

module.exports = { COLORS, PERSONA_COLORS, colorize, colorizeRgb, rgb, stripAnsi, colorEnabled, setNoColorFlag };
