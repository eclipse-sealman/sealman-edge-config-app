import type { components } from "@/generated/edge-administration/types";
import { formatMetadataValue } from "@/features/PlatformTypes/FieldValueInput";
import type { DeviceDataDisplay } from "../Devices.types";

export type EndpointData = components["schemas"]["EndpointResponse"];
type FieldDefinition = components["schemas"]["FieldDefinition"];

export type SearchScope = "device" | "endpoint";
export type FilterOperator = "is" | "contains";

export interface SearchKey {
  id: string;
  scope: SearchScope;
  key: string;
  label: string;
}

export interface ValueOption {
  value: string;
  count: number;
}

export interface SearchIndex {
  keys: SearchKey[];
  valuesByKeyId: Record<string, ValueOption[]>;
}

export interface EndpointTypeSeed {
  label: string;
  fields: Record<string, { label: string }>;
}

export interface SearchFilter {
  id: string;
  /** "any" is a free-text filter matching every device and endpoint value. */
  scope: SearchScope | "any";
  key: string;
  label: string;
  operator: FilterOperator;
  value: string;
}

export interface DeviceSearchResult {
  devices: DeviceDataDisplay[];
  /** Endpoints satisfying every active endpoint filter, per device (only set when there are any). */
  matchingEndpoints: Map<string, EndpointData[]>;
}

export const DEVICE_ID_KEY = "@deviceId";
export const DEVICE_STATUS_KEY = "@status";
export const DEVICE_TYPE_KEY = "@type";
export const ENDPOINT_TYPE_KEY = "@type";

const BUILTIN_LABELS: Record<string, string> = {
  [`device:${DEVICE_ID_KEY}`]: "Device ID",
  [`device:${DEVICE_STATUS_KEY}`]: "Status",
  [`device:${DEVICE_TYPE_KEY}`]: "Device Type",
  [`endpoint:${ENDPOINT_TYPE_KEY}`]: "Endpoint Type",
};

const normalize = (value: string) => value.trim().toLowerCase();

export const keyId = (scope: SearchScope, key: string) => `${scope}:${key}`;

