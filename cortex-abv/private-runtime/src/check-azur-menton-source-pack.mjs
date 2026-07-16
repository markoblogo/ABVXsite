import { readFileSync } from 'node:fs';
import { validateAzurMentonSourcePackBundle, verifyAzurMentonSourcePackProvenance } from './azur-menton-source-pack.mjs';

const sourcePack = JSON.parse(readFileSync(new URL('../config/azur-menton-source-pack.v1.json', import.meta.url), 'utf8'));
const guestChatPolicy = JSON.parse(readFileSync(new URL('../config/azur-menton-guest-chat-policy.v1.json', import.meta.url), 'utf8'));
const validated = validateAzurMentonSourcePackBundle({ sourcePack, guestChatPolicy });
const sourceRootFlag = process.argv.indexOf('--source-root');
const provenance = sourceRootFlag === -1
  ? { verified: false, reason: 'source_root_not_provided' }
  : verifyAzurMentonSourcePackProvenance(validated.sourcePack, { sourceRoot: process.argv[sourceRootFlag + 1] });

console.log(JSON.stringify({
  status: 'validated',
  authority: validated.sourcePack.authority,
  tenantId: validated.sourcePack.tenantId,
  packId: validated.sourcePack.packId,
  revision: validated.sourcePack.revision.commitSha,
  sourceCount: validated.sourcePack.sources.length,
  corpusKinds: [...new Set(validated.sourcePack.sources.flatMap((source) => source.contentKinds))].sort(),
  guestChatStatus: validated.guestChatPolicy.status,
  responseAuthority: validated.guestChatPolicy.responseAuthority,
  runtimeIntegration: false,
  provenance,
}, null, 2));
