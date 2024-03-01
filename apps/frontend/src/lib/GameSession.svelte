<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { socketStore } from "../stores/socketStore";
  import {
    gameSessionStore,
    type GameSession,
  } from "../stores/gameSessionStore";
  import Rules from "./GameComponents/UIRules.svelte";
  import CardPile from "./GameComponents/UICardPile.svelte";
  import UiButton from "./UIBlocks/UIButton.svelte";
  import UiPlayerState from "./GameComponents/UIPlayerState.svelte";

  export let gameId: string;
  export let playerName: string;

  let cancelSocketSubscription: () => void = () => {};

  const dispatch = createEventDispatcher();

  let loading = true;
  let gameSession: GameSession;

  onMount(async () => {
    if (!gameId || !playerName) {
      console.error("Invalid gameId or playerName");
      return;
    }

    try {
      await socketStore.connect(
        `ws://localhost:5001/ws/games/${gameId}?playerName=${encodeURIComponent(playerName)}`
      );
    } catch (error) {
      console.error("Failed to connect to WebSocket", error);
      return;
    }

    cancelSocketSubscription = socketStore.subscribeMessage((message) => {
      if (message?.data) {
        let data;
        try {
          data = JSON.parse(message?.data);
        } catch (error) {
          console.error("Failed to parse message data", error);
          return;
        }
        console.log("Received message:", data);

        if (data.type === "error") {
          console.error("Received error message:", data);
          leaveGame();
          return;
        }

        gameSessionStore.handlePayload(data, playerName);
      }
    });

    gameSessionStore.subscribe((state: GameSession) => {
      console.log("GameSession Updated:", state);
      gameSession = state;
      loading = false;
    });
  });

  onDestroy(() => {
    if (typeof cancelSocketSubscription === "function") {
      cancelSocketSubscription();
    }
    socketStore.disconnect();
  });

  function leaveGame() {
    console.log("Leaving game");
    socketStore.send(JSON.stringify({ type: "leave" }));
    dispatch("leave");
  }

  function sendMsg() {
    console.log("Sending message to server");

    // If the game is paused, send a "start-game" message
    if (gameSession.status === "paused") {
      const msg = gameSessionStore.generatePayload(
        "player-ready",
        playerName,
        gameId
      );
      socketStore.send(JSON.stringify(msg));
      return;
    }

    const msg = gameSessionStore.generatePayload(
      "play-card-attempt",
      playerName,
      gameId
    );
    socketStore.send(JSON.stringify(msg));
  }
</script>

<div class="game-session">
  {#if loading}
    <div class="loading fadeIn">Loading...</div>
  {:else if gameSession}
    <div class="game-session-details fadeIn">
      <div id="left-col">
        <h2>Game Session</h2>
        <p>Game ID: {gameId}</p>
        <p>Player Name: {playerName}</p>
      </div>

      <div id="middle-col">
        <h2>Details</h2>
        {#if gameSession.currentPlayer}<p>
            Current Player: {gameSession.currentPlayer}
          </p>{/if}

        {#if gameSession.cardPile}
          <CardPile pile={gameSession.cardPile} />
        {/if}
      </div>

      <div id="right-col">
        {#if gameSession.numCardsInHand}<p>
            Number of Cards in Hand: {gameSession.numCardsInHand}
          </p>{/if}
        {#if gameSession.score}<p>Score: {gameSession.score}</p>{/if}
        {#if gameSession.status}<p>Status: {gameSession.status}</p>{/if}
        {#if gameSession.slapRules}<Rules
            slapRules={gameSession.slapRules}
          />{/if}
        {#if gameSession.notify}<p>Notification: {gameSession.notify}</p>{/if}
      </div>
    </div>

    <footer class="fadeIn">
      {#if gameSession.status === "paused" || gameSession.status === "ended"}
        <p>Game is paused</p>
        <UiButton variant="primary" onClick={sendMsg}>Start Game</UiButton>
        <UiPlayerState />
      {:else}
        <p>Game is active</p>
        <UiButton variant="primary" onClick={sendMsg}>Play Card</UiButton>
      {/if}

      <UiButton variant="danger" onClick={leaveGame}>Leave Game</UiButton>
    </footer>
  {/if}
</div>

<style>
  .game-session {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    height: 100%;
    width: 100%;
  }

  .game-session-details {
    display: grid;
    grid-template-columns: 1fr 4fr 1fr;
    grid-template-rows: auto;

    grid-template-areas: "left middle right" "left middle right" "left middle right";

    gap: 1rem;
    padding: 1rem;

    height: 100%;
  }
  .game-session-details p {
    color: var(--secondary-color);
  }

  #left-col {
    grid-area: left;

    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  #middle-col {
    grid-area: middle;

    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;

    gap: 1rem;
  }

  #right-col {
    grid-area: right;

    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  footer {
    position: absolute;
    bottom: 0;

    display: flex;
    gap: 1rem;

    padding: 5rem;
  }

  .send-button {
    padding: 0.5rem 1rem;
    color: var(--light-color);
    background-color: var(--accent-color);
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .send-button:hover {
    background-color: var(--accent-color-dark);
  }

  .loading {
    font-size: 1.5rem;
    color: var(--accent-color);
  }
</style>
