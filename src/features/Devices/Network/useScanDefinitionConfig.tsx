import { createContext, useEffect, useState } from "react";
import { ScanDefinition } from "@/api/edgeConfig/networkDiscover/networkDiscoverInterfaces";

// TODO ASK THOMAS: add default port of BnR
const defaultPorts = [22, 80, 443, 4840, 5900, 8080]

export interface UseScanDefinitionConfig {
  networkPrefix: string | undefined;
  subnet: number,
  ports: number[],
  updateNetworkPrefix: (networkPrefix: string) => void;
  updateSubnetMask: (subnetMask: number) => void;
  addPort: (port: number) => void;
  removePort: (port: number) => void;
  removeAllPorts: () => void;
  reset: () => void
}

export const ScanDefinitionCtx = createContext({} as UseScanDefinitionConfig)

// TODO REFACTOR: When the save button gets clicked for the scan definition config,
// we want to only call the post endpoint with this part of the config
export default function useScanDefinitionConfig(
  scanDefinition: ScanDefinition | undefined,
): UseScanDefinitionConfig {
  const [networkPrefix, setNetworkPrefix] = useState<string>(scanDefinition?.networkDefinition ?? "")
  const [subnet, setSubnet] = useState<number>(scanDefinition?.subnetMask ?? 0)
  const [ports, setPorts] = useState<number[]>(scanDefinition?.ports ?? defaultPorts )

  const addPort = (port: number) => {
    setPorts([...ports, port])
  }

  const removePort = (port: number) => {
    setPorts(ports.filter(p => p !== port))
  }

  const removeAllPorts = () => {
    setPorts([])
  }

  const reset = () => {
    setNetworkPrefix(scanDefinition?.networkDefinition ?? "")
    setSubnet(scanDefinition?.subnetMask ?? 0)
    setPorts(scanDefinition?.ports ?? [])
  }

  useEffect(() => {
    if (!scanDefinition) {
      return
    }
    setNetworkPrefix(scanDefinition.networkDefinition)
    setSubnet(scanDefinition.subnetMask)
    setPorts(scanDefinition.ports)
  }, [scanDefinition])

  return {
    networkPrefix,
    subnet,
    ports,
    updateNetworkPrefix: setNetworkPrefix,
    updateSubnetMask: setSubnet,
    addPort,
    removePort,
    removeAllPorts,
    reset,
  }
}
