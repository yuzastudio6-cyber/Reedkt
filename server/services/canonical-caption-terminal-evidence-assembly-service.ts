import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_TERMINAL_EVIDENCE_ASSEMBLY_VERSION,
  CANONICAL_CAPTION_TERMINAL_EVIDENCE_BUNDLE_REPOSITORY_VERSION,
  CANONICAL_CAPTION_TERMINAL_INPUT_READ_PORT_VERSION,
  CANONICAL_CAPTION_TERMINAL_PRIVATE_REVIEW_READ_PORT_VERSION,
  type CanonicalCaptionTerminalEvidenceAssembly,
  type CanonicalCaptionTerminalEvidenceBundleRepository,
  type CanonicalCaptionTerminalInputReadPort,
  type CanonicalCaptionTerminalPrivateReviewReadPort,
} from '../../src/types/canonical-caption-terminal-evidence-assembly'
import type {
  CanonicalCaptionTerminalEvidenceBundle,
  CanonicalCaptionTerminalQualificationRequest,
} from '../../src/types/canonical-caption-terminal-qualification'
import {
  CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_VERSION,
} from '../../src/types/canonical-caption-private-review-evidence-projection'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  parseCaptionTerminalQualificationEvidenceInputV2,
} from '../captions-specialist/caption-terminal-qualification-v2'
import {
  parseCanonicalCaptionPrivateReviewEvidenceProjection,
} from './canonical-caption-private-review-evidence-service'
import {
  createCanonicalCaptionTerminalEvidenceBundle,
  createCanonicalCaptionTerminalEvidenceReadPort,
  parseCanonicalCaptionTerminalEvidenceBundle,
  parseCanonicalCaptionTerminalQualificationRequest,
} from './canonical-caption-terminal-qualification-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'

const DEFAULT_PREFIX =
  'private-internal/captions-specialist/v1/terminal-evidence-bundles'
const MAX_BUNDLE_BYTES = 64 * 1024 * 1024
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const requestEnvelopeSchema = z.object({ request: z.unknown() }).strict()
const writeEnvelopeSchema = z.object({
  request: z.unknown(),
  bundle: z.unknown(),
}).strict()

const admittedInputReadPorts = new WeakSet<object>()
const admittedPrivateReviewReadPorts = new WeakSet<object>()
const admittedBundleRepositories = new WeakSet<object>()

export function createCanonicalCaptionTerminalInputReadPort(
  readExact: CanonicalCaptionTerminalInputReadPort['readExact'],
): CanonicalCaptionTerminalInputReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption terminal input reader is required.')
  }
  const port = Object.freeze({
    schemaVersion: CANONICAL_CAPTION_TERMINAL_INPUT_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_backend_completed_caption_work_and_owner_evidence' as const,
    callerSuppliedQualificationInputAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedInputReadPorts.add(port)
  return port
}

export function createCanonicalCaptionTerminalPrivateReviewReadPort(
  readExact: CanonicalCaptionTerminalPrivateReviewReadPort['readExact'],
): CanonicalCaptionTerminalPrivateReviewReadPort {
  if (typeof readExact !== 'function') {
    throw new Error(
      'Canonical Caption terminal private-review reader is required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_TERMINAL_PRIVATE_REVIEW_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_private_review_persisted_output_evidence' as const,
    callerSuppliedPrivateReviewEvidenceAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedPrivateReviewReadPorts.add(port)
  return port
}

export function createCanonicalCaptionTerminalEvidenceBundleRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalCaptionTerminalEvidenceBundleRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_TERMINAL_EVIDENCE_BUNDLE_REPOSITORY_VERSION,
    async persistBundleCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption terminal bundle write')
      const write = writeEnvelopeSchema.parse(untrusted)
      const request = parseCanonicalCaptionTerminalQualificationRequest(
        write.request)
      const bundle = parseCanonicalCaptionTerminalEvidenceBundle(
        write.bundle, request)
      return persistExact(input.objectPort, bundlePath(prefix, request),
        bundle, request)
    },
    async rereadBundle(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption terminal bundle read')
      const read = requestEnvelopeSchema.parse(untrusted)
      const request = parseCanonicalCaptionTerminalQualificationRequest(
        read.request)
      return readExact(input.objectPort, bundlePath(prefix, request), request)
    },
  })
  admittedBundleRepositories.add(repository)
  return repository
}

