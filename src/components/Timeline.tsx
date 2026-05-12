import { timelineTracks } from '../data/mockData'
import type { TimelineTrack as TimelineTrackType } from '../data/mockData'

type TimelineTrackProps = {
  track: TimelineTrackType
}

export function TimelineTrack({ track }: TimelineTrackProps) {
  return (
    <div className="timeline-track">
      <div className="track-label">
        <strong>{track.name}</strong>
        <span>{track.detail}</span>
      </div>
      <div className="track-lane">
        {track.segments.map((segment) => (
          <span
            className={`timeline-segment segment-${segment.state}`}
            key={segment.label}
            style={{ left: segment.start, width: segment.width }}
          >
            {segment.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Timeline() {
  return (
    <section className="timeline-panel" aria-label="AI editor timeline">
      <div className="timeline-header">
        <div>
          <span className="section-eyebrow">StoryTiming timeline</span>
          <h2>Visual and audio layers</h2>
        </div>
        <div className="timeline-ruler" aria-hidden="true">
          <span>00:00</span>
          <span>00:30</span>
          <span>01:00</span>
          <span>01:24</span>
        </div>
      </div>
      <div className="playhead" aria-hidden="true" />
      {timelineTracks.map((track) => (
        <TimelineTrack key={track.name} track={track} />
      ))}
    </section>
  )
}
