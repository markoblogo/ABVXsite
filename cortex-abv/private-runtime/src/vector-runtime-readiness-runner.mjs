import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildVectorRuntimeIndex, queryVectorRuntimeIndex } from './vector-runtime-shim.mjs';

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

function validateBenchmark(benchmark) {
  if (!benchmark || benchmark.kind !== 'CortexABVVectorRetrievalSyntheticBenchmark' || benchmark.version !== 'v1') {
    throw new Error('benchmark must be CortexABVVectorRetrievalSyntheticBenchmark v1');
  }
  if (!Array.isArray(benchmark.corpus) || benchmark.corpus.length === 0) {
    throw new Error('benchmark.corpus must be a non-empty array');
  }
  if (!Array.isArray(benchmark.probes) || benchmark.probes.length === 0) {
    throw new Error('benchmark.probes must be a non-empty array');
  }
  const evaluation = benchmark.evaluation || {};
  if (!Number.isInteger(evaluation.topK) || evaluation.topK <= 0) {
    throw new Error('benchmark.evaluation.topK must be a positive integer');
  }
  return {
    topK: evaluation.topK,
    minCandidateScore: Number.isFinite(evaluation.minCandidateScore) ? evaluation.minCandidateScore : 0,
    minEvidenceRefsPerCandidate: Number.isInteger(evaluation.minEvidenceRefsPerCandidate) ? evaluation.minEvidenceRefsPerCandidate : 1,
    minRecallAtK: Number.isFinite(evaluation.minRecallAtK) ? evaluation.minRecallAtK : 1,
    k1: Number.isFinite(evaluation.k1) ? evaluation.k1 : 1.5,
    b: Number.isFinite(evaluation.b) ? evaluation.b : 0.75,
  };
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

export function runVectorRuntimeReadiness({ planPath, benchmarkPath, receiptPath, runAt } = {}) {
  if (!existsSync(planPath)) throw new Error(`plan file not found: ${planPath}`);
  if (!existsSync(benchmarkPath)) throw new Error(`benchmark file not found: ${benchmarkPath}`);

  const plan = readJson(planPath);
  const benchmark = readJson(benchmarkPath);
  const evaluation = validateBenchmark(benchmark);
  const builtAt = runAt ? new Date(runAt).toISOString() : new Date().toISOString();

  const index = buildVectorRuntimeIndex({ plan, corpus: benchmark.corpus });
  const probeResults = [];
  const claimEvidence = [];
  const missingEvidence = [];

  let totalExpected = 0;
  let totalMatched = 0;

  for (const probe of benchmark.probes) {
    const expectedCorpusIds = uniqueSorted(probe.expectedCorpusIds || []);
    if (expectedCorpusIds.length === 0) throw new Error(`probe ${probe.probeId} must have expectedCorpusIds`);

    const candidates = queryVectorRuntimeIndex({
      index,
      query: probe.query,
      topK: evaluation.topK,
      minCandidateScore: evaluation.minCandidateScore,
      k1: evaluation.k1,
      b: evaluation.b,
    });
    const matchedExpected = expectedCorpusIds.filter((id) => candidates.some((candidate) => candidate.id === id));
    const recallAtK = expectedCorpusIds.length === 0 ? 1 : matchedExpected.length / expectedCorpusIds.length;
    const minRecallAtK = Number.isFinite(probe.minRecallAtK) ? probe.minRecallAtK : evaluation.minRecallAtK;

    for (const candidate of candidates) {
      const evidenceRefs = candidate.evidenceRefs || [];
      if (evidenceRefs.length < evaluation.minEvidenceRefsPerCandidate) {
        missingEvidence.push({
          probeId: probe.probeId,
          corpusId: candidate.id,
          reason: 'missing_runtime_candidate_claim_evidence',
          requiredMinEvidenceRefsPerCandidate: evaluation.minEvidenceRefsPerCandidate,
          actualEvidenceRefs: evidenceRefs.length,
        });
      }
      claimEvidence.push({
        probeId: probe.probeId,
        corpusId: candidate.id,
        matchedTerms: candidate.matchedTerms,
        score: Number(candidate.score.toFixed(4)),
        evidenceRefs,
        retrievalRole: expectedCorpusIds.includes(candidate.id) ? 'expected' : 'distractor',
      });
    }

    totalExpected += expectedCorpusIds.length;
    totalMatched += matchedExpected.length;
    probeResults.push({
      probeId: probe.probeId,
      query: probe.query,
      expectedCorpusIds,
      candidateIds: candidates.map((candidate) => candidate.id),
      matchedExpected,
      recallAtK: Number(recallAtK.toFixed(4)),
      minRecallAtK,
      status: candidates.length > 0 && recallAtK >= minRecallAtK ? 'passed' : 'blocked',
    });
  }

  const recallAtK = totalExpected === 0 ? 1 : Number((totalMatched / totalExpected).toFixed(4));
  const passed = probeResults.every((probe) => probe.status === 'passed') && missingEvidence.length === 0 && recallAtK >= evaluation.minRecallAtK;
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeReadinessReceipt',
    version: 'v1',
    authority: 'plan_only',
    status: passed ? 'passed' : 'blocked',
    runAt: builtAt,
    mode: 'synthetic_runtime_readiness',
    engine: plan.engine,
    sourcePilotPlan: path.basename(planPath),
    decisionTrace: {
      policySource: 'base',
      sourceKind: 'synthetic_benchmark',
      sourceId: 'vector-runtime-readiness-turbovec-shim',
      reason: 'Synthetic buildIndex/query shim readiness with ANN intent and deterministic tf-idf fallback',
      index: index.decisionTrace,
      safety: {
        networkCalls: false,
        llmCalls: false,
        writes: false,
        publicActionAuthority: false,
      },
      claimEvidence,
      missingEvidence,
    },
    metrics: {
      corpusSize: benchmark.corpus.length,
      documentCount: index.documentCount,
      probeCount: benchmark.probes.length,
      recallAtK,
      minRecallAtK: evaluation.minRecallAtK,
      passedAllProbes: probeResults.every((probe) => probe.status === 'passed'),
      evidenceCoverage: claimEvidence.length === 0 ? 0 : Number(((claimEvidence.length - missingEvidence.length) / claimEvidence.length).toFixed(4)),
    },
    results: probeResults,
    review: {
      pendingReview: passed,
      requiredFields: [
        'decisionTrace.index',
        'decisionTrace.claimEvidence',
        'decisionTrace.missingEvidence',
        'metrics.recallAtK',
      ],
      approvalMeaning: 'Approve only as readiness to wire a bounded local vector runtime dependency later; not approval to expose retrieval, endpoint, writes, or public actions.',
    },
    outputIntegrity: {
      corpusDigest: sha256(benchmark.corpus),
      benchmark: path.basename(benchmarkPath),
      runSchemaDigest: sha256(benchmark.evaluation || {}),
    },
  };

  if (receiptPath) {
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  }

  return receipt;
}

export function run() {
  const planPath = option('--plan')
    || path.resolve(process.cwd(), 'config/vector-retrieval-turbovec-pilot.v1.json');
  const benchmarkPath = option('--benchmark')
    || path.resolve(process.cwd(), 'examples/synthetic-vector-retrieval-benchmark.v1.json');
  const receiptPath = option('--receipt')
    || path.resolve(process.cwd(), 'receipts/vector-runtime-readiness-receipt.v1.json');
  const receipt = runVectorRuntimeReadiness({
    planPath,
    benchmarkPath,
    receiptPath,
    runAt: option('--run-at'),
  });

  console.log(`Vector runtime readiness run complete: status=${receipt.status}, recallAtK=${receipt.metrics.recallAtK}, fallbackApplied=${receipt.decisionTrace.index.fallbackApplied}`);
  console.log(`Receipt written: ${path.relative(process.cwd(), receiptPath)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime readiness run failed: ${error.message}`);
    process.exitCode = 1;
  }
}
