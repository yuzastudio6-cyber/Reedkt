import { Play, RotateCcw, Save, UploadCloud } from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'

type PreviewReadyCardProps = {
  creditsUsed: number
  runtimeEvents?: string[]
}

export function PreviewReadyCard({ creditsUsed, runtimeEvents = [] }: PreviewReadyCardProps) {
  return (
    <section className="inline-chat-card preview-ready-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Preview ready</span>
          <h3>Your mock edit is ready to review</h3>
        </div>
        <Badge accent="success">{creditsUsed} estimated credits</Badge>
      </div>
      <div className="chat-preview-frame" aria-label="Mock edited video preview">
        <div className="speaker-frame">
          <div className="speaker-silhouette" />
          <div className="caption-strip">"This is a major investment."</div>
          <div className="visual-overlay compact-visual-overlay">
            <strong>Property details</strong>
            <small>Location / Space / Finish</small>
          </div>
          <div className="real-motion-overlay compact-real-motion">
            <span>Face-safe overlay</span>
          </div>
        </div>
      </div>
      <div className="preview-system-row">
        <Badge accent="cyan">Stroke Motion: 2 moments</Badge>
        <Badge accent="blue">Graphic Design: 1 overlay</Badge>
        <Badge accent="violet">Real Motion: optional overlay</Badge>
        <Badge accent="success">SoundSync: music + SFX</Badge>
      </div>
      {runtimeEvents.length > 0 && (
        <div className="local-preview-runtime-summary">
          <strong>Local MVP runtime completed</strong>
          {runtimeEvents.slice(-4).map((event) => (
            <span key={event}>{event}</span>
          ))}
        </div>
      )}
      <p className="inline-helper">
        This is a mock preview state. In production, generated assets, renderer jobs, and final export would be tracked against the approved credit estimate.
        Failed ReeditPro generation would follow the refund/restore policy.
      </p>
      <div className="inline-card-actions">
        <Button icon={Play} variant="primary">Play preview</Button>
        <Button icon={RotateCcw} variant="secondary">Request revision</Button>
        <Button icon={UploadCloud} variant="ghost">Export</Button>
        <Button icon={Save} variant="ghost">Save draft</Button>
      </div>
    </section>
  )
}
