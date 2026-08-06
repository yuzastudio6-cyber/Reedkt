import type {
  OrchestraEvidenceRef,
  OrchestraSkillCall,
  SkillQualificationSnapshot,
} from '../../src/types/orchestra-skill-capability'
import type {
  VisualIntelligenceArtifactBinding,
  VisualIntelligenceEvidence,
  VisualIntelligenceEvidenceRef,
  VisualIntelligencePlanningEvidenceAdmission,
  VisualIntelligencePreparedEvidence,
  VisualIntelligenceToolExecutionEvidence,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalSourceAnalysisOrchestraWork,
  type CanonicalSourceAnalysisOrchestraWorkReadPort,
} from '../orchestra/canonical-source-analysis-orchestra-coordinator'
import {
  CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_READ_PORT_VERSION,
} from '../orchestra/canonical-source-analysis-orchestra-coordinator'
import {
  CANONICAL_SKILL_QUALIFICATION_REGISTRY_VERSION,
  type CanonicalSkillQualificationRegistry,
} from '../orchestra/canonical-skill-qualification-registry'
import {
  orchestraDigest,
  orchestraEvidenceRef,
  parseOrchestraSkillCall,
  parseSkillCapabilityManifest,
  parseSkillQualificationSnapshot,
} from '../orchestra/orchestra-skill-capability-contract'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceReadPort,
  CanonicalSourceAnalysisL4VisualEvidenceResult,
} from './canonical-source-analysis-l4-visual-evidence-repository'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION,
  assertCanonicalSourceAnalysisL4VisualEvidenceResult,
} from './canonical-source-analysis-l4-visual-evidence-repository'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceToolArtifact,
  CanonicalSourceAnalysisL4VisualEvidenceToolArtifactReadPort,
} from './canonical-source-analysis-l4-visual-evidence-tool-artifact-owner'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_READ_PORT_VERSION,
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_ROLES,
  assertCanonicalSourceAnalysisL4VisualEvidenceToolArtifactSet,
  projectCanonicalSourceAnalysisL4VisualEvidenceToolArtifact,
} from './canonical-source-analysis-l4-visual-evidence-tool-artifact-owner'
import type {
  CanonicalSourceTranscriptOrchestraReadPort,
  CanonicalSourceTranscriptOrchestraReadScope,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'
import type {
  CanonicalSourceVisualIntelligenceOrchestraBindingScope,
} from './canonical-source-visual-intelligence-orchestra-result-bridge'
import {
  prepareCanonicalSourceVisualIntelligenceOrchestraBindingRequest,
} from './canonical-source-visual-intelligence-orchestra-result-bridge'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalVisualIntelligenceSourceTranscriptResult,
} from './canonical-source-visual-intelligence-analysis-contract'
import {
  assertCanonicalVisualIntelligenceSourceTranscriptResult,
} from './canonical-source-visual-intelligence-analysis-contract'
import type {
  VisualIntelligenceCanonicalPreparedEvidenceStore,
} from '../visual-intelligence/visual-intelligence-canonical-prepared-evidence-store'
import {
  VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_STORE_VERSION,
} from '../visual-intelligence/visual-intelligence-canonical-prepared-evidence-store'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligenceRequest,
} from '../visual-intelligence/visual-intelligence-contract'
import type {
  VisualIntelligenceOrchestraCompilationEvidence,
} from '../visual-intelligence/visual-intelligence-orchestra-invocation-compiler'
import type {
  VisualIntelligenceOrchestraDispatchPackageStore,
} from '../visual-intelligence/visual-intelligence-orchestra-dispatch-package-store'
import {
  VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_STORE_VERSION,
} from '../visual-intelligence/visual-intelligence-orchestra-dispatch-package-store'
import {
  createVisualIntelligenceOrchestraCapabilityManifestForQualification,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'

export const CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_AUTHORITY_VERSION =
  'canonical-source-analysis-orchestra-authority-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_AUTHORITY_READ_PORT_VERSION =
  'canonical-source-analysis-orchestra-authority-read-port-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_OWNER_VERSION =
  'canonical-source-analysis-orchestra-work-owner-v3' as const

const AUTHORITY_KEYS = [
  'schemaVersion', 'source', 'scopeDigestSha256', 'call',
  'qualificationSnapshot', 'planningAdmission',
  'orchestraDispatchAuthorityRef',
  'exactOrchestraPlanJobAndBudgetRereadVerified',
  'exactQualificationRegistryRereadVerified',
  'browserOrCallerWorkAccepted', 'directProviderDispatchAllowed',
  'directGpuDispatchAllowed', 'directTimelineMutationAllowed',
  'customerCreditMutationAllowed', 'publicDeliveryGranted',
  'productionAuthorityGranted', 'authorityDigestSha256',
] as const

export interface CanonicalSourceAnalysisOrchestraAuthority {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_AUTHORITY_VERSION
  readonly source: 'canonical_orchestra_plan_job_authority_repository'
  readonly scopeDigestSha256: string
  readonly call: OrchestraSkillCall
  readonly qualificationSnapshot: SkillQualificationSnapshot
  readonly planningAdmission: VisualIntelligencePlanningEvidenceAdmission
  readonly orchestraDispatchAuthorityRef: OrchestraEvidenceRef
  readonly exactOrchestraPlanJobAndBudgetRereadVerified: true
  readonly exactQualificationRegistryRereadVerified: true
  readonly browserOrCallerWorkAccepted: false
  readonly directProviderDispatchAllowed: false
  readonly directGpuDispatchAllowed: false
  readonly directTimelineMutationAllowed: false
  readonly customerCreditMutationAllowed: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
  readonly authorityDigestSha256: string
}

export interface CanonicalSourceAnalysisOrchestraAuthorityReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_AUTHORITY_READ_PORT_VERSION
  readExactSourceVideoUnderstandingAuthority(
    scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
  ): Promise<unknown | null>
}

