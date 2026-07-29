import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { inputClass } from "@/features/PlatformTypes/FieldValueInput";

const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

export interface ScanNetworkRange {
  networkDefinition: string;
  subnetMask: number;
}

function rangeKey(range: ScanNetworkRange): string {
  return `${range.networkDefinition}/${range.subnetMask}`;
}

interface props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ranges: ScanNetworkRange[];
  extraPorts: number[];
  extraIps: string[];
  onConfirm: (ranges: ScanNetworkRange[], extraPorts: number[], extraIps: string[]) => void;
}

export default function ScanNetworkDialog({ open, onOpenChange, ranges, extraPorts, extraIps, onConfirm }: props) {
  const [rangeList, setRangeList] = useState<ScanNetworkRange[]>(ranges);
  const [networkInput, setNetworkInput] = useState("");
  const [maskInput, setMaskInput] = useState("24");
  const [ports, setPorts] = useState<number[]>(extraPorts);
  const [ips, setIps] = useState<string[]>(extraIps);
  const [portInput, setPortInput] = useState("");
  const [ipInput, setIpInput] = useState("");

  useEffect(() => {
    if (!open) return;
    setRangeList(ranges);
    setNetworkInput("");
    setMaskInput("24");
    setPorts(extraPorts);
    setIps(extraIps);
    setPortInput("");
    setIpInput("");
  }, [open, ranges, extraPorts, extraIps]);

  const addRange = () => {
    const network = networkInput.trim();
    if (!IPV4_PATTERN.test(network)) {
      toast.error("Enter a valid network address (e.g. 172.22.220.0)");
      return;
    }
    const mask = Number(maskInput);
    if (!Number.isInteger(mask) || mask < 1 || mask > 32) {
      toast.error("Enter a valid subnet mask (1-32)");
      return;
    }
    const next = { networkDefinition: network, subnetMask: mask };
    if (!rangeList.some((r) => rangeKey(r) === rangeKey(next))) setRangeList([...rangeList, next]);
    setNetworkInput("");
    setMaskInput("24");
  };

  const addPort = () => {
    const port = Number(portInput);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      toast.error("Enter a valid port (1-65535)");
      return;
    }
    if (!ports.includes(port)) setPorts([...ports, port]);
    setPortInput("");
  };

  const addIp = () => {
    const ip = ipInput.trim();
    if (!IPV4_PATTERN.test(ip)) {
      toast.error("Enter a valid IPv4 address");
      return;
    }
    if (!ips.includes(ip)) setIps([...ips, ip]);
    setIpInput("");
  };

  const handleConfirm = () => {
    onConfirm(rangeList, ports, ips);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan Network</DialogTitle>
          <DialogDescription>
            Optionally add extra network ranges, ports, or individual IP addresses to scan on top of the ones
            already known from your endpoint/service catalog.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Additional network ranges</label>
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <input
                type="text"
                value={networkInput}
                onChange={(e) => setNetworkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRange();
                  }
                }}
                placeholder="e.g. 10.0.0.0"
                className={`${inputClass} h-9`}
              />
              <input
                type="number"
                min={1}
                max={32}
                value={maskInput}
                onChange={(e) => setMaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRange();
                  }
                }}
                className={`${inputClass} h-9 w-20`}
              />
              <Button type="button" variant="outline" onClick={addRange} className="shrink-0">
                <Plus />
              </Button>
            </div>
            {rangeList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {rangeList.map((range) => (
                  <Badge key={rangeKey(range)} variant="secondary" className="gap-1">
                    {range.networkDefinition}/{range.subnetMask}
                    <button
                      type="button"
                      onClick={() => setRangeList(rangeList.filter((r) => rangeKey(r) !== rangeKey(range)))}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-medium text-muted-foreground">Additional ports</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={portInput}
                onChange={(e) => setPortInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPort();
                  }
                }}
                placeholder="e.g. 502"
                className={`${inputClass} h-9`}
              />
              <Button type="button" variant="outline" onClick={addPort} className="shrink-0">
                <Plus />
              </Button>
            </div>
            {ports.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ports.map((port) => (
                  <Badge key={port} variant="secondary" className="gap-1">
                    {port}
                    <button type="button" onClick={() => setPorts(ports.filter((p) => p !== port))}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Additional IP addresses</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIp();
                  }
                }}
                placeholder="e.g. 10.0.0.5"
                className={`${inputClass} h-9`}
              />
              <Button type="button" variant="outline" onClick={addIp} className="shrink-0">
                <Plus />
              </Button>
            </div>
            {ips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ips.map((ip) => (
                  <Badge key={ip} variant="secondary" className="gap-1">
                    {ip}
                    <button type="button" onClick={() => setIps(ips.filter((x) => x !== ip))}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <Search /> Scan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
