import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentFiles, parseContentFile, serializeFrontmatter } from './content-lib.mjs';

const MAX_SUMMARY_LENGTH = 320;
const MAX_BODY_LENGTH = 900;
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

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

export function validateSyncConfig(sync, filePath = 'content item') {
  if (!sync || sync.enabled !== true) return null;
  if (typeof sync.repository !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(sync.repository)) {
    throw new Error(`${filePath}: sync.repository must be owner/repository`);
  }
  if (!Array.isArray(sync.paths) || !sync.paths.length || !sync.paths.every((item) => typeof item === 'string' && item.trim())) {
    throw new Error(`${filePath}: sync.paths must contain at least one file path`);
  }
  return { repository: sync.repository, ref: typeof sync.ref === 'string' ? sync.ref : 'main', paths: sync.paths };
}

export function assertPublicSafeCopy(summary, body) {
  const copy = `${summary}\n${body}`;
  const denial = PUBLIC_COPY_DENIALS.find((pattern) => pattern.test(copy));
  if (denial) throw new Error(`generated copy is not public-safe: ${denial.source.replace(/\\b|\\\?|\\(|\\)/g, '')}`);
}

export function validatePublicCopyEvidence({ proposal, sync, sourceFiles }) {
  if (!proposal?.changed) return { claims: [] };
  if (!Array.isArray(proposal.claims)) throw new Error('changed proposal must include claim evidence');
  if (!Array.isArray(sourceFiles) || !sourceFiles.length) throw new Error('source files are required for claim evidence');

  const expected = new Map([['summary', proposal.summary], ['body', proposal.body]]);
  const claims = proposal.claims.map((claim) => ({
    field: claim?.field,
    text: claim?.text,
    evidencePath: claim?.evidencePath,
    lineStart: claim?.lineStart,
    lineEnd: claim?.lineEnd,
  }));
  if (claims.length !== 2 || new Set(claims.map(({ field }) => field)).size !== 2 || !claims.every(({ field }) => expected.has(field))) {
    throw new Error('changed proposal requires exactly one summary and body claim');
  }

  for (const claim of claims) {
    if (claim.text !== expected.get(claim.field)) throw new Error(`${claim.field} claim must match the proposed public copy exactly`);
    if (!sync.paths.includes(claim.evidencePath)) throw new Error(`${claim.field} claim must reference an allowlisted source path`);
    const source = sourceFiles.find((file) => file.path === claim.evidencePath);
    const lineCount = source?.text.split('\n').length || 0;
    if (!Number.isInteger(claim.lineStart) || !Number.isInteger(claim.lineEnd) || claim.lineStart < 1 || claim.lineEnd < claim.lineStart || claim.lineEnd > lineCount) {
      throw new Error(`${claim.field} claim must reference a valid source line range`);
    }
  }
  return { claims };
}

export function applyProposal({ data, body, proposal, sourceCommit, updatedAt }) {
  if (!proposal || proposal.changed !== true) return { changed: false, data, body };
  const summary = nonEmptyString(proposal.summary, 'summary');
  const nextBody = nonEmptyString(proposal.body, 'body');
  if (summary.length > MAX_SUMMARY_LENGTH) throw new Error(`summary exceeds ${MAX_SUMMARY_LENGTH} characters`);
  if (nextBody.length > MAX_BODY_LENGTH) throw new Error(`body exceeds ${MAX_BODY_LENGTH} characters`);
  assertPublicSafeCopy(summary, nextBody);
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
    .map(({ filePath, data, body }) => ({ filePath, data, body, sync: validateSyncConfig(data.sync, filePath) }));
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
