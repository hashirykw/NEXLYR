/* ═══════════════════════════════════════════════════════════════
   NEXLYR — central config
   The only file you edit when IDs change. Loaded before everything.
   ═══════════════════════════════════════════════════════════════ */
window.NEXLYR_CONFIG = {

  /* ── 1. Google Analytics 4 ────────────────────────────────────
     analytics.google.com → Admin → Data Streams → Web
     Looks like: G-XXXXXXXXXX                                     */
  GA4_ID: 'G-XXXXXXXXXX',

  /* ── 2. Meta (Facebook) Pixel ─────────────────────────────────
     business.facebook.com → Events Manager → Data Sources
     16 digits                                                    */
  META_PIXEL_ID: '0000000000000000',

  /* ── 3. Supabase — live ───────────────────────────────────────
     Publishable keys are safe in public code. Row-level security
     in schema.sql is what protects the data: this key can insert
     a lead and cannot read, edit or delete a single row.         */
  SUPABASE_URL: 'https://rkjnfxjbtsypttatxwrc.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_GUxZjSH3OJYp2fMZNaTvyA_2VZoO4Dx',

  /* ── 4. Contact routes ───────────────────────────────────────── */
  WHATSAPP: 'https://wa.me/923053687680',
  EMAIL: 'nexlyr.solutions@gmail.com',

  /* ── 5. Behaviour switches ───────────────────────────────────── */
  // Consent banner shows only to EU/UK/EEA-looking visitors.
  // Set true to show it to everyone.
  CONSENT_BANNER_EVERYWHERE: false,

  // Open WhatsApp with the enquiry pre-filled after submitting?
  // false = the lead is saved to Supabase only, and the visitor goes
  // straight to the thank-you page. WhatsApp stays available as a
  // separate button elsewhere on the site.
  OPEN_WHATSAPP: false,

  THANK_YOU_URL: 'thank-you.html',

  // Set false while testing locally so you don't pollute real analytics.
  TRACKING_ENABLED: true
};
