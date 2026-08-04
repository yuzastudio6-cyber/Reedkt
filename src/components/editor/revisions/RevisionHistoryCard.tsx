import { Trash2 } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type {
  RevisionRequest,
  RevisionVersionRecord,
} from '../../../types'

type RevisionHistoryCardProps = {
  versions: RevisionVersionRecord[]
  revisionRequests: RevisionRequest[]
  onClearHistory?: () => void
}

export function RevisionHistoryCard({ onClearHistory, revisionRequests, versions }: RevisionHistoryCardProps) {
  const requestById = new Map(revisionRequests.map((request) => [request.id, request]))

  return (
    <section className="inline-chat-card revision-history-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Revision history</span>
          <h3>Local preview and Edit Map versions</h3>
        </div>
        <Badge accent={versions.length ? 'success' : 'muted'}>{versions.length} versions</Badge>
      </div>
      {versions.length === 0 ? (
        <p className="inline-helper">No revision history yet.</p>
      ) : (
        <div className="revision-history-list">
          {versions.map((version) => {
            const request = requestById.get(version.revisionRequestId)
            return (
              <article className="revision-history-row" key={version.id}>
                <strong>Preview v{version.targetPreviewVersion} · Edit Map v{version.targetEditVersion}</strong>
                <small>{version.targetPreviewId} · {version.targetEditDocumentId}</small>
                <p>{request?.summary ?? version.summary}</p>
              </article>
            )
          })}
        </div>
      )}
      <div className="inline-card-actions">
        <Button disabled={revisionRequests.length === 0} icon={Trash2} onClick={onClearHistory} variant="ghost">Clear revision history</Button>
      </div>
    </section>
  )
}
