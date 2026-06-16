const FOX_ASCII = {
  default: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (o)   (o) |',
    '|     ^     |',
    ' \\   ---   / ',
    "  `-------'  ",
    '  ~~_____~~  ',
  ],
  happy: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (^)   (^) |',
    '|    \\w/    |',
    ' \\   ~~~   / ',
    "  `-------'  ",
    '  ~~*****~~  ',
  ],
  error: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (x)   (x) |',
    '|     o     |',
    ' \\   ---   / ',
    "  `-------'  ",
    '  ~~_____~~  ',
  ],
  thinking: [
    '  /\\     /\\  ?',
    ' /  \\___/  \\ ',
    '| (-)   (-) |',
    '|     .     |',
    ' \\   ...   / ',
    "  `-------'  ",
    '  ~~_____~~  ',
  ],
  roast: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (~)   (^) |',
    '|    ,,,    |',
    ' \\   ---   / ',
    "  `-------'  ",
    '  ~~_____~~  ',
  ],
  sleeping: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (-)   (-) |  Z',
    '|    ---    |  z',
    ' \\   ~~~   / z ',
    "  `-------'   ",
    '  ~~_____~~   ',
  ],
  wave: [
    '  /\\     /\\   o/',
    ' /  \\___/  \\   |',
    '| (o)   (o) |  /',
    '|     ^     |    ',
    ' \\   ---   /     ',
    "  `-------'      ",
    '  ~~_____~~      ',
  ],
  confused: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (?)   (o) |',
    '|     ~     |',
    ' \\   ---   / ',
    "  `-------'  ",
    '  ~~_____~~  ',
  ],
};

const FOX_UNICODE = {
  default: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (◕)   (◕) |',
    '|     ▲     |',
    ' \\   ───   / ',
    '  ╰───────╯  ',
    '  ≋≋≋≋≋≋≋≋≋  ',
  ],
  happy: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (◕)   (◕) |',
    '|   ◕‿◕‿◕   |',
    ' \\   ───   / ',
    '  ╰───────╯  ',
    '  ≋≋≋✦✦✦≋≋≋  ',
  ],
  error: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (×)   (×) |',
    '|     ○     |',
    ' \\   ───   / ',
    '  ╰───────╯  ',
    '  ≋≋≋≋≋≋≋≋≋  ',
  ],
  thinking: [
    '  /\\     /\\  ？',
    ' /  \\___/  \\ ',
    '| (◔)   (◔) |',
    '|     ·     |',
    ' \\   ···   / ',
    '  ╰───────╯  ',
    '  ≋≋≋≋≋≋≋≋≋  ',
  ],
  roast: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (─)   (◕) |',
    '|    ‿‿‿    |',
    ' \\   ───   / ',
    '  ╰───────╯  ',
    '  ≋≋≋≋≋≋≋≋≋  ',
  ],
  sleeping: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (─)   (─) |  Z',
    '|    ───    |  z',
    ' \\   ~~~   / z ',
    '  ╰───────╯   ',
    '  ≋≋≋≋≋≋≋≋≋   ',
  ],
  wave: [
    '  /\\     /\\   ○/',
    ' /  \\___/  \\   |',
    '| (◕)   (◕) |  /',
    '|     ▲     |    ',
    ' \\   ───   /     ',
    '  ╰───────╯      ',
    '  ≋≋≋≋≋≋≋≋≋      ',
  ],
  confused: [
    '  /\\     /\\  ',
    ' /  \\___/  \\ ',
    '| (？)  (◕) |',
    '|     ～    |',
    ' \\   ───   / ',
    '  ╰───────╯  ',
    '  ≋≋≋≋≋≋≋≋≋  ',
  ],
};

/**
 * Per-pose tail metadata for the Unicode art set.
 * rowIndices: which rows (0-based within the 7-line art) are tail rows.
 * shimmerPositions: for each row in rowIndices, the char indices of ≋ chars.
 * null means the pose has no animatable tail — buildFrame skips shimmer.
 */
const TAIL_META = {
  default:  { rowIndices: [6], shimmerPositions: [[2, 3, 4, 5, 6, 7, 8, 9, 10]] },
  happy:    { rowIndices: [6], shimmerPositions: [[2, 3, 4, 8, 9, 10]] },
  thinking: { rowIndices: [6], shimmerPositions: [[2, 3, 4, 5, 6, 7, 8, 9, 10]] },
  roast:    { rowIndices: [6], shimmerPositions: [[2, 3, 4, 5, 6, 7, 8, 9, 10]] },
  sleeping: { rowIndices: [6], shimmerPositions: [[2, 3, 4, 5, 6, 7, 8, 9, 10]] },
  wave:     { rowIndices: [6], shimmerPositions: [[2, 3, 4, 5, 6, 7, 8, 9, 10]] },
  confused: { rowIndices: [6], shimmerPositions: [[2, 3, 4, 5, 6, 7, 8, 9, 10]] },
  error:    null,  // intentionally null — no shimmer even though art has ≋
};

module.exports = { FOX_ASCII, FOX_UNICODE, TAIL_META };
