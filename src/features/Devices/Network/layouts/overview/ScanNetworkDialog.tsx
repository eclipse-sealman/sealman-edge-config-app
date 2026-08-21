import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, RefreshCw, Search, X } from "lucide-react";
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
import { useNetworkPageStore } from "@/features/Devices/Network/stores";
import useReadNetworkDefinition from "@/features/Devices/Network/components/read_network_definition/useReadNetworkDefinition";

const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

export interface ScanNetworkRange {
  networkDefinition: string;
  subnetMask: number;
}

interface props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraPorts: number[];
  extraIps: string[];
  /** Every port currently scanned automatically, regardless of range/IP - shown read-only. */
  autoPorts: number[];
  /** Lifted up to the parent (rather than kept as local state here) so a "Read Network
   * Configuration" result - or anything typed by hand - survives closing and reopening this
   * dialog, instead of resetting to blank every time. */
  networkInput: string;
  maskInput: string;
  onNetworkInputChange: (value: string) => void;
  onMaskInputChange: (value: string) => void;
  onConfirm: (range: ScanNetworkRange | null, extraPorts: number[], extraIps: string[]) => void;
}

/**
 * A custom scan on top of whatever's already automatically scanned (the baseline range derived
 * from known endpoint IPs, plus the global/device default ports). The network range and
 * individual endpoints below only affect this one-time scan and are never persisted - useful for
 * reaching a device outside the known range so it can be assigned. Additional ports, however,
 * ARE persisted for this device (see `onConfirm`'s caller) - once added, they're scanned
 * automatically on every future cycle too, not just this one.
 */
export default function ScanNetworkDialog({
  open,
  onOpenChange,
  extraPorts,
  extraIps,
  autoPorts,
  networkInput,
  maskInput,
  onNetworkInputChange,
  onMaskInputChange,
  onConfirm,
}: props) {
  const deviceId = useNetworkPageStore((s) => s.deviceId);
  const { readNetwork, isReading } = useReadNetworkDefinition(deviceId);

  const [ports, setPorts] = useState<number[]>(extraPorts);
  const [ips, setIps] = useState<string[]>(extraIps);
  const [portInput, setPortInput] = useState("");
  const [ipInput, setIpInput] = useState("");

  useEffect(() => {
    if (!open) return;
    setPorts(extraPorts);
    setIps(extraIps);
    setPortInput("");
    setIpInput("");
  }, [open, extraPorts, extraIps]);

  const handleReadNetworkConfig = async () => {
    const network = await readNetwork();
    if (!network) return;
    onNetworkInputChange(network.address);
    onMaskInputChange(String(network.mask));
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
    const network = networkInput.trim();
    const mask = maskInput.trim();

    // A port/IP typed into its input but not yet committed via "+"/Enter would otherwise be
    // silently dropped from the scan - commit it here too, same validation as `addPort`/`addIp`.
    let finalPorts = ports;
    if (portInput.trim() !== "") {
      const port = Number(portInput);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        toast.error("Enter a valid port (1-65535)");
        return;
      }
      finalPorts = ports.includes(port) ? ports : [...ports, port];
    }

    let finalIps = ips;
    if (ipInput.trim() !== "") {
      const ip = ipInput.trim();
      if (!IPV4_PATTERN.test(ip)) {
        toast.error("Enter a valid IPv4 address");
        return;
      }
      finalIps = ips.includes(ip) ? ips : [...ips, ip];
    }

    if (!network && !mask) {
      onConfirm(null, finalPorts, finalIps);
      onOpenChange(false);
      return;
    }

    if (!IPV4_PATTERN.test(network)) {
      toast.error("Enter a valid network address (e.g. 172.22.220.0)");
      return;
    }
    const maskNum = Number(mask);
    if (!Number.isInteger(maskNum) || maskNum < 1 || maskNum > 32) {
      toast.error("Enter a valid subnet mask (1-32)");
      return;
    }

    onConfirm({ networkDefinition: network, subnetMask: maskNum }, finalPorts, finalIps);
    onOpenChange(false);
  };

  const hasAutoScanned = autoPorts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan Network</DialogTitle>
          <DialogDescription>
            Run a one-time scan for a network range or individual IP addresses, on top of what's already scanned
            automatically. Additional ports are saved permanently for this device and scanned automatically going
            forward. Useful for reaching a device so you can assign it - once assigned, its IP is scanned
            automatically going forward too.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasAutoScanned && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Automatically scanned ports</label>
              <div className="flex flex-wrap gap-2">
                {autoPorts.map((port) => (
                  <Badge key={port} variant="outline" className="gap-1">
                    {port}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Network range for this scan</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReadNetworkConfig}
                disabled={isReading || !deviceId}
              >
                <RefreshCw className={isReading ? "animate-spin" : ""} /> Read Network Configuration
              </Button>
            </div>
            {/* Fixed width on the mask column, not `auto` - `inputClass` already sets `w-full` on
                the input itself, which only resolves to something sane against a definite-width
                column (an `auto` track sized by an already-100%-wide child is a circular/degenerate
                case that collapses to a sliver in most browsers). */}
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <input
                type="text"
                value={networkInput}
                onChange={(e) => onNetworkInputChange(e.target.value)}
                placeholder="e.g. 172.22.220.0"
                className={`${inputClass} h-9`}
              />
              <input
                type="number"
                min={1}
                max={32}
                value={maskInput}
                onChange={(e) => onMaskInputChange(e.target.value)}
                placeholder="e.g. 24"
                className={`${inputClass} h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-medium text-muted-foreground">
              Additional ports for scan <span className="font-normal">(saved permanently for this device)</span>
            </label>
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
            <label className="text-xs font-medium text-muted-foreground">Additional endpoints for scan</label>
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
