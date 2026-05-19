import { UseQueryResult } from "@tanstack/react-query"
import { components } from "../../types"
import { NetworkDiscover } from "../useGetNetworkTopology"

const scanResults: components["schemas"]["EndpointStatus"][] = [
  {
    "ip": "192.168.0.139",
    "status": "online",
    "lastStatusChange": "2025-02-24T08:50:27.606527+00:00",
    "ports": {
      "80": {
        "status": "offline",
        "lastStatusChange": "2025-02-14T16:06:01.713923+00:00"
      },
      "8017": {
        "status": "online",
        "lastStatusChange": "2025-02-24T08:50:27.606527+00:00"
      }
    }
  }
]

const createMockedScanDefinition = (p?: Partial<NetworkDiscover>): NetworkDiscover => ({
  networkDefinition: "",
  ports: [],
  subnetMask: 0,
  ...p
})

export function createMockedData(p?: Partial<typeof data>): typeof data{
  return {
    scanDefinition: createMockedScanDefinition(),
    scanResults: [createMockedScanResult()],
    ...p
  }
}

export function createMockedScanResult(p?: Partial<components["schemas"]["EndpointStatus"]>): components["schemas"]["EndpointStatus"]  {
  return {
    ip: "",
    ports: {},
    status: "unknown",
    lastStatusChange: "",
    ...p
  }
}

const scanDefinition: NetworkDiscover = {
  "networkDefinition": "192.168.0.0",
  "ports": [
    9090,
    9443,
    4840,
    5900,
    8079,
    80,
    8080,
    8017,
    21,
    443
  ],
  "subnetMask": 24
}

const data = {
  scanResults,
  scanDefinition
}

const useGetNetworkTopologyMocked = vi.fn(() => {
  return {
    data,
    isLoading: false,
    refetch: vi.fn()
  } as Partial<UseQueryResult<typeof data | null>>
})

export default useGetNetworkTopologyMocked
