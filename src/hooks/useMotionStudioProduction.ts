import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import type { ApiResponseEnvelope } from '../backend/api/api-runtime-contracts'
import type { MotionStudioActiveModuleId, MotionStudioProductionDto, MotionStudioWorkGraphDto } from '../types/motion-studio'
import { MOTION_STUDIO_MODULE_CATALOG_VERSION } from '../lib/motion-studio/contracts'
import {
  errorResourceState,
  productionRequiresWorkGraph,
  productionResourceState,
  projectMotionStudioProduction,
  projectMotionStudioWorkGraph,
  type MotionStudioResourceState,
} from '../lib/motion-studio/shell/shell-model'

export interface MotionStudioProductionViewState {
  resourceState: MotionStudioResourceState
  production?: MotionStudioProductionDto
  workGraph?: MotionStudioWorkGraphDto
  message?: string
  warnings: readonly string[]
  operation: 'loading' | 'idle' | 'enabling' | 'refreshing'
}

export interface UseMotionStudioProductionResult extends MotionStudioProductionViewState {
  enableProduction: (moduleId: MotionStudioActiveModuleId) => Promise<void>
  retry: () => Promise<void>
  refresh: () => Promise<void>
}

const initialViewState: MotionStudioProductionViewState = {
  resourceState: 'loading',
  warnings: [],
  operation: 'loading',
}

export function useMotionStudioProduction(projectId: string, editSessionId: string): UseMotionStudioProductionResult {
  const [viewState, setViewState] = useState<MotionStudioProductionViewState>(initialViewState)
  const requestSequence = useRef(0)
  const enableIdempotencyKey = useMemo(
    () => createEnableKey(projectId, editSessionId),
    [editSessionId, projectId],
  )

  const load = useCallback(async (options: { recovery?: boolean; refreshing?: boolean } = {}) => {
    const sequence = ++requestSequence.current
    setViewState((current) => current.production && options.refreshing
      ? {
          ...current,
          operation: 'refreshing',
          message: undefined,
        }
      : initialViewState)

    const response = await motionStudioApiClient.getProduction(projectId, editSessionId)
    if (sequence !== requestSequence.current) return
    if (!response.ok) {
      setViewState((current) => current.production && options.refreshing && isTransientPrimaryReadFailure(response)
        ? {
            ...current,
            resourceState: 'partial_result',
            message: 'The refresh could not confirm newer backend authority. Showing the last verified production and job status until you retry.',
            warnings: mergeWarnings(current.warnings, response.warnings),
            operation: 'idle',
          }
        : stateFromError(response))
      return
    }

    const production = projectMotionStudioProduction(response.data?.production)
    if (!production || production.projectId !== projectId || production.editSessionId !== editSessionId) {
      setViewState(invalidResponseState('The backend returned a production that did not match this project and named edit.'))
      return
    }

    let workGraph: MotionStudioWorkGraphDto | undefined
    let partialMessage: string | undefined
    let warnings = response.warnings
    if (productionRequiresWorkGraph(production)) {
      const graphResponse = await motionStudioApiClient.getWorkGraph(production.id)
      if (sequence !== requestSequence.current) return
      if (graphResponse.ok) {
        workGraph = projectMotionStudioWorkGraph(graphResponse.data?.workGraph)
        if (!workGraph || workGraph.productionId !== production.id) {
          partialMessage = 'Production loaded, but its execution summary did not match the active production.'
        }
      } else {
        partialMessage = graphResponse.error?.message ?? 'Production loaded, but its execution summary is temporarily unavailable.'
        warnings = [...warnings, ...graphResponse.warnings]
      }
    }

    setViewState({
      resourceState: partialMessage ? 'partial_result' : options.recovery ? 'recovery' : productionResourceState(production),
      production,
      ...(workGraph ? { workGraph } : {}),
      ...(partialMessage ? { message: partialMessage } : {}),
      warnings,
      operation: 'idle',
    })
  }, [editSessionId, projectId])

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void load()
    }, 0)
    return () => {
      globalThis.clearTimeout(timer)
      requestSequence.current += 1
    }
  }, [load])

  const enableProduction = useCallback(async (moduleId: MotionStudioActiveModuleId) => {
    if (moduleId !== 'storytelling') return
    const sequence = ++requestSequence.current
    setViewState({ resourceState: 'loading', warnings: [], operation: 'enabling' })
    const response = await motionStudioApiClient.createProduction(
      projectId,
      editSessionId,
      { moduleId, moduleCatalogVersion: MOTION_STUDIO_MODULE_CATALOG_VERSION },
      enableIdempotencyKey,
    )
    if (sequence !== requestSequence.current) return

    if (!response.ok) {
      setViewState(stateFromError(response))
      return
    }

    const production = projectMotionStudioProduction(response.data?.production)
    if (!production || production.projectId !== projectId || production.editSessionId !== editSessionId) {
      setViewState(invalidResponseState('The backend did not return the exact production that was enabled.'))
      return
    }

    setViewState({
      resourceState: productionResourceState(production),
      production,
      warnings: response.warnings,
      operation: 'idle',
    })
  }, [editSessionId, enableIdempotencyKey, projectId])

  const retry = useCallback(async () => {
    await load({ recovery: true, refreshing: true })
  }, [load])

  const refresh = useCallback(async () => {
    await load({ refreshing: true })
  }, [load])

  return { ...viewState, enableProduction, retry, refresh }
}

function stateFromError(response: ApiResponseEnvelope<unknown>): MotionStudioProductionViewState {
  return {
    resourceState: errorResourceState(response),
    message: response.error?.message ?? 'Motion Studio could not load this production.',
    warnings: response.warnings,
    operation: 'idle',
  }
}

function invalidResponseState(message: string): MotionStudioProductionViewState {
  return {
    resourceState: 'failure',
    message,
    warnings: [],
    operation: 'idle',
  }
}

function isTransientPrimaryReadFailure(response: ApiResponseEnvelope<unknown>): boolean {
  return response.statusCode === 408 ||
    response.statusCode === 429 ||
    response.statusCode >= 500 ||
    response.error?.code === 'http_transport_failed'
}

function mergeWarnings(current: readonly string[], incoming: readonly string[]): string[] {
  return [...new Set([...current, ...incoming])]
}

function createEnableKey(projectId: string, editSessionId: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `motion-studio-enable:${projectId}:${editSessionId}:${random}`
}
