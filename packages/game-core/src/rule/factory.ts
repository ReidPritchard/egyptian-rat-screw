import { info } from "@oers/utils";
import { RuleContext, Rule } from ".";

export class RuleBuilder<TContext extends RuleContext> {
  private readonly rule: Partial<Rule<TContext>> = {};

  constructor(private readonly id: string) {
    this.rule.id = id;
    this.rule.tags = [];
  }

  setTags(tags: string[]): RuleBuilder<TContext> {
    this.rule.tags = tags;
    return this;
  }

  setCalculatePriority(
    calculatePriority: (context: TContext) => number
  ): RuleBuilder<TContext> {
    this.rule.calculatePriority = calculatePriority;
    return this;
  }

  setEvaluate(evaluate: (context: TContext) => boolean): RuleBuilder<TContext> {
    this.rule.evaluate = evaluate;
    return this;
  }

  setExecute(
    execute: (context: TContext) => Promise<void> | void
  ): RuleBuilder<TContext> {
    this.rule.execute = execute;
    return this;
  }

  setUpdateUI(updateUI?: (context: TContext) => void): RuleBuilder<TContext> {
    this.rule.indicateRuleInEffect = updateUI;
    return this;
  }

  setAggregateEffects(
    aggregateEffects?: (context: TContext, otherRules: Rule<TContext>[]) => void
  ): RuleBuilder<TContext> {
    this.rule.aggregateEffects = aggregateEffects;
    return this;
  }

  build(): Rule<TContext> {
    if (
      !this.rule.calculatePriority ||
      !this.rule.evaluate ||
      !this.rule.execute
    ) {
      throw new Error(
        "Missing required methods: calculatePriority, evaluate, or execute"
      );
    }
    // As TypeScript cannot ensure non-nullability through builder methods,
    // we assert non-nullability here as we've already checked the essential fields.
    return this.rule as Rule<TContext>;
  }
}

/**
 * Function to create a new rule using the RuleBuilder
 * @param id The unique identifier for the rule
 * @returns A new RuleBuilder with the given id
 */
export function createRule<TContext extends RuleContext>(
  id: string
): RuleBuilder<TContext> {
  return new RuleBuilder<TContext>(id);
}

const getNestedValue = (path: string, obj: Record<string, any>): any => {
  const segments = path.replace(/\[(\w+|\-\d+)\]/g, ".$1").split(".");
  return segments.reduce((acc: any, segment: string) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return acc[segment];
    } else if (Array.isArray(acc)) {
      const index = Number(segment);
      const adjustedIndex = index < 0 ? acc.length + index : index;
      if (adjustedIndex >= 0 && adjustedIndex < acc.length) {
        return acc[adjustedIndex];
      }
    }
    return undefined;
  }, obj);
};

/**
 * Building blocks for creating rules
 * These are various functions that can be used when creating rules
 * to help with common tasks. These are not required to create a rule,
 * but can be used to simplify the process.
 *
 * Think of them as helpers for common rule methods.
 *
 * They are broken into categories based on the method they are intended to be used with.
 * For now, calculatePriority, evaluate, execute, updateUI, and aggregateEffects
 */
export const RuleBuilderHelpers = {
  calculatePriority: {
    /**
     * A helper function to create a priority function that returns a constant value
     * @param priority The constant priority value
     * @returns A priority function that returns the constant value
     */
    constant(priority: number) {
      return () => priority;
    },
  },
  evaluate: {
    /**
     * A helper function to create an evaluate function that always returns true
     * Useful for debugging or testing
     * @returns A evaluate function that always returns true
     */
    alwaysTrue() {
      return () => true;
    },
    /**
     * A function that evaluates to true if the context's metadata contains a specific key/value pair
     * A common use case is to check if the card that was played has a specific suit or rank
     * @param path The path to the value in the metadata (e.g. "playedCard.suit")
     * @param value The value to compare against
     * @returns A function that evaluates to true if the context's metadata contains a specific key/value pair
     */
    metadataContains(path: string, value: any) {
      return (context: RuleContext) => {
        const metadataValue = getNestedValue(path, context.metadata);
        return metadataValue === value;
      };
    },
    /**
     * A function that evaluates if the context's metadata matches a specific object
     * A common use case is to check if the card played is the same as a card in the game's card pile
     * For example, to check if the played card is the same as the bottom card in the pile
     * @param metadataPath The path to the value in the metadata (e.g. "playedCard.value")
     * @param gameStatePath The path to the value in the game state (e.g. "cardPile[0].value")
     * @returns A function that evaluates if the context's metadata matches a specific object
     */
    metadataMatchesGame(metadataPath: string, gameStatePath: string) {
      return (context: RuleContext) => {
        const metadataValue = getNestedValue(metadataPath, context.metadata);
        const gameStateValue = getNestedValue(gameStatePath, context.gameState);

        return metadataValue === gameStateValue;
      };
    },
  },
  execute: {
    /**
     * A helper function to create an execute function that does nothing
     * @returns A execute function that does nothing
     */
    doNothing() {
      return () => {
        info("Rule executed, but no action was taken");
      };
    },
    /**
     * A function that gives the acting player all the cards in the pile
     * @returns A function that gives the acting player all the cards in the pile
     */
    givePileToActingPlayer() {
      return (context: RuleContext) => {
        const actingPlayer = context.metadata.actingPlayer;
        if (actingPlayer) {
          actingPlayer.hand.push(...context.gameState.pile);
          context.gameState.pile = [];
        }
      };
    },
  },
};
