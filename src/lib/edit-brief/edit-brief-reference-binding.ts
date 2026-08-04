import type { EditBrief } from '../../types/edit-brief'
import type { CanonicalEditBriefFields } from '../../types/edit-brief-authority'
import { createEditReferenceDeterministicHash } from '../edit-reference-deterministic-hash'

export function createCanonicalEditBriefFieldsFromEditBrief(
  editBrief: EditBrief,
): CanonicalEditBriefFields {
  return {
    goal: editBrief.goal?.trim() ?? '',
    audience: optional(editBrief.audience),
    deliverable: editBrief.targetPlatforms.length > 0
      ? `Professional edit for ${editBrief.targetPlatforms.join(', ')}`
      : undefined,
    mustIncludeNotes: unique(editBrief.mustIncludeNotes),
    avoidNotes: unique(editBrief.avoidNotes),
    additionalNotes: optional(editBrief.specialInstructions),
    targetPlatforms: [...editBrief.targetPlatforms],
    targetDurationMs: editBrief.targetDurationMs,
    styleKeywords: unique(editBrief.styleKeywords),
    pacingPreference: editBrief.pacingPreference,
    captionPreference: editBrief.captionPreference,
    musicPreference: editBrief.musicPreference,
    bRollPreference: optional(editBrief.bRollPreference),
    mustUseAssetIds: unique(editBrief.mustUseAssetIds),
    avoidAssetIds: unique(editBrief.avoidAssetIds),
    brandNotes: optional(editBrief.brandNotes),
    specialInstructions: optional(editBrief.specialInstructions),
    userProvidedReferenceUrls: unique(editBrief.userProvidedReferenceUrls ?? []),
    status: editBrief.status === 'ready' || editBrief.status === 'used_in_plan'
      ? 'ready'
      : 'draft',
  }
}

export function canonicalEditBriefFieldsEqual(
  left: CanonicalEditBriefFields | undefined,
  right: CanonicalEditBriefFields,
): boolean {
  if (!left) return false
  return JSON.stringify(normalizeCanonicalFields(left))
    === JSON.stringify(normalizeCanonicalFields(right))
}

export function createEditReferenceBriefTextFromEditBrief(
  brief: EditBrief,
): string {
  const rows = [
    ['Status', brief.status],
    ['Goal', brief.goal],
    ['Audience', brief.audience],
    ['Platforms', brief.targetPlatforms.join(', ')],
    ['Target duration', brief.targetDurationMs ? `${brief.targetDurationMs} ms` : undefined],
    ['Style direction', brief.styleKeywords.join(', ')],
    ['Pacing', brief.pacingPreference],
    ['Captions', brief.captionPreference],
    ['Music', brief.musicPreference],
    ['B-roll', brief.bRollPreference],
    ['Must include', brief.mustIncludeNotes.join(' | ')],
    ['Avoid', brief.avoidNotes.join(' | ')],
    ['Brand direction', brief.brandNotes],
    ['Special instructions', brief.specialInstructions],
    ['Must-use asset set', fingerprintPrivateIdentifiers(brief.mustUseAssetIds)],
    ['Avoid-asset set', fingerprintPrivateIdentifiers(brief.avoidAssetIds)],
    ['Reference-link set', fingerprintPrivateIdentifiers(brief.userProvidedReferenceUrls ?? [])],
    ['Brief version', String(brief.version)],
  ] as const

  return rows
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => `${label}: ${value?.trim()}`)
    .join('\n')
}

function normalizeCanonicalFields(
  fields: CanonicalEditBriefFields,
): CanonicalEditBriefFields {
  return {
    goal: fields.goal,
    audience: optional(fields.audience),
    deliverable: optional(fields.deliverable),
    mustIncludeNotes: fields.mustIncludeNotes ?? [],
    avoidNotes: fields.avoidNotes ?? [],
    additionalNotes: optional(fields.additionalNotes),
    targetPlatforms: fields.targetPlatforms ?? [],
    targetDurationMs: fields.targetDurationMs,
    styleKeywords: fields.styleKeywords ?? [],
    pacingPreference: fields.pacingPreference,
    captionPreference: fields.captionPreference,
    musicPreference: fields.musicPreference,
    bRollPreference: optional(fields.bRollPreference),
    mustUseAssetIds: fields.mustUseAssetIds ?? [],
    avoidAssetIds: fields.avoidAssetIds ?? [],
    brandNotes: optional(fields.brandNotes),
    specialInstructions: optional(fields.specialInstructions),
    userProvidedReferenceUrls: fields.userProvidedReferenceUrls ?? [],
    status: fields.status,
  }
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function fingerprintPrivateIdentifiers(
  values: readonly string[],
): string | undefined {
  const normalized = values.map((value) => value.trim()).filter(Boolean).sort()
  return normalized.length > 0
    ? `${normalized.length} item(s), fingerprint ${createEditReferenceDeterministicHash(normalized)}`
    : undefined
}
