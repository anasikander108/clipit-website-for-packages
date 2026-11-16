import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, AudioLines, Check, Clock3, Globe, Languages, Menu, MonitorDown, Plus, Scissors, ScanSearch, Upload, X,
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

export function Announcement() {
  const { site } = useSite();
  if (!site.announcement.trim()) return null;
  return <div className="border-b border-line bg-sand px-5 py-2 text-center text-[13px] text-ink-2">{site.announcement}</div>;
}

export function Navbar() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cx("sticky top-0 z-40 border-b bg-canvas/95 backdrop-blur-[2px] transition-colors", scrolled ? "border-line" : "border-transparent")}>
      <div className="container-x flex h-16 items-center gap-8">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} className="text-[14px] text-muted transition-colors hover:text-ink">{label}</a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {session ? (
            <LinkButton to="/dashboard" size="sm">Dashboard</LinkButton>
          ) : (
            <>
              <LinkButton to="/login" variant="ghost" size="sm">Log in</LinkButton>
              <a href="#pricing" className={btn("primary", "sm")}>Get started</a>
            </>
          )}
        </div>
        <button className="ml-auto rounded-md p-2 hover:bg-sand md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-canvas md:hidden">
          <div className="container-x flex flex-col py-3">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="py-2.5 text-[15px] text-ink-2">{label}</a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-4">
              {session ? (
                <LinkButton to="/dashboard" className="col-span-2">Dashboard</LinkButton>
              ) : (
                <>
                  <LinkButton to="/login" variant="secondary">Log in</LinkButton>
                  <a href="#pricing" onClick={() => setOpen(false)} className={btn("primary")}>Get started</a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="grid-lines pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      <div className="container-x relative pb-20 pt-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow mb-5 inline-flex items-center gap-2 rounded-md border border-line bg-canvas px-2.5 py-1 normal-case tracking-normal">
            <span className="size-1.5 rounded-full bg-teal" /> Desktop software for Windows · Urdu, Hindi and English
          </p>
          <h1 className="h-display text-[42px] leading-[1.02] sm:text-[64px] lg:text-[76px]">Turn long videos into viral shorts.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-muted sm:text-[18px]">
            AI-powered video clipping software that finds the most engaging moments in your long-form videos and turns them into ready-to-publish short clips.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#pricing" className={btn("primary", "lg")}>Get started <ArrowRight className="size-4" /></a>
            <a href="#features" className={btn("secondary", "lg")}>Explore features</a>
          </div>
        </div>
        <div className="mx-auto mt-16 max-w-[1040px]">
          <AppMockup />
        </div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, children, center }: { eyebrow: string; title: string; children?: React.ReactNode; center?: boolean }) {
  return (
    <div className={cx("max-w-2xl", center && "mx-auto text-center")}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h-display mt-3 text-[32px] leading-[1.08] sm:text-[44px]">{title}</h2>
      {children && <p className="mt-4 text-[16.5px] leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

const FEATURES = [
  { icon: ScanSearch, title: "AI-powered moment detection", body: "Clipit reads the whole conversation and scores each moment, so the strongest parts of a long video rise to the top." },
  { icon: AudioLines, title: "Automatic transcription", body: "Speech becomes timed text in Urdu, Hindi or English. Captions come out in Roman Urdu or Hindi, word by word." },
  { icon: Scissors, title: "Smart clip generation", body: "Make several vertical shorts from one long video, each with captions, a face-aware crop and a clean 9:16 frame." },
  { icon: Clock3, title: "Hours back every week", body: "Skip scrubbing through a two-hour podcast. Review suggested clips, adjust the edges and export." },
  { icon: MonitorDown, title: "Desktop software", body: "Videos are processed by a dedicated Windows application with hardware-accelerated export." },
  { icon: Globe, title: "Web access", body: "Business customers can also work from the browser with the Clipit web application." , tag: "Business" },
];

export function Features() {
  return (
    <section id="features" className="border-b border-line py-24 sm:py-28">
      <div className="container-x">
        <SectionHead eyebrow="Features" title="Everything between a long video and a finished short.">
          Built for podcasts, interviews, streams and vlogs in the languages your audience actually speaks.
        </SectionHead>
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, tag }) => (
            <div key={title} className="bg-canvas p-7">
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-ink" strokeWidth={1.75} />
                {tag && <span className="rounded border border-line px-1.5 py-0.5 text-[11.5px] font-medium text-muted">{tag}</span>}
              </div>
              <h3 className="mt-6 text-[16px] font-semibold tracking-[-0.01em]">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
        <Languages_ />
      </div>
    </section>
  );
}

function Languages_() {
  const langs = [
    ["Urdu", "Transcribed, then captioned in Roman Urdu"],
    ["Hindi", "Transcribed, captioned in Roman Hindi or Devanagari"],
    ["English", "Transcribed and captioned in English"],
  ];
  return (
    <div className="mt-6 grid gap-6 rounded-xl border border-line bg-paper p-7 lg:grid-cols-[280px_1fr] lg:items-center">
      <div className="flex items-start gap-3">
        <Languages className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
        <div>
          <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Transcription languages</h3>
          <p className="mt-1 text-[14px] text-muted">Mixed Urdu–English speech works too.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {langs.map(([l, d]) => (
          <div key={l} className="rounded-lg border border-line bg-canvas px-4 py-3.5">
            <p className="text-[15px] font-semibold">{l}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { icon: Upload, title: "Upload your long-form video", body: "Open a podcast, interview or stream recording in the desktop app." },
  { icon: ScanSearch, title: "AI analyses the content", body: "Clipit transcribes the speech and scores every moment." },
  { icon: Check, title: "Select the best moments", body: "Keep the suggestions you like and trim their edges on the timeline." },
  { icon: Scissors, title: "Generate your short clips", body: "Export captioned 9:16 shorts, ready for YouTube, TikTok and Reels." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-line bg-paper py-24 sm:py-28">
      <div className="container-x">
        <SectionHead eyebrow="How it works" title="Four steps from upload to upload." />
        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="card relative p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12.5px] text-faint">0{i + 1}</span>
                <Icon className="size-4.5 text-muted" strokeWidth={1.75} />
              </div>
              <h3 className="mt-8 text-[16px] font-semibold tracking-[-0.01em]">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const CTA_LABEL: Record<string, string> = { starter: "Get started", pro: "Get Pro", business: "Get Business" };

function PriceCard({ pkg, href }: { pkg: Package; href: string }) {
  const premium = pkg.web_access; // Business: dark premium card
  const recommended = pkg.recommended;
  return (
    <div className={cx(
      "relative flex flex-col rounded-xl border p-7",
      premium ? "border-ink bg-ink text-white" : "bg-canvas shadow-[var(--shadow-card)]",
      recommended ? "border-teal ring-1 ring-teal" : !premium && "border-line",
    )}>
      {recommended && (
        <span className="absolute -top-3 left-7 rounded-md bg-teal px-2 py-0.5 text-[12px] font-medium text-white">Recommended</span>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold">{pkg.name}</h3>
        {premium && <span className="rounded border border-white/20 px-1.5 py-0.5 text-[11.5px] font-medium text-white/80">Desktop + Web</span>}
      </div>
      <p className={cx("mt-1.5 min-h-[40px] text-[14px] leading-snug", premium ? "text-white/65" : "text-muted")}>{pkg.tagline}</p>
      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="text-[36px] font-semibold tracking-[-0.03em]">{pkr(pkg.price_pkr)}</span>
        <span className={cx("text-[14px]", premium ? "text-white/60" : "text-muted")}>/ {durationLabel(pkg.duration_days)}</span>
      </div>
      <p className={cx("mt-1 text-[13.5px]", premium ? "text-white/70" : "text-ink-2")}>
        {Number(pkg.daily_hours)} hours of video a day
      </p>
      <Link to={href} className={btn(premium ? "secondary" : recommended ? "teal" : "primary", "md", cx("mt-6 w-full", premium && "border-white bg-white text-ink hover:bg-white/90"))}>
        {CTA_LABEL[pkg.slug] ?? `Get ${pkg.name}`}
      </Link>
      <ul className={cx("mt-7 space-y-2.5 border-t pt-6 text-[14px]", premium ? "border-white/15" : "border-line")}>
        {pkg.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <Check className={cx("mt-0.5 size-4 shrink-0", premium ? "text-white/80" : "text-teal")} strokeWidth={2} />
            <span className={premium ? "text-white/85" : "text-ink-2"}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pricing() {
  const { session } = useAuth();
  const { data, loading, error } = usePackages();
  return (
    <section id="pricing" className="border-b border-line py-24 sm:py-28">
      <div className="container-x">
        <SectionHead eyebrow="Pricing" title="Simple plans, paid in rupees." center>
          Pay once by bank transfer. Your plan starts the day we confirm your payment.
        </SectionHead>
        {loading ? (
          <div className="mt-14 grid gap-5 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-[460px] animate-pulse rounded-xl bg-sand" />)}</div>
        ) : error ? (
          <p className="mt-14 text-center text-[14px] text-red">Prices could not be loaded. Please refresh the page.</p>
        ) : (
          <div className="mx-auto mt-14 grid max-w-[1080px] gap-5 lg:grid-cols-3 lg:items-start">
            {(data ?? []).map((p) => (
              <PriceCard key={p.id} pkg={p} href={session ? `/checkout/${p.slug}` : `/register?plan=${p.slug}`} />
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-[13.5px] text-muted">
          All plans include 3 exports a day, Urdu/Hindi/English transcription and updates for the length of the plan.
        </p>
      </div>
    </section>
  );
}

const FAQS: [string, string][] = [
  ["What is this software?", "Clipit is a Windows desktop application that turns long videos such as podcasts, interviews and streams into short vertical clips with captions, ready for YouTube Shorts, TikTok and Instagram Reels."],
  ["How does AI clipping work?", "Clipit transcribes the speech in your video, then a language model reads the transcript and scores each moment for how likely it is to hold attention on its own. The best moments become suggested clips that you can review, trim and export."],
  ["Which languages can it transcribe?", "Urdu, Hindi and English, including speech that mixes Urdu or Hindi with English. Captions can be shown in Roman Urdu, Roman Hindi or English."],
  ["How do I purchase a subscription?", "Create an account, choose a plan and transfer the amount to our bank account. Then submit the transaction reference and a screenshot of the transfer. Our team checks it against our bank records and activates your plan."],
  ["How will I receive the software?", "As soon as your payment is approved, a download button appears in your dashboard together with installation instructions. We also send you an email."],
  ["Can I use the software on multiple devices?", "Your subscription belongs to your account. You can sign in on another computer, but the daily processing allowance is shared across all of them."],
  ["What happens when my subscription expires?", "The software stops processing new videos, but your account and payment history are kept. Renew at any time; if you renew early, the new days are added after your current expiry date."],
  ["How do daily processing limits work?", "Each plan allows a number of hours of source video per day (5, 7 or 20) and 3 exports per day. The allowance resets at midnight Pakistan time. If a video is longer than what is left, Clipit tells you exactly how much time remains today."],
  ["How can I contact support?", "Use the Support page in your dashboard or email us at the address in the footer. Pro and Business customers get priority replies."],
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-b border-line bg-paper py-24 sm:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[360px_1fr]">
        <SectionHead eyebrow="FAQ" title="Questions, answered." />
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map(([q, a], i) => (
            <div key={q}>
              <button className="flex w-full items-center justify-between gap-6 py-5 text-left" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span className="text-[16px] font-medium tracking-[-0.01em]">{q}</span>
                <Plus className={cx("size-4 shrink-0 text-muted transition-transform duration-200", open === i && "rotate-45")} />
              </button>
              <div className={cx("grid transition-[grid-template-rows] duration-200", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <p className="overflow-hidden pr-10 text-[15px] leading-relaxed text-muted"><span className="block pb-5">{a}</span></p>
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
    <section className="py-24">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-8 rounded-xl bg-ink px-8 py-12 text-white sm:px-12 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.03em] sm:text-[38px]">Your next ten shorts are already recorded.</h2>
            <p className="mt-3 max-w-xl text-[16px] text-white/65">Open one long video and let Clipit find them.</p>
          </div>
          <a href="#pricing" className={btn("secondary", "lg", "border-white bg-white text-ink hover:bg-white/90")}>See plans <ArrowRight className="size-4" /></a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { site } = useSite();
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted">
            Desktop software that turns long videos into captioned shorts, made for creators in Pakistan and India.
          </p>
        </div>
        <div>
          <p className="text-[13px] font-semibold">Product</p>
          <ul className="mt-4 space-y-2.5 text-[14px] text-muted">
            {NAV.map(([l, h]) => <li key={h}><a href={`/${h}`} className="hover:text-ink">{l}</a></li>)}
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-semibold">Account</p>
          <ul className="mt-4 space-y-2.5 text-[14px] text-muted">
            <li><Link to="/login" className="hover:text-ink">Log in</Link></li>
            <li><Link to="/register" className="hover:text-ink">Create account</Link></li>
            <li><Link to="/terms" className="hover:text-ink">Terms and Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-ink">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-semibold">Contact</p>
          <ul className="mt-4 space-y-2.5 text-[14px] text-muted">
            {site.support_email && <li><a href={`mailto:${site.support_email}`} className="hover:text-ink">{site.support_email}</a></li>}
            {site.contact_phone && <li>{site.contact_phone}</li>}
            {site.contact_address && <li className="leading-relaxed">{site.contact_address}</li>}
            {!site.support_email && !site.contact_phone && <li>Support details coming soon</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col justify-between gap-2 py-6 text-[13px] text-faint sm:flex-row">
          <p>© {new Date().getFullYear()} {site.product_name}. All rights reserved.</p>
          <p>Prices in Pakistani rupees (PKR).</p>
        </div>
      </div>
    </footer>
  );
}
