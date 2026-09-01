#!/usr/bin/env python3
"""
NEXLYR — page patcher v2
Wires config + analytics + lead capture + SEO fixes into the five existing
pages. Every change is idempotent, so it is safe to run again after edits.

    python3 patch_pages.py .            write changes (keeps .bak backups)
    python3 patch_pages.py . --check    dry run, changes nothing
"""

import sys, os, re, shutil

PAGES = [
    "index.html",
    "web-development.html",
    "business-software.html",
    "social-media-marketing.html",
    "video-editing.html",
]

# ═══════════════════════════════════════════════════════════════════
# 1. HEAD — verification + scripts + sitemap
# ═══════════════════════════════════════════════════════════════════

HEAD_BLOCK = """
<!-- ═══ Nexlyr: verification, tracking, lead capture ═══ -->
<meta name="google-site-verification" content="REPLACE_WITH_SEARCH_CONSOLE_TOKEN"/>
<link rel="sitemap" type="application/xml" href="/sitemap.xml"/>
<script src="assets/nexlyr-config.js" defer></script>
<script src="assets/nexlyr-analytics.js" defer></script>
<script src="assets/nexlyr-leads.js" defer></script>
<!-- ═══ end Nexlyr ═══ -->
"""

# ═══════════════════════════════════════════════════════════════════
# 2. FORM — Supabase before WhatsApp
# ═══════════════════════════════════════════════════════════════════

OLD_HANDLER_START = "form.addEventListener('submit',e=>{"
OLD_HANDLER_END = "},700);\n  });"

NEW_HANDLER = r"""form.addEventListener('submit',e=>{
    e.preventDefault();
    const box=$('.fmsg',form), btn=$('button[type=submit]',form);
    /* honeypot + time trap */
    if($('.hp',form).value!==''){return}
    let bad=null;
    $$('.field',form).forEach(f=>{f.dataset.touched='1';if(!vField(f)&&!bad)bad=f});
    if(bad){
      box.className='fmsg e on';
      box.textContent='Please fix the highlighted fields before sending.';
      bad.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'});
      $('.inp',bad).focus();
      return;
    }
    const g=n=>{const el=$('[name="'+n+'"]',form);return el?el.value.trim():''};
    const values={name:g('name'),biz:g('biz'),phone:g('phone'),email:g('email'),svc:g('svc'),msg:g('msg')};
    const status=(t,kind)=>{box.className='fmsg '+(kind==='err'?'e ':'')+'on';box.textContent=t};
    btn.disabled=true; btn.style.opacity='.6';
    const release=()=>{btn.disabled=false;btn.style.opacity=''};

    /* Supabase first, WhatsApp second — the lead survives either failing */
    if(window.NexlyrLeads){
      NexlyrLeads.submit({values,onStatus:status,onDone:ok=>{if(!ok)release()}});
    }else{
      /* fallback if the script did not load: original behaviour */
      status('Opening WhatsApp so it reaches Hashir instantly.','ok');
      const text='New enquiry \u2014 Nexlyr Solutions\n\nName: '+values.name+'\nBusiness: '+values.biz+
        '\nPhone: '+values.phone+'\nEmail: '+values.email+'\nService: '+values.svc+
        (values.msg?'\n\nNotes:\n'+values.msg:'');
      setTimeout(()=>{window.open(WA+'?text='+encodeURIComponent(text),'_blank','noopener');release()},700);
    }
  });"""

# ═══════════════════════════════════════════════════════════════════
# 3. FOOTER — legal links
# ═══════════════════════════════════════════════════════════════════

FBOT_OLD = "<span>Built in-house"
FBOT_NEW = ('<span class="flegal">'
            '<a href="privacy.html">Privacy</a>'
            '<a href="terms.html">Terms</a>'
            '</span>\n<span>Built in-house')

