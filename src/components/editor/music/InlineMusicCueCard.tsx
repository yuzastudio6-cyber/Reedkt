import { Badge } from '../../Badge'
import type { MusicCueSheetItemRecord } from '../../../types/audio-music'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import { formatMusicLabel, getCueDurationLabel } from './musicChatUiData'

type InlineMusicCueCardProps = {
  cue: MusicCueSheetItemRecord
}

export function InlineMusicCueCard({ cue }: InlineMusicCueCardProps) {
  const voiceFirst = cue.speechSafety === 'duck_under_voice' || cue.vocalPolicy === 'no_vocals_under_dialogue'
  const lyricsAllowed = cue.vocalPolicy === 'lyrics_allowed_no_speech' || cue.vocalPolicy === 'light_vocal_texture'

  return (
    <InlinePlanCardShell
      className="music-inline-card music-cue-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{formatMusicLabel(cue.cueRole)}</span>
          <span className="compact-summary-chip">{getCueDurationLabel(cue)}</span>
          <span className="compact-summary-chip">{formatMusicLabel(cue.energyLevel)}</span>
        </div>
      )}
      defaultExpanded={false}
      eyebrow={`Cue ${cue.cueOrder}`}
      priority="advanced_plan_detail"
      status="ready"
      title={cue.label}
    >
      <div className="music-info-grid">
        <span><strong>Scene type</strong>{formatMusicLabel(cue.sectionType)}</span>
        <span><strong>Target duration</strong>{getCueDurationLabel(cue)}</span>
        <span><strong>Mood</strong>{formatMusicLabel(cue.mood)}</span>
        <span><strong>Genre families</strong>{cue.genreHints.map(formatMusicLabel).join(', ')}</span>
        <span><strong>Energy level</strong>{formatMusicLabel(cue.energyLevel)}</span>
        <span><strong>Energy arc</strong>{formatMusicLabel(cue.energyLevel)} for this scene</span>
        <span><strong>Culture region</strong>Style DNA only; no copied music</span>
        <span><strong>Vocal policy</strong>{formatMusicLabel(cue.vocalPolicy)}</span>
        <span><strong>Lyric language policy</strong>{lyricsAllowed ? 'No-speech montage only' : 'Blocked'}</span>
        <span><strong>Speech safety</strong>{formatMusicLabel(cue.speechSafety)}</span>
        <span><strong>Instrumentation</strong>{cue.genreHints.map(formatMusicLabel).join(', ')}</span>
        <span><strong>Prompt goal</strong>{cue.adaptationNotes[0] ?? 'Support the edit without copying reference music.'}</span>
        <span><strong>Ducking required</strong>{voiceFirst ? 'Yes' : 'No'}</span>
        <span><strong>Loopable needed</strong>{cue.sectionType === 'montage' || cue.sectionType === 'movement' ? 'Helpful' : 'Optional'}</span>
        <span><strong>Credit impact</strong>{cue.sectionType === 'dialogue' ? 'Low' : 'Medium'}</span>
      </div>
      <div className="music-pill-row">
        {voiceFirst && <Badge accent="success">Voice-first cue. Lyrics are blocked by default.</Badge>}
        {lyricsAllowed && <Badge accent="warning">Lyrics only allowed in no-speech sections.</Badge>}
      </div>
    </InlinePlanCardShell>
  )
}
