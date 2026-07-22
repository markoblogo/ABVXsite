import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, join, relative, resolve } from 'node:path';

const TOKEN_PATTERNS = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
];

function listEntries(root, directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listEntries(root, path);
    return [{ path, kind: entry.isFile() ? 'file' : 'unsupported' }];
  });
}

function violationForPath(relativePath) {
  const filename = basename(relativePath);
  if (relativePath.startsWith('data/vector-indexes/')) return null;
  if (relativePath.startsWith('data/')) return 'data_store_path';
  if (filename === '.env' || filename.startsWith('.env.')) return 'environment_file';
  if (/(^|\/)([^/]+\.(?:pem|key|jsonl))$/i.test(relativePath)) return 'sensitive_file_extension';
  if (/^(id_rsa|id_ed25519)(?:\..+)?$/i.test(filename)) return 'private_key_filename';
  return null;
}

export function scanCortexAbvPrivateRuntimeExport({ runtimeRoot = new URL('../cortex-abv/private-runtime/', import.meta.url) } = {}) {
  const root = resolve(typeof runtimeRoot === 'string' ? runtimeRoot : fileURLToPath(runtimeRoot));
  const violations = [];
  const entries = listEntries(root);
  for (const entry of entries) {
    const relativePath = relative(root, entry.path);
    if (entry.kind !== 'file') {
      violations.push({ path: relativePath, rule: 'unsupported_filesystem_entry' });
      continue;
    }
    const pathViolation = violationForPath(relativePath);
    if (pathViolation) violations.push({ path: relativePath, rule: pathViolation });
    const contents = readFileSync(entry.path, 'utf8');
    if (TOKEN_PATTERNS.some((pattern) => pattern.test(contents))) violations.push({ path: relativePath, rule: 'token_like_value' });
  }
  return { safe: violations.length === 0, fileCount: entries.length, violations };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = scanCortexAbvPrivateRuntimeExport();
  console.log(JSON.stringify({
    status: report.safe ? 'safe' : 'blocked',
    fileCount: report.fileCount,
    violations: report.violations,
  }, null, 2));
  if (!report.safe) process.exitCode = 1;
}
