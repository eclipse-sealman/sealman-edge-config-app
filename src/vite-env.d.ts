/// <reference types="vite/client" />

// Runtime env injection stores values on globalThis.import_meta_env.
declare global {
  var import_meta_env: Record<string, any>;
}

// window.Cypress is set by the Cypress test runner; presence check is used in
// production code to conditionally skip authentication during E2E tests.
interface Window {
  Cypress?: unknown;
}
