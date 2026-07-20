import { createHash } from 'node:crypto';
import { appendImportPacket, validateImportPacket } from './import-ledger.mjs';

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function digest(value) {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

function validTimestamp(value, label) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new Error(`${label} must be an ISO timestamp`);
  return value;
}

function validatePolicy(policy) {
  if (policy?.schemaVersion !== 1 || policy?.kind !== 'CortexABVImportAdmissionPolicy' || policy?.version !== 'v1') {
    throw new Error('policy must be CortexABVImportAdmissionPolicy v1');
  }
  if (!policy.classificationPolicies?.public || !policy.classificationPolicies?.protected || !Array.isArray(policy.sourceRules)) {
    throw new Error('policy is incomplete');
  }
  return policy;
}

function sourceRuleFor(packet, policy) {
  const rule = policy.sourceRules.find(({ source }) => source?.kind === packet.source.kind && source?.id === packet.source.id);
  if (!rule || !rule.allowedDataKinds?.includes(packet.dataKind)) throw new Error('packet source or dataKind is not allowlisted by admission policy');
  return rule;
}

function resolveClassificationPolicy(classification, rule, policy) {
  const basePolicy = policy.classificationPolicies?.[classification];
  if (!basePolicy || !Number.isInteger(basePolicy.maxAgeDays) || basePolicy.maxAgeDays < 1) {
    throw new Error(`policy has no valid retention policy for ${classification}`);
  }

  const sourceOverride = rule?.classificationPolicy?.[classification];
  if (!sourceOverride) {
    return basePolicy;
  }

  return {
    ...basePolicy,
    ...sourceOverride,
    personalSurfaceEligibility: {
      ...basePolicy.personalSurfaceEligibility,
      ...sourceOverride.personalSurfaceEligibility,
    },
  };
}

function expiration(admittedAt, maxAgeDays) {
  return new Date(Date.parse(admittedAt) + maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
}

export function admitImportPacket({ packet, policy, admittedAt }) {
  validateImportPacket(packet);
  validatePolicy(policy);
  const timestamp = validTimestamp(admittedAt, 'admittedAt');
  const sourceRule = sourceRuleFor(packet, policy);
  const classificationPolicy = resolveClassificationPolicy(packet.classification, sourceRule, policy);
  const packetDigest = digest(packet);
  const policyDigest = digest(policy);
  return {
    schemaVersion: 1,
    kind: 'CortexABVImportAdmissionReceipt',
    version: 'v1',
    authority: 'plan',
    externalSideEffects: false,
    status: 'admitted',
    admittedAt: timestamp,
    packetDigest,
    policy: { version: policy.version, digest: policyDigest },
    retention: {
      mode: 'manual_deletion_required',
      maxAgeDays: classificationPolicy.maxAgeDays,
      expiresAt: expiration(timestamp, classificationPolicy.maxAgeDays),
    },
    personalSurfaceEligibility: classificationPolicy.personalSurfaceEligibility,
  };
}

export function admitAndAppendImportPacket({ ledgerPath, packet, policy, receivedAt }) {
  const admission = admitImportPacket({ packet, policy, admittedAt: receivedAt });
  const result = appendImportPacket({ ledgerPath, packet, admission, receivedAt });
  return { admission, result };
}
