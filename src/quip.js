'use strict';

const QUIPS = {
  roast: {
    success: [
      "Finally. Don't make it weird.",
      "It passed. I've seen better.",
      "Sure. Cool. Whatever.",
      "Took long enough.",
      "Green. Good for you, I guess.",
    ],
    error: [
      "Called it.",
      "Shocking. Truly shocking.",
      "I'm not surprised. Are you?",
      "Well, well, well.",
      "My disappointment is immeasurable.",
    ],
    neutral: [
      "I've seen better.",
      "...okay.",
      "Sure, sure.",
      "Riveting.",
      "Cool story.",
    ],
  },

  zen: {
    success: [
      "The path continues.",
      "Stillness in completion.",
      "Peace found in passing.",
      "Balance restored.",
    ],
    error: [
      "Every error is a teacher.",
      "The way reveals itself through failure.",
      "Breathe. Begin again.",
      "Resistance is the path.",
    ],
    neutral: [
      "Observe without judgment.",
      "Be present with this.",
      "All is process.",
      "Neither good nor bad. Only what is.",
    ],
  },

  hype: {
    success: [
      "LET'S GOOO!!",
      "ABSOLUTE LEGEND!!",
      "UNSTOPPABLE!! YOU'RE UNSTOPPABLE!!",
      "THIS IS THE GREATEST DAY!!",
    ],
    error: [
      "SO CLOSE!! YOU'VE GOT THIS!!",
      "EPIC ATTEMPT!! BOUNCE BACK!!",
      "FAILURE IS JUST A SPEED BUMP ON THE ROAD TO GREATNESS!!",
    ],
    neutral: [
      "THIS IS INCREDIBLE!!",
      "YOU ARE DOING AMAZING!!",
      "KEEP GOING!! YOU'RE WINNING AT LIFE!!",
    ],
  },

  noir: {
    success: [
      "Case closed. For now.",
      "Another one in the books.",
      "The city sleeps. So does the bug.",
      "Clean hands. This time.",
    ],
    error: [
      "Saw it coming a mile away.",
      "The crime scene never lies.",
      "Back to square one. Like always.",
      "The suspect: your own code.",
    ],
    neutral: [
      "The fog rolls in.",
      "Something doesn't add up.",
      "I've got a bad feeling about this.",
      "The terminal knows things.",
    ],
  },

  tsundere: {
    success: [
      "It passed. Not that I was watching.",
      "Fine. I guess it works.",
      "...whatever. Good job. Don't read into that.",
      "I wasn't worried. At all.",
    ],
    error: [
      "I KNEW it would break. Not that I care.",
      "Of course. As expected. Fine, I'll help.",
      "This is your fault. I'm still helping though. Don't thank me.",
    ],
    neutral: [
      "Don't read into this.",
      "I'm only here because I have to be.",
      "...hmm. Interesting. Not that I think so.",
    ],
  },

  sensei: {
    success: [
      "Good. Now ask yourself why it works.",
      "Progress. Reflect on the path that led here.",
      "The foundation holds. What will you build on it?",
    ],
    error: [
      "Every bug is a question. What does this one ask?",
      "Failure is the greatest teacher. Listen carefully.",
      "What does this error reveal about your assumptions?",
    ],
    neutral: [
      "Observe. Learn. Grow.",
      "What does this teach you?",
      "Consider the whole before judging the part.",
    ],
  },

  chaos: {
    success: [
      "THE UNIVERSE REJOICES. probably.",
      "green. it's all green. beautiful chaos.",
      "WE DID IT?? did we?? yes. maybe. YES.",
    ],
    error: [
      "lol. anyway.",
      "THE VOID LAUGHS. with you, not at you. maybe.",
      "chaos is just order wearing a mask. the mask slipped.",
    ],
    neutral: [
      "something happened. i think.",
      "THE MIDDLE. we live here now.",
      "time is a flat circle and so is this output.",
    ],
  },
};

/**
 * Returns a random persona-flavored quip for the given mood.
 * Returns null for default persona (no quip — just wraps cleanly).
 * @param {string} personaKey
 * @param {string} mood - "success" | "error" | "thinking" | "idle" | "neutral"
 * @returns {string|null}
 */
function getQuip(personaKey, mood) {
  const personaQuips = QUIPS[personaKey];
  if (!personaQuips) return null;
  const bucket = mood === 'success' ? 'success'
               : mood === 'error'   ? 'error'
               : 'neutral';
  const options = personaQuips[bucket];
  return options[Math.floor(Math.random() * options.length)];
}

module.exports = { getQuip };
