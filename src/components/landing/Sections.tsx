import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, AudioLines, Captions, Check, ChevronRight, Download, Film, Gamepad2,
  CircleHelp, Languages, LayoutGrid, Menu, Mic, Play, ScanSearch, Scissors, SplitSquareVertical, Tag, Upload, Users, X,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useSite } from "../../lib/site";
import { usePackages } from "../../lib/packages";
import { cx, durationLabel, pkr } from "../../lib/format";
import type { Package } from "../../lib/types";
import { BrandMark, MARK_PATH } from "../BrandMark";
import { Logo } from "../common";

const NAV = [
  ["Features", "#features"],
  ["How it works", "#how-it-works"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
] as const;

const btnBase = "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors";
export const orangeBtn = (extra = "") => cx(btnBase, "btn-ember h-11 bg-orange px-6 text-[14px] text-white hover:bg-[#ff6e3a]", extra);
export const ghostBtn = (extra = "") => cx(btnBase, "h-11 border border-line-strong px-6 text-[14px] text-ink hover:bg-white/[0.05]", extra);
const whiteBtn = (extra = "") => cx(btnBase, "h-10 bg-white px-5 text-[13px] text-night hover:bg-white/90", extra);
const delay = (s: number): CSSProperties => ({ transitionDelay: `${s}s` });
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
type IconType = React.ComponentType<{ className?: string }>;

/* ------------------------------------------------------------------ hooks */

/** Fade + rise .reveal elements as they enter the viewport (once). */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) return void els.forEach((el) => el.classList.add("in"));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }), { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Sticky stacking that still lets tall sections scroll: each sticks once its bottom reaches the viewport bottom. */
export function useStack() {
  useEffect(() => {
    // only sticky sections get an offset; on mobile they are position: relative and top would shift them
    const set = () => document.querySelectorAll<HTMLElement>(".stack").forEach((el) => {
      el.style.top = getComputedStyle(el).position === "sticky" ? `${Math.min(0, window.innerHeight - el.offsetHeight)}px` : "";
    });
    set();
    const ro = new ResizeObserver(set);
    document.querySelectorAll(".stack").forEach((el) => ro.observe(el));
    window.addEventListener("resize", set);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
    };
  }, []);
}

/** Index of the highlighted word, advancing every 350 ms (static under reduced motion). */
function useTicker(count: number, ms = 350) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), ms);
    return () => clearInterval(t);
  }, [count, ms]);
  return i;
}

/* ------------------------------------------------------------------ shared bits */

function PillLabel({ icon: Icon, children, light }: { icon?: IconType; children: ReactNode; light?: boolean }) {
  return (
    <span className={cx("pill-label", light ? "border-light-line bg-light-card text-light-ink" : "border-line bg-canvas text-ink-2")}>
      {Icon && <Icon className="size-3 text-orange" />} {children}
    </span>
  );
}

