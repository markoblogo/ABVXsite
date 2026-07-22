import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

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

function requireReceipt(filePath) {
  if (!existsSync(filePath)) throw new Error(`receipt file not found: ${filePath}`);
  return readJson(filePath);
}

function accepted(value) {
  return value && value.status === 'accepted';
}

function booleanGate(value, expected) {
  return value === expected;
}

function gate(id, passed, reason, evidence = {}) {
  return {
    id,
    status: passed ? 'accepted' : 'blocked',
    reason,
    evidence,
  };
}

function allAccepted(gates) {
  return gates.every((item) => item.status === 'accepted');
}

function validatePackagePolicyReceipt(receipt) {
  const gates = [
    gate('kind', receipt.kind === 'CortexABVVectorRuntimePackagePolicyReceipt', 'package policy receipt kind must match', { kind: receipt.kind }),
    gate('status', receipt.status === 'passed', 'package policy receipt must be passed', { status: receipt.status }),
    gate('package_pin', receipt.package?.installSpec === 'turbovec==0.8.0', 'package install spec must be pinned', { installSpec: receipt.package?.installSpec }),
    gate('package_pin_acceptance', accepted(receipt.acceptance?.packagePin), 'package pin acceptance must be accepted', receipt.acceptance?.packagePin),
    gate('venv_policy_acceptance', accepted(receipt.acceptance?.venvPolicy), 'venv policy acceptance must be accepted', receipt.acceptance?.venvPolicy),
    gate('platform_acceptance', accepted(receipt.acceptance?.platform), 'platform acceptance must be accepted', receipt.acceptance?.platform),
    gate('reproducibility_acceptance', accepted(receipt.acceptance?.reproducibility), 'reproducibility acceptance must be accepted', receipt.acceptance?.reproducibility),
    gate('governance_read_only', booleanGate(receipt.governance?.readOnly, true), 'package policy must remain read-only', receipt.governance),
    gate('governance_proposal_only', booleanGate(receipt.governance?.proposalOnly, true), 'package policy must remain proposal-only', receipt.governance),
    gate('governance_no_runtime', booleanGate(receipt.governance?.runtimeIntegration, false), 'package policy must not approve runtime integration', receipt.governance),
    gate('governance_no_public_action', booleanGate(receipt.governance?.publicActionAuthority, false), 'package policy must not approve public actions', receipt.governance),
  ];
  return gates;
}

function validateDependencyProbeReceipt(receipt, packagePolicyReceipt) {
  const expectedDigest = packagePolicyReceipt.policyDigest;
  const gates = [
    gate('kind', receipt.kind === 'CortexABVVectorRuntimeDependencyProbeReceipt', 'dependency probe receipt kind must match', { kind: receipt.kind }),
    gate('status', receipt.status === 'passed', 'dependency probe receipt must be passed', { status: receipt.status }),
    gate('package_policy_digest', receipt.packagePolicy?.policyDigest === expectedDigest, 'dependency probe must reference current package policy digest', {
      expectedDigest,
      actualDigest: receipt.packagePolicy?.policyDigest,
    }),
    gate('package_install_spec', receipt.package === packagePolicyReceipt.package?.installSpec, 'dependency package must match package policy installSpec', {
      package: receipt.package,
      installSpec: packagePolicyReceipt.package?.installSpec,
    }),
    gate('index_build', accepted(receipt.acceptance?.indexBuild), 'dependency probe index build must be accepted', receipt.acceptance?.indexBuild),
    gate('query', accepted(receipt.acceptance?.query), 'dependency probe query must be accepted', receipt.acceptance?.query),
    gate('recall', Number(receipt.metrics?.recallAtK) >= Number(receipt.metrics?.minRecallAtK || 1), 'dependency probe recall must meet threshold', receipt.metrics),
    gate('passed_all_probes', receipt.metrics?.passedAllProbes === true, 'dependency probe must pass all probes', receipt.metrics),
    gate('governance_read_only', booleanGate(receipt.governance?.readOnly, true), 'dependency probe must remain read-only', receipt.governance),
    gate('governance_proposal_only', booleanGate(receipt.governance?.proposalOnly, true), 'dependency probe must remain proposal-only', receipt.governance),
    gate('governance_no_endpoint', booleanGate(receipt.governance?.endpoint, false), 'dependency probe must not approve endpoints', receipt.governance),
    gate('governance_no_public_action', booleanGate(receipt.governance?.publicActionAuthority, false), 'dependency probe must not approve public actions', receipt.governance),
  ];
  return gates;
}

function validateReadinessReceipt(receipt) {
  const gates = [
    gate('kind', receipt.kind === 'CortexABVVectorRuntimeReadinessReceipt', 'readiness receipt kind must match', { kind: receipt.kind }),
    gate('status', receipt.status === 'passed', 'readiness receipt must be passed', { status: receipt.status }),
    gate('recall', Number(receipt.metrics?.recallAtK) >= Number(receipt.metrics?.minRecallAtK || 1), 'readiness recall must meet threshold', receipt.metrics),
    gate('evidence_coverage', Number(receipt.metrics?.evidenceCoverage) >= 1, 'readiness evidence coverage must be complete', receipt.metrics),
    gate('fallback_applied', receipt.decisionTrace?.index?.fallbackApplied === true, 'readiness receipt must still be fallback-only before runtime integration', receipt.decisionTrace?.index),
    gate('runtime_not_ready', receipt.decisionTrace?.index?.runtimeReady === false, 'readiness receipt must not claim runtime is active', receipt.decisionTrace?.index),
    gate('no_missing_evidence', Array.isArray(receipt.decisionTrace?.missingEvidence) && receipt.decisionTrace.missingEvidence.length === 0, 'readiness receipt must have no missing evidence', {
      missingEvidence: receipt.decisionTrace?.missingEvidence,
    }),
  ];
  return gates;
}

