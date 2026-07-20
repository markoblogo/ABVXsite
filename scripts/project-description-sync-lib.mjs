import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentFiles, parseContentFile, serializeFrontmatter } from './content-lib.mjs';

const MAX_SUMMARY_LENGTH = 320;
const MAX_BODY_APPENDIX_LENGTH = 450;
const AUTONOMOUS_PATCH_FIELDS = ['summary', 'bodyAppendix', 'updatedAt', 'sync.lastAppliedCommit', 'sync.lastAppliedAt'];
const DECISION_TRACE_SOURCE_FIELDS = ['sourceKind', 'sourceId'];
const PUBLIC_COPY_DENIALS = [
  /\bprotected\b/i,
  /\binternal\b/i,
  /\bendpoint(?:s)?\b/i,
  /\benvironment variables?\b/i,
  /\b\.env\b/i,
  /\bdemo data\b/i,
  /\bseeded\b/i,
  /\bmock(?:ed)?\b/i,
  /\bpersistence\b/i,
  /\bprototype-grade\b/i,
  /\blacks?\b/i,
  /\bnot yet\b/i,
];

export class PublicCopyAbstention extends Error {
  constructor(message) {
    super(message);
    this.name = 'PublicCopyAbstention';
  }
}

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

function validateDecisionTrace(decisionTrace, filePath) {
  if (!decisionTrace) {
    return {
      policySource: 'base',
      reason: 'base public-sync profile policy is applied',
      basePolicy: { allowedPatchFields: [...AUTONOMOUS_PATCH_FIELDS] },
      sourceOverride: null,
      sourceKind: null,
      sourceId: null,
    };
  }
  if (typeof decisionTrace !== 'object' || Array.isArray(decisionTrace)) {
    throw new Error(`${filePath}: autonomousPublicSync.decisionTrace must be an object`);
  }

  const policySource = decisionTrace.policySource === 'source_specific_override' ? 'source_specific_override' : 'base';
  const reason = nonEmptyString(decisionTrace.reason, `${filePath}: autonomousPublicSync.decisionTrace.reason`);
  const sourceKind = typeof decisionTrace.sourceKind === 'string' ? decisionTrace.sourceKind.trim() : '';
  const sourceId = typeof decisionTrace.sourceId === 'string' ? decisionTrace.sourceId.trim() : '';
  if (policySource === 'source_specific_override' && (DECISION_TRACE_SOURCE_FIELDS.some((field) => !decisionTrace[field]) || !sourceKind || !sourceId)) {
    throw new Error(`${filePath}: source_specific_override requires sourceKind and sourceId`);
  }

  const sourceOverrideAllowedPatchFields = Array.isArray(decisionTrace.sourceOverride?.allowedPatchFields)
    && decisionTrace.sourceOverride.allowedPatchFields.length
    ? decisionTrace.sourceOverride.allowedPatchFields
    : AUTONOMOUS_PATCH_FIELDS;

  return {
    policySource,
    reason,
    sourceKind: sourceKind || null,
    sourceId: sourceId || null,
    basePolicy: { allowedPatchFields: [...AUTONOMOUS_PATCH_FIELDS] },
    sourceOverride: policySource === 'source_specific_override'
      ? { allowedPatchFields: [...sourceOverrideAllowedPatchFields] }
      : null,
  };
}

