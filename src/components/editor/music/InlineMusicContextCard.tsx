import { Badge } from '../../Badge'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import type { MusicContextView } from './musicChatUiData'

type InlineMusicContextCardProps = {
  context: MusicContextView
}

export function InlineMusicContextCard({ context }: InlineMusicContextCardProps) {
  return (
    <InlinePlanCardShell
      className="music-inline-card music-context-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{context.cueCountDecision}</span>
          <span className="compact-summary-chip">Confidence {context.confidence}%</span>
          <span className="compact-summary-chip">Ambience preserved</span>
        </div>
      )}
      defaultExpanded
      eyebrow="SoundSync"
      helper="Music is planned before generation. ReeditPro does not generate random music."
      priority="user_summary"
      status="ready"
      title="Music context analysis"
    >
      <div className="music-info-grid">
        <span><strong>Primary scene type</strong>{context.primarySceneType}</span>
        <span><strong>Video topic</strong>{context.videoTopic}</span>
        <span><strong>Setting</strong>{context.settingSummary}</span>
        <span><strong>Culture context</strong>{context.cultureContext}</span>
        <span><strong>Music needed</strong>{context.musicNeeded ? 'Yes' : 'No'}</span>
        <span><strong>Speech</strong>{context.speechPresence}</span>
        <span><strong>Dialogue-heavy</strong>{context.dialogueHeavy ? 'Yes' : 'No'}</span>
        <span><strong>Montage detected</strong>{context.montageDetected ? 'Yes' : 'No'}</span>
      </div>
      <div className="music-pill-row">
        <Badge accent="cyan">Lyrics only in no-speech montage</Badge>
        <Badge accent="success">Instrumental dialogue beds</Badge>
        <Badge accent="violet">Style DNA only</Badge>
      </div>
      <p className="music-muted-note"><strong>User instruction:</strong> {context.userMusicInstructions}</p>
      <p className="music-muted-note"><strong>Avoid:</strong> {context.avoidMusicInstructions}</p>
    </InlinePlanCardShell>
  )
}
