import { useId } from 'react'
import type { CurrentEditReferenceSupplementOption } from '../../../lib/current-edit-reference-study-supplement'

export function EditReferenceApprovedGuidanceSummary({
  option,
}: {
  option: CurrentEditReferenceSupplementOption
}) {
  const titleId = useId()
  const confidence = option.evidenceConfidence === undefined
    ? undefined
    : `${Math.round(Math.min(1, Math.max(0, option.evidenceConfidence)) * 100)}%`

  return (
    <section
      aria-labelledby={titleId}
      className="current-edit-reference-guidance"
      data-testid="current-edit-reference-approved-guidance"
    >
      <header className="current-edit-reference-guidance__heading">
        <div>
          <strong id={titleId}>Approved reusable guidance</strong>
          <p>{option.summary}</p>
        </div>
        <span className="current-edit-reference-guidance__verified">
          <span aria-hidden="true" />
          Evidence reviewed
        </span>
      </header>

      <dl className="current-edit-reference-guidance__facts">
        {option.approvedGuidanceVersion !== undefined ? (
          <div>
            <dt>Version</dt>
            <dd>{option.approvedGuidanceVersion}</dd>
          </div>
        ) : null}
        {confidence ? (
          <div>
            <dt>Evidence confidence</dt>
            <dd>{confidence}{option.evidenceConfidenceBand ? ` · ${formatLabel(option.evidenceConfidenceBand)}` : ''}</dd>
          </div>
        ) : null}
        {option.copySafetyBoundaryCount !== undefined ? (
          <div>
            <dt>Copy-safety boundaries</dt>
            <dd>{option.copySafetyBoundaryCount}</dd>
          </div>
        ) : null}
      </dl>

      {option.layerLabels?.length ? (
        <div className="current-edit-reference-guidance__layers" aria-label="Approved guidance areas">
          {Array.from(new Set(option.layerLabels)).map((label) => <span key={label}>{label}</span>)}
        </div>
      ) : null}
    </section>
  )
}

function formatLabel(value: string): string {
  return value.replaceAll('_', ' ').replace(/^./, (character) => character.toUpperCase())
}
