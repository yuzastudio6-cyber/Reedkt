import { PlugZap, RefreshCw, Save, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthSession } from '../auth/useAuthSession'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import {
  cleanupPreferenceOptions,
  creditPreferenceOptions,
  editLevelPreferenceOptions,
  moodPreferenceOptions,
  summarizeLocalEditPreferences,
  targetPlatformPreferenceOptions,
  type LocalEditPreferenceDefaults,
  visualPreferenceOptions,
  workflowPreferenceOptions,
} from '../lib/edit-preferences'
import {
  createEditPreferenceRepository,
} from '../lib/edit-preference-repository'
import { useEditPreferenceScope } from '../hooks/useEditPreferenceScope'
import { useUnsavedNavigationGuard } from '../hooks/useUnsavedNavigationGuard'
import {
  buildInternalTestingReadinessReport,
  createInitialInternalTestingConnectionProbe,
  createInitialInternalTestingSessionProbe,
  probeInternalTestingApiConnection,
  probeInternalTestingSession,
  type InternalTestingConnectionProbeState,
  type InternalTestingReadinessState,
  type InternalTestingSessionProbe,
  type InternalTestingSessionProbeState,
} from '../lib/internal-testing-readiness'

type PreferenceKey =
  | 'editLevel'
  | 'workflowType'
  | 'cleanupPreference'
  | 'visualPreference'
  | 'moodStyle'
  | 'creditPreference'
  | 'targetPlatform'

type PreferencePersistenceError = {
  operation: 'load' | 'save'
  message: string
}

