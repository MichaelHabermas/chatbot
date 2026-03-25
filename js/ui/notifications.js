import { getDom } from '../dom.js';

export function showBanner(msg) {
  const dom = getDom();
  dom.banner.textContent = msg;
  dom.banner.classList.remove('hidden');
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
