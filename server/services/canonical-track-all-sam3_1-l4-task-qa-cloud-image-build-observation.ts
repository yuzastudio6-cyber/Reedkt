import { z } from 'zod'

import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
  compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
  canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_RECONCILIATION_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-reconciliation-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_TERMINAL_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-terminal-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const BUILD_COLLECTION = `projects/${PROJECT_ID}/locations/${REGION}/builds`
const LIST_ENDPOINT =
  `https://cloudbuild.googleapis.com/v1/${BUILD_COLLECTION}?pageSize=100&filter=tags%3Dtrack-all-l4-task-qa%20AND%20tags%3Dprivate-image-build`
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const buildStatusSchema = z.enum([
  'STATUS_UNKNOWN', 'PENDING', 'QUEUED', 'WORKING', 'SUCCESS', 'FAILURE',
  'INTERNAL_ERROR', 'TIMEOUT', 'CANCELLED', 'EXPIRED',
])

const reconciliationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_RECONCILIATION_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_reconciliation_owner',
  ),
  disposition: z.enum(['not_found', 'matched_exact_build', 'ambiguous']),
  reconciliationId: safeId,
  reconciliationVersion: z.literal(1),
  operationId: z.literal('tool.kornia.refine_mask.v1'),
  authorityRef: evidenceRefSchema,
  submissionRef: evidenceRefSchema,
  buildRequestHash: rawSha256,
  cloudBuildId: z.string().uuid().nullable(),
  cloudBuildResource: safeId.nullable(),
  cloudBuildStatus: buildStatusSchema.nullable(),
  cloudBuildCreateTime: timestamp.nullable(),
  exactFixedRequestEchoVerified: z.boolean(),
  exactStorageGenerationProvenanceVerified: z.boolean(),
  matchingBuildCount: z.number().int().min(0).max(100),
  originalProviderOutcomeUnknown: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  imageBuildKnownStarted: z.boolean(),
  imagePushKnownCompleted: z.literal(false),
  immutableImageDigestKnown: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const matched = value.disposition === 'matched_exact_build'
  if (matched
    ? value.matchingBuildCount !== 1
      || !value.cloudBuildId
      || value.cloudBuildResource !==
        `${BUILD_COLLECTION}/${value.cloudBuildId}`
      || !value.cloudBuildStatus
      || !value.cloudBuildCreateTime
      || !value.exactFixedRequestEchoVerified
      || !value.exactStorageGenerationProvenanceVerified
      || !value.imageBuildKnownStarted
    : value.cloudBuildId !== null
      || value.cloudBuildResource !== null
      || value.cloudBuildStatus !== null
      || value.cloudBuildCreateTime !== null
      || value.exactFixedRequestEchoVerified
      || value.exactStorageGenerationProvenanceVerified
      || value.imageBuildKnownStarted
      || (value.disposition === 'not_found'
        ? value.matchingBuildCount !== 0
        : value.matchingBuildCount < 2)) context.addIssue({
    code: 'custom',
    message: 'Track All L4 build reconciliation truth changed.',
  })
})

export const canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationSchema =
  reconciliationWithoutHashSchema.extend({
    reconciliationHash: rawSha256,
  }).strict()
export type CanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation =
  z.infer<
    typeof canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationSchema
  >

const terminalWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_TERMINAL_VERSION,
  ),
  source: z.literal(
    'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_terminal_owner',
  ),
  disposition: z.enum([
    'pending', 'image_built_pending_supply_chain_release', 'terminal_failure',
    'outcome_unknown',
  ]),
  terminalId: safeId,
  terminalVersion: z.literal(1),
  operationId: z.literal('tool.kornia.refine_mask.v1'),
  authorityRef: evidenceRefSchema,
  submissionRef: evidenceRefSchema,
  reconciliationRef: evidenceRefSchema,
  cloudBuildId: z.string().uuid(),
  cloudBuildResource: safeId,
  cloudBuildStatus: buildStatusSchema,
  cloudBuildCreateTime: timestamp,
  cloudBuildStartTime: timestamp.nullable(),
  cloudBuildFinishTime: timestamp.nullable(),
  exactFixedRequestEchoVerified: z.literal(true),
  exactStorageGenerationProvenanceVerified: z.literal(true),
  verifiedBuildRequested: z.literal(true),
  warningsAbsent: z.boolean(),
  taggedImageUri: z.string().regex(
    /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-track-all-l4-task-qa:track-all-l4-qa-[a-f0-9]{16}$/u,
  ),
  immutableImageDigest: prefixedSha256.nullable(),
  immutableImageUri: z.string().nullable(),
  imageBuiltAndPushed: z.boolean(),
  cloudBuildFailureType: z.enum([
    'FETCH_SOURCE_FAILED', 'BUILD_STEP_FAILED', 'PUSH_FAILED',
    'PROVIDER_REPORTED_FAILURE',
  ]).nullable(),
  cloudBuildFailureReason: z.enum([
    'source_fetch_missing_expected_dockerfile_path',
    'provider_reported_failure',
  ]).nullable(),
  buildStepExecutionKnownStarted: z.boolean(),
  billableGpuExecutionKnownStarted: z.literal(false),
  spdxSbomReread: z.literal(false),
  artifactAnalysisScanPassed: z.literal(false),
  kmsSignatureVerified: z.literal(false),
  slsaProvenanceVerified: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const success =
    value.disposition === 'image_built_pending_supply_chain_release'
  const pending = value.disposition === 'pending'
  const failed = value.disposition === 'terminal_failure'
  if (value.cloudBuildResource !== `${BUILD_COLLECTION}/${value.cloudBuildId}`
    || (success
      ? value.cloudBuildStatus !== 'SUCCESS'
        || !value.cloudBuildStartTime
        || !value.cloudBuildFinishTime
        || !value.warningsAbsent
        || !value.immutableImageDigest
        || value.immutableImageUri !==
          `${value.taggedImageUri.split(':')[0]}@${value.immutableImageDigest}`
        || !value.imageBuiltAndPushed
      : value.immutableImageDigest !== null
        || value.immutableImageUri !== null
        || value.imageBuiltAndPushed)
    || (failed
      ? !value.cloudBuildFailureType || !value.cloudBuildFailureReason
      : value.cloudBuildFailureType !== null
        || value.cloudBuildFailureReason !== null)
    || (pending && !['PENDING', 'QUEUED', 'WORKING'].includes(
      value.cloudBuildStatus,
    ))) context.addIssue({
    code: 'custom',
    message: 'Track All L4 image build terminal truth changed.',
  })
})

export const canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalSchema =
  terminalWithoutHashSchema.extend({ terminalHash: rawSha256 }).strict()
export type CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalSchema
>

