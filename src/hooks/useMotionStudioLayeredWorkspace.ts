import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ApiResponseEnvelope } from '../backend/api/api-runtime-contracts'
import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import { motionStudioLayerManifestV1Schema } from '../lib/motion-studio/contracts'
import type {
  MotionStudioLayeredAssemblyDto,
  MotionStudioLayeredCutoutArtifactDto,
  MotionStudioLayeredWorkspaceDto,
  MotionStudioPreviewArtifactDto,
  MotionStudioPreviewBindingDto,
  MotionStudioSceneArtifactSummaryDto,
  MotionStudioSceneWorkspaceDto,
  MotionStudioVersionReference,
  MotionStudioWorkGraphDto,
} from '../types/motion-studio'

export type MotionStudioLayeredResourceState =
  | 'inactive'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'failure'
  | 'permission_denied'
  | 'conflict'

export interface MotionStudioLayeredWorkspaceViewState {
  state: MotionStudioLayeredResourceState
  operation: 'idle' | 'loading' | 'refreshing' | 'assembling'
  workspace?: MotionStudioLayeredWorkspaceDto
  message?: string
  warnings: readonly string[]
}

export interface UseMotionStudioLayeredWorkspaceResult extends MotionStudioLayeredWorkspaceViewState {
  requestableSceneDocumentVersionIds: readonly string[]
  refresh: () => Promise<void>
  createAssembly: (document: MotionStudioSceneArtifactSummaryDto) => Promise<boolean>
}

const inactiveState: MotionStudioLayeredWorkspaceViewState = {
  state: 'inactive', operation: 'idle', warnings: [],
}

export function useMotionStudioLayeredWorkspace(
  productionId: string | undefined,
  active: boolean,
  sceneWorkspace?: MotionStudioSceneWorkspaceDto,
  workGraph?: MotionStudioWorkGraphDto,
): UseMotionStudioLayeredWorkspaceResult {
  const [view, setView] = useState<MotionStudioLayeredWorkspaceViewState>(inactiveState)
  const sequence = useRef(0)
  const assemblyKeys = useRef(new Map<string, string>())

  const load = useCallback(async (refreshing = false) => {
    if (!productionId || !active) {
      setView(inactiveState)
      return
    }
    const requestSequence = ++sequence.current
    setView((current) => refreshing && current.workspace
      ? { ...current, operation: 'refreshing', message: undefined }
      : { state: 'loading', operation: 'loading', warnings: [] })
    const response = await motionStudioApiClient.getLayeredWorkspace(productionId)
    if (requestSequence !== sequence.current) return
    commitResponse(response, productionId, setView)
  }, [active, productionId])

  useEffect(() => {
    const timer = globalThis.setTimeout(() => { void load() }, 0)
    return () => {
      globalThis.clearTimeout(timer)
      sequence.current += 1
    }
  }, [load])

  const createAssembly = useCallback(async (document: MotionStudioSceneArtifactSummaryDto) => {
    if (!productionId || !active || !sceneWorkspace || !workGraph) return false
    const authority = findAssemblyAuthority(document, sceneWorkspace, workGraph, view.workspace)
    if (!authority) {
      setView((current) => ({
        ...current,
        message: 'Layered preview is not ready. Approve this exact SceneDocument, compile its image or mask proposal, and authorize both dependent work items first.',
      }))
      return false
    }
    const replayIdentity = [
      document.version.versionId,
      authority.proposalId,
      authority.cutoutJobId,
      authority.renderJobId,
    ].join(':')
    const idempotencyKey = assemblyKeys.current.get(replayIdentity) ?? clientKey('layered-assembly', productionId)
    assemblyKeys.current.set(replayIdentity, idempotencyKey)
    const requestSequence = ++sequence.current
    setView((current) => ({ ...current, operation: 'assembling', message: undefined }))
    const response = await motionStudioApiClient.createLayeredAssembly(productionId, {
      approvedSnapshotId: authority.approvedSnapshotId,
      sceneDocumentArtifactId: document.artifactId,
      sceneDocumentVersionId: document.version.versionId,
      sceneDocumentContentDigest: document.version.contentDigest,
      timelineProposalId: authority.proposalId,
      cutoutJobId: authority.cutoutJobId,
      renderJobId: authority.renderJobId,
    }, idempotencyKey)
    if (requestSequence !== sequence.current) return false
    if (!response.ok) {
      setView((current) => ({
        ...current,
        operation: 'idle',
        message: response.error?.message ?? 'The exact layered preview authority could not be assembled.',
        warnings: [...current.warnings, ...response.warnings],
      }))
      return false
    }
    const workspace = projectLayeredWorkspace(response.data?.layeredWorkspace, productionId)
    if (!workspace) {
      setView((current) => ({
        ...current,
        operation: 'idle',
        message: 'The backend returned layered authority outside this production or its registered profile.',
      }))
      return false
    }
    assemblyKeys.current.delete(replayIdentity)
    setView({
      state: workspaceState(workspace), operation: 'idle', workspace,
      message: 'Layered preview authority is assembled. Private workers—not this browser—prepare the fixture cutout and render the approved scene.',
      warnings: response.warnings,
    })
    return true
  }, [active, productionId, sceneWorkspace, view.workspace, workGraph])

  const requestableSceneDocumentVersionIds = useMemo(() => {
    if (!sceneWorkspace || !workGraph) return []
    return sceneWorkspace.artifacts
      .filter((artifact) => artifact.kind === 'scene_document' &&
        Boolean(findAssemblyAuthority(artifact, sceneWorkspace, workGraph, view.workspace)))
      .map((artifact) => artifact.version.versionId)
  }, [sceneWorkspace, view.workspace, workGraph])

  return {
    ...view,
    requestableSceneDocumentVersionIds,
    refresh: async () => load(true),
    createAssembly,
  }
}

