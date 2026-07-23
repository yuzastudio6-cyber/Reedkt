import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useEditPreferenceScope } from './useEditPreferenceScope'
import { useProjectPersistenceScope } from './useProjectPersistenceScope'
import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import { createEditPreferenceRepository } from '../lib/edit-preference-repository'
import { createEditSetupSnapshotFromPreferences } from '../lib/edit-preferences'
import {
  listLocalInternalProjectHandoffsFromBackendWithRetryResult,
  migrateRetainedStorytellingWorkflowFromBackend,
  persistLocalInternalProjectHandoffToBackend,
} from '../lib/internal-edit-state-backend-sync'
import {
  listLocalInternalProjectHandoffs,
  saveLocalInternalProjectHandoff,
  type LocalInternalProjectHandoff,
} from '../lib/local-project-handoff'
import {
  createLocalProjectRecord,
  saveLocalProjectRecord,
} from '../lib/local-projects'
import {
  createBackendProjectForInternalTestingResult,
} from '../lib/project-backend-sync'
import {
  clearStorytellingLibraryCreateAttemptJournal,
  completeStorytellingLibraryCreateAttempt,
  prepareStorytellingLibraryCreateAttempt,
  readStorytellingLibraryCreateAttemptJournalResult,
  writeStorytellingLibraryCreateAttemptJournal,
  type StorytellingLibraryCreateJournalReadResult,
  type StorytellingLibraryCreateAttempt,
} from '../lib/motion-studio/storytelling/library-create'
import {
  createStorytellingLibraryItems,
  type StorytellingLibraryItem,
} from '../lib/motion-studio/storytelling/library-model'
import { MOTION_STUDIO_MODULE_CATALOG_VERSION } from '../lib/motion-studio/contracts'
import {
  isRetainedLegacyMotionStudioStorytellingMigrationCandidate,
  isVerifiedMotionStudioStorytellingProductionAssociation,
} from '../lib/motion-studio/contracts/storytelling-workflow'
import { projectMotionStudioProduction } from '../lib/motion-studio/shell/shell-model'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'
import { MOTION_STUDIO_STORYTELLING_WORKFLOW_ID } from '../types/motion-studio/storytelling-workflow'

export type MotionStudioStorytellingLibraryState =
  | 'loading'
  | 'ready'
  | 'unavailable'
  | 'access_denied'

export interface MotionStudioStorytellingLibraryResult {
  createStorytelling: (name: string) => Promise<LocalInternalProjectHandoff>
  creating: boolean
  discardInvalidCreateRecovery: () => void
  items: readonly StorytellingLibraryItem[]
  message?: string
  pendingCreate?:
    | { status: 'resumable'; name: string; projectCreated: boolean }
    | { status: 'blocked' }
  preferenceDefaultsLoading: boolean
  refresh: () => void
  state: MotionStudioStorytellingLibraryState
}

/**
 * Browser-safe Storytelling library adapter.
 *
 * It projects the existing project/named-edit handoff authority into one
 * Motion Studio list. It does not create a second Storytelling registry or
 * start planning, approval, provider, generation, render, or billing work.
 */
