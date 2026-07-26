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
  return {
    id,
    status: passed ? 'accepted' : 'blocked',
    reason,
    evidence,
  };
}

function validateDesign(design, stage4jReceipt) {
  requireObject(design, 'design');
  const gates = [
    gate('kind', design.kind === 'CortexABVVectorRuntimeControlledModuleHarnessDryRun', 'design kind must match', { kind: design.kind }),
    gate('version', design.version === 'v1', 'design version must be v1', { version: design.version }),
    gate('authority', design.authority === 'local_dry_run_only', 'design authority must be local_dry_run_only', { authority: design.authority }),
    gate('engine', design.engine === 'turbovec', 'design engine must be turbovec', { engine: design.engine }),
  ];

  requireObject(design.prerequisites, 'prerequisites');
  gates.push(
    gate('stage4j_kind', stage4jReceipt.kind === design.prerequisites.requiredPocReviewReceiptKind, 'Stage 4j receipt kind must match', { kind: stage4jReceipt.kind }),
    gate('stage4j_status', stage4jReceipt.status === design.prerequisites.requiredPocReviewStatus, 'Stage 4j receipt status must be passed', { status: stage4jReceipt.status }),
    gate('stage4j_eligibility', stage4jReceipt.eligibility === design.prerequisites.requiredPocReviewEligibility, 'Stage 4j receipt eligibility must match', { eligibility: stage4jReceipt.eligibility }),
    gate('stage4j_no_blockers', Array.isArray(stage4jReceipt.blockers) && stage4jReceipt.blockers.length === 0, 'Stage 4j receipt must have no blockers', { blockers: stage4jReceipt.blockers }),
    gate('stage4j_digest_required', design.prerequisites.requiresPocReviewReceiptDigest === true, 'Stage 4j receipt digest must be required', design.prerequisites),
  );

  requireObject(design.artifact, 'artifact');
  gates.push(
    gate('artifact_kind', design.artifact.kind === 'CortexABVVectorRuntimeIndexArtifact', 'artifact kind must match', design.artifact),
    gate('artifact_version', design.artifact.version === 'v1', 'artifact version must be v1', design.artifact),
    gate('artifact_read_only', design.artifact.readOnly === true, 'artifact must be read-only', design.artifact),
    gate('artifact_root', design.artifact.root === 'data/vector-indexes/turbovec-poc', 'artifact root must match Stage 4h root', design.artifact),
  );

  requireObject(design.harness, 'harness');
  requireArray(design.harness.functions, 'harness.functions');
  const requiredFunctions = ['loadIndexArtifact', 'queryCandidates', 'verifyClaimEvidence'];
  gates.push(
    gate('harness_path', design.harness.path === 'src/vector-runtime-controlled-module-harness.mjs', 'harness path must match Stage 4j review scope', design.harness),
    gate('local_library_only', design.harness.type === 'local_library_only', 'harness must be local library only', design.harness),
    gate('harness_functions', requiredFunctions.every((fn) => design.harness.functions.includes(fn)), 'harness functions must match Stage 4j review scope', design.harness),
  );

  requireArray(design.queries, 'queries');
  for (const query of design.queries) {
    gates.push(
      gate(`query_${query.id}_tenant`, typeof query.tenant === 'string' && query.tenant.length > 0, 'query must include tenant scope', query),
      gate(`query_${query.id}_threshold`, Number.isFinite(query.minScore) && query.minScore >= 0, 'query must include hard threshold', query),
    );
  }

  requireObject(design.commands, 'commands');
  const allowedCommands = stage4jReceipt.minimumHarnessScope?.allowedDryRunCommands || [];
  for (const [key, command] of Object.entries(design.commands)) {
    gates.push(gate(`command_${key}`, allowedCommands.includes(command) && command.endsWith('_dry_run'), `${key} command must be Stage 4j allowlisted dry-run command`, { command, allowedCommands }));
  }

  requireObject(design.checks, 'checks');
  for (const [key, expected] of Object.entries({
    requiresStage4jReceiptDigest: true,
    requiresArtifactDigest: true,
    requiresSourceDigest: true,
    requiresTenantScope: true,
    requiresHardThreshold: true,
    requiresCandidatesOnly: true,
    requiresEvidenceRefs: true,
  })) {
    gates.push(gate(`check_${key}`, design.checks[key] === expected, `checks.${key} must be ${expected}`, design.checks));
  }

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
    writesOutsideReceipt: false,
    artifactMutation: false,
    sourceMutation: false,
    publicActionAuthority: false,
  })) {
    gates.push(gate(`governance_${key}`, design.governance[key] === expected, `governance.${key} must be ${expected}`, design.governance));
  }

  return gates;
}

