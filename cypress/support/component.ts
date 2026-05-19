// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from 'cypress/react'
import {__setNetworkMetaApi, __resetNetworkMeta} from "@/features/Devices/Network/api/networkMeta"
import type { AxiosResponse } from "axios"
import { queryClient } from "@/config/queryConfig"

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  // This is coming from Cypress configuration, and is contradicting a eslint rule therefore we must silence it
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)

// -------------------------------------------------------------
// Network Meta API mocks (needed because Cypress has no auth)
// -------------------------------------------------------------

beforeEach(() => {
  queryClient.clear()
  __resetNetworkMeta()

  cy.fixture("devices/network/endpoint-types.json").then((endpointTypes) => {
    cy.fixture("devices/network/services.json").then((services) => {

      __setNetworkMetaApi({
        getEndpointTypes: async () =>
          ({
            data: endpointTypes,
            status: 200,
            statusText: "OK",
            headers: {},
            config: {},
          } as AxiosResponse),

        getServices: async () =>
          ({
            data: services,
            status: 200,
            statusText: "OK",
            headers: {},
            config: {},
          } as AxiosResponse),
      })

    })
  })
})


// Example use:
// cy.mount(<MyComponent />)
