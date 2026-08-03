import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import type { VisualIntelligenceEvidenceRef } from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_ID,
  CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_REVISION,
  createCanonicalFasterWhisperLargeV3ModelArtifactSource,
} from '../model-artifacts/canonical-faster-whisper-large-v3-model-artifact-source'

export const CANONICAL_A100_BATCH_RELEASE_OBSERVATION_VERSION =
  'canonical-a100-batch-release-observation-v1' as const
export const CANONICAL_A100_BATCH_INVOCATION_RESULT_VERSION =
  'canonical-a100-batch-invocation-result-v1' as const

const PROJECT_ID = 'reeditpro' as const
const PROFILE_ID =
  'quality_a100_80gb_user_triggered_heavy_job_v1' as const
const OPERATION_ID =
  'internal.source_transcript.transcribe_complete_audio_timeline.v2' as const
const MODEL_COST_PROFILE_ID =
  'faster_whisper_large_v3_source_transcription_v2' as const
const SERVICE_ACCOUNT_EMAIL =
  'reeditpro-source-transcript-a100@reeditpro.iam.gserviceaccount.com' as const
const INVOCATION_ENVIRONMENT_NAME =
  'REEDITPRO_SOURCE_TRANSCRIPT_A100_INVOCATION_ID' as const
const LIFECYCLE_BUCKET_ENVIRONMENT_NAME =
  'REEDITPRO_SOURCE_TRANSCRIPT_A100_LIFECYCLE_BUCKET' as const
const RELEASE_DIGEST_ENVIRONMENT_NAME =
  'REEDITPRO_SOURCE_TRANSCRIPT_A100_RELEASE_DIGEST_SHA256' as const
const RUNTIME_REGION_ENVIRONMENT_NAME =
  'REEDITPRO_SOURCE_TRANSCRIPT_A100_RUNTIME_REGION' as const
const BATCH_API_ROOT = 'https://batch.googleapis.com/v1' as const

const REGION_ZONES = {
  'us-central1': ['us-central1-a', 'us-central1-c'],
  'europe-west4': ['europe-west4-a'],
} as const

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SAFE_RELEASE_NAME = /^[a-z][a-z0-9-]{0,62}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u
const SAFE_GCS_BUCKET = /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u
const SAFE_IMAGE =
  /^(us-central1|europe-west4)-docker\.pkg\.dev\/reeditpro\/[a-z0-9._-]+\/[a-z0-9._-]+@sha256:[a-f0-9]{64}$/u
const SAFE_TEMPLATE =
  /^projects\/reeditpro\/global\/instanceTemplates\/[a-z][a-z0-9-]{0,62}$/u
const SAFE_JOB_RESOURCE =
  /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/[a-z][a-z0-9-]{0,62}$/u
const SAFE_UID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const DURATION = /^(0|[1-9][0-9]{0,9})(\.[0-9]{1,9})?s$/u

const safeId = z.string().regex(SAFE_ID).refine((value) =>
  !value.includes('..'))