export interface CanonicalSourceAnalysisOrchestraWorkOwner
  extends CanonicalSourceAnalysisOrchestraWorkReadPort {
  readonly ownerVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_OWNER_VERSION
  readonly workBuiltOnlyFromCanonicalRereads: true
  readonly browserOrCallerPreparedEvidenceAccepted: false
  readonly directProviderOrGpuDispatchAllowed: false
}

export function createCanonicalSourceAnalysisOrchestraAuthority(input: Omit<
  CanonicalSourceAnalysisOrchestraAuthority,
  'schemaVersion' | 'source' | 'scopeDigestSha256' | 'authorityDigestSha256'
> & Readonly<{
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
}>): CanonicalSourceAnalysisOrchestraAuthority {
  assertPlainSerializedData(input, 'source_analysis_orchestra_authority_input')
  const { scope, ...rest } = input
  const withoutDigest = {
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_AUTHORITY_VERSION,
    source: 'canonical_orchestra_plan_job_authority_repository' as const,
    scopeDigestSha256: orchestraDigest(scope),
    ...rest,
  }
  return deepFreeze({
    ...withoutDigest,
    authorityDigestSha256: orchestraDigest(withoutDigest),
  })
}

export function assertCanonicalSourceAnalysisOrchestraAuthority(input: {
  readonly scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
  readonly value: unknown
}): CanonicalSourceAnalysisOrchestraAuthority {
  assertPlainSerializedData(input.value, 'source_analysis_orchestra_authority')
  assertExactRecord(input.value, AUTHORITY_KEYS)
  const value = input.value as unknown as
    CanonicalSourceAnalysisOrchestraAuthority
  const call = parseOrchestraSkillCall(value.call)
  const qualificationSnapshot = parseSkillQualificationSnapshot(
    value.qualificationSnapshot,
  )
  prepareCanonicalSourceVisualIntelligenceOrchestraBindingRequest({
    scope: input.scope,
    orchestraCall: call,
  })
  const manifest =
    createVisualIntelligenceOrchestraCapabilityManifestForQualification(
      qualificationSnapshot,
    )
  const withoutDigest = { ...value } as Record<string, unknown>
  Reflect.deleteProperty(withoutDigest, 'authorityDigestSha256')
  if (
    value.schemaVersion !== CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_AUTHORITY_VERSION
    || value.source !== 'canonical_orchestra_plan_job_authority_repository'
    || value.scopeDigestSha256 !== orchestraDigest(input.scope)
    || !sameRef(call.manifestRef, orchestraEvidenceRef(
      manifest.manifestId,
      manifest.manifestDigestSha256,
    ))
    || !sameRef(call.qualificationSnapshotRef, orchestraEvidenceRef(
      qualificationSnapshot.snapshotId,
      qualificationSnapshot.snapshotDigestSha256,
    ))
    || !sameRef(value.orchestraDispatchAuthorityRef, call.orchestraJobRef)
    || !value.exactOrchestraPlanJobAndBudgetRereadVerified
    || !value.exactQualificationRegistryRereadVerified
    || value.browserOrCallerWorkAccepted
    || value.directProviderDispatchAllowed
    || value.directGpuDispatchAllowed
    || value.directTimelineMutationAllowed
    || value.customerCreditMutationAllowed
    || value.publicDeliveryGranted
    || value.productionAuthorityGranted
    || value.authorityDigestSha256 !== orchestraDigest(withoutDigest)
  ) throw conflict('source_analysis_orchestra_authority_invalid')
  return deepFreeze({
    ...value,
    call,
    qualificationSnapshot,
    orchestraDispatchAuthorityRef: cloneRef(
      value.orchestraDispatchAuthorityRef,
    ),
  })
}

