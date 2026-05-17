import { Badge } from '../Badge'
import { visualAssetTypeDefinitions } from '../../lib/product-taxonomy'
import { getStyleModeLabel } from '../../lib/style-modes'
import type { ChatPlanningCardDescriptor, EditLevel, EditPlan, ProviderModel, SignatureSystem, VisualAssetType } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineVisualAssetPlanCardProps = {
  plan: EditPlan
  editLevel: EditLevel
  descriptor?: ChatPlanningCardDescriptor
}

const signatureLabels: Record<SignatureSystem, string> = {
  stroke_motion: 'Stroke Motion',
  graphic_design: 'Graphic Design / VisualExplain',
  real_motion: 'Real Motion',
  sound_sync: 'SoundSync',
  none: 'None',
}

const signatureAccent: Record<SignatureSystem, 'blue' | 'cyan' | 'violet' | 'warning' | 'muted'> = {
  stroke_motion: 'cyan',
  graphic_design: 'blue',
  real_motion: 'warning',
  sound_sync: 'violet',
  none: 'muted',
}

const animationAssetTypes: VisualAssetType[] = ['animated_scene', 'motion_design_scene', 'real_motion_scene', 'transition_scene']

function labelForAssetType(assetType: VisualAssetType) {
  return visualAssetTypeDefinitions.find((definition) => definition.value === assetType)?.label ?? assetType.replaceAll('_', ' ')
}

function veoPolicyForLevel(editLevel: EditLevel) {
  if (editLevel === 'basic') {
    return 'Veo locked for Basic'
  }

  if (editLevel === 'pro') {
    return 'Veo locked for Pro'
  }

  return 'Veo Lite available only as final fallback/rescue'
}

function modelChipClass(model: ProviderModel) {
  if (model === 'veo_3_1_lite') {
    return 'model-chip model-chip-premium'
  }

  if (model === 'none') {
    return 'model-chip model-chip-locked'
  }

  return 'model-chip'
}

function providerDisplayName(model: ProviderModel) {
  return model.replaceAll('_', ' ')
}

function isAiVideoModel(model: ProviderModel) {
  return model.startsWith('wan') || model.startsWith('hailuo') || model === 'veo_3_1_lite'
}

function assetUsesAiVideoRoute(asset: NonNullable<EditPlan['visualAssetPlan']>[number]) {
  return isAiVideoModel(asset.providerRoute.primaryModel) || asset.providerRoute.fallbackModels.some(isAiVideoModel)
}

function routeExplanation(model: ProviderModel) {
  if (model === 'gpt_image_2') {
    return 'GPT-Image-2 creates image, card, keyframe, or designed-frame assets.'
  }

  if (isAiVideoModel(model)) {
    return 'This AI video model generates an asset/clip only, not the final full video.'
  }

  if (model === 'remotion_editor_motion' || model === 'svg_lottie_renderer') {
    return 'Controlled renderer/editor motion handles exact motion design and timing.'
  }

  return 'No provider route is needed for this beat.'
}

