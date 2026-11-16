# Clipxo — UI Style Guide ("Ember" theme)

Style spec for the Clipxo website: an AI tool that **cuts long videos into short clips and generates captions**. It follows the visual language of the reference video (black + orange glow, alternating dark and light sections, bento grids, floating pill nav) but every illustration is swapped for a clipping or caption motif. Do not reuse the reference brand's name, logo, text or artwork.

---

## 1. The look in one paragraph

A warm-black page lit by orange "ember" light. Sections alternate between **dark** (black with orange glow) and **light** (warm off-white with soft cards), and each section slides over the previous one with large rounded top corners. Headings are centred, medium weight, two lines at most, with a small pill label above. One orange button per screen. Illustrations are thin grey line art with a few glowing orange accents.

## 2. Tech stack (and why)

| Piece | Choice | What it is / why |
|---|---|---|
| Structure | HTML or your existing React/Next.js | Static marketing sections; no special framework needed for the look |
| Styling | CSS custom properties (or Tailwind theme tokens) | One place for the palette; glows are `radial-gradient` + `box-shadow` |
| Line illustrations | Inline SVG | Sharp at any size; lines can be animated with `stroke-dashoffset` |
| Scroll reveals | `IntersectionObserver` | Built into browsers; adds a class when a section enters view |
| Sticky section stacking | `position: sticky` | Makes each section slide over the last one, no JS |
| Dotted dome | `<canvas>` 2D | Hundreds of dots draw faster on canvas than as DOM nodes |
| Font | Plus Jakarta Sans (Google Fonts) | Rounded geometric sans close to the reference; Inter as fallback |

## 3. Design tokens

```css
:root {
  /* Dark surfaces */
  --bg:           #0a0a0b;   /* page, warm black */
  --bg-card:      #131314;   /* bento cards, pricing cards */
  --bg-card-2:    #1a1a1c;   /* hover / nested panels */
  --line:         rgba(255, 255, 255, 0.07);

  /* Light surfaces */
  --light:        #f7f6f2;   /* light sections, warm off-white */
  --light-card:   #ffffff;
  --light-line:   rgba(0, 0, 0, 0.07);

  /* Ember accent */
  --orange:       #ff5a1f;   /* buttons, active states */
  --orange-hot:   #ff8a3d;   /* glow core, streaks */
  --orange-deep:  #7a2408;   /* outer glow falloff */

  /* Text */
  --text:         #ffffff;
  --text-dim:     #8b8b90;
  --ink:          #0e0e10;   /* text on light sections */
  --ink-dim:      #6b6b70;

  /* Shape */
  --r-section:    32px;      /* top corners of stacked sections */
  --r-card:       20px;
  --r-pill:       999px;

  /* Layout */
  --max:          1160px;
  --pad-section:  140px;

  /* Motion */
  --ease:         cubic-bezier(0.22, 1, 0.36, 1);
}
```

Use `--orange` for buttons only with white text at 13px+ medium weight, and never put `--text-dim` on `--bg-card-2` for anything essential.

## 4. Typography

| Use | Size (desktop / mobile) | Weight | Notes |
|---|---|---|---|
| Hero heading | 56px / 34px | 500 | `letter-spacing: -0.02em`, centred |
| Section heading | 40px / 28px | 500 | max 2 lines, centred |
| Card title | 15px | 600 | top-left of card |
| Body | 15px / 14px | 400 | dim colour, max-width 460px |
| Pill label | 11px | 500 | small icon + text, sits 20px above heading |
| Price | 32px | 600 | small "/month" in dim text beside it |
| Nav | 13px | 500 | |

**Heading reveal:** words fade from grey to white one at a time, left to right (60ms apart).

## 5. Signature effects

**Ember edge glow** (orange light leaking from the bottom of dark sections)

```css
.ember-bottom::after {
  content: ""; position: absolute; left: 5%; right: 5%; bottom: -40px; height: 220px;
  background: radial-gradient(ellipse 60% 100% at 50% 100%,
              var(--orange-hot), var(--orange) 30%, var(--orange-deep) 60%, transparent 80%);
  filter: blur(30px); pointer-events: none;
}
```

