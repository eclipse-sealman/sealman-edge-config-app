import { fireEvent, render, screen } from "@testing-library/react";
import RequestPassword from "./RequestPassword";
import PasswordValue from "./PasswordValue";

const { request, reset } = vi.hoisted(() => ({ request: vi.fn(), reset: vi.fn() }));
vi.mock("@/generated/edge-administration/hooks/usePostDeviceRequestPassword", () => ({
  default: () => ({ password: null, request, reset, isPending: false, error: null }),
}));

beforeEach(() => vi.clearAllMocks());

it("starts reveal only on an explicit allowed click and resets on close", () => {
  render(<RequestPassword deviceId="eg-1" canRead />);
  expect(request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Show password value" }));
  expect(request).toHaveBeenCalledOnce();
  fireEvent.click(screen.getAllByRole("button", { name: "Close" })[1]);
  expect(reset).toHaveBeenCalledOnce();
});

it("reports clipboard failure rather than announcing success", async () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) } });
  render(<PasswordValue password={{ id: 1, secretValue: "test-password", renewalTask: null }} />);
  fireEvent.click(screen.getByRole("button", { name: "Copy" }));
  await screen.findByText("Could not copy the password. Select and copy it manually.");
  expect(screen.queryByRole("button", { name: "Copied" })).not.toBeInTheDocument();
});