export function createCanonicalSourceAnalysisOrchestraWorkOwner(input: {
  readonly authorityReadPort:
    CanonicalSourceAnalysisOrchestraAuthorityReadPort
  readonly l4VisualEvidenceReadPort:
    CanonicalSourceAnalysisL4VisualEvidenceReadPort
  readonly l4VisualEvidenceToolArtifactReadPort:
    CanonicalSourceAnalysisL4VisualEvidenceToolArtifactReadPort
  readonly transcriptReadPort: CanonicalSourceTranscriptOrchestraReadPort
  readonly preparedEvidenceStore:
    VisualIntelligenceCanonicalPreparedEvidenceStore
  readonly dispatchPackageStore:
    VisualIntelligenceOrchestraDispatchPackageStore
  readonly qualificationRegistryReadPort: Pick<
    CanonicalSkillQualificationRegistry,
    'schemaVersion' | 'readExact'
  >
}): CanonicalSourceAnalysisOrchestraWorkOwner {
  assertDependencies(input)
  return Object.freeze({
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_READ_PORT_VERSION,
    ownerVersion: CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_WORK_OWNER_VERSION,
    workBuiltOnlyFromCanonicalRereads: true as const,
    browserOrCallerPreparedEvidenceAccepted: false as const,
    directProviderOrGpuDispatchAllowed: false as const,
    async readExactSourceVideoUnderstandingWork(
      untrustedScope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
    ) {
      assertPlainSerializedData(untrustedScope, 'source_orchestra_work_scope')
      const transcriptReadScope = toTranscriptReadScope(untrustedScope)
      const [authorityRaw, l4VisualEvidenceRaw, transcriptResultRaw] =
        await Promise.all([
          input.authorityReadPort
            .readExactSourceVideoUnderstandingAuthority(untrustedScope),
          input.l4VisualEvidenceReadPort.readCompleted(transcriptReadScope),
          input.transcriptReadPort.readCompleted(transcriptReadScope),
        ])
      if (!authorityRaw || !l4VisualEvidenceRaw || !transcriptResultRaw) {
        return null
      }
      const authority = assertCanonicalSourceAnalysisOrchestraAuthority({
        scope: untrustedScope,
        value: authorityRaw,
      })
      const registeredPair = await input.qualificationRegistryReadPort
        .readExact({
          manifestRef: authority.call.manifestRef,
          qualificationSnapshotRef:
            authority.call.qualificationSnapshotRef,
        })
      if (!registeredPair) return null
      const registeredQualification = parseSkillQualificationSnapshot(
        registeredPair.qualificationSnapshot,
      )
      const registeredManifest = parseSkillCapabilityManifest({
        value: registeredPair.manifest,
        qualificationSnapshot: registeredQualification,
      })
      if (
        !sameRef(authority.call.manifestRef, orchestraEvidenceRef(
          registeredManifest.manifestId,
          registeredManifest.manifestDigestSha256,
        ))
        || !sameRef(
          authority.call.qualificationSnapshotRef,
          orchestraEvidenceRef(
            registeredQualification.snapshotId,
            registeredQualification.snapshotDigestSha256,
          ),
        )
        || registeredQualification.snapshotDigestSha256 !==
          authority.qualificationSnapshot.snapshotDigestSha256
      ) throw conflict('source_analysis_qualification_registry_mismatch')
      const l4VisualEvidence =
        assertCanonicalSourceAnalysisL4VisualEvidenceResult(
          l4VisualEvidenceRaw,
        )
      const transcriptResult =
        assertCanonicalVisualIntelligenceSourceTranscriptResult(
          transcriptResultRaw,
        )
      assertSourceEvidenceBindings({
        scope: untrustedScope,
        authority,
        l4VisualEvidence,
        transcriptResult,
      })
      const rawToolArtifacts = await Promise.all(
        CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_ROLES
          .map((role) => input.l4VisualEvidenceToolArtifactReadPort.readExact(
            l4VisualEvidence.invocationId,
            role,
          )),
      )
      if (rawToolArtifacts.some((artifact) => !artifact)) return null
      const toolArtifacts =
        assertCanonicalSourceAnalysisL4VisualEvidenceToolArtifactSet({
          result: l4VisualEvidence,
          artifacts: rawToolArtifacts as
            CanonicalSourceAnalysisL4VisualEvidenceToolArtifact[],
        })
      const manifest = registeredManifest
      const artifact = createSourceArtifact(untrustedScope, l4VisualEvidence)
      const compilationEvidence = createCompilationEvidence({
        scope: untrustedScope,
        authority,
        artifact,
      })
      const request = createVisualIntelligenceRequest({
        requestId: authority.call.callId,
        idempotencyKey: authority.call.idempotencyKey,
        scope: compilationEvidence.requestScope,
        operation: 'analyze_media',
        profile: 'source_edit_planning',
        sourceArtifacts: [artifact],
        comparisonArtifacts: [],
        requestedRanges: [fullRange(untrustedScope)],
        requiredEvidenceRefs: [...authority.call.requiredEvidenceRefs],
        expectedOutcomeRefs: [...authority.call.expectedOutcomeRefs],
        outputFrame: null,
        protectedZones: [],
        qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
        admission: authority.planningAdmission,
        callerQuestion: null,
        byteFreeRequest: true,
        callerPromptAccepted: false,
        providerCredentialIncluded: false,
        publicMediaUrlIncluded: false,
        signedUrlIsSourceTruth: false,
        shellCommandIncluded: false,
        providerToolDefinitionIncluded: false,
      })
      const preparedEvidence = createPreparedEvidence({
        requestDigestSha256: request.requestDigestSha256,
        scope: untrustedScope,
        l4VisualEvidence,
        transcriptResult,
        toolArtifacts,
      })
      const ownerAuthorityRef = createVisualIntelligenceEvidenceRef(
        `source-analysis-evidence-owner-${request.requestDigestSha256.slice(7, 39)}`,
        {
          l4ResultDigestSha256: l4VisualEvidence.resultDigestSha256,
          transcriptAuthorityRef: transcriptResult.transcriptAuthorityRef,
          toolArtifactDigestsSha256: toolArtifacts.map(
            (item) => item.artifactDigestSha256,
          ),
          orchestraAuthorityDigestSha256: authority.authorityDigestSha256,
        },
      )
      const prepared = await input.preparedEvidenceStore.persistCreateOnly({
        ownerClass: 'canonical_source_analysis_evidence_owner',
        ownerAuthorityRef,
        request,
        preparedEvidence,
      })
      const dispatch = await input.dispatchPackageStore.persistCreateOnly({
        call: authority.call,
        supportRequest: null,
        manifest,
        qualificationSnapshot: registeredQualification,
        compilationEvidence,
        preparedEvidenceRef: prepared.recordRef,
        inspectionRequirement: null,
        orchestraDispatchAuthorityRef:
          authority.orchestraDispatchAuthorityRef,
      })
      return createCanonicalSourceAnalysisOrchestraWork({
        scope: untrustedScope,
        call: authority.call,
        dispatchPackageRef: dispatch.dispatchPackageRef,
      })
    },
  })
}

