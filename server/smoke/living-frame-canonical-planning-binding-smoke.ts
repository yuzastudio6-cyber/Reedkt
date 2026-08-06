import assert from 'node:assert/strict'

import {
  bindLivingFrameCanonicalPlanning,
  calculateLivingFrameCanonicalSourceDigest,
  createLivingFrameContractFixtures,
  livingFrameOutputFrameDigestProjection,
} from '../../src/lib/living-frame'
import {
  createProfessionalSkillPlan,
} from '../../src/lib/professional-skills'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import {
  buildProfessionalExportCreditCoverage,
} from '../../src/lib/professional-export-policy'
import type {
  EditPlan,
  PlannerInput,
} from '../../src/types/reeditpro'
import {
  canonicalPlanComponentsSchema,
  type CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  canonicalLivingFramePlanningBindingSchema,
} from '../validation/canonical-living-frame-planning-binding-schemas'
import {
  revalidateCanonicalLivingFramePlanningBinding,
} from '../services/canonical-living-frame-planning-binding-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const plannerInput: PlannerInput = {
  projectName: 'Living Frame canonical binding smoke',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  frameTemplateType: 'horizontal_wide_frame',
  editingCategory: 'education_explainer',
  workflowType: 'education_explainer',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'premium',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions:
    'Use Living Frame storytelling for the central explanation.',
  creditPreference: 'balanced',
  clips: [{
    id: 'living-frame-source-1',
    uploadedOrder: 1,
    fileName: 'source-one.mp4',
    duration: '0:05',
    detectedType: 'talking_head',
    sourceOrderLocked: true,
  }],
}

const selectedPlan = createProfessionalSkillPlan({ plannerInput })
const selectedParent = selectedPlan.selectedSkills.filter(
  (skill) => skill.skillId === 'motion.living_frame_storytelling',
)
assert.equal(selectedParent.length, 1)

const canonicalComponents = createCanonicalComponents()
const bound = await bindLivingFrameCanonicalPlanning({
  professionalSkillPlan: selectedPlan,
  components: canonicalComponents,
})
assert.ok(bound.professionalSkillPlan?.livingFrame)
assert.ok(bound.livingFrame)
assert.equal(bound.livingFrame.status, 'deferred')
assert.equal(bound.livingFrame.decisionSummary.decision, 'deferred')
assert.equal(bound.livingFrame.scenePlans.length, 0)
assert.equal(bound.livingFrame.capabilityRequirements.length, 0)
assert.equal(bound.livingFrame.continuityPackRefs.length, 0)
assert.equal(bound.livingFrame.qaExpectationCodes.length, 0)
assert.equal(bound.livingFrame.estimateInputs.sceneCount, 0)
assert.equal(bound.livingFrame.estimateInputs.componentCount, 0)
assert.equal(bound.livingFrame.estimateInputs.pricingAuthorityProvided, false)
assert.equal(bound.livingFrame.authorityBoundary.planningOnly, true)
assert.equal(bound.livingFrame.authorityBoundary.executable, false)
assert.equal(bound.livingFrame.authorityBoundary.timingAuthority, false)
assert.equal(bound.livingFrame.authorityBoundary.soundAuthority, false)
assert.equal(bound.livingFrame.authorityBoundary.estimateAuthority, false)
assert.equal(bound.livingFrame.authorityBoundary.approvalAuthority, false)
assert.equal(bound.livingFrame.authorityBoundary.runtimeAuthority, false)
assert.equal(bound.livingFrame.authorityBoundary.queueAuthority, false)
assert.equal(bound.livingFrame.authorityBoundary.providerAuthority, false)
assert.equal(bound.livingFrame.authorityBoundary.toolRouteAuthority, false)
assert.equal(bound.livingFrame.authorityBoundary.costAuthority, false)

const serializedBinding = JSON.stringify(bound.livingFrame)
for (const forbiddenKey of [
  'workItems',
  'jobId',
  'queueId',
  'providerRoute',
  'providerModel',
  'toolId',
  'toolRoute',
  'approvedAt',
  'credits',
  'price',
  'serviceFee',
  'rawChat',
  'rawTranscript',
]) {
  assert.equal(
    serializedBinding.includes(`"${forbiddenKey}"`),
    false,
    `Deferred Living Frame binding must not carry ${forbiddenKey}.`,
  )
}

