import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import type {
  CanonicalSam31VertexServingDeploymentReadPort,
  CanonicalSam31VertexServingDeploymentReady,
} from './canonical-sam3_1-vertex-serving-invocation-service'
import {
  assertCanonicalSam31VertexServingDeploymentReady,
} from './canonical-sam3_1-vertex-serving-invocation-service'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'

const PROJECT_ID = 'reeditpro' as const
const STATE_BUCKET = 'reeditpro-production-reeditpro-control-plane-state'
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-deployment-ready'
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type Ref = z.infer<typeof refSchema>

export interface CanonicalSam31VertexServingDeploymentReadyRepository
  extends CanonicalSam31VertexServingDeploymentReadPort {
  persistCreateOnly(input: {
    readonly ready: CanonicalSam31VertexServingDeploymentReady
  }): Promise<'created' | 'already_exists'>
}

export function createCanonicalSam31VertexServingDeploymentReadyRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31VertexServingDeploymentReadyRepository {
  const prefix = (input.prefix ?? DEFAULT_PREFIX).replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('\\')) {
    throw new Error('Vertex deployment-ready repository prefix is invalid.')
  }
  return Object.freeze({
    async persistCreateOnly({ ready }: {
      readonly ready: CanonicalSam31VertexServingDeploymentReady
    }) {
      const accepted = assertCanonicalSam31VertexServingDeploymentReady(ready)
      const body = Buffer.from(stableAuthorityStringify(accepted), 'utf8')
      return input.objectPort.createOnly({
        objectPath: readyPath(prefix, accepted.endpointDeploymentRef),
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
    },
    async rereadReadyDeployment({ endpointDeploymentRef, at }: {
      readonly endpointDeploymentRef: Ref
      readonly at: string
    }) {
      const reference = refSchema.parse(endpointDeploymentRef)
      const body = await input.objectPort.readExact(
        readyPath(prefix, reference),
      )
      if (!body) return null
      let decoded: unknown
      try { decoded = JSON.parse(body.toString('utf8')) } catch {
        throw new Error('Vertex deployment-ready repository JSON is invalid.')
      }
      const accepted = assertCanonicalSam31VertexServingDeploymentReady(
        decoded,
        at,
      )
      if (
        stableAuthorityStringify(accepted.endpointDeploymentRef) !==
          stableAuthorityStringify(reference)
        || stableAuthorityStringify(accepted) !== body.toString('utf8')
      ) throw new Error('Vertex deployment-ready exact reread changed.')
      return structuredClone(accepted)
    },
  })
}

export function createCanonicalGcsSam31VertexServingDeploymentReadyRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalSam31VertexServingDeploymentReadyRepository {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('Vertex deployment-ready repository project changed.')
  }
  return createCanonicalSam31VertexServingDeploymentReadyRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId }),
      bucketName: input.bucketName ?? STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

function readyPath(prefix: string, reference: Ref): string {
  return `${prefix}/${safeId.parse(reference.id)}/ready.json`
}