function createCompilationEvidence(input: {
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
  authority: CanonicalSourceAnalysisOrchestraAuthority
  artifact: VisualIntelligenceArtifactBinding
}): VisualIntelligenceOrchestraCompilationEvidence {
  const callRef = orchestraEvidenceRef(
    input.authority.call.callId,
    input.authority.call.callDigestSha256,
  )
  return deepFreeze({
    schemaVersion: 'visual-intelligence-orchestra-compilation-evidence-v1',
    callRef,
    manifestRef: cloneRef(input.authority.call.manifestRef),
    qualificationSnapshotRef: cloneRef(
      input.authority.call.qualificationSnapshotRef,
    ),
    timeBudgetRef: cloneRef(input.authority.call.timeBudgetRef),
    creditBudgetRef: cloneRef(input.authority.call.creditBudgetRef),
    attemptEnvelopeRef: cloneRef(input.authority.call.attemptEnvelopeRef),
    requestScope: {
      ownerUserId: input.scope.ownerUserId,
      workspaceId: input.scope.workspaceId,
      projectId: input.scope.projectId,
      editSessionId: input.scope.editSessionId,
      approvedSnapshotId: null,
    },
    sourceArtifacts: [input.artifact],
    comparisonArtifacts: [],
    requiredEvidenceRefs: [...input.authority.call.requiredEvidenceRefs],
    expectedOutcomeRefs: [...input.authority.call.expectedOutcomeRefs],
    outputFrame: null,
    protectedZones: [],
    admission: input.authority.planningAdmission,
    budgetBindingDigestSha256: orchestraDigest({
      callRef,
      timeBudgetRef: input.authority.call.timeBudgetRef,
      creditBudgetRef: input.authority.call.creditBudgetRef,
      attemptEnvelopeRef: input.authority.call.attemptEnvelopeRef,
      costPreflight: input.authority.planningAdmission.costPreflight,
    }),
    exactOrchestraPlanAndJobReread: true,
    exactManifestAndQualificationReread: true,
    exactMediaAuthoritiesReread: true,
    exactSceneContextReread: true,
    exactTimeAndCreditBudgetsReread: true,
    exactAttemptEnvelopeReread: true,
    callerPromptAccepted: false,
    directProviderCallMade: false,
    directTimelineMutationPerformed: false,
  })
}

