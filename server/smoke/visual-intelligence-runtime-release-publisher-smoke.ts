import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { Storage } from '@google-cloud/storage'

import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  readVisualIntelligenceRuntimeRelease,
} from '../visual-intelligence/visual-intelligence-runtime-release'
import {
  VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENTS,
  createControlledVisualIntelligenceRuntimeQualificationComponent,
  parseVisualIntelligenceRuntimeReleasePublicationReceipt,
  publishVisualIntelligenceRuntimeRelease,
  type VisualIntelligenceRuntimeQualificationComponent,
  type VisualIntelligenceRuntimeQualificationCoordinate,
} from '../visual-intelligence/visual-intelligence-runtime-release-publisher'

const componentObjects = new Map<string, StoredObject>()
const components = VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENTS.map(
  (component, index) => createComponent(component, index),
)
const coordinates = components.map(storeComponent)
const storage = createMemoryStorage()
const objectPort = {
  async readExact(input: {
    bucketName: string
    objectName: string
    generation?: string
    etag?: string
  }) {
    const stored = componentObjects.get(input.objectName)
    if (!stored) return null
    assert.equal(input.bucketName, 'reeditpro-control-plane')
    return cloneStored(stored)
  },
}

const first = await publishVisualIntelligenceRuntimeRelease({
  projectId: 'reeditpro',
  lifecycleBucketName: 'reeditpro-control-plane',
  componentCoordinates: coordinates,
  objectPort,
  storage: storage as unknown as Storage,
  now: () => '2026-08-07T12:00:00.000Z',
})
assert.deepEqual(
  parseVisualIntelligenceRuntimeReleasePublicationReceipt(first),
  first,
)
assert.equal(first.disposition, 'created')
assert.equal(first.qualificationComponentRefs.length, 11)
assert.equal(first.providerOrModelExecuted, false)
assert.equal(first.gpuJobStarted, false)
assert.equal(first.customerCreditsMutated, false)
assert.equal(first.productionAuthorityGranted, false)

const replay = await publishVisualIntelligenceRuntimeRelease({
  projectId: 'reeditpro',
  lifecycleBucketName: 'reeditpro-control-plane',
  componentCoordinates: coordinates,
  objectPort,
  storage: storage as unknown as Storage,
  now: () => '2026-08-07T12:00:00.000Z',
})
assert.equal(replay.disposition, 'already_exists_exact')
assert.equal(replay.objectName, first.objectName)
assert.equal(replay.generation, first.generation)

const published = storage.requireObject(first.objectName)
const admitted = await readVisualIntelligenceRuntimeRelease({
  projectId: 'reeditpro',
  bucketName: first.bucketName,
  objectName: first.objectName,
  generation: first.generation,
  etag: first.etag,
  contentSha256: first.contentSha256,
  objectPort: {
    async readExact() {
      return cloneStored(published)
    },
  },
})
assert.equal(admitted.exactModelId, 'gemini-3.1-pro-preview')
assert.equal(admitted.thinkingLevel, 'high')
assert.equal(admitted.mediaResolution, 'high')
assert.equal(admitted.qwenVisualFallbackAllowed, false)
assert.equal(admitted.selfHostedVisualModelFallbackAllowed, false)
assert.equal(admitted.authenticatedUserTriggerRequired, true)
assert.equal(admitted.publicListPriceSettlementAllowed, false)

await assert.rejects(() => publishVisualIntelligenceRuntimeRelease({
  projectId: 'reeditpro',
  lifecycleBucketName: 'reeditpro-control-plane',
  componentCoordinates: [coordinates[1], coordinates[0], ...coordinates.slice(2)],
  objectPort,
  storage: createMemoryStorage() as unknown as Storage,
  now: () => '2026-08-07T12:00:00.000Z',
}))

