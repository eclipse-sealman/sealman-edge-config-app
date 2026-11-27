import type { MappedEndpoint, MappedPort } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";

/**
 * Stable key for an overview row and for its accordion selection: configured endpoints by
 * `endpoint_id` (several can share an IP, and some have none), scan-only entries by IP.
 */
export function endpointListKey(endpoint: Pick<MappedEndpoint, "endpoint_id" | "ip">): string {
  if (endpoint.endpoint_id) return `id:${endpoint.endpoint_id}`;
  return `ip:${endpoint.ip ?? ""}`;
}

/** Configured services have independent identities even when they share a port. */
export function portListKey(port: Pick<MappedPort, "port" | "service_id">): string {
  if (port.service_id) return `service:${port.service_id}`;
  if (port.port != null) return `port:${port.port}`;
  return "service:";
}

function mergePorts(base: MappedPort[], preferred: MappedPort[]): MappedPort[] {
  const preferredPorts = new Set(preferred.flatMap((port) => port.port != null ? [port.port] : []));
  const preferredServices = new Set(preferred.map((port) => port.service_id).filter(Boolean));
  const ports = new Map<string, MappedPort>();
  for (const port of base) {
    if (preferredServices.has(port.service_id) || (port.port != null && preferredPorts.has(port.port))) continue;
    ports.set(portListKey(port), port);
  }
  for (const port of preferred) ports.set(portListKey(port), port);
  return [...ports.values()];
}

// A host found by both the baseline and the custom scan is the same host. Configured endpoints
// merge by endpoint_id (several can share an IP and are listed separately); only scan-only
// entries, which have no endpoint_id, merge by IP.
function scanMergeKey(endpoint: MappedEndpoint): string {
  return endpointListKey(endpoint);
}

/**
 * `primary` (the recurring baseline scan) wins on endpoint-level data for entries it also covers,
 * since it's the freshest. Its port list only reflects the catalog ports, so ports are unioned per
 * entry; primary replaces the assignments for each port it covers.
 */
export function mergeEndpointsByIp(primary: MappedEndpoint[], extras: MappedEndpoint[]): MappedEndpoint[] {
  const byKey = new Map<string, MappedEndpoint>();
  for (const endpoint of extras) byKey.set(scanMergeKey(endpoint), endpoint);
  for (const endpoint of primary) {
    const key = scanMergeKey(endpoint);
    const extra = byKey.get(key);
    byKey.set(key, extra && endpoint.ip && extra.ip === endpoint.ip
      ? { ...endpoint, ports: mergePorts(extra.ports, endpoint.ports) } : endpoint);
  }
  return [...byKey.values()];
}

/**
 * The latest complete configuration owns endpoint/service membership and assignments. Scans
 * supply connection state only for unchanged hosts/assignments and retain unassigned discoveries.
 * An unavailable snapshot is not the same as a successful empty configuration.
 */
export function mergeConfiguredEndpoints(primary: MappedEndpoint[], configured: MappedEndpoint[] | undefined): MappedEndpoint[] {
  if (configured === undefined) return primary;
  const byKey = new Map<string, MappedEndpoint>();
  for (const endpoint of configured) byKey.set(endpointListKey(endpoint), endpoint);
  for (const endpoint of primary) {
    const key = endpointListKey(endpoint);
    const match = byKey.get(key);
    if (!match) {
      if (!endpoint.endpoint_id && endpoint.source !== "configured") byKey.set(key, endpoint);
      continue;
    }
    if (!endpoint.ip || endpoint.ip !== match.ip) continue;
    const observedServices = new Map(endpoint.ports.map((port) => [port.service_id, port]));
    const ports = match.ports.map((port) => {
      const observed = port.service_id ? observedServices.get(port.service_id) : undefined;
      if (port.port == null || !observed || observed.port !== port.port) return port;
      return { ...port, status: observed.status, lastStatusChange: observed.lastStatusChange };
    });
    const claimedPorts = new Set(ports.map((port) => port.port).filter((port) => port != null));
    const unassigned = endpoint.ports.filter((port) => !port.service_id && port.source !== "configured" &&
      (port.port == null || !claimedPorts.has(port.port)));
    byKey.set(key, {
      ...match, status: endpoint.status, lastStatusChange: endpoint.lastStatusChange,
      ports: [...ports, ...unassigned],
    });
  }
  return [...byKey.values()];
}