function validateSyntheticRetrievalReceipt(receipt) {
  const gates = [
    gate('kind', receipt.kind === 'CortexABVVectorRetrievalShadowReceipt', 'synthetic retrieval receipt kind must match', { kind: receipt.kind }),
    gate('status', receipt.status === 'passed', 'synthetic retrieval receipt must be passed', { status: receipt.status }),
    gate('recall', Number(receipt.metrics?.recallAtK) >= Number(receipt.metrics?.minRecallAtK || 1), 'synthetic retrieval recall must meet threshold', receipt.metrics),
    gate('evidence_coverage', Number(receipt.metrics?.evidenceCoverage) >= 1, 'synthetic retrieval evidence coverage must be complete', receipt.metrics),
    gate('passed_all_probes', receipt.metrics?.passedAllProbes === true, 'synthetic retrieval must pass all probes', receipt.metrics),
    gate('no_missing_evidence', Array.isArray(receipt.decisionTrace?.missingEvidence) && receipt.decisionTrace.missingEvidence.length === 0, 'synthetic retrieval must have no missing evidence', {
      missingEvidence: receipt.decisionTrace?.missingEvidence,
    }),
    gate('no_public_action', receipt.decisionTrace?.safety?.publicActionAuthority === false, 'synthetic retrieval must not grant public action authority', receipt.decisionTrace?.safety),
  ];
  return gates;
}

export function runVectorRuntimeIntegrationPreflight({
  packagePolicyReceiptPath,
  dependencyProbeReceiptPath,
  readinessReceiptPath,
  syntheticRetrievalReceiptPath,
  receiptPath,
  runAt,
} = {}) {
  const packagePolicy = requireReceipt(packagePolicyReceiptPath);
  const dependencyProbe = requireReceipt(dependencyProbeReceiptPath);
  const readiness = requireReceipt(readinessReceiptPath);
  const syntheticRetrieval = requireReceipt(syntheticRetrievalReceiptPath);

  const sources = {
    packagePolicy: { path: packagePolicyReceiptPath, digest: sha256(packagePolicy), kind: packagePolicy.kind, status: packagePolicy.status },
    dependencyProbe: { path: dependencyProbeReceiptPath, digest: sha256(dependencyProbe), kind: dependencyProbe.kind, status: dependencyProbe.status },
    readiness: { path: readinessReceiptPath, digest: sha256(readiness), kind: readiness.kind, status: readiness.status },
    syntheticRetrieval: { path: syntheticRetrievalReceiptPath, digest: sha256(syntheticRetrieval), kind: syntheticRetrieval.kind, status: syntheticRetrieval.status },
  };

  const gateGroups = {
    packagePolicy: validatePackagePolicyReceipt(packagePolicy),
    dependencyProbe: validateDependencyProbeReceipt(dependencyProbe, packagePolicy),
    readiness: validateReadinessReceipt(readiness),
    syntheticRetrieval: validateSyntheticRetrievalReceipt(syntheticRetrieval),
  };
  const blockers = Object.entries(gateGroups)
    .flatMap(([group, gates]) => gates.filter((item) => item.status !== 'accepted').map((item) => ({ group, ...item })));
  const eligible = blockers.length === 0;
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimeIntegrationPreflightReceipt',
    version: 'v1',
    authority: 'plan_only',
    status: eligible ? 'passed' : 'blocked',
    eligibility: eligible ? 'eligible_for_design_review' : 'not_eligible_for_design_review',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'runtime_integration_preflight',
    engine: 'turbovec',
    governance: {
      runtimeIntegration: false,
      designReviewOnly: true,
      readOnly: true,
      proposalOnly: true,
      endpoint: false,
      llmCalls: false,
      writesOutsideReceipt: false,
      publicActionAuthority: false,
    },
    sources,
    gates: gateGroups,
    blockers,
    decisionTrace: {
      policySource: 'aggregated_receipts',
      reason: eligible
        ? 'All package, dependency, readiness and synthetic retrieval gates passed; eligible only for design review of future runtime wiring.'
        : 'One or more package, dependency, readiness or synthetic retrieval gates blocked; not eligible for runtime wiring design review.',
      requiredReceipts: Object.keys(sources),
      packagePolicyDigest: packagePolicy.policyDigest,
      dependencyPolicyDigest: dependencyProbe.packagePolicy?.policyDigest,
    },
    review: {
      pendingReview: eligible,
      approvalMeaning: 'Approve only entry into design review for real runtime wiring. This does not approve implementation, deployment, endpoints, retrieval activation, writes, model calls or public actions.',
      requiredFields: ['eligibility', 'governance', 'sources', 'gates', 'blockers', 'decisionTrace'],
    },
  };

  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimeIntegrationPreflight({
    packagePolicyReceiptPath: option('--package-policy') || path.resolve(process.cwd(), 'receipts/vector-runtime-package-policy-receipt.v1.json'),
    dependencyProbeReceiptPath: option('--dependency-probe') || path.resolve(process.cwd(), 'receipts/vector-runtime-dependency-probe-receipt.v1.json'),
    readinessReceiptPath: option('--readiness') || path.resolve(process.cwd(), 'receipts/vector-runtime-readiness-receipt.v1.json'),
    syntheticRetrievalReceiptPath: option('--synthetic-retrieval') || path.resolve(process.cwd(), 'receipts/vector-retrieval-turbovec-shadow-receipt.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-integration-preflight-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime integration preflight complete: status=${receipt.status}, eligibility=${receipt.eligibility}, blockers=${receipt.blockers.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime integration preflight failed: ${error.message}`);
    process.exitCode = 1;
  }
}
