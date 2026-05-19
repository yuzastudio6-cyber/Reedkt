import type { SFXTargetLayer, SignatureRouteRecord, TransitionPlanRecord } from '../../types'

export interface SFXTargetLayerInput {
  text?: string
  sceneContext?: string
  videoType?: string
  transitionPlan?: TransitionPlanRecord
  signatureRoute?: SignatureRouteRecord
}

function normalizeText(input: SFXTargetLayerInput): string {
  return [
    input.text,
    input.sceneContext,
    input.videoType,
    input.transitionPlan?.transitionType,
    input.transitionPlan?.reason,
    input.signatureRoute?.signatureSystem,
    input.signatureRoute?.reason,
  ].join(' ').toLowerCase()
}

export function inferTargetLayerFromSignatureRoute(route?: SignatureRouteRecord): SFXTargetLayer {
  if (!route) return 'none'
  if (route.signatureSystem === 'stroke_motion') return 'stroke_motion'
  if (route.signatureSystem === 'graphic_design') return 'graphic_design'
  if (route.signatureSystem === 'real_motion') return 'real_motion'
  if (route.signatureSystem === 'sound_sync') return 'montage_hit'
  return 'none'
}

export function inferTargetLayerFromTransition(transition?: TransitionPlanRecord): SFXTargetLayer {
  if (!transition) return 'none'
  if (transition.soundEffectNeeded) return 'transition'
  if (/transition|cut|swipe|whoosh|bridge|scene change/.test(`${transition.transitionType} ${transition.reason}`.toLowerCase())) {
    return 'transition'
  }

  return 'none'
}

export function inferTargetLayerFromText(text = ''): SFXTargetLayer {
  const value = text.toLowerCase()

  if (/stroke|line draw|line trace|circle complete|morph|reconnect/.test(value)) return 'stroke_motion'
  if (/graphic|visualexplain|card reveal|label|diagram|list item|data point/.test(value)) return 'graphic_design'
  if (/real motion|object enter|object settle|object movement|room-matched/.test(value)) return 'real_motion'
  if (/chapter/.test(value)) return 'chapter_card'
  if (/title|teaser|intro card/.test(value)) return 'title_card'
  if (/cta|call to action|subscribe|book now|resolve hit/.test(value)) return 'cta_reveal'
  if (/montage|beat accent|beat hit/.test(value)) return 'montage_hit'
  if (/ambient bridge|ambience bridge|restaurant ambience|room tone bridge/.test(value)) return 'ambient_bridge'
  if (/caption keyword|keyword emphasis/.test(value)) return 'caption_emphasis'
  if (/ui feedback|button tap/.test(value)) return 'ui_feedback'
  if (/source repair|silent b-?roll|missing audio|repair ambience|full sound design|foley/.test(value)) return 'source_footage_repair'
  if (/transition|whoosh|swipe|cut accent|riser/.test(value)) return 'transition'

  return 'none'
}

export function inferTargetLayerFromScene(sceneContext = ''): SFXTargetLayer {
  return inferTargetLayerFromText(sceneContext)
}

export function classifySFXTargetLayer(input: SFXTargetLayerInput): SFXTargetLayer {
  const signatureLayer = inferTargetLayerFromSignatureRoute(input.signatureRoute)
  if (signatureLayer !== 'none') return signatureLayer

  const transitionLayer = inferTargetLayerFromTransition(input.transitionPlan)
  if (transitionLayer !== 'none') return transitionLayer

  return inferTargetLayerFromText(normalizeText(input))
}
