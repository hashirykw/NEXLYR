# NEXLYR

Marketing site for Nexlyr Solutions — a digital agency in Karachi, Pakistan.

Live at **[nexlyr.solutions](https://nexlyr.solutions)**

---

## Structure

Every page is a single self-contained HTML file. All CSS and JavaScript are
inlined — there is no build step, no bundler, and no framework. Open any file
in a browser and it works.

```
index.html                      Home
web-development.html            Web development
business-software.html          Business software
social-media-marketing.html     Social media marketing
video-editing.html              Video editing
design-and-ads.html             Design & ads
privacy.html  terms.html  thank-you.html  404.html

assets/
  nexlyr-config.js              Site config
  nexlyr-analytics.js           Analytics + cookie consent banner
  nexlyr-leads.js               Lead capture
```

Supporting files: `site.webmanifest` (PWA), `sitemap.xml`, `robots.txt`,
`llms.txt`, `vercel.json` (redirects), `CNAME` (custom domain).

---

## Brand

### Colours

| Token | Hex | Use |
|---|---|---|
| `--void` | `#06070B` | Page background |
| `--text` | `#F3F6FA` | Body text |
| `--muted` | `#98A3B6` | Secondary text |
| `--brand` | `#18C8F0` | Primary cyan |
| `--brand2` | `#5FE1FF` | Light cyan, glows |
| `--brand3` | `#0C7FC4` | Deep azure, gradient end |
| `--brand-deep` | `#007DC1` | Deep accent |

The brand gradient (`--sheen`) runs `#7FEBFF → #18C8F0 → #0C7FC4`, matching the
logo's own cyan-to-azure fade. There is no violet in the brand palette.

### Fonts

Poppins (body and display), Jost (wordmark), Playfair Display (serif accents),
JetBrains Mono (mono).

### Logo files

All generated from `Logo.png`, the 6250×6250 master.

| File | Size | Use |
|---|---|---|
| `logo-full.png` / `.webp` | 481×640 | Full lockup — wordmark + bars |
| `logo-icon-1024.png` | 1024×1024 | Icon master |
| `logo-icon-512/256/128/64.webp` | square | Icon on the site |
| `icon-512/192/128.png` | square | PWA manifest |
| `icon-maskable-512.png` | 512×512 | Android maskable, dark background |
| `apple-touch-icon.png` | 180×180 | iOS — solid background, no alpha |
| `favicon.ico` | 16/32/48/64 | Browser tab |
| `favicon-16/32.png` | 16, 32 | Browser tab |

Two rules when regenerating these:

- `apple-touch-icon.png` must be RGB with a solid `#06070B` background. iOS
  renders transparency as black.
- `icon-maskable-512.png` needs a full-bleed background with the art inside the
  centre 80%, or Android crops the bars.

The logo is used **frameless** — no border, background plate, or glow behind it.

---

## Deploying

Push to `main`. The site is static, so it deploys as-is.

`.github/workflows/checks.yml` runs on every push and validates that
`sitemap.xml` parses, `site.webmanifest` is valid JSON, and every JSON-LD block
in every page parses.

---

## Editing notes

- Each page carries its own copy of the stylesheet. A colour or component
  change usually has to be applied to all pages, not just `index.html`.
- `design-and-ads.html` contains **two** full copies of the stylesheet. The
  second one wins. Change both.
- The chatbot avatar (`.bothead .av`) holds the logo image on most pages, but
  an SVG bot icon on `design-and-ads.html`. That SVG is dark-coloured and needs
  its background plate — don't strip it.
- Contact: `nexlyr.solutions@gmail.com` · +92 305 3687680
