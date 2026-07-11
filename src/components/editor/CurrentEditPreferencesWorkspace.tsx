import { RotateCcw, SlidersHorizontal } from 'lucide-react'
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
import { Button } from '../Button'

type CurrentEditPreferencesWorkspaceProps = {
  baseline: LocalInternalEditPreferenceBaseline
  current: LocalInternalEditPreferenceValues
  draftPlanExists: boolean
  locked: boolean
  leaveRequested: boolean
  onApply: (values: LocalInternalEditPreferenceValues) => void
  onCancelLeave: () => void
  onDirtyChange: (dirty: boolean) => void
  onDiscardAndLeave: () => void
  onReturnToChat: () => void
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
  onCancelLeave,
  onDirtyChange,
  onDiscardAndLeave,
  onReturnToChat,
}: CurrentEditPreferencesWorkspaceProps) {
  const [draft, setDraft] = useState(current)
  const leaveGuardRef = useRef<HTMLElement | null>(null)

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
  const dirty = change.changedFields.length > 0

  const navigationBlocker = useUnsavedNavigationGuard({
    confirmBlockedNavigation: false,
    message: 'Discard unapplied Current Edit Preferences?',
    when: dirty,
  })

  useEffect(() => {
    onDirtyChange(dirty)
    return () => onDirtyChange(false)
  }, [dirty, onDirtyChange])

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
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }))
  }

  function resetField(key: EditPreferenceFieldKey) {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: baseline[key] }))
  }

  function resetAll() {
    setDraft({
      editLevel: baseline.editLevel,
      workflowType: baseline.workflowType,
      cleanupPreference: baseline.cleanupPreference,
      visualPreference: baseline.visualPreference,
      moodStyle: baseline.moodStyle,
      creditPreference: baseline.creditPreference,
      targetPlatform: baseline.targetPlatform,
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dirty || locked) return
    onApply(draft)
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
          <span className="section-eyebrow">Current edit</span>
          <h2>How should ReeditPro edit this video?</h2>
          <p>These choices belong to this edit only. Your saved defaults for future edits stay unchanged.</p>
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

      <PreferenceGroup description="Set the planning depth, workflow context, and cleanup behavior." title="Editing approach">
        <CurrentPreferenceSelect
          baseline={baseline}
          disabled={locked}
          field="editLevel"
          onChange={updatePreference}
          onReset={resetField}
          options={editLevelPreferenceOptions}
          testId={fieldTestIds.editLevel}
          value={draft.editLevel}
        />
        <CurrentPreferenceSelect
          baseline={baseline}
          disabled={locked}
          field="workflowType"
          onChange={updatePreference}
          onReset={resetField}
          options={workflowPreferenceOptions}
          testId={fieldTestIds.workflowType}
          value={draft.workflowType}
        />
        <CurrentPreferenceSelect
          baseline={baseline}
          disabled={locked}
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
          disabled={locked}
          field="visualPreference"
          onChange={updatePreference}
          onReset={resetField}
          options={visualPreferenceOptions}
          testId={fieldTestIds.visualPreference}
          value={draft.visualPreference}
        />
        <CurrentPreferenceSelect
          baseline={baseline}
          disabled={locked}
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
          disabled={locked}
          field="creditPreference"
          onChange={updatePreference}
          onReset={resetField}
          options={creditPreferenceOptions}
          testId={fieldTestIds.creditPreference}
          value={draft.creditPreference}
        />
        <CurrentPreferenceSelect
          baseline={baseline}
          disabled={locked}
          field="targetPlatform"
          onChange={updatePreference}
          onReset={resetField}
          options={targetPlatformPreferenceOptions}
          testId={fieldTestIds.targetPlatform}
          value={draft.targetPlatform}
        />
      </PreferenceGroup>

      {!locked && dirty ? (
        <section className="current-edit-preferences-impact" data-testid="preference-material-change-warning" role="note">
          <strong>{draftPlanExists ? 'A fresh plan and estimate will be required.' : 'These choices will shape the next plan.'}</strong>
          <p>
            {draftPlanExists
              ? 'Applying these changes clears the current draft plan. No generation or additional credit action starts.'
              : 'Applying saves them to this edit only. No generation or credit action starts.'}
            {change.rerunFootagePrep ? ' Source preparation will need to run again for the new cleanup direction.' : ''}
            {change.reconfirmOutputFrame ? ' Confirm the output frame again after changing the destination.' : ''}
          </p>
        </section>
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
            <strong id="current-edit-preferences-leave-title">Discard unapplied changes?</strong>
            <p>Apply these choices to this edit, or discard the draft before leaving.</p>
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
          </div>
        </section>
      ) : null}

      {dirty || draftOverrideKeys.length > 0 || locked ? (
        <footer className="current-edit-preferences-actions">
          <div>
            <strong>{dirty ? `${change.changedFields.length} unapplied change${change.changedFields.length === 1 ? '' : 's'}` : 'Current edit is up to date'}</strong>
            <small>Only Apply to this edit writes these choices.</small>
          </div>
          <div>
            <Button disabled={locked || draftOverrideKeys.length === 0} icon={RotateCcw} onClick={resetAll} variant="ghost">
              Use all original defaults
            </Button>
            <Button disabled={locked || !dirty} type="submit" variant="primary">
              Apply to this edit
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
