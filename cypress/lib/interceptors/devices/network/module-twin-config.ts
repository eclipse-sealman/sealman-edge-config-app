export const waitGetNetDiscoverModuleTwinConfig = "getNetDiscoverModuleTwinConfig";
export const waitPostNetDiscoverModuleTwinConfig = "postNetDiscoverModuleTwinConfig"

export function getNetDiscoverModuleTwinConfig() {
  cy.fixture("devices/network/device-module-twin-config")
    .then(f => {
      cy.intercept(/\/.*\/twin\/config\/.*$/, f).as(waitGetNetDiscoverModuleTwinConfig)
    })
}

export function postNetDiscoverModuleTwinConfig() {
  cy.fixture("devices/network/device-module-twin-config")
    .then(f => {
      cy.intercept({
        method: "post",
        url: /\/.*\/twin\/config\/.*$/
      }, f).as(waitPostNetDiscoverModuleTwinConfig)
    })
}