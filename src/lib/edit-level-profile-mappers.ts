import type {
  EditLevelEstimateProfile,
  EditLevelFallbackPolicy,
  EditLevelProfile,
  EditLevelProfileDebugModel,
  EditLevelQAProfileDefinition,
  EditLevelToolRoutingProfile,
  EditLevelUICardModel,
  ReEditProCanonicalEditLevel,
} from '../types'
import { EDIT_LEVEL_PROFILES, getEditLevelProfile } from './mock-edit-level-profiles'

function requireProfile(level: ReEditProCanonicalEditLevel): EditLevelProfile {
  const profile = getEditLevelProfile(level)
  if (!profile) throw new Error(`Missing edit level profile: ${level}`)
  return profile
}

export function createEditLevelUICardModel(
  level: ReEditProCanonicalEditLevel,
  recommendedLevel?: ReEditProCanonicalEditLevel,
): EditLevelUICardModel {
  const profile = requireProfile(level)
  return {
    ...profile.uiCard,
    recommended: profile.level === recommendedLevel,
  }
}

export function createEditLevelUICardModels(recommendedLevel?: ReEditProCanonicalEditLevel): EditLevelUICardModel[] {
  return EDIT_LEVEL_PROFILES.map((profile) => createEditLevelUICardModel(profile.level, recommendedLevel))
}

export function createEditLevelToolRoutingProfile(level: ReEditProCanonicalEditLevel): EditLevelToolRoutingProfile {
  return requireProfile(level).toolRouting
}

export function createEditLevelQAProfileDefinition(level: ReEditProCanonicalEditLevel): EditLevelQAProfileDefinition {
  return requireProfile(level).qaProfile
}

export function createEditLevelEstimateProfile(level: ReEditProCanonicalEditLevel): EditLevelEstimateProfile {
  return requireProfile(level).estimateProfile
}

export function createEditLevelFallbackPolicy(level: ReEditProCanonicalEditLevel): EditLevelFallbackPolicy {
  return requireProfile(level).fallbackPolicy
}

export function createEditLevelProfileDebugModel(level: ReEditProCanonicalEditLevel): EditLevelProfileDebugModel {
  const profile = requireProfile(level)
  return {
    level: profile.level,
    displayName: profile.displayName,
    legacyAliases: profile.legacyAliases,
    qwen3ReasoningDepth: profile.toolRouting.qwen3ReasoningDepth,
    qwen25vlVisualDepth: profile.toolRouting.qwen25vlVisualDepth,
    editBriefPolicy: profile.editBriefPolicy,
    qaProfile: profile.qaProfile.qaProfile,
    estimateOnly: profile.estimateProfile.estimateOnly,
    creditsReservedOrSpent: profile.estimateProfile.creditsReservedOrSpent,
    mockOnly: profile.mockOnly,
    productionReady: profile.productionReady,
    warnings: profile.warnings,
  }
}
