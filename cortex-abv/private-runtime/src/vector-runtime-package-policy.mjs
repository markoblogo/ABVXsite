import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

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
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function requireBoolean(value, label) {
  if (typeof value !== 'boolean') throw new Error(`${label} must be boolean`);
}

function versionTuple(version) {
  return String(version).split('.').map((part) => Number.parseInt(part, 10));
}

function observedPythonVersion() {
  const result = spawnSync('python3', ['--version'], { encoding: 'utf8', timeout: 10000 });
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  const match = output.match(/Python\s+(\d+)\.(\d+)\.(\d+)/);
  if (!match) return undefined;
  return {
    raw: output,
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  };
}

function platformSnapshot() {
  return {
    os: process.platform,
    arch: process.arch,
    node: process.version,
    pythonObserved: observedPythonVersion(),
    host: os.type(),
    release: os.release(),
  };
}

export function validateVectorRuntimePackagePolicy(policy, platform = platformSnapshot()) {
  requireObject(policy, 'policy');
  if (policy.schemaVersion !== 1) throw new Error('package policy schemaVersion must be 1');
  if (policy.kind !== 'CortexABVVectorRuntimePackagePolicy') throw new Error('package policy kind mismatch');
  if (policy.version !== 'v1') throw new Error('package policy version must be v1');
  if (policy.authority !== 'plan_only') throw new Error('package policy authority must be plan_only');
  if (policy.engine !== 'turbovec') throw new Error('package policy engine must be turbovec');

  requireObject(policy.package, 'policy.package');
  if (policy.package.ecosystem !== 'pypi') throw new Error('package ecosystem must be pypi');
  if (policy.package.name !== 'turbovec') throw new Error('package name must be turbovec');
  requireString(policy.package.versionPin, 'package.versionPin');
  if (!/^\d+\.\d+\.\d+$/.test(policy.package.versionPin)) throw new Error('package.versionPin must be an exact semver-like pin');
  if (policy.package.installSpec !== `${policy.package.name}==${policy.package.versionPin}`) {
    throw new Error('package.installSpec must exactly match name==versionPin');
  }

  requireObject(policy.venvPolicy, 'venvPolicy');
  if (policy.venvPolicy.mode !== 'temporary_or_local_only') throw new Error('venvPolicy.mode must be temporary_or_local_only');
  requireString(policy.venvPolicy.temporaryPrefix, 'venvPolicy.temporaryPrefix');
  requireBoolean(policy.venvPolicy.allowProjectCommittedVenv, 'venvPolicy.allowProjectCommittedVenv');
  requireBoolean(policy.venvPolicy.allowGlobalSitePackages, 'venvPolicy.allowGlobalSitePackages');
  requireBoolean(policy.venvPolicy.allowInstallWithoutExplicitFlag, 'venvPolicy.allowInstallWithoutExplicitFlag');
  requireBoolean(policy.venvPolicy.allowNetworkDuringInstallOnly, 'venvPolicy.allowNetworkDuringInstallOnly');
  if (policy.venvPolicy.allowProjectCommittedVenv !== false) throw new Error('project-committed venv is forbidden');
  if (policy.venvPolicy.allowGlobalSitePackages !== false) throw new Error('global site-packages are forbidden');
  if (policy.venvPolicy.allowInstallWithoutExplicitFlag !== false) throw new Error('install without explicit flag is forbidden');

  requireObject(policy.platformConstraints, 'platformConstraints');
  if (!Array.isArray(policy.platformConstraints.os) || !policy.platformConstraints.os.includes(platform.os)) {
    throw new Error(`unsupported platform os: ${platform.os}`);
  }
  if (!Array.isArray(policy.platformConstraints.arch) || !policy.platformConstraints.arch.includes(platform.arch)) {
    throw new Error(`unsupported platform arch: ${platform.arch}`);
  }
  requireObject(policy.platformConstraints.python, 'platformConstraints.python');
  const python = policy.platformConstraints.python;
  for (const key of ['minMajor', 'minMinor', 'maxMajor', 'maxMinor']) {
    if (!Number.isInteger(python[key])) throw new Error(`platformConstraints.python.${key} must be an integer`);
  }
  if (platform.pythonObserved) {
    const observed = platform.pythonObserved;
    const aboveMin = observed.major > python.minMajor || (observed.major === python.minMajor && observed.minor >= python.minMinor);
    const belowMax = observed.major < python.maxMajor || (observed.major === python.maxMajor && observed.minor <= python.maxMinor);
    if (!aboveMin || !belowMax) {
      throw new Error(`unsupported python version: ${observed.raw || `${observed.major}.${observed.minor}.${observed.patch}`}`);
    }
  }

  requireObject(policy.reproducibility, 'reproducibility');
  if (policy.reproducibility.receiptRequired !== true) throw new Error('reproducibility.receiptRequired must be true');
  if (!Array.isArray(policy.reproducibility.requiredReceiptFields) || policy.reproducibility.requiredReceiptFields.length === 0) {
    throw new Error('reproducibility.requiredReceiptFields must be non-empty');
  }
  if (policy.reproducibility.dependencyProbeMustUsePolicy !== true) throw new Error('dependencyProbeMustUsePolicy must be true');

  requireObject(policy.governance, 'governance');
  for (const [key, expected] of Object.entries({
    readOnly: true,
    proposalOnly: true,
    runtimeIntegration: false,
    endpoint: false,
    llmCalls: false,
    writesOutsideReceipt: false,
    publicActionAuthority: false,
  })) {
    if (policy.governance[key] !== expected) throw new Error(`governance.${key} must be ${expected}`);
  }

  const [major, minor] = versionTuple(policy.package.versionPin);
  return {
    packageSpec: policy.package.installSpec,
    versionMajor: major,
    versionMinor: minor,
    policyDigest: sha256(policy),
    platform,
  };
}

