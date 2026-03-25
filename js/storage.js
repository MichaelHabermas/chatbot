import { HIST_MAX, IDB_NAME, IDB_STORE, LS } from './config.js';
import { chatHistory, idb, setIdb } from './state.js';
import { showBanner, toast } from './ui/notifications.js';

export function lsGet(k) {
  return localStorage.getItem(k);
}

export function lsSet(k, v) {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore quota */
  }
}

export function saveHist() {
  lsSet(LS.hist, JSON.stringify(chatHistory.slice(-HIST_MAX)));
}

async function initIDBInternal() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = /** @type {IDBOpenDBRequest} */ (e.target).result;
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      };
      req.onsuccess = (e) => {
        setIdb(/** @type {IDBOpenDBRequest} */ (e.target).result);
        resolve();
      };
      req.onerror = () => resolve();
    } catch {
      showBanner(
        'Corpus persistence unavailable in Private Browsing — documents will be lost on refresh.'
      );
      resolve();
    }
  });
}

export async function initIDB() {
  await initIDBInternal();
}

/**
 * @param {'readonly' | 'readwrite'} mode
 * @param {(store: IDBObjectStore, done: (v?: unknown) => void) => void} fn
 */
export function idbRun(mode, fn) {
  if (!idb) return Promise.resolve();
  return new Promise((resolve) => {
    const tx = idb.transaction(IDB_STORE, mode);
    fn(tx.objectStore(IDB_STORE), resolve);
    tx.onerror = (e) => {
      if (/** @type {IDBTransaction} */ (e.target).error?.name === 'QuotaExceededError') {
        toast('Storage limit reached. Remove old documents to continue.');
      }
      resolve();
    };
  });
}

/** @param {import('./state.js').CorpusDoc} doc */
export const idbSave = (doc) =>
  idbRun('readwrite', (s, done) => {
    s.put(doc);
    s.transaction.oncomplete = () => done();
  });

/** @param {string} id */
export const idbDel = (id) =>
  idbRun('readwrite', (s, done) => {
    s.delete(id);
    s.transaction.oncomplete = () => done();
  });

export const idbAll = () =>
  idbRun('readonly', (s, done) => {
    const r = s.getAll();
    r.onsuccess = (e) => done(/** @type {IDBRequest} */ (e.target).result || []);
  });
