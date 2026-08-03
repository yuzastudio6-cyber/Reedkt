import assert from 'node:assert/strict'

import { buildProfessionalExportCreditCoverage } from '../../src/lib/professional-export-policy'
import {
  createCanonicalConfirmedOutputFrameAuthority,
  verifyCanonicalConfirmedOutputFrameAuthority,
} from '../services/canonical-confirmed-output-frame-authority'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  createCanonicalConfirmedOutputBinding,
} from '../validation/canonical-confirmed-output-frame-schemas'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  resolvedPlanningInputAuthorityBindingSchema,
  type ResolvedPlanningInputAuthorityBinding,
} from '../validation/planning-input-authority-binding-schemas'

const components = canonicalComponents()
const planning = planningInputAuthority()
const authority = createCanonicalConfirmedOutputFrameAuthority({
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  planningInputAuthority: planning,
  components,
})

assert.equal(authority.schemaVersion,
  'canonical-confirmed-output-frame-authority-v1')
assert.equal(authority.confirmedOutputBinding.aspectRatioLabel, '9:16')
assert.equal(authority.confirmedOutputBinding.aspectRatioNumerator, 9)
assert.equal(authority.confirmedOutputBinding.aspectRatioDenominator, 16)
assert.equal(authority.confirmedOutputBinding.width, 2_160)
assert.equal(authority.confirmedOutputBinding.height, 3_840)
assert.equal(authority.confirmedOutputBinding.fpsNumerator, 30_000)
assert.equal(authority.confirmedOutputBinding.fpsDenominator, 1_001)
assert.equal(authority.confirmedOutputBinding.confirmedByUser, true)
assert.equal(authority.authorityBoundary.browserFrameAuthorityAccepted, false)
assert.equal(authority.authorityBoundary.callerOutputIdAccepted, false)
assert.equal(authority.authorityBoundary.providerCalled, false)
assert.equal(authority.authorityBoundary.productionAuthorityGranted, false)
assert.deepEqual(createCanonicalConfirmedOutputFrameAuthority({
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  planningInputAuthority: planning,
  components,
}), authority)
assert.equal(verifyCanonicalConfirmedOutputFrameAuthority({
  value: structuredClone(authority),
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  planningInputAuthority: planning,
  components,
}).authorityDigestSha256, authority.authorityDigestSha256)

const stalePlanning = planningInputAuthority({ planningInputRevision: 8 })
assert.throws(() => verifyCanonicalConfirmedOutputFrameAuthority({
  value: authority,
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  planningInputAuthority: stalePlanning,
  components,
}), /stale/u)

const tampered = structuredClone(authority)
tampered.confirmedOutputBinding.width = 1_080
assert.throws(() => verifyCanonicalConfirmedOutputFrameAuthority({
  value: tampered,
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  planningInputAuthority: planning,
  components,
}))

const wrongDimensions = canonicalComponents()
wrongDimensions.confirmedSettings.outputFrame.width = 1_920
assert.throws(() => createCanonicalConfirmedOutputFrameAuthority({
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  planningInputAuthority: planning,
  components: wrongDimensions,
}), /dimensions/u)

const unconfirmed = structuredClone(canonicalComponents()) as unknown as {
  confirmedSettings: { outputFrameConfirmed: boolean }
}
unconfirmed.confirmedSettings.outputFrameConfirmed = false
assert.throws(() => createCanonicalConfirmedOutputFrameAuthority({
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  planningInputAuthority: planning,
  components: unconfirmed as unknown as CanonicalPlanComponentsInput,
}), /outputFrameConfirmed/u)

let accessorInvoked = false
const accessorInput: Record<string, unknown> = {
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  components,
}
Object.defineProperty(accessorInput, 'planningInputAuthority', {
  enumerable: true,
  get() {
    accessorInvoked = true
    return planning
  },
})
assert.throws(() => createCanonicalConfirmedOutputFrameAuthority(
  accessorInput as never,
), /enumerable data properties/u)
assert.equal(accessorInvoked, false)

