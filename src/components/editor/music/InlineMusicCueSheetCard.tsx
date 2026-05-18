import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { MusicCueSheetRecord } from '../../../types/audio-music'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import { formatMusicLabel, type MusicContextView } from './musicChatUiData'

type InlineMusicCueSheetCardProps = {
  approved: boolean
  context: MusicContextView
  cueSheet: MusicCueSheetRecord
  onApprove: () => void
  onAmbienceOnly: () => void
  onInstrumentalOnly: () => void
  onLowerCost: () => void
}

export function InlineMusicCueSheetCard({
  approved,
  context,
  cueSheet,
  onAmbienceOnly,
  onApprove,
  onInstrumentalOnly,
  onLowerCost,
}: InlineMusicCueSheetCardProps) {
  const lyricsAllowed = cueSheet.items.some((cue) => cue.vocalPolicy === 'lyrics_allowed_no_speech' || cue.vocalPolicy === 'light_vocal_texture')
  const dialogueSafeRequired = cueSheet.items.some((cue) => cue.speechSafety === 'duck_under_voice' || cue.vocalPolicy === 'no_vocals_under_dialogue')
  const moodList = Array.from(new Set(cueSheet.items.map((cue) => cue.mood)))
  const energyArc = cueSheet.items.map((cue) => formatMusicLabel(cue.energyLevel)).join(' -> ')

  return (
    <InlinePlanCardShell
      actions={<Badge accent={approved ? 'success' : 'warning'}>{approved ? 'Approved' : 'Approval required'}</Badge>}
      className="music-inline-card music-cue-sheet-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{cueSheet.items.length} cues</span>
          <span className="compact-summary-chip">Multi-cue</span>
          <span className="compact-summary-chip">Reference DNA used</span>
        </div>
      )}
      defaultExpanded
      eyebrow="Cue sheet"
      helper="Here is the music cue sheet before generating anything."
      priority="required_user_action"
      status={approved ? 'approved' : 'needs_input'}
      title="Music cue sheet"
    >
      <p className="music-muted-note">{cueSheet.summary}</p>
      <div className="music-info-grid">
        <span><strong>Cue plan</strong>{context.cueCountDecision}</span>
        <span><strong>Overall mood</strong>{moodList.map(formatMusicLabel).join(', ')}</span>
        <span><strong>Energy arc</strong>{energyArc}</span>
        <span><strong>Lyrics allowed somewhere</strong>{lyricsAllowed ? 'Yes, montage/no-speech only' : 'No'}</span>
        <span><strong>Dialogue-safe required</strong>{dialogueSafeRequired ? 'Yes' : 'No'}</span>
        <span><strong>Approval required</strong>Yes</span>
      </div>
      <ol className="music-cue-list">
        {cueSheet.items.map((cue) => (
          <li key={cue.id}>
            <strong>Cue {cue.cueOrder} - {cue.label}</strong>
            <span>{formatMusicLabel(cue.cueRole)} / {formatMusicLabel(cue.sectionType)}</span>
          </li>
        ))}
      </ol>
      <div className="inline-card-actions">
        <Button disabled={approved} onClick={onApprove} variant="primary">
          {approved ? 'Music plan approved' : 'Approve music plan'}
        </Button>
        <Button disabled={approved} onClick={onLowerCost} variant="secondary">Lower music cost</Button>
        <Button disabled={approved} onClick={onInstrumentalOnly} variant="ghost">Instrumental only</Button>
        <Button disabled={approved} onClick={onAmbienceOnly} variant="ghost">Keep ambience only</Button>
      </div>
    </InlinePlanCardShell>
  )
}
