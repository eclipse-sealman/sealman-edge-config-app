import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Centered } from "@/features/Devices/Network/components";
import { useNetworkPageStore } from "@/features/Devices/Network/stores";
import usePostDeviceNetworkDiscover, { ScanResult } from "@/generated/edge-administration/hooks/network/usePostDeviceNetworkDiscover";
import usePostNetworkOverview, { NetworkOverview } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import useGetNetworkScanPorts from "@/generated/edge-administration/hooks/network/useGetNetworkScanPorts";
import useGetNetworkScanRange from "@/generated/edge-administration/hooks/network/useGetNetworkScanRange";
import DiscoveredEndpointsCard from "./DiscoveredEndpointsCard";
import UnidentifiedEndpointsCard from "./UnidentifiedEndpointsCard";
import ScanNetworkDialog, { ScanNetworkRange } from "./ScanNetworkDialog";
import EndpointDetailsPage from "./EndpointDetailsPage";
import ServiceDetailsPage from "./ServiceDetailsPage";

const BACKGROUND_REFRESH_INTERVAL_MS = 5000;

function mergeScanResults(primary: ScanResult[], additions: ScanResult[][]): ScanResult[] {
  const byIp = new Map<string, ScanResult>();
  for (const result of primary) byIp.set(result.ip, result);
  for (const group of additions) {
    for (const result of group) {
      if (!byIp.has(result.ip)) byIp.set(result.ip, result);
    }
  }
  return [...byIp.values()];
}

