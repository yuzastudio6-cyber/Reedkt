import type {
  LivingFrameExpectationRef,
  LivingFrameProfessionalSkillComponent,
  LivingFrameProfessionalSkillComponentDraft,
} from '../../types/living-frame'
import type {
  ProfessionalSkillPlan,
  ProfessionalSkillSelection,
} from '../../types/professional-skills'
import {
  LIVING_FRAME_PLANNING_ONLY_AUTHORITY_BOUNDARY,
  createLivingFrameProfessionalSkillComponent,
  deriveLivingFrameEstimateInputs,
} from './living-frame-contract'
import { LIVING_FRAME_PROFESSIONAL_SKILL_ID } from './living-frame-selection-policy'

export const LIVING_FRAME_CANONICAL_PLANNING_BINDING_VERSION =
  'living-frame-canonical-planning-binding-v1' as const

const CLOSED_GATE_CODES = [
  'canonical_planner_integration_required',
  'canonical_timing_revalidation_required',
  'canonical_estimate_required',
  'canonical_approval_required',
  'approved_snapshot_required',
  'controlled_illustration_qualification_required',
  'provider_route_review_required',
  'worker_schema_admission_required',
  'artifact_qa_required',
  'private_remotion_review_required',
  'identity_safety_review_required',
  'documentary_fact_verification_required',
  'temporal_mask_benchmark_required',
] as const

const FUTURE_VIDEO_UNDERSTANDING_EXPECTATION = Object.freeze({
  expectation: 'future_worker_evidence_required',
  kind: 'video_understanding',
  version: LIVING_FRAME_CANONICAL_PLANNING_BINDING_VERSION,
} as const)

const FUTURE_ADAPTIVE_STRATEGY_EXPECTATION = Object.freeze({
  expectation: 'future_worker_evidence_required',
  kind: 'adaptive_strategy',
  version: LIVING_FRAME_CANONICAL_PLANNING_BINDING_VERSION,
} as const)

type LivingFrameCanonicalSourceComponents = {
  readonly compiledIntent: Readonly<Record<string, unknown>>
  readonly confirmedSettings: {
    readonly aspectRatio: string
    readonly outputFrame: {
      readonly width: number
      readonly height: number
      readonly fps: number
    }
    readonly outputFrameConfirmed: true
    readonly outputFramePurpose: 'private_canonical_4k_master_review'
  }
  readonly sourceSequence: readonly unknown[]
  readonly masterTimingPlan: Readonly<Record<string, unknown>>
  readonly segments: readonly Readonly<Record<string, unknown>>[]
}

export interface BindLivingFrameCanonicalPlanningInput {
  readonly professionalSkillPlan?: ProfessionalSkillPlan
  readonly components: LivingFrameCanonicalSourceComponents
}

export interface BindLivingFrameCanonicalPlanningResult {
  readonly professionalSkillPlan?: ProfessionalSkillPlan
  readonly livingFrame?: LivingFrameProfessionalSkillComponent
}

export async function bindLivingFrameCanonicalPlanning(
  input: BindLivingFrameCanonicalPlanningInput,
): Promise<BindLivingFrameCanonicalPlanningResult> {
  const professionalSkillPlan = input.professionalSkillPlan
  if (!professionalSkillPlan) return {}

  const selections = professionalSkillPlan.selectedSkills.filter(
    (selection) => selection.skillId === LIVING_FRAME_PROFESSIONAL_SKILL_ID,
  )
  if (selections.length === 0) {
    return {
      professionalSkillPlan: withoutLivingFrameComponent(professionalSkillPlan),
    }
  }
  if (selections.length !== 1) {
    throw new Error('Living Frame canonical planning requires exactly one selected parent.')
  }
  assertDeferredParentSelection(selections[0]!)

  const livingFrame = await createDeferredLivingFrameComponent(input.components)
  return {
    professionalSkillPlan: {
      ...withoutLivingFrameComponent(professionalSkillPlan),
      livingFrame,
    },
    livingFrame,
  }
}

export async function calculateLivingFrameCanonicalSourceDigest(
  value: unknown,
): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Living Frame canonical planning requires browser-safe SHA-256.')
  }
  const canonicalJson = canonicalJsonStringify(value)
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalJson),
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function livingFrameOutputFrameDigestProjection(
  components: {
    readonly confirmedSettings: {
      readonly aspectRatio: string
      readonly outputFrame: {
        readonly width: number
        readonly height: number
        readonly fps: number
      }
      readonly outputFrameConfirmed: true
      readonly outputFramePurpose: 'private_canonical_4k_master_review'
    }
  },
) {
  return {
    aspectRatio: components.confirmedSettings.aspectRatio,
    outputFrame: components.confirmedSettings.outputFrame,
    outputFrameConfirmed: components.confirmedSettings.outputFrameConfirmed,
    outputFramePurpose: components.confirmedSettings.outputFramePurpose,
  }
}

export function livingFrameFutureVideoUnderstandingExpectation() {
  return { ...FUTURE_VIDEO_UNDERSTANDING_EXPECTATION }
}

export function livingFrameFutureAdaptiveStrategyExpectation() {
  return { ...FUTURE_ADAPTIVE_STRATEGY_EXPECTATION }
}

