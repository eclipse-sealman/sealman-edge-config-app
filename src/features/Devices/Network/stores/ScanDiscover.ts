import { ScanResult } from "@/generated/edge-administration/hooks/network/usePostDeviceNetworkDiscover"
import { create } from "zustand"

export interface ScanDiscover {
  isScanning: boolean
  setScanning: (scanning: boolean) => void
  scanResults: ScanResult[]
  setScanResults: (scanResults: ScanResult[]) => void
}

// TODO @Alexis change the way we are using the store: no destructuring !!
export default create<ScanDiscover>((set) => ({
  isScanning: false,
  setScanning: (scanning) => set({isScanning: scanning}),
  scanResults: [],
  setScanResults: (scanResults) => set({scanResults})
}))
