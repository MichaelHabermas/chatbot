import { SAFE_TAGS } from './config.js';
import { getDom } from './dom.js';
import { chatHistory } from './state.js';
import { saveHist } from './storage.js';

function renderMd(text) {
  const marked = globalThis.marked;
  const DOMPurify = globalThis.DOMPurify;
  if (!marked || !DOMPurify) return text;
  return DOMPurify.sanitize(marked.parse(text), {
    ALLOWED_TAGS: [...SAFE_TAGS],
    ALLOWED_ATTR: ['href'],
  });
}

/**
 * @param {string} role
 * @param {string} content
 * @param {unknown} [sources]
 * @param {boolean} [save]
 * @param {boolean} [isErr]
 */
export function appendMsg(role, content, sources, save = true, isErr = false) {
  const dom = getDom();
  dom.empty?.remove();
  const msg = document.createElement('div');
  msg.className = `msg ${role}${isErr ? ' err' : ''}`;

  const bub = document.createElement('div');
  bub.className = 'bubble';
  bub.innerHTML = role === 'assistant' && !isErr ? renderMd(content) : '';
  if (role !== 'assistant' || isErr) bub.textContent = content;
  msg.appendChild(bub);

  if (role === 'assistant' && !isErr) {
    const acts = document.createElement('div');
    acts.className = 'msg-actions';
    const btn = document.createElement('button');
    btn.className = 'cpbtn';
    btn.textContent = '⎘ Copy';
    btn.addEventListener('click', () => copyText(content, btn));
    acts.appendChild(btn);
    msg.appendChild(acts);
  }

  if (sources?.length) {
    const srcs = document.createElement('div');
    srcs.className = 'sources';
    for (const s of sources) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = `${s.doc.name} #${s.i + 1}`;
      chip.title = s.doc.chunks[s.i].slice(0, 200);
      srcs.appendChild(chip);
    }
    msg.appendChild(srcs);
  }

  dom.messages.appendChild(msg);
  dom.messages.scrollTop = dom.messages.scrollHeight;
  if (save) {
    chatHistory.push({ role, content });
    saveHist();
  }
  return msg;
}

export function addTyping() {
  const dom = getDom();
  const msg = document.createElement('div');
  msg.className = 'msg assistant';
  msg.id = '_typing';
  msg.innerHTML =
    '<div class="bubble"><span class="tdot"></span><span class="tdot"></span><span class="tdot"></span></div>';
  dom.messages.appendChild(msg);
  dom.messages.scrollTop = dom.messages.scrollHeight;
  return msg;
}

/**
 * @param {string} text
 * @param {HTMLButtonElement} btn
 */
export function copyText(text, btn) {
  const ok = () => {
    btn.textContent = '✓ Copied';
    setTimeout(() => {
      btn.textContent = '⎘ Copy';
    }, 1600);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(ok).catch(() => execCopy(text, ok));
  } else {
    execCopy(text, ok);
  }
}

/**
 * @param {string} text
 * @param {() => void} cb
 */
function execCopy(text, cb) {
  const ta = Object.assign(document.createElement('textarea'), { value: text });
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
  cb();
}

export { renderMd };
