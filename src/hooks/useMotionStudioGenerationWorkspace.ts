import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ApiResponseEnvelope } from '../backend/api/api-runtime-contracts'
import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import {
  motionStudioGenerationRoutePolicySchema,
  motionStudioGenerationShotSpecV1Schema,
} from '../lib/motion-studio/contracts'
import type {
  MotionStudioGeneratedMediaKind,
  MotionStudioDeterministicRouteAcceptanceDto,
  MotionStudioGenerationBindingDto,
  MotionStudioGenerationCandidateDto,
  MotionStudioGenerationWorkspaceDto,
  MotionStudioLiveCandidateRejectionCategory,
  MotionStudioLiveGenerationWorkspaceDto,
  MotionStudioMediaAssetVersionDto,
  MotionStudioProviderOperationDto,
  MotionStudioSceneArtifactSummaryDto,
  MotionStudioSceneWorkspaceDto,
  MotionStudioVersionReference,
  MotionStudioWorkGraphDto,
  ReviewMotionStudioLiveCandidateRequest,
} from '../types/motion-studio'

export type MotionStudioGenerationResourceState =
  | 'inactive'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'failure'
  | 'permission_denied'
  | 'conflict'

export interface MotionStudioGenerationRequestCandidate {
  documentVersionId: string
  mediaKind: MotionStudioGeneratedMediaKind
}

export interface MotionStudioGenerationWorkspaceViewState {
  state: MotionStudioGenerationResourceState
  operation: 'idle' | 'loading' | 'refreshing' | 'binding'
  workspace?: MotionStudioGenerationWorkspaceDto
  message?: string
  warnings: readonly string[]
}

export interface UseMotionStudioGenerationWorkspaceResult extends MotionStudioGenerationWorkspaceViewState {
  liveState: MotionStudioGenerationResourceState
  liveOperation: 'idle' | 'loading' | 'refreshing' | 'reviewing'
  liveWorkspace?: MotionStudioLiveGenerationWorkspaceDto
  liveMessage?: string
  liveWarnings: readonly string[]
  requestableCandidates: readonly MotionStudioGenerationRequestCandidate[]
  refresh: () => Promise<void>
  createBinding: (document: MotionStudioSceneArtifactSummaryDto) => Promise<boolean>
  reviewLiveCandidate: (
    candidateId: string,
    review: ReviewMotionStudioLiveCandidateRequest,
  ) => Promise<boolean>
}

const inactiveState: MotionStudioGenerationWorkspaceViewState = {
  state: 'inactive', operation: 'idle', warnings: [],
}

interface MotionStudioLiveGenerationViewState {
  liveState: MotionStudioGenerationResourceState
  liveOperation: 'idle' | 'loading' | 'refreshing' | 'reviewing'
  liveWorkspace?: MotionStudioLiveGenerationWorkspaceDto
  liveMessage?: string
  liveWarnings: readonly string[]
}

const inactiveLiveState: MotionStudioLiveGenerationViewState = {
  liveState: 'inactive', liveOperation: 'idle', liveWarnings: [],
}

