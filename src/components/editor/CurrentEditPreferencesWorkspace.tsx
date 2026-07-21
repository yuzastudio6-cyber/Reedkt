import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  cleanupPreferenceOptions,
  creditPreferenceOptions,
  editLevelPreferenceOptions,
  moodPreferenceOptions,
  targetPlatformPreferenceOptions,
  visualPreferenceOptions,
  workflowPreferenceOptions,
} from '../../lib/edit-preferences'
import {
  CURRENT_EDIT_PREFERENCE_LABELS,
  getCurrentEditPreferenceOverrideKeys,
  preferencePersistenceLabel,
  resolveCurrentEditPreferenceChange,
} from '../../lib/current-edit-preferences'
import type {
  LocalInternalEditPreferenceBaseline,
  LocalInternalEditPreferenceValues,
} from '../../lib/local-project-handoff'
import type { EditPreferenceFieldKey } from '../../types/reeditpro'
import { useUnsavedNavigationGuard } from '../../hooks/useUnsavedNavigationGuard'
import { createEditReferenceApiClient } from '../../lib/edit-reference-api-client'
import {
  loadApprovedEditReferenceOptions,
  type ApprovedEditReferenceOption,
} from '../../lib/edit-reference-approved-options'
import { createCurrentEditReferenceSupplementOptions } from '../../lib/current-edit-reference-study-mount-adapter'
import type {
  CurrentEditReferenceSupplementBlockReason,
  CurrentEditReferenceSupplementResource,
} from '../../lib/current-edit-reference-study-supplement'
import {
  resolveCurrentEditReferenceDraftDecision,
  type CurrentEditReferenceAtomicDraftDecision,
  type CurrentEditReferenceOriginalDecision,
} from '../../lib/current-edit-reference-draft-decision'
import { createPreferenceApplicationTargetContext } from '../../lib/project-edit-session-edit-reference-integration'
import type { TargetVideoUnderstandingPackage } from '../../types/edit-reference-target-video-understanding'
import type { CurrentEditReferenceApplicationResource } from '../../lib/current-edit-reference-application-ui'
import type {
  EditReferenceProductionPreparedApplicationAuthority,
} from '../../types/edit-reference-production-exact-edit-apply-api'
import type { ProjectPersistenceScope } from '../../lib/project-persistence-scope'
import { readExactEditPreferenceApplyAuthority } from '../../lib/exact-edit-preference-apply-client'
import { Button } from '../Button'
import {
  CurrentEditReferenceStudySupplement,
  type CurrentEditReferenceTargetAuthority,
} from './edit-reference/CurrentEditReferenceStudySupplement'
import '../../styles/current-edit-preferences.css'

export interface CurrentEditPreferencesApplyRequest {
  values: LocalInternalEditPreferenceValues
  referenceDecision: CurrentEditReferenceAtomicDraftDecision
  targetStudy?: TargetVideoUnderstandingPackage
}

export interface CurrentEditPreferencesApplyResult {
  ok: boolean
  message: string
}

type CurrentEditPreferencesWorkspaceProps = {
  baseline: LocalInternalEditPreferenceBaseline
  current: LocalInternalEditPreferenceValues
  draftPlanExists: boolean
  locked: boolean
  leaveRequested: boolean
  onApply: (request: CurrentEditPreferencesApplyRequest) => Promise<CurrentEditPreferencesApplyResult>
  onRetryPendingApply: () => Promise<CurrentEditPreferencesApplyResult>
  onCancelLeave: () => void
  onDirtyChange: (dirty: boolean) => void
  onDiscardAndLeave: () => void
  onReturnToChat: () => void
  pendingApplyRecovery: boolean
  editSessionId: string
  projectId: string
  targetAuthority?: CurrentEditReferenceTargetAuthority
  targetAuthorityBlockReason?: CurrentEditReferenceSupplementBlockReason
  workspaceId: string
  projectPersistenceScope: ProjectPersistenceScope
}

const fieldTestIds: Record<EditPreferenceFieldKey, string> = {
  editLevel: 'current-edit-preference-edit-level',
  workflowType: 'current-edit-preference-workflow',
  cleanupPreference: 'current-edit-preference-cleanup',
  visualPreference: 'current-edit-preference-visual-direction',
  moodStyle: 'current-edit-preference-mood',
  creditPreference: 'current-edit-preference-credit-posture',
  targetPlatform: 'current-edit-preference-preferred-destination',
}

