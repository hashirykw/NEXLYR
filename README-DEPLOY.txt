NEXLYR — UPDATED FILES
══════════════════════════════════════════════════════════════════════

Unzip and upload all of these, keeping the folder structure.
assets/ must stay a folder next to the .html files.

  index.html
  web-development.html
  video-editing.html
  social-media-marketing.html
  assets/nexlyr-config.js
  assets/nexlyr-analytics.js      (unchanged, included so assets/ is complete)
  assets/nexlyr-leads.js          (unchanged, included so assets/ is complete)

Everything else in the repo is untouched — do not delete it. Images,
favicons, robots.txt, sitemap.xml, CNAME, privacy.html, terms.html,
thank-you.html, business-software.html and design-and-ads.html all stay
exactly as they are.


BEFORE YOU DEPLOY — ONE MANUAL STEP
══════════════════════════════════════════════════════════════════════

Open assets/nexlyr-config.js and replace two placeholder values:

    GA4_ID: 'G-XXXXXXXXXX',
    META_PIXEL_ID: '0000000000000000',

  GA4 ID    analytics.google.com -> Admin -> Data Streams -> Web
  Pixel ID  business.facebook.com -> Events Manager -> Data Sources

Until these are real, no visitor is recorded and no retargeting
audience is built. The site works fine either way, but you stay blind.

To check it worked: open the site, press F12, look at the Console.
A red "[NEXLYR] TRACKING IS OFF" banner means the IDs are still
placeholders. No banner means tracking is live.


WHAT CHANGED
══════════════════════════════════════════════════════════════════════

1. assets/nexlyr-config.js
   Added a guard that prints a loud console warning when the GA4 or
   Pixel ID is still a placeholder, so this can never fail silently
   again. Supabase settings untouched.

2. video-editing.html + social-media-marketing.html
   The 3-step project brief now lives on these pages. Previously every
   "Start a project" / "project brief" link sent the visitor to the
   home page, losing the ones who did not follow.

   All 8 such links per page now open the brief in place:
     - 4 static links carry data-wz-open
     - the chatbot writes its links at runtime, so a delegated
       capture-phase handler catches those too

   The service dropdown pre-selects from the page, so a visitor on the
   video page starts on "Video Editing" rather than "Web Development".

   Leads go to the same Supabase table as the home page, with the same
   WhatsApp fallback. Nothing new to configure.

3. All four pages
   Titles cut to 52-57 characters and meta descriptions to 143-154,
   so Google stops truncating them. og: and twitter: tags updated to
   match, so shared links read correctly too.


TESTED
══════════════════════════════════════════════════════════════════════

Every page loaded in Chromium with zero JavaScript errors. On both new
form pages: all 6 visible triggers open the brief without navigating
away, the chatbot link opens it in place, all 3 steps validate and
navigate, empty fields correctly block Continue, and Send posts to
the real Supabase leads endpoint.
