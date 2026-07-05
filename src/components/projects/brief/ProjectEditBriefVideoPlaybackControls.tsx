import { Pause, Play } from 'lucide-react'
import { Button } from '../../Button'

type ProjectEditBriefVideoPlaybackControlsProps = {
  currentTimeLabel: string
  disabled?: boolean
  durationLabel: string
  notice?: string
  onPlayPause: () => void
  playing: boolean
}

export function ProjectEditBriefVideoPlaybackControls({
  currentTimeLabel,
  disabled = false,
  durationLabel,
  notice = 'Browser playback only. No render/export started.',
  onPlayPause,
  playing,
}: ProjectEditBriefVideoPlaybackControlsProps) {
  return (
    <div className="project-edit-brief-video-shell__controls">
      <Button
        data-testid="project-source-video-play-pause-button"
        disabled={disabled}
        icon={playing ? Pause : Play}
        onClick={onPlayPause}
        size="sm"
        variant="secondary"
      >
        {playing ? 'Pause' : 'Play'}
      </Button>
      <span data-testid="project-edit-brief-timecode">{currentTimeLabel} / {durationLabel}</span>
      <span className="project-edit-brief-muted">{notice}</span>
    </div>
  )
}
