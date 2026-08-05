import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  VisualInspectionRequirement,
  VisualIntelligenceEvidence,
  VisualIntelligenceEvidenceRef,
  VisualIntelligencePreparedEvidence,
  VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualInspectionRequirement,
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligenceRequest,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  approvedVisualIntelligenceInspectionRequestId,
  createVisualIntelligenceCanonicalRequestPackageStore,
} from '../visual-intelligence/visual-intelligence-canonical-request-package-store'
import {
  getVisualIntelligenceProfileDefinition,
  VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from '../visual-intelligence/visual-intelligence-profile-registry'
import {
  createControlledVisualIntelligenceRuntimeRelease,
  visualIntelligenceRuntimeReleaseRef,
} from '../visual-intelligence/visual-intelligence-runtime-release'

const rawSha = (value: string | Buffer) => createHash('sha256')
  .update(value).digest('hex')
const ref = (id: string, value: unknown = { id }) =>
  createVisualIntelligenceEvidenceRef(id, value)
const frameRate = { numerator: 24, denominator: 1 } as const
const fullRange = {
  startFrame: 0,
  endFrameExclusive: 240,
  frameRate,
} as const

class MemoryObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly values = new Map<string, Buffer>()

  async createOnly(input: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(rawSha(input.body), input.contentSha256)
    if (this.values.has(input.objectPath)) return 'already_exists'
    this.values.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }

  async readExact(objectPath: string): Promise<Buffer | null> {
    const value = this.values.get(objectPath)
    return value ? Buffer.from(value) : null
  }
}

const rateAuthorityRef = ref('billing-account-effective-rate')
const runtimeRelease = createControlledVisualIntelligenceRuntimeRelease({
  schemaVersion: 'visual-intelligence-runtime-release-v1',
  evidenceClass:
    'canonical_immutable_visual_intelligence_gemini_pro_high_release_reread',
  projectId: 'reeditpro',
  vertexLocation: 'global',
  lifecycleBucketName: 'reeditpro-private-lifecycle',
  runtimeReleaseIdentityRef: ref('visual-intelligence-runtime-release'),
  lifecycleRepositoryReleaseRef: ref('visual-intelligence-lifecycle-release'),
  concurrencyOwnerReleaseRef: ref('visual-intelligence-concurrency-release'),
  sourceEvidencePreparationReleaseRef: ref('visual-intelligence-evidence-release'),
  providerModelAccessQualificationRef: ref('gemini-model-access-qualification'),
  providerTransportQualificationRef: ref('gemini-transport-qualification'),
  providerPrivacyRetentionReviewRef: ref('gemini-privacy-review'),
  promptInjectionSafetyQualificationRef: ref('gemini-injection-safety'),
  structuredOutputQualificationRef: ref('gemini-structured-output'),
  professionalHighQualityBenchmarkRef: ref('gemini-professional-high-benchmark'),
  accountEffectivePricingAuthorityRef: rateAuthorityRef,
  accountEffectiveCostSettlementOwnerRef: ref('gemini-cost-owner-release'),
  capabilityId: 'visual_intelligence',
  providerAdapterId: 'vertex_gemini_pro',
  providerId: 'google_vertex_ai',
  exactModelId: 'gemini-3.1-pro-preview',
  qualityProfile: 'professional_high',
  thinkingLevel: 'high',
  mediaResolution: 'high',
  providerAuthentication: 'vertex_application_default_credentials',
  providerSdkPackage: '@google/genai',
  providerSdkVersion: '2.15.0',
  providerApiVersion: 'v1alpha',
  providerAdapterVersion: 'vertex-gemini-pro-visual-intelligence-adapter-v3',
  profileRegistryVersion: 'visual-intelligence-profile-registry-v2',
  promptVersion: VISUAL_INTELLIGENCE_PROMPT_VERSION,
  responseSchemaVersion: VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
  deterministicEvidenceVersion:
    VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  exactModelAccessQualified: true,
  vertexAdcAndServiceAccountIamQualified: true,
  professionalHighThinkingAndMediaResolutionQualified: true,
  completeSourceNativeVideoTransportQualified: true,
  strictStructuredOutputQualified: true,
  promptInjectionSafetyQualified: true,
  privateMediaPrivacyAndRetentionQualified: true,
  lifecycleRepositoryCreateOnlyAndRereadQualified: true,
  durableAttemptConsumptionQualified: true,
  distributedConcurrencyQualified: true,
  deterministicGpuEvidencePreparationQualified: true,
  accountEffectivePricingAuthorityQualified: true,
  accountEffectiveCostSettlementQualified: true,
  authenticatedUserTriggerRequired: true,
  automaticProviderRetryAllowed: false,
  uncertainProviderOutcomeRetryAllowed: false,
  apiKeyAuthenticationAllowed: false,
  providerToolsAllowed: false,
  searchGroundingAllowed: false,
  urlContextAllowed: false,
  codeExecutionAllowed: false,
  flashFallbackAllowed: false,
  cheaperModelFallbackAllowed: false,
  qwenVisualFallbackAllowed: false,
  selfHostedVisualModelFallbackAllowed: false,
  publicListPriceSettlementAllowed: false,
  callerReleaseObservationAccepted: false,
  directTimelineMutationAllowed: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})
