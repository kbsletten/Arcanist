import { Command } from "./command.js";

export class Hp extends Command {
  constructor(library) {
    super();
    this.library = library;
  }

  arguments = [
    {
      title: "amount",
      description: "The amount to add or subtract from HP",
      type: "integer",
    },
  ];

  description = "Manage your character's HP.";

  async executeActions({ amount, userId }) {
    const user = await this.library.getUser(userId);
    const [characterId, character] = await this.library.getDefaultCharacter(
      userId,
      user
    );

    if (!character) {
      return {
        actions: [],
        message:
          "You have no active character. Create one with /rollstats first.",
      };
    }

    let modified = "";

    if (amount) {
      let newHp = character.hp + amount;
      if (newHp < 0) newHp = 0;
      if (newHp > character.maxHp) newHp = character.maxHp;

      modified = ` (${newHp >= character.hp ? "+" : ""}${
        newHp - character.hp
      })`;
      character.hp = newHp;
      await this.library.updateCharacter(characterId, character);
    }

    return {
      actions: [],
      message: `${character.name}'s HP: ${character.hp}/${character.maxHp}${modified}`,
    };
  }
}
