/// <reference types="cypress" />

describe("lobby page", () => {
  it("can navigate to the lobby page", () => {
    cy.visit("/");
    cy.get(".navbar").should("exist");
  });

  it("supports dark mode", () => {
    cy.visit("/");

    cy.get(".swap").should("exist");
    cy.get(".swap-rotate").should("exist");

    // Check the current theme
    cy.get("html").should("not.have.attr", "data-theme");

    // Toggle the theme
    cy.get(".swap-rotate").click();
    cy.get("html").should("have.attr", "data-theme", "synthwave");
  });
});
