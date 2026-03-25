import { LS } from './config.js';
import { initChat, updateSend } from './chat.js';
import { addDocRow, initDrop, setDocMeta, updateStats } from './corpus.js';
import { getDom } from './dom.js';
import { appendMsg } from './messages.js';
import { chatHistory, corpus } from './state.js';
import { idbAll, initIDB, lsGet } from './storage.js';
import { initAbout } from './ui/about.js';
import { initSettings } from './settings.js';

async function init() {
  initSettings();
  await initIDB();

  const saved = await idbAll();
  if (Array.isArray(saved)) {
    for (const doc of saved) {
      corpus.push(doc);
      setDocMeta(addDocRow(doc.id, doc.name, ''), `${doc.chunks.length} chunks`);
    }
  }

  updateStats();
  updateSend();

  const dom = getDom();
  if (corpus.length > 0 && dom.empty) {
    const p = dom.empty.querySelector('p');
    if (p) p.textContent = 'Ask a question about your documents.';
  }

  try {
    const raw = lsGet(LS.hist) || '[]';
    const parsed = JSON.parse(raw);
    chatHistory.length = 0;
    for (const m of parsed) {
      chatHistory.push(m);
      appendMsg(m.role, m.content, null, false);
    }
  } catch {
    chatHistory.length = 0;
  }

  initDrop();
  initAbout();
  initChat();
}

void init();