export function useMotionStudioGenerationWorkspace(
  productionId: string | undefined,
  active: boolean,
  sceneWorkspace?: MotionStudioSceneWorkspaceDto,
  workGraph?: MotionStudioWorkGraphDto,
): UseMotionStudioGenerationWorkspaceResult {
  const [view, setView] = useState<MotionStudioGenerationWorkspaceViewState>(inactiveState)
  const [liveView, setLiveView] = useState<MotionStudioLiveGenerationViewState>(inactiveLiveState)
  const sequence = useRef(0)
  const bindingKeys = useRef(new Map<string, string>())
  const reviewKeys = useRef(new Map<string, string>())

  const load = useCallback(async (refreshing = false) => {
    if (!productionId || !active) {
      setView(inactiveState)
      setLiveView(inactiveLiveState)
      return
    }
    const requestSequence = ++sequence.current
    setView((current) => refreshing && current.workspace
      ? { ...current, operation: 'refreshing', message: undefined }
      : { state: 'loading', operation: 'loading', warnings: [] })
    setLiveView((current) => refreshing && current.liveWorkspace
      ? { ...current, liveOperation: 'refreshing', liveMessage: undefined }
      : { liveState: 'loading', liveOperation: 'loading', liveWarnings: [] })
    const [response, liveResponse] = await Promise.all([
      motionStudioApiClient.getGenerationWorkspace(productionId),
      motionStudioApiClient.getLiveGenerationWorkspace(productionId),
    ])
    if (requestSequence !== sequence.current) return
    commitResponse(response, productionId, setView)
    commitLiveResponse(liveResponse, productionId, setLiveView)
  }, [active, productionId])

  useEffect(() => {
    const timer = globalThis.setTimeout(() => { void load() }, 0)
    return () => {
      globalThis.clearTimeout(timer)
      sequence.current += 1
    }
  }, [load])

  const createBinding = useCallback(async (document: MotionStudioSceneArtifactSummaryDto) => {
    if (!productionId || !active || !sceneWorkspace || !workGraph) return false
    const authority = findGenerationAuthority(document, sceneWorkspace, workGraph, view.workspace)
    if (!authority) {
      setView((current) => ({
        ...current,
        message: 'Generated-media review is not ready. Approve this exact generative SceneDocument, compile its one image or generated-video proposal, and wait for the approved simulator worker to hold a running job.',
      }))
      return false
    }
    const replayIdentity = `${document.version.versionId}:${authority.proposalId}:${authority.jobId}:${authority.mediaKind}`
    const idempotencyKey = bindingKeys.current.get(replayIdentity) ?? clientKey('generation-binding', productionId)
    bindingKeys.current.set(replayIdentity, idempotencyKey)
    const requestSequence = ++sequence.current
    setView((current) => ({ ...current, operation: 'binding', message: undefined }))
    const response = await motionStudioApiClient.createGenerationBinding(productionId, {
      approvedSnapshotId: authority.approvedSnapshotId,
      sceneDocumentArtifactId: document.artifactId,
      sceneDocumentVersionId: document.version.versionId,
      sceneDocumentContentDigest: document.version.contentDigest,
      timelineProposalId: authority.proposalId,
      jobId: authority.jobId,
      mediaKind: authority.mediaKind,
    }, idempotencyKey)
    if (requestSequence !== sequence.current) return false
    if (!response.ok) {
      setView((current) => ({
        ...current,
        operation: 'idle',
        message: response.error?.message ?? 'The exact generated-media binding could not be created.',
        warnings: [...current.warnings, ...response.warnings],
      }))
      return false
    }
    const workspace = projectGenerationWorkspace(response.data?.generationWorkspace, productionId)
    if (!workspace) {
      setView((current) => ({
        ...current,
        operation: 'idle',
        message: 'The backend returned generated-media authority outside this production or its safe browser contract.',
      }))
      return false
    }
    bindingKeys.current.delete(replayIdentity)
    setView({
      state: workspaceState(workspace), operation: 'idle', workspace,
      message: 'Exact local simulator authority is bound. A private worker—not this browser—may execute the existing approved job.',
      warnings: response.warnings,
    })
    return true
  }, [active, productionId, sceneWorkspace, view.workspace, workGraph])

  const requestableCandidates = useMemo(() => {
    if (!sceneWorkspace || !workGraph) return []
    const usedJobs = new Set(view.workspace?.bindings.map((binding) => binding.jobId) ?? [])
    const candidates: MotionStudioGenerationRequestCandidate[] = []
    for (const document of sceneWorkspace.artifacts.filter((artifact) => artifact.kind === 'scene_document')) {
      const authority = findGenerationAuthority(document, sceneWorkspace, workGraph, view.workspace, usedJobs)
      if (!authority) continue
      usedJobs.add(authority.jobId)
      candidates.push({ documentVersionId: document.version.versionId, mediaKind: authority.mediaKind })
    }
    return candidates
  }, [sceneWorkspace, view.workspace, workGraph])

  const reviewLiveCandidate = useCallback(async (
    candidateId: string,
    review: ReviewMotionStudioLiveCandidateRequest,
  ) => {
    if (!productionId || !active || !liveView.liveWorkspace) return false
    const replayIdentity = `${candidateId}:${JSON.stringify(review)}`
    const idempotencyKey = reviewKeys.current.get(replayIdentity) ?? clientKey('live-candidate-review', productionId)
    reviewKeys.current.set(replayIdentity, idempotencyKey)
    const requestSequence = ++sequence.current
    setLiveView((current) => ({ ...current, liveOperation: 'reviewing', liveMessage: undefined }))
    const response = await motionStudioApiClient.reviewLiveCandidate(candidateId, review, idempotencyKey)
    if (requestSequence !== sequence.current) return false
    if (!response.ok) {
      setLiveView((current) => ({
        ...current,
        liveOperation: 'idle',
        liveMessage: response.error?.message ?? 'The exact human review could not be recorded.',
        liveWarnings: [...current.liveWarnings, ...response.warnings],
      }))
      return false
    }
    const workspace = projectLiveGenerationWorkspace(response.data?.liveGenerationWorkspace, productionId)
    if (!workspace || response.data?.automaticFallbackSubmitted !== false) {
      setLiveView((current) => ({
        ...current,
        liveOperation: 'idle',
        liveMessage: 'The backend returned live generation evidence outside the safe browser contract.',
      }))
      return false
    }
    reviewKeys.current.delete(replayIdentity)
    setLiveView({
      liveState: liveWorkspaceState(workspace),
      liveOperation: 'idle',
      liveWorkspace: workspace,
      liveMessage: review.decision === 'approved'
        ? 'The exact candidate is approved as a private project asset. It is not a final export.'
        : workspace.operations.some((operation) => operation.fallbackState === 'eligible_manual')
          ? 'The candidate is rejected. One conditional alternate is eligible, but no submission was started.'
          : 'The candidate is rejected and no automatic retry or alternate submission was started.',
      liveWarnings: response.warnings,
    })
    return true
  }, [active, liveView.liveWorkspace, productionId])

  return {
    ...view,
    ...liveView,
    requestableCandidates,
    refresh: async () => load(true),
    createBinding,
    reviewLiveCandidate,
  }
}

