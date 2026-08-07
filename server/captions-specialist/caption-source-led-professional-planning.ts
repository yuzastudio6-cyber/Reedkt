import { z } from 'zod'

import type {
  CaptionDomainClosedAuthorityBoundary,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CanonicalCaptionSourceLedProfessionalPlanningAuthority,
  CanonicalCaptionSourceLedProfessionalPlanningEstimateLine,
  CanonicalCaptionSourceLedProfessionalPlanningReadPort,
  CanonicalCaptionSourceLedProfessionalPlanningReadResult,
  CanonicalCaptionSourceLedProfessionalPlanningRequest,
} from '../../src/types/canonical-caption-source-led-professional-planning'
import {
  CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_AUTHORITY_VERSION,
  CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION,
  CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_REQUEST_VERSION,
} from '../../src/types/canonical-caption-source-led-professional-planning'
import type {
  CanonicalCaptionSpecialistPlanningProjection,
} from '../../src/types/canonical-caption-specialist-planning'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  parseProfessionalSkillCompositionTrace,
} from '../../src/lib/professional-skills/professional-skill-composition-trace'
import type {
  CanonicalEstimateInput,
  CanonicalPlanComponentsInput,
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  parseCaptionEarlyPlanningBundle,
} from './caption-early-planning'
import {
  parseCanonicalCaptionSpecialistPlanningBinding,
  prepareCanonicalCaptionSpecialistPlanningProjection,
} from './caption-canonical-work-planning'
import {
  canonicalCaptionMasterTimingDigest,
} from './caption-master-timing-authority'
import {
  assertCanonicalBrollMasterTimingProjectionBinding,
} from '../edit-skills/b-roll/b-roll-master-timing-projection-binding'

const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const safeKey = z.string().trim().min(1).max(240).regex(SAFE_KEY)
const sha256 = z.string().regex(SHA256)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planningRequestId: safeKey,
  outputId: safeKey,
}).strict()
const closedBoundarySchema = z.object({
  canonicalApprovalGranted: z.literal(false),
  snapshotMutationGranted: z.literal(false),
  timelineMutationGranted: z.literal(false),
  workCreationGranted: z.literal(false),
  providerDispatchGranted: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  costAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  finalCanvasAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const requestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_REQUEST_VERSION),
  requestId: safeKey,
  canonicalScope: scopeSchema,
  baseCanonicalPlanComponentsRef: refSchema,
  confirmedOutputFrame: z.object({
    width: z.number().int().min(320).max(16_384),
    height: z.number().int().min(180).max(16_384),
    fpsNumerator: z.number().int().positive().max(240_000),
    fpsDenominator: z.number().int().positive().max(10_000),
    confirmedOutputFrameRef: refSchema,
  }).strict(),
  masterTimingRef: refSchema,
  sourceSequenceRef: refSchema,
  confirmedCaptionMarkerSetRef: refSchema.nullable(),
  totalFrames: z.number().int().positive().max(54_000_000),
  captionSelectionMustComeFromProfessionalSkillTrace: z.literal(true),
  canonicalTranscriptMustBeRereadByOwner: z.literal(true),
  visualEvidenceMustBeRereadByOwner: z.literal(true),
  browserPlanComponentsAccepted: z.literal(false),
  browserCaptionSelectionAccepted: z.literal(false),
  rawChatIncluded: z.literal(false),
  transcriptTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  workCreationAuthorityGranted: z.literal(false),
  operationDispatchAuthorityGranted: z.literal(false),
  providerRuntimeAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const requestSchema = requestWithoutDigestSchema.extend({
  requestDigestSha256: sha256,
}).strict()
const estimateLineSchema = z.object({
  lineKey: safeKey,
  label: z.literal(
    'Caption specialist planning, rendering, and private review'),
  category: z.literal('caption_specialist'),
  estimatedCredits: z.number().int().positive().max(1_000_000),
  removable: z.literal(false),
  metadata: z.unknown(),
}).strict()
const authorityWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_AUTHORITY_VERSION),
  authorityId: safeKey,
  requestRef: refSchema,
  canonicalScope: scopeSchema,
  baseCanonicalPlanComponentsRef: refSchema,
  selectionDisposition: z.enum([
    'caption_design_selected', 'no_captions',
  ]),
  professionalSkillPlan: z.object({ compositionTrace: z.unknown() }).strict(),
  captionEarlyPlanningBundle: z.unknown(),
  captionSpecialistPlanningBinding: z.unknown(),
  captionEstimateLine: estimateLineSchema.nullable(),
  exactCanonicalOwnerReread: z.literal(true),
  stableDoubleRereadRequired: z.literal(true),
  existingApprovalInvalidatedOrMutated: z.literal(false),
  planPublished: z.literal(false),
  approvalGranted: z.literal(false),
  snapshotCreated: z.literal(false),
  workCreated: z.literal(false),
  creditReserved: z.literal(false),
  operationDispatched: z.literal(false),
  providerCalled: z.literal(false),
  assetCreated: z.literal(false),
  finalQaApproved: z.literal(false),
  publicDeliveryCreated: z.literal(false),
  productionReady: z.literal(false),
  privateArtifact: z.literal(true),
  byteFree: z.literal(true),
  authorityBoundary: closedBoundarySchema,
}).strict()
const authoritySchema = authorityWithoutDigestSchema.extend({
  authorityDigestSha256: sha256,
}).strict()

