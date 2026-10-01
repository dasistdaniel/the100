import { execFileSync, spawnSync } from 'node:child_process';
import { parsePublishArgs } from './lib/publish.js';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trimEnd();
const run = (command, args) => {
  const { status } = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (status !== 0) {
    console.error(`\n"${command} ${args.join(' ')}" failed. Nothing was committed or pushed.`);
    process.exit(1);
  }
};

let options;
try {
  options = parsePublishArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const branch = git('branch', '--show-current');
if (branch !== 'main') {
  console.error(`You are on branch "${branch}". Publishing deploys from main only: switch with "git checkout main" (and merge your branch) first.`);
  process.exit(1);
}

run('npm', ['test']);
run('npm', ['run', 'build']);

const changes = git('status', '--porcelain');
let unpushed = 0;
try {
  unpushed = Number(git('rev-list', '--count', '@{u}..HEAD'));
} catch {
  unpushed = 0; // no upstream yet
}

if (!changes && !unpushed) {
  console.log('\nNothing to publish: no changes and nothing unpushed.');
  process.exit(0);
}

if (changes) {
  console.log(`\nChanges that will be committed:\n${changes}`);
  console.log(`\nCommit message: "${options.message}"`);
}
if (unpushed) console.log(`\n${unpushed} commit(s) not pushed yet.`);

if (options.dryRun) {
  console.log('\nDry run: nothing was committed or pushed.');
  process.exit(0);
}

if (changes) {
  git('add', '-A');
  git('commit', '-m', options.message);
}
console.log('\nPushing...');
run('git', ['push']);
console.log('\nDone. The site updates in about a minute. Follow the deploy with: gh run list --limit 1');
