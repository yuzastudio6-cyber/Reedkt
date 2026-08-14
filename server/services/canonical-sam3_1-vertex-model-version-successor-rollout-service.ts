import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalSam31VertexScaleZeroDeploymentProfile,
  type CanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31VertexModelVersionSuccessorRequest,
  CANONICAL_SAM3_1_VERTEX_PREVIOUS_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_SUCCESSOR_ALIAS,
  CANONICAL_SAM3_1_VERTEX_SUCCESSOR_API_ORIGIN,
  CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_SUCCESSOR_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_SUCCESSOR_MODEL_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_SUCCESSOR_SERVICE_ACCOUNT,
  createCanonicalSam31VertexModelVersionSuccessorDeployRequest,
  createCanonicalSam31VertexModelVersionSuccessorUploadRequest,
  createCanonicalSam31VertexPreviousDeploymentUndeployRequest,
  type CanonicalSam31VertexModelVersionSuccessorRequest,
} from './canonical-sam3_1-vertex-model-version-successor-request-compiler'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_MODEL_VERSION_SUCCESSOR_ROLLOUT_VERSION =
  'canonical-sam3_1-vertex-model-version-successor-rollout-v1' as const

const SOURCE =
  'canonical_backend_sam3_1_vertex_model_version_successor_rollout_owner' as const
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-successor-rollout'
const PROJECT_NUMBER = '390722338345' as const
const OLD_IMAGE =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@sha256:b8ac1fe762564f7debf30f4045b68a25f508ce202f758d4c1be7e483fe8aa1c8' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const stage = z.enum([
  'model_version_upload',
  'model_version_deploy',
  'previous_deployed_model_undeploy',
])
type Stage = z.infer<typeof stage>
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const operationName = z.string().regex(
  /^projects\/(?:reeditpro|390722338345)\/locations\/us-central1\/(?:models\/weeditpro-sam31-a100-scale-zero-v1\/)?operations\/[A-Za-z0-9_-]{1,160}$/u,
)
const modelVersionResource = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/models\/weeditpro-sam31-a100-scale-zero-v1@[1-9][0-9]*$/u,
)
const refSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u),
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
type Ref = z.infer<typeof refSchema>

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam3_1-vertex-model-version-successor-consumption-v1',
  ),
  source: z.literal(SOURCE),
  stage,
  profileHash: sha256,
  requestDigestSha256: sha256,
  consumedAt: timestamp,
  createOnly: z.literal(true),
  providerPostMayStartOnlyAfterThisRecord: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  customerRequestOrGpuInferenceStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: sha256,
}).strict()
type Consumption = z.infer<typeof consumptionSchema>

const submissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam3_1-vertex-model-version-successor-submission-v1',
  ),
  source: z.literal(SOURCE),
  stage,
  requestDigestSha256: sha256,
  disposition: z.enum([
    'submitted',
    'outcome_unknown_requires_reconciliation',
  ]),
  providerCallStarted: z.literal(true),
  providerOutcome: z.enum(['executed', 'unknown']),
  operationName: operationName.nullable(),
  submittedAt: timestamp,
  automaticRetryAllowed: z.literal(false),
  customerRequestOrGpuInferenceStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const submitted = value.disposition === 'submitted'
  if (
    submitted !== (value.providerOutcome === 'executed')
    || submitted !== (value.operationName !== null)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 successor submission outcome changed.',
  })
})
const submissionSchema = submissionWithoutHashSchema.extend({
  submissionHash: sha256,
}).strict()
type Submission = z.infer<typeof submissionSchema>

const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam3_1-vertex-model-version-successor-observation-v1',
  ),
  source: z.literal(SOURCE),
  stage,
  requestDigestSha256: sha256,
  submissionHash: sha256,
  operationName: operationName.nullable(),
  disposition: z.enum(['pending', 'completed', 'terminal_failure']),
  operationDone: z.boolean(),
  modelVersionResourceName: modelVersionResource.nullable(),
  deployedModelId: z.literal(
    CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID,
  ).nullable(),
  previousDeployedModelAbsent: z.boolean(),
  providerErrorRef: z.object({
    code: z.number().int().nonnegative().safe(),
    messageDigestSha256: sha256,
  }).strict().nullable(),
  observationMode: z.enum([
    'exact_operation_and_resource_reread',
    'exact_resource_reconciliation',
  ]),
  exactOperationReread: z.boolean(),
  exactModelAndEndpointReread: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  customerRequestOrGpuInferenceStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const completed = value.disposition === 'completed'
  const failed = value.disposition === 'terminal_failure'
  const pending = value.disposition === 'pending'
  const exactStageResult = value.stage === 'model_version_upload'
    ? value.modelVersionResourceName !== null
      && value.deployedModelId === null
      && !value.previousDeployedModelAbsent
    : value.stage === 'model_version_deploy'
      ? value.modelVersionResourceName !== null
        && value.deployedModelId ===
          CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID
        && !value.previousDeployedModelAbsent
      : value.modelVersionResourceName !== null
        && value.deployedModelId ===
          CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID
        && value.previousDeployedModelAbsent
  if (
    failed !== (value.providerErrorRef !== null)
    || pending !== !value.operationDone
    || (completed && !exactStageResult)
    || (!completed && (
      value.modelVersionResourceName !== null
      || value.deployedModelId !== null
      || value.previousDeployedModelAbsent
    ))
    || (value.observationMode ===
      'exact_operation_and_resource_reread' && (
      value.operationName === null || !value.exactOperationReread
    ))
    || (value.observationMode === 'exact_resource_reconciliation' && (
      value.operationName !== null || value.exactOperationReread || !completed
    ))
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 successor observation changed.',
  })
})
const observationSchema = observationWithoutHashSchema.extend({
  observationHash: sha256,
}).strict()
type Observation = z.infer<typeof observationSchema>