const prefixedSha256 = z.string().regex(PREFIXED_SHA256)
const region = z.enum(['us-central1', 'europe-west4'])
const evidenceRef = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const releaseWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_BATCH_RELEASE_OBSERVATION_VERSION,
  ),
  releaseRef: evidenceRef,
  projectId: z.literal(PROJECT_ID),
  runtimeRegion: region,
  allowedZones: z.array(z.string().regex(
    /^(us-central1-[ac]|europe-west4-a)$/u,
  )).min(1).max(2),
  batchInstanceTemplateResource: z.string().regex(SAFE_TEMPLATE),
  batchInstanceTemplateRef: evidenceRef,
  serviceAccountEmail: z.literal(SERVICE_ACCOUNT_EMAIL),
  runtimeImageUri: z.string().regex(SAFE_IMAGE),
  runtimeImageDigestSha256: prefixedSha256,
  runtimeImageRef: evidenceRef,
  cudaRuntimeRef: evidenceRef,
  cudaRuntimeVersion: z.literal('12.3.2-cudnn9'),
  gpuDriverRuntimeRef: evidenceRef,
  gpuDriverVersion: z.string().regex(/^[0-9]{3}\.[0-9]{2,3}(?:\.[0-9]{2})?$/u),
  modelArtifactImageRef: evidenceRef,
  modelArtifactImageDigestSha256: prefixedSha256,
  modelManifestRef: evidenceRef,
  modelId: z.literal(CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_ID),
  modelRevision: z.literal(
    CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_REVISION,
  ),
  modelSourceDigestSha256: prefixedSha256,
  modelDigestSha256: prefixedSha256,
  runtimeQualificationEvidenceRef: evidenceRef,
  modelArtifactQualificationEvidenceRef: evidenceRef,
  instanceTemplateQualificationEvidenceRef: evidenceRef,
  privateSecurityReviewRef: evidenceRef,
  privateLicenseReviewRef: evidenceRef,
  operationId: z.literal(OPERATION_ID),
  profileId: z.literal(PROFILE_ID),
  modelCostProfileId: z.literal(MODEL_COST_PROFILE_ID),
  lifecycleBucketName: z.string().regex(SAFE_GCS_BUCKET),
  privateArtifactBucketName: z.string().regex(SAFE_GCS_BUCKET),
  maximumExecutionSeconds: z.number().int().min(60).max(3_600),
  machineType: z.literal('a2-ultragpu-1g'),
  acceleratorClass: z.literal('nvidia_a100_80gb'),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(12),
  allocatedMemoryGiB: z.literal(170),
  allocatedLocalScratchGiB: z.literal(375),
  localScratchDeviceName: z.literal('reeditpro-a100-scratch'),
  localScratchMountPath: z.literal('/mnt/disks/reeditpro-a100-scratch'),
  taskCount: z.literal(1),
  taskParallelism: z.literal(1),
  maximumTaskRetries: z.literal(0),
  minimumIdleJobCount: z.literal(0),
  userTriggeredScaleToZero: z.literal(true),
  prebuiltGpuDriverAndCudaRuntimeRequired: z.literal(true),
  immutableRuntimeImageRequired: z.literal(true),
  immutableModelManifestRequired: z.literal(true),
  jobTimeDriverDownloadAllowed: z.literal(false),
  jobTimeModelDownloadAllowed: z.literal(false),
  externalIpAllowed: z.literal(false),
  privateNetworkOnly: z.literal(true),
  exactSourceGenerationRereadRequired: z.literal(true),
  createRequestMayBeRetriedAfterUnknownOutcome: z.literal(false),
  platformFundedPreplanningAnalysisOnly: z.literal(true),
  customerCreditMutationAllowed: z.literal(false),
  systemFailureChargedToCustomer: z.literal(false),
  privateInternalQualified: z.literal(true),
  productionQualified: z.literal(false),
}).strict().superRefine((value, context) => {
  const expectedZones = REGION_ZONES[value.runtimeRegion]
  const imageDigest = value.runtimeImageUri.match(/@sha256:([a-f0-9]{64})$/u)?.[1]
  const expectedImagePrefix = `${value.runtimeRegion}-docker.pkg.dev/reeditpro/`
  if (
    value.allowedZones.length !== expectedZones.length
    || value.allowedZones.some((zone, index) => zone !== expectedZones[index])
    || !value.runtimeImageUri.startsWith(expectedImagePrefix)
    || value.runtimeImageDigestSha256 !== `sha256:${imageDigest ?? ''}`
    || value.runtimeImageRef.contentHash !== value.runtimeImageDigestSha256
    || value.modelArtifactImageRef.contentHash !==
      value.modelArtifactImageDigestSha256
    || value.modelManifestRef.contentHash !== value.modelDigestSha256
    || value.modelSourceDigestSha256 !==
      createCanonicalFasterWhisperLargeV3ModelArtifactSource()
        .sourceDigestSha256
    || value.lifecycleBucketName === value.privateArtifactBucketName
  ) context.addIssue({
    code: 'custom',
    message: 'The A100 release lost exact region, image, or private-store lineage.',
  })
})

const releaseSchema = releaseWithoutDigestSchema.extend({
  observationDigestSha256: prefixedSha256,
}).strict()

export type CanonicalA100BatchReleaseObservation = z.infer<
  typeof releaseSchema
>

