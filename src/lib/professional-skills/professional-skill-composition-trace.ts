import { assertClosedContractTree } from '../closed-contract-validation'
import { sha256HexUtf8 } from '../sha256'
import type {
  CaptionProfessionalSkillCompositionTraceEntry,
  ProfessionalSkillCompositionTrace,
} from '../../types/caption-specialist-integration'
import { PROFESSIONAL_SKILL_COMPOSITION_TRACE_VERSION } from
  '../../types/caption-specialist-integration'
import type { ProfessionalSkillSelection } from '../../types/professional-skills'

const NO_CAPTIONS_SKILL_ID = 'captions.no_caption_policy'
const SELECTION_SOURCES = new Set([
  'baseline', 'user_prompt', 'compiled_intent', 'edit_brief', 'edit_cue',
  'workflow_profile', 'edit_level', 'source_context',
])

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) => [key, canonicalize(item)]),
  )
}

export function calculateProfessionalSkillCompositionTraceDigest(
  trace: Omit<ProfessionalSkillCompositionTrace, 'traceDigestSha256'> & {
    traceDigestSha256?: string
  },
): string {
  const value = { ...trace, traceDigestSha256: '' }
  assertClosedContractTree(value, 'Professional skill composition trace')
  return sha256HexUtf8(JSON.stringify(canonicalize(value)))
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

export function createProfessionalSkillCompositionTrace(input: {
  planId: string
  selectedSkills: ProfessionalSkillSelection[]
}): ProfessionalSkillCompositionTrace {
  const captionSelections = input.selectedSkills.filter((selection) =>
    selection.family === 'captions')
  const noCaptions = captionSelections.find((selection) =>
    selection.skillId === NO_CAPTIONS_SKILL_ID)
  const activeCaptionSelections = captionSelections.filter((selection) =>
    selection.skillId !== NO_CAPTIONS_SKILL_ID)

  const entry: CaptionProfessionalSkillCompositionTraceEntry = noCaptions
    ? {
        specialistKey: 'captions',
        disposition: 'restrained',
        selectedComponentKeys: [],
        restraintKey: 'no_captions',
        sourceSkillIds: [NO_CAPTIONS_SKILL_ID],
        selectionSources: unique(noCaptions.selectionSources),
        exactRegistrySelectionVerified: true,
        legacyOptionalCaptionComponentActivationAllowed: false,
      }
    : activeCaptionSelections.length > 0
      ? {
          specialistKey: 'captions',
          disposition: 'selected',
          selectedComponentKeys: ['caption_design', 'caption_render_qa'],
          restraintKey: null,
          sourceSkillIds: unique(activeCaptionSelections.map(
            (selection) => selection.skillId)),
          selectionSources: unique(activeCaptionSelections.flatMap(
            (selection) => selection.selectionSources)),
          exactRegistrySelectionVerified: true,
          legacyOptionalCaptionComponentActivationAllowed: false,
        }
      : {
          specialistKey: 'captions',
          disposition: 'unresolved',
          selectedComponentKeys: [],
          restraintKey: null,
          sourceSkillIds: [],
          selectionSources: [],
          exactRegistrySelectionVerified: true,
          legacyOptionalCaptionComponentActivationAllowed: false,
        }

  const withoutDigest = {
    schemaVersion: PROFESSIONAL_SKILL_COMPOSITION_TRACE_VERSION,
    traceId: `${input.planId}.composition-trace`,
    entries: [entry] as [CaptionProfessionalSkillCompositionTraceEntry],
    exactRegistrySelectionVerified: true as const,
    selectionInferredFromLegacyOptionalComponent: false as const,
    approvalOrExecutionAuthorityGranted: false as const,
  }
  return parseProfessionalSkillCompositionTrace({
    ...withoutDigest,
    traceDigestSha256: calculateProfessionalSkillCompositionTraceDigest(
      withoutDigest),
  })
}

export function parseProfessionalSkillCompositionTrace(
  value: unknown,
): ProfessionalSkillCompositionTrace {
  assertClosedContractTree(value, 'Professional skill composition trace')
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Professional skill composition trace is malformed.')
  }
  const trace = value as ProfessionalSkillCompositionTrace
  const keys = Object.keys(trace).sort()
  const expectedKeys = [
    'approvalOrExecutionAuthorityGranted',
    'entries',
    'exactRegistrySelectionVerified',
    'schemaVersion',
    'selectionInferredFromLegacyOptionalComponent',
    'traceDigestSha256',
    'traceId',
  ]
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)
    || trace.schemaVersion !== PROFESSIONAL_SKILL_COMPOSITION_TRACE_VERSION
    || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,239}$/u.test(trace.traceId)
    || !/^[a-f0-9]{64}$/u.test(trace.traceDigestSha256)
    || trace.exactRegistrySelectionVerified !== true
    || trace.selectionInferredFromLegacyOptionalComponent !== false
    || trace.approvalOrExecutionAuthorityGranted !== false
    || !Array.isArray(trace.entries)
    || trace.entries.length !== 1) {
    throw new Error('Professional skill composition trace contract is invalid.')
  }
  const entry = trace.entries[0]
  const selected = entry.disposition === 'selected'
  const restrained = entry.disposition === 'restrained'
  const unresolved = entry.disposition === 'unresolved'
  if (JSON.stringify(Object.keys(entry).sort()) !== JSON.stringify([
    'disposition', 'exactRegistrySelectionVerified',
    'legacyOptionalCaptionComponentActivationAllowed', 'restraintKey',
    'selectedComponentKeys', 'selectionSources', 'sourceSkillIds',
    'specialistKey',
  ])
    || entry.specialistKey !== 'captions'
    || (!selected && !restrained && !unresolved)
    || entry.exactRegistrySelectionVerified !== true
    || entry.legacyOptionalCaptionComponentActivationAllowed !== false
    || entry.sourceSkillIds.some((skillId) =>
      !/^[a-z][a-z0-9._:-]{0,239}$/u.test(skillId))
    || entry.selectionSources.some((source) => !SELECTION_SOURCES.has(source))
    || new Set(entry.sourceSkillIds).size !== entry.sourceSkillIds.length
    || new Set(entry.selectionSources).size !== entry.selectionSources.length
    || (selected && (
      entry.restraintKey !== null
      || entry.selectedComponentKeys.join('|') !==
        'caption_design|caption_render_qa'
      || entry.sourceSkillIds.length < 1
      || entry.selectionSources.length < 1
    ))
    || (restrained && (
      entry.restraintKey !== 'no_captions'
      || entry.selectedComponentKeys.length !== 0
      || entry.sourceSkillIds.join('|') !== NO_CAPTIONS_SKILL_ID
      || entry.selectionSources.length < 1
    ))
    || (unresolved && (
      entry.restraintKey !== null
      || entry.selectedComponentKeys.length !== 0
      || entry.sourceSkillIds.length !== 0
      || entry.selectionSources.length !== 0
    ))
    || calculateProfessionalSkillCompositionTraceDigest(trace) !==
      trace.traceDigestSha256) {
    throw new Error('Professional skill composition trace semantics are invalid.')
  }
  return structuredClone(trace)
}
