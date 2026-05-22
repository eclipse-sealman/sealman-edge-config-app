export default function waitFor(n: string) {
  cy.wait(`@${n}`)
}
