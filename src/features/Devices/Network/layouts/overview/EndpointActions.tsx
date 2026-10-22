import type { ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";

interface props {
  onScan: () => void;
  isScanning: boolean;
  onAddEndpoint: () => void;
  /** Rendered before the buttons, e.g. the view toggle. */
  leading?: ReactNode;
}

/** "Scan Network" and "Add Endpoint" - the same actions in the list and the canvas view. */
export default function EndpointActions({ onScan, isScanning, onAddEndpoint, leading }: props) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {leading}
      <Button variant="outline" onClick={onScan} disabled={isScanning}>
        {isScanning ? <WaterLoader /> : <Search />}
        {isScanning ? "Scanning..." : "Scan Network"}
      </Button>
      <Button variant="outline" onClick={onAddEndpoint}>
        <Plus /> Add Endpoint
      </Button>
    </div>
  );
}