const CLOSED_AUTHORITY: CaptionDomainClosedAuthorityBoundary = Object.freeze({
  canonicalApprovalGranted: false,
  snapshotMutationGranted: false,
  timelineMutationGranted: false,
  workCreationGranted: false,
  providerDispatchGranted: false,
  runtimeExecutionGranted: false,
  assetCreationGranted: false,
  costAuthorityGranted: false,
  billingAuthorityGranted: false,
  finalQaApprovalGranted: false,
  finalCanvasAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})

const admittedReadPorts = new WeakSet<object>()

export function calculateCanonicalCaptionSourceLedProfessionalPlanningRequestDigest(
  value: object,
): string {
  return calculateSkillContractDigest(
    { ...value, requestDigestSha256: '' }, 'requestDigestSha256')
}

export function calculateCanonicalCaptionSourceLedProfessionalPlanningAuthorityDigest(
  value: object,
): string {
  return calculateSkillContractDigest(
    { ...value, authorityDigestSha256: '' }, 'authorityDigestSha256')
}

export function createCanonicalCaptionSourceLedProfessionalPlanningRequest(
  input: {
    canonicalScope:
      CanonicalCaptionSourceLedProfessionalPlanningRequest['canonicalScope']
    components: CanonicalPlanComponentsInput
    confirmedCaptionMarkerSetRef?: CaptionDomainRef | null
  },
): CanonicalCaptionSourceLedProfessionalPlanningRequest {
  assertNoCaptionPlanningComponents(input.components)
  const componentsHash = sha256AuthorityValue(input.components)
  const identitySuffix = sha256AuthorityValue({
    canonicalScope: input.canonicalScope,
    componentsHash,
    confirmedCaptionMarkerSetRef:
      input.confirmedCaptionMarkerSetRef ?? null,
  }).slice(0, 32)
  const confirmedFrameHash = sha256AuthorityValue({
    aspectRatio: input.components.confirmedSettings.aspectRatio,
    outputFrame: input.components.confirmedSettings.outputFrame,
  })
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_REQUEST_VERSION,
    requestId: `caption-source-led-plan.${identitySuffix}`,
    canonicalScope: structuredClone(input.canonicalScope),
    baseCanonicalPlanComponentsRef: {
      id: `caption-base-components.${identitySuffix}`,
      version: 'private-edit-authority-plan-components-v2',
      contentHash: componentsHash,
    },
    confirmedOutputFrame: {
      width: input.components.confirmedSettings.outputFrame.width,
      height: input.components.confirmedSettings.outputFrame.height,
      fpsNumerator: input.components.confirmedSettings.outputFrame.fps,
      fpsDenominator: 1,
      confirmedOutputFrameRef: {
        id: `caption-confirmed-frame.${identitySuffix}`,
        version: 'canonical-source-led-confirmed-output-frame-v1',
        contentHash: confirmedFrameHash,
      },
    },
    masterTimingRef: {
      id: `caption-master-timing.${identitySuffix}`,
      version: 'canonical-source-led-master-timing-ref-v1',
      contentHash: canonicalCaptionMasterTimingDigest(
        input.components.masterTimingPlan),
    },
    sourceSequenceRef: {
      id: `caption-source-sequence.${identitySuffix}`,
      version: 'canonical-source-sequence-ref-v1',
      contentHash: sha256AuthorityValue(input.components.sourceSequence),
    },
    confirmedCaptionMarkerSetRef:
      input.confirmedCaptionMarkerSetRef
        ? structuredClone(input.confirmedCaptionMarkerSetRef) : null,
    totalFrames: input.components.timingSummary.totalFrames,
    captionSelectionMustComeFromProfessionalSkillTrace: true as const,
    canonicalTranscriptMustBeRereadByOwner: true as const,
    visualEvidenceMustBeRereadByOwner: true as const,
    browserPlanComponentsAccepted: false as const,
    browserCaptionSelectionAccepted: false as const,
    rawChatIncluded: false as const,
    transcriptTextIncluded: false as const,
    mediaBytesIncluded: false as const,
    pathsUrlsOrCredentialsIncluded: false as const,
    workCreationAuthorityGranted: false as const,
    operationDispatchAuthorityGranted: false as const,
    providerRuntimeAuthorityGranted: false as const,
    assetMutationAuthorityGranted: false as const,
    finalQaApprovalAuthorityGranted: false as const,
    billingAuthorityGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return parseCanonicalCaptionSourceLedProfessionalPlanningRequest({
    ...withoutDigest,
    requestDigestSha256:
      calculateCanonicalCaptionSourceLedProfessionalPlanningRequestDigest(
        withoutDigest),
  })
}

