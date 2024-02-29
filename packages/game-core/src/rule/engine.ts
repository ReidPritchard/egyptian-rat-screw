import { Rule, RuleContext } from ".";

export class RuleEngine<TContext extends RuleContext> {
  private rules: Array<Rule<TContext>> = [];

  registerRule(rule: Rule<TContext>): void {
    this.rules.push(rule);
  }

  async evaluateRules(context: TContext): Promise<void> {
    const evaluatedRules = this.rules.filter((rule) => rule.evaluate(context));

    // Aggregate effects before execution
    evaluatedRules.forEach((rule) => {
      rule.aggregateEffects?.(context, evaluatedRules);
    });

    // Sort by priority after aggregation to account for any changes
    evaluatedRules.sort(
      (a, b) => a.calculatePriority(context) - b.calculatePriority(context)
    );

    // Update context with applied rules

    for (const rule of evaluatedRules) {
      await rule.execute(context);
      // rule.indicateRuleInEffect?.(context, context.metadata);
    }
  }
}
