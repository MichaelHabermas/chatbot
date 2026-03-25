/** @typedef {{ id: string, name: string, chunks: string[], tfData: { tf: Record<string, number> }[] }} CorpusDoc */

/** @type {CorpusDoc[]} */
export const corpus = [];

/** @type {IDBDatabase | null} */
export let idb = null;

/** @type {{ role: string, content: string }[]} */
export const chatHistory = [];

export let streaming = false;

export let aboutOpen = false;

/** @param {IDBDatabase | null} db */
export function setIdb(db) {
  idb = db;
}

/** @param {boolean} v */
export function setStreaming(v) {
  streaming = v;
}

/** @param {boolean} v */
export function setAboutOpen(v) {
  aboutOpen = v;
}