export function parseCanonicalCaptionSourceLedProfessionalPlanningRequest(
  value: unknown,
): CanonicalCaptionSourceLedProfessionalPlanningRequest {
  assertClosedContractTree(
    value, 'Canonical Caption source-led planning request')
  const parsed = requestSchema.parse(value)
  if (
    parsed.requestDigestSha256 !==
      calculateCanonicalCaptionSourceLedProfessionalPlanningRequestDigest(
        parsed) ||
    parsed.totalFrames <= 0
  ) {
    throw new Error(
      'Canonical Caption source-led planning request digest or timing is invalid.',
    )
  }
  return structuredClone(parsed)
}

export function createCanonicalCaptionSourceLedProfessionalPlanningAuthority(
  input: {
    request: CanonicalCaptionSourceLedProfessionalPlanningRequest
    professionalSkillPlan:
      CanonicalCaptionSourceLedProfessionalPlanningAuthority['professionalSkillPlan']
    captionEarlyPlanningBundle:
      CanonicalCaptionSourceLedProfessionalPlanningAuthority['captionEarlyPlanningBundle']
    captionSpecialistPlanningBinding:
      CanonicalCaptionSourceLedProfessionalPlanningAuthority['captionSpecialistPlanningBinding']
    captionEstimateLine:
      CanonicalCaptionSourceLedProfessionalPlanningEstimateLine | null
  },
): CanonicalCaptionSourceLedProfessionalPlanningAuthority {
  const request = parseCanonicalCaptionSourceLedProfessionalPlanningRequest(
    input.request)
  const trace = parseProfessionalSkillCompositionTrace(
    input.professionalSkillPlan.compositionTrace)
  const selected = trace.entries[0].disposition === 'selected'
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_AUTHORITY_VERSION,
    authorityId: `${request.requestId}.authority`,
    requestRef: requestRef(request),
    canonicalScope: structuredClone(request.canonicalScope),
    baseCanonicalPlanComponentsRef:
      structuredClone(request.baseCanonicalPlanComponentsRef),
    selectionDisposition: selected
      ? 'caption_design_selected' as const
      : 'no_captions' as const,
    professionalSkillPlan: structuredClone(input.professionalSkillPlan),
    captionEarlyPlanningBundle:
      structuredClone(input.captionEarlyPlanningBundle),
    captionSpecialistPlanningBinding:
      structuredClone(input.captionSpecialistPlanningBinding),
    captionEstimateLine: input.captionEstimateLine
      ? structuredClone(input.captionEstimateLine) : null,
    exactCanonicalOwnerReread: true as const,
    stableDoubleRereadRequired: true as const,
    existingApprovalInvalidatedOrMutated: false as const,
    planPublished: false as const,
    approvalGranted: false as const,
    snapshotCreated: false as const,
    workCreated: false as const,
    creditReserved: false as const,
    operationDispatched: false as const,
    providerCalled: false as const,
    assetCreated: false as const,
    finalQaApproved: false as const,
    publicDeliveryCreated: false as const,
    productionReady: false as const,
    privateArtifact: true as const,
    byteFree: true as const,
    authorityBoundary: CLOSED_AUTHORITY,
  }
  return parseCanonicalCaptionSourceLedProfessionalPlanningAuthority({
    ...withoutDigest,
    authorityDigestSha256:
      calculateCanonicalCaptionSourceLedProfessionalPlanningAuthorityDigest(
        withoutDigest),
  }, request)
}

