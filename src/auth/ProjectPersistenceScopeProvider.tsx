import { LogOut, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getCurrentWorkspace } from '../backend/auth/workspace-bootstrap-service'
import { Button } from '../components/Button'
import { ProjectPersistenceScopeContext } from '../context/project-persistence-scope-context'
import {
  activateProjectPersistenceScope,
  deactivateProjectPersistenceScope,
  PROJECT_PERSISTENCE_SCOPE_REVALIDATE_EVENT,
  purgeProjectPersistenceScopeCaches,
  normalizeProjectScopeId,
  resolveProjectPersistenceScope,
  type ProjectPersistenceScope,
  type ProjectPersistenceScopeResolution,
} from '../lib/project-persistence-scope'
import { useAuthSession } from './useAuthSession'

export function ProjectPersistenceScopeProvider({ children }: { children: ReactNode }) {
  const auth = useAuthSession()
  const [retryGeneration, setRetryGeneration] = useState(0)
  const [workspaceResolution, setWorkspaceResolution] = useState<{
    userId: string
    workspaceId?: string
    pending: boolean
    message?: string
  }>()

  useEffect(() => {
    let active = true
    let verifying = false
    let validationGeneration = 0
    let invalidationRefreshQueued = false
    let lastVerifiedScope: ProjectPersistenceScope | undefined
    const userId = auth.identity?.id

    if (auth.mode !== 'supabase' || auth.status !== 'signed_in' || !userId) {
      return () => {
        active = false
      }
    }

    const refreshWorkspaceMembership = async (initialOrInvalidated = false) => {
      if (verifying) return
      verifying = true
      const generation = validationGeneration
      await Promise.resolve()
      if (!active) return

      const previouslyVerifiedScope = lastVerifiedScope
      if (initialOrInvalidated || !previouslyVerifiedScope) {
        setWorkspaceResolution({ userId, pending: true })
      }

      try {
        const result = await getCurrentWorkspace()
        if (!active || generation !== validationGeneration) return
        if (result.ok && result.workspaceId) {
          const nextScope = withTrustedBackendUserId({
            authMode: 'supabase',
            userId,
            workspaceId: result.workspaceId,
          })
          if (
            previouslyVerifiedScope &&
            (
              previouslyVerifiedScope.userId !== nextScope.userId ||
              previouslyVerifiedScope.workspaceId !== nextScope.workspaceId
            )
          ) {
            deactivateProjectPersistenceScope(previouslyVerifiedScope)
          }
          activateProjectPersistenceScope(nextScope)
          lastVerifiedScope = nextScope
          setWorkspaceResolution({
            userId,
            workspaceId: result.workspaceId,
            pending: false,
            message: result.message,
          })
        } else if (result.status === 'membership_missing' || result.status === 'signed_out') {
          if (previouslyVerifiedScope) {
            deactivateProjectPersistenceScope(previouslyVerifiedScope)
            purgeProjectPersistenceScopeCaches(previouslyVerifiedScope)
          }
          lastVerifiedScope = undefined
          setWorkspaceResolution({
            userId,
            pending: false,
            message: result.message,
          })
        } else if (!previouslyVerifiedScope) {
          setWorkspaceResolution({
            userId,
            pending: false,
            message: result.message,
          })
        }
      } catch {
        if (!active || generation !== validationGeneration) return
        if (!previouslyVerifiedScope) {
          lastVerifiedScope = undefined
          setWorkspaceResolution({
            userId,
            pending: false,
            message: 'The signed-in workspace could not be verified.',
          })
        }
      } finally {
        verifying = false
        if (active && invalidationRefreshQueued) {
          invalidationRefreshQueued = false
          void refreshWorkspaceMembership(true)
        }
      }
    }

    const requestBackgroundRefresh = () => {
      void refreshWorkspaceMembership(false)
    }
    const handleExplicitInvalidation = () => {
      validationGeneration += 1
      if (lastVerifiedScope) deactivateProjectPersistenceScope(lastVerifiedScope)
      lastVerifiedScope = undefined
      setWorkspaceResolution({ userId, pending: true })
      if (verifying) {
        invalidationRefreshQueued = true
      } else {
        void refreshWorkspaceMembership(true)
      }
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') requestBackgroundRefresh()
    }

    queueMicrotask(() => void refreshWorkspaceMembership(true))
    window.addEventListener(PROJECT_PERSISTENCE_SCOPE_REVALIDATE_EVENT, handleExplicitInvalidation)
    window.addEventListener('focus', requestBackgroundRefresh)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    const intervalId = window.setInterval(requestBackgroundRefresh, 30_000)

    return () => {
      active = false
      if (lastVerifiedScope) deactivateProjectPersistenceScope(lastVerifiedScope)
      window.clearInterval(intervalId)
      window.removeEventListener(PROJECT_PERSISTENCE_SCOPE_REVALIDATE_EVENT, handleExplicitInvalidation)
      window.removeEventListener('focus', requestBackgroundRefresh)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [auth.identity?.id, auth.mode, auth.status, retryGeneration])

  const resolution = useMemo<ProjectPersistenceScopeResolution>(() => {
    const matchingWorkspace = auth.mode === 'supabase' && workspaceResolution?.userId === auth.identity?.id
      ? workspaceResolution
      : undefined
    return resolveProjectPersistenceScope({
      authMode: auth.mode,
      identity: auth.identity,
      status: auth.status,
      workspaceId: matchingWorkspace?.workspaceId,
      workspacePending: auth.mode === 'supabase' && (matchingWorkspace?.pending ?? true),
    })
  }, [auth.identity, auth.mode, auth.status, workspaceResolution])

  if (!resolution.ok) {
    const isPending = resolution.pending
    return (
      <div
        aria-label={isPending ? 'Preparing project workspace' : 'Project workspace unavailable'}
        aria-live={isPending ? 'polite' : 'assertive'}
        className="route-loading-shell"
        role={isPending ? 'status' : 'alert'}
      >
        <div className="route-loading-card">
          <span aria-hidden="true" className={`route-loading-mark ${isPending ? '' : 'route-loading-mark-warning'}`} />
          <div>
            <strong>{isPending ? 'Preparing your workspace' : 'Workspace unavailable'}</strong>
            <p>{workspaceResolution?.message ?? resolution.message}</p>
            {!isPending && (
              <div className="route-loading-actions" data-testid="workspace-unavailable-actions">
                <Button
                  icon={RefreshCw}
                  onClick={() => {
                    const userId = auth.identity?.id
                    if (userId) setWorkspaceResolution({ userId, pending: true })
                    setRetryGeneration((current) => current + 1)
                  }}
                  size="sm"
                  variant="primary"
                >
                  Retry workspace
                </Button>
                <Button
                  icon={LogOut}
                  onClick={() => { void auth.signOut() }}
                  size="sm"
                  variant="ghost"
                >
                  Sign out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const resolvedScope = withTrustedBackendUserId(resolution.scope)
  const scopeKey = JSON.stringify([
    resolvedScope.authMode,
    resolvedScope.userId,
    resolvedScope.workspaceId,
    resolvedScope.backendUserId ?? resolvedScope.userId,
  ])

  return (
    <ProjectPersistenceScopeContext.Provider key={scopeKey} value={resolvedScope}>
      {children}
    </ProjectPersistenceScopeContext.Provider>
  )
}

function withTrustedBackendUserId(scope: ProjectPersistenceScope): ProjectPersistenceScope {
  if (scope.authMode !== 'local_test') return scope
  const hostname = typeof window === 'undefined' ? '' : window.location.hostname
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1') return scope
  const configuredBackendUserId = import.meta.env.VITE_REEDITPRO_E2E === 'true'
    ? import.meta.env.VITE_REEDITPRO_E2E_AUTH_USER_ID
    : import.meta.env.VITE_REEDITPRO_LOCAL_TEST_BACKEND_USER_ID ?? 'mock-user-runtime'
  const backendUserId = normalizeProjectScopeId(configuredBackendUserId)
  return backendUserId ? { ...scope, backendUserId } : scope
}
