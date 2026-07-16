import { readFileSync } from 'node:fs';
import { appendImportPacket } from './import-ledger.mjs';

function requiredArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`${name} <path> is required`);
  return value;
}

export function run() {
  const ledgerPath = requiredArgument('--ledger');
  const packetPath = requiredArgument('--packet');
  const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
  const result = appendImportPacket({ ledgerPath, packet, receivedAt: new Date().toISOString() });
  console.log(JSON.stringify({
    appended: result.appended,
    sequence: result.entry.sequence,
    packetId: result.entry.packet.packetId,
    packetDigest: result.entry.packetDigest,
    entryDigest: result.entry.entryDigest,
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    run();
  } catch (error) {
    console.error(`CortexABV private import failed: ${error.message}`);
    process.exitCode = 1;
  }
}
