import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeviceGatewayCard from "./DeviceGatewayCard";

const mocks = vi.hoisted(() => {
  const field = {
    type: "string", ui: "input", required: false, changeable: true, show_in_list: true, default: null,
  };
  return {
    patchMetadata: vi.fn(),
    patchDeviceType: vi.fn(),
    notify: vi.fn(),
    metadata: {
      typeId: "gateway",
      deviceMetadata: {
        name: { value: "Saved name" },
        serial: { value: "Saved serial" },
        note: { value: "Custom note" },
      },
    },
    types: [
      { type_id: "default", label: "Default", fields: { name: { ...field, label: "Name", required: true } } },
      { type_id: "gateway", label: "Gateway type", fields: { serial: { ...field, label: "Serial" } } },
      { type_id: "other", label: "Other type", fields: {} },
    ],
  };
});

vi.mock("@/generated/edge-administration/hooks/device_metadata/useGetDeviceMetadata", () => ({
  default: () => ({ data: mocks.metadata }),
}));
vi.mock("@/generated/edge-administration/hooks/device_types/useGetDeviceTypes", () => ({
  default: () => ({ data: mocks.types }),
}));
vi.mock("@/generated/edge-administration/hooks/device_metadata/usePatchDeviceMetadata", () => ({
  default: () => ({ query: mocks.patchMetadata, isPending: false }),
}));
vi.mock("@/generated/edge-administration/hooks/device_metadata/usePatchDeviceType", () => ({
  default: () => ({ patchDeviceType: mocks.patchDeviceType, isPending: false }),
}));
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: () => ({ hasPermission: true }),
}));
vi.mock("react-toastify", () => ({ toast: { success: mocks.notify, error: mocks.notify } }));

describe("gateway metadata editing", () => {
  beforeEach(() => {
    mocks.patchMetadata.mockReset().mockResolvedValue(undefined);
    mocks.patchDeviceType.mockReset();
    mocks.notify.mockReset();
  });

  const renderEditing = () => {
    render(<DeviceGatewayCard deviceId="device-a" />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  };

  it("shows the existing device type read-only and keeps its metadata fields editable", () => {
    renderEditing();
    expect(screen.getAllByText("Gateway type")).toHaveLength(2);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("Other type")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Saved name")).toBeEnabled();
    expect(screen.getByDisplayValue("Saved serial")).toBeEnabled();
  });

  it("keeps device type, metadata, and custom values in their existing grid positions while editing", () => {
    render(<DeviceGatewayCard deviceId="device-a" />);
    fireEvent.click(screen.getByRole("button", { name: "Device details" }));
    const typeField = screen.getByText("Device Type").parentElement;
    const nameField = screen.getByText("Saved name").closest("dd")!.parentElement;
    const customField = screen.getByText("Custom note").closest("dd")!.parentElement;
    const grid = nameField!.parentElement;
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Device Type").parentElement).toBe(typeField);
    expect(screen.getByRole("textbox", { name: "Name" }).closest("dd")!.parentElement).toBe(nameField);
    expect(screen.getByRole("textbox", { name: "note" }).closest("dd")!.parentElement).toBe(customField);
    expect(nameField!.parentElement).toBe(grid);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Saved name").closest("dd")!.parentElement).toBe(nameField);
    expect(mocks.patchMetadata).not.toHaveBeenCalled();
  });

  it("keeps device metadata collapsed by default and opens it without entering edit mode", () => {
    render(<DeviceGatewayCard deviceId="device-a" />);
    const details = screen.getByRole("button", { name: "Device details" });
    expect(details).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Custom note")).not.toBeVisible();
    fireEvent.click(details);
    expect(details).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Custom note")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(details);
    expect(screen.getByText("Custom note")).not.toBeVisible();
  });

  it("saves metadata without submitting a device type change", async () => {
    renderEditing();
    fireEvent.change(screen.getByDisplayValue("Saved name"), { target: { value: "Updated name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mocks.patchMetadata).toHaveBeenCalledWith({
      deviceId: "device-a",
      body: { name: "Updated name", serial: "Saved serial", note: "Custom note" },
    }));
    expect(mocks.patchDeviceType).not.toHaveBeenCalled();
    await screen.findByRole("button", { name: "Edit" });
  });

  it("preserves deletion of optional metadata fields", async () => {
    renderEditing();
    fireEvent.click(screen.getByTitle('Clear "Serial"'));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mocks.patchMetadata).toHaveBeenCalledWith({
      deviceId: "device-a",
      body: { name: "Saved name", serial: null, note: "Custom note" },
    }));
    expect(mocks.patchDeviceType).not.toHaveBeenCalled();
  });

  it("still validates the current type and default metadata fields before saving", () => {
    renderEditing();
    fireEvent.change(screen.getByDisplayValue("Saved name"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(mocks.notify).toHaveBeenCalledWith('"Name" is required');
    expect(mocks.patchMetadata).not.toHaveBeenCalled();
    expect(mocks.patchDeviceType).not.toHaveBeenCalled();
  });
});
