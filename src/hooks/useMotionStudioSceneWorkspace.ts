import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import type { ApiResponseEnvelope } from '../backend/api/api-runtime-contracts'
import { storytellingSceneContinuityReviewDtoSchema } from '../lib/motion-studio/contracts'
import type {
  CreateMotionStudioSceneDraftRequest,
  MotionStudioPreviewWorkspaceDto,
  MotionStudioSceneArtifactSummaryDto,
  MotionStudioSceneWorkspaceDto,
  MotionStudioTimelineProposalDto,
  MotionStudioVersionReference,
  MotionStudioWorkGraphDto,
} from '../types/motion-studio'
import type { JSONObject } from '../types/shared'

export type MotionStudioSceneResourceState =
  | 'inactive'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'failure'
  | 'permission_denied'
  | 'conflict'

export interface MotionStudioSceneWorkspaceViewState {
  state: MotionStudioSceneResourceState
  operation: 'idle' | 'loading' | 'refreshing' | 'creating' | 'compiling' | 'binding_preview'
  workspace?: MotionStudioSceneWorkspaceDto
  previewWorkspace?: MotionStudioPreviewWorkspaceDto
  previewMessage?: string
  message?: string
  warnings: readonly string[]
}

export interface UseMotionStudioSceneWorkspaceResult extends MotionStudioSceneWorkspaceViewState {
  requestablePreviewVersionIds: readonly string[]
  refresh: () => Promise<void>
  createScene: (request: CreateMotionStudioSceneDraftRequest) => Promise<boolean>
  compileSceneDocument: (artifactId: string, versionId: string, contentDigest: string) => Promise<boolean>
  requestPreview: (document: MotionStudioSceneArtifactSummaryDto) => Promise<boolean>
}

const inactiveState: MotionStudioSceneWorkspaceViewState = {
  state: 'inactive', operation: 'idle', warnings: [],
}

