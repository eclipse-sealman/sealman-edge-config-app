export const waitDeviceList = "devices"

export function deviceList() {
  cy.fixture("devices/devices")
    .then(devices => {
      cy.intercept(/\/devices$/, devices).as(waitDeviceList)
    })
}
