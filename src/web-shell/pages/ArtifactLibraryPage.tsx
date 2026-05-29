import { ArtifactCard } from '../artifacts/ArtifactCard'
import { StatusBadge } from '../components/StatusBadge'
import { privateArtifacts } from '../web-shell-fixtures'

export function ArtifactLibraryPage() {
  return (
    <div className="web-shell-page">
      <section className="web-shell-page-heading">
        <div>
          <p className="web-shell-eyebrow">Artifact library</p>
          <h2>Private artifacts are visible for review only.</h2>
          <p>
            Source media, transcripts, captions, manifests, exports, masks, previews, and QA reports stay private. Model
            weight artifacts are not user-facing.
          </p>
        </div>
        <StatusBadge tone="private">Private by default</StatusBadge>
      </section>
      <section className="web-shell-grid three">
        {privateArtifacts.map((artifact) => (
          <ArtifactCard key={artifact.artifactId} artifact={artifact} />
        ))}
      </section>
    </div>
  )
}
