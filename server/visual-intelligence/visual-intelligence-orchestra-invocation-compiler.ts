import type {
  OrchestraEvidenceRef,
  OrchestraExecutionPhase,
  OrchestraSkillCall,
  OrchestraSkillJobResult,
  OrchestraSkillScope,
  SkillCapabilityManifest,
  SkillQualificationSnapshot,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-capability'
import {
  ORCHESTRA_SKILL_JOB_RESULT_VERSION,
} from '../../src/types/orchestra-skill-capability'
import type {
  VisualIntelligenceAdmission,
  VisualIntelligenceArtifactBinding,
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceOutputFrame,
  VisualIntelligenceProfile,
  VisualIntelligenceProtectedZone,
  VisualIntelligenceReport,
  VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import {
  createOrchestraSkillJobResult,
  orchestraDigest,
  orchestraEvidenceRef,
  parseOrchestraSkillCall,
  parseSkillCapabilityManifest,
  parseSkillQualificationSnapshot,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-capability-contract'
import { ApiError } from '../errors/api-error'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualIntelligenceRequest,
  parseVisualIntelligenceReport,
  parseVisualIntelligenceRequest,
} from './visual-intelligence-contract'
import {
  assertVisualIntelligenceOrchestraJobScope,
  getVisualIntelligenceOrchestraJobDefinition,
  type VisualIntelligenceOrchestraJobDefinition,
} from './visual-intelligence-orchestra-capability-manifest'

export const VISUAL_INTELLIGENCE_ORCHESTRA_INVOCATION_COMPILER_VERSION =
  'visual-intelligence-orchestra-invocation-compiler-v1' as const
export const VISUAL_INTELLIGENCE_ORCHESTRA_COMPILED_REQUEST_VERSION =
  'visual-intelligence-orchestra-compiled-request-v1' as const

export interface VisualIntelligenceOrchestraAuthorityRegistryPort {
  readExact(input: {
    readonly manifestRef: OrchestraEvidenceRef
    readonly qualificationSnapshotRef: OrchestraEvidenceRef
  }): Promise<{
    readonly manifest: SkillCapabilityManifest
    readonly qualificationSnapshot: SkillQualificationSnapshot
  } | null>
}

export interface VisualIntelligenceOrchestraCompilationEvidence {
  readonly schemaVersion:
    'visual-intelligence-orchestra-compilation-evidence-v1'
  readonly callRef: OrchestraEvidenceRef
  readonly manifestRef: OrchestraEvidenceRef
  readonly qualificationSnapshotRef: OrchestraEvidenceRef
  readonly timeBudgetRef: OrchestraEvidenceRef
  readonly creditBudgetRef: OrchestraEvidenceRef
  readonly attemptEnvelopeRef: OrchestraEvidenceRef
  readonly requestScope: VisualIntelligenceRequest['scope']
  readonly sourceArtifacts: readonly VisualIntelligenceArtifactBinding[]
  readonly comparisonArtifacts: readonly VisualIntelligenceArtifactBinding[]
  readonly requiredEvidenceRefs: readonly VisualIntelligenceEvidenceRef[]
  readonly expectedOutcomeRefs: readonly VisualIntelligenceEvidenceRef[]
  readonly outputFrame: VisualIntelligenceOutputFrame | null
  readonly protectedZones: readonly VisualIntelligenceProtectedZone[]
  readonly admission: VisualIntelligenceAdmission
  readonly budgetBindingDigestSha256: string
  readonly exactOrchestraPlanAndJobReread: true
  readonly exactManifestAndQualificationReread: true
  readonly exactMediaAuthoritiesReread: true
  readonly exactSceneContextReread: true
  readonly exactTimeAndCreditBudgetsReread: true
  readonly exactAttemptEnvelopeReread: true
  readonly callerPromptAccepted: false
  readonly directProviderCallMade: false
  readonly directTimelineMutationPerformed: false
}

export interface VisualIntelligenceOrchestraCompilationPort {
  prepareExact(input: {
    readonly call: OrchestraSkillCall
    readonly supportRequest: SkillSupportRequest | null
    readonly manifest: SkillCapabilityManifest
    readonly qualificationSnapshot: SkillQualificationSnapshot
    readonly operation: VisualIntelligenceOrchestraJobDefinition['operation']
    readonly profile: VisualIntelligenceProfile
    readonly admissionMode:
      | 'planning_evidence'
      | 'approved_edit_inspection'
  }): Promise<VisualIntelligenceOrchestraCompilationEvidence>
}

export interface CompiledVisualIntelligenceOrchestraRequest {
  readonly schemaVersion:
    typeof VISUAL_INTELLIGENCE_ORCHESTRA_COMPILED_REQUEST_VERSION
  readonly compilerVersion:
    typeof VISUAL_INTELLIGENCE_ORCHESTRA_INVOCATION_COMPILER_VERSION
  readonly callRef: OrchestraEvidenceRef
  readonly supportRequestRef: OrchestraEvidenceRef | null
  readonly manifestRef: OrchestraEvidenceRef
  readonly qualificationSnapshotRef: OrchestraEvidenceRef
  readonly jobType: string
  readonly phase: OrchestraExecutionPhase
  readonly scope: OrchestraSkillScope
  readonly operation: VisualIntelligenceOrchestraJobDefinition['operation']
  readonly profile: VisualIntelligenceProfile
  readonly admissionMode:
    | 'planning_evidence'
    | 'approved_edit_inspection'
  readonly budgetBindingDigestSha256: string
  readonly request: VisualIntelligenceRequest
  readonly exactOrchestraAuthorityReread: true
  readonly exactSkillQualificationReread: true
  readonly exactCompilationEvidenceReread: true
  readonly requestCompiledFromOrchestraCall: true
  readonly directUserInvocationAccepted: false
  readonly directPeerSkillInvocationAccepted: false
  readonly directProviderCallMade: false
  readonly directTimelineMutationPerformed: false
  readonly dispatchAuthorityGranted: false
  readonly compiledRequestDigestSha256: string
}

export interface VisualIntelligenceOrchestraInvocationCompiler {
  compile(input: {
    readonly call: unknown
    readonly supportRequest?: unknown
  }): Promise<CompiledVisualIntelligenceOrchestraRequest>
}

/**
 * Validates an immutable compiler input before an Orchestra dispatch package
 * is persisted. This prevents a malformed internal producer from poisoning a
 * create-only call slot that a later valid dispatch could not replace.
 */
export function parseVisualIntelligenceOrchestraCompilationEvidence(input: {
  readonly call: unknown
  readonly manifest: unknown
  readonly qualificationSnapshot: unknown
  readonly admissionMode: unknown
  readonly evidence: unknown
}): VisualIntelligenceOrchestraCompilationEvidence {
  const call = parseOrchestraSkillCall(input.call)
  const qualificationSnapshot = parseSkillQualificationSnapshot(
    input.qualificationSnapshot,
  )
  const manifest = parseSkillCapabilityManifest({
    value: input.manifest,
    qualificationSnapshot,
  })
  if (
    input.admissionMode !== 'planning_evidence'
    && input.admissionMode !== 'approved_edit_inspection'
  ) throw new TypeError(
    'Visual Intelligence Orchestra admission mode is invalid.',
  )
  const evidence = input.evidence as
    VisualIntelligenceOrchestraCompilationEvidence
  assertCompilationEvidence({
    call,
    manifest,
    qualificationSnapshot,
    admissionMode: input.admissionMode,
    evidence,
  })
  return deepFreeze(evidence)
}

export function createVisualIntelligenceOrchestraInvocationCompiler(input: {
  readonly authorityRegistryPort:
    VisualIntelligenceOrchestraAuthorityRegistryPort
  readonly compilationPort: VisualIntelligenceOrchestraCompilationPort
}): VisualIntelligenceOrchestraInvocationCompiler {
  if (
    !input.authorityRegistryPort
    || typeof input.authorityRegistryPort.readExact !== 'function'
    || !input.compilationPort
    || typeof input.compilationPort.prepareExact !== 'function'
  ) throw new TypeError(
    'Visual Intelligence Orchestra compiler requires canonical read ports.',
  )

  return Object.freeze({
    async compile(untrusted: {
      readonly call: unknown
      readonly supportRequest?: unknown
    }) {
      const call = parseOrchestraSkillCall(untrusted.call)
      const supportRequest = call.requestedBy.kind === 'skill'
        ? parseRequiredSupportRequest(untrusted.supportRequest)
        : rejectUnexpectedSupportRequest(untrusted.supportRequest)
      const observed = await input.authorityRegistryPort.readExact({
        manifestRef: call.manifestRef,
        qualificationSnapshotRef: call.qualificationSnapshotRef,
      })
      if (!observed) throw notReady(
        'visual_intelligence_orchestra_manifest_or_qualification_missing',
      )
      const qualificationSnapshot = parseSkillQualificationSnapshot(
        observed.qualificationSnapshot,
      )
      const manifest = parseSkillCapabilityManifest({
        value: observed.manifest,
        qualificationSnapshot,
      })
      assertAuthorityRefs(call, manifest, qualificationSnapshot)
      assertSupportRequest(call, supportRequest)

      const job = getVisualIntelligenceOrchestraJobDefinition(call.jobType)
      assertVisualIntelligenceOrchestraJobScope(job, call.phase, call.scope)
      assertJobSpecificCallSemantics(job, call)
      if (supportRequest && supportRequest.purposeCode !== job.purposeCode) {
        throw new TypeError(
          'Peer support purpose does not match the registered Visual Intelligence job.',
        )
      }
      const qualification = qualificationSnapshot.jobQualifications.find(
        (item) => item.jobType === call.jobType,
      )
      if (!qualification || qualification.status !== 'qualified') {
        throw notReady(
          qualification?.blockerCodes[0]
          ?? 'visual_intelligence_orchestra_job_not_qualified',
        )
      }
      assertQualifiedRoutes(manifest, job, qualification.qualifiedRouteIds)
      const admissionMode = job.admissionClassByPhase[call.phase]
      if (!admissionMode) throw new TypeError(
        'Visual Intelligence job has no admission for this Orchestra phase.',
      )
      const profile = selectProfile(job, call)
      const evidence = await input.compilationPort.prepareExact({
        call,
        supportRequest,
        manifest,
        qualificationSnapshot,
        operation: job.operation,
        profile,
        admissionMode,
      })
      assertCompilationEvidence({
        call,
        manifest,
        qualificationSnapshot,
        admissionMode,
        evidence,
      })

      const request = createVisualIntelligenceRequest({
        requestId: call.callId,
        idempotencyKey: call.idempotencyKey,
        scope: evidence.requestScope,
        operation: job.operation,
        profile,
        sourceArtifacts: [...evidence.sourceArtifacts],
        comparisonArtifacts: [...evidence.comparisonArtifacts],
        requestedRanges: rangesForCall(call),
        requiredEvidenceRefs: [...evidence.requiredEvidenceRefs],
        expectedOutcomeRefs: [...evidence.expectedOutcomeRefs],
        outputFrame: evidence.outputFrame,
        protectedZones: [...evidence.protectedZones],
        qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
        admission: evidence.admission,
        callerQuestion: questionFor(job.jobType, profile),
        byteFreeRequest: true,
        callerPromptAccepted: false,
        providerCredentialIncluded: false,
        publicMediaUrlIncluded: false,
        signedUrlIsSourceTruth: false,
        shellCommandIncluded: false,
        providerToolDefinitionIncluded: false,
      })
      const callRef = orchestraEvidenceRef(call.callId, call.callDigestSha256)
      const supportRequestRef = supportRequest
        ? orchestraEvidenceRef(
            supportRequest.requestId,
            supportRequest.requestDigestSha256,
          )
        : null
      const withoutDigest = {
        schemaVersion:
          VISUAL_INTELLIGENCE_ORCHESTRA_COMPILED_REQUEST_VERSION,
        compilerVersion:
          VISUAL_INTELLIGENCE_ORCHESTRA_INVOCATION_COMPILER_VERSION,
        callRef,
        supportRequestRef,
        manifestRef: call.manifestRef,
        qualificationSnapshotRef: call.qualificationSnapshotRef,
        jobType: call.jobType,
        phase: call.phase,
        scope: call.scope,
        operation: job.operation,
        profile,
        admissionMode,
        budgetBindingDigestSha256: evidence.budgetBindingDigestSha256,
        request,
        exactOrchestraAuthorityReread: true as const,
        exactSkillQualificationReread: true as const,
        exactCompilationEvidenceReread: true as const,
        requestCompiledFromOrchestraCall: true as const,
        directUserInvocationAccepted: false as const,
        directPeerSkillInvocationAccepted: false as const,
        directProviderCallMade: false as const,
        directTimelineMutationPerformed: false as const,
        dispatchAuthorityGranted: false as const,
      }
      return deepFreeze({
        ...withoutDigest,
        compiledRequestDigestSha256: orchestraDigest(withoutDigest),
      })
    },
  })
}

export function createVisualIntelligenceOrchestraJobResult(input: {
  readonly compiled: CompiledVisualIntelligenceOrchestraRequest
  readonly report: unknown
  readonly followupEstimate: {
    readonly timeRef: OrchestraEvidenceRef
    readonly creditRef: OrchestraEvidenceRef
  } | null
}): OrchestraSkillJobResult {
  const compiled = assertCompiled(input.compiled)
  const report = parseVisualIntelligenceReport(input.report)
  assertReportMatchesCompiled(report, compiled)
  const followupRanges = report.coverage.targetedFollowupRanges
  const needsFollowup = followupRanges.length > 0
  if (report.disposition === 'blocked' && needsFollowup) {
    throw new TypeError(
      'Blocked Visual Intelligence evidence cannot self-authorize follow-up work.',
    )
  }
  if (needsFollowup !== (input.followupEstimate !== null)) {
    throw new TypeError(
      'Visual Intelligence follow-up ranges require new time and credit estimates.',
    )
  }
  const reportRef = orchestraEvidenceRef(
    report.reportId,
    report.reportDigestSha256,
  )
  const evidenceRefs = uniqueRefs([
    ...report.evidence.map((item) => item.evidenceRef),
    ...report.deterministicToolExecutions.map((item) => item.releaseRef),
  ])
  return createOrchestraSkillJobResult({
    schemaVersion: ORCHESTRA_SKILL_JOB_RESULT_VERSION,
    resultId: `${compiled.request.requestId}-orchestra-result`,
    callRef: compiled.callRef,
    manifestRef: compiled.manifestRef,
    qualificationSnapshotRef: compiled.qualificationSnapshotRef,
    targetSkillKey: 'visual_intelligence',
    jobType: compiled.jobType,
    phase: compiled.phase,
    scope: compiled.scope,
    disposition: report.disposition === 'blocked'
      ? 'blocked'
      : needsFollowup
        ? 'needs_followup'
        : 'completed',
    producedArtifactRefs: [reportRef],
    evidenceRefs,
    proposedFollowupRanges: followupRanges,
    followupReasonCode: needsFollowup
      ? 'visual_intelligence_targeted_followup_proposed'
      : null,
    estimatedAdditionalTimeRef: input.followupEstimate?.timeRef ?? null,
    estimatedAdditionalCreditsRef:
      input.followupEstimate?.creditRef ?? null,
    resultReturnsToOrchestra: true,
    directTimelineMutationPerformed: false,
    directArtifactMutationPerformed: false,
    scopeExpandedWithoutOrchestra: false,
    providerAuthorityGrantedToCaller: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
}

/**
 * Returns an unresolved job to Orchestra when semantic evidence proposes a
 * wider targeted pass but the Orchestra-owned time/credit estimator has not
 * authorized it. Visual Intelligence never converts that proposal into work.
 */
export function createVisualIntelligenceOrchestraFollowupBlockedJobResult(
  input: {
    readonly compiled: CompiledVisualIntelligenceOrchestraRequest
    readonly report: unknown
  },
): OrchestraSkillJobResult {
  const compiled = assertCompiled(input.compiled)
  const report = parseVisualIntelligenceReport(input.report)
  assertReportMatchesCompiled(report, compiled)
  if (
    report.disposition === 'blocked'
    || report.coverage.targetedFollowupRanges.length === 0
  ) throw new TypeError(
    'A follow-up-estimate blocker requires a non-blocked targeted proposal.',
  )
  const reportRef = orchestraEvidenceRef(
    report.reportId,
    report.reportDigestSha256,
  )
  const blockerRef = orchestraEvidenceRef(
    `vi-followup-estimate-blocked-${compiled.callRef.contentHash.slice(7, 39)}`,
    orchestraDigest({
      blockerCode: 'orchestra_followup_time_and_credit_estimate_missing',
      callRef: compiled.callRef,
      reportRef,
      targetedFollowupRanges: report.coverage.targetedFollowupRanges,
      newOrchestraCallRequired: true,
      visualIntelligenceScopeExpansionAllowed: false,
    }),
  )
  return createOrchestraSkillJobResult({
    schemaVersion: ORCHESTRA_SKILL_JOB_RESULT_VERSION,
    resultId: `${compiled.request.requestId}-orchestra-result`,
    callRef: compiled.callRef,
    manifestRef: compiled.manifestRef,
    qualificationSnapshotRef: compiled.qualificationSnapshotRef,
    targetSkillKey: 'visual_intelligence',
    jobType: compiled.jobType,
    phase: compiled.phase,
    scope: compiled.scope,
    disposition: 'blocked',
    producedArtifactRefs: [reportRef],
    evidenceRefs: uniqueRefs([
      ...report.evidence.map((item) => item.evidenceRef),
      ...report.deterministicToolExecutions.map((item) => item.releaseRef),
      blockerRef,
    ]),
    proposedFollowupRanges: [],
    followupReasonCode: null,
    estimatedAdditionalTimeRef: null,
    estimatedAdditionalCreditsRef: null,
    resultReturnsToOrchestra: true,
    directTimelineMutationPerformed: false,
    directArtifactMutationPerformed: false,
    scopeExpandedWithoutOrchestra: false,
    providerAuthorityGrantedToCaller: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
}

function assertAuthorityRefs(
  call: OrchestraSkillCall,
  manifest: SkillCapabilityManifest,
  qualification: SkillQualificationSnapshot,
): void {
  const manifestRef = orchestraEvidenceRef(
    manifest.manifestId,
    manifest.manifestDigestSha256,
  )
  const qualificationRef = orchestraEvidenceRef(
    qualification.snapshotId,
    qualification.snapshotDigestSha256,
  )
  if (
    manifest.skillKey !== 'visual_intelligence'
    || call.targetSkillKey !== manifest.skillKey
    || !sameRef(call.manifestRef, manifestRef)
    || !sameRef(call.qualificationSnapshotRef, qualificationRef)
    || !sameRef(
      manifest.qualificationStatus.qualificationSnapshotRef,
      qualificationRef,
    )
  ) throw new TypeError(
    'Orchestra call does not bind the current Visual Intelligence authority.',
  )
}

function assertSupportRequest(
  call: OrchestraSkillCall,
  request: SkillSupportRequest | null,
): void {
  if (call.requestedBy.kind === 'orchestra') {
    if (request !== null) throw new TypeError(
      'Direct Orchestra calls cannot carry a peer support request.',
    )
    return
  }
  if (!request) throw new TypeError(
    'Peer-originated Orchestra calls require the exact support request.',
  )
  const requestRef = orchestraEvidenceRef(
    request.requestId,
    request.requestDigestSha256,
  )
  if (
    !sameRef(call.requestedBy.supportRequestRef, requestRef)
    || call.requestedBy.skillKey !== request.requestingSkillKey
    || call.requestedBy.skillJobRef.id !== request.requestingSkillJobId
    || call.orchestraJobRef.id !== request.parentOrchestraJobId
    || request.requiredCapability !== call.targetSkillKey
    || request.requestedJobType !== call.jobType
    || request.phase !== call.phase
    || !same(request.scope, call.scope)
    || !same(request.inputArtifactRefs, call.sourceArtifactRefs)
    || !same(request.comparisonArtifactRefs, call.comparisonArtifactRefs)
    || !same(request.expectedOutcomeRefs, call.expectedOutcomeRefs)
    || !same(request.requiredEvidenceRefs, call.requiredEvidenceRefs)
  ) throw new TypeError(
    'Peer support request does not exactly match the Orchestra call.',
  )
}

function assertQualifiedRoutes(
  manifest: SkillCapabilityManifest,
  job: VisualIntelligenceOrchestraJobDefinition,
  qualifiedRouteIds: string[],
): void {
  const required = manifest.toolRoutes
    .filter((route) => route.jobTypes.includes(job.jobType))
    .map((route) => route.routeId)
    .sort(compare)
  const supplied = [...qualifiedRouteIds].sort(compare)
  if (!same(required, supplied)) throw notReady(
    'visual_intelligence_orchestra_required_routes_not_qualified',
  )
}

function selectProfile(
  job: VisualIntelligenceOrchestraJobDefinition,
  call: OrchestraSkillCall,
): VisualIntelligenceProfile {
  const profiles = job.requiredProfileIds as readonly VisualIntelligenceProfile[]
  if (profiles.length === 1) return profiles[0]!
  const requestingSkill = call.requestedBy.kind === 'skill'
    ? call.requestedBy.skillKey
    : null
  const selected = job.jobType === 'skill_output_visual_inspection'
    ? ({
        captions: 'caption_layout_qa',
        color_grading_correction: 'color_context_qa',
        living_frame: 'living_frame_qa',
        motion_graphic_design: 'motion_graphics_qa',
        three_d: 'compositing_qa',
        track_all: 'compositing_qa',
      } as Record<string, VisualIntelligenceProfile>)[requestingSkill ?? '']
    : job.jobType === 'validate_visual_hierarchy'
      ? requestingSkill === 'captions'
        ? 'caption_layout_qa'
        : requestingSkill === 'motion_graphic_design'
          ? 'graphics_layout_qa'
          : undefined
      : job.jobType === 'validate_subject_preservation'
        ? outputId(call) === null
          ? 'source_vs_preview'
          : 'aspect_ratio_source_vs_adaptation'
        : undefined
  if (!selected || !profiles.includes(selected)) throw new TypeError(
    `Visual Intelligence job ${job.jobType} needs an exact profile owner.`,
  )
  return selected
}

function assertCompilationEvidence(input: {
  call: OrchestraSkillCall
  manifest: SkillCapabilityManifest
  qualificationSnapshot: SkillQualificationSnapshot
  admissionMode: 'planning_evidence' | 'approved_edit_inspection'
  evidence: VisualIntelligenceOrchestraCompilationEvidence
}): void {
  orchestraDigest(input.evidence)
  const evidence = input.evidence
  assertExactOwnKeys(evidence, [
    'schemaVersion',
    'callRef',
    'manifestRef',
    'qualificationSnapshotRef',
    'timeBudgetRef',
    'creditBudgetRef',
    'attemptEnvelopeRef',
    'requestScope',
    'sourceArtifacts',
    'comparisonArtifacts',
    'requiredEvidenceRefs',
    'expectedOutcomeRefs',
    'outputFrame',
    'protectedZones',
    'admission',
    'budgetBindingDigestSha256',
    'exactOrchestraPlanAndJobReread',
    'exactManifestAndQualificationReread',
    'exactMediaAuthoritiesReread',
    'exactSceneContextReread',
    'exactTimeAndCreditBudgetsReread',
    'exactAttemptEnvelopeReread',
    'callerPromptAccepted',
    'directProviderCallMade',
    'directTimelineMutationPerformed',
  ])
  const expectedCallRef = orchestraEvidenceRef(
    input.call.callId,
    input.call.callDigestSha256,
  )
  const sourceRefs = evidence.sourceArtifacts.map((artifact) =>
    artifact.finalizedMediaAuthorityRef)
  const comparisonRefs = evidence.comparisonArtifacts.map((artifact) =>
    artifact.finalizedMediaAuthorityRef)
  const allMediaRefs = [...sourceRefs, ...comparisonRefs]
  const expectedBudgetDigest = orchestraDigest({
    callRef: expectedCallRef,
    timeBudgetRef: input.call.timeBudgetRef,
    creditBudgetRef: input.call.creditBudgetRef,
    attemptEnvelopeRef: input.call.attemptEnvelopeRef,
    costPreflight: evidence.admission.costPreflight,
  })
  const approvedSnapshotId = input.call.approvedSnapshotRef?.id ?? null
  const scopeOutputId = outputId(input.call)
  if (
    evidence.schemaVersion
      !== 'visual-intelligence-orchestra-compilation-evidence-v1'
    || !sameRef(evidence.callRef, expectedCallRef)
    || !sameRef(evidence.manifestRef, input.call.manifestRef)
    || !sameRef(
      evidence.qualificationSnapshotRef,
      input.call.qualificationSnapshotRef,
    )
    || !sameRef(evidence.timeBudgetRef, input.call.timeBudgetRef)
    || !sameRef(evidence.creditBudgetRef, input.call.creditBudgetRef)
    || !sameRef(evidence.attemptEnvelopeRef, input.call.attemptEnvelopeRef)
    || evidence.budgetBindingDigestSha256 !== expectedBudgetDigest
    || evidence.requestScope.approvedSnapshotId !== approvedSnapshotId
    || !same(sourceRefs, input.call.sourceArtifactRefs)
    || !same(comparisonRefs, input.call.comparisonArtifactRefs)
    || !same(evidence.requiredEvidenceRefs, input.call.requiredEvidenceRefs)
    || !same(evidence.expectedOutcomeRefs, input.call.expectedOutcomeRefs)
    || evidence.admission.mode !== input.admissionMode
    || !input.call.sourceArtifactRefs.some((ref) =>
      sameRef(ref, input.call.scope.sourceArtifactRef))
    || (evidence.outputFrame?.outputId ?? null) !== scopeOutputId
    || ![...evidence.sourceArtifacts, ...evidence.comparisonArtifacts]
      .every((artifact) => evidence.requiredEvidenceRefs.some((ref) =>
        sameRef(ref, artifact.mediaProbeEvidenceRef)))
    || !evidence.exactOrchestraPlanAndJobReread
    || !evidence.exactManifestAndQualificationReread
    || !evidence.exactMediaAuthoritiesReread
    || !evidence.exactSceneContextReread
    || !evidence.exactTimeAndCreditBudgetsReread
    || !evidence.exactAttemptEnvelopeReread
    || evidence.callerPromptAccepted
    || evidence.directProviderCallMade
    || evidence.directTimelineMutationPerformed
  ) throw new TypeError(
    'Canonical compilation evidence does not match the Orchestra call.',
  )
  if (evidence.admission.mode === 'planning_evidence') {
    if (
      evidence.requestScope.approvedSnapshotId !== null
      || !same(
        evidence.admission.finalizedSourceAuthorityRefs,
        allMediaRefs,
      )
    ) throw new TypeError(
      'Planning compilation admission lost exact source authority.',
    )
  } else if (
    input.call.approvedSnapshotRef === null
    || !sameRef(
      evidence.admission.approvedPlanSnapshotRef,
      input.call.approvedSnapshotRef,
    )
    || !sameRef(
      evidence.admission.privatePreviewArtifactRef,
      input.call.scope.sourceArtifactRef,
    )
  ) throw new TypeError(
    'Inspection compilation admission lost the approved snapshot.',
  )
}

function assertCompiled(
  value: CompiledVisualIntelligenceOrchestraRequest,
): CompiledVisualIntelligenceOrchestraRequest {
  orchestraDigest(value)
  assertExactOwnKeys(value, [
    'schemaVersion',
    'compilerVersion',
    'callRef',
    'supportRequestRef',
    'manifestRef',
    'qualificationSnapshotRef',
    'jobType',
    'phase',
    'scope',
    'operation',
    'profile',
    'admissionMode',
    'budgetBindingDigestSha256',
    'request',
    'exactOrchestraAuthorityReread',
    'exactSkillQualificationReread',
    'exactCompilationEvidenceReread',
    'requestCompiledFromOrchestraCall',
    'directUserInvocationAccepted',
    'directPeerSkillInvocationAccepted',
    'directProviderCallMade',
    'directTimelineMutationPerformed',
    'dispatchAuthorityGranted',
    'compiledRequestDigestSha256',
  ])
  const parsedRequest = parseVisualIntelligenceRequest(value.request)
  const job = getVisualIntelligenceOrchestraJobDefinition(value.jobType)
  assertVisualIntelligenceOrchestraJobScope(job, value.phase, value.scope)
  const payload = { ...value }
  Reflect.deleteProperty(payload, 'compiledRequestDigestSha256')
  if (
    value.schemaVersion
      !== VISUAL_INTELLIGENCE_ORCHESTRA_COMPILED_REQUEST_VERSION
    || value.compilerVersion
      !== VISUAL_INTELLIGENCE_ORCHESTRA_INVOCATION_COMPILER_VERSION
    || value.compiledRequestDigestSha256 !== orchestraDigest(payload)
    || parsedRequest.operation !== value.operation
    || parsedRequest.profile !== value.profile
    || parsedRequest.admission.mode !== value.admissionMode
    || job.operation !== value.operation
    || !job.requiredProfileIds.includes(value.profile)
    || job.admissionClassByPhase[value.phase] !== value.admissionMode
    || !same(parsedRequest.requestedRanges, rangesForScope(value.scope))
    || !parsedRequest.sourceArtifacts.some((artifact) => sameRef(
      artifact.finalizedMediaAuthorityRef,
      value.scope.sourceArtifactRef,
    ))
    || (value.scope.outputId !== null
      && parsedRequest.outputFrame?.outputId !== value.scope.outputId)
    || !value.exactOrchestraAuthorityReread
    || !value.exactSkillQualificationReread
    || !value.exactCompilationEvidenceReread
    || !value.requestCompiledFromOrchestraCall
    || value.directUserInvocationAccepted
    || value.directPeerSkillInvocationAccepted
    || value.directProviderCallMade
    || value.directTimelineMutationPerformed
    || value.dispatchAuthorityGranted
  ) throw new TypeError(
    'Compiled Visual Intelligence Orchestra request is invalid.',
  )
  return value
}

/**
 * Public server-side reread validator for a compiled Visual Intelligence job.
 * The Orchestra dispatch store and runtime use this instead of trusting a
 * caller-authored cast or duplicating the compiler's exact scope checks.
 */
export function parseCompiledVisualIntelligenceOrchestraRequest(
  value: unknown,
): CompiledVisualIntelligenceOrchestraRequest {
  return deepFreeze(assertCompiled(
    value as CompiledVisualIntelligenceOrchestraRequest,
  ))
}

function assertReportMatchesCompiled(
  report: VisualIntelligenceReport,
  compiled: CompiledVisualIntelligenceOrchestraRequest,
): void {
  if (
    !sameRef(report.requestRef, orchestraEvidenceRef(
      compiled.request.requestId,
      compiled.request.requestDigestSha256,
    ))
    || report.operation !== compiled.operation
    || report.profile !== compiled.profile
    || !same(report.scope, compiled.request.scope)
    || !same(report.coverage.requestedRanges,
      compiled.request.requestedRanges)
    || !same(report.expectedOutcomeRefs,
      compiled.request.expectedOutcomeRefs)
    || !same(report.sourceArtifacts,
      compiled.request.sourceArtifacts.map((artifact) => ({
        artifactId: artifact.artifactId,
        checksumSha256: artifact.checksumSha256,
        mediaKind: artifact.mediaKind,
        durationFrames: artifact.durationFrames,
      })))
    || !same(report.comparisonArtifacts,
      compiled.request.comparisonArtifacts.map((artifact) => ({
        artifactId: artifact.artifactId,
        checksumSha256: artifact.checksumSha256,
        mediaKind: artifact.mediaKind,
        durationFrames: artifact.durationFrames,
      })))
    || ![
      ...report.coverage.analyzedRanges,
      ...report.coverage.incompleteRanges,
      ...report.coverage.targetedFollowupRanges,
    ].every((range) => rangeIsWithinAuthorized(
      range,
      compiled.request.requestedRanges,
    ))
    || report.provenance.requestDigestSha256
      !== compiled.request.requestDigestSha256
    || !sameRef(
      report.provenance.providerReleaseRef,
      compiled.request.admission.providerReleaseRef,
    )
    || report.directTimelineMutationAllowed
    || report.renderPerformedByVisualIntelligence
    || report.exportAuthorized
    || report.deliveryAuthorized
  ) throw new TypeError(
    'Visual Intelligence report does not match the Orchestra-compiled request.',
  )
}

function assertJobSpecificCallSemantics(
  job: VisualIntelligenceOrchestraJobDefinition,
  call: OrchestraSkillCall,
): void {
  if (
    ['source_video_understanding', 'final_render_visual_review_support']
      .includes(job.jobType)
    && (call.scope.scopeType !== 'video'
      || !call.scope.completeSourceCoverageRequired)
  ) throw new TypeError(
    'This Visual Intelligence job requires complete authorized video coverage.',
  )
}

function rangeIsWithinAuthorized(
  range: { startFrame: number; endFrameExclusive: number; frameRate: {
    numerator: number; denominator: number
  } },
  authorized: readonly { startFrame: number; endFrameExclusive: number;
    frameRate: { numerator: number; denominator: number } }[],
): boolean {
  return authorized.some((allowed) =>
    range.startFrame >= allowed.startFrame
    && range.endFrameExclusive <= allowed.endFrameExclusive
    && range.frameRate.numerator === allowed.frameRate.numerator
    && range.frameRate.denominator === allowed.frameRate.denominator)
}

function parseRequiredSupportRequest(value: unknown): SkillSupportRequest {
  if (value === undefined || value === null) throw new TypeError(
    'Peer-originated Orchestra call is missing its support request.',
  )
  return parseSkillSupportRequest(value)
}

function rejectUnexpectedSupportRequest(value: unknown): null {
  if (value !== undefined && value !== null) throw new TypeError(
    'Direct Orchestra call cannot accept a peer support request.',
  )
  return null
}

function questionFor(
  jobType: string,
  profile: VisualIntelligenceProfile,
): string | null {
  if (![
    'identify_primary_subject',
    'explain_visible_action',
    'find_available_graphic_space',
    'inspect_transition_window',
    'verify_screen_text',
    'check_subject_occlusion',
    'verify_safe_zone',
    'inspect_visual_defect',
  ].includes(profile)) return null
  const questions: Record<string, string> = {
    caption_boundary_readability_analysis:
      'Inspect only the authorized boundary for caption readability and collisions.',
    find_graphic_space:
      'Identify measured space for the requested graphic without covering protected subjects.',
    scene_primary_subject_identification:
      'Identify the primary visible subject only inside the authorized scene.',
    scene_safe_zone_analysis:
      'Verify the approved safe zones only inside the authorized scene.',
    scene_screen_text_analysis:
      'Report visible text only from the authorized scene and cite exact evidence.',
    scene_semantic_analysis:
      'Explain the visible meaning and action only inside the authorized scene.',
    scene_subject_occlusion_analysis:
      'Check subject occlusion only inside the authorized scene.',
    scene_visible_action_explanation:
      'Explain the visible action only inside the authorized scene.',
    scene_visual_defect_analysis:
      'Inspect the reported visual defect only inside the authorized scene.',
    transition_boundary_inspection:
      'Inspect only the authorized transition boundary and its immediate context.',
  }
  const question = questions[jobType]
  if (!question) throw new TypeError(
    'Visual Intelligence query job has no server-owned bounded question.',
  )
  return question
}

function rangesForCall(call: OrchestraSkillCall) {
  return rangesForScope(call.scope)
}

function rangesForScope(scope: OrchestraSkillScope) {
  return scope.scopeType === 'video'
    ? scope.authorizedRanges
    : [scope.authorizedRange]
}

function outputId(call: OrchestraSkillCall): string | null {
  return call.scope.outputId
}

function same(left: unknown, right: unknown): boolean {
  return orchestraDigest(left) === orchestraDigest(right)
}

function sameRef(
  left: OrchestraEvidenceRef | VisualIntelligenceEvidenceRef,
  right: OrchestraEvidenceRef | VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function uniqueRefs(
  values: readonly VisualIntelligenceEvidenceRef[],
): OrchestraEvidenceRef[] {
  const byKey = new Map(values.map((value) => [
    `${value.id}:${value.version}:${value.contentHash}`,
    value,
  ]))
  return [...byKey.values()].sort((left, right) =>
    compare(
      `${left.id}:${left.version}:${left.contentHash}`,
      `${right.id}:${right.version}:${right.contentHash}`,
    ))
}

function assertExactOwnKeys(
  value: object,
  expectedKeys: readonly string[],
): void {
  let actualKeys: string[]
  try {
    actualKeys = Reflect.ownKeys(value).map((key) => {
      if (typeof key !== 'string') throw new TypeError(
        'Visual Intelligence compilation evidence cannot contain symbols.',
      )
      return key
    }).sort(compare)
  } catch (error) {
    if (error instanceof TypeError) throw error
    throw new TypeError(
      'Visual Intelligence compilation evidence cannot expose hostile keys.',
      { cause: error },
    )
  }
  if (!same(actualKeys, [...expectedKeys].sort(compare))) throw new TypeError(
    'Visual Intelligence compilation evidence has unknown or missing fields.',
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    `Visual Intelligence Orchestra invocation is blocked: ${requiredGate}`,
    503,
    { requiredGate },
  )
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const item of Object.values(value as Record<string, unknown>)) {
    deepFreeze(item)
  }
  return value
}
