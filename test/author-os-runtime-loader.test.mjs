import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildProposalPrompt,
  buildProjectContextText,
} from '../scripts/sync-project-descriptions.mjs';
import {
  clearAuthorOsCache,
  loadAuthorOsProfile,
} from '../cortex-abv/author_os/runtime-loader.mjs';

const authorOsRoot = path.resolve(process.cwd(), 'cortex-abv', 'author_os');

function withTempAuthorOs(configure) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'author-os-test-'));
  try {
    const domainOverridesRoot = path.join(root, 'DOMAIN_OVERRIDES');
    mkdirSync(domainOverridesRoot, { recursive: true });
    configure(root, domainOverridesRoot);
    return root;
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

function writeText(filePath, content = 'content') {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${content}\n`);
}

const canonicalOrder = [
  'AUTHOR_OS.md',
  'THINKING.md',
  'VALUES.md',
  'VOICE.md',
  'WRITING.md',
  'RHETORIC.md',
  'READER_EFFECT.md',
  'ENGLISH_STYLE.md',
  'ANTI_PATTERNS.md',
];

function writeCanonicalCore(root) {
  for (const fileName of canonicalOrder) {
    writeText(path.join(root, fileName), `# ${fileName}`);
  }
}

function makeManifest(root, overrides) {
  const manifest = {
    name: 'ABVx Author Operating System',
    version: '0.1.0-test',
    core_files: canonicalOrder,
    domain_overrides: ['software', 'travel', ...(overrides || [])],
  };
  writeText(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2));
}

function makeTarget() {
  return {
    data: {
      slug: 'mn7r',
      summary: 'Source-facing project for proposal checks.',
      body: 'Existing body',
      type: 'index-platform',
      primarySection: 'focus',
      homepageEligible: true,
      publicCopy: {
        allowedThemes: ['market references'],
        forbiddenTerms: ['prototype'],
      },
    },
    sync: {
      repository: 'markoblogo/mn7r',
      ref: 'main',
      publicCopy: {
        allowedThemes: ['market references'],
        forbiddenTerms: ['prototype'],
      },
    },
    body: 'Current baseline body.',
  };
}

test('loads canonical core files in deterministic order', () => {
  const canonical = loadAuthorOsProfile({ authorOsRoot });
  const positions = canonicalOrder.map((name) => canonical.prompt.indexOf(`## ${name}`));
  assert.ok(positions.every((position) => position >= 0));
  for (let index = 0; index < positions.length - 1; index += 1) {
    assert.ok(positions[index] < positions[index + 1]);
  }
  assert.equal(canonical.trace.authorOsName, 'ABVx Author Operating System');
});

test('loads domain override when requested', () => {
  const profile = loadAuthorOsProfile({ authorOsRoot, domain: 'software' });
  assert.equal(profile.trace.domainOverrideLoaded, true);
  assert.equal(profile.trace.domainOverride, 'software');
  assert.equal(profile.trace.finalPrecedenceOrder[2], 'DOMAIN_OVERRIDE:software');
});

test('general domain does not load an override', () => {
  const profile = loadAuthorOsProfile({ authorOsRoot, domain: 'general' });
  assert.equal(profile.trace.domainOverrideLoaded, false);
  assert.equal(profile.trace.domainOverride, 'general');
  assert.equal(profile.trace.finalPrecedenceOrder.includes('DOMAIN_OVERRIDE:general'), false);
  assert.deepEqual(profile.trace.finalPrecedenceOrder.slice(0, 2), ['ID_FACTUAL_CONTEXT', 'AUTHOR_OS']);
});