export default function OverviewContentContainer() {
  const deviceId = useNetworkPageStore((s) => s.deviceId);

  const { data: catalogPorts, isLoading: isLoadingPorts, isError: isPortsError, refetch: refetchPorts } = useGetNetworkScanPorts(deviceId);
  // The baseline scan range is derived server-side from known endpoint IPs (configured
  // instances + endpoint type defaults) - see get_network_scan_range.py. There is no default
  // entry: a fresh device with nothing known yet gets `undefined` here.
  const { data: scanRange, isLoading: isLoadingRange, isError: isRangeError, refetch: refetchRange } = useGetNetworkScanRange(deviceId);
  const { mutateAsync: discoverAsync } = usePostDeviceNetworkDiscover();
  const { mutateAsync: overviewAsync } = usePostNetworkOverview();

  const [overview, setOverview] = useState<NetworkOverview | undefined>(undefined);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [refreshToken, setRefreshToken] = useState(0);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [extraPorts, setExtraPorts] = useState<number[]>([]);
  const [extraIps, setExtraIps] = useState<string[]>([]);
  // A one-time custom range from the Scan Network dialog (e.g. via its "Read Network
  // Configuration" button) - not persisted, only affects this device's ongoing scan cycle until
  // changed again via the same dialog.
  const [extraRange, setExtraRange] = useState<ScanNetworkRange | null>(null);
  const [detailsEndpointId, setDetailsEndpointId] = useState<string | null>(null);
  const [detailsServiceId, setDetailsServiceId] = useState<string | null>(null);

  // Guards against a background tick starting a second overlapping scan while a full network
  // scan (which can genuinely take much longer than the 5s interval) is still in flight.
  const isScanInFlightRef = useRef(false);
  // Monotonically increasing id, one per scan attempt (foreground or background). A scan only
  // gets to apply its result if it's still the most recently *started* one by the time it
  // finishes - this is what actually prevents an out-of-order/slower response (e.g. a stale
  // scan still finishing after a newer one already completed) from overwriting fresher data,
  // which a simple "was this effect cleaned up" flag doesn't reliably catch: cleanup only marks
  // the old run as stale, it doesn't stop its in-flight request, and network responses can
  // arrive in a different order than they were sent.
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    if (!deviceId || isLoadingPorts || !catalogPorts || isLoadingRange) return;

    async function performScan(): Promise<NetworkOverview | null> {
      const ports = [...new Set([...(catalogPorts ?? []), ...extraPorts])];

      const rangesToScan = [...(scanRange ? [scanRange] : []), ...(extraRange ? [extraRange] : [])];

      if (rangesToScan.length === 0 && extraIps.length === 0) {
        // Nothing known/configured to scan yet - skip the network round-trip entirely and show
        // an empty result set instead of erroring (the user can add a range via Scan Network).
        return overviewAsync({
          deviceId,
          body: { scanResults: [], scanDefinition: { networkDefinition: "0.0.0.0", subnetMask: 32, ports } },
        });
      }

      const rangeScans = await Promise.all(
        rangesToScan.map((r) =>
          discoverAsync({ deviceId, body: { networkDefinition: r.networkDefinition, subnetMask: r.subnetMask, ports } })
        )
      );

      const ipScans = await Promise.all(
        extraIps.map((ip) => discoverAsync({ deviceId, body: { networkDefinition: ip, subnetMask: 32, ports } }))
      );

      const allScans = [...rangeScans, ...ipScans];
      const primaryScan = allScans.find((s) => s);
      if (!primaryScan) {
        // A scan call resolved without throwing but returned nothing usable - surface this as a
        // real failure (via the callers' catch blocks) rather than silently leaving `overview`
        // and `errorMessage` both unset, which would otherwise get stuck on the loading spinner
        // forever with no way to retry.
        throw new Error("Network scan returned no result");
      }

      const scanResults = mergeScanResults(
        primaryScan.payload.scanResults,
        allScans.filter((s) => s && s !== primaryScan).map((s) => s!.payload.scanResults)
      );

      return overviewAsync({ deviceId, body: { scanResults, scanDefinition: primaryScan.payload.scanDefinition } });
    }

    async function runForeground() {
      const requestId = ++latestRequestIdRef.current;
      isScanInFlightRef.current = true;
      setIsScanning(true);
      setErrorMessage(undefined);
      try {
        const mapped = await performScan();
        if (requestId !== latestRequestIdRef.current || !mapped) return;
        setOverview(mapped);
      } catch {
        if (requestId === latestRequestIdRef.current) {
          setErrorMessage("Failed to scan the network. Please try again.");
        }
      } finally {
        if (requestId === latestRequestIdRef.current) {
          isScanInFlightRef.current = false;
          setIsScanning(false);
        }
      }
    }

    async function runBackground() {
      if (isScanInFlightRef.current) return; // previous scan still running, skip this tick
      const requestId = ++latestRequestIdRef.current;
      isScanInFlightRef.current = true;
      try {
        const mapped = await performScan();
        if (requestId === latestRequestIdRef.current && mapped) setOverview(mapped);
      } catch {
        // Silent - keep showing the last good result, the next tick will retry.
      } finally {
        if (requestId === latestRequestIdRef.current) isScanInFlightRef.current = false;
      }
    }

    runForeground();
    const interval = setInterval(runBackground, BACKGROUND_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, isLoadingPorts, catalogPorts, isLoadingRange, scanRange, extraRange, extraPorts, extraIps, refreshToken]);

  const handleRefresh = () => {
    setOverview(undefined);
    setRefreshToken((t) => t + 1);
  };

  const handleConfirmScan = (newRange: ScanNetworkRange | null, newExtraPorts: number[], newExtraIps: string[]) => {
    setExtraRange(newRange);
    setExtraPorts(newExtraPorts);
    setExtraIps(newExtraIps);
    handleRefresh();
  };

  // Checked before the scan-pipeline's own loading/error states, since the details pages fetch
  // their own data independently and shouldn't be blocked by those.
  if (detailsServiceId) {
    return (
      <div className="pt-2 pb-8 min-h-full">
        <ServiceDetailsPage
          serviceId={detailsServiceId}
          onBack={() => setDetailsServiceId(null)}
          onUpdated={handleRefresh}
        />
      </div>
    );
  }

  if (detailsEndpointId) {
    return (
      <div className="pt-2 pb-8 min-h-full">
        <EndpointDetailsPage
          endpointId={detailsEndpointId}
          onBack={() => setDetailsEndpointId(null)}
          onOpenServiceDetails={setDetailsServiceId}
          onUpdated={handleRefresh}
        />
      </div>
    );
  }

  if (isLoadingPorts || isLoadingRange) {
    return (
      <Centered>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" /> Scanning network...
        </p>
      </Centered>
    );
  }

  if (isPortsError || isRangeError) {
    return (
      <Centered>
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-destructive">Failed to determine what to scan for this device.</p>
          <Button
            variant="outline"
            onClick={() => {
              if (isPortsError) refetchPorts();
              if (isRangeError) refetchRange();
            }}
          >
            Retry
          </Button>
        </div>
      </Centered>
    );
  }

  // Derived from `overview` itself (not the `isScanning` flag) so there's no render where the
  // effect hasn't committed `isScanning` yet but we still show a stale/empty result set instead
  // of a loading state.
  if (!overview && !errorMessage) {
    return (
      <Centered>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" /> Scanning network...
        </p>
      </Centered>
    );
  }

  if (errorMessage) {
    return (
      <Centered>
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-destructive">{errorMessage}</p>
          <Button variant="outline" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      </Centered>
    );
  }

  const endpoints = overview?.endpoints ?? [];
  const discovered = endpoints.filter((e) => e.source !== "unidentified");
  const unidentified = endpoints.filter((e) => e.source === "unidentified");

  return (
    <div className="grid gap-4 pt-2">
      <DiscoveredEndpointsCard
        endpoints={discovered}
        deviceId={deviceId}
        onScan={() => setScanDialogOpen(true)}
        isScanning={isScanning}
        onEndpointCreated={handleRefresh}
        onOpenDetails={setDetailsEndpointId}
      />
      <UnidentifiedEndpointsCard endpoints={unidentified} deviceId={deviceId} onEndpointCreated={handleRefresh} />

      <ScanNetworkDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        extraPorts={extraPorts}
        extraIps={extraIps}
        onConfirm={handleConfirmScan}
      />
    </div>
  );
}
