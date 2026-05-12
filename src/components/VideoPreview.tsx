import { Maximize2, Pause, Play, Volume2 } from 'lucide-react'
import { Badge } from './Badge'
import { IconButton } from './Button'

export function VideoPreview() {
  return (
    <section className="video-preview" aria-label="Video preview">
      <div className="video-stage">
        <div className="speaker-frame">
          <div className="speaker-silhouette" />
          <div className="caption-strip">"Then the product finally clicked for the customer."</div>
          <div className="stroke-overlay" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="visual-overlay">
            <strong>3 proof points</strong>
            <small>Speed / Clarity / Trust</small>
          </div>
          <div className="real-motion-overlay">
            <span>Product proof</span>
          </div>
        </div>
      </div>
      <div className="video-controls">
        <IconButton icon={Play} label="Play preview" />
        <IconButton icon={Pause} label="Pause preview" />
        <label className="preview-select">
          <span>Aspect</span>
          <select defaultValue="9:16">
            <option>9:16</option>
            <option>16:9</option>
            <option>1:1</option>
          </select>
        </label>
        <div className="scrubber" aria-label="Playback progress">
          <span style={{ width: '44%' }} />
        </div>
        <span className="timecode">00:39 / 01:24</span>
        <label className="preview-toggle">
          <input defaultChecked type="checkbox" />
          Captions
        </label>
        <label className="preview-toggle">
          <input defaultChecked type="checkbox" />
          Safe area
        </label>
        <label className="preview-toggle">
          <input defaultChecked type="checkbox" />
          Motion overlay
        </label>
        <IconButton icon={Volume2} label="Volume" />
        <IconButton icon={Maximize2} label="Fullscreen preview" />
      </div>
      <div className="preview-badges">
        <Badge accent="cyan">Stroke Motion active</Badge>
        <Badge accent="violet">VisualExplain active</Badge>
        <Badge accent="blue">Real Motion preview</Badge>
      </div>
    </section>
  )
}
