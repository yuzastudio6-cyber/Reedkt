import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'

import { useProjectPersistenceScope } from './useProjectPersistenceScope'
import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import {
  migrateRetainedStorytellingWorkflowFromBackend,
  readLocalInternalProjectHandoffFromBackend,
} from '../lib/internal-edit-state-backend-sync'
import {
  getInternalEditPersistenceStatus,
  getLocalInternalEditHandoff,
  retryInternalEditPersistence,
  saveLocalInternalProjectHandoff,
  subscribeInternalEditPersistenceStatus,
  updateLocalInternalEditHandoff,
  type InternalEditPersistenceStatus,
  type LocalInternalProjectHandoff,
} from '../lib/local-project-handoff'
import {
  isMotionStudioStorytellingHandoff,
  isRetainedLegacyMotionStudioStorytellingMigrationCandidate,
  isVerifiedMotionStudioStorytellingProductionAssociation,
} from '../lib/motion-studio/contracts/storytelling-workflow'
import { projectMotionStudioProduction } from '../lib/motion-studio/shell/shell-model'

export type MotionStudioStorytellingHandoffState =
  | 'loading'
  | 'ready'
  | 'not_found'
  | 'not_storytelling'
  | 'access_denied'
  | 'unavailable'
  | 'invalid_response'

export interface UseMotionStudioStorytellingWorkspaceHandoffResult {
  handoff?: LocalInternalProjectHandoff
  message?: string
  persistenceStatus: InternalEditPersistenceStatus
  retry: () => void
  retryPersistence: () => void
  state: MotionStudioStorytellingHandoffState
  updateHandoff: (
    patch: Partial<Omit<
      LocalInternalProjectHandoff,
      'id' | 'projectId' | 'editSessionId' | 'createdAt' | 'persistence'
    >>,
  ) => LocalInternalProjectHandoff | undefined
}

/**
 * Recovers one exact Project/Edit handoff for the dedicated Storytelling
 * route. Signed-in workspace reads are backend-reverified; browser-local data
 * is used directly only by the explicit local-test auth mode.
 */
