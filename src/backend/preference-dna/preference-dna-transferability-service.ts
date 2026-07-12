import type {
  PreferenceDNAEvidenceRef,
  PreferenceDNALayerRecord,
  PreferenceDNATransferability,
} from '../../types/preference-dna-builder'

const doNotCopyMatchers = [
  'exact timing',
  'exact music',
  'exact sfx',
  'exact graphic layout',
  'exact layout',
  'creator identity',
  'brand identity',
  'ui screenshot',
  'source footage',
  'shot-for-shot',
]

export function classifyPreferenceDNATransferability(text: string): PreferenceDNATransferability {
  const lower = text.toLowerCase()
  if (doNotCopyMatchers.some((matcher) => lower.includes(matcher))) return 'do_not_copy'
  if (lower.includes('uncertain') || lower.includes('requires user review')) return 'requires_user_review'
  if (lower.includes('exact') || lower.includes('non-transferable')) return 'non_transferable'
  if (lower.includes('principle') || lower.includes('style') || lower.includes('pacing') || lower.includes('readable')) {
    return 'transferable'
  }
  return 'partially_transferable'
}

export function createTransferablePreferenceRules(
  evidenceRefsOrLayers: Array<PreferenceDNAEvidenceRef | PreferenceDNALayerRecord>,
): string[] {
  const summaries = evidenceRefsOrLayers.map((item) => item.summary)
  return [
    'Adapt voice-first editing language, pacing feel, readability, and polish as reusable rules.',
    ...summaries
      .filter((summary) => classifyPreferenceDNATransferability(summary) === 'transferable')
      .slice(0, 5)
      .map((summary) => `Transferable: ${summary}`),
  ]
}

export function createNonTransferablePreferenceDetails(
  evidenceRefsOrLayers: Array<PreferenceDNAEvidenceRef | PreferenceDNALayerRecord>,
): string[] {
  return [
    'Keep project-specific brands, scripts, footage, UI screenshots, and creator identity out of reusable preference rules.',
    ...evidenceRefsOrLayers
      .map((item) => item.summary)
      .filter((summary) => ['non_transferable', 'do_not_copy'].includes(classifyPreferenceDNATransferability(summary)))
      .slice(0, 5)
      .map((summary) => `Non-transferable: ${summary}`),
  ]
}

export function createDoNotCopyPreferenceRules(
  evidenceRefsOrLayers: Array<PreferenceDNAEvidenceRef | PreferenceDNALayerRecord> = [],
): string[] {
  const rules = [
    'Do not copy exact shot order, shot composition, source footage, or shot-for-shot sequence.',
    'Do not copy exact timing, pause lengths, cut points, music cues, SFX hits, or card animation timing.',
    'Do not copy exact music, lyrics, SFX, ambience, creator voice identity, or protected sound design.',
    'Do not copy exact graphic layout, typography, UI screenshots, brand marks, color recipe, or creator identity.',
    'Use source/reference evidence only as editing-language guidance and transferable preference vocabulary.',
  ]
  const derived = evidenceRefsOrLayers
    .map((item) => item.summary)
    .filter((summary) => classifyPreferenceDNATransferability(summary) === 'do_not_copy')
    .slice(0, 6)
    .map((summary) => `Do not copy from evidence: ${summary}`)
  return [...new Set([...rules, ...derived])]
}

export function createPreferenceDNATransferabilitySummary(
  evidenceRefsOrLayers: Array<PreferenceDNAEvidenceRef | PreferenceDNALayerRecord>,
): string {
  const counts = evidenceRefsOrLayers.reduce((acc, item) => {
    const transferability = item.transferability
    acc[transferability] = (acc[transferability] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  return `Transferability classified: ${Object.entries(counts).map(([key, value]) => `${key}=${value}`).join(', ')}.`
}
