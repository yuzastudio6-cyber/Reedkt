import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import {
  motionStudioAudioMixWorkspaceDtoSchema,
  motionStudioAudioWorkspaceDtoSchema,
} from '../lib/motion-studio/contracts'
import type {
  MotionStudioAudioCandidateReviewSummaryDto,
  MotionStudioAudioMixBindingDto,
  MotionStudioAudioMixWorkspaceDto,
  MotionStudioAudioReviewSummaryDto,
  MotionStudioAudioWorkspaceDto,
} from '../types/motion-studio'

export type MotionStudioAudioResourceState =
  | 'inactive'
  | 'loading'
  | 'empty'
  | 'planned'
  | 'active'
  | 'resumable'
  | 'attention_required'
  | 'ready_for_private_review'
  | 'ready_for_review'
  | 'changes_requested'
  | 'rejected'
  | 'approved_locked'
  | 'stale'
  | 'permission_denied'
  | 'not_found'
  | 'conflict'
  | 'failure'

export interface MotionStudioAudioWorkspaceViewState {
  state: MotionStudioAudioResourceState
  operation: 'idle' | 'loading' | 'refreshing'
  audioWorkspace?: MotionStudioAudioWorkspaceDto
  mixWorkspace?: MotionStudioAudioMixWorkspaceDto
  message?: string
  warnings: readonly string[]
}

export interface UseMotionStudioAudioWorkspaceResult extends MotionStudioAudioWorkspaceViewState {
  acceptanceReview?: MotionStudioAudioReviewSummaryDto
  acceptanceBinding?: MotionStudioAudioMixBindingDto
  candidateReviews: readonly MotionStudioAudioCandidateReviewSummaryDto[]
  currentBinding?: MotionStudioAudioMixBindingDto
  previousBindingCount: number
  refresh: () => Promise<void>
}

const inactiveState: MotionStudioAudioWorkspaceViewState = {
  state: 'inactive',
  operation: 'idle',
  warnings: [],
}

