import { CheckCircle2, Link2, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import type { EditReferenceListItem, PreferenceApplicationRecord } from '../../types/edit-reference'
import type {
  PreferenceApplicationDownstreamContext,
  PreferenceApplicationInvalidationReason,
} from '../../types/edit-reference-integration'
import { Badge } from '../Badge'
import { Button } from '../Button'

type LifecycleMode = 'idle' | 'replace' | 'remove'

type ProjectEditSessionEditReferencePickerProps = {
  approvedReferences: EditReferenceListItem[]
  backendAvailable: boolean
  busy: boolean
  connectedApplication?: PreferenceApplicationRecord
  currentUserInstruction: string
  frameConfirmed: boolean
  invalidationReason?: PreferenceApplicationInvalidationReason
  lifecycleMode: LifecycleMode
  onConnect: () => void
  onFrameConfirmedChange: (confirmed: boolean) => void
  onInstructionChange: (instruction: string) => void
  onLifecycleModeChange: (mode: LifecycleMode) => void
  onRemove: () => void
  onReplace: () => void
  onSelectReference: (referenceId: string) => void
  selectedReferenceId?: string
  stagedApplication?: PreferenceApplicationRecord
  activeContext?: PreferenceApplicationDownstreamContext
  targetLabel: string
}

export function ProjectEditSessionEditReferencePicker({
  approvedReferences,
  backendAvailable,
  busy,
  connectedApplication,
  currentUserInstruction,
  frameConfirmed,
  invalidationReason,
  lifecycleMode,
  onConnect,
  onFrameConfirmedChange,
  onInstructionChange,
  onLifecycleModeChange,
  onRemove,
  onReplace,
  onSelectReference,
  selectedReferenceId,
  stagedApplication,
  activeContext,
  targetLabel,
}: ProjectEditSessionEditReferencePickerProps) {
  const connectedContext = activeContext ?? connectedApplication?.downstreamContext
  const replacementOptions = approvedReferences.filter((item) => (
    item.reference.id !== connectedApplication?.editReferenceId
  ))

  if (connectedContext && connectedApplication) {
    const lifecyclePending = Boolean(invalidationReason)
    return (
      <section
        className={`project-edit-session-reference-connection is-connected${lifecyclePending ? ' is-changing' : ''}`}
        data-testid="edit-session-edit-reference-connection"
      >
        <div className="project-edit-session-reference-connection__heading">
          <div>
            <span className="section-eyebrow">Target-adapted guidance</span>
            <h4>{connectedContext.editReferenceName}</h4>
          </div>
          <Badge accent={lifecyclePending ? 'warning' : 'success'}>
            {invalidationReason === 'replace' ? 'Replacement pending' : invalidationReason === 'remove' ? 'Removal pending' : 'Connected'}
          </Badge>
        </div>
        <p>{connectedContext.summary}</p>
        <p className="project-edit-session-reference-connection__origin" data-testid="edit-session-edit-reference-origin">
          {applicationSourceLabel(connectedApplication.applicationSource)} · approved DNA v{connectedApplication.dnaVersionNumber} · application version {connectedApplication.version}
        </p>
        <div className="project-edit-session-reference-connection__metrics">
          <span><CheckCircle2 aria-hidden="true" size={14} />{connectedContext.guidance.length} adapted</span>
          <span><ShieldCheck aria-hidden="true" size={14} />{connectedContext.heldBack.length} held back</span>
          <span>{connectedContext.doNotCopyRules.length} boundaries</span>
        </div>
        <p className="project-edit-session-reference-connection__priority">
          Current instructions and confirmed Edit Brief markers stay above this reusable guidance.
        </p>

        {lifecycleMode === 'idle' ? (
          <div className="project-edit-session-reference-connection__lifecycle-actions" aria-label="Connected Edit Reference actions">
            <Button
              disabled={busy}
              icon={RefreshCw}
              onClick={() => onLifecycleModeChange('replace')}
              size="sm"
              variant="secondary"
            >
              Replace guidance
            </Button>
            <Button
              disabled={busy}
              icon={Trash2}
              onClick={() => onLifecycleModeChange('remove')}
              size="sm"
              variant="ghost"
            >
              Remove
            </Button>
          </div>
        ) : null}

        {lifecycleMode === 'replace' ? (
          <div className="project-edit-session-reference-connection__lifecycle-panel" data-testid="edit-session-edit-reference-replace-panel">
            <div className="project-edit-session-reference-connection__lifecycle-heading">
              <div>
                <strong>{invalidationReason ? 'Finish replacing guidance' : 'Choose replacement guidance'}</strong>
                <span>The prior application remains in history and its approved Preference DNA is not changed.</span>
              </div>
              {!invalidationReason ? (
                <Button icon={X} onClick={() => onLifecycleModeChange('idle')} size="sm" variant="ghost">Cancel</Button>
              ) : null}
            </div>
            {replacementOptions.length ? (
              <div className="project-edit-session-reference-connection__options" role="radiogroup" aria-label="Replacement Edit References">
                {replacementOptions.map((item, index) => {
                  const selected = item.reference.id === selectedReferenceId
                  return (
                    <button
                      aria-checked={selected}
                      autoFocus={selected}
                      className={selected ? 'is-selected' : ''}
                      data-testid={`edit-session-edit-reference-replacement-${item.reference.id}`}
                      disabled={busy}
                      key={item.reference.id}
                      onClick={() => onSelectReference(item.reference.id)}
                      onKeyDown={(event) => moveRadioSelection(
                        event,
                        replacementOptions.map((option) => option.reference.id),
                        index,
                        onSelectReference,
                      )}
                      role="radio"
                      tabIndex={selected ? 0 : -1}
                      type="button"
                    >
                      <strong>{item.reference.name}</strong>
                      <span>Approved DNA · {item.applicationCount} prior application{item.applicationCount === 1 ? '' : 's'}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="project-edit-session-reference-connection__notice">Approve another Edit Reference before replacing this guidance.</p>
            )}
            {replacementOptions.length ? (
              <LifecycleReview
                busy={busy}
                currentUserInstruction={currentUserInstruction}
                frameConfirmed={frameConfirmed}
                onFrameConfirmedChange={onFrameConfirmedChange}
                onInstructionChange={onInstructionChange}
              >
                <Button
                  disabled={busy || !frameConfirmed || !selectedReferenceId || !currentUserInstruction.trim()}
                  icon={RefreshCw}
                  onClick={onReplace}
                  size="sm"
                  variant="secondary"
                >
                  {invalidationReason ? 'Finish replacement' : 'Replace guidance'}
                </Button>
              </LifecycleReview>
            ) : null}
          </div>
        ) : null}

        {lifecycleMode === 'remove' ? (
          <div aria-describedby="edit-session-edit-reference-remove-description" aria-labelledby="edit-session-edit-reference-remove-title" className="project-edit-session-reference-connection__remove-confirmation" data-testid="edit-session-edit-reference-remove-confirmation" role="alertdialog">
            <div>
              <strong id="edit-session-edit-reference-remove-title">{invalidationReason ? 'Finish removing this guidance?' : 'Remove this guidance from the edit?'}</strong>
              <span id="edit-session-edit-reference-remove-description">The application becomes inactive, but its version, approved DNA, and audit history remain available.</span>
            </div>
            <div className="project-edit-session-reference-connection__lifecycle-actions">
              {!invalidationReason ? (
                <Button autoFocus disabled={busy} onClick={() => onLifecycleModeChange('idle')} size="sm" variant="secondary">Keep guidance</Button>
              ) : null}
              <Button autoFocus={Boolean(invalidationReason)} disabled={busy} icon={Trash2} onClick={onRemove} size="sm" variant="danger">
                {invalidationReason ? 'Finish removal' : 'Remove guidance'}
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <section className="project-edit-session-reference-connection" data-testid="edit-session-edit-reference-connection">
      <div className="project-edit-session-reference-connection__heading">
        <div>
          <span className="section-eyebrow">Approved Edit References</span>
          <h4>Adapt a reference to this edit</h4>
        </div>
        <Badge accent={backendAvailable ? 'cyan' : 'muted'}>{backendAvailable ? 'Approved only' : 'Unavailable'}</Badge>
      </div>
      <p className="project-edit-session-reference-connection__intro">
        Choose approved creative intelligence. ReEditPro adapts it to {targetLabel}; it never copies the reference as a shot list.
      </p>
      {!backendAvailable ? (
        <p className="project-edit-session-reference-connection__notice">Edit References are unavailable right now. Your current edit remains unchanged.</p>
      ) : stagedApplication ? (
        <div className="project-edit-session-reference-connection__staged" data-testid="edit-session-edit-reference-staged">
          <strong>{stagedApplication.editReferenceName}</strong>
          <span>Target adaptation is prepared. Finish connecting this exact version.</span>
        </div>
      ) : approvedReferences.length ? (
        <div className="project-edit-session-reference-connection__options" role="radiogroup" aria-label="Approved Edit References">
          {approvedReferences.map((item, index) => {
            const selected = item.reference.id === selectedReferenceId
            return (
              <button
                aria-checked={selected}
                className={selected ? 'is-selected' : ''}
                data-testid={`edit-session-edit-reference-option-${item.reference.id}`}
                disabled={busy}
                key={item.reference.id}
                onClick={() => onSelectReference(item.reference.id)}
                onKeyDown={(event) => moveRadioSelection(
                  event,
                  approvedReferences.map((option) => option.reference.id),
                  index,
                  onSelectReference,
                )}
                role="radio"
                tabIndex={selected || (!selectedReferenceId && index === 0) ? 0 : -1}
                type="button"
              >
                <strong>{item.reference.name}</strong>
                <span>Approved DNA · {item.applicationCount} prior application{item.applicationCount === 1 ? '' : 's'}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="project-edit-session-reference-connection__notice">No approved Edit References are available yet.</p>
      )}

      {(stagedApplication || approvedReferences.length > 0) && backendAvailable ? (
        <LifecycleReview
          busy={busy}
          currentUserInstruction={currentUserInstruction}
          frameConfirmed={frameConfirmed}
          onFrameConfirmedChange={onFrameConfirmedChange}
          onInstructionChange={onInstructionChange}
          readOnlyInstruction={Boolean(stagedApplication)}
        >
          <Button
            disabled={busy || !frameConfirmed || (!stagedApplication && (!selectedReferenceId || !currentUserInstruction.trim()))}
            icon={Link2}
            onClick={onConnect}
            size="sm"
            variant="secondary"
          >
            {stagedApplication ? 'Finish connection' : 'Adapt to this edit'}
          </Button>
        </LifecycleReview>
      ) : null}
    </section>
  )
}

function applicationSourceLabel(source: PreferenceApplicationRecord['applicationSource']): string {
  if (source === 'setup_selector') return 'Selected during New Edit setup'
  if (source === 'chat_tag') return 'Applied from Edit Chat'
  return 'Connected from edit preferences'
}

function moveRadioSelection(
  event: KeyboardEvent<HTMLButtonElement>,
  optionIds: string[],
  currentIndex: number,
  onSelect: (referenceId: string) => void,
) {
  let nextIndex = -1
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % optionIds.length
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + optionIds.length) % optionIds.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = optionIds.length - 1
  if (nextIndex < 0) return
  event.preventDefault()
  const group = event.currentTarget.closest('[role="radiogroup"]')
  onSelect(optionIds[nextIndex]!)
  window.requestAnimationFrame(() => group?.querySelectorAll<HTMLElement>('[role="radio"]')[nextIndex]?.focus())
}

function LifecycleReview({
  busy,
  children,
  currentUserInstruction,
  frameConfirmed,
  onFrameConfirmedChange,
  onInstructionChange,
  readOnlyInstruction = false,
}: {
  busy: boolean
  children: React.ReactNode
  currentUserInstruction: string
  frameConfirmed: boolean
  onFrameConfirmedChange: (confirmed: boolean) => void
  onInstructionChange: (instruction: string) => void
  readOnlyInstruction?: boolean
}) {
  return (
    <div className="project-edit-session-reference-connection__review">
      <label htmlFor="edit-session-reference-instruction">Current direction for this edit</label>
      <textarea
        disabled={busy || readOnlyInstruction}
        id="edit-session-reference-instruction"
        maxLength={4000}
        onChange={(event) => onInstructionChange(event.target.value)}
        rows={3}
        value={currentUserInstruction}
      />
      <label className="project-edit-session-reference-connection__confirmation">
        <input
          checked={frameConfirmed}
          disabled={busy}
          onChange={(event) => onFrameConfirmedChange(event.target.checked)}
          type="checkbox"
        />
        <span>I confirm this Edit Chat’s saved output frame for target-aware adaptation.</span>
      </label>
      {children}
    </div>
  )
}
