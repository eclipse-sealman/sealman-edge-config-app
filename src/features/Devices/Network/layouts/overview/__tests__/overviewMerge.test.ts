import { describe, expect, it } from "vitest";
import type { MappedEndpoint, MappedPort } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import { endpointListKey, mergeConfiguredEndpoints, mergeEndpointsByIp, portListKey } from "../overviewMerge";

function endpoint(overrides: Partial<MappedEndpoint>): MappedEndpoint {
  return { ip: "10.0.0.1", status: "unknown", source: "configured", ports: [], ...overrides };
}

function port(overrides: Partial<MappedPort>): MappedPort {
  return { status: "unknown", source: "configured", ...overrides };
}

describe("endpointListKey", () => {
  it("uses endpoint_id when there is one", () => {
    expect(endpointListKey(endpoint({ endpoint_id: "e1", ip: "10.0.0.1" }))).toBe("id:e1");
  });

  it("falls back to the IP for scan results without an endpoint", () => {
    expect(endpointListKey(endpoint({ ip: "10.0.0.1", source: "unidentified" }))).toBe("ip:10.0.0.1");
  });
});

describe("portListKey", () => {
  it("uses the service ID even when there is a port number", () => {
    expect(portListKey(port({ port: 502, service_id: "s1" }))).toBe("service:s1");
  });

  it("falls back to the service_id for services without a port value", () => {
    expect(portListKey(port({ service_id: "s1" }))).toBe("service:s1");
  });
});

describe("mergeConfiguredEndpoints", () => {
  it("keeps two configured endpoints without IP apart", () => {
    const merged = mergeConfiguredEndpoints([], [endpoint({ endpoint_id: "a", ip: null }), endpoint({ endpoint_id: "b", ip: null })]);
    expect(merged.map((e) => e.endpoint_id).sort()).toEqual(["a", "b"]);
  });

  it("retains live statuses and timestamps for unchanged targets, including distinct same-IP endpoints", () => {
    const configured = endpoint({
      endpoint_id: "a",
      status: "offline",
      ports: [port({ service_id: "s1" }), port({ port: 21, status: "offline", service_id: "s2" })],
    });
    const observedAt = "2026-11-23T12:00:00Z";
    const live = endpoint({
      endpoint_id: "a", status: "online", lastStatusChange: observedAt,
      ports: [port({ port: 21, status: "online", lastStatusChange: observedAt, service_id: "s2" })],
    });
    const sharedHost = endpoint({ endpoint_id: "b", status: "offline" });
    const [merged, other] = mergeConfiguredEndpoints([live], [configured, sharedHost]);
    expect(merged.status).toBe("online");
    expect(merged.lastStatusChange).toBe(observedAt);
    expect(merged.ports.map(portListKey).sort()).toEqual(["service:s1", "service:s2"]);
    expect(merged.ports.find((p) => p.port === 21)).toMatchObject({ status: "online", lastStatusChange: observedAt });
    expect(other).toEqual(sharedHost);
  });

  it("removes deleted configured endpoints without losing unconfigured discoveries or suggestions", () => {
    const deleted = endpoint({ endpoint_id: "deleted" });
    const retained = endpoint({ endpoint_id: "retained" });
    const discovery = endpoint({ endpoint_id: null, ip: "10.0.0.2", source: "unidentified" });
    const suggestion = endpoint({ endpoint_id: null, ip: "10.0.0.3", source: "default" });
    expect(mergeConfiguredEndpoints([deleted, retained, discovery, suggestion], [retained]))
      .toEqual([retained, discovery, suggestion]);
    expect(mergeConfiguredEndpoints([deleted], [])).toEqual([]);
  });

  it("does not interpret unavailable configuration as empty membership", () => {
    const observed = [endpoint({ endpoint_id: "a", status: "online" })];
    expect(mergeConfiguredEndpoints(observed, undefined)).toEqual(observed);
  });

  it.each(["10.0.0.2", null])("keeps edited configuration and rejects old-host observations after IP becomes %s", (ip) => {
    const configured = endpoint({
      endpoint_id: "a", ip, type_id: "new-type", type_label: "New label", type_description: "New description",
      endpoint_data: { identifier: { value: "Updated" } },
      ports: [port({
        service_id: "s1", port: 4840, type_id: "new-service", browser_kind: "http",
        service_data: { identifier: { value: "Updated service" } },
      })],
    });
    const stale = endpoint({
      endpoint_id: "a", status: "online", lastStatusChange: "2026-11-22T12:00:00Z",
      type_id: "old-type", type_label: "Old label", type_description: "Old description",
      endpoint_data: { identifier: { value: "Old" } },
      ports: [
        port({ service_id: "s1", port: 4840, status: "online", lastStatusChange: "2026-11-22T12:00:00Z" }),
        port({ port: 80, source: "unidentified", status: "online" }),
      ],
    });
    expect(mergeConfiguredEndpoints([stale], [configured])).toEqual([configured]);
  });

  it("uses fresh metadata at an unchanged host and does not apply observations to portless services", () => {
    const configured = endpoint({
      endpoint_id: "a", type_id: "new-type", type_label: "New label",
      endpoint_data: { identifier: { value: "Updated" } },
      ports: [port({ service_id: "s1", port: null, type_label: "Updated service" })],
    });
    const stale = endpoint({
      endpoint_id: "a", type_id: "old-type", type_label: "Old label", status: "online",
      ports: [port({ service_id: "s1", port: null, status: "online" })],
    });
    expect(mergeConfiguredEndpoints([stale], [configured])).toEqual([{ ...configured, status: "online" }]);
  });

  it("preserves every configured service sharing a numeric port with the preferred scan status", () => {
    const configured = endpoint({ endpoint_id: "a", ports: [
      port({ service_id: "s1", port: 4840, status: "offline" }),
      port({ service_id: "s2", port: 4840, status: "offline" }),
    ] });
    const live = endpoint({ endpoint_id: "a", ports: configured.ports.map((item) => ({ ...item, status: "online" })) });
    const [merged] = mergeConfiguredEndpoints([live], [configured]);
    expect(merged.ports.map((item) => [item.service_id, item.status])).toEqual([["s1", "online"], ["s2", "online"]]);
  });

  it("does not restore a deleted service from a cached scan", () => {
    const stale = endpoint({ endpoint_id: "a", ports: [port({ service_id: "removed", port: 4840 })] });
    const [merged] = mergeConfiguredEndpoints([stale], [endpoint({ endpoint_id: "a" })]);
    expect(merged.ports).toEqual([]);
    expect(stale.ports).toHaveLength(1);
  });

  it("retains a newly added same-port service even if it is absent from the cached scan", () => {
    const existing = port({ service_id: "s1", port: 4840, status: "online" });
    const added = port({ service_id: "s2", port: 4840 });
    const [merged] = mergeConfiguredEndpoints(
      [endpoint({ endpoint_id: "a", ports: [existing] })],
      [endpoint({ endpoint_id: "a", ports: [existing, added] })],
    );
    expect(merged.ports.map((item) => item.service_id)).toEqual(["s1", "s2"]);
  });

  it("does not restore a previous port or its status after a service's assignment changes", () => {
    const stale = endpoint({ endpoint_id: "a", ports: [port({ service_id: "s1", port: 4840, status: "online" })] });
    const updated = port({ service_id: "s1", port: 4841 });
    const [merged] = mergeConfiguredEndpoints([stale], [endpoint({ endpoint_id: "a", ports: [updated] })]);
    expect(merged.ports).toEqual([updated]);
  });

  it("retains a portless service and separate observations without restoring its old assignment", () => {
    const configured = endpoint({ endpoint_id: "a", ports: [port({ service_id: "s1", port: null })] });
    const observed = port({ port: 4840, source: "default", status: "online" });
    const stale = endpoint({ endpoint_id: "a", ports: [
      port({ service_id: "s1", port: 4840, status: "online" }), observed,
    ] });
    const [merged] = mergeConfiguredEndpoints([stale], [configured]);
    expect(merged.ports).toEqual([...configured.ports, observed]);
  });

  it("removes stale unassigned suggestions for ports now claimed by configured services", () => {
    const configured = endpoint({ endpoint_id: "a", ports: [port({ service_id: "s1", port: 4840 })] });
    const observed = endpoint({ endpoint_id: "a", ports: [port({ port: 4840, source: "default", status: "online" })] });
    const [merged] = mergeConfiguredEndpoints([observed], [configured]);
    expect(merged.ports).toEqual(configured.ports);
  });
});

