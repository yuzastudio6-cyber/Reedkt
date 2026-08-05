import { z } from 'zod'

import {
  CANONICAL_SAM3_1_OPERATION_ID,
  createCanonicalSam31SourceRuntimeCandidate,
} from '../../../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  deepFreezeSkillValue,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../core/skill-capability-manifest-schema'
import { TRACK_ALL_SAM_OPERATION_V2 } from '../track-all-capability-manifest'
import { TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY } from './sam3_1-track-masklets-operation'

export const TRACK_ALL_SAM31_V2_ROUTE_GATE_REPORT_VERSION =
  'track_all_sam3_1_v2_route_gate_report_v2' as const

export const TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS = [
  'human_terms_and_commercial_legal_approval',
  'official_source_private_ingest_and_security',
  'official_checkpoint_private_ingest_hash_and_security',
  'strict_source_checkpoint_compatibility',
  'offline_dependency_closure',
  'immutable_signed_runtime_image',
  'v2_session_runtime_compatibility',
  'a100_private_runtime_and_quality',
  'l4_private_runtime_and_quality_if_fallback_active',
  'current_account_effective_rate_authority',
  'private_output_and_privacy_quality',
] as const

const gateKeySchema = z.enum(TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS)
const prefixedSha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u)

const gateFindingSchema = z.object({
  gateKey: gateKeySchema,
  disposition: z.enum(['passed', 'blocked', 'not_applicable']),
  evidenceClass: z.enum([
    'canonical_repository_authority',
    'canonical_private_reread',
    'missing_external_evidence',
  ]),
  evidenceHashes: z.array(skillSha256Schema).max(20),
  reason: z.string().trim().min(1).max(1_000),
}).strict().superRefine((value, context) => {
  if (value.disposition === 'passed' && value.evidenceHashes.length === 0) {
    context.addIssue({
      code: 'custom', message: 'A passed SAM route gate needs actual evidence.',
    })
  }
  if (value.evidenceClass === 'missing_external_evidence' &&
    value.disposition !== 'blocked') context.addIssue({
    code: 'custom', message: 'Missing SAM evidence cannot pass a route gate.',
  })
})

const routeGateReportCoreSchema = z.object({
  schemaVersion: z.literal(TRACK_ALL_SAM31_V2_ROUTE_GATE_REPORT_VERSION),
  operationId: z.literal(TRACK_ALL_SAM_OPERATION_V2),
  historicalOperationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  operationAuthorityHash: skillSha256Schema,
  sourceCandidateHash: skillSha256Schema,
  sourceRevision: z.literal(
    '96914d2425f90a64f45ca977c2b5165418099543',
  ),
  sourceArchiveSha256: z.literal(
    '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
  ),
  checkpointRevision: z.literal(
    'daa63191845a41281374e725f4c9e51c7a824460',
  ),
  checkpointSha256: skillSha256Schema.nullable(),
  runtimeImageDigest: prefixedSha256Schema.nullable(),
  findings: z.array(gateFindingSchema).length(
    TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS.length,
  ),
  planningAuthorityValid: z.literal(true),
  actualCheckpointBytesObserved: z.boolean(),
  actualStrictLoadObserved: z.boolean(),
  actualA100InferenceObserved: z.boolean(),
  actualL4InferenceObserved: z.boolean(),
  actualSamRequestCount: z.number().int().nonnegative(),
  routeQualificationStatus: z.enum([
    'blocked',
    'planning_qualified',
    'internal_execution_qualified',
    'production_qualified',
  ]),
  internalExecutionAuthorized: z.boolean(),
  productionExecutionAuthorized: z.boolean(),
  injectedEvidenceMaySatisfyRealSamGate: z.literal(false),
  generatedAt: z.string().datetime({ offset: true }),
}).strict().superRefine((value, context) => {
  const keys = value.findings.map((finding) => finding.gateKey)
  if (new Set(keys).size !== keys.length ||
    TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS.some((key) => !keys.includes(key))) {
    context.addIssue({
      code: 'custom', message: 'SAM 3.1 route gate report is incomplete.',
    })
  }
  const allRequiredPassed = value.findings.every((finding) =>
    finding.disposition === 'passed' || finding.disposition === 'not_applicable')
  const realInternal = value.actualCheckpointBytesObserved &&
    value.actualStrictLoadObserved && value.actualA100InferenceObserved &&
    value.actualSamRequestCount > 0 && value.checkpointSha256 !== null &&
    value.runtimeImageDigest !== null
  if (value.internalExecutionAuthorized !== (allRequiredPassed && realInternal)) {
    context.addIssue({
      code: 'custom', message: 'SAM 3.1 internal authority exceeds actual gates.',
    })
  }
  if (value.productionExecutionAuthorized &&
    (!value.internalExecutionAuthorized ||
      value.routeQualificationStatus !== 'production_qualified')) {
    context.addIssue({
      code: 'custom', message: 'SAM 3.1 production authority exceeds route evidence.',
    })
  }
  if (value.routeQualificationStatus === 'internal_execution_qualified' &&
    !value.internalExecutionAuthorized) context.addIssue({
    code: 'custom', message: 'SAM 3.1 route status overclaims internal execution.',
  })
  if (value.routeQualificationStatus === 'production_qualified' &&
    !value.productionExecutionAuthorized) context.addIssue({
    code: 'custom', message: 'SAM 3.1 route status overclaims production.',
  })
})

