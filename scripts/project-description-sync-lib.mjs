import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentFiles, parseContentFile, serializeFrontmatter } from './content-lib.mjs';

const MAX_SUMMARY_LENGTH = 500;
const MAX_BODY_LENGTH = 5000;

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

export function applyProposal({ data, body, proposal, sourceCommit, updatedAt }) {
  if (!proposal || proposal.changed !== true) return { changed: false, data, body };
  const summary = nonEmptyString(proposal.summary, 'summary');
  const nextBody = nonEmptyString(proposal.body, 'body');
  if (summary.length > MAX_SUMMARY_LENGTH) throw new Error(`summary exceeds ${MAX_SUMMARY_LENGTH} characters`);
  if (nextBody.length > MAX_BODY_LENGTH) throw new Error(`body exceeds ${MAX_BODY_LENGTH} characters`);
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