export function validatePublicCopyProfile(profile, filePath = 'content item') {
  if (!profile || typeof profile !== 'object') throw new Error(`${filePath}: publicCopy profile is required for enabled sync`);
  if (profile.bodyMode !== 'append_only') throw new Error(`${filePath}: publicCopy.bodyMode must be append_only`);
  if (!Array.isArray(profile.allowedThemes) || !profile.allowedThemes.length) throw new Error(`${filePath}: publicCopy.allowedThemes must be a non-empty array`);
  if (!profile.allowedThemes.every((theme) => typeof theme === 'string' && theme.trim())) throw new Error(`${filePath}: publicCopy.allowedThemes must contain non-empty strings`);
  if (!Array.isArray(profile.forbiddenTerms) || !profile.forbiddenTerms.length) throw new Error(`${filePath}: publicCopy.forbiddenTerms must be a non-empty array`);
  if (!profile.forbiddenTerms.every((term) => typeof term === 'string' && term.trim())) throw new Error(`${filePath}: publicCopy.forbiddenTerms must contain non-empty strings`);
  return {
    bodyMode: 'append_only',
    allowedThemes: profile.allowedThemes.map((theme) => theme.trim()),
    forbiddenTerms: profile.forbiddenTerms.map((term) => term.trim()),
  };
}

export function validateSyncConfig(sync, filePath = 'content item', publicCopy) {
  if (!sync || sync.enabled !== true) return null;
  if (typeof sync.repository !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(sync.repository)) {
    throw new Error(`${filePath}: sync.repository must be owner/repository`);
  }
  if (!Array.isArray(sync.paths) || !sync.paths.length || !sync.paths.every((item) => typeof item === 'string' && item.trim())) {
    throw new Error(`${filePath}: sync.paths must contain at least one file path`);
  }
  return {
    repository: sync.repository,
    ref: typeof sync.ref === 'string' ? sync.ref : 'main',
    paths: sync.paths,
    publicCopy: validatePublicCopyProfile(publicCopy, filePath),
  };
}

export function validateAutonomousPublicSyncProfile(profile, filePath = 'content item') {
  if (!profile) return null;
  if (profile.enabled !== true) throw new Error(`${filePath}: autonomousPublicSync.enabled must be true when configured`);
  if (profile.mode !== 'direct_main') throw new Error(`${filePath}: autonomousPublicSync.mode must be direct_main`);
  if (profile.target !== 'abvxsite') throw new Error(`${filePath}: autonomousPublicSync.target must be abvxsite`);
  if (!Array.isArray(profile.allowedPatchFields) || profile.allowedPatchFields.length !== AUTONOMOUS_PATCH_FIELDS.length || profile.allowedPatchFields.some((field, index) => field !== AUTONOMOUS_PATCH_FIELDS[index])) {
    throw new Error(`${filePath}: autonomousPublicSync.allowedPatchFields must preserve the bounded public-copy fields`);
  }
  return {
    enabled: true,
    mode: 'direct_main',
    target: 'abvxsite',
    allowedPatchFields: [...AUTONOMOUS_PATCH_FIELDS],
    decisionTrace: validateDecisionTrace(profile.decisionTrace, filePath),
  };
}

export function assertPublicSafeCopy(summary, bodyAppendix, publicCopy) {
  const copy = `${summary}\n${bodyAppendix}`;
  const denial = PUBLIC_COPY_DENIALS.find((pattern) => pattern.test(copy));
  if (denial) throw new PublicCopyAbstention(`generated copy is not public-safe: ${denial.source.replace(/\\b|\\\?|\\(|\\)/g, '')}`);
  const forbiddenTerm = publicCopy.forbiddenTerms.find((term) => copy.toLocaleLowerCase().includes(term.toLocaleLowerCase()));
  if (forbiddenTerm) throw new PublicCopyAbstention(`generated copy is not public-safe: ${forbiddenTerm}`);
}

