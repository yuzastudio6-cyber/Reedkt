import assert from 'node:assert/strict'

import type {
  OrchestraSkillCall,
  OrchestraSkillScope,
  SkillCapabilityManifest,
  SkillQualificationSnapshot,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-capability'
import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
  ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION,
} from '../../src/types/orchestra-skill-capability'
import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  type VisualIntelligenceReport,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  createOrchestraSkillCall,
  createSkillQualificationSnapshot,
  createSkillSupportRequest,
  orchestraDigest,
  orchestraEvidenceRef,
  parseOrchestraSkillJobResult,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  createVisualIntelligenceReport,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceOrchestraCapabilityManifest,
  createVisualIntelligenceOrchestraCapabilityManifestForQualification,
  createVisualIntelligenceOrchestraQualificationSnapshot,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'
import {
  createVisualIntelligenceOrchestraInvocationCompiler,
  createVisualIntelligenceOrchestraJobResult,
  type CompiledVisualIntelligenceOrchestraRequest,
  type VisualIntelligenceOrchestraCompilationEvidence,
} from '../visual-intelligence/visual-intelligence-orchestra-invocation-compiler'

const rawSha = (digit: string) => digit.repeat(64)
const ref = (id: string, value: unknown = { id }) =>
  orchestraEvidenceRef(id, orchestraDigest(value))
const frameRate = { numerator: 24, denominator: 1 } as const
const fullRange = {
  startFrame: 0,
  endFrameExclusive: 240,
  frameRate,
} as const
const sourceRef = ref('finalized-source-video')
const probeRef = ref('source-media-probe')

const blockedQualification =
  createVisualIntelligenceOrchestraQualificationSnapshot()
const blockedManifest = createVisualIntelligenceOrchestraCapabilityManifest()
const qualifiedQualification = createPartiallyQualifiedSnapshot([
  'scene_primary_subject_identification',
  'source_video_understanding',
])
const qualifiedManifest =
  createVisualIntelligenceOrchestraCapabilityManifestForQualification(
    qualifiedQualification,
  )

const videoScope = {
  scopeType: 'video',
  sourceArtifactRef: sourceRef,
  authorizedRanges: [fullRange],
  completeSourceCoverageRequired: true,
  outputId: null,
} satisfies OrchestraSkillScope
const sceneScope = {
  scopeType: 'scene',
  sourceArtifactRef: sourceRef,
  sceneId: 'scene-1',
  outputId: 'output-vertical',
  authorizedRange: fullRange,
  selectedSceneBindingRef: ref('selected-scene-binding'),
  completeSceneCoverageRequired: true,
} satisfies OrchestraSkillScope

