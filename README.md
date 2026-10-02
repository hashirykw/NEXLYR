# Nexlyr — website (frontend)

Every file sits side by side with no subfolders, so it uploads correctly through GitHub's website (which flattens folders). Upload everything to the repo root, and Vercel deploys it.

## Remove these old files from the repo if they are still there
`log.json`, `checks.yml`, `download`, `download (1)`, `security.txt`, `hero.mp4`, `hero-poster.webp`, `IMAGE-PROMPTS.md`

## The files you might edit
- `nexlyr-config.js`: Supabase URL and publishable key, GA4 and Meta Pixel IDs, tracking on/off. This is the only file to touch when IDs change.
- Everything else (team, reels, projects, reviews, FAQs, contact details, announcement bar, maintenance mode) is controlled from the **admin panel**. There is nothing to edit in code.

## How the website talks to the backend
- `nexlyr-leads.js` saves every enquiry to Supabase before anything else happens.
- `nexlyr-cms.js` loads all admin-panel content in one request and caches it on the visitor's device, so pages open instantly. If Supabase is ever unreachable, the site falls back to the content built into the pages, so it never breaks.
- `nexlyr-cms.js` also records page views and key actions (WhatsApp clicks, form submits, 404s) into your own database for the dashboard. It uses no cookies, collects no personal data, and keeps working when ad blockers stop Google Analytics.
- Admin changes reach visitors on their next page load.

## Images
Placeholders show the Nexlyr mark until a real image exists. The exact file names and prompts are in the `4-image-prompts` folder. Either:
- drop the image next to `index.html` with that exact name, or
- upload it in the admin panel and paste its link into the right item.

## Previewing on your computer
Links between pages use clean addresses (`/web-development`), which work on Vercel. Opening the `.html` files straight from your computer shows each page, but clicking between pages needs the live site.