const providerReleaseRef = visualIntelligenceRuntimeReleaseRef(runtimeRelease)
const objectPort = new MemoryObjectPort()
const store = createVisualIntelligenceCanonicalRequestPackageStore({
  objectPort,
  runtimeRelease,
})

const sourceRequest = buildSourceRequest()
const sourcePrepared = preparedEvidence(sourceRequest)
const sourceOwnerRef = ref('canonical-source-owner-package')
const first = await store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: sourceRequest,
  preparedEvidence: sourcePrepared,
  inspectionRequirement: null,
})
assert.equal(first.disposition, 'created')
assert.equal(first.packageRef.contentHash.startsWith('sha256:'), true)
const replay = await store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: sourceRequest,
  preparedEvidence: sourcePrepared,
  inspectionRequirement: null,
})
assert.equal(replay.disposition, 'identical_replay')
assert.deepEqual(replay.packageRef, first.packageRef)
assert.deepEqual(replay.admissionRef, first.admissionRef)

const admission = await store.verifyAndRereadExact(sourceRequest)
assert.equal(admission.status, 'admitted')
assert.equal(admission.exactScopeRereadVerified, true)
assert.equal(admission.exactArtifactAuthorityRereadVerified, true)
assert.equal(admission.exactCostPreflightRereadVerified, true)
assert.equal(admission.killSwitchesVerifiedClosed, true)
assert.equal(admission.retentionPrivacyVerified, true)
const rereadPrepared = await store.prepare({
  request: sourceRequest,
  admissionRef: first.admissionRef,
})
assert.deepEqual(rereadPrepared, sourcePrepared)
assert.notEqual(rereadPrepared, sourcePrepared)

const noAudioRequest = buildSourceRequest(
  'visual-source-no-audio-idempotency-1',
  'visual-source-no-audio-request-1',
)
const noAudioPreparedBase = preparedEvidence(noAudioRequest)
const noAudioPrepared: VisualIntelligencePreparedEvidence = {
  ...noAudioPreparedBase,
  deterministicEvidence: noAudioPreparedBase.deterministicEvidence.filter(
    (evidence) => evidence.producingTool !== 'faster_whisper',
  ),
  transcriptVersion: null,
  conditionalToolDecisions: noAudioPreparedBase.conditionalToolDecisions.map(
    (decision) => decision.tool === 'faster_whisper'
      ? {
        ...decision,
        disposition: 'not_required_no_audio' as const,
        decisionEvidenceRef:
          noAudioRequest.sourceArtifacts[0]!.mediaProbeEvidenceRef,
      }
      : decision,
  ),
  toolExecutionEvidence: noAudioPreparedBase.toolExecutionEvidence.filter(
    (execution) => execution.tool !== 'faster_whisper',
  ),
}
const noAudioPackage = await store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: noAudioRequest,
  preparedEvidence: noAudioPrepared,
  inspectionRequirement: null,
})
assert.equal(noAudioPackage.disposition, 'created')
assert.equal(noAudioPrepared.transcriptVersion, null)
assert.equal(
  noAudioPrepared.toolExecutionEvidence.some(
    (execution) => execution.tool === 'faster_whisper',
  ),
  false,
)

