import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function flag(name) {
  return process.argv.includes(name);
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

function validatePlan(plan) {
  if (!plan || plan.kind !== 'CortexABVVectorRetrievalPilotPlan' || plan.engine !== 'turbovec') {
    throw new Error('plan must be a CortexABV turbovec pilot plan');
  }
  if (plan.externalSideEffects !== false) throw new Error('plan must keep externalSideEffects=false');
  const safety = plan.safetyControls || {};
  if (safety.llmCalls || safety.writes || safety.publicActionAuthority) {
    throw new Error('plan must keep llmCalls/writes/publicActionAuthority=false');
  }
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
  return benchmark.evaluation || {};
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    input: options.input,
    timeout: options.timeoutMs || 120000,
    maxBuffer: 1024 * 1024 * 10,
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error ? result.error.message : undefined,
  };
}

function makePythonProbeScript() {
  return String.raw`
import hashlib
import json
import math
import sys

import numpy as np
from turbovec import IdMapIndex

payload = json.load(sys.stdin)
benchmark = payload["benchmark"]
evaluation = benchmark.get("evaluation", {})
dim = int(payload.get("dim", 32))
bit_width = int(payload.get("bitWidth", 4))
top_k = int(evaluation.get("topK", 3))
min_score = float(evaluation.get("minCandidateScore", 0))
min_recall = float(evaluation.get("minRecallAtK", 1))

def vectorize(text):
    vec = np.zeros(dim, dtype=np.float32)
    for token in str(text).lower().replace("/", " ").replace("-", " ").split():
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        slot = int.from_bytes(digest[:4], "little") % dim
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vec[slot] += sign
    norm = np.linalg.norm(vec)
    if norm == 0:
        vec[0] = 1.0
    else:
        vec = vec / norm
    return vec.astype(np.float32)

docs = benchmark["corpus"]
vectors = np.stack([vectorize(doc["text"]) for doc in docs]).astype(np.float32)
ids = np.array([index + 1 for index, _ in enumerate(docs)], dtype=np.uint64)
id_to_doc = {int(index + 1): doc for index, doc in enumerate(docs)}
doc_to_id = {doc["id"]: int(index + 1) for index, doc in enumerate(docs)}

idx = IdMapIndex(dim=dim, bit_width=bit_width)
idx.add_with_ids(vectors, ids)
idx.prepare()

results = []
matched_total = 0
expected_total = 0
for probe in benchmark["probes"]:
    query = vectorize(probe["query"]).reshape(1, dim).astype(np.float32)
    scores, returned_ids = idx.search(query, k=top_k)
    pairs = []
    for score, returned_id in zip(scores[0].tolist(), returned_ids[0].tolist()):
        doc = id_to_doc[int(returned_id)]
        if float(score) >= min_score:
            pairs.append({
                "id": doc["id"],
                "score": float(score),
                "evidenceRefs": doc.get("evidenceRefs", []),
            })
    expected = sorted(probe.get("expectedCorpusIds", []))
    matched = sorted([doc_id for doc_id in expected if any(pair["id"] == doc_id for pair in pairs)])
    expected_total += len(expected)
    matched_total += len(matched)
    recall = 1.0 if len(expected) == 0 else len(matched) / len(expected)
    results.append({
        "probeId": probe["probeId"],
        "candidateIds": [pair["id"] for pair in pairs],
        "matchedExpected": matched,
        "recallAtK": recall,
        "status": "passed" if recall >= float(probe.get("minRecallAtK", min_recall)) and len(pairs) > 0 else "blocked",
        "candidates": pairs,
    })

recall_at_k = 1.0 if expected_total == 0 else matched_total / expected_total
print(json.dumps({
    "status": "passed" if all(item["status"] == "passed" for item in results) and recall_at_k >= min_recall else "blocked",
    "package": "turbovec",
    "indexType": "IdMapIndex",
    "dim": dim,
    "bitWidth": bit_width,
    "documentCount": len(docs),
    "recallAtK": recall_at_k,
    "results": results,
}))
`;
}

