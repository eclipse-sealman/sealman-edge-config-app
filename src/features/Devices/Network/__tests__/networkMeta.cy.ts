/// <reference types="cypress" />
import { expect } from "chai";
import { loadNetworkMeta, isMetaLoaded } from "../api/networkMeta";

describe("networkMeta", () => {

  beforeEach(() => {
    /**
     * Instead of mocking edgeConfigApi,
     * we intercept the HTTP calls it makes.
     * This is the SAME pattern used in:
     * - network-with-data.cy.tsx
     * - network-setup.cy.tsx
     */

    cy.intercept(
      {
        method: "GET",
        url: /\.*\/types/,
      },
      [
        { name: "PLC", description: "Machine", defaultIP: "172.22.220.1" },
      ]
    ).as("getEndpointTypes");

    cy.intercept(
      {
        method: "GET",
        url: /\.*\/services/,
      },
      [
        {
          defaultPort: "21",
          deviceEndpointServiceName: "FTP Server",
          description: "FTP Server",
        },
      ]
    ).as("getServicePorts");
  });

  it("should load endpoint types and services into cache", () => {
    cy.then(async () => {
      await loadNetworkMeta();
    });

    cy.wait("@getEndpointTypes");
    cy.wait("@getServicePorts");

    cy.then(() => {
      expect(isMetaLoaded()).to.equal(true);
    });
  });

  it("should not call APIs again if cache already exists", () => {
    cy.then(async () => {
      await loadNetworkMeta();
      await loadNetworkMeta(); // second call should use cache
    });

    // because cache is used → APIs only called once
    cy.get("@getEndpointTypes.all").should("have.length", 1);
    cy.get("@getServicePorts.all").should("have.length", 1);
  });

});