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
  return normalizeText(value).split(/\s+/).filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function tokenCounts(text) {
  const counts = new Map();
  const tokens = tokenize(text);
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function uniqueTokenCounts(text) {
  return tokenCounts(text);
}

function buildRerankContext(corpus, queryTokens) {
  const queryCount = new Map();
  for (const token of queryTokens) {
    queryCount.set(token, (queryCount.get(token) || 0) + 1);
  }

  const docFrequencies = new Map();
  const docStats = corpus.map((doc) => {
    const counts = uniqueTokenCounts(doc.text);
    const uniqueTokens = [...counts.keys()];
    for (const token of uniqueTokens) {
      docFrequencies.set(token, (docFrequencies.get(token) || 0) + 1);
    }
    return {
      id: doc.id,
      title: doc.title || doc.id,
      evidenceRefs: doc.evidenceRefs || [],
      termCounts: counts,
      docLength: [...counts.values()].reduce((sum, value) => sum + value, 0),
    };
  });

  const docCount = corpus.length || 1;
  const averageDocLength = docStats.reduce((sum, doc) => sum + doc.docLength, 0) / docCount;
  const idf = new Map();

  for (const [term, df] of docFrequencies) {
    idf.set(term, Math.log((docCount - df + 0.5) / (df + 0.5) + 1));
  }

  return { queryCount, docStats, idf, averageDocLength, docCount };
}

function scoreCandidateTfIdf(queryCount, docStats, idf, config, averageDocLength) {
  const k1 = Number.isFinite(config.k1) ? config.k1 : 1.5;
  const b = Number.isFinite(config.b) ? config.b : 0.75;
  const docLen = Math.max(1, docStats.docLength);
  const docLengthNorm = (1 - b) + (b * (docLen / averageDocLength));

  let score = 0;
  const matchedTerms = new Set();

  for (const [token, qtf] of queryCount) {
    const tf = docStats.termCounts.get(token);
    if (!tf) continue;

    matchedTerms.add(token);
    const termIdf = idf.get(token);
    const numerator = qtf * tf * (k1 + 1);
    const denominator = tf + k1 * docLengthNorm;
    const termScore = (termIdf || 0) * (denominator === 0 ? 0 : numerator / denominator);
    score += termScore;
  }

  return {
    score,
    matchedTerms: uniqueSorted([...matchedTerms]),
  };
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
  if (typeof evalCfg.minCandidateScore !== 'number' || evalCfg.minCandidateScore < 0 || evalCfg.minCandidateScore > 1) {
    throw new Error('benchmark.evaluation.minCandidateScore must be in [0,1]');
  }
  if (typeof evalCfg.minEvidenceRefsPerCandidate !== 'number' || evalCfg.minEvidenceRefsPerCandidate < 1) {
    throw new Error('benchmark.evaluation.minEvidenceRefsPerCandidate must be >= 1');
  }
  if (typeof evalCfg.k1 !== 'number' || evalCfg.k1 <= 0) {
    throw new Error('benchmark.evaluation.k1 must be > 0');
  }
  if (typeof evalCfg.b !== 'number' || evalCfg.b < 0 || evalCfg.b > 1) {
    throw new Error('benchmark.evaluation.b must be in [0,1]');
  }

  return {
    topK: evalCfg.topK,
    minRecallAtK: evalCfg.minRecallAtK,
    minCandidateScore: evalCfg.minCandidateScore,
    minEvidenceRefsPerCandidate: evalCfg.minEvidenceRefsPerCandidate,
    minScoreFloor: typeof evalCfg.minScoreFloor === 'number' ? evalCfg.minScoreFloor : 0,
    maxRunMs: typeof evalCfg.maxRunMs === 'number' ? evalCfg.maxRunMs : 2000,
    k1: evalCfg.k1,
    b: evalCfg.b,
  };
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

  const baseCorpus = benchmark.corpus.map((document) => ({
    ...document,
    text: nonEmptyString(document.text, `corpus ${document.id}.text`),
  }));

  const corpusIndex = new Set(baseCorpus.map((document) => document.id));

  const runAtValue = runAt ? nonEmptyString(runAt, 'runAt') : new Date().toISOString();
  const createdAt = new Date(runAtValue).toISOString();
  const maxRunMs = Number.isInteger(evalConfig.maxRunMs) ? evalConfig.maxRunMs : 2000;

  const startedAt = Date.now();
  const results = [];
  const decisionTraceEvidence = [];
  const missingEvidence = [];

  let totalExpected = 0;
  let totalMatched = 0;
  let scoreSum = 0;
  let scoreCount = 0;
  let totalAnchoredCandidates = 0;
  let totalReturnedCandidates = 0;
  let globalHardThresholdPass = true;

  for (const probe of benchmark.probes) {
    const expectedIds = uniqueSorted(probe.expectedCorpusIds);
    ensureResultIds(corpusIndex, expectedIds);

    const queryRaw = nonEmptyString(probe.query, `probe:${probe.probeId}.query`);
    const queryTokens = tokenize(queryRaw);
    if (!queryTokens.length) throw new Error(`probe ${probe.probeId} query has no indexable tokens`);

    const { queryCount, docStats, idf, averageDocLength } = buildRerankContext(baseCorpus, queryTokens);
    const scored = docStats
      .map((doc) => {
        const { score, matchedTerms } = scoreCandidateTfIdf(queryCount, doc, idf, evalConfig, averageDocLength);
        return {
          id: doc.id,
          title: doc.title,
          score,
          matchedTerms,
          evidenceRefs: doc.evidenceRefs || [],
        };
      })
      .sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id));

    const topK = scored.slice(0, evalConfig.topK);
    const topKHasCandidate = topK.length > 0;
    const hardThresholdPassed = topK.every((item) => item.score >= evalConfig.minCandidateScore);

    const retrievedIds = topK.map((entry) => entry.id);
    const matchedExpected = expectedIds.filter((id) => retrievedIds.includes(id));
    const minRecallAtK = typeof probe.minRecallAtK === 'number' ? probe.minRecallAtK : evalConfig.minRecallAtK;
    const recallAtK = expectedIds.length === 0 ? 1 : matchedExpected.length / expectedIds.length;
    const recallPassed = recallAtK >= minRecallAtK;
    const evidenceThreshold = topK.every((entry) => entry.evidenceRefs.length >= evalConfig.minEvidenceRefsPerCandidate);
    if (!evidenceThreshold) {
      for (const entry of topK) {
        if (entry.evidenceRefs.length < evalConfig.minEvidenceRefsPerCandidate) {
          missingEvidence.push({
            probeId: probe.probeId,
            corpusId: entry.id,
            score: Number(entry.score.toFixed(4)),
            reason: 'missing_candidate_claim_evidence',
            requiredMinEvidenceRefsPerCandidate: evalConfig.minEvidenceRefsPerCandidate,
            actualEvidenceRefs: entry.evidenceRefs.length,
          });
        }
      }
    }

    const status = hardThresholdPassed && recallPassed && evidenceThreshold && topKHasCandidate ? 'passed' : 'blocked';

    scoreSum += topK.reduce((sum, current) => sum + current.score, 0);
    scoreCount += topK.length;
    totalReturnedCandidates += topK.length;
    totalAnchoredCandidates += topK.filter((entry) => entry.evidenceRefs.length >= evalConfig.minEvidenceRefsPerCandidate).length;

    totalExpected += expectedIds.length;
    totalMatched += matchedExpected.length;

    if (!hardThresholdPassed) {
      globalHardThresholdPass = false;
    }

    const probeResult = {
      probeId: nonEmptyString(probe.probeId, 'probe.probeId'),
      query: queryRaw,
      rerankMode: 'tfidf-lite',
      topK: evalConfig.topK,
      expectedCorpusIds: expectedIds,
      topCandidates: topK.map((entry) => ({
        id: entry.id,
        title: entry.title,
        score: Number(entry.score.toFixed(4)),
        matchedTerms: entry.matchedTerms,
      })),
      matchedExpected,
      recallAtK: Number(recallAtK.toFixed(4)),
      minRecallAtK,
      status,
      evidenceAnchorSatisfied: evidenceThreshold,
      hardThresholdSatisfied: hardThresholdPassed,
      topKPresent: topKHasCandidate,
    };

    for (const entry of topK) {
      decisionTraceEvidence.push({
        probeId: probe.probeId,
        corpusId: entry.id,
        matchedTerms: entry.matchedTerms,
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
  const evidenceCoverage = totalReturnedCandidates === 0 ? 0 : Number((totalAnchoredCandidates / totalReturnedCandidates).toFixed(4));
  const status =
    results.every((result) => result.status === 'passed') &&
    recallAtK >= evalConfig.minRecallAtK &&
    globalHardThresholdPass &&
    missingEvidence.length === 0
      ? 'passed'
      : 'blocked';

  const evidenceAnchorsSatisfied = results.every((result) => result.evidenceAnchorSatisfied);
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
      sourceId: 'vector-retrieval-turbovec-stage-3',
      reason: 'Stage 3 synthetic TF-IDF-like rerank with hard score threshold and claim-evidence gate',
      topK: evalConfig.topK,
      reranker: 'tfidf-lite',
      minCandidateScore: evalConfig.minCandidateScore,
      minScoreFloor: evalConfig.minScoreFloor,
      k1: evalConfig.k1,
      b: evalConfig.b,
      safety: {
        networkCalls: false,
        llmCalls: false,
        writes: false,
        publicActionAuthority: false,
      },
      hardThresholdPassed: results.every((result) => result.hardThresholdSatisfied),
      claimEvidence: decisionTraceEvidence,
      missingEvidence,
      evidenceCoverage,
      evidenceAnchorsSatisfied,
      minEvidenceRefsPerCandidate: evalConfig.minEvidenceRefsPerCandidate,
    },
    metrics: {
      corpusSize: baseCorpus.length,
      probeCount: results.length,
      expectedAnchorCount: totalExpected,
      matchedAtK: totalMatched,
      recallAtK,
      avgTopScore,
      minRecallAtK: evalConfig.minRecallAtK,
      maxRunMs,
      elapsedMs,
      topKCoverage: results.length > 0 ? Number((results.filter((result) => result.topKPresent).length / results.length).toFixed(4)) : 0,
      passedAllProbes: results.every((result) => result.status === 'passed'),
      evidenceCoverage,
      threshold: evalConfig.minCandidateScore,
    },
    results,
    review: {
      pendingReview: status !== 'passed',
      requiredActions: {
        approve: {
          status: status === 'passed' ? 'optional' : 'required',
          reason: status === 'passed'
            ? 'shadow-only run is within synthetic ANN-like rerank and governance gates'
            : 'recall/score/claim-evidence gate failed for one or more probes',
        },
        reject: {
          status: status === 'passed' ? 'allowed' : 'required',
          reason: status !== 'passed'
            ? 'fails synthetic ANN-like threshold/gating or benchmark invariant'
            : 'only if governance review blocks deployment',
        },
      },
      requiredFields: ['metrics.recallAtK', 'decisionTrace.claimEvidence', 'decisionTrace.missingEvidence'],
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

  console.log(`Vector shadow retrieval synthetic run complete: status=${receipt.status}, recallAtK=${receipt.metrics.recallAtK}, evidenceCoverage=${receipt.metrics.evidenceCoverage}`);
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