export interface CanonicalTrackAllSam31L4TaskQaBuildObservationReadPort {
  rereadBuildAuthority(input: {
    readonly authorityRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority | null>
  rereadSubmission(input: {
    readonly submissionRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission | null>
  rereadReconciliation(input: {
    readonly reconciliationRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation | null>
}

export interface CanonicalTrackAllSam31L4TaskQaCloudBuildReadTransport {
  request(input: {
    readonly method: 'GET'
    readonly url: string
  }): Promise<{ readonly status: number, readonly json: unknown }>
}

export function createCanonicalTrackAllSam31L4TaskQaCloudImageBuildObserver(
  input: {
    readonly readPort: CanonicalTrackAllSam31L4TaskQaBuildObservationReadPort
    readonly transport: CanonicalTrackAllSam31L4TaskQaCloudBuildReadTransport
    readonly now?: () => string
  },
) {
  return Object.freeze({
    async reconcileUnknownSubmission(value: {
      readonly reconciliationId: string
      readonly submissionRef: z.infer<typeof evidenceRefSchema>
    }) {
      const observedAt = input.now?.() ?? new Date().toISOString()
      const submission =
        assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission(
          await input.readPort.rereadSubmission({
            submissionRef: value.submissionRef,
          }),
        )
      if (submission.disposition !== 'outcome_unknown'
        || submission.providerOutcome !== 'unknown'
        || submission.cloudBuildId !== null
        || submission.buildRequestHash === null
        || !sameRef(
          value.submissionRef,
          canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(
            submission,
          ),
        )) throw new Error('Track All L4 submission is not reconcilable.')
      const authority = rereadAuthority(
        await input.readPort.rereadBuildAuthority({
          authorityRef: submission.authorityRef,
        }),
        submission.authorityRef,
      )
      const response = await input.transport.request({
        method: 'GET',
        url: LIST_ENDPOINT,
      })
      if (response.status !== 200) {
        throw new Error('Track All L4 build list reread failed.')
      }
      const builds = parseBuildList(response.json)
      const matches = builds.filter((build) =>
        exactBuildEchoMatches(build, authority, submission.observedAt))
      const matched = matches.length === 1 ? matches[0] : null
      return buildReconciliation({
        reconciliationId: value.reconciliationId,
        disposition: matched
          ? 'matched_exact_build'
          : matches.length === 0 ? 'not_found' : 'ambiguous',
        authorityRef: submission.authorityRef,
        submissionRef: value.submissionRef,
        buildRequestHash: submission.buildRequestHash,
        cloudBuildId: matched?.id ?? null,
        cloudBuildResource: matched
          ? `${BUILD_COLLECTION}/${matched.id}` : null,
        cloudBuildStatus: matched?.status ?? null,
        cloudBuildCreateTime: matched?.createTime ?? null,
        exactFixedRequestEchoVerified: matched !== null,
        exactStorageGenerationProvenanceVerified: matched !== null,
        matchingBuildCount: matches.length,
        imageBuildKnownStarted: matched !== null,
        observedAt,
      })
    },

    async observeTerminal(value: {
      readonly terminalId: string
      readonly reconciliationRef: z.infer<typeof evidenceRefSchema>
    }) {
      const observedAt = input.now?.() ?? new Date().toISOString()
      const reconciliation =
        assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation(
          await input.readPort.rereadReconciliation({
            reconciliationRef: value.reconciliationRef,
          }),
        )
      if (reconciliation.disposition !== 'matched_exact_build'
        || !reconciliation.cloudBuildId
        || !sameRef(
          value.reconciliationRef,
          canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationRef(
            reconciliation,
          ),
        )) throw new Error('Track All L4 reconciliation is not exact.')
      const authority = rereadAuthority(
        await input.readPort.rereadBuildAuthority({
          authorityRef: reconciliation.authorityRef,
        }),
        reconciliation.authorityRef,
      )
      const url =
        `https://cloudbuild.googleapis.com/v1/${BUILD_COLLECTION}/${reconciliation.cloudBuildId}`
      const response = await input.transport.request({ method: 'GET', url })
      if (response.status !== 200) {
        throw new Error('Track All L4 build terminal reread failed.')
      }
      const build = parseBuild(response.json)
      if (build.id !== reconciliation.cloudBuildId
        || !exactBuildEchoMatches(build, authority, '1970-01-01T00:00:00Z')) {
        throw new Error('Track All L4 terminal build changed.')
      }
      const success = build.status === 'SUCCESS'
      const pending = ['PENDING', 'QUEUED', 'WORKING'].includes(build.status)
      const digest = success ? exactImageDigest(build, authority) : null
      const failure = terminalFailure(build)
      return buildTerminal({
        terminalId: value.terminalId,
        disposition: success
          ? 'image_built_pending_supply_chain_release'
          : pending ? 'pending'
            : build.status === 'STATUS_UNKNOWN'
              ? 'outcome_unknown' : 'terminal_failure',
        authorityRef: reconciliation.authorityRef,
        submissionRef: reconciliation.submissionRef,
        reconciliationRef: value.reconciliationRef,
        cloudBuildId: build.id,
        cloudBuildResource: `${BUILD_COLLECTION}/${build.id}`,
        cloudBuildStatus: build.status,
        cloudBuildCreateTime: build.createTime,
        cloudBuildStartTime: build.startTime ?? null,
        cloudBuildFinishTime: build.finishTime ?? null,
        warningsAbsent: build.warnings.length === 0,
        taggedImageUri: authority.imageDestination.taggedUri,
        immutableImageDigest: digest,
        immutableImageUri: digest
          ? `${authority.imageDestination.repository}/${authority.imageDestination.imageName}@${digest}`
          : null,
        imageBuiltAndPushed: digest !== null,
        cloudBuildFailureType: failure?.type ?? null,
        cloudBuildFailureReason: failure?.reason ?? null,
        buildStepExecutionKnownStarted: build.steps.some((step) =>
          step.status !== undefined && step.status !== 'QUEUED'),
        billableGpuExecutionKnownStarted: false,
        observedAt,
      })
    },
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation {
  assertClosedJson(value, 'track_all_l4_build_reconciliation')
  const parsed =
    canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationSchema.parse(
      value,
    )
  const { reconciliationHash, ...payload } = parsed
  if (reconciliationHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 reconciliation hash invalid.')
  }
  return parsed
}

export function assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal {
  assertClosedJson(value, 'track_all_l4_build_terminal')
  const parsed =
    canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalSchema.parse(value)
  const { terminalHash, ...payload } = parsed
  if (terminalHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 build terminal hash invalid.')
  }
  return parsed
}

export function canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationRef(
  value: unknown,
) {
  const record =
    assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation(value)
  return evidenceRefSchema.parse({
    id: record.reconciliationId,
    version: record.reconciliationVersion,
    contentHash: `sha256:${record.reconciliationHash}`,
  })
}

export function canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef(
  value: unknown,
) {
  const record = assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal(
    value,
  )
  return evidenceRefSchema.parse({
    id: record.terminalId,
    version: record.terminalVersion,
    contentHash: `sha256:${record.terminalHash}`,
  })
}

function buildReconciliation(input: Omit<
  z.input<typeof reconciliationWithoutHashSchema>,
  | 'schemaVersion' | 'source' | 'reconciliationVersion' | 'operationId'
  | 'originalProviderOutcomeUnknown' | 'automaticRetryAllowed'
  | 'imagePushKnownCompleted' | 'immutableImageDigestKnown'
  | 'runtimeReleaseGranted' | 'gpuJobDispatched' | 'customerCreditsMutated'
  | 'productionReady'
>) {
  const payload = reconciliationWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_RECONCILIATION_VERSION,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_reconciliation_owner',
    reconciliationVersion: 1,
    operationId: 'tool.kornia.refine_mask.v1',
    originalProviderOutcomeUnknown: true,
    automaticRetryAllowed: false,
    imagePushKnownCompleted: false,
    immutableImageDigestKnown: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    productionReady: false,
    ...input,
  })
  return canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationSchema
    .parse({
      ...payload,
      reconciliationHash: sha256AuthorityValue(payload),
    })
}

function buildTerminal(input: Omit<
  z.input<typeof terminalWithoutHashSchema>,
  | 'schemaVersion' | 'source' | 'terminalVersion' | 'operationId'
  | 'exactFixedRequestEchoVerified'
  | 'exactStorageGenerationProvenanceVerified' | 'verifiedBuildRequested'
  | 'spdxSbomReread' | 'artifactAnalysisScanPassed'
  | 'kmsSignatureVerified' | 'slsaProvenanceVerified'
  | 'runtimeReleaseGranted' | 'gpuJobDispatched' | 'customerCreditsMutated'
  | 'qaApproved' | 'productionReady'
>) {
  const payload = terminalWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_TERMINAL_VERSION,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_terminal_owner',
    terminalVersion: 1,
    operationId: 'tool.kornia.refine_mask.v1',
    exactFixedRequestEchoVerified: true,
    exactStorageGenerationProvenanceVerified: true,
    verifiedBuildRequested: true,
    spdxSbomReread: false,
    artifactAnalysisScanPassed: false,
    kmsSignatureVerified: false,
    slsaProvenanceVerified: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    qaApproved: false,
    productionReady: false,
    ...input,
  })
  return canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

function rereadAuthority(
  value: unknown,
  ref: z.infer<typeof evidenceRefSchema>,
): CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority {
  const authority =
    assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(value)
  if (authority.evidenceClass !== 'canonical_private_reread'
    || authority.status !== 'authorized_for_private_cloud_build'
    || !authority.authority.cloudImageBuildAuthorized
    || ref.id !== authority.authorityId
    || ref.version !== authority.authorityVersion
    || ref.contentHash !== `sha256:${authority.authorityHash}`) {
    throw new Error('Track All L4 build authority reread mismatch.')
  }
  return authority
}

type ParsedBuild = ReturnType<typeof parseBuild>

function parseBuildList(value: unknown): readonly ParsedBuild[] {
  assertClosedJson(value, 'track_all_l4_cloud_build_list')
  const root = z.object({
    builds: z.array(z.unknown()).max(100).default([]),
  }).passthrough().parse(value)
  return root.builds.map(parseBuild)
}

function parseBuild(value: unknown) {
  const schema = z.object({
    id: z.string().uuid(),
    status: buildStatusSchema,
    createTime: timestamp,
    startTime: timestamp.optional(),
    finishTime: timestamp.optional(),
    source: z.unknown(),
    sourceProvenance: z.unknown(),
    steps: z.array(z.object({
      status: buildStatusSchema.optional(),
    }).passthrough()).max(100),
    images: z.unknown(),
    artifacts: z.unknown(),
    timeout: z.unknown(),
    queueTtl: z.unknown(),
    serviceAccount: z.unknown(),
    options: z.unknown(),
    tags: z.unknown(),
    results: z.unknown().optional(),
    warnings: z.array(z.unknown()).max(100).default([]),
    failureInfo: z.object({
      type: z.string().trim().min(1).max(128),
      detail: z.string().trim().min(1).max(2_000),
    }).passthrough().optional(),
  }).passthrough().parse(value)
  return schema
}

function terminalFailure(build: ParsedBuild): {
  readonly type:
    | 'FETCH_SOURCE_FAILED' | 'BUILD_STEP_FAILED' | 'PUSH_FAILED'
    | 'PROVIDER_REPORTED_FAILURE'
  readonly reason:
    | 'source_fetch_missing_expected_dockerfile_path'
    | 'provider_reported_failure'
} | null {
  if (!['FAILURE', 'INTERNAL_ERROR', 'TIMEOUT', 'CANCELLED', 'EXPIRED']
    .includes(build.status)) return null
  const missingDockerfile = build.failureInfo?.type === 'FETCH_SOURCE_FAILED'
    && build.failureInfo.detail.includes(
      'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate',
    )
    && build.failureInfo.detail.includes('no such file or directory')
  if (missingDockerfile) return {
    type: 'FETCH_SOURCE_FAILED',
    reason: 'source_fetch_missing_expected_dockerfile_path',
  }
  const type = ['FETCH_SOURCE_FAILED', 'BUILD_STEP_FAILED', 'PUSH_FAILED']
    .includes(build.failureInfo?.type ?? '')
    ? build.failureInfo?.type as
      'FETCH_SOURCE_FAILED' | 'BUILD_STEP_FAILED' | 'PUSH_FAILED'
    : 'PROVIDER_REPORTED_FAILURE'
  return { type, reason: 'provider_reported_failure' }
}

function exactBuildEchoMatches(
  build: ParsedBuild,
  authority: CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
  earliestCreateTime: string,
): boolean {
  if (Date.parse(build.createTime) < Date.parse(earliestCreateTime)) return false
  const expected = compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest(
    authority,
  ).body as Record<string, unknown>
  return sameJson(build.source, expected.source)
    && sameCloudBuildSteps(build.steps, expected.steps)
    && sameJson(build.images, expected.images)
    && sameJson(build.artifacts, { images: expected.images })
    && build.timeout === expected.timeout
    && build.queueTtl === expected.queueTtl
    && build.serviceAccount === expected.serviceAccount
    && sameCloudBuildOptions(build.options, expected.options)
    && sameJson(build.tags, expected.tags)
    && sameJson(
      (build.sourceProvenance as { resolvedStorageSource?: unknown } | null)
        ?.resolvedStorageSource,
      (expected.source as { storageSource?: unknown } | null)?.storageSource,
    )
}

function sameCloudBuildSteps(observed: unknown, expected: unknown): boolean {
  const observedSteps = z.array(z.object({
    name: z.unknown(),
    entrypoint: z.unknown(),
    args: z.unknown(),
  }).passthrough()).max(100).safeParse(observed)
  const expectedSteps = z.array(z.object({
    name: z.unknown(),
    entrypoint: z.unknown(),
    args: z.unknown(),
  }).strict()).max(100).safeParse(expected)
  if (!observedSteps.success || !expectedSteps.success) return false
  return sameJson(observedSteps.data.map((step) => ({
    name: step.name,
    entrypoint: step.entrypoint,
    args: step.args,
  })), expectedSteps.data)
}

function sameCloudBuildOptions(observed: unknown, expected: unknown): boolean {
  const observedOptions = z.object({
    machineType: z.unknown(),
    diskSizeGb: z.unknown(),
    logging: z.unknown(),
    requestedVerifyOption: z.unknown(),
    sourceProvenanceHash: z.unknown(),
  }).passthrough().safeParse(observed)
  const expectedOptions = z.object({
    machineType: z.unknown(),
    diskSizeGb: z.unknown(),
    logging: z.unknown(),
    requestedVerifyOption: z.unknown(),
    sourceProvenanceHash: z.unknown(),
  }).strict().safeParse(expected)
  if (!observedOptions.success || !expectedOptions.success) return false
  return sameJson({
    machineType: observedOptions.data.machineType,
    diskSizeGb: observedOptions.data.diskSizeGb,
    logging: observedOptions.data.logging,
    requestedVerifyOption: observedOptions.data.requestedVerifyOption,
    sourceProvenanceHash: observedOptions.data.sourceProvenanceHash,
  }, expectedOptions.data)
}

function exactImageDigest(
  build: ParsedBuild,
  authority: CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
): `sha256:${string}` {
  const images = z.object({
    images: z.array(z.object({
      name: z.string(),
      digest: prefixedSha256,
    }).passthrough()).min(1).max(10),
  }).passthrough().parse(build.results).images
  const matches = images.filter((image) =>
    image.name === authority.imageDestination.taggedUri)
  if (matches.length !== 1) {
    throw new Error('Track All L4 immutable image result is ambiguous.')
  }
  return matches[0].digest as `sha256:${string}`
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sameJson(left: unknown, right: unknown): boolean {
  try {
    return stableAuthorityStringify(left) === stableAuthorityStringify(right)
  } catch {
    return false
  }
}

function assertClosedJson(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (current: unknown, depth: number): void => {
    if (depth > 32) throw new Error(`${label}_depth`)
    if (current === null || ['string', 'boolean'].includes(typeof current)) {
      return
    }
    if (typeof current === 'number') {
      if (!Number.isFinite(current)) throw new Error(`${label}_number`)
      return
    }
    if (typeof current !== 'object') throw new Error(`${label}_not_json`)
    if (seen.has(current)) throw new Error(`${label}_cyclic`)
    seen.add(current)
    if (Array.isArray(current)) {
      if (current.length > 10_000
        || Object.keys(current).length !== current.length) {
        throw new Error(`${label}_array`)
      }
      for (let index = 0; index < current.length; index += 1) {
        visit(current[index], depth + 1)
      }
    } else {
      if (Object.getPrototypeOf(current) !== Object.prototype
        || Reflect.ownKeys(current).length > 10_000) {
        throw new Error(`${label}_object`)
      }
      for (const key of Reflect.ownKeys(current)) {
        if (typeof key !== 'string') throw new Error(`${label}_symbol`)
        const descriptor = Object.getOwnPropertyDescriptor(current, key)
        if (!descriptor || descriptor.get || descriptor.set
          || !descriptor.enumerable) throw new Error(`${label}_property`)
        visit(descriptor.value, depth + 1)
      }
    }
    seen.delete(current)
  }
  visit(value, 0)
}

export const canonicalTrackAllSam31L4TaskQaCloudBuildListEndpoint =
  LIST_ENDPOINT
