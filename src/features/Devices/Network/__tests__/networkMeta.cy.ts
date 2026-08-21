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
     */

    cy.intercept(
      {
        method: "GET",
        url: /\/endpoint-types/,
      },
      [
        {
          type_id: "plc",
          label: "PLC",
          description: "Machine",
          fields: {
            ip_address: { type: "string", label: "IP Address", required: true, default: "172.22.220.1", changeable: true },
          },
          mapping: { ip_address: "ip" },
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ]
    ).as("getEndpointTypes");

    cy.intercept(
      {
        method: "GET",
        url: /\/service-types/,
      },
      [
        {
          type_id: "ftp",
          label: "FTP Server",
          description: "FTP Server",
          fields: {
            port: { type: "integer", label: "Port", required: true, default: 21, changeable: true },
          },
          mapping: { port: "port" },
          browser_kind: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
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