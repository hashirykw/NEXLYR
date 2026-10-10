/* ═══════════════════════════════════════════════════════════════
   NEXLYR — live content + first-party analytics
   Loads everything the admin panel controls in ONE request
   (team, reels, projects, reviews, FAQs, settings), caches it, and
   hands it to the page before it renders. If Supabase is slow or
   unreachable, the page uses the copy built into it: nothing breaks.

   Requires nexlyr-config.js (loaded first).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CFG = window.NEXLYR_CONFIG || {};
  var URL_ = (CFG.SUPABASE_URL || '').replace(/\/$/, '');
  var KEY = CFG.SUPABASE_ANON_KEY || '';
  var LIVE = !!(URL_ && KEY && URL_.indexOf('xxxx') === -1);
  var NEW_KEY = /^sb_(publishable|secret)_/.test(KEY);
  var CACHE = 'nx_cms_v1', WAIT_MS = 450, MISS_TTL = 6 * 3600 * 1000;

  function headers(extra) {
    var h = { apikey: KEY, 'Content-Type': 'application/json' };
    if (!NEW_KEY) h.Authorization = 'Bearer ' + KEY;
    for (var k in extra || {}) h[k] = extra[k];
    return h;
  }
  function readCache() { try { return JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (e) { return null; } }
  function writeCache(c) { try { localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), c: c })); } catch (e) {} }
  function fetchContent() {
    if (!LIVE) return Promise.resolve(null);
    return fetch(URL_ + '/rest/v1/rpc/get_public_content', { method: 'POST', headers: headers(), body: '{}' })
      .then(function (r) {
        /* no admin content yet: remember that for a few hours so pages never wait on it */
        if (!r.ok) { try { localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), c: {}, miss: 1 })); } catch (e) {} return null; }
        return r.json();
      })
      .catch(function () { return null; });
  }

  window.NX = window.NX || {};
  var cached = readCache(), ready;
  if (cached && cached.miss && Date.now() - cached.t > MISS_TTL) cached = null;
  if (cached && cached.c) {
    // stale-while-revalidate: render instantly from cache, refresh for next time
    NX.cms = cached.c;
    ready = Promise.resolve();
    fetchContent().then(function (c) { if (c) writeCache(c); });
  } else {
    ready = Promise.race([
      fetchContent().then(function (c) { if (c) { NX.cms = c; writeCache(c); } }),
      new Promise(function (res) { setTimeout(res, WAIT_MS); })
    ]);
  }

  /* ── settings that change the page after it renders ─────────── */
  function S(k) { return (NX.cms && NX.cms.settings && NX.cms.settings[k]) || null; }

  function decorate() {
    var d = document, contact = S('contact');
    // contact details: every WhatsApp link, mailto and visible number
    if (contact) {
      var num = String(contact.whatsapp_number || '').replace(/\D/g, '');
      if (num) {
        CFG.WHATSAPP = 'https://wa.me/' + num;
        d.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
          a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + num);
        });
      }
      if (contact.email) {
        CFG.EMAIL = contact.email;
        d.querySelectorAll('a[href^="mailto:"]').forEach(function (a) { a.href = 'mailto:' + contact.email; });
      }
      if (contact.instagram_url) d.querySelectorAll('a[href*="instagram.com"]').forEach(function (a) { a.href = contact.instagram_url; });
      if (contact.linkedin_url) d.querySelectorAll('a[href*="linkedin.com"]').forEach(function (a) { a.href = contact.linkedin_url; });
      var disp = contact.whatsapp_display;
      if (disp || contact.email) {
        var w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT), n;
        while ((n = w.nextNode())) {
          var t = n.nodeValue;
          if (disp && t.indexOf('3687680') > -1) t = t.replace(/\+92 305 3687680|0305 3687680/g, disp);
          if (contact.email && t.indexOf('nexlyr.solutions@gmail.com') > -1) t = t.replace(/nexlyr\.solutions@gmail\.com/g, contact.email);
          if (t !== n.nodeValue) n.nodeValue = t;
        }
      }
    }
    // form behaviour
    var forms = S('forms');
    if (forms && typeof forms.open_whatsapp_after_submit === 'boolean') CFG.OPEN_WHATSAPP = forms.open_whatsapp_after_submit;
    // availability note above the contact form
    var av = S('availability'), side = d.querySelector('.contact2__side .lede');
    if (av && side && (av.note || av.accepting === false)) {
      var p = d.createElement('p'); p.className = 'avail';
      p.textContent = av.note || 'We are fully booked right now. Send the brief anyway and we will tell you when we can start.';
      side.insertAdjacentElement('afterend', p);
    }
    // announcement bar
    var an = S('announcement');
    if (an && an.enabled && an.text) {
      var bar = d.createElement('div'); bar.className = 'annbar';
      bar.innerHTML = '<span></span>' + (an.link_url ? '<a></a>' : '') + '<button type="button" aria-label="Dismiss">×</button>';
      bar.querySelector('span').textContent = an.text;
      if (an.link_url) { var l = bar.querySelector('a'); l.href = an.link_url; l.textContent = an.link_text || 'Learn more'; }
      var key = 'nx_ann_' + an.text.length + '_' + an.text.slice(0, 12);
      var gone = false; try { gone = sessionStorage.getItem(key) === '1'; } catch (e) {}
      if (!gone) {
        d.body.prepend(bar); d.documentElement.classList.add('has-ann');
        bar.querySelector('button').onclick = function () { bar.remove(); d.documentElement.classList.remove('has-ann'); try { sessionStorage.setItem(key, '1'); } catch (e) {} };
      }
    }
    // maintenance mode (?preview=1 lets you see the site anyway)
    var mt = S('maintenance'), pv = false;
    try { if (/[?&]preview=1/.test(location.search)) sessionStorage.setItem('nx_preview', '1'); pv = sessionStorage.getItem('nx_preview') === '1'; } catch (e) {}
    if (mt && mt.enabled && !pv) {
      var o = d.createElement('div'); o.className = 'maint';
      o.innerHTML = '<div><img src="nexlyr-logo.webp" alt="Nexlyr" width="88"><p></p><a class="btn btn--primary" target="_blank" rel="noopener">WhatsApp us</a></div>';
      o.querySelector('p').textContent = mt.message || 'We are updating the website.';
      o.querySelector('a').href = CFG.WHATSAPP || 'https://wa.me/923053687680';
      d.body.appendChild(o); d.documentElement.style.overflow = 'hidden';
    }
  }

  /* ── first-party analytics: page views + key actions ─────────── */
  var Q = [], sid;
  try { sid = sessionStorage.getItem('nx_sid'); if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('nx_sid', sid); } } catch (e) { sid = 'na'; }
  var dev = /Mobi|Android/i.test(navigator.userAgent) ? (Math.min(screen.width, screen.height) > 600 ? 'tablet' : 'mobile') : 'desktop';
  var qs = new URLSearchParams(location.search);
  var TRACK = LIVE && CFG.TRACKING_ENABLED !== false && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var KEEP = { page_view: 1, whatsapp_click: 1, email_click: 1, phone_click: 1, generate_lead: 1, contact_start: 1, lead_confirmed: 1, page_not_found: 1, chatbot_open: 1, cta_click: 1 };

  function push(name, props) {
    if (!TRACK || !KEEP[name]) return;
    var clean = {};
    for (var k in props || {}) { var v = props[k]; if (v == null) continue; clean[k] = typeof v === 'string' ? v.slice(0, 160) : v; }
    Q.push({
      session_id: sid, name: name, page: location.pathname.slice(0, 200),
      referrer: (document.referrer || '').slice(0, 300) || null,
      utm_source: qs.get('utm_source'), utm_medium: qs.get('utm_medium'), utm_campaign: qs.get('utm_campaign'),
      device: dev, lang: (navigator.language || '').slice(0, 20), props: clean
    });
    if (Q.length >= 8) flush();
  }
  function flush(beacon) {
    if (!Q.length) return;
    var body = JSON.stringify(Q.splice(0, Q.length));
    fetch(URL_ + '/rest/v1/events', { method: 'POST', keepalive: !!beacon, headers: headers({ Prefer: 'return=minimal' }), body: body }).catch(function () {});
  }
  setInterval(flush, 5000);
  addEventListener('pagehide', function () { flush(true); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); });
  push('page_view', { title: document.title.slice(0, 120) });

  // mirror everything sent through nx.track (GA4/Meta) into Supabase too
  function wrap() {
    if (!window.nx || window.nx.__nxcms) return;
    var orig = window.nx.track;
    window.nx.track = function (name, params) { try { push(name, params); } catch (e) {} return orig.apply(this, arguments); };
    window.nx.__nxcms = true;
  }
  document.addEventListener('DOMContentLoaded', wrap); addEventListener('load', wrap);

  window.NXCMS = { ready: ready, decorate: decorate, track: push, setting: S, live: LIVE };
})();
