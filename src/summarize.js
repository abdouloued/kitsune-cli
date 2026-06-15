const TIERS = [
  {
    name: 'test-results',
    patterns: [
      /\d+\s+(?:tests?\s+)?passed/i,
      /\d+\s+(?:tests?\s+)?failed/i,
      /\d+\s+(?:tests?\s+)?skipped/i,
      /\bPASS\b/,
      /\bFAIL\b/,
      /[✓✗❌✅]/,
      /all \d+ tests/i,
    ],
  },
  {
    name: 'error',
    patterns: [
      /^(?:Error|Exception|TypeError|SyntaxError|ReferenceError|fatal)[:\s>]/im,
      /Traceback/i,
      /at line \d+/i,
    ],
  },
  {
    name: 'file-diff',
    patterns: [
      /\d+ files? changed/i,
      /\d+ insertions?/i,
      /\d+ deletions?/i,
    ],
  },
  {
    name: 'build',
    patterns: [
      /build (?:succeeded|failed)/i,
      /compiled in \d+/i,
      /finished in \d+(?:ms|s)/i,
      /done in \d+(?:ms|s)?/i,
    ],
  },
  {
    name: 'exit-status',
    patterns: [
      /exit code \d+/i,
      /returned \d+/i,
      /status: \d+/i,
    ],
  },
];

function summarize(text, maxLines = 3) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '...';

  for (const tier of TIERS) {
    const matched = lines.filter(line =>
      tier.patterns.some(p => p.test(line))
    );
    if (matched.length > 0) {
      return matched.slice(0, 3).join(' · ');
    }
  }

  return lines.slice(-maxLines).join(' · ');
}

async function summarizeSmart(text, persona) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!anthropicKey && !openaiKey) return summarize(text);

  try {
    if (anthropicKey) return await _callAnthropic(text, persona, anthropicKey);
    return await _callOpenAI(text, persona, openaiKey);
  } catch {
    return summarize(text);
  }
}

async function _callAnthropic(text, persona, apiKey) {
  const https = require('https');
  const prompt = `${persona.tone}\n\nSummarize this CLI output in 1-2 sentences:\n\n${text.slice(0, 2000)}`;
  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data).content[0].text.trim()); }
        catch { reject(new Error('parse error')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

async function _callOpenAI(text, persona, apiKey) {
  const https = require('https');
  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    max_tokens: 150,
    messages: [
      { role: 'system', content: persona.tone },
      { role: 'user', content: `Summarize this CLI output in 1-2 sentences:\n\n${text.slice(0, 2000)}` },
    ],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data).choices[0].message.content.trim()); }
        catch { reject(new Error('parse error')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

module.exports = { summarize, summarizeSmart };