function createSourceArtifact(
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
  evidence: CanonicalSourceAnalysisL4VisualEvidenceResult,
): VisualIntelligenceArtifactBinding {
  return deepFreeze({
    artifactId: scope.mediaAssetId,
    mediaKind: 'video',
    contentType: evidence.sourceObject.contentType,
    checksumSha256: scope.checksumSha256,
    byteLength: scope.byteLength,
    width: evidence.sourceObject.width,
    height: evidence.sourceObject.height,
    durationFrames: scope.durationFrames,
    frameRate: {
      numerator: scope.sourceFrameAuthority.fpsNumerator,
      denominator: scope.sourceFrameAuthority.fpsDenominator,
    },
    finalizedMediaAuthorityRef: cloneRef(scope.sourceArtifactRef),
    immutableStorageObjectAuthorityRef: cloneRef(
      evidence.sourceObject.finalizedStorageObjectAuthorityRef,
    ),
    mediaProbeEvidenceRef: cloneRef(scope.sourceProbeAuthorityRef),
    privateArtifact: true,
    exactGenerationRereadRequiredAtDispatch: true,
  })
}

function createPreparedEvidence(input: {
  requestDigestSha256: string
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
  l4VisualEvidence: CanonicalSourceAnalysisL4VisualEvidenceResult
  transcriptResult: CanonicalVisualIntelligenceSourceTranscriptResult
  toolArtifacts: readonly CanonicalSourceAnalysisL4VisualEvidenceToolArtifact[]
}): VisualIntelligencePreparedEvidence {
  const range = fullRange(input.scope)
  const artifactId = input.scope.mediaAssetId
  const l4Evidence = input.l4VisualEvidence.toolEvidence.map((item) => ({
    evidenceId: item.evidenceRef.id,
    evidenceRef: cloneRef(item.evidenceRef),
    artifactId,
    range: item.role === 'media_probe' ? null : range,
    authority: evidenceAuthority(item.role),
    producingTool: item.tool,
    toolVersion: item.toolVersion,
    summary: item.role === 'media_probe'
      ? evidenceSummary(item.role)
      : projectCanonicalSourceAnalysisL4VisualEvidenceToolArtifact(
          input.toolArtifacts.find((artifact) =>
            artifact.role === item.role)!,
        ),
    privateEvidence: true as const,
    providerInstructionAccepted: false as const,
  } satisfies VisualIntelligenceEvidence))
  const audioExecuted = input.transcriptResult.execution
    .sourceAudioDisposition !== 'verified_no_audio_stream'
  const transcriptVersion = audioExecuted
    ? `${input.transcriptResult.transcript.modelId}-${input.transcriptResult.transcript.runtimeVersion}`
    : null
  const transcriptEvidence: VisualIntelligenceEvidence = {
    evidenceId: input.transcriptResult.transcriptAuthorityRef.id,
    evidenceRef: cloneRef(input.transcriptResult.transcriptAuthorityRef),
    artifactId,
    range,
    authority: audioExecuted ? 'canonical_transcript' : 'media_probe',
    producingTool: audioExecuted ? 'faster_whisper' : 'ffprobe',
    toolVersion: audioExecuted
      ? transcriptVersion!
      : input.l4VisualEvidence.toolEvidence[0]!.toolVersion,
    summary: audioExecuted
      ? 'Authenticated complete-source transcript authority was reread.'
      : 'Canonical no-audio transcript disposition was reread from the exact media probe.',
    privateEvidence: true,
    providerInstructionAccepted: false,
  }
  const toolExecutionEvidence = input.l4VisualEvidence.toolEvidence.map(
    (item): VisualIntelligenceToolExecutionEvidence => ({
      tool: item.tool,
      requirement: item.tool === 'ocr' ? 'conditional' : 'required',
      executionClass: 'l4_gpu_standard',
      releaseRef: cloneRef(item.runtimeReleaseRef),
      executionRef: cloneRef(item.executionRef),
      substantiveCpuExecutionUsed: false,
      sourceArtifactChecksumBound: true,
    }),
  )
  if (audioExecuted) {
    toolExecutionEvidence.push({
      tool: 'faster_whisper',
      requirement: 'conditional',
      executionClass:
        input.transcriptResult.execution.acceleratorClass === 'nvidia_l4'
          ? 'l4_gpu_standard'
          : 'a100_80gb_gpu_heavy',
      releaseRef: cloneRef(
        input.transcriptResult.execution.completedRuntimeReleaseRef!,
      ),
      executionRef: cloneRef(
        input.transcriptResult.execution.completedAttemptReceiptRef!,
      ),
      substantiveCpuExecutionUsed: false,
      sourceArtifactChecksumBound: true,
    })
  }
  const scene = input.l4VisualEvidence.toolEvidence.find(
    (item) => item.role === 'scene_detection',
  )!
  const sampling = input.l4VisualEvidence.toolEvidence.find(
    (item) => item.role === 'sampling_policy',
  )!
  const ocr = input.l4VisualEvidence.toolEvidence.find(
    (item) => item.role === 'exact_visible_text',
  )!
  return deepFreeze({
    deterministicEvidence: [...l4Evidence, transcriptEvidence],
    coveragePlan: {
      requestedRanges: [range],
      analyzedRanges: [range],
      incompleteRanges: [],
      sceneBoundaryRefs: [cloneRef(scene.evidenceRef)],
      samplingPolicies: [{
        policyId: 'complete-source-scene-aware',
        policyVersion: 'complete-source-scene-aware-v1',
        mode: 'scene_aware_complete_coverage',
        targetFramesPerSecondNumerator: 2,
        targetFramesPerSecondDenominator: 1,
        sceneAware: true,
        highDetail: true,
        requestedRange: range,
        analyzedRange: range,
        samplingPolicyRef: cloneRef(sampling.evidenceRef),
      }],
      targetedFollowupRanges: [],
      completeRequestedRangeCoverage: true,
      everyTimelineFrameInspected: false,
      completeTimePixelInspectionClaimAllowed: false,
    },
    privateMediaInputs: [{
      artifactId,
      gcsUri:
        `gs://${input.l4VisualEvidence.sourceObject.storageBucket}/${input.l4VisualEvidence.sourceObject.storagePath}`,
      contentType: input.l4VisualEvidence.sourceObject.contentType,
      checksumSha256: input.scope.checksumSha256,
      exactGenerationRereadVerified: true,
    }],
    transcriptVersion,
    ocrVersion: ocr.toolVersion,
    conditionalToolDecisions: [{
      artifactId,
      tool: 'faster_whisper',
      disposition: audioExecuted ? 'executed' : 'not_required_no_audio',
      decisionEvidenceRef: cloneRef(audioExecuted
        ? input.transcriptResult.transcriptAuthorityRef
        : input.scope.sourceProbeAuthorityRef),
      exactCanonicalDecisionRereadVerified: true,
      callerDecisionAccepted: false,
    }, {
      artifactId,
      tool: 'ocr',
      disposition: 'executed',
      decisionEvidenceRef: cloneRef(ocr.evidenceRef),
      exactCanonicalDecisionRereadVerified: true,
      callerDecisionAccepted: false,
    }],
    toolExecutionEvidence,
    preparedEvidenceRef: createVisualIntelligenceEvidenceRef(
      `source-prepared-evidence-${input.requestDigestSha256.slice(7, 39)}`,
      {
        requestDigestSha256: input.requestDigestSha256,
        l4ResultDigestSha256: input.l4VisualEvidence.resultDigestSha256,
        transcriptAuthorityRef: input.transcriptResult.transcriptAuthorityRef,
      },
    ),
  })
}