export function useMotionStudioStorytellingLibrary(): MotionStudioStorytellingLibraryResult {
  const projectScope = useProjectPersistenceScope()
  const preferenceScope = useEditPreferenceScope()
  const preferenceRepository = useMemo(
    () => createEditPreferenceRepository(preferenceScope),
    [preferenceScope],
  )
  const initialPreferenceResult = useMemo(
    () => preferenceRepository.getInitialResult(),
    [preferenceRepository],
  )
  const [loadedPreference, setLoadedPreference] = useState<{
    repository: typeof preferenceRepository
    result: typeof initialPreferenceResult
  }>()
  const [creating, setCreating] = useState(false)
  const createInFlight = useRef(false)
  const accessDenied = useRef(false)
  const pendingCreateAttempt = useRef<StorytellingLibraryCreateAttempt | undefined>(undefined)
  const [readGeneration, setReadGeneration] = useState(0)
  const scopeKey = JSON.stringify([
    projectScope.authMode,
    projectScope.userId,
    projectScope.workspaceId,
  ])
  const recoveredCreateJournal = useMemo(
    () => readStorytellingLibraryCreateAttemptJournalResult(projectScope),
    [projectScope],
  )
  const [pendingCreateState, setPendingCreateState] = useState<{
    attempt?: StorytellingLibraryCreateAttempt
    invalid: boolean
    scopeKey: string
  }>(() => pendingCreateStateFromJournal(recoveredCreateJournal, scopeKey))
  const currentPendingCreateState = pendingCreateState.scopeKey === scopeKey
    ? pendingCreateState
    : pendingCreateStateFromJournal(recoveredCreateJournal, scopeKey)
  const currentPendingCreateAttempt = currentPendingCreateState.attempt
  const localHandoffs = useMemo(
    () => {
      void readGeneration // Explicit refresh trigger for the browser-scoped cache.
      return listLocalInternalProjectHandoffs(projectScope)
    },
    [projectScope, readGeneration],
  )
  const [createdHandoffState, setCreatedHandoffState] = useState<{
    handoffs: LocalInternalProjectHandoff[]
    scopeKey: string
  }>({ handoffs: [], scopeKey })
  const createdHandoffs = createdHandoffState.scopeKey === scopeKey
    ? createdHandoffState.handoffs
    : []
  const activeScopeKey = useRef(scopeKey)
  const [backendRead, setBackendRead] = useState<{
    generation: number
    handoffs: LocalInternalProjectHandoff[]
    message?: string
    scopeKey: string
    state: MotionStudioStorytellingLibraryState
  }>()

  const preferenceResult = loadedPreference?.repository === preferenceRepository
    ? loadedPreference.result
    : initialPreferenceResult
  const preferenceDefaultsLoading = preferenceRepository.requiresAsyncLoad &&
    loadedPreference?.repository !== preferenceRepository
  const currentBackendRead = backendRead?.scopeKey === scopeKey && backendRead.generation === readGeneration
    ? backendRead
    : undefined
  const localAndCreatedHandoffs = useMemo(
    () => mergeHandoffs(
      createdHandoffState.scopeKey === scopeKey ? createdHandoffState.handoffs : [],
      localHandoffs,
    ),
    [createdHandoffState, localHandoffs, scopeKey],
  )
  const trustedCachedHandoffs = createdHandoffs
  const localHasStories = createStorytellingLibraryItems(trustedCachedHandoffs).length > 0
  const state = currentBackendRead?.state ?? (localHasStories ? 'ready' : 'loading')
  const message = currentBackendRead?.message
  const handoffs = useMemo(
    () => currentBackendRead?.state === 'access_denied'
      ? []
      : mergeHandoffs(currentBackendRead?.handoffs ?? [], trustedCachedHandoffs),
    [currentBackendRead, trustedCachedHandoffs],
  )

  useEffect(() => {
    activeScopeKey.current = scopeKey
    accessDenied.current = false
    pendingCreateAttempt.current = recoveredCreateJournal.status === 'ready'
      ? recoveredCreateJournal.attempt
      : undefined
    return () => {
      activeScopeKey.current = ''
      pendingCreateAttempt.current = undefined
    }
  }, [recoveredCreateJournal, scopeKey])

  useEffect(() => {
    let active = true
    if (!preferenceRepository.requiresAsyncLoad) {
      return () => {
        active = false
      }
    }

    void preferenceRepository.load().then((result) => {
      if (!active) return
      setLoadedPreference({ repository: preferenceRepository, result })
    })

    return () => {
      active = false
    }
  }, [preferenceRepository])

  useEffect(() => {
    let cancelled = false
    const hasLocalStories = createStorytellingLibraryItems(trustedCachedHandoffs).length > 0

    void listLocalInternalProjectHandoffsFromBackendWithRetryResult(projectScope)
      .then(async (result) => {
        if (cancelled) return

        if (result.status === 'access_denied') {
          accessDenied.current = true
          clearStorytellingLibraryCreateAttemptJournal(projectScope)
          pendingCreateAttempt.current = undefined
          setPendingCreateState({ attempt: undefined, invalid: false, scopeKey })
          setBackendRead({
            generation: readGeneration,
            handoffs: [],
            message: 'Storytelling is not available to the current workspace.',
            scopeKey,
            state: 'access_denied',
          })
          return
        }

        if (result.status === 'ready') {
          const verification = await verifySignedInStorytellingHandoffs(result.handoffs, projectScope)
          if (cancelled) return
          if (verification.state === 'access_denied') {
            accessDenied.current = true
            clearStorytellingLibraryCreateAttemptJournal(projectScope)
            pendingCreateAttempt.current = undefined
            setPendingCreateState({ attempt: undefined, invalid: false, scopeKey })
            setBackendRead({
              generation: readGeneration,
              handoffs: [],
              message: verification.message,
              scopeKey,
              state: 'access_denied',
            })
            return
          }
          if (verification.state === 'unavailable') {
            accessDenied.current = false
            setBackendRead({
              generation: readGeneration,
              handoffs: [],
              message: verification.message,
              scopeKey,
              state: 'unavailable',
            })
            return
          }

          accessDenied.current = false
          const verifiedHandoffs = verification.handoffs
          const pending = pendingCreateAttempt.current
          const recoveredPendingHandoff = pending?.handoff
            ? verifiedHandoffs.find((handoff) => handoffMatchesPendingCreate(handoff, pending))
            : undefined
          const recoveredPendingKey = recoveredPendingHandoff
            ? `${recoveredPendingHandoff.projectId}:${recoveredPendingHandoff.editSessionId}`
            : undefined
          if (pending?.project && recoveredPendingHandoff) {
            saveLocalProjectRecord(projectScope, createLocalProjectRecord({
              category: 'storytelling',
              name: recoveredPendingHandoff.projectName,
              projectId: recoveredPendingHandoff.projectId,
              workspaceId: projectScope.workspaceId,
              now: new Date(recoveredPendingHandoff.createdAt),
            }))
            saveLocalInternalProjectHandoff(projectScope, recoveredPendingHandoff, { syncBackend: false })
            clearStorytellingLibraryCreateAttemptJournal(projectScope)
            pendingCreateAttempt.current = undefined
            setPendingCreateState({ attempt: undefined, invalid: false, scopeKey })
          }
          for (const handoff of verifiedHandoffs) {
            if (`${handoff.projectId}:${handoff.editSessionId}` === recoveredPendingKey) continue
            saveLocalInternalProjectHandoff(projectScope, handoff, { syncBackend: false })
          }
          setBackendRead({
            generation: readGeneration,
            handoffs: verifiedHandoffs,
            message: verification.message,
            scopeKey,
            state: 'ready',
          })
          return
        }

        if (result.status === 'not_configured') {
          const verification = await verifySignedInStorytellingHandoffs(localAndCreatedHandoffs, projectScope)
          if (cancelled) return
          accessDenied.current = false
          setBackendRead({
            generation: readGeneration,
            handoffs: verification.handoffs,
            message: verification.message,
            scopeKey,
            state: verification.state,
          })
          return
        }

        if (hasLocalStories) {
          setBackendRead({
            generation: readGeneration,
            handoffs: [],
            message: 'Showing stories saved in this workspace. Account recovery is temporarily unavailable.',
            scopeKey,
            state: 'ready',
          })
          return
        }

        setBackendRead({
          generation: readGeneration,
          handoffs: [],
          message: 'Storytelling could not be recovered. No empty library was assumed.',
          scopeKey,
          state: 'unavailable',
        })
      })
      .catch(() => {
        if (cancelled) return
        if (hasLocalStories) {
          setBackendRead({
            generation: readGeneration,
            handoffs: [],
            message: 'Showing stories saved in this workspace. Account recovery is temporarily unavailable.',
            scopeKey,
            state: 'ready',
          })
          return
        }
        setBackendRead({
          generation: readGeneration,
          handoffs: [],
          message: 'Storytelling could not be recovered. No empty library was assumed.',
          scopeKey,
          state: 'unavailable',
        })
      })

    return () => {
      cancelled = true
    }
  }, [localAndCreatedHandoffs, projectScope, readGeneration, scopeKey, trustedCachedHandoffs])

  const createStorytelling = useCallback(async (name: string) => {
    if (createInFlight.current) {
      throw new Error('This story is already being created.')
    }
    if (preferenceDefaultsLoading) {
      throw new Error('Edit Preferences are still loading. Try again in a moment.')
    }
    if (accessDenied.current) {
      throw new Error('Storytelling is not available to the current workspace.')
    }

    const normalizedName = normalizeStorytellingName(name)
    if (!normalizedName) {
      throw new Error('Name the story before creating it.')
    }
    if (currentPendingCreateState.invalid) {
      throw new Error('The saved Storytelling create request could not be verified. No new story was started.')
    }
    if (
      pendingCreateAttempt.current &&
      pendingCreateAttempt.current.normalizedName !== normalizedName
    ) {
      throw new Error(`Finish creating “${pendingCreateAttempt.current.normalizedName}” before starting another story.`)
    }

    createInFlight.current = true
    setCreating(true)
    try {
      const attempt = prepareStorytellingLibraryCreateAttempt({
        name: normalizedName,
        previous: pendingCreateAttempt.current,
        scope: projectScope,
      })
      pendingCreateAttempt.current = attempt
      setPendingCreateState({ attempt, invalid: false, scopeKey })
      writeStorytellingLibraryCreateAttemptJournal(projectScope, attempt)
      const creationScopeKey = scopeKey
      const created = await completeStorytellingLibraryCreateAttempt({
        attempt,
        backendPersistenceRequired: projectScope.authMode === 'supabase',
        dependencies: {
          createBackendProject: createBackendProjectForInternalTestingResult,
          persistBackendHandoff: (scope, handoff) =>
            persistLocalInternalProjectHandoffToBackend(scope, handoff, { reportStatus: false }),
          persistAttempt: (currentAttempt) =>
            writeStorytellingLibraryCreateAttemptJournal(projectScope, currentAttempt),
        },
        scope: projectScope,
        setup: createEditSetupSnapshotFromPreferences(preferenceResult.preferences),
      })
      await ensureStorytellingProduction(created.handoff, created.attempt.createIntentId)
      if (activeScopeKey.current !== creationScopeKey || accessDenied.current) {
        throw new Error('The active workspace changed before this story could open. Start again in the current workspace.')
      }
      saveLocalProjectRecord(projectScope, created.project)
      const saved = saveLocalInternalProjectHandoff(projectScope, created.handoff, { syncBackend: false })
      setCreatedHandoffState((current) => ({
        handoffs: mergeHandoffs(
          [saved],
          current.scopeKey === creationScopeKey ? current.handoffs : [],
        ),
        scopeKey: creationScopeKey,
      }))
      clearStorytellingLibraryCreateAttemptJournal(projectScope)
      pendingCreateAttempt.current = undefined
      setPendingCreateState({ attempt: undefined, invalid: false, scopeKey })
      return saved
    } catch (error) {
      if (activeScopeKey.current === scopeKey) {
        setPendingCreateState({
          attempt: pendingCreateAttempt.current,
          invalid: false,
          scopeKey,
        })
      }
      throw error
    } finally {
      createInFlight.current = false
      if (activeScopeKey.current === scopeKey) setCreating(false)
    }
  }, [currentPendingCreateState.invalid, preferenceDefaultsLoading, preferenceResult.preferences, projectScope, scopeKey])

  const discardInvalidCreateRecovery = useCallback(() => {
    if (!currentPendingCreateState.invalid) return
    clearStorytellingLibraryCreateAttemptJournal(projectScope)
    pendingCreateAttempt.current = undefined
    setPendingCreateState({ attempt: undefined, invalid: false, scopeKey })
    setReadGeneration((current) => current + 1)
  }, [currentPendingCreateState.invalid, projectScope, scopeKey])

  return {
    createStorytelling,
    creating,
    discardInvalidCreateRecovery,
    items: createStorytellingLibraryItems(handoffs),
    message,
    pendingCreate: currentPendingCreateState.invalid
      ? { status: 'blocked' }
      : currentPendingCreateAttempt
        ? {
          status: 'resumable',
          name: currentPendingCreateAttempt.normalizedName,
          projectCreated: currentPendingCreateAttempt.backendProjectResolution === 'created',
        }
        : undefined,
    preferenceDefaultsLoading,
    refresh: () => setReadGeneration((current) => current + 1),
    state,
  }
}