export function parseCanonicalCaptionSourceLedProfessionalPlanningAuthority(
  value: unknown,
  expectedRequest: CanonicalCaptionSourceLedProfessionalPlanningRequest,
): CanonicalCaptionSourceLedProfessionalPlanningAuthority {
  const request = parseCanonicalCaptionSourceLedProfessionalPlanningRequest(
    expectedRequest)
  assertClosedContractTree(
    value, 'Canonical Caption source-led planning authority')
  const parsed = authoritySchema.parse(value)
  const trace = parseProfessionalSkillCompositionTrace(
    parsed.professionalSkillPlan.compositionTrace)
  const bundle = parseCaptionEarlyPlanningBundle(
    parsed.captionEarlyPlanningBundle)
  const binding = parseCanonicalCaptionSpecialistPlanningBinding(
    parsed.captionSpecialistPlanningBinding)
  const selected = trace.entries[0].disposition === 'selected'
  const exactRange = bundle.canonicalScope.authorizedFrameRanges.length === 1
    && bundle.canonicalScope.authorizedFrameRanges[0]?.startFrame === 0
    && bundle.canonicalScope.authorizedFrameRanges[0]?.endFrameExclusive ===
      request.totalFrames
  if (
    parsed.authorityDigestSha256 !==
      calculateCanonicalCaptionSourceLedProfessionalPlanningAuthorityDigest(
        parsed) ||
    !exactRef(parsed.requestRef, requestRef(request)) ||
    !exactRef(
      parsed.baseCanonicalPlanComponentsRef,
      request.baseCanonicalPlanComponentsRef) ||
    !exactScope(parsed.canonicalScope, request.canonicalScope) ||
    parsed.selectionDisposition !== (selected
      ? 'caption_design_selected' : 'no_captions') ||
    (!selected && trace.entries[0].disposition !== 'restrained') ||
    bundle.canonicalScope.ownerUserId !== request.canonicalScope.ownerUserId ||
    bundle.canonicalScope.workspaceId !== request.canonicalScope.workspaceId ||
    bundle.canonicalScope.projectId !== request.canonicalScope.projectId ||
    bundle.canonicalScope.editSessionId !== request.canonicalScope.editSessionId ||
    bundle.canonicalScope.planVersionId !==
      request.canonicalScope.planningRequestId ||
    bundle.canonicalScope.outputId !== request.canonicalScope.outputId ||
    bundle.canonicalScope.sceneId !== null ||
    bundle.canonicalScope.approvedSnapshotRef !== null ||
    !exactRange ||
    bundle.confirmedOutputFrame.outputId !== request.canonicalScope.outputId ||
    bundle.confirmedOutputFrame.width !==
      request.confirmedOutputFrame.width ||
    bundle.confirmedOutputFrame.height !==
      request.confirmedOutputFrame.height ||
    bundle.confirmedOutputFrame.confirmedOutputFrameDigestSha256 !==
      request.confirmedOutputFrame.confirmedOutputFrameRef.contentHash ||
    !bundle.inputRefs.some((ref) => exactRef(ref, traceRef(trace))) ||
    binding.canonicalScope.ownerUserId !== request.canonicalScope.ownerUserId ||
    binding.canonicalScope.workspaceId !== request.canonicalScope.workspaceId ||
    binding.canonicalScope.projectId !== request.canonicalScope.projectId ||
    binding.canonicalScope.editSessionId !== request.canonicalScope.editSessionId ||
    binding.canonicalScope.planningRequestId !==
      request.canonicalScope.planningRequestId ||
    binding.canonicalScope.outputId !== request.canonicalScope.outputId ||
    binding.confirmedOutputFrame.width !==
      request.confirmedOutputFrame.width ||
    binding.confirmedOutputFrame.height !==
      request.confirmedOutputFrame.height ||
    binding.confirmedOutputFrame.fpsNumerator !==
      request.confirmedOutputFrame.fpsNumerator ||
    binding.confirmedOutputFrame.fpsDenominator !==
      request.confirmedOutputFrame.fpsDenominator ||
    !exactRef(binding.confirmedOutputFrame.confirmedOutputFrameRef,
      request.confirmedOutputFrame.confirmedOutputFrameRef) ||
    !exactRef(binding.masterTimingRef, request.masterTimingRef) ||
    !exactRef(binding.professionalSkillCompositionTraceRef,
      traceRef(trace)) ||
    !exactRef(binding.earlyPlanningBundleRef, bundleRef(bundle)) ||
    (selected ? parsed.captionEstimateLine === null
      : parsed.captionEstimateLine !== null)
  ) {
    throw new Error(
      'Canonical Caption source-led planning authority is stale, crossed, or semantically incomplete.',
    )
  }
  assertEstimateLineMatchesAuthority({
    line: parsed.captionEstimateLine as
      CanonicalCaptionSourceLedProfessionalPlanningEstimateLine | null,
    selected,
    traceRef: traceRef(trace),
    bundleRef: bundleRef(bundle),
    binding,
  })
  return {
    ...structuredClone(parsed),
    professionalSkillPlan: { compositionTrace: trace },
    captionEarlyPlanningBundle: bundle,
    captionSpecialistPlanningBinding: binding,
    captionEstimateLine: parsed.captionEstimateLine as
      CanonicalCaptionSourceLedProfessionalPlanningEstimateLine | null,
  }
}

