import { useCallback, useEffect, useRef, useState } from 'react'

import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import {
  motionStudioNarratorPlanningSelectionReceiptDtoSchema,
  motionStudioVoiceCastingWorkspaceDtoSchema,
} from '../lib/motion-studio/contracts'
import type {
  MotionStudioVoiceCastingWorkspaceDto,
  SelectMotionStudioNarratorForPlanningRequest,
} from '../types/motion-studio'

export type MotionStudioVoiceCastingResourceState =
  | 'inactive'
  | 'loading'
  | MotionStudioVoiceCastingWorkspaceDto['state']
  | 'permission_denied'
  | 'not_found'
  | 'conflict'
  | 'failure'

export interface UseMotionStudioVoiceCastingWorkspaceResult {
  state: MotionStudioVoiceCastingResourceState
  operation: 'idle' | 'loading' | 'refreshing' | 'saving'
  workspace?: MotionStudioVoiceCastingWorkspaceDto
  message?: string
  warnings: readonly string[]
  refresh: () => Promise<void>
  selectCandidate: (candidateReference: string) => Promise<boolean>
}

const inactiveState: Pick<UseMotionStudioVoiceCastingWorkspaceResult, 'state' | 'operation' | 'warnings'> = {
  state: 'inactive',
  operation: 'idle',
  warnings: [],
}

export function useMotionStudioVoiceCastingWorkspace(
  productionId: string | undefined,
  projectId: string,
  editSessionId: string,
  active: boolean,
): UseMotionStudioVoiceCastingWorkspaceResult {
  const [view, setView] = useState<Omit<UseMotionStudioVoiceCastingWorkspaceResult, 'refresh' | 'selectCandidate'>>(inactiveState)
  const sequence = useRef(0)
  const replayKeys = useRef(new Map<string, string>())

  const load = useCallback(async (refreshing = false) => {
    if (!productionId || !active) {
      setView(inactiveState)
      return
    }
    const requestSequence = ++sequence.current
    setView((current) => refreshing && current.workspace
      ? { ...current, operation: 'refreshing', message: undefined }
      : { state: 'loading', operation: 'loading', warnings: [] })
    const response = await motionStudioApiClient.getVoiceCastingWorkspace(productionId)
    if (requestSequence !== sequence.current) return
    if (!response.ok) {
      setView(failedResponse(
        response.statusCode,
        response.error?.message ?? 'Narrator direction could not be loaded.',
        response.warnings,
      ))
      return
    }
    const parsed = motionStudioVoiceCastingWorkspaceDtoSchema.safeParse(response.data?.voiceCastingWorkspace)
    if (!parsed.success || !validWorkspace(parsed.data, productionId, projectId, editSessionId)) {
      setView({
        state: 'failure',
        operation: 'idle',
        message: 'Narrator direction did not match this exact Storytelling project and named edit.',
        warnings: response.warnings,
      })
      return
    }
    setView({ state: parsed.data.state, operation: 'idle', workspace: parsed.data, warnings: response.warnings })
  }, [active, editSessionId, productionId, projectId])

  useEffect(() => {
    const timer = globalThis.setTimeout(() => { void load() }, 0)
    return () => {
      globalThis.clearTimeout(timer)
      sequence.current += 1
    }
  }, [load])

  const selectCandidate = useCallback(async (candidateReference: string): Promise<boolean> => {
    const workspace = view.workspace
    const draft = workspace?.voiceBible?.currentDraftVersion
    if (
      !productionId || !active || !workspace?.selectionAllowed ||
      !workspace.catalogVersion || !draft ||
      !workspace.candidates.some((candidate) => candidate.candidateReference === candidateReference)
    ) return false

    const request: SelectMotionStudioNarratorForPlanningRequest = {
      candidateReference,
      catalogVersion: workspace.catalogVersion,
      voiceBibleBaseVersionId: draft.versionId,
      voiceBibleBaseVersionDigest: draft.contentDigest,
    }
    const replayIdentity = [draft.versionId, draft.contentDigest, workspace.catalogVersion, candidateReference].join(':')
    const idempotencyKey = replayKeys.current.get(replayIdentity) ?? clientKey('voice-casting', productionId)
    replayKeys.current.set(replayIdentity, idempotencyKey)
    const requestSequence = ++sequence.current
    setView((current) => ({ ...current, operation: 'saving', message: undefined }))
    const response = await motionStudioApiClient.selectNarratorForPlanning(
      productionId,
      request,
      idempotencyKey,
    )
    if (requestSequence !== sequence.current) return false
    if (!response.ok) {
      setView((current) => ({
        ...current,
        ...failedResponse(
          response.statusCode,
          response.error?.message ?? 'Narrator direction could not be saved.',
          uniqueStrings([...current.warnings, ...response.warnings]),
        ),
        workspace: current.workspace,
      }))
      return false
    }
    const parsed = motionStudioNarratorPlanningSelectionReceiptDtoSchema.safeParse(response.data?.receipt)
    if (
      !parsed.success ||
      !validWorkspace(parsed.data.workspace, productionId, projectId, editSessionId) ||
      parsed.data.workspace.selectedCandidateReference !== candidateReference ||
      parsed.data.planApproved || parsed.data.providerCallMade || parsed.data.speechGenerated ||
      parsed.data.customerCreditsChanged
    ) {
      setView((current) => ({
        ...current,
        state: 'failure',
        operation: 'idle',
        message: 'Narrator direction could not be verified after saving. No generation was started.',
      }))
      return false
    }
    replayKeys.current.delete(replayIdentity)
    setView({
      state: parsed.data.workspace.state,
      operation: 'idle',
      workspace: parsed.data.workspace,
      message: 'Narrator direction saved to the Voice Bible draft.',
      warnings: uniqueStrings([...view.warnings, ...response.warnings]),
    })
    return true
  }, [active, editSessionId, productionId, projectId, view.warnings, view.workspace])

  return {
    ...view,
    refresh: async () => load(true),
    selectCandidate,
  }
}

function validWorkspace(
  workspace: MotionStudioVoiceCastingWorkspaceDto,
  productionId: string,
  projectId: string,
  editSessionId: string,
): boolean {
  return workspace.productionId === productionId &&
    workspace.projectId === projectId &&
    workspace.editSessionId === editSessionId &&
    new Set(workspace.candidates.map((candidate) => candidate.candidateReference)).size === workspace.candidates.length
}

function failedResponse(
  statusCode: number,
  message: string,
  warnings: readonly string[],
): Omit<UseMotionStudioVoiceCastingWorkspaceResult, 'refresh' | 'selectCandidate'> {
  const state: MotionStudioVoiceCastingResourceState = statusCode === 401 || statusCode === 403
    ? 'permission_denied'
    : statusCode === 404
      ? 'not_found'
      : statusCode === 409
        ? 'conflict'
        : 'failure'
  return { state, operation: 'idle', message, warnings }
}

function clientKey(operation: string, productionId: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `motion-studio:${operation}:${productionId}:${random}`
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}
