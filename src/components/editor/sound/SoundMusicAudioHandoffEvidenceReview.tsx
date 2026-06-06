import { Badge } from '../../Badge'
import type {
  SoundMusicAudioEvidenceStatus,
  SoundMusicAudioHandoffEvidenceReview,
} from './buildSoundMusicAudioHandoffEvidenceReview'

function label(value: string | number | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  return value?.replaceAll('_', ' ') ?? 'none'
}

function statusAccent(status: SoundMusicAudioEvidenceStatus): 'cyan' | 'danger' | 'muted' | 'success' | 'warning' {
  if (status === 'metadata_only' || status === 'metadata_ready' || status === 'mock_safe' || status === 'planning_ready') return 'cyan'
  if (status === 'blocked' || status === 'not_created') return 'danger'
  if (status === 'handoff_required' || status === 'missing_future_evidence' || status === 'not_ready' || status === 'warning') return 'warning'
  if (status === 'accepted_by_consumer' || status === 'ready') return 'success'
  return 'muted'
}

export function SoundMusicAudioHandoffEvidenceReviewPanel({
  review,
}: {
  review: SoundMusicAudioHandoffEvidenceReview
}) {
  return (
    <>
      <details className="understanding-section" open>
        <summary>Mock handoff evidence review</summary>
        <div className="renderer-badge-row">
          <Badge accent="warning">Display only</Badge>
          <Badge accent="danger">Real generation/export blocked</Badge>
          <Badge accent="cyan">{review.workstreamId}</Badge>
          <Badge accent="muted">evidenceRecordsCreated={label(review.evidenceRecordsCreated)}</Badge>
        </div>
        <p className="audio-tool-note">
          This review normalizes mock readiness evidence for handoff discussion only. It creates no approved snapshots, evidence records, credit rows, provider calls, workers, storage writes, public artifacts, signed access, Supabase mutations, or final exports.
        </p>

        <div className="clip-audio-plan-list">
          {review.rows.map((row) => (
            <article className="clip-audio-plan-item" key={row.evidenceKey}>
              <div>
                <span className="section-eyebrow">{row.evidenceKey.replaceAll('_', ' ')}</span>
                <h4>{row.label}</h4>
              </div>
              <div className="renderer-badge-row">
                <Badge accent={statusAccent(row.status)}>{label(row.status)}</Badge>
                <Badge accent="danger">realExecutionReady={label(row.realExecutionReady)}</Badge>
                <Badge accent="muted">recordCreated={label(row.evidenceRecordCreated)}</Badge>
              </div>
              <div className="layout-mode-meta">
                <span><strong>Current mock metadata</strong>{row.currentEvidence.join(', ') || 'none'}</span>
                <span><strong>Missing future evidence</strong>{row.missingFutureEvidence.join(', ') || 'none'}</span>
                <span><strong>Next owner</strong>{row.nextOwners.join(', ') || 'none'}</span>
                <span><strong>Blocked uses</strong>{row.blockedUses.map(label).join(', ') || 'none'}</span>
              </div>
              <ul className="sfx-compact-list">
                {row.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Blocked uses / next owners</summary>
        <div className="audio-qa-list">
          {review.realGenerationExportBlockedReasons.map((reason) => <span key={reason}>{reason}</span>)}
        </div>
        <div className="clip-audio-plan-list">
          {review.blockedUseOwnerMap.map((mapping) => (
            <article className="clip-audio-plan-item" key={mapping.blockedUse}>
              <div>
                <span className="section-eyebrow">blocked use</span>
                <h4>{label(mapping.blockedUse)}</h4>
              </div>
              <div className="layout-mode-meta">
                <span><strong>Next owner</strong>{mapping.nextOwners.join(', ')}</span>
                <span><strong>Reason</strong>{mapping.explanation}</span>
              </div>
            </article>
          ))}
        </div>
      </details>
    </>
  )
}