/** Centred heading whose words turn from grey to full colour one by one when it scrolls in. */
export function Heading({ label, title, children, light, icon, as: Tag = "h2", size = "section" }: {
  label?: string; title: string; children?: ReactNode; light?: boolean; icon?: IconType; as?: "h1" | "h2"; size?: "hero" | "section";
}) {
  const words = title.split(" ");
  const style = { "--word-from": light ? "#c4c3bf" : "#55555b", "--word-to": light ? "#0e0e10" : "#ffffff" } as CSSProperties;
  return (
    <div className="reveal mx-auto max-w-[720px] text-center" style={style}>
      {label && <div className="mb-5"><PillLabel icon={icon} light={light}>{label}</PillLabel></div>}
      <Tag className={cx("h-display leading-[1.1]", size === "hero" ? "text-[34px] sm:text-[56px]" : "text-[28px] sm:text-[40px]")} aria-label={title}>
        {words.map((w, i) => (
          <span key={i} aria-hidden>
            <span className="word" style={{ animationDelay: `${0.15 + i * 0.06}s` }}>{w}</span>{i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </Tag>
      {children && <p className={cx("mx-auto mt-5 max-w-[460px] text-[15px] leading-relaxed", light ? "text-light-dim" : "text-muted")}>{children}</p>}
    </div>
  );
}

function Section({ id, tone, z, children, className, ember }: { id?: string; tone: "dark" | "light"; z: number; children: ReactNode; className?: string; ember?: boolean }) {
  return (
    <section id={id} style={{ zIndex: z }}
      className={cx("stack overflow-hidden shadow-[0_-24px_60px_rgb(0_0_0/0.35)]",
        tone === "dark" ? "bg-paper text-ink" : "bg-light text-light-ink", ember && "ember-bottom", className)}>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ intro + nav */

export function Intro() {
  const [show, setShow] = useState(() => {
    try {
      if (sessionStorage.getItem("clipxo.intro")) return false;
      sessionStorage.setItem("clipxo.intro", "1");
    } catch { /* storage blocked: show it */ }
    return true;
  });
  // the CSS fades it out; this removes it even if animations are paused or blocked
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 1600);
    return () => clearTimeout(t);
  }, [show]);
  if (!show) return null;
  return <div className="intro" aria-hidden><BrandMark className="size-14 text-white" /></div>;
}

export function Navbar() {
  const { session } = useAuth();
  const { site } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 80);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const cta = session ? { to: "/dashboard", label: "Dashboard" } : null;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={cx("overflow-hidden border-b border-line bg-paper text-center text-[12px] text-muted transition-all duration-300", scrolled ? "h-0 border-transparent" : "h-8")}>
        <a href="/#pricing" className="inline-flex h-8 items-center gap-2 px-4 hover:text-ink">
          <span className="size-1.5 shrink-0 rounded-full bg-orange shadow-[0_0_8px_var(--color-orange)]" />
          <span className="truncate">{site.announcement.trim() || "Plans from Rs. 2,099 · Urdu, Hindi and English captions"}</span>
          <ArrowRight className="size-3 shrink-0" />
        </a>
      </div>

      <div className={cx("mx-auto transition-all duration-500", scrolled ? "mt-3 max-w-[660px] px-4" : "max-w-[1160px] px-5 sm:px-8")}>
        <div className={cx("flex items-center gap-6 transition-all duration-500",
          scrolled ? "h-12 rounded-full border border-line bg-sand/95 px-1.5 backdrop-blur" : "h-16 bg-paper/0")}>
          {scrolled ? (
            <a href="/#top" className="grid size-9 shrink-0 place-items-center rounded-full bg-orange" aria-label={site.product_name}>
              <BrandMark className="size-5 text-white" />
            </a>
          ) : <Logo />}
          <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
            {NAV.map(([label, href]) => <a key={href} href={`/${href}`} className="text-[13px] font-medium text-muted transition-colors hover:text-ink">{label}</a>)}
            <Link to="/about" className="text-[13px] font-medium text-muted transition-colors hover:text-ink">About</Link>
          </nav>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            {cta ? (
              <Link to={cta.to} className={scrolled ? whiteBtn() : orangeBtn("h-10 px-5 text-[13px]")}>{cta.label}</Link>
            ) : scrolled ? (
              <a href="/#pricing" className={whiteBtn()}>Get started</a>
            ) : (
              <>
                <Link to="/login" className={ghostBtn("h-10 px-5 text-[13px]")}>Log in</Link>
                <a href="/#pricing" className={orangeBtn("h-10 px-5 text-[13px]")}>Get started</a>
              </>
            )}
          </div>
          <button className="ml-auto rounded-full p-2 text-ink-2 hover:bg-white/5 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open && (
          <div className="animate-fade-up mt-2 rounded-2xl border border-line bg-sand p-3 md:hidden">
            {NAV.map(([label, href]) => (
              <a key={href} href={`/${href}`} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-[15px] text-ink-2 hover:bg-white/5">{label}</a>
            ))}
            <Link to="/about" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-[15px] text-ink-2 hover:bg-white/5">About</Link>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
              {cta ? <Link to={cta.to} className={orangeBtn("col-span-2")}>{cta.label}</Link> : (
                <>
                  <Link to="/login" className={ghostBtn()}>Log in</Link>
                  <a href="/#pricing" onClick={() => setOpen(false)} className={orangeBtn()}>Get started</a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ 1. hero */

/** Long 16:9 video -> ClipXo -> 9:16 shorts, with orange pulses running along the wires. */
function ClipEngine() {
  const [pulses] = useState(() => !reducedMotion());
  const wires = [
    { id: "w-in", d: "M262 210 C330 210 370 210 436 210" },
    { id: "w-1", d: "M564 200 C650 200 660 92 740 92" },
    { id: "w-2", d: "M564 210 C650 210 760 210 830 210" },
    { id: "w-3", d: "M564 220 C650 220 660 328 740 328" },
  ];
  const phone = (x: number, y: number, hot: number, key: string, cls = "") => (
    <g key={key} transform={`translate(${x} ${y})`} className={cls}>
      <rect width="74" height="132" rx="12" fill="#131314" stroke="rgb(255 255 255 / 0.14)" />
      <rect x="8" y="10" width="58" height="80" rx="6" fill="#1d1d20" />
      <circle cx="37" cy="44" r="11" fill="#2a2a2e" />
      <rect x="22" y="60" width="30" height="30" rx="15" fill="#2a2a2e" />
      {[0, 1, 2].map((i) => <rect key={i} x={12 + i * 18} y="100" width="14" height="6" rx="3" fill={i === hot ? "#ff5a1f" : "#3a3a3f"} />)}
      <rect x="20" y="114" width="34" height="5" rx="2.5" fill="#2a2a2e" />
    </g>
  );
  return (
    <svg viewBox="0 0 910 420" className="mx-auto w-full max-w-[900px]" aria-hidden>
      <defs>
        <radialGradient id="core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
        </radialGradient>
      </defs>
      {wires.map((w, i) => (
        <path key={w.id} id={w.id} d={w.d} pathLength={1} fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="1.5" className="draw" style={{ animationDelay: `${0.3 + i * 0.15}s` }} />
      ))}
      {pulses && wires.map((w, i) => (
        <circle key={`p-${w.id}`} r="4" fill="#ff8a3d" opacity="0">
          <animate attributeName="opacity" values="0;1;1;0" dur="3s" begin={`${1.6 + i * 0.4}s`} repeatCount="indefinite" />
          <animateMotion dur="3s" begin={`${1.6 + i * 0.4}s`} repeatCount="indefinite"><mpath href={`#${w.id}`} /></animateMotion>
        </circle>
      ))}

      <g transform="translate(40 146)">
        <rect width="222" height="128" rx="12" fill="#131314" stroke="rgb(255 255 255 / 0.14)" />
        <rect x="10" y="10" width="202" height="86" rx="6" fill="#1d1d20" />
        <circle cx="111" cy="53" r="16" fill="#2a2a2e" />
        <path d="M106 45 L120 53 L106 61 Z" fill="#8b8b90" />
        <rect x="10" y="108" width="202" height="6" rx="3" fill="#2a2a2e" />
        <rect x="10" y="108" width="74" height="6" rx="3" fill="#55555b" />
        <text x="2" y="-12" fontSize="13" fill="#8b8b90">1:12:40 podcast</text>
      </g>

      <circle cx="500" cy="210" r="110" fill="url(#core)" />
      <g transform="translate(436 146)">
        <rect width="128" height="128" rx="30" fill="#161617" stroke="rgb(255 90 31 / 0.6)" strokeWidth="1.5" />
        <g transform="translate(34 34) scale(0.6)"><path d={MARK_PATH} fill="#ff5a1f" fillRule="evenodd" /></g>
      </g>

      {phone(740, 26, 1, "a")}
      {phone(830, 144, 2, "b")}
      {phone(740, 262, 0, "c")}
    </svg>
  );
}

export function Hero() {
  return (
    <Section id="top" tone="dark" z={1} ember className="!rounded-none">
      <div className="grid-bg absolute inset-0" />
      <div className="streak" />
      <div className="container-x relative pb-24 pt-36 sm:pb-32 sm:pt-44">
        <Heading as="h1" size="hero" label="AI clipping for Urdu, Hindi and English" icon={Scissors} title="Turn long videos into viral shorts.">
          ClipXo finds the most engaging moments in your long-form videos and turns them into captioned, ready-to-publish short clips.
        </Heading>
        <div className="reveal mt-9 flex flex-col justify-center gap-3 sm:flex-row" style={delay(0.2)}>
          <a href="#pricing" className={orangeBtn()}>Get started <ArrowRight className="size-4" /></a>
          <a href="#how-it-works" className={ghostBtn()}>See how it works</a>
        </div>
        <div className="reveal mt-14" style={delay(0.3)}><ClipEngine /></div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ 2. what it does (light) */

const DEMO_WORDS = ["Yeh", "moment", "sab", "se", "zabardast", "tha"];

function CaptionPhone() {
  const i = useTicker(DEMO_WORDS.length);
  return (
    <div className="relative mx-auto aspect-[9/16] w-[210px] overflow-hidden rounded-[22px] border border-white/10 bg-[#161617]">
      <div className="absolute inset-x-0 top-0 h-1/2 bg-[#221c18]">
        <div className="absolute bottom-0 left-1/2 h-[60%] w-[46%] -translate-x-1/2 rounded-t-full bg-[#3b2e25]" />
        <div className="absolute left-1/2 top-[20%] size-[26%] -translate-x-1/2 rounded-full bg-[#5a4636]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 border-t border-black/50 bg-[#1b1d20]">
        <div className="absolute bottom-0 left-1/2 h-[56%] w-[44%] -translate-x-1/2 rounded-t-full bg-[#2c3036]" />
        <div className="absolute left-1/2 top-[18%] size-[24%] -translate-x-1/2 rounded-full bg-[#40454c]" />
      </div>
      <p className="absolute inset-x-3 top-[45%] text-center text-[15px] font-extrabold leading-tight text-white [text-shadow:0_2px_0_#000,0_0_4px_#000]">
        {DEMO_WORDS.map((w, k) => <span key={k} className={k === i ? "text-orange" : ""}>{w}{k < DEMO_WORDS.length - 1 ? " " : ""}</span>)}
      </p>
      <div className="absolute bottom-3 left-3 right-3 h-1 rounded-full bg-white/15"><div className="h-full w-2/5 rounded-full bg-white/70" /></div>
    </div>
  );
}

const CHIPS = ["Auto clips", "Word-by-word captions", "Roman Urdu", "Hindi", "English", "9:16 reframe", "Face tracking", "Podcast split", "Gaming layout", "Caption editor", "Timeline editing", "GPU export"];
const PASTEL = ["bg-[#e3f4e8] text-[#2f7a46]", "bg-[#fbf1d6] text-[#8a6410]", "bg-[#e1ecfb] text-[#2f5d9c]", "bg-[#fbe4ea] text-[#a3384f]"];

export function WhatItDoes() {
  const steps = [
    { icon: Upload, title: "Open a long video", body: "Podcast, interview, stream or vlog." },
    { icon: ScanSearch, title: "ClipXo picks the moments", body: "Speech is transcribed and every moment scored." },
    { icon: Download, title: "Export your shorts", body: "Captioned 9:16 clips, ready to post." },
  ];
  return (
    <Section id="how-it-works" tone="light" z={2}>
      <div className="grid-bg absolute inset-0" style={{ "--grid-line": "rgb(0 0 0 / 0.05)" } as CSSProperties} />
      <div className="container-x relative py-20 sm:py-[140px]">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="reveal relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-[20px] bg-night p-10">
            <div className="streak" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_60%_80%_at_50%_100%,rgb(255_90_31/0.35),transparent_70%)]" />
            <CaptionPhone />
          </div>
          <div className="reveal flex flex-col justify-center rounded-[20px] border border-light-line bg-light-card p-8 shadow-[0_20px_60px_rgb(0_0_0/0.06)] sm:p-12" style={delay(0.1)}>
            <div><PillLabel light icon={Film}>What it does</PillLabel></div>
            <h2 className="h-display mt-5 text-[28px] leading-[1.1] sm:text-[40px]">Long video in.<br />Shorts out.</h2>
            <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-light-dim">
              ClipXo reads the whole conversation, suggests the clips most likely to hold attention, and captions them word by word in the language your audience speaks.
            </p>
            <ul className="mt-8 space-y-4">
              {steps.map(({ icon: Icon, title, body }, k) => (
                <li key={title} className="flex gap-4">
                  <span className={cx("grid size-7 shrink-0 place-items-center rounded-lg", PASTEL[k])}><Icon className="size-3.5" /></span>
                  <div><p className="text-[14.5px] font-semibold">{title}</p><p className="text-[13.5px] text-light-dim">{body}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="marquee-wrap relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="marquee">
            {[...CHIPS, ...CHIPS].map((c, k) => (
              <span key={k} className="mr-3 inline-flex items-center gap-2 rounded-full border border-light-line bg-light-card px-4 py-2 text-[13px] font-medium" aria-hidden={k >= CHIPS.length}>
                <span className="size-1.5 rounded-full bg-orange" />{c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ 3. features bento */

function Bento({ title, body, children, className, i }: { title: string; body: string; children: ReactNode; className?: string; i: number }) {
  return (
    <div className={cx("reveal group flex min-h-[300px] flex-col rounded-[20px] border border-line bg-canvas p-6 transition-colors hover:border-orange/35", className)} style={delay(i * 0.08)}>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-[340px] text-[13.5px] leading-relaxed text-muted">{body}</p>
      <div className="mt-auto flex flex-1 items-end justify-center pt-6 [&_.hot]:transition-[filter] group-hover:[&_.hot]:brightness-125">{children}</div>
    </div>
  );
}

function CaptionLine() {
  const words = ["Bilkul", "sahi", "baat", "hai", "yaar"];
  const i = useTicker(words.length);
  return (
    <div className="flex flex-wrap justify-center gap-1.5 rounded-xl border border-line bg-sand px-4 py-3 text-[17px] font-bold">
      {words.map((w, k) => <span key={k} className={k === i ? "hot text-orange [text-shadow:0_0_14px_rgb(255_90_31/0.6)]" : "text-ink-2"}>{w}</span>)}
    </div>
  );
}

export function FeaturesBento() {
  const glow = { filter: "drop-shadow(0 0 8px rgb(255 90 31 / 0.6))" };
  return (
    <Section id="features" tone="dark" z={3}>
      <div className="container-x relative py-20 sm:py-[140px]">
        <Heading label="Features" icon={LayoutGrid} title="Everything between a long video and a finished short." />
        <div className="mt-14 grid gap-4 lg:grid-cols-4">
          <Bento i={0} className="lg:col-span-2" title="AI moment detection" body="Every moment is scored, so the strongest parts of a two-hour video rise to the top.">
            <svg viewBox="0 0 420 80" className="w-full" aria-hidden>
              <rect x="0" y="30" width="420" height="20" rx="10" fill="#1d1d20" stroke="rgb(255 255 255 / 0.08)" />
              {[[30, 46], [170, 62], [318, 40]].map(([x, w]) => <rect key={x} className="hot" x={x} y="30" width={w} height="20" rx="10" fill="#ff5a1f" style={glow} />)}
              {Array.from({ length: 22 }, (_, k) => <rect key={k} x={8 + k * 19} y="62" width="1" height="6" fill="rgb(255 255 255 / 0.18)" />)}
              <text x="30" y="20" fontSize="11" fill="#8b8b90">12:04</text><text x="170" y="20" fontSize="11" fill="#8b8b90">27:41</text><text x="318" y="20" fontSize="11" fill="#8b8b90">55:02</text>
            </svg>
          </Bento>
          <Bento i={1} title="Auto captions" body="Word-by-word karaoke captions in Roman Urdu, Hindi or English.">
            <CaptionLine />
          </Bento>
          <Bento i={2} title="Smart reframe" body="A face-aware 9:16 crop that follows the speaker.">
            <svg viewBox="0 0 200 120" className="w-full max-w-[220px]" aria-hidden>
              <rect x="1" y="1" width="198" height="112" rx="10" fill="#1d1d20" stroke="rgb(255 255 255 / 0.12)" />
              <circle cx="122" cy="48" r="13" fill="#3a3a3f" /><rect x="104" y="64" width="36" height="40" rx="18" fill="#3a3a3f" />
              <rect className="hot" x="90" y="6" width="62" height="102" rx="6" fill="none" stroke="#ff5a1f" strokeWidth="2" style={glow} />
              <circle cx="122" cy="48" r="3" fill="#ff8a3d" />
            </svg>
          </Bento>
          <Bento i={3} className="lg:col-span-2" title="Caption styles" body="Font, size, colours, outline and position, previewed live on the clip.">
            <div className="w-full max-w-[340px] space-y-2.5">
              <div className="hot rounded-lg bg-orange px-4 py-2.5 text-center text-[15px] font-extrabold text-white shadow-[0_0_24px_rgb(255_90_31/0.45)]">HOOK SE SHURU KARO</div>
              <div className="rounded-lg border border-line bg-sand px-4 py-2.5 text-center text-[15px] font-bold text-ink [text-shadow:0_2px_0_#000]">Hook se shuru karo</div>
              <div className="rounded-lg border border-line bg-sand px-4 py-2.5 text-center text-[14px] font-medium italic text-ink-2">hook se shuru karo</div>
            </div>
          </Bento>
          <Bento i={4} className="lg:col-span-2" title="One-click export" body="Pick the clips you want and export them together, hardware-accelerated where your GPU allows.">
            <div className="flex w-full max-w-[360px] items-center gap-6">
              <div className="hot grid size-20 shrink-0 place-items-center rounded-2xl bg-orange shadow-[0_18px_40px_-8px_rgb(255_90_31/0.7)]"><Download className="size-8 text-white" /></div>
              <ul className="space-y-2 text-[13.5px] text-ink-2">
                {["9:16 vertical", "1080 × 1920", "MP4 (H.264)"].map((f) => <li key={f} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-orange" />{f}</li>)}
              </ul>
            </div>
          </Bento>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ 4. caption dome */

/** Half-dome of dots arranged as a voice waveform, gently moving while on screen. */
function WaveDome() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const still = reducedMotion();
    let raf = 0, visible = false, last = 0;
    const draw = (t: number) => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w / 2, h) * 0.98, cx = w / 2, cols = 64, gap = 9;
      const phase = t / 900;
      for (let c = 0; c < cols; c++) {
        const x = -1 + (2 * (c + 0.5)) / cols;
        const domeH = Math.sqrt(Math.max(0, 1 - x * x)) * R;
        const amp = 0.35 + 0.65 * Math.abs(Math.sin(c * 0.45 + phase) * Math.cos(c * 0.13 - phase * 0.7));
        const px = cx + x * R;
        for (let y = 0; y < domeH * amp; y += gap) {
          const k = y / Math.max(1, domeH);
          ctx.fillStyle = `rgba(255,${Math.round(90 + 60 * k)},${Math.round(30 + 60 * k)},${(0.85 - 0.6 * k).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(px, h - y - 4, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    const loop = (t: number) => {
      if (t - last > 50) {
        draw(t);
        last = t;
      }
      if (visible) raf = requestAnimationFrame(loop);
    };
    draw(0);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !still;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => draw(last));
    ro.observe(canvas);
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  return <canvas ref={ref} className="h-[240px] w-full sm:h-[360px]" aria-hidden />;
}

export function CaptionDome() {
  const chips: [string, string, string][] = [["Yeh moment", "zabardast", "tha"], ["This is the", "best", "part"], ["Bilkul sahi", "baat", "hai"]];
  return (
    <Section tone="dark" z={4}>
      <div className="container-x relative pt-20 sm:pt-[140px]">
        <Heading label="Captions" icon={Captions} title="Every word, captioned.">
          Speech in Urdu, Hindi and English becomes timed captions you can restyle and edit line by line.
        </Heading>
        <div className="reveal relative mx-auto mt-16 max-w-[900px]" style={delay(0.1)}>
          <div className="relative z-10 mb-[-30px] flex flex-wrap justify-center gap-3 sm:mb-[-60px]">
            {chips.map(([a, hot, b], k) => (
              <span key={k} className={cx("rounded-xl border border-line bg-canvas/90 px-4 py-2 text-[14px] font-semibold backdrop-blur", k === 1 && "sm:-translate-y-6")}>
                {a} <span className="text-orange">{hot}</span> {b}
              </span>
            ))}
          </div>
          <WaveDome />
          <div className="rim-pulse pointer-events-none absolute inset-x-[-10%] bottom-[-60px] h-[160px] bg-[radial-gradient(ellipse_50%_70%_at_50%_100%,var(--color-orange-hot),var(--color-orange)_30%,var(--color-orange-deep)_60%,transparent_78%)] blur-[24px]" />
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ 5 + 6. playground and use cases (light) */

const art = {
  stroke: { fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const,
};
const USE_CASES: { title: string; icon: IconType; points: string[]; svg: ReactNode }[] = [
  { title: "Podcasters", icon: Mic, points: ["Two-camera podcast split", "Clips from hour-long episodes", "Roman Urdu captions"],
    svg: <><rect x="6" y="6" width="12" height="20" rx="6" {...art.stroke} /><path d="M2 20a10 10 0 0 0 20 0M12 30v6" {...art.stroke} />{[6, 12, 8, 16, 10, 14, 6, 9].map((hh, i) => <rect key={i} x={30 + i * 6} y={20 - hh / 2} width="2.5" height={hh} rx="1.2" fill={i === 3 ? "#ff5a1f" : "currentColor"} />)}</> },
  { title: "Streamers", icon: Gamepad2, points: ["Gaming layout with face cam", "Find the hype moments", "Hours of VOD, minutes of work"],
    svg: <><rect x="2" y="16" width="76" height="8" rx="4" {...art.stroke} />{[14, 38, 60].map((x, i) => <path key={x} d={`M${x} 6 l4 6 h-8z`} fill={i === 1 ? "#ff5a1f" : "currentColor"} />)}</> },
  { title: "Educators", icon: Languages, points: ["Lessons into short explainers", "Readable captions for every viewer", "Hindi, Urdu or English"],
    svg: <><rect x="10" y="2" width="60" height="30" rx="3" {...art.stroke} /><rect x="20" y="24" width="40" height="5" rx="2.5" fill="#ff5a1f" /></> },
  { title: "Agencies", icon: SplitSquareVertical, points: ["Many clips per client video", "Consistent caption style", "Business plan: 20 hours a day"],
    svg: <>{[0, 1, 2].map((i) => <rect key={i} x={24 + i * 8} y={4 + i * 3} width="18" height="30" rx="3" fill="#ffffff" stroke={i === 2 ? "#ff5a1f" : "currentColor"} strokeWidth="1.5" />)}</> },
  { title: "Coaches", icon: AudioLines, points: ["Talking-head videos reframed", "Key advice as standalone clips", "Captions that hold attention"],
    svg: <><rect x="26" y="2" width="28" height="36" rx="4" {...art.stroke} /><circle cx="40" cy="15" r="5" {...art.stroke} /><path d="M31 32a9 9 0 0 1 18 0" {...art.stroke} /><rect x="30" y="34" width="20" height="2" rx="1" fill="#ff5a1f" /></> },
  { title: "Editors", icon: Scissors, points: ["Rough cuts in minutes", "Trim and split on a real timeline", "Undo, shortcuts, live preview"],
    svg: <><rect x="2" y="22" width="76" height="10" rx="3" {...art.stroke} /><rect x="30" y="22" width="22" height="10" rx="3" fill="#ff5a1f" /><circle cx="36" cy="10" r="4" {...art.stroke} /><circle cx="48" cy="10" r="4" {...art.stroke} /><path d="M39 12l6 8M45 12l-6 8" {...art.stroke} /></> },
];

export function PlaygroundAndUseCases() {
  const options: [IconType, string][] = [[Scissors, "Auto clips"], [Captions, "Captions"], [SplitSquareVertical, "Reframe 9:16"], [Gamepad2, "Gaming layout"]];
  return (
    <Section tone="light" z={5}>
      <div className="container-x relative py-20 sm:py-[140px]">
        <div className="reveal mx-auto max-w-[760px] overflow-hidden rounded-[20px] border border-light-line bg-light-card shadow-[0_20px_60px_rgb(0_0_0/0.06)]">
          <div className="relative h-40 overflow-hidden">
            <div className="absolute left-1/2 top-12 h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-light-line bg-light" />
            <div className="absolute left-1/2 top-20 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-orange shadow-[0_10px_30px_-6px_rgb(255_90_31/0.7)]">
              <Play className="ml-0.5 size-6 fill-white text-white" />
            </div>
          </div>
          <div className="px-6 pb-8 text-center sm:px-10">
            <h2 className="h-display text-[26px] leading-tight sm:text-[34px]">Choose what ClipXo does</h2>
            <p className="mx-auto mt-3 max-w-[420px] text-[14.5px] text-light-dim">Every option runs on your own video, inside the desktop app.</p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {options.map(([Icon, label]) => (
                <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-light-line bg-light px-3 py-4 text-[13px] font-medium">
                  <Icon className="size-5 text-orange" />{label}
                </div>
              ))}
            </div>
            <a href="#pricing" className="mt-6 flex items-center gap-3 rounded-full border border-light-line bg-light py-1.5 pl-5 pr-1.5 text-left text-[14px] text-light-dim transition-colors hover:border-orange/40">
              <span className="flex-1 truncate">Open a long video in ClipXo: podcast, stream, interview…</span>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange text-white"><ArrowUpRight className="size-4" /></span>
            </a>
          </div>
        </div>

        <div className="mt-28">
          <Heading light label="Who it's for" icon={Users} title="Made for people who talk on camera." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map(({ title, icon: Icon, points, svg }, i) => (
              <div key={title} className="reveal rounded-[20px] border border-light-line bg-light-card p-6 shadow-[0_20px_60px_rgb(0_0_0/0.06)]" style={delay(i * 0.06)}>
                <div className="flex items-start justify-between">
                  <span className={cx("grid size-7 place-items-center rounded-lg", PASTEL[i % 4])}><Icon className="size-3.5" /></span>
                  <svg viewBox="0 0 80 40" className="h-10 text-[#b9b8b4]" aria-hidden>{svg}</svg>
                </div>
                <h3 className="mt-6 text-[15px] font-semibold">{title}</h3>
                <ul className="mt-3 space-y-1.5 text-[13.5px] text-light-dim">
                  {points.map((p) => <li key={p} className="flex gap-2"><span className="mt-[7px] size-1 shrink-0 rounded-full bg-orange" />{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ 7. pricing */

const CTA_LABEL: Record<string, string> = { starter: "Get started", pro: "Get Pro", business: "Get Business" };

function PriceCard({ pkg, href }: { pkg: Package; href: string }) {
  const featured = pkg.recommended; // the recommended plan sits in the middle and gets the orange treatment
  return (
    <div className={cx("relative flex flex-col rounded-[20px] border bg-canvas p-7", featured ? "order-first border-orange/40 lg:order-none" : "border-line")}>
      {featured && <span className="absolute inset-y-6 left-0 w-px bg-orange shadow-[0_0_12px_2px_rgb(255_90_31/0.6)]" />}
      {featured && <span className="absolute -top-3 left-7 rounded-full bg-orange px-2.5 py-0.5 text-[11.5px] font-medium text-white">Recommended</span>}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[18px] font-semibold">{pkg.name}</h3>
        {pkg.web_access && <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-[11px] text-ink-2">Desktop + Web</span>}
      </div>
      <p className="mt-2 min-h-[42px] text-[14px] leading-snug text-muted">{pkg.tagline}</p>
      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="text-[36px] font-semibold tracking-[-0.02em]">{pkr(pkg.price_pkr)}</span>
        <span className="text-[14px] text-muted">/ {durationLabel(pkg.duration_days)}</span>
      </div>
      <p className="mt-1.5 text-[14px] text-ink-2">{Number(pkg.daily_hours)} hours of video a day</p>
      <Link to={href} className={cx("mt-6 inline-flex h-11 items-center justify-center rounded-xl text-[14px] font-medium transition-colors",
        featured ? "btn-ember bg-orange text-white hover:bg-[#ff6e3a]" : "bg-sand text-ink hover:bg-[#232326]")}>
        {CTA_LABEL[pkg.slug] ?? `Get ${pkg.name}`}
      </Link>
      <ul className="mt-7 space-y-3 border-t border-line pt-6 text-[14px]">
        {pkg.features.map((f) => (
          <li key={f} className="flex gap-2.5 text-ink-2"><Check className="mt-0.5 size-4 shrink-0 text-orange" strokeWidth={2} />{f}</li>
        ))}
      </ul>
    </div>
  );
}

export function Pricing() {
  const { session } = useAuth();
  const { data, loading, error } = usePackages();
  useReveal([loading]);
  return (
    <Section id="pricing" tone="dark" z={6}>
      <div className="container-x relative py-20 sm:py-[140px]">
        <Heading label="Pricing" icon={Tag} title="Simple plans, paid in rupees.">
          Pay by bank transfer. Your plan starts the day we confirm your payment.
        </Heading>
        {loading ? (
          <div className="mt-14 grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-[420px] animate-pulse rounded-[20px] bg-canvas" />)}</div>
        ) : error ? (
          <p className="mt-14 text-center text-[14px] text-red">Prices could not be loaded. Please refresh the page.</p>
        ) : (
          <div className="reveal mx-auto mt-14 grid max-w-[1040px] gap-4 lg:grid-cols-3">
            {(data ?? []).map((p) => <PriceCard key={p.id} pkg={p} href={session ? `/checkout/${p.slug}` : `/register?plan=${p.slug}`} />)}
          </div>
        )}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ 8. FAQ */

const FAQS: [string, string][] = [
  ["How does ClipXo pick moments?", "ClipXo transcribes the speech in your video, then a language model reads the transcript and scores each moment for how likely it is to hold attention on its own. The best moments become suggested clips that you can review, trim and export."],
  ["Which languages do captions support?", "Speech in Urdu, Hindi and English is transcribed, including speech that mixes them. Captions can be shown in Roman Urdu, Roman Hindi or English, highlighted word by word."],
  ["Can I edit captions?", "Yes. Captions sit on their own row in the timeline. Click a line to fix its text, drag its start and end, or move it up or down on the frame."],
  ["Is there a watermark?", "ClipXo does not add its own watermark to your exports. If you want one, you can add your own logo in the app."],
  ["How do I buy a subscription?", "Create an account, choose a plan and transfer the amount to our bank account. Then submit the transaction reference and a screenshot. Our team checks it against our bank records and activates your plan."],
  ["How will I receive the software?", "As soon as your payment is approved, a download button appears in your dashboard with installation instructions. We also send you an email."],
  ["How do daily limits work?", "Each plan allows a number of hours of source video per day (5, 7 or 20) and 3 exports per day. The allowance resets at midnight Pakistan time. If a video is longer than what is left, ClipXo tells you exactly how much time remains today."],
  ["What happens when my subscription ends?", "The software stops processing new videos, but your account and payment history are kept. Renew any time; renewing early adds the new days after your current expiry date."],
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section id="faq" tone="dark" z={7}>
      <div className="container-x relative max-w-[820px] py-20 sm:py-[140px]">
        <Heading label="FAQ" icon={CircleHelp} title="Questions, answered." />
        <div className="reveal mt-12 space-y-2">
          {FAQS.map(([q, a], i) => (
            <div key={q} className="rounded-[14px] border border-line bg-canvas">
              <button className="flex w-full items-center gap-3 px-5 py-4 text-left" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <ChevronRight className={cx("size-4 shrink-0 text-orange transition-transform duration-300", open === i && "rotate-90")} />
                <span className="text-[15px] font-medium">{q}</span>
              </button>
              <div className={cx("grid transition-[grid-template-rows] duration-300", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <p className="overflow-hidden text-[13.5px] leading-relaxed text-muted"><span className="block px-5 pb-5 pl-12">{a}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ 9 + 10. CTA and footer */

export function ClosingCta() {
  return (
    <Section tone="dark" z={8}>
      <div className="container-x relative pb-10 pt-6 sm:pb-16">
        <div className="reveal relative overflow-hidden rounded-[28px] border border-line bg-canvas px-6 pb-40 pt-20 text-center sm:pt-24">
          <div className="grid-bg absolute inset-0" />
          <div className="pointer-events-none absolute inset-x-[-10%] bottom-[-90px] h-[260px] bg-[radial-gradient(ellipse_50%_80%_at_50%_100%,#fff3ea,var(--color-orange-hot)_18%,var(--color-orange)_38%,var(--color-orange-deep)_62%,transparent_80%)] blur-[18px]" />
          <h2 className="h-display relative text-[28px] leading-[1.1] sm:text-[44px]">Turn your next video<br />into ten clips.</h2>
          <p className="relative mx-auto mt-4 max-w-[420px] text-[15px] text-muted">Plans from Rs. 2,099. Activated the day we confirm your payment.</p>
          <a href="#pricing" className={whiteBtn("relative mt-8 h-11 px-6 text-[14px]")}>Get started <ArrowRight className="size-4" /></a>
        </div>
      </div>
    </Section>
  );
}

export function Footer() {
  const { site } = useSite();
  const cols: [string, ReactNode[]][] = [
    ["Product", [...NAV.map(([l, h]) => <a key={h} href={`/${h}`} className="hover:text-ink">{l}</a>),
      <Link key="about" to="/about" className="hover:text-ink">About</Link>]],
    ["Account", [
      <Link key="l" to="/login" className="hover:text-ink">Log in</Link>,
      <Link key="r" to="/register" className="hover:text-ink">Create account</Link>,
      <Link key="d" to="/dashboard" className="hover:text-ink">Dashboard</Link>,
    ]],
    ["Contact", [
      site.support_email ? <a key="e" href={`mailto:${site.support_email}`} className="hover:text-ink">{site.support_email}</a> : <span key="e">Support details coming soon</span>,
      ...(site.contact_phone ? [<span key="p">{site.contact_phone}</span>] : []),
      ...(site.contact_address ? [<span key="a" className="leading-relaxed">{site.contact_address}</span>] : []),
    ]],
  ];
  return (
    <footer className="relative z-[9] border-t border-line bg-paper">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-[280px] text-[13.5px] leading-relaxed text-muted">Desktop software that turns long videos into captioned shorts, made for creators in Pakistan and India.</p>
        </div>
        {cols.map(([title, links]) => (
          <div key={title}>
            <p className="text-[13px] font-semibold">{title}</p>
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-muted">{links.map((l, k) => <li key={k}>{l}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col justify-between gap-2 py-6 text-[12.5px] text-faint sm:flex-row">
          <p>© {new Date().getFullYear()} {site.product_name}. All rights reserved.</p>
          <p>Designed and built by{" "}
            <a href="https://www.deykode.com" target="_blank" rel="noopener noreferrer" className="font-medium text-ink-2 hover:text-orange">Deykode</a>
          </p>
          <div className="flex gap-5">
            <Link to="/terms" className="hover:text-ink">Terms and Conditions</Link>
            <Link to="/privacy" className="hover:text-ink">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
