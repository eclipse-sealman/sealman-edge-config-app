import { msalInstance } from "@/auth/providers/entra";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/config/queryConfig";
import { deviceInterceptors } from "../../../lib/interceptors";
import waitFor from "../../../lib/utlis/wait";
import DeviceNatConfigProvided from "@/features/Devices/DeviceConfig/NatConfig/DeviceNatConfigProvided";
import "../../../../src/index.css";
import { waitPostDeviceNatConfig } from "../../../lib/interceptors/devices";

import { setMockPermission } from "@/features/authorization/permissions/use-permissions";
setMockPermission();

describe("Natconfig", () => {
  it("should integrate the DeviceNatConfig component succesfuly: list the rules and update one", () => {
    cy.viewport("macbook-16");
    cy.stub(msalInstance, "acquireTokenSilent").resolves("my-token");

    deviceInterceptors.deviceNatConfig();
    deviceInterceptors.postDeviceNatConfig();
    deviceInterceptors.getSmartEMSStatus();

    cy.mount(
      <MemoryRouter initialEntries={["/devices/23002404"]}>
        <Routes>
          <Route
            path="/devices/:deviceId"
            element={
              <QueryClientProvider client={queryClient}>
                <DeviceNatConfigProvided />
              </QueryClientProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    waitFor(deviceInterceptors.waitDeviceNatConfig);
    waitFor(deviceInterceptors.waitSmartEmsStatus);

    // Assert values from fixtures
    cy.get("#enable-config-nat").should("not.be.checked");
    cy.get("#name-0").should("have.value", "nat-config-1");
    cy.get("#extIp-0").should("have.value", "36.3.254.253");
    cy.get("#intIp-0").should("have.value", "255.4.74.231");
    cy.get("#name-1").should("have.value", "nat-config-2");
    cy.get("#extIp-1").should("have.value", "200.206.143.214");
    cy.get("#intIp-1").should("have.value", "8.54.09.230");

    // delete rules
    cy.contains("Delete rule").click();
    cy.contains("Delete rule").click();

    // click enable
    cy.get("#enable-config-nat").click();

    // Assert save
    cy.contains("Save").click();

    cy.wait(`@${waitPostDeviceNatConfig}`).then(({ request }) => {
      assert.deepEqual(request?.body, {
        nat_enabled: true,
        nat_rules: [],
      });
    });
  });
});
