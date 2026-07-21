import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const STOP_WORDS = new Set(['the', 'and', 'of', 'a', 'an', 'to', 'in', 'for', 'on', 'with', 'is', 'are', 'was', 'were', 'this', 'that', 'about']);

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value.trim();
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

function validatePlan(plan) {
  if (!plan || plan.schemaVersion !== 1 || plan.kind !== 'CortexABVVectorRetrievalPilotPlan' || plan.version !== 'v1') {
    throw new Error('vector retrieval plan must be CortexABVVectorRetrievalPilotPlan v1');
  }
  if (plan.runtimeIntegration !== false) {
    throw new Error('plan must keep runtimeIntegration=false');
  }
  if (plan.externalSideEffects !== false) {
    throw new Error('plan must keep externalSideEffects=false');
  }
  const controls = plan.safetyControls || {};
  if (controls.networkCalls || controls.llmCalls || controls.writes || controls.publicActionAuthority) {
    throw new Error('plan safety controls must keep networkCalls/llmCalls/writes/publicActionAuthority false');
  }
}

function validateCorpus(document) {
  if (!document || typeof document.id !== 'string' || !document.id.trim()) {
    throw new Error('corpus item must have id');
  }
  if (!document.text || typeof document.text !== 'string' || !document.text.trim()) {
    throw new Error(`corpus item ${document.id} must have text`);
  }
  if (!Array.isArray(document.evidenceRefs) || !document.evidenceRefs.length) {
    throw new Error(`corpus item ${document.id} must have evidenceRefs`);
  }
}

function validateProbe(probe) {
  if (!probe || typeof probe.probeId !== 'string' || !probe.probeId.trim()) {
    throw new Error('probe must have probeId');
  }
  if (!probe.query || typeof probe.query !== 'string' || !probe.query.trim()) {
    throw new Error(`probe ${probe.probeId} must have query`);
  }
  if (!Array.isArray(probe.expectedCorpusIds) || probe.expectedCorpusIds.length === 0) {
    throw new Error(`probe ${probe.probeId} must have expectedCorpusIds`);
  }
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .trim();
}

