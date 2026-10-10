# Uploading

Everything in this folder sits side by side, with no subfolders, so it survives GitHub's web uploader (which flattens folders). Upload all files to the repo root.


# Nexlyr — images to generate

Every image slot on the site already has a file name. Generate the image, save it with **exactly** that name (lowercase, `.webp`), drop it in the `` folder, push. It replaces the placeholder automatically. No code changes needed.

Tip: convert PNG/JPG to WebP at around 80% quality on squoosh.app. Keep each file under ~250 KB.

---

## 1. Paste this style block at the start of EVERY prompt

So all 20+ images look like one brand instead of twenty different ones:

> Cinematic photograph, dark moody environment in deep navy and near-black, a single cool cyan light (#18C8F0) as the key or rim light, subtle azure blue (#0C7FC4) reflections, shallow depth of field, soft film grain, premium tech-studio feel, clean composition with empty dark space on one side. No text, no letters, no logos, no watermarks, no brand names on screens.

---

## 2. The five big-word service cards — 16:9, 1920×1080

These sit behind the giant words (BUILD. AUTOMATE. CUT. BRAND. SCALE.), so keep the **left and middle of the frame dark and calm**. Put the subject on the right third.

| File | Prompt (after the style block) |
|---|---|
| `word-build.webp` | A developer's hands on a keyboard on the right side of the frame, a monitor glowing with abstract code-like light patterns (unreadable), the rest of the frame falling into deep navy darkness. |
| `word-automate.webp` | A phone standing upright on the right side, its screen emitting soft cyan light and a floating ring of small glowing chat-bubble shapes around it, dark empty space on the left. |
| `word-cut.webp` | A cinema camera on a small rig on the right side of the frame, a cyan LED light panel behind it, studio haze, the left side dark. |
| `word-brand.webp` | Brand stationery (cards, letterhead, a folded sign) arranged on the right on black stone, abstract geometric marks with no letters, a single cyan rim light, left side dark. |
| `word-scale.webp` | Translucent glowing cyan bar-chart columns rising on the right side like glass, reflections on a glossy black floor, the left side dark. |

## 3. Studio image (1) — square, 1200×1200

| File | Prompt (after the style block) |
|---|---|
| `studio.webp` | A calm, premium studio desk at night: a laptop, a monitor, a camera and a notebook, cyan LED strip behind the desk, shot straight on and centred. This sits inside the glowing "layers" frame, so keep the subject centred. |

## 4. Team (4 new photos) — 4:5 portrait, 1080×1350

The team frame is shaped like the logo, so the **bottom-right corner of the photo gets cut away**. Keep the face in the top-middle. Match the three photos you already have: same office, same "Innovation solves problems" poster, same black Nexlyr polo with blue stripes, same laptop and mug. Upload a real photo of the person to ChatGPT/Gemini **and** one of the existing team photos as the style reference.

| File | Prompt |
|---|---|
| `team-zamil.webp` | Use the first attached photo for the person's face and identity, and the second attached photo for the exact setting, lighting, framing and outfit. The person sits at the same office desk wearing the same black polo with blue stripes and the Nexlyr logo on the chest, laptop open, relaxed confident expression, looking at the camera. Keep the face identical to the reference. |
| `team-hammad.webp` | Same prompt as above, with Hammad's photo as the identity reference. |
| `team-rayyan.webp` | Same prompt as above, with Rayyan's photo as the identity reference. |
| `team-tech.webp` | Style block + "Ten people working at desks in the same office, seen from behind and the side, faces not visible, black polos with blue stripes, monitors glowing." Or a real group photo of the tech team. |

(Hashir, Raahym and Raza are already done from your existing photos.)

---

## 5. Work (9 cards) — done

Each card shows the client's own logo (taken from that site's repo) on its brand colour. The files are `logo-<project>.webp` (Hakuna Matata is `logo-hakuna-matata.svg`). To add a project, add a line to `WORK` in `index.html` and `WORKS` in `web-development.html` with its logo file and a brand colour.

---

## 6. Design & Ads page (2) — 4:3, 1600×1200

The drag-to-compare slider on the Design & Ads page. Use the same made-up logo in both so the comparison reads.

| File | Prompt (after the style block) |
|---|---|
| `design-before.webp` | A plain white presentation slide shown on a laptop screen in a dark room, a simple abstract geometric logo mark centred on the slide, nothing else on it. |
| `design-after.webp` | The same abstract geometric logo mark in the real world at night: on a lit shopfront sign, on a phone story frame held in a hand, and printed small on a till receipt, all in one composed shot. |

Already in your repo, nothing to make: the five social posts (`post1.jpg` to `post5.jpg`), the reels in ``, and the globe on the home page, which is drawn in code.

## 7. Optional

| File | Prompt |
|---|---|
| `og-home.jpg` (1200×630, in the root folder) | The link preview when someone shares the site on WhatsApp. Style block + "Five tall vertical glowing cyan-to-azure glass bars standing side by side in a dark void, the two on the right shorter than the other three, soft reflections on a glossy black floor." Then put the Nexlyr logo on it yourself in Canva. |


## 8. More reels

Drop up to three more vertical videos into `` named `reel-video-4.mp4`, `reel-video-5.mp4` and `reel-video-6.mp4`, each with a cover frame of the same name ending in `.webp`. They appear on the home page and the Video Editing page automatically. To rename them, change the titles in the `REELS` list near the top of the script on any page.