function findAssemblyAuthority(
  document: MotionStudioSceneArtifactSummaryDto,
  sceneWorkspace: MotionStudioSceneWorkspaceDto,
  workGraph: MotionStudioWorkGraphDto,
  layeredWorkspace?: MotionStudioLayeredWorkspaceDto,
): {
  approvedSnapshotId: string
  proposalId: string
  cutoutJobId: string
  renderJobId: string
} | undefined {
  const snapshot = sceneWorkspace.latestApprovedSnapshot
  if (!snapshot || workGraph.approvedSnapshotId !== snapshot.id || !['approved', 'locked'].includes(document.state)) return undefined
  if (layeredWorkspace?.assemblies.some((assembly) => assembly.sceneDocument.versionId === document.version.versionId)) return undefined
  const proposal = sceneWorkspace.proposals.find((candidate) =>
    candidate.approvedSnapshotId === snapshot.id &&
    candidate.sourceSceneDocument.artifactId === document.artifactId &&
    candidate.sourceSceneDocument.versionId === document.version.versionId &&
    candidate.sourceSceneDocument.contentDigest === document.version.contentDigest &&
    candidate.operations.length === 1 &&
    ['image', 'mask'].includes(candidate.operations[0]?.layer.layerType ?? '') &&
    Number.isSafeInteger(candidate.operations[0]?.layer.timelineRange.startFrame) &&
    Number.isSafeInteger(candidate.operations[0]?.layer.timelineRange.endFrame))
  if (!proposal) return undefined
  const usedJobIds = new Set(layeredWorkspace?.assemblies.flatMap((assembly) => [assembly.cutoutJobId, assembly.renderJobId]) ?? [])
  const cutout = workGraph.jobs.find((job) =>
    job.approvedSnapshotId === snapshot.id &&
    job.workItemType === 'prepare_motion_studio_subject_cutout' &&
    job.status === 'queued' &&
    !usedJobIds.has(job.id))
  if (!cutout) return undefined
  const render = workGraph.jobs.find((job) =>
    job.approvedSnapshotId === snapshot.id &&
    job.workItemType === 'render_motion_studio_layered_preview' &&
    job.status === 'waiting' &&
    !usedJobIds.has(job.id) &&
    (job.upstreamJobIds.includes(cutout.id) || workGraph.dependencies.some((edge) =>
      edge.upstreamJobId === cutout.id && edge.downstreamJobId === job.id)))
  if (!render) return undefined
  return {
    approvedSnapshotId: snapshot.id,
    proposalId: proposal.id,
    cutoutJobId: cutout.id,
    renderJobId: render.id,
  }
}

function commitResponse(
  response: ApiResponseEnvelope<{ layeredWorkspace: MotionStudioLayeredWorkspaceDto }>,
  productionId: string,
  setView: (state: MotionStudioLayeredWorkspaceViewState) => void,
): void {
  if (!response.ok) {
    setView({
      state: response.statusCode === 403 ? 'permission_denied' : response.statusCode === 409 ? 'conflict' : 'failure',
      operation: 'idle',
      message: response.error?.message ?? 'The layered preview workspace could not be loaded.',
      warnings: response.warnings,
    })
    return
  }
  const workspace = projectLayeredWorkspace(response.data?.layeredWorkspace, productionId)
  if (!workspace) {
    setView({
      state: 'failure', operation: 'idle',
      message: 'The backend returned layered authority outside this production or its registered profile.',
      warnings: response.warnings,
    })
    return
  }
  setView({ state: workspaceState(workspace), operation: 'idle', workspace, warnings: response.warnings })
}

