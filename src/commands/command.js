export class Command {
  arguments = [];
  description = "";
  async execute(parameters) {
    return (await this.executeActions(parameters)).message;
  }
  async executeActions(parameters) {
    return { actions: [], message: await this.execute(parameters) };
  }
}
