import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "@/components/ui/accordion";
import type { MappedEndpoint } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import EndpointAccordionItem from "../EndpointAccordionItem";
import { endpointListKey, mergeConfiguredEndpoints } from "../overviewMerge";
import { ShowConnectionStateContext } from "../connectionStateContext";

const { typesRef } = vi.hoisted(() => ({ typesRef: { current: [] as unknown[] } }));

vi.mock("@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes", () => ({
  default: () => ({ data: typesRef.current }),
}));
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: () => ({ hasPermission: true }),
}));
vi.mock("../AssignEndpointDialog", () => ({ default: () => null }));
vi.mock("../AssignServiceDialog", () => ({ default: () => null }));
vi.mock("../BrowseDialog", () => ({ default: () => null }));
vi.mock("../EndpointDetailsPage", () => ({ default: ({ endpointId }: { endpointId: string }) => <input aria-label="Endpoint draft" defaultValue={endpointId} /> }));
vi.mock("../EndpointServices", () => ({ default: () => <div>Unassigned services</div> }));

const STRING = { type: "string", ui: "input", required: false, changeable: true, show_in_list: true, default: null } as const;

function renderItem(endpoint: MappedEndpoint) {
  return render(
    <Accordion type="single" defaultValue={endpointListKey(endpoint)}>
      <EndpointAccordionItem endpoint={endpoint} deviceId="dev-1" onCreated={() => {}} />
    </Accordion>
  );
}

describe("EndpointAccordionItem", () => {
  beforeEach(() => {
    typesRef.current = [
      { type_id: "plc", label: "PLC", description: null, fields: {}, mapping: { title: "name", addr: "ip" } },
      { type_id: "sensor", label: "Sensor", description: null, fields: {}, mapping: {} },
    ];
  });

  it("uses the name-role value as title", () => {
    renderItem({
      endpoint_id: "e1", type_id: "plc", type_label: "PLC", ip: "10.0.0.1", status: "online", source: "configured", ports: [],
      endpoint_data: {
        title: { value: "Press 1", field: { ...STRING, label: "Title" } },
        addr: { value: "10.0.0.1", field: { ...STRING, label: "Address" } },
      },
    });
    expect(screen.getByText("Press 1")).toBeInTheDocument();
  });

  it("shows a field called ip without the ip role as extra info", () => {
    renderItem({
      endpoint_id: "e2", type_id: "sensor", type_label: "Sensor", status: "unknown", source: "configured", ports: [],
      endpoint_data: { ip: { value: "192.168.9.9", field: { ...STRING, label: "Old IP" } } },
    });
    expect(screen.getByText(/192\.168\.9\.9/)).toBeInTheDocument();
  });

  it("has no leading separator in the subtitle of an IP-less endpoint with extra info", () => {
    renderItem({
      endpoint_id: "e8", type_id: "sensor", type_label: "Sensor", status: "unknown", source: "configured", ports: [],
      endpoint_data: { foo: { value: "bar", field: { ...STRING, label: "Foo" } } },
    });
    expect(screen.getByText(/bar/).textContent).toBe("bar");
  });

  it("hides role fields from the extra info", () => {
    renderItem({
      endpoint_id: "e3", type_id: "plc", type_label: "PLC", ip: "10.0.0.3", status: "online", source: "configured", ports: [],
      endpoint_data: { title: { value: "Press 3", field: { ...STRING, label: "Title" } }, addr: { value: "10.0.0.3", field: { ...STRING, label: "Address" } } },
    });

    expect(screen.queryByText(/Press 3 ·/)).not.toBeInTheDocument();
  });

  it("shows ordered list row values instead of object coercions and hides lists with show_in_list off", () => {
    const equipment = {
      ...STRING, type: "list" as const, label: "Equipment", ui: null,
      item_order: ["quantity", "identifier"],
      item_fields: {
        identifier: { ...STRING, label: "Identifier" },
        quantity: { ...STRING, type: "integer" as const, ui: "number" as const, label: "Quantity" },
      },
    };
    renderItem({
      endpoint_id: "list-endpoint", type_id: "sensor", type_label: "Sensor", status: "unknown", source: "configured", ports: [],
      endpoint_data: {
        equipment: { value: [{ id: "row-id", identifier: "SEP-00412", quantity: 0 }], field: equipment },
        hidden: { value: [{ identifier: "HIDDEN" }], field: { ...equipment, show_in_list: false } },
      },
    });
    expect(screen.getByText("Quantity: 0, Identifier: SEP-00412")).toBeInTheDocument();
    expect(screen.queryByText(/object Object|HIDDEN/)).not.toBeInTheDocument();
  });

  it("lists an endpoint without IP with the type label as title and unknown services", () => {
    renderItem({
      endpoint_id: "e4", type_id: "sensor", type_label: "Sensor", status: "unknown", source: "configured",
      endpoint_data: {},
      ports: [{ status: "unknown", source: "configured", service_id: "s1", type_label: "Modbus" }],
    });
    expect(screen.getByText("Sensor")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Details" })).not.toBeInTheDocument();
    expect(screen.getByText("1 service")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("Modbus")).toBeInTheDocument();
  });

  it("shows no connection states while the network scan is disabled", () => {
    render(
      <ShowConnectionStateContext.Provider value={false}>
        <Accordion type="single" defaultValue="id:e9">
          <EndpointAccordionItem
            endpoint={{
              endpoint_id: "e9", type_id: "sensor", type_label: "Sensor", ip: "10.0.0.9", status: "offline", source: "configured", endpoint_data: {},
              ports: [{ port: 4840, status: "offline", source: "configured", service_id: "s9", type_label: "OPC UA", browser_kind: "opcua" }],
            }}
            deviceId="dev-1" onCreated={() => {}}
          />
        </Accordion>
      </ShowConnectionStateContext.Provider>
    );
    expect(screen.getByText("OPC UA :4840")).toBeInTheDocument();
    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.queryByText("Last status change")).not.toBeInTheDocument();
    expect(screen.getByText("1 service")).toBeInTheDocument();
  });

  it("shows useful collapsed summaries, loads details on demand and retains drafts across collapsing", async () => {
    const endpoint: MappedEndpoint = {
      endpoint_id: "e1", type_id: "plc", type_label: "PLC", ip: "10.0.0.1",
      status: "online", source: "configured", ports: [
        { service_id: "s1", type_label: "OPC UA", port: 4840, source: "configured", status: "online" },
        { service_id: "s2", type_label: "Modbus TCP", port: 4840, source: "configured", status: "offline" },
      ],
    };
    const [merged] = mergeConfiguredEndpoints([endpoint], [endpoint]);
    render(<Accordion type="single" collapsible>
      <EndpointAccordionItem endpoint={merged} deviceId="dev-1" onCreated={() => {}} />
    </Accordion>);
    expect(screen.getByText("Endpoint · PLC")).toBeVisible();
    expect(screen.getByText("2 services")).toBeVisible();
    expect(screen.getByText("OPC UA :4840")).toBeVisible();
    expect(screen.getByText("Online")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { expanded: false });
    await userEvent.click(trigger);
    await userEvent.type(screen.getByRole("textbox", { name: "Endpoint draft" }), "-edited");
    await userEvent.click(trigger);
    expect(screen.getByLabelText("Endpoint draft").closest("[data-state]")).toHaveAttribute("data-state", "closed");
    await userEvent.click(trigger);
    expect(screen.getByRole("textbox", { name: "Endpoint draft" })).toHaveValue("e1-edited");
  });
});
