import { PDF_WORKER } from './config.js';

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function parsePDF(file) {
  try {
    const pdfjsLib = globalThis.pdfjsLib;
    if (!pdfjsLib) throw new Error('pdf.js not loaded');
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((/** @type {{ str: string }} */ s) => s.str).join(' ') + '\n';
    }
    if (text.trim().length < 100) throw new Error('scanned');
    return text;
  } catch (e) {
    const err = /** @type {Error} */ (e);
    if (err.message === 'scanned') {
      throw new Error(
        'No text extracted — this may be a scanned PDF. Only text-based PDFs are supported.'
      );
    }
    throw new Error(
      'PDF parsing failed. If opening locally (file://), try serving via localhost or GitHub Pages.'
    );
  }
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function parseDOCX(file) {
  const mammoth = globalThis.mammoth;
  if (!mammoth) throw new Error('mammoth not loaded');
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export function parseText(file) {
  return new Promise((ok, fail) => {
    const r = new FileReader();
    r.onload = (e) => ok(/** @type {string} */ (/** @type {FileReader} */ (e.target).result));
    r.onerror = () => fail(new Error('Could not read file.'));
    r.readAsText(file);
  });
}