assert.throws(() => createCanonicalConfirmedOutputFrameAuthority(
  new Proxy({}, {
    ownKeys() {
      throw new Error('hostile input')
    },
  }) as never,
), /cannot be inspected/u)

let bindingAccessorInvoked = false
const accessorBinding: Record<string, unknown> = {}
Object.defineProperty(accessorBinding, 'outputId', {
  enumerable: true,
  get() {
    bindingAccessorInvoked = true
    return authority.confirmedOutputBinding.outputId
  },
})
assert.throws(() => createCanonicalConfirmedOutputBinding(
  accessorBinding as never,
), /enumerable data properties/u)
assert.equal(bindingAccessorInvoked, false)

const cyclicBinding: Record<string, unknown> = {}
cyclicBinding.self = cyclicBinding
assert.throws(() => createCanonicalConfirmedOutputBinding(
  cyclicBinding as never,
), /Cyclic/u)

const changedConfirmation = planningInputAuthority({
  planningInputRevision: 3,
  frameConfirmationId: 'frame-confirmation-2',
})
const changedAuthority = createCanonicalConfirmedOutputFrameAuthority({
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  planningInputAuthority: changedConfirmation,
  components,
})
assert.notEqual(
  changedAuthority.confirmedOutputBinding.outputId,
  authority.confirmedOutputBinding.outputId,
)
assert.notEqual(
  changedAuthority.confirmedOutputBinding
    .confirmedOutputFrameBindingDigestSha256,
  authority.confirmedOutputBinding.confirmedOutputFrameBindingDigestSha256,
)
assert.equal(
  stableAuthorityStringify(authority).includes('/Users/'),
  false,
)

console.log(JSON.stringify({
  smoke: 'canonical-confirmed-output-frame-authority',
  checks: 32,
  productIdentity: 'weeditpro',
  exactUserConfirmedFrameAuthority: true,
  rationalFpsPreserved: true,
  stalePlanningAuthorityRejected: true,
  tamperedFrameRejected: true,
  browserFrameInferenceAccepted: false,
  callerOutputIdentityAccepted: false,
  hostileAccessorInvoked: accessorInvoked || bindingAccessorInvoked,
  runtimeExecuted: false,
  providerCalled: false,
  approvalGranted: false,
  productionAuthorityGranted: false,
  outputId: authority.confirmedOutputBinding.outputId,
  bindingDigest:
    authority.confirmedOutputBinding.confirmedOutputFrameBindingDigestSha256,
  authorityDigest: authority.authorityDigestSha256,
}))

function planningInputAuthority(overrides?: {
  planningInputRevision?: number
  frameConfirmationId?: string
}): ResolvedPlanningInputAuthorityBinding {
  const planningInputRevision = overrides?.planningInputRevision ?? 2
  const frameConfirmationId = overrides?.frameConfirmationId
    ?? 'frame-confirmation-1'
  const values = {
    editLevel: 'pro' as const,
    workflowType: 'talking_head_personal_brand' as const,
    cleanupPreference: 'balanced_cleanup' as const,
    visualPreference: 'balanced_visual_mix' as const,
    moodStyle: 'clean' as const,
    creditPreference: 'premium_best_result' as const,
    targetPlatform: 'client_review' as const,
  }
  const withoutHash = {
    schemaVersion: 'canonical-planning-input-authority-binding-v1' as const,
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    exactEditPreference: {
      recordRevision: 3,
      preferenceRevision: 4,
      planningInputRevision,
      preferenceFingerprintSha256: hash('1'),
      values,
      effectiveValues: values,
      instructionSource: 'current_edit_preferences' as const,
      explicitChatOverrideKeys: [],
      explicitChatOverrides: {},
      instructionHash: hash('2'),
      baseline: {
        preferenceSnapshotId: 'preference-snapshot-1',
        persistenceSource: 'authenticated_private_internal_backend' as const,
        provenance: 'saved_edit_preferences' as const,
      },
      sourcePreparationEvidenceHash: hash('3'),
      sourceCandidateHash: hash('4'),
      frameConfirmationId,
      confirmedAspectRatio: '9:16' as const,
      lifecyclePhase: 'planning' as const,
      locked: false,
    },
    preferenceApplication: {
      status: 'not_selected' as const,
      applicationVersion: 0 as const,
      applicationHash: hash('5'),
    },
    editBrief: {
      status: 'not_used' as const,
      deterministicHash: hash('6'),
    },
    instructionPriority: [
      'explicit_user_request',
      'confirmed_edit_preferences',
      'approved_edit_brief',
      'professional_editing_rules',
      'workflow_defaults',
      'tier_policy',
      'safe_fallbacks',
    ],
    noRuntimeSideEffects: true as const,
  }
  return resolvedPlanningInputAuthorityBindingSchema.parse({
    ...withoutHash,
    bindingHash: sha256AuthorityValue(withoutHash),
  })
}

