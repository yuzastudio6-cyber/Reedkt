import { createHash } from 'node:crypto'

import type {
  OrchestraEvidenceRef,
  OrchestraSkillCall,
  SkillCapabilityManifest,
  SkillQualificationSnapshot,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-capability'
import type {
  VisualInspectionRequirement,
  VisualIntelligencePreparedEvidence,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  orchestraDigest,
  orchestraEvidenceRef,
  parseOrchestraSkillCall,
  parseSkillCapabilityManifest,
  parseSkillQualificationSnapshot,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-capability-contract'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertVisualIntelligencePreparedEvidenceForRequest,
} from './visual-intelligence-lifecycle-service'
import {
  parseVisualInspectionRequirement,
  visualIntelligenceCanonicalJson,
} from './visual-intelligence-contract'
import type {
  CompiledVisualIntelligenceOrchestraRequest,
  VisualIntelligenceOrchestraAuthorityRegistryPort,
  VisualIntelligenceOrchestraCompilationEvidence,
  VisualIntelligenceOrchestraCompilationPort,
} from './visual-intelligence-orchestra-invocation-compiler'
import {
  createVisualIntelligenceOrchestraInvocationCompiler,
  parseCompiledVisualIntelligenceOrchestraRequest,
  parseVisualIntelligenceOrchestraCompilationEvidence,
} from './visual-intelligence-orchestra-invocation-compiler'
import type {
  VisualIntelligenceCanonicalRequestPackageStore,
} from './visual-intelligence-canonical-request-package-store'
import {
  getVisualIntelligenceOrchestraJobDefinition,
} from './visual-intelligence-orchestra-capability-manifest'

export const VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_STORE_VERSION =
  'visual-intelligence-orchestra-dispatch-package-store-v1' as const
export const VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_VERSION =
  'visual-intelligence-orchestra-dispatch-package-v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/skill-dispatch/visual-intelligence'
const MAX_RECORD_BYTES = 32 * 1024 * 1024
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const DIGEST = /^sha256:[a-f0-9]{64}$/u

export interface VisualIntelligenceOrchestraDispatchPackageInput {
  readonly call: OrchestraSkillCall
  readonly supportRequest: SkillSupportRequest | null
  readonly manifest: SkillCapabilityManifest
  readonly qualificationSnapshot: SkillQualificationSnapshot
  readonly compilationEvidence:
    VisualIntelligenceOrchestraCompilationEvidence
  readonly preparedEvidence: VisualIntelligencePreparedEvidence
  readonly inspectionRequirement: VisualInspectionRequirement | null
  readonly orchestraDispatchAuthorityRef: OrchestraEvidenceRef
}

export interface VisualIntelligenceOrchestraDispatchPackageStore
extends VisualIntelligenceOrchestraAuthorityRegistryPort,
  VisualIntelligenceOrchestraCompilationPort {
  readonly schemaVersion:
    typeof VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_STORE_VERSION
  persistCreateOnly(
    input: VisualIntelligenceOrchestraDispatchPackageInput,
  ): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly dispatchPackageRef: OrchestraEvidenceRef
  }>
  materializeCanonicalRequestPackage(
    compiled: CompiledVisualIntelligenceOrchestraRequest,
  ): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly dispatchPackageRef: OrchestraEvidenceRef
    readonly canonicalRequestPackageRef: OrchestraEvidenceRef
  }>
}

interface DispatchPackageRecord {
  readonly schemaVersion:
    typeof VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_VERSION
  readonly storeVersion:
    typeof VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_STORE_VERSION
  readonly call: OrchestraSkillCall
  readonly supportRequest: SkillSupportRequest | null
  readonly manifestRef: OrchestraEvidenceRef
  readonly qualificationSnapshotRef: OrchestraEvidenceRef
  readonly compilationEvidence:
    VisualIntelligenceOrchestraCompilationEvidence
  readonly preparedEvidence: VisualIntelligencePreparedEvidence
  readonly inspectionRequirement: VisualInspectionRequirement | null
  readonly orchestraDispatchAuthorityRef: OrchestraEvidenceRef
  readonly exactOrchestraPlanJobAndScopeRereadRequired: true
  readonly exactManifestAndQualificationRereadRequired: true
  readonly exactMediaEvidenceAndCostRereadRequired: true
  readonly browserOrDirectSkillDispatchAccepted: false
  readonly callerPromptCredentialPathOrMediaBytesAccepted: false
  readonly directProviderTimelineArtifactOrQaAuthorityGranted: false
  readonly recordDigestSha256: string
}

