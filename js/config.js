/** @typedef {'p'|'br'|'strong'|'em'|'code'|'pre'|'h1'|'h2'|'h3'|'ul'|'ol'|'li'|'blockquote'|'a'} SafeTag */

export const PDF_WORKER =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export const CHUNK_SIZE = 1200;
export const OVERLAP = 100;
export const TOP_K = 5;
export const HIST_MAX = 50;

export const IDB_NAME = 'ragchatbot';
export const IDB_STORE = 'corpus';

export const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

/** @type {readonly SafeTag[]} */
export const SAFE_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
];

export const LS = {
  key: 'cb_key',
  url: 'cb_url',
  model: 'cb_model',
  hist: 'cb_hist',
  warned: 'cb_warned',
};
