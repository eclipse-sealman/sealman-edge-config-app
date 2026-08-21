import { client } from "@/generated/edge-administration/api"
import type { components } from "@/generated/edge-administration/types"

type EndpointTypeResponse = components["schemas"]["EndpointTypeResponse"]
type ServiceTypeResponse = components["schemas"]["ServiceTypeResponse"]
type FieldDefinition = components["schemas"]["FieldDefinition"]

export type EndpointTypeMeta = {
  name: string
  description: string | null
  defaultIP: string | null
}

export type ServiceMeta = {
  deviceEndpointServiceName: string
  description: string | null
  defaultPort: string | null
}

let api = {
  getEndpointTypes: () => client.GET("/endpoint-types"),
  getServiceTypes: () => client.GET("/service-types"),
}

export function __setNetworkMetaApi(mockApi: typeof api) {
  api = mockApi
}

export function __resetNetworkMeta() {
  endpointTypesCache = null
  servicesCache = null
  metaLoaded = false
}


let endpointTypesCache: EndpointTypeMeta[] | null = null
let servicesCache: ServiceMeta[] | null = null
let metaLoaded = false

// Mirrors routers/network_discovery/mapping_helpers.py:role_field_key - finds the field a type's
// `mapping` designates for a given semantic role (e.g. "ip", "port").
function roleFieldKey(
  fields: Record<string, FieldDefinition> | undefined,
  mapping: Record<string, string> | undefined,
  role: string,
): string | null {
  for (const [fieldKey, mappedRole] of Object.entries(mapping ?? {})) {
    if (typeof mappedRole === "string" && mappedRole.trim().toLowerCase() === role && fields && fieldKey in fields) {
      return fieldKey
    }
  }
  return null
}

function defaultForRole(
  fields: Record<string, FieldDefinition> | undefined,
  mapping: Record<string, string> | undefined,
  role: string,
): string | null {
  const fieldKey = roleFieldKey(fields, mapping, role)
  if (fieldKey === null) return null
  const value = fields?.[fieldKey]?.default
  return value === null || value === undefined ? null : String(value)
}

function toEndpointTypeMeta(type: EndpointTypeResponse): EndpointTypeMeta {
  return {
    name: type.label,
    description: type.description ?? null,
    defaultIP: defaultForRole(type.fields, type.mapping, "ip"),
  }
}

function toServiceMeta(type: ServiceTypeResponse): ServiceMeta {
  return {
    deviceEndpointServiceName: type.label,
    description: type.description ?? null,
    defaultPort: defaultForRole(type.fields, type.mapping, "port"),
  }
}

export async function loadNetworkMeta() {
  if (metaLoaded) return

  const [typesRes, servicesRes] = await Promise.all([
    api.getEndpointTypes(),
    api.getServiceTypes(),
  ])

  endpointTypesCache = (typesRes.data ?? []).map(toEndpointTypeMeta)
  servicesCache = (servicesRes.data ?? []).map(toServiceMeta)
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
