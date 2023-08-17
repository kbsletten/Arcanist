import { Character } from "../models/character";
import { statModifier } from "../util";
import { Command } from "./command";

const ANCESTRIES = [
  "Human",
  "Human",
  "Human",
  "Human",
  "Elf",
  "Elf",
  "Dwarf",
  "Dwarf",
  "Halfling",
  "Halfling",
  "Half-orc",
  "Goblin",
];

const NAMES = {
  Dwarf: [
    "Hilde",
    "Torbin",
    "Marga",
    "Bruno",
    "Karina",
    "Naugrim",
    "Brenna",
    "Darvin",
    "Elga",
    "Alric",
    "Isolde",
    "Gendry",
    "Bruga",
    "Junnor",
    "Vidrid",
    "Torson",
    "Brielle",
    "Ulfgar",
    "Sarna",
    "Grimm",
  ],
  Elf: [
    "Eliara",
    "Ryarn",
    "Sariel",
    "Tirolas",
    "Galira",
    "Varos",
    "Daeniel",
    "Axidor",
    "Hiralia",
    "Cyrwin",
    "Lothiel",
    "Zaphiel",
    "Nayra",
    "Ithior",
    "Amriel",
    "Elyon",
    "Jirwyn",
    "Natinel",
    "Fiora",
    "Ruhiel",
  ],
  Goblin: [
    "Iggs",
    "Tark",
    "Nix",
    "Lenk",
    "Roke",
    "Ritz",
    "Tila",
    "Riggs",
    "Prim",
    "Zeb",
    "Finn",
    "Borg",
    "Yark",
    "Deeg",
    "Nibs",
    "Brak",
    "Fink",
    "Rizzo",
    "Squib",
    "Grix",
  ],
  Halfling: [
    "Willow",
    "Benny",
    "Annie",
    "Tucker",
    "Marie",
    "Hobb",
    "Cora",
    "Gordie",
    "Rose",
    "Ardo",
    "Alma",
    "Norbert",
    "Jennie",
    "Barvin",
    "Tilly",
    "Pike",
    "Lydia",
    "Marlow",
    "Astrid",
    "Jasper",
  ],
  "Half-orc": [
    "Vara",
    "Gralk",
    "Ranna",
    "Korv",
    "Zasha",
    "Hrogar",
    "Klara",
    "Tragan",
    "Brolga",
    "Drago",
    "Yelena",
    "Krull",
    "Ulara",
    "Tulk",
    "Shiraal",
    "Wulf",
    "Ivara",
    "Hirok",
    "Aja",
    "Zoraan",
  ],
  Human: [
    "Zali",
    "Bram",
    "Clara",
    "Nattias",
    "Rina",
    "Denton",
    "Mirena",
    "Aran",
    "Morgan",
    "Giralt",
    "Tamra",
    "Oscar",
    "Ishana",
    "Rogar",
    "Jasmin",
    "Tarin",
    "Yuri",
    "Malchor",
    "Lienna",
    "Godfrey",
  ],
};

const BACKGROUNDS = [
  "Urchin",
  "Wanted",
  "Cult Initiate",
  "Thieves' Guild",
  "Banished",
  "Orphaned",
  "Wizard's Apprentice",
  "Jeweler",
  "Herbalist",
  "Barbarian",
  "Mercenary",
  "Sailor",
  "Acolyte",
  "Soldier",
  "Ranger",
  "Scout",
  "Minstrel",
  "Scholar",
  "Noble",
  "Chiurgeon",
];

const CLASSES = ["Fighter", "Priest", "Thief", "Wizard"];

const HIT_DICE = {
  "Fighter": 8,
  "Priest": 6,
  "Thief": 4,
  "Wizard": 4,
}

const DEITIES = [
  "Saint Terragnis",
  "Saint Terragnis",
  "Gede",
  "Madeera the Covenant",
  "Ord",
  "Memnon",
  "Shune the Vile",
  "Ramlaat",
];

const ALIGNMENT = {
  "Saint Terragnis": "L",
  Gede: "N",
  "Madeera the Covenant": "L",
  Ord: "N",
  Memnon: "C",
  "Shune the Vile": "C",
  Ramlaat: "C",
};

export class RandomCharacter extends Command {
  constructor(fmt, library, die, character, gear) {
    super();
    this.fmt = fmt;
    this.library = library;
    this.die = die;
    this.character = character;
    this.gear = gear;
  }

  description = "Create a new random character.";

  arguments = [
    {
      description: "Create a new character by rolling on random charts",
      enum: [0, 1],
      title: "level",
      type: "integer",
    },
  ];

  async executeActions({ level = 1, userId }) {
    const user = await this.library.getUser(userId);
    const character = new Character();
    const lines = [];
    character.level = level;
    lines.push(`Level: ${character.level}`);
    const chooseOption = (property, options) => {
      const { roll, display } = this.die.execute({ sides: options.length });
      character[property] = options[roll - 1];
      lines.push(
        `${property[0].toUpperCase()}${property.substring(1)}: 1d${
          options.length
        } (${display}) = ${options[roll - 1]}`
      );
    };
    chooseOption("ancestry", ANCESTRIES);
    chooseOption("name", NAMES[character.ancestry]);
    chooseOption("background", BACKGROUNDS);
    if (character.level === 1) {
      chooseOption("class", CLASSES);
    }
    chooseOption("deity", DEITIES);
    character.alignment = ALIGNMENT[character.deity];
    lines.push(`Alignment: ${character.alignment}`);
    const rollStat = (stat) => {
      const { roll, display } = this.die.execute({ multiple: 3, sides: 6 });
      character[stat] = roll;
      lines.push(
        `${stat[0].toUpperCase()}${stat.substring(
          1
        )}: 3d6 (${display}) = ${roll}`
      );
    };
    rollStat("strength");
    rollStat("dexterity");
    rollStat("constitution");
    rollStat("intelligence");
    rollStat("wisdom");
    rollStat("charisma");
    if (character.level === 0) {
      lines.push(`Adding gear:`);
      this.gear.rollGear(character, lines);
    } else {
      const { roll, display } = this.die.execute({ sides: HIT_DICE[character.class] });
      character.maxHp = character.hp = Math.max(1, roll + statModifier(character.constitution));
      lines.push(`Hit Points: 1d${HIT_DICE[character.class]} (${display}) + ${statModifier(character.constitution)} = ${character.maxHp}`);
      lines.push(`Adding crawling kit:`)
      this.gear.addCrawling(character);
      this.gear.displayGear(character, lines);
    }
    const characterId = await this.library.createCharacter(userId, character);
    user.activeCharacterId = characterId;
    await this.library.updateUser(userId, user);
    return { actions: [], message: lines.join("\n") };
  }
}
