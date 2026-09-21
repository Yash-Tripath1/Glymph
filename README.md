# GLYMPH STUDIO — site

Static site. **No build step, no JavaScript, no dependencies, no CDN.**

```
index.html      the entire site
styles.css      ~150 lines of CSS
fonts/          JetBrains Mono, self-hosted (OFL licence)
logo/           brand assets (SVG + PNG)
assets/team/    drop crew photos here — see PUT-PHOTOS-HERE.md
vercel.json     response headers
```

## Deploy

```bash
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

Open `index.html`, find `~/projects`, uncomment the example `<article class="project">`
block and delete the `— nothing here yet.` line. That's the whole workflow:

```html
<article class="project">
  <h3><a href="https://…" target="_blank" rel="noopener">project-name</a></h3>
  <p>one line on what it does</p>
  <p class="meta">browser extension · 2026</p>
</article>
```

They lay themselves out in a responsive grid — no CSS work needed.

## Design rules — keep it this way

| | |
|---|---|
| Background | `#000` |
| Text | `#ededed` / `#666` secondary / `#444` labels |
| Dividers | 1px `#1a1a1a` — never white |
| Type | JetBrains Mono, everywhere, monospace only |
| Layout | left-aligned, 720px column, generous space |
| Animation | **one** — the caret blink. Nothing else. |

**Never add:** gradients, glows, box-shadows, rounded "cards", emojis,
animations, or placeholder content that isn't true.

The credibility of this site comes from how little it claims. Every fake
project or clever line costs more trust than it buys.

## Swapping the thesis line

The hero currently reads **"Too hard to build? Watch us."**
The long version — *"We build things people say are too hard to build yet."* —
lives in `index.html` as the meta description. Swap them if you prefer it up top.
