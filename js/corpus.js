import { DEFAULT_BASE_URL } from './config.js';
import { getDom } from './dom.js';
import { suggestQuestions } from './api.js';
import { appendMsg } from './messages.js';
import { parseDOCX, parsePDF, parseText } from './parsers.js';
import { buildTF, chunkText, tokenize } from './retrieval.js';
import { corpus } from './state.js';
import { idbDel, idbSave, lsGet } from './storage.js';
import { toast } from './ui/notifications.js';
import { updateSend } from './chat.js';

const icons = { pdf: '📕', docx: '📘', txt: '📄', md: '📝' };

/**
 * @param {string} id
 * @param {string} name
 * @param {string} meta
 */
export function addDocRow(id, name, meta) {
  const dom = getDom();
  document.getElementById('no-docs')?.remove();
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const row = document.createElement('div');
  row.className = 'doc';
  row.dataset.id = id;
  row.innerHTML = `<span class="dico">${ext in icons ? icons[/** @type {keyof typeof icons} */ (ext)] : '📄'}</span>
    <div class="dinfo">
      <div class="dname" title="${name}">${name}</div>
      <div class="dmeta">${meta}</div>
    </div>
    <button class="drm" title="Remove">×</button>`;
  row.querySelector('.drm')?.addEventListener('click', () => removeDoc(id));
  dom.docList.appendChild(row);
  return row;
}

/** @param {HTMLElement} row @param {string} meta */
export function setDocMeta(row, meta) {
  const dmeta = row.querySelector('.dmeta');
  if (dmeta) dmeta.textContent = meta;
}

export function refreshEmptyDocs() {
  const dom = getDom();
  if (!dom.docList.querySelector('.doc')) {
    dom.docList.innerHTML = '<div id="no-docs">No documents yet</div>';
  }
}

/** @param {string} id */
export async function removeDoc(id) {
  const idx = corpus.findIndex((d) => d.id === id);
  if (idx !== -1) corpus.splice(idx, 1);
  await idbDel(id);
  const dom = getDom();
  dom.docList.querySelector(`[data-id="${id}"]`)?.remove();
  refreshEmptyDocs();
  updateStats();
  updateSend();
}

export function updateStats() {
  const dom = getDom();
  const n = corpus.length;
  const c = corpus.reduce((s, d) => s + d.chunks.length, 0);
  dom.corpusStats.textContent = n ? `${n} doc${n > 1 ? 's' : ''} · ${c} chunks` : '';
}

/**
 * @param {File} file
 */
export async function processFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!['pdf', 'docx', 'txt', 'md'].includes(ext)) return;
  if (corpus.some((d) => d.name === file.name)) {
    toast(`"${file.name}" is already in the corpus.`);
    return;
  }
  if (file.size > 50 * 1024 * 1024) toast(`"${file.name}" is large — parsing may be slow.`);

  const id = crypto.randomUUID();
  const item = addDocRow(id, file.name, 'Parsing…');

  try {
    const text =
      ext === 'pdf'
        ? await parsePDF(file)
        : ext === 'docx'
          ? await parseDOCX(file)
          : await parseText(file);

    const chunks = chunkText(text);
    if (!chunks.length) throw new Error('No readable content found in this file.');
    const tfData = chunks.map((c) => ({ tf: buildTF(tokenize(c)) }));
    const doc = { id, name: file.name, chunks, tfData };
    corpus.push(doc);
    await idbSave(doc);
    setDocMeta(item, `${chunks.length} chunks`);
    updateStats();
    updateSend();
    const apiKey = lsGet('cb_key') || '';
    const baseUrl = (lsGet('cb_url') || DEFAULT_BASE_URL).replace(/\/$/, '');
    const dom = getDom();
    await suggestQuestions(doc, apiKey, baseUrl, dom.modelSelect.value);
  } catch (e) {
    const err = /** @type {Error} */ (e);
    item.remove();
    refreshEmptyDocs();
    appendMsg('assistant', err.message, null, false, true);
  }
}

export function initDrop() {
  const dom = getDom();
  const dz = dom.dz;
  const fi = dom.fileInput;
  dz.addEventListener('click', (e) => {
    if (!e.target || !(/** @type {HTMLElement} */ (e.target)).closest('label')) fi.click();
  });
  fi.addEventListener('change', (e) => {
    const t = /** @type {HTMLInputElement} */ (e.target);
    [...(t.files || [])].forEach(processFile);
    t.value = '';
  });
  dz.addEventListener('dragover', (e) => {
    e.preventDefault();
    dz.classList.add('over');
  });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('over');
    [...(e.dataTransfer?.files || [])].forEach(processFile);
  });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.target !== dz) [...(e.dataTransfer?.files || [])].forEach(processFile);
  });
}
