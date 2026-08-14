import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOY_OPERATION,
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_HASH,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_URI,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ALIAS,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_VERSION_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_PREVIOUS_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_PREVIOUS_MODEL_VERSION_ID,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_MODEL_VERSION_ROLLOUT_VERSION =
  'canonical-sam3_1-vertex-model-version-rollout-v1' as const

const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com' as const
const PROJECT_ID = 'reeditpro' as const
const STATE_BUCKET = 'reeditpro-production-reeditpro-control-plane-state'
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-model-version-rollouts'
const MODEL_BASE_RESOURCE = CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_RESOURCE
const MODEL_VERSION_RESOURCE =
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_RESOURCE
const NUMERIC_MODEL_VERSION_RESOURCE =
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_VERSION_RESOURCE
const ENDPOINT_RESOURCE = CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE
const NUMERIC_ENDPOINT_RESOURCE =
  CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_ENDPOINT_RESOURCE
const DEPLOY_OPERATION = CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOY_OPERATION
const DEPLOYED_MODEL_ID = CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID
const PREVIOUS_DEPLOYED_MODEL_ID =
  CANONICAL_SAM3_1_VERTEX_PREVIOUS_DEPLOYED_MODEL_ID
const IMAGE_URI = CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_URI
const IMAGE_DIGEST = CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST
const SUPPLY_CHAIN_RELEASE_ID =
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_ID
const SUPPLY_CHAIN_RELEASE_HASH =
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_HASH
const SERVICE_ACCOUNT =
  'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

const rolloutWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_MODEL_VERSION_ROLLOUT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_model_version_rollout_owner',
  ),
  rolloutId: safeId,
  imageSupplyChainReleaseRef: refSchema.extend({ version: z.literal(1) })
    .strict(),
  immutableImageUri: z.literal(IMAGE_URI),
  immutableImageDigest: z.literal(IMAGE_DIGEST),
  deployOperationName: z.literal(DEPLOY_OPERATION),
  deployOperationDone: z.literal(true),
  modelResourceName: z.literal(MODEL_BASE_RESOURCE),
  modelVersionResourceName: z.literal(MODEL_VERSION_RESOURCE),
  modelVersionId: z.literal(CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID),
  modelVersionAlias: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ALIAS,
  ),
  endpointResourceName: z.literal(ENDPOINT_RESOURCE),
  deployedModelId: z.literal(DEPLOYED_MODEL_ID),
  previousModelVersionId: z.literal(
    CANONICAL_SAM3_1_VERTEX_PREVIOUS_MODEL_VERSION_ID,
  ),
  previousDeployedModelId: z.literal(PREVIOUS_DEPLOYED_MODEL_ID),
  previousModelVersionRetainedForRollback: z.literal(true),
  previousDeployedModelRemovedFromTraffic: z.literal(true),
  exactModelVersionReread: z.literal(true),
  exactDeployOperationReread: z.literal(true),
  exactEndpointAndTrafficReread: z.literal(true),
  routeId: z.literal('a100_80gb_heavy_primary'),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  acceleratorCount: z.literal(1),
  minimumReplicaCount: z.literal(0),
  initialReplicaCount: z.literal(1),
  maximumReplicaCount: z.literal(1),
  minimumScaleUpPeriodSeconds: z.literal(300),
  idleScaleDownPeriodSeconds: z.literal(300),
  trafficPercentage: z.literal(100),
  onlyCurrentModelVersionReceivesTraffic: z.literal(true),
  serviceAccount: z.literal(SERVICE_ACCOUNT),
  accessLoggingEnabled: z.literal(false),
  containerLoggingEnabled: z.literal(false),
  modelInferenceExecuted: z.literal(false),
  customerInvocationStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeQualified: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict()

export const canonicalSam31VertexModelVersionRolloutSchema =
  rolloutWithoutHashSchema.extend({ rolloutHash: sha256 }).strict()
export type CanonicalSam31VertexModelVersionRollout = z.infer<
  typeof canonicalSam31VertexModelVersionRolloutSchema
>

export interface CanonicalSam31VertexModelVersionRolloutRepository {
  persistCreateOnly(input: {
    readonly rollout: CanonicalSam31VertexModelVersionRollout
  }): Promise<'created' | 'already_exists'>
  reread(input: { readonly rolloutId: string }): Promise<unknown>
}

