# Drop the team photos here

Same filename, any extension you update in `index.html`:

```
assets/team/yashh.jpg     →  Yashh Tripathi
assets/team/umaid.jpg     →  Umaid
assets/team/abhinav.jpg   →  Abhinav
```

**Recommended:** square-ish or 4:5 portrait, at least 800×1000px, `.jpg` or `.webp`.

The site ships with illustrated placeholders. The moment a real file exists at that path, it
replaces the placeholder automatically — no code change needed:

```html
<img src="assets/team/yashh.jpg" alt="Yashh Tripathi" loading="lazy" onerror="this.remove()" />
```

To use a different extension (`.png`, `.webp`), just edit the `src` in `index.html`.