**Light streak** (diagonal comet in the hero's top-right corner)

```css
.streak {
  position: absolute; top: -10%; right: -5%; width: 520px; height: 90px;
  background: linear-gradient(90deg, transparent, var(--orange) 60%, #ffd2a8);
  filter: blur(22px); transform: rotate(-28deg); opacity: .8;
}
```

**Faint grid** (behind dark hero and light sections)

```css
.grid-bg {
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
}
```

**Stacked sections**

```css
section { position: sticky; top: 0; min-height: 100vh;
  border-radius: var(--r-section) var(--r-section) 0 0; overflow: hidden; }
section.dark  { background: var(--bg);    color: var(--text); }
section.light { background: var(--light); color: var(--ink); }
```

## 6. Components

### Announcement bar + nav
- Top strip, 32px, 12px dim text: a small orange dot + one-line offer + arrow
- On load: full-width nav (logo left, links centre, "Contact" ghost button + orange "Start free" right)
- After scrolling 80px it shrinks into a **floating centred pill**: `background: #1a1a1c; border: 1px solid var(--line); border-radius: var(--r-pill); padding: 6px;` with a round orange logo badge on the left and a white pill button on the right

### Buttons
| Type | Style |
|---|---|
| Primary | `--orange` fill, white text, pill, `box-shadow: 0 0 24px rgba(255,90,31,.45)` |
| Nav CTA (in pill nav) | white fill, black text, pill |
| Ghost | transparent, 1px `--line`, white text |
| Card action | `--bg-card-2` fill, full width, 12px radius; the featured card's is orange |

### Pill label
`display: inline-flex; gap: 6px; padding: 5px 12px; border-radius: 999px; background: var(--bg-card); border: 1px solid var(--line); font-size: 11px;` with a 12px orange icon.

### Bento card (dark)
- `--bg-card`, 1px `--line`, radius `--r-card`, padding 24px
- Title top-left (15px/600), 2-line dim description under it
- Bottom 60% is a small illustration: grey line art, one element glowing orange
- Hover: border goes to `rgba(255,90,31,.35)`, illustration's orange part brightens

### Light card
- White, 1px `--light-line`, radius `--r-card`, `box-shadow: 0 20px 60px rgba(0,0,0,.06)`
- Pastel 28px icon squares (soft green, yellow, blue, pink) for list items

### Pricing card
- `--bg-card`, radius `--r-card`, tiny plan label on top, price, 4 spec rows with 14px line icons, action button at the bottom
- Middle card is featured: orange button + a 1px orange left-edge glow line

### FAQ accordion
- Full-width rows on `--bg-card`, radius 14px, 8px gap, chevron on the left
- Open row shows dim 13px answer; only one row open at a time

## 7. Page structure with Clipxo motifs

Every globe, chip and map in the reference is replaced so the page clearly says "video clipping + captions".

| # | Theme | Section | Reference had | Clipxo version |
|---|---|---|---|---|
| 1 | Dark | Hero | AI chip wired to app icons | **Clip engine diagram:** centre node is a rounded square with a play/scissors mark. A wide 16:9 "long video" node feeds in from the left; lines run out to 9:16 clip nodes on the right and bottom (Shorts, Reels, TikTok style frames, shown as generic phone frames). Orange pulses travel along the lines. |
| 2 | Light | What it does | Tall orange image + text + logo marquee | Tall dark card with an orange streak and a 9:16 clip preview showing **live captions**, one word highlighted orange. Text card beside it. Marquee of feature chips: "Auto clips", "Captions", "9:16 reframe", "Hook detection", "Emoji", "Translations". |
| 3 | Dark | Features bento (6 cards) | Privacy, storage, models, autoscaling, GPUs | See bento list below. |
| 4 | Dark | Signature visual | Dotted globe with orange halo | **Caption dome:** the same half-circle with an orange rim glow rising from the bottom, but the dots form an **audio waveform**: vertical dot columns of varying height across the dome, slowly animating like a voice. Above the rim, 3 floating caption chips with one orange word each. Heading: "Every word, captioned." |
| 5 | Light | Try it | AI playground card with prompt box | **Clip playground:** white card, soft arch at the top with an orange play badge. Four option tiles (Auto clips, Captions, Reframe 9:16, Translate). At the bottom an input: "Paste a YouTube link…" with a round arrow button. |
| 6 | Light | Who it's for | 6 industry cards with map pins | 6 use-case cards with tiny line illustrations: Podcasters (mic + waveform), Streamers (timeline with markers), Educators (slide + caption bar), Agencies (stack of clip frames), Coaches (talking-head frame), Editors (scissors on a track). Each has 3 bullet points. |
| 7 | Dark | Pricing | 3 GPU plans | 3 plans (Free / Creator / Pro). Spec rows: minutes of video per month, clips per video, caption languages, export quality. |
| 8 | Dark | FAQ | Accordion | Same accordion: "How does Clipxo pick moments?", "Which languages do captions support?", "Can I edit captions?", "Is there a watermark?" |
| 9 | Dark | CTA | Text over an orange-to-white horizon glow | Same horizon glow at the bottom of a rounded panel. Heading: "Turn your next video into ten clips." White pill button. |
| 10 | Dark | Footer | Columns + newsletter | Logo + one line, 3 link columns, email field with round arrow button, legal row. |

### Bento cards for section 3

Grid: 3 columns on top (wide, narrow, narrow), 2 on the bottom (wide, wide).

1. **AI moment detection** — a long timeline bar with three segments lit orange
2. **Auto captions** — a caption line where words light up one by one
3. **Smart reframe** — a 16:9 frame with a 9:16 crop box tracking a face dot
4. **Caption styles** — 3 stacked caption chips in different styles, the top one orange
5. **One-click export** — an orange rounded download/share tile with a glow under it, beside a small list of formats (9:16, 1:1, 16:9)

## 8. Motion

| Element | Animation |
|---|---|
| Page load | Black screen, logo mark fades in centre (0.6s), then the hero reveals |
| Headings | Word-by-word grey → white |
| Hero diagram | Lines draw in (`stroke-dashoffset`), then an orange pulse loops along each line every 3s |
| Sections | Slide up over the previous one (sticky stacking); content fades up 24px |
| Bento cards | Fade up with 80ms stagger |
| Caption dome | Rises from below as you scroll; waveform dots animate slowly; rim glow pulses 6s |
| Feature chip marquee | Continuous horizontal scroll, 40s loop, pauses on hover |
| Caption demos | Highlighted word advances every 350ms |

```css
.reveal { opacity: 0; transform: translateY(24px);
  transition: opacity .8s var(--ease), transform .8s var(--ease); }
.reveal.in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  * { animation: none !important; }
  section { position: relative; }
}
```

```js
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
```

## 9. Responsive

- Under 900px: bento becomes 1 column; use-case grid 2 columns, then 1 under 560px
- Pill nav keeps logo badge + CTA; links move into a menu
- Hero diagram: hide the outer nodes, keep centre node + 2 clip frames
- Pricing cards stack, featured card first
- Turn off sticky stacking on mobile (`position: relative`) so tall sections scroll normally
- `--pad-section` drops to 80px; `--r-section` to 24px

## 10. Do / Don't

**Do**
- Alternate dark and light sections; never two light sections with different card styles back to back
- Keep orange for light and action only (glow, button, one highlighted word)
- Show the product in every visual: a timeline, a 9:16 frame, or a caption

**Don't**
- Use globes, chips, maps or server imagery; they say "cloud hosting", not "clipping tool"
- Add a second accent colour; pastel icon squares appear only on light cards
- Use real platform logos without permission; generic phone frames are enough
- Copy the reference site's wording, logo or images