function defaultExecutor({ benchmark, allowInstall, pythonBin, packageName }) {
  let executable = pythonBin || process.env.PYTHON || 'python3';
  const installLog = [];
  let dependencyInstallAttempted = false;

  if (allowInstall) {
    const tempRoot = mkdtempSync(path.join(tmpdir(), 'cortexabv-turbovec-probe-'));
    const venvPath = path.join(tempRoot, 'venv');
    const venv = runCommand(executable, ['-m', 'venv', venvPath]);
    if (!venv.ok) {
      return {
        ok: false,
        dependencyInstallAttempted: true,
        dependencyAvailable: false,
        error: `venv creation failed: ${venv.stderr || venv.error || venv.stdout}`,
        installLog,
      };
    }
    executable = path.join(venvPath, 'bin', 'python');
    dependencyInstallAttempted = true;
    for (const installArgs of [
      ['-m', 'pip', 'install', '--quiet', '--upgrade', 'pip'],
      ['-m', 'pip', 'install', '--quiet', packageName],
    ]) {
      const install = runCommand(executable, installArgs, { timeoutMs: 180000 });
      installLog.push({
        args: installArgs,
        ok: install.ok,
        stderr: install.stderr.split('\n').slice(-5).join('\n'),
      });
      if (!install.ok) {
        return {
          ok: false,
          dependencyInstallAttempted,
          dependencyAvailable: false,
          error: `dependency install failed: ${install.stderr || install.error || install.stdout}`,
          installLog,
        };
      }
    }
  }

  const probe = runCommand(executable, ['-c', makePythonProbeScript()], {
    input: JSON.stringify({ benchmark, dim: 32, bitWidth: 4 }),
    timeoutMs: 120000,
  });
  if (!probe.ok) {
    return {
      ok: false,
      dependencyInstallAttempted,
      dependencyAvailable: false,
      error: probe.stderr || probe.error || probe.stdout,
      installLog,
    };
  }
  try {
    return {
      ok: true,
      dependencyInstallAttempted,
      dependencyAvailable: true,
      installLog,
      output: JSON.parse(probe.stdout),
    };
  } catch (error) {
    return {
      ok: false,
      dependencyInstallAttempted,
      dependencyAvailable: true,
      error: `probe output parse failed: ${error.message}`,
      installLog,
    };
  }
}

function claimEvidenceFromResults(results) {
  const evidence = [];
  const missing = [];
  for (const result of results || []) {
    for (const candidate of result.candidates || []) {
      const evidenceRefs = candidate.evidenceRefs || [];
      evidence.push({
        probeId: result.probeId,
        corpusId: candidate.id,
        score: Number(candidate.score.toFixed(4)),
        evidenceRefs,
        retrievalRole: result.matchedExpected.includes(candidate.id) ? 'expected' : 'distractor',
      });
      if (evidenceRefs.length === 0) {
        missing.push({
          probeId: result.probeId,
          corpusId: candidate.id,
          reason: 'missing_turbovec_candidate_claim_evidence',
        });
      }
    }
  }
  return { evidence, missing };
}

