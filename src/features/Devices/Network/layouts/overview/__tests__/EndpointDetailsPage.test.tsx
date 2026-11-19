import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EndpointDetailsPage from "../EndpointDetailsPage";
import type { FieldDefinition } from "@/features/PlatformTypes/FieldsEditor";

const mocks = vi.hoisted(() => ({
  endpoint: undefined as unknown,
  hasPermission: true,
  fields: {} as Record<string, FieldDefinition>,
  updateEndpoint: vi.fn(),
  refetch: vi.fn(),
}));

const endpointFixture = {
  endpoint_id: "e1",
  type_id: "t1",
  type_label: "Type One",
  type_description: null,
  endpoint_data: {},
};

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/features/Extensions/outlets/ExtensionOutlet", () => ({
  default: (props: Record<string, unknown>) => <div data-testid="slot">{JSON.stringify(props)}</div>,
}));
vi.mock("@/features/Extensions/outlets/useOutletUser", () => ({ useOutletUser: () => ({ id: "u1", name: "User" }) }));
vi.mock("@/generated/edge-administration/hooks/device_metadata/useGetDeviceMetadata", () => ({
  default: () => ({ data: { typeId: "dt1" } }),
}));
vi.mock("@/features/Devices/Network/stores", () => ({
  useNetworkPageStore: (selector: (s: { deviceId: string }) => unknown) => selector({ deviceId: "dev-1" }),
}));
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: () => ({ hasPermission: mocks.hasPermission }),
}));
vi.mock("@/generated/edge-administration/hooks/endpoints/useGetEndpoint", () => ({
  default: () => ({ data: mocks.endpoint, isLoading: false, isError: false, refetch: mocks.refetch }),
}));
vi.mock("@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes", () => ({
  default: () => ({ data: [{ type_id: "t1", label: "Type One", description: null, fields: mocks.fields, mapping: {} }] }),
}));
vi.mock("@/generated/edge-administration/hooks/services/useGetServices", () => ({
  default: () => ({ data: [], refetch: vi.fn() }),
}));
vi.mock("@/generated/edge-administration/hooks/endpoints/useUpdateEndpoint", () => ({
  useUpdateEndpoint: () => ({ updateEndpoint: mocks.updateEndpoint, isPending: false }),
}));
vi.mock("@/generated/edge-administration/hooks/endpoints/useDeleteEndpoint", () => ({
  useDeleteEndpoint: () => ({ deleteEndpoint: vi.fn(), isPending: false }),
}));
vi.mock("../AssignServiceDialog", () => ({ default: () => null }));
vi.mock("../ConfirmDeleteDialog", () => ({ default: () => null }));
vi.mock("../ReassignEndpointDialog", () => ({ default: () => null }));

const renderPage = () =>
  render(<EndpointDetailsPage endpointId="e1" onBack={() => {}} onOpenServiceDetails={() => {}} onUpdated={() => {}} />);

describe("EndpointDetailsPage endpoint.details slot", () => {
  beforeEach(() => {
    mocks.endpoint = endpointFixture;
    mocks.hasPermission = true;
    mocks.fields = {};
    mocks.updateEndpoint.mockReset();
    mocks.refetch.mockReset();
  });

  it("renders the endpoint section outlet with ids and edit rights for writers", () => {
    renderPage();
    expect(JSON.parse(screen.getByTestId("slot").textContent!)).toEqual({
      target: "endpoint",
      placement: "section",
      context: {
        user: { id: "u1", name: "User" },
        deviceId: "dev-1",
        deviceTypeId: "dt1",
        endpointId: "e1",
        endpointTypeId: "t1",
        canEdit: true,
      },
    });
  });

  it("passes canEdit false without endpoint write", () => {
    mocks.hasPermission = false;
    renderPage();
    expect(JSON.parse(screen.getByTestId("slot").textContent!).context.canEdit).toBe(false);
  });

  it("uses newly assigned row IDs for subsequent saves, even when refetch fails", async () => {
    const equipment: FieldDefinition = {
      type: "list", label: "Equipment", required: false, changeable: true, show_in_list: true,
      item_fields: {
        identifier: { type: "string", ui: "input", label: "Identifier", required: true, changeable: true, show_in_list: true },
      },
    };
    mocks.fields = { equipment };
    const original = { id: "original-id", identifier: "A", extra: { nested: ["keep"] } };
    const savedRows = [original, { id: "assigned-id", identifier: "B" }];
    mocks.endpoint = { ...endpointFixture, endpoint_data: { equipment: { value: [original], field: equipment } } };
    mocks.updateEndpoint.mockResolvedValue({
      ...endpointFixture, endpoint_data: { equipment: { value: savedRows, field: equipment } },
    });
    mocks.refetch.mockResolvedValue({ isError: true, data: mocks.endpoint });
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Add row" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Identifier, row 2" }), "B");
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mocks.refetch).toHaveBeenCalledOnce());
    expect(mocks.updateEndpoint.mock.calls[0][0].body.endpoint_data.equipment).toEqual([
      original, { identifier: "B" },
    ]);

    await userEvent.type(screen.getByRole("textbox", { name: "Identifier, row 2" }), "2");
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mocks.updateEndpoint).toHaveBeenCalledTimes(2));
    expect(mocks.updateEndpoint.mock.calls[1][0].body.endpoint_data.equipment).toEqual([
      original, { id: "assigned-id", identifier: "B2" },
    ]);
  });
});
