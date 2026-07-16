import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  validateAzurMentonGuestChatPolicy,
  validateAzurMentonSourcePack,
  validateAzurMentonSourcePackBundle,
  verifyAzurMentonSourcePackProvenance,
} from '../src/azur-menton-source-pack.mjs';

const sourcePack = JSON.parse(readFileSync(new URL('../config/azur-menton-source-pack.v1.json', import.meta.url), 'utf8'));
const guestChatPolicy = JSON.parse(readFileSync(new URL('../config/azur-menton-guest-chat-policy.v1.json', import.meta.url), 'utf8'));

test('defines a read-only versioned AzurMenton guide, FAQ, and place source manifest', () => {
  const validated = validateAzurMentonSourcePack(sourcePack);
  assert.equal(validated.tenantId, 'azur-menton');
  assert.equal(validated.corpusMode, 'source_manifest_only');
  assert.equal(validated.guestDataIncluded, false);
  assert.deepEqual([...new Set(validated.sources.flatMap((source) => source.contentKinds))].sort(), ['faq', 'guide', 'place']);
  assert.match(validated.revision.commitSha, /^[a-f0-9]{40}$/);
  assert.ok(validated.sources.every((source) => /^[a-f0-9]{64}$/.test(source.sha256)));
});

test('requires safe guest-chat behavior and a matching source-pack reference', () => {
  const validated = validateAzurMentonSourcePackBundle({ sourcePack, guestChatPolicy });
  assert.equal(validated.guestChatPolicy.responseAuthority, 'read_only');
  assert.equal(validated.guestChatPolicy.guestDataCollection, false);
  assert.equal(validated.guestChatPolicy.unverifiedClaimAction, 'abstain');
  assert.ok(validated.guestChatPolicy.prohibitedCapabilities.includes('booking_mutation'));
});

test('rejects a policy that could state unverified availability', () => {
  const unsafe = {
    ...guestChatPolicy,
    prohibitedCapabilities: guestChatPolicy.prohibitedCapabilities.filter((capability) => capability !== 'availability_assertion_without_verified_source'),
  };
  assert.throws(() => validateAzurMentonGuestChatPolicy(unsafe), /availability assertion/);
});

test('rejects source manifests that omit one of the required corpus kinds', () => {
  const incomplete = {
    ...sourcePack,
    sources: sourcePack.sources.map((source) => ({
      ...source,
      contentKinds: source.contentKinds.filter((kind) => kind !== 'faq'),
    })),
  };
  assert.throws(() => validateAzurMentonSourcePack(incomplete), /must cover guide, faq, and place/);
});

test('verifies every source digest against a caller-provided read-only source root', () => {
  const root = mkdtempSync(join(tmpdir(), 'cortexabv-azur-menton-'));
  const pack = {
    ...sourcePack,
    sources: [{
      relativePath: 'src/content/guide.ts',
      sha256: 'ea2ed0ead21507d099a33528c608c5555ee678a1f640c8a483286fd2a2ade2e9',
      contentKinds: ['guide', 'faq', 'place'],
      provenanceType: 'repository_file_sha256',
    }],
  };
  try {
    const file = join(root, 'src/content/guide.ts');
    mkdirSync(join(root, 'src/content'), { recursive: true });
    writeFileSync(file, 'fixture source pack content');
    assert.deepEqual(verifyAzurMentonSourcePackProvenance(pack, { sourceRoot: root }), {
      verified: true,
      sourceCount: 1,
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
