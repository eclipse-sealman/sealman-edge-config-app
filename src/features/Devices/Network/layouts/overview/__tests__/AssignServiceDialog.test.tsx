import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssignServiceDialog, { type ExistingService } from "../AssignServiceDialog";

const mocks = vi.hoisted(() => ({
  types: [{
    type_id: "service", label: "Service", description: null, mapping: {},
    fields: {
      note: { type: "string", ui: "input", label: "Note", default: "DEFAULT" },
      quantity: { type: "integer", ui: "number", label: "Quantity", default: 10 },
      enabled: { type: "boolean", ui: "toggle", label: "Enabled", default: true },
    },
  }],
  postService: vi.fn(),
  updateService: vi.fn(),
}));

vi.mock("@/generated/edge-administration/hooks/service_types/useGetServiceTypes", () => ({
  default: () => ({ data: mocks.types }),
}));
vi.mock("@/generated/edge-administration/hooks/services/usePostService", () => ({
  usePostService: () => ({ postService: mocks.postService, isPending: false }),
}));
vi.mock("@/generated/edge-administration/hooks/services/useUpdateService", () => ({
  useUpdateService: () => ({ updateService: mocks.updateService, isPending: false }),
}));
vi.mock("@/generated/edge-administration/hooks/services/useDeleteService", () => ({
  useDeleteService: () => ({ deleteService: vi.fn(), isPending: false }),
}));

describe("AssignServiceDialog stored defaults", () => {
  beforeEach(() => {
    mocks.postService.mockReset().mockResolvedValue(undefined);
    mocks.updateService.mockReset().mockResolvedValue(undefined);
  });

  it.each<ExistingService["service_data"]>([
    {},
    { note: { value: null, field: null }, quantity: { value: null, field: null }, enabled: { value: null, field: null } },
    { note: { value: "", field: null }, quantity: { value: 0, field: null }, enabled: { value: false, field: null } },
  ])("does not repopulate existing values from schema defaults: %j", async (service_data) => {
    render(<AssignServiceDialog open onOpenChange={() => {}} endpointId="endpoint"
      existingService={{ service_id: "existing", type_id: "service", service_data }} onCreated={() => {}} />);
    expect(screen.queryByDisplayValue("DEFAULT")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("10")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(mocks.updateService).toHaveBeenCalledWith({
      serviceId: "existing",
      body: { service_data: {
        note: service_data.note?.value ?? null,
        quantity: service_data.quantity?.value ?? null,
        enabled: service_data.enabled?.value ?? null,
      } },
    });
  });

  it("still initializes defaults when creating a service", async () => {
    render(<AssignServiceDialog open onOpenChange={() => {}} endpointId="endpoint" defaultTypeId="service" onCreated={() => {}} />);
    expect(screen.getByDisplayValue("DEFAULT")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Create Service" }));
    expect(mocks.postService).toHaveBeenCalledWith({
      endpointId: "endpoint",
      body: { type_id: "service", service_data: { note: "DEFAULT", quantity: 10, enabled: true } },
    });
  });
});
