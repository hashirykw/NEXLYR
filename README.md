# Nexlyr — website (frontend)

Pages, scripts and images sit side by side in the repo root, and Vercel deploys it. A few files live in folders because they have to:

- `.well-known/security.txt` — security contact, served at `/.well-known/security.txt`
- `.github/workflows/checks.yml` — checks every push (sitemap, JSON-LD, broken links, one h1 per page)
- `.hallmark/log.json` — design history used by the Hallmark design skill

Push with git rather than GitHub's web uploader, which flattens folders.

## The files you might edit
- `nexlyr-config.js`: Supabase URL and publishable key, GA4 and Meta Pixel IDs, tracking on/off. This is the only file to touch when IDs change.
- Everything else (team, reels, projects, reviews, FAQs, contact details, announcement bar, maintenance mode) is controlled from the **admin panel**. There is nothing to edit in code.

## How the website talks to the backend
- `nexlyr-leads.js` saves every enquiry to Supabase before anything else happens.
- `nexlyr-cms.js` loads all admin-panel content in one request and caches it on the visitor's device, so pages open instantly. If Supabase is ever unreachable, the site falls back to the content built into the pages, so it never breaks.
- `nexlyr-cms.js` also records page views and key actions (WhatsApp clicks, form submits, 404s) into your own database for the dashboard. It uses no cookies, collects no personal data, and keeps working when ad blockers stop Google Analytics.
- Admin changes reach visitors on their next page load.

## Images
Placeholders show the Nexlyr mark until a real image exists. The exact file names and prompts are in `IMAGE-PROMPTS.md`. Either:
- drop the image next to `index.html` with that exact name, or
- upload it in the admin panel and paste its link into the right item.

## Previewing on your computer
Links between pages use clean addresses (`/web-development`), which work on Vercel. Opening the `.html` files straight from your computer shows each page, but clicking between pages needs the live site.

## Hero earth
The homepage earth loads three.js from cdnjs after the page is up and uses `earth-day.webp`, `earth-night.webp`, `earth-water.webp` and `earth-relief.webp`. Earth imagery: NASA Blue Marble and Black Marble (public domain). If WebGL or any of these files are unavailable, the dotted canvas globe shows instead.