function assertSourceEvidenceBindings(input: {
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
  authority: CanonicalSourceAnalysisOrchestraAuthority
  l4VisualEvidence: CanonicalSourceAnalysisL4VisualEvidenceResult
  transcriptResult: CanonicalVisualIntelligenceSourceTranscriptResult
}): void {
  const expectedRefs = [
    ...input.l4VisualEvidence.toolEvidence.map((item) => item.evidenceRef),
    input.transcriptResult.transcriptAuthorityRef,
  ]
  if (
    input.l4VisualEvidence.resultDigestSha256.length !== 64
    || orchestraDigest(input.l4VisualEvidence.scope) !==
      orchestraDigest(toTranscriptReadScope(input.scope))
    || !sameRef(
      input.l4VisualEvidence.sourceObject.finalizedMediaAuthorityRef,
      input.scope.sourceArtifactRef,
    )
    || !sameRef(
      input.l4VisualEvidence.toolEvidence[0]!.evidenceRef,
      input.scope.sourceProbeAuthorityRef,
    )
    || !sameRef(
      input.transcriptResult.transcriptAuthorityRef,
      input.scope.transcriptAuthorityRef,
    )
    || input.transcriptResult.transcript.transcriptDigestSha256 !==
      input.scope.transcriptDigestSha256
    || orchestraDigest(input.authority.call.requiredEvidenceRefs) !==
      orchestraDigest(expectedRefs)
  ) throw conflict('source_analysis_orchestra_evidence_binding_invalid')
}

