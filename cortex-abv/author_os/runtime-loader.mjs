import { readFileSync, accessSync, constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_AUTHOR_OS_ROOT = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_CACHE = new Map();

const REQUIRED_CORE_KEYS = ['name', 'version', 'core_files', 'domain_overrides'];
const REQUIRED_CORE_FIELDS = [
  'AUTHOR_OS.md',
  'THINKING.md',
  'VALUES.md',
  'VOICE.md',
  'WRITING.md',
  'RHETORIC.md',
  'READER_EFFECT.md',
  'ENGLISH_STYLE.md',
  'ANTI_PATTERNS.md',
];
const EVIDENCE_PRIVACY = new Set(['public', 'protected', 'private']);
const RULE_STATUS = new Set(['active', 'deprecated']);
const STABILITY_LEVELS = ['CORE', 'STABLE', 'EXPERIMENTAL', 'DEPRECATED'];
const ALLOWED_STABILITY = new Set(['CORE', 'STABLE', 'EXPERIMENTAL', 'DEPRECATED']);

function resolveAllowedDomains(manifest) {
  if (!manifest || !Array.isArray(manifest.domain_overrides)) return new Set(['general']);
  return new Set(['general', ...manifest.domain_overrides.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)]);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function normalizeLines(value) {
  return String(value || '').trimEnd();
}

function asString(value, fieldName) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) throw new Error(`${fieldName} must be a non-empty string`);
  return normalized;
}

function sanitizeSourcePath(value) {
  const normalized = asString(value, 'source path');
  return /^https?:\/\//.test(normalized) ? normalized : '[redacted-source-path]';
}

function validateEvidenceReference(entry, ruleId, index = 0) {
  if (!entry || typeof entry !== 'object') {
    throw new Error(`rules.json: evidence_refs[${index}] for ${ruleId} must be object`);
  }
  const sourceRepository = asString(entry.sourceRepository, `rules.json: evidence_refs[${index}].sourceRepository for ${ruleId}`);
  const document = sanitizeSourcePath(asString(entry.document || entry.sourceDocument, `rules.json: evidence_refs[${index}].document for ${ruleId}`));
  const stableItemId = asString(entry.stableItemId || entry.itemId, `rules.json: evidence_refs[${index}].stableItemId for ${ruleId}`);
  const contentType = asString(entry.contentType || 'markdown', `rules.json: evidence_refs[${index}].contentType for ${ruleId}`);
  const timestamp = asString(entry.timestamp, `rules.json: evidence_refs[${index}].timestamp for ${ruleId}`);
  const revision = asString(entry.revision, `rules.json: evidence_refs[${index}].revision for ${ruleId}`);
  const privacy = asString(entry.privacy || entry.privacyClassification, `rules.json: evidence_refs[${index}].privacy for ${ruleId}`);
  if (!EVIDENCE_PRIVACY.has(privacy)) {
    throw new Error(`rules.json: evidence_refs[${index}].privacy for ${ruleId} must be one of public|protected|private`);
  }
  return {
    sourceRepository,
    document,
    stableItemId,
    contentType,
    timestamp,
    revision,
    privacy,
  };
}

function ensureReadable(filePath) {
  try {
    accessSync(filePath, constants.R_OK);
  } catch {
    throw new Error(`required author_os file is not readable: ${filePath}`);
  }
}

function validateManifest(manifest) {
  for (const key of REQUIRED_CORE_KEYS) {
    if (!(key in manifest)) throw new Error(`author_os manifest missing required key: ${key}`);
  }
  if (!Array.isArray(manifest.core_files) || manifest.core_files.length < 1) {
    throw new Error('author_os manifest core_files must be a non-empty array');
  }
  if (!manifest.core_files.every((value) => typeof value === 'string' && value.trim())) {
    throw new Error('author_os manifest core_files must be non-empty strings');
  }
  if (!Array.isArray(manifest.domain_overrides) || manifest.domain_overrides.some((value) => typeof value !== 'string')) {
    throw new Error('author_os manifest domain_overrides must be an array of strings');
  }
  if (!manifest.core_files.every((value) => REQUIRED_CORE_FIELDS.includes(value))) {
    throw new Error(`author_os manifest contains unsupported core file set: expected ${REQUIRED_CORE_FIELDS.join(', ')}`);
  }
}

function validateVersion(version) {
  if (typeof version !== 'string' || !version.trim()) {
    throw new Error('author_os manifest.version must be a non-empty string');
  }
}

function readManifest(authorOsRoot) {
  const manifestPath = path.join(authorOsRoot, 'manifest.json');
  const manifest = readJson(manifestPath);
  validateManifest(manifest);
  validateVersion(manifest.version);
  return manifest;
}

