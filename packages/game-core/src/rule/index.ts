import { ERSGame, ServerPayload } from "..";
import { Card } from "../card";
import { Player } from "../player";

export * from "./card-rule";
export * from "./slap-rule";

/**
 * Metadata for the game state
 * This is used to store additional information about the game state
 * that can be used by the rules. Often, this is used to store information
 * about the action that triggered the rule to be evaluated.
 */
export interface GameMetadata {
  /**
   * The player that performed/attempted the action
   */
  actingPlayer?: Player;

  /**
   * The card that was played (if applicable)
   */
  playedCard?: Card;

  [key: string]: any;
}

/**
 * Class passed to the card rule functions.
 * This is the context in which the card rule is executed
 */
export class RuleContext {
  readonly gameState: ERSGame;
  readonly appliedRules: ReadonlySet<string>;
  readonly metadata: Readonly<GameMetadata>;

  constructor(
    gameState: ERSGame,
    appliedRules: ReadonlySet<string>,
    metadata: Readonly<GameMetadata>
  ) {
    this.gameState = gameState;
    this.appliedRules = new Set<string>(appliedRules);
    this.metadata = metadata;
  }

  /**
   * Create a snapshot of the current context
   * Used to provide rollback functionality
   * @returns A new RuleContext with the same state as the current context
   */
  snapshot(): RuleContext {
    return new RuleContext(
      JSON.parse(JSON.stringify(this.gameState)),
      new Set<string>(this.appliedRules),
      JSON.parse(JSON.stringify(this.metadata))
    );
  }
}

/**
 * Represents a rule in the game.
 * @template TContext - The type of the rule context.
 */
export interface Rule<TContext extends RuleContext> {
  id: string;
  tags: string[];

  calculatePriority: (context: TContext) => number;
  evaluate: (context: TContext) => boolean;
  execute: (context: TContext) => Promise<void> | void;

  /**
   * A way to update a player's UI after the rule is executed
   * This is done by modifying the resulting DataPayload
   * @param context
   * @param payload
   * @returns void
   */
  indicateRuleInEffect?: (context: TContext, response: ServerPayload) => void;

  /**
   * Used to define how the effects of this rule should be aggregated with other
   * rules that evaluate to true.
   * @param context
   * @param otherRules
   * @returns void
   */
  aggregateEffects?: (context: TContext, otherRules: Rule<TContext>[]) => void;
}
