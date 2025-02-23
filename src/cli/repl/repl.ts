import { type ReplCommand, parseReplCommand } from "./commands";
import { ReplExecuter } from "./executer";

export class Repl {
  private commands = new Map<string, ReplCommand>();
  private executer = new ReplExecuter();

  registerCommands(commands: ReplCommand[]) {
    for (const command of commands) {
      this.commands.set(command.name, command);
    }
  }

  async complete(input: string): Promise<string[]> {
    if (input.startsWith(":")) {
      const { commandName, argument } = parseReplCommand(input);

      if (argument === undefined) {
        // コマンド名を補完
        const completions = this.commands
          .keys()
          .filter((name) => name.startsWith(commandName));
        return completions.map((name) => `:${name}`).toArray();
      }

      const command = this.commands.get(commandName);

      // 存在しないコマンドの引数を補完しようとした or コマンドが引数の補完をしない
      if (command?.complete == null) return [];

      // 引数部分を補完
      const completions = await command.complete(argument);
      return completions.map((arg) => `:${commandName} ${arg}`);
    }

    return await this.executer.complete(input);
  }
  async run(input: string): Promise<void> {
    if (input.startsWith(":")) {
      const { commandName, argument } = parseReplCommand(input);
      const command = this.commands.get(commandName);

      if (command == null) {
        // biome-ignore lint/suspicious/noConsoleLog:
        // biome-ignore lint/suspicious/noConsole:
        console.log(
          `Unknown repl command :${commandName}, type :help to show help.`,
        );
      } else {
        await command.run(this, argument);
      }
    } else {
      await this.executer.execute(input);
    }
  }
}