export function runVectorRuntimePackagePolicyGate({ policyPath, receiptPath, runAt, platform } = {}) {
  if (!existsSync(policyPath)) throw new Error(`policy file not found: ${policyPath}`);
  const policy = readJson(policyPath);
  const validation = validateVectorRuntimePackagePolicy(policy, platform || platformSnapshot());
  const receipt = {
    schemaVersion: 1,
    kind: 'CortexABVVectorRuntimePackagePolicyReceipt',
    version: 'v1',
    authority: 'plan_only',
    status: 'passed',
    runAt: runAt ? new Date(runAt).toISOString() : new Date().toISOString(),
    mode: 'package_policy_gate',
    engine: policy.engine,
    policyDigest: validation.policyDigest,
    package: policy.package,
    platform: validation.platform,
    venvPolicy: policy.venvPolicy,
    governance: policy.governance,
    acceptance: {
      packagePin: {
        status: 'accepted',
        required: ['PyPI ecosystem', 'exact version pin', 'installSpec equals name==versionPin'],
      },
      venvPolicy: {
        status: 'accepted',
        required: ['temporary/local only', 'no committed venv', 'no global site-packages', 'install requires explicit flag'],
      },
      platform: {
        status: 'accepted',
        required: ['current os allowed', 'current arch allowed', 'python bounds declared'],
      },
      reproducibility: {
        status: 'accepted',
        required: policy.reproducibility.requiredReceiptFields,
      },
    },
    review: {
      pendingReview: true,
      approvalMeaning: 'Approve only the package supply policy for future private-runtime probes; not runtime integration or public retrieval.',
      requiredFields: policy.reproducibility.requiredReceiptFields,
    },
  };
  if (receiptPath) writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function run() {
  const receipt = runVectorRuntimePackagePolicyGate({
    policyPath: option('--policy') || path.resolve(process.cwd(), 'config/vector-runtime-package-policy.v1.json'),
    receiptPath: option('--receipt') || path.resolve(process.cwd(), 'receipts/vector-runtime-package-policy-receipt.v1.json'),
    runAt: option('--run-at'),
  });
  console.log(`Vector runtime package policy gate complete: status=${receipt.status}, package=${receipt.package.installSpec}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`Vector runtime package policy gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