const requirement = createVisualInspectionRequirement({
  inspectionId: 'caption-layout-inspection-1',
  owningWorkNodeId: 'caption-render-work-1',
  owningSkillId: 'caption_render_qa',
  profile: 'caption_layout_qa',
  expectedOutcomeRefs: [ref('caption-approved-layout')],
  requestedRanges: [fullRange],
  required: true,
  blocksNextWorkNode: true,
  blocksPreview: false,
  blocksFinalExport: true,
  currentRepairCycle: 0,
})
await assert.rejects(
  () => store.prepareApprovedEditInspectionRequest({ requirement }),
  /not ready/u,
)
const inspectionRequest = buildInspectionRequest(requirement)
const inspectionPrepared = preparedEvidence(inspectionRequest)
const inspectionPackage = await store.persistCreateOnly({
  ownerClass: 'canonical_approved_edit_inspection_owner',
  ownerAuthorityRef: ref('approved-edit-inspection-owner-package'),
  request: inspectionRequest,
  preparedEvidence: inspectionPrepared,
  inspectionRequirement: requirement,
})
assert.equal(inspectionPackage.disposition, 'created')
assert.equal(
  approvedVisualIntelligenceInspectionRequestId(requirement),
  inspectionRequest.requestId,
)
assert.deepEqual(
  await store.prepareApprovedEditInspectionRequest({ requirement }),
  inspectionRequest,
)

let adversarialRefusals = 0
async function rejects(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(action)
  adversarialRefusals += 1
}

await rejects(() => store.prepare({
  request: sourceRequest,
  admissionRef: ref('caller-invented-admission'),
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: buildSourceRequest('visual-source-request-idempotency-changed'),
  preparedEvidence: sourcePrepared,
  inspectionRequirement: null,
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: sourceRequest,
  preparedEvidence: {
    ...sourcePrepared,
    conditionalToolDecisions: [],
  },
  inspectionRequirement: null,
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: sourceRequest,
  preparedEvidence: {
    ...sourcePrepared,
    deterministicEvidence: sourcePrepared.deterministicEvidence.filter(
      (evidence) => evidence.producingTool !== 'faster_whisper',
    ),
    toolExecutionEvidence: sourcePrepared.toolExecutionEvidence.filter(
      (execution) => execution.tool !== 'faster_whisper',
    ),
  },
  inspectionRequirement: null,
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: sourceRequest,
  preparedEvidence: {
    ...sourcePrepared,
    coveragePlan: {
      ...sourcePrepared.coveragePlan,
      sceneBoundaryRefs: [ref('caller-invented-scene-boundary')],
    },
  },
  inspectionRequirement: null,
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: sourceRequest,
  preparedEvidence: {
    ...sourcePrepared,
    coveragePlan: {
      ...sourcePrepared.coveragePlan,
      samplingPolicies: sourcePrepared.coveragePlan.samplingPolicies.map(
        (policy, index) => index === 0
          ? { ...policy, samplingPolicyRef: ref('caller-invented-sampling') }
          : policy,
      ),
    },
  },
  inspectionRequirement: null,
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: sourceRequest,
  preparedEvidence: {
    ...sourcePrepared,
    deterministicEvidence: [
      ...sourcePrepared.deterministicEvidence,
      sourcePrepared.deterministicEvidence[0]!,
    ],
  },
  inspectionRequirement: null,
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: sourceRequest,
  preparedEvidence: {
    ...sourcePrepared,
    toolExecutionEvidence: sourcePrepared.toolExecutionEvidence.map(
      (execution, index) => index === 1
        ? {
          ...execution,
          executionRef: sourcePrepared.toolExecutionEvidence[0]!.executionRef,
        }
        : execution,
    ),
  },
  inspectionRequirement: null,
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_approved_edit_inspection_owner',
  ownerAuthorityRef: ref('wrong-owner'),
  request: sourceRequest,
  preparedEvidence: sourcePrepared,
  inspectionRequirement: requirement,
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: sourceRequest,
  preparedEvidence: {
    ...sourcePrepared,
    privateMediaInputs: [{
      ...sourcePrepared.privateMediaInputs[0]!,
      gcsUri: 'https://caller.example/source.mp4',
    }],
  },
  inspectionRequirement: null,
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: sourceRequest,
  preparedEvidence: {
    ...sourcePrepared,
    toolExecutionEvidence: sourcePrepared.toolExecutionEvidence.map(
      (execution, index) => index === 0
        ? { ...execution, substantiveCpuExecutionUsed: true as never }
        : execution,
    ),
  },
  inspectionRequirement: null,
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: { ...sourceRequest, callerPromptAccepted: true } as never,
  preparedEvidence: sourcePrepared,
  inspectionRequirement: null,
}))
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: Object.create({ id: 'inherited-ref' }) as never,
  request: sourceRequest,
  preparedEvidence: sourcePrepared,
  inspectionRequirement: null,
}))
const cyclic = { ...sourcePrepared } as Record<string, unknown>
cyclic.self = cyclic
await rejects(() => store.persistCreateOnly({
  ownerClass: 'canonical_source_or_reference_owner',
  ownerAuthorityRef: sourceOwnerRef,
  request: sourceRequest,
  preparedEvidence: cyclic as never,
  inspectionRequirement: null,
}))
const accessorRequest = { ...sourceRequest } as Record<string, unknown>
Object.defineProperty(accessorRequest, 'requestId', {
  enumerable: true,
  get() { throw new Error('getter must not run') },
})
await rejects(() => store.verifyAndRereadExact(accessorRequest as never))
await rejects(() => store.prepareApprovedEditInspectionRequest({
  requirement: {
    ...requirement,
    requestedRanges: [{ ...fullRange, endFrameExclusive: 239 }],
  },
}))