export function useMotionStudioSceneWorkspace(
  productionId: string | undefined,
  active: boolean,
  workGraph?: MotionStudioWorkGraphDto,
): UseMotionStudioSceneWorkspaceResult {
  const [view, setView] = useState<MotionStudioSceneWorkspaceViewState>(inactiveState)
  const sequence = useRef(0)
  const sceneReplay = useRef<{ request: string; key: string } | undefined>(undefined)
  const proposalReplay = useRef(new Map<string, string>())

  const load = useCallback(async (refreshing = false) => {
    if (!productionId || !active) {
      setView(inactiveState)
      return
    }
    const requestSequence = ++sequence.current
    setView((current) => refreshing && current.workspace
      ? { ...current, operation: 'refreshing', message: undefined }
      : { state: 'loading', operation: 'loading', warnings: [] })
    const response = await motionStudioApiClient.getSceneWorkspace(productionId)
    if (requestSequence !== sequence.current) return
    if (!response.ok) {
      commitResponse(response, undefined, productionId, setView)
      return
    }
    const previewResponse = await motionStudioApiClient.getPreviewWorkspace(productionId)
    if (requestSequence !== sequence.current) return
    commitResponse(response, previewResponse, productionId, setView)
  }, [active, productionId])

  useEffect(() => {
    const timer = globalThis.setTimeout(() => { void load() }, 0)
    return () => {
      globalThis.clearTimeout(timer)
      sequence.current += 1
    }
  }, [load])

  const createScene = useCallback(async (request: CreateMotionStudioSceneDraftRequest) => {
    if (!productionId || !active) return false
    const serialized = JSON.stringify(request)
    if (!sceneReplay.current || sceneReplay.current.request !== serialized) {
      sceneReplay.current = { request: serialized, key: clientKey('scene-draft', productionId) }
    }
    const requestSequence = ++sequence.current
    setView((current) => ({ ...current, operation: 'creating', message: undefined }))
    const response = await motionStudioApiClient.createSceneDraft(productionId, request, sceneReplay.current.key)
    if (requestSequence !== sequence.current) return false
    if (!response.ok) {
      commitError(response, setView)
      return false
    }
    const workspace = projectSceneWorkspace(response.data?.sceneWorkspace, productionId)
    if (!workspace) {
      setView({ state: 'failure', operation: 'idle', message: 'The backend returned an invalid scene workspace after authoring.', warnings: response.warnings })
      return false
    }
    sceneReplay.current = undefined
    setView((current) => ({
      state: workspaceState(workspace), operation: 'idle', workspace,
      ...(current.previewWorkspace ? { previewWorkspace: current.previewWorkspace } : {}),
      ...(current.previewMessage ? { previewMessage: current.previewMessage } : {}),
      warnings: response.warnings,
    }))
    return true
  }, [active, productionId])

  const compileSceneDocument = useCallback(async (artifactId: string, versionId: string, contentDigest: string) => {
    if (!productionId || !active || !view.workspace?.latestApprovedSnapshot) return false
    const snapshot = view.workspace.latestApprovedSnapshot
    const replayIdentity = `${artifactId}:${versionId}:${contentDigest}:${snapshot.id}:${snapshot.targetTimelineManifestId}`
    const idempotencyKey = proposalReplay.current.get(replayIdentity) ?? clientKey('timeline-proposal', productionId)
    proposalReplay.current.set(replayIdentity, idempotencyKey)
    const requestSequence = ++sequence.current
    setView((current) => ({ ...current, operation: 'compiling', message: undefined }))
    const response = await motionStudioApiClient.createTimelineProposal(productionId, {
      approvedSnapshotId: snapshot.id,
      sceneDocumentArtifactId: artifactId,
      sceneDocumentVersionId: versionId,
      sceneDocumentContentDigest: contentDigest,
      targetTimelineManifestId: snapshot.targetTimelineManifestId,
    }, idempotencyKey)
    if (requestSequence !== sequence.current) return false
    if (!response.ok) {
      commitError(response, setView)
      return false
    }
    const workspace = projectSceneWorkspace(response.data?.sceneWorkspace, productionId)
    if (!workspace) {
      setView({ state: 'failure', operation: 'idle', message: 'The backend returned an invalid scene workspace after compilation.', warnings: response.warnings })
      return false
    }
    proposalReplay.current.delete(replayIdentity)
    setView((current) => ({
      state: workspaceState(workspace), operation: 'idle', workspace,
      ...(current.previewWorkspace ? { previewWorkspace: current.previewWorkspace } : {}),
      ...(current.previewMessage ? { previewMessage: current.previewMessage } : {}),
      warnings: response.warnings,
    }))
    return true
  }, [active, productionId, view.workspace])

  const requestPreview = useCallback(async (document: MotionStudioSceneArtifactSummaryDto) => {
    if (!productionId || !active || !view.workspace?.latestApprovedSnapshot || !workGraph) return false
    const snapshot = view.workspace.latestApprovedSnapshot
    const proposal = view.workspace.proposals.find((candidate) =>
      candidate.approvedSnapshotId === snapshot.id &&
      candidate.sourceSceneDocument.versionId === document.version.versionId &&
      candidate.sourceSceneDocument.contentDigest === document.version.contentDigest)
    const boundJobIds = new Set(view.previewWorkspace?.bindings.map((binding) => binding.jobId) ?? [])
    const job = workGraph.jobs.find((candidate) =>
      candidate.approvedSnapshotId === snapshot.id &&
      candidate.workItemType === 'render_remotion_preview' &&
      candidate.status === 'queued' &&
      !boundJobIds.has(candidate.id))
    const continuityReady = !document.storyContinuityReview || document.storyContinuityReview.state === 'approved_locked'
    if (!proposal || !job || !['approved', 'locked'].includes(document.state) || !continuityReady) {
      setView((current) => ({
        ...current,
        previewMessage: 'Preview is not ready. Approve this exact SceneDocument, compile its proposal, and authorize its preview work item first.',
      }))
      return false
    }
    const replayIdentity = `${document.version.versionId}:${proposal.id}:${job.id}`
    const idempotencyKey = proposalReplay.current.get(`preview:${replayIdentity}`) ?? clientKey('render-binding', productionId)
    proposalReplay.current.set(`preview:${replayIdentity}`, idempotencyKey)
    const requestSequence = ++sequence.current
    setView((current) => ({ ...current, operation: 'binding_preview', previewMessage: undefined }))
    const response = await motionStudioApiClient.createRenderBinding(productionId, {
      approvedSnapshotId: snapshot.id,
      sceneDocumentArtifactId: document.artifactId,
      sceneDocumentVersionId: document.version.versionId,
      sceneDocumentContentDigest: document.version.contentDigest,
      timelineProposalId: proposal.id,
      jobId: job.id,
    }, idempotencyKey)
    if (requestSequence !== sequence.current) return false
    if (!response.ok) {
      setView((current) => ({
        ...current,
        operation: 'idle',
        previewMessage: response.error?.message ?? 'The exact preview binding could not be created.',
        warnings: [...current.warnings, ...response.warnings],
      }))
      return false
    }
    const previewWorkspace = projectPreviewWorkspace(response.data?.previewWorkspace, productionId)
    if (!previewWorkspace) {
      setView((current) => ({ ...current, operation: 'idle', previewMessage: 'The backend returned an invalid preview workspace.' }))
      return false
    }
    proposalReplay.current.delete(`preview:${replayIdentity}`)
    setView((current) => ({
      ...current,
      operation: 'idle',
      previewWorkspace,
      previewMessage: 'Private preview work is queued under the approved snapshot and cost budget.',
      warnings: [...current.warnings, ...response.warnings],
    }))
    return true
  }, [active, productionId, view.previewWorkspace, view.workspace, workGraph])

  const requestablePreviewVersionIds = useMemo(() => {
    const snapshot = view.workspace?.latestApprovedSnapshot
    if (!snapshot || !workGraph) return []
    const boundJobIds = new Set(view.previewWorkspace?.bindings.map((binding) => binding.jobId) ?? [])
    const hasUnboundPreviewJob = workGraph.jobs.some((job) =>
      job.approvedSnapshotId === snapshot.id &&
      job.workItemType === 'render_remotion_preview' &&
      job.status === 'queued' &&
      !boundJobIds.has(job.id))
    if (!hasUnboundPreviewJob) return []
    return view.workspace?.artifacts
      .filter((artifact) =>
        artifact.kind === 'scene_document' &&
        ['approved', 'locked'].includes(artifact.state) &&
        (!artifact.storyContinuityReview || artifact.storyContinuityReview.state === 'approved_locked') &&
        view.workspace?.proposals.some((proposal) =>
          proposal.approvedSnapshotId === snapshot.id &&
          proposal.sourceSceneDocument.versionId === artifact.version.versionId &&
          proposal.sourceSceneDocument.contentDigest === artifact.version.contentDigest))
      .map((artifact) => artifact.version.versionId) ?? []
  }, [view.previewWorkspace, view.workspace, workGraph])

  return {
    ...view,
    requestablePreviewVersionIds,
    refresh: async () => load(true),
    createScene,
    compileSceneDocument,
    requestPreview,
  }
}

