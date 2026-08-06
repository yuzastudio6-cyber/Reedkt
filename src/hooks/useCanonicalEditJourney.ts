import { useCallback, useEffect, useReducer } from 'react'
import {
  readCanonicalEditJourney,
  type CanonicalEditJourneyClientResult,
} from '../lib/canonical-edit-journey-client'
import { canonicalJourneyShouldAutoRefresh } from '../lib/canonical-edit-journey'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'
import {
  professionalLongFormCustomerDeliveryShouldAutoRefresh,
} from '../lib/professional-long-form-customer-delivery-client'

type CanonicalEditJourneyHookState = {
  identityKey: string | null
  loading: boolean
  refreshing: boolean
  requestVersion: number
  result: CanonicalEditJourneyClientResult | null
  updatedAt: string | null
}

type CanonicalEditJourneyHookAction =
  | { type: 'disable' }
  | { type: 'start'; identityKey: string }
  | { type: 'request' }
  | { type: 'resolve'; identityKey: string; result: CanonicalEditJourneyClientResult; updatedAt: string }

export type CanonicalEditJourneyHookResult = Omit<CanonicalEditJourneyHookState, 'identityKey' | 'requestVersion'> & {
  refresh: () => void
}

const initialState: CanonicalEditJourneyHookState = {
  identityKey: null,
  loading: false,
  refreshing: false,
  requestVersion: 0,
  result: null,
  updatedAt: null,
}

export function useCanonicalEditJourney({
  editSessionId,
  enabled,
  projectId,
  scope,
}: {
  editSessionId: string
  enabled: boolean
  projectId: string
  scope: ProjectPersistenceScope
}): CanonicalEditJourneyHookResult {
  const [state, dispatch] = useReducer(reducer, initialState)
  const refresh = useCallback(() => dispatch({ type: 'request' }), [])
  const { authMode, backendUserId, userId, workspaceId } = scope
  const identityKey = JSON.stringify([
    authMode,
    userId,
    backendUserId ?? '',
    workspaceId,
    projectId,
    editSessionId,
  ])

  useEffect(() => {
    if (!enabled) {
      dispatch({ type: 'disable' })
      return
    }

    let active = true
    dispatch({ type: 'start', identityKey })
    void readCanonicalEditJourney({ authMode, backendUserId, userId, workspaceId }, projectId, editSessionId)
      .then((result) => {
        if (!active) return
        dispatch({ type: 'resolve', identityKey, result, updatedAt: new Date().toISOString() })
      })
      .catch(() => {
        if (!active) return
        dispatch({
          type: 'resolve',
          identityKey,
          updatedAt: new Date().toISOString(),
          result: {
            status: 'unavailable',
            retryable: true,
            message: 'The saved workflow could not be refreshed from the private backend.',
            warnings: [],
          },
        })
      })

    return () => {
      active = false
    }
  }, [authMode, backendUserId, editSessionId, enabled, identityKey, projectId, state.requestVersion, userId, workspaceId])

  useEffect(() => {
    if (
      !enabled ||
      state.refreshing ||
      state.result?.status !== 'ready' ||
      !(
        canonicalJourneyShouldAutoRefresh(state.result.journey.stage) ||
        professionalLongFormCustomerDeliveryShouldAutoRefresh(
          state.result.customerDelivery,
        )
      )
    ) {
      return
    }

    let timeout: number | undefined
    const clearRefresh = () => {
      if (timeout !== undefined) window.clearTimeout(timeout)
      timeout = undefined
    }
    const scheduleRefresh = () => {
      clearRefresh()
      if (document.visibilityState === 'visible') {
        timeout = window.setTimeout(refresh, 6_000)
      }
    }
    const handleVisibilityChange = () => {
      clearRefresh()
      if (document.visibilityState === 'visible') refresh()
    }

    scheduleRefresh()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      clearRefresh()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, refresh, state.refreshing, state.result])

  const identityIsCurrent = enabled && state.identityKey === identityKey

  return {
    loading: enabled && (!identityIsCurrent || state.loading),
    refreshing: identityIsCurrent ? state.refreshing : false,
    result: identityIsCurrent ? state.result : null,
    updatedAt: identityIsCurrent ? state.updatedAt : null,
    refresh,
  }
}

function reducer(
  state: CanonicalEditJourneyHookState,
  action: CanonicalEditJourneyHookAction,
): CanonicalEditJourneyHookState {
  switch (action.type) {
    case 'disable':
      return initialState
    case 'start':
      if (state.identityKey !== action.identityKey) {
        return {
          identityKey: action.identityKey,
          loading: true,
          refreshing: false,
          requestVersion: state.requestVersion,
          result: null,
          updatedAt: null,
        }
      }
      return {
        ...state,
        loading: state.result === null,
        refreshing: state.result !== null,
      }
    case 'request':
      return {
        ...state,
        loading: state.result === null,
        refreshing: state.result !== null,
        requestVersion: state.requestVersion + 1,
      }
    case 'resolve':
      if (state.identityKey !== action.identityKey) return state
      return {
        ...state,
        loading: false,
        refreshing: false,
        result: action.result,
        updatedAt: action.updatedAt,
      }
  }
}
