import { ArrowUpRight, Code2, Figma, MessageSquare, Rocket } from "lucide-react";
import { Footer, Heading, Navbar, ghostBtn, orangeBtn, useReveal } from "../../components/landing/Sections";
import { cx } from "../../lib/format";

const DEYKODE = "https://www.deykode.com";

const SERVICES = [
  ["Websites", "Fast, responsive marketing and business sites."],
  ["Web apps", "Products with accounts, dashboards and real data behind them."],
  ["Online stores", "Shops that are simple to run and easy to buy from."],
];

const PROJECTS = [
  ["SBT System", "Live tracking for transport and fleets"],
  ["FindKhoon", "Blood donor search and community network"],
  ["Taqseem", "Bill splitting and personal finance"],
  ["UMT Portal Extension", "Browser extension and UI redesign"],
  ["ERD++", "Database design tool"],
  ["Kabhaidawat", "Motion-graphics digital invitations"],
];

const STEPS: [React.ComponentType<{ className?: string }>, string, string, string][] = [
  [MessageSquare, "Discovery", "A free 15-minute call. You get the scope, timeline and price before anything starts.", "Written plan and quote"],
  [Figma, "Design", "Structure and visuals in Figma, shaped with your feedback at every step.", "Clickable Figma prototype"],
  [Code2, "Build", "Next.js and React, responsive and animated, fast and accessible from day one.", "Preview link"],
  [Rocket, "Launch", "Live on your domain, everything handed over, with support after launch.", "Live site, code and logins"],
];

export default function About() {
  useReveal();
  return (
    <>
      <Navbar />
      <main>
        {/* intro */}
        <section className="relative overflow-hidden border-b border-line">
          <div className="grid-bg absolute inset-0" />
          <div className="streak" />
          <div className="container-x relative pb-20 pt-36 sm:pb-28 sm:pt-44">
            <Heading as="h1" size="hero" label="About" title="ClipXo is designed and built by dey.kode.">
              dey.kode is a design and development studio that sketches ideas, turns them into clean code and ships web apps. ClipXo is one of the products it has designed and built in-house, from the desktop editor to this website.
            </Heading>
            <div className="reveal mt-9 flex flex-col justify-center gap-3 sm:flex-row" style={{ transitionDelay: "0.2s" }}>
              <a href={DEYKODE} target="_blank" rel="noopener noreferrer" className={orangeBtn()}>Visit dey.kode <ArrowUpRight className="size-4" /></a>
              <a href="/#pricing" className={ghostBtn()}>See ClipXo plans</a>
            </div>
          </div>
        </section>

        {/* the studio */}
        <section className="border-b border-line py-20 sm:py-28">
          <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div className="reveal">
              <p className="eyebrow">The studio</p>
              <h2 className="h-display mt-3 text-[28px] leading-[1.15] sm:text-[36px]">Ideas sketched, built in clean code, and shipped.</h2>
              <p className="mt-5 max-w-[460px] text-[15px] leading-relaxed text-muted">
                The name says what the studio does: say “they code” fast enough and you get dey.kode. Every project is designed and built in-house, so the people who plan your product are the ones who ship it.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {SERVICES.map(([title, body], i) => (
                <div key={title} className="card reveal p-5" style={{ transitionDelay: `${i * 0.08}s` }}>
                  <p className="text-[15px] font-semibold">{title}</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* how they work */}
        <section className="border-b border-line py-20 sm:py-28">
          <div className="container-x">
            <Heading label="How dey.kode works" title="From first call to launch." >
              A clear plan and price before work begins, feedback at every step and no surprises along the way.
            </Heading>
            <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(([Icon, title, body, output], i) => (
                <li key={title} className="card reveal flex flex-col p-6" style={{ transitionDelay: `${i * 0.08}s` }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12.5px] text-faint">0{i + 1}</span>
                    <Icon className="size-4 text-orange" />
                  </div>
                  <h3 className="mt-8 text-[16px] font-semibold">{title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{body}</p>
                  <p className="mt-auto pt-6 text-[12.5px] text-ink-2"><span className="text-faint">You get:</span> {output}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* work */}
        <section className="border-b border-line py-20 sm:py-28">
          <div className="container-x">
            <Heading label="Work" title="Products dey.kode has built." />
            <div className="mt-12 grid gap-px overflow-hidden rounded-[16px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {PROJECTS.map(([name, what], i) => (
                <div key={name} className="reveal bg-canvas p-6" style={{ transitionDelay: `${i * 0.05}s` }}>
                  <p className="font-mono text-[12px] text-faint">{["I", "II", "III", "IV", "V", "VI"][i]}</p>
                  <p className="mt-3 text-[16px] font-semibold">{name}</p>
                  <p className="mt-1 text-[13.5px] text-muted">{what}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* promises + contact */}
        <section className="py-20 sm:py-28">
          <div className="container-x">
            <div className="reveal relative overflow-hidden rounded-[28px] border border-line bg-canvas px-6 py-16 text-center sm:px-12 sm:py-20">
              <div className="grid-bg absolute inset-0" />
              <h2 className="h-display relative text-[28px] leading-[1.15] sm:text-[40px]">Got a project in mind?</h2>
              <ul className="relative mx-auto mt-8 grid max-w-[640px] gap-3 text-left text-[14px] text-ink-2 sm:grid-cols-2">
                {["Scope, timeline and price agreed up front", "Your feedback at every step",
                  "Code and logins handed over to you", "Support after launch"].map((item) => (
                  <li key={item} className={cx("flex items-center gap-2.5 rounded-lg border border-line bg-paper px-4 py-3")}>
                    <span className="size-1.5 shrink-0 rounded-full bg-orange" />{item}
                  </li>
                ))}
              </ul>
              <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={DEYKODE} target="_blank" rel="noopener noreferrer" className={orangeBtn()}>Start a project with dey.kode <ArrowUpRight className="size-4" /></a>
                <a href="mailto:deykode.support@gmail.com" className={ghostBtn()}>deykode.support@gmail.com</a>
              </div>
              <p className="relative mt-4 text-[12.5px] text-muted">dey.kode replies within 24 hours.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
