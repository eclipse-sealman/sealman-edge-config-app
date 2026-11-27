import { fireEvent, render, screen } from "@testing-library/react";
import type { components } from "@/generated/edge-administration/types";
import RenewPassword from "./RenewPassword";

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/generated/edge-administration/hooks/useRenewDevicePassword", () => ({
  useRenewDevicePassword: () => ({ mutate, isPending: true, error: null, reset: vi.fn() }),
}));

const info: components["schemas"]["DeviceSecretInformation"] = {
  id: 1,
  deviceTypeHasAuthSecret: true,
  forceRenewal: false,
  secretValueRenewAfterDays: 1,
  renewalTask: null,
};

it("disables confirmation and cancellation while renewal is in flight", () => {
  render(<RenewPassword deviceId="eg-1" info={info} canRenew onRenewalStart={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Renew password" }));
  expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  expect(mutate).not.toHaveBeenCalled();
});
