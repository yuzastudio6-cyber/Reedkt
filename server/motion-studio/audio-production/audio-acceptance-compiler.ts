import {
  motionStudioAudioAcceptanceChainV1Schema,
  motionStudioAudioSelectionManifestV1Schema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioAudioAcceptanceChainV1,
  MotionStudioAudioSelectionManifestV1,
  MotionStudioIntegratedMixInputV1,
  MotionStudioSelectedAudioStemV1,
} from '../../../src/types/motion-studio'
import { MOTION_STUDIO_AUDIO_SELECTION_MANIFEST_VERSION } from '../../../src/types/motion-studio'
import { sha256CanonicalJson } from '../commands/canonical-json'

export type MotionStudioAudioAcceptanceCompilerErrorCode =
  | 'audio_selection_input_invalid'
  | 'audio_acceptance_chain_invalid'
  | 'audio_acceptance_digest_mismatch'
  | 'audio_acceptance_source_mismatch'

export class MotionStudioAudioAcceptanceCompilerError extends Error {
  readonly code: MotionStudioAudioAcceptanceCompilerErrorCode

  constructor(code: MotionStudioAudioAcceptanceCompilerErrorCode, message: string) {
    super(message)
    this.name = 'MotionStudioAudioAcceptanceCompilerError'
    this.code = code
  }
}

export interface CompiledMotionStudioAudioAcceptanceChainV1 {
  chain: MotionStudioAudioAcceptanceChainV1
  authorityDigest: string
  selectionManifestDigest: string
  narrationAssemblyManifestDigest: string
  narrationAssemblyQualityReportDigest: string
  integratedMixRequestDigest: string
  integratedMixQualityReportDigest: string
  fineCutHandoffEligible: boolean
  timelineMutationAuthorized: false
  renderAuthorized: false
  exportAuthorized: false
  productReady: false
}

type MotionStudioAudioSelectionDerivedKey =
  | 'schemaVersion'
  | 'moduleId'
  | 'inheritedInternalCostMicros'
  | 'incrementalSelectionCostMicros'
  | 'totalInternalCostMicros'
  | 'currency'
  | 'selectionMethod'
  | 'firstOrOnlyTakeAutoSelected'
  | 'mixEligible'
  | 'mixEligibilityDerivedBy'
  | 'customerPriceIncluded'
  | 'customerCreditsIncluded'
  | 'serviceFeeIncluded'
  | 'walletMutationPerformed'
  | 'billingMutationPerformed'
  | 'timelineMutationAllowed'
  | 'renderAllowed'
  | 'exportAllowed'
  | 'productReady'
  | 'immutable'

export type MotionStudioAudioSelectionCompilerInputV1 = Omit<
  MotionStudioAudioSelectionManifestV1,
  MotionStudioAudioSelectionDerivedKey
>

const AUDIO_SELECTION_INPUT_KEYS = Object.freeze([
  'workspaceId', 'projectId', 'editSessionId', 'productionId',
  'selectionManifestId', 'selectionManifestVersion', 'supersedesSelectionManifestId',
  'dependencyAcceptance', 'approvedSnapshotId', 'approvedSnapshotDigest',
  'approvedPlanReviewId', 'approvedCreditEstimateId', 'activeNoncommercialTestReservationId',
  'preparedScriptArtifactVersion', 'voiceBibleArtifactVersion', 'musicBibleArtifactVersion',
  'pictureLockArtifactVersion', 'timingAuthority', 'approvedVoiceSegmentIds',
  'selectedNarration', 'optionalRoleDecisions', 'musicCueAuthorityIds',
  'soundEventAuthorityIds', 'costLineage', 'selectedByActorId', 'selectedAt',
  'decisionReason',
] as const satisfies readonly (keyof MotionStudioAudioSelectionCompilerInputV1)[])

export interface CompiledMotionStudioAudioSelectionManifestV1 {
  manifest: MotionStudioAudioSelectionManifestV1
  manifestDigest: string
  mixEligibleDerivedServerSide: true
  selectionExecutedMix: false
}

