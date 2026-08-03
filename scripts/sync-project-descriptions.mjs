import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadAuthorOsProfile, resolveAuthorOsDomain } from '../cortex-abv/author_os/runtime-loader.mjs';
import { buildIdFactualContext } from '../cortex-abv/author_os/id-evidence-adapter.mjs';
import { PublicCopyAbstention, applyProposal, getSyncTargets, validatePublicCopyEvidence, writeProposal } from './project-description-sync-lib.mjs';

const args = new Set(process.argv.slice(2));
const slugIndex = process.argv.indexOf('--slug');
const requestedSlug = slugIndex >= 0 ? process.argv[slugIndex + 1] : undefined;
const dryRun = args.has('--dry-run');
const autonomousOnly = args.has('--autonomous-only');
const evidenceDirectoryIndex = process.argv.indexOf('--evidence-dir');
const evidenceDirectory = evidenceDirectoryIndex >= 0 ? process.argv[evidenceDirectoryIndex + 1] : undefined;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const authorOsRoot = path.resolve(scriptDir, '..', 'cortex-abv', 'author_os');
const maxSourceChars = 24000;

const AUTHOR_OS_DEFAULT_DOMAIN = 'general';

function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveIdEvidenceInput(target) {
  const data = target?.data || {};
  return (
    data.idEvidence
    || data.authorOsIdEvidence
    || data.idEvidenceContext
    || target?.autonomousPublicSync?.idEvidence
    || null
  );
}

function resolveAuthorOsConfig(target) {
  const explicitDomain = normalizeOptionalString(target?.data?.authorOs?.domain)
    || normalizeOptionalString(target?.autonomousPublicSync?.authorOsDomain)
    || normalizeOptionalString(process.env.AUTHOR_OS_DOMAIN)
    || AUTHOR_OS_DEFAULT_DOMAIN;

  const manifest = loadAuthorOsProfile({ authorOsRoot }).manifest;
  const domain = resolveAuthorOsDomain(explicitDomain, manifest);
  const taskInstructions = normalizeOptionalString(target?.autonomousPublicSync?.authorOsTaskInstructions)
    || normalizeOptionalString(target?.data?.autonomousPublicSync?.authorOsTaskInstructions);
  const projectContext = normalizeOptionalString(target?.autonomousPublicSync?.authorOsProjectContext)
    || normalizeOptionalString(target?.data?.autonomousPublicSync?.authorOsProjectContext);
  const idEvidenceRaw = resolveIdEvidenceInput(target);

  return {
    domain,
    taskInstructions,
    projectContext,
    idFactualContext: buildIdFactualContext(idEvidenceRaw),
  };
}

export function buildProjectContextText(target) {
  if (!target?.data) return '';
  const { data } = target;
  const lines = [
    `Project slug: ${normalizeOptionalString(data.slug) || 'unknown'}`,
    `Project type: ${normalizeOptionalString(data.type) || 'unknown'}`,
    `Current summary: ${normalizeOptionalString(data.summary) || '(no summary)'}`,
    `Primary section: ${normalizeOptionalString(data.primarySection) || '(none)'}`,
    `Homepage eligible: ${String(Boolean(data.homepageEligible))}`,
  ].filter(Boolean);

  if (Array.isArray(data.tags) && data.tags.length) lines.push(`Public tags: ${data.tags.slice(0, 8).join(', ')}`);
  if (Array.isArray(data.appearsIn) && data.appearsIn.length) lines.push(`Audience sections: ${data.appearsIn.join(', ')}`);

  const allowedThemes = data.publicCopy?.allowedThemes;
  if (Array.isArray(allowedThemes) && allowedThemes.length) lines.push(`Allowed themes: ${allowedThemes.join('; ')}`);

  const forbiddenTerms = data.publicCopy?.forbiddenTerms;
  if (Array.isArray(forbiddenTerms) && forbiddenTerms.length) lines.push(`Forbidden terms: ${forbiddenTerms.join('; ')}`);

  return lines.join('\n');
}