export function createVisualIntelligenceOrchestraDispatchPackageStore(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly canonicalRequestPackageStore:
      VisualIntelligenceCanonicalRequestPackageStore
    readonly prefix?: string
  },
): VisualIntelligenceOrchestraDispatchPackageStore {
  assertDependencies(input)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const readDispatch = async (
    callId: string,
  ): Promise<DispatchPackageRecord | null> => {
    const body = await input.objectPort.readExact(dispatchPath(prefix, callId))
    return body ? parseDispatchRecord(parseJson(body)) : null
  }

  const store: VisualIntelligenceOrchestraDispatchPackageStore = {
    schemaVersion:
      VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_STORE_VERSION,

    async persistCreateOnly(untrusted) {
      const parsed = parseInput(untrusted)
      await assertCandidateCanCompile(parsed)
      const recordWithoutDigest = {
        schemaVersion:
          VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_VERSION,
        storeVersion:
          VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_STORE_VERSION,
        call: parsed.call,
        supportRequest: parsed.supportRequest,
        manifestRef: manifestRef(parsed.manifest),
        qualificationSnapshotRef:
          qualificationRef(parsed.qualificationSnapshot),
        compilationEvidence: parsed.compilationEvidence,
        preparedEvidence: parsed.preparedEvidence,
        inspectionRequirement: parsed.inspectionRequirement,
        orchestraDispatchAuthorityRef:
          parsed.orchestraDispatchAuthorityRef,
        exactOrchestraPlanJobAndScopeRereadRequired: true as const,
        exactManifestAndQualificationRereadRequired: true as const,
        exactMediaEvidenceAndCostRereadRequired: true as const,
        browserOrDirectSkillDispatchAccepted: false as const,
        callerPromptCredentialPathOrMediaBytesAccepted: false as const,
        directProviderTimelineArtifactOrQaAuthorityGranted: false as const,
      }
      const record: DispatchPackageRecord = {
        ...recordWithoutDigest,
        recordDigestSha256: orchestraDigest(recordWithoutDigest),
      }
      await persistExact(
        input.objectPort,
        manifestPath(prefix, record.manifestRef),
        parsed.manifest,
      )
      await persistExact(
        input.objectPort,
        qualificationPath(prefix, record.qualificationSnapshotRef),
        parsed.qualificationSnapshot,
      )
      const disposition = await persistExact(
        input.objectPort,
        dispatchPath(prefix, record.call.callId),
        record,
      )
      const reread = await readDispatch(record.call.callId)
      if (!reread || !same(record, reread)) {
        throw conflict('visual_intelligence_orchestra_dispatch_reread_mismatch')
      }
      return Object.freeze({
        disposition,
        dispatchPackageRef: dispatchRef(reread),
      })
    },

    async readExact({ manifestRef: untrustedManifestRef,
      qualificationSnapshotRef: untrustedQualificationRef }) {
      const requestedManifestRef = requireRef(untrustedManifestRef)
      const requestedQualificationRef = requireRef(
        untrustedQualificationRef,
      )
      const [manifestBody, qualificationBody] = await Promise.all([
        input.objectPort.readExact(manifestPath(prefix, requestedManifestRef)),
        input.objectPort.readExact(qualificationPath(
          prefix,
          requestedQualificationRef,
        )),
      ])
      if (!manifestBody || !qualificationBody) return null
      const qualificationSnapshot = parseSkillQualificationSnapshot(
        parseJson(qualificationBody),
      )
      const manifest = parseSkillCapabilityManifest({
        value: parseJson(manifestBody),
        qualificationSnapshot,
      })
      if (
        !sameRef(manifestRef(manifest), requestedManifestRef)
        || !sameRef(
          qualificationRef(qualificationSnapshot),
          requestedQualificationRef,
        )
      ) throw conflict(
        'visual_intelligence_orchestra_authority_ref_mismatch',
      )
      return Object.freeze({ manifest, qualificationSnapshot })
    },

    async prepareExact(value) {
      const call = parseOrchestraSkillCall(value.call)
      const supportRequest = value.supportRequest === null
        ? null
        : parseSkillSupportRequest(value.supportRequest)
      const qualificationSnapshot = parseSkillQualificationSnapshot(
        value.qualificationSnapshot,
      )
      const manifest = parseSkillCapabilityManifest({
        value: value.manifest,
        qualificationSnapshot,
      })
      const record = await readDispatch(call.callId)
      if (
        !record
        || !same(record.call, call)
        || !same(record.supportRequest, supportRequest)
        || !same(record.manifestRef, manifestRef(manifest))
        || !same(
          record.qualificationSnapshotRef,
          qualificationRef(qualificationSnapshot),
        )
        || record.compilationEvidence.admission.mode !== value.admissionMode
      ) throw notReady(
        'visual_intelligence_orchestra_dispatch_package_missing_or_stale',
      )
      return clone(record.compilationEvidence)
    },

    async materializeCanonicalRequestPackage(untrustedCompiled) {
      const compiled = parseCompiledVisualIntelligenceOrchestraRequest(
        untrustedCompiled,
      )
      const record = await readDispatch(compiled.callRef.id)
      if (
        !record
        || !sameRef(record.manifestRef, compiled.manifestRef)
        || !sameRef(
          record.qualificationSnapshotRef,
          compiled.qualificationSnapshotRef,
        )
        || record.call.callId !== compiled.request.requestId
        || record.call.callDigestSha256 !== compiled.callRef.contentHash
        || !same(record.compilationEvidence.admission,
          compiled.request.admission)
      ) throw notReady(
        'visual_intelligence_orchestra_compiled_package_not_current',
      )
      const preparedEvidence =
        assertVisualIntelligencePreparedEvidenceForRequest(
          compiled.request,
          record.preparedEvidence,
        )
      assertInspectionBinding(compiled, record.inspectionRequirement)
      const dispatchPackageRef = dispatchRef(record)
      const persisted = await input.canonicalRequestPackageStore
        .persistCreateOnly({
          ownerClass: 'canonical_orchestra_dispatch_owner',
          ownerAuthorityRef: dispatchPackageRef,
          request: compiled.request,
          preparedEvidence,
          inspectionRequirement: record.inspectionRequirement,
        })
      return Object.freeze({
        disposition: persisted.disposition,
        dispatchPackageRef,
        canonicalRequestPackageRef: persisted.packageRef,
      })
    },
  }
  return Object.freeze(store)
}

