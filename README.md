# GLYMPH STUDIO

> Too hard to build? Watch us.

<<<<<<< HEAD
```
index.html      the entire site
styles.css      ~200 lines of CSS
main.js         ~25 lines — 3D tilt on project cards (optional)
fonts/          JetBrains Mono, self-hosted (OFL licence)
logo/           brand assets (SVG + PNG)
assets/team/    drop crew photos here — see PUT-PHOTOS-HERE.md
vercel.json     response headers
```
=======
Glymph is an indie dev studio. We build tools, extensions, and micro-SaaS. fast, from scratch, no templates.
>>>>>>> 7090fe5e5aae9f6a1232ba6a31b6dd567494bea4

## stack

- Vanilla HTML/CSS/JS
- Deployed on Vercel

## run locally

```bash
<<<<<<< HEAD
npx vercel --prod
```
No build command, output directory = root. Or drag the folder into vercel.com/new.

## The logo

Inline SVG in `index.html` (hero, 34px + footer, 16px). Two paths:

* the G — `fill="currentColor"`, so CSS colour drives it (white in the hero, `#444` in the footer)
* the bolt — `fill="#FF3B2F"` with a `stroke="#000000" stroke-width="9"`

That black stroke is the important bit: it carves a gap where the bolt crosses the G,
so the red reads as a separate shape instead of merging into the white.

Going monochrome again? Delete the bolt's `fill` and add the bolt subpath to the G
path with `fill-rule="nonzero"` — opposite winding knocks it out as a true hole.

## Favicons

```
logo/favicon.svg      scalable, modern browsers
logo/favicon-32.png   browser tab
logo/favicon-180.png  apple touch icon
logo/favicon-512.png  android / PWA
```
Black plate, white G, red bolt — the full mark. Checked at 32px; the bolt still reads.

## Adding a project

Copy the `<article class="project" data-tilt>` block in `index.html` and swap:

| | |
|---|---|
| `href` | live url |
| `~/path` | window title bar |
| `.cmd` / `.out` | a real sample of its output |
| `h3` / `p` / `.meta` | name · one line · "where · year" |

The 3D tilt is automatic — any card with `data-tilt` picks it up. Cards lay
themselves out in a responsive grid, no CSS work.

**The tilt degrades properly:** `main.js` bails out on touch devices and when the
OS asks for reduced motion. Without the script the card is a styled, clickable
block — it just doesn't move.

## The logo

Inline SVG in `index.html` (hero, 34px + footer, 16px). Two paths:

* the G — `fill="currentColor"`, so CSS colour drives it (white in the hero, `#444` in the footer)
* the bolt — `fill="#FF3B2F"` with a `stroke="#000000" stroke-width="9"`

That black stroke is the important bit: it carves a gap where the bolt crosses the G,
so the red reads as a separate shape instead of merging into the white.

Going monochrome again? Delete the bolt's `fill` and add the bolt subpath to the G
path with `fill-rule="nonzero"` — opposite winding knocks it out as a true hole.

## Favicons

```
logo/favicon.svg      scalable, modern browsers
logo/favicon-32.png   browser tab
logo/favicon-180.png  apple touch icon
logo/favicon-512.png  android / PWA
```
Black plate, white G, red bolt — the full mark. Checked at 32px; the bolt still reads.

## Adding a project

Open `index.html`, find `~/projects`, uncomment the example `<article class="project">`
block and delete the `— nothing here yet.` line. That's the whole workflow:

```html
<article class="project">
  <h3><a href="https://…" target="_blank" rel="noopener">project-name</a></h3>
  <p>one line on what it does</p>
  <p class="meta">browser extension · 2026</p>
</article>
=======
git clone https://github.com/glymph-studio/glymph-studio-site
cd glymph-studio-site
open index.html
>>>>>>> 7090fe5e5aae9f6a1232ba6a31b6dd567494bea4
```

## contributing

This is a private studio site. Not open for contributions.

---

© 2026 Glymph Studio · [glymph.business@gmail.com](mailto:glymph.business@gmail.com)