export function compileMotionStudioAudioSelectionManifestV1(
  input: unknown,
): CompiledMotionStudioAudioSelectionManifestV1 {
  if (!isPlainRecord(input) || !hasExactKeys(input, AUDIO_SELECTION_INPUT_KEYS)) {
    throw new MotionStudioAudioAcceptanceCompilerError(
      'audio_selection_input_invalid',
      'Audio selection input contains missing or unsupported authority fields.',
    )
  }

  const candidate = input as unknown as MotionStudioAudioSelectionCompilerInputV1
  const inheritedInternalCostMicros = Array.isArray(candidate.costLineage)
    ? candidate.costLineage.reduce((sum, item) => sum + item.inheritedInternalCostMicros, 0)
    : Number.NaN
  const parsed = motionStudioAudioSelectionManifestV1Schema.safeParse({
    ...candidate,
    schemaVersion: MOTION_STUDIO_AUDIO_SELECTION_MANIFEST_VERSION,
    moduleId: 'storytelling',
    inheritedInternalCostMicros,
    incrementalSelectionCostMicros: 0,
    totalInternalCostMicros: inheritedInternalCostMicros,
    currency: 'USD',
    selectionMethod: 'explicit_human_review',
    firstOrOnlyTakeAutoSelected: false,
    mixEligible: true,
    mixEligibilityDerivedBy: 'motion_studio_audio_selection_compiler_v1',
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
    walletMutationPerformed: false,
    billingMutationPerformed: false,
    timelineMutationAllowed: false,
    renderAllowed: false,
    exportAllowed: false,
    productReady: false,
    immutable: true,
  })
  if (!parsed.success) {
    throw new MotionStudioAudioAcceptanceCompilerError(
      'audio_selection_input_invalid',
      'Audio selection input failed current candidate, scope, timing, evidence, or cost validation.',
    )
  }

  return Object.freeze({
    manifest: parsed.data,
    manifestDigest: sha256CanonicalJson(parsed.data),
    mixEligibleDerivedServerSide: true,
    selectionExecutedMix: false,
  })
}

export function compileMotionStudioAudioAcceptanceChainV1(
  input: unknown,
): CompiledMotionStudioAudioAcceptanceChainV1 {
  const parsed = motionStudioAudioAcceptanceChainV1Schema.safeParse(input)
  if (!parsed.success) {
    throw new MotionStudioAudioAcceptanceCompilerError(
      'audio_acceptance_chain_invalid',
      'The private audio-acceptance chain is incomplete or inconsistent.',
    )
  }

  const chain = parsed.data
  const selectionManifestDigest = sha256CanonicalJson(chain.selectionManifest)
  const narrationAssemblyManifestDigest = sha256CanonicalJson(chain.narrationAssemblyManifest)
  const narrationAssemblyQualityReportDigest = sha256CanonicalJson(chain.narrationAssemblyQualityReport)
  const integratedMixRequestDigest = sha256CanonicalJson(chain.integratedMixRequest)
  const integratedMixQualityReportDigest = sha256CanonicalJson(chain.integratedMixQualityReport)

  assertDigest(
    selectionManifestDigest,
    [
      chain.narrationAssemblyManifest.selectionManifestDigest,
      chain.narrationAssemblyArtifact.selectionManifestDigest,
      chain.integratedMixRequest.selectionManifestDigest,
      chain.integratedMixArtifact.selectionManifestDigest,
      chain.audioAcceptanceRecord.selectionManifestDigest,
    ],
    'selection manifest',
  )
  assertDigest(
    narrationAssemblyManifestDigest,
    [
      chain.narrationAssemblyArtifact.narrationAssemblyManifestDigest,
      chain.narrationAssemblyQualityReport.narrationAssemblyManifestDigest,
      chain.integratedMixRequest.narrationAssemblyManifestDigest,
      chain.audioAcceptanceRecord.narrationAssemblyManifestDigest,
    ],
    'narration assembly manifest',
  )
  assertDigest(
    narrationAssemblyQualityReportDigest,
    [chain.integratedMixRequest.narrationAssemblyQualityReportDigest],
    'narration assembly quality report',
  )
  assertDigest(
    integratedMixRequestDigest,
    [chain.integratedMixArtifact.inputManifestDigest],
    'integrated mix request',
  )
  assertDigest(
    integratedMixQualityReportDigest,
    [chain.audioAcceptanceRecord.qualityReportDigest],
    'integrated mix quality report',
  )

  assertNarrationAssemblyMatchesSelection(chain)
  assertMixInputsMatchSelection(chain)

  return Object.freeze({
    chain,
    authorityDigest: sha256CanonicalJson(chain),
    selectionManifestDigest,
    narrationAssemblyManifestDigest,
    narrationAssemblyQualityReportDigest,
    integratedMixRequestDigest,
    integratedMixQualityReportDigest,
    fineCutHandoffEligible: chain.audioAcceptanceRecord.fineCutHandoffEligible,
    timelineMutationAuthorized: false,
    renderAuthorized: false,
    exportAuthorized: false,
    productReady: false,
  })
}

