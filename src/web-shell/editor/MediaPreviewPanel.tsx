import { Play, RectangleHorizontal } from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'

export function MediaPreviewPanel() {
  return (
    <section className="web-shell-panel web-shell-preview-panel">
      <div className="web-shell-panel-heading compact">
        <h2>Media preview</h2>
        <StatusBadge tone="warning">Static placeholder</StatusBadge>
      </div>
      <div className="web-shell-preview-frame" aria-label="Static media preview placeholder">
        <RectangleHorizontal aria-hidden="true" size={44} />
        <button className="web-shell-play-button" type="button" disabled>
          <Play aria-hidden="true" size={22} />
          <span className="web-shell-sr-only">Preview playback disabled</span>
        </button>
      </div>
      <p>Current web shell does not decode, process, render, or export media locally.</p>
    </section>
  )
}
