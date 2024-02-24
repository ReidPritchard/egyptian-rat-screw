<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { socketStore } from "../stores/socketStore";
  import {
    gameSessionStore,
    type GameSession,
  } from "../stores/gameSessionStore";
  import Rules from "./Rules.svelte";

  export let gameId: string;
  export let playerName: string;

  let cancelSocketSubscription: () => void = () => {};

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
        gameSessionStore.handlePayload(data);
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

  function sendMsg() {
    console.log("Sending message to server");
    socketStore.send(JSON.stringify({ type: "test", data: "Hello, world!" }));
  }
</script>

<div class="game-session">
  {#if loading}
    <div class="loading">Loading...</div>
  {:else if gameSession}
    <div class="game-session-details">
      <h2>Game Session Details</h2>
      {#if gameSession.currentPlayer}<p>
          Current Player: {gameSession.currentPlayer}
        </p>{/if}
      {#if gameSession.score}<p>Score: {gameSession.score}</p>{/if}
      {#if gameSession.status}<p>Status: {gameSession.status}</p>{/if}
      {#if gameSession.cardPile}<p>Card Pile: {gameSession.cardPile}</p>{/if}
      {#if gameSession.numCardsInHand}<p>
          Number of Cards in Hand: {gameSession.numCardsInHand}
        </p>{/if}
      {#if gameSession.slapRules}<Rules
          slapRules={gameSession.slapRules}
        />{/if}
      {#if gameSession.notify}<p>Notification: {gameSession.notify}</p>{/if}
    </div>
    <button class="send-button" on:click={sendMsg}>Send Test Message</button>
  {/if}
</div>

<style>
  .game-session {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .game-session-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .game-session-details p {
    color: var(--secondary-color);
  }
  .send-button {
    padding: 0.5rem 1rem;
    color: var(--light-color);
    background-color: var(--accent-color);
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  .loading {
    font-size: 1.5rem;
    color: var(--accent-color);
  }
</style>