function toTranscriptReadScope(
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
): CanonicalSourceTranscriptOrchestraReadScope {
  return deepFreeze({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    analysisRunId: scope.analysisRunId,
    sourceSequenceItemId: scope.sourceSequenceItemId,
    mediaAssetId: scope.mediaAssetId,
    uploadedOrder: scope.uploadedOrder,
    checksumSha256: scope.checksumSha256,
    byteLength: scope.byteLength,
    durationFrames: scope.durationFrames,
    sourceFrameAuthority: scope.sourceFrameAuthority,
    finalizedMediaAuthorityRef: cloneRef(scope.sourceArtifactRef),
    sourceProbeAuthorityRef: cloneRef(scope.sourceProbeAuthorityRef),
  })
}

function fullRange(scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope) {
  return {
    startFrame: 0,
    endFrameExclusive: scope.durationFrames,
    frameRate: {
      numerator: scope.sourceFrameAuthority.fpsNumerator,
      denominator: scope.sourceFrameAuthority.fpsDenominator,
    },
  }
}

function evidenceAuthority(
  role: CanonicalSourceAnalysisL4VisualEvidenceResult['toolEvidence'][number][
    'role'
  ],
): VisualIntelligenceEvidence['authority'] {
  return role === 'media_probe' ? 'media_probe'
    : role === 'scene_detection' ? 'scene_detection'
      : role === 'pixel_measurement' ? 'pixel_measurement'
        : role === 'exact_visible_text' ? 'exact_ocr'
          : 'media_transform'
}

