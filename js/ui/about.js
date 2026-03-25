import { getDom } from '../dom.js';
import { aboutOpen, setAboutOpen } from '../state.js';

export function setAboutOpenState(open) {
  setAboutOpen(open);
  const dom = getDom();
  dom.aboutOverlay.classList.toggle('hidden', !open);
  dom.brand.setAttribute('aria-expanded', open ? 'true' : 'false');
  dom.messages.toggleAttribute('inert', open);
  dom.inputArea.toggleAttribute('inert', open);
  if (open) requestAnimationFrame(() => dom.aboutClose.focus());
}

export function initAbout() {
  const dom = getDom();
  dom.brand.addEventListener('click', () => setAboutOpenState(!aboutOpen));
  dom.aboutClose.addEventListener('click', () => setAboutOpenState(false));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !aboutOpen) return;
    e.preventDefault();
    setAboutOpenState(false);
    dom.brand.focus();
  });
}
