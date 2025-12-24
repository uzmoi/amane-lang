import { parse_repl_command, type ReplCommand } from "./commands";
import { ReplExecuter } from "./executer";

export class Repl {
  private commands = new Map<string, ReplCommand>();
  private executer = new ReplExecuter();

  register_commands(commands: ReplCommand[]) {
    for (const command of commands) {
      this.commands.set(command.name, command);
    }
  }

  async complete(input: string): Promise<string[]> {
    if (input.startsWith(":")) {
      const { name, argument } = parse_repl_command(input);

      if (argument === undefined) {
        // コマンド名を補完
        const completions = this.commands
          .keys()
          .filter((n) => n.startsWith(name));
        return completions.map((name) => `:${name}`).toArray();
      }

      const command = this.commands.get(name);

      // 存在しないコマンドの引数を補完しようとした or コマンドが引数の補完をしない
      if (command?.complete == null) return [];

      // 引数部分を補完
      const completions = await command.complete(argument);
      return completions.map((arg) => `:${name} ${arg}`);
    }

    return await this.executer.complete(input);
  }
  async run(input: string): Promise<void> {
    if (input.startsWith(":")) {
      const { name, argument } = parse_repl_command(input);
      const command = this.commands.get(name);

      if (command == null) {
        console.log(`Unknown repl command :${name}, type :help to show help.`);
      } else {
        await command.run(this, argument);
      }
    } else {
      await this.executer.execute(input);
    }
  }
}
