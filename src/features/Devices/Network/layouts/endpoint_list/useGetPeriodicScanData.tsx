import { ScanResult } from "@/generated/edge-administration/hooks/network/usePostDeviceNetworkDiscover";
import useGetNetworkTopology from "@/generated/edge-administration/hooks/useGetNetworkTopology";
import { useEffect, useRef, useState } from "react";

const timeout = 10000
const refetchFrequency = 1000

interface useGetPeriodicScanData {
  scanResults: ScanResult[]
  isLoading: boolean
}

export function useGetPeriodicScanData(deviceId: string): useGetPeriodicScanData {
  const { data, refetch, isLoading } = useGetNetworkTopology(deviceId);
  const refetchIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ isRefetchingInitialScan, setIsRefetchingInitialScan ] = useState(true)

  useEffect(() => {
    const startTime = Date.now();

    const handleRefetch = () => {
      const elapsedTime = Date.now() - startTime;

      if (elapsedTime >= timeout) {
        if (refetchIntervalRef.current) {
          clearInterval(refetchIntervalRef.current);
          refetchIntervalRef.current = null;
        }
      } else {
        refetch();
      }
    }

    // null means fetched but scan not yet set up, undefined means not fetched
    if (data === null || data === undefined) {
      refetchIntervalRef.current = setInterval(handleRefetch, refetchFrequency)
    } else {
      setIsRefetchingInitialScan(false)
    }

    return () => {
      if (refetchIntervalRef.current) {
        clearInterval(refetchIntervalRef.current);
        refetchIntervalRef.current = null;
      }
    };
  }, [data, refetch]);

  return {
    scanResults: data?.scanResults ?? [],
    isLoading: isLoading || isRefetchingInitialScan
  }
}