function buildProposalTaskInstructions(target, taskContext) {
  const policy = target?.sync?.publicCopy;
  const allowedThemes = Array.isArray(policy?.allowedThemes) && policy.allowedThemes.length
    ? policy.allowedThemes.join('; ')
    : '(not configured)';
  const forbidden = Array.isArray(policy?.forbiddenTerms) && policy.forbiddenTerms.length
    ? policy.forbiddenTerms.join('; ')
    : '(not configured)';

  return [
    'Update ABVX project copy only when the supplied repository documents establish a material, public-facing change.',
    'Never invent features, users, metrics, dates, commercial claims, roadmap, or security claims.',
    'Preserve the project identity and positioning unless the source explicitly changes it.',
    'Return changed=false and the current text exactly when no material change is supported.',
    'When changed=true, write a factual one- or two-sentence summary (max 320 chars) and an optional single public-facing body appendix (max 450 chars).',
    'The existing body is an approved public baseline: never rewrite, delete, reorder, or restate it. Return only the new bodyAppendix; use an empty string when no addition is needed.',
    `Allowed public themes for this project: ${allowedThemes}. Do not introduce any other theme.`,
    `Project-specific forbidden terms: ${forbidden}.`,
    'Never mention protected or internal surfaces, endpoints, environment variables, .env, demo data, seeded or mock data, persistence gaps, prototype-grade status, missing capabilities, or implementation caveats.',
    'When changed=true, return exactly one claim for each field that changed: summary and/or bodyAppendix. Each claim.text must equal that full output field exactly and must cite an allowlisted source path plus a directly supporting, valid line range from the numbered source below. Do not quote source text in a claim.',
    'When changed=false, return an empty claims array.',
    taskContext ? `Current task constraint: ${taskContext}` : null,
  ].filter(Boolean).join('\n\n');
}

export function buildProposalPrompt({ target, source, projectContext, taskInstructions }) {
  const resolvedContext = normalizeOptionalString(projectContext)
    || buildProjectContextText(target);
  const resolvedTaskInstructions = normalizeOptionalString(taskInstructions)
    || `Update ABVX project copy for ${target?.data?.slug || 'this project'} from repository evidence.`;
  const taskConstraint = buildProposalTaskInstructions(target, resolvedTaskInstructions);
  const authorOsConfig = resolveAuthorOsConfig(target);
  const authorOs = loadAuthorOsProfile({
    domain: authorOsConfig.domain,
    authorOsRoot,
    projectContext: resolvedContext,
    taskInstructions: resolvedTaskInstructions,
    idFactualContext: authorOsConfig.idFactualContext,
  });

  return {
    prompt: [
      authorOs.prompt,
      taskConstraint,
      `Current summary:\n${target.data.summary}`,
      `Current body:\n${target.body}`,
      `Repository source (${target.sync.repository}@${target.sync.ref}):\n${source}`,
    ].filter(Boolean).join('\n\n').trim(),
    trace: authorOs.trace,
  };
}