export function validatePublicCopyEvidence({ proposal, sync, sourceFiles, data }) {
  if (!proposal?.changed) return { claims: [] };
  if (!Array.isArray(proposal.claims)) throw new PublicCopyAbstention('changed proposal must include claim evidence');
  if (!Array.isArray(sourceFiles) || !sourceFiles.length) throw new PublicCopyAbstention('source files are required for claim evidence');

  const expected = new Map();
  if (proposal.summary !== data?.summary) expected.set('summary', proposal.summary);
  if (typeof proposal.bodyAppendix === 'string' && proposal.bodyAppendix.trim()) expected.set('bodyAppendix', proposal.bodyAppendix.trim());
  const claims = proposal.claims.map((claim) => ({
    field: claim?.field,
    text: claim?.text,
    evidencePath: claim?.evidencePath,
    lineStart: claim?.lineStart,
    lineEnd: claim?.lineEnd,
  }));
  if (claims.length !== expected.size || new Set(claims.map(({ field }) => field)).size !== expected.size || !claims.every(({ field }) => expected.has(field))) {
    throw new PublicCopyAbstention('changed proposal requires exactly one claim for each changed public field');
  }

  for (const claim of claims) {
    if (claim.text !== expected.get(claim.field)) throw new PublicCopyAbstention(`${claim.field} claim must match the proposed public copy exactly`);
    if (!sync.paths.includes(claim.evidencePath)) throw new PublicCopyAbstention(`${claim.field} claim must reference an allowlisted source path`);
    const source = sourceFiles.find((file) => file.path === claim.evidencePath);
    const lineCount = source?.text.split('\n').length || 0;
    if (!Number.isInteger(claim.lineStart) || !Number.isInteger(claim.lineEnd) || claim.lineStart < 1 || claim.lineEnd < claim.lineStart || claim.lineEnd > lineCount) {
      throw new PublicCopyAbstention(`${claim.field} claim must reference a valid source line range`);
    }
  }
  return { claims };
}

export function applyProposal({ data, body, proposal, sourceCommit, updatedAt }) {
  if (!proposal || proposal.changed !== true) return { changed: false, data, body };
  let summary;
  try {
    summary = nonEmptyString(proposal.summary, 'summary');
  } catch (error) {
    throw new PublicCopyAbstention(error.message);
  }
  if (typeof proposal.bodyAppendix !== 'string') throw new PublicCopyAbstention('bodyAppendix must be a string');
  const bodyAppendix = proposal.bodyAppendix.trim();
  const publicCopy = validatePublicCopyProfile(data.publicCopy);
  if (summary.length > MAX_SUMMARY_LENGTH) throw new PublicCopyAbstention(`summary exceeds ${MAX_SUMMARY_LENGTH} characters`);
  if (bodyAppendix.length > MAX_BODY_APPENDIX_LENGTH) throw new PublicCopyAbstention(`bodyAppendix exceeds ${MAX_BODY_APPENDIX_LENGTH} characters`);
  if (bodyAppendix.includes('\n\n')) throw new PublicCopyAbstention('bodyAppendix must be a single paragraph');
  assertPublicSafeCopy(summary, bodyAppendix, publicCopy);
  const nextBody = bodyAppendix ? `${body.trim()}\n\n${bodyAppendix}` : body.trim();
  if (summary === data.summary && nextBody === body.trim()) return { changed: false, data, body };

  return {
    changed: true,
    data: {
      ...data,
      summary,
      updatedAt,
      sync: { ...data.sync, lastAppliedCommit: sourceCommit, lastAppliedAt: updatedAt },
    },
    body: nextBody,
  };
}

export function getSyncTargets(workDirectory = process.cwd()) {
  return contentFiles('work')
    .map((filePath) => ({ filePath, ...parseContentFile(filePath) }))
    .filter(({ data }) => data.sync?.enabled === true)
    .map(({ filePath, data, body }) => ({
      filePath,
      data,
      body,
      sync: validateSyncConfig(data.sync, filePath, data.publicCopy),
      autonomousPublicSync: validateAutonomousPublicSyncProfile(data.autonomousPublicSync, filePath),
    }));
}

export function writeProposal(filePath, data, body) {
  writeFileSync(filePath, serializeFrontmatter(data, body));
}

export function readProposalFile(filePath) {
  return parseContentFile(path.resolve(filePath));
}

export function sourceTextFromFiles(files) {
  return files.map(({ path: filePath, text }) => `## ${filePath}\n${text}`).join('\n\n');
}
