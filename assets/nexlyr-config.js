/* ═══════════════════════════════════════════════════════════════
   NEXLYR — central config
   The only file you edit when IDs change. Loaded before everything.
   ═══════════════════════════════════════════════════════════════ */
window.NEXLYR_CONFIG = {

  /* ── 1. Google Analytics 4 ────────────────────────────────────
     Get from: analytics.google.com → Admin → Data Streams → Web
     Looks like: G-XXXXXXXXXX                                     */
  GA4_ID: 'G-XXXXXXXXXX',

  /* ── 2. Meta (Facebook) Pixel ─────────────────────────────────
     Get from: business.facebook.com → Events Manager → Data Sources
     Looks like: 1234567890123456  (16 digits)                    */
  META_PIXEL_ID: '0000000000000000',

  /* ── 3. Supabase ──────────────────────────────────────────────
     Get from: supabase.com → your project → Settings → API
     The anon key is SAFE to expose publicly — row-level security
     in schema.sql is what actually protects the data.            */
  SUPABASE_URL: 'https://xxxxxxxxxxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.REPLACE_ME',

  /* ── 4. Contact routes ───────────────────────────────────────── */
  WHATSAPP: 'https://wa.me/923053687680',
  EMAIL: 'nexlyr.solutions@gmail.com',

  /* ── 5. Behaviour switches ───────────────────────────────────── */
  // Show the consent banner only to visitors who look EU/UK/EEA.
  // Everyone else is granted by default (Pakistan has no cookie-consent law).
  // Set to true to show the banner to every visitor.
  CONSENT_BANNER_EVERYWHERE: false,

  // Where the form sends people after a successful submit.
  THANK_YOU_URL: 'thank-you.html',

  // Set false while testing locally so you don't pollute real analytics.
  TRACKING_ENABLED: true
};
