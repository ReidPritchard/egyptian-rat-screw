import { Card, ICondition } from '../../types';
import { Player } from '../Player';

export class Condition {
  private field: string;
  private operator: string;
  private value: string | number | string[];

  constructor(condition: ICondition) {
    this.field = condition.field;
    this.operator = condition.operator;
    this.value = condition.value;
  }

  public check(pile: Card[], slapper: Player): boolean {
    const fieldValue = this.getValue(pile, slapper);
    return this.compare(fieldValue, this.operator, this.value);
  }

  private getValue(pile: Card[], slapper: Player): any {
    // Split the field string into parts, considering both dot notation and bracket notation
    const fieldParts = this.field.match(/[^\.\[\]]+|\[(?:\\.|[^\[\]\\])*\]/g) || [];

    let value: any = { pile, slapper };

    for (let part of fieldParts) {
      if (part.startsWith('[') && part.endsWith(']')) {
        // Handle bracket notation
        part = part.slice(1, -1);
        if (!isNaN(Number(part))) {
          // If it's a number, use it as an index
          value = value[Number(part)];
        } else {
          // Otherwise, use it as a string key
          value = value[part.replace(/['"]/g, '')];
        }
      } else {
        // Handle dot notation
        value = value[part];
      }

      if (value === undefined) {
        break;
      }
    }

    return value;
  }

  private compare(fieldValue: any, operator: string, value: any): boolean {
    switch (operator) {
      case '===':
        return fieldValue === value;
      case '!==':
        return fieldValue !== value;
      case '>':
        return fieldValue > value;
      case '<':
        return fieldValue < value;
      case '>=':
        return fieldValue >= value;
      case '<=':
        return fieldValue <= value;
      case 'in':
        return value.includes(fieldValue);
      default:
        return false;
    }
  }
}
