# Clipxo — UI Style Guide ("Eclipse" dark theme)

A style spec for the Clipxo website, based on the dark space / eclipse landing page in the reference video. It copies the **visual language** (colours, glow, layout, motion), not the other brand's name, logo, text or artwork. All copy below is placeholder for Clipxo; replace it with your own.

---

## 1. The look in one paragraph

Near-black navy page. Every section is centred, has one idea, and is built around a single glowing round object (a ring, an orb, a crescent, a dotted globe). Colour comes only from electric blue and violet light; text is white or dimmed blue-grey. The only solid white element is the main button. Things fade in and drift up as you scroll.

## 2. Tech stack (and why)

| Piece | Choice | Why |
|---|---|---|
| Structure | Plain HTML (or your existing React/Next.js components) | The design is static sections; no framework is required for the look |
| Styling | CSS with custom properties (variables) | All glows are `radial-gradient` + `box-shadow`; variables keep the palette in one place |
| Scroll animation | `IntersectionObserver` (built into browsers) | Adds a class when a section enters the screen; ~10 lines, no library |
| Dotted globe | `<canvas>` (2D) | Hundreds of dots are cheaper on canvas than as HTML elements |
| Fonts | Google Fonts: Inter + Orbitron | Inter = clean body text; Orbitron = wide futuristic logo letters |

If the site is already in Tailwind, map the tokens in section 3 into `tailwind.config` under `theme.extend.colors`.

## 3. Design tokens

```css
:root {
  /* Backgrounds */
  --bg:            #03031a;   /* page: near-black navy, never pure #000 */
  --bg-raised:     #07072a;   /* cards */
  --bg-nav:        rgba(12, 12, 40, 0.6);

  /* Light / accent */
  --blue:          #2a2aff;   /* electric blue, main glow */
  --blue-deep:     #1010b8;   /* large soft background glows */
  --violet:        #7a4dff;   /* card bottom glow, highlights */
  --lilac:         #b9a8ff;   /* thin bright edges, ring highlight */

  /* Text */
  --text:          #ffffff;
  --text-dim:      #8a8fb8;   /* body copy, captions */
  --text-faint:    #4a4f7a;   /* labels, disabled */

  /* Lines */
  --border:        rgba(255, 255, 255, 0.08);

  /* Shape */
  --radius-card:   20px;
  --radius-pill:   999px;

  /* Layout */
  --max-width:     1120px;
  --section-gap:   160px;     /* vertical space between sections */

  /* Motion */
  --ease:          cubic-bezier(0.22, 1, 0.36, 1);
  --dur:           0.9s;
}
```

Contrast check: white on `--bg` and `--text-dim` on `--bg` both pass WCAG AA for body text. Do not use `--text-faint` for anything a user must read.

## 4. Typography

| Use | Font | Size (desktop / mobile) | Weight | Notes |
|---|---|---|---|---|
| Logo / hero wordmark | Orbitron | 64px / 32px | 700 | `letter-spacing: 1.2em`, uppercase |
| Section heading | Inter | 40px / 28px | 500 | centred, line-height 1.15 |
| Hero tagline | Inter | 18px / 15px | 500 | uppercase, `letter-spacing: 0.04em` |
| Body | Inter | 15px / 14px | 400 | `--text-dim`, max-width 420px, centred |
| Nav links / captions | Inter | 12px | 400 | `--text-dim` |
| Big numbers | Inter | 48px | 300 | white, with a 11px dim label under it |

Rules: headings are short (2–4 words). Body text is never more than 2–3 lines.

## 5. Background and glow recipes

**Page background**

```css
body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
}
```

**Soft section glow** (put behind the round object in each section)

```css
.glow {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 50% 40% at 50% 40%,
              rgba(42, 42, 255, 0.55), transparent 70%);
  filter: blur(40px);
}
```

**Eclipse ring** (hero signature element)

```css
.ring {
  width: 140vw; max-width: 1500px; aspect-ratio: 1;
  border-radius: 50%;
  position: absolute; left: 50%; top: 0;
  transform: translate(-50%, -62%);          /* only the bottom arc shows */
  border: 2px solid var(--lilac);
  box-shadow:
    0 0 20px 2px  var(--lilac),
    0 0 80px 10px var(--blue),
    inset 0 -60px 120px -20px var(--blue);   /* blue light inside the arc */
}
```

**Crescent** (a lit circle with a dark circle offset over it)

```css
.crescent { width: 180px; aspect-ratio: 1; border-radius: 50%;
  background: var(--bg);
  box-shadow: -14px 0 30px 2px var(--lilac), -40px 0 120px 20px var(--blue); }
```

**Glass orb**

```css
.orb { width: 320px; aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle at 35% 25%,
              rgba(122, 77, 255, 0.5), rgba(10, 10, 50, 0.2) 60%, transparent 75%);
  box-shadow: inset 0 0 40px rgba(185, 168, 255, 0.25); }
```

## 6. Components

### Floating nav bar