const sourcePath = [...objectPort.values.keys()].find((path) => {
  const value = objectPort.values.get(path)
  return value?.includes(Buffer.from(sourceRequest.requestId))
})
assert.ok(sourcePath)
const tamperedRecord = JSON.parse(
  objectPort.values.get(sourcePath)!.toString('utf8'),
) as Record<string, unknown>
tamperedRecord.directTimelineMutationAllowed = true
objectPort.values.set(sourcePath, Buffer.from(JSON.stringify(tamperedRecord)))
await rejects(() => store.verifyAndRereadExact(sourceRequest))

assert.equal(adversarialRefusals, 17)
console.log(JSON.stringify({
  status: 'visual_intelligence_canonical_request_package_store_smoke_passed',
  sourceCreateOnlyPersisted: true,
  identicalReplayAccepted: true,
  exactRereadVerified: true,
  approvedInspectionOwnerVerified: true,
  privateGpuEvidenceOnly: true,
  canonicalNoAudioBypassVerified: true,
  browserOrCallerPackageAccepted: false,
  directTimelineMutationAllowed: false,
  adversarialRefusals,
}))

function buildSourceRequest(
  idempotencyKey = 'visual-source-request-idempotency-1',
  requestId = 'visual-source-request-1',
): VisualIntelligenceRequest {
  const finalizedRef = ref('source-finalized')
  const probeRef = ref('source-probe')
  return createVisualIntelligenceRequest({
    requestId,
    idempotencyKey,
    scope: {
      ownerUserId: 'user-1',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      editSessionId: 'edit-1',
      approvedSnapshotId: null,
    },
    operation: 'analyze_media',
    profile: 'source_edit_planning',
    sourceArtifacts: [artifact({
      artifactId: 'source-video-1',
      checksumSha256: rawSha('source-video-1'),
      finalizedRef,
      probeRef,
    })],
    comparisonArtifacts: [],
    requestedRanges: [fullRange],
    requiredEvidenceRefs: [probeRef],
    expectedOutcomeRefs: [],
    outputFrame: null,
    protectedZones: [],
    qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
    admission: {
      mode: 'planning_evidence',
      authenticatedPrincipalRef: ref('principal'),
      workspaceAuthorizationRef: ref('workspace-authorization'),
      finalizedSourceAuthorityRefs: [finalizedRef],
      sourceChecksumSetRef: ref('source-checksum-set'),
      analysisAllowanceRef: ref('analysis-allowance'),
      costPreflight: costPreflight(),
      retentionPolicyRef: ref('retention-policy'),
      privacyPolicyRef: ref('privacy-policy'),
      providerReleaseRef,
      globalKillSwitchOpen: false,
      providerKillSwitchOpen: false,
      reportPersistenceAllowed: true,
      timelineMutationAllowed: false,
      editingWorkerExecutionAllowed: false,
      generationAllowed: false,
      renderAllowed: false,
      exportAllowed: false,
      deliveryAllowed: false,
    },
    callerQuestion: null,
    byteFreeRequest: true,
    callerPromptAccepted: false,
    providerCredentialIncluded: false,
    publicMediaUrlIncluded: false,
    signedUrlIsSourceTruth: false,
    shellCommandIncluded: false,
    providerToolDefinitionIncluded: false,
  })
}