function commitResponse(
  response: ApiResponseEnvelope<{ sceneWorkspace: MotionStudioSceneWorkspaceDto }>,
  previewResponse: ApiResponseEnvelope<{ previewWorkspace: MotionStudioPreviewWorkspaceDto }> | undefined,
  productionId: string,
  setView: (state: MotionStudioSceneWorkspaceViewState) => void,
): void {
  if (!response.ok) return commitError(response, setView)
  const workspace = projectSceneWorkspace(response.data?.sceneWorkspace, productionId)
  if (!workspace) {
    setView({ state: 'failure', operation: 'idle', message: 'The backend returned a scene workspace outside this production authority.', warnings: response.warnings })
    return
  }
  const previewWorkspace = previewResponse?.ok
    ? projectPreviewWorkspace(previewResponse.data?.previewWorkspace, productionId)
    : undefined
  setView({
    state: workspaceState(workspace), operation: 'idle', workspace,
    ...(previewWorkspace ? { previewWorkspace } : {}),
    ...(previewResponse && !previewResponse.ok
      ? { previewMessage: previewResponse.error?.message ?? 'Private preview state is temporarily unavailable.' }
      : {}),
    warnings: [...response.warnings, ...(previewResponse?.warnings ?? [])],
  })
}

function commitError(
  response: ApiResponseEnvelope<unknown>,
  setView: (state: MotionStudioSceneWorkspaceViewState) => void,
): void {
  const state = response.statusCode === 403
    ? 'permission_denied'
    : response.statusCode === 409
      ? 'conflict'
      : 'failure'
  setView({
    state,
    operation: 'idle',
    message: response.error?.message ?? 'The Scene Editor request could not be completed.',
    warnings: response.warnings,
  })
}