async function ensureStorytellingProduction(
  handoff: LocalInternalProjectHandoff,
  createIntentId: string,
): Promise<void> {
  const response = await motionStudioApiClient.createProduction(
    handoff.projectId,
    handoff.editSessionId,
    {
      moduleId: 'storytelling',
      moduleCatalogVersion: MOTION_STUDIO_MODULE_CATALOG_VERSION,
    },
    `motion-studio-storytelling-bootstrap:${createIntentId}`,
  )
  if (!response.ok) {
    throw new Error(
      response.error?.message ??
      'The Storytelling workspace could not be prepared. The saved project can be resumed without creating a duplicate.',
    )
  }
  const production = projectMotionStudioProduction(response.data?.production)
  if (
    !production ||
    production.projectId !== handoff.projectId ||
    production.editSessionId !== handoff.editSessionId ||
    production.moduleId !== 'storytelling'
  ) {
    throw new Error('The Storytelling workspace did not match the saved project and named edit. Nothing was opened.')
  }
}

export interface SignedInStorytellingVerification {
  handoffs: LocalInternalProjectHandoff[]
  message?: string
  state: Extract<MotionStudioStorytellingLibraryState, 'ready' | 'unavailable' | 'access_denied'>
}

/**
 * A signed-in Storytelling library never trusts category or browser cache.
 * The canonical integration dependency parses productWorkflow durably; this
 * adapter then re-reads each possible production and requires both sources to
 * identify one exact Storytelling tuple before returning it to the UI.
 */
