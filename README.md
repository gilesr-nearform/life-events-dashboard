# Life Events Dashboard

> **Live preview:** <https://gilesr-nearform.github.io/life-events-dashboard/>
> No login. Open the picker, then pick a version to view.

Pre-alpha prototype of the OGCIO Life Events dashboard (Building Block 7).
Each iteration lives in its own folder so we can ship, demo, and compare
versions without losing history.

## For Nearform reviewers

The site above is public &mdash; the URL is all anyone needs. No GitHub
account, login, or VPN required.

* **Just look** &mdash; click any version on the picker.
* **Leave async feedback** &mdash; open an [issue](https://github.com/gilesr-nearform/life-events-dashboard/issues/new)
  on this repo (a GitHub account is needed for that, but not for viewing).
* **Share** &mdash; the URL stays stable; future versions appear at
  `/v3/`, `/v4/`, etc. without breaking older links.

## Versions

| Version | URL | Status | What it shows |
|---|---|---|---|
| **v2** | [`/v2/`](https://gilesr-nearform.github.io/life-events-dashboard/v2/) | latest | Unified application card — one bounding box per application with its 3 latest messages embedded; reveal-more for additional applications. |
| v1 | [`/v1/`](https://gilesr-nearform.github.io/life-events-dashboard/v1/) | superseded | Basic build — application + relevant messages, side by side, matching the [Figma `basic-dashboard` wireframe](https://www.figma.com/design/fwveQitr3tB5ZuHuHVh7nv/Life-Events-Portal-%E2%80%94-Citizen-Dashboard--Wireframes-?node-id=99-1197). No extras. |
| v3 | tbd | planned | Next iteration (decided after v2 review) |

### Archive

The earlier conversation-first prototype is preserved at
[`/archive/conversation-first/`](https://gilesr-nearform.github.io/life-events-dashboard/archive/conversation-first/).
It was an exploration of anchoring every message to its application with
threading, replies, and a richer message taxonomy. Useful as a reference
when we&rsquo;re ready to fold those ideas back in.

## Versioning convention

* Each iteration goes in its own top-level folder (`v1/`, `v2/`, `v3/`&hellip;).
* Each folder is a self-contained zero-build prototype: `index.html`,
  `styles.css`, `app.js`, plus a local `assets/` copy so the version works
  in isolation.
* The root `index.html` is the version picker shown at the live URL.
* Old versions never get deleted &mdash; they keep their URL forever so
  stakeholder links stay valid.

To start a new iteration:

```bash
cp -r v1 v2
# then edit v2/* and update the root index.html to list it
```

## Preview locally

Zero build, no `npm`. From this folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/v1/> (or any other version).

## Design system

Built against the gov.ie design system tokens documented in
`../ds/govie-ds.mdc` (always-applied Cursor rule). Brand assets live in
each version&rsquo;s `assets/logos/` and are copied from the workspace
`.starter/` template, never hand-drawn.