export function InlineVisualAssetPlanCard({ descriptor, editLevel, plan }: InlineVisualAssetPlanCardProps) {
  const visualAssetPlan = plan.visualAssetPlan ?? []
  const stillCardCount = visualAssetPlan.filter((asset) => !animationAssetTypes.includes(asset.assetType)).length
  const animatedCount = visualAssetPlan.filter((asset) => animationAssetTypes.includes(asset.assetType)).length
  const signatureSystems = Array.from(new Set(visualAssetPlan.map((asset) => signatureLabels[asset.signatureSystem])))

  return (
    <InlinePlanCardShell
      className="visual-asset-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{visualAssetPlan.length} beats</span>
          <span className="compact-summary-chip">{stillCardCount} still/card</span>
          <span className="compact-summary-chip">{animatedCount} animated</span>
          <span className="compact-summary-chip">{signatureSystems.slice(0, 2).join(', ') || 'No extra visuals'}</span>
          <span className="compact-summary-chip">{veoPolicyForLevel(editLevel)}</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Visual story plan"
      helper="ReeditPro only animates beats where motion improves the story. Remotion places these assets into the final frame; provider models do not generate the full final canvas."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Visual story plan"
    >
      <div className="qa-badge-row">
        <Badge accent={editLevel === 'premium' ? 'warning' : 'cyan'}>{veoPolicyForLevel(editLevel)}</Badge>
        <Badge accent="blue">Matching panel background</Badge>
        <Badge accent="muted">Assets only, not final canvas</Badge>
      </div>

      {visualAssetPlan.length === 0 ? (
        <p className="inline-helper">No extra visual assets are planned for this mock edit.</p>
      ) : (
        <div className="visual-asset-list">
          {visualAssetPlan.map((asset) => (
            <article className="visual-asset-item" key={asset.id}>
              <div className="visual-asset-header">
                <div>
                  <span className="section-eyebrow">{asset.narrativePhase}</span>
                  <h4>{asset.beatLabel}</h4>
                  <p>{asset.storyPurpose}</p>
                </div>
                <div className="visual-asset-badges">
                  <Badge accent={signatureAccent[asset.signatureSystem]}>{signatureLabels[asset.signatureSystem]}</Badge>
                  <span className="model-chip">{animationAssetTypes.includes(asset.assetType) ? 'Animation' : 'Still/card'}</span>
                  <span className="model-chip">{labelForAssetType(asset.assetType)}</span>
                  <span className="model-chip">Placed by Remotion</span>
                  <span className="model-chip">Panel background matched</span>
                  {asset.promptPlans && asset.promptPlans.length > 0 && <span className="model-chip">Prompt planned: {asset.promptPlans.length}</span>}
                  {asset.promptPlans && asset.promptPlans.length > 0 && <span className="model-chip">Matching panel background included</span>}
                  {asset.characterPackIds && asset.characterPackIds.length > 0 && <span className="model-chip">Character consistency</span>}
                  {asset.factSafetyItemIds && asset.factSafetyItemIds.length > 0 && <span className="model-chip">Fact-safe visual</span>}
                  {asset.factSafetyItemIds && asset.factSafetyItemIds.length > 0 && <span className="model-chip">Neutral claim treatment</span>}
                  {assetUsesAiVideoRoute(asset) && <span className="model-chip model-chip-locked">AI video asset only, not final canvas</span>}
                </div>
              </div>

              <div className="visual-asset-meta">
                <span><strong>Style</strong>{getStyleModeLabel(asset.styleModeId)}</span>
                <span><strong>Frame</strong>{asset.frameTemplateType.replaceAll('_', ' ')}</span>
                <span><strong>Duration</strong>{asset.recommendedDurationSeconds > 0 ? `${asset.recommendedDurationSeconds}s` : 'Editor controlled'}</span>
                <span><strong>Credit impact</strong>{asset.creditImpact}</span>
              </div>

              <div className="provider-route-row">
                <div>
                  <strong>Primary model</strong>
                  <span className={modelChipClass(asset.providerRoute.primaryModel)}>{providerDisplayName(asset.providerRoute.primaryModel)}</span>
                  <small>{routeExplanation(asset.providerRoute.primaryModel)}</small>
                </div>
                <div>
                  <strong>Fallback models</strong>
                  <div className="visual-asset-badges">
                    {asset.providerRoute.fallbackModels.length > 0 ? (
                      asset.providerRoute.fallbackModels.map((model) => (
                        <span className={modelChipClass(model)} key={model}>{providerDisplayName(model)}</span>
                      ))
                    ) : (
                      <span className="model-chip model-chip-locked">No fallback model</span>
                    )}
                  </div>
                </div>
              </div>

              {asset.providerRoute.fallbackSteps.length > 0 && (
                <div className="fallback-step-list">
                  <strong>Fallback steps</strong>
                  {asset.providerRoute.fallbackSteps.map((fallbackStep) => (
                    <span key={`${fallbackStep.action}-${fallbackStep.model ?? fallbackStep.label}`}>
                      {fallbackStep.label}
                      {fallbackStep.model ? ` / ${providerDisplayName(fallbackStep.model)}` : ''}
                      {fallbackStep.premiumOnly ? ' / Premium only' : ''}
                    </span>
                  ))}
                </div>
              )}

              <div className="qa-check-list">
                <strong>QA checks</strong>
                {asset.qaChecks.map((check) => (
                  <span key={check}>{check}</span>
                ))}
              </div>

              <p className="inline-helper">{asset.reason}</p>
            </article>
          ))}
        </div>
      )}
    </InlinePlanCardShell>
  )
}