function projectSceneWorkspace(value: unknown, productionId: string): MotionStudioSceneWorkspaceDto | undefined {
  const candidate = plainRecord(value)
  if (!candidate || candidate.productionId !== productionId || candidate.localCandidateOnly !== true) return undefined
  if (!Array.isArray(candidate.artifacts) || !Array.isArray(candidate.proposals)) return undefined
  const artifacts = candidate.artifacts.map(projectArtifact)
  const proposals = candidate.proposals.map((proposal) => projectProposal(proposal, productionId))
  if (artifacts.some((artifact) => !artifact) || proposals.some((proposal) => !proposal)) return undefined
  const readinessRecord = plainRecord(candidate.readiness)
  if (!readinessRecord || typeof readinessRecord.canAuthor !== 'boolean' || typeof readinessRecord.canCompile !== 'boolean') return undefined
  if (!Array.isArray(readinessRecord.blockers) || !readinessRecord.blockers.every((blocker) => typeof blocker === 'string')) return undefined
  const snapshot = candidate.latestApprovedSnapshot === undefined ? undefined : projectSnapshot(candidate.latestApprovedSnapshot)
  if (candidate.latestApprovedSnapshot !== undefined && !snapshot) return undefined
  return {
    productionId,
    artifacts: artifacts as MotionStudioSceneArtifactSummaryDto[],
    proposals: proposals as MotionStudioTimelineProposalDto[],
    ...(snapshot ? { latestApprovedSnapshot: snapshot } : {}),
    readiness: {
      canAuthor: readinessRecord.canAuthor,
      canCompile: readinessRecord.canCompile,
      blockers: [...readinessRecord.blockers] as string[],
    },
    localCandidateOnly: true,
  }
}

const artifactKinds = new Set([
  'scene_graph', 'scene_recipe', 'layer_plan', 'scene_document', 'motion_language', 'narrative_function',
])
const artifactStates = new Set(['draft', 'in_review', 'approved', 'locked', 'rejected', 'superseded', 'archived'])
const productionModes = new Set(['generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed'])
const sceneLayerTypes = new Set(['source_footage', 'image', 'generated_video', 'text', 'caption', 'map', 'chart', 'mask', 'audio', 'effect'])
const commercialOrInternalKeys = new Set([
  'customerprice', 'customercredits', 'reeditprofee', 'internalcost', 'wallet', 'billing',
  'providercredential', 'providersecret', 'providerapikey', 'workercredential', 'leasenonce', 'signedurl',
])