export function runVectorRuntimeDependencyProbe({
  planPath,
  benchmarkPath,
  receiptPath,
  runAt,
  allowInstall = false,
  pythonBin,
  packageName = 'turbovec',
  executor = defaultExecutor,
} = {}) {
  if (!existsSync(planPath)) throw new Error(`plan file not found: ${planPath}`);
  if (!existsSync(benchmarkPath)) throw new Error(`benchmark file not found: ${benchmarkPath}`);
  const plan = readJson(planPath);
  const benchmark = readJson(benchmarkPath);
  const evaluation = validateBenchmark(benchmark);
  validatePlan(plan);

  const runAtValue = runAt ? new Date(runAt).toISOString() : new Date().toISOString();
  const probe = executor({ benchmark, allowInstall, pythonBin, packageName });
  const output = probe.output || {};
  const { evidence, missing } = claimEvidenceFromResults(output.results || []);
  const indexBuildAccepted = probe.ok && output.documentCount === benchmark.corpus.length && output.indexType === 'IdMapIndex';
  const queryAccepted =
    probe.ok &&
    output.status === 'passed' &&
    Number(output.recallAtK) >= (Number.isFinite(evaluation.minRecallAtK) ? evaluation.minRecallAtK : 1) &&
    missing.length === 0;
  const status = indexBuildAccepted && queryAccepted ? 'passed' : 'blocked';

  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeDependencyProbeReceipt',
    version: 'v1',
    authority: 'plan_only',
    status,
    runAt: runAtValue,
    mode: 'bounded_local_dependency_probe',
    engine: plan.engine,
    package: packageName,
    sourcePilotPlan: path.basename(planPath),
    governance: {
      readOnly: true,
      proposalOnly: true,
      dataPlaneNetworkCalls: false,
      llmCalls: false,
      endpoint: false,
      writesOutsideReceipt: false,
      publicActionAuthority: false,
    },
    acceptance: {
      indexBuild: {
        status: indexBuildAccepted ? 'accepted' : 'blocked',
        required: ['python import turbovec', 'IdMapIndex build', 'document count matches fixture corpus'],
      },
      query: {
        status: queryAccepted ? 'accepted' : 'blocked',
        required: ['search returns expected synthetic anchors', 'recallAtK threshold passed', 'candidate claim evidence present'],
      },
    },
    dependency: {
      available: Boolean(probe.dependencyAvailable),
      installAttempted: Boolean(probe.dependencyInstallAttempted),
      installAllowed: Boolean(allowInstall),
      installLog: probe.installLog || [],
      error: probe.error,
    },
    decisionTrace: {
      policySource: 'base',
      sourceKind: 'synthetic_benchmark',
      sourceId: 'vector-runtime-dependency-probe-turbovec',
      reason: 'Bounded local real turbovec dependency probe with index-build/query acceptance and no public action authority',
      claimEvidence: evidence,
      missingEvidence: missing,
    },
    metrics: {
      corpusSize: benchmark.corpus.length,
      documentCount: output.documentCount || 0,
      recallAtK: Number.isFinite(output.recallAtK) ? Number(output.recallAtK.toFixed(4)) : 0,
      minRecallAtK: Number.isFinite(evaluation.minRecallAtK) ? evaluation.minRecallAtK : 1,
      passedAllProbes: (output.results || []).every((result) => result.status === 'passed'),
    },
    results: output.results || [],
    review: {
      pendingReview: status === 'passed',
      approvalMeaning: 'Approve only the dependency as a bounded local candidate. This does not approve endpoints, public retrieval, autonomous writes, model calls, or publication.',
      requiredFields: ['acceptance.indexBuild', 'acceptance.query', 'governance', 'decisionTrace.claimEvidence'],
    },
    outputIntegrity: {
      corpusDigest: sha256(benchmark.corpus),
      benchmark: path.basename(benchmarkPath),
      runSchemaDigest: sha256(benchmark.evaluation || {}),
    },
  };

  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeDependencyProbe({
    planPath: option('--plan') || path.resolve(process.cwd(), 'config/vector-retrieval-turbovec-pilot.v1.json'),
    benchmarkPath: option('--benchmark') || path.resolve(process.cwd(), 'examples/synthetic-vector-retrieval-benchmark.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-dependency-probe-receipt.v1.json'),
    runAt: option('--run-at'),
    allowInstall: flag('--allow-install'),
    pythonBin: option('--python'),
    packageName: option('--package') || 'turbovec',
  });
  console.log(`Vector runtime dependency probe complete: status=${receipt.status}, indexBuild=${receipt.acceptance.indexBuild.status}, query=${receipt.acceptance.query.status}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime dependency probe failed: ${error.message}`);
    process.exitCode = 1;
  }
}