export function createCanonicalSam31VertexModelVersionRolloutService(input: {
  readonly auth?: Pick<GoogleAuth, 'request'>
  readonly repository: CanonicalSam31VertexModelVersionRolloutRepository
  readonly now?: () => string
  readonly timeoutMilliseconds?: number
}) {
  const auth = input.auth ?? new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.timeoutMilliseconds ?? 30_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw new Error('SAM 3.1 model-version rollout timeout changed.')
  }
  return Object.freeze({
    async observeCurrent(): Promise<CanonicalSam31VertexModelVersionRollout> {
      const [modelResponse, operationResponse, endpointResponse] =
        await Promise.all([
          auth.request({
            url: `${API_ORIGIN}/v1beta1/${MODEL_VERSION_RESOURCE}`,
            method: 'GET', timeout, retry: false, maxRedirects: 0,
            responseType: 'json', maxContentLength: 2 * 1024 * 1024,
          }),
          auth.request({
            url: `${API_ORIGIN}/v1beta1/${DEPLOY_OPERATION}`,
            method: 'GET', timeout, retry: false, maxRedirects: 0,
            responseType: 'json', maxContentLength: 2 * 1024 * 1024,
          }),
          auth.request({
            url: `${API_ORIGIN}/v1beta1/${ENDPOINT_RESOURCE}`,
            method: 'GET', timeout, retry: false, maxRedirects: 0,
            responseType: 'json', maxContentLength: 2 * 1024 * 1024,
          }),
        ])
      parseExactModelVersion(modelResponse.data)
      parseExactCompletedOperation(operationResponse.data)
      parseExactEndpoint(endpointResponse.data)
      const observedAt = timestamp.parse(now())
      const identity = sha256AuthorityValue({
        deployOperationName: DEPLOY_OPERATION,
        immutableImageDigest: IMAGE_DIGEST,
        modelVersionId: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
        deployedModelId: DEPLOYED_MODEL_ID,
      })
      const payload = rolloutWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_MODEL_VERSION_ROLLOUT_VERSION,
        source: 'canonical_server_sam3_1_vertex_model_version_rollout_owner',
        rolloutId: `sam31-vertex-model-version-rollout-${identity.slice(0, 32)}`,
        imageSupplyChainReleaseRef: {
          id: SUPPLY_CHAIN_RELEASE_ID,
          version: 1,
          contentHash: SUPPLY_CHAIN_RELEASE_HASH,
        },
        immutableImageUri: IMAGE_URI,
        immutableImageDigest: IMAGE_DIGEST,
        deployOperationName: DEPLOY_OPERATION,
        deployOperationDone: true,
        modelResourceName: MODEL_BASE_RESOURCE,
        modelVersionResourceName: MODEL_VERSION_RESOURCE,
        modelVersionId: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
        modelVersionAlias: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ALIAS,
        endpointResourceName: ENDPOINT_RESOURCE,
        deployedModelId: DEPLOYED_MODEL_ID,
        previousModelVersionId:
          CANONICAL_SAM3_1_VERTEX_PREVIOUS_MODEL_VERSION_ID,
        previousDeployedModelId: PREVIOUS_DEPLOYED_MODEL_ID,
        previousModelVersionRetainedForRollback: true,
        previousDeployedModelRemovedFromTraffic: true,
        exactModelVersionReread: true,
        exactDeployOperationReread: true,
        exactEndpointAndTrafficReread: true,
        routeId: 'a100_80gb_heavy_primary',
        machineType: 'a2-ultragpu-1g',
        accelerator: 'nvidia_a100_80gb',
        acceleratorCount: 1,
        minimumReplicaCount: 0,
        initialReplicaCount: 1,
        maximumReplicaCount: 1,
        minimumScaleUpPeriodSeconds: 300,
        idleScaleDownPeriodSeconds: 300,
        trafficPercentage: 100,
        onlyCurrentModelVersionReceivesTraffic: true,
        serviceAccount: SERVICE_ACCOUNT,
        accessLoggingEnabled: false,
        containerLoggingEnabled: false,
        modelInferenceExecuted: false,
        customerInvocationStarted: false,
        customerCreditsMutated: false,
        runtimeQualified: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        observedAt,
      })
      const rollout = canonicalSam31VertexModelVersionRolloutSchema.parse({
        ...payload,
        rolloutHash: sha256AuthorityValue(payload),
      })
      const persisted = await input.repository.persistCreateOnly({ rollout })
      const reread = assertCanonicalSam31VertexModelVersionRollout(
        await input.repository.reread({ rolloutId: rollout.rolloutId }),
      )
      if (
        reread.rolloutHash !== rollout.rolloutHash
        || (persisted === 'already_exists'
          && reread.immutableImageDigest !== rollout.immutableImageDigest)
      ) throw new Error('SAM 3.1 model-version rollout reread changed.')
      return reread
    },
  })
}