export interface CanonicalA100BatchJobInvocationPort {
  runOnce(input: {
    readonly invocationId: string
    readonly release: CanonicalA100BatchReleaseObservation
    readonly durableDispatchConsumptionRef:
      VisualIntelligenceEvidenceRef
    readonly durableDispatchConsumptionRereadVerified: true
  }): Promise<CanonicalA100BatchInvocationResult>
  reconcileExisting(input: {
    readonly invocationId: string
    readonly release: CanonicalA100BatchReleaseObservation
    readonly durableDispatchConsumptionRef:
      VisualIntelligenceEvidenceRef
    readonly durableDispatchConsumptionRereadVerified: true
  }): Promise<CanonicalA100BatchInvocationResult>
}

export interface CanonicalA100BatchInvocationResult {
  readonly schemaVersion:
    typeof CANONICAL_A100_BATCH_INVOCATION_RESULT_VERSION
  readonly invocationId: string
  readonly jobId: string
  readonly requestId: string
  readonly jobResourceName: string
  readonly jobUid: string
  readonly terminalState: 'SUCCEEDED' | 'FAILED'
  readonly runDuration: string | null
  readonly observedStateSequence: readonly BatchJobState[]
  readonly createRequestDigestSha256: string
  readonly resultDigestSha256: string
  readonly releaseRef: VisualIntelligenceEvidenceRef
  readonly releaseObservationDigestSha256: string
  readonly durableDispatchConsumptionRef:
    VisualIntelligenceEvidenceRef
  readonly durableDispatchConsumptionRereadVerified: true
  readonly profileId: typeof PROFILE_ID
  readonly operationId: typeof OPERATION_ID
  readonly machineType: 'a2-ultragpu-1g'
  readonly acceleratorClass: 'nvidia_a100_80gb'
  readonly taskCount: 1
  readonly taskParallelism: 1
  readonly maximumTaskRetries: 0
  readonly callerPayloadContainsOnlyInvocationId: true
  readonly runtimeImageAndModelPinnedBeforeExecution: true
  readonly serverOwnedFixedRuntimeEnvironmentBound: true
  readonly runtimeDownloadAllowed: false
  readonly customerCreditMutated: false
  readonly retryAfterUnknownCreateOutcomeAllowed: false
}

type BatchJobState =
  | 'QUEUED'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'