EXTRA_CSS = """
/* ── Nexlyr: footer legal links + skip link ── */
.fbot .flegal{display:flex;gap:18px;align-items:center}
.fbot .flegal a{color:var(--dim);transition:color .25s var(--ez)}
.fbot .flegal a:hover{color:var(--brand2)}
@media(max-width:640px){.fbot .flegal{order:3;width:100%;justify-content:center;padding-top:6px}}
.nx-skip{position:absolute;left:-9999px;top:0;z-index:999;padding:12px 20px;
  border-radius:0 0 14px 0;background:var(--brand);color:#06070B;font-weight:600;
  font-size:14px;text-decoration:none}
.nx-skip:focus{left:0}
"""

SKIP_LINK = '<a class="nx-skip" href="#home">Skip to content</a>\n'

# JSON-LD injected only where the page is missing the WebPage/WebSite graph
WEBSITE_LD = """
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
{"@type":"WebSite","@id":"https://nexlyr.solutions/#website",
 "url":"https://nexlyr.solutions/","name":"Nexlyr Solutions",
 "description":"Web development and digital marketing studio in Karachi, Pakistan.",
 "inLanguage":"en","publisher":{"@id":"https://nexlyr.solutions/#org"}},
{"@type":"WebPage","@id":"__URL__#page","url":"__URL__","name":"__TITLE__",
 "inLanguage":"en","isPartOf":{"@id":"https://nexlyr.solutions/#website"},
 "publisher":{"@id":"https://nexlyr.solutions/#org"},
 "about":{"@id":"https://nexlyr.solutions/#org"}}
]}
</script>
"""


def canonical_of(src):
    m = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', src)
    return m.group(1) if m else None


def title_of(src):
    m = re.search(r"<title>(.*?)</title>", src, re.S)
    return m.group(1).strip() if m else "Nexlyr Solutions"


