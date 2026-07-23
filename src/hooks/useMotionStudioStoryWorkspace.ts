import { useCallback, useEffect, useRef, useState } from 'react'

import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import { motionStudioStoryWorkspaceDtoSchema } from '../lib/motion-studio/contracts'
import type { MotionStudioStoryWorkspaceDto } from '../types/motion-studio'

export type MotionStudioStoryResourceState =
  | 'inactive'
  | 'loading'
  | MotionStudioStoryWorkspaceDto['state']
  | 'permission_denied'
  | 'not_found'
  | 'conflict'
  | 'failure'

export interface UseMotionStudioStoryWorkspaceResult {
  state: MotionStudioStoryResourceState
  operation: 'idle' | 'loading' | 'refreshing'
  workspace?: MotionStudioStoryWorkspaceDto
  message?: string
  warnings: readonly string[]
  refresh: () => Promise<void>
}

const inactiveState: Omit<UseMotionStudioStoryWorkspaceResult, 'refresh'> = {
  state: 'inactive',
  operation: 'idle',
  warnings: [],
}

export function useMotionStudioStoryWorkspace(
  productionId: string | undefined,
  projectId: string,
  editSessionId: string,
  active: boolean,
): UseMotionStudioStoryWorkspaceResult {
  const [view, setView] = useState(inactiveState)
  const requestEpoch = useRef(0)

  const load = useCallback(async (refreshing = false) => {
    if (!productionId || !active) {
      setView(inactiveState)
      return
    }
    const epoch = ++requestEpoch.current
    setView((current) => refreshing && current.workspace
      ? { ...current, operation: 'refreshing', message: undefined }
      : { state: 'loading', operation: 'loading', warnings: [] })

    const response = await motionStudioApiClient.getStoryWorkspace(productionId)
    if (epoch !== requestEpoch.current) return
    if (!response.ok) {
      setView({
        state: transportState(response.statusCode),
        operation: 'idle',
        message: response.error?.message ?? 'The Story workspace could not be loaded.',
        warnings: response.warnings ?? [],
      })
      return
    }

    const parsed = motionStudioStoryWorkspaceDtoSchema.safeParse(response.data?.storyWorkspace)
    if (
      !parsed.success ||
      parsed.data.productionId !== productionId ||
      parsed.data.projectId !== projectId ||
      parsed.data.editSessionId !== editSessionId
    ) {
      setView({
        state: 'failure',
        operation: 'idle',
        message: 'The Story workspace did not match this exact Storytelling project and named edit.',
        warnings: response.warnings ?? [],
      })
      return
    }
    setView({
      state: parsed.data.state,
      operation: 'idle',
      workspace: parsed.data,
      warnings: response.warnings ?? [],
    })
  }, [active, editSessionId, productionId, projectId])

  useEffect(() => {
    const timer = globalThis.setTimeout(() => { void load() }, 0)
    return () => {
      globalThis.clearTimeout(timer)
      requestEpoch.current += 1
    }
  }, [load])

  return {
    ...view,
    refresh: async () => load(true),
  }
}

function transportState(statusCode: number): MotionStudioStoryResourceState {
  if (statusCode === 401 || statusCode === 403) return 'permission_denied'
  if (statusCode === 404) return 'not_found'
  if (statusCode === 409) return 'conflict'
  return 'failure'
}
