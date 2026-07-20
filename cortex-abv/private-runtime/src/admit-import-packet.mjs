import { readFileSync } from 'node:fs';
import { admitAndAppendImportPacket } from './import-admission-policy.mjs';

function requiredArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`${name} <path> is required`);
  return value;
}

export function run() {
  const ledgerPath = requiredArgument('--ledger');
  const packetPath = requiredArgument('--packet');
  const policyPath = process.argv.includes('--policy') ? requiredArgument('--policy') : new URL('../config/import-admission-policy.v1.json', import.meta.url);
  const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
  const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  const { admission, result } = admitAndAppendImportPacket({ ledgerPath, packet, policy, receivedAt: new Date().toISOString() });
  console.log(JSON.stringify({
    appended: result.appended,
    sequence: result.entry.sequence,
    packetId: result.entry.packet.packetId,
    decisionTrace: admission.decisionTrace,
    retention: admission.retention,
    personalSurfaceEligibility: admission.personalSurfaceEligibility,
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`CortexABV import admission failed: ${error.message}`);
    process.exitCode = 1;
  }
}
