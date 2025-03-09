/// <reference types="cypress" />

// Extend the Cypress namespace
declare namespace Cypress {
  interface Chainable {
    /**
     * Creates a player with the given ID and name, optionally joining a specific game
     * @param id The player's connection ID
     * @param name The player's display name
     * @param gameId Optional game ID to join
     */
    createPlayer(id: string, name: string, gameId?: string): Chainable<void>;

    /**
     * Sets the player's ready state
     * @param id The player's connection ID
     * @param ready? Whether the player is ready
     */
    setPlayerReady(id: string, ready?: boolean): Chainable<void>;

    /**
     * Disconnects a player with the specified ID
     * @param id The player's connection ID
     */
    disconnectPlayer(id: string): Chainable<void>;

    /**
     * Creates a game as the host player and returns the game ID
     * @param hostName The host player's name
     */
    createGameAsHost(hostName: string): Chainable<string>;

    /**
     * Simulates a slap action for a player
     * @param id The player's connection ID, defaults to host
     */
    slapCard(id?: string): Chainable<void>;
  }
}

// Custom commands for Egyptian Rat Screw testing
Cypress.Commands.add(
  "createPlayer",
  (id: string, name: string, gameId?: string) => {
    // Create a connection with specified ID
    cy.request(
      `http://localhost:8000/connect?url=ws://localhost:8000&id=${id}`
    );

    // Send a name change message
    cy.request(
      `http://localhost:8000/message?id=${id}&m={"event": "changeName", "data": {"name": "${name}"}}`
    );

    // Optionally join a game if gameId is provided
    if (gameId) {
      cy.request(
        `http://localhost:8000/message?id=${id}&m={"event": "joinGame", "data": {"roomId": "${gameId}"}}`
      );
    }
  }
);

Cypress.Commands.add("setPlayerReady", (id: string, ready?: boolean) => {
  cy.request(
    `http://localhost:8000/message?id=${id}&m={"event": "playerReady", "data": {}}`
  );
});

Cypress.Commands.add("disconnectPlayer", (id: string) => {
  cy.request(`http://localhost:8000/disconnect?id=${id}`);
});

Cypress.Commands.add("createGameAsHost", (hostName: string) => {
  cy.visit("/");
  cy.get("#player-name").type(hostName);
  cy.get("#player-name").should("have.value", hostName);
  cy.get("#create-game-button").should("not.be.disabled");
  cy.get("#create-game-button").click();
  cy.get("#pre-game-lobby").should("exist");

  // Extract and return the game ID
  return cy.get("#game-id").invoke("text");
});

Cypress.Commands.add("slapCard", (id?: string) => {
  if (id) {
    // Send slap message for a specific player
    cy.request(
      `http://localhost:8000/message?id=${id}&m={"event": "slap-card", "data": {}}`
    );
  } else {
    // Host player slaps using UI
    cy.get("#slap-button").click();
  }
});

