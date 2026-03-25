import { getDom } from './dom.js';

/**
 * @param {string} apiKey
 */
function authHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * @param {{
 *   baseUrl: string,
 *   apiKey: string,
 *   model: string,
 *   messages: { role: string, content: string }[],
 *   max_tokens?: number,
 *   stream?: boolean
 * }} opts
 */
export async function postChatCompletion(opts) {
  const { baseUrl, apiKey, model, messages, max_tokens, stream = false } = opts;
  return fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify({ model, messages, stream, ...(max_tokens != null ? { max_tokens } : {}) }),
  });
}

/**
 * @param {{
 *   baseUrl: string,
 *   apiKey: string,
 *   model: string,
 *   messages: { role: string, content: string }[],
 * }} opts
 */
export async function streamChatCompletion(opts) {
  const { baseUrl, apiKey, model, messages } = opts;
  return fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify({ model, messages, stream: true }),
  });
}

/**
 * @param {string} query
 * @param {{ role: string, content: string }[]} history
 * @param {string} baseUrl
 * @param {string} apiKey
 * @param {string} model
 */
export async function expandWithHistory(query, history, baseUrl, apiKey, model) {
  if (!history.length) return query;
  try {
    const ctx = history
      .slice(-4)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');
    const res = await postChatCompletion({
      baseUrl,
      apiKey,
      model,
      stream: false,
      max_tokens: 80,
      messages: [
        {
          role: 'user',
          content: `Rewrite the question as a fully self-contained search query using the conversation context. Return only the rewritten query, nothing else.\n\nConversation:\n${ctx}\n\nQuestion: ${query}`,
        },
      ],
    });
    if (!res.ok) return query;
    const j = await res.json();
    return j.choices?.[0]?.message?.content?.trim() || query;
  } catch {
    return query;
  }
}

/**
 * @param {string} query
 * @param {string} baseUrl
 * @param {string} apiKey
 * @param {string} model
 */
export async function hydeExpand(query, baseUrl, apiKey, model) {
  try {
    const res = await postChatCompletion({
      baseUrl,
      apiKey,
      model,
      stream: false,
      max_tokens: 120,
      messages: [
        {
          role: 'user',
          content: `Write one paragraph that would answer this question if found in a document: ${query}`,
        },
      ],
    });
    if (!res.ok) return query;
    const j = await res.json();
    const hyp = j.choices?.[0]?.message?.content || '';
    return hyp ? hyp + ' ' + query : query;
  } catch {
    return query;
  }
}

/**
 * @param {import('./state.js').CorpusDoc} doc
 * @param {string} apiKey
 * @param {string} baseUrl
 * @param {string} model
 */
export async function suggestQuestions(doc, apiKey, baseUrl, model) {
  if (!apiKey && !baseUrl.includes('localhost')) return;
  try {
    const sample = doc.chunks.slice(0, 3).join('\n').slice(0, 1200);
    const res = await postChatCompletion({
      baseUrl,
      apiKey,
      model,
      stream: false,
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: `Given this document excerpt, generate 3 short, specific questions a user might ask. Return a JSON array of strings only, no explanation.\n\n${sample}`,
        },
      ],
    });
    if (!res.ok) return;
    const j = await res.json();
    const text = j.choices?.[0]?.message?.content?.trim() || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return;
    const questions = JSON.parse(match[0]).slice(0, 3);
    const dom = getDom();
    const chips = dom.chips;
    chips.innerHTML = '';
    questions.forEach((q) => {
      const btn = document.createElement('button');
      btn.textContent = q;
      btn.addEventListener('click', () => {
        dom.chatInput.value = q;
        chips.classList.add('hidden');
        chips.innerHTML = '';
        dom.chatInput.focus();
      });
      chips.appendChild(btn);
    });
    chips.classList.remove('hidden');
  } catch {
    /* ignore */
  }
}