export function PreferencesPage() {
  const auth = useAuthSession()
  const [searchParams] = useSearchParams()
  const preferenceScope = useEditPreferenceScope()
  const preferenceRepository = useMemo(
    () => createEditPreferenceRepository(preferenceScope),
    [preferenceScope],
  )
  const initialPreferenceResult = useMemo(
    () => preferenceRepository.getInitialResult(),
    [preferenceRepository],
  )
  const [preferenceResult, setPreferenceResult] = useState(initialPreferenceResult)
  const [draftPreferences, setDraftPreferences] = useState(initialPreferenceResult.preferences)
  const draftPreferencesRef = useRef(initialPreferenceResult.preferences)
  const draftRevisionRef = useRef(0)
  const [persistenceStatus, setPersistenceStatus] = useState(initialPreferenceResult.message)
  const [persistenceError, setPersistenceError] = useState<PreferencePersistenceError>()
  const [loadPending, setLoadPending] = useState(preferenceRepository.requiresAsyncLoad)
  const [savePending, setSavePending] = useState(false)
  const [internalDetailsOpen, setInternalDetailsOpen] = useState(false)
  const savedPreferences = preferenceResult.preferences
  const hasUnsavedChanges = useMemo(
    () => !haveSameEditablePreferences(draftPreferences, savedPreferences),
    [draftPreferences, savedPreferences],
  )
  const controlsReadOnly = loadPending || !preferenceResult.canPersist
  const internalTestingVisible = (import.meta.env.DEV || import.meta.env.VITE_REEDITPRO_E2E === 'true')
    && searchParams.get('internalTesting') === '1'

  useUnsavedNavigationGuard({
    message: 'Discard unsaved Edit Preferences?',
    when: hasUnsavedChanges,
  })

  const savedSummary = useMemo(
    () => summarizeLocalEditPreferences(savedPreferences),
    [savedPreferences],
  )
  const testingReadiness = useMemo(() => buildInternalTestingReadinessReport(), [])
  const [connectionProbe, setConnectionProbe] = useState(() =>
    createInitialInternalTestingConnectionProbe(testingReadiness),
  )
  const [connectionProbePending, setConnectionProbePending] = useState(
    testingReadiness.readyForSignedInUploadTesting,
  )
  const [sessionProbe, setSessionProbe] = useState(() =>
    createInitialInternalTestingSessionProbe(testingReadiness),
  )
  const [sessionProbePending, setSessionProbePending] = useState(() =>
    testingReadiness.items.some((item) => item.id === 'supabase-auth' && item.state === 'ready'),
  )

  const canCheckSession = useMemo(
    () => auth.mode === 'supabase'
      && testingReadiness.items.some((item) => item.id === 'supabase-auth' && item.state === 'ready'),
    [auth.mode, testingReadiness],
  )
  const displayedSessionProbe: InternalTestingSessionProbe = auth.mode === 'local_test' && auth.status === 'signed_in'
    ? {
        state: 'signed_in' as const,
        statusLabel: 'Signed in',
        summary: 'A local test session is active.',
        detail: 'This loopback-only session has a scoped identity and does not create a bearer token.',
      }
    : sessionProbe

  useEffect(() => {
    let active = true
    void Promise.resolve().then(async () => {
      if (!active) return
      draftPreferencesRef.current = initialPreferenceResult.preferences
      draftRevisionRef.current = 0
      setPreferenceResult(initialPreferenceResult)
      setDraftPreferences(initialPreferenceResult.preferences)
      setPersistenceStatus(initialPreferenceResult.message)
      setPersistenceError(undefined)
      setLoadPending(preferenceRepository.requiresAsyncLoad)

      if (!preferenceRepository.requiresAsyncLoad) return

      try {
        const result = await preferenceRepository.load()
        if (!active) return

        if (!result.ok) {
          setPersistenceError({
            operation: 'load',
            message: `Saved Edit Preferences could not be loaded. Your current draft was not replaced. ${result.message}`,
          })
          return
        }

        setPreferenceResult(result)
        setPersistenceError(undefined)
        if (draftRevisionRef.current === 0) {
          draftPreferencesRef.current = result.preferences
          setDraftPreferences(result.preferences)
          setPersistenceStatus(result.message)
        } else {
          setPersistenceStatus('Saved Edit Preferences loaded. Your unsaved draft is still here.')
        }
      } catch {
        if (!active) return
        setPersistenceError({
          operation: 'load',
          message: 'Saved Edit Preferences could not be loaded. Your current draft was not replaced. Check the connection and retry.',
        })
      } finally {
        if (active) setLoadPending(false)
      }
    })

    return () => {
      active = false
    }
  }, [initialPreferenceResult, preferenceRepository])

  const refreshConnectionProbe = useCallback(async () => {
    if (!testingReadiness.readyForSignedInUploadTesting) {
      setConnectionProbe(createInitialInternalTestingConnectionProbe(testingReadiness))
      return
    }

    setConnectionProbePending(true)
    setConnectionProbe({
      state: 'checking',
      statusLabel: 'Checking',
      summary: 'Checking the deployed backend connection.',
      detail: 'This safe check only calls the backend health endpoint.',
    })

    const nextProbe = await probeInternalTestingApiConnection()
    setConnectionProbe(nextProbe)
    setConnectionProbePending(false)
  }, [testingReadiness])

  const refreshSessionProbe = useCallback(async () => {
    if (!canCheckSession) {
      setSessionProbe(createInitialInternalTestingSessionProbe(testingReadiness))
      return
    }

    setSessionProbePending(true)
    setSessionProbe({
      state: 'checking',
      statusLabel: 'Checking',
      summary: 'Checking for a signed-in browser session.',
      detail: 'This safe check only reads the current Supabase browser session.',
    })

    const nextProbe = await probeInternalTestingSession()
    setSessionProbe(nextProbe)
    setSessionProbePending(false)
  }, [canCheckSession, testingReadiness])

  useEffect(() => {
    let active = true

    if (!internalDetailsOpen) return () => {
      active = false
    }

    if (testingReadiness.readyForSignedInUploadTesting) {
      void probeInternalTestingApiConnection().then((nextProbe) => {
        if (!active) return
        setConnectionProbe(nextProbe)
        setConnectionProbePending(false)
      })
    }

    if (canCheckSession) {
      void probeInternalTestingSession().then((nextProbe) => {
        if (!active) return
        setSessionProbe(nextProbe)
        setSessionProbePending(false)
      })
    }

    return () => {
      active = false
    }
  }, [canCheckSession, internalDetailsOpen, testingReadiness])

  function applyDraftPreferences(next: LocalEditPreferenceDefaults) {
    draftPreferencesRef.current = next
    draftRevisionRef.current += 1
    setDraftPreferences(next)
    if (haveSameEditablePreferences(next, savedPreferences)) {
      setPersistenceError(undefined)
      setPersistenceStatus('Draft matches the last loaded Edit Preferences.')
    } else {
      setPersistenceStatus('Unsaved preference changes.')
    }
  }

  function updatePreference<K extends PreferenceKey>(
    key: K,
    value: LocalEditPreferenceDefaults[K],
  ) {
    applyDraftPreferences({ ...draftPreferencesRef.current, [key]: value })
  }

  const saveDraft = useCallback(async () => {
    if (!preferenceResult.canPersist || savePending || loadPending) return
    const submittedDraft = draftPreferencesRef.current
    const submittedRevision = draftRevisionRef.current
    setSavePending(true)
    setPersistenceError(undefined)
    setPersistenceStatus('Saving Edit Preferences…')

    try {
      const result = await preferenceRepository.save(submittedDraft)
      if (!result.ok) {
        setPersistenceError({
          operation: 'save',
          message: `Edit Preferences could not be saved. Your draft is still here. ${result.message}`,
        })
        return
      }

      setPreferenceResult(result)
      setPersistenceError(undefined)
      if (draftRevisionRef.current === submittedRevision) {
        draftPreferencesRef.current = result.preferences
        setDraftPreferences(result.preferences)
        setPersistenceStatus(result.message)
      } else {
        setPersistenceStatus('Earlier changes were saved. Newer changes remain unsaved.')
      }
    } catch {
      setPersistenceError({
        operation: 'save',
        message: 'Edit Preferences could not be saved. Your draft is still here. Check the connection and retry.',
      })
    } finally {
      setSavePending(false)
    }
  }, [loadPending, preferenceRepository, preferenceResult.canPersist, savePending])

  const refreshSavedPreferences = useCallback(async () => {
    if (loadPending || savePending) return
    const preserveDraft = !haveSameEditablePreferences(
      draftPreferencesRef.current,
      preferenceResult.preferences,
    )
    setLoadPending(true)
    setPersistenceError(undefined)
    setPersistenceStatus('Refreshing the saved version…')

    try {
      const result = await preferenceRepository.load()
      if (!result.ok) {
        setPersistenceError({
          operation: 'load',
          message: `Saved Edit Preferences could not be refreshed. Your draft is still here. ${result.message}`,
        })
        return
      }

      setPreferenceResult(result)
      setPersistenceError(undefined)
      if (preserveDraft) {
        setPersistenceStatus(
          haveSameEditablePreferences(draftPreferencesRef.current, result.preferences)
            ? result.message
            : 'Saved version refreshed. Your unsaved draft is still here.',
        )
      } else {
        draftPreferencesRef.current = result.preferences
        setDraftPreferences(result.preferences)
        setPersistenceStatus(result.message)
      }
    } catch {
      setPersistenceError({
        operation: 'load',
        message: 'Saved Edit Preferences could not be refreshed. Your draft is still here. Check the connection and retry.',
      })
    } finally {
      setLoadPending(false)
    }
  }, [loadPending, preferenceRepository, preferenceResult.preferences, savePending])

  function discardDraft() {
    draftPreferencesRef.current = savedPreferences
    draftRevisionRef.current += 1
    setDraftPreferences(savedPreferences)
    setPersistenceError(undefined)
    setPersistenceStatus('Unsaved changes discarded. The last loaded Edit Preferences are shown.')
  }

  function updateConfirmedDefaults(value: boolean) {
    applyDraftPreferences({
      ...draftPreferencesRef.current,
      applyConfirmedDefaults: value,
    })
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void saveDraft()
  }

  const statusMessage = loadPending
    ? 'Loading saved Edit Preferences…'
    : savePending
      ? 'Saving Edit Preferences…'
      : persistenceError?.message ?? persistenceStatus
  const persistenceBadge = loadPending
    ? 'Loading'
    : savePending
      ? 'Saving'
      : persistenceError
        ? 'Needs attention'
        : hasUnsavedChanges
          ? 'Unsaved'
          : preferenceResult.canPersist
            ? 'Workspace scoped'
            : 'Read only'
  const persistenceTone = persistenceError
    ? 'danger'
    : hasUnsavedChanges || !preferenceResult.canPersist
      ? 'attention'
      : 'success'

  return (
    <AppShell
      description="Choose the editing defaults copied into each new edit."
      eyebrow="Workspace"
      primaryAction={false}
      title="Edit Preferences"
    >
      <form
        aria-busy={loadPending || savePending}
        className="clean-preferences-shell saved-preferences-page"
        data-testid="edit-preferences-form"
        onSubmit={handleSave}
      >
        <section className="saved-preferences-intro">
          <div>
            <span className="section-eyebrow">Saved defaults</span>
            <h2>Defaults for new edits</h2>
            <p>
              {loadPending
                ? 'Loading the defaults saved for this signed-in workspace.'
                : preferenceResult.canPersist
                  ? 'These defaults are scoped to your signed-in workspace and copied into each new edit. Existing edits keep their original snapshot.'
                  : 'Edit Preferences are read-only until a signed-in workspace and private-internal persistence are available.'}
            </p>
          </div>
          <span className={`saved-preferences-status saved-preferences-status-${persistenceTone}`}>
            <span aria-hidden="true" />
            {persistenceBadge}
          </span>
        </section>

        <section
          className={`saved-preferences-persistence preference-persistence-row ${persistenceError ? 'is-error' : ''}`.trim()}
          data-testid="preference-persistence-card"
        >
          <span aria-hidden="true" className="saved-preferences-persistence-icon"><SlidersHorizontal size={18} /></span>
          <div className="preference-persistence-copy">
            <h2>Saved baseline</h2>
            <p>{savedSummary}</p>
            <small
              aria-live="polite"
              data-testid="preference-persistence-status"
              id="preference-persistence-status"
            >
              {statusMessage}
            </small>
            {persistenceError && (
              <div className="preference-persistence-error" data-testid="preference-persistence-error" role="alert">
                <strong>Your draft was preserved.</strong>
                <span>Retry when the private-internal workspace connection is ready.</span>
              </div>
            )}
            {persistenceError && (
              <div className="preference-recovery-actions">
                {persistenceError.operation === 'save' && preferenceResult.canPersist && (
                  <Button
                    disabled={savePending || loadPending}
                    icon={Save}
                    onClick={() => void saveDraft()}
                    size="sm"
                    variant="secondary"
                  >
                    Retry save
                  </Button>
                )}
                <Button
                  disabled={savePending || loadPending}
                  icon={RefreshCw}
                  onClick={() => void refreshSavedPreferences()}
                  size="sm"
                  variant="ghost"
                >
                  {persistenceError.operation === 'load' ? 'Retry load' : 'Refresh saved version'}
                </Button>
              </div>
            )}
          </div>
        </section>

        <div aria-describedby="preference-persistence-status" className="saved-edit-preference-groups">
            <fieldset className="saved-edit-preference-group">
              <legend>Editing approach</legend>
              <p>Choose the planning depth, workflow context, and default cleanup behavior.</p>
              <div className="preference-grid">
                <PreferenceSelect
                  disabled={controlsReadOnly}
                  label="Edit level"
                  onChange={(value) => updatePreference('editLevel', value)}
                  options={editLevelPreferenceOptions}
                  value={draftPreferences.editLevel}
                />
                <PreferenceSelect
                  disabled={controlsReadOnly}
                  label="Workflow"
                  onChange={(value) => updatePreference('workflowType', value)}
                  options={workflowPreferenceOptions}
                  value={draftPreferences.workflowType}
                />
                <PreferenceSelect
                  disabled={controlsReadOnly}
                  label="Cleanup"
                  onChange={(value) => updatePreference('cleanupPreference', value)}
                  options={cleanupPreferenceOptions}
                  value={draftPreferences.cleanupPreference}
                />
              </div>
            </fieldset>

            <fieldset className="saved-edit-preference-group">
              <legend>Creative direction</legend>
              <p>Set the visual and tonal starting point without forcing effects into every edit.</p>
              <div className="preference-grid">
                <PreferenceSelect
                  disabled={controlsReadOnly}
                  label="Visual direction"
                  onChange={(value) => updatePreference('visualPreference', value)}
                  options={visualPreferenceOptions}
                  value={draftPreferences.visualPreference}
                />
                <PreferenceSelect
                  disabled={controlsReadOnly}
                  label="Mood"
                  onChange={(value) => updatePreference('moodStyle', value)}
                  options={moodPreferenceOptions}
                  value={draftPreferences.moodStyle}
                />
              </div>
            </fieldset>

            <fieldset className="saved-edit-preference-group">
              <legend>Delivery and cost</legend>
              <p>Choose the default credit posture and destination context for new plans.</p>
              <div className="preference-grid">
                <PreferenceSelect
                  disabled={controlsReadOnly}
                  label="Credit posture"
                  onChange={(value) => updatePreference('creditPreference', value)}
                  options={creditPreferenceOptions}
                  value={draftPreferences.creditPreference}
                />
                <PreferenceSelect
                  disabled={controlsReadOnly}
                  label="Preferred destination"
                  onChange={(value) => updatePreference('targetPlatform', value)}
                  options={targetPlatformPreferenceOptions}
                  value={draftPreferences.targetPlatform}
                />
              </div>
            </fieldset>
        </div>

        <label className="clean-toggle-row">
            <input
              checked={draftPreferences.applyConfirmedDefaults}
              disabled={controlsReadOnly}
              onChange={(event) => updateConfirmedDefaults(event.currentTarget.checked)}
              type="checkbox"
            />
            <span>
              <strong>Pre-confirm reusable editing choices</strong>
              <small>Edit level, cleanup, and visual direction start confirmed. Output frame, plan, and credits still require review.</small>
            </span>
        </label>

        <p className="preference-safety-note" role="note">
            <ShieldCheck aria-hidden="true" size={20} />
            <span>Edit Preferences never upload files, execute tools, reserve credits, or approve generation.</span>
        </p>

        {internalTestingVisible && <details
            className="internal-testing-disclosure"
            data-testid="internal-testing-details"
            onToggle={(event) => setInternalDetailsOpen(event.currentTarget.open)}
          >
            <summary data-testid="internal-testing-details-summary">
              <span>
                <PlugZap aria-hidden="true" size={18} />
                <strong>Internal testing details</strong>
              </span>
              <Badge accent={testingReadiness.readyForSignedInUploadTesting ? 'success' : 'warning'}>
                {testingReadiness.statusLabel}
              </Badge>
            </summary>
            <article className="clean-setting-row clean-setting-row-large internal-testing-readiness-card" data-testid="internal-testing-readiness-card">
              <PlugZap aria-hidden="true" size={20} />
              <div>
                <div className="testing-readiness-title-row">
                  <h3>Testing connection</h3>
                  <small>Mode: {testingReadiness.apiMode} · API: {testingReadiness.apiHostLabel}</small>
                </div>
                <p>{testingReadiness.headline}</p>
                <small>{testingReadiness.summary}</small>
                <div className="testing-readiness-list" role="list">
                  {testingReadiness.items.map((item) => {
                    const isLocalTestSupabaseItem = auth.mode === 'local_test' && item.id === 'supabase-auth'
                    return (
                      <div className="testing-readiness-row" key={item.id} role="listitem">
                        <Badge accent={badgeAccentForReadinessState(item.state)}>{readinessStateLabel(item.state)}</Badge>
                        <div>
                          <strong>{isLocalTestSupabaseItem ? 'Supabase sign-in' : item.label}</strong>
                          <span>{isLocalTestSupabaseItem ? 'Local test sign-in is active; Supabase browser auth is not configured.' : item.summary}</span>
                          <small>{isLocalTestSupabaseItem ? 'The current loopback session is separate from future deployed Supabase identity.' : item.detail}</small>
                        </div>
                      </div>
                    )
                  })}
                  <div className="testing-readiness-row testing-connection-probe-row" role="listitem">
                    <Badge accent={badgeAccentForSessionProbe(displayedSessionProbe.state)}>
                      {displayedSessionProbe.statusLabel}
                    </Badge>
                    <div>
                      <strong>Session check</strong>
                      <span>{displayedSessionProbe.summary}</span>
                      <small>{displayedSessionProbe.detail}</small>
                      {displayedSessionProbe.checkedAt && (
                        <small>Last checked {new Date(displayedSessionProbe.checkedAt).toLocaleTimeString()}.</small>
                      )}
                    </div>
                    <Button
                      disabled={sessionProbePending || !canCheckSession}
                      icon={RefreshCw}
                      onClick={() => void refreshSessionProbe()}
                      size="sm"
                      variant="ghost"
                    >
                      Check
                    </Button>
                  </div>
                  <div className="testing-readiness-row testing-connection-probe-row" role="listitem">
                    <Badge accent={badgeAccentForConnectionProbe(connectionProbe.state)}>
                      {connectionProbe.statusLabel}
                    </Badge>
                    <div>
                      <strong>Live backend check</strong>
                      <span>{connectionProbe.summary}</span>
                      <small>{connectionProbe.detail}</small>
                      {connectionProbe.checkedAt && (
                        <small>Last checked {new Date(connectionProbe.checkedAt).toLocaleTimeString()}.</small>
                      )}
                    </div>
                    <Button
                      disabled={connectionProbePending || !testingReadiness.readyForSignedInUploadTesting}
                      icon={RefreshCw}
                      onClick={() => void refreshConnectionProbe()}
                      size="sm"
                      variant="ghost"
                    >
                      Check
                    </Button>
                  </div>
                </div>
              </div>
              <Badge accent={testingReadiness.readyForSignedInUploadTesting ? 'success' : 'warning'}>
                {testingReadiness.statusLabel}
              </Badge>
            </article>
        </details>}

        {hasUnsavedChanges || savePending ? (
          <footer className="saved-preferences-actions">
            <div>
              <strong>{savePending ? 'Saving your defaults…' : 'Unsaved changes'}</strong>
              <small>New edits use these choices only after you save.</small>
            </div>
            <div>
              <Button
                disabled={!hasUnsavedChanges || loadPending || savePending}
                onClick={discardDraft}
                size="sm"
                variant="ghost"
              >
                Discard changes
              </Button>
              <Button
                disabled={!preferenceResult.canPersist || !hasUnsavedChanges || loadPending || savePending}
                icon={Save}
                type="submit"
                variant="primary"
              >
                {savePending ? 'Saving…' : 'Save defaults'}
              </Button>
            </div>
          </footer>
        ) : null}
      </form>
    </AppShell>
  )
}

