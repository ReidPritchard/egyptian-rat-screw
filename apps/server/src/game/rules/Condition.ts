import type { Card, ConditionValue, ICondition } from "@oer/shared/types";
import type { Player } from "../models/Player.js";

export class Condition {
	private field: ConditionValue;
	private operator: string;
	private value: ConditionValue;

	constructor(condition: ICondition) {
		console.log("Testing condition:", condition);
		this.field = condition.field;
		this.operator = condition.operator;
		this.value = condition.value;
	}

	public check(pile: Card[], slapper: Player): boolean {
		const fieldValue = this.parseConditionValue(this.field, pile, slapper);
		const parsedValue = this.parseConditionValue(this.value, pile, slapper);
		return this.compare(fieldValue, this.operator, parsedValue);
	}

	private parseConditionValue(
		conditionValue: ConditionValue,
		pile: Card[],
		slapper: Player,
	): any {
		if (conditionValue.isDynamic) {
			return this.parseValue(conditionValue.value, pile, slapper);
		}
		return conditionValue.value;
	}

	private parseValue(input: string, pile: Card[], slapper: Player): any {
		console.log("Parsing value:", input);

		// Split the input string into parts, considering both dot notation and bracket notation
		const parts = input.match(/[^\.\[\]]+|\[(?:\\.|[^\[\]\\])*\]/g) || [];

		let value: any = { pile, slapper };

		for (let part of parts) {
			if (part.startsWith("[") && part.endsWith("]")) {
				// Handle bracket notation
				part = part.slice(1, -1);
				if (!Number.isNaN(Number(part))) {
					// If it's a number, use it as an index
					let index = Number(part);
					index = index < 0 ? value.length + index : index;
					value = value[index];
				} else {
					// Otherwise, use it as a string key
					value = value[part.replace(/['"]/g, "")];
				}
			} else {
				// Handle dot notation
				value = value[part];
			}

			if (value === undefined) {
				break;
			}
		}

		console.log(`Parsed value for ${input}:`, value);
		return value;
	}

	private compare(fieldValue: any, operator: string, value: any): boolean {
		console.log("Comparing:", fieldValue, operator, value);
		switch (operator) {
			case "===":
				return fieldValue === value;
			case "!==":
				return fieldValue !== value;
			case ">":
				return fieldValue > value;
			case "<":
				return fieldValue < value;
			case ">=":
				return fieldValue >= value;
			case "<=":
				return fieldValue <= value;
			case "in":
				return Array.isArray(value) && value.includes(fieldValue);
			default:
				return false;
		}
	}
}
