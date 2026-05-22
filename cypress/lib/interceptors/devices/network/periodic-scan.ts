export const waitGetPeriodicScanData = "getPeriodicScanData"

export function getPeriodicScanData() {
  cy.fixture("devices/network/periodic-scan-result")
    .then(f => {
      cy.intercept(/\/.*\/topology$/, f).as(waitGetPeriodicScanData)
    })
}