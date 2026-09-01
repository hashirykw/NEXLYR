#!/usr/bin/env python3
"""
NEXLYR — page patcher
Wires config + analytics + lead capture into the existing pages without
touching anything else. Safe to re-run: every change is idempotent.

Usage:
    python3 patch_pages.py /path/to/your/site
    python3 patch_pages.py /path/to/your/site --check     (dry run)
"""

import sys, os, re, shutil, datetime

PAGES = [
    "index.html",
    "web-development.html",
    "business-software.html",
    "social-media-marketing.html",
    "video-editing.html",
]

MARKER = "nexlyr-config.js"

HEAD_BLOCK = """
<!-- ═══ Nexlyr: verification, tracking, lead capture ═══ -->
<meta name="google-site-verification" content="REPLACE_WITH_SEARCH_CONSOLE_TOKEN"/>
<script src="assets/nexlyr-config.js" defer></script>
<script src="assets/nexlyr-analytics.js" defer></script>
<script src="assets/nexlyr-leads.js" defer></script>
<!-- ═══ end Nexlyr ═══ -->
"""

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

FBOT_OLD = "<span>Built in-house"
FBOT_NEW = ('<span class="flegal"><a href="privacy.html">Privacy</a></span>'
            '\n<span>Built in-house')

FBOT_CSS = """
/* Nexlyr: footer legal links */
.fbot .flegal{display:flex;gap:18px;align-items:center}
.fbot .flegal a{color:var(--dim);transition:color .25s var(--ez)}
.fbot .flegal a:hover{color:var(--brand2)}
@media(max-width:640px){.fbot .flegal{order:3;width:100%;justify-content:center;padding-top:6px}}
"""


def patch(path, dry=False):
    name = os.path.basename(path)
    src = open(path, encoding="utf-8").read()
    original = src
    notes = []

    # ── 1. head block ────────────────────────────────────────────
    if MARKER in src:
        notes.append("head block already present — skipped")
    elif "</head>" in src:
        src = src.replace("</head>", HEAD_BLOCK + "</head>", 1)
        notes.append("added verification meta + 3 script tags")
    else:
        notes.append("!! no </head> found")

    # ── 2. form handler ──────────────────────────────────────────
    i = src.find(OLD_HANDLER_START)
    if i == -1:
        notes.append("no contact form on this page — nothing to rewire")
    elif "NexlyrLeads" in src:
        notes.append("form handler already patched — skipped")
    else:
        j = src.find(OLD_HANDLER_END, i)
        if j == -1:
            notes.append("!! form handler found but end marker missing — NOT patched")
        else:
            j += len(OLD_HANDLER_END)
            src = src[:i] + NEW_HANDLER + src[j:]
            notes.append("rewired form: Supabase -> WhatsApp -> thank-you")

    # ── 3. footer legal links ────────────────────────────────────
    if 'href="privacy.html"' in src:
        notes.append("footer legal links already present — skipped")
    elif FBOT_OLD in src:
        src = src.replace(FBOT_OLD, FBOT_NEW, 1)
        notes.append("added Privacy link to footer")
    else:
        notes.append("!! footer bottom bar not found — add links by hand")

    # ── 4. footer css ────────────────────────────────────────────
    if ".fbot .flegal" not in src and "</style>" in src:
        k = src.rfind("</style>")
        src = src[:k] + FBOT_CSS + src[k:]
        notes.append("added footer link styling")

    changed = src != original
    if changed and not dry:
        shutil.copy2(path, path + ".bak")
        open(path, "w", encoding="utf-8").write(src)

    return changed, notes


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    dry = "--check" in sys.argv
    root = args[0] if args else "."

    print("NEXLYR page patcher — %s" % ("DRY RUN" if dry else "writing changes"))
    print("Folder: %s\n" % os.path.abspath(root))

    touched = 0
    for p in PAGES:
        full = os.path.join(root, p)
        if not os.path.exists(full):
            print("  %-30s MISSING — skipped" % p)
            continue
        changed, notes = patch(full, dry)
        flag = "CHANGED" if changed else "no change"
        print("  %-30s %s" % (p, flag))
        for n in notes:
            print("      - %s" % n)
        touched += 1 if changed else 0

    print("\n%d file(s) %s." % (touched, "would change" if dry else "updated"))
    if touched and not dry:
        print("Backups written alongside each file as *.bak")
    print("\nNext: fill in your IDs in assets/nexlyr-config.js and the")
    print("google-site-verification token in each page's <head>.")


if __name__ == "__main__":
    main()