const crossComponent = structuredClone(coordinates)
crossComponent[0] = { ...crossComponent[0], component: 'concurrency_owner_release' }
await assert.rejects(() => publishVisualIntelligenceRuntimeRelease({
  projectId: 'reeditpro',
  lifecycleBucketName: 'reeditpro-control-plane',
  componentCoordinates: crossComponent,
  objectPort,
  storage: createMemoryStorage() as unknown as Storage,
  now: () => '2026-08-07T12:00:00.000Z',
}))

await assert.rejects(() => publishVisualIntelligenceRuntimeRelease({
  projectId: 'reeditpro',
  lifecycleBucketName: 'reeditpro-control-plane',
  componentCoordinates: coordinates,
  objectPort,
  storage: createMemoryStorage() as unknown as Storage,
  now: () => '2026-09-08T12:00:00.000Z',
}))

const tamperedPort = {
  async readExact(input: { objectName: string }) {
    const stored = componentObjects.get(input.objectName)
    if (!stored) return null
    const parsed = JSON.parse(stored.body.toString('utf8')) as Record<string, unknown>
    parsed.productionAuthorityGranted = true
    return {
      ...cloneStored(stored),
      body: Buffer.from(visualIntelligenceCanonicalJson(parsed), 'utf8'),
    }
  },
}
await assert.rejects(() => publishVisualIntelligenceRuntimeRelease({
  projectId: 'reeditpro',
  lifecycleBucketName: 'reeditpro-control-plane',
  componentCoordinates: coordinates,
  objectPort: tamperedPort,
  storage: createMemoryStorage() as unknown as Storage,
  now: () => '2026-08-07T12:00:00.000Z',
}))

const duplicateComponents = components.map((component, index) => index === 1
  ? createControlledVisualIntelligenceRuntimeQualificationComponent({
    ...withoutDigest(component),
    qualificationRef: components[0].qualificationRef,
  })
  : component)
const duplicateObjects = new Map<string, StoredObject>()
const duplicateCoordinates = duplicateComponents.map((component) => {
  const coordinate = componentCoordinate(component)
  duplicateObjects.set(coordinate.objectName, stored(component))
  return coordinate
})
await assert.rejects(() => publishVisualIntelligenceRuntimeRelease({
  projectId: 'reeditpro',
  lifecycleBucketName: 'reeditpro-control-plane',
  componentCoordinates: duplicateCoordinates,
  objectPort: {
    async readExact(input) {
      const value = duplicateObjects.get(input.objectName)
      return value ? cloneStored(value) : null
    },
  },
  storage: createMemoryStorage() as unknown as Storage,
  now: () => '2026-08-07T12:00:00.000Z',
}))

storage.tamper(first.objectName)
await assert.rejects(() => publishVisualIntelligenceRuntimeRelease({
  projectId: 'reeditpro',
  lifecycleBucketName: 'reeditpro-control-plane',
  componentCoordinates: coordinates,
  objectPort,
  storage: storage as unknown as Storage,
  now: () => '2026-08-07T12:00:00.000Z',
}))

console.log(JSON.stringify({
  smoke: 'visual-intelligence-runtime-release-publisher',
  qualificationComponents: components.length,
  exactOrderedComponentSetRequired: true,
  staleComponentRejected: true,
  crossComponentSubstitutionRejected: true,
  duplicateQualificationRefRejected: true,
  callerAuthorityPromotionRejected: true,
  createOnlyExactReplayPassed: true,
  immutableReleaseExactRereadAdmitted: true,
  model: admitted.exactModelId,
  thinkingLevel: admitted.thinkingLevel,
  mediaResolution: admitted.mediaResolution,
  providerExecuted: first.providerOrModelExecuted,
  creditsMutated: first.customerCreditsMutated,
  productionReady: first.productionAuthorityGranted,
}))