export function useMotionStudioAudioWorkspace(
  productionId: string | undefined,
  projectId: string,
  editSessionId: string,
  active: boolean,
): UseMotionStudioAudioWorkspaceResult {
  const [view, setView] = useState<MotionStudioAudioWorkspaceViewState>(inactiveState)
  const sequence = useRef(0)

  const load = useCallback(async (refreshing = false) => {
    if (!productionId || !active) {
      setView(inactiveState)
      return
    }

    const requestSequence = ++sequence.current
    setView((current) => refreshing && (current.audioWorkspace || current.mixWorkspace)
      ? { ...current, operation: 'refreshing', message: undefined }
      : { state: 'loading', operation: 'loading', warnings: [] })

    const [audioResponse, mixResponse] = await Promise.all([
      motionStudioApiClient.getAudioWorkspace(productionId),
      motionStudioApiClient.getAudioMixWorkspace(productionId),
    ])
    if (requestSequence !== sequence.current) return

    const warnings = uniqueStrings([...audioResponse.warnings, ...mixResponse.warnings])

    if (!mixResponse.ok) {
      setView(failedResponse(
        mixResponse.statusCode,
        mixResponse.error?.message ?? 'The private audio-mix state could not be loaded.',
        warnings,
      ))
      return
    }

    const parsedMix = motionStudioAudioMixWorkspaceDtoSchema.safeParse(mixResponse.data?.audioMixWorkspace)
    if (!parsedMix.success || !validMixWorkspace(parsedMix.data, productionId, projectId, editSessionId)) {
      setView({
        state: 'failure',
        operation: 'idle',
        message: 'The audio-mix response did not match this exact Storytelling production.',
        warnings,
      })
      return
    }

    let audioWorkspace: MotionStudioAudioWorkspaceDto | undefined
    let message: string | undefined

    if (audioResponse.ok) {
      const parsedAudio = motionStudioAudioWorkspaceDtoSchema.safeParse(audioResponse.data?.audioWorkspace)
      if (
        !parsedAudio.success ||
        parsedAudio.data.productionId !== productionId ||
        parsedAudio.data.projectId !== projectId ||
        parsedAudio.data.editSessionId !== editSessionId
      ) {
        setView({
          state: 'failure',
          operation: 'idle',
          message: 'The audio-plan response did not match this exact project and named edit.',
          warnings,
        })
        return
      }
      audioWorkspace = parsedAudio.data
    } else if (audioResponse.statusCode === 404) {
      message = 'Audio direction has not been prepared for this story yet.'
    } else {
      setView(failedResponse(
        audioResponse.statusCode,
        audioResponse.error?.message ?? 'The Storytelling audio plan could not be loaded.',
        warnings,
      ))
      return
    }

    const mixWorkspace = parsedMix.data
    if ((mixWorkspace.bindings.length > 0 || (mixWorkspace.candidateReviews?.length ?? 0) > 0) && !audioWorkspace) {
      setView({
        state: 'failure',
        operation: 'idle',
        message: 'The private mix could not be matched to this story’s approved audio direction.',
        warnings,
      })
      return
    }
    if (audioWorkspace && !validMixLineage(mixWorkspace, audioWorkspace)) {
      setView({
        state: 'failure',
        operation: 'idle',
        message: 'The private mix did not match this story’s approved audio plan and timing.',
        warnings,
      })
      return
    }
    setView({
      state: resolveResourceState(audioWorkspace, mixWorkspace),
      operation: 'idle',
      ...(audioWorkspace ? { audioWorkspace } : {}),
      mixWorkspace,
      ...(message ? { message } : {}),
      warnings,
    })
  }, [active, editSessionId, productionId, projectId])

  useEffect(() => {
    const timer = globalThis.setTimeout(() => { void load() }, 0)
    return () => {
      globalThis.clearTimeout(timer)
      sequence.current += 1
    }
  }, [load])

  const orderedBindings = useMemo(
    () => [...(view.mixWorkspace?.bindings ?? [])].sort((left, right) =>
      Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [view.mixWorkspace?.bindings],
  )

  return {
    ...view,
    acceptanceReview: view.mixWorkspace?.acceptanceReview,
    acceptanceBinding: view.mixWorkspace?.acceptanceReview
      ? orderedBindings.find((binding) =>
          binding.artifact?.artifactId === view.mixWorkspace?.acceptanceReview?.mixArtifactId)
      : undefined,
    candidateReviews: view.mixWorkspace?.candidateReviews ?? [],
    currentBinding: orderedBindings[0],
    previousBindingCount: Math.max(0, orderedBindings.length - 1),
    refresh: async () => load(true),
  }
}

function validMixWorkspace(
  workspace: MotionStudioAudioMixWorkspaceDto,
  productionId: string,
  projectId: string,
  editSessionId: string,
): boolean {
  if (workspace.productionId !== productionId) return false
  if ((workspace.state === 'empty') !== (workspace.bindings.length === 0)) return false
  if (new Set(workspace.bindings.map((binding) => binding.bindingId)).size !== workspace.bindings.length) return false

  const acceptance = workspace.acceptanceReview
  const candidateReviews = workspace.candidateReviews ?? []
  if (candidateReviews.some((review) =>
    review.productionId !== productionId ||
    review.projectId !== projectId ||
    review.editSessionId !== editSessionId
  )) return false
  if (acceptance) {
    if (
      acceptance.productionId !== productionId ||
      acceptance.projectId !== projectId ||
      acceptance.editSessionId !== editSessionId
    ) return false
    const exactArtifactBinding = workspace.bindings.find((binding) =>
      binding.artifact?.artifactId === acceptance.mixArtifactId)
    if (
      !exactArtifactBinding?.artifact ||
      exactArtifactBinding.state !== 'ready_for_private_review' ||
      exactArtifactBinding.durationFrames !== acceptance.durationFrames ||
      exactArtifactBinding.fps !== acceptance.frameRate
    ) return false
    if (candidateReviews.some((review) => review.state !== 'reviewed_passed')) return false
  }

  const expectedWorkspaceState: MotionStudioAudioMixWorkspaceDto['state'] = acceptance
    ? ['ready_for_review', 'approved_locked'].includes(acceptance.state)
      ? 'ready_for_private_review'
      : 'attention_required'
    : workspace.bindings.length === 0
      ? 'empty'
      : workspace.bindings.some((binding) => binding.state === 'ready_for_private_review')
        ? 'ready_for_private_review'
        : workspace.bindings.some((binding) => ['failed', 'blocked', 'reconciliation_required'].includes(binding.state))
          ? 'attention_required'
          : 'active'
  if (workspace.state !== expectedWorkspaceState) return false

  return workspace.bindings.every((binding) => {
    if (binding.productionId !== productionId) return false
    if ((binding.state === 'ready_for_private_review') !== Boolean(binding.artifact)) return false
    if (!Number.isFinite(Date.parse(binding.createdAt))) return false
    if (new Set(binding.inputs.map((input) => input.role)).size !== 4) return false
    const expectedSampleCount = binding.durationFrames * 48_000 / binding.fps
    if (binding.sampleCountPerChannel !== expectedSampleCount) return false
    if (binding.inputs.some((input) =>
      input.sampleCountPerChannel !== expectedSampleCount ||
      input.startFrame < 0 ||
      input.endFrame > binding.durationFrames ||
      input.endFrame <= input.startFrame
    )) return false
    if (!binding.artifact) return true
    return binding.artifact.contentPath ===
      `/v1/motion-studio/audio-mix-artifacts/${binding.artifact.artifactId}/content` &&
      binding.artifact.durationFrames === binding.durationFrames &&
      binding.artifact.fps === binding.fps &&
      binding.artifact.sampleCountPerChannel === binding.sampleCountPerChannel
  })
}

function validMixLineage(
  mixWorkspace: MotionStudioAudioMixWorkspaceDto,
  audioWorkspace: MotionStudioAudioWorkspaceDto,
): boolean {
  const authority = audioWorkspace.audioAuthority
  const knownStems = new Map(authority.stems.map((stem) => [stem.stemId, stem.role]))

  return (mixWorkspace.candidateReviews ?? []).every((candidate) =>
    candidate.sourceApprovedSnapshotId === authority.approvedSnapshotId &&
    candidate.sourceApprovedSnapshotDigest === authority.approvedSnapshotDigest &&
    candidate.timingAuthorityDigest === authority.timingAuthority.timingAuthorityDigest
  ) && mixWorkspace.bindings.every((binding) =>
    binding.sourceApprovedSnapshotId === authority.approvedSnapshotId &&
    binding.mixPlanVersionId === authority.mixPlan.mixPlanArtifactVersion.versionId &&
    binding.mixPlanContentDigest === authority.mixPlan.mixPlanArtifactVersion.contentDigest &&
    binding.fps === authority.timingAuthority.frameRate &&
    binding.durationFrames === authority.timingAuthority.durationFrames &&
    binding.inputs.every((input) => knownStems.get(input.stemId) === input.role),
  )
}

function resolveResourceState(
  audioWorkspace: MotionStudioAudioWorkspaceDto | undefined,
  mixWorkspace: MotionStudioAudioMixWorkspaceDto,
): MotionStudioAudioResourceState {
  const acceptance = mixWorkspace.acceptanceReview
  if (acceptance) return acceptance.state

  const current = [...mixWorkspace.bindings].sort((left, right) =>
    Date.parse(right.createdAt) - Date.parse(left.createdAt))[0]

  if (!current) return audioWorkspace ? 'planned' : 'empty'
  if (current.state === 'ready_for_private_review') return 'ready_for_private_review'
  if (current.state === 'resumable') return 'resumable'
  if (current.state === 'queued' || current.state === 'in_progress') return 'active'
  return 'attention_required'
}

function failedResponse(
  statusCode: number,
  message: string,
  warnings: readonly string[],
): MotionStudioAudioWorkspaceViewState {
  const state: MotionStudioAudioResourceState = statusCode === 401 || statusCode === 403
    ? 'permission_denied'
    : statusCode === 404
      ? 'not_found'
      : statusCode === 409
        ? 'conflict'
        : 'failure'
  return { state, operation: 'idle', message, warnings }
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))]
}
