import { msalInstance } from "@/auth/providers/entra"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/config/queryConfig"
import ModuleList from "@/features/Devices/ModuleConfig/ModuleList"
import DeploymentInfo from "@/features/Devices/ModuleConfig/DeploymentInfo"
import "../../../../src/index.css"
import { deviceInterceptors } from "../../../lib/interceptors"
import waitFor from "../../../lib/utlis/wait"
import { setMockPermission } from "@/features/authorization/permissions/use-permissions";
setMockPermission();

it('should display the module config', () => {
    cy.viewport("macbook-16")
    
    // Mock MSAL authentication
    const mockAccount = {
      homeAccountId: "test-id",
      environment: "test-env",
      tenantId: "test-tenant",
      username: "test@example.com",
      localAccountId: "test-local-id",
      name: "Test User"
    };
    
    cy.stub(msalInstance, "getActiveAccount").returns(mockAccount);
    cy.stub(msalInstance, "acquireTokenSilent").resolves({
      accessToken: "my-token",
      account: mockAccount
    });
    
    deviceInterceptors.getDeployments()
    deviceInterceptors.getDeploymentStatus()
    deviceInterceptors.getModule()
    deviceInterceptors.postConfigStatus()
    deviceInterceptors.postModuleMethods()

    cy.mount(
      <MemoryRouter initialEntries={["/devices/23002404/module-config"]}>
        <Routes>
          <Route
            path="/devices/:deviceId/module-config"
            element={
              <QueryClientProvider client={queryClient}>
                <div className="space-y-4">
                  <DeploymentInfo />
                  <ModuleList />
                </div>
              </QueryClientProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    waitFor(deviceInterceptors.waitDeviceModule)
    waitFor(deviceInterceptors.waitConfigStatus)

    cy.contains("$edgeAgent").click()
    cy.contains("Logs").click()

    waitFor(deviceInterceptors.waitModuleMethods)
    cy.contains("info: register <configureModule> method... {\"timestamp\":\"2024-12-09T20:07:42.067Z\"}")
  })
