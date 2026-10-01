import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MESSAGE, parsePublishArgs } from '../scripts/lib/publish.js';

test('uses a default commit message without arguments', () => {
  assert.deepEqual(parsePublishArgs([]), { message: DEFAULT_MESSAGE, dryRun: false });
});

test('takes the message from a single quoted argument', () => {
  assert.equal(parsePublishArgs(['fix texts for wuffel']).message, 'fix texts for wuffel');
});

test('joins unquoted words into one message', () => {
  assert.equal(parsePublishArgs(['fix', 'texts']).message, 'fix texts');
});

test('accepts -m and --message', () => {
  assert.equal(parsePublishArgs(['-m', 'new screenshots']).message, 'new screenshots');
  assert.equal(parsePublishArgs(['--message', 'new screenshots']).message, 'new screenshots');
});

test('--dry-run can come before or after the message', () => {
  assert.deepEqual(parsePublishArgs(['--dry-run', 'x']), { message: 'x', dryRun: true });
  assert.deepEqual(parsePublishArgs(['x', '--dry-run']), { message: 'x', dryRun: true });
  assert.equal(parsePublishArgs(['--dry-run']).message, DEFAULT_MESSAGE);
});

test('rejects an empty message, a missing -m value and unknown flags', () => {
  assert.throws(() => parsePublishArgs(['-m']), /message/i);
  assert.throws(() => parsePublishArgs(['-m', '   ']), /message/i);
  assert.throws(() => parsePublishArgs(['--nope']), /Unknown option "--nope"/);
});
