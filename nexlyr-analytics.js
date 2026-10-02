/* ═══════════════════════════════════════════════════════════════
   NEXLYR — analytics & event tracking
   GA4 + Meta Pixel + Consent Mode v2 + automatic event capture.

   Covers audit items 1, 3 and 4.
   Requires nexlyr-config.js to load first.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CFG = window.NEXLYR_CONFIG || {};
  if (!CFG.TRACKING_ENABLED) { window.nx = { track: function () {} }; return; }

  var GA4 = CFG.GA4_ID || '';
  var PIXEL = CFG.META_PIXEL_ID || '';
  var STORE_KEY = 'nx_consent_v1';

  var hasGA4 = GA4 && GA4.indexOf('X') === -1;
  var hasPixel = PIXEL && PIXEL.indexOf('0000') === -1;

  /* ─────────────────────────────────────────────────────────────
     1. CONSENT
     Consent Mode v2 is initialised BEFORE gtag.js loads, which is
     the only order Google accepts. Non-EU visitors are granted by
     default; EU/UK/EEA visitors start denied and see the banner.
     ───────────────────────────────────────────────────────────── */
  var EEA_ZONES = /^Europe\/|^Atlantic\/(Azores|Canary|Madeira|Faroe|Reykjavik)|^Africa\/Ceuta|^Asia\/(Nicosia|Famagusta)/;

  function looksEEA() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      return EEA_ZONES.test(tz);
    } catch (e) { return false; }
  }

  function savedChoice() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }

  function saveChoice(v) {
    try { localStorage.setItem(STORE_KEY, v); } catch (e) {}
  }

  var needsBanner = CFG.CONSENT_BANNER_EVERYWHERE || looksEEA();
  var choice = savedChoice();
  var granted = choice ? choice === 'granted' : !needsBanner;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('consent', 'default', {
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  function updateConsent(ok) {
    var v = ok ? 'granted' : 'denied';
    gtag('consent', 'update', {
      ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v
    });
    if (hasPixel && window.fbq) fbq('consent', ok ? 'grant' : 'revoke');
    saveChoice(v);
  }

  /* ─────────────────────────────────────────────────────────────
     2. LOAD GA4
     ───────────────────────────────────────────────────────────── */
  if (hasGA4) {
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4;
    document.head.appendChild(g);

    gtag('js', new Date());
    gtag('config', GA4, {
      anonymize_ip: true,
      send_page_view: true,
      // Lets you split Karachi traffic from the rest in reports
      page_title: document.title
    });
  }

  /* ─────────────────────────────────────────────────────────────
     3. LOAD META PIXEL
     ───────────────────────────────────────────────────────────── */
  if (hasPixel) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    if (!granted) fbq('consent', 'revoke');
    fbq('init', PIXEL);
    fbq('track', 'PageView');
  }

  /* ─────────────────────────────────────────────────────────────
     4. PUBLIC TRACK HELPER
     Call anywhere:  nx.track('whatsapp_click', {location:'nav'})
     Sends to GA4 and Meta at once. Names stay snake_case.
     ───────────────────────────────────────────────────────────── */
  var META_MAP = {
    generate_lead: 'Lead',
    contact_start: 'InitiateCheckout',
    whatsapp_click: 'Contact',
    phone_click: 'Contact',
    email_click: 'Contact'
  };

  function track(name, params) {
    params = params || {};
    if (hasGA4 && window.gtag) gtag('event', name, params);
    if (hasPixel && window.fbq) {
      var std = META_MAP[name];
      if (std) fbq('track', std, params);
      else fbq('trackCustom', name, params);
    }
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      console.log('[nx]', name, params);
    }
  }

  window.nx = {
    track: track,
    consent: updateConsent,
    granted: function () { return granted; },
    // Lets the privacy page reopen the choice even for visitors who never
    // saw the banner in the first place.
    openConsent: function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      if (!document.querySelector('.nxc')) renderBanner();
    }
  };

  /* ─────────────────────────────────────────────────────────────
     5. AUTOMATIC EVENT CAPTURE
     One delegated listener on the document catches everything,
     so no markup changes are needed on the existing pages.
     ───────────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a,button');
    if (!a) return;

    var href = (a.getAttribute('href') || '').toLowerCase();
    var label = (a.textContent || '').trim().slice(0, 60);

    /* WhatsApp — nav, hero, footer, floating, anywhere */
    if (href.indexOf('wa.me') > -1 || href.indexOf('api.whatsapp') > -1) {
      track('whatsapp_click', {
        link_url: a.getAttribute('href'),
        location: zoneOf(a),
        page: location.pathname
      });
      return;
    }

    /* Email + phone */
    if (href.indexOf('mailto:') === 0) {
      track('email_click', { location: zoneOf(a), page: location.pathname });
      return;
    }
    if (href.indexOf('tel:') === 0) {
      track('phone_click', { location: zoneOf(a), page: location.pathname });
      return;
    }

    /* Project cards — the fan deck / snap rail on the home page */
    var proj = a.getAttribute && a.getAttribute('data-proj');
    if (proj) {
      track('project_open', { project_id: proj, page: location.pathname });
      return;
    }

    /* Live-site button inside the project modal */
    if (a.id === 'p-open' || a.id === 'p-open2') {
      track('project_visit_live', {
        link_url: a.getAttribute('href') || '',
        page: location.pathname
      });
      return;
    }

    /* Chatbot open */
    if (a.id === 'botfab') {
      track('chatbot_open', { page: location.pathname });
      return;
    }

    /* Service popup cards */
    if (a.hasAttribute && a.hasAttribute('data-svc')) {
      track('service_open', { service: a.getAttribute('data-svc'), page: location.pathname });
      return;
    }

    /* Team modal */
    if (a.hasAttribute && a.hasAttribute('data-team')) {
      track('team_open', { person: a.getAttribute('data-team') });
      return;
    }

    /* Contact / start-a-project CTAs — the intent signal before the form */
    if (href.indexOf('#contact') > -1 || /start a project|get a quote|contact/i.test(label)) {
      track('contact_start', { cta_text: label, location: zoneOf(a) });
    }
  }, true);

  /* Chatbot messages sent */
  document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'botform') {
      track('chatbot_message', { page: location.pathname });
    }
  }, true);

  /* Which part of the page a click came from */
  function zoneOf(el) {
    if (el.closest('header,.nav')) return 'nav';
    if (el.closest('footer')) return 'footer';
    if (el.closest('#drawer')) return 'mobile_menu';
    if (el.closest('#botwin,#botfab')) return 'chatbot';
    if (el.closest('#wzv,.wzform')) return 'form';
    if (el.closest('#contact')) return 'contact_section';
    if (el.closest('#home,.hero')) return 'hero';
    return 'body';
  }

  /* Scroll depth — tells you whether long service pages actually get read */
  var marks = [25, 50, 75, 90], hit = {};
  var scrollTick;
  window.addEventListener('scroll', function () {
    if (scrollTick) return;
    scrollTick = setTimeout(function () {
      scrollTick = null;
      var h = document.documentElement;
      var pct = (h.scrollTop + window.innerHeight) / h.scrollHeight * 100;
      marks.forEach(function (m) {
        if (pct >= m && !hit[m]) { hit[m] = 1; track('scroll_depth', { percent: m, page: location.pathname }); }
      });
    }, 400);
  }, { passive: true });

  /* ─────────────────────────────────────────────────────────────
     6. CONSENT BANNER (only rendered when actually needed)
     ───────────────────────────────────────────────────────────── */
  if (needsBanner && !choice) {
    document.addEventListener('DOMContentLoaded', renderBanner);
  }

  function renderBanner() {
    var css = document.createElement('style');
    css.textContent =
      '.nxc{position:fixed;left:16px;right:16px;bottom:16px;z-index:9998;max-width:520px;' +
      'margin-inline:auto;padding:18px 20px;border-radius:22px;' +
      'background:linear-gradient(158deg,rgba(255,255,255,.11),rgba(255,255,255,.045) 34%,rgba(255,255,255,.022) 68%,rgba(255,255,255,.05));' +
      'backdrop-filter:blur(26px) saturate(1.7);-webkit-backdrop-filter:blur(26px) saturate(1.7);' +
      'box-shadow:inset 0 1px 0 rgba(255,255,255,.38),0 26px 60px -26px rgba(0,0,0,.72);' +
      'color:#F3F6FA;font-family:Poppins,system-ui,sans-serif;font-size:13.5px;line-height:1.6;' +
      'transform:translateY(140%);transition:transform .6s cubic-bezier(.16,1,.3,1)}' +
      '.nxc.on{transform:none}' +
      '.nxc p{margin:0 0 14px;color:#98A3B6}' +
      '.nxc a{color:#5FE1FF;text-decoration:underline;text-underline-offset:3px}' +
      '.nxc div{display:flex;gap:9px;flex-wrap:wrap}' +
      '.nxc button{flex:1;min-width:120px;padding:10px 16px;border-radius:99px;border:1px solid rgba(255,255,255,.13);' +
      'background:transparent;color:#F3F6FA;cursor:pointer;font-size:13px;font-weight:500;transition:.25s}' +
      '.nxc button:hover{border-color:rgba(255,255,255,.24);background:rgba(255,255,255,.045)}' +
      '.nxc button.y{background:linear-gradient(104deg,#7FEBFF,#18C8F0 46%,#0C7FC4);border-color:transparent;color:#06070B;font-weight:600}' +
      '@media (prefers-reduced-motion:reduce){.nxc{transition:none}}';
    document.head.appendChild(css);

    var box = document.createElement('div');
    box.className = 'nxc';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie preferences');
    box.innerHTML =
      '<p>We use cookies to see which pages people actually read and whether our ads bring anyone. ' +
      'Nothing is sold on. <a href="privacy.html">Privacy policy</a>.</p>' +
      '<div><button type="button" data-no>Only essentials</button>' +
      '<button type="button" class="y" data-yes>Accept</button></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add('on'); });

    box.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-yes')) { updateConsent(true); close(); }
      if (e.target.hasAttribute('data-no')) { updateConsent(false); close(); }
    });

    function close() {
      box.classList.remove('on');
      setTimeout(function () { box.remove(); }, 650);
    }
  }
})();