function tokenize(value) {
  const tokens = normalizeText(value).split(/\s+/).filter(Boolean);
  return [...new Set(tokens.filter((token) => token.length > 2 && !STOP_WORDS.has(token)))].sort();
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function validateBenchmark(benchmark) {
  if (!benchmark || benchmark.schemaVersion !== 1 || benchmark.kind !== 'CortexABVVectorRetrievalSyntheticBenchmark' || benchmark.version !== 'v1') {
    throw new Error('benchmark must be CortexABVVectorRetrievalSyntheticBenchmark v1');
  }
  if (!Array.isArray(benchmark.corpus) || benchmark.corpus.length === 0) throw new Error('benchmark.corpus must be a non-empty array');
  if (!Array.isArray(benchmark.probes) || benchmark.probes.length === 0) throw new Error('benchmark.probes must be a non-empty array');
  benchmark.corpus.forEach(validateCorpus);
  benchmark.probes.forEach(validateProbe);

  const evalCfg = benchmark.evaluation || {};
  if (typeof evalCfg.topK !== 'number' || !Number.isInteger(evalCfg.topK) || evalCfg.topK <= 0) {
    throw new Error('benchmark.evaluation.topK must be a positive integer');
  }
  if (typeof evalCfg.minRecallAtK !== 'number' || evalCfg.minRecallAtK < 0 || evalCfg.minRecallAtK > 1) {
    throw new Error('benchmark.evaluation.minRecallAtK must be in [0,1]');
  }
  return {
    topK: evalCfg.topK,
    minRecallAtK: evalCfg.minRecallAtK,
    minScoreFloor: typeof evalCfg.minScoreFloor === 'number' ? evalCfg.minScoreFloor : 0,
    maxRunMs: typeof evalCfg.maxRunMs === 'number' ? evalCfg.maxRunMs : 2000,
  };
}

function scoreCandidate(queryTokens, docTokens) {
  const overlap = queryTokens.filter((token) => docTokens.includes(token));
  const score = queryTokens.length === 0 ? 0 : overlap.length / queryTokens.length;
  return { score, overlap: uniqueSorted(overlap) };
}

function ensureResultIds(results, allowedIds) {
  for (const id of allowedIds) {
    if (!results.has(id)) {
      throw new Error(`expected corpus id not present in fixture corpus: ${id}`);
    }
  }
}

export function runVectorRetrievalShadow({ planPath, benchmarkPath, receiptPath, runAt }) {
  if (!existsSync(planPath)) throw new Error(`plan file not found: ${planPath}`);
  if (!existsSync(benchmarkPath)) throw new Error(`benchmark file not found: ${benchmarkPath}`);

  const plan = readJson(planPath);
  validatePlan(plan);
  const benchmark = readJson(benchmarkPath);
  const evalConfig = validateBenchmark(benchmark);

  const corpus = benchmark.corpus.map((document) => ({
    ...document,
    terms: tokenize(document.text),
  }));
  const corpusIndex = new Set(corpus.map((document) => document.id));

  const runAtValue = runAt ? nonEmptyString(runAt, 'runAt') : new Date().toISOString();
  const createdAt = new Date(runAtValue).toISOString();
  const maxRunMs = Number.isInteger(evalConfig.maxRunMs) ? evalConfig.maxRunMs : 2000;

  const startedAt = Date.now();
  const results = [];
  const decisionTraceEvidence = [];
  let totalExpected = 0;
  let totalMatched = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  for (const probe of benchmark.probes) {
    const expectedIds = uniqueSorted(probe.expectedCorpusIds);
    ensureResultIds(corpusIndex, expectedIds);

    const queryTokens = tokenize(nonEmptyString(probe.query, `probe:${probe.probeId}.query`));
    if (!queryTokens.length) throw new Error(`probe ${probe.probeId} query has no indexable tokens`);

    const scored = corpus
      .map((doc) => {
        const { score, overlap } = scoreCandidate(queryTokens, doc.terms);
        return { id: doc.id, score, overlap, evidenceRefs: doc.evidenceRefs || [] };
      })
      .filter((item) => item.score >= evalConfig.minScoreFloor)
      .sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id));

    const topK = scored.slice(0, evalConfig.topK);
    const retrievedIds = topK.map((entry) => entry.id);
    const matchedExpected = expectedIds.filter((id) => retrievedIds.includes(id));

    scoreSum += topK.reduce((sum, current) => sum + current.score, 0);
    scoreCount += topK.length;

    totalExpected += expectedIds.length;
    totalMatched += matchedExpected.length;

    const recallAtK = expectedIds.length === 0 ? 1 : matchedExpected.length / expectedIds.length;
    const probeResult = {
      probeId: nonEmptyString(probe.probeId, 'probe.probeId'),
      query: nonEmptyString(probe.query, 'probe.query'),
      topK: evalConfig.topK,
      expectedCorpusIds: expectedIds,
      topCandidates: topK.map((entry) => ({
        id: entry.id,
        score: Number(entry.score.toFixed(4)),
        matchedTerms: entry.overlap,
      })),
      matchedExpected,
      recallAtK: Number(recallAtK.toFixed(4)),
      minRecallAtK: typeof probe.minRecallAtK === 'number' ? probe.minRecallAtK : evalConfig.minRecallAtK,
      status: recallAtK >= (typeof probe.minRecallAtK === 'number' ? probe.minRecallAtK : evalConfig.minRecallAtK) ? 'passed' : 'failed',
    };

    for (const entry of topK) {
      decisionTraceEvidence.push({
        probeId: probe.probeId,
        corpusId: entry.id,
        matchedTerms: entry.overlap,
        score: Number(entry.score.toFixed(4)),
        evidenceRefs: entry.evidenceRefs,
        retrievalRole: expectedIds.includes(entry.id) ? 'expected' : 'distractor',
      });
    }

    results.push(probeResult);
  }

  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs > maxRunMs) {
    throw new Error(`synthetic run exceeded maxRunMs: ${elapsedMs} > ${maxRunMs}`);
  }

  const recallAtK = totalExpected === 0 ? 1 : Number((totalMatched / totalExpected).toFixed(4));
  const avgTopScore = scoreCount === 0 ? 0 : Number((scoreSum / scoreCount).toFixed(4));
  const status = recallAtK >= evalConfig.minRecallAtK ? 'passed' : 'blocked';

  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRetrievalShadowReceipt',
    version: 'v1',
    authority: 'plan_only',
    status,
    runAt: createdAt,
    mode: 'synthetic_shadow',
    runMode: plan?.evaluation?.runMode || 'synthetic_local_only',
    engine: plan.engine,
    sourcePilotPlan: path.basename(planPath),
    decisionTrace: {
      policySource: 'base',
      sourceKind: 'synthetic_benchmark',
      sourceId: 'vector-retrieval-turbovec-stage-2',
      reason: 'Synthetic shadow retrieval run over read-only fixture corpus with fixed evidence anchors',
      topK: evalConfig.topK,
      minScoreFloor: evalConfig.minScoreFloor,
      safety: {
        networkCalls: false,
        llmCalls: false,
        writes: false,
        publicActionAuthority: false,
      },
      claimEvidence: decisionTraceEvidence,
    },
    metrics: {
      corpusSize: corpus.length,
      probeCount: results.length,
      expectedAnchorCount: totalExpected,
      matchedAtK: totalMatched,
      recallAtK,
      avgTopScore,
      maxRunMs,
      elapsedMs,
      passedAllProbes: results.every((result) => result.status === 'passed'),
    },
    results,
    review: {
      pendingReview: status !== 'passed',
      requiredActions: {
        approve: {
          status: status === 'passed' ? 'optional' : 'required',
          reason: status === 'passed' ? 'shadow-only run is within synthetic recall target' : 'recall target not met',
        },
        reject: {
          status: 'required',
          reason: status !== 'passed' ? 'fails recall/score threshold or benchmark invariant' : 'only if governance review blocks deployment',
        },
      },
      requiredFields: ['metrics.recallAtK', 'decisionTrace.claimEvidence'],
    },
    outputIntegrity: {
      corpusDigest: sha256(benchmark.corpus),
      benchmark: path.basename(benchmarkPath),
      runSchemaDigest: sha256(benchmark.evaluation),
    },
  };

  if (receiptPath) {
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  }

  return receipt;
}

export function run() {
  const planPath = option('--plan')
    || path.resolve(process.cwd(), 'cortex-abv/private-runtime/config/vector-retrieval-turbovec-pilot.v1.json');
  const benchmarkPath = option('--benchmark')
    || path.resolve(process.cwd(), 'cortex-abv/private-runtime/examples/synthetic-vector-retrieval-benchmark.v1.json');
  const receiptPath = option('--receipt')
    || path.resolve(process.cwd(), 'cortex-abv/private-runtime/receipts/vector-retrieval-turbovec-shadow-receipt.v1.json');

  const receipt = runVectorRetrievalShadow({
    planPath,
    benchmarkPath,
    receiptPath,
    runAt: option('--run-at'),
  });

  console.log(`Vector shadow retrieval synthetic run complete: status=${receipt.status}, recallAtK=${receipt.metrics.recallAtK}`);
  if (receiptPath) {
    console.log(`Receipt written: ${path.relative(process.cwd(), receiptPath)}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector retrieval shadow run failed: ${error.message}`);
    process.exitCode = 1;
  }
}
