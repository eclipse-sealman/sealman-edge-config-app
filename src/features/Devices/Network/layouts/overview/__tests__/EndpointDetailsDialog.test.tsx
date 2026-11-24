import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import EndpointDetailsDialog from "../EndpointDetailsDialog";

const mocks = vi.hoisted(() => ({ slotProps: [] as Array<Record<string, unknown>>, invalidate: vi.fn() }));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));
vi.mock("@/features/Extensions/outlets/ExtensionOutlet", () => ({
  default: (props: { onDataChanged?: () => void }) => {
    mocks.slotProps.push(props as Record<string, unknown>);
    return <button onClick={() => props.onDataChanged?.()}>panel-changed</button>;
  },
}));
vi.mock("@/features/Extensions/outlets/useOutletUser", () => ({ useOutletUser: () => ({ id: "u1", name: "User" }) }));
vi.mock("@/generated/edge-administration/hooks/device_metadata/useGetDeviceMetadata", () => ({
  default: () => ({ data: { typeId: "dt1" }, isLoading: false }),
}));
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: () => ({ hasPermission: true }),
}));
vi.mock("../EndpointAccordionItem", () => ({
  default: ({ initialServiceId }: { initialServiceId?: string | null }) => <div>row {initialServiceId ?? "none"}</div>,
}));

const endpoint = { endpoint_id: "e1", type_id: "t1", type_label: "Type One", status: "online", source: "configured", ports: [] };

describe("EndpointDetailsDialog", () => {
  it("renders nothing without an endpoint", () => {
    render(<EndpointDetailsDialog endpoint={null} deviceId="dev-1" onClose={() => {}} onChanged={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the endpoint row with the requested service and the extension slot context", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EndpointDetailsDialog endpoint={endpoint as any} serviceId="s1" deviceId="dev-1" onClose={() => {}} onChanged={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("row s1")).toBeInTheDocument();
    expect(mocks.slotProps.at(-1)).toMatchObject({
      target: "endpoint",
      context: { deviceId: "dev-1", deviceTypeId: "dt1", endpointId: "e1", endpointTypeId: "t1", canEdit: true },
    });
  });

  it("refreshes the overview when an extension panel changed data", () => {
    const onChanged = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EndpointDetailsDialog endpoint={endpoint as any} deviceId="dev-1" onClose={() => {}} onChanged={onChanged} />);
    fireEvent.click(screen.getByText("panel-changed"));
    expect(onChanged).toHaveBeenCalledTimes(1);
  });
});
