// Mood detection - infers a mood from piped input text or exit code
// This is a lightweight heuristic layer; can be enhanced with LLM calls later

const ERROR_PATTERNS = [
  /error/i,
  /fail(ed|ure)?/i,
  /exception/i,
  /traceback/i,
  /\bfatal\b/i,
  /not found/i,
  /denied/i,
];

const SUCCESS_PATTERNS = [
  /success/i,
  /passed/i,
  /done/i,
  /completed/i,
  /✓|✔|√/,
  /all (tests )?pass/i,
];

/**
 * Infers a mood key from text content and optional exit code.
 * @param {string} text
 * @param {number|null} exitCode - process exit code if known
 * @returns {"success"|"error"|"neutral"} mood key
 */
function detectMood(text, exitCode = null) {
  if (exitCode !== null) {
    if (exitCode !== 0) return "error";
  }

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(text)) return "error";
  }

  for (const pattern of SUCCESS_PATTERNS) {
    if (pattern.test(text)) return "success";
  }

  return "neutral";
}

module.exports = { detectMood, ERROR_PATTERNS, SUCCESS_PATTERNS };
