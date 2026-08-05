import {
  CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION,
  CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V2,
  CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION,
  CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION_V2,
  CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION,
  CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION_V2,
  type CaptionTerminalQualificationEvidenceInput,
  type CaptionTerminalQualificationEvidenceInputV2,
  type CaptionTerminalQualificationPreflight,
  type CaptionTerminalQualificationPreflightV2,
  type CaptionTerminalQualificationProjection,
  type CaptionTerminalQualificationProjectionV2,
} from '../../src/types/caption-terminal-qualification'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import type {
  CanonicalCaptionPrivateReviewEvidenceProjection,
} from '../../src/types/canonical-caption-private-review-evidence-projection'
import {
  CAPTION_CURRENT_INTEGRATION_READINESS_V2,
  CAPTION_CURRENT_INTEGRATION_READINESS_V3,
} from './caption-current-integration-readiness'
import {
  CAPTION_CURRENT_JOB_READINESS_LEDGER_V2,
} from './caption-current-job-readiness'
import {
  assertCaptionTerminalPrivateReviewEvidence,
  createCaptionTerminalQualificationPreflight,
  createCaptionTerminalQualificationProjection,
  parseCaptionTerminalQualificationEvidenceInput,
  parseCaptionTerminalQualificationPreflight,
  parseCaptionTerminalQualificationProjection,
} from './caption-terminal-qualification'