function findGenerationAuthority(
  document: MotionStudioSceneArtifactSummaryDto,
  sceneWorkspace: MotionStudioSceneWorkspaceDto,
  workGraph: MotionStudioWorkGraphDto,
  generationWorkspace?: MotionStudioGenerationWorkspaceDto,
  additionallyUsedJobs = new Set<string>(),
): {
  approvedSnapshotId: string
  proposalId: string
  jobId: string
  mediaKind: MotionStudioGeneratedMediaKind
} | undefined {
  const snapshot = sceneWorkspace.latestApprovedSnapshot
  if (
    !snapshot || workGraph.approvedSnapshotId !== snapshot.id ||
    !['approved', 'locked'].includes(document.state) || document.kind !== 'scene_document'
  ) return undefined
  if (generationWorkspace?.bindings.some((binding) =>
    binding.sceneDocument.versionId === document.version.versionId)) return undefined
  const proposal = sceneWorkspace.proposals.find((candidate) =>
    candidate.approvedSnapshotId === snapshot.id &&
    candidate.sourceSceneDocument.artifactId === document.artifactId &&
    candidate.sourceSceneDocument.versionId === document.version.versionId &&
    candidate.sourceSceneDocument.contentDigest === document.version.contentDigest &&
    candidate.operations.length === 1)
  const layerType = proposal?.operations[0]?.layer.layerType
  const mediaKind = layerType === 'image'
    ? 'still_image'
    : layerType === 'generated_video' ? 'video_clip' : undefined
  if (!proposal || !mediaKind) return undefined
  const workItemType = mediaKind === 'still_image'
    ? 'generate_motion_studio_still_fixture'
    : 'generate_motion_studio_video_fixture'
  const boundJobIds = new Set(generationWorkspace?.bindings.map((binding) => binding.jobId) ?? [])
  const job = workGraph.jobs.find((candidate) =>
    candidate.approvedSnapshotId === snapshot.id &&
    candidate.workItemType === workItemType &&
    candidate.status === 'running' &&
    candidate.currentAttempt?.status === 'running' &&
    candidate.currentAttempt.lease?.status === 'active' &&
    !boundJobIds.has(candidate.id) &&
    !additionallyUsedJobs.has(candidate.id))
  return job ? { approvedSnapshotId: snapshot.id, proposalId: proposal.id, jobId: job.id, mediaKind } : undefined
}

function commitResponse(
  response: ApiResponseEnvelope<{ generationWorkspace: MotionStudioGenerationWorkspaceDto }>,
  productionId: string,
  setView: (state: MotionStudioGenerationWorkspaceViewState) => void,
): void {
  if (!response.ok) {
    setView({
      state: response.statusCode === 403 ? 'permission_denied' : response.statusCode === 409 ? 'conflict' : 'failure',
      operation: 'idle',
      message: response.error?.message ?? 'Generated-media authority could not be loaded.',
      warnings: response.warnings,
    })
    return
  }
  const workspace = projectGenerationWorkspace(response.data?.generationWorkspace, productionId)
  if (!workspace) {
    setView({
      state: 'failure', operation: 'idle',
      message: 'The backend returned generated-media authority outside this production or its safe browser contract.',
      warnings: response.warnings,
    })
    return
  }
  setView({ state: workspaceState(workspace), operation: 'idle', workspace, warnings: response.warnings })
}

function commitLiveResponse(
  response: ApiResponseEnvelope<{ liveGenerationWorkspace: MotionStudioLiveGenerationWorkspaceDto }>,
  productionId: string,
  setView: (state: MotionStudioLiveGenerationViewState) => void,
): void {
  if (!response.ok) {
    setView({
      liveState: response.statusCode === 403 ? 'permission_denied' : response.statusCode === 409 ? 'conflict' : 'failure',
      liveOperation: 'idle',
      liveMessage: response.error?.message ?? 'Real provider evidence could not be loaded.',
      liveWarnings: response.warnings,
    })
    return
  }
  const workspace = projectLiveGenerationWorkspace(response.data?.liveGenerationWorkspace, productionId)
  if (!workspace) {
    setView({
      liveState: 'failure',
      liveOperation: 'idle',
      liveMessage: 'The backend returned real provider evidence outside the safe browser contract.',
      liveWarnings: response.warnings,
    })
    return
  }
  setView({
    liveState: liveWorkspaceState(workspace),
    liveOperation: 'idle',
    liveWorkspace: workspace,
    liveWarnings: response.warnings,
  })
}

