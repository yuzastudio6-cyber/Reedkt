import type { WebShellArtifact } from '../web-shell-types'
import { ArtifactPrivacyBadge } from './ArtifactPrivacyBadge'

interface ArtifactCardProps {
  artifact: WebShellArtifact
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  return (
    <article className="web-shell-panel web-shell-artifact-card">
      <div className="web-shell-panel-heading compact">
        <div>
          <p className="web-shell-eyebrow">{artifact.kind.replaceAll('_', ' ')}</p>
          <h3>{artifact.label}</h3>
        </div>
        <ArtifactPrivacyBadge />
      </div>
      <p>{artifact.summary}</p>
      <button className="web-shell-button" type="button" disabled>
        Open review disabled
      </button>
    </article>
  )
}
