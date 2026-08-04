import type {
  StorytellingMotionStyleProfile,
  StorytellingMotionStyleReviewDto,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_STORYTELLING_STYLE_REVIEW_VERSION,
} from '../../../src/types/motion-studio'
import {
  storytellingMotionStyleReviewDtoSchema,
} from '../../../src/lib/motion-studio/contracts'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  STORYTELLING_MOTION_STYLE_PROFILES,
  storytellingMotionStyleProfileReference,
} from './catalog'

export const STORYTELLING_MOTION_STYLE_CATALOG_VERSION = '1.0.0' as const

const catalogIdentity = {
  catalogVersion: STORYTELLING_MOTION_STYLE_CATALOG_VERSION,
  profiles: STORYTELLING_MOTION_STYLE_PROFILES.map(storytellingMotionStyleProfileReference),
}

export const STORYTELLING_MOTION_STYLE_CATALOG_DIGEST = sha256CanonicalJson(catalogIdentity)

/**
 * Projects the immutable server catalog into a bounded user-facing comparison.
 * It contains no provider, prompt, tool, job, cost amount, or execution data.
 */
export function createStorytellingMotionStyleReview(): StorytellingMotionStyleReviewDto {
  const review = storytellingMotionStyleReviewDtoSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_REVIEW_VERSION,
    catalogVersion: STORYTELLING_MOTION_STYLE_CATALOG_VERSION,
    catalogDigest: STORYTELLING_MOTION_STYLE_CATALOG_DIGEST,
    state: 'comparison_only',
    directions: STORYTELLING_MOTION_STYLE_PROFILES.map((profile) => ({
      styleProfile: storytellingMotionStyleProfileReference(profile),
      displayName: profile.displayName,
      shortDescription: profile.shortDescription,
      bestFor: profile.bestFor,
      constructionLabel: constructionLabel(profile),
      relativeCostTendency: profile.relativeCostTendency,
      editability: profile.editability,
    })),
    decisionAuthority: 'chat_then_plan_review',
    notice: 'Compare directions here, then discuss the choice in Chat. A direction is not selected, approved, generated, or charged from this view.',
    readOnly: true,
    runtimeExecutionAuthorized: false,
  })
  return deepFreeze(review)
}

function constructionLabel(
  profile: StorytellingMotionStyleProfile,
): StorytellingMotionStyleReviewDto['directions'][number]['constructionLabel'] {
  if (profile.defaultProductionMode === 'hybrid_directed') return 'Directed hybrid'
  if (profile.defaultProductionMode === 'native_graphics_first') return 'Native graphics'
  throw new Error(`Storytelling style profile has no approved user-facing construction label: ${profile.id}`)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
