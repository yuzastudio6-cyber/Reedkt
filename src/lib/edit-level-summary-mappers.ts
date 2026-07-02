import type { EditLevelProfile, ReEditProCanonicalEditLevel } from '../types'
import { getEditLevelProfile } from './mock-edit-level-profiles'

function requireProfile(level: ReEditProCanonicalEditLevel): EditLevelProfile {
  const profile = getEditLevelProfile(level)
  if (!profile) throw new Error(`Missing edit level profile: ${level}`)
  return profile
}

export function createEditLevelReadableSummary(level: ReEditProCanonicalEditLevel): string {
  const profile = requireProfile(level)
  return `${profile.displayName}: ${profile.shortPromise} ${profile.userFacingDescription}`
}

export function createEditLevelToolRoutingSummary(level: ReEditProCanonicalEditLevel): string {
  const routing = requireProfile(level).toolRouting
  return `Tool routing uses ${routing.qwen3ReasoningDepth} Qwen 3.7 reasoning, ${routing.qwen25vlVisualDepth} Qwen2.5-VL visual depth, ${routing.audioPolicy} audio policy, and ${routing.graphicsPolicy} graphics policy.`
}

export function createEditLevelQwenRoutingSummary(level: ReEditProCanonicalEditLevel): string {
  const routing = requireProfile(level).toolRouting
  return `Qwen 3.7: ${routing.qwen3ReasoningDepth}; Qwen2.5-VL: ${routing.qwen25vlVisualDepth}; DeepSeek: ${routing.deepseekPolicy}.`
}

export function createEditLevelEditBriefPolicySummary(level: ReEditProCanonicalEditLevel): string {
  const profile = requireProfile(level)
  return `${profile.displayName} Edit Brief policy is ${profile.editBriefPolicy}.`
}

export function createEditLevelQAProfileSummary(level: ReEditProCanonicalEditLevel): string {
  const qa = requireProfile(level).qaProfile
  return `${qa.qaProfile} QA profile: ${qa.strictnessSummary}`
}

export function createEditLevelEstimateSummary(level: ReEditProCanonicalEditLevel): string {
  const estimate = requireProfile(level).estimateProfile
  return `${estimate.creditEstimateMultiplier}x credit estimate only; credits reserved or spent: ${estimate.creditsReservedOrSpent}; render budget future: ${estimate.renderPassBudgetFuture}.`
}

export function createEditLevelFallbackSummary(level: ReEditProCanonicalEditLevel): string {
  const fallback = requireProfile(level).fallbackPolicy
  return fallback.degradedCapabilityNotice
}

export function createEditLevelDebugSummary(level: ReEditProCanonicalEditLevel): string[] {
  const profile = requireProfile(level)
  return [
    createEditLevelReadableSummary(level),
    createEditLevelToolRoutingSummary(level),
    createEditLevelQwenRoutingSummary(level),
    createEditLevelEditBriefPolicySummary(level),
    createEditLevelQAProfileSummary(level),
    createEditLevelEstimateSummary(level),
    createEditLevelFallbackSummary(level),
    `mockOnly=${profile.mockOnly}; productionReady=${profile.productionReady}; no runtime behavior required.`,
  ]
}