export async function verifySignedInStorytellingHandoffs(
  handoffs: readonly LocalInternalProjectHandoff[],
  scope: ProjectPersistenceScope,
  dependencies: {
    migrateLegacy?: typeof migrateRetainedStorytellingWorkflowFromBackend
    readProduction?: typeof motionStudioApiClient.getProduction
  } = {},
): Promise<SignedInStorytellingVerification> {
  const readProduction = dependencies.readProduction ?? motionStudioApiClient.getProduction
  const migrateLegacy = dependencies.migrateLegacy ?? migrateRetainedStorytellingWorkflowFromBackend
  const candidates = handoffs.filter((handoff) => {
    const workflow = readHandoffProductWorkflow(handoff)
    return workflow === MOTION_STUDIO_STORYTELLING_WORKFLOW_ID ||
      isRetainedLegacyMotionStudioStorytellingMigrationCandidate(asWorkflowHandoff(handoff))
  })
  const results = await Promise.all(candidates.map(async (handoff) => {
    let verifiedHandoff = handoff
    try {
      if (readHandoffProductWorkflow(handoff) === undefined) {
        if (scope.authMode !== 'supabase') {
          return { handoff, kind: 'not_storytelling' as const }
        }
        const migration = await migrateLegacy(scope, handoff)
        if (migration.status === 'access_denied') return { handoff, kind: 'access_denied' as const }
        if (migration.status !== 'found') return { handoff, kind: 'unavailable' as const }
        verifiedHandoff = migration.handoff
      }
      const response = await readProduction(
        verifiedHandoff.projectId,
        verifiedHandoff.editSessionId,
      )
      if (!response.ok) {
        if (response.statusCode === 401 || response.statusCode === 403) {
          return { handoff: verifiedHandoff, kind: 'access_denied' as const }
        }
        return { handoff: verifiedHandoff, kind: 'unavailable' as const }
      }

      const production = projectMotionStudioProduction(response.data?.production)
      if (!production) return { handoff: verifiedHandoff, kind: 'unavailable' as const }
      if (!isVerifiedMotionStudioStorytellingProductionAssociation(
        asWorkflowHandoff(verifiedHandoff),
        production,
      )) {
        return { handoff: verifiedHandoff, kind: 'unavailable' as const }
      }
      return { handoff: verifiedHandoff, kind: 'verified' as const }
    } catch {
      return { handoff: verifiedHandoff, kind: 'unavailable' as const }
    }
  }))

  if (results.some((result) => result.kind === 'access_denied')) {
    return {
      handoffs: [],
      message: 'Storytelling is not available to the current workspace.',
      state: 'access_denied',
    }
  }

  const verified = results.flatMap((result) =>
    result.kind === 'verified' ? [result.handoff] : [])
  const unavailableCount = results.filter((result) => result.kind === 'unavailable').length
  if (unavailableCount > 0 && verified.length === 0) {
    return {
      handoffs: [],
      message: 'Storytelling records could not be reverified. No empty library was assumed.',
      state: 'unavailable',
    }
  }
  return {
    handoffs: verified,
    message: unavailableCount > 0
      ? 'Some Storytelling entries need recovery. Verified stories remain available.'
      : undefined,
    state: 'ready',
  }
}