export interface CanonicalSam31VertexModelVersionSuccessorStageResult {
  readonly stage: Stage
  readonly disposition: 'completed' | 'pending' | 'terminal_failure'
    | 'outcome_unknown_requires_reconciliation'
  readonly requestRef: Ref
  readonly consumptionRef: Ref
  readonly submissionRef: Ref
  readonly observationRef: Ref | null
  readonly observation: Observation | null
  readonly providerPostIssuedThisRun: boolean
  readonly automaticRetryAllowed: false
}

export interface CanonicalSam31VertexModelVersionSuccessorRolloutResult {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_VERTEX_MODEL_VERSION_SUCCESSOR_ROLLOUT_VERSION
  readonly disposition: 'rolled_out' | 'pending' | 'terminal_failure'
    | 'outcome_unknown_requires_reconciliation'
  readonly profileRef: Ref
  readonly modelVersionResourceName: string | null
  readonly deployedModelId: typeof CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID
    | null
  readonly previousDeployedModelId:
    typeof CANONICAL_SAM3_1_VERTEX_PREVIOUS_DEPLOYED_MODEL_ID
  readonly previousModelVersionRetainedForRollback: true
  readonly previousDeployedModelRemovedAfterCutover: boolean
  readonly stages:
    readonly CanonicalSam31VertexModelVersionSuccessorStageResult[]
  readonly durableConsumptionBeforeEveryProviderPost: true
  readonly exactSequentialStageOrder: true
  readonly automaticRetryAllowed: false
  readonly customerRequestOrGpuInferenceStarted: false
  readonly walletOrCreditMutationAuthorityGranted: false
  readonly publicDeliveryAuthorityGranted: false
  readonly productionAuthorityGranted: false
}

type AuthRequest = Pick<GoogleAuth, 'request'>