async function assertCandidateCanCompile(
  input: VisualIntelligenceOrchestraDispatchPackageInput,
): Promise<void> {
  const compiler = createVisualIntelligenceOrchestraInvocationCompiler({
    authorityRegistryPort: {
      async readExact() {
        return {
          manifest: input.manifest,
          qualificationSnapshot: input.qualificationSnapshot,
        }
      },
    },
    compilationPort: {
      async prepareExact() {
        return input.compilationEvidence
      },
    },
  })
  const compiled = await compiler.compile({
    call: input.call,
    supportRequest: input.supportRequest,
  })
  assertVisualIntelligencePreparedEvidenceForRequest(
    compiled.request,
    input.preparedEvidence,
  )
  assertInspectionBinding(compiled, input.inspectionRequirement)
}

function parseInput(
  input: VisualIntelligenceOrchestraDispatchPackageInput,
): VisualIntelligenceOrchestraDispatchPackageInput {
  const call = parseOrchestraSkillCall(input.call)
  const supportRequest = input.supportRequest === null
    ? null
    : parseSkillSupportRequest(input.supportRequest)
  const qualificationSnapshot = parseSkillQualificationSnapshot(
    input.qualificationSnapshot,
  )
  const manifest = parseSkillCapabilityManifest({
    value: input.manifest,
    qualificationSnapshot,
  })
  const orchestraDispatchAuthorityRef = requireRef(
    input.orchestraDispatchAuthorityRef,
  )
  const admissionMode = getVisualIntelligenceOrchestraJobDefinition(
    call.jobType,
  ).admissionClassByPhase[call.phase]
  if (!admissionMode) throw notReady(
    'visual_intelligence_orchestra_phase_not_supported',
  )
  const compilationEvidence =
    parseVisualIntelligenceOrchestraCompilationEvidence({
      call,
      manifest,
      qualificationSnapshot,
      admissionMode,
      evidence: input.compilationEvidence,
    })
  const preparedEvidence = clone(input.preparedEvidence)
  const inspectionRequirement = input.inspectionRequirement === null
    ? null
    : parseVisualInspectionRequirement(input.inspectionRequirement)
  if (
    call.targetSkillKey !== 'visual_intelligence'
    || !sameRef(call.manifestRef, manifestRef(manifest))
    || !sameRef(
      call.qualificationSnapshotRef,
      qualificationRef(qualificationSnapshot),
    )
    || !sameRef(orchestraDispatchAuthorityRef, call.orchestraJobRef)
    || compilationEvidence.schemaVersion !==
      'visual-intelligence-orchestra-compilation-evidence-v1'
    || !sameRef(compilationEvidence.callRef,
      orchestraEvidenceRef(call.callId, call.callDigestSha256))
    || (call.requestedBy.kind === 'orchestra') !==
      (supportRequest === null)
    || (supportRequest !== null && (
      call.requestedBy.kind !== 'skill'
      || !sameRef(
        call.requestedBy.supportRequestRef,
        orchestraEvidenceRef(
          supportRequest.requestId,
          supportRequest.requestDigestSha256,
        ),
      )
    ))
  ) throw notReady(
    'visual_intelligence_orchestra_dispatch_input_invalid',
  )
  return Object.freeze({
    call,
    supportRequest,
    manifest,
    qualificationSnapshot,
    compilationEvidence,
    preparedEvidence,
    inspectionRequirement,
    orchestraDispatchAuthorityRef,
  })
}

