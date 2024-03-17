<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { socketStore } from '../../stores/socketStore';
  import {
    gameSessionStore,
    type GameSession,
  } from '../../stores/gameSessionStore';
  import Rules from './UIRules.svelte';
  import CardPile from './UICardPile.svelte';
  import UiButton from '../UIBlocks/UIButton.svelte';
  import UiCurrentPlayer from './UICurrentPlayer.svelte';
  import UiPreGameDashboard from './UIPreGameDashboard.svelte';
  import UiSessionDetails from './UISessionDetails.svelte';
  import { ErrorCodes, type ClientPayload } from '@oers/game-core';
  import UiGameCountdown from './UIGameCountdown.svelte';

  export let gameId: string;
  export let playerName: string;

  let cancelSocketSubscription: () => void = () => {};

  const dispatch = createEventDispatcher();

  let loading = true;
  let gameSession: GameSession;

  onMount(async () => {
    if (!gameId || !playerName) {
      console.error('Invalid gameId or playerName');
      return;
    }

    try {
      await socketStore.connect(
        `ws://localhost:5001/ws/games/${gameId}?playerName=${encodeURIComponent(playerName)}`
      );
    } catch (error) {
      console.error('Failed to connect to WebSocket', error);
      return;
    }

    cancelSocketSubscription = socketStore.subscribeMessage((message) => {
      if (message?.data) {
        let data;
        try {
          data = JSON.parse(message?.data);
        } catch (error) {
          console.error('Failed to parse message data', error);
          return;
        }
        console.log('Received message:', data);

        if (data.type === 'error') {
          console.error('Received error message:', data);
          const errorKey = data.errorKey;
          if (errorKey === ErrorCodes.NOT_FOUND) {
            leaveGame();
          }
        } else {
          gameSessionStore.handlePayload(data, playerName);
        }
      }
    });

    gameSessionStore.subscribe((state: GameSession) => {
      console.log('GameSession Updated:', state);
      gameSession = state;
      loading = false;
    });
  });

  onDestroy(() => {
    if (typeof cancelSocketSubscription === 'function') {
      cancelSocketSubscription();
    }
    socketStore.disconnect();
  });

  function leaveGame() {
    console.log('Leaving game');
    socketStore.send(JSON.stringify({ type: 'leave' }));
    dispatch('leave');
  }

  function sendMsg() {
    console.log('Sending message to server');

    // If the game is paused, send a "start-game" message
    if (gameSession.status === 'paused') {
      sendEvent('player-ready');
      return;
    }

    sendEvent('play-card-attempt');
  }

  function sendEvent(eventType: ClientPayload['type']) {
    const msg = gameSessionStore.generatePayload(eventType, playerName, gameId);
    socketStore.send(JSON.stringify(msg));
  }
</script>

<div class="game-session">
  {#if loading}
    <div class="loading fadeIn">Loading...</div>
  {:else if gameSession}
    <div class="game-session-details fadeIn">
      <div id="left-col">
        {#if gameSession.status}<p>Status: {gameSession.status}</p>{/if}
        {#if gameSession.slapRules}<Rules
            slapRules={gameSession.slapRules}
          />{/if}
        <UiSessionDetails
          sessionDetails={{ 'Game ID': gameId, 'Player Name': playerName }}
        />
      </div>

      <div id="middle-col">
        {#if gameSession.cardPile && gameSession.status !== 'paused' && gameSession.status !== 'ended'}
          <UiCurrentPlayer playerName={gameSession.currentPlayer} />
          <CardPile pile={gameSession.cardPile} />
        {/if}

        {#if gameSession.status === 'paused' || gameSession.status === 'ended'}
          <UiPreGameDashboard
            {playerName}
            playerStates={gameSession.players}
            on:stateChange={(event) => {
              console.log('State change event:', event);
              sendEvent('player-ready');
            }}
          />
        {/if}

        <UiButton
          variant="primary"
          on:click={() => {
            gameSession.startTime = new Date(Date.now() + 10000);
          }}
        >
          Start Countdown
        </UiButton>

        {#if gameSession.startTime}
          <UiGameCountdown
            startTime={gameSession.startTime}
            on:countdownFinished={() => {
              console.log('Countdown finished');
              gameSession.startTime = undefined;
            }}
            on:countdownCancelled={() => {
              console.log('Countdown cancelled');
              gameSession.startTime = undefined;
              sendEvent('player-ready');
            }}
          />
        {/if}
      </div>

      <div id="right-col">
        {#if gameSession.numCardsInHand}<p>
            Number of Cards in Hand: {gameSession.numCardsInHand}
          </p>{/if}
        {#if gameSession.score}<p>Score: {gameSession.score}</p>{/if}
        {#if gameSession.notify}<p>Notification: {gameSession.notify}</p>{/if}
      </div>
    </div>

    <footer class="fadeIn">
      {#if gameSession.status === 'paused' || gameSession.status === 'ended'}
        <p>Game is paused</p>
        <UiButton
          variant="primary"
          on:click={sendMsg}>Start Game</UiButton
        >
      {:else}
        <p>Game is active</p>
        <UiButton
          variant="primary"
          on:click={sendMsg}>Play Card</UiButton
        >
      {/if}

      <UiButton
        variant="danger"
        on:click={leaveGame}>Leave Game</UiButton
      >
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

    grid-template-areas: 'left middle right' 'left middle right' 'left middle right' 'footer footer footer';

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
    grid-area: footer;

    display: flex;
    gap: 1rem;
  }

  .loading {
    font-size: 1.5rem;
    color: var(--accent-color);
  }
</style>