export function createCanonicalSam31VertexModelVersionSuccessorRolloutOwner(
  input: {
    readonly auth?: AuthRequest
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
    readonly now?: () => string
    readonly sleep?: (milliseconds: number) => Promise<void>
    readonly pollIntervalMilliseconds?: number
    readonly maximumWaitMilliseconds?: number
    readonly timeoutMilliseconds?: number
  },
) {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw new Error('SAM 3.1 successor durable store is absent.')
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const now = input.now ?? (() => new Date().toISOString())
  const sleep = input.sleep ?? ((milliseconds: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, milliseconds)))
  const pollInterval = input.pollIntervalMilliseconds ?? 10_000
  const maximumWait = input.maximumWaitMilliseconds ?? 60 * 60_000
  const timeout = input.timeoutMilliseconds ?? 30_000
  if (
    !Number.isInteger(pollInterval) || pollInterval < 250
    || pollInterval > 60_000 || !Number.isInteger(maximumWait)
    || maximumWait < pollInterval || maximumWait > 90 * 60_000
    || !Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000
  ) throw new Error('SAM 3.1 successor rollout timing policy changed.')

  return Object.freeze({
    async rolloutOne(
      value: CanonicalSam31VertexScaleZeroDeploymentProfile,
    ): Promise<CanonicalSam31VertexModelVersionSuccessorRolloutResult> {
      const profile = assertCanonicalSam31VertexScaleZeroDeploymentProfile(
        value,
      )
      const profileRef = await persistProfile(profile)
      const stages: CanonicalSam31VertexModelVersionSuccessorStageResult[] = []

      const upload = await executeStage(
        profile,
        createCanonicalSam31VertexModelVersionSuccessorUploadRequest(profile),
      )
      stages.push(upload)
      if (upload.disposition !== 'completed') {
        return rolloutResult(upload.disposition, profileRef, stages, null)
      }
      const modelVersion = upload.observation?.modelVersionResourceName
      if (!modelVersion) {
        throw new Error('Completed SAM 3.1 upload lacks exact model version.')
      }

      const deploy = await executeStage(
        profile,
        createCanonicalSam31VertexModelVersionSuccessorDeployRequest({
          profile,
          modelVersionResourceName: modelVersion,
        }),
      )
      stages.push(deploy)
      if (deploy.disposition !== 'completed') {
        return rolloutResult(deploy.disposition, profileRef, stages,
          modelVersion)
      }

      const undeploy = await executeStage(
        profile,
        createCanonicalSam31VertexPreviousDeploymentUndeployRequest(profile),
      )
      stages.push(undeploy)
      return rolloutResult(
        undeploy.disposition === 'completed'
          ? 'rolled_out'
          : undeploy.disposition,
        profileRef,
        stages,
        modelVersion,
      )
    },
  })

  async function executeStage(
    profile: CanonicalSam31VertexScaleZeroDeploymentProfile,
    untrustedRequest: CanonicalSam31VertexModelVersionSuccessorRequest,
  ): Promise<CanonicalSam31VertexModelVersionSuccessorStageResult> {
    const request = assertCanonicalSam31VertexModelVersionSuccessorRequest(
      untrustedRequest,
    )
    if (request.profileHash !== profile.profileHash) {
      throw new Error('SAM 3.1 successor request crossed profile scope.')
    }
    const requestRef = await persistRecord(
      'requests', request.requestDigestSha256, request,
      `sam31-vertex-${request.stage}-request`,
    )
    const consumedAt = timestamp.parse(now())
    const consumption = createConsumption(profile, request, consumedAt)
    const consumptionPath = pathFor(
      'consumptions', request.requestDigestSha256,
    )
    const consumptionCreated = await createOnly(
      consumptionPath,
      consumption,
    )
    const rereadConsumption = await readExact(
      consumptionPath,
      assertConsumption,
    )
    if (
      !rereadConsumption
      || rereadConsumption.consumptionHash !== consumption.consumptionHash
    ) throw new Error('SAM 3.1 successor consumption exact reread changed.')
    const consumptionRef = recordRef(
      `sam31-vertex-${request.stage}-consumption`,
      consumption.consumptionHash,
    )

    const submissionPath = pathFor(
      'submissions-by-request', request.requestDigestSha256,
    )
    let submission = await readExact(submissionPath, assertSubmission)
    let providerPostIssuedThisRun = false
    if (!submission && !consumptionCreated) {
      const waitStartedAt = Date.now()
      while (!submission && Date.now() - waitStartedAt < timeout * 2) {
        await sleep(Math.min(pollInterval, 1_000))
        submission = await readExact(submissionPath, assertSubmission)
      }
    }
    if (!submission) {
      if (consumptionCreated) {
        await exactPreflight(profile, request.stage)
        providerPostIssuedThisRun = true
        submission = await submit(request, consumedAt)
      } else {
        submission = createSubmission({
          stage: request.stage,
          requestDigestSha256: request.requestDigestSha256,
          disposition: 'outcome_unknown_requires_reconciliation',
          providerOutcome: 'unknown',
          operationName: null,
          submittedAt: rereadConsumption.consumedAt,
        })
      }
      await createOnly(submissionPath, submission)
      const rereadSubmission = await readExact(
        submissionPath,
        assertSubmission,
      )
      if (
        !rereadSubmission
        || rereadSubmission.submissionHash !== submission.submissionHash
      ) throw new Error('SAM 3.1 successor submission collision changed.')
      submission = rereadSubmission
    }
    if (
      submission.stage !== request.stage
      || submission.requestDigestSha256 !== request.requestDigestSha256
    ) throw new Error('SAM 3.1 successor submission lineage changed.')
    const submissionRef = recordRef(
      `sam31-vertex-${request.stage}-submission`,
      submission.submissionHash,
    )

    if (submission.disposition ===
      'outcome_unknown_requires_reconciliation') {
      const observation = await reconcile(profile, request, submission)
      if (!observation) return stageResult({
        stage: request.stage,
        disposition: 'outcome_unknown_requires_reconciliation',
        requestRef,
        consumptionRef,
        submissionRef,
        observation: null,
        providerPostIssuedThisRun,
      })
      return persistStageObservation({
        requestRef,
        consumptionRef,
        submissionRef,
        observation,
        providerPostIssuedThisRun,
      })
    }

    const startedAt = Date.now()
    while (true) {
      const observation = await observe(profile, request, submission)
      if (
        observation.disposition !== 'pending'
        || Date.now() - startedAt >= maximumWait
      ) return persistStageObservation({
        requestRef,
        consumptionRef,
        submissionRef,
        observation,
        providerPostIssuedThisRun,
      })
      await sleep(pollInterval)
    }
  }

  async function submit(
    request: CanonicalSam31VertexModelVersionSuccessorRequest,
    submittedAt: string,
  ): Promise<Submission> {
    try {
      const response = await auth.request({
        url: request.url,
        method: request.method,
        data: structuredClone(request.body),
        headers: { 'x-goog-user-project': 'reeditpro' },
        timeout,
        retry: false,
        maxRedirects: 0,
        responseType: 'json',
        maxContentLength: 2 * 1024 * 1024,
      })
      const operation = z.object({ name: operationName }).passthrough()
        .parse(response.data)
      return createSubmission({
        stage: request.stage,
        requestDigestSha256: request.requestDigestSha256,
        disposition: 'submitted',
        providerOutcome: 'executed',
        operationName: operation.name,
        submittedAt,
      })
    } catch {
      return createSubmission({
        stage: request.stage,
        requestDigestSha256: request.requestDigestSha256,
        disposition: 'outcome_unknown_requires_reconciliation',
        providerOutcome: 'unknown',
        operationName: null,
        submittedAt,
      })
    }
  }

  async function observe(
    profile: CanonicalSam31VertexScaleZeroDeploymentProfile,
    request: CanonicalSam31VertexModelVersionSuccessorRequest,
    submission: Submission,
  ): Promise<Observation> {
    if (!submission.operationName) {
      throw new Error('SAM 3.1 successor operation is absent.')
    }
    const response = await auth.request({
      url:
        `${CANONICAL_SAM3_1_VERTEX_SUCCESSOR_API_ORIGIN}/v1beta1/${submission.operationName}`,
      method: 'GET',
      headers: { 'x-goog-user-project': 'reeditpro' },
      timeout,
      retry: false,
      maxRedirects: 0,
      responseType: 'json',
      maxContentLength: 2 * 1024 * 1024,
    })
    const operation = z.object({
      name: z.literal(submission.operationName),
      done: z.boolean().optional(),
      error: z.object({
        code: z.number().int().nonnegative().safe(),
        message: z.string().min(1).max(16_384),
      }).passthrough().optional(),
    }).passthrough().parse(response.data)
    if (operation.done !== true) {
      return createObservation({
        request,
        submission,
        disposition: 'pending',
        operationDone: false,
        modelVersionResourceName: null,
        deployedModelId: null,
        previousDeployedModelAbsent: false,
        providerErrorRef: null,
        observationMode: 'exact_operation_and_resource_reread',
        exactOperationReread: true,
        observedAt: timestamp.parse(now()),
      })
    }
    if (operation.error) {
      return createObservation({
        request,
        submission,
        disposition: 'terminal_failure',
        operationDone: true,
        modelVersionResourceName: null,
        deployedModelId: null,
        previousDeployedModelAbsent: false,
        providerErrorRef: {
          code: operation.error.code,
          messageDigestSha256: sha256AuthorityValue(
            operation.error.message,
          ),
        },
        observationMode: 'exact_operation_and_resource_reread',
        exactOperationReread: true,
        observedAt: timestamp.parse(now()),
      })
    }
    const exact = await exactStageResourceResult(profile, request.stage)
    if (!exact) {
      return createObservation({
        request,
        submission,
        disposition: 'pending',
        operationDone: false,
        modelVersionResourceName: null,
        deployedModelId: null,
        previousDeployedModelAbsent: false,
        providerErrorRef: null,
        observationMode: 'exact_operation_and_resource_reread',
        exactOperationReread: true,
        observedAt: timestamp.parse(now()),
      })
    }
    return createObservation({
      request,
      submission,
      disposition: 'completed',
      operationDone: true,
      ...exact,
      providerErrorRef: null,
      observationMode: 'exact_operation_and_resource_reread',
      exactOperationReread: true,
      observedAt: timestamp.parse(now()),
    })
  }

  async function reconcile(
    profile: CanonicalSam31VertexScaleZeroDeploymentProfile,
    request: CanonicalSam31VertexModelVersionSuccessorRequest,
    submission: Submission,
  ): Promise<Observation | null> {
    const exact = await exactStageResourceResult(profile, request.stage)
    if (!exact) return null
    return createObservation({
      request,
      submission,
      disposition: 'completed',
      operationDone: true,
      ...exact,
      providerErrorRef: null,
      observationMode: 'exact_resource_reconciliation',
      exactOperationReread: false,
      observedAt: timestamp.parse(now()),
    })
  }

  async function exactStageResourceResult(
    profile: CanonicalSam31VertexScaleZeroDeploymentProfile,
    currentStage: Stage,
  ) {
    const version = await readCandidateVersion(profile, true)
    if (!version) return null
    if (currentStage === 'model_version_upload') return {
      modelVersionResourceName: version.resource,
      deployedModelId: null,
      previousDeployedModelAbsent: false,
    } as const
    const endpoint = await readEndpoint()
    const newDeployment = endpoint.deployedModels.find((item) =>
      item.id === CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID)
    if (
      !newDeployment
      || newDeployment.modelVersionId !== version.versionId
      || !exactDeployment(newDeployment)
      || endpoint.trafficSplit[
        CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID
      ] !== 100
      || Object.keys(endpoint.trafficSplit).length !== 1
    ) return null
    const previousAbsent = !endpoint.deployedModels.some((item) =>
      item.id === CANONICAL_SAM3_1_VERTEX_PREVIOUS_DEPLOYED_MODEL_ID)
    if (
      currentStage === 'previous_deployed_model_undeploy'
      && (!previousAbsent || endpoint.deployedModels.length !== 1)
    ) return null
    if (
      currentStage === 'model_version_deploy'
      && previousAbsent
    ) {
      // A restart may observe the completed undeploy before it rereads deploy.
      // The exact new version and sole traffic owner still prove deploy success.
    }
    return {
      modelVersionResourceName: version.resource,
      deployedModelId:
        CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID,
      previousDeployedModelAbsent: currentStage ===
        'previous_deployed_model_undeploy' ? true : false,
    } as const
  }

  async function exactPreflight(
    profile: CanonicalSam31VertexScaleZeroDeploymentProfile,
    currentStage: Stage,
  ): Promise<void> {
    if (currentStage === 'model_version_upload') {
      const candidate = await readCandidateVersion(profile, false)
      if (candidate) {
        throw new Error('SAM 3.1 successor alias already exists before POST.')
      }
      const previous = await readModelVersion('2')
      const endpoint = await readEndpoint()
      const deployed = endpoint.deployedModels.find((item) =>
        item.id === CANONICAL_SAM3_1_VERTEX_PREVIOUS_DEPLOYED_MODEL_ID)
      if (
        previous.containerSpec.imageUri !== OLD_IMAGE
        || !deployed
        || deployed.modelVersionId !== '2'
        || endpoint.trafficSplit[
          CANONICAL_SAM3_1_VERTEX_PREVIOUS_DEPLOYED_MODEL_ID
        ] !== 100
        || Object.keys(endpoint.trafficSplit).length !== 1
      ) throw new Error('SAM 3.1 successor upload preflight changed.')
      return
    }
    const candidate = await readCandidateVersion(profile, true)
    if (!candidate) {
      throw new Error('SAM 3.1 successor candidate reread is absent.')
    }
    const endpoint = await readEndpoint()
    if (currentStage === 'model_version_deploy') {
      const previous = endpoint.deployedModels.find((item) =>
        item.id === CANONICAL_SAM3_1_VERTEX_PREVIOUS_DEPLOYED_MODEL_ID)
      if (
        !previous
        || previous.modelVersionId !== '2'
        || endpoint.deployedModels.some((item) =>
          item.id === CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID)
        || endpoint.trafficSplit[
          CANONICAL_SAM3_1_VERTEX_PREVIOUS_DEPLOYED_MODEL_ID
        ] !== 100
        || Object.keys(endpoint.trafficSplit).length !== 1
      ) throw new Error('SAM 3.1 successor deploy preflight changed.')
      return
    }
    const newDeployment = endpoint.deployedModels.find((item) =>
      item.id === CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID)
    const previous = endpoint.deployedModels.find((item) =>
      item.id === CANONICAL_SAM3_1_VERTEX_PREVIOUS_DEPLOYED_MODEL_ID)
    if (
      !newDeployment || !previous
      || newDeployment.modelVersionId !== candidate.versionId
      || !exactDeployment(newDeployment)
      || endpoint.trafficSplit[
        CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID
      ] !== 100
      || Object.keys(endpoint.trafficSplit).length !== 1
    ) throw new Error('SAM 3.1 successor undeploy preflight changed.')
  }

  async function readCandidateVersion(
    profile: CanonicalSam31VertexScaleZeroDeploymentProfile,
    required: boolean,
  ) {
    try {
      const version = await readModelVersion(
        CANONICAL_SAM3_1_VERTEX_SUCCESSOR_ALIAS,
      )
      if (
        version.containerSpec.imageUri !== profile.immutableImageUri
        || version.containerSpec.healthRoute !== '/health'
        || version.containerSpec.predictRoute !== '/predict'
        || version.containerSpec.deploymentTimeout !== '1800s'
        || stableAuthorityStringify(version.containerSpec.ports) !==
          stableAuthorityStringify([{ containerPort: 8080 }])
        || version.containerSpec.startupProbe?.httpGet?.path !== '/health'
        || version.containerSpec.startupProbe?.httpGet?.port !== 8080
        || (version.containerSpec.startupProbe.initialDelaySeconds ?? 0) !== 0
        || version.containerSpec.startupProbe.periodSeconds !== 10
        || version.containerSpec.startupProbe.timeoutSeconds !== 10
        || version.containerSpec.startupProbe.failureThreshold !== 120
        || version.containerSpec.startupProbe.successThreshold !== 1
        || stableAuthorityStringify(version.containerSpec.env) !==
          stableAuthorityStringify([
            {
              name: 'WEEDITPRO_SAM31_RUNTIME_MODE',
              value: 'vertex_prediction_endpoint_v1',
            },
            {
              name: 'WEEDITPRO_GPU_ACCELERATOR_CLASS',
              value: 'nvidia_a100_80gb',
            },
          ])
      ) throw new Error('SAM 3.1 successor model version changed.')
      return {
        versionId: version.versionId,
        resource:
          `${CANONICAL_SAM3_1_VERTEX_SUCCESSOR_MODEL_RESOURCE}@${version.versionId}`,
      }
    } catch (error) {
      if (cloudStatus(error) === 404 && !required) return null
      throw error
    }
  }

  async function readModelVersion(versionOrAlias: string) {
    const response = await auth.request({
      url:
        `${CANONICAL_SAM3_1_VERTEX_SUCCESSOR_API_ORIGIN}/v1beta1/${CANONICAL_SAM3_1_VERTEX_SUCCESSOR_MODEL_RESOURCE}@${versionOrAlias}`,
      method: 'GET',
      headers: { 'x-goog-user-project': 'reeditpro' },
      timeout,
      retry: false,
      maxRedirects: 0,
      responseType: 'json',
      maxContentLength: 2 * 1024 * 1024,
    })
    return z.object({
      name: z.string().regex(
        /^projects\/(?:reeditpro|390722338345)\/locations\/us-central1\/models\/weeditpro-sam31-a100-scale-zero-v1@(?:[1-9][0-9]*|[a-z][a-z0-9_-]{0,127})$/u,
      ),
      versionId: z.string().regex(/^[1-9][0-9]*$/u),
      versionAliases: z.array(z.string()).min(1),
      containerSpec: z.object({
        imageUri: z.string(),
        ports: z.array(z.object({
          containerPort: z.number().int().positive(),
        }).strict()),
        healthRoute: z.string(),
        predictRoute: z.string(),
        deploymentTimeout: z.string().optional(),
        startupProbe: z.object({
          httpGet: z.object({
            path: z.string(),
            port: z.number().int().positive(),
          }).passthrough(),
          initialDelaySeconds: z.number().int().nonnegative().optional(),
          periodSeconds: z.number().int().positive(),
          timeoutSeconds: z.number().int().positive(),
          failureThreshold: z.number().int().positive(),
          successThreshold: z.number().int().positive(),
        }).passthrough().optional(),
        env: z.array(z.object({
          name: z.string(), value: z.string(),
        }).strict()),
      }).passthrough(),
    }).passthrough().parse(response.data)
  }

  async function readEndpoint() {
    const response = await auth.request({
      url:
        `${CANONICAL_SAM3_1_VERTEX_SUCCESSOR_API_ORIGIN}/v1beta1/${CANONICAL_SAM3_1_VERTEX_SUCCESSOR_ENDPOINT_RESOURCE}`,
      method: 'GET',
      headers: { 'x-goog-user-project': 'reeditpro' },
      timeout,
      retry: false,
      maxRedirects: 0,
      responseType: 'json',
      maxContentLength: 2 * 1024 * 1024,
    })
    return z.object({
      name: z.enum([
        CANONICAL_SAM3_1_VERTEX_SUCCESSOR_ENDPOINT_RESOURCE,
        `projects/${PROJECT_NUMBER}/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1`,
      ]),
      deployedModels: z.array(z.object({
        id: z.string().regex(/^[0-9]{1,10}$/u),
        model: z.string(),
        modelVersionId: z.string().regex(/^[1-9][0-9]*$/u),
        serviceAccount: z.string(),
        enableAccessLogging: z.boolean().optional(),
        disableContainerLogging: z.boolean().optional(),
        dedicatedResources: z.object({
          machineSpec: z.object({
            machineType: z.string(),
            acceleratorType: z.string(),
            acceleratorCount: z.number().int(),
          }).passthrough(),
          minReplicaCount: z.number().int().nonnegative().optional(),
          initialReplicaCount: z.number().int().nonnegative(),
          maxReplicaCount: z.number().int().positive(),
          scaleToZeroSpec: z.object({
            minScaleupPeriod: z.string(),
            idleScaledownPeriod: z.string(),
          }).strict(),
          spot: z.boolean().optional(),
        }).passthrough(),
      }).passthrough()),
      trafficSplit: z.record(z.string(), z.number().int().nonnegative()),
    }).passthrough().parse(response.data)
  }

  function exactDeployment(value: Awaited<ReturnType<typeof readEndpoint>>[
    'deployedModels'
  ][number]) {
    return normalizeBaseModel(value.model) ===
      CANONICAL_SAM3_1_VERTEX_SUCCESSOR_MODEL_RESOURCE
      && value.serviceAccount ===
        CANONICAL_SAM3_1_VERTEX_SUCCESSOR_SERVICE_ACCOUNT
      && (value.enableAccessLogging ?? false) === false
      && (value.disableContainerLogging ?? false) === false
      && value.dedicatedResources.machineSpec.machineType === 'a2-ultragpu-1g'
      && value.dedicatedResources.machineSpec.acceleratorType ===
        'NVIDIA_A100_80GB'
      && value.dedicatedResources.machineSpec.acceleratorCount === 1
      && (value.dedicatedResources.minReplicaCount ?? 0) === 0
      && value.dedicatedResources.initialReplicaCount === 1
      && value.dedicatedResources.maxReplicaCount === 1
      && value.dedicatedResources.scaleToZeroSpec.minScaleupPeriod === '300s'
      && value.dedicatedResources.scaleToZeroSpec.idleScaledownPeriod === '300s'
      && (value.dedicatedResources.spot ?? false) === false
  }

  async function persistProfile(
    profile: CanonicalSam31VertexScaleZeroDeploymentProfile,
  ) {
    await createOnly(pathFor('profiles', profile.profileHash), profile)
    const reread = await readExact(
      pathFor('profiles', profile.profileHash),
      assertCanonicalSam31VertexScaleZeroDeploymentProfile,
    )
    if (!reread || reread.profileHash !== profile.profileHash) {
      throw new Error('SAM 3.1 successor profile exact reread changed.')
    }
    return recordRef('sam31-vertex-successor-profile', profile.profileHash)
  }

  async function persistRecord(
    kind: string,
    hash: string,
    value: unknown,
    id: string,
  ) {
    await createOnly(pathFor(kind, hash), value)
    return recordRef(id, hash)
  }

  async function persistStageObservation(context: {
    readonly requestRef: Ref
    readonly consumptionRef: Ref
    readonly submissionRef: Ref
    readonly observation: Observation
    readonly providerPostIssuedThisRun: boolean
  }): Promise<CanonicalSam31VertexModelVersionSuccessorStageResult> {
    const observationRef = await persistRecord(
      'observations',
      context.observation.observationHash,
      context.observation,
      `sam31-vertex-${context.observation.stage}-observation`,
    )
    const reread = await readExact(
      pathFor('observations', context.observation.observationHash),
      assertObservation,
    )
    if (!reread
      || reread.observationHash !== context.observation.observationHash) {
      throw new Error('SAM 3.1 successor observation reread changed.')
    }
    return stageResult({
      stage: context.observation.stage,
      disposition: context.observation.disposition,
      requestRef: context.requestRef,
      consumptionRef: context.consumptionRef,
      submissionRef: context.submissionRef,
      observationRef,
      observation: context.observation,
      providerPostIssuedThisRun: context.providerPostIssuedThisRun,
    })
  }

  async function createOnly(
    objectPath: string,
    value: unknown,
  ): Promise<boolean> {
    assertPlainSerializedData(value, 'sam3_1_vertex_successor_record')
    const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
    const result = await input.objectPort.createOnly({
      objectPath,
      body,
      contentSha256: createHash('sha256').update(body).digest('hex'),
    })
    const reread = await input.objectPort.readExact(objectPath)
    if (!reread || !reread.equals(body)) {
      throw new Error('SAM 3.1 successor create-only collision changed.')
    }
    return result === 'created'
  }

  async function readExact<T>(
    objectPath: string,
    parse: (value: unknown) => T,
  ): Promise<T | null> {
    const body = await input.objectPort.readExact(objectPath)
    if (!body) return null
    let decoded: unknown
    try { decoded = JSON.parse(body.toString('utf8')) } catch {
      throw new Error('SAM 3.1 successor repository JSON is invalid.')
    }
    const parsed = parse(decoded)
    if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
      throw new Error('SAM 3.1 successor repository bytes changed.')
    }
    return structuredClone(parsed)
  }

  function pathFor(kind: string, hash: string) {
    return `${prefix}/${kind}/${sha256.parse(hash)}.json`
  }
}