const batchJobStateSchema = z.enum([
  'QUEUED',
  'SCHEDULED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
])
const invocationResultSchema = z.object({
  schemaVersion: z.literal(CANONICAL_A100_BATCH_INVOCATION_RESULT_VERSION),
  invocationId: safeId,
  jobId: z.string().regex(SAFE_RELEASE_NAME),
  requestId: z.string().uuid(),
  jobResourceName: z.string().regex(SAFE_JOB_RESOURCE),
  jobUid: z.string().regex(SAFE_UID),
  terminalState: z.enum(['SUCCEEDED', 'FAILED']),
  runDuration: z.string().regex(DURATION).nullable(),
  observedStateSequence: z.array(batchJobStateSchema).min(1).max(8),
  createRequestDigestSha256: prefixedSha256,
  resultDigestSha256: prefixedSha256,
  releaseRef: evidenceRef,
  releaseObservationDigestSha256: prefixedSha256,
  durableDispatchConsumptionRef: evidenceRef,
  durableDispatchConsumptionRereadVerified: z.literal(true),
  profileId: z.literal(PROFILE_ID),
  operationId: z.literal(OPERATION_ID),
  machineType: z.literal('a2-ultragpu-1g'),
  acceleratorClass: z.literal('nvidia_a100_80gb'),
  taskCount: z.literal(1),
  taskParallelism: z.literal(1),
  maximumTaskRetries: z.literal(0),
  callerPayloadContainsOnlyInvocationId: z.literal(true),
  runtimeImageAndModelPinnedBeforeExecution: z.literal(true),
  serverOwnedFixedRuntimeEnvironmentBound: z.literal(true),
  runtimeDownloadAllowed: z.literal(false),
  customerCreditMutated: z.literal(false),
  retryAfterUnknownCreateOutcomeAllowed: z.literal(false),
}).strict().superRefine((value, context) => {
  if (
    value.observedStateSequence[value.observedStateSequence.length - 1] !==
      value.terminalState
    || (value.terminalState === 'SUCCEEDED' && value.runDuration === null)
  ) context.addIssue({
    code: 'custom',
    message: 'A100 Batch terminal result lost exact state or duration.',
  })
})

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export function createCanonicalA100BatchReleaseObservation(input: {
  readonly releaseRef: VisualIntelligenceEvidenceRef
  readonly runtimeRegion: 'us-central1' | 'europe-west4'
  readonly batchInstanceTemplateResource: string
  readonly batchInstanceTemplateRef:
    VisualIntelligenceEvidenceRef
  readonly runtimeImageUri: string
  readonly runtimeImageRef: VisualIntelligenceEvidenceRef
  readonly cudaRuntimeRef: VisualIntelligenceEvidenceRef
  readonly gpuDriverRuntimeRef:
    VisualIntelligenceEvidenceRef
  readonly gpuDriverVersion: string
  readonly modelArtifactImageRef:
    VisualIntelligenceEvidenceRef
  readonly modelManifestRef:
    VisualIntelligenceEvidenceRef
  readonly modelDigestSha256: string
  readonly runtimeQualificationEvidenceRef:
    VisualIntelligenceEvidenceRef
  readonly modelArtifactQualificationEvidenceRef:
    VisualIntelligenceEvidenceRef
  readonly instanceTemplateQualificationEvidenceRef:
    VisualIntelligenceEvidenceRef
  readonly privateSecurityReviewRef:
    VisualIntelligenceEvidenceRef
  readonly privateLicenseReviewRef:
    VisualIntelligenceEvidenceRef
  readonly lifecycleBucketName: string
  readonly privateArtifactBucketName: string
  readonly maximumExecutionSeconds: number
}): CanonicalA100BatchReleaseObservation {
  assertClosedPlainData(input, 'a100_batch_release_input')
  const digest = input.runtimeImageUri.match(/@sha256:([a-f0-9]{64})$/u)?.[1]
  const draft = releaseWithoutDigestSchema.parse({
    schemaVersion: CANONICAL_A100_BATCH_RELEASE_OBSERVATION_VERSION,
    releaseRef: input.releaseRef,
    projectId: PROJECT_ID,
    runtimeRegion: input.runtimeRegion,
    allowedZones: [...REGION_ZONES[input.runtimeRegion]],
    batchInstanceTemplateResource: input.batchInstanceTemplateResource,
    batchInstanceTemplateRef: input.batchInstanceTemplateRef,
    serviceAccountEmail: SERVICE_ACCOUNT_EMAIL,
    runtimeImageUri: input.runtimeImageUri,
    runtimeImageDigestSha256: `sha256:${digest ?? ''}`,
    runtimeImageRef: input.runtimeImageRef,
    cudaRuntimeRef: input.cudaRuntimeRef,
    cudaRuntimeVersion: '12.3.2-cudnn9',
    gpuDriverRuntimeRef: input.gpuDriverRuntimeRef,
    gpuDriverVersion: input.gpuDriverVersion,
    modelArtifactImageRef: input.modelArtifactImageRef,
    modelArtifactImageDigestSha256:
      input.modelArtifactImageRef.contentHash,
    modelManifestRef: input.modelManifestRef,
    modelId: CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_ID,
    modelRevision: CANONICAL_FASTER_WHISPER_LARGE_V3_MODEL_REVISION,
    modelSourceDigestSha256:
      createCanonicalFasterWhisperLargeV3ModelArtifactSource()
        .sourceDigestSha256,
    modelDigestSha256: input.modelDigestSha256,
    runtimeQualificationEvidenceRef:
      input.runtimeQualificationEvidenceRef,
    modelArtifactQualificationEvidenceRef:
      input.modelArtifactQualificationEvidenceRef,
    instanceTemplateQualificationEvidenceRef:
      input.instanceTemplateQualificationEvidenceRef,
    privateSecurityReviewRef: input.privateSecurityReviewRef,
    privateLicenseReviewRef: input.privateLicenseReviewRef,
    operationId: OPERATION_ID,
    profileId: PROFILE_ID,
    modelCostProfileId: MODEL_COST_PROFILE_ID,
    lifecycleBucketName: input.lifecycleBucketName,
    privateArtifactBucketName: input.privateArtifactBucketName,
    maximumExecutionSeconds: input.maximumExecutionSeconds,
    machineType: 'a2-ultragpu-1g',
    acceleratorClass: 'nvidia_a100_80gb',
    allocatedGpuCount: 1,
    allocatedVcpuCount: 12,
    allocatedMemoryGiB: 170,
    allocatedLocalScratchGiB: 375,
    localScratchDeviceName: 'reeditpro-a100-scratch',
    localScratchMountPath: '/mnt/disks/reeditpro-a100-scratch',
    taskCount: 1,
    taskParallelism: 1,
    maximumTaskRetries: 0,
    minimumIdleJobCount: 0,
    userTriggeredScaleToZero: true,
    prebuiltGpuDriverAndCudaRuntimeRequired: true,
    immutableRuntimeImageRequired: true,
    immutableModelManifestRequired: true,
    jobTimeDriverDownloadAllowed: false,
    jobTimeModelDownloadAllowed: false,
    externalIpAllowed: false,
    privateNetworkOnly: true,
    exactSourceGenerationRereadRequired: true,
    createRequestMayBeRetriedAfterUnknownOutcome: false,
    platformFundedPreplanningAnalysisOnly: true,
    customerCreditMutationAllowed: false,
    systemFailureChargedToCustomer: false,
    privateInternalQualified: true,
    productionQualified: false,
  })
  return releaseSchema.parse({
    ...draft,
    observationDigestSha256: prefixedDigest(draft),
  })
}

