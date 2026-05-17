import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, EditPlan, RendererLayerPlan } from '../../types/reeditpro'
import { FrameLayoutPreview } from './FrameLayoutPreview'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineRendererPlanCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function formatTime(seconds: number) {
  return `${seconds.toFixed(seconds % 1 === 0 ? 0 : 1)}s`
}

function layerTimeRange(layer: RendererLayerPlan) {
  return `${formatTime(layer.startTimeSeconds)}-${formatTime(layer.endTimeSeconds)}`
}

function layerZoneLabel(layer: RendererLayerPlan) {
  return layer.zone.label ?? `${layer.zone.width}x${layer.zone.height}`
}

export function InlineRendererPlanCard({ descriptor, plan }: InlineRendererPlanCardProps) {
  const rendererPlan = plan.rendererCompositionPlan

  if (!rendererPlan) {
    return null
  }

  return (
    <InlinePlanCardShell
      className="renderer-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{rendererPlan.frameTemplate.templateType.replaceAll('_', ' ')}</span>
          <span className="compact-summary-chip">{rendererPlan.frameTemplate.canvasWidth}x{rendererPlan.frameTemplate.canvasHeight}</span>
          <span className="compact-summary-chip">{rendererPlan.layers.length} layers</span>
          <span className="compact-summary-chip">{rendererPlan.panelBackgroundColor}</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Frame + renderer plan"
      helper="ReeditPro owns the final canvas. AI models generate assets and clips; Remotion places them into safe frame zones, captions, panels, and timeline layers."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Frame + renderer plan"
    >
      <div className="renderer-badge-row">
        <Badge accent="cyan">Remotion planned</Badge>
        <Badge accent="muted">Mock only</Badge>
        <Badge accent="warning">Approval required</Badge>
        <Badge accent="blue">Matching panel background</Badge>
      </div>

      <div className="renderer-plan-grid">
        <FrameLayoutPreview frameTemplate={rendererPlan.frameTemplate} />
        <div className="renderer-plan-summary">
          <span><strong>Engine</strong>Remotion</span>
          <span><strong>Aspect ratio</strong>{rendererPlan.frameTemplate.aspectRatio}</span>
          <span><strong>Canvas</strong>{rendererPlan.frameTemplate.canvasWidth}x{rendererPlan.frameTemplate.canvasHeight}</span>
          <span><strong>FPS</strong>{rendererPlan.fps}</span>
          <span><strong>Estimated duration</strong>{formatTime(rendererPlan.durationSeconds)}</span>
          <span><strong>Panel background</strong>{rendererPlan.panelBackgroundColor}</span>
          <span><strong>Approval</strong>{rendererPlan.approvalRequired ? 'Required' : 'Not required'}</span>
          <span><strong>Render ready</strong>{rendererPlan.renderReady ? 'Ready' : 'False / mock only'}</span>
        </div>
      </div>

      <div className="renderer-layer-list">
        {rendererPlan.layers.map((layer) => (
          <article className="renderer-layer-item" key={layer.id}>
            <div>
              <strong>{layer.label}</strong>
              <small>{layer.layerType.replaceAll('_', ' ')} / {layerTimeRange(layer)}</small>
            </div>
            <div className="renderer-layer-meta">
              <span>z {layer.zIndex}</span>
              <span>{layerZoneLabel(layer)}</span>
              <span>{layer.fitMode.replaceAll('_', ' ')}</span>
              {layer.motionPreset && <span>{layer.motionPreset.replaceAll('_', ' ')}</span>}
            </div>
            <ul>
              {layer.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="renderer-notes">
        {rendererPlan.rendererNotes.map((note) => (
          <span key={note}>{note}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