async function createDeferredLivingFrameComponent(
  components: LivingFrameCanonicalSourceComponents,
): Promise<LivingFrameProfessionalSkillComponent> {
  const outputFrame = components.confirmedSettings.outputFrame
  const [aspectRatioNumerator, aspectRatioDenominator] = reduceRatio(
    outputFrame.width,
    outputFrame.height,
  )
  const compiledIntent = await expectationRef(
    'canonical.compiled-intent',
    components.compiledIntent,
    'controlled_unverified_evidence',
  )
  const sourceSequence = await expectationRef(
    'canonical.source-sequence',
    components.sourceSequence,
    'controlled_unverified_evidence',
  )
  const videoUnderstanding = await expectationRef(
    'canonical.video-understanding.future',
    FUTURE_VIDEO_UNDERSTANDING_EXPECTATION,
    'future_worker_evidence_required',
  )
  const adaptiveStrategy = await expectationRef(
    'canonical.adaptive-strategy.future',
    FUTURE_ADAPTIVE_STRATEGY_EXPECTATION,
    'future_worker_evidence_required',
  )
  const outputFrameExpectationRefId = 'canonical.output-frame'
  const masterTimingExpectationRefId = 'canonical.master-timing'
  const draft: LivingFrameProfessionalSkillComponentDraft = {
    contractVersion: 'living-frame-professional-skill-component-v1',
    contractSource: 'living_frame_contract_planning_only',
    status: 'deferred',
    runtimeReadiness: 'type_contract_only',
    authorityBoundary: LIVING_FRAME_PLANNING_ONLY_AUTHORITY_BOUNDARY,
    inputBindings: {
      compiledIntent,
      sourceSequence,
      videoUnderstanding,
      adaptiveStrategy,
      outputFrame: {
        expectationRefId: outputFrameExpectationRefId,
        expectedDigestSha256: await calculateLivingFrameCanonicalSourceDigest(
          livingFrameOutputFrameDigestProjection(components),
        ),
        evidenceClass: 'controlled_unverified_evidence',
        confirmationStatus: 'expected_confirmed',
        expectedWidth: outputFrame.width,
        expectedHeight: outputFrame.height,
        expectedAspectRatioNumerator: aspectRatioNumerator,
        expectedAspectRatioDenominator: aspectRatioDenominator,
        liveAuthorityVerified: false,
      },
      masterTiming: {
        expectationRefId: masterTimingExpectationRefId,
        expectedDigestSha256: await calculateLivingFrameCanonicalSourceDigest(
          components.masterTimingPlan,
        ),
        evidenceClass: 'controlled_unverified_evidence',
        bindingStatus: 'expected_current',
        exactFrameAuthorityProvided: false,
        liveAuthorityVerified: false,
      },
      safeZoneRefs: [],
      faceProtectionRefs: [],
      gestureProtectionRefs: [],
      factSafetyRefs: [],
      characterSafetyRefs: [],
      segmentExpectations: await Promise.all(
        components.segments.map(async (segment, order) => ({
          segmentExpectationId: `living-frame.segment.${order + 1}`,
          order,
          sourceSegmentRef: await expectationRef(
            `canonical.segment.${order + 1}`,
            segment,
            'controlled_unverified_evidence',
          ),
          outputFrameExpectationRefId,
          masterTimingExpectationRefId,
        })),
      ),
    },
    decisionSummary: {
      decision: 'deferred',
      reasonCode: 'capability_qualification_required',
      summary:
        'Living Frame is source-bound but deferred until canonical timing, capability, estimate, approval, and review gates are satisfied.',
      selectedMode: null,
      rejectedConcepts: [],
    },
    scenePlans: [],
    continuityPackRefs: [],
    capabilityRequirements: [],
    estimateInputs: deriveLivingFrameEstimateInputs({
      scenePlans: [],
      continuityReferenceCount: 0,
      topLevelQaExpectationCount: 0,
      motionComplexity: 'none',
      cameraComplexity: 'none',
      controlledIllustrationComplexity: 'none',
      generatedVideoExpectation: 'not_required',
    }),
    qaExpectationCodes: [],
    closedGateCodes: CLOSED_GATE_CODES,
  }
  return createLivingFrameProfessionalSkillComponent(draft)
}

async function expectationRef(
  expectationRefId: string,
  value: unknown,
  evidenceClass: LivingFrameExpectationRef['evidenceClass'],
): Promise<LivingFrameExpectationRef> {
  return {
    expectationRefId,
    expectedDigestSha256: await calculateLivingFrameCanonicalSourceDigest(value),
    evidenceClass,
  }
}

function withoutLivingFrameComponent(
  plan: ProfessionalSkillPlan,
): ProfessionalSkillPlan {
  const withoutComponent = { ...plan }
  delete withoutComponent.livingFrame
  return withoutComponent
}

function assertDeferredParentSelection(
  selection: ProfessionalSkillSelection,
): void {
  if (
    selection.executionModes.length !== 1
    || selection.executionModes[0] !== 'plan_only'
    || selection.backendIntents.length !== 0
    || selection.hiddenAdapterToolNames.length !== 0
  ) {
    throw new Error(
      'Living Frame parent selection is not eligible for deferred canonical planning.',
    )
  }
}

function reduceRatio(numerator: number, denominator: number): [number, number] {
  let left = numerator
  let right = denominator
  while (right !== 0) {
    const remainder = left % right
    left = right
    right = remainder
  }
  return [numerator / left, denominator / left]
}

function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalJsonValue(value))
}

function canonicalJsonValue(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
  ) return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Canonical JSON rejects non-finite numbers.')
    return value
  }
  if (Array.isArray(value)) return value.map(canonicalJsonValue)
  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => {
          if (nested === undefined) {
            throw new Error('Canonical JSON rejects undefined values.')
          }
          return [key, canonicalJsonValue(nested)]
        }),
    )
  }
  throw new Error('Canonical JSON accepts plain JSON values only.')
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
