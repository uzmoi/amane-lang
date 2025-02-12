import { cac } from "cac";
import { version } from "../";

export const main = () => {
  const cli = cac("amane");

  cli.help();
  cli.version(version);
  cli.parse();
};

main();
