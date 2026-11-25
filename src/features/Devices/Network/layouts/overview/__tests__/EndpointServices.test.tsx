import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { components } from "@/generated/edge-administration/types";
import type { MappedEndpoint } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import EndpointServices from "../EndpointServices";
import { ShowConnectionStateContext } from "../connectionStateContext";
import { edgeApi } from "@/generated/edge-administration/api";
import { mergeConfiguredEndpoints } from "../overviewMerge";

type Service = components["schemas"]["ServiceResponse"];
const mocks = vi.hoisted(() => ({
  services: {} as Record<string, Service>,
  fetchServices: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
  canWrite: true,
  onUpdated: vi.fn(),
}));
const field = { type: "integer", ui: "number", label: "Port", required: false, changeable: true, show_in_list: true } as const;
const service = (id: string, typeId: string, label: string, port: number): Service => ({
  service_id: id, type_id: typeId, type_label: label, type_description: null,
  endpoint_id: "ep1", created_at: "2026-11-18T10:00:00Z", updated_at: "2026-11-18T10:00:00Z",
  service_data: { port: { value: port, field } },
});
const endpoint: MappedEndpoint = {
  endpoint_id: "ep1", type_id: "machine", type_label: "Machine", ip: "10.0.0.5",
  source: "configured", status: "online", ports: [
    { service_id: "s1", type_id: "opcua", type_label: "OPC UA", port: 4840, source: "configured", status: "online", browser_kind: "opcua" },
    { service_id: "s2", type_id: "modbus", type_label: "Modbus TCP", port: 502, source: "configured", status: "offline", browser_kind: "http" },
  ],
};

vi.mock("@/generated/edge-administration/hooks/services/useGetService", () => ({
  default: () => { throw new Error("Service tabs must reuse the endpoint's service-list query"); },
}));
vi.mock("@/generated/edge-administration/hooks/services/useUpdateService", () => ({
  useUpdateService: () => ({ updateService: mocks.updateService, isPending: false }),
}));
vi.mock("@/generated/edge-administration/hooks/services/useDeleteService", () => ({
  useDeleteService: () => ({ deleteService: mocks.deleteService, isPending: false }),
}));
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: () => ({ hasPermission: mocks.canWrite }),
}));
vi.mock("../AssignServiceDialog", () => ({
  default: ({ open, port, onCreated }: { open: boolean; port?: number; onCreated: () => void }) =>
    open ? <button onClick={onCreated}>Create service {port}</button> : null,
}));
vi.mock("../BrowseDialog", () => ({
  default: ({ ip, port }: { ip: string; port: number }) => <div>Browsing {ip}:{port}</div>,
}));

function renderServices(networkEndpoint = endpoint, scanEnabled = true, initialServiceId?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Services({ item }: { item: MappedEndpoint }) {
    const { data } = useQuery({
      queryKey: edgeApi.queryOptions("get", "/services", {
        params: { query: { endpoint_id: "ep1", type_id: undefined } },
      }).queryKey,
      queryFn: mocks.fetchServices,
      initialData: Object.values(mocks.services),
      staleTime: Infinity,
    });
    return <EndpointServices endpoint={item} deviceId="dev1" onUpdated={mocks.onUpdated}
      services={data} initialServiceId={initialServiceId} />;
  }
  const tree = (item: MappedEndpoint) => <QueryClientProvider client={client}>
    <ShowConnectionStateContext.Provider value={scanEnabled}>
      <Services item={item} />
    </ShowConnectionStateContext.Provider>
  </QueryClientProvider>;
  const result = render(tree(networkEndpoint));
  return { ...result, client, refresh: (item = networkEndpoint) => result.rerender(tree(item)) };
}