assert.equal(
  bound.livingFrame.inputBindings.compiledIntent.expectedDigestSha256,
  sha256AuthorityValue(canonicalComponents.compiledIntent),
)
assert.equal(
  bound.livingFrame.inputBindings.sourceSequence.expectedDigestSha256,
  sha256AuthorityValue(canonicalComponents.sourceSequence),
)
assert.equal(
  bound.livingFrame.inputBindings.outputFrame.expectedDigestSha256,
  sha256AuthorityValue(
    livingFrameOutputFrameDigestProjection(canonicalComponents),
  ),
)
assert.equal(
  bound.livingFrame.inputBindings.masterTiming.expectedDigestSha256,
  sha256AuthorityValue(canonicalComponents.masterTimingPlan),
)
assert.equal(
  await calculateLivingFrameCanonicalSourceDigest(
    canonicalComponents.masterTimingPlan,
  ),
  sha256AuthorityValue(canonicalComponents.masterTimingPlan),
  'Browser-safe and server-owned canonical SHA-256 calculations must agree.',
)

const canonicalWithBinding = canonicalPlanComponentsSchema.parse({
  ...canonicalComponents,
  livingFrame: bound.livingFrame,
})
const serverValidated =
  await revalidateCanonicalLivingFramePlanningBinding({
    components: canonicalWithBinding,
  })
assert.equal(
  serverValidated?.contractDigestSha256,
  bound.livingFrame.contractDigestSha256,
)

const withoutSelectedParent = createProfessionalSkillPlan({
  plannerInput: {
    ...plannerInput,
    customInstructions: 'Keep this edit clean and static.',
  },
})
const callerInjectedPlan = {
  ...withoutSelectedParent,
  livingFrame: bound.livingFrame,
}
const absentBinding = await bindLivingFrameCanonicalPlanning({
  professionalSkillPlan: callerInjectedPlan,
  components: canonicalComponents,
})
assert.equal(absentBinding.livingFrame, undefined)
assert.equal(
  Object.hasOwn(absentBinding.professionalSkillPlan ?? {}, 'livingFrame'),
  false,
  'Absent parent selection must strip caller-shaped Living Frame data.',
)

await assert.rejects(
  revalidateCanonicalLivingFramePlanningBinding({
    components: {
      ...canonicalWithBinding,
      masterTimingPlan: {
        ...canonicalWithBinding.masterTimingPlan,
        totalFrames: 151,
      },
    },
  }),
  /source or authority expectations are stale/,
  'A changed MasterTimingPlan must invalidate the deferred binding.',
)
await assert.rejects(
  revalidateCanonicalLivingFramePlanningBinding({
    components: {
      ...canonicalWithBinding,
      confirmedSettings: {
        ...canonicalWithBinding.confirmedSettings,
        outputFrame: {
          ...canonicalWithBinding.confirmedSettings.outputFrame,
          width: 1920,
        },
      },
    },
  }),
  /source or authority expectations are stale/,
  'A changed confirmed output frame must invalidate the deferred binding.',
)

const selectedFixture =
  (await createLivingFrameContractFixtures()).musashiDecisiveStrike
assert.equal(
  canonicalLivingFramePlanningBindingSchema.safeParse(selectedFixture).success,
  false,
  'Selected fixture scene graphs cannot be promoted into canonical Slice 2B evidence.',
)

assert.throws(
  () => createApprovedPlanSnapshot({
    projectId: 'living-frame-legacy-snapshot-project',
    editSessionId: 'living-frame-legacy-snapshot-edit',
    approvedBy: 'living-frame-smoke',
    plan: {
      professionalSkillPlan: bound.professionalSkillPlan,
    } as EditPlan,
  }),
  /asynchronous canonical planning authority/,
  'Legacy synchronous snapshot creation must fail closed for Living Frame.',
)

const componentRefDigest = sha256AuthorityValue(bound.livingFrame)
const planLineageWithLivingFrame = sha256AuthorityValue({
  componentRefs: {
    livingFrame: {
      sha256: componentRefDigest,
      byteLength: serializedBinding.length,
    },
  },
})
const planLineageWithoutLivingFrame = sha256AuthorityValue({
  componentRefs: {},
})
assert.notEqual(
  planLineageWithLivingFrame,
  planLineageWithoutLivingFrame,
  'The Living Frame component reference must participate in immutable plan and snapshot lineage.',
)

