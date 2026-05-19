export const waitDeployments = "deployments"

export function getDeployments() {
  // Return empty array for deployments since it's optional for the component
  cy.intercept('/deployments', []).as(waitDeployments)
}

export const waitDeploymentStatus = "deploymentStatus"

export function getDeploymentStatus() {
  cy.fixture("devices/deployment-status")
    .then(f => {
      cy.intercept(/\/.*\/deployment\/status$/, f).as(waitDeploymentStatus)
    })
}