describe("services nested inside endpoints", () => {
  beforeEach(() => {
    mocks.canWrite = true;
    mocks.services = { s1: service("s1", "opcua", "OPC UA", 4840), s2: service("s2", "modbus", "Modbus TCP", 502) };
    mocks.fetchServices.mockReset().mockImplementation(async () => Object.values(mocks.services));
    mocks.updateService.mockReset().mockImplementation(async ({ serviceId, body }) => {
      const saved = { ...mocks.services[serviceId], service_data: { port: { value: body.service_data.port, field } } };
      mocks.services[serviceId] = saved;
      return saved;
    });
    mocks.deleteService.mockReset().mockResolvedValue(undefined);
    mocks.onUpdated.mockReset();
  });

  it("uses accessible per-service tabs and retains edits when switching with clicks and arrow keys", async () => {
    const { refresh } = renderServices();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: /OPC UA/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("button", { name: /Back to Endpoint/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Edit service" }));
    fireEvent.change(screen.getByDisplayValue("4840"), { target: { value: "4841" } });
    await userEvent.click(screen.getByRole("tab", { name: /Modbus TCP/ }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("502");
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: /OPC UA/ })).toHaveFocus();
    expect(screen.getByDisplayValue("4841")).toBeVisible();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: /Modbus TCP/ })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByDisplayValue("4841")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.updateService).toHaveBeenCalledWith({
      serviceId: "s1", body: { service_data: { port: 4841 } },
    }));
    expect(mocks.onUpdated).toHaveBeenCalled();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("4841");
    expect(screen.getByRole("tab", { name: /OPC UA/ })).toHaveTextContent("4840");
    refresh({ ...endpoint, ports: endpoint.ports.map((port) =>
      port.service_id === "s1" ? { ...port, port: 4841 } : port) });
    expect(screen.getByRole("tab", { name: /OPC UA/ })).toHaveTextContent("4841");
  });

  it("opens a requested service tab and cancelling leaves stored values unchanged", async () => {
    renderServices(endpoint, true, "s2");
    expect(screen.getByRole("tab", { name: /Modbus TCP/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("button", { name: "Edit service" }));
    fireEvent.change(screen.getByDisplayValue("502"), { target: { value: "503" } });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("502");
    expect(mocks.updateService).not.toHaveBeenCalled();
  });

  it("preserves another service's draft when a saved response updates the shared list", async () => {
    renderServices();
    await userEvent.click(screen.getByRole("button", { name: "Edit service" }));
    fireEvent.change(screen.getByDisplayValue("4840"), { target: { value: "4841" } });
    await userEvent.click(screen.getByRole("tab", { name: /Modbus TCP/ }));
    await userEvent.click(screen.getByRole("button", { name: "Edit service" }));
    fireEvent.change(screen.getByDisplayValue("502"), { target: { value: "503" } });
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByRole("tabpanel")).toHaveTextContent("503"));
    await userEvent.click(screen.getByRole("tab", { name: /OPC UA/ }));
    expect(screen.getByDisplayValue("4841")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("keeps the successful save response visible when refreshing the service list fails", async () => {
    const { client } = renderServices();
    mocks.fetchServices.mockRejectedValue(new Error("Service-list refresh failed"));
    mocks.onUpdated.mockImplementation(() => { void client.refetchQueries(); });
    await userEvent.click(screen.getByRole("button", { name: "Edit service" }));
    fireEvent.change(screen.getByDisplayValue("4840"), { target: { value: "4841" } });
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(client.getQueryCache().getAll()[0].state.status).toBe("error"));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("4841");
    expect(screen.getByRole("button", { name: "Edit service" })).toBeEnabled();
  });

  it("keeps browsing gated by per-service status and hides scan state when scanning is disabled", async () => {
    renderServices();
    await userEvent.click(screen.getByRole("button", { name: "Browse" }));
    expect(screen.getByText("Browsing 10.0.0.5:4840")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /Modbus TCP/ }));
    expect(screen.getByRole("button", { name: "Browse" })).toBeDisabled();
  });

  it("allows offline browsing without the network scan and respects read-only permissions", async () => {
    mocks.canWrite = false;
    renderServices(endpoint, false, "s2");
    expect(screen.getByRole("button", { name: "Browse" })).toBeEnabled();
    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
    expect(screen.queryByText("Last status change")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit service" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add Service" })).toBeDisabled();
  });

  it("browses the updated configured host instead of an old scan target", async () => {
    const current: MappedEndpoint = {
      ...endpoint, ip: "10.0.0.9", status: "unknown",
      ports: endpoint.ports.map((port) => ({ ...port, status: "unknown" })),
    };
    const [merged] = mergeConfiguredEndpoints([endpoint], [current]);
    renderServices(merged, false);
    await userEvent.click(screen.getByRole("button", { name: "Browse" }));
    expect(screen.getByText("Browsing 10.0.0.9:4840")).toBeInTheDocument();
    expect(screen.queryByText("Browsing 10.0.0.5:4840")).not.toBeInTheDocument();
  });

  it("confirms service deletion and immediately falls back to the remaining tab", async () => {
    renderServices();
    await userEvent.click(screen.getByRole("button", { name: "Edit service" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove Service" }));
    const dialog = screen.getByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mocks.deleteService).toHaveBeenCalledWith("s1"));
    await waitFor(() => expect(screen.queryByRole("tab", { name: /OPC UA/ })).not.toBeInTheDocument());
    expect(screen.getByRole("tab", { name: /Modbus TCP/ })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps unassigned services in their endpoint and allows assigning their observed port", async () => {
    renderServices({ ...endpoint, ports: [
      { type_id: "opcua", type_label: "OPC UA", port: 4841, source: "default", status: "online" },
    ] }, true);
    await userEvent.click(screen.getByRole("tab", { name: /Not assigned/ }));
    await userEvent.click(screen.getByRole("button", { name: "Assign" }));
    expect(screen.getByRole("button", { name: "Create service 4841" })).toBeInTheDocument();
  });

  it("keeps configured services distinct even when their type and port match", () => {
    mocks.services.s3 = service("s3", "opcua", "OPC UA", 4840);
    renderServices({ ...endpoint, ports: [
      ...endpoint.ports,
      { service_id: "s3", type_id: "opcua", type_label: "OPC UA", port: 4840, source: "configured", status: "online" },
    ] });
    expect(screen.getAllByRole("tab", { name: /OPC UA/ })).toHaveLength(2);
    expect(screen.queryByRole("tab", { name: /Not assigned/ })).not.toBeInTheDocument();
  });

  it.each(["ip", "port"] as const)("does not offer browsing when the %s is missing", (missing) => {
    if (missing === "port") mocks.services.s1.service_data.port.value = null;
    renderServices({
      ...endpoint, ip: missing === "ip" ? undefined : endpoint.ip,
      ports: endpoint.ports.map((port) => missing === "port" && port.service_id === "s1" ? { ...port, port: null } : port),
    });
    expect(screen.queryByRole("button", { name: "Browse" })).not.toBeInTheDocument();
  });

  it("keeps a defaulted but unassigned port separate from a portless configured service", async () => {
    mocks.services = { s1: {
      ...mocks.services.s1,
      service_data: { port: { value: 4840, field: { ...field, default: 4840 } } },
    } };
    renderServices({ ...endpoint, ports: [
      { service_id: "s1", type_id: "opcua", type_label: "OPC UA", port: null, status: "unknown", source: "configured" },
      { type_id: "opcua", type_label: "OPC UA", port: 4840, status: "online", source: "default", browser_kind: "opcua" },
    ] });
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { selected: true })).not.toHaveTextContent("4840");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Unknown");
    expect(screen.queryByRole("button", { name: "Browse" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /Not assigned/ }));
    expect(screen.getByRole("button", { name: "Assign" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Browse" })).toBeEnabled();
  });

  it("shows a newly created service without inventing port or status information before the network response arrives", async () => {
    mocks.services.s3 = service("s3", "opcua", "New OPC UA", 7443);
    renderServices();
    const tab = screen.getByRole("tab", { name: /New OPC UA/ });
    expect(tab).not.toHaveTextContent("7443");
    await userEvent.click(tab);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Unknown");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("7443");
    expect(screen.queryByRole("button", { name: "Browse" })).not.toBeInTheDocument();
  });
});
