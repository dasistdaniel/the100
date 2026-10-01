export const DEFAULT_MESSAGE = 'update games';

// npm run publish -- [message words] [-m|--message <message>] [--dry-run]
export function parsePublishArgs(args) {
  let dryRun = false;
  let message = null;
  const words = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '-m' || arg === '--message') {
      message = args[i + 1];
      i += 1;
      if (message === undefined || message.trim() === '') throw new Error('The commit message after -m must not be empty.');
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option "${arg}". Usage: npm run publish -- ["message"] [--dry-run]`);
    } else {
      words.push(arg);
    }
  }

  if (message === null && words.length) message = words.join(' ');
  if (message !== null && message.trim() === '') throw new Error('The commit message must not be empty.');
  return { message: (message ?? DEFAULT_MESSAGE).trim(), dryRun };
}