def patch(path, dry=False):
    src = open(path, encoding="utf-8").read()
    original = src
    notes = []
    name = os.path.basename(path)

    # ── 1. head block ────────────────────────────────────────────
    if "nexlyr-config.js" in src:
        notes.append("head block already present")
    elif "</head>" in src:
        src = src.replace("</head>", HEAD_BLOCK + "</head>", 1)
        notes.append("added verification meta, sitemap link, 3 script tags")
    else:
        notes.append("!! no </head> found")

    # ── 2. hreflang (self-referencing + x-default) ───────────────
    canon = canonical_of(src)
    if canon and 'rel="alternate"' not in src:
        tags = ('\n<link rel="alternate" hreflang="en" href="%s"/>'
                '\n<link rel="alternate" hreflang="x-default" href="%s"/>' % (canon, canon))
        src = re.sub(r'(<link[^>]+rel="canonical"[^>]*/?>)', r"\1" + tags, src, count=1)
        notes.append("added hreflang en + x-default")
    elif 'rel="alternate"' in src:
        notes.append("hreflang already present")

    # ── 3. duplicate view-transition meta ────────────────────────
    vt = re.findall(r'<meta[^>]+name="view-transition"[^>]*/?>', src)
    if len(vt) > 1:
        first = vt[0]
        src = src.replace(first, "@@KEEPVT@@", 1)
        for d in vt[1:]:
            src = src.replace(d, "", 1)
        src = src.replace("@@KEEPVT@@", first, 1)
        notes.append("removed %d duplicate view-transition meta" % (len(vt) - 1))

    # ── 4. skip link ─────────────────────────────────────────────
    if "nx-skip" not in src:
        m = re.search(r"<body[^>]*>", src)
        if m:
            src = src[:m.end()] + "\n" + SKIP_LINK + src[m.end():]
            notes.append("added skip-to-content link")

    # ── 5. verify the skip link has a target ─────────────────────
    if 'id="home"' not in src:
        notes.append('!! no id="home" on this page — skip link has no target')

    # ── 6. WebPage / WebSite schema where missing ────────────────
    if '"WebSite"' not in src and canon:
        block = (WEBSITE_LD.replace("__URL__", canon)
                           .replace("__TITLE__", title_of(src).replace('"', "'")))
        src = src.replace("</head>", block + "</head>", 1)
        notes.append("added WebSite + WebPage schema")

    # ── 7. form handler ──────────────────────────────────────────
    i = src.find(OLD_HANDLER_START)
    if i == -1:
        notes.append("no contact form on this page")
    elif "NexlyrLeads" in src:
        notes.append("form handler already patched")
    else:
        j = src.find(OLD_HANDLER_END, i)
        if j == -1:
            notes.append("!! form handler end marker missing — NOT patched")
        else:
            j += len(OLD_HANDLER_END)
            src = src[:i] + NEW_HANDLER + src[j:]
            notes.append("rewired form: Supabase -> WhatsApp -> thank-you")

    # ── 8. footer legal links ────────────────────────────────────
    if 'href="privacy.html"' in src:
        notes.append("footer legal links already present")
    elif FBOT_OLD in src:
        src = src.replace(FBOT_OLD, FBOT_NEW, 1)
        notes.append("added Privacy + Terms to footer")
    else:
        notes.append("!! footer bottom bar not found — add links by hand")

    # ── 9. extra css ─────────────────────────────────────────────
    if ".nx-skip" not in src and "</style>" in src:
        k = src.rfind("</style>")
        src = src[:k] + EXTRA_CSS + src[k:]
        notes.append("added footer + skip-link styling")

    # ── 10. non-blocking fonts (index.html loads them render-blocking) ──
    if name == "index.html":
        # attributes appear in either order across the pages
        pat = re.compile(
            r'<link\b(?=[^>]*rel="stylesheet")(?=[^>]*'
            r'href="(https://fonts\.googleapis\.com/css2\?[^"]+)")[^>]*/?>')
        # skip the <noscript> fallback copies, or the fix re-fires forever
        skip = [(m.start(), m.end()) for m in
                re.finditer(r"<noscript>.*?</noscript>", src, re.S)]
        inside = lambda i: any(a <= i < b for a, b in skip)
        hits = [m for m in pat.finditer(src)
                if 'media="print"' not in m.group(0) and not inside(m.start())]
        if hits:
            for m in reversed(hits):
                url = m.group(1)
                repl = ('<link rel="stylesheet" href="%s" media="print" '
                        'onload="this.media=\'all\';this.onload=null"/>'
                        '<noscript><link rel="stylesheet" href="%s"/></noscript>' % (url, url))
                src = src[:m.start()] + repl + src[m.end():]
            notes.append("made %d font stylesheet(s) non-blocking" % len(hits))

    changed = src != original
    if changed and not dry:
        shutil.copy2(path, path + ".bak")
        open(path, "w", encoding="utf-8").write(src)

    return changed, notes


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    dry = "--check" in sys.argv
    root = args[0] if args else "."

    print("NEXLYR page patcher v2 — %s" % ("DRY RUN" if dry else "writing changes"))
    print("Folder: %s\n" % os.path.abspath(root))

    touched = 0
    for p in PAGES:
        full = os.path.join(root, p)
        if not os.path.exists(full):
            print("  %-30s MISSING — skipped" % p)
            continue
        changed, notes = patch(full, dry)
        print("  %-30s %s" % (p, "CHANGED" if changed else "no change"))
        for n in notes:
            print("      - %s" % n)
        touched += 1 if changed else 0

    print("\n%d file(s) %s." % (touched, "would change" if dry else "updated"))
    if touched and not dry:
        print("Backups written alongside each file as *.bak")
    print("\nNext:")
    print("  1. fill GA4_ID and META_PIXEL_ID in assets/nexlyr-config.js")
    print("  2. replace REPLACE_WITH_SEARCH_CONSOLE_TOKEN in every page:")
    print("     grep -rl REPLACE_WITH_SEARCH_CONSOLE_TOKEN . | xargs sed -i 's/REPLACE_WITH_SEARCH_CONSOLE_TOKEN/your-token/g'")
    print("  3. delete the *.bak files once you have checked the site")


if __name__ == "__main__":
    main()