function projectLiveGenerationWorkspace(
  value: unknown,
  productionId: string,
): MotionStudioLiveGenerationWorkspaceDto | undefined {
  if (containsUnsafeProjectionKey(value)) return undefined
  const candidate = plainRecord(value)
  if (
    !candidate || candidate.productionId !== productionId ||
    candidate.evidenceClass !== 'real_provider' ||
    candidate.persistenceClass !== 'local_canonical_evidence' ||
    candidate.realProviderEvidence !== true || candidate.simulatorOnly !== false ||
    candidate.browserProviderTransportAllowed !== false || candidate.internalCostExposed !== false ||
    !Array.isArray(candidate.operations) || candidate.operations.length > 4
  ) return undefined
  const operations = candidate.operations.map(projectLiveOperation)
  if (operations.some((operation) => !operation)) return undefined
  const projected = operations as MotionStudioLiveGenerationWorkspaceDto['operations']
  if (new Set(projected.map((operation) => operation.operationKind)).size !== projected.length) return undefined
  const deterministicReplacement = candidate.deterministicReplacement === undefined
    ? undefined
    : projectDeterministicRouteAcceptance(candidate.deterministicReplacement)
  if (candidate.deterministicReplacement !== undefined && !deterministicReplacement) return undefined
  return {
    productionId,
    evidenceClass: 'real_provider',
    persistenceClass: 'local_canonical_evidence',
    operations: projected,
    realProviderEvidence: true,
    simulatorOnly: false,
    browserProviderTransportAllowed: false,
    internalCostExposed: false,
    ...(deterministicReplacement ? { deterministicReplacement } : {}),
  }
}

function projectDeterministicRouteAcceptance(
  value: unknown,
): MotionStudioDeterministicRouteAcceptanceDto | undefined {
  const candidate = plainRecord(value)
  const media = projectLiveMedia(value, 'wan_image_to_video')
  if (
    !candidate || !media || media.mediaKind !== 'video_clip' || media.mimeType !== 'video/mp4' ||
    media.review?.decision !== 'approved' || !media.finalAssetEligible ||
    candidate.routeProfileId !== 'motion_studio_deterministic_route_draw_v1' ||
    candidate.routePresetId !== 'abstract_three_district_route_v1' ||
    candidate.replacementKind !== 'gpt_image_then_remotion' ||
    !Array.isArray(candidate.replacedWorkItemKeys) || candidate.replacedWorkItemKeys.length !== 2 ||
    candidate.replacedWorkItemKeys.some((key) => !isStableId(key)) ||
    candidate.providerSubmissionMade !== false || candidate.newProviderCostIncurred !== false ||
    candidate.baseSnapshotMutated !== false || candidate.baseWorkItemsMutated !== false ||
    !isIsoTimestamp(candidate.acceptedAt)
  ) return undefined
  return {
    ...media,
    routeProfileId: 'motion_studio_deterministic_route_draw_v1',
    routePresetId: 'abstract_three_district_route_v1',
    replacementKind: 'gpt_image_then_remotion',
    replacedWorkItemKeys: candidate.replacedWorkItemKeys as string[],
    providerSubmissionMade: false,
    newProviderCostIncurred: false,
    baseSnapshotMutated: false,
    baseWorkItemsMutated: false,
    acceptedAt: candidate.acceptedAt,
  }
}

function projectLiveOperation(
  value: unknown,
): MotionStudioLiveGenerationWorkspaceDto['operations'][number] | undefined {
  const candidate = plainRecord(value)
  if (
    !candidate || !liveOperationKinds.has(String(candidate.operationKind)) ||
    !liveOperationStates.has(String(candidate.state)) ||
    ![0, 1].includes(Number(candidate.callCount)) ||
    candidate.reconciliationRequired !== (candidate.state === 'outcome_unknown') ||
    typeof candidate.manualActionRequired !== 'boolean' || typeof candidate.updatedAt !== 'string' ||
    !liveFallbackStates.has(String(candidate.fallbackState))
  ) return undefined
  const operationKind = candidate.operationKind as MotionStudioLiveGenerationWorkspaceDto['operations'][number]['operationKind']
  const media = candidate.candidate === undefined ? undefined : projectLiveMedia(candidate.candidate, operationKind)
  if (candidate.candidate !== undefined && !media) return undefined
  if (candidate.state === 'approved' && (!media?.review || media.review.decision !== 'approved' || !media.finalAssetEligible)) return undefined
  if (candidate.state === 'qa_rejected' && (!media?.review || media.review.decision !== 'rejected' || media.finalAssetEligible)) return undefined
  if (operationKind === 'wan_image_to_video' && media?.review?.decision === 'approved' && candidate.fallbackState !== 'not_used') return undefined
  if (
    !['wan_image_to_video', 'hailuo_image_to_video_fallback'].includes(operationKind) &&
    candidate.fallbackState !== 'not_applicable'
  ) return undefined
  return {
    operationKind,
    state: candidate.state as MotionStudioLiveGenerationWorkspaceDto['operations'][number]['state'],
    callCount: Number(candidate.callCount) as 0 | 1,
    reconciliationRequired: candidate.reconciliationRequired,
    manualActionRequired: candidate.manualActionRequired,
    updatedAt: candidate.updatedAt,
    ...(media ? { candidate: media } : {}),
    fallbackState: candidate.fallbackState as MotionStudioLiveGenerationWorkspaceDto['operations'][number]['fallbackState'],
  }
}

