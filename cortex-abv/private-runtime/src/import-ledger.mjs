import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const permittedUses = new Set(['private_context', 'personal_surface_proposal_preparation']);

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function validateSource(source) {
  if (!source || typeof source !== 'object') throw new Error('packet.source is required');
  if (source.kind === 'base_cortex') {
    if (source.id !== 'base-cortex') throw new Error('base_cortex source id must be base-cortex');
    return;
  }
  if (source.kind !== 'owned_project_ecosystem') throw new Error('packet.source.kind must be base_cortex or owned_project_ecosystem');
  if (!/^(monitor|cropto|index(?:\/[a-z0-9._-]+)?)$/i.test(source.id || '')) {
    throw new Error('packet.source.id is not an approved owned project ecosystem');
  }
}

export function validateImportPacket(packet) {
  if (packet?.schemaVersion !== 1 || packet?.kind !== 'CortexABVImportPacket') {
    throw new Error('packet must be CortexABVImportPacket v1');
  }
  nonEmptyString(packet.packetId, 'packet.packetId');
  if (packet.direction !== 'inbound_to_cortex_abv') throw new Error('packet.direction must be inbound_to_cortex_abv');
  validateSource(packet.source);
  if (!['public', 'protected'].includes(packet.classification)) throw new Error('packet.classification must be public or protected');
  nonEmptyString(packet.dataKind, 'packet.dataKind');
  nonEmptyString(packet.observedAt, 'packet.observedAt');
  if (!Array.isArray(packet.provenance) || !packet.provenance.length) throw new Error('packet.provenance must be a non-empty array');
  for (const item of packet.provenance) {
    nonEmptyString(item?.kind, 'packet.provenance.kind');
    nonEmptyString(item?.ref, 'packet.provenance.ref');
    if (!/^[a-f0-9]{64}$/i.test(item?.digest || '')) throw new Error('packet.provenance.digest must be a SHA-256 digest');
  }
  if (!Array.isArray(packet.permittedUse) || !packet.permittedUse.length || !packet.permittedUse.every((use) => permittedUses.has(use))) {
    throw new Error('packet.permittedUse contains an unsupported use');
  }
  if (packet.returnAuthority !== 'none') throw new Error('packet.returnAuthority must be none');
  if (!packet.payload || typeof packet.payload !== 'object' || Array.isArray(packet.payload)) throw new Error('packet.payload must be an object');
  try {
    stableJson(packet.payload);
  } catch {
    throw new Error('packet.payload must be JSON serializable');
  }
  return packet;
}

function entryMaterial(entry) {
  const { entryDigest, ...material } = entry;
  return material;
}

export function readImportLedger(ledgerPath) {
  if (!existsSync(ledgerPath)) return [];
  const lines = readFileSync(ledgerPath, 'utf8').trim().split('\n').filter(Boolean);
  let previousEntryDigest = null;
  return lines.map((line, index) => {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      throw new Error(`ledger line ${index + 1} is not valid JSON`);
    }
    if (entry?.kind !== 'CortexABVImportLedgerEntry' || entry.sequence !== index + 1) throw new Error(`ledger line ${index + 1} is malformed`);
    if (entry.previousEntryDigest !== previousEntryDigest) throw new Error(`ledger line ${index + 1} breaks the hash chain`);
    if (entry.entryDigest !== digest(entryMaterial(entry))) throw new Error(`ledger line ${index + 1} has an invalid entry digest`);
    previousEntryDigest = entry.entryDigest;
    return entry;
  });
}

export function appendImportPacket({ ledgerPath, packet, admission, receivedAt }) {
  validateImportPacket(packet);
  const entries = readImportLedger(ledgerPath);
  const packetDigest = digest(packet);
  if (admission && (admission.kind !== 'CortexABVImportAdmissionReceipt' || admission.status !== 'admitted' || admission.packetDigest !== packetDigest)) {
    throw new Error('admission receipt does not authorize this packet');
  }
  const existing = entries.find((entry) => entry.packetDigest === packetDigest);
  if (existing) return { appended: false, entry: existing };
  const entry = {
    schemaVersion: 1,
    kind: 'CortexABVImportLedgerEntry',
    sequence: entries.length + 1,
    receivedAt: nonEmptyString(receivedAt, 'receivedAt'),
    packetDigest,
    previousEntryDigest: entries.at(-1)?.entryDigest || null,
    packet,
    ...(admission ? { admission } : {}),
  };
  entry.entryDigest = digest(entry);
  mkdirSync(path.dirname(ledgerPath), { recursive: true });
  appendFileSync(ledgerPath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8' });
  return { appended: true, entry };
}
