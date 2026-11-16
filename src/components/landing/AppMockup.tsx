// A static, decorative rendering of the ClipXo desktop editor (aria-hidden). Colours follow the app.
import { BrandMark } from "../BrandMark";

const clips = [
  { name: "Cricket ka sab se bara sabaq", time: "12:04 – 12:52", score: 9 },
  { name: "Pehli salary ki kahani", time: "27:41 – 28:30", score: 8 },
  { name: "Why most channels quit", time: "41:10 – 41:55", score: 7 },
  { name: "Ghar wapas aane ka faisla", time: "55:02 – 55:44", score: 6 },
];

const scoreColor = (s: number) => (s >= 8 ? "#b9a8ff" : s >= 7 ? "#8f7dff" : "#8a8fb8");

export function AppMockup() {
  return (
    <div aria-hidden className="select-none overflow-hidden rounded-xl border border-white/10 bg-[#05051f] shadow-[0_40px_120px_-40px_rgb(42_42_255/0.55)]">
      {/* title bar */}
      <div className="flex h-9 items-center border-b border-[#1c1c4a] bg-[#08082a] px-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#eef0ff]">
          <BrandMark className="size-4 text-white" />
          ClipXo
        </div>
        <div className="ml-4 hidden gap-1.5 sm:flex">
          {["Open video", "Save", "Auto clips"].map((b) => (
            <span key={b} className="rounded-[5px] border border-[#1c1c4a] bg-[#11113c] px-2 py-0.5 text-[10px] text-[#c8cbea]">{b}</span>
          ))}
        </div>
        <span className="ml-auto rounded-[5px] bg-[#7a4dff] px-2 py-0.5 text-[10px] font-semibold text-white">Export 3 shorts</span>
        <div className="ml-3 hidden gap-3 text-[#8a8fb8] sm:flex">
          <span className="h-px w-2.5 self-center bg-current" /><span className="size-2.5 border border-current" /><span className="text-[11px] leading-none">✕</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr] sm:grid-cols-[180px_1fr_170px]">
        {/* clip list */}
        <div className="hidden border-r border-[#1c1c4a] bg-[#0a0a2e] p-2.5 sm:block">
          <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8a8fb8]">Clips · 4</p>
          <div className="space-y-1.5">
            {clips.map((c, i) => (
              <div key={c.name} className={`rounded-md border p-2 ${i === 0 ? "border-[#5b3fd0] bg-[#17123f] shadow-[inset_2px_0_0_#7a4dff]" : "border-[#1c1c4a] bg-[#0d0d35]"}`}>
                <div className="flex items-start gap-1.5">
                  <span className="rounded-[3px] px-1 text-[9px] font-bold leading-[14px] text-[#111]" style={{ background: scoreColor(c.score) }}>{c.score}</span>
                  <span className="text-[10px] font-medium leading-tight text-[#eef0ff]">{c.name}</span>
                </div>
                <p className="mt-1 font-mono text-[9px] text-[#8a8fb8]">{c.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* preview */}
        <div className="flex flex-col bg-[#04041c]">
          <div className="flex flex-1 items-center justify-center bg-[length:20px_20px] p-4 [background-image:linear-gradient(#ffffff08_1px,transparent_1px),linear-gradient(90deg,#ffffff08_1px,transparent_1px)]">
            <div className="relative aspect-[9/16] h-[230px] overflow-hidden rounded-[6px] border border-[#1c1c4a] bg-[#1b1d22] sm:h-[270px]">
              {/* top half: speaker, bottom half: second camera */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-[#2a2622]">
                <div className="absolute bottom-0 left-1/2 h-[62%] w-[46%] -translate-x-1/2 rounded-t-full bg-[#4a3f36]" />
                <div className="absolute left-1/2 top-[22%] size-[26%] -translate-x-1/2 rounded-full bg-[#6b5a4b]" />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 border-t border-black/40 bg-[#20262b]">
                <div className="absolute bottom-0 left-1/2 h-[58%] w-[44%] -translate-x-1/2 rounded-t-full bg-[#34404a]" />
                <div className="absolute left-1/2 top-[20%] size-[24%] -translate-x-1/2 rounded-full bg-[#55626d]" />
              </div>
              <div className="absolute inset-x-2 top-[47%] text-center text-[11px] font-extrabold leading-tight text-white [text-shadow:0_1px_0_#000,0_0_3px_#000]">
                Yeh moment sab se <span className="text-[#b9a8ff]">zabardast</span> tha
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-[#1c1c4a] bg-[#08082a] px-3 py-1.5">
            <span className="grid size-5 place-items-center rounded-[4px] border border-[#1c1c4a] bg-[#11113c]"><svg viewBox="0 0 16 16" className="size-2.5"><path d="M5 3.5v9l7.5-4.5z" fill="#eef0ff" /></svg></span>
            <span className="font-mono text-[9.5px] text-[#c8cbea]">12:18.4 / 1:04:32</span>
          </div>
          {/* timeline */}
          <div className="relative border-t border-[#1c1c4a] bg-[#08082a] px-3 pb-3 pt-2">
            <div className="mb-1.5 flex justify-between font-mono text-[8.5px] text-[#8a8fb8]">
              {["12:00", "12:15", "12:30", "12:45", "13:00"].map((t) => <span key={t}>{t}</span>)}
            </div>
            <div className="space-y-1 rounded-[4px] border border-[#1c1c4a] bg-[#060622] p-1.5">
              <div className="relative h-4">
                <div className="absolute inset-y-0 left-[6%] w-[62%] rounded-[3px] border border-[#6a4dff] bg-[#25205f] px-1.5 text-[8.5px] font-medium leading-[14px] text-[#d9ceff]">Cricket ka sab se bara sabaq</div>
                <div className="absolute inset-y-0 left-[76%] w-[20%] rounded-[3px] border border-[#6a4dff] bg-[#25205f]" />
              </div>
              <div className="relative h-3.5">
                {[8, 17, 26, 34, 43, 52, 61, 78, 87].map((l, i) => (
                  <div key={l} className="absolute inset-y-0 rounded-[2px] border border-[#3f52ff] bg-[#141c5c]" style={{ left: `${l}%`, width: `${i % 3 === 0 ? 8 : 7}%` }} />
                ))}
              </div>
            </div>
            <div className="absolute bottom-2 left-[34%] top-6 w-px bg-white">
              <span className="absolute -left-[4px] -top-px border-x-[4.5px] border-t-[6px] border-x-transparent border-t-white" />
            </div>
          </div>
        </div>

        {/* inspector */}
        <div className="hidden border-l border-[#1c1c4a] bg-[#0a0a2e] sm:block">
          <div className="flex gap-2.5 border-b border-[#1c1c4a] px-3 pt-2 text-[9.5px] text-[#8a8fb8]">
            <span className="border-b-2 border-[#7a4dff] pb-1.5 text-[#eef0ff]">Captions</span><span>Layout</span><span>Audio</span>
          </div>
          <div className="space-y-3 p-3">
            <div>
              <p className="mb-1 text-[9px] text-[#8a8fb8]">Language</p>
              <div className="flex rounded-[5px] border border-[#1c1c4a] p-0.5 text-[9px]">
                <span className="flex-1 rounded-[3px] bg-[#1c1c4a] py-0.5 text-center text-[#eef0ff]">Roman Urdu</span>
                <span className="flex-1 py-0.5 text-center text-[#8a8fb8]">Hindi</span>
              </div>
            </div>
            {[["Font size", 62], ["Position", 48], ["Highlight", 80]].map(([l, v]) => (
              <div key={l as string}>
                <p className="mb-1 text-[9px] text-[#8a8fb8]">{l}</p>
                <div className="relative h-[3px] rounded-full bg-[#1c1c4a]">
                  <div className="h-full rounded-full bg-[#7a4dff]" style={{ width: `${v}%` }} />
                  <span className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-white" style={{ left: `calc(${v}% - 4px)` }} />
                </div>
              </div>
            ))}
            <div>
              <p className="mb-1 text-[9px] text-[#8a8fb8]">Current line</p>
              <div className="rounded-[5px] border border-[#1c1c4a] bg-[#05051f] p-1.5 text-[9.5px] leading-snug text-[#eef0ff]">Yeh moment sab se zabardast tha</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