export function createCanonicalCaptionSourceLedProfessionalPlanningReadPort(
  read: (
    request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
  ) => Promise<CanonicalCaptionSourceLedProfessionalPlanningReadResult>,
): CanonicalCaptionSourceLedProfessionalPlanningReadPort {
  if (typeof read !== 'function') {
    throw new Error('Canonical Caption planning read function is required.')
  }
  const port: CanonicalCaptionSourceLedProfessionalPlanningReadPort =
    Object.freeze({
      schemaVersion:
        CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION,
      readForSourceLedPlan: async (
        request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
      ) => read(
        parseCanonicalCaptionSourceLedProfessionalPlanningRequest(request)),
    })
  admittedReadPorts.add(port)
  return port
}

export async function readCanonicalCaptionSourceLedProfessionalPlanning(
  input: {
    port: CanonicalCaptionSourceLedProfessionalPlanningReadPort
    request: CanonicalCaptionSourceLedProfessionalPlanningRequest
  },
): Promise<CanonicalCaptionSourceLedProfessionalPlanningReadResult> {
  const request = parseCanonicalCaptionSourceLedProfessionalPlanningRequest(
    input.request)
  if (
    !admittedReadPorts.has(input.port) ||
    input.port.schemaVersion !==
      CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION
  ) {
    throw new Error(
      'Canonical Caption source-led planning requires an admitted read port.',
    )
  }
  const first = parseReadResult(
    await input.port.readForSourceLedPlan(request), request)
  const second = parseReadResult(
    await input.port.readForSourceLedPlan(request), request)
  if (stableAuthorityStringify(first) !== stableAuthorityStringify(second)) {
    throw new Error(
      'Canonical Caption source-led planning changed across exact reread.',
    )
  }
  return first
}

