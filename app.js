/* dashboard-prototype — interaction layer
 *
 * Different shape from dashboard-mvp/app.js: data-driven render rather than
 * static HTML. The conversation pattern (applications + threaded messages)
 * is the centerpiece, so it's the part that's modelled in state and
 * rendered from JS. Replies, filters, expand/collapse and unread roll-up
 * all flow from mutating `state` and re-rendering.
 *
 * Architecture:
 *   STATE       — applications + per-message metadata + UI flags
 *   RENDER      — pure functions that produce DOM from state
 *   ACTIONS     — reply, filter, expand/collapse, mark-read, etc.
 *   EVENTS      — delegated listeners on the thread list
 *   BILINGUAL   — reused gov.ie [data-en]/[data-ga] convention
 */

(() => {
  'use strict';

  // -----------------------------------------------------------------------
  // STATE
  //
  // `applications` is the only source of truth. Everything on the
  // conversations surface — counts, filters, summaries, the unread badge —
  // is derived from it.
  // -----------------------------------------------------------------------

  /** @typedef {'system'|'gov'|'cross'|'request'|'you'} MessageKind */
  /** @typedef {'awaiting'|'in-assessment'|'active'|'completed'|'declined'} ApplicationStatus */

  const state = {
    /** @type {Application[]} */
    applications: [
      {
        id: 'mat-ben-2026-0418',
        title: 'Maternity Benefit',
        department: 'DSP',
        reference: 'MB-2026-0418',
        submittedAt: '2026-04-18',
        status: 'awaiting',
        icon: iconDocument,
        // newest first
        messages: [
          {
            id: 'm-mb-5',
            kind: 'request',
            from: { dept: 'DSP', team: 'Decisions team' },
            at: '2026-05-06T10:30:00',
            unread: true,
            body: 'We need a copy of your most recent payslip to finalise the assessment. You can upload it here or in the MyGovID app.',
            cta: { label: 'Upload payslip', href: '#' },
          },
          {
            id: 'm-mb-4',
            kind: 'gov',
            from: { dept: 'DSP', team: 'Payments team' },
            at: '2026-05-02T09:10:00',
            unread: true,
            body: "We've confirmed the bank account ending 4421 for your maternity payment. Reply here if this is wrong.",
          },
          {
            id: 'm-mb-3',
            kind: 'you',
            from: { dept: null, team: 'You' },
            at: '2026-04-30T16:42:00',
            unread: false,
            body: "Hi — I uploaded my last three months' payslips on 25 April. Let me know if anything else is needed.",
          },
          {
            id: 'm-mb-2',
            kind: 'gov',
            from: { dept: 'DSP', team: 'Decisions team' },
            at: '2026-04-22T11:00:00',
            unread: false,
            body: 'Your application is being assessed. Expect a decision by 15 May 2026.',
          },
          {
            id: 'm-mb-1',
            kind: 'system',
            from: { dept: 'MyGovID', team: 'System' },
            at: '2026-04-18T08:21:00',
            unread: false,
            body: 'Application received. Pre-filled from your verified HSE pregnancy record and Revenue employment record.',
          },
        ],
      },
      {
        id: 'preg-reg-2026-0102',
        title: 'Pregnancy registration',
        department: 'HSE',
        reference: 'M-2026-0102',
        submittedAt: '2026-01-02',
        status: 'active',
        icon: iconHeart,
        messages: [
          {
            id: 'm-pr-4',
            kind: 'gov',
            from: { dept: 'HSE', team: 'Coombe Hospital' },
            at: '2026-04-30T14:00:00',
            unread: true,
            body: 'Your 36-week appointment is confirmed for 12 May at 09:30. Bring your maternity card and a photo ID.',
          },
          {
            id: 'm-pr-3',
            kind: 'cross',
            from: { dept: 'DSP', team: 'Cross-link' },
            at: '2026-02-14T09:00:00',
            unread: false,
            body: 'Based on your pregnancy registration, you may be entitled to <strong>Maternity Benefit</strong>. We can pre-fill 80% of the application from data we already hold.',
            cta: { label: 'Start application', href: '#' },
          },
          {
            id: 'm-pr-2',
            kind: 'gov',
            from: { dept: 'HSE', team: 'Coombe Hospital' },
            at: '2026-01-09T15:30:00',
            unread: false,
            body: 'Booking confirmed at Coombe Hospital. First scan letter posted today; you should receive it within 5 working days.',
          },
          {
            id: 'm-pr-1',
            kind: 'system',
            from: { dept: 'HSE', team: 'System' },
            at: '2026-01-02T10:12:00',
            unread: false,
            body: 'Pregnancy registration received from your GP via the Information Mediator.',
          },
        ],
      },
      {
        id: 'lpt-2026-0210',
        title: 'Local Property Tax · 2026 query',
        department: 'Revenue',
        reference: 'LPT-Q-2026-0210',
        submittedAt: '2026-02-10',
        status: 'awaiting',
        icon: iconHouse,
        messages: [
          {
            id: 'm-lpt-3',
            kind: 'request',
            from: { dept: 'Revenue', team: 'LPT team' },
            at: '2026-05-04T08:30:00',
            unread: true,
            body: 'We need you to confirm whether the property at the registered Eircode is your principal private residence.',
            cta: { label: 'Confirm property use', href: '#' },
          },
          {
            id: 'm-lpt-2',
            kind: 'gov',
            from: { dept: 'Revenue', team: 'LPT team' },
            at: '2026-02-12T11:15:00',
            unread: false,
            body: 'Query received. We typically respond within 10 working days.',
          },
          {
            id: 'm-lpt-1',
            kind: 'system',
            from: { dept: 'MyGovID', team: 'System' },
            at: '2026-02-10T20:01:00',
            unread: false,
            body: 'Query opened against LPT 2026 valuation.',
          },
        ],
      },
      {
        id: 'addr-2025-0904',
        title: 'Address update',
        department: 'OGCIO · MyGovID',
        reference: 'C-2025-0904',
        submittedAt: '2025-09-04',
        status: 'completed',
        icon: iconPin,
        messages: [
          {
            id: 'm-ad-2',
            kind: 'gov',
            from: { dept: 'OGCIO', team: 'MyGovID' },
            at: '2025-09-05T09:30:00',
            unread: false,
            body: 'Verified address now in use across linked services (Revenue, DSP, HSE).',
          },
          {
            id: 'm-ad-1',
            kind: 'system',
            from: { dept: 'MyGovID', team: 'System' },
            at: '2025-09-04T19:14:00',
            unread: false,
            body: 'Address change request received. Eircode validated.',
          },
        ],
      },
    ],
    filter: 'all',
    /** @type {Set<string>} application ids whose threads are expanded */
    expanded: new Set(),
    /** @type {string|null} application id whose reply form is open */
    replyOpen: null,
  };

  const FILTERS = [
    { key: 'all',       en: 'All',           ga: 'Gach' },
    { key: 'awaiting',  en: 'Awaiting you',  ga: 'Ag fanacht ort' },
    { key: 'active',    en: 'Active',        ga: 'Gníomhach' },
    { key: 'completed', en: 'Done',          ga: 'Críochnaithe' },
  ];

  const STATUS_LABELS = {
    'awaiting':      { en: 'Awaiting you',   ga: 'Ag fanacht ort' },
    'in-assessment': { en: 'In assessment',  ga: 'Á mheas' },
    'active':        { en: 'Active',         ga: 'Gníomhach' },
    'completed':     { en: 'Completed',      ga: 'Críochnaithe' },
    'declined':      { en: 'Declined',       ga: 'Diúltaithe' },
  };

  // -----------------------------------------------------------------------
  // DOM HOOKS
  // -----------------------------------------------------------------------
  const dom = {
    threadList:    document.getElementById('thread-list'),
    filterbar:     document.querySelector('[data-filterbar]'),
    empty:         document.querySelector('[data-threads-empty]'),
    unreadTotal:   document.querySelector('[data-unread-total]'),
    jumpInbox:     document.querySelector('[data-jump-conversations]'),
    langToggle:    document.querySelector('[data-lang-toggle]'),
    live:          document.getElementById('live-region'),
    replyTemplate: document.getElementById('reply-form-template'),
  };

  // -----------------------------------------------------------------------
  // DERIVED helpers
  // -----------------------------------------------------------------------
  const totalUnread = (apps) =>
    apps.reduce((acc, a) => acc + a.messages.filter(m => m.unread).length, 0);

  const appUnread = (a) => a.messages.filter(m => m.unread).length;

  const matchesFilter = (a, filter) => {
    if (filter === 'all') return true;
    if (filter === 'awaiting') return a.status === 'awaiting' || appUnread(a) > 0;
    if (filter === 'active')   return a.status === 'active' || a.status === 'in-assessment';
    if (filter === 'completed') return a.status === 'completed' || a.status === 'declined';
    return true;
  };

  const filterCount = (filterKey) =>
    state.applications.filter(a => matchesFilter(a, filterKey)).length;

  // -----------------------------------------------------------------------
  // FORMATTERS
  // -----------------------------------------------------------------------
  function fmtDate(iso, opts = {}) {
    const d = new Date(iso);
    const sameYear = d.getFullYear() === new Date().getFullYear();
    const date = d.toLocaleDateString('en-IE', {
      day: 'numeric', month: 'short',
      year: sameYear ? undefined : 'numeric',
    });
    if (opts.withTime) {
      const time = d.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
      return `${date}, ${time}`;
    }
    return date;
  }

  function relativeFromNow(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const day = 86400000;
    if (diff < day)       return 'today';
    if (diff < 2 * day)   return 'yesterday';
    if (diff < 7 * day)   return `${Math.floor(diff / day)} days ago`;
    if (diff < 30 * day)  return `${Math.floor(diff / 7 / day)} weeks ago`;
    if (diff < 365 * day) return `${Math.floor(diff / 30 / day)} months ago`;
    return `${Math.floor(diff / 365 / day)} years ago`;
  }

  // -----------------------------------------------------------------------
  // ICONS — kept in JS so each application can pick its own
  // -----------------------------------------------------------------------
  function iconDocument() {
    return svg('M7 3h7l4 4v14H7V3Z M14 3v4h4 M9 12h7 M9 16h5');
  }
  function iconHeart() {
    return svg('M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z');
  }
  function iconHouse() {
    return svg('M4 11l8-7 8 7v9h-5v-6h-6v6H4v-9Z');
  }
  function iconPin() {
    return svg('M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12Z M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z');
  }
  function svg(d) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  // -----------------------------------------------------------------------
  // RENDER — filter bar
  // -----------------------------------------------------------------------
  function renderFilterbar() {
    dom.filterbar.innerHTML = '';
    FILTERS.forEach(f => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip-btn';
      btn.role = 'tab';
      btn.setAttribute('aria-selected', f.key === state.filter ? 'true' : 'false');
      btn.dataset.filter = f.key;
      btn.innerHTML = `
        <span data-en>${f.en}</span><span data-ga>${f.ga}</span>
        <span class="chip-btn__count">${filterCount(f.key)}</span>
      `;
      dom.filterbar.appendChild(btn);
    });
  }

  // -----------------------------------------------------------------------
  // RENDER — thread list
  // -----------------------------------------------------------------------
  function renderThreadList() {
    const visible = state.applications.filter(a => matchesFilter(a, state.filter));
    dom.threadList.innerHTML = '';
    dom.empty.hidden = visible.length > 0;
    visible.forEach(a => dom.threadList.appendChild(renderThread(a)));
  }

  function renderThread(app) {
    const li = document.createElement('li');
    li.className = `thread thread--${app.status}`;
    li.dataset.appId = app.id;

    const unread = appUnread(app);
    const expanded = state.expanded.has(app.id);
    const totalMsgs = app.messages.length;
    const newest = app.messages[0];
    const departments = uniqueDepartments(app.messages);

    li.innerHTML = `
      <header class="thread__head">
        <div class="thread__icon">${app.icon()}</div>
        <div class="thread__title-block">
          <h3 class="thread__title">${escape(app.title)}</h3>
          <p class="thread__meta">
            <strong>${escape(app.department)}</strong>
            · Ref ${escape(app.reference)}
            · Submitted ${fmtDate(app.submittedAt)}
          </p>
        </div>
        <div class="thread__statuses">
          <span class="status status--${app.status}">
            <span data-en>${STATUS_LABELS[app.status].en}</span>
            <span data-ga>${STATUS_LABELS[app.status].ga}</span>
          </span>
          ${unread > 0 ? `<span class="unread-pill">${unread} unread</span>` : ''}
        </div>
      </header>

      <div class="thread__summary">
        <p>
          <strong>${totalMsgs} message${totalMsgs === 1 ? '' : 's'}</strong>${
            departments.length > 1 ? ` from <strong>${departments.length} departments</strong>` : ''
          } · last update ${relativeFromNow(newest.at)} (${fmtDate(newest.at)})
        </p>
        ${totalMsgs > 2 ? `
          <button class="thread__toggle" data-toggle-thread aria-expanded="${expanded}">
            <span data-en>${expanded ? 'Show only the most recent' : `Show all ${totalMsgs} messages`}</span>
            <span data-ga>${expanded ? 'Folaigh' : 'Taispeáin gach ceann'}</span>
          </button>
        ` : ''}
      </div>

      <ol class="timeline" data-collapsed="${!expanded}" role="list" aria-label="Messages on ${escape(app.title)}">
        ${app.messages.map(renderMessage).join('')}
      </ol>

      <div class="thread__actions">
        <button type="button" class="btn btn--primary" data-open-reply>
          <span data-en>Reply to thread</span>
          <span data-ga>Freagair</span>
        </button>
        <a href="#" class="btn btn--secondary">
          <span data-en>Open application</span>
          <span data-ga>Oscail iarratas</span>
        </a>
        ${unread > 0 ? `
          <button type="button" class="btn btn--ghost" data-mark-read>
            <span data-en>Mark all as read</span>
            <span data-ga>Marcáil léite</span>
          </button>` : ''}
      </div>
    `;

    if (state.replyOpen === app.id) {
      const reply = dom.replyTemplate.content.firstElementChild.cloneNode(true);
      li.appendChild(reply);
      // Focus textarea after insertion
      setTimeout(() => reply.querySelector('textarea')?.focus(), 0);
    }

    return li;
  }

  function renderMessage(m) {
    const cross = m.kind === 'cross' ? `
      <span class="msg__cross-tag">Cross-department</span>` : '';
    const cta = m.cta ? `
      <p class="msg__cta">
        <a href="${escapeAttr(m.cta.href)}" class="btn btn--primary">${escape(m.cta.label)}</a>
      </p>` : '';
    const unread = m.unread ? `<span class="msg__unread-dot" aria-label="Unread"></span>` : '';
    const senderLabel = m.from.dept
      ? `${escape(m.from.dept)} · ${escape(m.from.team)}`
      : escape(m.from.team);

    return `
      <li class="msg msg--${m.kind} ${m.unread ? 'msg--unread' : ''}" data-msg-id="${m.id}">
        <div class="msg__head">
          <span class="msg__from">${senderLabel}</span>
          <span class="msg__when">${fmtDate(m.at, { withTime: true })}</span>
          ${unread}
          ${cross}
        </div>
        <p class="msg__body">${m.body}</p>
        ${cta}
      </li>
    `;
  }

  function uniqueDepartments(messages) {
    const set = new Set();
    messages.forEach(m => {
      if (m.from.dept && m.kind !== 'system') set.add(m.from.dept);
      if (m.kind === 'you') set.add('You');
    });
    return Array.from(set);
  }

  // -----------------------------------------------------------------------
  // RENDER — header unread badge
  // -----------------------------------------------------------------------
  function renderUnreadTotal() {
    const n = totalUnread(state.applications);
    if (n === 0) {
      dom.unreadTotal.textContent = 'No new';
      dom.unreadTotal.dataset.empty = 'true';
    } else {
      dom.unreadTotal.textContent = `${n} new`;
      delete dom.unreadTotal.dataset.empty;
    }
  }

  // -----------------------------------------------------------------------
  // ROOT RENDER
  // -----------------------------------------------------------------------
  function renderAll() {
    renderFilterbar();
    renderThreadList();
    renderUnreadTotal();
  }

  // -----------------------------------------------------------------------
  // ACTIONS
  // -----------------------------------------------------------------------
  function setFilter(key) {
    state.filter = key;
    state.replyOpen = null;
    renderAll();
    announce(`Showing ${filterCount(key)} conversations.`);
  }

  function toggleThread(appId) {
    if (state.expanded.has(appId)) state.expanded.delete(appId);
    else state.expanded.add(appId);
    renderThreadList();
  }

  function openReply(appId) {
    state.replyOpen = state.replyOpen === appId ? null : appId;
    renderThreadList();
  }

  function markAllRead(appId) {
    const app = state.applications.find(a => a.id === appId);
    if (!app) return;
    app.messages.forEach(m => { m.unread = false; });
    renderAll();
    announce('All messages marked as read.');
  }

  function submitReply(appId, body) {
    const app = state.applications.find(a => a.id === appId);
    if (!app) return;
    app.messages.unshift({
      id: `m-${appId}-${Date.now()}`,
      kind: 'you',
      from: { dept: null, team: 'You' },
      at: new Date().toISOString(),
      unread: false,
      body: escape(body.trim()),
    });
    state.replyOpen = null;
    state.expanded.add(appId);
    renderAll();
    announce('Reply sent. The thread is now expanded so you can see your message.');
  }

  // -----------------------------------------------------------------------
  // EVENTS — delegated on the thread list
  // -----------------------------------------------------------------------
  dom.threadList.addEventListener('click', (e) => {
    const card = e.target.closest('.thread');
    if (!card) return;
    const appId = card.dataset.appId;

    if (e.target.closest('[data-toggle-thread]')) {
      toggleThread(appId);
    } else if (e.target.closest('[data-open-reply]')) {
      openReply(appId);
    } else if (e.target.closest('[data-mark-read]')) {
      markAllRead(appId);
    } else if (e.target.closest('[data-reply-cancel]')) {
      state.replyOpen = null;
      renderThreadList();
    }
  });

  dom.threadList.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-reply-form]');
    if (!form) return;
    e.preventDefault();
    const card = form.closest('.thread');
    if (!card) return;
    const body = form.querySelector('textarea').value;
    if (!body.trim()) return;
    submitReply(card.dataset.appId, body);
  });

  dom.filterbar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    setFilter(btn.dataset.filter);
  });

  // Keyboard arrow navigation across filter chips
  dom.filterbar.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const btns = Array.from(dom.filterbar.querySelectorAll('[data-filter]'));
    const i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    let next = i;
    if (e.key === 'ArrowLeft')  next = (i - 1 + btns.length) % btns.length;
    if (e.key === 'ArrowRight') next = (i + 1) % btns.length;
    if (e.key === 'Home')       next = 0;
    if (e.key === 'End')        next = btns.length - 1;
    btns[next].focus();
    btns[next].click();
  });

  // Header inbox pill — smooth scroll + filter to awaiting
  dom.jumpInbox.addEventListener('click', (e) => {
    e.preventDefault();
    setFilter('awaiting');
    document.getElementById('conversations').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Bilingual toggle (preserves the dashboard-mvp convention)
  dom.langToggle.addEventListener('click', () => {
    const next = document.documentElement.lang === 'ga' ? 'en-IE' : 'ga';
    document.documentElement.lang = next;
    dom.langToggle.setAttribute('aria-pressed', next === 'ga' ? 'true' : 'false');
    announce(next === 'ga' ? 'Athraíodh go Gaeilge' : 'Switched to English');
  });

  // -----------------------------------------------------------------------
  // UTILITIES
  // -----------------------------------------------------------------------
  function announce(message) {
    if (!dom.live) return;
    dom.live.textContent = '';
    requestAnimationFrame(() => { dom.live.textContent = message; });
  }

  function escape(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function escapeAttr(str) { return escape(str); }

  // -----------------------------------------------------------------------
  // BOOT
  // -----------------------------------------------------------------------
  renderAll();
})();