console.log(JSON.stringify({
  contractVersion: bound.livingFrame.contractVersion,
  decision: bound.livingFrame.decisionSummary.decision,
  sceneCount: bound.livingFrame.scenePlans.length,
  componentCount: bound.livingFrame.estimateInputs.componentCount,
  segmentExpectationCount:
    bound.livingFrame.inputBindings.segmentExpectations.length,
  closedGateCount: bound.livingFrame.closedGateCodes.length,
  serverDigestRevalidated: true,
  staleTimingRejected: true,
  staleFrameRejected: true,
  selectedFixturePromotionRejected: true,
  legacySnapshotRejected: true,
  allRuntimeAuthorityClosed: true,
}))

function createCanonicalComponents(): CanonicalPlanComponentsInput {
  const professionalExportCoverage = buildProfessionalExportCreditCoverage({
    durationSeconds: 5,
    outputFps: 30,
    approvedAspectRatio: '16:9',
  })
  return canonicalPlanComponentsSchema.parse({
    compiledIntent: {
      goalSummary: 'Explain one concept with a deferred Living Frame direction.',
    },
    professionalEditingDirective: {
      mustFollowRules: ['Preserve source meaning.'],
    },
    confirmedSettings: {
      aspectRatio: '16:9',
      outputFrame: { width: 3840, height: 2160, fps: 30 },
      outputFramePurpose: 'private_canonical_4k_master_review',
      professionalExportCoverage,
      outputFrameConfirmed: true,
      sourceOrderConfirmed: true,
      sourceCleanupConfirmed: true,
      editLevel: 'pro',
      targetPlatform: 'youtube',
      preferenceSnapshotId: 'living-frame-preference-snapshot-1',
      preferenceRevision: 1,
      preferencePlanningInputRevision: 1,
      preferenceFingerprintSha256: '1'.repeat(64),
    },
    sourceSequence: [{
      sourceSequenceItemId: 'source-1',
      mediaAssetId: 'media-asset-1',
      uploadedOrder: 1,
      checksumSha256: '2'.repeat(64),
      required: true,
    }],
    sourceCleanupSummary: {
      status: 'confirmed',
      cleanupPreference: 'balanced_cleanup',
      trimValidationStatus: 'passed',
      meaningValidationStatus: 'passed',
      userReviewRequired: false,
    },
    sourceCleanupPlan: {
      status: 'confirmed',
      decisions: [{
        decisionId: 'cleanup-source-1',
        sourceSequenceItemId: 'source-1',
        action: 'preserve',
        startFrame: 0,
        endFrameExclusive: 150,
        reason: 'Preserve the complete approved source meaning.',
        confidence: 1,
        meaningPreservationStatus: 'passed',
        userReviewStatus: 'not_required',
      }],
    },
    masterTimingPlan: {
      id: 'master-timing-plan',
      status: 'ready',
      timingBase: { fps: 30, totalFrames: 150 },
      totalFrames: 150,
    },
    captionVisualCueTimingPlan: { status: 'synced' },
    soundSyncTransitionTimingPlan: {
      status: 'not_needed',
      speechPriority: true,
    },
    timingValidationPlan: {
      overallStatus: 'passed',
      approvalBlocked: false,
    },
    timingSummary: {
      validationStatus: 'passed',
      approvalBlocked: false,
      fps: 30,
      totalFrames: 150,
    },
    segments: [{
      segmentId: 'segment-1',
      startFrame: 0,
      endFrameExclusive: 150,
      operationIds: ['operation-1'],
    }],
    visualAssetPlan: { status: 'not_needed' },
    colorPipelinePlan: { status: 'not_provided' },
    rendererPlan: {
      renderer: 'remotion',
      frameOwnedByRenderer: true,
    },
    toolStrategyPlan: { toolIds: [] },
    qaPlan: { checks: [] },
    qaSummary: { status: 'passed', approvalBlocked: false },
    providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
    fallbackPolicy: { unapprovedFallbackAllowed: false },
  })
}
