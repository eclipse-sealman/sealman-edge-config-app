import "@/index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/config/queryConfig";
import Page from "../Page";
import { expect } from "chai";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { setMockPermission } from "@/features/authorization/permissions/use-permissions";
setMockPermission();

describe("Network", () => {
  it("should display the network page after setting up the network", () => {
    cy.viewport("macbook-16");

    cy.intercept(
      {
        method: "get",
        url: /\.*\/twin\/config\/.*/,
      },
      (req) => {
        req.reply({ body: null });
      }
    ).as("interceptTwinConfig1stcall");
    cy.intercept(
      {
        method: "get",
        url: /\.*\/network\/topology/,
      },
      topologyResponseBody
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

    cy.wait("@interceptTwinConfig1stcall");

    cy.contains("Configure Network Scan").click();

    cy.get("#network-prefix-input").type("192.168.0.0");
    cy.get("#subnet-input").type("24");

    cy.intercept(
      {
        method: "post",
        url: /\.*\/twin\/config\/.*/,
      },
      scanDefinitionPostResponse
    ).as("interceptPostTwinConfig");
    cy.intercept(
      {
        url: /\.*\/twin\/config\/.*/,
        method: "get",
      },
      scanDefinitionPostResponse
    ).as("interceptTwinInvalidated");

    cy.get("#save-btn").click();

    cy.wait("@interceptPostTwinConfig").then((i) => {
      const scanDefinition = i.request.body.scanDefinition;
      expect(scanDefinition.networkDefinition).to.eq("192.168.0.0");
      expect(scanDefinition.subnetMask).to.eq(24);
    });

    cy.wait("@interceptTwinInvalidated");
    cy.wait("@interceptGetTopology");

    cy.contains("192.168.0.1");
  });
});

const scanDefinitionPostResponse = {
  scheduledCron: "* * * * *",
  scanDefinition: {
    networkDefinition: "192.168.0.0",
    subnetMask: 24,
    ports: [80, 8017, 8080, 9090],
  },
  endpointNames: {
    "192.168.0.139": {
      name: "PowerPakHMI",
      serviceNames: {
        "80": "",
        "8017": "OPC-UA Server",
      },
    },
  },
};

const topologyResponseBody = {
  scanResults: [
    {
      ip: "192.168.0.1",
      status: "online",
      lastStatusChange: "2025-03-13T14:34:33.74756+00:00",
      ports: {
        "80": {
          status: "online",
          lastStatusChange: "2025-03-13T14:34:33.74756+00:00",
        },
      },
    },
  ],
  scanDefinition: {
    networkDefinition: "192.168.0.0",
    ports: [80, 8017, 8080, 9090],
    subnetMask: 24,
  },
};