function projectLiveMedia(
  value: unknown,
  operationKind: MotionStudioLiveGenerationWorkspaceDto['operations'][number]['operationKind'],
): NonNullable<MotionStudioLiveGenerationWorkspaceDto['operations'][number]['candidate']> | undefined {
  const candidate = plainRecord(value)
  const isStill = operationKind === 'gpt_image_generation' || operationKind === 'gpt_image_edit'
  if (
    !candidate || !isUuid(candidate.candidateId) || !isUuid(candidate.assetVersionId) ||
    candidate.mediaKind !== (isStill ? 'still_image' : 'video_clip') ||
    candidate.mimeType !== (isStill ? 'image/png' : 'video/mp4') || !isDigest(candidate.sha256) ||
    !Number.isSafeInteger(candidate.byteLength) || Number(candidate.byteLength) < 67 ||
    Number(candidate.byteLength) > 100 * 1024 * 1024 ||
    !Number.isSafeInteger(candidate.width) || Number(candidate.width) < 1 || Number(candidate.width) > 3840 ||
    !Number.isSafeInteger(candidate.height) || Number(candidate.height) < 1 || Number(candidate.height) > 3840 ||
    candidate.technicalQaStatus !== 'passed' || !isDigest(candidate.technicalQaEvidenceDigest) ||
    !['passed', 'review_required'].includes(String(candidate.automatedSafetyStatus)) ||
    typeof candidate.finalAssetEligible !== 'boolean' ||
    candidate.privateProjectAsset !== true
  ) return undefined
  if (isStill && [candidate.durationFrames, candidate.fpsNumerator, candidate.fpsDenominator].some((field) => field !== undefined)) return undefined
  if (!isStill && (
    !Number.isSafeInteger(candidate.durationFrames) || Number(candidate.durationFrames) < 1 ||
    !Number.isSafeInteger(candidate.fpsNumerator) || ![24, 30, 60].includes(Number(candidate.fpsNumerator)) ||
    candidate.fpsDenominator !== 1
  )) return undefined
  const review = candidate.review === undefined ? undefined : projectLiveReview(candidate.review)
  if (candidate.review !== undefined && !review) return undefined
  if (candidate.finalAssetEligible !== (review?.decision === 'approved')) return undefined
  return {
    candidateId: candidate.candidateId,
    assetVersionId: candidate.assetVersionId,
    mediaKind: isStill ? 'still_image' : 'video_clip',
    mimeType: isStill ? 'image/png' : 'video/mp4',
    sha256: candidate.sha256,
    byteLength: Number(candidate.byteLength),
    width: Number(candidate.width),
    height: Number(candidate.height),
    ...(!isStill ? {
      durationFrames: Number(candidate.durationFrames),
      fpsNumerator: Number(candidate.fpsNumerator),
      fpsDenominator: 1,
    } : {}),
    technicalQaStatus: 'passed',
    technicalQaEvidenceDigest: candidate.technicalQaEvidenceDigest,
    automatedSafetyStatus: candidate.automatedSafetyStatus as 'passed' | 'review_required',
    ...(review ? { review } : {}),
    finalAssetEligible: candidate.finalAssetEligible,
    privateProjectAsset: true,
  }
}

function projectLiveReview(
  value: unknown,
): NonNullable<MotionStudioLiveGenerationWorkspaceDto['operations'][number]['candidate']>['review'] | undefined {
  const candidate = plainRecord(value)
  if (
    !candidate || !['approved', 'rejected'].includes(String(candidate.decision)) ||
    typeof candidate.reviewedAt !== 'string' ||
    (candidate.decision === 'approved' && candidate.rejectionCategory !== undefined) ||
    (candidate.decision === 'rejected' && !liveRejectionCategories.has(String(candidate.rejectionCategory)))
  ) return undefined
  return {
    decision: candidate.decision as 'approved' | 'rejected',
    ...(typeof candidate.rejectionCategory === 'string'
      ? { rejectionCategory: candidate.rejectionCategory as MotionStudioLiveCandidateRejectionCategory }
      : {}),
    reviewedAt: candidate.reviewedAt,
  }
}

