import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import { getApiRouteById } from '../../src/backend/api/api-route-registry'
import {
  rebindApprovedPlanSnapshotId,
} from '../../src/lib/approved-snapshot-backend-sync'
import {
  acceptCaptionRenderedVisualReviewAuthenticatedReadResult,
  buildCaptionRenderedVisualReviewAuthenticatedReadRequest,
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_CLOSED_AUTHORITY,
  digestCaptionRenderedVisualReviewAuthenticatedReadResult,
  validateCaptionRenderedVisualReviewAuthenticatedReadRequest,
  validateCaptionRenderedVisualReviewAuthenticatedReadResult,
} from '../../src/lib/caption-direction/caption-rendered-visual-review-authenticated-read'
import {
  CAPTION_SPECIALIST_REQUIRED_COMPONENT_KEYS,
  calculateCaptionSpecialistIntegrationDigest,
  compileCaptionSpecialistNaturalLanguageRevision,
  createCaptionSpecialistApprovedSnapshotExtension,
  createCaptionSpecialistAuthenticatedPresentation,
  createCaptionSpecialistComponentPersistenceReceipt,
  createCaptionSpecialistObservabilityReceipt,
  createCaptionSpecialistPlanningPresentation,
  parseCaptionSpecialistApprovedSnapshotExtension,
  parseCaptionSpecialistChatPresentation,
  parseCaptionSpecialistNaturalLanguageRevisionIntent,
} from '../../src/lib/caption-direction/caption-specialist-integration'
import { sampleClips } from '../../src/lib/mock-planner/default-data'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import {
  createProfessionalSkillPlan,
} from '../../src/lib/professional-skills/professional-skill-planner'
import {
  calculateProfessionalSkillCompositionTraceDigest,
  parseProfessionalSkillCompositionTrace,
} from '../../src/lib/professional-skills/professional-skill-composition-trace'
import {
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_PROJECTION_VERSION,
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_ROUTE,
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_ROUTE_ID,
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION,
  type CaptionRenderedVisualReviewAuthenticatedReadResult,
  type CaptionRenderedVisualReviewConfirmedOutputFrameRef,
} from '../../src/types/caption-direction-visual-review-authenticated-read'
import {
  CAPTION_RENDERED_VISUAL_REVIEW_OUTPUT_SET_PRODUCT_STATUS_VERSION,
  CAPTION_RENDERED_VISUAL_REVIEW_PRODUCT_STATUS_VERSION,
  type CaptionRenderedVisualReviewOutputSetProductStatus,
  type CaptionRenderedVisualReviewProductAuthorityBoundary,
} from '../../src/types/caption-direction-visual-review-product-status'
import type { CaptionDomainCanonicalScope, CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type { CaptionSpecialistApprovedSnapshotExtension } from
  '../../src/types/caption-specialist-integration'
import type { PlannerInput } from '../../src/types/reeditpro'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string, version = `${id}.v1`): CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}:${version}`) }
}
function wireHash(value: string): string {
  return `sha256:${hash(value)}`
}

const plannerInput: PlannerInput = {
  projectName: 'Caption specialist CAP-17',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'horizontal_wide_frame',
  editingCategory: 'education_explainer',
  workflowType: 'education_explainer',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'premium',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions: 'Add readable captions and keep speech clear.',
  creditPreference: 'balanced',
  clips: sampleClips,
  sourceSequenceMode: 'multi_clip_story_order',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
}

const selectedSkillPlan = createProfessionalSkillPlan({ plannerInput })
const selectedTrace = selectedSkillPlan.compositionTrace!
const selectedPlan = createMockEditPlan(plannerInput)
const selectedPlanTrace = selectedPlan.professionalSkillPlan!.compositionTrace!
const noCaptionSkillPlan = createProfessionalSkillPlan({
  plannerInput: {
    ...plannerInput,
    projectName: 'Caption specialist CAP-17 restraint',
    customInstructions: 'Use no captions and no subtitles.',
  },
})

const scope = {
  workspaceId: 'workspace.cap17',
  projectId: 'project.cap17',
  editSessionId: 'edit.cap17',
  approvedSnapshotId: 'approved-snapshot.cap17',
}
const outputFrame: CaptionRenderedVisualReviewConfirmedOutputFrameRef = {
  id: 'confirmed-frame.cap17.wide',
  version: 1,
  contentHash: wireHash('confirmed-frame.cap17.wide'),
  outputId: 'output.cap17.wide',
  aspectRatio: '16:9',
  width: 1920,
  height: 1080,
  fps: 30,
  confirmedByUser: true,
  confirmationRecordId: 'frame-confirmation.cap17.wide',
}
const authenticatedRequest =
  buildCaptionRenderedVisualReviewAuthenticatedReadRequest({
    scope,
    confirmedOutputFrameRefs: [outputFrame],
  })

const productAuthority: CaptionRenderedVisualReviewProductAuthorityBoundary = {
  operationDispatchAuthority: false,
  providerRuntimeAuthority: false,
  qaApprovalAuthority: false,
  repairExecutionAuthority: false,
  assetMutationAuthority: false,
  creditOrBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}

function lifecycleResult(
  disposition: 'not_found' | 'pending' | 'completed',
): CaptionRenderedVisualReviewAuthenticatedReadResult {
  const waiting = disposition === 'pending'
  const completed = disposition === 'completed'
  const outputSetStatus: CaptionRenderedVisualReviewOutputSetProductStatus
    | null = disposition === 'not_found' ? null : {
    schemaVersion:
      CAPTION_RENDERED_VISUAL_REVIEW_OUTPUT_SET_PRODUCT_STATUS_VERSION,
    scope: { ...scope },
    requiredOutputIds: [outputFrame.outputId],
    requiredAspectRatios: [outputFrame.aspectRatio],
    outputs: [{
      outputId: outputFrame.outputId,
      aspectRatio: outputFrame.aspectRatio,
      width: outputFrame.width,
      height: outputFrame.height,
      fps: outputFrame.fps,
      status: {
        schemaVersion: CAPTION_RENDERED_VISUAL_REVIEW_PRODUCT_STATUS_VERSION,
        scope: { ...scope },
        state: waiting ? 'waiting_for_qualified_ai' as const : 'passed' as const,
        userFacingLabel: waiting ? 'Waiting for visual review' : 'Caption checks passed',
        userFacingSummary: waiting
          ? 'Technical Caption checks passed; qualified visual review is pending.'
          : 'Technical and qualified visual Caption checks agree.',
        deterministicQaStatus: 'passed' as const,
        aiVisualInspectionStatus: waiting ? 'waiting' as const : 'passed' as const,
        exactApprovedRenderBound: true,
        actualModelInferenceVerified: completed,
        deterministicAndModelEvidenceAgree: completed,
        canonicalEvidenceReconciled: completed,
        serverDerivedFromCanonicalEvidence: completed,
        ...(completed ? {
          modelInspectionCoverage: {
            scope: 'complete_segment_coverage' as const,
            sampledSegmentCount: 3,
            unsampledSegmentCount: 0,
            modelInspectedOnlyPlannedSamples: true as const,
            unsampledSegmentsNeverImpliedInspected: true as const,
          },
          canonicalEvidenceRefs: {
            decisionRef: evidenceRef('decision'),
            providerExecutionReceiptRef: evidenceRef('provider-execution'),
            persistedEvidenceArtifactRef: evidenceRef('persisted-artifact'),
            independentArtifactQaRef: evidenceRef('independent-qa'),
            assetManifestReconciliationRef: evidenceRef('manifest-reconciliation'),
          },
        } : {}),
        visualQaGateSatisfied: completed,
        visualQaBlocksDelivery: !completed,
        smallestScopeRepairRequired: false,
        privateHumanReviewRequired: false,
        rawModelTextIncluded: false,
        mediaBytesIncluded: false,
        pathsOrUrlsIncluded: false,
        authorityBoundary: { ...productAuthority },
      },
    }],
    state: waiting ? 'waiting_for_qualified_ai' as const : 'passed' as const,
    userFacingLabel: waiting ? 'Waiting for visual review' : 'Caption checks passed',
    userFacingSummary: waiting
      ? 'Caption visual review is still running.'
      : 'Caption evidence is ready for private human review.',
    allRequiredOutputsCovered: true,
    everyOutputDeterministicQaPassed: true,
    everyOutputQualifiedVisualReviewPassed: completed,
    unresolvedOutputIds: completed ? [] : [outputFrame.outputId],
    outputEvidenceCannotBeReusedAcrossCanvases: true as const,
    serverDerivedFromAuthenticatedCanonicalReads: true as const,
    visualQaGateSatisfied: completed,
    visualQaBlocksDelivery: !completed,
    rawModelTextIncluded: false as const,
    mediaBytesIncluded: false as const,
    pathsOrUrlsIncluded: false as const,
    authorityBoundary: { ...productAuthority },
  }
  const result: CaptionRenderedVisualReviewAuthenticatedReadResult = {
    schemaVersion:
      CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION,
    disposition,
    scope: { ...scope },
    confirmedOutputs: structuredClone(authenticatedRequest.requiredOutputs),
    projectionRef: {
      id: `caption.visual-review.projection.${disposition}`,
      version: 1,
      schemaVersion:
        CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_PROJECTION_VERSION,
      contentHash: wireHash('placeholder'),
    },
    outputSetStatus,
    userFacingSummary: disposition === 'not_found'
      ? 'No canonical Caption visual review exists yet.'
      : outputSetStatus!.userFacingSummary,
    authenticatedPrincipalVerified: true,
    exactCanonicalScopeReread: true,
    requestedOutputFramesReread: true,
    approvedSnapshotImmutable: true,
    browserLocalStateUsed: false,
    rawModelTextIncluded: false,
    mediaBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    authorityBoundary: {
      ...CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_CLOSED_AUTHORITY,
    },
  }
  result.projectionRef.contentHash =
    digestCaptionRenderedVisualReviewAuthenticatedReadResult(result)
  return result
}

function evidenceRef(id: string) {
  return { id: `caption.cap17.${id}`, version: 1, contentHash: wireHash(id) }
}

function snapshotExtension(): CaptionSpecialistApprovedSnapshotExtension {
  return createCaptionSpecialistApprovedSnapshotExtension({
    extensionId: 'caption.snapshot-extension.cap17',
    ownerUserId: 'user.cap17',
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    approvedSnapshotId: scope.approvedSnapshotId,
    approvedPlanVersionId: 'mock-plan-version-1',
    selectionDisposition: 'selected',
    compositionTraceRef: {
      id: selectedPlanTrace.traceId,
      version: selectedPlanTrace.schemaVersion,
      contentHash: selectedPlanTrace.traceDigestSha256,
    },
    ownerApprovedRestraintRef: null,
    outputScopes: [{
      outputId: outputFrame.outputId,
      aspectRatio: outputFrame.aspectRatio,
      width: outputFrame.width,
      height: outputFrame.height,
      fpsNumerator: 30,
      fpsDenominator: 1,
      confirmedOutputFrameRef: structuredClone(outputFrame),
    }],
    componentRefs: CAPTION_SPECIALIST_REQUIRED_COMPONENT_KEYS.map(
      (componentKey) => ({
        componentKey,
        componentRef: ref(`caption.component.${componentKey}`),
      })),
    executionBundleRef: ref('caption.execution-bundle.cap17'),
    captionWorkBindingRef: ref('caption.work.cap17'),
    captionRenderQaWorkBindingRef: ref('caption.render-qa-work.cap17'),
    assetManifestRefs: [ref('caption.asset-manifest.cap17')],
    estimateInputRef: ref('caption.estimate-input.cap17'),
    approvedEstimateRef: ref('caption.approved-estimate.cap17'),
    creditReservationRef: ref('caption.credit-reservation.cap17'),
    privateReviewDependencyRef: ref('caption.private-review.cap17'),
    postrenderVisualQaRequestRef: ref('caption.qwen-request.cap17'),
    brollOwnerReadRefs: [ref('caption.broll-owner-read.cap17')],
    exactScopeFrameMasterTimingBound: true,
    componentCoverageComplete: true,
    workCoverageComplete: true,
    manifestEstimateAndQaCoverageComplete: true,
    privateArtifactPolicy: {
      tenantScoped: true,
      createOnly: true,
      byteFreeSerializedRecord: true,
      rawTranscriptIncluded: false,
      mediaBytesIncluded: false,
      pathsOrUrlsIncluded: false,
    },
    approvedSnapshotMutatedAfterApproval: false,
    separateCaptionApprovalCreated: false,
    separateCaptionCreditReservationCreated: false,
    operationDispatchAuthority: false,
    providerRuntimeAuthority: false,
    assetMutationAuthority: false,
    qaApprovalAuthority: false,
    billingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })
}

export function runCap17Smoke(): void {
  check(selectedTrace.entries[0].disposition === 'selected'
    && selectedTrace.entries[0].selectedComponentKeys.join('|')
      === 'caption_design|caption_render_qa',
  'Caption activation must come from the exact two-part composition trace.')
  check(noCaptionSkillPlan.compositionTrace?.entries[0].disposition === 'restrained'
    && noCaptionSkillPlan.compositionTrace.entries[0].restraintKey === 'no_captions'
    && noCaptionSkillPlan.selectedSkills.filter((item) =>
      item.family === 'captions').map((item) => item.skillId).join('|')
      === 'captions.no_caption_policy',
  'Explicit no-caption direction must remove all competing Caption selections.')

  const planningPresentation = createCaptionSpecialistPlanningPresentation(
    selectedSkillPlan)
  check(planningPresentation.phase === 'planning_selected'
    && planningPresentation.onePlanApprovalAndEstimateOnly
    && !planningPresentation.browserLocalCompletionAccepted,
  'The Plan Review card must reuse one approval/estimate and reject local completion.')
  const cardSource = readFileSync(new URL(
    '../../src/components/editor/CaptionSpecialistStatusCard.tsx',
    import.meta.url), 'utf8')
  check(cardSource.includes('presentation.title')
    && cardSource.includes('no separate Caption approval or charge')
    && !cardSource.includes('<Button')
    && !cardSource.includes('<button'),
  'The chat Caption card must be informative without a second action owner.')

  const unresolvedTrace = structuredClone(selectedTrace)
  unresolvedTrace.entries[0] = {
    ...unresolvedTrace.entries[0],
    disposition: 'unresolved',
    selectedComponentKeys: [],
    restraintKey: null,
    sourceSkillIds: [],
    selectionSources: [],
  }
  unresolvedTrace.traceDigestSha256 =
    calculateProfessionalSkillCompositionTraceDigest(unresolvedTrace)
  check(parseProfessionalSkillCompositionTrace(unresolvedTrace)
    .entries[0].disposition === 'unresolved',
  'An unresolved trace must remain explicit and parseable for approval blocking.')
  expectThrow(() => createCaptionSpecialistPlanningPresentation({
    id: 'plan.unresolved.cap17', compositionTrace: unresolvedTrace,
  }))

  check(validateCaptionRenderedVisualReviewAuthenticatedReadRequest(
    authenticatedRequest).ok,
  'Authenticated reread must bind the exact confirmed output frame.')
  const authenticatedRoute = getApiRouteById(
    CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_ROUTE_ID)
  check(authenticatedRoute?.path
    === CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_ROUTE
    && authenticatedRoute.runtimeMode === 'frontend_safe'
    && authenticatedRoute.requiresProviderSecret === false,
  'Edit Chat must use the one authenticated backend read route without provider authority.')
  const statusHookSource = readFileSync(new URL(
    '../../src/hooks/useCaptionSpecialistStatus.ts', import.meta.url), 'utf8')
  check(statusHookSource.includes(
    'readCaptionRenderedVisualReviewAuthenticated')
    && statusHookSource.includes('snapshotExtension')
    && !statusHookSource.includes('localStorage')
    && !statusHookSource.includes('sessionStorage'),
  'Reload status must reread the backend and never persist completion in the browser.')
  const duplicateOutputRequest = structuredClone(authenticatedRequest)
  duplicateOutputRequest.requiredOutputs.push(
    structuredClone(duplicateOutputRequest.requiredOutputs[0]!))
  check(!validateCaptionRenderedVisualReviewAuthenticatedReadRequest(
    duplicateOutputRequest).ok,
  'Duplicate output/frame authority must fail closed.')
  const wrongAspectRequest = structuredClone(authenticatedRequest)
  wrongAspectRequest.requiredOutputs[0]!.confirmedOutputFrameRef.width = 3839
  check(!validateCaptionRenderedVisualReviewAuthenticatedReadRequest(
    wrongAspectRequest).ok,
  'Silently substituted output dimensions must fail closed.')

  const notFound = lifecycleResult('not_found')
  const pending = lifecycleResult('pending')
  const completed = lifecycleResult('completed')
  check(validateCaptionRenderedVisualReviewAuthenticatedReadResult(notFound).ok
    && validateCaptionRenderedVisualReviewAuthenticatedReadResult(pending).ok
    && validateCaptionRenderedVisualReviewAuthenticatedReadResult(completed).ok,
  'Authenticated reload must distinguish not-found, pending, and completed records.')
  check(acceptCaptionRenderedVisualReviewAuthenticatedReadResult(
    authenticatedRequest, completed)?.disposition === 'completed',
  'Only an exact requested output-set reread may be accepted.')

  const browserCompletion = structuredClone(completed)
  browserCompletion.browserLocalStateUsed = true as false
  browserCompletion.projectionRef.contentHash =
    digestCaptionRenderedVisualReviewAuthenticatedReadResult(browserCompletion)
  check(!validateCaptionRenderedVisualReviewAuthenticatedReadResult(
    browserCompletion).ok,
  'Browser-local completion must never satisfy the visual-review gate.')
  const missingEvidence = structuredClone(completed)
  delete missingEvidence.outputSetStatus!.outputs[0]!.status.canonicalEvidenceRefs
  missingEvidence.projectionRef.contentHash =
    digestCaptionRenderedVisualReviewAuthenticatedReadResult(missingEvidence)
  check(!validateCaptionRenderedVisualReviewAuthenticatedReadResult(
    missingEvidence).ok,
  'Completed visual review requires exact canonical evidence references.')

  const extension = snapshotExtension()
  check(extension.componentRefs.length === 15
    && extension.brollOwnerReadRefs.length === 1
    && !extension.separateCaptionApprovalCreated
    && !extension.separateCaptionCreditReservationCreated,
  'Snapshot coverage must include CAP-02 through CAP-16 and reuse shared owners.')
  const approvedSnapshot = createApprovedPlanSnapshot({
    approvedBy: 'user.cap17',
    approvedSnapshotId: scope.approvedSnapshotId,
    captionSpecialistSnapshotExtension: extension,
    editSessionId: scope.editSessionId,
    plan: selectedPlan,
    projectId: scope.projectId,
  })
  check(approvedSnapshot.captionSpecialistSnapshotExtension
    ?.extensionDigestSha256 === extension.extensionDigestSha256,
  'The canonical approved snapshot must freeze the exact Caption extension.')
  expectThrow(() => rebindApprovedPlanSnapshotId(
    approvedSnapshot, 'approved-snapshot.cap17.backend'))

  const staleTraceExtension = structuredClone(extension)
  staleTraceExtension.compositionTraceRef.contentHash = hash('stale-trace')
  staleTraceExtension.extensionDigestSha256 =
    calculateCaptionSpecialistIntegrationDigest(
      staleTraceExtension as unknown as Record<string, unknown>,
      'extensionDigestSha256')
  expectThrow(() => createApprovedPlanSnapshot({
    approvedBy: 'user.cap17',
    approvedSnapshotId: scope.approvedSnapshotId,
    captionSpecialistSnapshotExtension: staleTraceExtension,
    editSessionId: scope.editSessionId,
    plan: selectedPlan,
    projectId: scope.projectId,
  }))
  const missingComponent = structuredClone(extension)
  missingComponent.componentRefs.pop()
  expectThrow(() => parseCaptionSpecialistApprovedSnapshotExtension(
    missingComponent))

  const persistence = createCaptionSpecialistComponentPersistenceReceipt({
    receiptId: 'caption.persistence.cap17',
    approvedSnapshotRef: ref(scope.approvedSnapshotId),
    persistedExtension: extension,
    rereadExtension: structuredClone(extension),
  })
  check(persistence.persistenceOwner
    === 'canonical_approved_plan_snapshot_service'
    && persistence.exactExtensionDigestRereadVerified
    && !persistence.separateCaptionPersistenceOwnerCreated,
  'Caption persistence must use the existing immutable snapshot owner.')
  const crossTenant = structuredClone(extension)
  crossTenant.ownerUserId = 'other.user'
  crossTenant.extensionDigestSha256 =
    calculateCaptionSpecialistIntegrationDigest(
      crossTenant as unknown as Record<string, unknown>,
      'extensionDigestSha256')
  expectThrow(() => createCaptionSpecialistComponentPersistenceReceipt({
    receiptId: 'caption.persistence.cross-tenant',
    approvedSnapshotRef: ref(scope.approvedSnapshotId),
    persistedExtension: extension,
    rereadExtension: crossTenant,
  }))

  const authenticatedPresentation = createCaptionSpecialistAuthenticatedPresentation({
    snapshotExtension: extension,
    authenticatedRead: completed,
  })
  check(authenticatedPresentation.phase === 'caption_scope_passed'
    && authenticatedPresentation.visualReviewState === 'passed'
    && authenticatedPresentation.authenticatedVisualReviewRead
      ?.projectionRef.contentHash === completed.projectionRef.contentHash,
  'Completed Caption UI state must preserve the authenticated projection lineage.')
  check(parseCaptionSpecialistChatPresentation(authenticatedPresentation)
    .phase === 'caption_scope_passed',
  'The authenticated chat presentation must round-trip as a closed contract.')

  const domainScope: CaptionDomainCanonicalScope = {
    ownerUserId: 'user.cap17',
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    planVersionId: 'plan-version.cap17',
    approvedSnapshotRef: ref(scope.approvedSnapshotId),
    outputId: outputFrame.outputId,
    sceneId: 'scene.cap17.1',
    authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 360 }],
  }
  const revision = compileCaptionSpecialistNaturalLanguageRevision({
    requestText: 'Make the captions slightly larger and reduce motion.',
    canonicalScope: domainScope,
    priorSnapshotRef: ref(scope.approvedSnapshotId),
    priorComponentRefs: [ref('caption.component.cap17')],
    affectedSceneIds: ['scene.cap17.1'],
    affectedOutputIds: [outputFrame.outputId],
  })
  check(revision.requestedChanges.join('|')
    === 'increase_caption_size|reduce_motion'
    && revision.requiresFreshPlan
    && revision.requiresFreshEstimateAndApproval
    && revision.requiresFreshPrivateReview
    && !revision.rawRequestPersistedToWorker,
  'Natural-language Caption changes must compile into a fresh approved revision.')
  check(parseCaptionSpecialistNaturalLanguageRevisionIntent(revision)
    .sourceRequestDigestSha256 === hash(
      'Make the captions slightly larger and reduce motion.'),
  'Revision parsing must retain only the source-text digest and safe changes.')
  expectThrow(() => compileCaptionSpecialistNaturalLanguageRevision({
    requestText: 'Enable captions and disable captions.',
    canonicalScope: domainScope,
    priorSnapshotRef: ref(scope.approvedSnapshotId),
    priorComponentRefs: [ref('caption.component.cap17')],
    affectedSceneIds: ['scene.cap17.1'],
    affectedOutputIds: [outputFrame.outputId],
  }))

  const metrics = createCaptionSpecialistObservabilityReceipt({
    receiptId: 'caption.metrics.cap17',
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    approvedSnapshotId: scope.approvedSnapshotId,
    selectionDisposition: 'selected',
    phase: authenticatedPresentation.phase,
    counters: {
      selectedComponentCount: extension.componentRefs.length,
      outputCount: extension.outputScopes.length,
      readySceneCount: 1,
      blockedSceneCount: 0,
      repairItemCount: 0,
      unresolvedExternalGateCount: 0,
    },
    lineageRefs: [ref('caption.metrics.lineage.cap17')],
  })
  check(!metrics.rawUserTextIncluded && !metrics.rawTranscriptIncluded
    && !metrics.rawModelTextIncluded && !metrics.mediaBytesIncluded
    && !metrics.productionMetricPublished,
  'Observability must remain sanitized, private, and non-production.')

  const unknownExtension = {
    ...structuredClone(extension), unknownAuthority: false,
  }
  unknownExtension.extensionDigestSha256 =
    calculateCaptionSpecialistIntegrationDigest(
      unknownExtension as unknown as Record<string, unknown>,
      'extensionDigestSha256')
  expectThrow(() => parseCaptionSpecialistApprovedSnapshotExtension(
    unknownExtension))
  const cyclic = structuredClone(completed) as unknown as Record<string, unknown>
  cyclic.self = cyclic
  check(!validateCaptionRenderedVisualReviewAuthenticatedReadResult(cyclic).ok,
  'Cyclic read-model data must fail closed.')

  console.log(JSON.stringify({
    status: 'passed_with_canonical_authenticated_qwen_writer_external',
    milestone: 'CAP-17',
    assertions,
    compositionTrace: selectedTrace.entries[0].selectedComponentKeys,
    snapshotComponentCount: extension.componentRefs.length,
    authenticatedReadDispositions: [notFound.disposition, pending.disposition,
      completed.disposition],
    browserLocalCompletionAccepted: false,
    separateCaptionApprovalCreated: false,
    separateCaptionCreditReservationCreated: false,
    canonicalQwenWriterImplementedByCaption: false,
    brollOwnerReadExecutionImplementedByCaption: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }, null, 2))
}

runCap17Smoke()