export function createCanonicalCaptionTerminalEvidenceAssembly(input: {
  readonly inputReadPort: CanonicalCaptionTerminalInputReadPort
  readonly privateReviewReadPort:
    CanonicalCaptionTerminalPrivateReviewReadPort
  readonly bundleRepository:
    CanonicalCaptionTerminalEvidenceBundleRepository
}): CanonicalCaptionTerminalEvidenceAssembly {
  assertPorts(input)
  const evidenceReadPort = createCanonicalCaptionTerminalEvidenceReadPort(
    async (untrusted) => {
      assertClosedContractTree(untrusted,
        'Canonical Caption terminal assembly read')
      const read = requestEnvelopeSchema.parse(untrusted)
      const request = parseCanonicalCaptionTerminalQualificationRequest(
        read.request)
      const existing = await input.bundleRepository.rereadBundle({ request })
      if (existing) return structuredClone(existing)
      const firstInput = await input.inputReadPort.readExact({ request })
      if (!firstInput) return null
      const secondInput = await input.inputReadPort.readExact({ request })
      if (!secondInput || !sameCanonical(firstInput, secondInput)) {
        throw new Error(
          'Canonical Caption terminal input changed between exact rereads.')
      }
      const qualificationInput =
        parseCaptionTerminalQualificationEvidenceInputV2(firstInput)
      const firstReviews = await input.privateReviewReadPort.readExact({
        request,
      })
      if (!firstReviews) return null
      const secondReviews = await input.privateReviewReadPort.readExact({
        request,
      })
      if (!secondReviews || !sameCanonical(firstReviews, secondReviews)) {
        throw new Error(
          'Canonical Caption private review changed between exact rereads.')
      }
      const privateReviewEvidenceProjections = firstReviews.map(
        (review) => {
          const parsed = parseCanonicalCaptionPrivateReviewEvidenceProjection(
            review)
          if (parsed.schemaVersion !==
              CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_VERSION) {
            throw new Error(
              'Canonical Caption terminal V1 bundle cannot contain a V2 private-review projection.',
            )
          }
          return parsed
        })
      const bundle = createCanonicalCaptionTerminalEvidenceBundle({
        request,
        qualificationInput,
        privateReviewEvidenceProjections,
      })
      await input.bundleRepository.persistBundleCreateOnly({
        request,
        bundle,
      })
      const reread = await input.bundleRepository.rereadBundle({ request })
      if (!reread || !sameCanonical(reread, bundle)) {
        throw new Error(
          'Canonical Caption terminal bundle persistence reread failed.')
      }
      return structuredClone(reread)
    })
  return Object.freeze({
    schemaVersion: CANONICAL_CAPTION_TERMINAL_EVIDENCE_ASSEMBLY_VERSION,
    evidenceReadPort,
    bundleRepository: input.bundleRepository,
    exactSourceRereadBeforeAssembly: true,
    bundlePersistedCreateOnlyBeforeQualification: true,
    callerSuppliedEvidenceAccepted: false,
    browserLocalCompletionAccepted: false,
    directPeerDispatchPerformedByCaption: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    providerOrModelAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    creditOrBillingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  })
}

function assertPorts(input: {
  inputReadPort: CanonicalCaptionTerminalInputReadPort
  privateReviewReadPort: CanonicalCaptionTerminalPrivateReviewReadPort
  bundleRepository: CanonicalCaptionTerminalEvidenceBundleRepository
}): void {
  if (!admittedInputReadPorts.has(input.inputReadPort)
    || !admittedPrivateReviewReadPorts.has(input.privateReviewReadPort)
    || !admittedBundleRepositories.has(input.bundleRepository)
    || input.inputReadPort.schemaVersion
      !== CANONICAL_CAPTION_TERMINAL_INPUT_READ_PORT_VERSION
    || input.inputReadPort.sourceAuthority
      !== 'canonical_backend_completed_caption_work_and_owner_evidence'
    || input.inputReadPort.callerSuppliedQualificationInputAccepted
    || input.privateReviewReadPort.schemaVersion
      !== CANONICAL_CAPTION_TERMINAL_PRIVATE_REVIEW_READ_PORT_VERSION
    || input.privateReviewReadPort.sourceAuthority
      !== 'canonical_private_review_persisted_output_evidence'
    || input.privateReviewReadPort
      .callerSuppliedPrivateReviewEvidenceAccepted
    || input.bundleRepository.schemaVersion
      !== CANONICAL_CAPTION_TERMINAL_EVIDENCE_BUNDLE_REPOSITORY_VERSION) {
    throw new Error('Canonical Caption terminal assembly ports are invalid.')
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error(
      'Canonical Caption terminal bundle object port is incomplete.')
  }
}

function bundlePath(
  prefix: string,
  request: CanonicalCaptionTerminalQualificationRequest,
): string {
  return `${prefix}/${request.requestDigestSha256}.json`
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  bundle: CanonicalCaptionTerminalEvidenceBundle,
  request: CanonicalCaptionTerminalQualificationRequest,
): Promise<'created' | 'identical_replay'> {
  const body = serialize(bundle)
  const disposition = await port.createOnly({
    objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await readExact(port, objectPath, request)
  if (!reread || !sameCanonical(reread, bundle)) {
    throw new Error('Canonical Caption terminal bundle create-only conflict.')
  }
  return disposition === 'created' ? 'created' : 'identical_replay'
}

async function readExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  request: CanonicalCaptionTerminalQualificationRequest,
): Promise<CanonicalCaptionTerminalEvidenceBundle | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_BUNDLE_BYTES) {
    throw new Error('Canonical Caption terminal bundle bytes are invalid.')
  }
  try {
    return parseCanonicalCaptionTerminalEvidenceBundle(
      JSON.parse(body.toString('utf8')) as unknown, request)
  } catch (error) {
    if (error instanceof Error
      && error.message.includes('Canonical Caption terminal')) throw error
    throw new Error('Canonical Caption terminal bundle JSON is invalid.', {
      cause: error,
    })
  }
}

function serialize(value: CanonicalCaptionTerminalEvidenceBundle): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_BUNDLE_BYTES) {
    throw new Error('Canonical Caption terminal bundle size is invalid.')
  }
  return body
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