function parseDispatchRecord(value: unknown): DispatchPackageRecord {
  if (!isPlainRecord(value)) {
    throw conflict('visual_intelligence_orchestra_dispatch_record_invalid')
  }
  const keys = [
    'schemaVersion', 'storeVersion', 'call', 'supportRequest', 'manifestRef',
    'qualificationSnapshotRef', 'compilationEvidence', 'preparedEvidence',
    'inspectionRequirement', 'orchestraDispatchAuthorityRef',
    'exactOrchestraPlanJobAndScopeRereadRequired',
    'exactManifestAndQualificationRereadRequired',
    'exactMediaEvidenceAndCostRereadRequired',
    'browserOrDirectSkillDispatchAccepted',
    'callerPromptCredentialPathOrMediaBytesAccepted',
    'directProviderTimelineArtifactOrQaAuthorityGranted',
    'recordDigestSha256',
  ]
  if (
    Reflect.ownKeys(value).length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || value.schemaVersion !==
      VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_VERSION
    || value.storeVersion !==
      VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_STORE_VERSION
    || value.exactOrchestraPlanJobAndScopeRereadRequired !== true
    || value.exactManifestAndQualificationRereadRequired !== true
    || value.exactMediaEvidenceAndCostRereadRequired !== true
    || value.browserOrDirectSkillDispatchAccepted !== false
    || value.callerPromptCredentialPathOrMediaBytesAccepted !== false
    || value.directProviderTimelineArtifactOrQaAuthorityGranted !== false
    || typeof value.recordDigestSha256 !== 'string'
    || !DIGEST.test(value.recordDigestSha256)
    || value.recordDigestSha256 !== orchestraDigest(
      omit(value, 'recordDigestSha256'),
    )
  ) throw conflict(
    'visual_intelligence_orchestra_dispatch_record_invalid',
  )
  const call = parseOrchestraSkillCall(value.call)
  const supportRequest = value.supportRequest === null
    ? null
    : parseSkillSupportRequest(value.supportRequest)
  const manifestReference = requireRef(value.manifestRef)
  const qualificationReference = requireRef(value.qualificationSnapshotRef)
  const orchestraDispatchAuthorityRef = requireRef(
    value.orchestraDispatchAuthorityRef,
  )
  const inspectionRequirement = value.inspectionRequirement === null
    ? null
    : parseVisualInspectionRequirement(value.inspectionRequirement)
  return Object.freeze({
    ...value,
    call,
    supportRequest,
    manifestRef: manifestReference,
    qualificationSnapshotRef: qualificationReference,
    compilationEvidence: clone(value.compilationEvidence),
    preparedEvidence: clone(value.preparedEvidence),
    inspectionRequirement,
    orchestraDispatchAuthorityRef,
  }) as unknown as DispatchPackageRecord
}