function createComponent(
  component: typeof VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENTS[number],
  index: number,
): VisualIntelligenceRuntimeQualificationComponent {
  return createControlledVisualIntelligenceRuntimeQualificationComponent({
    schemaVersion: 'visual-intelligence-runtime-qualification-component-v1',
    source: 'canonical_server_visual_intelligence_qualification_owner',
    evidenceClass: 'canonical_private_exact_reread',
    component,
    projectId: 'reeditpro',
    vertexLocation: 'global',
    capabilityId: 'visual_intelligence',
    providerAdapterId: 'vertex_gemini_pro',
    providerId: 'google_vertex_ai',
    exactModelId: 'gemini-3.1-pro-preview',
    qualityProfile: 'professional_high',
    thinkingLevel: 'high',
    mediaResolution: 'high',
    qualificationRef: ref(`qualification-${index}-${component}`),
    dependencyRefs: [ref(`dependency-${index}-${component}`)],
    observedAtIso: '2026-08-07T11:00:00.000Z',
    expiresAtIso: '2026-09-07T11:00:00.000Z',
    exactCanonicalEvidenceReread: true,
    qualificationPassed: true,
    callerQualificationClaimAccepted: false,
    providerDispatchAuthorityGranted: false,
    customerCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

function storeComponent(
  component: VisualIntelligenceRuntimeQualificationComponent,
): VisualIntelligenceRuntimeQualificationCoordinate {
  const coordinate = componentCoordinate(component)
  componentObjects.set(coordinate.objectName, stored(component))
  return coordinate
}

function componentCoordinate(
  component: VisualIntelligenceRuntimeQualificationComponent,
): VisualIntelligenceRuntimeQualificationCoordinate {
  const objectName = `private/visual-intelligence/qualifications/runtime-release/v1/${component.component}/${component.qualificationRef.id}.json`
  const body = Buffer.from(visualIntelligenceCanonicalJson(component), 'utf8')
  return {
    component: component.component,
    bucketName: 'reeditpro-control-plane',
    objectName,
    generation: '1',
    etag: `etag-${component.component}`,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  }
}

function stored(
  component: VisualIntelligenceRuntimeQualificationComponent,
): StoredObject {
  return {
    body: Buffer.from(visualIntelligenceCanonicalJson(component), 'utf8'),
    generation: '1',
    etag: `etag-${component.component}`,
    contentType: 'application/json',
  }
}

function withoutDigest(
  component: VisualIntelligenceRuntimeQualificationComponent,
) {
  const value = { ...component }
  Reflect.deleteProperty(value, 'componentDigestSha256')
  return value
}

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}

interface StoredObject {
  body: Buffer
  generation: string
  etag: string
  contentType: string
}

function cloneStored(value: StoredObject): StoredObject {
  return { ...value, body: Buffer.from(value.body) }
}

function createMemoryStorage() {
  const objects = new Map<string, StoredObject>()
  const requireObject = (objectName: string): StoredObject => {
    const value = objects.get(objectName)
    if (!value) throw Object.assign(new Error('Not found.'), { code: 404 })
    return value
  }
  return {
    bucket() {
      return {
        file: (objectName: string) => ({
          save: async (body: Buffer, options: {
            contentType: string
            preconditionOpts: { ifGenerationMatch: number }
          }) => {
            assert.equal(options.preconditionOpts.ifGenerationMatch, 0)
            if (objects.has(objectName)) {
              throw Object.assign(new Error('Precondition failed.'), {
                code: 412,
              })
            }
            objects.set(objectName, {
              body: Buffer.from(body),
              generation: '1',
              etag: 'etag-release-1',
              contentType: options.contentType,
            })
          },
          getMetadata: async () => {
            const value = requireObject(objectName)
            return [{
              generation: value.generation,
              etag: value.etag,
              contentType: value.contentType,
              size: String(value.body.byteLength),
            }]
          },
          download: async () => [Buffer.from(requireObject(objectName).body)],
        }),
      }
    },
    requireObject,
    tamper(objectName: string) {
      const value = requireObject(objectName)
      const body = Buffer.from(value.body)
      body[body.byteLength - 2] = body[body.byteLength - 2] === 97 ? 98 : 97
      objects.set(objectName, { ...value, body })
    },
  }
}
