import { useEffect, useState } from "react";
import SealmanGame from "./SealmanGame";

const AUTO_CLOSE_MS = 25000;

function starPoints(cx: number, cy: number, outer: number, inner: number, spikes: number): string {
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(" ");
}

const COMIC_FONT = "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', 'Trebuchet MS', sans-serif";

function Burst({ className, text, fill, rotate }: { className: string; text: string; fill: string; rotate: number }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <polygon points={starPoints(60, 60, 58, 36, 11)} fill={fill} stroke="#0f1f47" strokeWidth="4" strokeLinejoin="round" />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fontSize="24"
        fontWeight="900"
        fill="#0f1f47"
        fontFamily={COMIC_FONT}
        transform={`rotate(${rotate} 60 60)`}
      >
        {text}
      </text>
    </svg>
  );
}

const STYLES = `
@keyframes sm-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes sm-rays { to { transform: rotate(360deg) } }
@keyframes sm-bubble { 0% { opacity: 0; transform: scale(.6) } 12% { opacity: 1; transform: scale(1) } 85% { opacity: 1 } 100% { opacity: 0; transform: scale(.9) } }
@keyframes sm-man {
  0% { opacity: 1; transform: none }
  14% { transform: translateY(-5px) }
  28% { transform: none }
  42% { transform: translateY(-5px) }
  56% { transform: none }
  60% { transform: translateX(-7px) rotate(-2deg) }
  64% { transform: translateX(7px) rotate(2deg) }
  68% { transform: translateX(-7px) rotate(-2deg) }
  72% { transform: translateX(7px) rotate(2deg) }
  76% { transform: translateX(-9px) rotate(-3deg); filter: brightness(1.4) }
  82% { transform: scale(1.1); filter: brightness(3) }
  92% { opacity: 1; transform: scale(1.18); filter: brightness(6) }
  100% { opacity: 0; transform: scale(.4); filter: brightness(8) }
}
@keyframes sm-hero-in { 0% { opacity: 0; transform: scale(.15) rotate(-25deg) } 65% { opacity: 1; transform: scale(1.18) rotate(4deg) } 100% { opacity: 1; transform: scale(1) rotate(0) } }
@keyframes sm-float { from { transform: translateY(0) } to { transform: translateY(-14px) } }
@keyframes sm-cape { from { transform: skewX(-5deg) scaleY(1) } to { transform: skewX(6deg) scaleY(1.04) } }
@keyframes sm-zap { 0% { opacity: 0; transform: scale(0) rotate(-20deg) } 22% { opacity: 1; transform: scale(1.2) rotate(6deg) } 62% { opacity: 1; transform: scale(1) rotate(0) } 100% { opacity: 0; transform: scale(1.7) rotate(8deg) } }
@keyframes sm-flash { 0% { opacity: 0 } 18% { opacity: .95 } 100% { opacity: 0 } }
@keyframes sm-pop { 0% { opacity: 0; transform: scale(.2) rotate(-12deg) } 70% { opacity: 1; transform: scale(1.15) rotate(3deg) } 100% { opacity: 1; transform: scale(1) rotate(var(--sm-rot, -4deg)) } }
@keyframes sm-rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }

.sm-overlay { animation: sm-fade-in .25s ease-out both }
.sm-rays { animation: sm-rays 40s linear infinite }
.sm-bubble { opacity: 0; transform-origin: 20% 100%; animation: sm-bubble 1.9s ease-out .2s both }
.sm-man { transform-origin: 50% 90%; animation: sm-man 2.6s ease-in-out both }
.sm-hero { opacity: 0; transform-origin: 50% 90%; animation: sm-hero-in .75s cubic-bezier(.2,1.5,.4,1) 2.5s both }
.sm-hero-float { animation: sm-float 1.7s ease-in-out 3.3s infinite alternate }
.sm-cape { transform-box: fill-box; transform-origin: 50% 0; animation: sm-cape .55s ease-in-out infinite alternate }
.sm-zap { opacity: 0; animation: sm-zap 1.1s ease-out 2.15s both }
.sm-flash { opacity: 0; animation: sm-flash .7s ease-out 2.4s both }
.sm-title { opacity: 0; --sm-rot: -5deg; animation: sm-pop .6s cubic-bezier(.2,1.5,.4,1) 3.1s both }
.sm-sub { opacity: 0; animation: sm-rise .5s ease-out 3.7s both }
.sm-pow { opacity: 0; --sm-rot: 8deg; animation: sm-pop .5s cubic-bezier(.2,1.5,.4,1) 3.35s both }
.sm-splash { opacity: 0; --sm-rot: -10deg; animation: sm-pop .5s cubic-bezier(.2,1.5,.4,1) 3.8s both }
.sm-hint { opacity: 0; animation: sm-rise .6s ease-out 5.3s both }
.sm-play { opacity: 0; --sm-rot: -2deg; animation: sm-pop .6s cubic-bezier(.2,1.5,.4,1) 4.6s both }
.sm-play:hover { filter: brightness(1.08) }

@media (prefers-reduced-motion: reduce) {
  .sm-rays, .sm-hero-float, .sm-cape { animation: none }
  .sm-man, .sm-bubble, .sm-zap, .sm-flash { animation: none; opacity: 0 }
  .sm-hero, .sm-title, .sm-sub, .sm-pow, .sm-splash, .sm-hint, .sm-play { animation: none; opacity: 1 }
  .sm-title { transform: rotate(-5deg) } .sm-pow { transform: rotate(8deg) } .sm-splash { transform: rotate(-10deg) }
}
`;

