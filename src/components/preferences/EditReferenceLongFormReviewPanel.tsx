import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CircleAlert, FileCheck2, ShieldCheck, X } from 'lucide-react'
import type {
  ApplyEditReferenceLongFormStudyReviewRequest,
  EditReferenceLongFormReviewCopyRiskKind,
  EditReferenceLongFormStudyReviewData,
  EditReferenceLongFormStudyReviewDecision,
  EditReferenceLongFormStudyReviewDecisionKind,
} from '../../types/edit-reference-long-form-review'
import { EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION } from '../../types/edit-reference-long-form-review'
import { Button } from '../Button'

type ReviewSaveInput = Pick<
  ApplyEditReferenceLongFormStudyReviewRequest,
  'decisions' | 'acknowledgeAdaptNotCopy' | 'acknowledgeFactSafetyReview'
>

export type EditReferenceLongFormReviewSaveResult =
  | { ok: true }
  | { ok: false; message: string }

interface EditReferenceLongFormReviewPanelProps {
  disabled: boolean
  onClose: () => void
  onSave: (input: ReviewSaveInput) => Promise<EditReferenceLongFormReviewSaveResult>
  review: EditReferenceLongFormStudyReviewData
}

const decisionOptions: ReadonlyArray<{
  description: string
  label: string
  value: EditReferenceLongFormStudyReviewDecisionKind
}> = [
  {
    value: 'adapt',
    label: 'Adapt the principle',
    description: 'Use the underlying editing idea while changing the expression for each future video.',
  },
  {
    value: 'context_only',
    label: 'Keep as context',
    description: 'Remember it as background, but do not turn it into a reusable editing rule.',
  },
  {
    value: 'avoid',
    label: 'Avoid this direction',
    description: 'Record that this treatment should not shape future edits.',
  },
]

