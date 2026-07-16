import { readFileSync } from 'node:fs';
import { admitAndAppendImportPacket } from './import-admission-policy.mjs';
import { createIndexSpikeShadowImport } from './index-spike-shadow-import.mjs';

function requiredArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`${name} <path> is required`);
  return value;
}

export function run() {
  const ledgerPath = requiredArgument('--ledger');
  const sourcePacketPath = requiredArgument('--source-packet');
  const projectUpdate = JSON.parse(readFileSync(sourcePacketPath, 'utf8'));
  const packet = createIndexSpikeShadowImport({ projectUpdate });
  const policy = JSON.parse(readFileSync(new URL('../config/import-admission-policy.v1.json', import.meta.url), 'utf8'));
  const { admission, result } = admitAndAppendImportPacket({ ledgerPath, packet, policy, receivedAt: new Date().toISOString() });
  const effectiveAdmission = result.entry.admission || admission;
  console.log(JSON.stringify({
    mode: 'shadow',
    appended: result.appended,
    sequence: result.entry.sequence,
    projectId: projectUpdate.projectId,
    updateId: projectUpdate.updateId,
    admissionRecorded: Boolean(result.entry.admission),
    retention: effectiveAdmission.retention,
    personalSurfaceEligibility: effectiveAdmission.personalSurfaceEligibility,
    packetDigest: result.entry.packetDigest,
    entryDigest: result.entry.entryDigest,
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`CortexABV Index/spike shadow import failed: ${error.message}`);
    process.exitCode = 1;
  }
}