function RegularGuy() {
  return (
    <svg viewBox="0 0 300 380" className="sm-man absolute inset-0 h-full w-full" aria-hidden="true">
      <g transform="translate(0 20)">
        <rect x="112" y="255" width="34" height="75" rx="6" fill="#374151" />
        <rect x="154" y="255" width="34" height="75" rx="6" fill="#374151" />
        <rect x="104" y="322" width="46" height="14" rx="7" fill="#111827" />
        <rect x="150" y="322" width="46" height="14" rx="7" fill="#111827" />
        <rect x="78" y="132" width="24" height="112" rx="12" fill="#9ca3af" />
        <rect x="198" y="132" width="24" height="112" rx="12" fill="#9ca3af" />
        <circle cx="90" cy="248" r="12" fill="#f4c7a1" />
        <circle cx="210" cy="248" r="12" fill="#f4c7a1" />
        <rect x="100" y="125" width="100" height="140" rx="16" fill="#9ca3af" />
        <polygon points="128,125 172,125 150,190" fill="#ffffff" />
        <polygon points="146,140 154,140 158,200 150,216 142,200" fill="#dc2626" />
        <circle cx="150" cy="88" r="38" fill="#f4c7a1" stroke="#0f1f47" strokeWidth="3" />
        <path d="M112 80 Q116 42 150 44 Q184 42 188 80 Q170 62 150 66 Q130 62 112 80Z" fill="#78350f" />
        <circle cx="134" cy="88" r="11" fill="none" stroke="#111827" strokeWidth="3" />
        <circle cx="166" cy="88" r="11" fill="none" stroke="#111827" strokeWidth="3" />
        <line x1="145" y1="88" x2="155" y2="88" stroke="#111827" strokeWidth="3" />
        <circle cx="134" cy="89" r="3" fill="#111827" />
        <circle cx="166" cy="89" r="3" fill="#111827" />
        <path d="M138 108 Q150 114 162 108" fill="none" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" />
        <path d="M196 62 Q202 74 196 80 Q190 74 196 62Z" fill="#7dd3fc" />
      </g>
      <g className="sm-bubble">
        <rect x="6" y="4" width="168" height="38" rx="16" fill="#ffffff" stroke="#0f1f47" strokeWidth="3" />
        <polygon points="70,41 96,41 92,60" fill="#ffffff" stroke="#0f1f47" strokeWidth="3" strokeLinejoin="round" />
        <rect x="68" y="38" width="30" height="6" fill="#ffffff" />
        <text x="90" y="28" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f1f47" fontFamily={COMIC_FONT}>
          Just a regular guy...
        </text>
      </g>
    </svg>
  );
}