function projectPreviewWorkspace(value: unknown, productionId: string): MotionStudioPreviewWorkspaceDto | undefined {
  const candidate = plainRecord(value)
  if (!candidate || candidate.productionId !== productionId || candidate.localCandidateOnly !== true || !Array.isArray(candidate.bindings)) return undefined
  const bindings = candidate.bindings.map((value) => {
    const binding = plainRecord(value)
    const sceneDocument = projectVersion(binding?.sceneDocument)
    if (
      !binding || !isUuid(binding.id) || binding.productionId !== productionId || !isUuid(binding.approvedSnapshotId) ||
      !sceneDocument || !isUuid(binding.timelineProposalId) || !isDigest(binding.timelineProposalOutputDigest) ||
      !isStableId(binding.jobId) || !isUuid(binding.approvedWorkItemId) ||
      binding.compositionProfileId !== 'motion_studio_scene_preview_v1' || binding.layeredAssemblyId !== undefined ||
      !Number.isSafeInteger(binding.width) || !Number.isSafeInteger(binding.height) ||
      !isPreviewFrame(Number(binding.width), Number(binding.height)) ||
      ![24, 30].includes(Number(binding.fpsNumerator)) || binding.fpsDenominator !== 1 ||
      !Number.isSafeInteger(binding.durationFrames) || Number(binding.durationFrames) < 24 || Number(binding.durationFrames) > 450 ||
      !Number.isSafeInteger(binding.sceneStartFrame) || Number(binding.sceneStartFrame) < 0 ||
      !Number.isSafeInteger(binding.sceneEndFrame) || binding.sceneEndFrame !== Number(binding.sceneStartFrame) + Number(binding.durationFrames) ||
      !['queued', 'rendering', 'failed', 'reconciliation_required', 'cancelled', 'ready'].includes(String(binding.status)) ||
      (binding.failureCategory !== undefined && !isStableId(binding.failureCategory)) ||
      (binding.currentAttemptId !== undefined && !isStableId(binding.currentAttemptId)) ||
      typeof binding.createdAt !== 'string' || binding.localCandidateOnly !== true
    ) return undefined
    const artifact = binding.artifact === undefined ? undefined : projectPreviewArtifact(binding.artifact, binding.id, binding.jobId, {
      width: Number(binding.width), height: Number(binding.height), fpsNumerator: Number(binding.fpsNumerator),
      durationFrames: Number(binding.durationFrames), sceneStartFrame: Number(binding.sceneStartFrame), sceneEndFrame: Number(binding.sceneEndFrame),
    })
    if (binding.artifact !== undefined && !artifact) return undefined
    if ((binding.status === 'ready') !== Boolean(artifact)) return undefined
    return {
      id: binding.id,
      productionId,
      approvedSnapshotId: binding.approvedSnapshotId,
      sceneDocument,
      timelineProposalId: binding.timelineProposalId,
      timelineProposalOutputDigest: binding.timelineProposalOutputDigest,
      jobId: binding.jobId,
      approvedWorkItemId: binding.approvedWorkItemId,
      compositionProfileId: 'motion_studio_scene_preview_v1' as const,
      width: Number(binding.width),
      height: Number(binding.height),
      fpsNumerator: Number(binding.fpsNumerator) as 24 | 30,
      fpsDenominator: 1 as const,
      durationFrames: Number(binding.durationFrames),
      sceneStartFrame: Number(binding.sceneStartFrame),
      sceneEndFrame: Number(binding.sceneEndFrame),
      status: binding.status as MotionStudioPreviewWorkspaceDto['bindings'][number]['status'],
      ...(typeof binding.failureCategory === 'string' ? { failureCategory: binding.failureCategory } : {}),
      ...(typeof binding.currentAttemptId === 'string' ? { currentAttemptId: binding.currentAttemptId } : {}),
      ...(artifact ? { artifact } : {}),
      createdAt: binding.createdAt,
      localCandidateOnly: true as const,
    }
  })
  if (bindings.some((binding) => !binding)) return undefined
  return { productionId, bindings: bindings as MotionStudioPreviewWorkspaceDto['bindings'], localCandidateOnly: true }
}

