import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { FOX_ASCII, FOX_UNICODE } = require('../art/fox-ascii.js');
const { renderWithArt } = require('../src/bubble.js');
const { getPersona, getArtPose } = require('../src/personas.js');
const { detectMood } = require('../src/mood.js');
const { summarize } = require('../src/summarize.js');

function supportsUnicode() {
  return /UTF-8/i.test(process.env.LANG || '') || /UTF-8/i.test(process.env.LC_ALL || '');
}

function render(text, personaKey) {
  const key = personaKey || 'default';
  const persona = getPersona(key);
  const summary = summarize(text);
  const mood = detectMood(text);
  const poseKey = getArtPose(key, mood);
  const artSet = supportsUnicode() ? FOX_UNICODE : FOX_ASCII;
  const art = artSet[poseKey] || artSet.default;
  return renderWithArt(summary, art, { maxWidth: 40 });
}

const server = new McpServer({ name: 'kitsune', version: '0.1.0' });

server.tool(
  'kitsune_say',
  {
    text: z.string().describe('Text to render in the kitsune speech bubble'),
    persona: z.string().optional().describe('Persona: default | roast | zen | hype | noir | tsundere | sensei | chaos'),
  },
  async ({ text, persona }) => ({
    content: [{ type: 'text', text: render(text, persona) }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
