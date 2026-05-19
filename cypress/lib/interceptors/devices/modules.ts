export const waitDeviceModule = "deviceModule";

export function getModule() {
  cy.fixture("devices/device-module")
    .then(f => {
      cy.intercept(/\/.*\/modules$/, f).as(waitDeviceModule)
    })
}
