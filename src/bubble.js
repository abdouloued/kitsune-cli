// Speech bubble renderer - cowsay style with text wrapping

/**
 * Wraps text to a given width, breaking on word boundaries.
 * @param {string} text
 * @param {number} width
 * @returns {string[]} array of wrapped lines
 */
function wrapText(text, width) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > width) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/**
 * Renders a speech bubble around the given text.
 * @param {string} text - the message to display
 * @param {object} opts
 * @param {number} opts.maxWidth - max width of bubble interior (default 40)
 * @param {string} opts.style - "say" (rounded tail) or "think" (bubble dots)
 * @param {function} opts.applyBorderColor - optional function to color border characters
 * @returns {string[]} array of lines forming the bubble
 */
function renderBubble(text, opts = {}) {
  const maxWidth = opts.maxWidth || 40;
  const style = opts.style || "say";
  const applyBorderColor = opts.applyBorderColor || (s => s);

  const lines = wrapText(text, maxWidth);
  const innerWidth = Math.max(...lines.map((l) => l.length));

  const top = applyBorderColor(" " + "_".repeat(innerWidth + 2));
  const bottom = applyBorderColor(" " + "-".repeat(innerWidth + 2));

  const body = lines.map((line, i) => {
    const padded = line.padEnd(innerWidth, " ");
    let left = "|";
    let right = "|";

    if (lines.length === 1) {
      left = "<";
      right = ">";
    } else if (i === 0) {
      left = "/";
      right = "\\";
    } else if (i === lines.length - 1) {
      left = "\\";
      right = "/";
    }

    return applyBorderColor(left) + " " + padded + " " + applyBorderColor(right);
  });

  const tail =
    style === "think"
      ? ["    o", "     o", "      O"]
      : ["    \\", "     \\"];

  return [top, ...body, bottom, ...tail];
}

/**
 * Combines a speech bubble with ASCII art below it.
 * @param {string} text
 * @param {string[]} artLines - array of art lines
 * @param {object} opts - passed to renderBubble
 * @returns {string} final combined string ready to print
 */
function renderWithArt(text, artLines, opts = {}) {
  const bubble = renderBubble(text, opts);
  return [...bubble, ...artLines].join("\n");
}

module.exports = { wrapText, renderBubble, renderWithArt };