export function EditReferenceLongFormReviewPanel({
  disabled,
  onClose,
  onSave,
  review,
}: EditReferenceLongFormReviewPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const editable = review.selection.status === 'needs_selection'
  const initialDecisions = useMemo(() => Object.fromEntries(
    review.selection.decisions.map((decision) => [decision.findingId, decision.decision]),
  ) as Record<string, EditReferenceLongFormStudyReviewDecisionKind>, [review.selection.decisions])
  const [decisions, setDecisions] = useState(initialDecisions)
  const [activeIndex, setActiveIndex] = useState(0)
  const [acknowledgeAdaptNotCopy, setAcknowledgeAdaptNotCopy] = useState(false)
  const [acknowledgeFactSafetyReview, setAcknowledgeFactSafetyReview] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const findings = review.findings
  const activeFinding = findings[activeIndex]
  const requiredFindings = findings.filter((finding) => finding.requiresUserSelection)
  const completedDecisionCount = requiredFindings.filter((finding) => Boolean(decisions[finding.findingId])).length
  const needsAdaptAcknowledgement = requiredFindings.some((finding) => decisions[finding.findingId] === 'adapt')
  const needsFactSafetyAcknowledgement = requiredFindings.some((finding) => (
    finding.specialistId === 'story_editorial' && decisions[finding.findingId] === 'adapt'
  ))
  const decisionsComplete = completedDecisionCount === requiredFindings.length
  const acknowledgementsComplete = (!needsAdaptAcknowledgement || acknowledgeAdaptNotCopy)
    && (!needsFactSafetyAcknowledgement || acknowledgeFactSafetyReview)
  const canSave = editable && decisionsComplete && acknowledgementsComplete && !disabled && !saving
  const dirty = editable && (
    Object.keys(decisions).length > 0
    || acknowledgeAdaptNotCopy
    || acknowledgeFactSafetyReview
  )

  useEffect(() => {
    const focusId = window.requestAnimationFrame(() => headingRef.current?.focus())
    return () => window.cancelAnimationFrame(focusId)
  }, [])

  useEffect(() => {
    if (!dirty) return
    const protectDraft = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', protectDraft)
    return () => window.removeEventListener('beforeunload', protectDraft)
  }, [dirty])

  if (!activeFinding) {
    return (
      <section className="edit-reference-long-form-review" data-testid="edit-reference-long-form-review">
        <div className="edit-reference-long-form-notice warning" role="status">
          The review package contains no findings. Close this review and check the study again.
        </div>
        <Button onClick={onClose} size="sm" variant="ghost">Close review</Button>
      </section>
    )
  }

  const setDecision = (decision: EditReferenceLongFormStudyReviewDecisionKind) => {
    if (!editable || disabled || (decision === 'adapt' && !activeFinding.canAdapt)) return
    setSaveError(undefined)
    setDecisions((current) => ({ ...current, [activeFinding.findingId]: decision }))
  }

  const requestClose = () => {
    if (dirty) setConfirmDiscard(true)
    else onClose()
  }

  const saveReview = async () => {
    if (!canSave) return
    setSaving(true)
    setSaveError(undefined)
    const reviewDecisions: EditReferenceLongFormStudyReviewDecision[] = requiredFindings.map((finding) => ({
      schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION,
      findingId: finding.findingId,
      decision: decisions[finding.findingId],
    }))
    const result = await onSave({
      decisions: reviewDecisions,
      acknowledgeAdaptNotCopy,
      acknowledgeFactSafetyReview,
    })
    if (!result.ok) setSaveError(result.message)
    setSaving(false)
  }

  const selectedDecision = decisions[activeFinding.findingId]
  const confidenceLabel = formatFindingConfidence(activeFinding.confidence)
  const selectedSummary = review.selection

  return (
    <section
      aria-labelledby="edit-reference-long-form-review-title"
      className="edit-reference-long-form-review"
      data-selection-status={review.selection.status}
      data-testid="edit-reference-long-form-review"
    >
      <header className="edit-reference-long-form-review__header">
        <div>
          <span className="section-eyebrow">Study review</span>
          <h3 id="edit-reference-long-form-review-title" ref={headingRef} tabIndex={-1}>
            Choose what ReEditPro should learn
          </h3>
          <p>
            Review one finding at a time. Nothing becomes reusable guidance or applies to an edit until you approve those later steps separately.
          </p>
        </div>
        <Button aria-label="Close study review" disabled={saving} icon={X} onClick={requestClose} size="sm" variant="ghost">
          Close
        </Button>
      </header>

      {review.selection.status === 'selected' ? (
        <div className="edit-reference-long-form-review__saved" role="status">
          <FileCheck2 aria-hidden="true" size={18} />
          <div>
            <strong>Review saved</strong>
            <span>
              {selectedSummary.adaptedFindingCount} adapted · {selectedSummary.contextOnlyFindingCount} context only · {selectedSummary.avoidedFindingCount} avoided
              {selectedSummary.notApplicableFindingCount > 0 ? ` · ${selectedSummary.notApplicableFindingCount} not applicable` : ''}
            </span>
          </div>
        </div>
      ) : (
        <div className="edit-reference-long-form-review__progress" aria-live="polite">
          <span>Finding {activeIndex + 1} of {findings.length}</span>
          <strong>{completedDecisionCount} of {requiredFindings.length} choices complete</strong>
        </div>
      )}

      <article className="edit-reference-long-form-review__finding" data-status={activeFinding.status}>
        <div className="edit-reference-long-form-review__finding-heading">
          <div>
            <span>{specialistLabel(activeFinding.specialistId)}</span>
            <h4>{activeFinding.title}</h4>
          </div>
          <span>{confidenceLabel} confidence · {activeFinding.semanticWindowCount} section{activeFinding.semanticWindowCount === 1 ? '' : 's'}</span>
        </div>
        <p>{activeFinding.summary}</p>

        {activeFinding.copyRiskKinds.length > 0 ? (
          <div className="edit-reference-long-form-review__risk">
            <CircleAlert aria-hidden="true" size={17} />
            <div>
              <strong>Copy-safety boundary</strong>
              <span>{copyRiskSummary(activeFinding.copyRiskKinds)}</span>
            </div>
          </div>
        ) : null}

        {activeFinding.status === 'not_applicable' ? (
          <div className="edit-reference-long-form-review__not-applicable">
            This area was not present in the source, so no preference choice is required.
          </div>
        ) : (
          <fieldset className="edit-reference-long-form-review__choices" disabled={!editable || disabled || saving}>
            <legend className="sr-only">How should “{activeFinding.title}” influence future edits?</legend>
            {decisionOptions.map((option) => {
              const optionDisabled = option.value === 'adapt' && !activeFinding.canAdapt
              return (
                <label data-selected={selectedDecision === option.value ? 'true' : 'false'} key={option.value}>
                  <input
                    checked={selectedDecision === option.value}
                    disabled={optionDisabled}
                    name={`long-form-review-${activeFinding.findingId}`}
                    onChange={() => setDecision(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{optionDisabled ? 'Unavailable because this finding could copy protected expression.' : option.description}</small>
                  </span>
                </label>
              )
            })}
          </fieldset>
        )}
      </article>

      <div className="edit-reference-long-form-review__navigation" aria-label="Study finding navigation">
        <Button disabled={activeIndex === 0 || saving} icon={ArrowLeft} onClick={() => setActiveIndex((value) => Math.max(0, value - 1))} size="sm" variant="ghost">
          Previous
        </Button>
        <span aria-live="polite">{activeIndex + 1} / {findings.length}</span>
        <Button disabled={activeIndex === findings.length - 1 || saving} icon={ArrowRight} onClick={() => setActiveIndex((value) => Math.min(findings.length - 1, value + 1))} size="sm" variant="ghost">
          Next
        </Button>
      </div>

      {editable && decisionsComplete && (needsAdaptAcknowledgement || needsFactSafetyAcknowledgement) ? (
        <div className="edit-reference-long-form-review__acknowledgements">
          <strong>Final checks</strong>
          {needsAdaptAcknowledgement ? (
            <label>
              <input checked={acknowledgeAdaptNotCopy} onChange={(event) => setAcknowledgeAdaptNotCopy(event.target.checked)} type="checkbox" />
              <span>I understand ReEditPro will adapt principles, not copy exact shots, timing, layouts, branding, music, or sound.</span>
            </label>
          ) : null}
          {needsFactSafetyAcknowledgement ? (
            <label>
              <input checked={acknowledgeFactSafetyReview} onChange={(event) => setAcknowledgeFactSafetyReview(event.target.checked)} type="checkbox" />
              <span>I reviewed the story and factual-safety limits before adapting this editorial direction.</span>
            </label>
          ) : null}
        </div>
      ) : null}

      {saveError ? <p className="edit-reference-long-form-notice warning" role="alert">{saveError} Your choices are still here; try again when ready.</p> : null}
      {confirmDiscard ? (
        <div className="edit-reference-long-form-review__discard" role="alert">
          <div>
            <strong>Discard unsaved review choices?</strong>
            <span>The study findings remain safe. Only the choices in this open review will be cleared.</span>
          </div>
          <div>
            <Button onClick={() => setConfirmDiscard(false)} size="sm" variant="ghost">Keep reviewing</Button>
            <Button onClick={onClose} size="sm" variant="danger">Discard choices</Button>
          </div>
        </div>
      ) : null}

      <footer className="edit-reference-long-form-review__footer">
        <div>
          <ShieldCheck aria-hidden="true" size={17} />
          <span>{editable
            ? decisionsComplete
              ? acknowledgementsComplete
                ? 'Ready to save this review.'
                : 'Complete the final checks to continue.'
              : `${requiredFindings.length - completedDecisionCount} choice${requiredFindings.length - completedDecisionCount === 1 ? '' : 's'} remaining.`
            : 'Saved review choices are read-only. Reusable guidance is still a separate approval step.'}</span>
        </div>
        {editable ? (
          <Button
            data-testid="save-edit-reference-long-form-review"
            disabled={!canSave}
            icon={FileCheck2}
            onClick={() => void saveReview()}
            size="sm"
            variant="primary"
          >
            {saving ? 'Saving review…' : 'Save review'}
          </Button>
        ) : null}
      </footer>
    </section>
  )
}

function specialistLabel(specialistId: EditReferenceLongFormStudyReviewData['findings'][number]['specialistId']): string {
  switch (specialistId) {
    case 'visual_language': return 'Visual language'
    case 'story_editorial': return 'Story and editorial'
    case 'speech_pacing': return 'Speech and pacing'
    case 'caption_design': return 'Caption design'
    case 'color_treatment': return 'Color treatment'
    case 'audio_sound_design': return 'Audio and sound'
    case 'graphics_motion': return 'Graphics and motion'
  }
}

function formatFindingConfidence(confidence: number): string {
  if (confidence >= 0.85) return 'High'
  if (confidence >= 0.65) return 'Moderate'
  return 'Limited'
}

function copyRiskSummary(copyRisks: readonly EditReferenceLongFormReviewCopyRiskKind[]): string {
  const labels = copyRisks.map((risk) => {
    switch (risk) {
      case 'exact_shot_order': return 'exact shot order'
      case 'exact_timing': return 'exact timing'
      case 'exact_graphic_layout': return 'exact graphic layout'
      case 'exact_music_or_sfx': return 'exact music or sound design'
      case 'creator_or_brand_identity': return 'creator or brand identity'
      case 'reference_as_project_footage': return 'the reference as project footage'
    }
  })
  return `Do not reproduce ${new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(labels)}.`
}