test('missing optional domain override fails with clear message', () => {
  const root = withTempAuthorOs((base, overrides) => {
    writeCanonicalCore(base);
    makeManifest(base, ['travel']);
    writeText(path.join(overrides, 'software.md'), 'Software override');
  });
  clearAuthorOsCache();
  try {
    assert.throws(
      () => loadAuthorOsProfile({ authorOsRoot: root, domain: 'travel' }),
      /missing AUTHOR_OS override file for domain 'travel'/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('missing required core file fails clearly', () => {
  const root = withTempAuthorOs((base) => {
    writeCanonicalCore(base);
    makeManifest(base, []);
    rmSync(path.join(base, 'THINKING.md'), { force: true });
  });
  clearAuthorOsCache();
  try {
    assert.throws(
      () => loadAuthorOsProfile({ authorOsRoot: root, domain: 'general' }),
      /required author_os file is not readable/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('prompt assembly keeps AUTHOR_OS before project and task context', () => {
  const target = makeTarget();
  const assembled = buildProposalPrompt({
    target,
    source: 'repo-source',
    projectContext: buildProjectContextText(target),
    taskInstructions: 'Use concise claims only',
  });

  const indexAuthorOs = assembled.prompt.indexOf('## AUTHOR_OS.md');
  const indexProjectContext = assembled.prompt.indexOf('## PROJECT_CONTEXT');
  const indexTask = assembled.prompt.indexOf('## CURRENT_TASK');
  const indexConstraint = assembled.prompt.indexOf('Current task constraint: Use concise claims only');
  assert.ok(indexAuthorOs >= 0);
  assert.ok(indexProjectContext > indexAuthorOs);
  assert.ok(indexTask > indexProjectContext);
  assert.ok(indexConstraint > indexTask);
  assert.ok(assembled.trace.finalPrecedenceOrder.includes('CURRENT_TASK'));
});

test('task constraints still appear in prompt without overriding AUTHOR_OS block', () => {
  const target = makeTarget();
  const assembled = buildProposalPrompt({
    target,
    source: 'repo-source',
    projectContext: 'Project context snippet',
    taskInstructions: 'Use concise claims only',
  });

  assert.match(assembled.prompt, /## AUTHOR_OS.md[\s\S]*ANTI_PATTERNS.md/);
  assert.match(assembled.prompt, /Use concise claims only/);
  assert.notEqual(assembled.prompt.indexOf('Use concise claims only'), -1);
});

test('author os trace is complete and contains required flags', () => {
  const profile = loadAuthorOsProfile({ authorOsRoot });
  assert.equal(profile.trace.loaded, true);
  assert.equal(typeof profile.trace.authorOsVersion, 'string');
  assert.equal(Array.isArray(profile.trace.coreFilesLoaded), true);
  assert.equal(profile.trace.coreFilesLoaded.includes('AUTHOR_OS.md'), true);
  assert.equal(profile.trace.domainOverrideLoaded, false);
  assert.equal(profile.trace.projectContextLoaded, false);
  assert.equal(profile.trace.taskInstructionsLoaded, false);
  assert.deepEqual(profile.trace.finalPrecedenceOrder, ['ID_FACTUAL_CONTEXT', 'AUTHOR_OS', 'PROJECT_CONTEXT', 'CURRENT_TASK']);
});

test('user task-specific style can be applied without disabling base AUTHOR_OS', () => {
  const target = makeTarget();
  const assembled = buildProposalPrompt({
    target,
    source: 'repo-source',
    projectContext: 'Project context snippet',
    taskInstructions: 'Use poetic legal-tone style',
  });

  const hasAuthorOsBlock = assembled.prompt.includes('## AUTHOR_OS.md');
  const hasTaskConstraints = assembled.prompt.includes('Use poetic legal-tone style');
  const hasFinalStyleOrder = assembled.prompt.indexOf('## AUTHOR_OS.md')
    < assembled.prompt.indexOf('## CURRENT_TASK')
    && assembled.prompt.indexOf('## CURRENT_TASK') < assembled.prompt.indexOf('Current task constraint: Use poetic legal-tone style');
  assert.equal(hasAuthorOsBlock, true);
  assert.equal(hasTaskConstraints, true);
  assert.equal(hasFinalStyleOrder, true);
});

test('prompt trace does not include filesystem paths', () => {
  const canonical = loadAuthorOsProfile({ authorOsRoot });
  assert.equal(canonical.trace.finalPrecedenceOrder.every((entry) => typeof entry === 'string'), true);
  assert.equal(canonical.trace.coreFilesLoaded.every((name) => !name.includes('/')), true);
  assert.equal(assembledStringHasNoFsPath(canonical.prompt, authorOsRoot), true);
});

test('ID factual context is separated and redacted in prompt layer', () => {
  const target = makeTarget();
  target.data.idEvidence = [
    {
      sourceRepository: 'markoblogo/ID',
      sourceDocument: 'personal.json',
      stableItemId: 'id:interview:1',
      contentType: 'json',
      timestamp: '2026-08-03',
      revision: 'r1',
      privacy: 'private',
      summary: 'User prefers concise, direct edits with evidence-backed proposals.',
    },
  ];

  const assembled = buildProposalPrompt({
    target,
    source: 'repo-source',
    projectContext: buildProjectContextText(target),
    taskInstructions: 'Use concise claims only',
  });

  assert.equal(assembled.prompt.includes('## ID_FACTUAL_CONTEXT'), true);
  assert.equal(assembled.prompt.includes('[redacted-source-document]'), true);
  assert.equal(assembled.trace.idEvidenceCount, 1);
  assert.equal(assembled.prompt.indexOf('## ID_FACTUAL_CONTEXT') < assembled.prompt.indexOf('## AUTHOR_OS.md'), true);
});

test('conflicting rules are surfaced in trace', () => {
  const root = withTempAuthorOs((base) => {
    writeCanonicalCore(base);
    makeManifest(base, ['software']);
    mkdirSync(path.join(base, 'governance'), { recursive: true });
    writeText(
      path.join(base, 'governance', 'rules.json'),
      JSON.stringify({
        schemaVersion: 1,
        version: '0.1.0-test',
        rules: [
              {
                id: 'AO-TEST-001',
                title: 'Primary rule',
                file: 'AUTHOR_OS.md',
                section: 'AUTHOR_OS.md',
            stability: 'CORE',
            scope: 'global',
            domains: ['*'],
            status: 'active',
            runtime_enabled: true,
            introduced_in: '0.1.0-test',
            evidence_refs: [
              {
                sourceRepository: 'local',
                document: 'cortex-abv/author_os/AUTHOR_OS.md',
                stableItemId: 'AUTHOR_OS.md:Purpose',
                contentType: 'markdown',
                timestamp: '2026-08-03',
                revision: '0.1.0',
                privacy: 'public',
              },
            ],
            conflicts: ['AO-TEST-002'],
          },
              {
                id: 'AO-TEST-002',
                title: 'Conflicting secondary rule',
                file: 'AUTHOR_OS.md',
                section: 'AUTHOR_OS.md',
            stability: 'CORE',
            scope: 'global',
            domains: ['*'],
            status: 'active',
            runtime_enabled: true,
            introduced_in: '0.1.0-test',
            evidence_refs: [
              {
                sourceRepository: 'local',
                document: 'cortex-abv/author_os/AUTHOR_OS.md',
                stableItemId: 'AUTHOR_OS.md:Purpose',
                contentType: 'markdown',
                timestamp: '2026-08-03',
                revision: '0.1.0',
                privacy: 'public',
              },
            ],
            conflicts: ['AO-TEST-001'],
          },
        ],
      }),
    );
  });

  clearAuthorOsCache();
  try {
    const profile = loadAuthorOsProfile({ authorOsRoot: root });
    assert.equal(Array.isArray(profile.trace.excludedRules.conflicts), true);
    assert.equal(profile.trace.excludedRules.conflicts.length >= 1, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function assembledStringHasNoFsPath(value, rootPath) {
  const normalizedRoot = path.resolve(rootPath);
  return !String(value).includes(normalizedRoot);
}
