import { QueryClientProvider } from "@tanstack/react-query";
import { useGetPeriodicScanData } from "../useGetPeriodicScanData";
import { queryClient } from "@/config/queryConfig";

describe("useGetPeriodicScanData", () => {
  it("Should display result and loading status correctly", () => {
    cy.viewport("macbook-16");

    const MyComponent = () => {
      const { scanResults, isLoading } = useGetPeriodicScanData("testId");

      return (
        <div>
          <div>{scanResults[0]?.ip || "no result"}</div>
          <div>{isLoading ? "Loading..." : "Loaded"}</div>
        </div>
      );
    };

    let callCount = 0;

    cy.intercept(
      {
        method: "GET",
        url: /\.*\/network\/topology/,
      },
      (req) => {
        callCount += 1;

        if (callCount === 1) {
          req.reply({
            statusCode: 200,
            body: null,
          });
        } else if (callCount === 2) {
          req.reply({
            statusCode: 200,
            body: topologyResponseBody,
          });
        }
      }
    ).as("interceptGetTopology");

    cy.clock()

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MyComponent />
      </QueryClientProvider>
    );

    cy.wait("@interceptGetTopology").then(() => {
      cy.contains("Loading...") 
      cy.contains("no result"); 
    });

    cy.tick(1000)
    // Without this restore, the component does not rerender after the 2nd intercept
    cy.clock().then((clock) => {
      clock.restore()
    })

    cy.wait("@interceptGetTopology").then(() => {
      cy.contains("192.168.0.1");
      cy.contains("Loaded")
    });
  });
});

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
  ]
};