export const trackAllSam31V2RouteGateReportSchema =
  routeGateReportCoreSchema.extend({ reportHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { reportHash, ...core } = value
      if (reportHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom', message: 'SAM 3.1 route gate report hash is invalid.',
      })
    })

export type TrackAllSam31V2RouteGateReport = z.infer<
  typeof trackAllSam31V2RouteGateReportSchema
>

const canonicalEvidenceSetCoreSchema = z.object({
  schemaVersion: z.literal(
    'track_all_sam3_1_v2_canonical_route_evidence_set_v1',
  ),
  operationId: z.literal(TRACK_ALL_SAM_OPERATION_V2),
  operationAuthorityHash: z.literal(
    TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY.authorityHash,
  ),
  checkpointSha256: skillSha256Schema,
  runtimeImageDigest: prefixedSha256Schema,
  findings: z.array(gateFindingSchema.safeExtend({
    disposition: z.enum(['passed', 'not_applicable']),
    evidenceClass: z.literal('canonical_private_reread'),
    evidenceHashes: z.array(skillSha256Schema).min(1).max(20),
  }).strict()).length(TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS.length),
  actualCheckpointBytesObserved: z.literal(true),
  actualStrictLoadObserved: z.literal(true),
  actualA100InferenceObserved: z.literal(true),
  actualL4InferenceObserved: z.boolean(),
  actualSamRequestCount: z.number().int().positive().max(100),
  productionEvidenceAccepted: z.literal(false),
  rereadAt: z.string().datetime({ offset: true }),
}).strict().superRefine((value, context) => {
  const keys = value.findings.map((finding) => finding.gateKey)
  if (new Set(keys).size !== keys.length ||
    TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS.some((key) => !keys.includes(key))) {
    context.addIssue({
      code: 'custom', message: 'Canonical SAM route evidence is incomplete.',
    })
  }
  const l4 = value.findings.find((finding) =>
    finding.gateKey ===
      'l4_private_runtime_and_quality_if_fallback_active')
  if (value.actualL4InferenceObserved !== (l4?.disposition === 'passed')) {
    context.addIssue({
      code: 'custom', message: 'Canonical SAM L4 evidence is incoherent.',
    })
  }
})