export function applyCanonicalCaptionSourceLedProfessionalPlanning(input: {
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest
  authority: CanonicalCaptionSourceLedProfessionalPlanningAuthority
  components: CanonicalPlanComponentsInput
  estimate: CanonicalEstimateInput
  workItems: CanonicalWorkItemInput[]
}): {
  components: CanonicalPlanComponentsInput
  estimate: CanonicalEstimateInput
  workItems: CanonicalWorkItemInput[]
  projection: CanonicalCaptionSpecialistPlanningProjection
} {
  const request = parseCanonicalCaptionSourceLedProfessionalPlanningRequest(
    input.request)
  const authority =
    parseCanonicalCaptionSourceLedProfessionalPlanningAuthority(
      input.authority, request)
  assertNoCaptionPlanningComponents(input.components)
  if (
    sha256AuthorityValue(input.components) !==
      request.baseCanonicalPlanComponentsRef.contentHash ||
    !exactRef(authority.baseCanonicalPlanComponentsRef,
      request.baseCanonicalPlanComponentsRef)
  ) {
    throw new Error(
      'Canonical Caption planning cannot attach to changed base plan components.',
    )
  }
  if (input.estimate.lineItems.some((line) =>
    line.category === 'caption_specialist')) {
    throw new Error(
      'Canonical source-led plan already contains a competing Caption estimate line.',
    )
  }
  const existingCaptionOverlayWork = input.workItems.filter((item) =>
    item.executionInput.operation === 'render_approved_caption_overlay' ||
    item.expectedOutputs.some((output) =>
      output.artifactType === 'controlled_libass_caption_overlay_png'))
  if (existingCaptionOverlayWork.length > 0 &&
    !isAuthenticatedTranscriptStableCaptionLane({
      components: input.components,
      workItems: existingCaptionOverlayWork,
    })) {
    throw new Error(
      'Professional Caption planning requires the legacy exact-marker caption lane to be removed before projection.',
    )
  }
  const components = {
    ...structuredClone(input.components),
    professionalSkillPlan:
      structuredClone(authority.professionalSkillPlan),
    captionEarlyPlanningBundle:
      structuredClone(authority.captionEarlyPlanningBundle),
    captionSpecialistPlanningBinding:
      structuredClone(authority.captionSpecialistPlanningBinding),
  } as unknown as CanonicalPlanComponentsInput
  const estimate: CanonicalEstimateInput = {
    ...structuredClone(input.estimate),
    lineItems: [
      ...structuredClone(input.estimate.lineItems),
      ...(authority.captionEstimateLine
        ? [{
            ...structuredClone(authority.captionEstimateLine),
            metadata: structuredClone(
              authority.captionEstimateLine.metadata,
            ) as unknown as Record<string, unknown>,
          }] : []),
    ],
  }
  const prepared = prepareCanonicalCaptionSpecialistPlanningProjection({
    ...request.canonicalScope,
    components,
    estimate,
    existingWorkItems: structuredClone(input.workItems),
  })
  if (!prepared.projection) {
    throw new Error(
      'Canonical Caption source-led planning did not create its projection.',
    )
  }
  return {
    components,
    estimate,
    workItems: [
      ...structuredClone(input.workItems),
      ...prepared.workItems,
    ],
    projection: prepared.projection,
  }
}

function isAuthenticatedTranscriptStableCaptionLane(input: {
  components: CanonicalPlanComponentsInput
  workItems: CanonicalWorkItemInput[]
}): boolean {
  const parsedCaptionTimingItems = z.array(z.object({
    linkedTranscriptLineId: safeKey,
  }).passthrough()).min(1).safeParse(
    input.components.masterTimingPlan.captionTimingItems,
  )
  if (!parsedCaptionTimingItems.success) return false
  const captionTimingItems = parsedCaptionTimingItems.data
  return input.workItems.length === captionTimingItems.length
    && input.workItems.every((item) =>
      item.executionInput.operation === 'render_approved_caption_overlay'
      && item.expectedOutputs.length === 1
      && item.expectedOutputs[0]?.artifactType ===
        'controlled_libass_caption_overlay_png')
}

