import { UseQueryResult } from "@tanstack/react-query"
import { NetworkDiscoverTwinConfig, ScanDefinition } from "../../../../api/edgeConfig/networkDiscover/networkDiscoverInterfaces"

const data: NetworkDiscoverTwinConfig = {
  "scheduledCron": "* * * * *",
  "scanDefinition": {
    "networkDefinition": "172.22.220.0",
    "subnetMask": 23,
    "ports": [
      443,
    ]
  },
  "endpointNames": {
    "172.22.220.130": {
      "name": "OptiSlicer",
      "serviceNames": {
        "21": "FTP Server",
        "4840": "OPC-UA Server",
        "5900": "VNC Server"
      }
    }
  }
}

export const createScanDefinition = (p?: Partial<ScanDefinition>): ScanDefinition => ({
  networkDefinition: "",
  ports: [],
  subnetMask: 0,
  ...p
})

export const createData = (p?: Partial<NetworkDiscoverTwinConfig>): NetworkDiscoverTwinConfig => ({
  endpointNames: {},
  scanDefinition: createScanDefinition(),
  scheduledCron: "",
  ...p,
})

const useGetModuleTwinConfigMocked = vi.fn(() => {
  return {
    data
  } as Partial<UseQueryResult<typeof data | undefined>>
})

export default useGetModuleTwinConfigMocked