export const trackAllSam31V2CanonicalRouteEvidenceSetSchema =
  canonicalEvidenceSetCoreSchema.extend({ evidenceSetHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { evidenceSetHash, ...core } = value
      if (evidenceSetHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom', message: 'Canonical SAM route evidence is stale or forged.',
      })
    })

export type TrackAllSam31V2CanonicalRouteEvidenceSet = z.infer<
  typeof trackAllSam31V2CanonicalRouteEvidenceSetSchema
>

const canonicalEvidenceRefSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,179}$/u),
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

export interface TrackAllSam31V2CanonicalRouteEvidenceReadPort {
  readonly storageClass: 'durable_private'
  readonly evidenceClass: 'canonical_private_reread'
  readExact(input: {
    reference: z.infer<typeof canonicalEvidenceRefSchema>
  }): Promise<unknown>
}

/**
 * Compiles a runnable route gate only from a separately persisted and reread
 * canonical evidence set. The generated Track All route receipt remains an
 * additional mandatory gate, so this function cannot promote runtime by
 * itself.
 */
export async function createTrackAllSam31V2RouteGateReportFromCanonicalEvidence(
  input: {
    reference: unknown
    readPort: TrackAllSam31V2CanonicalRouteEvidenceReadPort
  },
): Promise<TrackAllSam31V2RouteGateReport> {
  if (input.readPort.storageClass !== 'durable_private' ||
    input.readPort.evidenceClass !== 'canonical_private_reread') {
    throw new Error('SAM route evidence requires a durable canonical reader.')
  }
  const reference = canonicalEvidenceRefSchema.parse(input.reference)
  const evidence = trackAllSam31V2CanonicalRouteEvidenceSetSchema.parse(
    await input.readPort.readExact({ reference }),
  )
  if (reference.contentHash !== `sha256:${evidence.evidenceSetHash}`) {
    throw new Error('SAM route evidence reread differs from its exact reference.')
  }
  const candidate = createCanonicalSam31SourceRuntimeCandidate()
  const core = routeGateReportCoreSchema.parse({
    schemaVersion: TRACK_ALL_SAM31_V2_ROUTE_GATE_REPORT_VERSION,
    operationId: TRACK_ALL_SAM_OPERATION_V2,
    historicalOperationId: CANONICAL_SAM3_1_OPERATION_ID,
    operationAuthorityHash: evidence.operationAuthorityHash,
    sourceCandidateHash: candidate.candidateHash,
    sourceRevision: candidate.officialSource.sourceRevision,
    sourceArchiveSha256:
      candidate.officialSource.deterministicGitArchiveSha256,
    checkpointRevision: candidate.officialCheckpoint.repositoryRevision,
    checkpointSha256: evidence.checkpointSha256,
    runtimeImageDigest: evidence.runtimeImageDigest,
    findings: evidence.findings,
    planningAuthorityValid: true,
    actualCheckpointBytesObserved: true,
    actualStrictLoadObserved: true,
    actualA100InferenceObserved: true,
    actualL4InferenceObserved: evidence.actualL4InferenceObserved,
    actualSamRequestCount: evidence.actualSamRequestCount,
    routeQualificationStatus: 'internal_execution_qualified',
    internalExecutionAuthorized: true,
    productionExecutionAuthorized: false,
    injectedEvidenceMaySatisfyRealSamGate: false,
    generatedAt: evidence.rereadAt,
  })
  return deepFreezeSkillValue(trackAllSam31V2RouteGateReportSchema.parse({
    ...core,
    reportHash: hashSkillValue(core),
  }))
}

/**
 * Derives the current route truth only from the repository's canonical source
 * candidate. Private/gated evidence is intentionally not represented here,
 * because none was available to reread in this environment.
 */
