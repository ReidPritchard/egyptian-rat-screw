import type { PenaltyRule, SlapRule } from "./db-interfaces";

const doubleSlapRule: SlapRule = {
  id: 'double',
  description: 'Two cards of the same rank are played consecutively.',
  isSlappable: (pile) => {
    if (pile.length < 2) return false;
    return pile[pile.length - 1].rank === pile[pile.length - 2].rank;
  },
};

const sandwichSlapRule: SlapRule = {
  id: 'sandwich',
  description: 'Two cards of the same rank with one card in between.',
  isSlappable: (pile) => {
    if (pile.length < 3) return false;
    return pile[pile.length - 1].rank === pile[pile.length - 3].rank;
  },
};

const topBottomSlapRule: SlapRule = {
  id: 'topBottom',
  description: 'The top and bottom cards are the same rank.',
  isSlappable: (pile) => {
    if (pile.length < 2) return false;
    return pile[0].rank === pile[pile.length - 1].rank;
  },
};

const invalidSlapPenalty: PenaltyRule = {
  id: 'invalidSlap',
  description: 'Add two cards to the pile if you slap incorrectly.',
  applyPenalty: (player, pile) => {
    if (player.hand.length > 0) pile.push(player.hand.pop()!);
    if (player.hand.length > 0) pile.push(player.hand.pop()!);
  },
};