function projectLayeredWorkspace(value: unknown, productionId: string): MotionStudioLayeredWorkspaceDto | undefined {
  if (containsUnsafeProjectionKey(value)) return undefined
  const candidate = plainRecord(value)
  if (!candidate || candidate.productionId !== productionId || candidate.localCandidateOnly !== true || !Array.isArray(candidate.assemblies)) return undefined
  const assemblies = candidate.assemblies.map((assembly) => projectAssembly(assembly, productionId))
  if (assemblies.some((assembly) => !assembly)) return undefined
  return { productionId, assemblies: assemblies as MotionStudioLayeredAssemblyDto[], localCandidateOnly: true }
}

function projectAssembly(value: unknown, productionId: string): MotionStudioLayeredAssemblyDto | undefined {
  const candidate = plainRecord(value)
  const sceneDocument = projectVersion(candidate?.sceneDocument)
  const manifestResult = motionStudioLayerManifestV1Schema.safeParse(candidate?.layerManifest)
  if (
    !candidate || !isUuid(candidate.id) || candidate.productionId !== productionId ||
    !isUuid(candidate.approvedSnapshotId) || !sceneDocument || !isUuid(candidate.timelineProposalId) ||
    !isDigest(candidate.timelineProposalOutputDigest) || !isStableId(candidate.cutoutJobId) ||
    !isStableId(candidate.renderJobId) || !manifestResult.success || !isDigest(candidate.layerManifestDigest) ||
    !jobStatuses.has(String(candidate.cutoutStatus)) || !jobStatuses.has(String(candidate.renderStatus)) ||
    typeof candidate.createdAt !== 'string' || candidate.fixtureOnly !== true || candidate.localCandidateOnly !== true
  ) return undefined
  const binding = projectBinding(candidate.renderBinding, productionId, candidate.id, sceneDocument, {
    timelineProposalId: candidate.timelineProposalId,
    timelineProposalOutputDigest: candidate.timelineProposalOutputDigest,
    renderJobId: candidate.renderJobId,
  })
  if (!binding) return undefined
  const cutout = candidate.cutout === undefined
    ? undefined
    : projectCutout(candidate.cutout, candidate.id, candidate.cutoutJobId)
  if (candidate.cutout !== undefined && !cutout) return undefined
  if ((candidate.cutoutStatus === 'succeeded') !== Boolean(cutout)) return undefined
  return {
    id: candidate.id,
    productionId,
    approvedSnapshotId: candidate.approvedSnapshotId,
    sceneDocument,
    timelineProposalId: candidate.timelineProposalId,
    timelineProposalOutputDigest: candidate.timelineProposalOutputDigest,
    cutoutJobId: candidate.cutoutJobId,
    renderJobId: candidate.renderJobId,
    layerManifest: manifestResult.data,
    layerManifestDigest: candidate.layerManifestDigest,
    cutoutStatus: candidate.cutoutStatus as MotionStudioLayeredAssemblyDto['cutoutStatus'],
    renderStatus: candidate.renderStatus as MotionStudioLayeredAssemblyDto['renderStatus'],
    ...(cutout ? { cutout } : {}),
    renderBinding: binding,
    createdAt: candidate.createdAt,
    fixtureOnly: true,
    localCandidateOnly: true,
  }
}

function projectCutout(value: unknown, assemblyId: string, jobId: string): MotionStudioLayeredCutoutArtifactDto | undefined {
  const candidate = plainRecord(value)
  if (
    !candidate || !isUuid(candidate.id) || candidate.assemblyId !== assemblyId || candidate.jobId !== jobId ||
    !isStableId(candidate.attemptId) || !isDigest(candidate.sha256) || !Number.isSafeInteger(candidate.byteLength) ||
    Number(candidate.byteLength) < 512 || Number(candidate.byteLength) > 2 * 1024 * 1024 || candidate.mimeType !== 'image/png' ||
    candidate.width !== 128 || candidate.height !== 128 || candidate.alphaMinimum !== 0 || candidate.alphaMaximum !== 255 ||
    candidate.alphaUniqueValueCount !== 160 || candidate.foregroundAlphaMean !== 226.802912 ||
    candidate.backgroundAlphaMean !== 2.492606 || candidate.subjectCoverageVerified !== true || candidate.modelId !== 'u2netp' ||
    !isDigest(candidate.modelSha256) || !Number.isSafeInteger(candidate.executionDurationMilliseconds) ||
    Number(candidate.executionDurationMilliseconds) < 1 || !isDigest(candidate.qaEvidenceDigest) ||
    typeof candidate.createdAt !== 'string' || candidate.fixtureOnly !== true ||
    candidate.productionLicenseReviewRequired !== true || candidate.localCandidateOnly !== true
  ) return undefined
  return candidate as unknown as MotionStudioLayeredCutoutArtifactDto
}