export function assertCanonicalA100BatchReleaseObservation(
  untrusted: unknown,
): CanonicalA100BatchReleaseObservation {
  assertClosedPlainData(untrusted, 'a100_batch_release_observation')
  const release = releaseSchema.parse(untrusted)
  const draft = { ...release }
  Reflect.deleteProperty(draft, 'observationDigestSha256')
  if (release.observationDigestSha256 !== prefixedDigest(draft)) {
    throw conflict('a100_batch_release_observation_digest')
  }
  return structuredClone(release)
}

export function assertCanonicalA100BatchInvocationResult(input: {
  readonly untrusted: unknown
  readonly invocationId: string
  readonly release: CanonicalA100BatchReleaseObservation
  readonly durableDispatchConsumptionRef:
    VisualIntelligenceEvidenceRef
}): CanonicalA100BatchInvocationResult {
  assertClosedPlainData(input.untrusted, 'a100_batch_invocation_result')
  const result = invocationResultSchema.parse(input.untrusted)
  const digestInput = { ...result }
  Reflect.deleteProperty(digestInput, 'resultDigestSha256')
  const prepared = prepareInvocation({
    invocationId: input.invocationId,
    release: input.release,
    durableDispatchConsumptionRef: input.durableDispatchConsumptionRef,
    durableDispatchConsumptionRereadVerified: true,
  })
  const expectedDigest = prefixedDigest({
    url: prepared.collectionUrl,
    params: { jobId: prepared.jobId, requestId: prepared.requestId },
    body: prepared.createBody,
  })
  if (
    result.invocationId !== input.invocationId
    || result.jobId !== prepared.jobId
    || result.requestId !== prepared.requestId
    || result.jobResourceName !== prepared.expectedResource
    || result.createRequestDigestSha256 !== expectedDigest
    || result.resultDigestSha256 !== prefixedDigest(digestInput)
    || result.releaseObservationDigestSha256 !==
      prepared.release.observationDigestSha256
    || !sameEvidenceRef(result.releaseRef, prepared.release.releaseRef)
    || !sameEvidenceRef(
      result.durableDispatchConsumptionRef,
      input.durableDispatchConsumptionRef,
    )
  ) throw conflict('a100_batch_invocation_result_lineage')
  return structuredClone(result) as CanonicalA100BatchInvocationResult
}

