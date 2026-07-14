import assert from 'node:assert/strict';
import test from 'node:test';
import { applyProposal } from '../scripts/project-description-sync-lib.mjs';

const source = {
  title: 'MN7R',
  summary: 'Current summary.',
  status: 'live',
  links: [{ type: 'github', label: 'GitHub', url: 'https://github.com/markoblogo/mn7r' }],
  sync: { enabled: true, repository: 'markoblogo/mn7r', paths: ['README.md'] },
};

test('applies only approved copy fields and records source provenance', () => {
  const result = applyProposal({
    data: source,
    body: 'Current body.',
    proposal: { changed: true, summary: 'Updated summary.', body: 'Updated body.', notes: ['README updated.'] },
    sourceCommit: 'abc123',
    updatedAt: '2026-07-14',
  });

  assert.equal(result.changed, true);
  assert.equal(result.data.summary, 'Updated summary.');
  assert.equal(result.body, 'Updated body.');
  assert.equal(result.data.title, 'MN7R');
  assert.equal(result.data.status, 'live');
  assert.deepEqual(result.data.links, source.links);
  assert.deepEqual(result.data.sync, {
    enabled: true,
    repository: 'markoblogo/mn7r',
    paths: ['README.md'],
    lastAppliedCommit: 'abc123',
    lastAppliedAt: '2026-07-14',
  });
});

test('does not write a change when the proposal repeats current copy', () => {
  const result = applyProposal({
    data: source,
    body: 'Current body.',
    proposal: { changed: true, summary: 'Current summary.', body: 'Current body.', notes: [] },
    sourceCommit: 'abc123',
    updatedAt: '2026-07-14',
  });

  assert.equal(result.changed, false);
  assert.equal(result.data, source);
});

test('rejects malformed generated copy', () => {
  assert.throws(
    () => applyProposal({
      data: source,
      body: 'Current body.',
      proposal: { changed: true, summary: '', body: 'Updated body.', notes: [] },
      sourceCommit: 'abc123',
      updatedAt: '2026-07-14',
    }),
    /summary must be a non-empty string/,
  );
});