function projectPreviewArtifact(
  value: unknown,
  bindingId: string,
  jobId: string,
  expected: { width: number; height: number; fpsNumerator: number; durationFrames: number; sceneStartFrame: number; sceneEndFrame: number },
) {
  const artifact = plainRecord(value)
  if (
    !artifact || !isUuid(artifact.id) || artifact.bindingId !== bindingId || artifact.jobId !== jobId ||
    !isStableId(artifact.attemptId) || !isDigest(artifact.sha256) ||
    !Number.isSafeInteger(artifact.byteLength) || Number(artifact.byteLength) < 1024 || Number(artifact.byteLength) > 16 * 1024 * 1024 ||
    artifact.mimeType !== 'video/mp4' || artifact.codec !== 'h264' || artifact.pixelFormat !== 'yuv420p' || artifact.colorSpace !== 'bt709' ||
    !Number.isSafeInteger(artifact.width) || !Number.isSafeInteger(artifact.height) ||
    ![24, 30].includes(Number(artifact.fpsNumerator)) || artifact.fpsDenominator !== 1 ||
    Number(artifact.width) !== expected.width || Number(artifact.height) !== expected.height ||
    Number(artifact.fpsNumerator) !== expected.fpsNumerator ||
    !Number.isSafeInteger(artifact.durationFrames) || Number(artifact.durationFrames) !== expected.durationFrames ||
    !Number.isSafeInteger(artifact.sceneStartFrame) || Number(artifact.sceneStartFrame) !== expected.sceneStartFrame ||
    !Number.isSafeInteger(artifact.sceneEndFrame) || !Array.isArray(artifact.frameEvidence) ||
    Number(artifact.sceneEndFrame) !== expected.sceneEndFrame ||
    !isDigest(artifact.runtimeIdentityDigest) || !isDigest(artifact.attestationDigest) || !isDigest(artifact.qaEvidenceDigest) ||
    typeof artifact.createdAt !== 'string' || artifact.localCandidateOnly !== true
  ) return undefined
  const expectedFrames = [0, Math.floor((Number(artifact.durationFrames) - 1) / 2), Number(artifact.durationFrames) - 1]
  const frameEvidence = artifact.frameEvidence.map((value, index) => {
    const frame = plainRecord(value)
    return frame && frame.frame === expectedFrames[index] && isDigest(frame.sha256)
      ? { frame: Number(frame.frame), sha256: frame.sha256 as string }
      : undefined
  })
  if (frameEvidence.length !== 3 || frameEvidence.some((frame) => !frame)) return undefined
  return {
    id: artifact.id,
    bindingId,
    jobId,
    attemptId: artifact.attemptId as string,
    sha256: artifact.sha256 as string,
    byteLength: Number(artifact.byteLength),
    mimeType: 'video/mp4' as const,
    codec: 'h264' as const,
    pixelFormat: 'yuv420p' as const,
    colorSpace: 'bt709' as const,
    width: Number(artifact.width),
    height: Number(artifact.height),
    fpsNumerator: Number(artifact.fpsNumerator) as 24 | 30,
    fpsDenominator: 1 as const,
    durationFrames: Number(artifact.durationFrames),
    sceneStartFrame: Number(artifact.sceneStartFrame),
    sceneEndFrame: Number(artifact.sceneEndFrame),
    frameEvidence: frameEvidence as { frame: number; sha256: string }[],
    runtimeIdentityDigest: artifact.runtimeIdentityDigest as string,
    attestationDigest: artifact.attestationDigest as string,
    qaEvidenceDigest: artifact.qaEvidenceDigest as string,
    createdAt: artifact.createdAt,
    localCandidateOnly: true as const,
  }
}