export function createGoogleBatchA100JobInvocationPort(input: {
  readonly auth?: GoogleAuthRequest
  readonly pollMilliseconds?: number
  readonly sleep?: (milliseconds: number) => Promise<void>
} = {}): CanonicalA100BatchJobInvocationPort {
  const auth = input.auth ?? new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const pollMilliseconds = input.pollMilliseconds ?? 2_000
  const sleep = input.sleep ?? delay
  if (!Number.isInteger(pollMilliseconds) || pollMilliseconds < 1) {
    throw new Error('A100 Batch polling interval must be a positive integer.')
  }
  return Object.freeze({
    async runOnce(request: Parameters<
      CanonicalA100BatchJobInvocationPort['runOnce']
    >[0]) {
      const prepared = prepareInvocation(request)
      let createdJob: unknown
      try {
        createdJob = (await auth.request({
          url: prepared.collectionUrl,
          method: 'POST',
          timeout: 30_000,
          maxRedirects: 0,
          retry: false,
          params: {
            jobId: prepared.jobId,
            requestId: prepared.requestId,
          },
          data: prepared.createBody,
        })).data
      } catch (error) {
        throw unknownOutcome('a100_batch_create_outcome_unknown', error)
      }
      const terminal = await pollBatchJob({
        auth,
        initial: createdJob,
        expectedResource: prepared.expectedResource,
        maximumExecutionSeconds: prepared.release.maximumExecutionSeconds,
        pollMilliseconds,
        sleep,
      })
      return buildInvocationResult(prepared, terminal)
    },
    async reconcileExisting(request: Parameters<
      CanonicalA100BatchJobInvocationPort['reconcileExisting']
    >[0]) {
      const prepared = prepareInvocation(request)
      let existing: unknown
      try {
        existing = (await auth.request({
          url: `${BATCH_API_ROOT}/${prepared.expectedResource}`,
          method: 'GET',
          timeout: 30_000,
          maxRedirects: 0,
          retry: false,
        })).data
      } catch (error) {
        throw unknownOutcome('a100_batch_reconciliation_read_unknown', error)
      }
      const terminal = await pollBatchJob({
        auth,
        initial: existing,
        expectedResource: prepared.expectedResource,
        maximumExecutionSeconds: prepared.release.maximumExecutionSeconds,
        pollMilliseconds,
        sleep,
      })
      return buildInvocationResult(prepared, terminal)
    },
  })
}

function prepareInvocation(request: Parameters<
  CanonicalA100BatchJobInvocationPort['runOnce']
>[0]) {
  assertClosedPlainData(request, 'a100_batch_invocation_request')
  if (!SAFE_ID.test(request.invocationId) || request.invocationId.includes('..')) {
    throw conflict('a100_batch_invocation_id')
  }
  const consumptionRef = evidenceRef.parse(
    request.durableDispatchConsumptionRef,
  )
  if (!request.durableDispatchConsumptionRereadVerified) {
    throw conflict('a100_batch_dispatch_consumption_reread')
  }
  const release = assertCanonicalA100BatchReleaseObservation(request.release)
  const jobId = deterministicJobId(
    request.invocationId,
    release,
    consumptionRef,
  )
  const requestId = deterministicRequestId(
    request.invocationId,
    release,
    consumptionRef,
  )
  const createBody = createBatchJobBody({
    invocationId: request.invocationId,
    jobId,
    release,
  })
  const collectionUrl = `${BATCH_API_ROOT}/projects/${PROJECT_ID}/locations/`
    + `${release.runtimeRegion}/jobs`
  return {
    invocationId: request.invocationId,
    release,
    consumptionRef,
    jobId,
    requestId,
    createBody,
    collectionUrl,
    expectedResource: `projects/${PROJECT_ID}/locations/`
      + `${release.runtimeRegion}/jobs/${jobId}`,
  }
}

async function pollBatchJob(input: {
  auth: GoogleAuthRequest
  initial: unknown
  expectedResource: string
  maximumExecutionSeconds: number
  pollMilliseconds: number
  sleep: (milliseconds: number) => Promise<void>
}) {
  let current = parseBatchJob(input.initial, input.expectedResource)
  const states: BatchJobState[] = [current.state]
  const deadline = Date.now()
    + (input.maximumExecutionSeconds + 120) * 1_000
  while (current.state !== 'SUCCEEDED' && current.state !== 'FAILED') {
    if (Date.now() >= deadline) {
      throw unknownOutcome('a100_batch_terminal_state_timeout')
    }
    await input.sleep(input.pollMilliseconds)
    let untrusted: unknown
    try {
      untrusted = (await input.auth.request({
        url: `${BATCH_API_ROOT}/${input.expectedResource}`,
        method: 'GET',
        timeout: 30_000,
        maxRedirects: 0,
        retry: false,
      })).data
    } catch (error) {
      throw unknownOutcome('a100_batch_poll_outcome_unknown', error)
    }
    current = parseBatchJob(untrusted, input.expectedResource, current.uid)
    if (states[states.length - 1] !== current.state) states.push(current.state)
  }
  return { current, states }
}