export function createCanonicalSam31VertexModelVersionRolloutRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31VertexModelVersionRolloutRepository {
  const prefix = (input.prefix ?? DEFAULT_PREFIX).replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('\\')) {
    throw new Error('SAM 3.1 model-version rollout prefix is invalid.')
  }
  return Object.freeze({
    async persistCreateOnly({ rollout }: {
      readonly rollout: CanonicalSam31VertexModelVersionRollout
    }) {
      const accepted = assertCanonicalSam31VertexModelVersionRollout(rollout)
      const body = Buffer.from(stableAuthorityStringify(accepted), 'utf8')
      return input.objectPort.createOnly({
        objectPath: `${prefix}/${accepted.rolloutId}/rollout.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
    },
    async reread({ rolloutId }: { readonly rolloutId: string }) {
      const body = await input.objectPort.readExact(
        `${prefix}/${safeId.parse(rolloutId)}/rollout.json`,
      )
      if (!body) return null
      let value: unknown
      try { value = JSON.parse(body.toString('utf8')) } catch {
        throw new Error('SAM 3.1 model-version rollout JSON is invalid.')
      }
      const accepted = assertCanonicalSam31VertexModelVersionRollout(value)
      if (stableAuthorityStringify(accepted) !== body.toString('utf8')) {
        throw new Error('SAM 3.1 model-version rollout bytes changed.')
      }
      return structuredClone(accepted)
    },
  })
}

export function createCanonicalGcsSam31VertexModelVersionRolloutRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalSam31VertexModelVersionRolloutRepository {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('SAM 3.1 model-version rollout project changed.')
  }
  return createCanonicalSam31VertexModelVersionRolloutRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId }),
      bucketName: input.bucketName ?? STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

export function assertCanonicalSam31VertexModelVersionRollout(
  value: unknown,
): CanonicalSam31VertexModelVersionRollout {
  assertPlainSerializedData(value, 'sam31_vertex_model_version_rollout')
  const parsed = canonicalSam31VertexModelVersionRolloutSchema.parse(value)
  const { rolloutHash, ...payload } = parsed
  if (rolloutHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 model-version rollout digest changed.')
  }
  return parsed
}

function parseExactModelVersion(value: unknown): void {
  const model = z.object({
    name: z.literal(NUMERIC_MODEL_VERSION_RESOURCE),
    displayName: z.literal('WeEditPro SAM 3.1 A100 scale-zero v1'),
    versionId: z.literal(CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID),
    versionAliases: z.array(z.literal(
      CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ALIAS,
    )).length(1),
    containerSpec: z.object({
      imageUri: z.literal(IMAGE_URI),
      healthRoute: z.literal('/health'),
      predictRoute: z.literal('/predict'),
      ports: z.array(z.object({ containerPort: z.literal(8080) }).strict())
        .length(1),
      env: z.array(z.object({
        name: z.enum([
          'WEEDITPRO_SAM31_RUNTIME_MODE',
          'WEEDITPRO_GPU_ACCELERATOR_CLASS',
        ]),
        value: z.enum([
          'vertex_prediction_endpoint_v1',
          'nvidia_a100_80gb',
        ]),
      }).strict()).length(2),
    }).passthrough(),
  }).passthrough().parse(value)
  const env = new Map(model.containerSpec.env.map((item) => [
    item.name,
    item.value,
  ]))
  if (
    env.size !== 2
    || env.get('WEEDITPRO_SAM31_RUNTIME_MODE') !==
      'vertex_prediction_endpoint_v1'
    || env.get('WEEDITPRO_GPU_ACCELERATOR_CLASS') !== 'nvidia_a100_80gb'
  ) throw new Error('SAM 3.1 model-version environment changed.')
}

function parseExactCompletedOperation(value: unknown): void {
  const parsed = z.object({
    name: z.literal(DEPLOY_OPERATION),
    done: z.literal(true),
    error: z.never().optional(),
    response: z.object({
      deployedModel: z.object({ id: z.literal(DEPLOYED_MODEL_ID) })
        .passthrough(),
    }).passthrough(),
  }).passthrough().parse(value)
  if (parsed.error !== undefined) {
    throw new Error('SAM 3.1 model-version deployment failed.')
  }
}

function parseExactEndpoint(value: unknown): void {
  const exactInt64 = <const Value extends number>(expected: Value) =>
    z.union([z.literal(expected), z.literal(String(expected))])
      .transform(() => expected)
  const endpoint = z.object({
    name: z.literal(NUMERIC_ENDPOINT_RESOURCE),
    dedicatedEndpointEnabled: z.literal(true),
    deployedModels: z.array(z.object({
      id: z.literal(DEPLOYED_MODEL_ID),
      model: z.enum([
        NUMERIC_MODEL_VERSION_RESOURCE,
        CANONICAL_SAM3_1_VERTEX_CURRENT_NUMERIC_MODEL_RESOURCE,
      ]),
      modelVersionId: z.literal(
        CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
      ).optional().default(CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID),
      serviceAccount: z.literal(SERVICE_ACCOUNT),
      enableAccessLogging: z.literal(false).optional(),
      disableContainerLogging: z.literal(true),
      dedicatedResources: z.object({
        machineSpec: z.object({
          machineType: z.literal('a2-ultragpu-1g'),
          acceleratorType: z.literal('NVIDIA_A100_80GB'),
          acceleratorCount: exactInt64(1),
        }).passthrough(),
        minReplicaCount: exactInt64(0).optional().default(0),
        initialReplicaCount: exactInt64(1).optional().default(1),
        maxReplicaCount: exactInt64(1),
        scaleToZeroSpec: z.object({
          minScaleupPeriod: z.literal('300s'),
          idleScaledownPeriod: z.literal('300s'),
        }).strict(),
        spot: z.literal(false).optional(),
      }).passthrough(),
    }).passthrough()).length(1),
    trafficSplit: z.record(z.string(), z.number().int().min(0).max(100)),
  }).passthrough().parse(value)
  if (
    endpoint.trafficSplit[DEPLOYED_MODEL_ID] !== 100
    || Object.keys(endpoint.trafficSplit).length !== 1
  ) throw new Error('SAM 3.1 model-version rollout traffic changed.')
}