function flattenBlockers(gates) {
  return Object.entries(gates)
    .flatMap(([group, groupGates]) => groupGates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
}

function buildReceipt({ design, stage4jReceipt, gates, blockers, loadedIndex, queryResults = [], runAt }) {
  const passed = blockers.length === 0;
  const designDigest = sha256(design);
  const stage4jReceiptDigest = sha256(stage4jReceipt);
  return {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeControlledModuleHarnessDryRunReceipt',
    version: 'v1',
    authority: 'local_dry_run_only',
    status: passed ? 'passed' : 'blocked',
    eligibility: passed ? 'eligible_for_controlled_runtime_wiring_design_review' : 'not_eligible',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'controlled_runtime_module_harness_dry_run',
    engine: design.engine,
    digests: {
      designDigest,
      stage4jReceiptDigest,
      stage4hIndexDigest: loadedIndex?.digests?.indexDigest,
      stage4hSourceDigest: loadedIndex?.digests?.sourceDigest,
      receiptLinkageDigest: sha256({
        designDigest,
        stage4jReceiptDigest,
        stage4hIndexDigest: loadedIndex?.digests?.indexDigest,
        stage4hSourceDigest: loadedIndex?.digests?.sourceDigest,
      }),
    },
    artifact: loadedIndex ? {
      path: design.artifact?.path,
      indexDigest: loadedIndex.digests.indexDigest,
      sourceDigest: loadedIndex.digests.sourceDigest,
      documentCount: loadedIndex.artifact.documentCount,
      readOnly: true,
    } : undefined,
    commandsExecuted: passed ? [
      design.commands.load,
      design.commands.query,
      design.commands.verify,
    ] : [],
    queryResults,
    governance: {
      readOnly: true,
      proposalOnly: true,
      dryRunOnly: true,
      runtimeIntegration: false,
      endpoint: false,
      scheduler: false,
      networkCalls: false,
      llmCalls: false,
      writesOutsideReceipt: false,
      artifactMutation: false,
      sourceMutation: false,
      publicActionAuthority: false,
    },
    gates,
    blockers,
    decisionTrace: {
      policySource: 'controlled_module_harness_dry_run_plus_stage4j_receipt_digest',
      reason: passed
        ? 'Local harness dry-run loaded the Stage 4h artifact read-only, verified Stage 4j digest, queried tenant-scoped candidates and verified evidence refs.'
        : 'Local harness dry-run failed design, digest, tenant, query or evidence gates.',
      nextAllowedStep: passed ? 'controlled_runtime_wiring_design_review' : 'repair_controlled_module_harness_dry_run',
    },
  };
}

export function runVectorRuntimeControlledModuleHarnessDryRun({ designPath, stage4jReceiptPath, stage4hReceiptPath, artifactPath, receiptPath, runAt, runtimeRoot = process.cwd() } = {}) {
  if (!existsSync(designPath)) throw new Error(`harness dry-run design file not found: ${designPath}`);
  if (!existsSync(stage4jReceiptPath)) throw new Error(`Stage 4j receipt file not found: ${stage4jReceiptPath}`);
  const design = readJson(designPath);
  const stage4jReceipt = readJson(stage4jReceiptPath);
  let gates = { design: validateDesign(design, stage4jReceipt) };
  let blockers = flattenBlockers(gates);
  if (blockers.length > 0) {
    const receipt = buildReceipt({ design, stage4jReceipt, gates, blockers, runAt });
    if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    return receipt;
  }

  const resolvedStage4hReceiptPath = stage4hReceiptPath || path.resolve(runtimeRoot, 'receipts/vector-runtime-implementation-poc-dry-run-receipt.v1.json');
  if (!existsSync(resolvedStage4hReceiptPath)) throw new Error(`Stage 4h receipt file not found: ${resolvedStage4hReceiptPath}`);
  const stage4hReceipt = readJson(resolvedStage4hReceiptPath);
  const stage4hReceiptDigest = sha256(stage4hReceipt);
  const resolvedArtifactPath = artifactPath || path.resolve(runtimeRoot, design.artifact.path);
  const expectedIndexDigest = stage4hReceipt.digests?.indexDigest;
  const expectedSourceDigest = stage4hReceipt.digests?.sourceDigest;
  const stage4jReceiptDigest = sha256(stage4jReceipt);
  const loadedIndex = loadIndexArtifact({
    artifactPath: resolvedArtifactPath,
    expectedIndexDigest,
    expectedSourceDigest,
    expectedStage4jReceiptDigest: stage4jReceiptDigest,
    stage4jReceipt,
  });
  const loadGates = [
    gate('stage4j_digest_verified', loadedIndex.digests.stage4jReceiptDigest === stage4jReceiptDigest && stage4jReceiptDigest.length === 64, 'Stage 4j receipt digest must be verified', loadedIndex.digests),
    gate('stage4h_receipt_linked', stage4jReceipt.digests?.stage4hDryRunReceiptDigest === stage4hReceiptDigest, 'Stage 4j receipt must link to the Stage 4h receipt digest', { expected: stage4jReceipt.digests?.stage4hDryRunReceiptDigest, observed: stage4hReceiptDigest }),
    gate('artifact_digest_verified', loadedIndex.digests.indexDigest === expectedIndexDigest, 'artifact digest must match Stage 4h receipt', loadedIndex.digests),
    gate('source_digest_verified', loadedIndex.digests.sourceDigest === expectedSourceDigest, 'source digest must match Stage 4h receipt', loadedIndex.digests),
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
    const hits = (query.expectedCandidateIds || []).filter((id) => candidateIds.includes(id));
    return {
      id: query.id,
      status: hits.length === (query.expectedCandidateIds || []).length && verification.passed ? 'passed' : 'blocked',
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
    gate('candidates_only', queryResults.every((result) => result.candidates.every((candidate) => !Object.hasOwn(candidate, 'answer'))), 'harness must return candidates only', { queryCount: queryResults.length }),
  ];
  gates = {
    design: gates.design,
    load: loadGates,
    query: queryGates,
  };
  blockers = flattenBlockers(gates);
  const receipt = buildReceipt({ design, stage4jReceipt, gates, blockers, loadedIndex, queryResults, runAt });
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeControlledModuleHarnessDryRun({
    designPath: option('--design') || path.resolve(process.cwd(), 'config/vector-runtime-controlled-module-harness-dry-run.v1.json'),
    stage4jReceiptPath: option('--stage4j-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-module-poc-review-receipt.v1.json'),
    stage4hReceiptPath: option('--stage4h-receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-implementation-poc-dry-run-receipt.v1.json'),
    artifactPath: option('--artifact'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-controlled-module-harness-dry-run-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime controlled module harness dry-run complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime controlled module harness dry-run failed: ${error.message}`);
    process.exitCode = 1;
  }
}