function projectBinding(
  value: unknown,
  productionId: string,
  assemblyId: string,
  sceneDocument: MotionStudioVersionReference,
  expected: { timelineProposalId: unknown; timelineProposalOutputDigest: unknown; renderJobId: unknown },
): MotionStudioPreviewBindingDto | undefined {
  const candidate = plainRecord(value)
  const candidateDocument = projectVersion(candidate?.sceneDocument)
  if (
    !candidate || !isUuid(candidate.id) || candidate.productionId !== productionId || !isUuid(candidate.approvedSnapshotId) ||
    !candidateDocument || !sameVersion(candidateDocument, sceneDocument) || !isUuid(candidate.timelineProposalId) ||
    candidate.timelineProposalId !== expected.timelineProposalId || !isDigest(candidate.timelineProposalOutputDigest) ||
    candidate.timelineProposalOutputDigest !== expected.timelineProposalOutputDigest || !isStableId(candidate.jobId) ||
    candidate.jobId !== expected.renderJobId ||
    !isUuid(candidate.approvedWorkItemId) || candidate.compositionProfileId !== 'motion_studio_native_layered_scene_v1' ||
    candidate.layeredAssemblyId !== assemblyId || !isPreviewFrame(Number(candidate.width), Number(candidate.height)) ||
    ![24, 30].includes(Number(candidate.fpsNumerator)) || candidate.fpsDenominator !== 1 ||
    !Number.isSafeInteger(candidate.durationFrames) || Number(candidate.durationFrames) < 24 || Number(candidate.durationFrames) > 450 ||
    !Number.isSafeInteger(candidate.sceneStartFrame) || Number(candidate.sceneStartFrame) < 0 ||
    candidate.sceneEndFrame !== Number(candidate.sceneStartFrame) + Number(candidate.durationFrames) ||
    !previewStatuses.has(String(candidate.status)) ||
    (candidate.failureCategory !== undefined && !isStableId(candidate.failureCategory)) ||
    (candidate.currentAttemptId !== undefined && !isStableId(candidate.currentAttemptId)) ||
    typeof candidate.createdAt !== 'string' || candidate.localCandidateOnly !== true
  ) return undefined
  const artifact = candidate.artifact === undefined ? undefined : projectPreviewArtifact(candidate.artifact, candidate.id, candidate.jobId, {
    width: Number(candidate.width), height: Number(candidate.height), fpsNumerator: Number(candidate.fpsNumerator),
    durationFrames: Number(candidate.durationFrames), sceneStartFrame: Number(candidate.sceneStartFrame),
    sceneEndFrame: Number(candidate.sceneEndFrame),
  })
  if (candidate.artifact !== undefined && !artifact) return undefined
  if ((candidate.status === 'ready') !== Boolean(artifact)) return undefined
  return {
    id: candidate.id,
    productionId,
    approvedSnapshotId: candidate.approvedSnapshotId,
    sceneDocument: candidateDocument,
    timelineProposalId: candidate.timelineProposalId,
    timelineProposalOutputDigest: candidate.timelineProposalOutputDigest,
    jobId: candidate.jobId,
    approvedWorkItemId: candidate.approvedWorkItemId,
    compositionProfileId: 'motion_studio_native_layered_scene_v1',
    layeredAssemblyId: assemblyId,
    width: Number(candidate.width), height: Number(candidate.height),
    fpsNumerator: Number(candidate.fpsNumerator), fpsDenominator: 1,
    durationFrames: Number(candidate.durationFrames), sceneStartFrame: Number(candidate.sceneStartFrame),
    sceneEndFrame: Number(candidate.sceneEndFrame),
    status: candidate.status as MotionStudioPreviewBindingDto['status'],
    ...(typeof candidate.failureCategory === 'string' ? { failureCategory: candidate.failureCategory } : {}),
    ...(typeof candidate.currentAttemptId === 'string' ? { currentAttemptId: candidate.currentAttemptId } : {}),
    ...(artifact ? { artifact } : {}),
    createdAt: candidate.createdAt,
    localCandidateOnly: true,
  }
}

