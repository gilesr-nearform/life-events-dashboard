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

  /* Per-card thread expansion: each "View all N messages" button toggles
   * the messages flagged with [data-msg-hidden] inside its own card. */
  const FEWER_LABEL = `<span data-en>Show fewer messages</span><span data-ga>Taispeáin níos lú teachtaireachtaí</span>`;
  document.querySelectorAll('[data-expand-thread]').forEach(btn => {
    const slot = btn.querySelector('[data-label]');
    const moreLabel = slot?.innerHTML;
    const card = btn.closest('.app-card');
    const hiddenMsgs = card ? Array.from(card.querySelectorAll('[data-msg-hidden]')) : [];
    if (!hiddenMsgs.length) return;

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      hiddenMsgs.forEach(el => { el.hidden = expanded; });
      btn.setAttribute('aria-expanded', String(!expanded));
      if (slot) slot.innerHTML = expanded ? moreLabel : FEWER_LABEL;
    });
  });
})();