function parseReadResult(
  value: unknown,
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
): CanonicalCaptionSourceLedProfessionalPlanningReadResult {
  assertClosedContractTree(
    value, 'Canonical Caption source-led planning read result')
  const base = z.object({
    schemaVersion: z.literal(
      CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION),
    status: z.enum(['not_requested', 'blocked_requested', 'ready']),
    requestRef: refSchema,
    authority: z.unknown().nullable(),
    blockerCodes: z.array(safeKey).max(64),
  }).strict().parse(value)
  if (!exactRef(base.requestRef, requestRef(request)) ||
    new Set(base.blockerCodes).size !== base.blockerCodes.length ||
    base.blockerCodes.join('|') !== [...base.blockerCodes].sort().join('|')) {
    throw new Error('Canonical Caption planning read result is crossed.')
  }
  if (base.status === 'not_requested') {
    if (base.authority !== null || base.blockerCodes.length !== 0) {
      throw new Error('Caption not-requested result is malformed.')
    }
    return { ...base, status: 'not_requested', authority: null,
      blockerCodes: [] }
  }
  if (base.status === 'blocked_requested') {
    if (base.authority !== null || base.blockerCodes.length === 0) {
      throw new Error('Caption blocked result requires exact blockers.')
    }
    return { ...base, status: 'blocked_requested', authority: null }
  }
  if (base.blockerCodes.length !== 0 || base.authority === null) {
    throw new Error('Caption ready result cannot retain blockers.')
  }
  return {
    ...base,
    status: 'ready',
    authority:
      parseCanonicalCaptionSourceLedProfessionalPlanningAuthority(
        base.authority, request),
    blockerCodes: [],
  }
}

function assertNoCaptionPlanningComponents(
  components: CanonicalPlanComponentsInput,
): void {
  if (
    components.captionEarlyPlanningBundle !== undefined ||
    components.captionSpecialistPlanningBinding !== undefined
  ) {
    throw new Error(
      'Canonical source-led Caption planning cannot replace or merge pre-existing Caption components.',
    )
  }
  if (components.bRollMasterTimingBinding) {
    assertCanonicalBrollMasterTimingProjectionBinding({
      binding: components.bRollMasterTimingBinding,
      canonicalMasterTimingPlan: components.masterTimingPlan,
      canonicalTimingSummary: components.timingSummary,
    })
  }
}

function requestRef(
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
): CaptionDomainRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function traceRef(
  trace: ReturnType<typeof parseProfessionalSkillCompositionTrace>,
): CaptionDomainRef {
  return {
    id: trace.traceId,
    version: trace.schemaVersion,
    contentHash: trace.traceDigestSha256,
  }
}

function bundleRef(
  bundle: ReturnType<typeof parseCaptionEarlyPlanningBundle>,
): CaptionDomainRef {
  return {
    id: bundle.bundleId,
    version: bundle.schemaVersion,
    contentHash: bundle.bundleDigestSha256,
  }
}

function exactRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version &&
    left.contentHash === right.contentHash
}

function exactScope(
  left: CanonicalCaptionSourceLedProfessionalPlanningRequest['canonicalScope'],
  right: CanonicalCaptionSourceLedProfessionalPlanningRequest['canonicalScope'],
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function assertEstimateLineMatchesAuthority(input: {
  line: CanonicalCaptionSourceLedProfessionalPlanningEstimateLine | null
  selected: boolean
  traceRef: CaptionDomainRef
  bundleRef: CaptionDomainRef
  binding: ReturnType<
    typeof parseCanonicalCaptionSpecialistPlanningBinding
  >
}): void {
  if (!input.selected) {
    if (input.line !== null) {
      throw new Error('no_captions cannot carry a Caption estimate line.')
    }
    return
  }
  if (!input.line) {
    throw new Error('Selected Caption planning requires its estimate line.')
  }
  const expected = {
    schemaVersion: 'canonical-caption-specialist-estimate-binding-v1',
    outputId: input.binding.canonicalScope.outputId,
    compositionTraceRef: input.traceRef,
    earlyPlanningBundleRef: input.bundleRef,
    captionEstimateInputRef: input.binding.captionEstimateInputRef,
    selectedComponentKeys: ['caption_design', 'caption_render_qa'],
    estimateOwnerRemainsCanonical: true,
    serviceFeeIncludedInCaptionWorkCost: false,
    billingAuthorityGrantedToCaption: false,
  }
  if (stableAuthorityStringify(input.line.metadata) !==
    stableAuthorityStringify(expected)) {
    throw new Error('Caption source-led estimate lineage is stale or crossed.')
  }
}