function projectGenerationWorkspace(value: unknown, productionId: string): MotionStudioGenerationWorkspaceDto | undefined {
  if (containsUnsafeProjectionKey(value)) return undefined
  const candidate = plainRecord(value)
  if (
    !candidate || candidate.productionId !== productionId ||
    candidate.realProviderExecutionAuthorized !== false || candidate.localCandidateOnly !== true ||
    !Array.isArray(candidate.bindings)
  ) return undefined
  const bindings = candidate.bindings.map((binding) => projectBinding(binding, productionId))
  if (bindings.some((binding) => !binding)) return undefined
  return {
    productionId,
    bindings: bindings as MotionStudioGenerationBindingDto[],
    realProviderExecutionAuthorized: false,
    localCandidateOnly: true,
  }
}

function projectBinding(value: unknown, productionId: string): MotionStudioGenerationBindingDto | undefined {
  const candidate = plainRecord(value)
  const sceneDocument = projectVersion(candidate?.sceneDocument)
  const shotSpecResult = motionStudioGenerationShotSpecV1Schema.safeParse(candidate?.shotSpec)
  const routePolicyResult = motionStudioGenerationRoutePolicySchema.safeParse(candidate?.routePolicy)
  if (
    !candidate || !isUuid(candidate.id) || candidate.productionId !== productionId ||
    !isUuid(candidate.approvedSnapshotId) || !sceneDocument || !isUuid(candidate.timelineProposalId) ||
    !isDigest(candidate.timelineProposalOutputDigest) || !isStableId(candidate.jobId) ||
    !jobStatuses.has(String(candidate.jobStatus)) || !mediaKinds.has(String(candidate.mediaKind)) ||
    !shotSpecResult.success || !isDigest(candidate.shotSpecDigest) || !routePolicyResult.success ||
    !isDigest(candidate.routePolicyDigest) || typeof candidate.createdAt !== 'string' ||
    candidate.protocolSimulatorOnly !== true || candidate.localCandidateOnly !== true
  ) return undefined
  const mediaKind = candidate.mediaKind as MotionStudioGeneratedMediaKind
  if (
    shotSpecResult.data.productionId !== productionId ||
    shotSpecResult.data.approvedSnapshotId !== candidate.approvedSnapshotId ||
    shotSpecResult.data.mediaKind !== mediaKind || routePolicyResult.data.mediaKind !== mediaKind
  ) return undefined
  const providerOperation = candidate.providerOperation === undefined
    ? undefined
    : projectProviderOperation(candidate.providerOperation, candidate.id, candidate.jobId, mediaKind)
  if (candidate.providerOperation !== undefined && !providerOperation) return undefined
  const generatedCandidate = candidate.candidate === undefined
    ? undefined
    : projectCandidate(candidate.candidate, candidate.id, providerOperation, shotSpecResult.data)
  if (candidate.candidate !== undefined && !generatedCandidate) return undefined
  const fallback = candidate.fallbackRecommendation === undefined
    ? undefined
    : projectFallback(candidate.fallbackRecommendation, mediaKind)
  if (candidate.fallbackRecommendation !== undefined && !fallback) return undefined
  return {
    id: candidate.id,
    productionId,
    approvedSnapshotId: candidate.approvedSnapshotId,
    sceneDocument,
    timelineProposalId: candidate.timelineProposalId,
    timelineProposalOutputDigest: candidate.timelineProposalOutputDigest,
    jobId: candidate.jobId,
    jobStatus: candidate.jobStatus as MotionStudioGenerationBindingDto['jobStatus'],
    mediaKind,
    shotSpec: shotSpecResult.data,
    shotSpecDigest: candidate.shotSpecDigest,
    routePolicy: routePolicyResult.data,
    routePolicyDigest: candidate.routePolicyDigest,
    ...(typeof candidate.failureCategory === 'string' && isSafeLabel(candidate.failureCategory, 200)
      ? { failureCategory: candidate.failureCategory }
      : {}),
    ...(providerOperation ? { providerOperation } : {}),
    ...(generatedCandidate ? { candidate: generatedCandidate } : {}),
    ...(fallback ? { fallbackRecommendation: fallback } : {}),
    createdAt: candidate.createdAt,
    protocolSimulatorOnly: true,
    localCandidateOnly: true,
  }
}

