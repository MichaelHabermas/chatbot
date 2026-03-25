import { CHUNK_SIZE, OVERLAP, TOP_K } from './config.js';

/**
 * @param {string} text
 * @returns {string[]}
 */
export function chunkText(text) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);
    if (end < text.length) {
      const win = text.slice(end - 150, end + 150);
      const m = win.search(/[.!?]\s+/);
      if (m !== -1) end = end - 150 + m + 1;
    }
    const c = text.slice(start, end).trim();
    if (c.length > 30) chunks.push(c);
    if (end >= text.length) break;
    start = end - OVERLAP;
  }
  return chunks;
}

/** @param {string} text */
export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** @param {string[]} tokens */
export function buildTF(tokens) {
  const tf = /** @type {Record<string, number>} */ ({});
  const n = tokens.length || 1;
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  for (const k in tf) tf[k] /= n;
  return tf;
}

/**
 * @param {string} query
 * @param {import('./state.js').CorpusDoc[]} corpus
 */
export function retrieve(query, corpus) {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length || !corpus.length) return [];
  const all = corpus.flatMap((doc) =>
    doc.tfData.map((d, i) => ({ doc, i, tf: d.tf }))
  );
  const N = all.length;
  const idf = Object.fromEntries(
    terms.map((t) => {
      const df = all.filter((c) => t in c.tf).length;
      return [t, Math.log((N + 1) / (df + 1)) + 1];
    })
  );
  return all
    .map((c) => ({
      ...c,
      score: terms.reduce((s, t) => s + (c.tf[t] || 0) * idf[t], 0),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}
