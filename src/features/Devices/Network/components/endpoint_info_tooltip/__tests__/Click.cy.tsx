import Click from "../Click";

describe("Click", () => {
  it("Should open info tooltip when clicked then close when clicked again", () => {
    cy.viewport("macbook-16");

    cy.mount(<Click/>)

    cy.get("#click-info-tooltip").click()

    cy.contains("You can set the machine type").should("be.visible")

    cy.get("#click-info-tooltip").click()
  
    cy.contains("You can set the machine type").should("not.exist");
  });
});