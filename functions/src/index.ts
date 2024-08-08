/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.database();

export const slapPile = functions.https.onCall(async (data, context) => {
  const { gameId, playerId } = data;

  const gameRef = db.ref(`games/${gameId}`);
  const gameSnapshot = await gameRef.once('value');
  const gameData = gameSnapshot.val();

  if (!gameData) {
    throw new functions.https.HttpsError('not-found', 'Game not found');
  }

  const player = gameData.players.find((p: any) => p.id === playerId);
  if (!player) {
    throw new functions.https.HttpsError('not-found', 'Player not found');
  }

  let pileClaimed = false;

  for (const rule of gameData.slapRules) {
    const ruleFn = getSlapRuleFunction(rule.id);
    if (ruleFn(gameData.centralPile)) {
      player.hand = player.hand.concat(gameData.centralPile);
      gameData.centralPile = [];
      gameData.currentChances = 0;
      pileClaimed = true;
      break;
    }
  }

  if (!pileClaimed) {
    applyPenalty(player, gameData);
  }

  await gameRef.set(gameData);
  return { success: true, pileClaimed };
});

function getSlapRuleFunction(ruleId: string) {
  // FIXME: Implement this function
  return (pile: any) =>
    pile.length === 0
      ? false
      : pile[pile.length - 1].rank === 11 || pile[pile.length - 1].rank;
}

function applyPenalty(player: any, gameData: any) {
  // FIXME: Implement this function
  return;
}
