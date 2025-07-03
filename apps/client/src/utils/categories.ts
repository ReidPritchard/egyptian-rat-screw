import type { GameStatus } from "@oer/shared/types";
import { GameStatusCategories } from "@oer/shared/types";

export const isGameStatusInCategory = (
	status: GameStatus,
	category: keyof typeof GameStatusCategories,
) => {
	return GameStatusCategories[category].includes(status);
};
