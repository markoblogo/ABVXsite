import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function sha256OfFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return createHash('sha256').update(content).digest('hex');
}

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function compareEvidence(previous = [], next = []) {
  if (!Array.isArray(previous) || !Array.isArray(next) || previous.length !== next.length) return false;
  const previousMap = new Map(previous.map((item) => [item.path, item.sha256]));
  for (const item of next) {
    if (!previousMap.has(item.path) || previousMap.get(item.path) !== item.sha256) return false;
  }
  return true;
}

export function run() {
  const contractPath = option('--contract')
    || path.join(root, 'cortex-abv', 'private-runtime', 'config', 'cabinet-scheduled-jobs-stage1.v1.json');
  const presenceIndexPath = option('--presence-index')
    || path.join(root, 'cortex-abv', 'public-presence-index.v1.json');
  const registryPath = option('--registry')
    || path.join(root, 'cortex-abv', 'public-project-registry.v1.json');
  const outputPath = option('--output')
    || path.join(root, 'cortex-abv', 'private-runtime', 'receipts', 'cabinet-stage1-scheduled-jobs-receipt.v1.json');

  if (!existsSync(contractPath)) throw new Error(`contract not found: ${contractPath}`);
  if (!existsSync(presenceIndexPath)) throw new Error(`presence index not found: ${presenceIndexPath}`);
  if (!existsSync(registryPath)) throw new Error(`project registry not found: ${registryPath}`);

  const contract = readJson(contractPath);
  if (contract.schemaVersion !== 1 || contract.kind !== 'CortexABVCabinetScheduledJobsPlan') {
    throw new Error('invalid Cabinet scheduled jobs plan contract');
  }

  const createdAt = option('--created-at') || new Date().toISOString();
  const previousReceipt = existsSync(outputPath) ? readJson(outputPath) : null;
  const previousByJob = new Map((previousReceipt?.results || []).map((result) => [result.jobId, result]));

  const presenceDigest = sha256OfFile(presenceIndexPath);
  const registryDigest = sha256OfFile(registryPath);

  const results = [];
  let pending = false;

  for (const job of contract.jobs) {
    const result = {
      jobId: nonEmptyString(job.jobId, 'job.jobId'),
      title: nonEmptyString(job.title, 'job.title'),
      status: 'blocked',
      evidence: [],
      decisionTrace: {
        policySource: contract?.decisionTrace?.policySource || 'base',
        sourceKind: null,
        sourceId: null,
        reason: nonEmptyString(
          contract?.decisionTrace?.reason,
          'contract.decisionTrace.reason',
        ),
        failure: null,
      },
    };

    try {
      for (const source of job.sources || []) {
        const sourcePath = path.join(root, source.path);
        if (!existsSync(sourcePath)) {
          throw new Error(`artifact missing: ${source.path}`);
        }
        if (source.kind !== 'artifact') {
          throw new Error(`unsupported source kind ${source.kind}`);
        }
        const sha256 = sha256OfFile(sourcePath);
        result.evidence.push({ kind: source.kind, path: source.path, sha256, checkedAt: createdAt });
      }

      const expectedEvidence = [
        { path: 'cortex-abv/public-presence-index.v1.json', sha256: presenceDigest },
        { path: 'cortex-abv/public-project-registry.v1.json', sha256: registryDigest },
      ];
      const previousEvidence = previousByJob.get(job.jobId)?.evidence || [];

      const evidenceMatchesPrevious = compareEvidence(previousEvidence, expectedEvidence);
      result.status = evidenceMatchesPrevious ? 'no_changes' : 'pending_review';
      result.evidence = expectedEvidence;
      if (result.status !== 'no_changes') pending = true;
      result.decisionTrace.basePolicy = {
        allowedPatchFields: [
          'summary',
          'bodyAppendix',
          'updatedAt',
          'sync.lastAppliedCommit',
          'sync.lastAppliedAt',
        ],
      };
      if (evidenceMatchesPrevious) {
        result.decisionTrace.notes = 'artifact digests match previous baseline; no public surface actions proposed';
      } else {
        result.decisionTrace.notes = 'artifact digests changed; proposal review required';
      }
    } catch (error) {
      result.decisionTrace.failure = String(error.message || 'unknown runner failure');
      result.status = 'blocked';
      pending = true;
      result.evidence = [];
    }

    results.push(result);
  }

  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVCabinetStage1Receipt',
    module: contract.module,
    stage: 1,
    status: 'implemented',
    authority: 'proposal',
    reviewStatus: pending ? 'pending_review' : 'no_changes',
    createdAt,
    runMode: 'local_synthetic_read_only',
    contractPath: path.relative(root, contractPath),
    decisionTrace: {
      policySource: 'base',
      reason: 'Real local synthetic run against versioned public artifacts; no network/endpoint actions',
      sourceKind: null,
      sourceId: null,
      basePolicy: {
        allowedPatchFields: [
          'summary',
          'bodyAppendix',
          'updatedAt',
          'sync.lastAppliedCommit',
          'sync.lastAppliedAt',
        ],
      },
      sourceOverride: null,
    },
    results,
    requiredReviewActions: {
      approve: {
        status: 'required',
        notes: 'Approve only after confirming checks match governance and no write intent was introduced.',
      },
      reject: {
        status: 'required',
        notes: 'Reject on any job failure, missing artifact, or unexpected write-path attempt.',
      },
    },
    retry: {
      maxAttempts: jobRetryLimit(contract),
      nextAttemptPolicy: 'retry_on_manual_review_with_retry_note',
      nextAttempt: null,
    },
    sourceDigest: {
      presenceIndexSha256: presenceDigest,
      projectRegistrySha256: registryDigest,
    },
  };

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(`Cabinet Stage1 synthetic runner completed. reviewStatus=${receipt.reviewStatus}`);
}

function jobRetryLimit(contract) {
  const jobs = Array.isArray(contract.jobs) ? contract.jobs : [];
  if (!jobs.length) return 1;
  const limits = jobs
    .map((job) => Number(job?.retryPolicy?.maxAttempts))
    .filter((item) => Number.isInteger(item) && item > 0);
  return limits.length ? Math.max(...limits) : 3;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Cabinet Stage1 synthetic run failed: ${error.message}`);
    process.exitCode = 1;
  }
}