function projectArtifact(value: unknown): MotionStudioSceneArtifactSummaryDto | undefined {
  const candidate = plainRecord(value)
  if (!candidate || !isUuid(candidate.artifactId) || !artifactKinds.has(String(candidate.kind))) return undefined
  if (!artifactStates.has(String(candidate.state)) || typeof candidate.label !== 'string' || candidate.label.length > 300) return undefined
  const version = projectVersion(candidate.version)
  if (!version || (candidate.sceneId !== undefined && typeof candidate.sceneId !== 'string')) return undefined
  if (
    (candidate.sceneTitle !== undefined && (typeof candidate.sceneTitle !== 'string' || !candidate.sceneTitle.trim() || candidate.sceneTitle.length > 200)) ||
    (candidate.semanticPurpose !== undefined && (typeof candidate.semanticPurpose !== 'string' || !candidate.semanticPurpose.trim() || candidate.semanticPurpose.length > 2_000)) ||
    (candidate.productionMode !== undefined && !productionModes.has(String(candidate.productionMode))) ||
    (candidate.shotCount !== undefined && !isBoundedCount(candidate.shotCount, 1_000)) ||
    (candidate.layerCount !== undefined && !isBoundedCount(candidate.layerCount, 1_000)) ||
    (candidate.assetCount !== undefined && !isBoundedCount(candidate.assetCount, 10_000)) ||
    (candidate.keyframeCount !== undefined && !isBoundedCount(candidate.keyframeCount, 10_000)) ||
    (candidate.exactTextRequired !== undefined && typeof candidate.exactTextRequired !== 'boolean') ||
    (candidate.exactDataRequired !== undefined && typeof candidate.exactDataRequired !== 'boolean')
  ) return undefined
  const timing = candidate.timing === undefined ? undefined : plainRecord(candidate.timing)
  if (candidate.timing !== undefined && (
    !timing || !isStableId(timing.startAnchorId) || !isStableId(timing.endAnchorId) || timing.startAnchorId === timing.endAnchorId
  )) return undefined
  if (candidate.layerTypes !== undefined && (
    !Array.isArray(candidate.layerTypes) || candidate.layerTypes.length > 10 ||
    !candidate.layerTypes.every((layerType) => typeof layerType === 'string' && sceneLayerTypes.has(layerType)) ||
    new Set(candidate.layerTypes).size !== candidate.layerTypes.length
  )) return undefined
  const storyContinuityReview = candidate.storyContinuityReview === undefined
    ? undefined
    : storytellingSceneContinuityReviewDtoSchema.safeParse(candidate.storyContinuityReview)
  if (candidate.storyContinuityReview !== undefined &&
      (candidate.kind !== 'scene_document' || !storyContinuityReview?.success)) return undefined
  return {
    artifactId: candidate.artifactId,
    kind: candidate.kind as MotionStudioSceneArtifactSummaryDto['kind'],
    version,
    state: candidate.state as MotionStudioSceneArtifactSummaryDto['state'],
    label: candidate.label,
    ...(typeof candidate.sceneId === 'string' ? { sceneId: candidate.sceneId } : {}),
    ...(typeof candidate.sceneTitle === 'string' ? { sceneTitle: candidate.sceneTitle } : {}),
    ...(typeof candidate.semanticPurpose === 'string' ? { semanticPurpose: candidate.semanticPurpose } : {}),
    ...(typeof candidate.productionMode === 'string' ? { productionMode: candidate.productionMode as MotionStudioSceneArtifactSummaryDto['productionMode'] } : {}),
    ...(timing ? { timing: { startAnchorId: timing.startAnchorId as string, endAnchorId: timing.endAnchorId as string } } : {}),
    ...(typeof candidate.shotCount === 'number' ? { shotCount: candidate.shotCount } : {}),
    ...(Array.isArray(candidate.layerTypes) ? { layerTypes: candidate.layerTypes as NonNullable<MotionStudioSceneArtifactSummaryDto['layerTypes']> } : {}),
    ...(typeof candidate.layerCount === 'number' ? { layerCount: candidate.layerCount } : {}),
    ...(typeof candidate.assetCount === 'number' ? { assetCount: candidate.assetCount } : {}),
    ...(typeof candidate.keyframeCount === 'number' ? { keyframeCount: candidate.keyframeCount } : {}),
    ...(typeof candidate.exactTextRequired === 'boolean' ? { exactTextRequired: candidate.exactTextRequired } : {}),
    ...(typeof candidate.exactDataRequired === 'boolean' ? { exactDataRequired: candidate.exactDataRequired } : {}),
    ...(storyContinuityReview?.success ? { storyContinuityReview: storyContinuityReview.data } : {}),
  }
}

function isBoundedCount(value: unknown, maximum: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= maximum
}

function projectProposal(value: unknown, productionId: string): MotionStudioTimelineProposalDto | undefined {
  const candidate = plainRecord(value)
  if (!candidate || !isUuid(candidate.id) || candidate.productionId !== productionId || !isUuid(candidate.approvedSnapshotId)) return undefined
  if (candidate.compilerId !== 'motion-studio-scene-compiler' || typeof candidate.compilerVersion !== 'string') return undefined
  if (!isDigest(candidate.inputDigest) || !isDigest(candidate.outputDigest) || candidate.status !== 'proposed' || candidate.localCandidateOnly !== true) return undefined
  if (typeof candidate.targetTimelineManifestId !== 'string' || typeof candidate.createdAt !== 'string') return undefined
  const source = projectVersion(candidate.sourceSceneDocument)
  if (!source || !Array.isArray(candidate.operations) || !Array.isArray(candidate.warnings) || !candidate.warnings.every((warning) => typeof warning === 'string')) return undefined
  const operations = candidate.operations.map((operation) => projectProposalOperation(operation, source))
  if (operations.some((operation) => !operation)) return undefined
  return {
    id: candidate.id,
    productionId,
    approvedSnapshotId: candidate.approvedSnapshotId,
    sourceSceneDocument: source,
    targetTimelineManifestId: candidate.targetTimelineManifestId,
    compilerId: 'motion-studio-scene-compiler',
    compilerVersion: candidate.compilerVersion,
    inputDigest: candidate.inputDigest,
    outputDigest: candidate.outputDigest,
    operations: operations as MotionStudioTimelineProposalDto['operations'],
    warnings: [...candidate.warnings] as string[],
    status: 'proposed',
    createdAt: candidate.createdAt,
    localCandidateOnly: true,
  }
}