async function main() {
  let blockedCompilationCalls = 0
  const blockedCompiler = createCompiler({
    manifest: blockedManifest,
    qualification: blockedQualification,
    onCompile: () => { blockedCompilationCalls += 1 },
  })
  const blockedCall = createCall({
    manifest: blockedManifest,
    qualification: blockedQualification,
    jobType: 'source_video_understanding',
    scope: videoScope,
  })
  await assert.rejects(
    blockedCompiler.compile({ call: blockedCall }),
    (error: unknown) => error instanceof ApiError
      && error.code === 'TOOL_NOT_READY'
      && error.status === 503,
  )
  assert.equal(blockedCompilationCalls, 0)

  let compilationCalls = 0
  const compiler = createCompiler({
    manifest: qualifiedManifest,
    qualification: qualifiedQualification,
    onCompile: () => { compilationCalls += 1 },
  })
  const sourceCall = createCall({
    manifest: qualifiedManifest,
    qualification: qualifiedQualification,
    jobType: 'source_video_understanding',
    scope: videoScope,
  })
  const sourceCompiled = await compiler.compile({ call: sourceCall })
  assert.equal(compilationCalls, 1)
  assert.equal(sourceCompiled.jobType, 'source_video_understanding')
  assert.equal(sourceCompiled.phase, 'planning')
  assert.deepEqual(sourceCompiled.scope, videoScope)
  assert.equal(sourceCompiled.operation, 'analyze_media')
  assert.equal(sourceCompiled.profile, 'source_edit_planning')
  assert.equal(sourceCompiled.admissionMode, 'planning_evidence')
  assert.equal(sourceCompiled.request.qualityPolicy.exactModelId,
    VISUAL_INTELLIGENCE_MODEL_ID)
  assert.equal(sourceCompiled.request.qualityPolicy.thinkingLevel, 'high')
  assert.equal(sourceCompiled.request.qualityPolicy.mediaResolution, 'high')
  assert.equal(sourceCompiled.request.callerPromptAccepted, false)
  assert.equal(sourceCompiled.directProviderCallMade, false)
  assert.equal(sourceCompiled.dispatchAuthorityGranted, false)
  assert.equal(Object.isFrozen(sourceCompiled), true)

  const support = createSupportRequest(sceneScope)
  const sceneCall = createCall({
    manifest: qualifiedManifest,
    qualification: qualifiedQualification,
    jobType: 'scene_primary_subject_identification',
    scope: sceneScope,
    support,
  })
  const sceneCompiled = await compiler.compile({
    call: sceneCall,
    supportRequest: support,
  })
  assert.equal(sceneCompiled.jobType,
    'scene_primary_subject_identification')
  assert.equal(sceneCompiled.operation, 'query_range')
  assert.equal(sceneCompiled.profile, 'identify_primary_subject')
  assert.deepEqual(sceneCompiled.scope, sceneScope)
  assert.match(sceneCompiled.request.callerQuestion ?? '',
    /authorized scene/u)
  assert.equal(sceneCompiled.request.outputFrame?.outputId,
    sceneScope.outputId)
  assert.equal(compilationCalls, 2)

  const approvedCall = createCall({
    manifest: qualifiedManifest,
    qualification: qualifiedQualification,
    jobType: 'scene_primary_subject_identification',
    scope: sceneScope,
    phase: 'approved_execution',
  })
  const approvedCompiled = await compiler.compile({ call: approvedCall })
  assert.equal(approvedCompiled.phase, 'approved_execution')
  assert.equal(approvedCompiled.admissionMode, 'approved_edit_inspection')
  assert.equal(approvedCompiled.request.scope.approvedSnapshotId,
    approvedCall.approvedSnapshotRef?.id)
  assert.equal(approvedCompiled.request.admission.mode,
    'approved_edit_inspection')
  assert.equal(compilationCalls, 3)

  const report = createReport(sceneCompiled)
  const result = createVisualIntelligenceOrchestraJobResult({
    compiled: sceneCompiled,
    report,
    followupEstimate: null,
  })
  assert.equal(parseOrchestraSkillJobResult(result).disposition, 'completed')
  assert.equal(result.jobType, sceneCall.jobType)
  assert.equal(result.phase, sceneCall.phase)
  assert.deepEqual(result.scope, sceneScope)
  assert.equal(result.resultReturnsToOrchestra, true)
  assert.equal(result.directTimelineMutationPerformed, false)
  assert.equal(result.finalQaApprovalGranted, false)

  const followupReport = createReport(sceneCompiled, true)
  assert.throws(() => createVisualIntelligenceOrchestraJobResult({
    compiled: sceneCompiled,
    report: followupReport,
    followupEstimate: null,
  }))
  const followupResult = createVisualIntelligenceOrchestraJobResult({
    compiled: sceneCompiled,
    report: followupReport,
    followupEstimate: {
      timeRef: ref('followup-time-estimate'),
      creditRef: ref('followup-credit-estimate'),
    },
  })
  assert.equal(followupResult.disposition, 'needs_followup')
  assert.equal(followupResult.proposedFollowupRanges.length, 1)
  assert.equal(followupResult.scopeExpandedWithoutOrchestra, false)
  const outOfScopeFollowup = createReport(sceneCompiled, true, {
    startFrame: 230,
    endFrameExclusive: 260,
    frameRate,
  })
  assert.throws(() => createVisualIntelligenceOrchestraJobResult({
    compiled: sceneCompiled,
    report: outOfScopeFollowup,
    followupEstimate: {
      timeRef: ref('out-of-scope-time'),
      creditRef: ref('out-of-scope-credits'),
    },
  }))

  const adversarial: Array<() => Promise<unknown>> = [
    () => createCompiler({
      manifest: qualifiedManifest,
      qualification: qualifiedQualification,
      registryMissing: true,
    }).compile({ call: sourceCall }),
    () => compiler.compile({
      call: createCall({
        manifest: qualifiedManifest,
        qualification: qualifiedQualification,
        jobType: 'story_structure_analysis',
        scope: videoScope,
      }),
    }),
    () => compiler.compile({
      call: createCall({
        manifest: qualifiedManifest,
        qualification: qualifiedQualification,
        jobType: 'source_video_understanding',
        scope: {
          ...videoScope,
          completeSourceCoverageRequired: false,
        },
      }),
    }),
    () => compiler.compile({
      call: createCall({
        manifest: qualifiedManifest,
        qualification: qualifiedQualification,
        jobType: 'scene_primary_subject_identification',
        scope: sceneScope,
        support,
      }),
    }),
    () => compiler.compile({
      call: sourceCall,
      supportRequest: support,
    }),
    async () => {
      const wrongPurpose = createSupportRequest(
        sceneScope,
        'inspect_transition_boundary',
      )
      return compiler.compile({
        call: createCall({
          manifest: qualifiedManifest,
          qualification: qualifiedQualification,
          jobType: 'scene_primary_subject_identification',
          scope: sceneScope,
          support: wrongPurpose,
        }),
        supportRequest: wrongPurpose,
      })
    },
    () => createCompiler({
      manifest: qualifiedManifest,
      qualification: qualifiedQualification,
      tamper: (evidence) => ({
        ...evidence,
        budgetBindingDigestSha256: ref('wrong-budget').contentHash,
      }),
    }).compile({ call: sourceCall }),
    () => createCompiler({
      manifest: qualifiedManifest,
      qualification: qualifiedQualification,
      tamper: (evidence) => ({
        ...evidence,
        unexpectedAuthority: true,
      } as never),
    }).compile({ call: sourceCall }),
    () => createCompiler({
      manifest: qualifiedManifest,
      qualification: qualifiedQualification,
      tamper: (evidence) => ({
        ...evidence,
        sourceArtifacts: [{
          ...evidence.sourceArtifacts[0]!,
          finalizedMediaAuthorityRef: ref('other-source'),
        }],
      }),
    }).compile({ call: sourceCall }),
    () => createCompiler({
      manifest: qualifiedManifest,
      qualification: qualifiedQualification,
      tamper: (evidence) => ({
        ...evidence,
        directProviderCallMade: true,
      } as never),
    }).compile({ call: sourceCall }),
    () => createCompiler({
      manifest: qualifiedManifest,
      qualification: qualifiedQualification,
      tamper: (evidence) => ({
        ...evidence,
        outputFrame: evidence.outputFrame
          ? { ...evidence.outputFrame, outputId: 'other-output' }
          : null,
      }),
    }).compile({ call: sceneCall, supportRequest: support }),
    () => compiler.compile({
      call: {
        ...sourceCall,
        directProviderCallAllowed: true,
      },
    }),
  ]
  for (const refuse of adversarial) await assert.rejects(refuse)

  assert.throws(() => createVisualIntelligenceOrchestraJobResult({
    compiled: sceneCompiled,
    report: {
      ...report,
      scope: {
        ...report.scope,
        editSessionId: 'other-edit',
      },
    },
    followupEstimate: null,
  }))

  console.log(JSON.stringify({
    smoke: 'visual-intelligence-orchestra-invocation-compiler',
    checks: 53,
    topLevelSkillKey: qualifiedManifest.skillKey,
    compiledJobs: [sourceCompiled, sceneCompiled, approvedCompiled]
      .map((item) => `${item.jobType}:${item.phase}`),
    sourceOperation: sourceCompiled.operation,
    peerSupportOperation: sceneCompiled.operation,
    exactJobPhaseScopePreserved: true,
    resultReturnsToOrchestra: result.resultReturnsToOrchestra,
    followupRequiresNewEstimate: true,
    blockedSnapshotRefusedBeforeCompilation: blockedCompilationCalls === 0,
    adversarialCases: adversarial.length + 3,
    providerCallMadeByCompiler: sourceCompiled.directProviderCallMade,
    timelineMutationPerformed: sourceCompiled.directTimelineMutationPerformed,
    productionAuthorityGranted: false,
  }))
}

