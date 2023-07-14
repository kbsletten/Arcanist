import fs from "fs";
import sqlite3 from "sqlite3";

const SCRIPTS = ["servers"];

export class Library {
  constructor() {
    this.conn = new sqlite3.Database("arcanist.sqlite");
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
      return {};
    }
    return JSON.parse(server["Data"]);
  }
  async updateServer(serverId, server) {
    await this.run(
      `UPDATE Servers SET Data = ? WHERE Id = ?`,
      JSON.stringify(server),
      serverId
    );
  }
  get(...args) {
    return new Promise((resolve, reject) => {
      this.conn.get(...args, (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(row);
      });
    });
  }
  run(...args) {
    return new Promise((resolve, reject) => {
      this.conn.run(...args, (err) => {
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
