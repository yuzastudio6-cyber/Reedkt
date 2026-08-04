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
  return `Capability routing uses ${routing.qwen3ReasoningDepth} planning depth, ${routing.qwen25vlVisualDepth} visual-understanding depth, ${routing.audioPolicy} audio policy, and ${routing.graphicsPolicy} graphics policy.`
}

export function createEditLevelQwenRoutingSummary(level: ReEditProCanonicalEditLevel): string {
  const routing = requireProfile(level).toolRouting
  return `Main planning: ${routing.qwen3ReasoningDepth}; visual understanding: ${routing.qwen25vlVisualDepth}; technical assembly support: ${routing.deepseekPolicy}.`
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
    `mockOnly=${profile.mockOnly}; productionReady=${profile.productionReady}; production blockers=${profile.productionReadiness.blockers.length}; no runtime behavior required without approved gates.`,
  ]
}