function buildInspectionRequest(
  requirement: VisualInspectionRequirement,
): VisualIntelligenceRequest {
  const finalizedRef = ref('preview-finalized')
  const probeRef = ref('preview-probe')
  const snapshotRef = ref('approved-snapshot-1')
  return createVisualIntelligenceRequest({
    requestId: approvedVisualIntelligenceInspectionRequestId(requirement),
    idempotencyKey:
      `vi-inspection-idempotency-${requirement.inspectionDigestSha256.slice(7, 39)}`,
    scope: {
      ownerUserId: 'user-1',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      editSessionId: 'edit-1',
      approvedSnapshotId: snapshotRef.id,
    },
    operation: 'inspect_edit',
    profile: requirement.profile,
    sourceArtifacts: [artifact({
      artifactId: 'approved-preview-1',
      checksumSha256: rawSha('approved-preview-1'),
      finalizedRef,
      probeRef,
      width: 1080,
      height: 1920,
    })],
    comparisonArtifacts: [],
    requestedRanges: requirement.requestedRanges,
    requiredEvidenceRefs: [probeRef],
    expectedOutcomeRefs: requirement.expectedOutcomeRefs,
    outputFrame: {
      outputId: 'vertical-master',
      width: 1080,
      height: 1920,
      aspectRatioLabel: '9:16',
      aspectRatioNumerator: 9,
      aspectRatioDenominator: 16,
      frameRate,
      confirmedOutputFrameRef: ref('confirmed-output-frame'),
      confirmedByUser: true,
    },
    protectedZones: [],
    qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
    admission: {
      mode: 'approved_edit_inspection',
      authenticatedPrincipalRef: ref('principal'),
      workspaceAuthorizationRef: ref('workspace-authorization'),
      approvedPlanSnapshotRef: snapshotRef,
      approvedEstimateRef: ref('approved-estimate'),
      creditReservationRef: ref('credit-reservation'),
      privatePreviewArtifactRef: ref('approved-preview-1'),
      expectedOutcomeRefs: requirement.expectedOutcomeRefs,
      workNodeRefs: [ref(requirement.owningWorkNodeId)],
      timelineRefs: [ref('master-timing')],
      qaPolicyRef: ref('caption-layout-qa-policy'),
      costPreflight: costPreflight(),
      retentionPolicyRef: ref('retention-policy'),
      privacyPolicyRef: ref('privacy-policy'),
      providerReleaseRef,
      globalKillSwitchOpen: false,
      providerKillSwitchOpen: false,
      reportPersistenceAllowed: true,
      timelineMutationAllowed: false,
      owningSkillRepairAllowed: true,
      directRepairAllowed: false,
      finalQaApprovalAllowed: false,
      exportReleaseAllowed: false,
      deliveryAllowed: false,
    },
    callerQuestion: null,
    byteFreeRequest: true,
    callerPromptAccepted: false,
    providerCredentialIncluded: false,
    publicMediaUrlIncluded: false,
    signedUrlIsSourceTruth: false,
    shellCommandIncluded: false,
    providerToolDefinitionIncluded: false,
  })
}

