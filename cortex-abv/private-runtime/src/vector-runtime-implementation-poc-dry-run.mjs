import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  if (value instanceof Map) return stableJson(Object.fromEntries([...value.entries()].sort()));
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function requireArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${label} must be a non-empty array`);
}

function gate(id, passed, reason, evidence = {}) {
  return {
    id,
    status: passed ? 'accepted' : 'blocked',
    reason,
    evidence,
  };
}

function hasGitignoreCoverage(runtimeRoot, localIndexArtifactRoot) {
  const gitignorePath = path.join(runtimeRoot, '.gitignore');
  if (!existsSync(gitignorePath)) return false;
  const normalizedRoot = localIndexArtifactRoot.replace(/\/+$/, '');
  return readFileSync(gitignorePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => {
      const normalizedLine = line.replace(/\/\*\*$/, '').replace(/\/+$/, '');
      return normalizedLine === normalizedRoot || normalizedRoot.startsWith(`${normalizedLine}/`);
    });
}

function validateDryRunDesign(design, reviewReceipt, runtimeRoot) {
  requireObject(design, 'design');
  const gates = [
    gate('kind', design.kind === 'CortexABVVectorRuntimeImplementationPocDryRun', 'dry-run kind must match', { kind: design.kind }),
    gate('version', design.version === 'v1', 'dry-run version must be v1', { version: design.version }),
    gate('authority', design.authority === 'local_dry_run_only', 'dry-run authority must be local_dry_run_only', { authority: design.authority }),
    gate('engine', design.engine === 'turbovec', 'dry-run engine must be turbovec', { engine: design.engine }),
  ];

  requireObject(design.prerequisites, 'prerequisites');
  gates.push(
    gate('review_prerequisite_kind', reviewReceipt.kind === design.prerequisites.requiredPocReviewReceiptKind, 'POC review receipt kind must match', { kind: reviewReceipt.kind }),
    gate('review_prerequisite_status', reviewReceipt.status === design.prerequisites.requiredPocReviewStatus, 'POC review receipt status must match', { status: reviewReceipt.status }),
    gate('review_prerequisite_eligibility', reviewReceipt.eligibility === design.prerequisites.requiredPocReviewEligibility, 'POC review receipt eligibility must match', { eligibility: reviewReceipt.eligibility }),
    gate('review_no_blockers', Array.isArray(reviewReceipt.blockers) && reviewReceipt.blockers.length === 0, 'POC review receipt must have no blockers', { blockers: reviewReceipt.blockers }),
  );

  requireObject(design.sourcePack, 'sourcePack');
  const allowedSourcePacks = reviewReceipt.minimumPocScope?.allowedSourcePacks || [];
  gates.push(
    gate('source_pack_allowlisted', allowedSourcePacks.some((source) => source.id === design.sourcePack.id && source.type === design.sourcePack.type && source.path === design.sourcePack.path), 'source pack must be allowlisted by POC review receipt', { sourcePack: design.sourcePack, allowedSourcePacks }),
    gate('source_pack_synthetic_only_for_first_run', design.sourcePack.type === 'synthetic_benchmark', 'first dry-run uses synthetic benchmark only', design.sourcePack),
  );

  requireObject(design.indexArtifact, 'indexArtifact');
  const reviewedRoot = reviewReceipt.minimumPocScope?.localIndexArtifactRoot;
  gates.push(
    gate('artifact_root_matches_review', design.indexArtifact.root === reviewedRoot, 'artifact root must match POC review receipt', { root: design.indexArtifact.root, reviewedRoot }),
    gate('artifact_local_root', typeof design.indexArtifact.root === 'string' && design.indexArtifact.root.startsWith('data/vector-indexes/') && !design.indexArtifact.root.includes('..'), 'artifact root must stay under data/vector-indexes', design.indexArtifact),
    gate('artifact_gitignored', design.indexArtifact.gitignored === true && hasGitignoreCoverage(runtimeRoot, design.indexArtifact.root), 'artifact root must be gitignored', design.indexArtifact),
    gate('artifact_not_committed', design.indexArtifact.committed === false, 'artifact must not be committed', design.indexArtifact),
  );

  requireObject(design.commands, 'commands');
  const allowedCommands = reviewReceipt.minimumPocScope?.allowedDryRunCommands || [];
  for (const [key, command] of Object.entries(design.commands)) {
    gates.push(gate(`command_${key}`, allowedCommands.includes(command) && command.endsWith('_dry_run'), `${key} command must be review-allowlisted dry-run command`, { command, allowedCommands }));
  }

  requireObject(design.checks, 'checks');
  for (const [key, expected] of Object.entries({
    requiresSourceDigestBeforeBuild: true,
    requiresIndexDigestAfterBuild: true,
    requiresReceiptDigestLinkage: true,
    requiresRollbackNotes: true,
    requiresClaimEvidence: true,
    requiresProbeRecall: true,
  })) {
    gates.push(gate(`check_${key}`, design.checks[key] === expected, `checks.${key} must be ${expected}`, design.checks));
  }

  requireObject(design.rollback, 'rollback');
  gates.push(
    gate('rollback_action', design.rollback.action === 'delete_or_abandon_local_index_artifact', 'rollback action must delete or abandon local artifact', design.rollback),
    gate('rollback_no_baseline', design.rollback.baselineAdvancementAllowed === false, 'baseline advancement must be forbidden', design.rollback),
    gate('rollback_notes', typeof design.rollback.notes === 'string' && design.rollback.notes.trim().length > 0, 'rollback notes must be present', design.rollback),
  );

  requireObject(design.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    dryRunOnly: true,
    runtimeIntegration: false,
    endpoint: false,
    scheduler: false,
    networkCalls: false,
    llmCalls: false,
    sourcePackMutation: false,
    writesOutsideReceiptOrLocalArtifact: false,
    publicActionAuthority: false,
  })) {
    gates.push(gate(`governance_${key}`, design.governance[key] === expected, `governance.${key} must be ${expected}`, design.governance));
  }

  return gates;
}

function validateBenchmark(benchmark) {
  if (benchmark.kind !== 'CortexABVVectorRetrievalSyntheticBenchmark' || benchmark.version !== 'v1') {
    throw new Error('benchmark must be CortexABVVectorRetrievalSyntheticBenchmark v1');
  }
  requireArray(benchmark.corpus, 'benchmark.corpus');
  requireArray(benchmark.probes, 'benchmark.probes');
  return benchmark.evaluation || {};
}

function serializeIndex(index) {
  return {
    kind: 'CortexABVVectorRuntimeIndexArtifact',
    version: 'v1',
    mode: index.mode,
    decisionTrace: index.decisionTrace,
    documentCount: index.documentCount,
    documents: index.fallbackIndex.documents.map((document) => ({
      id: document.id,
      title: document.title,
      tenant: document.tenant,
      evidenceRefs: document.evidenceRefs,
      docLength: document.docLength,
      termCounts: Object.fromEntries([...document.termCounts.entries()].sort()),
    })),
    idf: Object.fromEntries([...index.fallbackIndex.idf.entries()].sort()),
    averageDocLength: index.fallbackIndex.averageDocLength,
  };
}

function evaluateProbes({ index, benchmark, evalConfig }) {
  return benchmark.probes.map((probe) => {
    const candidates = queryVectorRuntimeIndex({
      index,
      query: probe.query,
      topK: evalConfig.topK,
      minCandidateScore: evalConfig.minCandidateScore,
      k1: evalConfig.k1,
      b: evalConfig.b,
    });
    const candidateIds = new Set(candidates.map((candidate) => candidate.id));
    const expected = probe.expectedCorpusIds || [];
    const hits = expected.filter((id) => candidateIds.has(id));
    const recallAtK = expected.length ? hits.length / expected.length : 0;
    const evidenceOk = candidates.every((candidate) => Array.isArray(candidate.evidenceRefs) && candidate.evidenceRefs.length >= (evalConfig.minEvidenceRefsPerCandidate || 1));
    const minRecall = typeof probe.minRecallAtK === 'number' ? probe.minRecallAtK : evalConfig.minRecallAtK;
    return {
      probeId: probe.probeId,
      status: recallAtK >= minRecall && evidenceOk ? 'passed' : 'blocked',
      query: probe.query,
      expectedCorpusIds: expected,
      candidateIds: [...candidateIds],
      hits,
      recallAtK,
      minRecallAtK: minRecall,
      evidenceOk,
      candidates,
    };
  });
}

function flattenBlockers(gates) {
  return Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
}

function buildReceipt({ design, reviewReceipt, gates, blockers, artifact, artifactPath, source, probeResults = [], runAt }) {
  const passed = blockers.length === 0;
  const artifactDigest = artifact ? sha256(artifact) : undefined;
  const designDigest = sha256(design);
  const pocReviewReceiptDigest = sha256(reviewReceipt);
  const sourceDigest = source?.digest;
  return {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeImplementationPocDryRunReceipt',
    version: 'v1',
    authority: 'local_dry_run_only',
    status: passed ? 'passed' : 'blocked',
    eligibility: passed ? 'eligible_for_controlled_runtime_module_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'implementation_poc_dry_run',
    engine: design.engine,
    digests: {
      designDigest,
      pocReviewReceiptDigest,
      sourceDigest,
      indexDigest: artifactDigest,
      receiptLinkageDigest: sha256({
        designDigest,
        pocReviewReceiptDigest,
        sourceDigest,
        indexDigest: artifactDigest,
      }),
    },
    artifact: artifact && artifactPath ? {
      path: artifactPath,
      root: design.indexArtifact?.root,
      gitignored: true,
      committed: false,
      digest: artifactDigest,
      documentCount: artifact.documentCount,
    } : undefined,
    source,
    commandsExecuted: passed ? [
      design.commands.build,
      design.commands.query,
      design.commands.verify,
    ] : [],
    probeResults,
    rollback: {
      action: design.rollback?.action,
      artifactPath,
      baselineAdvanced: false,
      notes: design.rollback?.notes,
    },
    governance: {
      readOnly: true,
      proposalOnly: true,
      dryRunOnly: true,
      runtimeIntegration: false,
      endpoint: false,
      scheduler: false,
      networkCalls: false,
      llmCalls: false,
      sourcePackMutation: false,
      writesOutsideReceiptOrLocalArtifact: false,
      publicActionAuthority: false,
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'implementation_poc_dry_run_design_plus_review_receipt',
      reason: passed
        ? 'Local dry-run built a gitignored index artifact, verified source/index digests, probe recall and rollback notes without runtime authority.'
        : 'Local dry-run failed design, digest, query or rollback gates.',
      nextAllowedStep: passed ? 'controlled_runtime_module_design_review' : 'repair_dry_run_design_or_source_pack',
    },
  };
}

export function runVectorRuntimeImplementationPocDryRun({ designPath, reviewReceiptPath, planPath, sourcePackPath, artifactRoot, receiptPath, runAt, runtimeRoot = process.cwd() } = {}) {
  if (!existsSync(designPath)) throw new Error(`dry-run design file not found: ${designPath}`);
  if (!existsSync(reviewReceiptPath)) throw new Error(`POC review receipt file not found: ${reviewReceiptPath}`);
  if (!existsSync(planPath)) throw new Error(`pilot plan file not found: ${planPath}`);

  const design = readJson(designPath);
  const reviewReceipt = readJson(reviewReceiptPath);
  const designGates = validateDryRunDesign(design, reviewReceipt, runtimeRoot);
  let gates = { design: designGates };
  let blockers = flattenBlockers(gates);
  if (blockers.length > 0) {
    const blockedReceipt = buildReceipt({ design, reviewReceipt, gates, blockers, runAt });
    if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(blockedReceipt, null, 2)}\n`);
    return blockedReceipt;
  }

  const resolvedSourcePackPath = sourcePackPath || path.resolve(runtimeRoot, design.sourcePack.path);
  if (!existsSync(resolvedSourcePackPath)) throw new Error(`source pack file not found: ${resolvedSourcePackPath}`);
  const benchmark = readJson(resolvedSourcePackPath);
  const evalConfig = validateBenchmark(benchmark);
  const sourceDigest = sha256(benchmark);
  const plan = readJson(planPath);
  const sourceGates = [
    gate('source_digest_before_build', Boolean(sourceDigest), 'source digest computed before build', { sourceDigest }),
    gate('source_path_matches_design', path.relative(runtimeRoot, resolvedSourcePackPath) === design.sourcePack.path, 'source path must match dry-run design', { sourcePath: path.relative(runtimeRoot, resolvedSourcePackPath), expectedPath: design.sourcePack.path }),
  ];
  gates = { design: designGates, source: sourceGates };
  blockers = flattenBlockers(gates);
  if (blockers.length > 0) {
    const blockedReceipt = buildReceipt({
      design,
      reviewReceipt,
      gates,
      blockers,
      source: {
        id: design.sourcePack.id,
        type: design.sourcePack.type,
        path: design.sourcePack.path,
        digest: sourceDigest,
      },
      runAt,
    });
    if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(blockedReceipt, null, 2)}\n`);
    return blockedReceipt;
  }

  const index = buildVectorRuntimeIndex({ plan, corpus: benchmark.corpus });
  const artifact = {
    schemaVersion: 1,
    ...serializeIndex(index),
    source: {
      sourcePackId: design.sourcePack.id,
      sourcePackType: design.sourcePack.type,
      sourcePath: design.sourcePack.path,
      sourceDigest,
    },
    builtAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    governance: {
      localArtifactOnly: true,
      committed: false,
      endpoint: false,
      networkCalls: false,
      llmCalls: false,
      publicActionAuthority: false,
    },
  };

  const resolvedArtifactRoot = path.resolve(runtimeRoot, artifactRoot || design.indexArtifact.root);
  const artifactPath = path.join(resolvedArtifactRoot, design.indexArtifact.fileName);
  mkdirSync(resolvedArtifactRoot, { recursive: true });
  const indexDigest = sha256(artifact);
  writeFileSync(artifactPath, `${JSON.stringify({ ...artifact, indexDigest }, null, 2)}\n`);

  const probeResults = evaluateProbes({ index, benchmark, evalConfig });
  const approvedArtifactRoot = path.resolve(runtimeRoot, artifactRoot || design.indexArtifact.root);
  const queryGates = [
    gate('index_digest_after_build', Boolean(indexDigest), 'index digest computed after build', { indexDigest }),
    gate('artifact_written_local_only', artifactPath.startsWith(approvedArtifactRoot), 'artifact written under approved local root', { artifactPath: path.relative(runtimeRoot, artifactPath) }),
    gate('all_probes_passed', probeResults.every((probe) => probe.status === 'passed'), 'all synthetic probes must pass recall/evidence checks', { probeCount: probeResults.length }),
  ];

  gates = {
    design: designGates,
    source: sourceGates,
    query: queryGates,
  };
  blockers = flattenBlockers(gates);
  const receipt = buildReceipt({
    design,
    reviewReceipt,
    gates,
    blockers,
    artifact,
    artifactPath: path.relative(runtimeRoot, artifactPath),
    source: {
      id: design.sourcePack.id,
      type: design.sourcePack.type,
      path: design.sourcePack.path,
      digest: sourceDigest,
    },
    probeResults,
    runAt: artifact.builtAt,
  });
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeImplementationPocDryRun({
    designPath: option('--design') || path.resolve(process.cwd(), 'config/vector-runtime-implementation-poc-dry-run.v1.json'),
    reviewReceiptPath: option('--review-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-implementation-poc-review-receipt.v1.json'),
    planPath: option('--plan') || path.resolve(process.cwd(), 'config/vector-retrieval-turbovec-pilot.v1.json'),
    sourcePackPath: option('--source-pack'),
    artifactRoot: option('--artifact-root'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-implementation-poc-dry-run-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime implementation POC dry-run complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}, artifact=${receipt.artifact.path}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime implementation POC dry-run failed: ${error.message}`);
    process.exitCode = 1;
  }
}
