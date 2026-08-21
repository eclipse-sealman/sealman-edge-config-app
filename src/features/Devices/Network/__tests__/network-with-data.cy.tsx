import "@/index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/config/queryConfig";
import Page from "../Page";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { setMockPermission } from "@/features/authorization/permissions/use-permissions";
setMockPermission();

describe("Network", () => {
  it("should display the network page with twin config data", () => {
    cy.viewport("macbook-16");

    cy.intercept(
      {
        method: "get",
        url: /\.*\/twin\/config\/.*/,
      },
      getTwinConfigResponseBody
    ).as("interceptGetTwinConfig");

    cy.intercept(
      {
        method: "get",
        url: /\.*\/network\/topology/,
      },
      getTopologyResponseBody
    ).as("interceptGetTopology");

    cy.mount(
      <MemoryRouter initialEntries={["/devices/23002404"]}>
        <Routes>
          <Route
            path="/devices/:deviceId"
            element={
              <QueryClientProvider client={queryClient}>
                  <div className="h-screen">
                    <Page deviceId="23002404" />
                  </div>
                </QueryClientProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    cy.wait("@interceptGetTwinConfig");
    cy.wait("@interceptGetTopology");

    // The endpoint list/search sidebar only shows alongside the Topology tab now - Endpoints &
    // Services (the default tab) has its own, separate view of this data.
    cy.contains("Topology").click();

    cy.contains("Shingle Loader");
    cy.contains("Alternative Name");
    cy.contains("172.22.220.2").click();
    cy.contains("FTP Server");
    cy.contains("80");
    cy.contains("OPC-UA Server").should("not.exist");
  });
});

const getTwinConfigResponseBody = {
  scheduledCron: "* * * * *",
  scanDefinition: {
    networkDefinition: "172.22.220.0",
    subnetMask: 23,
    ports: [21, 80],
  },
  endpointNames: {
    "172.22.220.1": {
      name: "Shingle Loader",
    },
    "172.22.220.2": {
      serviceNames: {
        "21": "FTP Server",
        "4840": "OPC-UA Server",
      },
    },
    "172.22.220.3": {
      name: "Shingle Loader",
      description: "Alternative Name",
    },
  },
};

const getTopologyResponseBody = {
  scanResults: [
    {
      ip: "172.22.220.1",
      status: "online",
      lastStatusChange: "2025-02-10T11:07:01.957535+00:00",
      ports: {},
    },
    {
      ip: "172.22.220.2",
      status: "online",
      lastStatusChange: "2025-02-10T11:07:01.957535+00:00",
      ports: {
        "21": {
          status: "offline",
          lastStatusChange: "2025-02-10T11:07:01.957535+00:00",
        },
        "80": {
          status: "online",
          lastStatusChange: "2025-02-10T11:07:01.957535+00:00",
        },
      },
    },
    {
      ip: "172.22.220.3",
      status: "offline",
      lastStatusChange: "2025-02-10T11:07:01.957535+00:00",
      ports: {},
    },
  ],
  scanDefinition: {
    networkDefinition: "172.22.220.0",
    ports: [21, 80],
    subnetMask: 23,
  },
};
