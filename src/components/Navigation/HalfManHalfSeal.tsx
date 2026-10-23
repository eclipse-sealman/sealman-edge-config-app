import { useCallback, useState } from "react";
import SealmanEasterEgg from "./SealmanEasterEgg";

export default function HalfManHalfSeal() {
  const [playing, setPlaying] = useState(false);
  const close = useCallback(() => setPlaying(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="flex cursor-default items-center gap-2 rounded text-[11px] font-bold uppercase tracking-[0.3em] select-none focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Half man, half seal"
      >
        <span className="text-night-blue">Half Man</span>
        <span className="h-2.5 w-2.5 rounded-full border-2 border-active-blue" aria-hidden="true" />
        <span className="bg-linear-to-r from-active-blue to-teal-500 bg-clip-text text-transparent">Half Seal</span>
      </button>
      {playing && <SealmanEasterEgg onClose={close} />}
    </>
  );
}
