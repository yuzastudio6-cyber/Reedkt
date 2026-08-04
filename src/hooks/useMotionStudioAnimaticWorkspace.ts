import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ApiResponseEnvelope } from '../backend/api/api-runtime-contracts'
import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import type {
  MotionStudioAnimaticArtifactDto,
  MotionStudioAnimaticAssemblyReceiptDto,
  MotionStudioAnimaticBindingDto,
  MotionStudioAnimaticWorkspaceDto,
  MotionStudioVersionReference,
  MotionStudioWorkGraphDto,
} from '../types/motion-studio'

export type MotionStudioAnimaticResourceState =
  | 'inactive'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'failure'
  | 'permission_denied'
  | 'conflict'

export interface MotionStudioAnimaticWorkspaceViewState {
  state: MotionStudioAnimaticResourceState
  operation: 'idle' | 'loading' | 'refreshing' | 'binding'
  workspace?: MotionStudioAnimaticWorkspaceDto
  message?: string
  warnings: readonly string[]
}

export interface UseMotionStudioAnimaticWorkspaceResult extends MotionStudioAnimaticWorkspaceViewState {
  requestableAssemblyVersionIds: readonly string[]
  refresh: () => Promise<void>
  requestRender: (assembly: MotionStudioAnimaticAssemblyReceiptDto) => Promise<boolean>
}

const inactiveState: MotionStudioAnimaticWorkspaceViewState = {
  state: 'inactive', operation: 'idle', warnings: [],
}