function createPartiallyQualifiedSnapshot(
  qualifiedJobTypes: readonly string[],
): SkillQualificationSnapshot {
  const qualified = new Set(qualifiedJobTypes)
  return createSkillQualificationSnapshot({
    schemaVersion: ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
    snapshotId: 'visual-intelligence-orchestra-qualification-partial',
    skillKey: blockedQualification.skillKey,
    skillVersion: blockedQualification.skillVersion,
    contractVersion: blockedQualification.contractVersion,
    capabilityDefinitionDigestSha256:
      blockedManifest.capabilityDefinitionDigestSha256,
    observedReleaseRef: ref('visual-intelligence-qualified-release'),
    observedAt: '2026-08-03T12:00:00.000Z',
    overall: 'partially_qualified',
    jobQualifications: blockedQualification.jobQualifications.map((item) =>
      qualified.has(item.jobType)
        ? {
          jobType: item.jobType,
          status: 'qualified' as const,
          blockerCodes: [],
          qualifiedRouteIds: blockedManifest.toolRoutes
            .filter((route) => route.jobTypes.includes(item.jobType))
            .map((route) => route.routeId)
            .sort(compare),
          qualificationEvidenceRefs: [ref(
            `qualification-evidence-${item.jobType}`,
          )],
        }
        : item),
    callerCanSelfQualify: false,
    qualificationOwner: 'canonical_skill_qualification_registry',
    dispatchAuthorityGranted: false,
    providerAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

function createCall(input: {
  manifest: SkillCapabilityManifest
  qualification: SkillQualificationSnapshot
  jobType: string
  scope: OrchestraSkillScope
  support?: SkillSupportRequest
  phase?: OrchestraSkillCall['phase']
}): OrchestraSkillCall {
  const phase = input.phase ?? 'planning'
  const approvedSnapshotRef = ['planning', 'preapproval'].includes(phase)
    ? null
    : ref(`approved-snapshot-${phase}`)
  return createOrchestraSkillCall({
    schemaVersion: ORCHESTRA_SKILL_CALL_VERSION,
    callId: `orchestra-call-${input.jobType}-${phase}`,
    orchestraPlanRef: ref('orchestra-plan'),
    orchestraJobRef: ref('orchestra-job'),
    parentJobRef: null,
    requestedBy: input.support
      ? {
        kind: 'skill',
        skillKey: input.support.requestingSkillKey,
        skillJobRef: ref(input.support.requestingSkillJobId),
        supportRequestRef: orchestraEvidenceRef(
          input.support.requestId,
          input.support.requestDigestSha256,
        ),
      }
      : { kind: 'orchestra' },
    targetSkillKey: 'visual_intelligence',
    jobType: input.jobType,
    phase,
    scope: input.scope,
    sceneContextSnapshotRef: input.scope.scopeType === 'video'
      ? null
      : ref('scene-context'),
    sourceArtifactRefs: [sourceRef],
    comparisonArtifactRefs: [],
    expectedOutcomeRefs: approvedSnapshotRef
      ? [ref(`expected-outcome-${phase}`)]
      : [],
    requiredEvidenceRefs: [probeRef],
    manifestRef: orchestraEvidenceRef(
      input.manifest.manifestId,
      input.manifest.manifestDigestSha256,
    ),
    qualificationSnapshotRef: orchestraEvidenceRef(
      input.qualification.snapshotId,
      input.qualification.snapshotDigestSha256,
    ),
    timeBudgetRef: ref('time-budget'),
    creditBudgetRef: ref('credit-budget'),
    attemptEnvelopeRef: ref('attempt-envelope'),
    approvedSnapshotRef,
    idempotencyKey: `orchestra-idempotency-${input.jobType}-${phase}`,
    orchestraDispatchAuthorized: true,
    directProviderCallAllowed: false,
    directTimelineMutationAllowed: false,
    directArtifactMutationAllowed: false,
    scopeExpansionAllowed: false,
    peerSkillExecutionAuthorityAccepted: false,
  })
}

function createSupportRequest(
  scope: OrchestraSkillScope,
  purposeCode = 'identify_scene_primary_subject',
): SkillSupportRequest {
  return createSkillSupportRequest({
    schemaVersion: ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION,
    requestId: 'caption-support-request-1',
    requestingSkillKey: 'captions',
    requestingSkillJobId: 'caption-job-1',
    parentOrchestraJobId: 'orchestra-job',
    requiredCapability: 'visual_intelligence',
    requestedJobType: 'scene_primary_subject_identification',
    phase: 'planning',
    scope,
    purposeCode,
    inputArtifactRefs: [sourceRef],
    comparisonArtifactRefs: [],
    expectedOutcomeRefs: [],
    requiredEvidenceRefs: [probeRef],
    urgency: 'blocking',
    supportRequestOnly: true,
    executionAuthorityGranted: false,
    providerInvocationAuthorityGranted: false,
    timelineMutationAuthorityGranted: false,
    scopeExpansionAuthorityGranted: false,
  })
}

function createCompiler(input: {
  manifest: SkillCapabilityManifest
  qualification: SkillQualificationSnapshot
  registryMissing?: boolean
  onCompile?: () => void
  tamper?: (
    evidence: VisualIntelligenceOrchestraCompilationEvidence,
  ) => VisualIntelligenceOrchestraCompilationEvidence
}) {
  return createVisualIntelligenceOrchestraInvocationCompiler({
    authorityRegistryPort: {
      async readExact() {
        return input.registryMissing
          ? null
          : {
            manifest: input.manifest,
            qualificationSnapshot: input.qualification,
          }
      },
    },
    compilationPort: {
      async prepareExact({ call, admissionMode }) {
        input.onCompile?.()
        const sourceArtifacts = [{
          artifactId: 'source-video-1',
          mediaKind: 'video' as const,
          contentType: 'video/mp4',
          checksumSha256: rawSha('1'),
          byteLength: 2_000_000,
          width: 1920,
          height: 1080,
          durationFrames: 240,
          frameRate,
          finalizedMediaAuthorityRef: sourceRef,
          immutableStorageObjectAuthorityRef: ref('storage-object'),
          mediaProbeEvidenceRef: probeRef,
          privateArtifact: true as const,
          exactGenerationRereadRequiredAtDispatch: true as const,
        }]
        const costPreflight = {
          pricingSnapshotRef: ref('pricing-snapshot'),
          accountEffectiveRateAuthorityRef: ref('account-effective-rate'),
          currency: 'USD',
          maximumAuthorizedCostMicros: 500_000,
          estimatedMinimumCostMicros: 10_000,
          estimatedMaximumCostMicros: 200_000,
          serviceFeeIncluded: false as const,
          publicListPriceUsedAsSettlementAuthority: false as const,
          preflightPassed: true as const,
        }
        const callRef = orchestraEvidenceRef(
          call.callId,
          call.callDigestSha256,
        )
        const admission = admissionMode === 'planning_evidence'
          ? {
            mode: 'planning_evidence' as const,
            authenticatedPrincipalRef: ref('authenticated-principal'),
            workspaceAuthorizationRef: ref('workspace-authorization'),
            finalizedSourceAuthorityRefs: [sourceRef],
            sourceChecksumSetRef: ref('source-checksum-set'),
            analysisAllowanceRef: ref('analysis-allowance'),
            costPreflight,
            retentionPolicyRef: ref('retention-policy'),
            privacyPolicyRef: ref('privacy-policy'),
            providerReleaseRef: ref('gemini-provider-release'),
            globalKillSwitchOpen: false as const,
            providerKillSwitchOpen: false as const,
            reportPersistenceAllowed: true as const,
            timelineMutationAllowed: false as const,
            editingWorkerExecutionAllowed: false as const,
            generationAllowed: false as const,
            renderAllowed: false as const,
            exportAllowed: false as const,
            deliveryAllowed: false as const,
          }
          : {
            mode: 'approved_edit_inspection' as const,
            authenticatedPrincipalRef: ref('authenticated-principal'),
            workspaceAuthorizationRef: ref('workspace-authorization'),
            approvedPlanSnapshotRef: call.approvedSnapshotRef!,
            approvedEstimateRef: ref('approved-estimate'),
            creditReservationRef: ref('credit-reservation'),
            privatePreviewArtifactRef: call.scope.sourceArtifactRef,
            expectedOutcomeRefs: call.expectedOutcomeRefs,
            workNodeRefs: [call.orchestraJobRef],
            timelineRefs: [ref('master-timing')],
            qaPolicyRef: ref('visual-intelligence-qa-policy'),
            costPreflight,
            retentionPolicyRef: ref('retention-policy'),
            privacyPolicyRef: ref('privacy-policy'),
            providerReleaseRef: ref('gemini-provider-release'),
            globalKillSwitchOpen: false as const,
            providerKillSwitchOpen: false as const,
            reportPersistenceAllowed: true as const,
            timelineMutationAllowed: false as const,
            owningSkillRepairAllowed: true as const,
            directRepairAllowed: false as const,
            finalQaApprovalAllowed: false as const,
            exportReleaseAllowed: false as const,
            deliveryAllowed: false as const,
          }
        const evidence: VisualIntelligenceOrchestraCompilationEvidence = {
          schemaVersion:
            'visual-intelligence-orchestra-compilation-evidence-v1',
          callRef,
          manifestRef: call.manifestRef,
          qualificationSnapshotRef: call.qualificationSnapshotRef,
          timeBudgetRef: call.timeBudgetRef,
          creditBudgetRef: call.creditBudgetRef,
          attemptEnvelopeRef: call.attemptEnvelopeRef,
          requestScope: {
            ownerUserId: 'user-1',
            workspaceId: 'workspace-1',
            projectId: 'project-1',
            editSessionId: 'edit-1',
            approvedSnapshotId: call.approvedSnapshotRef?.id ?? null,
          },
          sourceArtifacts,
          comparisonArtifacts: [],
          requiredEvidenceRefs: [probeRef],
          expectedOutcomeRefs: call.expectedOutcomeRefs,
          outputFrame: call.scope.outputId === null
            ? null
            : {
              outputId: call.scope.outputId,
              aspectRatioLabel: '9:16',
              aspectRatioNumerator: 9,
              aspectRatioDenominator: 16,
              width: 1080,
              height: 1920,
              frameRate,
              confirmedOutputFrameRef: ref('confirmed-output-frame'),
              confirmedByUser: true,
            },
          protectedZones: [],
          admission,
          budgetBindingDigestSha256: orchestraDigest({
            callRef,
            timeBudgetRef: call.timeBudgetRef,
            creditBudgetRef: call.creditBudgetRef,
            attemptEnvelopeRef: call.attemptEnvelopeRef,
            costPreflight,
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
        }
        return input.tamper ? input.tamper(evidence) : evidence
      },
    },
  })
}

function createReport(
  compiled: CompiledVisualIntelligenceOrchestraRequest,
  followup = false,
  followupRange = {
    startFrame: 0,
    endFrameExclusive: 24,
    frameRate,
  },
): VisualIntelligenceReport {
  const request = compiled.request
  const evidenceRef = request.sourceArtifacts[0]!.mediaProbeEvidenceRef
  const range = request.requestedRanges[0]!
  return createVisualIntelligenceReport({
    reportId: `${request.requestId}-report-${followup ? 'followup' : 'pass'}`,
    requestRef: orchestraEvidenceRef(
      request.requestId,
      request.requestDigestSha256,
    ),
    scope: request.scope,
    operation: request.operation,
    profile: request.profile,
    sourceArtifacts: request.sourceArtifacts.map((artifact) => ({
      artifactId: artifact.artifactId,
      checksumSha256: artifact.checksumSha256,
      mediaKind: artifact.mediaKind,
      durationFrames: artifact.durationFrames,
    })),
    comparisonArtifacts: [],
    coverage: {
      requestedRanges: request.requestedRanges,
      analyzedRanges: request.requestedRanges,
      incompleteRanges: [],
      sceneBoundaryRefs: [],
      samplingPolicies: [{
        policyId: 'orchestra-scene-range-policy',
        policyVersion: 'orchestra-scene-range-policy-v1',
        mode: 'scene_aware_complete_coverage',
        targetFramesPerSecondNumerator: 2,
        targetFramesPerSecondDenominator: 1,
        sceneAware: true,
        highDetail: true,
        requestedRange: range,
        analyzedRange: range,
        samplingPolicyRef: ref('sampling-policy'),
      }],
      targetedFollowupRanges: followup
        ? [followupRange]
        : [],
      completeRequestedRangeCoverage: true,
      everyTimelineFrameInspected: false,
      completeTimePixelInspectionClaimAllowed: false,
    },
    semanticSummary:
      'The authorized scene contains one primary basketball presenter.',
    segments: [{
      segmentId: 'segment-1',
      artifactId: request.sourceArtifacts[0]!.artifactId,
      range,
      sceneId: 'scene-1',
      summary: 'The presenter is the primary visible subject.',
      subjectIds: ['presenter-1'],
      objectIds: ['basketball-1'],
      actionLabels: ['presenting'],
      visibleTextEvidenceRefs: [],
      transcriptEvidenceRefs: [],
      evidenceRefs: [evidenceRef],
      confidenceBasisPoints: 9_000,
      uncertainty: null,
      sourcePlanning: null,
    }],
    findings: [],
    evidence: [{
      evidenceId: evidenceRef.id,
      evidenceRef,
      artifactId: request.sourceArtifacts[0]!.artifactId,
      range: null,
      authority: 'media_probe',
      producingTool: 'ffprobe',
      toolVersion: 'ffprobe-8.0',
      summary: 'Canonical dimensions and rational frame timing are verified.',
      privateEvidence: true,
      providerInstructionAccepted: false,
    }],
    deterministicToolExecutions: [{
      tool: 'ffprobe',
      requirement: 'required',
      executionClass: 'l4_gpu_standard',
      releaseRef: ref('ffprobe-l4-release'),
      executionRef: ref('ffprobe-execution'),
      substantiveCpuExecutionUsed: false,
      sourceArtifactChecksumBound: true,
    }],
    expectedOutcomeRefs: [],
    disposition: 'pass',
    reinspectionRequired: false,
    usage: {
      promptTokenCount: 2_000,
      candidateTokenCount: 400,
      thinkingTokenCount: 600,
      cachedTokenCount: 0,
      totalTokenCount: 3_000,
      providerResponseId: 'gemini-response-1',
      providerModelVersion: VISUAL_INTELLIGENCE_MODEL_ID,
      estimatedCostMicros: 40_000,
      settledCostMicros: 38_000,
      costEvidenceRef: ref('settled-cost'),
      billingAccountEffectiveRateUsed: true,
      publicListPriceUsed: false,
      duplicateSettlementPerformed: false,
      replayedFromCache: false,
      providerCallMade: true,
    },
    provenance: {
      providerAdapterId: VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
      providerId: VISUAL_INTELLIGENCE_PROVIDER_ID,
      exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
      thinkingLevel: 'high',
      mediaResolution: 'high',
      promptVersion: 'visual-intelligence-prompt-v1',
      responseSchemaVersion: 'visual-intelligence-provider-response-v1',
      deterministicEvidenceVersion: 'visual-intelligence-evidence-v1',
      transcriptVersion: 'faster-whisper-large-v3-v1',
      ocrVersion: null,
      cacheIdentitySha256: orchestraDigest({ request: request.requestId }),
      requestDigestSha256: request.requestDigestSha256,
      admissionRef: ref('admission-record'),
      providerReleaseRef: request.admission.providerReleaseRef,
      applicationDefaultCredentialsUsed: true,
      providerToolsUsed: false,
      searchGroundingUsed: false,
      urlContextUsed: false,
      codeExecutionUsed: false,
      rawProviderPayloadPersisted: false,
    },
    blockers: [],
    warnings: [],
    immutableReport: true,
    planningMayConsumeValidatedEvidence: true,
    directTimelineMutationAllowed: false,
    renderPerformedByVisualIntelligence: false,
    exportAuthorized: false,
    deliveryAuthorized: false,
  })
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

void main()