function normalizeRequestedDomain(value) {
  if (typeof value !== 'string') return 'general';
  const normalized = value.trim().toLowerCase();
  return normalized || 'general';
}

function readAllowedDomains(manifest) {
  return resolveAllowedDomains(manifest);
}

export function resolveAuthorOsDomain(rawDomain, manifest = {}) {
  const requested = normalizeRequestedDomain(rawDomain);
  const allowed = readAllowedDomains(manifest);
  if (!allowed.has(requested)) {
    const sorted = Array.from(allowed).sort();
    throw new Error(`unsupported AUTHOR_OS domain '${requested}'. Supported domains: ${sorted.join(', ')}`);
  }
  return requested;
}

function normalizeRuleStability(value) {
  if (!ALLOWED_STABILITY.has(value)) throw new Error(`author_os rule stability must be one of ${STABILITY_LEVELS.join('|')}`);
  return value;
}

function asStringArray(value, fieldName) {
  if (!Array.isArray(value) || !value.length) return [];
  return value
    .map((entry) => {
      if (typeof entry !== 'string') throw new Error(`${fieldName} must contain non-empty strings`);
      const normalized = entry.trim();
      if (!normalized) throw new Error(`${fieldName} must contain non-empty strings`);
      return normalized;
    });
}

function getMarkdownSections(fileText) {
  const headings = new Set();
  for (const line of fileText.split('\n')) {
    const match = /^(#{1,6})\s+(.*)$/.exec(line);
    if (!match) continue;
    const title = match[2].trim();
    if (title) headings.add(title);
  }
  return headings;
}

function validateRule(rule, registryPath) {
  const id = asString(rule?.id, `${registryPath}: rule.id`);
  const file = asString(rule?.file, `${registryPath}[${id}]: rule.file`);
  const section = asString(rule?.section, `${registryPath}[${id}]: rule.section`);
  const stability = normalizeRuleStability(asString(rule?.stability, `${registryPath}[${id}]: rule.stability`));
  const status = asString(rule?.status, `${registryPath}[${id}]: rule.status`);
  if (!RULE_STATUS.has(status)) throw new Error(`${registryPath}[${id}]: rule.status must be one of active|deprecated`);
  const runtimeEnabled = rule?.runtime_enabled === true;
  const conflicts = asStringArray(rule?.conflicts, `${registryPath}[${id}]: rule.conflicts`);
  const evidenceRefs = Array.isArray(rule?.evidence_refs)
    ? rule.evidence_refs.map((entry, index) => validateEvidenceReference(entry, id, index))
    : [];
  if (!evidenceRefs.length) {
    throw new Error(`${registryPath}[${id}]: rule.evidence_refs must contain at least one evidence reference`);
  }
  const introducedIn = asString(rule?.introduced_in, `${registryPath}[${id}]: rule.introduced_in`);

  return {
    id,
    title: asString(rule?.title, `${registryPath}[${id}]: rule.title`),
    file,
    section,
    stability,
    scope: asString(rule?.scope, `${registryPath}[${id}]: rule.scope`) || 'global',
    domains: asStringArray(rule?.domains, `${registryPath}[${id}]: rule.domains`),
    status,
    conflicts,
    replacement: typeof rule?.replacement === 'string' ? rule.replacement.trim() || null : null,
    runtime_enabled: runtimeEnabled,
    introduced_in: introducedIn,
    runtime_version: typeof rule?.runtime_version === 'string' ? rule.runtime_version.trim() : null,
    changed_by: typeof rule?.changed_by === 'string' ? rule.changed_by.trim() : null,
  };
}

function validateRules(manifest, rulesPath, authorOsRoot) {
  const raw = readJson(rulesPath);
  const rules = Array.isArray(raw?.rules) ? raw.rules : [];
  const checked = rules.map((rule) => validateRule(rule, rulesPath));

  const allowedFiles = new Set(manifest.core_files);
  for (const file of manifest.domain_overrides) allowedFiles.add(`DOMAIN_OVERRIDES/${file}.md`);
  const fileSectionCache = new Map();

  const byId = new Map(checked.map((rule) => [rule.id, rule]));
  const normalizedRules = checked.map((rule) => {
    if (!rule) return null;
    const filePath = path.join(authorOsRoot, rule.file);
    if (!allowedFiles.has(rule.file)) {
      throw new Error(`author_os rule ${rule.id} points to unsupported file ${rule.file}`);
    }

    if (!fileSectionCache.has(rule.file)) {
      const sectionMap = getMarkdownSections(readText(filePath));
      fileSectionCache.set(rule.file, sectionMap);
    }
    const sectionSet = fileSectionCache.get(rule.file);
    if (!sectionSet.has(rule.section)) {
      throw new Error(`author_os rule ${rule.id} points to missing section '${rule.section}' in ${rule.file}`);
    }

    rule.conflicts = rule.conflicts.filter(Boolean);
    for (const conflict of rule.conflicts) {
      if (!byId.has(conflict)) {
        throw new Error(`author_os rule ${rule.id} conflicts with unknown rule ${conflict}`);
      }
    }

    return rule;
  });

  return {
    schemaVersion: raw?.schemaVersion === 1 ? 1 : 1,
    version: asString(raw?.version || manifest.version, `${rulesPath}: version`),
    rules: normalizedRules,
  };
}

function getCachedProfile(cacheKey) {
  return PROFILE_CACHE.get(cacheKey) || null;
}

function setCachedProfile(cacheKey, value) {
  PROFILE_CACHE.set(cacheKey, value);
}

function readCoreProfile(manifest, authorOsRoot) {
  const coreFiles = [];
  for (const fileName of manifest.core_files) {
    const filePath = path.join(authorOsRoot, fileName);
    ensureReadable(filePath);
    const text = normalizeLines(readText(filePath));
    if (!text.trim()) {
      throw new Error(`author_os core file is empty: ${fileName}`);
    }
    coreFiles.push({ file: fileName, text });
  }
  return coreFiles;
}

function readDomainOverride(manifest, authorOsRoot, domain) {
  if (domain === 'general') {
    return {
      domain: 'general',
      loaded: false,
      text: null,
      file: null,
    };
  }
  if (!manifest.domain_overrides.includes(domain)) {
    throw new Error(`domain '${domain}' is not listed in author_os manifest.domain_overrides`);
  }
  const filePath = path.join(authorOsRoot, 'DOMAIN_OVERRIDES', `${domain}.md`);
  try {
    ensureReadable(filePath);
  } catch {
    throw new Error(`missing AUTHOR_OS override file for domain '${domain}': ${filePath}`);
  }
  const text = normalizeLines(readText(filePath));
  if (!text) throw new Error(`AUTHOR_OS domain override ${domain}.md is empty`);
  return {
    domain,
    loaded: true,
    text,
    file: `${domain}.md`,
  };
}

function collectRules(registry, options = {}) {
  const allowExperimental = Boolean(options.experimentalRulesEnabled);
  const loaded = [];
  const excluded = {
    stability: { deprecated: 0, experimental: 0 },
    status: { deprecated: 0 },
    count: 0,
  };

  if (!registry || !Array.isArray(registry.rules)) {
    return { loaded: [], excluded, available: [] };
  }

  for (const rule of registry.rules) {
    if (rule.status === 'deprecated') {
      excluded.status.deprecated += 1;
      excluded.count += 1;
      continue;
    }
    if (rule.stability === 'DEPRECATED') {
      excluded.stability.deprecated += 1;
      excluded.count += 1;
      continue;
    }
    if (!rule.runtime_enabled) continue;
    if (rule.stability === 'EXPERIMENTAL' && !allowExperimental) {
      excluded.stability.experimental += 1;
      excluded.count += 1;
      continue;
    }
    if (!['CORE', 'STABLE', 'EXPERIMENTAL'].includes(rule.stability)) continue;
    loaded.push(rule);
  }

  const loadedById = new Set(loaded.map((rule) => rule.id));
  const activeConflicts = [];
  for (const rule of loaded) {
    const conflicting = (rule.conflicts || []).filter((id) => loadedById.has(id));
    if (!conflicting.length) continue;
    activeConflicts.push({ ruleId: rule.id, conflictsWith: conflicting });
  }
  excluded.conflicts = activeConflicts;

  return {
    loaded,
    excluded,
    available: registry.rules,
  };
}

function assembleTrace({
  manifest,
  coreRules,
  experimentalRulesEnabled,
  coreFiles,
  domainOverride,
  projectContextLoaded,
  taskInstructionsLoaded,
  idTrace,
  conflicts,
  ruleExclusions,
}) {
  return {
    loaded: true,
    authorOsVersion: manifest.version,
    authorOsName: manifest.name,
    idFactualContextLoaded: Boolean(idTrace?.loaded),
    idEvidenceCount: Array.isArray(idTrace?.evidenceRefs) ? idTrace.evidenceRefs.length : 0,
    coreFilesLoaded: coreFiles.map((item) => item.file),
    ruleIdsLoaded: coreRules.map((rule) => rule.id),
    excludedRules: {
      deprecatedRules: {
        count: ruleExclusions.stability.deprecated + ruleExclusions.status.deprecated,
      },
      experimentalRulesSkipped: ruleExclusions.stability.experimental,
      conflicts: Array.isArray(ruleExclusions.conflicts) ? ruleExclusions.conflicts : [],
      status: {
        deprecated: ruleExclusions.status.deprecated,
      },
    },
    conflicts,
    experimentalEnabled: Boolean(experimentalRulesEnabled),
    domainOverrideLoaded: domainOverride.loaded,
    domainOverride: domainOverride.domain,
    projectContextLoaded,
    taskInstructionsLoaded,
    finalPrecedenceOrder: [
      'ID_FACTUAL_CONTEXT',
      'AUTHOR_OS',
      ...(domainOverride.loaded ? [`DOMAIN_OVERRIDE:${domainOverride.domain}`] : []),
      'PROJECT_CONTEXT',
      'CURRENT_TASK',
    ],
  };
}

function sanitizeOptionalText(value) {
  if (typeof value === 'string' && value.trim()) return normalizeLines(value);
  return '';
}

function buildPromptFromParts(parts) {
  return parts.filter(Boolean).join('\n\n').trim();
}

function withProfile(authorOsRoot = DEFAULT_AUTHOR_OS_ROOT, domain, options = {}) {
  const manifest = readManifest(authorOsRoot);
  const cacheKey = `${path.resolve(authorOsRoot)}|${domain}|${String(Boolean(options.experimentalRulesEnabled))}`;
  let cached = getCachedProfile(cacheKey);

  if (!cached) {
    const rulesPath = path.join(authorOsRoot, 'governance', 'rules.json');
    const rules = existsSync(rulesPath)
      ? validateRules(manifest, rulesPath, authorOsRoot)
      : { schemaVersion: 1, version: manifest.version, rules: [] };
    const coreFiles = readCoreProfile(manifest, authorOsRoot);
    const domainOverride = readDomainOverride(manifest, authorOsRoot, domain);
    const { loaded: rulesLoaded, excluded: ruleExclusions, available } = collectRules(rules, options);
    const conflicts = rulesLoaded
      .flatMap((rule) => rule.conflicts.filter((conflictId) => rulesLoaded.some((entry) => entry.id === conflictId)).map((conflictId) => ({
        ruleId: rule.id,
        conflictsWith: conflictId,
      })));

    cached = {
      manifest,
      coreFiles,
      domainOverride,
      rulesLoaded,
      ruleExclusions,
      availableRules: available,
      conflicts,
      rulesSchema: rules,
    };
    setCachedProfile(cacheKey, cached);
  }

  return cached;
}

function existsSync(filePath) {
  try {
    accessSync(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export function loadAuthorOsBase(authorOsRoot = DEFAULT_AUTHOR_OS_ROOT) {
  const manifest = readManifest(authorOsRoot);
  return {
    manifest,
    coreFiles: readCoreProfile(manifest, authorOsRoot),
    overrides: [...manifest.domain_overrides],
  };
}

export function loadAuthorOsProfile({
  domain = 'general',
  authorOsRoot = DEFAULT_AUTHOR_OS_ROOT,
  projectContext = '',
  taskInstructions = '',
  idFactualContext = null,
  experimentalRulesEnabled = false,
} = {}) {
  const manifest = readManifest(authorOsRoot);
  const resolvedDomain = resolveAuthorOsDomain(domain, manifest);
  const profile = withProfile(authorOsRoot, resolvedDomain, { experimentalRulesEnabled });

  const coreText = profile.coreFiles
    .map((entry) => `## ${entry.file}\n${entry.text}`)
    .join('\n\n');

  const overrideText = profile.domainOverride.loaded ? `## DOMAIN_OVERRIDE:${profile.domainOverride.domain}\n${profile.domainOverride.text}` : '';
  const projectContextText = sanitizeOptionalText(projectContext);
  const taskText = sanitizeOptionalText(taskInstructions);
  const projectContextSection = projectContextText ? `## PROJECT_CONTEXT\n${projectContextText}` : '';
  const taskSection = taskText ? `## CURRENT_TASK\n${taskText}` : '';
  const idSection = idFactualContext?.text ? `## ID_FACTUAL_CONTEXT\n${idFactualContext.text}` : '';

  const trace = assembleTrace({
    manifest,
    coreRules: profile.rulesLoaded,
    experimentalRulesEnabled,
    coreFiles: profile.coreFiles,
    domainOverride: profile.domainOverride,
    projectContextLoaded: Boolean(projectContextText),
    taskInstructionsLoaded: Boolean(taskText),
    idTrace: idFactualContext,
    conflicts: profile.conflicts,
    ruleExclusions: profile.ruleExclusions,
  });

  return {
    prompt: buildPromptFromParts([idSection, coreText, overrideText, projectContextSection, taskSection]),
    trace,
    metadata: {
      rulesSchemaVersion: profile.rulesSchema?.schemaVersion || 1,
      rulesLoaded: profile.rulesLoaded.length,
      rulesAvailable: profile.availableRules.length,
      excludedRules: profile.ruleExclusions,
    },
  };
}

export function clearAuthorOsCache() {
  PROFILE_CACHE.clear();
}
