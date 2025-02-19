import { type SlapRule, SlapRuleAction } from "@oer/shared";

export const defaultSlapRules: SlapRule[] = [
  {
    name: "Top-Bottom",
    conditions: [
      {
        // Make sure the pile has at least 2 cards
        field: { value: "pile.length", isDynamic: true },
        operator: ">=",
        value: { value: "2", isDynamic: false },
      },
      {
        field: { value: "pile[0].rank", isDynamic: true },
        operator: "===",
        value: { value: "pile[-1].rank", isDynamic: true },
      },
    ],
    action: SlapRuleAction.TAKE_PILE,
  },
  {
    name: "Doubles",
    conditions: [
      {
        field: { value: "pile.length", isDynamic: true },
        operator: ">=",
        value: { value: "2", isDynamic: false },
      },
      {
        field: { value: "pile[-1].rank", isDynamic: true },
        operator: "===",
        value: { value: "pile[-2].rank", isDynamic: true },
      },
    ],
    action: SlapRuleAction.TAKE_PILE,
  },
  {
    name: "Sandwich",
    conditions: [
      {
        field: { value: "pile.length", isDynamic: true },
        operator: ">=",
        value: { value: "3", isDynamic: false },
      },
      {
        field: { value: "pile[-1].rank", isDynamic: true },
        operator: "===",
        value: { value: "pile[-3].rank", isDynamic: true },
      },
    ],
    action: SlapRuleAction.TAKE_PILE,
  },
  {
    name: "Test - Sixes (Red Drinks)",
    conditions: [
      {
        field: { value: "pile[-1].rank", isDynamic: true },
        operator: "===",
        value: { value: "6", isDynamic: false },
      },
    ],
    action: SlapRuleAction.DRINK,
    targetPlayerName: "red",
  },
  {
    name: "Test - Tens (All Drinks)",
    conditions: [
      {
        field: { value: "pile[-1].rank", isDynamic: true },
        operator: "===",
        value: { value: "10", isDynamic: false },
      },
    ],
    action: SlapRuleAction.DRINK_ALL,
  },
];
