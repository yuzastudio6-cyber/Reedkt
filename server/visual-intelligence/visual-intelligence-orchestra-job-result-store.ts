import { createHash } from 'node:crypto'

import type {
  OrchestraEvidenceRef,
  OrchestraSkillJobResult,
} from '../../src/types/orchestra-skill-capability'
import { ApiError } from '../errors/api-error'
import {
  orchestraDigest,
  orchestraEvidenceRef,
  parseOrchestraSkillJobResult,
} from '../orchestra/orchestra-skill-capability-contract'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  visualIntelligenceCanonicalJson,
} from './visual-intelligence-contract'

export const VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RESULT_STORE_VERSION =
  'visual-intelligence-orchestra-job-result-store-v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/skill-results/visual-intelligence'
const MAX_RESULT_BYTES = 8 * 1024 * 1024
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const DIGEST = /^sha256:[a-f0-9]{64}$/u

export interface VisualIntelligenceOrchestraJobResultStore {
  readonly schemaVersion:
    typeof VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RESULT_STORE_VERSION
  persistCreateOnly(result: unknown): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly result: OrchestraSkillJobResult
    readonly resultRef: OrchestraEvidenceRef
  }>
  readExact(callRef: unknown): Promise<OrchestraSkillJobResult | null>
}

export function createVisualIntelligenceOrchestraJobResultStore(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): VisualIntelligenceOrchestraJobResultStore {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const readExact = async (untrustedCallRef: unknown) => {
    const callRef = requireRef(untrustedCallRef)
    const body = await input.objectPort.readExact(resultPath(prefix, callRef))
    if (!body) return null
    const result = parseOrchestraSkillJobResult(parseJson(body))
    if (
      result.targetSkillKey !== 'visual_intelligence'
      || !sameRef(result.callRef, callRef)
    ) throw conflict('visual_intelligence_orchestra_result_scope_mismatch')
    return Object.freeze(structuredClone(result))
  }

  return Object.freeze({
    schemaVersion:
      VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RESULT_STORE_VERSION,

    async persistCreateOnly(untrustedResult: unknown) {
      const result = parseOrchestraSkillJobResult(untrustedResult)
      if (result.targetSkillKey !== 'visual_intelligence') throw conflict(
        'visual_intelligence_orchestra_result_skill_mismatch',
      )
      const body = Buffer.from(
        visualIntelligenceCanonicalJson(result),
        'utf8',
      )
      if (body.byteLength < 2 || body.byteLength > MAX_RESULT_BYTES) {
        throw conflict('visual_intelligence_orchestra_result_size_invalid')
      }
      const created = await input.objectPort.createOnly({
        objectPath: resultPath(prefix, result.callRef),
        body,
        contentSha256: rawDigest(body),
      })
      const reread = await readExact(result.callRef)
      if (!reread || orchestraDigest(reread) !== orchestraDigest(result)) {
        throw conflict('visual_intelligence_orchestra_result_reread_mismatch')
      }
      return Object.freeze({
        disposition: created === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        result: reread,
        resultRef: resultReference(reread),
      })
    },

    readExact,
  })
}

function resultReference(
  result: OrchestraSkillJobResult,
): OrchestraEvidenceRef {
  return orchestraEvidenceRef(result.resultId, result.resultDigestSha256)
}

function resultPath(
  prefix: string,
  callRef: OrchestraEvidenceRef,
): string {
  return `${prefix}/${callRef.contentHash.slice(7)}.json`
}

function requireRef(value: unknown): OrchestraEvidenceRef {
  if (!isPlainRecord(value)) throw conflict(
    'visual_intelligence_orchestra_result_call_ref_invalid',
  )
  const descriptors = Object.getOwnPropertyDescriptors(value)
  if (
    Reflect.ownKeys(value).length !== 3
    || !Object.hasOwn(value, 'id')
    || !Object.hasOwn(value, 'version')
    || !Object.hasOwn(value, 'contentHash')
    || Object.values(descriptors).some(
      (descriptor) => 'get' in descriptor || 'set' in descriptor,
    )
    || typeof value.id !== 'string'
    || !SAFE_ID.test(value.id)
    || value.id.includes('..')
    || !Number.isSafeInteger(value.version)
    || Number(value.version) < 1
    || typeof value.contentHash !== 'string'
    || !DIGEST.test(value.contentHash)
  ) throw conflict('visual_intelligence_orchestra_result_call_ref_invalid')
  return orchestraEvidenceRef(
    value.id,
    value.contentHash,
    Number(value.version),
  )
}

function parseJson(body: Buffer): unknown {
  if (body.byteLength < 2 || body.byteLength > MAX_RESULT_BYTES) {
    throw conflict('visual_intelligence_orchestra_result_size_invalid')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw conflict('visual_intelligence_orchestra_result_json_invalid')
  }
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 1_024
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !SAFE_ID.test(part))
  ) throw notReady('visual_intelligence_orchestra_result_prefix_invalid')
  return normalized
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function'
  ) throw notReady('visual_intelligence_orchestra_result_store_invalid')
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function sameRef(
  left: OrchestraEvidenceRef,
  right: OrchestraEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function rawDigest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The Orchestra-owned Visual Intelligence result store is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The immutable Orchestra-owned Visual Intelligence result conflicts with its exact reread.',
    409,
    { requiredGate },
  )
}