function artifact(input: {
  artifactId: string
  checksumSha256: string
  finalizedRef: VisualIntelligenceEvidenceRef
  probeRef: VisualIntelligenceEvidenceRef
  width?: number
  height?: number
}) {
  return {
    artifactId: input.artifactId,
    mediaKind: 'video' as const,
    contentType: 'video/mp4',
    checksumSha256: input.checksumSha256,
    byteLength: 1_000_000,
    width: input.width ?? 1920,
    height: input.height ?? 1080,
    durationFrames: fullRange.endFrameExclusive,
    frameRate,
    finalizedMediaAuthorityRef: input.finalizedRef,
    immutableStorageObjectAuthorityRef: ref(`${input.artifactId}-storage`),
    mediaProbeEvidenceRef: input.probeRef,
    privateArtifact: true as const,
    exactGenerationRereadRequiredAtDispatch: true as const,
  }
}

function costPreflight() {
  return {
    pricingSnapshotRef: ref('pricing-snapshot'),
    accountEffectiveRateAuthorityRef: rateAuthorityRef,
    currency: 'USD',
    maximumAuthorizedCostMicros: 100_000,
    estimatedMinimumCostMicros: 1_000,
    estimatedMaximumCostMicros: 20_000,
    serviceFeeIncluded: false as const,
    publicListPriceUsedAsSettlementAuthority: false as const,
    preflightPassed: true as const,
  }
}

