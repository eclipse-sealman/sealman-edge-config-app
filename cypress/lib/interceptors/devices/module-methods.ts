export const waitModuleMethods = "deviceModuleMethods";

export function postModuleMethods() {
  cy.fixture("devices/device-module-methods")
    .then(f => {
      cy.intercept( {
        method: "post",
        url: /\/.*\/.*\/methods$/
      }, f).as(waitModuleMethods)
    })
}
