export const waitDeviceNatConfig = "deviceNatConfig"
export const waitPostDeviceNatConfig = "postDeviceNatConfig"

export function deviceNatConfig() {
  cy.fixture("devices/nat-config")
    .then(devices => {
      cy.intercept(/\.*\/smartems\/config\/nat/, devices).as(waitDeviceNatConfig)
    })
}

export function postDeviceNatConfig() {
  cy.fixture("devices/nat-config")
    .then(f => {
      cy.intercept({
        method: "post",
        url: /\.*\/smartems\/config\/nat/
      }, f).as(waitPostDeviceNatConfig)
    })
}