export function createCurrentTrackAllSam31V2RouteGateReport(input?: {
  generatedAt?: string
  l4FallbackActive?: boolean
}): TrackAllSam31V2RouteGateReport {
  const candidate = createCanonicalSam31SourceRuntimeCandidate()
  const sourceEvidence = [
    candidate.candidateHash,
    candidate.officialSource.deterministicGitArchiveSha256,
    TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY.authorityHash,
  ]
  const blocked = (gateKey: (typeof TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS)[number],
    reason: string) => ({
    gateKey,
    disposition: 'blocked' as const,
    evidenceClass: 'missing_external_evidence' as const,
    evidenceHashes: [] as string[],
    reason,
  })
  const findings: z.input<typeof gateFindingSchema>[] = [
    blocked('human_terms_and_commercial_legal_approval',
      'The official checkpoint requires authorized human terms acceptance and commercial/legal approval.'),
    {
      gateKey: 'official_source_private_ingest_and_security',
      disposition: 'passed',
      evidenceClass: 'canonical_repository_authority',
      evidenceHashes: sourceEvidence,
      reason: 'The exact official source archive and pinned source facts are content-addressed in repository authority.',
    },
    blocked('official_checkpoint_private_ingest_hash_and_security',
      'No authorized checkpoint bytes, exact byte length, private hash, or security scan were available.'),
    blocked('strict_source_checkpoint_compatibility',
      'No strict-load result with zero missing and zero unexpected keys was available.'),
    blocked('offline_dependency_closure',
      'No V2 runtime dependency-closure receipt was available.'),
    blocked('immutable_signed_runtime_image',
      'No immutable signed V2 runtime image release was available.'),
    blocked('v2_session_runtime_compatibility',
      'No real V2 session-runtime compatibility receipt was available.'),
    blocked('a100_private_runtime_and_quality',
      'No real private A100 V2 decode, inference, quality, time, or cost evidence was available.'),
    input?.l4FallbackActive === false ? {
      gateKey: 'l4_private_runtime_and_quality_if_fallback_active',
      disposition: 'not_applicable',
      evidenceClass: 'canonical_repository_authority',
      evidenceHashes: [TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY.authorityHash],
      reason: 'L4 fallback is not active for this gate snapshot.',
    } : blocked('l4_private_runtime_and_quality_if_fallback_active',
      'L4 remains a documented conditional route but has no equivalent V2 runtime or quality evidence.'),
    blocked('current_account_effective_rate_authority',
      'No current account-effective V2 GPU rate authority was reread.'),
    blocked('private_output_and_privacy_quality',
      'No real private masklet output and privacy-quality evidence was available.'),
  ]
  const core = routeGateReportCoreSchema.parse({
    schemaVersion: TRACK_ALL_SAM31_V2_ROUTE_GATE_REPORT_VERSION,
    operationId: TRACK_ALL_SAM_OPERATION_V2,
    historicalOperationId: CANONICAL_SAM3_1_OPERATION_ID,
    operationAuthorityHash:
      TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY.authorityHash,
    sourceCandidateHash: candidate.candidateHash,
    sourceRevision: candidate.officialSource.sourceRevision,
    sourceArchiveSha256:
      candidate.officialSource.deterministicGitArchiveSha256,
    checkpointRevision: candidate.officialCheckpoint.repositoryRevision,
    checkpointSha256: candidate.officialCheckpoint.exactDownloadedSha256,
    runtimeImageDigest: null,
    findings,
    planningAuthorityValid: true,
    actualCheckpointBytesObserved: false,
    actualStrictLoadObserved: false,
    actualA100InferenceObserved: false,
    actualL4InferenceObserved: false,
    actualSamRequestCount: 0,
    routeQualificationStatus: 'blocked',
    internalExecutionAuthorized: false,
    productionExecutionAuthorized: false,
    injectedEvidenceMaySatisfyRealSamGate: false,
    generatedAt: input?.generatedAt ?? new Date().toISOString(),
  })
  return deepFreezeSkillValue(trackAllSam31V2RouteGateReportSchema.parse({
    ...core,
    reportHash: hashSkillValue(core),
  }))
}