- Fixed at top, 16px from the edge, max-width `--max-width`, height 44px
- `background: var(--bg-nav); backdrop-filter: blur(12px); border: 1px solid var(--border); border-radius: var(--radius-pill);`
- Left: logo in Orbitron 14px. Centre: 4–5 links, 12px, `--text-dim`, white on hover. Right: "Login" text link + white pill button.

### Buttons

```css
.btn-primary {
  background: #fff; color: #05051f;
  font: 500 13px 'Inter'; padding: 10px 26px;
  border-radius: var(--radius-pill); border: 0;
  box-shadow: 0 0 24px rgba(185, 168, 255, 0.45);
  transition: transform .2s var(--ease), box-shadow .2s var(--ease);
}
.btn-primary:hover { transform: translateY(-1px);
  box-shadow: 0 0 36px rgba(185, 168, 255, 0.7); }
```

One primary button per screen. A tiny dim caption sits under or beside it (for example "Free to start, no card needed").

### Feature card (large)

```css
.card {
  position: relative; overflow: hidden;
  background: linear-gradient(180deg, var(--bg-raised) 40%, rgba(122, 77, 255, 0.55) 130%);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 48px;
}
/* faint perspective grid on the floor of the card */
.card::after {
  content: ""; position: absolute; left: -20%; right: -20%; bottom: 0; height: 45%;
  background:
    linear-gradient(rgba(185,168,255,.15) 1px, transparent 1px) 0 0 / 100% 28px,
    linear-gradient(90deg, rgba(185,168,255,.15) 1px, transparent 1px) 0 0 / 28px 100%;
  transform: perspective(400px) rotateX(60deg); transform-origin: bottom;
  mask-image: linear-gradient(transparent, #000);
}
```

Layout inside: left = 3-line stacked headline (36px, one word per line) + one dim sentence + primary button. Right = a product mockup that overlaps the top edge of the card.

### Mini tile (icon + label)

- 150 × 90px, `--bg-raised`, 1px `--border`, radius 12px
- 20px line icon in `--lilac` at 60% opacity, 11px dim label under it
- Used in a row of 4–5, centred, 12px gap

### Stat callout

- Number 48px weight 300 white, label 11px `--text-faint`
- A 1px line with a small glowing dot (8px, `--violet`, `box-shadow: 0 0 12px var(--violet)`) connects the number to the central visual

## 7. Page structure for Clipxo

Each section is `min-height: 90vh`, content centred, `--section-gap` between them.

| # | Section | Central visual | Heading (placeholder) | Supporting content |
|---|---|---|---|---|
| 1 | Hero | Eclipse ring, wordmark `C L I P X O` spread across the arc | "LONG VIDEOS. SHORT CLIPS." | Primary button + one-line caption |
| 2 | Product card | Large feature card with an app/editor mockup | "Paste. / Clip. / Post." | One sentence + button |
| 3 | Feature A | Glass orb with a light streak | "Finds the best moments" | Two small preview cards under it |
| 4 | Feature B | Crescent | "Ready for every platform" | Row of 5 mini tiles (Shorts, Reels, TikTok, captions, 9:16) |
| 5 | Stats | Dotted shape on canvas | "Built for volume" | Two stat callouts either side |
| 6 | Closing CTA | Mockup rising from the bottom over a violet floor glow | "Ready to clip your first video?" | Primary button |
| 7 | Footer | none | none | Small dim links, 12px, single row |

## 8. Motion

**Reveal on scroll** (apply `.reveal` to every heading, paragraph, card and visual)

```css
.reveal { opacity: 0; transform: translateY(24px);
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease); }
.reveal.in { opacity: 1; transform: none; }
```

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
```

Stagger children with `transition-delay: 0.1s, 0.2s, 0.3s…` (heading first, then text, then tiles left to right).

**Hero load sequence**

1. 0.0s: ring fades in from 0 to full glow over 1.2s
2. 0.4s: wordmark letters slide in from the sides one by one (0.08s apart), starting blurred (`filter: blur(8px)` → `0`)
3. 1.2s: tagline fades in
4. 1.5s: button and caption fade in

**Ambient:** the section glow slowly pulses (`opacity 0.7 ↔ 1`, 6s, infinite, ease-in-out). Nothing else loops.

**Accessibility**

```css
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  * { animation: none !important; }
}
```

## 9. Responsive

- Under 768px: nav links collapse into a menu icon; logo and primary button stay
- Wordmark letter-spacing drops from `1.2em` to `0.5em`
- Feature card stacks: text on top, mockup below, padding 28px
- Mini tiles become a horizontal scroll row
- Round visuals scale to 70% width; section min-height drops to 70vh

## 10. Do / Don't

**Do**
- Keep one glowing object per section
- Keep 60%+ of every screen empty dark space
- Use white only for text and the primary button

**Don't**
- Add a third accent colour (no green, orange or pink)
- Use pure black `#000` or pure grey; every dark tone carries blue
- Put a glow on every element; borders stay at 8% white
- Reuse the reference site's name, logo, wording or exact artwork
