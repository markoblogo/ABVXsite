import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { applyProposal, getSyncTargets, validatePublicCopyEvidence, writeProposal } from './project-description-sync-lib.mjs';

const args = new Set(process.argv.slice(2));
const slugIndex = process.argv.indexOf('--slug');
const requestedSlug = slugIndex >= 0 ? process.argv[slugIndex + 1] : undefined;
const dryRun = args.has('--dry-run');
const evidenceDirectoryIndex = process.argv.indexOf('--evidence-dir');
const evidenceDirectory = evidenceDirectoryIndex >= 0 ? process.argv[evidenceDirectoryIndex + 1] : undefined;
const maxSourceChars = 24000;

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
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['changed', 'summary', 'body', 'notes', 'claims'],
    properties: {
      changed: { type: 'boolean' },
      summary: { type: 'string' },
      body: { type: 'string' },
      notes: { type: 'array', items: { type: 'string' } },
      claims: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['field', 'text', 'evidencePath', 'lineStart', 'lineEnd'],
          properties: {
            field: { type: 'string', enum: ['summary', 'body'] },
            text: { type: 'string' },
            evidencePath: { type: 'string' },
            lineStart: { type: 'integer' },
            lineEnd: { type: 'integer' },
          },
        },
      },
    },
  };
  const prompt = [
    'Update ABVX project copy only when the supplied repository documents establish a material, public-facing change.',
    'Never invent features, users, metrics, dates, commercial claims, roadmap, or security claims.',
    'Preserve the project identity and positioning unless the source explicitly changes it.',
    'Return changed=false and the current text exactly when no material change is supported.',
    'When changed=true, write a factual one- or two-sentence summary (max 320 chars) and a single concise public-facing paragraph (max 900 chars).',
    'Never mention protected or internal surfaces, endpoints, environment variables, .env, demo data, seeded or mock data, persistence gaps, prototype-grade status, missing capabilities, or implementation caveats.',
    'When changed=true, return exactly two claims: one for summary and one for body. Each claim.text must equal that full output field exactly and must cite an allowlisted source path plus a directly supporting, valid line range from the numbered source below. Do not quote source text in a claim.',
    'When changed=false, return an empty claims array.',
    `Current summary:\n${target.data.summary}`,
    `Current body:\n${target.body}`,
    `Repository source (${target.sync.repository}@${target.sync.ref}):\n${source}`,
  ].join('\n\n');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      input: prompt,
      text: { format: { type: 'json_schema', name: 'project_copy_proposal', strict: true, schema } },
    }),
  });
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  return JSON.parse(outputText(await response.json()));
}

function writeProposalEvidence(directory, target, sourceCommit, claims) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/${target.data.slug}.json`, `${JSON.stringify({
    schemaVersion: 1,
    kind: 'CortexABVCopyProposal',
    slug: target.data.slug,
    sourceCommit,
    claims,
  }, null, 2)}\n`);
}

export async function run() {
  const targets = getSyncTargets().filter((target) => !requestedSlug || target.data.slug === requestedSlug);
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
      const evidence = validatePublicCopyEvidence({ proposal, sync: target.sync, sourceFiles: source.files });
      const result = applyProposal({
        data: target.data,
        body: target.body,
        proposal,
        sourceCommit: source.commit,
        updatedAt: new Date().toISOString().slice(0, 10),
      });
      if (!result.changed) {
        console.log(`${target.data.slug}: no supported copy change`);
        continue;
      }
      changes += 1;
      console.log(`${target.data.slug}: proposed (${proposal.notes.join('; ') || 'repository docs changed'})`);
      if (evidenceDirectory) writeProposalEvidence(evidenceDirectory, target, source.commit, evidence.claims);
      if (!dryRun) writeProposal(target.filePath, result.data, result.body);
    } catch (error) {
      console.error(`${target.data.slug}: ${error.message}`);
      process.exitCode = 1;
    }
  }
  console.log(`${changes} project description update(s) ${dryRun ? 'proposed' : 'written'}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();
