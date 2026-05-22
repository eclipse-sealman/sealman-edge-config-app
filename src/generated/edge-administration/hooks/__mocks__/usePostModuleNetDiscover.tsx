import { NetworkDiscoverModuleConfigV1, ScanDefinition } from "../usePostModuleNetDiscover"

export const postNetDiscoverModuleMocked = vi.fn()

export const createScanDefinition = (p?: Partial<ScanDefinition>): ScanDefinition => ({
  networkDefinition: "",
  ports: [],
  subnetMask: 0,
  ...p,
})

export const createNetworkDiscoverModuleConfigV1 = (p?:Partial<NetworkDiscoverModuleConfigV1>): NetworkDiscoverModuleConfigV1 => ({
  endpointNames: {},
  scanDefinition: createScanDefinition(),
  scheduledCron: "* * * * *",
  ...p,
})

export const usePostModuleNetDiscover = vi.fn(() => {
  return {
    PostNetDiscoverModule: postNetDiscoverModuleMocked
  }
})