function badgeAccentForReadinessState(state: InternalTestingReadinessState) {
  if (state === 'ready') return 'success'
  if (state === 'blocked') return 'danger'
  return 'warning'
}

function readinessStateLabel(state: InternalTestingReadinessState) {
  if (state === 'ready') return 'Ready'
  if (state === 'blocked') return 'Blocked'
  return 'Waiting'
}

function badgeAccentForConnectionProbe(state: InternalTestingConnectionProbeState) {
  if (state === 'reachable') return 'success'
  if (state === 'unreachable') return 'danger'
  return 'warning'
}

function badgeAccentForSessionProbe(state: InternalTestingSessionProbeState) {
  if (state === 'signed_in') return 'success'
  if (state === 'error') return 'danger'
  return 'warning'
}

function PreferenceSelect<T extends string>({
  disabled = false,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean
  label: string
  onChange: (value: T) => void
  options: Array<{ value: T; label: string; description?: string }>
  value: T
}) {
  return (
    <label className="planning-field preference-select-field">
      <span>{label}</span>
      <select
        data-testid={`preference-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {options.find((option) => option.value === value)?.description && (
        <small>{options.find((option) => option.value === value)?.description}</small>
      )}
    </label>
  )
}

function haveSameEditablePreferences(
  left: LocalEditPreferenceDefaults,
  right: LocalEditPreferenceDefaults,
): boolean {
  return left.editLevel === right.editLevel
    && left.workflowType === right.workflowType
    && left.cleanupPreference === right.cleanupPreference
    && left.visualPreference === right.visualPreference
    && left.moodStyle === right.moodStyle
    && left.creditPreference === right.creditPreference
    && left.targetPlatform === right.targetPlatform
    && left.applyConfirmedDefaults === right.applyConfirmedDefaults
}
