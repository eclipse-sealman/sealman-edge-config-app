import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeviceEndpoint, InputEndpoint } from "@/features/ModuleConfigTemplates/api";
import { EndpointSlots } from "./ConfigInputs";

const http = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/api/edgeConfig/edgeConfigApi", () => ({ edgeConfigApiInstance: http }));
vi.mock("@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes", () => ({
  default: () => ({ data: [{ type_id: "plc", label: "PLC" }, { type_id: "modbus", label: "Modbus device" }, { type_id: "robot", label: "Robot" }] }),
}));
vi.mock("@/generated/edge-administration/hooks/service_types/useGetServiceTypes", () => ({
  default: () => ({ data: [{ type_id: "opcua", label: "OPC UA" }, { type_id: "ssh", label: "SSH" }] }),
}));

const ENDPOINTS = [
  { endpoint_id: "e1", type_id: "plc", type_label: "PLC", name: "plc-1", fields: {} },
  { endpoint_id: "e2", type_id: "modbus", type_label: "Modbus device", name: "mb-1", fields: {} },
] as DeviceEndpoint[];
const slot = (patch: Partial<InputEndpoint> = {}): InputEndpoint => ({ key: "endpoint", slot: "endpoint", fields: ["ip"], ...patch });

describe("EndpointSlots type restriction", () => {
  const onChange = vi.fn();
  const renderSlots = (slots: InputEndpoint[], value: Record<string, string> = {}, services: Record<string, string> = {}) =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <EndpointSlots deviceId="dev-1" slots={slots} endpoints={ENDPOINTS} loading={false} value={value} onChange={onChange}
                       services={services} onServicesChange={vi.fn()} rows={{}} onRowsChange={vi.fn()} disabled={false} />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    onChange.mockReset();
    http.get.mockReset().mockImplementation(async (url: string) => {
      if (url === "/dev-1/config/endpoints/e1/services") {
        return { data: [{ service_id: "s1", type_id: "opcua", type_label: "OPC UA", name: "opc", port: 4840, fields: {} }] };
      }
      throw new Error(`unexpected GET ${url}`);
    });
  });

  it("offers only endpoints of an allowed type", async () => {
    renderSlots([slot({ endpoint_types: ["plc"] }), slot({ key: "any", slot: "any" })]);
    fireEvent.click(screen.getByRole("combobox", { name: "Endpoint: endpoint" }));
    expect(await screen.findByText("plc-1", { selector: "span.block" })).toBeInTheDocument();
    expect(screen.queryByText("mb-1", { selector: "span.block" })).not.toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    fireEvent.click(screen.getByRole("combobox", { name: "Endpoint: any" }));
    expect(await screen.findByText("mb-1", { selector: "span.block" })).toBeInTheDocument();
  });

  it("says which type is missing, for that slot only", () => {
    renderSlots([slot({ endpoint_types: ["robot", "gone"] }), slot({ key: "other", slot: "other" })]);
    expect(screen.getByText("This device has no endpoint of type Robot, gone")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Endpoint: endpoint" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Endpoint: other" })).toBeInTheDocument();
  });

  it("clears a chosen endpoint that the slot no longer allows", async () => {
    renderSlots([slot({ endpoint_types: ["plc"] }), slot({ key: "keep", slot: "keep" })], { endpoint: "e2", keep: "e2" }, { endpoint: "s9", keep: "s8" });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenCalledWith({ keep: "e2" }, { keep: "s8" }, {});
  });

  it("does not clear a fitting choice", async () => {
    renderSlots([slot({ endpoint_types: ["plc"] })], { endpoint: "e1" });
    await screen.findByRole("combobox", { name: "Endpoint: endpoint" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("says which type is missing when the endpoint has no fitting service", async () => {
    renderSlots([slot({ service_fields: ["port"], service_types: ["ssh"] })], { endpoint: "e1" });
    expect(await screen.findByText("This endpoint has no service of type SSH")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Service: endpoint" })).not.toBeInTheDocument();
  });
});