function evidenceSummary(
  role: CanonicalSourceAnalysisL4VisualEvidenceResult['toolEvidence'][number][
    'role'
  ],
): string {
  return ({
    media_probe: 'Canonical source dimensions and rational timing were reread.',
    private_media_transform:
      'The exact private analysis representation was verified.',
    scene_detection: 'Scene-aware complete-source boundaries were verified.',
    pixel_measurement:
      'Deterministic full-range visual measurements were verified.',
    exact_visible_text: 'Exact visible-text evidence was verified.',
    sampling_policy:
      'The complete scene-aware sampling policy was verified.',
  } as const)[role]
}

function assertDependencies(input: Parameters<
  typeof createCanonicalSourceAnalysisOrchestraWorkOwner
>[0]): void {
  if (
    input.authorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_AUTHORITY_READ_PORT_VERSION
    || typeof input.authorityReadPort
      .readExactSourceVideoUnderstandingAuthority !== 'function'
    || input.l4VisualEvidenceReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION
    || typeof input.l4VisualEvidenceReadPort.readCompleted !== 'function'
    || input.l4VisualEvidenceToolArtifactReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_READ_PORT_VERSION
    || typeof input.l4VisualEvidenceToolArtifactReadPort.readExact !==
      'function'
    || input.transcriptReadPort?.schemaVersion !==
      CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION
    || typeof input.transcriptReadPort.readCompleted !== 'function'
    || input.preparedEvidenceStore?.schemaVersion !==
      VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_STORE_VERSION
    || typeof input.preparedEvidenceStore.persistCreateOnly !== 'function'
    || input.qualificationRegistryReadPort?.schemaVersion !==
      CANONICAL_SKILL_QUALIFICATION_REGISTRY_VERSION
    || typeof input.qualificationRegistryReadPort.readExact !== 'function'
    || input.dispatchPackageStore?.schemaVersion !==
      VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_STORE_VERSION
    || typeof input.dispatchPackageStore.persistCreateOnly !== 'function'
  ) throw notReady('source_analysis_orchestra_work_owner_dependencies_invalid')
}

function assertExactRecord(
  value: unknown,
  keys: readonly string[],
): asserts value is Record<string, unknown> {
  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
    || orchestraDigest(Object.keys(value).sort(compare)) !==
      orchestraDigest([...keys].sort(compare))
  ) throw conflict('source_analysis_orchestra_authority_shape_invalid')
}

function sameRef(
  left: OrchestraEvidenceRef | VisualIntelligenceEvidenceRef,
  right: OrchestraEvidenceRef | VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function cloneRef<T extends OrchestraEvidenceRef>(value: T): T {
  return Object.freeze({ ...value }) as T
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
  }
  return value
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical source-analysis Orchestra work is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical source-analysis Orchestra work conflicts with its authority.',
    409,
    { requiredGate },
  )
}
