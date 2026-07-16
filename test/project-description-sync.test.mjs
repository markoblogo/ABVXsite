import assert from 'node:assert/strict';
import test from 'node:test';
import { PublicCopyAbstention, applyProposal, validatePublicCopyEvidence, validatePublicCopyProfile } from '../scripts/project-description-sync-lib.mjs';

const source = {
  title: 'MN7R',
  summary: 'Current summary.',
  status: 'live',
  links: [{ type: 'github', label: 'GitHub', url: 'https://github.com/markoblogo/mn7r' }],
  sync: { enabled: true, repository: 'markoblogo/mn7r', paths: ['README.md'] },
  publicCopy: {
    bodyMode: 'append_only',
    allowedThemes: ['brokerage workflow coordination'],
    forbiddenTerms: ['Telegram', 'AI assistant'],
  },
};

test('applies only approved copy fields and records source provenance', () => {
  const result = applyProposal({
    data: source,
    body: 'Current body.',
    proposal: { changed: true, summary: 'Updated summary.', bodyAppendix: 'Updated body.', notes: ['README updated.'] },
    sourceCommit: 'abc123',
    updatedAt: '2026-07-14',
  });

  assert.equal(result.changed, true);
  assert.equal(result.data.summary, 'Updated summary.');
  assert.equal(result.body, 'Current body.\n\nUpdated body.');
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
    proposal: { changed: true, summary: 'Current summary.', bodyAppendix: '', notes: [] },
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
      proposal: { changed: true, summary: '', bodyAppendix: 'Updated body.', notes: [] },
      sourceCommit: 'abc123',
      updatedAt: '2026-07-14',
    }),
    /summary must be a non-empty string/,
  );
});

test('rejects public copy that exposes protected or prototype-gap details', () => {
  assert.throws(
    () => applyProposal({
      data: source,
      body: 'Current body.',
      proposal: {
        changed: true,
        summary: 'Updated summary with protected workspace details.',
        bodyAppendix: 'Updated body.',
        notes: [],
      },
      sourceCommit: 'abc123',
      updatedAt: '2026-07-14',
    }),
    (error) => error instanceof PublicCopyAbstention && /not public-safe: protected/i.test(error.message),
  );
});

test('requires one source line-range anchor for each changed public field', () => {
  const proposal = {
    changed: true,
    summary: 'Updated summary.',
    bodyAppendix: 'Updated body.',
    notes: [],
    claims: [
      { field: 'summary', text: 'Updated summary.', evidencePath: 'README.md', lineStart: 3, lineEnd: 5 },
      { field: 'bodyAppendix', text: 'Updated body.', evidencePath: 'README.md', lineStart: 8, lineEnd: 10 },
    ],
  };
  const evidence = validatePublicCopyEvidence({
    proposal,
    sync: source.sync,
    data: source,
    sourceFiles: [{ path: 'README.md', text: '# Product\n\nSummary\n\nDetails\n\nMore details\n\nBody support\n\nMore body support' }],
  });

  assert.deepEqual(evidence.claims.map(({ field, evidencePath, lineStart, lineEnd }) => ({ field, evidencePath, lineStart, lineEnd })), [
    { field: 'summary', evidencePath: 'README.md', lineStart: 3, lineEnd: 5 },
    { field: 'bodyAppendix', evidencePath: 'README.md', lineStart: 8, lineEnd: 10 },
  ]);
  assert.throws(
    () => validatePublicCopyEvidence({
      proposal: { ...proposal, claims: [proposal.claims[0]] },
      sync: source.sync,
      data: source,
      sourceFiles: [{ path: 'README.md', text: 'one\ntwo' }],
    }),
    /each changed public field/i,
  );
});

test('requires a per-project public-copy profile and preserves the public body baseline', () => {
  assert.deepEqual(validatePublicCopyProfile(source.publicCopy), source.publicCopy);
  assert.throws(() => validatePublicCopyProfile({ ...source.publicCopy, bodyMode: 'replace' }), /bodyMode must be append_only/);
  assert.throws(
    () => applyProposal({
      data: source,
      body: 'Current body.',
      proposal: { changed: true, summary: 'Updated summary.', bodyAppendix: 'An AI assistant is available.', notes: [] },
      sourceCommit: 'abc123',
      updatedAt: '2026-07-14',
    }),
    (error) => error instanceof PublicCopyAbstention && /not public-safe: AI assistant/i.test(error.message),
  );
});