function buildInvocationResult(
  prepared: ReturnType<typeof prepareInvocation>,
  terminal: Awaited<ReturnType<typeof pollBatchJob>>,
): CanonicalA100BatchInvocationResult {
  const draft = {
    schemaVersion: CANONICAL_A100_BATCH_INVOCATION_RESULT_VERSION,
    invocationId: prepared.invocationId,
    jobId: prepared.jobId,
    requestId: prepared.requestId,
    jobResourceName: prepared.expectedResource,
    jobUid: terminal.current.uid,
    terminalState: terminal.current.state as 'SUCCEEDED' | 'FAILED',
    runDuration: terminal.current.runDuration,
    observedStateSequence: Object.freeze([...terminal.states]),
    createRequestDigestSha256: prefixedDigest({
      url: prepared.collectionUrl,
      params: {
        jobId: prepared.jobId,
        requestId: prepared.requestId,
      },
      body: prepared.createBody,
    }),
    releaseRef: structuredClone(prepared.release.releaseRef),
    releaseObservationDigestSha256:
      prepared.release.observationDigestSha256,
    durableDispatchConsumptionRef:
      structuredClone(prepared.consumptionRef),
    durableDispatchConsumptionRereadVerified: true,
    profileId: PROFILE_ID,
    operationId: OPERATION_ID,
    machineType: 'a2-ultragpu-1g',
    acceleratorClass: 'nvidia_a100_80gb',
    taskCount: 1,
    taskParallelism: 1,
    maximumTaskRetries: 0,
    callerPayloadContainsOnlyInvocationId: true,
    runtimeImageAndModelPinnedBeforeExecution: true,
    serverOwnedFixedRuntimeEnvironmentBound: true,
    runtimeDownloadAllowed: false,
    customerCreditMutated: false,
    retryAfterUnknownCreateOutcomeAllowed: false,
  } as const
  return Object.freeze(invocationResultSchema.parse({
    ...draft,
    resultDigestSha256: prefixedDigest(draft),
  })) as CanonicalA100BatchInvocationResult
}

function createBatchJobBody(input: {
  invocationId: string
  jobId: string
  release: CanonicalA100BatchReleaseObservation
}): Record<string, unknown> {
  const release = input.release
  return {
    priority: '99',
    labels: {
      'reeditpro-operation': 'source-transcript',
      'reeditpro-profile': 'quality-a100-80gb',
      'reeditpro-invocation': rawDigest(input.invocationId).slice(0, 32),
    },
    taskGroups: [{
      taskCount: '1',
      parallelism: '1',
      runAsNonRoot: true,
      taskSpec: {
        runnables: [{
          container: { imageUri: release.runtimeImageUri },
          ignoreExitStatus: false,
          background: false,
          alwaysRun: false,
        }],
        computeResource: {
          cpuMilli: '12000',
          memoryMib: String(170 * 1_024),
        },
        maxRunDuration: `${release.maximumExecutionSeconds}s`,
        maxRetryCount: 0,
        volumes: [{
          deviceName: release.localScratchDeviceName,
          mountPath: release.localScratchMountPath,
          mountOptions: 'rw,async',
        }],
        environment: {
          variables: {
            [INVOCATION_ENVIRONMENT_NAME]: input.invocationId,
            [LIFECYCLE_BUCKET_ENVIRONMENT_NAME]:
              release.lifecycleBucketName,
            [RELEASE_DIGEST_ENVIRONMENT_NAME]:
              release.observationDigestSha256,
            [RUNTIME_REGION_ENVIRONMENT_NAME]: release.runtimeRegion,
          },
        },
      },
    }],
    allocationPolicy: {
      location: {
        allowedLocations: release.allowedZones.map((zone) => `zones/${zone}`),
      },
      instances: [{
        instanceTemplate: release.batchInstanceTemplateResource,
        installGpuDrivers: false,
        installOpsAgent: false,
        blockProjectSshKeys: true,
      }],
      serviceAccount: { email: release.serviceAccountEmail },
    },
    logsPolicy: { destination: 'CLOUD_LOGGING' },
  }
}

