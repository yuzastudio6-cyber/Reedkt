import { useEffect, useRef } from 'react'
import { Video } from 'lucide-react'
import type { ProjectEditBriefVideoShellModel } from '../../../lib/project-edit-brief-ui-adapter'
import type { ProjectSourceVideoLocalArtifactReviewObject } from '../../../lib/project-source-video-local-artifact-review'
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
  playbackNotice?: string
  reviewArtifact?: ProjectSourceVideoLocalArtifactReviewObject
  reviewArtifactLabel?: string
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
  playbackNotice,
  reviewArtifact,
  reviewArtifactLabel = 'Private review artifact',
  seekRequest,
  video,
}: ProjectEditBriefVideoShellProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoSource = reviewArtifact?.objectUrl ?? localPreview?.objectUrl
  const isReviewArtifact = Boolean(reviewArtifact)

  useEffect(() => {
    onVideoElementReady?.(videoSource ? videoRef.current ?? undefined : undefined)
    return () => onVideoElementReady?.(undefined)
  }, [onVideoElementReady, videoSource])

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
      {videoSource ? (
        <div className="project-edit-brief-video-shell__frame project-edit-brief-video-shell__frame--local">
          <video
            ref={videoRef}
            className="project-edit-brief-video-shell__video"
            data-testid="project-source-video-local-player"
            playsInline
            preload="metadata"
            src={videoSource}
            onEnded={() => onPlayStateChange?.(false)}
            onLoadedMetadata={(event) => {
              const element = event.currentTarget
              if (localPreview && !isReviewArtifact) {
                onMetadataLoaded?.({
                  durationSeconds: Number.isFinite(element.duration) ? element.duration : undefined,
                  videoHeight: element.videoHeight || undefined,
                  videoWidth: element.videoWidth || undefined,
                })
              }
            }}
            onPause={() => onPlayStateChange?.(false)}
            onPlay={() => onPlayStateChange?.(true)}
            onTimeUpdate={(event) => onTimeUpdate?.(event.currentTarget.currentTime)}
          />
          <div className="project-edit-brief-video-shell__local-badge" data-testid="project-source-video-local-mode">
            {isReviewArtifact ? reviewArtifactLabel : 'Local browser source'}
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
        disabled={!videoSource}
        durationLabel={video.durationLabel}
        notice={playbackNotice}
        onPlayPause={togglePlayback}
        playing={Boolean(videoSource && playing)}
      />
    </section>
  )
}