function preparedEvidence(
  request: VisualIntelligenceRequest,
): VisualIntelligencePreparedEvidence {
  const profile = getVisualIntelligenceProfileDefinition(
    request.operation,
    request.profile,
  )
  const artifacts = [...request.sourceArtifacts, ...request.comparisonArtifacts]
  const transcriptRequired = profile.transcriptPolicy ===
    'required_when_speech_bears_meaning'
  const ocrRequired = profile.ocrPolicy === 'required_for_exact_visible_text'
  const sceneRequired = profile.toolPolicies.some((policy) =>
    policy.tool === 'pyscenedetect' && policy.requirement === 'required')
  const deterministicEvidence: VisualIntelligenceEvidence[] = artifacts.flatMap(
    (item) => {
      const base: VisualIntelligenceEvidence[] = [{
      evidenceId: item.mediaProbeEvidenceRef.id,
      evidenceRef: item.mediaProbeEvidenceRef,
      artifactId: item.artifactId,
      range: null,
      authority: 'media_probe',
      producingTool: 'ffprobe',
      toolVersion: 'ffprobe-8.0',
      summary: 'Canonical dimensions and rational frame timing were reread.',
      privateEvidence: true,
      providerInstructionAccepted: false,
      }]
      const additions: Array<Readonly<[
        string,
        VisualIntelligenceEvidence['authority'],
        VisualIntelligenceEvidence['producingTool'],
        string,
      ]>> = [
        ['ffmpeg-evidence', 'media_transform', 'ffmpeg', 'ffmpeg-8.0'],
        ['opencv-evidence', 'pixel_measurement', 'opencv', 'opencv-4.13'],
        ['sampling-ref', 'media_transform', 'ffmpeg', 'ffmpeg-8.0'],
        ...(sceneRequired ? [[
          'scene-boundaries', 'scene_detection', 'pyscenedetect',
          'pyscenedetect-0.7',
        ] as const] : []),
        ...(transcriptRequired ? [[
          'transcript', 'canonical_transcript', 'faster_whisper',
          'faster-whisper-large-v3-authority-v1',
        ] as const] : []),
        ...(ocrRequired ? [[
          'ocr', 'exact_ocr', 'ocr', 'paddleocr-exact-visible-text-v1',
        ] as const] : []),
      ]
      return [...base, ...additions.map(([
        suffix, authority, producingTool, toolVersion,
      ]) => {
        const evidenceRef = ref(`${request.requestId}-${suffix}-${item.artifactId}`)
        return {
          evidenceId: evidenceRef.id,
          evidenceRef,
          artifactId: item.artifactId,
          range: request.requestedRanges[0]!,
          authority,
          producingTool,
          toolVersion,
          summary: `Verified deterministic ${producingTool} evidence.`,
          privateEvidence: true as const,
          providerInstructionAccepted: false as const,
        }
      })]
    },
  )
  return {
    deterministicEvidence,
    coveragePlan: {
      requestedRanges: request.requestedRanges,
      analyzedRanges: request.requestedRanges,
      incompleteRanges: [],
      sceneBoundaryRefs: sceneRequired
        ? artifacts.map((item) => ref(
          `${request.requestId}-scene-boundaries-${item.artifactId}`,
        ))
        : [],
      samplingPolicies: request.requestedRanges.map((range, index) => ({
        policyId: `${request.requestId}-sampling-${index + 1}`,
        policyVersion: 'complete-scene-aware-v1',
        mode: 'scene_aware_complete_coverage',
        targetFramesPerSecondNumerator: 2,
        targetFramesPerSecondDenominator: 1,
        sceneAware: true,
        highDetail: true,
        requestedRange: range,
        analyzedRange: range,
        samplingPolicyRef: ref(
          `${request.requestId}-sampling-ref-${artifacts[0]!.artifactId}`,
        ),
      })),
      targetedFollowupRanges: [],
      completeRequestedRangeCoverage: true,
      everyTimelineFrameInspected: false,
      completeTimePixelInspectionClaimAllowed: false,
    },
    privateMediaInputs: artifacts.map((item) => ({
      artifactId: item.artifactId,
      gcsUri: `gs://weeditpro-private-media/${item.artifactId}.mp4`,
      contentType: item.contentType,
      checksumSha256: item.checksumSha256,
      exactGenerationRereadVerified: true,
    })),
    transcriptVersion: transcriptRequired
      ? 'faster-whisper-large-v3-authority-v1'
      : null,
    ocrVersion: ocrRequired
      ? 'paddleocr-exact-visible-text-v1'
      : null,
    conditionalToolDecisions: artifacts.flatMap((item) => [
      ...(transcriptRequired ? [{
        artifactId: item.artifactId,
        tool: 'faster_whisper' as const,
        disposition: 'executed' as const,
        decisionEvidenceRef: ref(
          `${request.requestId}-transcript-${item.artifactId}`,
        ),
        exactCanonicalDecisionRereadVerified: true as const,
        callerDecisionAccepted: false as const,
      }] : []),
      ...(ocrRequired ? [{
        artifactId: item.artifactId,
        tool: 'ocr' as const,
        disposition: 'executed' as const,
        decisionEvidenceRef: ref(
          `${request.requestId}-ocr-${item.artifactId}`,
        ),
        exactCanonicalDecisionRereadVerified: true as const,
        callerDecisionAccepted: false as const,
      }] : []),
    ]),
    toolExecutionEvidence: profile.toolPolicies
      .filter((policy) => policy.requirement === 'required'
        || (policy.tool === 'faster_whisper' && transcriptRequired)
        || (policy.tool === 'ocr' && ocrRequired))
      .map((policy) => ({
        tool: policy.tool,
        requirement: policy.requirement === 'required'
          ? 'required' as const
          : 'conditional' as const,
        executionClass: policy.executionClass === 'a100_80gb_gpu_heavy'
          ? 'a100_80gb_gpu_heavy' as const
          : 'l4_gpu_standard' as const,
        releaseRef: ref(`${policy.tool}-qualified-release`),
        executionRef: ref(`${request.requestId}-${policy.tool}-execution`),
        substantiveCpuExecutionUsed: false as const,
        sourceArtifactChecksumBound: true as const,
      })),
    preparedEvidenceRef: ref(`${request.requestId}-prepared-evidence`, {
      requestDigestSha256: request.requestDigestSha256,
      artifactChecksums: artifacts.map((item) => item.checksumSha256),
    }),
  }
}
