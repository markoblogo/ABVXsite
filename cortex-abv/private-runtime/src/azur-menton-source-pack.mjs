import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CONTENT_KINDS = new Set(['guide', 'faq', 'place']);
const REQUIRED_CONTENT_KINDS = ['guide', 'faq', 'place'];
const REQUIRED_PROHIBITIONS = [
  'booking_mutation',
  'availability_assertion_without_verified_source',
  'price_assertion_without_verified_source',
  'payment_handling',
  'cross_tenant_retrieval',
  'personal_context_retrieval',
  'guest_data_retention',
  'external_message_sending',
];

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value) || !value.length) throw new Error(`${label} must be a non-empty array`);
  return value;
}

function requireExact(value, expected, label) {
  if (value !== expected) throw new Error(`${label} must be ${expected}`);
}

export function validateAzurMentonSourcePack(sourcePack) {
  if (sourcePack?.schemaVersion !== 1 || sourcePack?.kind !== 'CortexABVAzurMentonSourcePack' || sourcePack?.version !== 'v1') {
    throw new Error('source pack must be CortexABVAzurMentonSourcePack v1');
  }
  requireExact(sourcePack.authority, 'read', 'source pack authority');
  if (sourcePack.externalSideEffects !== false || sourcePack.runtimeIntegration !== false) {
    throw new Error('source pack must remain read-only without runtime integration');
  }
  requireExact(sourcePack.tenantId, 'azur-menton', 'source pack tenantId');
  requireExact(sourcePack.status, 'snapshot_only', 'source pack status');
  requireExact(sourcePack.corpusMode, 'source_manifest_only', 'source pack corpusMode');
  requireExact(sourcePack.classification, 'public', 'source pack classification');
  if (sourcePack.guestDataIncluded !== false) throw new Error('source pack must not include guest data');
  nonEmptyString(sourcePack.packId, 'source pack packId');
  nonEmptyString(sourcePack.revision?.repository, 'source pack revision.repository');
  if (!/^[a-f0-9]{40}$/.test(sourcePack.revision?.commitSha ?? '')) throw new Error('source pack revision.commitSha must be a 40-character SHA');

  const sourcePaths = new Set();
  const coveredKinds = new Set();
  for (const source of requireArray(sourcePack.sources, 'source pack sources')) {
    const relativePath = nonEmptyString(source?.relativePath, 'source.relativePath');
    if (relativePath.startsWith('/') || relativePath.includes('..')) throw new Error('source.relativePath must be repository-relative');
    if (sourcePaths.has(relativePath)) throw new Error(`source path is duplicated: ${relativePath}`);
    sourcePaths.add(relativePath);
    if (!/^[a-f0-9]{64}$/.test(source.sha256 ?? '')) throw new Error(`source.sha256 must be a SHA-256 digest: ${relativePath}`);
    requireExact(source.provenanceType, 'repository_file_sha256', 'source.provenanceType');
    if (Object.hasOwn(source, 'content')) throw new Error('source pack must be a manifest and cannot embed source content');
    for (const contentKind of requireArray(source.contentKinds, 'source.contentKinds')) {
      if (!CONTENT_KINDS.has(contentKind)) throw new Error(`source.contentKinds contains unsupported kind: ${contentKind}`);
      coveredKinds.add(contentKind);
    }
  }
  if (REQUIRED_CONTENT_KINDS.some((kind) => !coveredKinds.has(kind))) throw new Error('source pack must cover guide, faq, and place content');
  return sourcePack;
}

export function validateAzurMentonGuestChatPolicy(policy) {
  if (policy?.schemaVersion !== 1 || policy?.kind !== 'CortexABVAzurMentonGuestChatPolicy' || policy?.version !== 'v1') {
    throw new Error('guest chat policy must be CortexABVAzurMentonGuestChatPolicy v1');
  }
  requireExact(policy.authority, 'plan', 'guest chat policy authority');
  if (policy.externalSideEffects !== false || policy.runtimeIntegration !== false) {
    throw new Error('guest chat policy must remain plan-only without runtime integration');
  }
  requireExact(policy.tenantId, 'azur-menton', 'guest chat policy tenantId');
  requireExact(policy.status, 'skeleton', 'guest chat policy status');
  nonEmptyString(policy.policyId, 'guest chat policy policyId');
  nonEmptyString(policy.sourcePackId, 'guest chat policy sourcePackId');
  requireExact(policy.responseAuthority, 'read_only', 'guest chat policy responseAuthority');
  if (policy.guestDataCollection !== false) throw new Error('guest chat policy must not collect guest data');
  requireArray(policy.allowedIntents, 'guest chat policy allowedIntents');
  const prohibited = new Set(requireArray(policy.prohibitedCapabilities, 'guest chat policy prohibitedCapabilities'));
  if (!prohibited.has('availability_assertion_without_verified_source')) throw new Error('guest chat policy must prohibit availability assertion without a verified source');
  if (REQUIRED_PROHIBITIONS.some((capability) => !prohibited.has(capability))) throw new Error('guest chat policy prohibitedCapabilities are incomplete');
  requireExact(policy.sourceCitation, 'required_for_factual_claims', 'guest chat policy sourceCitation');
  requireExact(policy.unverifiedClaimAction, 'abstain', 'guest chat policy unverifiedClaimAction');
  const handoffIntents = new Set(requireArray(policy.handoffIntents, 'guest chat policy handoffIntents'));
  if (!handoffIntents.has('booking_or_availability') || !handoffIntents.has('cannot_verify_from_source_pack')) {
    throw new Error('guest chat policy must hand off booking/availability and unverifiable requests');
  }
  return policy;
}

export function validateAzurMentonSourcePackBundle({ sourcePack, guestChatPolicy }) {
  const validatedSourcePack = validateAzurMentonSourcePack(sourcePack);
  const validatedGuestChatPolicy = validateAzurMentonGuestChatPolicy(guestChatPolicy);
  if (validatedGuestChatPolicy.sourcePackId !== validatedSourcePack.packId) {
    throw new Error('guest chat policy sourcePackId must match the source pack');
  }
  return { sourcePack: validatedSourcePack, guestChatPolicy: validatedGuestChatPolicy };
}

export function verifyAzurMentonSourcePackProvenance(sourcePack, { sourceRoot } = {}) {
  const validated = validateAzurMentonSourcePack(sourcePack);
  const resolvedRoot = resolve(nonEmptyString(sourceRoot, 'sourceRoot'));
  for (const source of validated.sources) {
    const sourcePath = resolve(resolvedRoot, source.relativePath);
    if (!sourcePath.startsWith(`${resolvedRoot}/`)) throw new Error(`source path escapes sourceRoot: ${source.relativePath}`);
    const actualDigest = createHash('sha256').update(readFileSync(sourcePath)).digest('hex');
    if (actualDigest !== source.sha256) throw new Error(`source SHA-256 mismatch: ${source.relativePath}`);
  }
  return { verified: true, sourceCount: validated.sources.length };
}
