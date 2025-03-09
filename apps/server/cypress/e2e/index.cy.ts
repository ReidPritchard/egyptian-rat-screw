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
    cy.get("html").should("have.attr", "data-theme", "light");

    // Toggle the theme
    cy.get(".swap-rotate").click();
    cy.get("html").should("have.attr", "data-theme", "sunset");

    // Toggle the theme again
    cy.get(".swap-rotate").click();
    cy.get("html").should("have.attr", "data-theme", "light");
  });

  it("support name changes", () => {
    cy.visit("/");

    // Username input should be empty
    cy.get("#player-name").should("have.value", "");

    // Check that create game is disabled
    cy.get("#create-game-button").should("be.disabled");

    // Enter a new name
    cy.get("#player-name").type("John Doe");
    cy.get("#player-name").should("have.value", "John Doe");

    // Check that create game is enabled
    cy.get("#create-game-button").should("not.be.disabled");

    // Reload the page
    cy.reload();

    // Username input should still be "John Doe"
    cy.get("#player-name").should("have.value", "John Doe");

    // Check that create game is enabled
    cy.get("#create-game-button").should("not.be.disabled");
  });
});
