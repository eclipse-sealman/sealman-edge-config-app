import { useId } from "react";
import { cn } from "@/lib/utils";

interface WaterLoaderProps {
  className?: string;
  /** Accessible name; the loader is decorative (hidden from screen readers) when omitted. */
  label?: string;
}

/** The one loading animation: a glass of water whose level sways while waves roll across it. */
export function WaterLoader({ className, label }: WaterLoaderProps) {
  const clipId = useId();

  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("water-loader h-6 w-6 shrink-0 text-vibrant-blue", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="20" cy="20" r="16.5" />
        </clipPath>
      </defs>
      <circle cx="20" cy="20" r="16.5" fill="currentColor" opacity="0.08" />
      <g clipPath={`url(#${clipId})`}>
        <g className="wl-level">
          <path
            className="wl-wave-back"
            fill="currentColor"
            opacity="0.4"
            d="M0 20 Q10 14 20 20 T40 20 T60 20 T80 20 T100 20 V60 H0 Z"
          />
          <path
            className="wl-wave-front"
            fill="currentColor"
            d="M0 22 Q10 16 20 22 T40 22 T60 22 T80 22 T100 22 V60 H0 Z"
          />
        </g>
      </g>
      <circle cx="20" cy="20" r="16.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
