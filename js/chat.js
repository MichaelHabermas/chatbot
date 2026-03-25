import { DEFAULT_BASE_URL } from './config.js';
import { getDom } from './dom.js';
import {
  expandWithHistory,
  hydeExpand,
  streamChatCompletion,
} from './api.js';
import { addTyping, appendMsg, renderMd } from './messages.js';
import { retrieve } from './retrieval.js';
import { chatHistory, corpus, setStreaming, streaming } from './state.js';
import { lsGet, saveHist } from './storage.js';

export function updateSend() {
  const dom = getDom();
  dom.sendBtn.disabled = streaming || corpus.length === 0;
  dom.sendHint.textContent =
    corpus.length === 0 ? 'Upload a document to enable chat' : '⌘↵ send · Esc clear';
}

export async function sendMessage() {
  const dom = getDom();
  const query = dom.chatInput.value.trim();
  if (!query || streaming || !corpus.length) return;
  dom.chatInput.value = '';
  dom.chips.classList.add('hidden');
  dom.chips.innerHTML = '';
  setStreaming(true);
  updateSend();
  appendMsg('user', query);

  const apiKey = lsGet('cb_key') || '';
  const baseUrl = (lsGet('cb_url') || DEFAULT_BASE_URL).replace(/\/$/, '');
  const model = dom.modelSelect.value;

  dom.retInd.classList.remove('hidden');
  const expandedQuery = await expandWithHistory(query, chatHistory, baseUrl, apiKey, model);
  const hydeQuery = await hydeExpand(expandedQuery, baseUrl, apiKey, model);
  const hits = retrieve(hydeQuery, corpus);
  dom.retInd.classList.add('hidden');

  const context = hits
    .map((h, i) => `[${i + 1}] (${h.doc.name}):\n${h.doc.chunks[h.i]}`)
    .join('\n\n');
  const system = `You are a helpful assistant. Answer based on the document excerpts below. If the answer isn't in the documents, say so clearly.\n\nExcerpts:\n${context}`;
  const messages = [
    { role: 'system', content: system },
    ...chatHistory.slice(-10),
    { role: 'user', content: query },
  ];

  let res;
  try {
    res = await streamChatCompletion({ baseUrl, apiKey, model, messages });
  } catch (e) {
    const err = /** @type {Error} */ (e);
    appendMsg('assistant', 'Network error: ' + err.message, null, false, true);
    setStreaming(false);
    updateSend();
    return;
  }

  if (!res.ok) {
    /** @type {Record<number, string>} */
    const errs = {
      401: 'Invalid API key — check the key in the top bar.',
      429: 'Rate limit reached. Wait a moment and try again.',
      500: 'API server error. Try again shortly.',
    };
    appendMsg('assistant', errs[res.status] || `API error ${res.status}`, null, false, true);
    setStreaming(false);
    updateSend();
    return;
  }

  addTyping();
  const typing = document.getElementById('_typing');
  let full = '';
  const aiMsg = appendMsg('assistant', '', hits, false);
  typing?.remove();
  const bub = aiMsg.querySelector('.bubble');
  if (bub) bub.innerHTML = '';

  const reader = res.body?.getReader();
  if (!reader || !bub) {
    setStreaming(false);
    updateSend();
    return;
  }

  const dec = new TextDecoder();
  let buf = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6);
        if (raw === '[DONE]') break;
        try {
          const delta = JSON.parse(raw).choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            bub.innerHTML = renderMd(full);
            dom.messages.scrollTop = dom.messages.scrollHeight;
          }
        } catch {
          /* ignore parse errors */
        }
      }
    }
  } catch (e) {
    const err = /** @type {Error} */ (e);
    if (!full) {
      aiMsg.remove();
      appendMsg('assistant', 'Stream interrupted: ' + err.message, null, false, true);
    }
  }

  if (full) {
    chatHistory.push({ role: 'assistant', content: full });
    saveHist();
  }
  setStreaming(false);
  updateSend();
}

export function initChat() {
  const dom = getDom();
  dom.chatInput.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void sendMessage();
    }
    if (e.key === 'Escape') dom.chatInput.value = '';
  });
  dom.sendBtn.addEventListener('click', () => void sendMessage());
}