function ref(
  id: string,
  version: string,
  contentHash: string,
): CaptionDomainRef {
  return { id, version, contentHash }
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

const historicalReadinessRef = ref(
  CAPTION_CURRENT_INTEGRATION_READINESS_V2.readinessId,
  CAPTION_CURRENT_INTEGRATION_READINESS_V2.schemaVersion,
  CAPTION_CURRENT_INTEGRATION_READINESS_V2.readinessDigestSha256)

export const CAPTION_MOUNT_AUDITED_INTEGRATION_READINESS_REF = ref(
  CAPTION_CURRENT_INTEGRATION_READINESS_V3.readinessId,
  CAPTION_CURRENT_INTEGRATION_READINESS_V3.schemaVersion,
  CAPTION_CURRENT_INTEGRATION_READINESS_V3.readinessDigestSha256)

function verifyDigest(
  value: Record<string, unknown>,
  digestField: string,
  label: string,
): void {
  if (value[digestField] !== calculateSkillContractDigest(value, digestField)) {
    throw new Error(`${label} digest verification failed.`)
  }
}

function redigest<T extends Record<string, unknown>>(
  value: T,
  digestField: string,
): T {
  return {
    ...value,
    [digestField]: calculateSkillContractDigest(value, digestField),
  }
}

function toHistoricalInput(
  input: CaptionTerminalQualificationEvidenceInputV2,
): CaptionTerminalQualificationEvidenceInput {
  const candidate = {
    ...structuredClone(input),
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION,
    sourceCurrentReadinessRef: structuredClone(historicalReadinessRef),
    inputDigestSha256: '',
  }
  candidate.inputDigestSha256 = calculateSkillContractDigest(
    candidate as unknown as Record<string, unknown>, 'inputDigestSha256')
  return parseCaptionTerminalQualificationEvidenceInput(candidate)
}

function sourceInputRef(
  input: CaptionTerminalQualificationEvidenceInputV2,
): CaptionDomainRef {
  return ref(input.inputId, input.schemaVersion, input.inputDigestSha256)
}

export function parseCaptionTerminalQualificationEvidenceInputV2(
  value: unknown,
): CaptionTerminalQualificationEvidenceInputV2 {
  assertClosedContractTree(value, 'Caption terminal qualification input V2')
  const input = structuredClone(value) as
    CaptionTerminalQualificationEvidenceInputV2
  if (input.schemaVersion !== CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V2) {
    throw new Error('Caption terminal qualification input V2 is required.')
  }
  verifyDigest(input as unknown as Record<string, unknown>,
    'inputDigestSha256', 'Caption terminal qualification input V2')
  if (refKey(input.sourceCurrentReadinessRef)
    !== refKey(CAPTION_MOUNT_AUDITED_INTEGRATION_READINESS_REF)) {
    throw new Error('Caption terminal qualification V2 readiness is stale.')
  }
  toHistoricalInput(input)
  return structuredClone(input)
}

function toHistoricalProjection(
  projection: CaptionTerminalQualificationProjectionV2,
  historicalInput: CaptionTerminalQualificationEvidenceInput,
): CaptionTerminalQualificationProjection {
  const candidate = {
    ...structuredClone(projection),
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION,
    sourceInputRef: ref(
      historicalInput.inputId,
      historicalInput.schemaVersion,
      historicalInput.inputDigestSha256),
    sourceCurrentReadinessRef: structuredClone(historicalReadinessRef),
    projectionDigestSha256: '',
  }
  candidate.projectionDigestSha256 = calculateSkillContractDigest(
    candidate as unknown as Record<string, unknown>, 'projectionDigestSha256')
  return candidate
}

export function parseCaptionTerminalQualificationProjectionV2(
  value: unknown,
  sourceEvidenceInput: unknown,
): CaptionTerminalQualificationProjectionV2 {
  const input = parseCaptionTerminalQualificationEvidenceInputV2(
    sourceEvidenceInput)
  assertClosedContractTree(value, 'Caption terminal qualification projection V2')
  const projection = structuredClone(value) as
    CaptionTerminalQualificationProjectionV2
  if (projection.schemaVersion
    !== CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION_V2) {
    throw new Error('Caption terminal qualification projection V2 is required.')
  }
  verifyDigest(projection as unknown as Record<string, unknown>,
    'projectionDigestSha256', 'Caption terminal qualification projection V2')
  if (refKey(projection.sourceInputRef) !== refKey(sourceInputRef(input))
    || refKey(projection.sourceCurrentReadinessRef)
      !== refKey(CAPTION_MOUNT_AUDITED_INTEGRATION_READINESS_REF)) {
    throw new Error('Caption terminal qualification projection V2 is stale.')
  }
  const historicalInput = toHistoricalInput(input)
  parseCaptionTerminalQualificationProjection(
    toHistoricalProjection(projection, historicalInput), historicalInput)
  return structuredClone(projection)
}

export function createCaptionTerminalQualificationProjectionV2(
  sourceEvidenceInput: unknown,
  privateReviewEvidenceProjections:
    readonly CanonicalCaptionPrivateReviewEvidenceProjection[],
): CaptionTerminalQualificationProjectionV2 {
  assertCurrentSourceReadinessAllowsTerminalProjection()
  const input = parseCaptionTerminalQualificationEvidenceInputV2(
    sourceEvidenceInput)
  const historicalInput = toHistoricalInput(input)
  const historicalProjection = createCaptionTerminalQualificationProjection(
    historicalInput, privateReviewEvidenceProjections)
  const withoutDigest: Omit<CaptionTerminalQualificationProjectionV2,
    'projectionDigestSha256'> = {
    ...historicalProjection,
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION_V2,
    projectionId: `captions.terminal.v2.projection.${input.inputDigestSha256}`,
    sourceInputRef: sourceInputRef(input),
    sourceCurrentReadinessRef: structuredClone(
      CAPTION_MOUNT_AUDITED_INTEGRATION_READINESS_REF),
  }
  return parseCaptionTerminalQualificationProjectionV2(redigest({
    ...withoutDigest,
    projectionDigestSha256: '',
  } as unknown as Record<string, unknown>, 'projectionDigestSha256'), input)
}

function toHistoricalPreflight(
  preflight: CaptionTerminalQualificationPreflightV2,
  historicalInput: CaptionTerminalQualificationEvidenceInput | null,
): CaptionTerminalQualificationPreflight {
  const candidate = {
    ...structuredClone(preflight),
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION,
    sourceCurrentReadinessRef: structuredClone(historicalReadinessRef),
    sourceQualificationInputRef: historicalInput === null ? null : ref(
      historicalInput.inputId,
      historicalInput.schemaVersion,
      historicalInput.inputDigestSha256),
    preflightDigestSha256: '',
  }
  candidate.preflightDigestSha256 = calculateSkillContractDigest(
    candidate as unknown as Record<string, unknown>, 'preflightDigestSha256')
  return candidate
}

export function parseCaptionTerminalQualificationPreflightV2(
  value: unknown,
  sourceEvidenceInput?: unknown,
): CaptionTerminalQualificationPreflightV2 {
  assertClosedContractTree(value, 'Caption terminal qualification preflight V2')
  const preflight = structuredClone(value) as
    CaptionTerminalQualificationPreflightV2
  if (preflight.schemaVersion
    !== CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION_V2) {
    throw new Error('Caption terminal qualification preflight V2 is required.')
  }
  verifyDigest(preflight as unknown as Record<string, unknown>,
    'preflightDigestSha256', 'Caption terminal qualification preflight V2')
  if (refKey(preflight.sourceCurrentReadinessRef)
    !== refKey(CAPTION_MOUNT_AUDITED_INTEGRATION_READINESS_REF)) {
    throw new Error('Caption terminal qualification preflight V2 is stale.')
  }
  const input = sourceEvidenceInput === undefined
    ? null : parseCaptionTerminalQualificationEvidenceInputV2(sourceEvidenceInput)
  if (preflight.sourceQualificationInputRef !== null
    && (input === null || refKey(preflight.sourceQualificationInputRef)
      !== refKey(sourceInputRef(input)))) {
    throw new Error('Caption terminal qualification preflight V2 input is stale.')
  }
  const historicalInput = input === null
    || preflight.sourceQualificationInputRef === null
    ? null : toHistoricalInput(input)
  parseCaptionTerminalQualificationPreflight(
    toHistoricalPreflight(preflight, historicalInput))
  return structuredClone(preflight)
}

export function createCaptionTerminalQualificationPreflightV2(
  sourceEvidenceInput?: unknown,
  privateReviewEvidenceProjections?:
    readonly CanonicalCaptionPrivateReviewEvidenceProjection[],
): CaptionTerminalQualificationPreflightV2 {
  const input = sourceEvidenceInput === undefined
    ? null : parseCaptionTerminalQualificationEvidenceInputV2(sourceEvidenceInput)
  const sourceReady = currentSourceReadinessAllowsTerminalProjection()
  const historicalInput = input === null || !sourceReady
    ? undefined : toHistoricalInput(input)
  if (input && sourceReady && privateReviewEvidenceProjections) {
    assertCaptionTerminalPrivateReviewEvidence(
      historicalInput!, privateReviewEvidenceProjections)
  }
  const historical = createCaptionTerminalQualificationPreflight(
    historicalInput, privateReviewEvidenceProjections)
  const acceptedInput = historical.disposition === 'ready_for_terminal_projection'
    ? input : null
  const withoutDigest: Omit<CaptionTerminalQualificationPreflightV2,
    'preflightDigestSha256'> = {
    ...historical,
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION_V2,
    preflightId: input === null
      ? 'captions.terminal.qualification.mount-audited-preflight'
      : `captions.terminal.v2.preflight.${input.inputDigestSha256}`,
    sourceCurrentReadinessRef: structuredClone(
      CAPTION_MOUNT_AUDITED_INTEGRATION_READINESS_REF),
    sourceQualificationInputRef: acceptedInput === null
      ? null : sourceInputRef(acceptedInput),
  }
  return parseCaptionTerminalQualificationPreflightV2(redigest({
    ...withoutDigest,
    preflightDigestSha256: '',
  } as unknown as Record<string, unknown>, 'preflightDigestSha256'),
  acceptedInput ?? undefined)
}

export const CAPTION_CURRENT_TERMINAL_QUALIFICATION_PREFLIGHT_V2 =
  createCaptionTerminalQualificationPreflightV2()

function currentSourceReadinessAllowsTerminalProjection(): boolean {
  const ledger = CAPTION_CURRENT_JOB_READINESS_LEDGER_V2
  const readyCount: number = ledger.counts.sourcePathsReadyForPrivateEvidenceRun
  const declaredCount: number = ledger.counts.declaredSupportedJobs
  const waitingCount: number = ledger.counts.jobsWaitingOnCanonicalOwnerMount
  return readyCount === declaredCount
    && waitingCount === 0
    && ledger.ownerMounts.every((owner) =>
      owner.canonicalCompositionMountImplemented)
    && ledger.jobs.every((job) =>
      job.sourceReadiness === 'ready_for_private_internal_evidence_run'
      && job.missingCanonicalOwnerMountKeys.length === 0)
}

function assertCurrentSourceReadinessAllowsTerminalProjection(): void {
  if (!currentSourceReadinessAllowsTerminalProjection()) {
    throw new Error(
      'Caption terminal projection is blocked by current source readiness.',
    )
  }
}
