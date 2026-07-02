import { Badge } from '../../Badge'
import type { SFXLibraryCandidateRecord } from '../../../types'
import { formatSFXLabel } from './sfxChatUiData'

type InlineSFXLibraryCandidateCardProps = {
  candidate?: SFXLibraryCandidateRecord
}

export function InlineSFXLibraryCandidateCard({ candidate }: InlineSFXLibraryCandidateCardProps) {
  return (
    <section className="inline-chat-card sfx-inline-card sfx-library-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Generated SFX library</span>
          <h3>{candidate ? formatSFXLabel(candidate.reuseStatus) : 'Project-only by default'}</h3>
        </div>
        <Badge accent={candidate?.reuseStatus === 'approved_internal_library' ? 'success' : 'warning'}>
          {candidate ? 'Mock candidate' : 'No candidate'}
        </Badge>
      </div>

      <p className="sfx-muted-note">Generated SFX starts project-only.</p>
      <p className="sfx-muted-note">Reusable library promotion requires QA, non-private context, and provenance review.</p>

      {candidate ? (
        <>
          <div className="sfx-score-grid">
            <span><strong>Reason</strong>{candidate.candidateReason}</span>
            <span><strong>Quality score</strong>{candidate.qualityScore}</span>
            <span><strong>Target layer</strong>{formatSFXLabel(candidate.targetLayer)}</span>
            <span><strong>Use case</strong>{formatSFXLabel(candidate.useCase)}</span>
            <span><strong>Provider</strong>{formatSFXLabel(candidate.provider)}</span>
            <span><strong>General purpose</strong>{formatSFXLabel(candidate.generalPurpose)}</span>
            <span><strong>Private context</strong>{formatSFXLabel(candidate.containsPrivateContext)}</span>
            <span><strong>License review</strong>{formatSFXLabel(candidate.licenseReviewRequired)}</span>
          </div>
          <details className="sfx-details">
            <summary>Library metadata</summary>
            <div className="sfx-pill-row">
              {candidate.tags.slice(0, 12).map((tag) => <span className="sfx-policy-badge" key={tag}>{tag}</span>)}
            </div>
            <div className="music-summary-list">
              <span>Recommended uses</span>
              <strong>{candidate.recommendedUseCases.map(formatSFXLabel).join(', ')}</strong>
            </div>
            <div className="music-summary-list">
              <span>Avoid uses</span>
              <strong>{candidate.avoidUseCases.map(formatSFXLabel).join(', ')}</strong>
            </div>
            <ul className="sfx-compact-list">
              {candidate.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </details>
        </>
      ) : (
        <p className="sfx-warning">No reusable library candidate is created for this cue yet.</p>
      )}
    </section>
  )
}
