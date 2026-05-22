import { create } from "zustand";

export interface EdgeDeviceServicesStore {
  isconnected: boolean;
  setIsConnected: (v: boolean) => void;
  ipAddress?: string;
  setIpAddress: (ip: string | undefined) => void;
}

export default create<EdgeDeviceServicesStore>(set => ({
  isconnected: false,
  setIsConnected: (v: boolean) => set({ isconnected: v }),
  ipAddress: undefined,
  setIpAddress: (ip: string | undefined) => set({ ipAddress: ip }),
}))
