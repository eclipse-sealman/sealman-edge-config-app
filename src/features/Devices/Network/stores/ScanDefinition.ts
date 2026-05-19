import { ScanDefinition } from "@/generated/edge-administration/hooks/usePostModuleNetDiscover"
import { create } from "zustand"

export interface ScanDefinitionStore {
  networkDefinition: string
  subnetMask: number
  ports: number[]
  scanDefinition: ScanDefinition | undefined,
  setScanDefinition: (scanDefinition: ScanDefinition) => void,
  setNetworkPrefix: (networkPrefix: string) => void
  setSubnetMask: (subnetMask: number) => void
  addPort: (port: number) => void
  removePortByIndex: (port: number) => void
  clearAllPorts: () => void
  reset: () => void
}

// TODO ASK THOMAS: add default port of BnR
export const defaultTwinConfigPorts = [21, 22, 80, 443, 4840, 5900, 8080]

export default create<ScanDefinitionStore>((set) => {
  return {
    networkDefinition: "",
    subnetMask: 0,
    ports: defaultTwinConfigPorts,
    scanDefinition: undefined,
    setScanDefinition: (scanDefinition) => set({
      networkDefinition: scanDefinition.networkDefinition,
      subnetMask: scanDefinition.subnetMask,
      ports: scanDefinition.ports,
      scanDefinition
    }),
    setNetworkPrefix: (networkPrefix) => set({ networkDefinition: networkPrefix }),
    setSubnetMask: (subnetMask) => set({ subnetMask }),
    addPort: (port) => set((state) => ({ ports: [...state.ports, port]})),
    removePortByIndex: (index) => set((state) => ({ ports: state.ports.filter((_, i) => i !== index)})),
    clearAllPorts: () => set({ports: []}),
    reset: () => set(s => ({
      networkDefinition: s.scanDefinition?.networkDefinition,
      ports: s.scanDefinition?.ports,
      subnetMask: s.scanDefinition?.subnetMask
    }))
  }
})
