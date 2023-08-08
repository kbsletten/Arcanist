import fs from "fs";
import sqlite3 from "sqlite3";
import { v4 as uuid } from "uuid";
import { statModifier } from "../util.js";

const SCRIPTS = ["characters", "users", "servers"];

function mapServer(server) {
  return {
    ...server,
    light: server.light ?? 0,
    lightStart: server.lightStart ?? undefined,
  };
}

function mapUser(user) {
  return {
    ...user,
    activeCharacterId: user.activeCharacterId ?? undefined,
  };
}

function mapCharacter(character) {
  const {
    alignment = "N",
    ancestry = "Mysterious",
    background = "Stranger",
    charisma = 10,
    className = "Classless",
    constitution = 10,
    deity = "Godless",
    dexterity = 10,
    gear = [],
    intelligence = 10,
    level = 0,
    luck = false,
    name = "Unnamed character",
    strength = 10,
    title = "Unknown",
    wisdom = 10,
    xp = 0,
  } = character;
  const {
    ac = 10 + statModifier(dexterity),
    maxHp = Math.max(1, statModifier(constitution)),
  } = character;
  const { hp = maxHp } = character;
  return {
    ...character,
    ac,
    alignment,
    ancestry,
    background,
    charisma,
    className,
    constitution,
    deity,
    dexterity,
    gear: gear.map((item) => {
      const { name = "Unknown Item", slots = 1, quantity = 1 } = item;
      return {
        ...item,
        name,
        slots,
        quantity,
      };
    }),
    hp,
    intelligence,
    level,
    luck,
    maxHp,
    name,
    strength,
    title,
    wisdom,
    xp,
  };
}

export class Library {
  constructor(file = "arcanist.sqlite") {
    this.conn = new sqlite3.Database(file);
  }
  async init() {
    for (const script of SCRIPTS) {
      const text = await new Promise((resolve, reject) =>
        fs.readFile(`src/db/${script}.sql`, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        })
      );
      await this.run(text.toString());
    }
  }
  async getServer(serverId) {
    let server = await this.get(
      `SELECT Data FROM Servers WHERE Id = ?`,
      serverId
    );
    if (!server) {
      await this.run(
        `INSERT INTO Servers (Id, Data) VALUES (?, ?)`,
        serverId,
        JSON.stringify({})
      );
      return mapServer({});
    }
    return mapServer(JSON.parse(server["Data"]));
  }
  async updateServer(serverId, server) {
    await this.run(
      `UPDATE Servers SET Data = ? WHERE Id = ?`,
      JSON.stringify(server),
      serverId
    );
  }
  async getUser(userId) {
    let user = await this.get(`SELECT Data FROM Users WHERE Id = ?`, userId);
    if (!user) {
      await this.run(
        `INSERT INTO Users (Id, Data) VALUES (?, ?)`,
        userId,
        JSON.stringify({})
      );
      return mapUser({});
    }
    return mapUser(JSON.parse(user["Data"]));
  }
  async updateUser(userId, user) {
    await this.run(
      `UPDATE Users SET Data = ? WHERE Id = ?`,
      JSON.stringify(user),
      userId
    );
  }
  async createCharacter(userId, character) {
    const id = uuid().replace(/-/g, "");
    await this.run(
      `INSERT INTO Characters (Id, UserId, Data) VALUES (?, ?, ?)`,
      id,
      userId,
      JSON.stringify(character)
    );
    return id;
  }
  async getDefaultCharacter(userId, user) {
    const defaultCharacter = user.activeCharacterId
      ? await this.getCharacter(user.activeCharacterId)
      : null;
    if (defaultCharacter) {
      return [user.activeCharacterId, defaultCharacter];
    }
    return await this.getUserCharacter(userId);
  }
  async getCharacter(characterId) {
    const character = await this.get(
      `SELECT Data FROM Characters WHERE Id = ?`,
      characterId
    );
    if (!character) {
      return null;
    }
    return mapCharacter(JSON.parse(character["Data"]));
  }
  async getUserCharacter(userId) {
    const character = await this.get(
      `SELECT Id, Data FROM Characters WHERE UserId = ?`,
      userId
    );
    if (!character) {
      return [null, null];
    }
    return [character["Id"], mapCharacter(JSON.parse(character["Data"]))];
  }
  async updateCharacter(characterId, character) {
    await this.run(
      `UPDATE Characters SET Data = ? WHERE Id = ?`,
      JSON.stringify(character),
      characterId
    );
  }
  get(sql, ...args) {
    return new Promise((resolve, reject) => {
      this.conn.get(sql, args, (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(row);
      });
    });
  }
  run(sql, ...args) {
    return new Promise((resolve, reject) => {
      this.conn.run(sql, args, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }
  close() {
    this.conn.close();
  }
}