function deterministicJobId(
  invocationId: string,
  release: CanonicalA100BatchReleaseObservation,
  consumptionRef: VisualIntelligenceEvidenceRef,
): string {
  const value = `rp-src-tx-a100-${rawDigest({
    invocationId,
    releaseDigest: release.observationDigestSha256,
    consumptionRef,
  }).slice(0, 32)}`
  if (!SAFE_RELEASE_NAME.test(value)) throw conflict('a100_batch_job_id')
  return value
}

function deterministicRequestId(
  invocationId: string,
  release: CanonicalA100BatchReleaseObservation,
  consumptionRef: VisualIntelligenceEvidenceRef,
): string {
  const bytes = Buffer.from(rawDigest({
    invocationId,
    releaseDigest: release.observationDigestSha256,
    consumptionRef,
    purpose: 'google_batch_create_request_deduplication_only',
  }).slice(0, 32), 'hex')
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`
    + `-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function parseBatchJob(
  untrusted: unknown,
  expectedResource: string,
  expectedUid?: string,
): {
  name: string
  uid: string
  state: BatchJobState
  runDuration: string | null
} {
  assertClosedPlainData(untrusted, 'a100_batch_job_response')
  const record = untrusted as Record<string, unknown>
  const status = record.status as Record<string, unknown> | undefined
  const name = record.name
  const uid = record.uid
  const state = status?.state
  const runDuration = status?.runDuration
  const knownState = state === 'QUEUED'
    || state === 'SCHEDULED'
    || state === 'RUNNING'
    || state === 'SUCCEEDED'
    || state === 'FAILED'
  if (
    typeof name !== 'string'
    || !SAFE_JOB_RESOURCE.test(name)
    || name !== expectedResource
    || typeof uid !== 'string'
    || !SAFE_UID.test(uid)
    || (expectedUid !== undefined && uid !== expectedUid)
    || !knownState
    || (runDuration !== undefined && (
      typeof runDuration !== 'string' || !DURATION.test(runDuration)
    ))
    || (state === 'SUCCEEDED' && typeof runDuration !== 'string')
  ) throw conflict('a100_batch_job_response_lineage')
  return {
    name,
    uid,
    state,
    runDuration: typeof runDuration === 'string' ? runDuration : null,
  }
}

function assertClosedPlainData(
  value: unknown,
  requiredGate: string,
  seen = new Set<object>(),
): void {
  if (value === null || typeof value !== 'object') return
  if (seen.has(value)) throw conflict(`${requiredGate}_cycle`)
  if (Object.getPrototypeOf(value) !== Object.prototype
    && !Array.isArray(value)) throw conflict(`${requiredGate}_prototype`)
  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw conflict(`${requiredGate}_symbol`)
  }
  seen.add(value)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  for (const key of Object.keys(descriptors)) {
    if (Array.isArray(value) && key === 'length') continue
    const descriptor = descriptors[key]
    if (!descriptor.enumerable || !('value' in descriptor)) {
      throw conflict(`${requiredGate}_accessor_or_hidden`)
    }
    if (typeof descriptor.value === 'number'
      && !Number.isFinite(descriptor.value)) {
      throw conflict(`${requiredGate}_non_finite`)
    }
    if (typeof descriptor.value === 'function'
      || typeof descriptor.value === 'symbol'
      || typeof descriptor.value === 'bigint'
      || descriptor.value === undefined) {
      throw conflict(`${requiredGate}_non_json`)
    }
    assertClosedPlainData(descriptor.value, requiredGate, seen)
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(value, index)) {
        throw conflict(`${requiredGate}_sparse_array`)
      }
    }
  }
  seen.delete(value)
}

function sameEvidenceRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function rawDigest(value: unknown): string {
  return createHash('sha256').update(stableStringify(value), 'utf8')
    .digest('hex')
}

function prefixedDigest(value: unknown): string {
  return `sha256:${rawDigest(value)}`
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort(compareUtf16).map((key) =>
      `${JSON.stringify(key)}:${stableStringify(record[key])}`
    ).join(',')}}`
  }
  return JSON.stringify(value)
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The A100 Batch invocation crossed immutable release or job authority.',
    409,
    { requiredGate },
  )
}

function unknownOutcome(requiredGate: string, cause?: unknown): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'The A100 Batch attempt outcome is unknown and must be reconciled before any retry or fallback.',
    503,
    { requiredGate, retryAllowed: false, fallbackAllowed: false },
    { cause },
  )
}