export function useMotionStudioStorytellingWorkspaceHandoff(
  projectId: string,
  editSessionId: string,
): UseMotionStudioStorytellingWorkspaceHandoffResult {
  const scope = useProjectPersistenceScope()
  const [generation, setGeneration] = useState(0)
  const [result, setResult] = useState<{
    handoff?: LocalInternalProjectHandoff
    message?: string
    state: MotionStudioStorytellingHandoffState
  }>({ state: 'loading' })

  const subscribePersistence = useCallback(
    (listener: () => void) => subscribeInternalEditPersistenceStatus(
      scope,
      projectId,
      editSessionId,
      listener,
    ),
    [editSessionId, projectId, scope],
  )
  const getPersistenceSnapshot = useCallback(
    () => getInternalEditPersistenceStatus(scope, projectId, editSessionId),
    [editSessionId, projectId, scope],
  )
  const persistenceStatus = useSyncExternalStore(
    subscribePersistence,
    getPersistenceSnapshot,
    getPersistenceSnapshot,
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      setResult({ state: 'loading' })
      let handoff: LocalInternalProjectHandoff | undefined

      if (scope.authMode === 'local_test') {
        handoff = getLocalInternalEditHandoff(scope, projectId, editSessionId)
        if (!handoff) {
          if (!cancelled) {
            setResult({
              state: 'not_found',
              message: 'This Storytelling edit is not saved in the current local-test workspace.',
            })
          }
          return
        }
      } else {
        const backendResult = await readLocalInternalProjectHandoffFromBackend(
          scope,
          projectId,
          editSessionId,
        )
        if (backendResult.status !== 'found') {
          if (!cancelled) {
            setResult({
              state: backendResult.status,
              message: backendResult.errorMessage,
            })
          }
          return
        }
        handoff = backendResult.handoff
      }

      if (
        !isMotionStudioStorytellingHandoff(handoff) &&
        scope.authMode === 'supabase' &&
        isRetainedLegacyMotionStudioStorytellingMigrationCandidate(handoff)
      ) {
        const migration = await migrateRetainedStorytellingWorkflowFromBackend(scope, handoff)
        if (migration.status !== 'found') {
          if (!cancelled) {
            setResult({
              state: migration.status,
              message: migration.errorMessage,
            })
          }
          return
        }
        handoff = migration.handoff
      }

      const verified = await verifyStorytellingWorkspace(handoff)
      if (cancelled) return
      if (verified.state === 'ready') {
        saveLocalInternalProjectHandoff(scope, handoff, { syncBackend: false })
      }
      setResult(verified)
    })()
      .catch(() => {
        if (!cancelled) {
          setResult({
            state: 'unavailable',
            message: 'The exact Storytelling edit could not be recovered. No browser-only result was assumed.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [editSessionId, generation, projectId, scope])

  const updateHandoff = useCallback((patch: Partial<Omit<
    LocalInternalProjectHandoff,
    'id' | 'projectId' | 'editSessionId' | 'createdAt' | 'persistence'
  >>) => {
    if (result.state !== 'ready' || !result.handoff) return undefined
    const updated = updateLocalInternalEditHandoff(
      scope,
      projectId,
      editSessionId,
      patch,
    )
    if (updated) setResult({ state: 'ready', handoff: updated })
    return updated
  }, [editSessionId, projectId, result, scope])

  return useMemo(() => ({
    ...result,
    persistenceStatus,
    retry: () => setGeneration((current) => current + 1),
    retryPersistence: () => {
      retryInternalEditPersistence(scope, projectId, editSessionId)
    },
    updateHandoff,
  }), [editSessionId, persistenceStatus, projectId, result, scope, updateHandoff])
}

function classifyHandoff(
  handoff: LocalInternalProjectHandoff,
): {
  handoff?: LocalInternalProjectHandoff
  message?: string
  state: MotionStudioStorytellingHandoffState
} {
  if (!isMotionStudioStorytellingHandoff(handoff as LocalInternalProjectHandoff & {
    productWorkflow?: unknown
  })) {
    return {
      state: 'not_storytelling',
      message: 'This named edit belongs to Edit Videos, not Motion Studio Storytelling.',
    }
  }
  return { state: 'ready', handoff }
}

async function verifyStorytellingWorkspace(
  handoff: LocalInternalProjectHandoff,
): Promise<{
  handoff?: LocalInternalProjectHandoff
  message?: string
  state: MotionStudioStorytellingHandoffState
}> {
  const classification = classifyHandoff(handoff)
  if (classification.state !== 'ready') return classification

  const response = await motionStudioApiClient.getProduction(
    handoff.projectId,
    handoff.editSessionId,
  )
  if (!response.ok) {
    return {
      state: response.statusCode === 401 || response.statusCode === 403
        ? 'access_denied'
        : response.statusCode === 404
          ? 'not_found'
          : 'unavailable',
      message: response.error?.message ?? 'The exact Storytelling production could not be verified.',
    }
  }
  const production = projectMotionStudioProduction(response.data?.production)
  if (
    !production ||
    production.projectId !== handoff.projectId ||
    production.editSessionId !== handoff.editSessionId ||
    production.moduleId !== 'storytelling'
  ) {
    return {
      state: 'invalid_response',
      message: 'The Storytelling production did not match the exact Project and Named Edit.',
    }
  }
  if (!isVerifiedMotionStudioStorytellingProductionAssociation(
    handoff as LocalInternalProjectHandoff & { productWorkflow?: unknown },
    production,
  )) {
    return {
      state: 'not_storytelling',
      message: 'This named edit belongs to Edit Videos, not Motion Studio Storytelling.',
    }
  }
  return { state: 'ready', handoff }
}