function formatValue(value: unknown, field?: FieldDefinition | null): string {
  if (value === null || value === undefined || value === "") return "";
  if (field) return formatMetadataValue(value, field);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

type MetadataEntry = { value: unknown; field?: FieldDefinition | null };

export function deviceValues(device: DeviceDataDisplay, key: string): string[] {
  if (key === DEVICE_ID_KEY) return [device.deviceId];
  if (key === DEVICE_STATUS_KEY) return [device.onlineStatusEdge];
  if (key === DEVICE_TYPE_KEY) return device.typeId ? [device.typeId] : [];
  const entry = device.deviceMetadata?.[key] as MetadataEntry | undefined;
  const formatted = entry ? formatValue(entry.value, entry.field) : "";
  return formatted ? [formatted] : [];
}

export function endpointValues(endpoint: EndpointData, key: string): string[] {
  if (key === ENDPOINT_TYPE_KEY) return endpoint.type_label ? [endpoint.type_label] : [];
  const resolved = endpoint.endpoint_data?.[key];
  const formatted = resolved ? formatValue(resolved.value, resolved.field) : "";
  return formatted ? [formatted] : [];
}

/** Fields of an endpoint other than its name and IP, which the endpoint list shows on their own. */
export function endpointDetailFields(endpoint: EndpointData): { key: string; label: string; value: string }[] {
  return Object.entries(endpoint.endpoint_data ?? {})
    .filter(([key]) => key !== "name" && key !== "ip")
    .map(([key, resolved]) => ({
      key,
      label: resolved.field?.label ?? key,
      value: formatValue(resolved.value, resolved.field),
    }))
    .filter((field) => field.value !== "");
}

export function groupEndpointsByDevice(devices: { deviceId: string; endpoints?: EndpointData[] }[]): Map<string, EndpointData[]> {
  return new Map(devices.map((device) => [device.deviceId, device.endpoints ?? []]));
}

/**
 * Collects every searchable key (built-in ones, every device metadata key and every endpoint
 * field key actually in use) together with the distinct values seen for it and their counts.
 * `deviceLabels` and `endpointTypes` additionally seed keys and endpoint type names that no
 * device or endpoint uses yet, so they stay selectable.
 */
export function buildSearchIndex(
  devices: DeviceDataDisplay[],
  endpointsByDevice: Map<string, EndpointData[]>,
  deviceLabels: Record<string, string> = {},
  endpointTypes: EndpointTypeSeed[] = [],
): SearchIndex {
  const keys = new Map<string, SearchKey>();
  const values = new Map<string, Map<string, number>>();

  const register = (scope: SearchScope, key: string, label: string, found: string[]) => {
    const id = keyId(scope, key);
    if (!keys.has(id)) {
      keys.set(id, { id, scope, key, label: BUILTIN_LABELS[id] ?? label });
      values.set(id, new Map());
    }
    const counts = values.get(id)!;
    for (const value of found) counts.set(value, (counts.get(value) ?? 0) + 1);
  };

  for (const [key, label] of Object.entries(deviceLabels)) register("device", key, label, []);
  for (const endpointType of endpointTypes) {
    register("endpoint", ENDPOINT_TYPE_KEY, "", []);
    const typeCounts = values.get(keyId("endpoint", ENDPOINT_TYPE_KEY))!;
    if (!typeCounts.has(endpointType.label)) typeCounts.set(endpointType.label, 0);
    for (const [key, field] of Object.entries(endpointType.fields)) register("endpoint", key, field.label, []);
  }

  for (const device of devices) {
    register("device", DEVICE_ID_KEY, "", deviceValues(device, DEVICE_ID_KEY));
    register("device", DEVICE_STATUS_KEY, "", deviceValues(device, DEVICE_STATUS_KEY));
    register("device", DEVICE_TYPE_KEY, "", deviceValues(device, DEVICE_TYPE_KEY));
    for (const [key, entry] of Object.entries(device.deviceMetadata ?? {})) {
      const field = (entry as MetadataEntry).field;
      register("device", key, field?.label ?? deviceLabels[key] ?? key, deviceValues(device, key));
    }
    for (const endpoint of endpointsByDevice.get(device.deviceId) ?? []) {
      register("endpoint", ENDPOINT_TYPE_KEY, "", endpointValues(endpoint, ENDPOINT_TYPE_KEY));
      for (const [key, resolved] of Object.entries(endpoint.endpoint_data ?? {})) {
        register("endpoint", key, resolved.field?.label ?? key, endpointValues(endpoint, key));
      }
    }
  }

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  const valuesByKeyId: Record<string, ValueOption[]> = {};
  for (const [id, counts] of values) {
    valuesByKeyId[id] = [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => collator.compare(a.value, b.value));
  }

  const isBuiltin = (key: SearchKey) => key.key.startsWith("@");
  const sortedKeys = [...keys.values()].sort(
    (a, b) =>
      Number(isBuiltin(b)) - Number(isBuiltin(a)) || collator.compare(a.label, b.label),
  );

  return { keys: sortedKeys, valuesByKeyId };
}

function matchesFilter(actual: string[], filter: SearchFilter): boolean {
  const needle = normalize(filter.value);
  return actual.some((value) => {
    const candidate = normalize(value);
    return filter.operator === "is" ? candidate === needle : candidate.includes(needle);
  });
}

function groupByKey(filters: SearchFilter[]): SearchFilter[][] {
  const groups = new Map<string, SearchFilter[]>();
  for (const filter of filters) {
    const group = groups.get(filter.key);
    if (group) group.push(filter);
    else groups.set(filter.key, [filter]);
  }
  return [...groups.values()];
}

/** Same key => any of its filters may match (OR); different keys => all must match (AND). */
function matchesAllGroups(groups: SearchFilter[][], valuesOf: (key: string) => string[]): boolean {
  return groups.every((group) => group.some((filter) => matchesFilter(valuesOf(filter.key), filter)));
}

/**
 * Device filters apply to the device itself. Endpoint filters must all be satisfied by the
 * same endpoint of a device, so "type = X and IP = Y" means one endpoint with both properties.
 * Free-text filters must each match somewhere on the device or any of its endpoints.
 */
export function applySearch(
  devices: DeviceDataDisplay[],
  endpointsByDevice: Map<string, EndpointData[]>,
  filters: SearchFilter[],
): DeviceSearchResult {
  const matchingEndpoints = new Map<string, EndpointData[]>();
  if (filters.length === 0) return { devices, matchingEndpoints };

  const deviceGroups = groupByKey(filters.filter((f) => f.scope === "device"));
  const endpointGroups = groupByKey(filters.filter((f) => f.scope === "endpoint"));
  const textFilters = filters.filter((f) => f.scope === "any");

  const result = devices.filter((device) => {
    const endpoints = endpointsByDevice.get(device.deviceId) ?? [];

    if (!matchesAllGroups(deviceGroups, (key) => deviceValues(device, key))) return false;

    if (endpointGroups.length > 0) {
      const matching = endpoints.filter((endpoint) =>
        matchesAllGroups(endpointGroups, (key) => endpointValues(endpoint, key)),
      );
      if (matching.length === 0) return false;
      matchingEndpoints.set(device.deviceId, matching);
    }

    if (textFilters.length > 0) {
      const haystack = [
        device.deviceId,
        ...Object.keys(device.deviceMetadata ?? {}).flatMap((key) => deviceValues(device, key)),
        ...endpoints.flatMap((endpoint) => [
          endpoint.type_label,
          ...Object.keys(endpoint.endpoint_data ?? {}).flatMap((key) => endpointValues(endpoint, key)),
        ]),
      ].map(normalize);
      if (!textFilters.every((f) => haystack.some((entry) => entry.includes(normalize(f.value))))) {
        return false;
      }
    }

    return true;
  });

  return { devices: result, matchingEndpoints };
}
