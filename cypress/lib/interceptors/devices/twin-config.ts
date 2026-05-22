export const waitTwinConfig = "deviceTwinConfig";

export function getTwinConfig() {
  cy.fixture("devices/device-twin-config")
    .then(f => {
      cy.intercept(/\/.*\/twin\/config\/.*$/, f).as(waitTwinConfig)
    })
}