export function CurrentEditPreferencesWorkspace({
  baseline,
  current,
  draftPlanExists,
  locked,
  leaveRequested,
  onApply,
  onRetryPendingApply,
  onCancelLeave,
  onDirtyChange,
  onDiscardAndLeave,
  onReturnToChat,
  pendingApplyRecovery,
  editSessionId,
  projectId,
  targetAuthority,
  targetAuthorityBlockReason,
  workspaceId,
  projectPersistenceScope,
}: CurrentEditPreferencesWorkspaceProps) {
  const [draft, setDraft] = useState(current)
  const [approvedReferences, setApprovedReferences] = useState<ApprovedEditReferenceOption[]>([])
  const [referenceResource, setReferenceResource] = useState<CurrentEditReferenceSupplementResource>({ state: 'loading' })
  const [referenceRefresh, setReferenceRefresh] = useState(0)
  const [originalReference, setOriginalReference] = useState<CurrentEditReferenceOriginalDecision>({ kind: 'none' })
  const [connectedReferenceApplication, setConnectedReferenceApplication] = useState<EditReferenceProductionPreparedApplicationAuthority>()
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>()
  const [targetStudy, setTargetStudy] = useState<TargetVideoUnderstandingPackage>()
  const [applyState, setApplyState] = useState<{ status: 'idle' | 'saving' | 'error'; message?: string }>({ status: 'idle' })
  const leaveGuardRef = useRef<HTMLElement | null>(null)
  const referenceSelectionTouchedRef = useRef(false)
  const editReferenceApi = useMemo(() => createEditReferenceApiClient(), [])

  const change = useMemo(
    () => resolveCurrentEditPreferenceChange(current, draft, baseline),
    [baseline, current, draft],
  )
  const overrideKeys = useMemo(
    () => getCurrentEditPreferenceOverrideKeys(current, baseline),
    [baseline, current],
  )
  const draftOverrideKeys = useMemo(
    () => getCurrentEditPreferenceOverrideKeys(draft, baseline),
    [baseline, draft],
  )
  const originalReferenceId = originalReference.kind === 'connected' ? originalReference.referenceId : undefined
  const referenceOptions = useMemo(
    () => createCurrentEditReferenceSupplementOptions(approvedReferences),
    [approvedReferences],
  )
  const effectiveReferenceResource = useMemo<CurrentEditReferenceSupplementResource>(() => {
    if (
      referenceResource.state === 'ready'
      && selectedReferenceId
      && selectedReferenceId !== originalReferenceId
      && !targetAuthority
    ) {
      return {
        state: 'blocking_validation',
        blockReason: targetAuthorityBlockReason ?? 'source_or_brief_missing',
      }
    }
    return referenceResource
  }, [originalReferenceId, referenceResource, selectedReferenceId, targetAuthority, targetAuthorityBlockReason])
  const decisionTargetAuthority = useMemo(() => {
    if (!targetAuthority) return undefined
    return {
      workspaceId: targetAuthority.workspaceId ?? workspaceId,
      sourceStorageObjectRecordId: targetAuthority.editBrief.sourceStorageObjectRecordId ?? '',
      sourceMediaAssetId: targetAuthority.editBrief.sourceMediaAssetId ?? '',
      editBriefId: targetAuthority.editBrief.id,
      editBriefRevision: targetAuthority.editBrief.revisionNumber,
      editBriefDigestSha256: targetAuthority.editBrief.contentDigestSha256,
      targetContext: createPreferenceApplicationTargetContext({
        bundle: targetAuthority.bundle,
        currentUserInstruction: targetAuthority.currentUserInstruction,
        outputFrameConfirmed: true,
      }),
    }
  }, [targetAuthority, workspaceId])
  const referenceResolution = useMemo(() => resolveCurrentEditReferenceDraftDecision({
    approvedReferences,
    draftReferenceId: selectedReferenceId,
    locked,
    original: originalReference,
    resource: effectiveReferenceResource,
    targetAuthority: decisionTargetAuthority,
    targetStudy,
  }), [
    approvedReferences,
    decisionTargetAuthority,
    effectiveReferenceResource,
    locked,
    originalReference,
    selectedReferenceId,
    targetStudy,
  ])
  const referenceDirty = referenceResolution.dirtyContribution
  const referenceContextDraftChanged = change.changedFields.some((field) => (
    field === 'editLevel' || field === 'targetPlatform'
  ))
  const referenceContextRequiresRefresh = referenceContextDraftChanged
    && referenceResolution.operation !== 'remove'
    && Boolean(selectedReferenceId || originalReference.kind === 'connected')
  const canJoinPageApply = referenceResolution.canJoinAtomicApply && !referenceContextRequiresRefresh
  const dirty = change.changedFields.length > 0 || referenceDirty
  const editingDisabled = locked || pendingApplyRecovery
  const referenceApplicationResource = useMemo<CurrentEditReferenceApplicationResource | undefined>(() => {
    const selectedOption = referenceOptions.find((option) => option.id === selectedReferenceId)
    if (!selectedOption) return undefined

    if (referenceDirty && applyState.status === 'saving') {
      return { state: 'applying', selectedOption }
    }
    if (referenceDirty && applyState.status === 'error') {
      return { state: 'needs_retry', selectedOption }
    }
    if (
      !referenceDirty
      && connectedReferenceApplication?.editReferenceId === selectedOption.id
    ) {
      return {
        state: connectedReferenceApplication.connectionState === 'connected'
          ? 'applied'
          : 'invalidated',
        selectedOption,
        canonicalAuthority: connectedReferenceApplication,
      }
    }
    if (
      referenceDirty
      && referenceResolution.operation !== 'remove'
      && canJoinPageApply
    ) {
      return { state: 'ready_to_apply', selectedOption }
    }
    return undefined
  }, [
    applyState.status,
    canJoinPageApply,
    connectedReferenceApplication,
    referenceDirty,
    referenceOptions,
    referenceResolution.operation,
    selectedReferenceId,
  ])

  useEffect(() => {
    let active = true

    if (!editReferenceApi.available) {
      const unavailableTimer = window.setTimeout(() => {
        if (!active) return
        setApprovedReferences([])
        setConnectedReferenceApplication(undefined)
        setReferenceResource({ state: 'unavailable' })
      }, 0)
      return () => {
        active = false
        window.clearTimeout(unavailableTimer)
      }
    }

    void Promise.all([
      loadApprovedEditReferenceOptions({ api: editReferenceApi, workspaceId }),
      readExactEditPreferenceApplyAuthority({
        scope: projectPersistenceScope,
        projectId,
        editSessionId,
        selectedApplicationId: null,
      }),
    ])
      .then(async ([result, exactAuthorityResult]) => {
        if (!active) return
        if (!result.ok) {
          setApprovedReferences([])
          setConnectedReferenceApplication(undefined)
          setReferenceResource({ state: 'needs_retry' })
          return
        }
        setApprovedReferences(result.options)
        if (!exactAuthorityResult.ok) {
          setConnectedReferenceApplication(undefined)
          setReferenceResource({ state: 'needs_retry' })
          return
        }
        const currentApplicationId = exactAuthorityResult.authority.currentApplicationId
        const selectedAuthorityResult = currentApplicationId
          ? await readExactEditPreferenceApplyAuthority({
              scope: projectPersistenceScope,
              projectId,
              editSessionId,
              selectedApplicationId: currentApplicationId,
            })
          : undefined
        if (!active) return
        if (currentApplicationId && (!selectedAuthorityResult?.ok
          || selectedAuthorityResult.authority.selectedApplicationAuthority?.connectionState
            !== 'connected')) {
          setConnectedReferenceApplication(undefined)
          setReferenceResource({ state: 'needs_retry' })
          return
        }
        const connected = selectedAuthorityResult?.ok
          ? selectedAuthorityResult.authority.selectedApplicationAuthority ?? undefined
          : undefined
        setConnectedReferenceApplication(connected)
        const nextOriginal: CurrentEditReferenceOriginalDecision = connected
          ? {
              kind: 'connected',
              referenceId: connected.editReferenceId,
              referenceRevision: result.options.find((option) => option.id === connected.editReferenceId)?.referenceRevision ?? 0,
              applicationId: connected.applicationId,
              applicationContentDigest: connected.applicationContentDigestSha256,
            }
          : { kind: 'none' }
        setOriginalReference(nextOriginal)
        if (!referenceSelectionTouchedRef.current) setSelectedReferenceId(connected?.editReferenceId)
        setReferenceResource({ state: 'ready' })
      })
      .catch(() => {
        if (!active) return
        setApprovedReferences([])
        setConnectedReferenceApplication(undefined)
        setReferenceResource({ state: 'needs_retry' })
      })

    return () => {
      active = false
    }
  }, [editReferenceApi, editSessionId, projectId, projectPersistenceScope, referenceRefresh, workspaceId])

  const navigationBlocker = useUnsavedNavigationGuard({
    confirmBlockedNavigation: false,
    message: 'Discard unapplied Current Edit Preferences?',
    when: dirty || pendingApplyRecovery,
  })

  useEffect(() => {
    onDirtyChange(dirty || pendingApplyRecovery)
    return () => onDirtyChange(false)
  }, [dirty, onDirtyChange, pendingApplyRecovery])

  useEffect(() => {
    if (!leaveRequested && navigationBlocker.state !== 'blocked') return
    const focusTimer = window.setTimeout(() => leaveGuardRef.current?.focus(), 0)
    return () => window.clearTimeout(focusTimer)
  }, [leaveRequested, navigationBlocker.state])

  function handleLeaveGuardKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape') return
    event.preventDefault()
    if (navigationBlocker.state === 'blocked') navigationBlocker.reset()
    onCancelLeave()
  }

  function updatePreference<K extends EditPreferenceFieldKey>(
    key: K,
    value: LocalInternalEditPreferenceValues[K],
  ) {
    if (editingDisabled) return
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }))
  }

  function resetField(key: EditPreferenceFieldKey) {
    if (editingDisabled) return
    setDraft((currentDraft) => ({ ...currentDraft, [key]: baseline[key] }))
  }

  function resetAll() {
    if (editingDisabled) return
    setDraft({
      editLevel: baseline.editLevel,
      workflowType: baseline.workflowType,
      cleanupPreference: baseline.cleanupPreference,
      visualPreference: baseline.visualPreference,
      moodStyle: baseline.moodStyle,
      creditPreference: baseline.creditPreference,
      targetPlatform: baseline.targetPlatform,
    })
    referenceSelectionTouchedRef.current = true
    setApplyState({ status: 'idle' })
    setTargetStudy(undefined)
    setSelectedReferenceId(originalReferenceId)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pendingApplyRecovery) {
      if (applyState.status === 'saving') return
      setApplyState({ status: 'saving' })
      try {
        const result = await onRetryPendingApply()
        setApplyState(result.ok
          ? { status: 'idle' }
          : { status: 'error', message: result.message })
      } catch (error) {
        setApplyState({
          status: 'error',
          message: error instanceof Error ? error.message : 'The pending Apply could not be confirmed safely.',
        })
      }
      return
    }
    if (
      !dirty
      || locked
      || applyState.status === 'saving'
      || !canJoinPageApply
      || !referenceResolution.decision
    ) return
    setApplyState({ status: 'saving' })
    try {
      const result = await onApply({
        values: draft,
        referenceDecision: referenceResolution.decision,
        targetStudy,
      })
      setApplyState(result.ok
        ? { status: 'idle' }
        : { status: 'error', message: result.message })
    } catch (error) {
      setApplyState({
        status: 'error',
        message: error instanceof Error ? error.message : 'These Edit Preferences could not be applied safely.',
      })
    }
  }

  const baselineCopy = baseline.provenance === 'saved_edit_preferences'
    ? preferencePersistenceLabel(baseline.persistenceSource)
    : 'Original settings recovered with this edit'

  return (
    <form
      className="current-edit-preferences-workspace"
      data-testid="current-edit-preferences-form"
      onSubmit={handleSubmit}
    >
      <header className="current-edit-preferences-heading">
        <div>
          <span className="section-eyebrow">Editing style</span>
          <h2>Edit Preference for this video</h2>
          <p>Choose one approved preference. ReEditPro studies this video before adapting the guidance.</p>
        </div>
        <div className="current-edit-preferences-summary" aria-label="Current Edit Preferences source">
          <span className={`current-edit-preferences-scope ${overrideKeys.length > 0 ? 'is-changed' : ''}`.trim()}>
            <span aria-hidden="true" />
            {overrideKeys.length > 0
              ? `${overrideKeys.length} changed`
              : 'Using saved defaults'}
          </span>
          <small>{baselineCopy}</small>
        </div>
      </header>

      {locked ? (
        <section className="current-edit-preferences-lock" data-testid="current-edit-preferences-locked" role="note">
          <SlidersHorizontal aria-hidden="true" size={20} />
          <div>
            <strong>Use Chat for changes to approved work</strong>
            <p>
              This edit already has approved or review work attached. Request a revision in Chat so ReeditPro can
              preserve the prior approval reference and require a fresh plan before any new work starts.
            </p>
          </div>
          <Button onClick={onReturnToChat} variant="secondary">Return to Chat</Button>
        </section>
      ) : null}

      <fieldset
        className="current-edit-preferences-pending-boundary"
        disabled={pendingApplyRecovery}
      >
        <legend className="sr-only">Edit Reference selection</legend>
        <CurrentEditReferenceStudySupplement
          application={referenceApplicationResource}
          locked={locked}
          onRetryResource={() => {
            setReferenceResource({ state: 'loading' })
            setReferenceRefresh((value) => value + 1)
          }}
          onReturnToChat={onReturnToChat}
          onSelectionChange={(editReferenceId) => {
            referenceSelectionTouchedRef.current = true
            setApplyState({ status: 'idle' })
            setTargetStudy(undefined)
            setSelectedReferenceId(editReferenceId)
          }}
          onUseOriginal={() => {
            referenceSelectionTouchedRef.current = true
            setApplyState({ status: 'idle' })
            setTargetStudy(undefined)
            setSelectedReferenceId(originalReferenceId)
          }}
          onPackageChange={setTargetStudy}
          options={referenceOptions}
          originalReferenceId={originalReferenceId}
          resource={effectiveReferenceResource}
          selectedReferenceId={selectedReferenceId}
          targetAuthority={targetAuthority}
        />
      </fieldset>

      <details className="current-edit-preferences-advanced" data-testid="current-edit-preferences-advanced">
        <summary>
          <span>
            <strong>Fine-tune this edit</strong>
            <small>Planning, cleanup, visual, delivery, and cost controls</small>
          </span>
          <ChevronDown aria-hidden="true" size={18} />
        </summary>
        <div className="current-edit-preferences-advanced__content">
          <PreferenceGroup description="Set the planning depth, workflow context, and cleanup behavior." title="Editing approach">
            <CurrentPreferenceSelect
              baseline={baseline}
              disabled={editingDisabled}
              field="editLevel"
              onChange={updatePreference}
              onReset={resetField}
              options={editLevelPreferenceOptions}
              testId={fieldTestIds.editLevel}
              value={draft.editLevel}
            />
            <CurrentPreferenceSelect
              baseline={baseline}
              disabled={editingDisabled}
              field="workflowType"
              onChange={updatePreference}
              onReset={resetField}
              options={workflowPreferenceOptions}
              testId={fieldTestIds.workflowType}
              value={draft.workflowType}
            />
            <CurrentPreferenceSelect
              baseline={baseline}
              disabled={editingDisabled}
              field="cleanupPreference"
              onChange={updatePreference}
              onReset={resetField}
              options={cleanupPreferenceOptions}
              testId={fieldTestIds.cleanupPreference}
              value={draft.cleanupPreference}
            />
          </PreferenceGroup>

          <PreferenceGroup description="Guide the visual tone without forcing effects into every segment." title="Creative direction">
            <CurrentPreferenceSelect
              baseline={baseline}
              disabled={editingDisabled}
              field="visualPreference"
              onChange={updatePreference}
              onReset={resetField}
              options={visualPreferenceOptions}
              testId={fieldTestIds.visualPreference}
              value={draft.visualPreference}
            />
            <CurrentPreferenceSelect
              baseline={baseline}
              disabled={editingDisabled}
              field="moodStyle"
              onChange={updatePreference}
              onReset={resetField}
              options={moodPreferenceOptions}
              testId={fieldTestIds.moodStyle}
              value={draft.moodStyle}
            />
          </PreferenceGroup>

          <PreferenceGroup description="Set the cost posture and the destination ReeditPro should plan around." title="Delivery and cost">
            <CurrentPreferenceSelect
              baseline={baseline}
              disabled={editingDisabled}
              field="creditPreference"
              onChange={updatePreference}
              onReset={resetField}
              options={creditPreferenceOptions}
              testId={fieldTestIds.creditPreference}
              value={draft.creditPreference}
            />
            <CurrentPreferenceSelect
              baseline={baseline}
              disabled={editingDisabled}
              field="targetPlatform"
              onChange={updatePreference}
              onReset={resetField}
              options={targetPlatformPreferenceOptions}
              testId={fieldTestIds.targetPlatform}
              value={draft.targetPlatform}
            />
          </PreferenceGroup>
        </div>
      </details>

      {!locked && dirty ? (
        <section className="current-edit-preferences-impact" data-testid="preference-material-change-warning" role="note">
          <strong>
            {referenceDirty
              ? referenceResolution.operation === 'remove'
                ? 'Apply to remove this preference from the edit.'
                : 'Study this video before applying the selected preference.'
              : draftPlanExists
                ? 'A fresh plan and estimate will be required.'
                : 'These choices will shape the next plan.'}
          </strong>
          <p>
            {referenceDirty
              ? referenceResolution.operation === 'remove'
                ? 'The preference remains connected until you apply this removal. Its approved DNA and application history stay available.'
                : 'The selected preference remains a draft until the exact source, Edit Brief, output frame, and whole-video study are verified. Nothing is applied automatically.'
              : draftPlanExists
                ? 'Applying these changes clears the current draft plan. No generation or additional credit action starts.'
                : 'Applying saves them to this edit only. No generation or credit action starts.'}
            {change.rerunFootagePrep ? ' Source preparation will need to run again for the new cleanup direction.' : ''}
            {change.reconfirmOutputFrame ? ' Confirm the output frame again after changing the destination.' : ''}
          </p>
          {!canJoinPageApply && (referenceDirty || referenceContextRequiresRefresh) ? (
            <p data-testid="current-edit-reference-apply-blocker">
              {referenceContextRequiresRefresh
                ? 'Edit level and destination change the target-study context. Remove the connected preference first, apply the context change, reconfirm the output frame when required, then study and reconnect the preference.'
                : referenceResolution.message}
            </p>
          ) : null}
        </section>
      ) : null}

      {applyState.status === 'error' ? (
        <p className="current-edit-preferences-apply-error" data-testid="current-edit-preferences-apply-error" role="alert">
          {applyState.message} Your draft remains here so you can retry.
        </p>
      ) : null}

      {pendingApplyRecovery ? (
        <p
          className="current-edit-preferences-pending-apply"
          data-testid="current-edit-preferences-pending-apply"
          role="status"
        >
          A previous Apply may already be committed. ReEditPro will retry its exact saved operation before allowing another change.
        </p>
      ) : null}

      {leaveRequested || navigationBlocker.state === 'blocked' ? (
        <section
          aria-labelledby="current-edit-preferences-leave-title"
          aria-modal="true"
          className="current-edit-preferences-leave-guard"
          data-testid="current-edit-preferences-leave-guard"
          onKeyDown={handleLeaveGuardKeyDown}
          ref={leaveGuardRef}
          role="alertdialog"
          tabIndex={-1}
        >
          <div>
            <strong id="current-edit-preferences-leave-title">
              {pendingApplyRecovery ? 'Finish the pending Apply before leaving' : 'Discard unapplied changes?'}
            </strong>
            <p>
              {pendingApplyRecovery
                ? 'Retry the saved operation so ReEditPro can confirm whether it committed.'
                : 'Apply these choices to this edit, or discard the draft before leaving.'}
            </p>
          </div>
          <div>
            <Button
              onClick={() => {
                if (navigationBlocker.state === 'blocked') navigationBlocker.reset()
                onCancelLeave()
              }}
              variant="ghost"
            >
              Keep editing
            </Button>
            {!pendingApplyRecovery ? (
              <Button
                onClick={() => {
                  if (navigationBlocker.state === 'blocked') {
                    onDirtyChange(false)
                    navigationBlocker.proceed()
                    return
                  }
                  onDiscardAndLeave()
                }}
                variant="secondary"
              >
                Discard and leave
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {dirty || draftOverrideKeys.length > 0 || locked || pendingApplyRecovery ? (
        <footer className="current-edit-preferences-actions">
          <div>
            <strong>
              {pendingApplyRecovery
                ? 'Apply confirmation required'
                : dirty
                ? `${change.changedFields.length + (referenceDirty ? 1 : 0)} unapplied change${change.changedFields.length + (referenceDirty ? 1 : 0) === 1 ? '' : 's'}`
                : 'Current edit is up to date'}
            </strong>
            <small>
              {pendingApplyRecovery
                ? 'Retry uses the same saved operation and does not create a second change.'
                : 'Only Apply to this edit writes these choices.'}
            </small>
          </div>
          <div>
            <Button
              disabled={editingDisabled || (draftOverrideKeys.length === 0 && !referenceDirty)}
              icon={RotateCcw}
              onClick={resetAll}
              variant="ghost"
            >
              Use all original defaults
            </Button>
            <Button
              disabled={(locked && !pendingApplyRecovery) || (!pendingApplyRecovery && (!dirty || !canJoinPageApply)) || applyState.status === 'saving'}
              type="submit"
              variant="primary"
            >
              {applyState.status === 'saving'
                ? 'Applying…'
                : pendingApplyRecovery
                  ? 'Retry Apply'
                  : 'Apply to this edit'}
            </Button>
          </div>
        </footer>
      ) : (
        <p className="current-edit-preferences-clean-status">
          Using the saved defaults copied into this edit. Change a field to enable Apply.
        </p>
      )}
    </form>
  )
}

function PreferenceGroup({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <fieldset className="current-edit-preference-group">
      <legend>{title}</legend>
      <p>{description}</p>
      <div className="current-edit-preference-grid">{children}</div>
    </fieldset>
  )
}

function CurrentPreferenceSelect<K extends EditPreferenceFieldKey>({
  baseline,
  disabled,
  field,
  onChange,
  onReset,
  options,
  testId,
  value,
}: {
  baseline: LocalInternalEditPreferenceBaseline
  disabled: boolean
  field: K
  onChange: <Field extends EditPreferenceFieldKey>(
    key: Field,
    value: LocalInternalEditPreferenceValues[Field],
  ) => void
  onReset: (key: EditPreferenceFieldKey) => void
  options: Array<{ value: LocalInternalEditPreferenceValues[K]; label: string; description?: string }>
  testId: string
  value: LocalInternalEditPreferenceValues[K]
}) {
  const overridden = value !== baseline[field]
  const helperId = `${testId}-helper`
  const labelId = `${testId}-label`
  const description = options.find((option) => option.value === value)?.description

  return (
    <div className={`current-edit-preference-field ${overridden ? 'is-overridden' : ''}`.trim()}>
      <div className="current-edit-preference-field-heading">
        <label htmlFor={testId} id={labelId}>{CURRENT_EDIT_PREFERENCE_LABELS[field]}</label>
        {overridden ? (
          <Button
            aria-label={`Use the original default for ${CURRENT_EDIT_PREFERENCE_LABELS[field]}`}
            data-testid={`preference-reset-${field}`}
            disabled={disabled}
            onClick={() => onReset(field)}
            size="sm"
            variant="ghost"
          >
            Use original
          </Button>
        ) : null}
      </div>
      <select
        aria-describedby={helperId}
        aria-labelledby={labelId}
        data-testid={testId}
        disabled={disabled}
        id={testId}
        onChange={(event) => onChange(field, event.currentTarget.value as LocalInternalEditPreferenceValues[K])}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <div className="current-edit-preference-field-meta" id={helperId}>
        <span data-testid={`preference-source-${field}`}>
          {overridden ? 'Changed for this edit' : 'Inherited from the edit’s saved defaults'}
        </span>
        {description ? <small>{description}</small> : null}
      </div>
    </div>
  )
}
