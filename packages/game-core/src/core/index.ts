import { Card, createDeck } from '../card';
import { DataPayload } from '../event';
import { Player } from '../player';
import { ActiveRule, Rule, RuleContext } from '../rule';
import { RuleBuilder, RuleBuilderHelpers, createRule } from '../rule/factory';
import {
  SlapEffect,
  SlapRule,
  defaultPenalty,
  defaultSlapRules,
} from '../rule/slap-rule';
import { debug, info } from '@oers/utils';
import { GameStates, Score } from './interfaces';

/**
 * The default rules for Egyptian Rat Screw
 */
const defaultRules: Rule<RuleContext>[] = [
  // Slap Rules:
  createRule('doubles')
    .setTags(['slap'])
    .setCalculatePriority(RuleBuilderHelpers.calculatePriority.constant(1))
    .setEvaluate(
      RuleBuilderHelpers.evaluate.metadataMatchesGame(
        'playedCard.value',
        'hand[-1].value'
      )
    )
    .setExecute(RuleBuilderHelpers.execute.givePileToActingPlayer())
    .build(),
  createRule('sandwich')
    .setTags(['slap'])
    .setCalculatePriority(RuleBuilderHelpers.calculatePriority.constant(2))
    .setEvaluate(
      RuleBuilderHelpers.evaluate.metadataMatchesGame(
        'playedCard.value',
        'hand[-2].value'
      )
    )
    .setExecute(RuleBuilderHelpers.execute.givePileToActingPlayer())
    .build(),
  createRule('top-bottom')
    .setTags(['slap'])
    .setCalculatePriority(RuleBuilderHelpers.calculatePriority.constant(3))
    .setEvaluate(
      RuleBuilderHelpers.evaluate.metadataMatchesGame(
        'playedCard.value',
        'hand[0].value'
      )
    )
    .setExecute(RuleBuilderHelpers.execute.givePileToActingPlayer())
    .build(),
  // Play Card Rules:
  // TODO: It would be cool to have all the rules defined in the same or simlar format
  // However, supporting rules for different events (e.g. card play, slap) makes
  // this difficult to do in a clean way.
];

/**
 * Represents a game of Egyptian Rat Screw.
 */
export class ERSGame {
  gameActive: GameStates = GameStates.NotStarted;

  maxPlayers: number = 4;
  players: Player[];
  currentPlayerIndex: number;

  score: Score[];

  deck: Card[];
  pile: Card[];

  slapRules: SlapRule[];

  activeCardRule: ActiveRule = new ActiveRule();

  constructor(players: Player[]) {
    if (players.length > this.maxPlayers) {
      throw new Error('Too many players for the game');
    }

    this.players = players;
    this.currentPlayerIndex = Math.floor(Math.random() * players.length);
    this.score = this.players.map((player) => ({
      playerName: player.name,
      score: 0,
    }));
    this.deck = createDeck();
    this.pile = [];
    this.slapRules = defaultSlapRules;
  }

  shuffleDeck(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  dealCards() {
    while (this.deck.length > 0) {
      for (let player of this.players) {
        if (this.deck.length === 0) break;
        let card = this.deck.pop();
        if (card) {
          player.hand.push(card);
        }
      }
    }
  }

  getPlayer(name: string): Player {
    const player = this.players.find((player) => player.name === name);
    if (!player) {
      throw new Error(`Player ${name} not found`);
    }
    return player;
  }

  addPlayer(playerName: string): void {
    if (this.players.some((p) => p.name === playerName)) {
      throw new Error('Player already exists');
    }

    if (this.players.length >= this.maxPlayers) {
      throw new Error('Game is full');
    }

    const newPlayer: Player = { name: playerName, hand: [] };
    this.players.push(newPlayer);
    this.score.push({ playerName, score: 0 });
  }

  removePlayer(playerName: string): void {
    const index = this.players.findIndex((p) => p.name === playerName);
    if (index !== -1) {
      this.players.splice(index, 1);
      this.score.splice(index, 1);
    } else {
      throw new Error(`Player ${playerName} not found`);
    }
  }

  /**
   * Method to send only the information needed to a player's client
   * @param player The player to send the information to
   * @returns The information to send to the player
   */
  playerStatus(player: Player) {
    return {
      hand: player.hand,
      pile: this.pile.length,
      score: this.score.find((s) => s.playerName === player.name)?.score,
    };
  }

  /**
   * Method used to update the current player index
   * @returns The new current player index
   */
  nextPlayer() {
    this.currentPlayerIndex = this.activeCardRule.isCardRuleActive
      ? this.players.indexOf(
          this.activeCardRule.activeRuleContext?.targetPlayer ||
            this.players[this.currentPlayerIndex]
        )
      : (this.currentPlayerIndex + 1) % this.players.length;
  }

  slapPile(player: Player): boolean {
    if (this.gameActive !== GameStates.InProgress) {
      throw new Error('Game is not active');
    }

    const rule = this.slapRules.find((rule) => rule.validSlap(this.pile));
    const valid = rule !== undefined;
    valid
      ? rule.applySlapEffect(player, this.players, this.pile)
      : defaultPenalty(player, this.players, this.pile);

    if (valid) {
      info(`Player ${player.name} slapped the pile`);
      this.activeCardRule.reset();
    }

    return valid;
  }

  playCard(player: Player): Card | undefined {
    if (this.gameActive !== GameStates.InProgress) {
      throw new Error('Game is not active');
    }

    const card = player.hand.shift();
    if (card) {
      this.pile.push(card);
      this.processCardRules(card, player);
    }
    return card;
  }

  processCardRules(card: Card, actingPlayer: Player) {
    if (this.activeCardRule.isCardRuleActive === false) {
      this.activeCardRule.shouldActivate(
        card,
        actingPlayer,
        this.determineNextPlayer()
      );
    } else {
      if (this.activeCardRule.activeRuleContext)
        this.activeCardRule.activeRuleContext.cardsPlayed++;
      const ruleDeactiviated = this.activeCardRule.shouldDeactivate(card, this);
      if (ruleDeactiviated) {
        this.activeCardRule.shouldActivate(
          card,
          actingPlayer,
          this.determineNextPlayer()
        );
      }
    }
    // Update the current player index
    this.nextPlayer();
  }

  determineNextPlayer() {
    if (
      this.activeCardRule.isCardRuleActive &&
      this.activeCardRule.activeRuleContext?.targetPlayer !== undefined
    ) {
      return this.activeCardRule.activeRuleContext.targetPlayer;
    } else {
      // If no target player is set, use the next player
      return this.players[(this.currentPlayerIndex + 1) % this.players.length];
    }
  }

  givePileToPlayer(player: Player) {
    player.hand.push(...this.pile);
    this.pile = [];
  }

  setSlapRules(rules: SlapRule[]) {
    this.slapRules = rules;
  }

  reset() {
    this.pile.length = 0;
    this.deck = createDeck();
    this.players.forEach((player) => (player.hand = []));
  }

  startGame() {
    // if (this.players.length < 2) {
    //   throw new Error("Not enough players to start the game");
    // }

    this.reset();
    this.gameActive = GameStates.InProgress;
    this.deck = this.shuffleDeck(this.deck);
    this.dealCards();
  }

  endGame() {
    this.gameActive = GameStates.Ended;
  }
}
