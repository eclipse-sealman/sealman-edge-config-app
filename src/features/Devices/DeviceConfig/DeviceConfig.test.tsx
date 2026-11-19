import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DeviceConfig from "./DeviceConfig";
import SecurityInformation from "../DeviceInfo/Security/SecurityInformation";
import { isDevicePasswordEnabled } from "@/config/devicePassword";

vi.mock("./DeviceIpSetup", () => ({ default: () => <div>Network interfaces</div> }));
vi.mock("./DeviceCellularConfig", () => ({ Cellular: () => null }));
vi.mock("./ActivateConfigButton", () => ({ ActivateConfigButton: () => null }));
vi.mock("./useSmartEmsStatusPolling", () => ({ default: () => ({ data: undefined }) }));
it("hides Security navigation and blocks its direct route with the actual opt-in environment flag disabled", () => {
  expect(isDevicePasswordEnabled()).toBe(false);
  render(
    <MemoryRouter initialEntries={["/devices/eg-1/device-config/security"]}>
      <Routes><Route path="/devices/:deviceId/device-config/*" element={<DeviceConfig />} /></Routes>
    </MemoryRouter>,
  );
  expect(screen.queryByRole("link", { name: "Security" })).not.toBeInTheDocument();
  expect(screen.queryByText("Device Security")).not.toBeInTheDocument();
  expect(screen.getByText("Network interfaces")).toBeInTheDocument();
});

it("does not mount password querying on a direct Security render with the actual flag disabled", () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("No network allowed in this test."));
  try {
    render(
      <MemoryRouter initialEntries={["/devices/eg-1/device-config/security"]}>
        <Routes><Route path="/devices/:deviceId/device-config/security" element={<SecurityInformation />} /></Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Device Security")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    fetch.mockRestore();
  }
});
