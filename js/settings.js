import { LS } from './config.js';
import { getDom } from './dom.js';
import { lsGet, lsSet } from './storage.js';
import { showBanner } from './ui/notifications.js';

export function initSettings() {
  const dom = getDom();
  const key = lsGet(LS.key);
  const url = lsGet(LS.url);
  const model = lsGet(LS.model);
  if (key) dom.apiKey.value = key;
  if (url) dom.baseUrl.value = url;
  if (model) dom.modelSelect.value = model;
  dom.apiKey.addEventListener('input', (e) =>
    lsSet(LS.key, /** @type {HTMLInputElement} */ (e.target).value)
  );
  dom.baseUrl.addEventListener('input', (e) =>
    lsSet(LS.url, /** @type {HTMLInputElement} */ (e.target).value)
  );
  dom.modelSelect.addEventListener('change', (e) =>
    lsSet(LS.model, /** @type {HTMLSelectElement} */ (e.target).value)
  );
  if (!lsGet(LS.warned)) {
    showBanner(
      '⚠️ Your API key is stored unencrypted in this browser. Do not use on shared computers.'
    );
    lsSet(LS.warned, '1');
  }
}
