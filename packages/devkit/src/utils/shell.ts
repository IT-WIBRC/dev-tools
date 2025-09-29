import { execa, execaCommand, type Options } from "execa";

export async function execute(
  command: string,
  args: string[],
  options?: Options,
): Promise<ReturnType<typeof execa>> {
  return execa(command, args, options);
}

export async function executeCommand(
  commandString: string,
  options?: Options,
): Promise<ReturnType<typeof execaCommand>> {
  return execaCommand(commandString, options);
}
