import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runVectorRuntimeControlledWiringPocDryRun } from '../src/vector-runtime-controlled-wiring-poc-dry-run.mjs';

const designPath = path.join(import.meta.dirname, '../config/vector-runtime-controlled-wiring-poc-dry-run.v1.json');
const stage4mReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-controlled-wiring-poc-review-receipt.v1.json');
const stage4lReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-controlled-wiring-design-receipt.v1.json');
const stage4kReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-controlled-module-harness-dry-run-receipt.v1.json');
const stage4hReceiptPath = path.join(import.meta.dirname, '../receipts/vector-runtime-implementation-poc-dry-run-receipt.v1.json');
const artifactPath = path.join(import.meta.dirname, '../data/vector-indexes/turbovec-poc/index-artifact.v1.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeTempJson(sourcePath, mutator) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-wiring-poc-dry-run-'));
  const target = path.join(tmpDir, path.basename(sourcePath));
  writeFileSync(target, `${JSON.stringify(mutator(readJson(sourcePath)), null, 2)}\n`);
  return target;
}

function runWith(overrides = {}) {
  return runVectorRuntimeControlledWiringPocDryRun({
    designPath,
    stage4mReceiptPath,
    stage4lReceiptPath,
    stage4kReceiptPath,
    stage4hReceiptPath,
    artifactPath,
    runAt: '2026-07-26T13:00:00.000Z',
    ...overrides,
  });
}

test('runs controlled wiring POC dry-run locally without endpoint, network, LLM or activation authority', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'cortexabv-wiring-poc-dry-run-'));
  const receiptPath = path.join(tmpDir, 'vector-runtime-controlled-wiring-poc-dry-run-receipt.v1.json');
  const receipt = runWith({ receiptPath });
  const persisted = readJson(receiptPath);

  assert.equal(receipt.kind, 'CortexABVVectorRuntimeControlledWiringPocDryRunReceipt');
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.eligibility, 'eligible_for_controlled_runtime_wiring_review');
  assert.equal(receipt.governance.runtimeIntegration, false);
  assert.equal(receipt.governance.runtimeActivation, false);
  assert.equal(receipt.governance.endpoint, false);
  assert.equal(receipt.governance.networkCalls, false);
  assert.equal(receipt.governance.llmCalls, false);
  assert.equal(receipt.commandsExecuted.length, 4);
  assert.equal(receipt.queryResults.every((result) => result.status === 'passed'), true);
  assert.equal(receipt.queryResults.every((result) => result.decisionTrace.candidatesOnly === true), true);
  assert.equal(receipt.blockers.length, 0);
  assert.equal(persisted.digests.stage4mReceiptDigest, receipt.digests.stage4mReceiptDigest);
});

test('blocks controlled wiring POC dry-run when Stage 4m receipt is not eligible', () => {
  const badStage4mReceiptPath = writeTempJson(stage4mReceiptPath, (receipt) => ({
    ...receipt,
    status: 'blocked',
    eligibility: 'not_eligible',
    blockers: [{ group: 'review', id: 'no_endpoint', status: 'blocked' }],
  }));

  const receipt = runWith({ stage4mReceiptPath: badStage4mReceiptPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'stage4m_eligibility'), true);
});

test('blocks controlled wiring POC dry-run when activation or endpoint is introduced', () => {
  const badDesignPath = writeTempJson(designPath, (design) => ({
    ...design,
    governance: {
      ...design.governance,
      runtimeActivation: true,
      endpoint: true,
    },
    binding: {
      ...design.binding,
      answerGeneration: true,
    },
  }));

  const receipt = runWith({ designPath: badDesignPath });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.eligibility, 'not_eligible');
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'governance_runtimeActivation'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'governance_endpoint'), true);
  assert.equal(receipt.blockers.some((blocker) => blocker.group === 'design' && blocker.id === 'no_answer_generation'), true);
});
