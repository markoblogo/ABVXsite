import { readFileSync } from 'node:fs';
import { validateAzurMentonShadowEvaluationPack } from './azur-menton-shadow-evaluation.mjs';

const sourcePack = JSON.parse(readFileSync(new URL('../config/azur-menton-source-pack.v1.json', import.meta.url), 'utf8'));
const guestChatPolicy = JSON.parse(readFileSync(new URL('../config/azur-menton-guest-chat-policy.v1.json', import.meta.url), 'utf8'));
const evaluationPack = JSON.parse(readFileSync(new URL('../config/azur-menton-shadow-evaluation.v1.json', import.meta.url), 'utf8'));
const validated = validateAzurMentonShadowEvaluationPack({ sourcePack, guestChatPolicy, evaluationPack });
const byDisposition = Object.fromEntries(['grounded_answer', 'abstain', 'handoff'].map((disposition) => [
  disposition,
  validated.scenarios.filter((scenario) => scenario.expectedDisposition === disposition).length,
]));

console.log(JSON.stringify({
  status: 'validated',
  authority: validated.authority,
  tenantId: validated.tenantId,
  evaluationTarget: validated.evaluationTarget,
  judgeType: validated.judgeType,
  scenarioCount: validated.scenarios.length,
  byDisposition,
  decisionRule: validated.decisionRule,
  runtimeIntegration: false,
}, null, 2));
