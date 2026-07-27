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
import ScanNetworkDialog from "./ScanNetworkDialog";
import EndpointDetailsPage from "./EndpointDetailsPage";
import ServiceDetailsPage from "./ServiceDetailsPage";

const BACKGROUND_REFRESH_INTERVAL_MS = 3000;

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
  // The network range to scan is derived server-side from known endpoint IPs (configured
  // instances + endpoint type defaults), not a hardcoded range - see get_network_scan_range.py.
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
  const [detailsEndpointId, setDetailsEndpointId] = useState<string | null>(null);
  const [detailsServiceId, setDetailsServiceId] = useState<string | null>(null);

  // Guards against a background tick starting a second overlapping scan while a full network
  // scan (which can genuinely take much longer than the 3s interval) is still in flight.
  const isScanInFlightRef = useRef(false);

  useEffect(() => {
    if (!deviceId || !catalogPorts || !scanRange) return;

    let cancelled = false;

    async function performScan(): Promise<NetworkOverview | null> {
      const ports = [...new Set([...(catalogPorts ?? []), ...extraPorts])];

      const mainScan = await discoverAsync({
        deviceId,
        body: { networkDefinition: scanRange!.networkDefinition, subnetMask: scanRange!.subnetMask, ports },
      });
      if (cancelled || !mainScan) return null;

      const extraScans = await Promise.all(
        extraIps.map((ip) => discoverAsync({ deviceId, body: { networkDefinition: ip, subnetMask: 32, ports } }))
      );
      if (cancelled) return null;

      const scanResults = mergeScanResults(
        mainScan.payload.scanResults,
        extraScans.map((s) => s?.payload.scanResults ?? [])
      );

      return overviewAsync({ deviceId, body: { scanResults, scanDefinition: mainScan.payload.scanDefinition } });
    }

    async function runForeground() {
      isScanInFlightRef.current = true;
      setIsScanning(true);
      setErrorMessage(undefined);
      try {
        const mapped = await performScan();
        if (cancelled || !mapped) return;
        setOverview(mapped);
      } catch {
        if (!cancelled) {
          setErrorMessage("Failed to scan the network. Please try again.");
        }
      } finally {
        isScanInFlightRef.current = false;
        if (!cancelled) setIsScanning(false);
      }
    }

    async function runBackground() {
      if (isScanInFlightRef.current) return; // previous scan still running, skip this tick
      isScanInFlightRef.current = true;
      try {
        const mapped = await performScan();
        if (!cancelled && mapped) setOverview(mapped);
      } catch {
        // Silent - keep showing the last good result, the next tick will retry.
      } finally {
        isScanInFlightRef.current = false;
      }
    }

    runForeground();
    const interval = setInterval(runBackground, BACKGROUND_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, catalogPorts, scanRange, extraPorts, extraIps, refreshToken]);

  const handleRefresh = () => {
    setOverview(undefined);
    setRefreshToken((t) => t + 1);
  };

  const handleConfirmScan = (newExtraPorts: number[], newExtraIps: string[]) => {
    setExtraPorts(newExtraPorts);
    setExtraIps(newExtraIps);
    handleRefresh();
  };

  // Checked before the scan-pipeline's own loading/error states, since the details pages fetch
  // their own data independently and shouldn't be blocked by those.
  if (detailsServiceId) {
    return (
      <div className="pt-2">
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
      <div className="pt-2">
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