describe("Game Tests", () => {
  // Disconnect all test sockets after each test
  afterEach(() => {
    cy.request("http://localhost:8000/disconnect-all");
  });

  describe("Game Setup", () => {
    it("supports game creation with a host player", () => {
      cy.createGameAsHost("Host Player");
      cy.get("#player-count").should("have.text", "1/8");
      cy.get("#player-list").should("contain", "Host Player");
    });

    it("supports two players joining a game", () => {
      cy.createGameAsHost("Host Player").then((gameText) => {
        const gameId = gameText.split(":")[1].trim();
        cy.log(`Created game with ID: ${gameId}`);

        // Add second player
        cy.createPlayer("player2", "Guest Player", gameId);

        // Verify game state
        cy.get("#pre-game-lobby").should("exist");
        cy.get("#player-count").should("have.text", "2/8");
        cy.get("#player-list").should("contain", "Host Player");
        cy.get("#player-list").should("contain", "Guest Player");
      });
    });

    it("supports the maximum number of players (4) joining a game", () => {
      cy.createGameAsHost("Host Player").then((gameText) => {
        const gameId = gameText.split(":")[1].trim();
        cy.log(`Created game with ID: ${gameId}`);

        // Add three more players
        cy.createPlayer("player2", "Player Two", gameId);
        cy.createPlayer("player3", "Player Three", gameId);
        cy.createPlayer("player4", "Player Four", gameId);

        // Verify all players joined
        cy.get("#pre-game-lobby").should("exist");
        cy.get("#player-count").should("have.text", "4/8");

        // Verify all player names are displayed
        cy.get("#player-list").should("contain", "Host Player");
        cy.get("#player-list").should("contain", "Player Two");
        cy.get("#player-list").should("contain", "Player Three");
        cy.get("#player-list").should("contain", "Player Four");
      });
    });

    it("prevents starting game with only one player", () => {
      cy.createGameAsHost("Solo Player");
      // Check that start game button is disabled
      cy.get("#ready-button").should("be.disabled");
      // Start button should have tooltip explaining minimum player count
      cy.get("#ready-button")
        .should("have.attr", "title")
        .and("contain", "players");
    });
  });

  describe("Player Management", () => {
    it("handles players disconnecting during pre-game phase", () => {
      cy.createGameAsHost("Host Player").then((gameText) => {
        const gameId = gameText.split(":")[1].trim();
        cy.log(`Created game with ID: ${gameId}`);

        // Add multiple players
        cy.createPlayer("player2", "Player Two", gameId);
        cy.createPlayer("player3", "Player Three", gameId);

        // Verify initial state
        cy.get("#player-count").should("have.text", "3/8");

        // Disconnect player3
        cy.disconnectPlayer("player3");

        // Verify player count decreases
        cy.get("#player-count").should("have.text", "2/8");
        cy.get("#player-list").should("contain", "Host Player");
        cy.get("#player-list").should("contain", "Player Two");
        cy.get("#player-list").should("not.contain", "Player Three");
      });
    });

    it("allows a player to reconnect after disconnecting", () => {
      cy.createGameAsHost("Host Player").then((gameText) => {
        const gameId = gameText.split(":")[1].trim();
        cy.log(`Created game with ID: ${gameId}`);

        // Add a player who will disconnect and reconnect
        cy.createPlayer("player2", "Reconnecting Player", gameId);

        // Verify initial join
        cy.get("#player-count").should("have.text", "2/8");
        cy.get("#player-list").should("contain", "Reconnecting Player");

        // Disconnect the player
        cy.disconnectPlayer("player2");
        cy.get("#player-count").should("have.text", "1/8");
        cy.get("#player-list").should("not.contain", "Reconnecting Player");

        // Reconnect with the same name
        cy.createPlayer("player2", "Reconnecting Player", gameId);

        // Verify reconnection
        cy.get("#player-count").should("have.text", "2/8");
        cy.get("#player-list").should("contain", "Reconnecting Player");
      });
    });
  });

  describe("Gameplay", () => {
    it("allows starting a game with multiple players", () => {
      cy.createGameAsHost("Host Player").then((gameText) => {
        const gameId = gameText.split(":")[1].trim();
        cy.log(`Created game with ID: ${gameId}`);

        // Add another player
        cy.createPlayer("player2", "Player Two", gameId);

        // Ready up the host player
        cy.get("#ready-button").click();

        // Ready up the second player
        cy.setPlayerReady("player2");

        // Verify the game has started
        cy.get("#game-board").should("exist");
        cy.get("#pile-size").should("exist");
        cy.get("#turn-order").should("exist");
      });
    });

    it.skip("handles player turns correctly", () => {
      cy.createGameAsHost("Host Player").then((gameText) => {
        const gameId = gameText.split(":")[1].trim();
        cy.log(`Created game with ID: ${gameId}`);

        // Add another player
        cy.createPlayer("player2", "Player Two", gameId);

        // Start the game
        cy.get("#ready-button").click();
        cy.setPlayerReady("player2");

        // Verify initial turn indicator
        cy.get("#player-turn-indicator").should("contain", "Host Player");

        // Play a card from host
        cy.get("#play-card-button").click();

        // Verify turn indicator changed
        cy.get("#player-turn-indicator").should("contain", "Player Two");

        // Play a card from player2
        cy.request(
          `http://localhost:8000/message?id=player2&m={"event": "play-card", "data": {}}`
        );

        // Verify turn indicator changed back to host
        cy.get("#player-turn-indicator").should("contain", "Host Player");
      });
    });

    it.skip("handles slaps correctly", () => {
      cy.createGameAsHost("Host Player").then((gameText) => {
        const gameId = gameText.split(":")[1].trim();
        cy.log(`Created game with ID: ${gameId}`);

        // Add another player
        cy.createPlayer("player2", "Player Two", gameId);

        // Start the game
        cy.get("#ready-button").click();
        cy.setPlayerReady("player2");

        // Play some cards to setup a slappable scenario
        cy.get("#play-card-button").click();
        cy.request(
          `http://localhost:8000/message?id=player2&m={"event": "play-card", "data": {}}`
        );

        // Host player slaps
        cy.slapCard();

        // Check for slap result indication
        cy.get("#slap-result").should("exist");

        // Player 2 slaps
        cy.slapCard("player2");

        // Check for slap result for player 2
        cy.get("#player-action-log").should("contain", "Player Two");
      });
    });

    it("handles player disconnection during active game", () => {
      cy.createGameAsHost("Host Player").then((gameText) => {
        const gameId = gameText.split(":")[1].trim();
        cy.log(`Created game with ID: ${gameId}`);

        // Add multiple players
        cy.createPlayer("player2", "Player Two", gameId);
        cy.createPlayer("player3", "Player Three", gameId);

        // Start the game
        cy.get("#ready-button").click();
        cy.setPlayerReady("player2");
        cy.setPlayerReady("player3");

        // Verify the game has started
        cy.get("#game-board").should("exist");
        cy.get("#pile-size").should("exist");
        cy.get("#turn-order").should("exist");

        // Disconnect a player
        cy.disconnectPlayer("player3");

        // Verify game continues with remaining players
        cy.get("#player-count").should("have.text", "2");
        cy.get("#game-board").should("exist");
        cy.get("#pile-size").should("exist");
        cy.get("#turn-order").should("exist");

        // Play should continue with remaining players
        cy.get("#play-card-button").click();
        cy.request(
          `http://localhost:8000/message?id=player2&m={"event": "play-card", "data": {}}`
        );

        // Game should still be active
        cy.get("#game-board").should("exist");
        cy.get("#pile-size").should("exist");
        cy.get("#turn-order").should("exist");
      });
    });
  });
});
