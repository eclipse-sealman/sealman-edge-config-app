import { create } from "zustand";

export interface NetworkPageStore {
  deviceId: string
  setDeviceId: (device: string) => void
  selectedEndpointIp: string | undefined;
  setSelectedEndpointIp: (ip: string | undefined) => void;
  periodicScanDateTime: Date | undefined
  setPeriodicScanDateTime: (d: Date) => void
  displayEdgeDevice: boolean
  setDisplayEdgeDevice: (b: boolean) => void
  displayNetworkScanSetup: boolean
  setDisplayNetworkScanSetup: (b: boolean) => void
}

export default create<NetworkPageStore>(set => ({
  deviceId: "",
  setDeviceId: (deviceId) => set({ deviceId }),
  selectedEndpointIp: undefined,
  setSelectedEndpointIp: (ip) => set({ selectedEndpointIp: ip }),
  periodicScanDateTime: undefined,
  setPeriodicScanDateTime: (d) => set({periodicScanDateTime: d}),
  displayEdgeDevice: false,
  setDisplayEdgeDevice: (b) => set({displayEdgeDevice: b}),
  displayNetworkScanSetup: false,
  setDisplayNetworkScanSetup: (b) => set({displayNetworkScanSetup: b}),
}))
