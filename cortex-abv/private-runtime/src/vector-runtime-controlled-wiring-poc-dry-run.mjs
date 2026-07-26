import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadIndexArtifact, queryCandidates, verifyClaimEvidence } from './vector-runtime-controlled-module-harness.mjs';

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

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function requireArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${label} must be a non-empty array`);
}

function gate(id, passed, reason, evidence = {}) {
  return { id, status: passed ? 'accepted' : 'blocked', reason, evidence };
}

function flattenBlockers(gates) {
  return Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
}

function validateDesign(design, stage4mReceipt) {
  requireObject(design, 'design');
  const gates = [
    gate('kind', design.kind === 'CortexABVVectorRuntimeControlledWiringPocDryRun', 'design kind must match', { kind: design.kind }),
    gate('version', design.version === 'v1', 'design version must be v1', { version: design.version }),
    gate('authority', design.authority === 'local_dry_run_only', 'design authority must be local_dry_run_only', { authority: design.authority }),
    gate('engine', design.engine === 'turbovec', 'design engine must be turbovec', { engine: design.engine }),
  ];

  requireObject(design.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4m_kind', stage4mReceipt.kind === design.prerequisites.requiredPocReviewReceiptKind, 'Stage 4m receipt kind must match', { kind: stage4mReceipt.kind }),
    gate('stage4m_status', stage4mReceipt.status === design.prerequisites.requiredPocReviewStatus, 'Stage 4m receipt status must be passed', { status: stage4mReceipt.status }),
    gate('stage4m_eligibility', stage4mReceipt.eligibility === design.prerequisites.requiredPocReviewEligibility, 'Stage 4m receipt eligibility must match', { eligibility: stage4mReceipt.eligibility }),
    gate('stage4m_no_blockers', Array.isArray(stage4mReceipt.blockers) && stage4mReceipt.blockers.length === 0, 'Stage 4m receipt must have no blockers', { blockers: stage4mReceipt.blockers }),
    gate('stage4m_digest_required', design.prerequisites.requiresPocReviewReceiptDigest === true, 'Stage 4m receipt digest must be required', design.prerequisites),
  );

  requireObject(design.artifact, 'artifact');
  gates.push(
    gate('artifact_path', design.artifact.path === stage4mReceipt.minimumPocScope?.allowedArtifactPath, 'artifact path must match Stage 4m allowed artifact path', { artifact: design.artifact, allowedArtifactPath: stage4mReceipt.minimumPocScope?.allowedArtifactPath }),
    gate('artifact_read_only', design.artifact.readOnly === true, 'artifact must be read-only', design.artifact),
    gate('artifact_kind', design.artifact.kind === 'CortexABVVectorRuntimeIndexArtifact', 'artifact kind must match', design.artifact),
  );

  requireObject(design.binding, 'binding');
  requireArray(design.binding.functions, 'binding.functions');
  const allowedBindings = stage4mReceipt.minimumPocScope?.allowedBindings || [];
  gates.push(
    gate('local_binding_only', design.binding.mode === 'in_process_local_library_binding_only', 'binding must be local in-process only', design.binding),
    gate('module_path', design.binding.modulePath === stage4mReceipt.minimumPocScope?.allowedModulePath, 'binding module path must match Stage 4m allowed module', { binding: design.binding, allowedModulePath: stage4mReceipt.minimumPocScope?.allowedModulePath }),
    gate('binding_functions', design.binding.functions.every((fn) => allowedBindings.includes(fn)), 'binding functions must be Stage 4m allowlisted', { functions: design.binding.functions, allowedBindings }),
    gate('candidates_only', design.binding.returnsCandidatesOnly === true, 'binding must return candidates only', design.binding),
    gate('no_answer_generation', design.binding.answerGeneration === false, 'answer generation must remain forbidden', design.binding),
  );

  requireArray(design.queries, 'queries');
  for (const query of design.queries) {
    gates.push(
      gate(`query_${query.id}_tenant`, typeof query.tenant === 'string' && query.tenant.length > 0, 'query must include tenant scope', query),
      gate(`query_${query.id}_threshold`, Number.isFinite(query.minScore) && query.minScore >= 0, 'query must include hard threshold', query),
      gate(`query_${query.id}_expected`, Array.isArray(query.expectedCandidateIds) && query.expectedCandidateIds.length > 0, 'query must include expected candidates', query),
    );
  }

  requireObject(design.commands, 'commands');
  const allowedCommands = stage4mReceipt.minimumPocScope?.allowedDryRunCommands || [];
  for (const [key, command] of Object.entries(design.commands)) {
    gates.push(gate(`command_${key}`, allowedCommands.includes(command) && command.endsWith('_poc_dry_run'), `${key} command must be Stage 4m allowlisted dry-run command`, { command, allowedCommands }));
  }

  requireArray(design.rollbackNotes, 'rollbackNotes');
  gates.push(gate('rollback_notes', design.rollbackNotes.length > 0, 'rollback notes must be present', { rollbackNotes: design.rollbackNotes }));

  requireObject(design.checks, 'checks');
  for (const [key, expected] of Object.entries({
    requiresStage4mReceiptDigest: true,
    requiresStage4lReceiptDigest: true,
    requiresStage4kReceiptDigest: true,
    requiresStage4hArtifactDigest: true,
    requiresStage4hSourceDigest: true,
    requiresTenantScope: true,
    requiresHardThreshold: true,
    requiresCandidatesOnly: true,
    requiresEvidenceRefs: true,
    requiresRollbackNotes: true,
  })) {
    gates.push(gate(`check_${key}`, design.checks[key] === expected, `checks.${key} must be ${expected}`, design.checks));
  }

  requireObject(design.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    dryRunOnly: true,
    runtimeIntegration: false,
    runtimeActivation: false,
    endpoint: false,
    scheduler: false,
    networkCalls: false,
    llmCalls: false,
    writesOutsideReceipt: false,
    artifactMutation: false,
    sourceMutation: false,
    publicActionAuthority: false,
  })) {
    gates.push(gate(`governance_${key}`, design.governance[key] === expected, `governance.${key} must be ${expected}`, design.governance));
  }

  return gates;
}

function validateDigestContinuity({ stage4mReceipt, stage4lReceipt, stage4kReceipt, stage4hReceipt }) {
  const stage4mReceiptDigest = sha256(stage4mReceipt);
  const stage4lReceiptDigest = sha256(stage4lReceipt);
  const stage4kReceiptDigest = sha256(stage4kReceipt);
  const stage4hIndexDigest = stage4hReceipt.digests?.indexDigest;
  const stage4hSourceDigest = stage4hReceipt.digests?.sourceDigest;
  return {
    gates: [
      gate('stage4m_digest_present', stage4mReceiptDigest.length === 64, 'Stage 4m receipt digest must be computable', { stage4mReceiptDigest }),
      gate('stage4m_links_stage4l', stage4mReceipt.stage4lReceiptDigest === stage4lReceiptDigest, 'Stage 4m receipt must link to Stage 4l receipt digest', { expected: stage4mReceipt.stage4lReceiptDigest, observed: stage4lReceiptDigest }),
      gate('stage4m_links_stage4k', stage4mReceipt.prerequisiteDigests?.stage4kHarnessDryRunReceiptDigest === stage4kReceiptDigest, 'Stage 4m receipt must link to Stage 4k receipt digest', { expected: stage4mReceipt.prerequisiteDigests?.stage4kHarnessDryRunReceiptDigest, observed: stage4kReceiptDigest }),
      gate('stage4m_links_stage4h_index', stage4mReceipt.prerequisiteDigests?.stage4hIndexDigest === stage4hIndexDigest, 'Stage 4m receipt must link to Stage 4h index digest', { expected: stage4mReceipt.prerequisiteDigests?.stage4hIndexDigest, observed: stage4hIndexDigest }),
      gate('stage4k_links_stage4h_source', stage4kReceipt.digests?.stage4hSourceDigest === stage4hSourceDigest, 'Stage 4k receipt must link to Stage 4h source digest', { expected: stage4kReceipt.digests?.stage4hSourceDigest, observed: stage4hSourceDigest }),
      gate('stage4l_no_runtime', stage4lReceipt.governance?.runtimeIntegration === false && stage4lReceipt.governance?.runtimeActivationApproved === false, 'Stage 4l must not approve runtime integration or activation', stage4lReceipt.governance),
      gate('stage4m_no_runtime', stage4mReceipt.governance?.runtimeIntegration === false && stage4mReceipt.governance?.runtimeActivationApproved === false, 'Stage 4m must not approve runtime integration or activation', stage4mReceipt.governance),
    ],
    digests: {
      stage4mReceiptDigest,
      stage4lReceiptDigest,
      stage4kReceiptDigest,
      stage4hIndexDigest,
      stage4hSourceDigest,
    },
  };
}

function buildReceipt({ design, stage4mReceipt, gates, blockers, digests = {}, loadedIndex, queryResults = [], runAt }) {
  const passed = blockers.length === 0;
  const designDigest = sha256(design);
  return {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeControlledWiringPocDryRunReceipt',
    version: 'v1',
    authority: 'local_dry_run_only',
    status: passed ? 'passed' : 'blocked',
    eligibility: passed ? 'eligible_for_controlled_runtime_wiring_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'controlled_runtime_wiring_poc_dry_run',
    engine: design.engine,
    digests: {
      designDigest,
      stage4mReceiptDigest: digests.stage4mReceiptDigest,
      stage4lReceiptDigest: digests.stage4lReceiptDigest,
      stage4kReceiptDigest: digests.stage4kReceiptDigest,
      stage4hIndexDigest: digests.stage4hIndexDigest || loadedIndex?.digests?.indexDigest,
      stage4hSourceDigest: digests.stage4hSourceDigest || loadedIndex?.digests?.sourceDigest,
      receiptLinkageDigest: sha256({
        designDigest,
        stage4mReceiptDigest: digests.stage4mReceiptDigest,
        stage4lReceiptDigest: digests.stage4lReceiptDigest,
        stage4kReceiptDigest: digests.stage4kReceiptDigest,
        stage4hIndexDigest: digests.stage4hIndexDigest || loadedIndex?.digests?.indexDigest,
        stage4hSourceDigest: digests.stage4hSourceDigest || loadedIndex?.digests?.sourceDigest,
      }),
    },
    binding: {
      mode: design.binding?.mode,
      modulePath: design.binding?.modulePath,
      functions: design.binding?.functions,
      candidatesOnly: true,
      activated: false,
    },
    artifact: loadedIndex ? {
      path: design.artifact?.path,
      indexDigest: loadedIndex.digests.indexDigest,
      sourceDigest: loadedIndex.digests.sourceDigest,
      documentCount: loadedIndex.artifact.documentCount,
      readOnly: true,
    } : undefined,
    commandsExecuted: passed ? [
      design.commands.verifyStage4mDigest,
      design.commands.bindLocalHarness,
      design.commands.queryLocalHarness,
      design.commands.verifyNoActivation,
    ] : [],
    rollbackNotes: design.rollbackNotes,
    queryResults,
    governance: {
      readOnly: true,
      proposalOnly: true,
      dryRunOnly: true,
      runtimeIntegration: false,
      runtimeActivation: false,
      endpoint: false,
      scheduler: false,
      networkCalls: false,
      llmCalls: false,
      writesOutsideReceipt: false,
      artifactMutation: false,
      sourceMutation: false,
      publicActionAuthority: false,
    },
    sources: {
      design: { kind: design.kind, digest: designDigest },
      stage4mReceipt: {
        kind: stage4mReceipt.kind,
        status: stage4mReceipt.status,
        eligibility: stage4mReceipt.eligibility,
        digest: digests.stage4mReceiptDigest,
      },
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'controlled_wiring_poc_dry_run_plus_stage4m_receipt_digest',
      reason: passed
        ? 'Controlled wiring POC dry-run verified Stage 4m digest chain, bound the local harness in-process, queried tenant-scoped candidates and did not activate runtime wiring.'
        : 'Controlled wiring POC dry-run failed design, digest, binding, query, evidence or governance gates.',
      nextAllowedStep: passed ? 'controlled_runtime_wiring_review_gate' : 'repair_controlled_wiring_poc_dry_run',
    },
  };
}

export function runVectorRuntimeControlledWiringPocDryRun({ designPath, stage4mReceiptPath, stage4lReceiptPath, stage4kReceiptPath, stage4hReceiptPath, artifactPath, receiptPath, runAt, runtimeRoot = process.cwd() } = {}) {
  if (!existsSync(designPath)) throw new Error(`controlled wiring POC dry-run design file not found: ${designPath}`);
  if (!existsSync(stage4mReceiptPath)) throw new Error(`Stage 4m receipt file not found: ${stage4mReceiptPath}`);
  const resolvedStage4lReceiptPath = stage4lReceiptPath || path.resolve(runtimeRoot, 'receipts/vector-runtime-controlled-wiring-design-receipt.v1.json');
  const resolvedStage4kReceiptPath = stage4kReceiptPath || path.resolve(runtimeRoot, 'receipts/vector-runtime-controlled-module-harness-dry-run-receipt.v1.json');
  const resolvedStage4hReceiptPath = stage4hReceiptPath || path.resolve(runtimeRoot, 'receipts/vector-runtime-implementation-poc-dry-run-receipt.v1.json');
  const design = readJson(designPath);
  const stage4mReceipt = readJson(stage4mReceiptPath);
  const stage4lReceipt = readJson(resolvedStage4lReceiptPath);
  const stage4kReceipt = readJson(resolvedStage4kReceiptPath);
  const stage4hReceipt = readJson(resolvedStage4hReceiptPath);
  const continuity = validateDigestContinuity({ stage4mReceipt, stage4lReceipt, stage4kReceipt, stage4hReceipt });
  let gates = {
    design: validateDesign(design, stage4mReceipt),
    continuity: continuity.gates,
  };
  let blockers = flattenBlockers(gates);
  if (blockers.length > 0) {
    const receipt = buildReceipt({ design, stage4mReceipt, gates, blockers, digests: continuity.digests, runAt });
    if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    return receipt;
  }

  const resolvedArtifactPath = artifactPath || path.resolve(runtimeRoot, design.artifact.path);
  const loadedIndex = loadIndexArtifact({
    artifactPath: resolvedArtifactPath,
    expectedIndexDigest: stage4hReceipt.digests?.indexDigest,
    expectedSourceDigest: stage4hReceipt.digests?.sourceDigest,
  });
  const bindGates = [
    gate('artifact_digest_verified', loadedIndex.digests.indexDigest === continuity.digests.stage4hIndexDigest, 'loaded artifact digest must match Stage 4h', loadedIndex.digests),
    gate('source_digest_verified', loadedIndex.digests.sourceDigest === continuity.digests.stage4hSourceDigest, 'loaded source digest must match Stage 4h', loadedIndex.digests),
    gate('binding_not_activated', design.governance.runtimeActivation === false, 'dry-run must not activate runtime binding', design.governance),
  ];
  const queryResults = design.queries.map((query) => {
    const result = queryCandidates({
      loadedIndex,
      query: query.query,
      tenant: query.tenant,
      topK: query.topK,
      minScore: query.minScore,
    });
    const verification = verifyClaimEvidence({ candidates: result.candidates });
    const candidateIds = result.candidates.map((candidate) => candidate.candidateId);
    const hits = query.expectedCandidateIds.filter((id) => candidateIds.includes(id));
    return {
      id: query.id,
      status: hits.length === query.expectedCandidateIds.length && verification.passed ? 'passed' : 'blocked',
      tenant: query.tenant,
      candidateIds,
      expectedCandidateIds: query.expectedCandidateIds,
      hits,
      evidenceVerification: verification,
      decisionTrace: result.decisionTrace,
      candidates: result.candidates,
    };
  });
  const queryGates = [
    gate('tenant_scoped_queries', queryResults.every((result) => result.candidates.every((candidate) => candidate.tenant === result.tenant)), 'all candidates must stay tenant-scoped', { queryCount: queryResults.length }),
    gate('expected_candidates_found', queryResults.every((result) => result.status === 'passed'), 'expected candidates and evidence verification must pass', { queryResults: queryResults.map((result) => ({ id: result.id, status: result.status, hits: result.hits })) }),
    gate('candidates_only', queryResults.every((result) => result.candidates.every((candidate) => !Object.hasOwn(candidate, 'answer'))), 'dry-run must return candidates only', { queryCount: queryResults.length }),
  ];
  gates = {
    design: gates.design,
    continuity: gates.continuity,
    bind: bindGates,
    query: queryGates,
  };
  blockers = flattenBlockers(gates);
  const receipt = buildReceipt({ design, stage4mReceipt, gates, blockers, digests: continuity.digests, loadedIndex, queryResults, runAt });
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeControlledWiringPocDryRun({
    designPath: option('--design') || path.resolve(process.cwd(), 'config/vector-runtime-controlled-wiring-poc-dry-run.v1.json'),
    stage4mReceiptPath: option('--stage4m-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-wiring-poc-review-receipt.v1.json'),
    stage4lReceiptPath: option('--stage4l-receipt'),
    stage4kReceiptPath: option('--stage4k-receipt'),
    stage4hReceiptPath: option('--stage4h-receipt'),
    artifactPath: option('--artifact'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-wiring-poc-dry-run-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime controlled wiring POC dry-run complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime controlled wiring POC dry-run failed: ${error.message}`);
    process.exitCode = 1;
  }
}
