import assert from 'node:assert/strict'

import type {
  CanonicalExactEditPlanningAuthorityRead,
} from '../../src/types/canonical-exact-edit-planning-authority'
import {
  resolveCanonicalExactEditPreferenceInstruction,
} from '../services/canonical-exact-edit-preference-instruction'
import {
  canonicalExactEditPreferenceInstructionSchema,
  type CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'

const sha = (value: string) => value.repeat(64).slice(0, 64)
const savedValues = {
  editLevel: 'pro',
  workflowType: 'product_demo',
  cleanupPreference: 'balanced_cleanup',
  visualPreference: 'balanced_visual_mix',
  moodStyle: 'clean',
  creditPreference: 'balanced',
  targetPlatform: 'youtube',
} as const
const authority: CanonicalExactEditPlanningAuthorityRead = {
  schemaVersion: 'canonical-exact-edit-planning-authority-read-v1',
  sourceAuthority: 'canonical_exact_edit_preference_repository',
  runtimeSource: 'verified_live',
  authorityReadReceiptId: 'preference-instruction-read-1',
  workspaceId: 'workspace-preference-instruction',
  projectId: 'project-preference-instruction',
  editSessionId: 'edit-preference-instruction',
  recordRevision: 7,
  preferenceRevision: 3,
  planningInputRevision: 5,
  preferenceFingerprintSha256: sha('a'),
  values: savedValues,
  baseline: {
    preferenceSnapshotId: 'preference-instruction-baseline',
    values: savedValues,
    preferenceFingerprintSha256: sha('b'),
    capturedAt: '2026-07-24T12:00:00.000Z',
    persistenceSource: 'authenticated_private_internal_backend',
    provenance: 'saved_edit_preferences',
  },
  sourcePreparation: {
    status: 'ready',
    sourceCandidateHashSha256: sha('c'),
    evidenceHashSha256: sha('d'),
    confirmedAt: '2026-07-24T12:01:00.000Z',
  },
  frameConfirmation: {
    status: 'confirmed',
    confirmationId: 'preference-instruction-frame-1',
    aspectRatio: '16:9',
    confirmedAt: '2026-07-24T12:01:00.000Z',
    authorityDigestSha256: sha('e'),
  },
  lifecyclePhase: 'planning',
  locked: false,
  currentApplicationState: 'not_selected',
  currentApplicationId: null,
  readAt: '2026-07-24T12:02:00.000Z',
  browserMutationAuthorityGranted: false,
  productionReleaseReadinessEvaluatedSeparately: true,
}

const explicitInstruction = canonicalExactEditPreferenceInstructionSchema.parse({
  schemaVersion: 'canonical-exact-edit-preference-instruction-v1',
  source: 'explicit_chat_setup',
  base: {
    preferenceRevision: authority.preferenceRevision,
    planningInputRevision: authority.planningInputRevision,
    preferenceFingerprintSha256: authority.preferenceFingerprintSha256,
    preferenceSnapshotId: authority.baseline.preferenceSnapshotId,
  },
  effectiveValues: {
    ...savedValues,
    editLevel: 'premium',
    cleanupPreference: 'documentary_faithful',
    visualPreference: 'real_motion_if_useful',
  },
  overrideKeys: ['editLevel', 'cleanupPreference', 'visualPreference'],
  overrides: {
    editLevel: 'premium',
    cleanupPreference: 'documentary_faithful',
    visualPreference: 'real_motion_if_useful',
  },
  browserMutationAuthorityGranted: false,
})

const components = {
  confirmedSettings: {
    editLevel: 'premium',
    targetPlatform: 'youtube',
  },
  sourceCleanupSummary: {
    cleanupPreference: 'documentary_faithful',
  },
  exactEditPreferenceInstruction: explicitInstruction,
} as CanonicalPlanComponentsInput

const authorityBefore = structuredClone(authority)
const resolved = resolveCanonicalExactEditPreferenceInstruction({
  authority,
  components,
})
assert.equal(resolved.source, 'explicit_chat_setup')
assert.deepEqual(resolved.overrideKeys, [
  'editLevel',
  'cleanupPreference',
  'visualPreference',
])
assert.deepEqual(resolved.overrides, {
  editLevel: 'premium',
  cleanupPreference: 'documentary_faithful',
  visualPreference: 'real_motion_if_useful',
})

const afterEvidencePromotion =
  resolveCanonicalExactEditPreferenceInstruction({
    authority: {
      ...authority,
      recordRevision: authority.recordRevision + 1,
    },
    components,
  })
assert.equal(afterEvidencePromotion.instructionHash, resolved.instructionHash)
assert.deepEqual(afterEvidencePromotion.overrideKeys, resolved.overrideKeys)
assert.equal(resolved.effectiveValues.editLevel, 'premium')
assert.equal(resolved.effectiveValues.cleanupPreference, 'documentary_faithful')
assert.match(resolved.instructionHash, /^[a-f0-9]{64}$/)
assert.deepEqual(
  authority,
  authorityBefore,
  'Resolving a Chat instruction must never mutate Current Edit Preferences.',
)

const withoutOverride = resolveCanonicalExactEditPreferenceInstruction({
  authority,
  components: {
    confirmedSettings: {
      editLevel: savedValues.editLevel,
      targetPlatform: savedValues.targetPlatform,
    },
    sourceCleanupSummary: {
      cleanupPreference: savedValues.cleanupPreference,
    },
  } as CanonicalPlanComponentsInput,
})
assert.equal(withoutOverride.source, 'current_edit_preferences')
assert.deepEqual(withoutOverride.overrideKeys, [])
assert.deepEqual(withoutOverride.effectiveValues, savedValues)

assert.throws(
  () => resolveCanonicalExactEditPreferenceInstruction({
    authority,
    components: {
      ...components,
      exactEditPreferenceInstruction: {
        ...explicitInstruction,
        base: {
          ...explicitInstruction.base,
          planningInputRevision: explicitInstruction.base.planningInputRevision - 1,
        },
      },
    },
  }),
  /stale Current Edit Preferences/,
)

assert.throws(
  () => resolveCanonicalExactEditPreferenceInstruction({
    authority,
    components: {
      ...components,
      exactEditPreferenceInstruction: {
        ...explicitInstruction,
        overrides: {
          ...explicitInstruction.overrides,
          editLevel: 'basic',
        },
      },
    },
  }),
  /override payload is inconsistent/,
)

assert.throws(
  () => resolveCanonicalExactEditPreferenceInstruction({
    authority,
    components: {
      ...components,
      confirmedSettings: {
        ...components.confirmedSettings,
        editLevel: 'basic',
      },
    },
  }),
  /confirmed settings do not match/,
)

assert.equal(canonicalExactEditPreferenceInstructionSchema.safeParse({
  ...explicitInstruction,
  browserMutationAuthorityGranted: true,
}).success, false)
assert.equal(canonicalExactEditPreferenceInstructionSchema.safeParse({
  ...explicitInstruction,
  overrideKeys: ['editLevel', 'editLevel'],
}).success, false)
assert.equal(canonicalExactEditPreferenceInstructionSchema.safeParse({
  ...explicitInstruction,
  overrides: {
    ...explicitInstruction.overrides,
    unknownPreferenceField: 'forged',
  },
}).success, false)

console.log(JSON.stringify({
  smoke: 'canonical_exact_edit_preference_instruction',
  status: 'passed',
  savedPreferenceMutationCount: 0,
  explicitChatOverrideKeys: resolved.overrideKeys,
  staleAuthorityRejected: true,
  forgedOverrideRejected: true,
  browserMutationAuthorityGranted: false,
}))
