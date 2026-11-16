import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, AudioLines, Captions, Check, Instagram, Menu, Music2, Plus, RectangleVertical, ScanSearch, Scissors, Upload, X, Youtube,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useSite } from "../../lib/site";
import { usePackages } from "../../lib/packages";
import { cx, durationLabel, pkr } from "../../lib/format";
import type { Package } from "../../lib/types";
import { Logo } from "../common";
import { btn, LinkButton } from "../ui";
import { AppMockup } from "./AppMockup";

const NAV = [
  ["Features", "#features"],
  ["How it works", "#how-it-works"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
] as const;

const pill = "!rounded-full";
const primary = (size: "sm" | "md" | "lg" = "md", extra = "") => btn("primary", size, cx(pill, "btn-glow", extra));
const delay = (s: number): CSSProperties => ({ transitionDelay: `${s}s` });

/** Fade + rise elements with .reveal as they scroll into view (once). */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function Announcement() {
  const { site } = useSite();
  if (!site.announcement.trim()) return null;
  return <div className="relative z-50 border-b border-line bg-canvas px-5 py-2 text-center text-[13px] text-ink-2">{site.announcement}</div>;
}

export function Navbar() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-4 z-40 px-4">
      <div className="mx-auto flex h-12 max-w-[1120px] items-center gap-6 rounded-full border border-line bg-[rgb(12_12_40/0.6)] pl-5 pr-1.5 backdrop-blur-md">
        <Logo />
        <nav className="hidden flex-1 items-center justify-center gap-7 md:flex">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} className="text-[13px] text-muted transition-colors hover:text-ink">{label}</a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-4 md:flex">
          {session ? (
            <Link to="/dashboard" className={primary("sm")}>Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="text-[13px] text-muted transition-colors hover:text-ink">Log in</Link>
              <a href="#pricing" className={primary("sm")}>Get started</a>
            </>
          )}
        </div>
        <button className="ml-auto mr-1 rounded-full p-2 text-ink-2 hover:bg-white/5 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="animate-fade-up mx-auto mt-2 max-w-[1120px] rounded-2xl border border-line bg-[rgb(12_12_40/0.92)] p-3 backdrop-blur-md md:hidden">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-[15px] text-ink-2 hover:bg-white/5">{label}</a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
            {session ? (
              <Link to="/dashboard" className={primary("md", "col-span-2")}>Dashboard</Link>
            ) : (
              <>
                <LinkButton to="/login" variant="secondary" className={pill}>Log in</LinkButton>
                <a href="#pricing" onClick={() => setOpen(false)} className={primary()}>Get started</a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Hero() {
  const { site } = useSite();
  const letters = site.product_name.toUpperCase().split("");
  const mid = (letters.length - 1) / 2;
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div className="glow" />
      <div className="ring" aria-hidden />
      <div className="container-x relative flex min-h-[100svh] flex-col items-center pb-20 text-center"
        style={{ paddingTop: "max(170px, calc(min(140vw, 1500px) * 0.38 - 70px))" }}>
        <h1 className="font-display pl-[0.5em] text-[32px] font-bold uppercase leading-none tracking-[0.5em] sm:pl-[1.2em] sm:text-[64px] sm:tracking-[1.2em]" aria-label={site.product_name}>
          {letters.map((ch, i) => (
            <span key={i} className="wm-letter" aria-hidden
              style={{ animationDelay: `${0.4 + i * 0.08}s`, "--from": `${(i - mid) * 18}px` } as CSSProperties}>{ch}</span>
          ))}
        </h1>
        <p className="fade-in mt-10 text-[15px] font-medium uppercase tracking-[0.04em] sm:text-[18px]" style={{ animationDelay: "1.2s" }}>
          Turn long videos into viral shorts.
        </p>
        <p className="fade-in mt-4 max-w-[440px] text-[15px] leading-relaxed text-muted" style={{ animationDelay: "1.3s" }}>
          AI-powered clipping that finds the most engaging moments in your long-form videos and turns them into ready-to-publish shorts.
        </p>
        <div className="fade-in mt-9 flex flex-col items-center gap-3" style={{ animationDelay: "1.5s" }}>
          <a href="#pricing" className={primary("lg", "px-8")}>Get started</a>
          <span className="text-[12px] text-muted">Plans from Rs. 2,099 · Urdu, Hindi and English</span>
        </div>
      </div>
    </section>
  );
}

function SectionHead({ title, children, eyebrow }: { title: string; children?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mx-auto max-w-[560px] text-center">
      {eyebrow && <p className="eyebrow reveal">{eyebrow}</p>}
      <h2 className="h-display reveal mt-3 text-[28px] leading-[1.15] sm:text-[40px]" style={delay(0.05)}>{title}</h2>
      {children && <p className="reveal mx-auto mt-4 max-w-[420px] text-[15px] leading-relaxed text-muted" style={delay(0.15)}>{children}</p>}
    </div>
  );
}

export function ProductCard() {
  return (
    <section id="features" className="py-24 sm:py-40">
      <div className="container-x">
        <div className="feature-card reveal grid gap-10 p-7 pt-10 sm:p-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
          <div className="relative z-10">
            <h2 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] sm:text-[44px]">Find.<br />Clip.<br />Post.</h2>
            <p className="mt-5 max-w-[340px] text-[15px] leading-relaxed text-muted">
              Open a podcast, interview or stream. ClipXo suggests the clips, captions them word by word and exports 9:16 shorts.
            </p>
            <a href="#pricing" className={primary("md", "mt-8")}>See plans</a>
          </div>
          <div className="relative z-10">
            <AppMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Moments() {
  const cards = [
    { icon: ScanSearch, title: "Moment detection", body: "Every moment is scored, so the strongest parts of a two-hour video rise to the top." },
    { icon: AudioLines, title: "Urdu, Hindi and English", body: "Speech becomes timed text, then captions in Roman Urdu, Roman Hindi or English." },
  ];
  return (
    <section className="relative overflow-hidden py-24 sm:py-36">
      <div className="glow" style={{ background: "radial-gradient(ellipse 35% 30% at 50% 30%, rgb(122 77 255 / 0.35), transparent 70%)" }} />
      <div className="container-x relative">
        <div className="reveal mx-auto mb-14 grid place-items-center">
          <div className="orb relative">
            <span className="absolute left-[18%] top-[30%] h-px w-[64%] -rotate-[24deg] bg-gradient-to-r from-transparent via-lilac to-transparent opacity-80 blur-[0.5px]" />
          </div>
        </div>
        <SectionHead title="Finds the best moments">
          ClipXo reads the whole conversation and suggests the clips most likely to hold attention on their own.
        </SectionHead>
        <div className="mx-auto mt-12 grid max-w-[720px] gap-4 sm:grid-cols-2">
          {cards.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="card reveal p-6" style={delay(0.1 + i * 0.1)}>
              <Icon className="size-5 text-lilac/80" strokeWidth={1.5} />
              <h3 className="mt-5 text-[16px] font-medium">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Platforms() {
  const tiles = [
    { icon: Youtube, label: "YouTube Shorts" },
    { icon: Instagram, label: "Instagram Reels" },
    { icon: Music2, label: "TikTok" },
    { icon: Captions, label: "Word-by-word captions" },
    { icon: RectangleVertical, label: "9:16 vertical" },
  ];
  return (
    <section className="relative overflow-hidden py-24 sm:py-36">
      <div className="container-x relative">
        <div className="reveal mb-16 grid place-items-center"><div className="crescent" /></div>
        <SectionHead title="Ready for every platform">
          Vertical shorts with burned-in captions and a face-aware crop, exported straight from the desktop app.
        </SectionHead>
        <div className="-mx-5 mt-12 flex snap-x gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
          {tiles.map(({ icon: Icon, label }, i) => (
            <div key={label} className="reveal flex h-[90px] w-[150px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-xl border border-line bg-canvas" style={delay(0.1 + i * 0.08)}>
              <Icon className="size-5 text-lilac opacity-60" strokeWidth={1.5} />
              <span className="text-[11.5px] text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Upload, title: "Open your video", body: "A podcast, interview or stream recording." },
  { icon: ScanSearch, title: "ClipXo analyses it", body: "Speech is transcribed and every moment scored." },
  { icon: Check, title: "Pick the best moments", body: "Keep the suggestions and trim their edges." },
  { icon: Scissors, title: "Export your shorts", body: "Captioned 9:16 clips, ready to post." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-36">
      <div className="container-x">
        <SectionHead title="Four steps" eyebrow="How it works" />
        <ol className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="card reveal p-6" style={delay(0.1 + i * 0.08)}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] text-faint">0{i + 1}</span>
                <Icon className="size-4 text-lilac/70" strokeWidth={1.5} />
              </div>
              <h3 className="mt-8 text-[15px] font-medium">{title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** A sphere of dots drawn once on a canvas (no animation loop). */
function DotGlobe() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const draw = () => {
      const size = canvas.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = canvas.height = size * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const r = size * 0.44, c = size / 2, n = 900, tilt = 0.35;
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const rad = Math.sqrt(1 - y * y);
        const th = i * 2.399963;
        const x = Math.cos(th) * rad, z = Math.sin(th) * rad;
        const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
        const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
        if (z2 < -0.15) continue;
        const a = 0.15 + 0.85 * ((z2 + 0.15) / 1.15);
        ctx.fillStyle = `rgba(185,168,255,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(c + x * r, c + y2 * r, 0.6 + a * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);
  return <canvas ref={ref} className="aspect-square w-[260px] sm:w-[340px]" aria-hidden />;
}

function Callout({ value, label, side }: { value: string; label: string; side: "left" | "right" }) {
  return (
    <div className={cx("reveal flex items-center gap-4", side === "right" ? "lg:flex-row-reverse lg:text-right" : "")}>
      <div>
        <p className="text-[48px] font-light leading-none tracking-[-0.02em]">{value}</p>
        <p className="mt-2 text-[11.5px] text-muted">{label}</p>
      </div>
      <div className={cx("hidden h-px w-24 bg-line-strong lg:block", "relative")}>
        <span className={cx("absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-violet shadow-[0_0_12px_var(--color-violet)]", side === "left" ? "right-0" : "left-0")} />
      </div>
    </div>
  );
}

export function Stats() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-36">
      <div className="glow" style={{ background: "radial-gradient(ellipse 30% 35% at 50% 55%, rgb(42 42 255 / 0.4), transparent 70%)" }} />
      <div className="container-x relative">
        <SectionHead title="Built for volume" />
        <div className="mt-14 grid items-center justify-items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
          <div className="lg:justify-self-end"><Callout value="3" label="languages transcribed: Urdu, Hindi, English" side="left" /></div>
          <div className="reveal"><DotGlobe /></div>
          <div className="lg:justify-self-start"><Callout value="20 h" label="of video a day on the Business plan" side="right" /></div>
        </div>
      </div>
    </section>
  );
}

const CTA_LABEL: Record<string, string> = { starter: "Get started", pro: "Get Pro", business: "Get Business" };

function PriceCard({ pkg, href }: { pkg: Package; href: string }) {
  const premium = pkg.web_access;
  return (
    <div className={cx(
      "relative flex flex-col p-7",
      premium ? "feature-card lg:-my-4 lg:py-11" : "card",
      pkg.recommended && "border-lilac/50",
    )}>
      {pkg.recommended && (
        <span className="absolute -top-3 left-7 rounded-full bg-lilac px-2.5 py-0.5 text-[11.5px] font-medium text-night">Recommended</span>
      )}
      <div className="relative z-10 flex items-center justify-between">
        <h3 className="text-[17px] font-medium">{pkg.name}</h3>
        {premium && <span className="rounded-full border border-line-strong px-2 py-0.5 text-[11px] text-ink-2">Desktop + Web</span>}
      </div>
      <p className="relative z-10 mt-1.5 min-h-[40px] text-[13.5px] leading-snug text-muted">{pkg.tagline}</p>
      <div className="relative z-10 mt-6 flex items-baseline gap-1.5">
        <span className="text-[34px] font-light tracking-[-0.02em]">{pkr(pkg.price_pkr)}</span>
        <span className="text-[13px] text-muted">/ {durationLabel(pkg.duration_days)}</span>
      </div>
      <p className="relative z-10 mt-1 text-[13px] text-ink-2">{Number(pkg.daily_hours)} hours of video a day</p>
      <Link to={href} className={cx("relative z-10 mt-6 w-full", premium ? primary("md") : btn("secondary", "md", pill))}>
        {CTA_LABEL[pkg.slug] ?? `Get ${pkg.name}`}
      </Link>
      <ul className="relative z-10 mt-7 space-y-2.5 border-t border-line pt-6 text-[13.5px]">
        {pkg.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-lilac" strokeWidth={1.75} />
            <span className="text-ink-2">{f}</span>
          </li>
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
    <section id="pricing" className="relative py-24 sm:py-36">
      <div className="container-x relative">
        <SectionHead title="Simple plans, in rupees" eyebrow="Pricing">
          Pay by bank transfer. Your plan starts the day we confirm your payment.
        </SectionHead>
        {loading ? (
          <div className="mt-14 grid gap-5 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-[460px] animate-pulse rounded-[14px] bg-canvas" />)}</div>
        ) : error ? (
          <p className="mt-14 text-center text-[14px] text-red">Prices could not be loaded. Please refresh the page.</p>
        ) : (
          <div className="reveal mx-auto mt-16 grid max-w-[1040px] gap-5 lg:grid-cols-3 lg:items-center">
            {(data ?? []).map((p) => (
              <PriceCard key={p.id} pkg={p} href={session ? `/checkout/${p.slug}` : `/register?plan=${p.slug}`} />
            ))}
          </div>
        )}
        <p className="mt-10 text-center text-[12.5px] text-muted">All plans include 3 exports a day and updates for the length of the plan.</p>
      </div>
    </section>
  );
}

const FAQS: [string, string][] = [
  ["What is this software?", "ClipXo is a Windows desktop application that turns long videos such as podcasts, interviews and streams into short vertical clips with captions, ready for YouTube Shorts, TikTok and Instagram Reels."],
  ["How does AI clipping work?", "ClipXo transcribes the speech in your video, then a language model reads the transcript and scores each moment for how likely it is to hold attention on its own. The best moments become suggested clips that you can review, trim and export."],
  ["Which languages can it transcribe?", "Urdu, Hindi and English, including speech that mixes Urdu or Hindi with English. Captions can be shown in Roman Urdu, Roman Hindi or English."],
  ["How do I purchase a subscription?", "Create an account, choose a plan and transfer the amount to our bank account. Then submit the transaction reference and a screenshot of the transfer. Our team checks it against our bank records and activates your plan."],
  ["How will I receive the software?", "As soon as your payment is approved, a download button appears in your dashboard together with installation instructions. We also send you an email."],
  ["Can I use the software on multiple devices?", "Your subscription belongs to your account. You can sign in on another computer, but the daily processing allowance is shared across all of them."],
  ["What happens when my subscription expires?", "The software stops processing new videos, but your account and payment history are kept. Renew at any time; if you renew early, the new days are added after your current expiry date."],
  ["How do daily processing limits work?", "Each plan allows a number of hours of source video per day (5, 7 or 20) and 3 exports per day. The allowance resets at midnight Pakistan time. If a video is longer than what is left, ClipXo tells you exactly how much time remains today."],
  ["How can I contact support?", "Use the Support page in your dashboard or email us at the address in the footer. Pro and Business customers get priority replies."],
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 sm:py-36">
      <div className="container-x max-w-[760px]">
        <SectionHead title="Questions, answered" eyebrow="FAQ" />
        <div className="reveal mt-12 divide-y divide-line border-y border-line">
          {FAQS.map(([q, a], i) => (
            <div key={q}>
              <button className="flex w-full items-center justify-between gap-6 py-5 text-left" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span className="text-[15.5px] font-medium">{q}</span>
                <Plus className={cx("size-4 shrink-0 text-lilac transition-transform duration-300", open === i && "rotate-45")} />
              </button>
              <div className={cx("grid transition-[grid-template-rows] duration-300", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <p className="overflow-hidden pr-10 text-[14.5px] leading-relaxed text-muted"><span className="block pb-5">{a}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden pt-24 sm:pt-36">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(ellipse_55%_60%_at_50%_100%,rgb(122_77_255/0.55),transparent_70%)]" />
      <div className="container-x relative text-center">
        <h2 className="h-display reveal text-[28px] leading-[1.15] sm:text-[40px]">Ready to clip your first video?</h2>
        <div className="reveal mt-8 flex flex-col items-center gap-3" style={delay(0.1)}>
          <a href="#pricing" className={primary("lg", "px-8")}>Get started <ArrowRight className="size-4" /></a>
          <span className="text-[12px] text-muted">Pay by bank transfer · Activated the day we confirm</span>
        </div>
        <div className="reveal relative mx-auto mt-16 max-w-[900px] translate-y-[1px]" style={delay(0.2)}>
          <div className="[mask-image:linear-gradient(#000_55%,transparent)]"><AppMockup /></div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { site } = useSite();
  return (
    <footer className="border-t border-line">
      <div className="container-x flex flex-col items-center gap-5 py-10 text-[12px] text-muted md:flex-row md:justify-between">
        <Logo />
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {NAV.map(([l, h]) => <a key={h} href={`/${h}`} className="hover:text-ink">{l}</a>)}
          <Link to="/terms" className="hover:text-ink">Terms</Link>
          <Link to="/privacy" className="hover:text-ink">Privacy</Link>
          {site.support_email && <a href={`mailto:${site.support_email}`} className="hover:text-ink">{site.support_email}</a>}
          {site.contact_phone && <span>{site.contact_phone}</span>}
        </nav>
        <p className="text-faint">© {new Date().getFullYear()} {site.product_name}</p>
      </div>
    </footer>
  );
}