function assertInspectionBinding(
  compiled: CompiledVisualIntelligenceOrchestraRequest,
  requirement: VisualInspectionRequirement | null,
): void {
  if (compiled.operation !== 'inspect_edit') {
    if (requirement !== null) throw notReady(
      'visual_intelligence_orchestra_unexpected_inspection_requirement',
    )
    return
  }
  const admission = compiled.request.admission
  if (
    !requirement
    || requirement.profile !== compiled.profile
    || admission.mode !== 'approved_edit_inspection'
    || !same(requirement.requestedRanges,
      compiled.request.requestedRanges)
    || !same(requirement.expectedOutcomeRefs,
      compiled.request.expectedOutcomeRefs)
    || !admission.workNodeRefs.some(
      (reference) => reference.id === requirement.owningWorkNodeId,
    )
  ) throw notReady(
    'visual_intelligence_orchestra_inspection_requirement_mismatch',
  )
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
): Promise<'created' | 'identical_replay'> {
  const body = Buffer.from(visualIntelligenceCanonicalJson(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw notReady('visual_intelligence_orchestra_dispatch_record_too_large')
  }
  const created = await port.createOnly({
    objectPath,
    body,
    contentSha256: rawDigest(body),
  })
  const reread = await port.readExact(objectPath)
  if (!reread || !reread.equals(body)) throw conflict(
    'visual_intelligence_orchestra_dispatch_create_only_conflict',
  )
  return created === 'created' ? 'created' : 'identical_replay'
}

function dispatchRef(record: DispatchPackageRecord): OrchestraEvidenceRef {
  return orchestraEvidenceRef(
    `vi-orchestra-dispatch-${record.call.callDigestSha256.slice(7, 39)}`,
    record.recordDigestSha256,
  )
}

function manifestRef(value: SkillCapabilityManifest): OrchestraEvidenceRef {
  return orchestraEvidenceRef(value.manifestId, value.manifestDigestSha256)
}

function qualificationRef(
  value: SkillQualificationSnapshot,
): OrchestraEvidenceRef {
  return orchestraEvidenceRef(value.snapshotId, value.snapshotDigestSha256)
}

function dispatchPath(prefix: string, callId: string): string {
  if (!SAFE_ID.test(callId) || callId.includes('..')) throw notReady(
    'visual_intelligence_orchestra_call_id_invalid',
  )
  return `${prefix}/calls/${rawDigest(callId)}.json`
}

function manifestPath(prefix: string, reference: OrchestraEvidenceRef): string {
  return `${prefix}/manifests/${reference.contentHash.slice(7)}.json`
}

function qualificationPath(
  prefix: string,
  reference: OrchestraEvidenceRef,
): string {
  return `${prefix}/qualifications/${reference.contentHash.slice(7)}.json`
}

function requireRef(value: unknown): OrchestraEvidenceRef {
  if (
    !isPlainRecord(value)
    || Reflect.ownKeys(value).length !== 3
    || typeof value.id !== 'string'
    || !SAFE_ID.test(value.id)
    || value.id.includes('..')
    || !Number.isSafeInteger(value.version)
    || Number(value.version) < 1
    || typeof value.contentHash !== 'string'
    || !DIGEST.test(value.contentHash)
  ) throw notReady('visual_intelligence_orchestra_evidence_ref_invalid')
  return orchestraEvidenceRef(
    value.id,
    value.contentHash,
    Number(value.version),
  )
}

function normalizePrefix(value: string): string {
  const normalized = value.replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.includes('..')
    || !/^[A-Za-z0-9][A-Za-z0-9._/:-]{0,1023}$/u.test(normalized)
  ) throw notReady('visual_intelligence_orchestra_prefix_invalid')
  return normalized
}

function assertDependencies(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  canonicalRequestPackageStore: VisualIntelligenceCanonicalRequestPackageStore
}): void {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
    || typeof input.canonicalRequestPackageStore?.persistCreateOnly
      !== 'function'
  ) throw notReady('visual_intelligence_orchestra_store_dependency_invalid')
}

function parseJson(body: Buffer): unknown {
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw conflict('visual_intelligence_orchestra_record_size_invalid')
  }
  try {
    return JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('visual_intelligence_orchestra_record_json_invalid')
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  return (prototype === Object.prototype || prototype === null)
    && Reflect.ownKeys(value).every((key) => typeof key === 'string')
    && Object.values(descriptors).every(
      (descriptor) => !('get' in descriptor) && !('set' in descriptor),
    )
}

function omit(
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const result = { ...value }
  Reflect.deleteProperty(result, key)
  return result
}

function clone<T>(value: T): T {
  return JSON.parse(visualIntelligenceCanonicalJson(value)) as T
}

function same(left: unknown, right: unknown): boolean {
  return visualIntelligenceCanonicalJson(left)
    === visualIntelligenceCanonicalJson(right)
}

function sameRef(
  left: OrchestraEvidenceRef,
  right: OrchestraEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function rawDigest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The Orchestra-owned Visual Intelligence dispatch package is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The immutable Orchestra-owned Visual Intelligence dispatch package conflicts with its exact reread.',
    409,
    { requiredGate },
  )
}
