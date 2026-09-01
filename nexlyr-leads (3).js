/* ═══════════════════════════════════════════════════════════════
   NEXLYR — lead capture
   Every enquiry is written to Supabase BEFORE WhatsApp opens, so a
   blocked popup or a desktop visitor without WhatsApp never costs
   you the lead.

   Requires nexlyr-config.js. Uses nx.track() if analytics is loaded.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CFG = window.NEXLYR_CONFIG || {};
  var URL_ = (CFG.SUPABASE_URL || '').replace(/\/$/, '');
  var KEY = CFG.SUPABASE_ANON_KEY || '';
  var LIVE = URL_.indexOf('xxxx') === -1 && KEY && KEY.indexOf('REPLACE_ME') === -1;

  /* New-style publishable keys (sb_publishable_…) are NOT JWTs and must
     travel in the apikey header only. Sending them as a Bearer token
     makes Supabase try to parse them as a JWT and reject the request.
     Legacy anon keys (eyJ…) still expect both headers. */
  var IS_NEW_KEY = /^sb_(publishable|secret)_/.test(KEY);

  function headers() {
    var h = {
      'apikey': KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };
    if (!IS_NEW_KEY) h['Authorization'] = 'Bearer ' + KEY;
    return h;
  }

  /* ── attribution: where did this person actually come from ──── */
  function attribution() {
    var q = new URLSearchParams(location.search);
    var stored = {};
    try { stored = JSON.parse(sessionStorage.getItem('nx_attr') || '{}'); } catch (e) {}

    var attr = {
      utm_source: q.get('utm_source') || stored.utm_source || null,
      utm_medium: q.get('utm_medium') || stored.utm_medium || null,
      utm_campaign: q.get('utm_campaign') || stored.utm_campaign || null,
      utm_content: q.get('utm_content') || stored.utm_content || null,
      // Meta and Google click IDs — these make ad attribution work
      fbclid: q.get('fbclid') || stored.fbclid || null,
      gclid: q.get('gclid') || stored.gclid || null,
      referrer: stored.referrer || document.referrer || null,
      landing_page: stored.landing_page || location.pathname
    };

    try { sessionStorage.setItem('nx_attr', JSON.stringify(attr)); } catch (e) {}
    return attr;
  }
  attribution(); // capture on first page view, not just at submit

  /* ── write the lead ─────────────────────────────────────────── */
  function save(values) {
    var row = {
      name: values.name || null,
      business: values.biz || null,
      phone: values.phone || null,
      email: values.email || null,
      service: values.svc || null,
      message: values.msg || null,
      source_page: location.pathname.replace(/^\//, '') || 'index.html',
      user_agent: navigator.userAgent.slice(0, 500),
      status: 'new'
    };
    var attr = attribution();
    for (var k in attr) row[k] = attr[k];

    if (!LIVE) {
      console.warn('[nexlyr-leads] Supabase not configured — lead not saved:', row);
      return Promise.resolve({ ok: false, reason: 'not_configured' });
    }

    return fetch(URL_ + '/rest/v1/leads', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(row)
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          console.error('[nexlyr-leads] Supabase rejected the insert', r.status, t);
          return { ok: false, status: r.status };
        });
      }
      return { ok: true, status: r.status };
    }).catch(function (err) {
      console.error('[nexlyr-leads] save failed', err);
      return { ok: false, reason: 'network' };
    });
  }

  /* ── the full submit flow the form calls ────────────────────── */
  function submit(opts) {
    var values = opts.values || {};
    var onStatus = opts.onStatus || function () {};
    var done = opts.onDone || function () {};

    onStatus('Saving your details…', 'ok');

    // 6s ceiling: a slow network must never block the WhatsApp handoff.
    var guard = new Promise(function (res) {
      setTimeout(function () { res({ ok: false, reason: 'timeout' }); }, 6000);
    });

    return Promise.race([save(values), guard]).then(function (res) {

      if (window.nx && nx.track) {
        nx.track('generate_lead', {
          service: values.svc || 'unspecified',
          source_page: location.pathname,
          saved: !!res.ok,
          value: 1,
          currency: 'PKR'
        });
      }

      var text =
        'New enquiry — Nexlyr Solutions\n\n' +
        'Name: ' + (values.name || '') + '\n' +
        'Business: ' + (values.biz || '') + '\n' +
        'Phone: ' + (values.phone || '') + '\n' +
        'Email: ' + (values.email || '') + '\n' +
        'Service: ' + (values.svc || '') +
        (values.msg ? '\n\nNotes:\n' + values.msg : '');

      if (res.ok) {
        onStatus('Saved. Opening WhatsApp so it reaches Hashir straight away.', 'ok');
      } else {
        onStatus('Opening WhatsApp — if it does not open, email ' + (CFG.EMAIL || '') + '.', 'ok');
      }

      var win = window.open(
        (CFG.WHATSAPP || 'https://wa.me/923053687680') + '?text=' + encodeURIComponent(text),
        '_blank', 'noopener'
      );

      // Popup blocked AND nothing stored — the one case worth shouting about
      if (!win && !res.ok) {
        onStatus(
          'WhatsApp could not open and we could not reach the server. ' +
          'Please email ' + (CFG.EMAIL || '') + ' or message us directly.',
          'err'
        );
        done(false);
        return;
      }

      setTimeout(function () {
        var t = CFG.THANK_YOU_URL || 'thank-you.html';
        location.href = t + '?ref=' + encodeURIComponent(values.svc || 'general') +
                        (res.ok ? '' : '&saved=0');
      }, win ? 1400 : 700);

      done(true);
    });
  }

  window.NexlyrLeads = {
    save: save,
    submit: submit,
    attribution: attribution,
    configured: LIVE
  };
})();