function createConsumption(
  profile: CanonicalSam31VertexScaleZeroDeploymentProfile,
  request: CanonicalSam31VertexModelVersionSuccessorRequest,
  consumedAt: string,
): Consumption {
  const payload = consumptionWithoutHashSchema.parse({
    schemaVersion:
      'canonical-sam3_1-vertex-model-version-successor-consumption-v1',
    source: SOURCE,
    stage: request.stage,
    profileHash: profile.profileHash,
    requestDigestSha256: request.requestDigestSha256,
    consumedAt,
    createOnly: true,
    providerPostMayStartOnlyAfterThisRecord: true,
    automaticRetryAllowed: false,
    customerRequestOrGpuInferenceStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
  return consumptionSchema.parse({
    ...payload,
    consumptionHash: sha256AuthorityValue(payload),
  })
}

function createSubmission(input: {
  readonly stage: Stage
  readonly requestDigestSha256: string
  readonly disposition: 'submitted'
    | 'outcome_unknown_requires_reconciliation'
  readonly providerOutcome: 'executed' | 'unknown'
  readonly operationName: string | null
  readonly submittedAt: string
}): Submission {
  const payload = submissionWithoutHashSchema.parse({
    schemaVersion:
      'canonical-sam3_1-vertex-model-version-successor-submission-v1',
    source: SOURCE,
    ...input,
    providerCallStarted: true,
    automaticRetryAllowed: false,
    customerRequestOrGpuInferenceStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
  return submissionSchema.parse({
    ...payload,
    submissionHash: sha256AuthorityValue(payload),
  })
}

function createObservation(input: {
  readonly request: CanonicalSam31VertexModelVersionSuccessorRequest
  readonly submission: Submission
  readonly disposition: 'pending' | 'completed' | 'terminal_failure'
  readonly operationDone: boolean
  readonly modelVersionResourceName: string | null
  readonly deployedModelId:
    typeof CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID | null
  readonly previousDeployedModelAbsent: boolean
  readonly providerErrorRef: {
    readonly code: number
    readonly messageDigestSha256: string
  } | null
  readonly observationMode: 'exact_operation_and_resource_reread'
    | 'exact_resource_reconciliation'
  readonly exactOperationReread: boolean
  readonly observedAt: string
}): Observation {
  const payload = observationWithoutHashSchema.parse({
    schemaVersion:
      'canonical-sam3_1-vertex-model-version-successor-observation-v1',
    source: SOURCE,
    stage: input.request.stage,
    requestDigestSha256: input.request.requestDigestSha256,
    submissionHash: input.submission.submissionHash,
    operationName: input.exactOperationReread
      ? input.submission.operationName : null,
    disposition: input.disposition,
    operationDone: input.operationDone,
    modelVersionResourceName: input.modelVersionResourceName,
    deployedModelId: input.deployedModelId,
    previousDeployedModelAbsent: input.previousDeployedModelAbsent,
    providerErrorRef: input.providerErrorRef,
    observationMode: input.observationMode,
    exactOperationReread: input.exactOperationReread,
    exactModelAndEndpointReread: true,
    automaticRetryAllowed: false,
    customerRequestOrGpuInferenceStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
    observedAt: input.observedAt,
  })
  return observationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function assertConsumption(value: unknown): Consumption {
  const parsed = consumptionSchema.parse(value)
  const { consumptionHash, ...payload } = parsed
  if (consumptionHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 successor consumption digest changed.')
  }
  return parsed
}

function assertSubmission(value: unknown): Submission {
  const parsed = submissionSchema.parse(value)
  const { submissionHash, ...payload } = parsed
  if (submissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 successor submission digest changed.')
  }
  return parsed
}

function assertObservation(value: unknown): Observation {
  const parsed = observationSchema.parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 successor observation digest changed.')
  }
  return parsed
}

function stageResult(input: {
  readonly stage: Stage
  readonly disposition: CanonicalSam31VertexModelVersionSuccessorStageResult[
    'disposition'
  ]
  readonly requestRef: Ref
  readonly consumptionRef: Ref
  readonly submissionRef: Ref
  readonly observationRef?: Ref | null
  readonly observation: Observation | null
  readonly providerPostIssuedThisRun: boolean
}): CanonicalSam31VertexModelVersionSuccessorStageResult {
  return Object.freeze({
    ...input,
    observationRef: input.observationRef ?? null,
    automaticRetryAllowed: false,
  })
}

function rolloutResult(
  disposition: CanonicalSam31VertexModelVersionSuccessorRolloutResult[
    'disposition'
  ],
  profileRef: Ref,
  stages: readonly CanonicalSam31VertexModelVersionSuccessorStageResult[],
  modelVersionResourceName: string | null,
): CanonicalSam31VertexModelVersionSuccessorRolloutResult {
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_MODEL_VERSION_SUCCESSOR_ROLLOUT_VERSION,
    disposition,
    profileRef,
    modelVersionResourceName,
    deployedModelId: disposition === 'rolled_out'
      ? CANONICAL_SAM3_1_VERTEX_SUCCESSOR_DEPLOYED_MODEL_ID : null,
    previousDeployedModelId:
      CANONICAL_SAM3_1_VERTEX_PREVIOUS_DEPLOYED_MODEL_ID,
    previousModelVersionRetainedForRollback: true,
    previousDeployedModelRemovedAfterCutover: disposition === 'rolled_out',
    stages: Object.freeze([...stages]),
    durableConsumptionBeforeEveryProviderPost: true,
    exactSequentialStageOrder: true,
    automaticRetryAllowed: false,
    customerRequestOrGpuInferenceStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

function recordRef(id: string, hash: string): Ref {
  return refSchema.parse({ id, version: 1, contentHash: `sha256:${hash}` })
}

function normalizeBaseModel(value: string) {
  return value.replace(
    /^projects\/390722338345\//u,
    'projects/reeditpro/',
  ).replace(/@[1-9][0-9]*$/u, '')
}

function cloudStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  if ('response' in error && error.response
    && typeof error.response === 'object' && 'status' in error.response) {
    const value = Number(error.response.status)
    if (Number.isInteger(value)) return value
  }
  if ('code' in error) {
    const value = Number(error.code)
    if (Number.isInteger(value)) return value
  }
  return undefined
}