function githubHeaders() {
  const token = process.env.SOURCE_REPOS_TOKEN || process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'abvx-project-description-sync',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubJson(url) {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${url}`);
  return response.json();
}

async function readRepositorySources(sync) {
  const base = `https://api.github.com/repos/${sync.repository}`;
  const commit = await githubJson(`${base}/commits/${encodeURIComponent(sync.ref)}`);
  const files = [];
  for (const sourcePath of sync.paths) {
    const entry = await githubJson(`${base}/contents/${sourcePath.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(sync.ref)}`);
    if (entry.type !== 'file' || typeof entry.content !== 'string') throw new Error(`${sync.repository}:${sourcePath} is not a text file`);
    files.push({ path: sourcePath, text: Buffer.from(entry.content.replace(/\n/g, ''), 'base64').toString('utf8') });
  }
  const source = files.map(({ path: sourcePath, text }) => {
    const numbered = text.split('\n').map((line, index) => `${index + 1}: ${line}`).join('\n');
    return `## ${sourcePath}\n${numbered}`;
  }).join('\n\n').slice(0, maxSourceChars);
  return { commit: commit.sha, files, source };
}

function outputText(response) {
  if (typeof response.output_text === 'string') return response.output_text;
  const text = response.output?.flatMap((item) => item.content || []).find((item) => typeof item.text === 'string')?.text;
  if (text) return text;
  throw new Error('OpenAI response contains no text output');
}

async function createProposal(target, source) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');

  const resolvedAuthorOsConfig = resolveAuthorOsConfig(target);
  const assembled = buildProposalPrompt({
    target,
    source,
    projectContext: resolvedAuthorOsConfig.projectContext,
    taskInstructions: resolvedAuthorOsConfig.taskInstructions,
  });

  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['changed', 'summary', 'bodyAppendix', 'notes', 'claims'],
    properties: {
      changed: { type: 'boolean' },
      summary: { type: 'string' },
      bodyAppendix: { type: 'string' },
      notes: { type: 'array', items: { type: 'string' } },
      authorOsTrace: { type: 'object', additionalProperties: true },
      claims: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['field', 'text', 'evidencePath', 'lineStart', 'lineEnd'],
          properties: {
            field: { type: 'string', enum: ['summary', 'bodyAppendix'] },
            text: { type: 'string' },
            evidencePath: { type: 'string' },
            lineStart: { type: 'integer' },
            lineEnd: { type: 'integer' },
          },
        },
      },
    },
  };
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      input: assembled.prompt,
      text: { format: { type: 'json_schema', name: 'project_copy_proposal', strict: true, schema } },
    }),
  });
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  const proposal = JSON.parse(outputText(await response.json()));
  if (proposal && typeof proposal === 'object') {
    proposal.authorOsTrace = assembled.trace;
  }
  return proposal;
}

function writeProposalEvidence(directory, target, sourceCommit, claims, authorOsTrace) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/${target.data.slug}.json`, `${JSON.stringify({
    schemaVersion: 1,
    kind: 'CortexABVCopyProposal',
    slug: target.data.slug,
    sourceCommit,
    ...(authorOsTrace ? { authorOsTrace } : {}),
    claims,
  }, null, 2)}\n`);
}

export async function run() {
  const targets = getSyncTargets().filter((target) => (!requestedSlug || target.data.slug === requestedSlug)
    && (!autonomousOnly || target.autonomousPublicSync?.enabled === true));
  if (requestedSlug && !targets.length) throw new Error(`No enabled sync target for slug: ${requestedSlug}`);
  if (!targets.length) {
    console.log('No enabled project-description sync targets.');
    return;
  }
  let changes = 0;
  for (const target of targets) {
    try {
      const source = await readRepositorySources(target.sync);
      const proposal = await createProposal(target, source.source);
      let evidence;
      let result;
      try {
        evidence = validatePublicCopyEvidence({ proposal, sync: target.sync, sourceFiles: source.files, data: target.data });
        result = applyProposal({
          data: target.data,
          body: target.body,
          proposal,
          sourceCommit: source.commit,
          updatedAt: new Date().toISOString().slice(0, 10),
        });
      } catch (error) {
        if (error instanceof PublicCopyAbstention) {
          console.log(`${target.data.slug}: abstained (${error.message})`);
          continue;
        }
        throw error;
      }
      if (!result.changed) {
        console.log(`${target.data.slug}: no supported copy change`);
        continue;
      }
      changes += 1;
      console.log(`${target.data.slug}: proposed (${proposal.notes.join('; ') || 'repository docs changed'})`);
      if (evidenceDirectory) writeProposalEvidence(
        evidenceDirectory,
        target,
        source.commit,
        evidence.claims,
        proposal.authorOsTrace,
      );
      if (!dryRun) writeProposal(target.filePath, result.data, result.body);
    } catch (error) {
      console.error(`${target.data.slug}: ${error.message}`);
      process.exitCode = 1;
    }
  }
  console.log(`${changes} project description update(s) ${dryRun ? 'proposed' : 'written'}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();
