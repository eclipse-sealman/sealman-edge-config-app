import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";

export interface SmartEMSStatus {
  configUpdateScheduled: boolean;
  deviceEnabled: boolean;
  deviceHardwareVersion: string;
  deviceFirmwareVersion: string;
  deviceTemplate: string;
  firmwareUpdateScheduled: boolean;
  edgeCommandStatus: {
    cmdName: string;
    created: string;
    status: string;
    updated: string;
  }[];
}

// The 3s polling lets the UI notice when a saved setting is waiting to be activated.
export default function useSmartEmsStatusPolling(deviceId: string | undefined) {
  return useQuery<SmartEMSStatus, AxiosError>({
    queryKey: ["getSmartEmsStatus", deviceId],
    queryFn: () => edgeConfigApi.getSmartEmsStatus(deviceId),
    refetchInterval: 3000,
  });
}