function readHandoffProductWorkflow(handoff: LocalInternalProjectHandoff): unknown {
  return (handoff as LocalInternalProjectHandoff & { productWorkflow?: unknown }).productWorkflow
}

function asWorkflowHandoff(
  handoff: LocalInternalProjectHandoff,
): LocalInternalProjectHandoff & { productWorkflow?: unknown } {
  return handoff as LocalInternalProjectHandoff & { productWorkflow?: unknown }
}

function pendingCreateStateFromJournal(
  journal: StorytellingLibraryCreateJournalReadResult,
  scopeKey: string,
): {
  attempt?: StorytellingLibraryCreateAttempt
  invalid: boolean
  scopeKey: string
} {
  return {
    attempt: journal.status === 'ready' ? journal.attempt : undefined,
    invalid: journal.status === 'invalid',
    scopeKey,
  }
}

function handoffMatchesPendingCreate(
  handoff: LocalInternalProjectHandoff,
  pending: StorytellingLibraryCreateAttempt,
): boolean {
  return handoff.workspaceId === pending.handoff?.workspaceId &&
    handoff.projectId === pending.handoff.projectId &&
    handoff.editSessionId === pending.handoff.editSessionId &&
    handoff.projectName === pending.normalizedName &&
    handoff.editName === pending.normalizedName &&
    handoff.category === 'storytelling' &&
    handoff.productWorkflow === 'motion_studio.storytelling'
}

function mergeHandoffs(
  ...collections: ReadonlyArray<readonly LocalInternalProjectHandoff[]>
): LocalInternalProjectHandoff[] {
  const merged = new Map<string, LocalInternalProjectHandoff>()
  for (const collection of collections) {
    for (const handoff of collection) {
      const key = `${handoff.projectId}:${handoff.editSessionId}`
      const current = merged.get(key)
      if (!current || handoff.updatedAt > current.updatedAt) merged.set(key, handoff)
    }
  }
  return [...merged.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

function normalizeStorytellingName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 80)
}
