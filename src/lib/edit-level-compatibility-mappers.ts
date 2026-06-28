import type {
  EditLevelNormalizationInput,
  EditLevelNormalizationResult,
  ReEditProCanonicalEditLevel,
  ReEditProEditLevelDisplayName,
  ReEditProEditLevelInputSource,
  ReEditProLegacyEditLevel,
} from '../types'
import { EDIT_LEVEL_LEGACY_ALIAS_MAPPINGS } from './mock-edit-level-profiles'

const canonicalLevels: ReEditProCanonicalEditLevel[] = ['normal', 'premium', 'ultra_premium']
const legacyLevels: ReEditProLegacyEditLevel[] = ['basic', 'pro', 'premium']

export function isReEditProLegacyEditLevel(value: string): value is ReEditProLegacyEditLevel {
  return legacyLevels.includes(value as ReEditProLegacyEditLevel)
}

export function isReEditProCanonicalEditLevel(value: string): value is ReEditProCanonicalEditLevel {
  return canonicalLevels.includes(value as ReEditProCanonicalEditLevel)
}

export function mapLegacyEditLevelToCanonical(legacyLevel: ReEditProLegacyEditLevel): ReEditProCanonicalEditLevel {
  return EDIT_LEVEL_LEGACY_ALIAS_MAPPINGS.find((mapping) => mapping.legacyLevel === legacyLevel)?.canonicalLevel ?? 'normal'
}

export function mapCanonicalEditLevelToPublicLabel(level: ReEditProCanonicalEditLevel): ReEditProEditLevelDisplayName {
  if (level === 'normal') return 'Normal'
  if (level === 'premium') return 'Premium'
  return 'Ultra Premium'
}

function normalizeKnownInput(value: string, inputSource: ReEditProEditLevelInputSource): EditLevelNormalizationResult {
  if (inputSource === 'legacy_runtime' && isReEditProLegacyEditLevel(value)) {
    const canonicalLevel = mapLegacyEditLevelToCanonical(value)
    return {
      inputValue: value,
      inputSource,
      legacyLevel: value,
      canonicalLevel,
      publicDisplayName: mapCanonicalEditLevelToPublicLabel(canonicalLevel),
      ambiguous: value === 'premium',
      ok: true,
      notes: value === 'premium'
        ? ['legacy_runtime premium maps to ultra_premium; source context is required.']
        : [`legacy_runtime ${value} maps to ${canonicalLevel}.`],
    }
  }

  if ((inputSource === 'public_beta' || inputSource === 'explicit_canonical') && isReEditProCanonicalEditLevel(value)) {
    return {
      inputValue: value,
      inputSource,
      canonicalLevel: value,
      publicDisplayName: mapCanonicalEditLevelToPublicLabel(value),
      ambiguous: value === 'premium',
      ok: true,
      notes: value === 'premium'
        ? [`${inputSource} premium remains canonical premium.`]
        : [`${inputSource} ${value} remains canonical ${value}.`],
    }
  }

  return {
    inputValue: value,
    inputSource,
    ambiguous: value === 'premium',
    ok: false,
    notes: [`Unsupported edit level value "${value}" for source ${inputSource}.`],
  }
}

export function normalizeEditLevelInput(input: EditLevelNormalizationInput): EditLevelNormalizationResult {
  return normalizeKnownInput(input.value, input.inputSource)
}

export function createEditLevelLegacyCompatibilitySummary() {
  return EDIT_LEVEL_LEGACY_ALIAS_MAPPINGS.map((mapping) => ({
    legacyLevel: mapping.legacyLevel,
    canonicalLevel: mapping.canonicalLevel,
    publicDisplayName: mapping.publicDisplayName,
    notes: mapping.notes,
  }))
}
