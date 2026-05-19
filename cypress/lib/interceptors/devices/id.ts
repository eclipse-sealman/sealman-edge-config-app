export const waitById = "deviceById"

export function getById() {
  cy.fixture("devices/device")
    .then(devices => {
       cy.intercept(/\/device(\?device=.*)?$/, devices).as(waitById)
    })
}