export function useMotionStudioAnimaticWorkspace(
  productionId: string | undefined,
  active: boolean,
  workGraph?: MotionStudioWorkGraphDto,
): UseMotionStudioAnimaticWorkspaceResult {
  const [view, setView] = useState<MotionStudioAnimaticWorkspaceViewState>(inactiveState)
  const sequence = useRef(0)
  const bindingKeys = useRef(new Map<string, string>())

  const load = useCallback(async (refreshing = false) => {
    if (!productionId || !active) {
      setView(inactiveState)
      return
    }
    const requestSequence = ++sequence.current
    setView((current) => refreshing && current.workspace
      ? { ...current, operation: 'refreshing', message: undefined }
      : { state: 'loading', operation: 'loading', warnings: [] })
    const response = await motionStudioApiClient.getAnimaticWorkspace(productionId)
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

  const requestRender = useCallback(async (assembly: MotionStudioAnimaticAssemblyReceiptDto) => {
    if (!productionId || !active || !workGraph || !view.workspace) return false
    const boundJobIds = new Set(view.workspace.bindings.map((binding) => binding.jobId))
    const job = workGraph.jobs.find((candidate) =>
      candidate.approvedSnapshotId === assembly.approvedSnapshotId &&
      candidate.workItemType === 'render_motion_studio_animatic' &&
      candidate.status === 'queued' &&
      !boundJobIds.has(candidate.id))
    if (!job) {
      setView((current) => ({
        ...current,
        message: 'Animatic render authority is not ready. Approve the exact animatic and authorize its internal estimate and work item first.',
      }))
      return false
    }
    const replayIdentity = `${assembly.animatic.versionId}:${job.id}`
    const idempotencyKey = bindingKeys.current.get(replayIdentity) ?? clientKey('animatic-binding', productionId)
    bindingKeys.current.set(replayIdentity, idempotencyKey)
    const requestSequence = ++sequence.current
    setView((current) => ({ ...current, operation: 'binding', message: undefined }))
    const response = await motionStudioApiClient.createAnimaticBinding(productionId, {
      approvedSnapshotId: assembly.approvedSnapshotId,
      animaticArtifactId: assembly.animatic.artifactId,
      animaticVersionId: assembly.animatic.versionId,
      animaticContentDigest: assembly.animatic.contentDigest,
      jobId: job.id,
    }, idempotencyKey)
    if (requestSequence !== sequence.current) return false
    if (!response.ok) {
      setView((current) => ({
        ...current,
        operation: 'idle',
        message: response.error?.message ?? 'The exact animatic render binding could not be created.',
        warnings: [...current.warnings, ...response.warnings],
      }))
      return false
    }
    const workspace = projectAnimaticWorkspace(response.data?.animaticWorkspace, productionId)
    if (!workspace) {
      setView((current) => ({
        ...current, operation: 'idle',
        message: 'The backend returned an animatic workspace outside this production authority.',
      }))
      return false
    }
    bindingKeys.current.delete(replayIdentity)
    setView({
      state: workspaceState(workspace), operation: 'idle', workspace,
      message: 'Private timing-review work is queued under the approved snapshot and internal cost authority.',
      warnings: response.warnings,
    })
    return true
  }, [active, productionId, view.workspace, workGraph])

  const requestableAssemblyVersionIds = useMemo(() => {
    if (!workGraph || !view.workspace) return []
    const boundJobIds = new Set(view.workspace.bindings.map((binding) => binding.jobId))
    const hasQueuedJob = (approvedSnapshotId: string) => workGraph.jobs.some((job) =>
      job.approvedSnapshotId === approvedSnapshotId &&
      job.workItemType === 'render_motion_studio_animatic' &&
      job.status === 'queued' &&
      !boundJobIds.has(job.id))
    return view.workspace.assemblies
      .filter((assembly) =>
        !view.workspace?.bindings.some((binding) => binding.animatic.versionId === assembly.animatic.versionId) &&
        hasQueuedJob(assembly.approvedSnapshotId))
      .map((assembly) => assembly.animatic.versionId)
  }, [view.workspace, workGraph])

  return {
    ...view,
    requestableAssemblyVersionIds,
    refresh: async () => load(true),
    requestRender,
  }
}

function commitResponse(
  response: ApiResponseEnvelope<{ animaticWorkspace: MotionStudioAnimaticWorkspaceDto }>,
  productionId: string,
  setView: (state: MotionStudioAnimaticWorkspaceViewState) => void,
): void {
  if (!response.ok) {
    setView({
      state: response.statusCode === 403 ? 'permission_denied' : response.statusCode === 409 ? 'conflict' : 'failure',
      operation: 'idle',
      message: response.error?.message ?? 'The animatic workspace could not be loaded.',
      warnings: response.warnings,
    })
    return
  }
  const workspace = projectAnimaticWorkspace(response.data?.animaticWorkspace, productionId)
  if (!workspace) {
    setView({
      state: 'failure', operation: 'idle',
      message: 'The backend returned an animatic workspace outside this production authority.',
      warnings: response.warnings,
    })
    return
  }
  setView({ state: workspaceState(workspace), operation: 'idle', workspace, warnings: response.warnings })
}

function projectAnimaticWorkspace(value: unknown, productionId: string): MotionStudioAnimaticWorkspaceDto | undefined {
  if (containsUnsafeProjectionKey(value)) return undefined
  const candidate = plainRecord(value)
  if (!candidate || candidate.productionId !== productionId || candidate.localCandidateOnly !== true) return undefined
  if (!Array.isArray(candidate.assemblies) || !Array.isArray(candidate.bindings)) return undefined
  const assemblies = candidate.assemblies.map((assembly) => projectAssembly(assembly, productionId))
  const bindings = candidate.bindings.map((binding) => projectBinding(binding, productionId))
  if (assemblies.some((assembly) => !assembly) || bindings.some((binding) => !binding)) return undefined
  return {
    productionId,
    assemblies: assemblies as MotionStudioAnimaticAssemblyReceiptDto[],
    bindings: bindings as MotionStudioAnimaticBindingDto[],
    localCandidateOnly: true,
  }
}

function projectAssembly(value: unknown, productionId: string): MotionStudioAnimaticAssemblyReceiptDto | undefined {
  const candidate = plainRecord(value)
  if (!candidate || candidate.productionId !== productionId || !isUuid(candidate.approvedSnapshotId)) return undefined
  const preparedScript = projectVersion(candidate.preparedScript)
  const voiceBible = projectVersion(candidate.voiceBible)
  const storyboard = projectVersion(candidate.storyboard)
  const animatic = projectVersion(candidate.animatic)
  if (!preparedScript || !voiceBible || !storyboard || !animatic || !isDigest(candidate.narrationAuthorityDigest)) return undefined
  if (candidate.localCandidateOnly !== true) return undefined
  return {
    productionId,
    approvedSnapshotId: candidate.approvedSnapshotId,
    preparedScript, voiceBible, storyboard, animatic,
    narrationAuthorityDigest: candidate.narrationAuthorityDigest,
    localCandidateOnly: true,
  }
}

function projectBinding(value: unknown, productionId: string): MotionStudioAnimaticBindingDto | undefined {
  const candidate = plainRecord(value)
  const preparedScript = projectVersion(candidate?.preparedScript)
  const voiceBible = projectVersion(candidate?.voiceBible)
  const storyboard = projectVersion(candidate?.storyboard)
  const animatic = projectVersion(candidate?.animatic)
  if (
    !candidate || !isUuid(candidate.id) || candidate.productionId !== productionId ||
    !isUuid(candidate.approvedSnapshotId) || !preparedScript || !voiceBible || !storyboard || !animatic ||
    !isDigest(candidate.narrationAuthorityDigest) || !isStableId(candidate.jobId) || !isUuid(candidate.approvedWorkItemId) ||
    !isPreviewFrame(Number(candidate.width), Number(candidate.height)) || ![24, 30].includes(Number(candidate.fpsNumerator)) ||
    candidate.fpsDenominator !== 1 || !Number.isSafeInteger(candidate.renderedFrameCount) ||
    Number(candidate.renderedFrameCount) < 24 || Number(candidate.renderedFrameCount) > 900 ||
    !Number.isSafeInteger(candidate.sceneCount) || Number(candidate.sceneCount) < 1 || Number(candidate.sceneCount) > 8 ||
    !previewStatuses.has(String(candidate.status)) ||
    (candidate.failureCategory !== undefined && !isStableId(candidate.failureCategory)) ||
    (candidate.currentAttemptId !== undefined && !isStableId(candidate.currentAttemptId)) ||
    typeof candidate.createdAt !== 'string' || candidate.localCandidateOnly !== true
  ) return undefined
  const artifact = candidate.artifact === undefined
    ? undefined
    : projectArtifact(candidate.artifact, candidate.id, candidate.jobId, {
      width: Number(candidate.width), height: Number(candidate.height), fpsNumerator: Number(candidate.fpsNumerator),
      renderedFrameCount: Number(candidate.renderedFrameCount),
    })
  if (candidate.artifact !== undefined && !artifact) return undefined
  if ((candidate.status === 'ready') !== Boolean(artifact)) return undefined
  return {
    id: candidate.id,
    productionId,
    approvedSnapshotId: candidate.approvedSnapshotId,
    preparedScript, voiceBible, storyboard, animatic,
    narrationAuthorityDigest: candidate.narrationAuthorityDigest,
    jobId: candidate.jobId,
    approvedWorkItemId: candidate.approvedWorkItemId,
    width: Number(candidate.width),
    height: Number(candidate.height),
    fpsNumerator: Number(candidate.fpsNumerator) as 24 | 30,
    fpsDenominator: 1,
    renderedFrameCount: Number(candidate.renderedFrameCount),
    sceneCount: Number(candidate.sceneCount),
    status: candidate.status as MotionStudioAnimaticBindingDto['status'],
    ...(typeof candidate.failureCategory === 'string' ? { failureCategory: candidate.failureCategory } : {}),
    ...(typeof candidate.currentAttemptId === 'string' ? { currentAttemptId: candidate.currentAttemptId } : {}),
    ...(artifact ? { artifact } : {}),
    createdAt: candidate.createdAt,
    localCandidateOnly: true,
  }
}

function projectArtifact(
  value: unknown,
  bindingId: string,
  jobId: string,
  expected: { width: number; height: number; fpsNumerator: number; renderedFrameCount: number },
): MotionStudioAnimaticArtifactDto | undefined {
  const candidate = plainRecord(value)
  if (
    !candidate || !isUuid(candidate.id) || candidate.bindingId !== bindingId || candidate.jobId !== jobId ||
    !isStableId(candidate.attemptId) || !isDigest(candidate.sha256) || !Number.isSafeInteger(candidate.byteLength) ||
    Number(candidate.byteLength) < 1024 || Number(candidate.byteLength) > 32 * 1024 * 1024 ||
    candidate.mimeType !== 'video/mp4' || candidate.codec !== 'h264' || candidate.pixelFormat !== 'yuv420p' ||
    candidate.colorSpace !== 'bt709' || candidate.audioCodec !== 'aac' || candidate.audioSampleRateHertz !== 48_000 ||
    ![1, 2].includes(Number(candidate.audioChannelCount)) || Number(candidate.width) !== expected.width ||
    Number(candidate.height) !== expected.height || Number(candidate.fpsNumerator) !== expected.fpsNumerator ||
    candidate.fpsDenominator !== 1 || Number(candidate.renderedFrameCount) !== expected.renderedFrameCount ||
    !Array.isArray(candidate.frameEvidence) || !isDigest(candidate.runtimeIdentityDigest) ||
    !isDigest(candidate.attestationDigest) || !isDigest(candidate.qaEvidenceDigest) ||
    typeof candidate.createdAt !== 'string' || candidate.localCandidateOnly !== true
  ) return undefined
  const expectedFrames = [0, Math.floor((expected.renderedFrameCount - 1) / 2), expected.renderedFrameCount - 1]
  const frameEvidence = candidate.frameEvidence.map((value, index) => {
    const frame = plainRecord(value)
    return frame && frame.frame === expectedFrames[index] && isDigest(frame.sha256)
      ? { frame: Number(frame.frame), sha256: frame.sha256 }
      : undefined
  })
  if (frameEvidence.length !== 3 || frameEvidence.some((frame) => !frame)) return undefined
  return {
    id: candidate.id,
    bindingId,
    jobId,
    attemptId: candidate.attemptId,
    sha256: candidate.sha256,
    byteLength: Number(candidate.byteLength),
    mimeType: 'video/mp4', codec: 'h264', pixelFormat: 'yuv420p', colorSpace: 'bt709',
    audioCodec: 'aac', audioSampleRateHertz: 48_000, audioChannelCount: Number(candidate.audioChannelCount),
    width: expected.width, height: expected.height,
    fpsNumerator: expected.fpsNumerator as 24 | 30, fpsDenominator: 1,
    renderedFrameCount: expected.renderedFrameCount,
    frameEvidence: frameEvidence as MotionStudioAnimaticArtifactDto['frameEvidence'],
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

const previewStatuses = new Set(['queued', 'rendering', 'failed', 'reconciliation_required', 'cancelled', 'ready'])
const unsafeKeys = new Set([
  'internalcost', 'customerprice', 'customercredits', 'reeditprofee', 'wallet', 'billing',
  'leasecredential', 'credentialhash', 'privateobjectidentity', 'privateobjectpath', 'signedurl',
  'narrationbytes', 'providertoken', 'providersecret', 'apikey', 'clientsecret',
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

function workspaceState(workspace: MotionStudioAnimaticWorkspaceDto): 'ready' | 'empty' {
  return workspace.assemblies.length || workspace.bindings.length ? 'ready' : 'empty'
}

function clientKey(operation: string, productionId: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `motion-studio:${operation}:${productionId}:${random}`
}
