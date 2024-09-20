import { SlapRule, SlapRuleAction } from '../../types';

export const defaultSlapRules: SlapRule[] = [
  {
    name: 'Top-Bottom',
    conditions: [
      {
        field: { value: 'pile[0].rank', isDynamic: true },
        operator: '===',
        value: { value: 'pile[-1].rank', isDynamic: true },
      },
    ],
    action: SlapRuleAction.TAKE_PILE,
  },
  {
    name: 'Doubles',
    conditions: [
      {
        field: { value: 'pile[-1].rank', isDynamic: true },
        operator: '===',
        value: { value: 'pile[-2].rank', isDynamic: true },
      },
    ],
    action: SlapRuleAction.TAKE_PILE,
  },
  {
    name: 'Sandwich',
    conditions: [
      {
        field: { value: 'pile[-1].rank', isDynamic: true },
        operator: '===',
        value: { value: 'pile[-3].rank', isDynamic: true },
      },
    ],
    action: SlapRuleAction.TAKE_PILE,
  },
  {
    name: 'Sixes (Red Drinks)',
    conditions: [
      {
        field: { value: 'pile[-1].rank', isDynamic: true },
        operator: '===',
        value: { value: '6', isDynamic: false },
      },
    ],
    action: SlapRuleAction.DRINK,
    targetPlayerName: 'red',
  },
];
