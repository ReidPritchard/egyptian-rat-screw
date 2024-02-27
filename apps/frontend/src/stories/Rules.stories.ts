import type { Meta, StoryObj } from "@storybook/svelte";
import {
  defaultSlapRules,
  type Card,
  type Player,
  type SlapRule,
} from "@oers/game-core";
import Rules from "../lib/Rules.svelte";

// Define meta with explicit type instead of type assertion
const meta = {
  title: "ERS/Rules",
  component: Rules,
  tags: ["autodocs"],
  argTypes: {
    slapRules: {
      name: "Slap Rules",
      description: "The slap rules to display",
      control: { type: "object" },
    },
  },
} satisfies Meta<Rules>;

export default meta;

// Define Story type
type Story = StoryObj<typeof meta>;

// const defaultSlapRules: SlapRule[] = [
//   {
//     name: "doubles",
//     description: "Slap the pile if the top two cards are the same.",
//     validSlap: (pile: Card[]) => {
//       const topCard = pile[pile.length - 1];
//       const secondCard = pile[pile.length - 2];
//       return topCard.value === secondCard.value;
//     },
//     applySlapEffect: (slapper: Player, _players: Player[], pile: Card[]) => {
//       slapper.hand.push(...pile);
//       pile.length = 0;
//       return {
//         slapper: slapper.name,
//         affectedPlayers: [slapper.name],
//         pile,
//         message: "You slapped the pile for doubles!",
//       };
//     },
//   },
// ];

// DefaultRules story
export const DefaultRules: Story = {
  args: {
    slapRules: defaultSlapRules,
  },
};