function projectProposalOperation(value: unknown, source: MotionStudioVersionReference) {
  const candidate = plainRecord(value)
  const layer = plainRecord(candidate?.layer)
  const range = plainRecord(layer?.timelineRange)
  const metadata = plainRecord(layer?.metadata)
  if (!candidate || candidate.kind !== 'upsert_layer' || typeof candidate.id !== 'string') return undefined
  if (!['audioLayers', 'captionLayers', 'overlayLayers', 'maskLayers'].includes(String(candidate.targetCollection))) return undefined
  if (!layer || typeof layer.id !== 'string' || typeof layer.layerType !== 'string' || !range || !metadata) return undefined
  if (!Array.isArray(layer.artifactIds) || !layer.artifactIds.every((id) => typeof id === 'string')) return undefined
  if (!finiteRange(range) || metadata.proposalOnly !== true || metadata.source !== 'motion_studio_scene_proposal') return undefined
  if (metadata.sceneDocumentVersionId !== source.versionId || metadata.sceneDocumentDigest !== source.contentDigest) return undefined
  if (containsUnsafeProjectionKey(metadata)) return undefined
  return {
    id: candidate.id,
    kind: 'upsert_layer' as const,
    targetCollection: candidate.targetCollection as 'audioLayers' | 'captionLayers' | 'overlayLayers' | 'maskLayers',
    layer: {
      id: layer.id,
      layerType: layer.layerType,
      timelineRange: {
        startSeconds: range.startSeconds as number,
        endSeconds: range.endSeconds as number,
        ...(typeof range.startFrame === 'number' ? { startFrame: range.startFrame } : {}),
        ...(typeof range.endFrame === 'number' ? { endFrame: range.endFrame } : {}),
      },
      artifactIds: [...layer.artifactIds] as string[],
      metadata: metadata as JSONObject,
    },
  }
}

function projectSnapshot(value: unknown): NonNullable<MotionStudioSceneWorkspaceDto['latestApprovedSnapshot']> | undefined {
  const candidate = plainRecord(value)
  if (!candidate || !isUuid(candidate.id) || typeof candidate.targetTimelineManifestId !== 'string') return undefined
  if (!isDigest(candidate.timingAuthorityDigest) || typeof candidate.frameRate !== 'number' || !Number.isFinite(candidate.frameRate) || candidate.frameRate <= 0) return undefined
  if (!Array.isArray(candidate.timingAnchors) || candidate.timingAnchors.length < 2) return undefined
  const anchors = candidate.timingAnchors.map((anchor) => {
    const item = plainRecord(anchor)
    return item && typeof item.id === 'string' && Number.isSafeInteger(item.frame) && Number(item.frame) >= 0
      ? { id: item.id, frame: Number(item.frame) }
      : undefined
  })
  if (anchors.some((anchor) => !anchor)) return undefined
  return {
    id: candidate.id,
    targetTimelineManifestId: candidate.targetTimelineManifestId,
    timingAuthorityDigest: candidate.timingAuthorityDigest,
    frameRate: candidate.frameRate,
    timingAnchors: anchors as { id: string; frame: number }[],
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

function finiteRange(value: Record<string, unknown>): boolean {
  return typeof value.startSeconds === 'number' && Number.isFinite(value.startSeconds) && value.startSeconds >= 0 &&
    typeof value.endSeconds === 'number' && Number.isFinite(value.endSeconds) && value.endSeconds > value.startSeconds &&
    (value.startFrame === undefined || Number.isSafeInteger(value.startFrame)) &&
    (value.endFrame === undefined || Number.isSafeInteger(value.endFrame))
}

function containsUnsafeProjectionKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(containsUnsafeProjectionKey)
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    return commercialOrInternalKeys.has(normalized) || normalized.endsWith('apikey') || normalized.endsWith('clientsecret') || containsUnsafeProjectionKey(child)
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

function isPreviewFrame(width: number, height: number): boolean {
  return ['640x360', '360x640', '480x480', '480x600'].includes(`${width}x${height}`)
}

function workspaceState(workspace: MotionStudioSceneWorkspaceDto): 'ready' | 'empty' {
  return workspace.artifacts.some((artifact) => artifact.kind === 'scene_document') ? 'ready' : 'empty'
}

function clientKey(operation: string, productionId: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `motion-studio:${operation}:${productionId}:${random}`
}
