// A static, decorative rendering of the ClipXo desktop editor (aria-hidden). Colours follow the app.
import { BrandMark } from "../BrandMark";

const clips = [
  { name: "Cricket ka sab se bara sabaq", time: "12:04 – 12:52", score: 9 },
  { name: "Pehli salary ki kahani", time: "27:41 – 28:30", score: 8 },
  { name: "Why most channels quit", time: "41:10 – 41:55", score: 7 },
  { name: "Ghar wapas aane ka faisla", time: "55:02 – 55:44", score: 6 },
];

const scoreColor = (s: number) => (s >= 8 ? "#3ccf91" : s >= 7 ? "#f5b942" : "#8b8f97");

export function AppMockup() {
  return (
    <div aria-hidden className="select-none overflow-hidden rounded-xl border border-ink/15 bg-[#111214] shadow-[0_30px_80px_-30px_rgb(26_24_20/0.45),0_8px_24px_-12px_rgb(26_24_20/0.25)]">
      {/* title bar */}
      <div className="flex h-9 items-center border-b border-[#2b2e33] bg-[#151619] px-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#e8e9eb]">
          <BrandMark className="size-4 text-white" />
          ClipXo
        </div>
        <div className="ml-4 hidden gap-1.5 sm:flex">
          {["Open video", "Save", "Auto clips"].map((b) => (
            <span key={b} className="rounded-[5px] border border-[#2b2e33] bg-[#202226] px-2 py-0.5 text-[10px] text-[#c9cbd0]">{b}</span>
          ))}
        </div>
        <span className="ml-auto rounded-[5px] bg-[#ff4d6d] px-2 py-0.5 text-[10px] font-semibold text-white">Export 3 shorts</span>
        <div className="ml-3 hidden gap-3 text-[#8b8f97] sm:flex">
          <span className="h-px w-2.5 self-center bg-current" /><span className="size-2.5 border border-current" /><span className="text-[11px] leading-none">✕</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr] sm:grid-cols-[180px_1fr_170px]">
        {/* clip list */}
        <div className="hidden border-r border-[#2b2e33] bg-[#18191c] p-2.5 sm:block">
          <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8b8f97]">Clips · 4</p>
          <div className="space-y-1.5">
            {clips.map((c, i) => (
              <div key={c.name} className={`rounded-md border p-2 ${i === 0 ? "border-[#b34056] bg-[#251b1e] shadow-[inset_2px_0_0_#ff4d6d]" : "border-[#2b2e33] bg-[#1c1d21]"}`}>
                <div className="flex items-start gap-1.5">
                  <span className="rounded-[3px] px-1 text-[9px] font-bold leading-[14px] text-[#111]" style={{ background: scoreColor(c.score) }}>{c.score}</span>
                  <span className="text-[10px] font-medium leading-tight text-[#e8e9eb]">{c.name}</span>
                </div>
                <p className="mt-1 font-mono text-[9px] text-[#8b8f97]">{c.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* preview */}
        <div className="flex flex-col bg-[#0d0e10]">
          <div className="flex flex-1 items-center justify-center bg-[length:20px_20px] p-4 [background-image:linear-gradient(#ffffff08_1px,transparent_1px),linear-gradient(90deg,#ffffff08_1px,transparent_1px)]">
            <div className="relative aspect-[9/16] h-[230px] overflow-hidden rounded-[6px] border border-[#2b2e33] bg-[#1b1d22] sm:h-[270px]">
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
                Yeh moment sab se <span className="text-[#ffd43b]">zabardast</span> tha
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-[#2b2e33] bg-[#151619] px-3 py-1.5">
            <span className="grid size-5 place-items-center rounded-[4px] border border-[#2b2e33] bg-[#202226]"><svg viewBox="0 0 16 16" className="size-2.5"><path d="M5 3.5v9l7.5-4.5z" fill="#e8e9eb" /></svg></span>
            <span className="font-mono text-[9.5px] text-[#c9cbd0]">12:18.4 / 1:04:32</span>
          </div>
          {/* timeline */}
          <div className="relative border-t border-[#2b2e33] bg-[#151619] px-3 pb-3 pt-2">
            <div className="mb-1.5 flex justify-between font-mono text-[8.5px] text-[#8b8f97]">
              {["12:00", "12:15", "12:30", "12:45", "13:00"].map((t) => <span key={t}>{t}</span>)}
            </div>
            <div className="space-y-1 rounded-[4px] border border-[#292c31] bg-[#101113] p-1.5">
              <div className="relative h-4">
                <div className="absolute inset-y-0 left-[6%] w-[62%] rounded-[3px] border border-[#a94055] bg-[#592432] px-1.5 text-[8.5px] font-medium leading-[14px] text-[#ffc1cd]">Cricket ka sab se bara sabaq</div>
                <div className="absolute inset-y-0 left-[76%] w-[20%] rounded-[3px] border border-[#a94055] bg-[#592432]" />
              </div>
              <div className="relative h-3.5">
                {[8, 17, 26, 34, 43, 52, 61, 78, 87].map((l, i) => (
                  <div key={l} className="absolute inset-y-0 rounded-[2px] border border-[#8e7924] bg-[#4f4518]" style={{ left: `${l}%`, width: `${i % 3 === 0 ? 8 : 7}%` }} />
                ))}
              </div>
            </div>
            <div className="absolute bottom-2 left-[34%] top-6 w-px bg-white">
              <span className="absolute -left-[4px] -top-px border-x-[4.5px] border-t-[6px] border-x-transparent border-t-white" />
            </div>
          </div>
        </div>

        {/* inspector */}
        <div className="hidden border-l border-[#2b2e33] bg-[#18191c] sm:block">
          <div className="flex gap-2.5 border-b border-[#2b2e33] px-3 pt-2 text-[9.5px] text-[#8b8f97]">
            <span className="border-b-2 border-[#ff4d6d] pb-1.5 text-[#e8e9eb]">Captions</span><span>Layout</span><span>Audio</span>
          </div>
          <div className="space-y-3 p-3">
            <div>
              <p className="mb-1 text-[9px] text-[#8b8f97]">Language</p>
              <div className="flex rounded-[5px] border border-[#2b2e33] p-0.5 text-[9px]">
                <span className="flex-1 rounded-[3px] bg-[#2b2e33] py-0.5 text-center text-[#e8e9eb]">Roman Urdu</span>
                <span className="flex-1 py-0.5 text-center text-[#8b8f97]">Hindi</span>
              </div>
            </div>
            {[["Font size", 62], ["Position", 48], ["Highlight", 80]].map(([l, v]) => (
              <div key={l as string}>
                <p className="mb-1 text-[9px] text-[#8b8f97]">{l}</p>
                <div className="relative h-[3px] rounded-full bg-[#2b2e33]">
                  <div className="h-full rounded-full bg-[#ff4d6d]" style={{ width: `${v}%` }} />
                  <span className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-white" style={{ left: `calc(${v}% - 4px)` }} />
                </div>
              </div>
            ))}
            <div>
              <p className="mb-1 text-[9px] text-[#8b8f97]">Current line</p>
              <div className="rounded-[5px] border border-[#2b2e33] bg-[#111214] p-1.5 text-[9.5px] leading-snug text-[#e8e9eb]">Yeh moment sab se zabardast tha</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
