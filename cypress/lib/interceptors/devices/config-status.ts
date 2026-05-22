export const waitConfigStatus = "deviceConfigStatus";

export function postConfigStatus() {
  cy.fixture("devices/device-config-status")
    .then(f => {
      cy.intercept({
        method: "post",
        url: /\/.*\/config\/status$/
      }, f).as(waitConfigStatus)
    })
}
