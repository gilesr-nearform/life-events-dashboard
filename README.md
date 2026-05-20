# Dashboard prototype — conversation-first

Pre-alpha prototype of the OGCIO Life Events dashboard (Building Block 7),
built to **rif on the BMAD Crazy 8 brainstorm output** and stress-test one
post-brainstorm idea: **anchor every government message to the application
it's about**.

This sits alongside `../dashboard-mvp/` (Claude's earlier prototype) as a
deliberate alternative — same context, different choices. Use both to
compare and pick the directions worth keeping.

## Run

No install. No build. Open `index.html` directly, or:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

That's it. Three files: `index.html`, `styles.css`, `app.js`.

## What's different from `dashboard-mvp/`

| Axis | `dashboard-mvp/` (Claude) | `dashboard-prototype/` (this) |
|---|---|---|
| Build | `npm install` + `sass` compiles `@ogcio/ogcio-ds` | None. Open the file. |
| Design system | `@ogcio/ogcio-ds` (the project context flags this as **superseded**) | Documented gov.ie tokens (Lato, `#006658`) used directly via CSS custom properties |
| Markup | Hand-written static HTML for every message | Single `state.applications` JS array; HTML is rendered from data |
| Submissions | "Recent submissions" — flat list, one latest message per card, read-only | "Your applications & conversations" — threaded, multi-department, with replies |
| Cross-department | Not modelled | First-class. The Pregnancy registration thread shows an **HSE** appointment + a **DSP** cross-link about Maternity Benefit, side by side, on the same thread |
| Reply | None | Inline composer that mutates state and re-renders |
| Filters | None | All / Awaiting you / Active / Done — counts roll up from data |
| Unread | One global tag | Per-message · per-thread · header roll-up, all derived |
| Quiet Mode | Header toggle | Not in this iteration (see "Deferred" below) |
| Bilingual | `data-en` / `data-ga` toggle | Same convention preserved |
| Component naming | `govie-*` (DS) + `app-*` (overrides) | `dash-*`-style flat names with explicit BEM-ish blocks |

## The new feature: messages grouped by application

The brainstorm clustered five themes; **C — Journey, not service** was the
strongest. The flat departmental inbox model violates that theme — it
forces the citizen to mentally re-thread "what was this about?" every time
a new message arrives from a different department.

This prototype models the alternative directly:

- **One application = one thread.** All messages relating to a submission
  live in that submission's card.
- **Departments can co-author a thread.** A `cross-link` message kind
  visualises a different department joining an existing thread (HSE +
  DSP on the Pregnancy registration thread is the canonical example).
- **The citizen can reply.** Replies are stored as `you`-kind messages
  in the thread, alongside everything from gov.
- **Unread state is per-message**, **rolled up per-thread** (red unread
  pill on the card head), and **rolled up again** in the header
  (`3 new`).
- **Filter chips** shape the view by what the citizen needs to do:
  *Awaiting you* / *Active* / *Done*.

### Why it's worth the work

Three persona pay-offs from `md/project-context.md`:

- **Maria** (single parent, unaware of entitlements). The cross-dept
  thread on Pregnancy registration is exactly how she discovers
  Maternity Benefit eligibility — DSP joins HSE's thread proactively
  instead of asking her to find a separate channel.
- **Aoife** (postnatal, high cognitive load). One inbox per application
  cuts down the "where was that letter again?" reload tax.
- **Niamh** (assistive tech). Each thread is a single landmark with a
  predictable structure (head → summary → timeline → actions) and a
  single live region announcement when the model changes.

## Architecture

### State

Single source of truth in `app.js`:

```js
state = {
  applications: [
    {
      id, title, department, reference, submittedAt, status, icon,
      messages: [
        { id, kind, from: { dept, team }, at, unread, body, cta? }
      ]
    }
  ],
  filter, expanded: Set<id>, replyOpen: id | null
}
```

Counts (unread total, per-filter counts, per-thread unread, multi-dept
indicator) are **all derived**, not stored. So adding a message,
changing its `unread` flag, or replying automatically updates every
visible count.

### Render

Pure functions: `renderFilterbar`, `renderThreadList`, `renderThread`,
`renderMessage`, `renderUnreadTotal`. Called as a group through
`renderAll()` after any action.

Replies, marking-as-read, expand/collapse, filter changes — all flow
through state mutation + re-render. No imperative DOM patches.

### Events

Delegated on the thread list and filterbar so the markup can be replaced
on each render without re-binding. Three click verbs (`data-toggle-thread`,
`data-open-reply`, `data-mark-read`) and one form submit, plus filter
keyboard navigation (Arrow keys + Home/End on the chip row).

### Message kinds

| Kind | Visual | Used for |
|---|---|---|
| `system` | Dashed border, muted | Automated events ("application received", "Eircode validated") |
| `gov` | Solid card, green dot | Standard departmental messages |
| `request` | Red left edge, action button | Department needs an action from the citizen |
| `cross` | Blue tint, "Cross-department" tag | A different department joining an existing thread |
| `you` | Light green fill | The citizen's own replies |

This taxonomy is on purpose narrow — the kinds map to real upstream
sources (MessagingIE notifications · Information Mediator events ·
citizen-initiated actions) so swapping the demo data for a live feed is
a straight substitution.

### Trust assumption on `body`

Demo message bodies can contain a tiny vocabulary of trusted HTML
(`<strong>`, `<a>`) so cross-department prompts read naturally. **Citizen
replies are escaped** before being stored. If this ever ships to a live
feed, the body sanitisation contract belongs to the API gateway, not the
client — the client should switch to plain text + structured CTAs.

## What's deferred (and why)

| Idea | Where it would go | Why deferred |
|---|---|---|
| Quiet Mode | Header toggle (mvp has it) | Surface noise is lower here because messages are grouped — Quiet Mode pays off less. Worth re-introducing once we have notification volume from the real MessagingIE feed. |
| Listen layer | Per-thread audio summary | Requires content team + synthesis pipeline; out of scope for prototype. |
| One-Question-Per-Screen reply mode | The reply composer | Would replace the textarea with a guided micro-form. Worth user testing with Aoife-equivalent first. |
| Family-linked view | Header avatar pill | Needs a second account + consent UI. |
| 17-events full roadmap | Journeys section | One placeholder card. Full inventory still waits on the DPS-2030 PDF extract. |

## Suggested next moves

1. **Show both prototypes back-to-back** (this one + `dashboard-mvp/`) and
   capture which idioms each stakeholder gravitates to. The split between
   "informational dashboard" (mvp) and "conversational dashboard" (this)
   is real and worth a directional decision before more build effort.
2. **Wire one thread to a live MessagingIE channel** as a thin slice. The
   data shape is already an honest match to "an application + its
   messages from any source"; swapping the seed array for a fetch is a
   morning's work.
3. **Spec the `cross-link` message kind upstream**. It's the most
   programme-distinctive idea in here and the one that operationalises
   the "Journey, not service" theme. Worth raising as a Design SystemIE
   pattern candidate.
