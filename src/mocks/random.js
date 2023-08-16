import fs from "fs";

export class MockRandom {
  constructor() {
    this.tests = {};
    this.currentTestName = null;
    this.currentIndex = -1;
  }
  load() {
    return new Promise((resolve, reject) => {
      const { testPath } = expect.getState();
      const filePath = testPath.replace(".test.js", ".test.json");
      if (!fs.existsSync(filePath)) {
        fs.writeFile(filePath, "{}", (err) => {
            if (err) {
                reject(err);
            }
        })
      }
      fs.readFile(filePath, (err, data) => {
        if (err) reject(err);
        this.tests = data ? JSON.parse(data) : {};
        resolve();
      });
    });
  }
  save() {
    return new Promise((resolve, reject) => {
      const { testPath } = expect.getState();
      fs.writeFile(
        testPath.replace(".test.js", ".test.json"),
        JSON.stringify(this.tests),
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }
  nextRandom() {
    const { currentTestName } = expect.getState();
    if (currentTestName != this.currentTestName) {
      this.currentTestName = currentTestName;
      this.currentIndex = 0;
      if (!this.tests[this.currentTestName]) {
        this.tests[this.currentTestName] = [];
      }
    }
    if (this.currentIndex > this.tests[this.currentTestName].length) {
      throw new Error(
        `Invalid currentIndex: ${this.currentIndex} (${this.currentTestName}, ${
          this.tests[this.currentTestName].length
        })`
      );
    }
    if (this.currentIndex === this.tests[this.currentTestName].length) {
      this.tests[this.currentTestName].push(Math.random());
    }
    const nextValue = this.tests[this.currentTestName][this.currentIndex++];
    return nextValue;
  }
  randomInt(maximum) {
    return Math.floor(this.nextRandom() * maximum) + 1;
  }
}
