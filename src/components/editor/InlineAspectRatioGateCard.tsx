import { Badge } from '../Badge'
import { Button } from '../Button'
import { aspectRatioOptions, getAspectRatioGateMessage } from '../../lib/aspect-ratio-frame-planner'
import { getDefaultFrameTemplateForAspectRatio } from '../../lib/frame-layouts'
import type { AspectRatio, EditPlan } from '../../types/reeditpro'
import { FrameLayoutPreview } from './FrameLayoutPreview'

type InlineAspectRatioGateCardProps = {
  plan: EditPlan
  selectedAspectRatio?: AspectRatio
  aspectRatioConfirmed: boolean
  onSelectAspectRatio?: (aspectRatio: AspectRatio) => void
  onConfirmAspectRatio?: () => void
}

const impactItems = [
  'captions',
  'speaker framing',
  'visual panels',
  'image/video prompts',
  'Remotion composition',
  'export settings',
]

function isConcreteAspectRatio(aspectRatio?: AspectRatio): aspectRatio is Exclude<AspectRatio, 'let_ai_decide'> {
  return Boolean(aspectRatio && aspectRatio !== 'let_ai_decide')
}

export function InlineAspectRatioGateCard({
  aspectRatioConfirmed,
  onConfirmAspectRatio,
  onSelectAspectRatio,
  plan,
  selectedAspectRatio,
}: InlineAspectRatioGateCardProps) {
  const framePlan = plan.aspectRatioFramePlan
  const recommended = framePlan?.recommendedAspectRatio
  const activeAspectRatio =
    isConcreteAspectRatio(selectedAspectRatio)
      ? selectedAspectRatio
      : isConcreteAspectRatio(recommended?.recommendedAspectRatio)
        ? recommended.recommendedAspectRatio
        : '9:16'
  const activeTemplate = getDefaultFrameTemplateForAspectRatio(activeAspectRatio)
  const selectedOption = aspectRatioOptions.find((option) => option.id === activeAspectRatio)
  const confirmed = aspectRatioConfirmed && framePlan?.status === 'confirmed'

  return (
    <section className="inline-chat-card aspect-ratio-gate-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Output frame</span>
          <h3>Choose the frame before approval</h3>
        </div>
        <span className={`aspect-ratio-status-badge ${confirmed ? 'confirmed' : 'needs-confirmation'}`}>
          {confirmed ? 'Confirmed' : 'Needs confirmation'}
        </span>
      </div>

      <p className="inline-helper">
        Every edit is built around the target aspect ratio. I can recommend a frame, but you must confirm it before approval.
      </p>

      {recommended && (
        <div className="source-output-fit-summary">
          <strong>Recommended: {recommended.recommendedAspectRatio}</strong>
          <span>{recommended.reason}</span>
          <Badge accent="warning">Recommendation only</Badge>
        </div>
      )}

      <div className="aspect-ratio-option-grid">
        {aspectRatioOptions.map((option) => {
          const selected = activeAspectRatio === option.id
          const optionConfirmed = confirmed && selected

          return (
            <button
              aria-pressed={selected}
              className={[
                'aspect-ratio-option',
                selected ? 'aspect-ratio-option-selected' : '',
                optionConfirmed ? 'aspect-ratio-option-confirmed' : '',
              ].filter(Boolean).join(' ')}
              key={option.id}
              onClick={() => onSelectAspectRatio?.(option.id)}
              type="button"
            >
              <span className="choice-card-title">{option.label}</span>
              <strong>{option.description}</strong>
              <small>{option.canvasWidth}x{option.canvasHeight}</small>
              <span>{option.layoutNotes[0]}</span>
            </button>
          )
        })}
      </div>

      <div className="aspect-ratio-canvas-meta">
        <FrameLayoutPreview frameTemplate={activeTemplate} />
        <div>
          <span>Selected frame</span>
          <strong>{selectedOption?.label ?? activeAspectRatio} / {activeTemplate.canvasWidth}x{activeTemplate.canvasHeight}</strong>
          <p>{getAspectRatioGateMessage(framePlan)}</p>
          {framePlan?.sourceToOutputFramePlan && (
            <div className="source-output-fit-summary">
              <strong>Source-to-output fit</strong>
              <span>{framePlan.sourceToOutputFramePlan.fitMode.replaceAll('_', ' ')}</span>
              <span>{framePlan.sourceToOutputFramePlan.notes[0]}</span>
            </div>
          )}
        </div>
      </div>

      <div className="aspect-ratio-impact-list">
        {impactItems.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>

      {confirmed ? (
        <p className="frame-confirmation-success">
          Output frame confirmed. I’ll build all layouts, prompts, and render plans around this frame.
        </p>
      ) : (
        <p className="frame-confirmation-warning">
          Approval is locked until output frame is confirmed. Changing this later will rebuild the plan and credit estimate.
        </p>
      )}

      {onConfirmAspectRatio && (
        <div className="inline-card-actions">
          <Button
            className="aspect-ratio-confirm-button"
            disabled={!isConcreteAspectRatio(activeAspectRatio)}
            onClick={onConfirmAspectRatio}
            variant={confirmed ? 'secondary' : 'primary'}
          >
            {confirmed ? 'Output frame confirmed' : 'Confirm output frame'}
          </Button>
        </div>
      )}
    </section>
  )
}
