function byId(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

export function getDom() {
  return {
    messages: byId('messages'),
    chatInput: /** @type {HTMLTextAreaElement} */ (byId('chat-input')),
    sendBtn: /** @type {HTMLButtonElement} */ (byId('send-btn')),
    sendHint: byId('send-hint'),
    docList: byId('doc-list'),
    corpusStats: byId('corpus-stats'),
    banner: byId('banner'),
    retInd: byId('ret-ind'),
    empty: byId('empty'),
    chips: byId('chips'),
    modelSelect: /** @type {HTMLSelectElement} */ (byId('model-select')),
    baseUrl: /** @type {HTMLInputElement} */ (byId('base-url')),
    apiKey: /** @type {HTMLInputElement} */ (byId('api-key')),
    brand: /** @type {HTMLButtonElement} */ (byId('brand')),
    aboutOverlay: byId('about-overlay'),
    aboutClose: /** @type {HTMLButtonElement} */ (byId('about-close')),
    inputArea: byId('input-area'),
    dz: byId('dz'),
    fileInput: /** @type {HTMLInputElement} */ (byId('file-input')),
  };
}