function projectProviderOperation(
  value: unknown,
  bindingId: string,
  jobId: string,
  mediaKind: MotionStudioGeneratedMediaKind,
): MotionStudioProviderOperationDto | undefined {
  const candidate = plainRecord(value)
  const allowedRoutes = mediaKind === 'still_image'
    ? new Set(['gpt_image_2'])
    : new Set(['gemini_omni_flash', 'wan', 'hailuo', 'veo'])
  if (
    !candidate || !isUuid(candidate.id) || candidate.bindingId !== bindingId || candidate.jobId !== jobId ||
    !isStableId(candidate.attemptId) || !allowedRoutes.has(String(candidate.providerRoute)) ||
    candidate.providerAdapterId !== 'motion_studio_protocol_simulator_v1' ||
    !isSafeLabel(candidate.providerModelVersion, 160) || candidate.executionClass !== 'protocol_simulator' ||
    !providerStatuses.has(String(candidate.status)) || !isDigest(candidate.requestDigest) ||
    !Number.isSafeInteger(candidate.pollCount) || Number(candidate.pollCount) < 0 || Number(candidate.pollCount) > 100 ||
    !Number.isSafeInteger(candidate.signatureVerifiedEventCount) || Number(candidate.signatureVerifiedEventCount) < 0 ||
    Number(candidate.signatureVerifiedEventCount) > 100 || candidate.providerCostIncurred !== false ||
    typeof candidate.createdAt !== 'string' || typeof candidate.updatedAt !== 'string' ||
    (candidate.lastEventType !== undefined && !isSafeLabel(candidate.lastEventType, 100)) ||
    (candidate.lastEventAt !== undefined && typeof candidate.lastEventAt !== 'string')
  ) return undefined
  return {
    id: candidate.id,
    bindingId,
    jobId,
    attemptId: candidate.attemptId,
    providerRoute: candidate.providerRoute as MotionStudioProviderOperationDto['providerRoute'],
    providerAdapterId: 'motion_studio_protocol_simulator_v1',
    providerModelVersion: candidate.providerModelVersion,
    executionClass: 'protocol_simulator',
    status: candidate.status as MotionStudioProviderOperationDto['status'],
    requestDigest: candidate.requestDigest,
    ...(typeof candidate.lastEventType === 'string' ? { lastEventType: candidate.lastEventType } : {}),
    ...(typeof candidate.lastEventAt === 'string' ? { lastEventAt: candidate.lastEventAt } : {}),
    pollCount: Number(candidate.pollCount),
    signatureVerifiedEventCount: Number(candidate.signatureVerifiedEventCount),
    providerCostIncurred: false,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  }
}

function projectCandidate(
  value: unknown,
  bindingId: string,
  providerOperation: MotionStudioProviderOperationDto | undefined,
  shotSpec: MotionStudioGenerationBindingDto['shotSpec'],
): MotionStudioGenerationCandidateDto | undefined {
  const candidate = plainRecord(value)
  if (
    !candidate || !providerOperation || !isUuid(candidate.id) || candidate.bindingId !== bindingId ||
    candidate.providerOperationId !== providerOperation.id || !isDigest(candidate.qaEvidenceDigest) ||
    !safetyStatuses.has(String(candidate.safetyStatus)) || !reviewStatuses.has(String(candidate.reviewStatus)) ||
    candidate.referenceAdherenceMeasured !== false || candidate.visualQualityMeasured !== false ||
    candidate.finalAssetEligible !== false || candidate.protocolSimulatorOnly !== true ||
    typeof candidate.createdAt !== 'string'
  ) return undefined
  const media = projectMedia(candidate.media, shotSpec)
  if (!media) return undefined
  return {
    id: candidate.id,
    bindingId,
    providerOperationId: providerOperation.id,
    media,
    qaEvidenceDigest: candidate.qaEvidenceDigest,
    safetyStatus: candidate.safetyStatus as MotionStudioGenerationCandidateDto['safetyStatus'],
    reviewStatus: candidate.reviewStatus as MotionStudioGenerationCandidateDto['reviewStatus'],
    referenceAdherenceMeasured: false,
    visualQualityMeasured: false,
    finalAssetEligible: false,
    protocolSimulatorOnly: true,
    createdAt: candidate.createdAt,
  }
}

function projectMedia(
  value: unknown,
  shotSpec: MotionStudioGenerationBindingDto['shotSpec'],
): MotionStudioMediaAssetVersionDto | undefined {
  const candidate = plainRecord(value)
  const isStill = shotSpec.mediaKind === 'still_image'
  if (
    !candidate || !isUuid(candidate.assetId) || !isUuid(candidate.assetVersionId) ||
    !Number.isSafeInteger(candidate.versionNumber) || Number(candidate.versionNumber) < 1 ||
    candidate.mediaKind !== shotSpec.mediaKind || candidate.mimeType !== (isStill ? 'image/png' : 'video/mp4') ||
    !isDigest(candidate.sha256) || !Number.isSafeInteger(candidate.byteLength) || Number(candidate.byteLength) < 64 ||
    Number(candidate.byteLength) > 64 * 1024 * 1024 || candidate.width !== shotSpec.timingAuthority.width ||
    candidate.height !== shotSpec.timingAuthority.height || candidate.qaStatus !== 'passed' ||
    candidate.finalAssetEligible !== false || candidate.protocolSimulatorOnly !== true || typeof candidate.createdAt !== 'string'
  ) return undefined
  const expectedFrames = shotSpec.sceneRange.endFrame - shotSpec.sceneRange.startFrame
  if (!isStill && (
    !Number.isSafeInteger(candidate.durationFrames) || Number(candidate.durationFrames) !== expectedFrames ||
    candidate.frameRate !== shotSpec.timingAuthority.frameRate
  )) return undefined
  if (isStill && (candidate.durationFrames !== undefined || candidate.frameRate !== undefined)) return undefined
  return {
    assetId: candidate.assetId,
    assetVersionId: candidate.assetVersionId,
    versionNumber: Number(candidate.versionNumber),
    mediaKind: shotSpec.mediaKind,
    mimeType: candidate.mimeType as MotionStudioMediaAssetVersionDto['mimeType'],
    sha256: candidate.sha256,
    byteLength: Number(candidate.byteLength),
    width: Number(candidate.width),
    height: Number(candidate.height),
    ...(!isStill ? { durationFrames: Number(candidate.durationFrames), frameRate: Number(candidate.frameRate) } : {}),
    qaStatus: 'passed',
    finalAssetEligible: false,
    protocolSimulatorOnly: true,
    createdAt: candidate.createdAt,
  }
}

