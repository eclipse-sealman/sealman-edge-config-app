import { WaterLoader } from "@/components/ui/water-loader";

interface SpinnerProps {
  processing?: boolean;
  className?: string;
}

/** Reserves its space and shows the water loader only while `processing`. */
export default function Spinner({ processing, className }: SpinnerProps) {
  return <WaterLoader className={`${processing ? "" : "invisible"} ${className ?? ""}`} />;
}
