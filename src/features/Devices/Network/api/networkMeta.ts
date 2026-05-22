import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi"

let api = {
  getEndpointTypes: edgeConfigApi.getEndpointTypes,
  getServices: edgeConfigApi.getServicePorts,
}

export function __setNetworkMetaApi(mockApi: typeof api) {
  api = mockApi
}

export function __resetNetworkMeta() {
  endpointTypesCache = null
  servicesCache = null
  metaLoaded = false
}


let endpointTypesCache: any[] | null = null
let servicesCache: any[] | null = null
let metaLoaded = false

export async function loadNetworkMeta() {
  if (metaLoaded) return

  const [typesRes, servicesRes] = await Promise.all([
  api.getEndpointTypes(),
  api.getServices(),
])

  endpointTypesCache = typesRes.data?.types ?? []
  servicesCache = servicesRes.data?.services ?? []
  metaLoaded = true
}

export function isMetaLoaded() {
  return metaLoaded
}

export function getEndpointTypes() {
  return endpointTypesCache ?? []
}

export function getServices() {
  return servicesCache ?? []
}

