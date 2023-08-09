import { statModifier } from "../util";
import { Command } from "./command";

const STARTING_GEAR = [
  [{ name: "Torch" }],
  [{ name: "Dagger" }],
  [{ name: "Pole" }],
  [{ name: "Shortbow" }, { name: "Arrows", quantity: 5 }],
  [{ name: "Rope, 60'" }],
  [{ name: "Oil, flask" }],
  [{ name: "Crowbar" }],
  [{ name: "Iron spikes", quantity: 10 }],
  [{ name: "Flint and steel" }],
  [{ name: "Grappling hook" }],
  [{ name: "Club" }],
  [{ name: "Caltrops" }],
];

const CRAWLING_KIT = [
  { name: "Flint and steel" },
  { name: "Torch" },
  { name: "Torch" },
  { name: "Rations", quantity: 3 },
  { name: "Iron spikes", quantity: 10 },
  { name: "Grappling hook" },
  { name: "Rope, 60'" },
];

export class Gear extends Command {
  constructor(fmt, library, die) {
    super();
    this.fmt = fmt;
    this.library = library;
    this.die = die;
  }

  arguments = [
    {
      description: "The gear you want to add",
      title: "add",
      type: "string",
    },
    {
      description: "The gear you want to edit",
      title: "edit",
      type: "string",
    },
    {
      description: "The name of your item",
      title: "name",
      type: "string",
    },
    {
      description: "The number of slots your item takes up",
      title: "slots",
      type: "number",
      minimum: 1,
    },
    {
      description: "The quantity of your item",
      title: "quantity",
      type: "number",
      minimum: 0,
    },
  ];

  description = "Manage your character's gear.";

  async starting({ userId }) {
    const user = await this.library.getUser(userId);
    let [characterId, character] = await this.library.getDefaultCharacter(
      userId,
      user
    );
    const { display: quantityDisplay, roll: quantity } = this.die.execute({
      sides: 4,
    });
    const lines = [
      this.fmt.bold(`Rolling starting gear for ${character.name}`),
      `${quantityDisplay} item(s)`,
    ];
    for (let i = 0; i < quantity; i++) {
      const { display: itemDisplay, roll: index } = this.die.execute({
        sides: STARTING_GEAR.length,
      });
      for (const { name, slots = 1, quantity = 1 } of STARTING_GEAR[
        index - 1
      ]) {
        character.gear.push({ name, slots, quantity });
      }
      lines.push(
        `${itemDisplay}; ${STARTING_GEAR[index - 1]
          .map((it) => it.name)
          .join(" and ")}`
      );
    }
    await this.library.updateCharacter(characterId, character);
    return { actions: [], message: lines.join("\n") };
  }

  async crawling({ userId }) {
    const user = await this.library.getUser(userId);
    let [characterId, character] = await this.library.getDefaultCharacter(
      userId,
      user
    );
    for (const { name, slots = 1, quantity = 1 } of CRAWLING_KIT) {
      character.gear.push({ name, slots, quantity });
    }
    await this.library.updateCharacter(characterId, character);
    const lines = [this.fmt.bold(`Adding crawling kit`)];
    this.displayGear(character, lines);
    return { actions: [], message: lines.join("\n") };
  }

  displayGear(character, lines, actions = []) {
    const hasShield = character.gear.some((it) => it.name === "Shield");
    const armors = {
      "Leather armor": 11 + statModifier(character.dexterity),
      Chainmail: 13 + statModifier(character.dexterity),
      "Plate mail": 15,
    };
    for (const item of character.gear) {
      const quantity = item.quantity > 1 ? ` x${item.quantity}` : "";
      const slots = item.slots > 1 ? ` (${item.slots})` : "";
      lines.push(` - ${item.name}${quantity}${slots}`);
      if (armors[item.name]) {
        if (character.ac !== armors[item.name]) {
          actions.push({
            id: `character-update-ac:${armors[item.name]}`,
            title: `Equip ${item.name}`,
          });
        }
        if (hasShield && character.ac !== armors[item.name] + 2) {
          actions.push({
            id: `character-update-ac:${armors[item.name] + 2}`,
            title: `Equip ${item.name} + Shield`,
          });
        }
      }
    }
  }

  async executeActions({ add, edit, name, quantity, slots, userId }) {
    const user = await this.library.getUser(userId);
    let [characterId, character] = await this.library.getDefaultCharacter(
      userId,
      user
    );
    if (!character) {
      return {
        actions: [],
        message: `No character found. Use /rollstats first!`,
      };
    }
    const lines = [this.fmt.bold(`${character.name}'s gear`)];
    if (add) {
      character.gear.push({
        name: add,
        quantity: quantity ?? 1,
        slots: slots ?? 1,
      });
    }
    if (edit) {
      const items = character.gear.filter((it) => it.name.includes(edit));
      if (items.length === 0) {
        return { actions: [], message: `Unable to find gear to edit: ${edit}` };
      } else if (items.length > 1) {
        return {
          actions: [],
          message: `Found multiple items to edit: ${edit} (found ${items
            .map((it) => it.name)
            .join(" and ")})`,
        };
      }
      items[0].name = name ?? items[0].name;
      items[0].quantity = quantity ?? items[0].quantity;
      items[0].slots = slots ?? items[0].slots;
    }
    const used = character.gear.reduce((u, item) => u + item.slots, 0);
    const load = Math.max(10, character.strength);
    const actions = [];
    if (character.level === 0 && !character.gear.length) {
      actions.push({ id: "gear-starting", title: `Roll starting gear` });
    }
    if (character.level === 1 && !character.gear.length) {
      actions.push({ id: "gear-crawling", title: `Add crawling kit` });
    }
    this.displayGear(character, lines, actions);
    lines.push(`Slots: ${used}/${load}`);
    await this.library.updateCharacter(characterId, character);
    return { actions, message: lines.join("\n") };
  }
}
