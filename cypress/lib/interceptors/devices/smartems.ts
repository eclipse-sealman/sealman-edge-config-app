export const waitSmartEmsStatus = "waitSmartEmsStatus";

export function getSmartEMSStatus() {
  cy.fixture("devices/smartems-status").then(f => {
    cy.intercept({
      method: "get",
       url: /\.*\/smartems\/status/
    }, f).as(waitSmartEmsStatus)
  })
}
