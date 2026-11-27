import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TemplateInputs, useTemplateInputs, type TemplateInputsSource } from "./TemplateInputs";

const http = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/api/edgeConfig/edgeConfigApi", () => ({ edgeConfigApiInstance: http }));
vi.mock("@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes", () => ({ default: () => ({ data: [] }) }));
vi.mock("@/generated/edge-administration/hooks/service_types/useGetServiceTypes", () => ({ default: () => ({ data: [] }) }));

const files = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("@/features/PlatformTypes/fileFieldApi", () => ({ uploadFieldFile: files.upload }));

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

const ref = (name: string, not_after: string | null = null) =>
  ({ $file: `id-${name}`, name, kind: "certificate", not_after, uploaded_at: "2026-01-01T00:00:00Z" });

const FILE_SOURCE = (variables: object[], copies: object[] = []) => ({
  variables: [], references: { variables: [], device: [] },
  inputs: { variables, device: [], lists: [], copies, endpoints: [] },
}) as unknown as TemplateInputsSource;

function FileHarness({ source, findings = [], stored }: { source: TemplateInputsSource; findings?: { level: "error"; path: string; code: string; message: string }[]; stored?: Record<string, unknown> }) {
  const form = useTemplateInputs("dev-1", source, null, stored as never, { module: "mod", templateId: 7 });
  return (
    <>
      <TemplateInputs form={form} findings={findings as never} blocked={false} />
      <output data-testid="sent">{JSON.stringify(form.sent.values)}</output>
    </>
  );
}

const renderFiles = (source: TemplateInputsSource, findings?: never[], stored?: Record<string, unknown>) =>
  render(<QueryClientProvider client={new QueryClient()}><FileHarness source={source} findings={findings} stored={stored} /></QueryClientProvider>);

describe("file variables", () => {
  beforeEach(() => files.upload.mockReset());
  const withDefault = { name: "ca", key: "ca", type: "file", default: ref("default.pem", "2099-01-01T00:00:00Z") };

  it("uploads another file for the module, then goes back to the default without sending a value", async () => {
    const user = userEvent.setup();
    files.upload.mockResolvedValue(ref("mine.pem"));
    renderFiles(FILE_SOURCE([withDefault]));
    expect(screen.getByText(/default\.pem/).textContent).toContain("valid until 2099-01-01 · default");
    expect(screen.getByTestId("sent").textContent).toBe("{}");

    await user.click(screen.getByRole("button", { name: "Use another file" }));
    const file = new File(["x"], "mine.pem");
    await user.upload(screen.getByTestId("file-input"), file);
    await screen.findByRole("button", { name: "Use the default" });
    expect(screen.getByText("mine.pem", { selector: "span.flex-1", exact: false })).toBeTruthy();
    expect(files.upload).toHaveBeenCalledWith({ kind: "module", device: "dev-1", module: "mod", templateId: 7 }, "ca", file, undefined);
    expect(JSON.parse(screen.getByTestId("sent").textContent!)).toEqual({ ca: ref("mine.pem") });
    expect(screen.queryByRole("button", { name: "Download" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Use the default" }));
    expect(screen.getByTestId("sent").textContent).toBe("{}");
    expect(screen.getByText(/default\.pem/)).toBeTruthy();
  });

  it("shows no file and an upload for a variable without default, and the missing-value finding", () => {
    renderFiles(FILE_SOURCE([{ name: "ca", key: "ca", type: "file" }]), [{ level: "error", path: "/values/ca", code: "missing", message: "ca is required" }] as never);
    expect(screen.getByText("No file")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upload" })).toBeTruthy();
    expect(screen.getByText("ca is required")).toBeTruthy();
  });

  it("clears a file chosen for a variable without default", async () => {
    const user = userEvent.setup();
    files.upload.mockResolvedValue(ref("mine.pem"));
    renderFiles(FILE_SOURCE([{ name: "ca", key: "ca", type: "file", required: false }]));
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    await user.upload(screen.getByTestId("file-input"), new File(["x"], "mine.pem"));
    await user.click(await screen.findByRole("button", { name: "Clear" }));
    expect(screen.getByTestId("sent").textContent).toBe("{}");
    expect(screen.getByText("No file")).toBeTruthy();
  });

  it("offers to clear a prefilled value that is not a file instead of showing the default", async () => {
    const user = userEvent.setup();
    renderFiles(FILE_SOURCE([withDefault]), undefined, { ca: "old text" });
    expect(screen.getByText("Not a file")).toBeTruthy();
    expect(screen.queryByText(/default\.pem/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Use the default" }));
    expect(screen.getByTestId("sent").textContent).toBe("{}");
    expect(screen.getByText(/default\.pem/).textContent).toContain("· default");
  });

  it("uploads under the key of the block copy", async () => {
    const user = userEvent.setup();
    files.upload.mockResolvedValue(ref("mine.pem"));
    renderFiles(FILE_SOURCE([{ name: "ca", key: "a/ca", copy: "a", type: "file" }], [{ key: "a", label: "Client", block_id: 1, name: "one", path: "/a" }]));
    await user.upload(screen.getByTestId("file-input"), new File(["x"], "mine.pem"));
    await waitFor(() => expect(files.upload).toHaveBeenCalled());
    expect(files.upload.mock.calls[0][1]).toBe("a/ca");
  });

  it("shows an expired default as an error", () => {
    renderFiles(FILE_SOURCE([{ ...withDefault, default: ref("old.pem", "2020-01-01T00:00:00Z") }]));
    expect(screen.getByText("expired 2020-01-01").className).toContain("text-destructive");
  });
});
