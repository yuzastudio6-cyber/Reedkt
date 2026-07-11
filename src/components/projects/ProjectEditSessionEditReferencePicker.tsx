import { CheckCircle2, Link2, ShieldCheck } from 'lucide-react'
import type { EditReferenceListItem, PreferenceApplicationRecord } from '../../types/edit-reference'
import type { PreferenceApplicationDownstreamContext } from '../../types/edit-reference-integration'
import { Badge } from '../Badge'
import { Button } from '../Button'

type ProjectEditSessionEditReferencePickerProps = {
  approvedReferences: EditReferenceListItem[]
  backendAvailable: boolean
  busy: boolean
  currentUserInstruction: string
  frameConfirmed: boolean
  onConnect: () => void
  onFrameConfirmedChange: (confirmed: boolean) => void
  onInstructionChange: (instruction: string) => void
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
  currentUserInstruction,
  frameConfirmed,
  onConnect,
  onFrameConfirmedChange,
  onInstructionChange,
  onSelectReference,
  selectedReferenceId,
  stagedApplication,
  activeContext,
  targetLabel,
}: ProjectEditSessionEditReferencePickerProps) {
  if (activeContext) {
    return (
      <section className="project-edit-session-reference-connection is-connected" data-testid="edit-session-edit-reference-connection">
        <div className="project-edit-session-reference-connection__heading">
          <div>
            <span className="section-eyebrow">Target-adapted guidance</span>
            <h4>{activeContext.editReferenceName}</h4>
          </div>
          <Badge accent="success">Connected mock-locally</Badge>
        </div>
        <p>{activeContext.summary}</p>
        <div className="project-edit-session-reference-connection__metrics">
          <span><CheckCircle2 aria-hidden="true" size={14} />{activeContext.guidance.length} adapted</span>
          <span><ShieldCheck aria-hidden="true" size={14} />{activeContext.heldBack.length} held back</span>
          <span>{activeContext.doNotCopyRules.length} boundaries</span>
        </div>
        <p className="project-edit-session-reference-connection__priority">
          Current instructions and confirmed Edit Brief markers stay above this reusable guidance.
        </p>
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
        <Badge accent={backendAvailable ? 'violet' : 'muted'}>{backendAvailable ? 'Private beta' : 'Unavailable'}</Badge>
      </div>
      <p className="project-edit-session-reference-connection__intro">
        Choose approved creative intelligence. ReEditPro adapts it to {targetLabel}; it never copies the reference as a shot list.
      </p>
      {!backendAvailable ? (
        <p className="project-edit-session-reference-connection__notice">Configure the private Edit Reference backend to load approved references.</p>
      ) : stagedApplication ? (
        <div className="project-edit-session-reference-connection__staged" data-testid="edit-session-edit-reference-staged">
          <strong>{stagedApplication.editReferenceName}</strong>
          <span>Target adaptation is prepared. Finish the exact mock/local connection.</span>
        </div>
      ) : approvedReferences.length ? (
        <div className="project-edit-session-reference-connection__options" role="radiogroup" aria-label="Approved Edit References">
          {approvedReferences.map((item) => {
            const selected = item.reference.id === selectedReferenceId
            return (
              <button
                aria-checked={selected}
                className={selected ? 'is-selected' : ''}
                data-testid={`edit-session-edit-reference-option-${item.reference.id}`}
                disabled={busy}
                key={item.reference.id}
                onClick={() => onSelectReference(item.reference.id)}
                role="radio"
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
        <div className="project-edit-session-reference-connection__review">
          <label htmlFor="edit-session-reference-instruction">Current direction for this edit</label>
          <textarea
            disabled={busy || Boolean(stagedApplication)}
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
          <Button
            disabled={busy || !frameConfirmed || (!stagedApplication && (!selectedReferenceId || !currentUserInstruction.trim()))}
            icon={Link2}
            onClick={onConnect}
            size="sm"
            variant="secondary"
          >
            {stagedApplication ? 'Finish connection' : 'Adapt to this edit'}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
