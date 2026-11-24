import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TemplateInputs, useTemplateInputs, type TemplateInputsSource } from "./TemplateInputs";

const http = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/api/edgeConfig/edgeConfigApi", () => ({ edgeConfigApiInstance: http }));
vi.mock("@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes", () => ({ default: () => ({ data: [] }) }));
vi.mock("@/generated/edge-administration/hooks/service_types/useGetServiceTypes", () => ({ default: () => ({ data: [] }) }));

const SOURCE = {
  variables: [], references: { variables: [], device: [] },
  inputs: {
    variables: [], device: [], lists: [],
    copies: [{ key: "c1", label: "Client", block_id: 1, name: "one", path: "/c1" }, { key: "c2", label: "Client", block_id: 1, name: "two", path: "/c2" }],
    endpoints: ["c1", "c2"].map((c) => ({ key: `${c}/endpoint`, slot: "endpoint", copy: c, fields: ["ip"], endpoint_types: ["plc"] })),
  },
} as unknown as TemplateInputsSource;

function Harness() {
  const form = useTemplateInputs("dev-1", SOURCE, null, {
    $endpoints: { "c1/endpoint": "e2", "c2/endpoint": "e2" }, $services: { "c1/endpoint": "s1", "c2/endpoint": "s1" },
  });
  return (
    <>
      <TemplateInputs form={form} findings={[]} blocked={false} />
      <output data-testid="state">{JSON.stringify({ endpoints: form.endpoints, services: form.services })}</output>
    </>
  );
}

describe("TemplateInputs type restriction", () => {
  beforeEach(() => {
    http.get.mockReset().mockImplementation(async (url: string) => {
      if (url === "/dev-1/config/endpoints") {
        return { data: [
          { endpoint_id: "e1", type_id: "plc", type_label: "PLC", name: "plc-1", fields: {} },
          { endpoint_id: "e2", type_id: "modbus", type_label: "Modbus device", name: "mb-1", fields: {} },
        ] };
      }
      throw new Error(`unexpected GET ${url}`);
    });
  });

  it("clears a misfit choice in every copy group, not only in the last section to update", async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><Harness /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe(JSON.stringify({ endpoints: {}, services: {} })));
  });
});
