import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import { ExtractedDesign } from '@/lib/extract/types';

const MODELS = ['openrouter/free', 'openai/gpt-oss-20b:free', 'nvidia/nemotron-3-ultra-550b-a55b:free'] as const;
const URL_OR = 'https://openrouter.ai/api/v1/chat/completions';
const URL_GROQ = 'https://api.groq.com/openai/v1/chat/completions';
const URL_GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent';

export class UserFacingError extends Error {
  constructor(m: string) { super(m); this.name = 'UserFacingError'; }
}

/** Fetch with streaming — collect chunks from SSE, never timeout */
async function fetchStream(url: string, headers: Record<string,string>, body: object): Promise<string> {
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    try { const j = JSON.parse(txt); throw new Error(j?.error?.message || j?.error?.code || `HTTP ${res.status}`); }
    catch { throw new Error(txt.replace(/<[^>]*>/g, '').trim().slice(0, 120) || `HTTP ${res.status}`); }
  }

  if (!res.body) return (await res.text()) || '';

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', result = '', reasoning = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });

    const lines = buf.split('\n');
    buf = lines.pop() || '';

    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith('data:')) continue;
      const json = s.slice(5).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const d = JSON.parse(json);
        const delta = d?.choices?.[0]?.delta;
        if (delta?.content) result += delta.content;
        if (delta?.reasoning) reasoning += delta.reasoning;
      } catch {}
    }
  }

  // Handle Gemini-style responses (array of objects)
  if (!result && reasoning) return reasoning.replace(/^(Okay|Alright|Let me|The user|I'll|I need|Hmm|So)[^]*?\.\s*/i, '').trim();
  if (!result) throw new Error('Empty response');
  return result.trim();
}

async function callOR(model: string, sys: string, user: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('No OR key');
  return fetchStream(URL_OR,
    { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', 'X-Title': 'aidesign.md' },
    { model, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], temperature: 0.2, max_tokens: 3000, stream: true }
  );
}

async function callGroq(model: string, sys: string, user: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('No Groq key');
  return fetchStream(URL_GROQ,
    { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    { model, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], temperature: 0.2, max_tokens: 3000, stream: true }
  );
}

async function callGemini(sys: string, user: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('No Gemini key');

  const res = await fetch(`${URL_GEMINI}?alt=sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${sys}\n\n${user}` }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 3000 },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    try { const j = JSON.parse(txt); throw new Error(j?.error?.message || `HTTP ${res.status}`); }
    catch { throw new Error(txt.slice(0, 120)); }
  }

  const text = await res.text();
  let result = '';
  for (const line of text.split('\n')) {
    const s = line.trim();
    if (!s.startsWith('data:')) continue;
    try {
      const d = JSON.parse(s.slice(5));
      const part = d?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (part) result += part;
    } catch {}
  }
  if (!result.trim()) throw new Error('Empty');
  return result.trim();
}

function extract(text: string): string {
  let c = text.trim();
  const m = c.match(/^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/);
  if (m) c = m[1].trim();
  if (c.startsWith('# ')) return c;
  for (const line of c.split('\n')) {
    if (line.trim().startsWith('# ')) return c.substring(c.indexOf(line));
  }
  return c;
}

export async function generateDesignMD(e: ExtractedDesign): Promise<{ markdown: string; model: string }> {
  const prompt = buildUserPrompt(e);

  for (const model of MODELS) {
    try {
      const content = await callOR(model, SYSTEM_PROMPT, prompt);
      const md = extract(content);
      if (md.length >= 50) return { markdown: md, model: `or:${model}` };
    } catch (err: any) { console.log(`[AI] OR ${model}:`, err.message?.slice(0, 60)); }
  }

  if (process.env.GROQ_API_KEY) {
    for (const model of ['mixtral-8x7b-32768', 'llama-3.3-70b-versatile'] as const) {
      try {
        const content = await callGroq(model, SYSTEM_PROMPT, prompt);
        const md = extract(content);
        if (md.length >= 50) return { markdown: md, model: `groq:${model}` };
      } catch (err: any) { console.log(`[AI] Groq:`, err.message?.slice(0, 60)); }
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const content = await callGemini(SYSTEM_PROMPT, prompt);
      const md = extract(content);
      if (md.length >= 50) return { markdown: md, model: 'gemini:flash' };
    } catch (err: any) { console.log(`[AI] Gemini:`, err.message?.slice(0, 60)); }
  }

  return { markdown: fallback(e), model: 'fallback' };
}

function fallback(e: ExtractedDesign): string {
  const L: string[] = [`# DESIGN.md — ${e.domain}`, `_Generated ${new Date().toISOString().split('T')[0]} · aidesign.md_`, '', '## 1. Overview', `Design tokens extracted from ${e.url}.`, '', '## 2. Color Palette', '| Token Name | Hex Value | Role |', '|------------|-----------|------|'];
  e.colors.slice(0, 15).forEach((c, i) => { const r = c.role || (i === 0 ? 'Primary' : 'Secondary'); L.push(`| ${c.name || `--color-${r.toLowerCase()}-${i}`} | ${c.hex} | ${r} |`); });
  if (!e.colors.length) L.push('| No colors | — | — |');
  L.push('', '## 3. Typography');
  if (e.typography.fontFamilies.length) e.typography.fontFamilies.forEach(f => L.push(`- ${f.name}`)); else L.push('No fonts.');
  if (e.typography.sizes.length) { L.push('', '| Suggested Name | Value |', '|----------------|-------|'); e.typography.sizes.slice(0, 8).forEach((s, i) => L.push(`| --font-${['h1','h2','h3','h4','h5','h6','body','caption'][i] || i} | ${s.value} |`)); }
  L.push('', '## 4. Spacing & Layout');
  if (e.spacing.length) { L.push('| Token | Value |', '|-------|-------|'); e.spacing.slice(0, 10).forEach((s, i) => L.push(`| --space-${i + 1} | ${s.value} |`)); } else L.push('No spacing.');
  if (e.breakpoints.length) L.push(`Breakpoints: ${e.breakpoints.join(', ')}`);
  L.push('', '## 5. Border Radius & Elevation');
  if (e.borderRadius.length) e.borderRadius.forEach((r, i) => L.push(`- --radius-${i + 1}: ${r.value}`)); else L.push('No border-radius.');
  if (e.shadows.length) { L.push(''); e.shadows.slice(0, 5).forEach((s, i) => L.push(`- --shadow-${i + 1}: ${s}`)); }
  L.push('', '## 6. Components');
  if (e.components.length) e.components.slice(0, 8).forEach(c => L.push(`- **${c.name}** (${c.tag}): ${c.count}x`)); else L.push('No components.');
  L.push('', '## 7. CSS Custom Properties');
  const vars = Object.entries(e.cssVariables).slice(0, 20);
  if (vars.length) { L.push('```css', ':root {'); vars.forEach(([k, v]) => L.push(`  ${k}: ${v};`)); L.push('}', '```'); } else L.push('No CSS variables.');
  L.push('', '## 8. Usage Notes', `- Extracted from: ${e.url}`, e.meta.note ? `- Note: ${e.meta.note}` : '', '- Generated by aidesign.md');
  return L.filter(Boolean).join('\n');
}
