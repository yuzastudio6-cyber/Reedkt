import type { CSSProperties } from 'react'
import { getFrameLayoutTemplate } from '../../lib/frame-layouts'
import type { FrameLayoutPlan, FrameTemplateType, RectZone } from '../../types/reeditpro'

type FrameLayoutPreviewProps = {
  templateType?: FrameTemplateType
  frameTemplate?: FrameLayoutPlan
  compact?: boolean
}

function zoneStyle(zone: RectZone, frameTemplate: FrameLayoutPlan): CSSProperties {
  return {
    height: `${(zone.height / frameTemplate.canvasHeight) * 100}%`,
    left: `${(zone.x / frameTemplate.canvasWidth) * 100}%`,
    top: `${(zone.y / frameTemplate.canvasHeight) * 100}%`,
    width: `${(zone.width / frameTemplate.canvasWidth) * 100}%`,
  }
}

function safeMarginStyle(frameTemplate: FrameLayoutPlan): CSSProperties {
  const horizontal = (frameTemplate.safeMargin / frameTemplate.canvasWidth) * 100
  const vertical = (frameTemplate.safeMargin / frameTemplate.canvasHeight) * 100

  return {
    bottom: `${vertical}%`,
    left: `${horizontal}%`,
    right: `${horizontal}%`,
    top: `${vertical}%`,
  }
}

export function FrameLayoutPreview({ compact = false, frameTemplate, templateType }: FrameLayoutPreviewProps) {
  const selectedFrameTemplate = frameTemplate ?? (templateType ? getFrameLayoutTemplate(templateType) : undefined)

  if (!selectedFrameTemplate) {
    return <p className="inline-helper">No frame template selected yet.</p>
  }

  const canvasStyle: CSSProperties = {
    aspectRatio: `${selectedFrameTemplate.canvasWidth} / ${selectedFrameTemplate.canvasHeight}`,
  }

  return (
    <section
      aria-label={`${selectedFrameTemplate.templateType.replaceAll('_', ' ')} frame layout preview`}
      className={`frame-layout-preview ${compact ? 'frame-layout-preview-compact' : ''}`.trim()}
    >
      <div className="frame-layout-canvas" style={canvasStyle}>
        <div aria-hidden="true" className="frame-zone frame-zone-margin" style={safeMarginStyle(selectedFrameTemplate)}>
          <span className="frame-zone-label">Safe margins</span>
        </div>

        {selectedFrameTemplate.speakerZone && (
          <div
            aria-label={selectedFrameTemplate.speakerZone.label ?? 'Speaker/source zone'}
            className="frame-zone frame-zone-speaker"
            style={zoneStyle(selectedFrameTemplate.speakerZone, selectedFrameTemplate)}
            title={selectedFrameTemplate.speakerZone.notes}
          >
            <span className="frame-zone-label">Speaker/source zone</span>
          </div>
        )}

        <div
          aria-label={selectedFrameTemplate.animationZone.label ?? 'AI visual panel'}
          className="frame-zone frame-zone-animation"
          style={{
            ...zoneStyle(selectedFrameTemplate.animationZone, selectedFrameTemplate),
            backgroundColor: selectedFrameTemplate.panelBackgroundColor,
          }}
          title={selectedFrameTemplate.animationZone.notes}
        >
          <span className="frame-zone-label">AI visual panel</span>
          <span className="frame-zone-label frame-zone-label-secondary">Matching panel background</span>
        </div>

        {selectedFrameTemplate.captionSafeZone && (
          <div
            aria-label={selectedFrameTemplate.captionSafeZone.label ?? 'Caption safe zone'}
            className="frame-zone frame-zone-caption"
            style={zoneStyle(selectedFrameTemplate.captionSafeZone, selectedFrameTemplate)}
            title={selectedFrameTemplate.captionSafeZone.notes}
          >
            <span className="frame-zone-label">Caption safe zone</span>
          </div>
        )}
      </div>
      {!compact && (
        <div className="frame-layout-meta">
          <span>{selectedFrameTemplate.aspectRatio}</span>
          <span>{selectedFrameTemplate.canvasWidth}x{selectedFrameTemplate.canvasHeight}</span>
          <span>{selectedFrameTemplate.panelBackgroundColor}</span>
        </div>
      )}
    </section>
  )
}
