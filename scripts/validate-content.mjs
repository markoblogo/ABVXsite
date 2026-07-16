import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  contentFiles,
  mediaRoot,
  parseContentFile,
  validLinkTypes,
  validMediaRoles,
  validSections,
  validStatus,
  validVisibility,
} from './content-lib.mjs';
import { validateSyncConfig } from './project-description-sync-lib.mjs';

const errors = [];
const warnings = [];
const all = [];

function addError(file, message) {
  errors.push(`${file}: ${message}`);
}

function addWarning(file, message) {
  warnings.push(`${file}: ${message}`);
}

function isUrl(value) {
  if (value.startsWith('/')) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function checkImage(file, image, field) {
  if (!image) return;
  if (typeof image !== 'object') {
    addError(file, `${field} must be an object`);
    return;
  }
  if (!image.src) addError(file, `${field}.src is required`);
  if (!image.alt) addError(file, `${field}.alt is required`);
  const role = image.role || image.mediaRole;
  if (role && !validMediaRoles.has(role)) addError(file, `${field}.role is invalid: ${role}`);
  if (image.src?.startsWith('/media/')) {
    const localPath = path.join(mediaRoot, image.src.replace(/^\/media\//, ''));
    if (!existsSync(localPath)) addError(file, `${field}.src does not exist: ${image.src}`);
  }
}

function validateFile(file, folder) {
  const { data, body } = parseContentFile(file);
  all.push({ file, folder, data, body });

  for (const field of ['id', 'slug', 'title', 'summary']) {
    if (!data[field]) addError(file, `${field} is required`);
  }

  if (!data.type) addError(file, 'type is required');
  if (!validStatus.has(data.status)) addError(file, `status is invalid: ${data.status}`);
  if (!validVisibility.has(data.visibility || 'public')) addError(file, `visibility is invalid: ${data.visibility}`);

  if (folder === 'work') {
    if (!validSections.has(data.primarySection)) addError(file, `primarySection is invalid: ${data.primarySection}`);
  }

  if (data.appearsIn) {
    if (!Array.isArray(data.appearsIn)) addError(file, 'appearsIn must be an array');
    for (const section of data.appearsIn || []) {
      if (!validSections.has(section)) addError(file, `appearsIn contains invalid section: ${section}`);
    }
  }

  if (!Array.isArray(data.tags)) addError(file, 'tags must be an array');
  try {
    validateSyncConfig(data.sync, file, data.publicCopy);
  } catch (error) {
    addError(file, error.message.replace(`${file}: `, ''));
  }
  checkImage(file, data.media, 'media');
  checkImage(file, data.heroImage, 'heroImage');

  if (!Array.isArray(data.links)) {
    addError(file, 'links must be an array');
  } else {
    for (const [index, link] of data.links.entries()) {
      if (!validLinkTypes.has(link.type)) addError(file, `links[${index}].type is invalid: ${link.type}`);
      if (!link.label) addError(file, `links[${index}].label is required`);
      if (!link.url) addError(file, `links[${index}].url is required`);
      if (link.url && !isUrl(link.url)) addError(file, `links[${index}].url is invalid: ${link.url}`);
    }
  }

  if (data.visibility === 'private') addWarning(file, 'private item is excluded from public loaders');
  if (data.visibility === 'draft') addWarning(file, 'draft item is excluded in production');
  if (data.needsCopyReview) addWarning(file, 'needsCopyReview is set');
  if (data.needsMediaReview) addWarning(file, 'needsMediaReview is set');
  if (data.needsLinkReview) addWarning(file, 'needsLinkReview is set');
}

for (const folder of ['books', 'work', 'series']) {
  for (const file of contentFiles(folder)) validateFile(file, folder);
}

const bySlug = new Map();
for (const item of all) {
  const slug = item.data.slug;
  if (!slug) continue;
  bySlug.set(slug, [...(bySlug.get(slug) || []), item.file]);
}
for (const [slug, files] of bySlug) {
  if (files.length > 1) addWarning(files.join(', '), `duplicate slug reported: ${slug}`);
}

if (warnings.length) {
  console.log('Content warnings:');
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error('Content validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Content validation passed: ${all.length} files checked.`);