describe("mergeEndpointsByIp", () => {
  it("replaces old assignments for a port with the preferred scan's unassigned entry", () => {
    const old = endpoint({ endpoint_id: "a", ports: [port({ service_id: "removed", port: 4840 })] });
    const observed = port({ port: 4840, source: "default", status: "online" });
    const [merged] = mergeEndpointsByIp([endpoint({ endpoint_id: "a", ports: [observed] })], [old]);
    expect(merged.ports).toEqual([observed]);
  });

  it("keeps endpoints without IP apart instead of collapsing them under one key", () => {
    const merged = mergeEndpointsByIp([endpoint({ endpoint_id: "a", ip: null }), endpoint({ endpoint_id: "b", ip: null })], []);
    expect(merged).toHaveLength(2);
  });

  it("does not carry custom-scan port observations from an endpoint's previous host", () => {
    const stale = endpoint({
      endpoint_id: "a", ports: [port({ port: 8080, source: "unidentified", status: "online" })],
    });
    const current = endpoint({ endpoint_id: "a", ip: "10.0.0.2" });
    expect(mergeEndpointsByIp([current], [stale])).toEqual([current]);
  });

  it("still merges the same host from both scans by IP", () => {
    const merged = mergeEndpointsByIp(
      [endpoint({ ip: "10.0.0.1", source: "unidentified", ports: [port({ port: 80 })] })],
      [endpoint({ ip: "10.0.0.1", source: "unidentified", ports: [port({ port: 8080 })] })],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].ports.map((p) => p.port).sort()).toEqual([80, 8080]);
  });

  it("lists configured endpoints that share an IP as separate rows", () => {
    const merged = mergeEndpointsByIp(
      [endpoint({ endpoint_id: "a", ip: "10.0.0.1" })],
      [endpoint({ endpoint_id: "b", ip: "10.0.0.1" })],
    );
    expect(merged).toHaveLength(2);
  });
});