function projectFallback(value: unknown, mediaKind: MotionStudioGeneratedMediaKind) {
  const candidate = plainRecord(value)
  const allowed = mediaKind === 'still_image'
    ? new Set(['gpt_image_2'])
    : new Set(['gemini_omni_flash', 'wan', 'hailuo', 'veo'])
  if (
    !candidate || !allowed.has(String(candidate.providerRoute)) || !isSafeLabel(candidate.reason, 500) ||
    candidate.newApprovalRequired !== true
  ) return undefined
  return {
    providerRoute: candidate.providerRoute as MotionStudioGenerationBindingDto['routePolicy']['candidates'][number]['providerRoute'],
    reason: candidate.reason,
    newApprovalRequired: true as const,
  }
}

function projectVersion(value: unknown): MotionStudioVersionReference | undefined {
  const candidate = plainRecord(value)
  if (!candidate || !isUuid(candidate.artifactId) || !isUuid(candidate.versionId)) return undefined
  if (!Number.isSafeInteger(candidate.versionNumber) || Number(candidate.versionNumber) < 1 || !isDigest(candidate.contentDigest)) return undefined
  return {
    artifactId: candidate.artifactId,
    versionId: candidate.versionId,
    versionNumber: Number(candidate.versionNumber),
    contentDigest: candidate.contentDigest,
  }
}

const jobStatuses = new Set(['waiting', 'queued', 'claimed', 'running', 'cancel_requested', 'reconciliation_required', 'blocked', 'succeeded', 'failed', 'cancelled'])
const providerStatuses = new Set(['created', 'submitted', 'processing', 'reconciliation_required', 'completed', 'failed', 'cancelled'])
const mediaKinds = new Set(['still_image', 'video_clip'])
const safetyStatuses = new Set(['passed', 'review_required', 'rejected'])
const reviewStatuses = new Set(['review_needed', 'rejected'])
const liveOperationKinds = new Set([
  'gpt_image_generation', 'gpt_image_edit', 'wan_image_to_video', 'hailuo_image_to_video_fallback',
])
const liveOperationStates = new Set([
  'waiting', 'blocked', 'created', 'permit_issued', 'transport_consumed', 'submitted', 'processing',
  'outcome_unknown', 'completed', 'failed', 'qa_rejected', 'approved', 'cancelled',
])
const liveFallbackStates = new Set(['not_applicable', 'locked', 'eligible_manual', 'invoked', 'not_used'])
const liveRejectionCategories = new Set([
  'reference_adherence', 'continuity', 'visual_artifact', 'intent_alignment', 'safety',
])
const unsafeKeys = new Set([
  'internalcost', 'customerprice', 'customercredits', 'reeditprofee', 'wallet', 'billing',
  'leasecredential', 'credentialhash', 'privateobjectidentity', 'privateobjectpath', 'signedurl',
  'callbackurl', 'sourcebytes', 'rawpayload', 'providersecret', 'providerapikey', 'apikey', 'clientsecret',
])

function containsUnsafeProjectionKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(containsUnsafeProjectionKey)
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    return unsafeKeys.has(normalized) || normalized.endsWith('apikey') || normalized.endsWith('clientsecret') || containsUnsafeProjectionKey(child)
  })
}

function plainRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isDigest(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 200 && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value) && !value.includes('..')
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return false
  return new Date(value).toISOString() === value
}

function isSafeLabel(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum &&
    !/(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/i.test(value)
}

function workspaceState(workspace: MotionStudioGenerationWorkspaceDto): 'ready' | 'empty' {
  return workspace.bindings.length ? 'ready' : 'empty'
}

function liveWorkspaceState(workspace: MotionStudioLiveGenerationWorkspaceDto): 'ready' | 'empty' {
  return workspace.operations.length || workspace.deterministicReplacement ? 'ready' : 'empty'
}

function clientKey(operation: string, productionId: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `motion-studio:${operation}:${productionId}:${random}`
}
