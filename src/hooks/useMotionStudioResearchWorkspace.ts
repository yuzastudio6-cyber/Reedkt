import { useCallback, useEffect, useRef, useState } from 'react'

import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import type { ApiResponseEnvelope } from '../backend/api/api-runtime-contracts'
import { motionStudioResearchWorkspaceDtoSchema } from '../lib/motion-studio/contracts'
import type { MotionStudioResearchWorkspaceDto } from '../types/motion-studio'

export type MotionStudioResearchViewState =
  | 'inactive'
  | MotionStudioResearchWorkspaceDto['state']
  | 'loading'
  | 'permission_denied'
  | 'unavailable'
  | 'invalid'

export interface UseMotionStudioResearchWorkspaceResult {
  state: MotionStudioResearchViewState
  operation: 'idle' | 'loading' | 'refreshing'
  workspace?: MotionStudioResearchWorkspaceDto
  message?: string
  warnings: readonly string[]
  retry: () => Promise<void>
}

const inactiveState: Omit<UseMotionStudioResearchWorkspaceResult, 'retry'> = {
  state: 'inactive',
  operation: 'idle',
  warnings: [],
}

export function useMotionStudioResearchWorkspace(
  productionId: string | undefined,
  active: boolean,
): UseMotionStudioResearchWorkspaceResult {
  const [view, setView] = useState(inactiveState)
  const requestEpoch = useRef(0)

  const load = useCallback(async (operation: 'loading' | 'refreshing') => {
    if (!active || !productionId) {
      setView(inactiveState)
      return
    }
    const epoch = ++requestEpoch.current
    setView((current) => ({
      ...current,
      state: operation === 'loading' ? 'loading' : current.state,
      operation,
      message: undefined,
    }))

    const response = await motionStudioApiClient.getResearchWorkspace(productionId)
    if (epoch !== requestEpoch.current) return
    if (!response.ok) {
      setView({
        state: transportState(response),
        operation: 'idle',
        message: response.error?.message ?? 'The Research workspace could not be loaded.',
        warnings: response.warnings ?? [],
      })
      return
    }

    const parsed = motionStudioResearchWorkspaceDtoSchema.safeParse(response.data?.researchWorkspace)
    if (!parsed.success || parsed.data.productionId !== productionId) {
      setView({
        state: 'invalid',
        operation: 'idle',
        message: 'Research returned an invalid or mismatched production record. Nothing was displayed.',
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
  }, [active, productionId])

  useEffect(() => {
    const timer = globalThis.setTimeout(() => { void load('loading') }, 0)
    return () => {
      globalThis.clearTimeout(timer)
      requestEpoch.current += 1
    }
  }, [load])

  const retry = useCallback(async () => {
    await load('refreshing')
  }, [load])

  return !active || !productionId ? { ...inactiveState, retry } : { ...view, retry }
}

function transportState(response: ApiResponseEnvelope<unknown>): MotionStudioResearchViewState {
  if (response.statusCode === 401 || response.statusCode === 403) return 'permission_denied'
  return 'unavailable'
}