function projectPreviewArtifact(
  value: unknown,
  bindingId: string,
  jobId: string,
  expected: { width: number; height: number; fpsNumerator: number; durationFrames: number; sceneStartFrame: number; sceneEndFrame: number },
): MotionStudioPreviewArtifactDto | undefined {
  const candidate = plainRecord(value)
  if (
    !candidate || !isUuid(candidate.id) || candidate.bindingId !== bindingId || candidate.jobId !== jobId ||
    !isStableId(candidate.attemptId) || !isDigest(candidate.sha256) || !Number.isSafeInteger(candidate.byteLength) ||
    Number(candidate.byteLength) < 1024 || Number(candidate.byteLength) > 32 * 1024 * 1024 || candidate.mimeType !== 'video/mp4' ||
    candidate.codec !== 'h264' || candidate.pixelFormat !== 'yuv420p' || candidate.colorSpace !== 'bt709' ||
    Number(candidate.width) !== expected.width || Number(candidate.height) !== expected.height ||
    Number(candidate.fpsNumerator) !== expected.fpsNumerator || candidate.fpsDenominator !== 1 ||
    Number(candidate.durationFrames) !== expected.durationFrames || Number(candidate.sceneStartFrame) !== expected.sceneStartFrame ||
    Number(candidate.sceneEndFrame) !== expected.sceneEndFrame || !Array.isArray(candidate.frameEvidence) ||
    !isDigest(candidate.runtimeIdentityDigest) || !isDigest(candidate.attestationDigest) || !isDigest(candidate.qaEvidenceDigest) ||
    typeof candidate.createdAt !== 'string' || candidate.localCandidateOnly !== true
  ) return undefined
  const expectedFrames = [0, Math.floor((expected.durationFrames - 1) / 2), expected.durationFrames - 1]
  const frameEvidence = candidate.frameEvidence.map((value, index) => {
    const frame = plainRecord(value)
    return frame && frame.frame === expectedFrames[index] && isDigest(frame.sha256)
      ? { frame: Number(frame.frame), sha256: frame.sha256 }
      : undefined
  })
  if (frameEvidence.length !== 3 || frameEvidence.some((frame) => !frame)) return undefined
  return {
    id: candidate.id, bindingId, jobId, attemptId: candidate.attemptId,
    sha256: candidate.sha256, byteLength: Number(candidate.byteLength),
    mimeType: 'video/mp4', codec: 'h264', pixelFormat: 'yuv420p', colorSpace: 'bt709',
    width: expected.width, height: expected.height, fpsNumerator: expected.fpsNumerator,
    fpsDenominator: 1, durationFrames: expected.durationFrames,
    sceneStartFrame: expected.sceneStartFrame, sceneEndFrame: expected.sceneEndFrame,
    frameEvidence: frameEvidence as MotionStudioPreviewArtifactDto['frameEvidence'],
    runtimeIdentityDigest: candidate.runtimeIdentityDigest,
    attestationDigest: candidate.attestationDigest,
    qaEvidenceDigest: candidate.qaEvidenceDigest,
    createdAt: candidate.createdAt,
    localCandidateOnly: true,
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

function sameVersion(left: MotionStudioVersionReference, right: MotionStudioVersionReference): boolean {
  return left.artifactId === right.artifactId && left.versionId === right.versionId &&
    left.versionNumber === right.versionNumber && left.contentDigest === right.contentDigest
}

const jobStatuses = new Set(['waiting', 'queued', 'claimed', 'running', 'cancel_requested', 'reconciliation_required', 'blocked', 'succeeded', 'failed', 'cancelled'])
const previewStatuses = new Set(['queued', 'rendering', 'failed', 'reconciliation_required', 'cancelled', 'ready'])
const unsafeKeys = new Set([
  'internalcost', 'customerprice', 'customercredits', 'reeditprofee', 'wallet', 'billing',
  'leasecredential', 'credentialhash', 'privateobjectidentity', 'privateobjectpath', 'signedurl',
  'subjectbytes', 'sourceurl', 'layercode', 'providersecret', 'providerapikey', 'apikey', 'clientsecret',
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

function isPreviewFrame(width: number, height: number): boolean {
  return ['640x360', '360x640', '480x480', '480x600'].includes(`${width}x${height}`)
}

function workspaceState(workspace: MotionStudioLayeredWorkspaceDto): 'ready' | 'empty' {
  return workspace.assemblies.length ? 'ready' : 'empty'
}

function clientKey(operation: string, productionId: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `motion-studio:${operation}:${productionId}:${random}`
}
