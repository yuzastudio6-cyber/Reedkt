import type {
  EditReferenceApiResult,
  EditReferenceDetail,
  EditReferenceListItem,
  EditReferenceStudyGoal,
  PreferenceDNAQAResultRecord,
  PreferenceDNAVersionRecord,
} from '../types/edit-reference'
import type { EditReferenceApiClient } from './edit-reference-api-client'

export interface ApprovedEditReferenceOption {
  id: string
  name: string
  handle: string
  normalizedHandle: string
  description?: string
  referenceRevision: number
  dnaVersionId: string
  dnaVersionNumber: number
  dnaContentDigest: string
  qaResultId: string
  qaStatus: PreferenceDNAQAResultRecord['status']
  confidence: number
  confidenceBand: PreferenceDNAVersionRecord['overallConfidenceBand']
  doNotCopyRuleCount: number
  applicableLayers: EditReferenceStudyGoal[]
  layerLabels: string[]
  summary: string
}

export interface ApprovedEditReferenceOptionsResult {
  code?: string
  ok: boolean
  options: ApprovedEditReferenceOption[]
  status?: number
  warnings: string[]
  message?: string
}

const GOAL_LABELS: Record<EditReferenceStudyGoal, string[]> = {
  visual_language: ['Visual'],
  story_and_pacing: ['Story', 'Pacing'],
  captions: ['Captions'],
  color: ['Color'],
  b_roll: ['B-roll'],
  audio_and_sfx: ['Audio'],
  graphics: ['Graphics'],
}

export async function loadApprovedEditReferenceOptions(input: {
  api: EditReferenceApiClient
  workspaceId: string
}): Promise<ApprovedEditReferenceOptionsResult> {
  if (!input.api.available) {
    return {
      code: 'EDIT_REFERENCE_BACKEND_UNAVAILABLE',
      ok: false,
      options: [],
      status: 503,
      warnings: [],
      message: 'Approved Edit References are unavailable in this browser runtime.',
    }
  }

  const list = await input.api.list(input.workspaceId)
  if (!list.ok) {
    return {
      code: list.code,
      ok: false,
      options: [],
      status: list.status,
      warnings: [],
      message: list.message,
    }
  }
  const approvedItems = list.data.references.filter(isApprovedListItem)
  const details = await Promise.all(approvedItems.map((item) => input.api.get(input.workspaceId, item.reference.id)))
  const warnings = [...list.warnings]
  const options: ApprovedEditReferenceOption[] = []

  details.forEach((result, index) => {
    if (!result.ok) {
      warnings.push(`${approvedItems[index]?.reference.name ?? 'An Edit Reference'} could not be inspected: ${result.message}`)
      return
    }
    const option = createApprovedEditReferenceOption(result.data.detail)
    if (option) options.push(option)
    else warnings.push(`${result.data.detail.reference.name} no longer has an exact approved, quality-reviewed DNA version.`)
  })

  return {
    ok: true,
    options: options.sort((left, right) => left.name.localeCompare(right.name)),
    warnings,
  }
}

export function createApprovedEditReferenceOption(detail: EditReferenceDetail): ApprovedEditReferenceOption | undefined {
  const dna = latestApprovedDNA(detail)
  if (!dna?.approval || !dna.qaResultId) return undefined
  const qa = detail.dnaQaResults.find((record) => record.id === dna.qaResultId)
  if (!qa || qa.status === 'blocked' || qa.dnaContentDigest !== dna.contentDigest) return undefined
  const applicableLayers = detail.reference.initialGoals.slice()
  const layerLabels = [
    ...applicableLayers.flatMap((goal) => GOAL_LABELS[goal]),
    'Safety',
  ]
  return {
    id: detail.reference.id,
    name: detail.reference.name,
    handle: createEditReferenceHandle(detail.reference.name),
    normalizedHandle: normalizeEditReferenceHandle(detail.reference.name),
    description: detail.reference.description,
    referenceRevision: detail.reference.revision,
    dnaVersionId: dna.id,
    dnaVersionNumber: dna.version,
    dnaContentDigest: dna.contentDigest,
    qaResultId: qa.id,
    qaStatus: qa.status,
    confidence: dna.overallConfidence,
    confidenceBand: dna.overallConfidenceBand,
    doNotCopyRuleCount: dna.doNotCopyRuleCount,
    applicableLayers,
    layerLabels,
    summary: summarizeApprovedReference(dna),
  }
}

export function createEditReferenceHandle(name: string): string {
  const parts = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
  const body = parts.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join('')
  return `@${body || 'EditReference'}`
}

export function normalizeEditReferenceHandle(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^@/, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

export function findApprovedReferenceMatches(
  options: ApprovedEditReferenceOption[],
  handle: string,
): ApprovedEditReferenceOption[] {
  const normalized = normalizeEditReferenceHandle(handle)
  if (!normalized) return []
  const exact = options.filter((option) => option.normalizedHandle === normalized)
  if (exact.length > 0) return exact
  return options.filter((option) => (
    option.normalizedHandle.startsWith(normalized)
    || normalized.startsWith(option.normalizedHandle)
  ))
}

function isApprovedListItem(item: EditReferenceListItem): boolean {
  return item.reference.status === 'active'
    && item.reference.dnaStatus === 'approved'
    && item.currentStudy.status === 'approved'
}

function latestApprovedDNA(detail: EditReferenceDetail): PreferenceDNAVersionRecord | undefined {
  return detail.dnaVersions
    .filter((version) => version.status === 'approved' && Boolean(version.approval))
    .sort((left, right) => right.version - left.version)[0]
}

function summarizeApprovedReference(dna: PreferenceDNAVersionRecord): string {
  const transferableRules = dna.rules.filter((rule) => rule.kind === 'must_follow').length
  return `${transferableRules} reusable rule${transferableRules === 1 ? '' : 's'} across ${dna.layers.length} DNA layer${dna.layers.length === 1 ? '' : 's'}, with ${dna.doNotCopyRuleCount} copy-safety boundar${dna.doNotCopyRuleCount === 1 ? 'y' : 'ies'}.`
}

export function approvedOptionsFromResults(
  results: Array<EditReferenceApiResult<{ detail: EditReferenceDetail }>>,
): ApprovedEditReferenceOption[] {
  return results.flatMap((result) => {
    if (!result.ok) return []
    const option = createApprovedEditReferenceOption(result.data.detail)
    return option ? [option] : []
  })
}
