/* v2 — bilingual toggle (carry-over from v1) + reveal-more applications.
 * Iterative: only the behaviour required by the new bounded-card pattern. */
(() => {
  const html = document.documentElement;

  /* Bilingual */
  const langToggle = document.querySelector('[data-lang-toggle]');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const next = html.lang === 'ga' ? 'en-IE' : 'ga';
      html.lang = next;
      langToggle.setAttribute('aria-pressed', String(next === 'ga'));
    });
  }

  /* Reveal-more applications */
  const revealBtn = document.querySelector('[data-reveal-more]');
  const extras = Array.from(document.querySelectorAll('[data-extra]'));
  const labelSlot = revealBtn?.querySelector('[data-reveal-label]');
  if (revealBtn && extras.length) {
    const showLabel = labelSlot?.innerHTML;
    const hideLabel = `
      <span data-en>Hide extra applications</span><span data-ga>Folaigh iarratais bhreise</span>
    `;
    revealBtn.addEventListener('click', () => {
      const expanded = revealBtn.getAttribute('aria-expanded') === 'true';
      extras.forEach(el => { el.hidden = expanded; });
      revealBtn.setAttribute('aria-expanded', String(!expanded));
      if (labelSlot) labelSlot.innerHTML = expanded ? showLabel : hideLabel;
    });
  }
})();