function canonicalComponents(): CanonicalPlanComponentsInput {
  const fps = 30_000 / 1_001
  const totalFrames = 14_400
  return {
    compiledIntent: { goal: 'Clean the complete source professionally.' },
    professionalEditingDirective: {
      pacing: 'meaning_first',
      mustFollowRules: ['Review the entire source before cutting.'],
    },
    confirmedSettings: {
      aspectRatio: '9:16',
      outputFrame: { width: 2_160, height: 3_840, fps },
      outputFramePurpose: 'private_canonical_4k_master_review',
      professionalExportCoverage: buildProfessionalExportCreditCoverage({
        durationSeconds: 480,
        outputFps: fps,
        approvedAspectRatio: '9:16',
      }),
      outputFrameConfirmed: true,
      sourceOrderConfirmed: true,
      sourceCleanupConfirmed: true,
      editLevel: 'pro',
      targetPlatform: 'private_review',
      preferenceSnapshotId: 'preference-snapshot-1',
      preferenceRevision: 4,
      preferencePlanningInputRevision: 2,
      preferenceFingerprintSha256: hash('1'),
    },
    sourceSequence: [{
      sourceSequenceItemId: 'source-sequence-1',
      mediaAssetId: 'media-asset-1',
      uploadedOrder: 1,
      checksumSha256: hash('7'),
      required: true,
    }],
    sourceCleanupSummary: {
      status: 'confirmed',
      cleanupPreference: 'meaning_first_professional_cleanup',
      trimValidationStatus: 'passed',
      meaningValidationStatus: 'passed',
      userReviewRequired: false,
    },
    sourceCleanupPlan: {
      status: 'confirmed',
      decisions: [{
        decisionId: 'preserve-whole-source',
        sourceSequenceItemId: 'source-sequence-1',
        action: 'preserve',
        startFrame: 0,
        endFrameExclusive: totalFrames,
        reason: 'Preserve source meaning before approved cleanup.',
        confidence: 1,
        meaningPreservationStatus: 'passed',
        userReviewStatus: 'not_required',
      }],
    },
    masterTimingPlan: {
      id: 'master-timing-1',
      status: 'ready',
      timingBase: { fps, totalFrames },
      totalFrames,
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
      fps,
      totalFrames,
    },
    segments: [{
      segmentId: 'segment-whole-source',
      startFrame: 0,
      endFrameExclusive: totalFrames,
      operationIds: ['operation-whole-source'],
    }],
    visualAssetPlan: { status: 'source_led' },
    colorPipelinePlan: { status: 'not_provided' },
    rendererPlan: { renderer: 'remotion', frameOwnedByRenderer: true },
    toolStrategyPlan: { strategy: 'quality_first_gpu_only' },
    qaPlan: { checks: ['complete_source', 'meaning', 'visual', 'audio'] },
    qaSummary: { status: 'passed', approvalBlocked: false },
    providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
    fallbackPolicy: { unapprovedFallbackAllowed: false },
  }
}

function hash(character: string): string {
  return character.repeat(64)
}
