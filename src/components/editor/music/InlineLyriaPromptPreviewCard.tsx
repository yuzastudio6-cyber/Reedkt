import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { LyriaPromptPlanRecord, MusicCueSheetItemRecord } from '../../../types/audio-music'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import { formatMusicLabel, getCueDurationLabel } from './musicChatUiData'

type InlineLyriaPromptPreviewCardProps = {
  cue: MusicCueSheetItemRecord
  promptPlan: LyriaPromptPlanRecord
  onAction: (message: string) => void
}

export function InlineLyriaPromptPreviewCard({ cue, onAction, promptPlan }: InlineLyriaPromptPreviewCardProps) {
  const lyricsAllowed = promptPlan.vocalPolicy === 'lyrics_allowed_no_speech' || promptPlan.vocalPolicy === 'light_vocal_texture'
  const instrumentalOnly = promptPlan.vocalPolicy === 'instrumental_only' || promptPlan.vocalPolicy === 'no_vocals_under_dialogue'

  return (
    <InlinePlanCardShell
      className="music-inline-card music-prompt-preview-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">Lyria Pro</span>
          <span className="compact-summary-chip">lyria-3-pro-preview</span>
          <span className="compact-summary-chip">Prompt preview only</span>
        </div>
      )}
      defaultExpanded={false}
      eyebrow="Prompt preview"
      helper="Prompt preview only. ReeditPro has not called Lyria or generated music yet."
      priority="developer_detail"
      status="ready"
      title={promptPlan.promptTitle}
    >
      <div className="music-info-grid">
        <span><strong>Provider</strong>Lyria Pro</span>
        <span><strong>Model</strong>lyria-3-pro-preview</span>
        <span><strong>Cue role</strong>{formatMusicLabel(cue.cueRole)}</span>
        <span><strong>Duration</strong>{getCueDurationLabel(cue)}</span>
        <span><strong>Instrumental only</strong>{instrumentalOnly ? 'Yes' : 'No'}</span>
        <span><strong>Lyrics allowed</strong>{lyricsAllowed ? 'No-speech sections only' : 'No'}</span>
        <span><strong>Target language</strong>{lyricsAllowed ? 'Unspecified vocal texture only' : 'None'}</span>
        <span><strong>Speech safety</strong>{formatMusicLabel(promptPlan.speechSafety)}</span>
      </div>
      <p className="music-muted-note"><strong>Timestamped structure:</strong> Use cue role and section duration only. Do not copy exact reference timing.</p>
      <p className="music-muted-note"><strong>Culture context:</strong> Broad premium European lifestyle mood, no stereotypes or copied songs.</p>
      <p className="music-muted-note"><strong>Quality:</strong> Original, speech-safe, mix-ready, clean ending.</p>
      <details className="compact-card-details">
        <summary>Show prompt</summary>
        <p className="music-prompt-text">{promptPlan.prompt}</p>
      </details>
      <details className="compact-card-details">
        <summary>Show negative prompt</summary>
        <p className="music-negative-prompt-text">{promptPlan.negativePrompt}</p>
      </details>
      <div className="music-pill-row">
        {promptPlan.blockedReferenceContent.map((item) => (
          <Badge accent="warning" key={item}>No {item}</Badge>
        ))}
      </div>
      <p className="music-muted-note">Validation warnings: no real provider call, no copied track names, no copied lyrics, no exact reference timing.</p>
      <div className="inline-card-actions">
        <Button onClick={() => onAction('Mock prompt approved. Music generation still waits for credit approval.')} variant="primary">Approve prompt</Button>
        <Button onClick={() => onAction('Updated mock preference: make this cue instrumental.')} variant="secondary">Make instrumental</Button>
        <Button onClick={() => onAction('Updated mock preference: lyrics only in montage sections.')} variant="ghost">Allow lyrics in montage</Button>
        <Button onClick={() => onAction('Updated mock preference: reduce culture styling and keep it broader.')} variant="ghost">Use less cultural style</Button>
      </div>
    </InlinePlanCardShell>
  )
}
