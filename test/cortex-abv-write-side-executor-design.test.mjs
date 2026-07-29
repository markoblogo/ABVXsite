import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validateWriteSideExecutorDesign } from '../scripts/check-cortex-abv-write-side-executor-design.mjs';

const design = JSON.parse(readFileSync(new URL('../cortex-abv/write-side-executor-design.v1.json', import.meta.url), 'utf8'));

test('write-side executor design keeps ABVXsite active and Lab design-only under PR-first review', () => {
  const validated = validateWriteSideExecutorDesign(design);
  assert.equal(validated.mode, 'owner_review_pr_only');
  assert.equal(validated.reviewGate.initialStatus, 'pending_review');
  assert.equal(validated.surfaces[0].implementationState, 'active_pr_only');
  assert.equal(validated.surfaces[1].implementationState, 'design_only_pr_required');
});

test('write-side executor design blocks direct publish behaviors', () => {
  assert.throws(
    () => validateWriteSideExecutorDesign({
      ...design,
      forbiddenExecutorBehaviors: design.forbiddenExecutorBehaviors.filter((item) => item !== 'direct_main_push'),
    }),
    /must include direct_main_push/,
  );
  assert.throws(
    () => validateWriteSideExecutorDesign({
      ...design,
      reviewGate: { ...design.reviewGate, mergeIsOnlyPublicationAction: false },
    }),
    /mergeIsOnlyPublicationAction must be true/,
  );
});
