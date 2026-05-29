import { StatusBadge } from '../components/StatusBadge'

const captionRows = [
  'Caption timing review available',
  'Safe-zone warning is review-only',
  'Transcript text omitted from shell fixtures',
]

export function TranscriptCaptionPanel() {
  return (
    <section className="web-shell-panel">
      <div className="web-shell-panel-heading compact">
        <h2>Transcript and captions</h2>
        <StatusBadge tone="private">Private metadata</StatusBadge>
      </div>
      <ul className="web-shell-row-list">
        {captionRows.map((row) => (
          <li key={row}>
            <span>{row}</span>
            <StatusBadge tone="info">Review</StatusBadge>
          </li>
        ))}
      </ul>
    </section>
  )
}
