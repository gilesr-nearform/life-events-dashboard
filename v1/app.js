/* v1 — bilingual (en-IE / ga) toggle.
 * Intentionally the only behaviour in this build. New features
 * (filters, threading, etc.) belong in later versions. */
(() => {
  const html = document.documentElement;
  const toggle = document.querySelector('[data-lang-toggle]');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const next = html.lang === 'ga' ? 'en-IE' : 'ga';
    html.lang = next;
    toggle.setAttribute('aria-pressed', String(next === 'ga'));
  });
})();
