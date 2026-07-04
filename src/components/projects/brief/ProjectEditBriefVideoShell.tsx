import { useEffect, useRef } from 'react'
import { Video } from 'lucide-react'
import type { ProjectEditBriefVideoShellModel } from '../../../lib/project-edit-brief-ui-adapter'
import type {
  ProjectSourceVideoLocalPreview,
  ProjectSourceVideoMetadataUpdate,
} from '../../../types/project-source-video'
import { ProjectEditBriefVideoPlaybackControls } from './ProjectEditBriefVideoPlaybackControls'

type ProjectEditBriefVideoShellProps = {
  localPreview?: ProjectSourceVideoLocalPreview
  onMetadataLoaded?: (metadata: ProjectSourceVideoMetadataUpdate) => void
  onPlayStateChange?: (playing: boolean) => void
  onTimeUpdate?: (seconds: number) => void
  onVideoElementReady?: (element?: HTMLVideoElement) => void
  playing?: boolean
  seekRequest?: { requestId: number; seconds: number }
  video: ProjectEditBriefVideoShellModel
}

export function ProjectEditBriefVideoShell({
  localPreview,
  onMetadataLoaded,
  onPlayStateChange,
  onTimeUpdate,
  onVideoElementReady,
  playing = false,
  seekRequest,
  video,
}: ProjectEditBriefVideoShellProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    onVideoElementReady?.(localPreview ? videoRef.current ?? undefined : undefined)
    return () => onVideoElementReady?.(undefined)
  }, [localPreview, onVideoElementReady])

  useEffect(() => {
    const element = videoRef.current
    if (!element || !seekRequest) return
    const nextTime = Math.max(0, Math.min(seekRequest.seconds, Number.isFinite(element.duration) ? element.duration : seekRequest.seconds))
    if (Math.abs(element.currentTime - nextTime) > 0.05) {
      element.currentTime = nextTime
    }
  }, [seekRequest])

  async function togglePlayback() {
    const element = videoRef.current
    if (!element) {
      onPlayStateChange?.(!playing)
      return
    }

    if (element.paused) {
      try {
        await element.play()
        onPlayStateChange?.(true)
      } catch {
        onPlayStateChange?.(false)
      }
    } else {
      element.pause()
      onPlayStateChange?.(false)
    }
  }

  return (
    <section className="project-edit-brief-video-shell" data-testid="project-edit-brief-video-shell">
      {localPreview ? (
        <div className="project-edit-brief-video-shell__frame project-edit-brief-video-shell__frame--local">
          <video
            ref={videoRef}
            className="project-edit-brief-video-shell__video"
            data-testid="project-source-video-local-player"
            playsInline
            preload="metadata"
            src={localPreview.objectUrl}
            onEnded={() => onPlayStateChange?.(false)}
            onLoadedMetadata={(event) => {
              const element = event.currentTarget
              onMetadataLoaded?.({
                durationSeconds: Number.isFinite(element.duration) ? element.duration : undefined,
                videoHeight: element.videoHeight || undefined,
                videoWidth: element.videoWidth || undefined,
              })
            }}
            onPause={() => onPlayStateChange?.(false)}
            onPlay={() => onPlayStateChange?.(true)}
            onTimeUpdate={(event) => onTimeUpdate?.(event.currentTarget.currentTime)}
          />
          <div className="project-edit-brief-video-shell__local-badge" data-testid="project-source-video-local-mode">
            Local browser preview only
          </div>
        </div>
      ) : (
        <div className="project-edit-brief-video-shell__frame">
          <Video aria-hidden="true" size={34} />
          <div>
            <strong>{video.mockPosterLabel}</strong>
            <span>{video.aspectLabel} timeline preview placeholder</span>
          </div>
        </div>
      )}
      <ProjectEditBriefVideoPlaybackControls
        currentTimeLabel={video.currentTimeLabel}
        disabled={!localPreview}
        durationLabel={video.durationLabel}
        onPlayPause={togglePlayback}
        playing={Boolean(localPreview && playing)}
      />
    </section>
  )
}