function SealmanHero() {
  return (
    <svg viewBox="0 0 300 380" className="sm-hero absolute inset-0 h-full w-full" aria-hidden="true">
      <g className="sm-hero-float">
        <g transform="translate(0 20)">
          <g className="sm-cape">
            <path d="M104 132 Q52 236 70 338 L150 304 L230 338 Q248 236 196 132 Z" fill="#dc2626" stroke="#0f1f47" strokeWidth="4" strokeLinejoin="round" />
            <path d="M150 140 L150 304" stroke="#991b1b" strokeWidth="4" opacity=".5" />
          </g>
          <rect x="112" y="255" width="34" height="62" rx="8" fill="#0303b8" stroke="#0f1f47" strokeWidth="3" />
          <rect x="154" y="255" width="34" height="62" rx="8" fill="#0303b8" stroke="#0f1f47" strokeWidth="3" />
          <rect x="106" y="308" width="46" height="26" rx="10" fill="#dc2626" stroke="#0f1f47" strokeWidth="3" />
          <rect x="148" y="308" width="46" height="26" rx="10" fill="#dc2626" stroke="#0f1f47" strokeWidth="3" />
          <rect x="100" y="125" width="100" height="140" rx="20" fill="#0303b8" stroke="#0f1f47" strokeWidth="4" />
          <rect x="100" y="238" width="100" height="14" fill="#facc15" stroke="#0f1f47" strokeWidth="3" />
          <circle cx="150" cy="182" r="29" fill="#facc15" stroke="#0f1f47" strokeWidth="4" />
          <text x="150" y="196" textAnchor="middle" fontSize="40" fontWeight="900" fill="#0303b8" fontFamily={COMIC_FONT}>
            S
          </text>
          <ellipse cx="76" cy="116" rx="15" ry="38" transform="rotate(28 76 116)" fill="#0303b8" stroke="#0f1f47" strokeWidth="3" />
          <ellipse cx="58" cy="70" rx="14" ry="19" fill="#0f1f47" />
          <ellipse cx="214" cy="170" rx="15" ry="36" transform="rotate(-16 214 170)" fill="#0303b8" stroke="#0f1f47" strokeWidth="3" />
          <ellipse cx="226" cy="204" rx="13" ry="13" fill="#0f1f47" />
          <ellipse cx="150" cy="86" rx="48" ry="42" fill="#0f1f47" stroke="#020617" strokeWidth="3" />
          <ellipse cx="150" cy="106" rx="28" ry="19" fill="#475569" />
          <ellipse cx="150" cy="97" rx="9" ry="6" fill="#020617" />
          <path d="M136 112 Q150 124 164 112" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <path d="M100 82 Q150 60 200 82 Q200 100 150 92 Q100 100 100 82Z" fill="#dc2626" stroke="#0f1f47" strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="132" cy="82" rx="10" ry="7" fill="#ffffff" />
          <ellipse cx="168" cy="82" rx="10" ry="7" fill="#ffffff" />
          <circle cx="134" cy="83" r="4" fill="#020617" />
          <circle cx="170" cy="83" r="4" fill="#020617" />
          <g stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round">
            <line x1="128" y1="108" x2="92" y2="100" />
            <line x1="128" y1="113" x2="92" y2="116" />
            <line x1="172" y1="108" x2="208" y2="100" />
            <line x1="172" y1="113" x2="208" y2="116" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Hidden easter egg: a regular guy turns into the SEALMAN superhero, comic style. */
export default function SealmanEasterEgg({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"intro" | "game">("intro");

  useEffect(() => {
    if (mode !== "intro") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const timer = window.setTimeout(onClose, AUTO_CLOSE_MS);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [mode, onClose]);

  if (mode === "game") return <SealmanGame onExit={onClose} />;

  return (
    <div
      role="dialog"
      aria-label="Sealman origin story"
      onClick={onClose}
      className="sm-overlay fixed inset-0 z-[100] flex cursor-pointer select-none flex-col items-center justify-center gap-4 overflow-hidden bg-[#0f1f47]"
    >
      <style>{STYLES}</style>

      <div
        className="sm-rays pointer-events-none absolute left-1/2 top-1/2 h-[220vmax] w-[220vmax] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "repeating-conic-gradient(from 0deg, rgba(31,157,255,.22) 0 7deg, transparent 7deg 14deg)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.35) 1.5px, transparent 1.6px)", backgroundSize: "16px 16px" }}
      />

      <div className="relative" style={{ height: "min(48vh, 456px)", aspectRatio: "300 / 380" }}>
        <RegularGuy />
        <SealmanHero />
        <Burst className="sm-zap absolute inset-[-10%] h-[120%] w-[120%]" text="ZAP!" fill="#facc15" rotate={-8} />
        <Burst className="sm-pow absolute -right-[22%] top-[2%] h-[36%] w-[36%]" text="POW!" fill="#f87171" rotate={10} />
        <Burst className="sm-splash absolute -left-[26%] bottom-[14%] h-[38%] w-[38%]" text="SPLASH!" fill="#7dd3fc" rotate={-12} />
      </div>

      <h2
        className="sm-title relative text-5xl font-black italic uppercase tracking-wide text-yellow-300 sm:text-7xl"
        style={{
          fontFamily: COMIC_FONT,
          WebkitTextStroke: "3px #0f1f47",
          paintOrder: "stroke fill",
          textShadow: "5px 5px 0 #dc2626",
        }}
      >
        Sealman!
      </h2>
      <p className="sm-sub relative text-sm font-bold uppercase tracking-[0.35em] text-white sm:text-base" style={{ fontFamily: COMIC_FONT }}>
        Half Man · Half Seal · All Hero
      </p>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setMode("game");
        }}
        className="sm-play relative rounded-xl border-4 border-[#0f1f47] bg-yellow-300 px-8 py-2 text-2xl font-black italic uppercase tracking-wider text-[#0f1f47] shadow-[6px_6px_0_#dc2626] focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-white"
        style={{ fontFamily: COMIC_FONT }}
      >
        Be a hero
      </button>
      <p className="sm-hint relative text-xs text-white/60">Click anywhere else to close</p>

      <div className="sm-flash pointer-events-none absolute inset-0 bg-white" />
    </div>
  );
}