function assertNarrationAssemblyMatchesSelection(chain: MotionStudioAudioAcceptanceChainV1): void {
  const selected = chain.selectionManifest.selectedNarration
  const segments = chain.narrationAssemblyManifest.segments
  if (selected.length !== segments.length) {
    throw sourceMismatch('Narration assembly does not cover every selected voice segment.')
  }

  selected.forEach((selection, index) => {
    const segment = segments[index]
    if (!segment || segment.order !== index ||
      segment.selectedNarrationId !== selection.selectedNarrationId ||
      segment.voiceSegmentId !== selection.voiceSegmentId ||
      segment.selectedTakeId !== selection.selectedTakeId ||
      segment.sourceAssetVersionId !== selection.assetVersion.assetVersionId ||
      segment.sourceChecksumSha256 !== selection.assetVersion.checksumSha256 ||
      segment.spokenTextDigest !== selection.spokenTextDigest ||
      segment.alignmentEvidenceId !== selection.alignmentEvidence.evidenceId ||
      segment.alignmentEvidenceDigest !== selection.alignmentEvidence.evidenceDigest ||
      sha256CanonicalJson(segment.sourceSampleRange) !== sha256CanonicalJson(selection.sourceSampleRange) ||
      sha256CanonicalJson(segment.destination) !== sha256CanonicalJson(selection.destination)) {
      throw sourceMismatch('Narration assembly segment lineage does not match the exact selected take.')
    }
  })

  if (chain.narrationAssemblyArtifact.segmentMapDigest !== sha256CanonicalJson(segments)) {
    throw new MotionStudioAudioAcceptanceCompilerError(
      'audio_acceptance_digest_mismatch',
      'Narration assembly segment-map evidence does not match its manifest.',
    )
  }
}

function assertMixInputsMatchSelection(chain: MotionStudioAudioAcceptanceChainV1): void {
  const narrationInputs = chain.integratedMixRequest.inputs.filter((input) => input.role === 'narration')
  if (narrationInputs.length !== 1) {
    throw sourceMismatch('The integrated mix must contain one narration assembly and no raw narration takes.')
  }

  const selectedStems = chain.selectionManifest.optionalRoleDecisions
    .flatMap((decision) => decision.selections)
  const optionalInputs = chain.integratedMixRequest.inputs.filter((input) => input.role !== 'narration')
  if (selectedStems.length !== optionalInputs.length) {
    throw sourceMismatch('The integrated mix optional inputs must exactly match explicit stem selections.')
  }

  const inputsBySource = new Map(optionalInputs.map((input) => [input.sourceId, input]))
  for (const stem of selectedStems) {
    const input = inputsBySource.get(stem.selectedStemId)
    if (!input || !sameStemInput(stem, input)) {
      throw sourceMismatch('An integrated mix input does not match its exact selected stem authority.')
    }
  }
}

function sameStemInput(stem: MotionStudioSelectedAudioStemV1, input: MotionStudioIntegratedMixInputV1): boolean {
  return input.role === stem.role &&
    input.sourceKind === 'selected_stem' &&
    input.assetVersionId === stem.assetVersion.assetVersionId &&
    input.checksumSha256 === stem.assetVersion.checksumSha256 &&
    sha256CanonicalJson(input.placement) === sha256CanonicalJson(stem.placement) &&
    sameSet(input.cueAuthorityIds, stem.cueAuthorityIds) &&
    sameSet(input.soundEventAuthorityIds, stem.soundEventAuthorityIds) &&
    sameSet(input.rightsEvidenceIds, stem.candidateAuthority.rightsEvidence.map((item) => item.evidenceId))
}

function assertDigest(expected: string, received: readonly string[], label: string): void {
  if (received.some((value) => value !== expected)) {
    throw new MotionStudioAudioAcceptanceCompilerError(
      'audio_acceptance_digest_mismatch',
      `The ${label} digest does not match every downstream binding.`,
    )
  }
}

function sourceMismatch(message: string): MotionStudioAudioAcceptanceCompilerError {
  return new MotionStudioAudioAcceptanceCompilerError('audio_acceptance_source_mismatch', message)
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return new Set(left).size === left.length && new Set(right).size === right.length &&
    left.length === right.length && left.every((value) => right.includes(value))
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function hasExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
): boolean {
  const keys = Object.keys(value)
  const required = allowed.filter((key) => key !== 'supersedesSelectionManifestId')
  return keys.every((key) => allowed.includes(key)) && required.every((key) => keys.includes(key))
}
