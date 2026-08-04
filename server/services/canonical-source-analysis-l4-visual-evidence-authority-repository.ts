import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalSourceTranscriptOrchestraReadScope,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  canonicalSourceLedSourceFrameAuthoritySchema,
  createCanonicalSourceLedSourceFrameAuthority,
} from './canonical-source-led-content-analysis-evidence'
import {
  assertCanonicalSourceAnalysisL4VisualEvidenceResult,
  type CanonicalSourceAnalysisL4VisualEvidenceResult,
} from './canonical-source-analysis-l4-visual-evidence-repository'
import {
  assertCanonicalSourceAnalysisL4VisualEvidenceAdmission,
  assertCanonicalSourceAnalysisL4VisualEvidenceRelease,
  assertCanonicalSourceAnalysisL4VisualEvidenceTrigger,
  type CanonicalSourceAnalysisL4VisualEvidenceAdmission,
  type CanonicalSourceAnalysisL4VisualEvidenceAdmissionReadPort,
  type CanonicalSourceAnalysisL4VisualEvidenceRelease,
  type CanonicalSourceAnalysisL4VisualEvidenceReleaseReadPort,
  type CanonicalSourceAnalysisL4VisualEvidenceTerminalReadPort,
  type CanonicalSourceAnalysisL4VisualEvidenceTrigger,
} from './canonical-source-analysis-l4-visual-evidence-attempt-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION =
  'canonical-source-analysis-l4-visual-evidence-authority-repository-v1' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CLOUD_RUN_OPERATION_AUTHORITY_PORT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-cloud-run-operation-authority-port-v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/source-analysis-l4-visual-evidence-authorities'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const RAW_SHA256 = /^[a-f0-9]{64}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u

interface AdmissionRecord {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION
  readonly recordKind: 'admission'
  readonly triggerRef: VisualIntelligenceEvidenceRef
  readonly scopeDigestSha256: string
  readonly preparedRequestContentRef: VisualIntelligenceEvidenceRef
  readonly admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
  readonly recordDigestSha256: string
}

interface ReleaseRecord {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION
  readonly recordKind: 'release'
  readonly release: CanonicalSourceAnalysisL4VisualEvidenceRelease
  readonly recordDigestSha256: string
}

interface TerminalRecord {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION
  readonly recordKind: 'terminal'
  readonly invocationId: string
  readonly envelopeHash: string
  readonly admissionRef: VisualIntelligenceEvidenceRef
  readonly releaseRef: VisualIntelligenceEvidenceRef
  readonly result: CanonicalSourceAnalysisL4VisualEvidenceResult
  readonly recordDigestSha256: string
}

export interface CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationRecord {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION
  readonly recordKind: 'cloud_run_operation'
  readonly invocationId: string
  readonly releaseRef: VisualIntelligenceEvidenceRef
  readonly cloudRunJobResource: string
  readonly operationResource: string
  readonly cloudRunOperationRef: VisualIntelligenceEvidenceRef
  readonly cloudRunRunRequestAccepted: true
  readonly workerOutcomeAtAcceptance: 'unknown'
  readonly providerInferenceOutcomeAtAcceptance: 'unknown'
  readonly customerCreditMutated: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
  readonly observedAt: string
  readonly recordDigestSha256: string
}

export interface CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationAuthorityPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CLOUD_RUN_OPERATION_AUTHORITY_PORT_VERSION
  persistAcceptedOperationCreateOnly(input: Readonly<{
    invocationId: string
    releaseRef: VisualIntelligenceEvidenceRef
    cloudRunJobResource: string
    operationResource: string
    observedAt: string
  }>): Promise<Readonly<{
    disposition: 'created' | 'identical_replay'
    cloudRunOperationRef: VisualIntelligenceEvidenceRef
    repositoryRecordRef: VisualIntelligenceEvidenceRef
    exactCreateOnlyRereadVerified: true
    cloudRunRunRequestAccepted: true
    workerOutcomeAtAcceptance: 'unknown'
    customerCreditMutated: false
    publicDeliveryGranted: false
    productionAuthorityGranted: false
  }>>
  readExactAcceptedOperation(input: Readonly<{
    invocationId: string
    releaseRef: VisualIntelligenceEvidenceRef
  }>): Promise<
    CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationRecord | null
  >
}

export interface CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository {
  readonly repositoryVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION
  readonly admissionReadPort:
    CanonicalSourceAnalysisL4VisualEvidenceAdmissionReadPort
  readonly releaseReadPort:
    CanonicalSourceAnalysisL4VisualEvidenceReleaseReadPort
  readonly terminalReadPort:
    CanonicalSourceAnalysisL4VisualEvidenceTerminalReadPort
  readonly cloudRunOperationAuthorityPort:
    CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationAuthorityPort
  readExactAdmission(input: Readonly<{
    triggerRef: VisualIntelligenceEvidenceRef
    admissionRef: VisualIntelligenceEvidenceRef
  }>): Promise<CanonicalSourceAnalysisL4VisualEvidenceAdmission | null>
  readExactRelease(
    releaseRef: VisualIntelligenceEvidenceRef,
  ): Promise<CanonicalSourceAnalysisL4VisualEvidenceRelease | null>
  persistAdmissionCreateOnly(input: Readonly<{
    trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger
    scope: CanonicalSourceTranscriptOrchestraReadScope
    preparedRequestContentRef: VisualIntelligenceEvidenceRef
    admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
  }>): Promise<CanonicalAuthorityPersistenceResult>
  persistReleaseCreateOnly(input: Readonly<{
    release: CanonicalSourceAnalysisL4VisualEvidenceRelease
  }>): Promise<CanonicalAuthorityPersistenceResult>
  persistTerminalCreateOnly(input: Readonly<{
    invocationId: string
    envelopeHash: string
    admissionRef: VisualIntelligenceEvidenceRef
    releaseRef: VisualIntelligenceEvidenceRef
    result: CanonicalSourceAnalysisL4VisualEvidenceResult
  }>): Promise<CanonicalAuthorityPersistenceResult>
}

export interface CanonicalAuthorityPersistenceResult {
  readonly disposition: 'created' | 'identical_replay'
  readonly repositoryRecordRef: VisualIntelligenceEvidenceRef
  readonly exactCreateOnlyRereadVerified: true
  readonly cloudJobStarted: false
  readonly providerCalled: false
  readonly customerCreditMutated: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
}

/**
 * One durable store owns the L4 evidence admission, immutable release, and
 * terminal evidence projections. The execution owner can only reread these
 * records; callers cannot inject alternate ports into the production runtime.
 */
export function
createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw notReady('source_visual_evidence_authority_object_port_invalid')
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const admissionReadPort = Object.freeze({
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-admission-read-port-v1' as const,
    async rereadAdmittedExecution(untrusted) {
      assertPlainSerializedData(
        untrusted,
        'source_visual_evidence_admission_read_input',
      )
      const binding = parseAdmissionReadBinding(untrusted)
      const record = await readRecord({
        objectPort: input.objectPort,
        path: admissionPath(prefix, binding.trigger.requestId),
        parse: parseAdmissionRecord,
      })
      if (!record) return null
      assertAdmissionRecordMatches(record, binding)
      return structuredClone(record.admission)
    },
  } satisfies CanonicalSourceAnalysisL4VisualEvidenceAdmissionReadPort)
  const releaseReadPort = Object.freeze({
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-release-read-port-v1' as const,
    async rereadPrivateRelease(untrusted) {
      assertPlainSerializedData(
        untrusted,
        'source_visual_evidence_release_read_input',
      )
      const admission = assertCanonicalSourceAnalysisL4VisualEvidenceAdmission(
        untrusted.admission,
      )
      const record = await readRecord({
        objectPort: input.objectPort,
        path: releasePath(prefix, admission.runtimeReleaseRef),
        parse: parseReleaseRecord,
      })
      if (!record) return null
      if (!sameRef(record.release.releaseRef, admission.runtimeReleaseRef)) {
        throw conflict('source_visual_evidence_release_record_mismatch')
      }
      return structuredClone(record.release)
    },
  } satisfies CanonicalSourceAnalysisL4VisualEvidenceReleaseReadPort)
  const terminalReadPort = Object.freeze({
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-terminal-read-port-v1' as const,
    async readCompleted(untrusted) {
      assertPlainSerializedData(
        untrusted,
        'source_visual_evidence_terminal_read_input',
      )
      const binding = parseTerminalReadBinding(untrusted)
      const record = await readRecord({
        objectPort: input.objectPort,
        path: terminalPath(prefix, binding.invocationId),
        parse: parseTerminalRecord,
      })
      if (!record) return null
      assertTerminalRecordMatches(record, binding)
      return structuredClone(record.result)
    },
  } satisfies CanonicalSourceAnalysisL4VisualEvidenceTerminalReadPort)
  const cloudRunOperationAuthorityPort = Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CLOUD_RUN_OPERATION_AUTHORITY_PORT_VERSION,
    async persistAcceptedOperationCreateOnly(untrusted) {
      assertPlainSerializedData(
        untrusted,
        'source_visual_evidence_cloud_run_operation_persistence_input',
      )
      const binding = parseCloudRunOperationBinding(untrusted)
      const record = cloudRunOperationRecord(binding)
      const persistence = await persistAndReread({
        objectPort: input.objectPort,
        path: cloudRunOperationPath(prefix, binding.invocationId),
        record,
        parse: parseCloudRunOperationRecord,
      })
      return Object.freeze({
        disposition: persistence.disposition,
        cloudRunOperationRef: cloneRef(record.cloudRunOperationRef),
        repositoryRecordRef: cloneRef(persistence.repositoryRecordRef),
        exactCreateOnlyRereadVerified: true as const,
        cloudRunRunRequestAccepted: true as const,
        workerOutcomeAtAcceptance: 'unknown' as const,
        customerCreditMutated: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },
    async readExactAcceptedOperation(untrusted) {
      assertPlainSerializedData(
        untrusted,
        'source_visual_evidence_cloud_run_operation_read_input',
      )
      const binding = parseCloudRunOperationReadBinding(untrusted)
      const record = await readRecord({
        objectPort: input.objectPort,
        path: cloudRunOperationPath(prefix, binding.invocationId),
        parse: parseCloudRunOperationRecord,
      })
      if (!record) return null
      if (
        record.invocationId !== binding.invocationId
        || !sameRef(record.releaseRef, binding.releaseRef)
      ) throw conflict('source_visual_evidence_cloud_run_operation_mismatch')
      return structuredClone(record)
    },
  } satisfies
    CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationAuthorityPort)

  return Object.freeze({
    repositoryVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION,
    admissionReadPort,
    releaseReadPort,
    terminalReadPort,
    cloudRunOperationAuthorityPort,
    async readExactAdmission(untrusted: Readonly<{
      triggerRef: VisualIntelligenceEvidenceRef
      admissionRef: VisualIntelligenceEvidenceRef
    }>) {
      assertPlainSerializedData(
        untrusted,
        'source_visual_evidence_exact_admission_read_input',
      )
      const trigger = parseRef(untrusted.triggerRef)
      const admission = parseRef(untrusted.admissionRef)
      const record = await readRecord({
        objectPort: input.objectPort,
        path: admissionPath(prefix, trigger.id),
        parse: parseAdmissionRecord,
      })
      if (!record) return null
      if (
        !sameRef(record.triggerRef, trigger)
        || !sameRef(admissionReference(record.admission), admission)
      ) throw conflict('source_visual_evidence_admission_record_mismatch')
      return structuredClone(record.admission)
    },
    async readExactRelease(
      untrustedReleaseRef: VisualIntelligenceEvidenceRef,
    ) {
      const releaseRef = parseRef(untrustedReleaseRef)
      const record = await readRecord({
        objectPort: input.objectPort,
        path: releasePath(prefix, releaseRef),
        parse: parseReleaseRecord,
      })
      if (!record) return null
      if (!sameRef(record.release.releaseRef, releaseRef)) {
        throw conflict('source_visual_evidence_release_record_mismatch')
      }
      return structuredClone(record.release)
    },
    async persistAdmissionCreateOnly(
      untrusted: Parameters<
        CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository[
          'persistAdmissionCreateOnly'
        ]
      >[0],
    ) {
      assertPlainSerializedData(
        untrusted,
        'source_visual_evidence_admission_persistence_input',
      )
      const binding = parseAdmissionBinding(untrusted)
      const record = admissionRecord(binding)
      return persistAndReread({
        objectPort: input.objectPort,
        path: admissionPath(prefix, binding.trigger.requestId),
        record,
        parse: parseAdmissionRecord,
      })
    },
    async persistReleaseCreateOnly(
      untrusted: Parameters<
        CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository[
          'persistReleaseCreateOnly'
        ]
      >[0],
    ) {
      assertPlainSerializedData(
        untrusted,
        'source_visual_evidence_release_persistence_input',
      )
      const release = assertCanonicalSourceAnalysisL4VisualEvidenceRelease(
        untrusted.release,
      )
      return persistAndReread({
        objectPort: input.objectPort,
        path: releasePath(prefix, release.releaseRef),
        record: releaseRecord(release),
        parse: parseReleaseRecord,
      })
    },
    async persistTerminalCreateOnly(
      untrusted: Parameters<
        CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository[
          'persistTerminalCreateOnly'
        ]
      >[0],
    ) {
      assertPlainSerializedData(
        untrusted,
        'source_visual_evidence_terminal_persistence_input',
      )
      const binding = parseTerminalBinding(untrusted)
      return persistAndReread({
        objectPort: input.objectPort,
        path: terminalPath(prefix, binding.invocationId),
        record: terminalRecord(binding),
        parse: parseTerminalRecord,
      })
    },
  })
}

function admissionRecord(input: AdmissionBinding): AdmissionRecord {
  const payload = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION,
    recordKind: 'admission' as const,
    triggerRef: triggerRef(input.trigger),
    scopeDigestSha256: sha256AuthorityValue(input.scope),
    preparedRequestContentRef: cloneRef(input.preparedRequestContentRef),
    admission: input.admission,
  }
  return Object.freeze({
    ...payload,
    recordDigestSha256: sha256AuthorityValue(payload),
  })
}

function releaseRecord(
  release: CanonicalSourceAnalysisL4VisualEvidenceRelease,
): ReleaseRecord {
  const payload = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION,
    recordKind: 'release' as const,
    release,
  }
  return Object.freeze({
    ...payload,
    recordDigestSha256: sha256AuthorityValue(payload),
  })
}

function terminalRecord(input: TerminalBinding): TerminalRecord {
  const payload = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION,
    recordKind: 'terminal' as const,
    invocationId: input.invocationId,
    envelopeHash: input.envelopeHash,
    admissionRef: cloneRef(input.admissionRef),
    releaseRef: cloneRef(input.releaseRef),
    result: input.result,
  }
  return Object.freeze({
    ...payload,
    recordDigestSha256: sha256AuthorityValue(payload),
  })
}

interface CloudRunOperationReadBinding {
  invocationId: string
  releaseRef: VisualIntelligenceEvidenceRef
}

interface CloudRunOperationBinding extends CloudRunOperationReadBinding {
  cloudRunJobResource: string
  operationResource: string
  observedAt: string
}

function cloudRunOperationRecord(
  input: CloudRunOperationBinding,
): CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationRecord {
  const cloudRunOperationRef = operationRef(input)
  const payload = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION,
    recordKind: 'cloud_run_operation' as const,
    invocationId: input.invocationId,
    releaseRef: cloneRef(input.releaseRef),
    cloudRunJobResource: input.cloudRunJobResource,
    operationResource: input.operationResource,
    cloudRunOperationRef,
    cloudRunRunRequestAccepted: true as const,
    workerOutcomeAtAcceptance: 'unknown' as const,
    providerInferenceOutcomeAtAcceptance: 'unknown' as const,
    customerCreditMutated: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
    observedAt: input.observedAt,
  }
  return Object.freeze({
    ...payload,
    recordDigestSha256: sha256AuthorityValue(payload),
  })
}

function parseAdmissionRecord(value: unknown): AdmissionRecord {
  const record = exactRecord(value, [
    'schemaVersion', 'recordKind', 'triggerRef', 'scopeDigestSha256',
    'preparedRequestContentRef', 'admission', 'recordDigestSha256',
  ])
  const trigger = parseRef(record.triggerRef)
  const prepared = parseRef(record.preparedRequestContentRef)
  const admission = assertCanonicalSourceAnalysisL4VisualEvidenceAdmission(
    record.admission,
  )
  const payload = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION,
    recordKind: 'admission' as const,
    triggerRef: trigger,
    scopeDigestSha256: requireRawSha(record.scopeDigestSha256),
    preparedRequestContentRef: prepared,
    admission,
  }
  assertRecordDigest(record, payload)
  return Object.freeze({
    ...payload,
    recordDigestSha256: record.recordDigestSha256 as string,
  })
}

function parseReleaseRecord(value: unknown): ReleaseRecord {
  const record = exactRecord(value, [
    'schemaVersion', 'recordKind', 'release', 'recordDigestSha256',
  ])
  const release = assertCanonicalSourceAnalysisL4VisualEvidenceRelease(
    record.release,
  )
  const payload = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION,
    recordKind: 'release' as const,
    release,
  }
  assertRecordDigest(record, payload)
  return Object.freeze({
    ...payload,
    recordDigestSha256: record.recordDigestSha256 as string,
  })
}

function parseTerminalRecord(value: unknown): TerminalRecord {
  const record = exactRecord(value, [
    'schemaVersion', 'recordKind', 'invocationId', 'envelopeHash',
    'admissionRef', 'releaseRef', 'result', 'recordDigestSha256',
  ])
  const result = assertCanonicalSourceAnalysisL4VisualEvidenceResult(
    record.result,
  )
  const payload = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION,
    recordKind: 'terminal' as const,
    invocationId: requireSafeId(record.invocationId),
    envelopeHash: requireRawSha(record.envelopeHash),
    admissionRef: parseRef(record.admissionRef),
    releaseRef: parseRef(record.releaseRef),
    result,
  }
  assertRecordDigest(record, payload)
  return Object.freeze({
    ...payload,
    recordDigestSha256: record.recordDigestSha256 as string,
  })
}

function parseCloudRunOperationRecord(
  value: unknown,
): CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationRecord {
  const record = exactRecord(value, [
    'schemaVersion', 'recordKind', 'invocationId', 'releaseRef',
    'cloudRunJobResource', 'operationResource', 'cloudRunOperationRef',
    'cloudRunRunRequestAccepted', 'workerOutcomeAtAcceptance',
    'providerInferenceOutcomeAtAcceptance', 'customerCreditMutated',
    'publicDeliveryGranted', 'productionAuthorityGranted', 'observedAt',
    'recordDigestSha256',
  ])
  const binding = parseCloudRunOperationBinding({
    invocationId: record.invocationId as string,
    releaseRef: record.releaseRef as VisualIntelligenceEvidenceRef,
    cloudRunJobResource: record.cloudRunJobResource as string,
    operationResource: record.operationResource as string,
    observedAt: record.observedAt as string,
  })
  const payload = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION,
    recordKind: 'cloud_run_operation' as const,
    invocationId: binding.invocationId,
    releaseRef: binding.releaseRef,
    cloudRunJobResource: binding.cloudRunJobResource,
    operationResource: binding.operationResource,
    cloudRunOperationRef: parseRef(record.cloudRunOperationRef),
    cloudRunRunRequestAccepted: record.cloudRunRunRequestAccepted,
    workerOutcomeAtAcceptance: record.workerOutcomeAtAcceptance,
    providerInferenceOutcomeAtAcceptance:
      record.providerInferenceOutcomeAtAcceptance,
    customerCreditMutated: record.customerCreditMutated,
    publicDeliveryGranted: record.publicDeliveryGranted,
    productionAuthorityGranted: record.productionAuthorityGranted,
    observedAt: binding.observedAt,
  }
  if (
    record.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION
    || record.recordKind !== 'cloud_run_operation'
    || record.cloudRunRunRequestAccepted !== true
    || record.workerOutcomeAtAcceptance !== 'unknown'
    || record.providerInferenceOutcomeAtAcceptance !== 'unknown'
    || record.customerCreditMutated !== false
    || record.publicDeliveryGranted !== false
    || record.productionAuthorityGranted !== false
    || !sameRef(payload.cloudRunOperationRef, operationRef(binding))
  ) throw conflict('source_visual_evidence_cloud_run_operation_invalid')
  assertRecordDigest(record, payload)
  return Object.freeze({
    ...payload,
    cloudRunRunRequestAccepted: true,
    workerOutcomeAtAcceptance: 'unknown',
    providerInferenceOutcomeAtAcceptance: 'unknown',
    customerCreditMutated: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
    recordDigestSha256: record.recordDigestSha256 as string,
  })
}

interface AdmissionReadBinding {
  trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger
  scope: CanonicalSourceTranscriptOrchestraReadScope
  preparedRequestContentRef: VisualIntelligenceEvidenceRef
}
interface AdmissionBinding extends AdmissionReadBinding {
  admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
}
interface TerminalReadBinding {
  invocationId: string
  envelopeHash: string
  admissionRef: VisualIntelligenceEvidenceRef
  releaseRef: VisualIntelligenceEvidenceRef
}
interface TerminalBinding extends TerminalReadBinding {
  result: CanonicalSourceAnalysisL4VisualEvidenceResult
}

function parseAdmissionReadBinding(
  value: AdmissionReadBinding,
): AdmissionReadBinding {
  return Object.freeze({
    trigger: assertCanonicalSourceAnalysisL4VisualEvidenceTrigger(
      value.trigger,
    ),
    scope: parseScope(value.scope),
    preparedRequestContentRef: parseRef(value.preparedRequestContentRef),
  })
}

function parseAdmissionBinding(value: AdmissionBinding): AdmissionBinding {
  const binding = parseAdmissionReadBinding(value)
  const admission = assertCanonicalSourceAnalysisL4VisualEvidenceAdmission(
    value.admission,
  )
  assertAdmissionRecordMatches(admissionRecord({
    ...binding,
    admission,
  }), binding)
  return Object.freeze({ ...binding, admission })
}

function parseTerminalReadBinding(
  value: TerminalReadBinding,
): TerminalReadBinding {
  return Object.freeze({
    invocationId: requireSafeId(value.invocationId),
    envelopeHash: requireRawSha(value.envelopeHash),
    admissionRef: parseRef(value.admissionRef),
    releaseRef: parseRef(value.releaseRef),
  })
}

function parseTerminalBinding(value: TerminalBinding): TerminalBinding {
  const binding = parseTerminalReadBinding(value)
  const result = assertCanonicalSourceAnalysisL4VisualEvidenceResult(
    value.result,
  )
  if (
    result.invocationId !== binding.invocationId
    || !sameRef(result.admissionRef, binding.admissionRef)
    || !sameRef(result.runtimeReleaseRef, binding.releaseRef)
  ) throw conflict('source_visual_evidence_terminal_binding_invalid')
  return Object.freeze({ ...binding, result })
}

function parseCloudRunOperationReadBinding(
  value: CloudRunOperationReadBinding,
): CloudRunOperationReadBinding {
  return Object.freeze({
    invocationId: requireSafeId(value.invocationId),
    releaseRef: parseRef(value.releaseRef),
  })
}

function parseCloudRunOperationBinding(
  value: CloudRunOperationBinding,
): CloudRunOperationBinding {
  const binding = parseCloudRunOperationReadBinding(value)
  const cloudRunJobResource = requireCloudRunJobResource(
    value.cloudRunJobResource,
  )
  const operationResource = requireCloudRunOperationResource(
    value.operationResource,
  )
  if (
    cloudRunJobResource.split('/')[3] !== operationResource.split('/')[3]
  ) throw conflict('source_visual_evidence_cloud_run_region_mismatch')
  if (
    typeof value.observedAt !== 'string'
    || !Number.isFinite(Date.parse(value.observedAt))
  ) throw conflict('source_visual_evidence_cloud_run_time_invalid')
  return Object.freeze({
    ...binding,
    cloudRunJobResource,
    operationResource,
    observedAt: value.observedAt,
  })
}

function operationRef(
  input: CloudRunOperationBinding,
): VisualIntelligenceEvidenceRef {
  const digest = sha256AuthorityValue({
    invocationId: input.invocationId,
    releaseRef: input.releaseRef,
    cloudRunJobResource: input.cloudRunJobResource,
    operationResource: input.operationResource,
  })
  return Object.freeze({
    id: `source-visual-cloud-operation-${digest.slice(0, 32)}`,
    version: 1,
    contentHash: `sha256:${digest}`,
  })
}

function assertAdmissionRecordMatches(
  record: AdmissionRecord,
  expected: AdmissionReadBinding,
): void {
  if (
    !sameRef(record.triggerRef, triggerRef(expected.trigger))
    || record.scopeDigestSha256 !== sha256AuthorityValue(expected.scope)
    || !sameRef(record.preparedRequestContentRef,
      expected.preparedRequestContentRef)
    || !sameRef(record.admission.triggerRef, record.triggerRef)
    || record.admission.scopeDigestSha256 !== record.scopeDigestSha256
    || !sameRef(record.admission.preparedRequestContentRef,
      record.preparedRequestContentRef)
  ) throw conflict('source_visual_evidence_admission_record_mismatch')
}

function assertTerminalRecordMatches(
  record: TerminalRecord,
  expected: TerminalReadBinding,
): void {
  if (
    record.invocationId !== expected.invocationId
    || record.envelopeHash !== expected.envelopeHash
    || !sameRef(record.admissionRef, expected.admissionRef)
    || !sameRef(record.releaseRef, expected.releaseRef)
    || record.result.invocationId !== expected.invocationId
    || !sameRef(record.result.admissionRef, expected.admissionRef)
    || !sameRef(record.result.runtimeReleaseRef, expected.releaseRef)
  ) throw conflict('source_visual_evidence_terminal_record_mismatch')
}

async function persistAndReread<T extends { recordDigestSha256: string }>(
  input: Readonly<{
    objectPort: CanonicalCreateOnlyJsonObjectPort
    path: string
    record: T
    parse: (value: unknown) => T
  }>,
): Promise<CanonicalAuthorityPersistenceResult> {
  const body = Buffer.from(stableAuthorityStringify(input.record), 'utf8')
  if (body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('source_visual_evidence_authority_record_too_large')
  }
  const disposition = await input.objectPort.createOnly({
    objectPath: input.path,
    body,
    contentSha256: rawBufferSha256(body),
  })
  const reread = await readRecord(input)
  if (
    !reread
    || stableAuthorityStringify(reread) !==
      stableAuthorityStringify(input.record)
  ) throw conflict('source_visual_evidence_authority_reread_mismatch')
  return Object.freeze({
    disposition: disposition === 'created'
      ? 'created' as const
      : 'identical_replay' as const,
    repositoryRecordRef: Object.freeze({
      id: `source-visual-authority-${
        input.record.recordDigestSha256.slice(0, 32)}`,
      version: 1,
      contentHash: `sha256:${rawBufferSha256(body)}`,
    }),
    exactCreateOnlyRereadVerified: true as const,
    cloudJobStarted: false as const,
    providerCalled: false as const,
    customerCreditMutated: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  })
}

async function readRecord<T>(input: Readonly<{
  objectPort: CanonicalCreateOnlyJsonObjectPort
  path: string
  parse: (value: unknown) => T
}>): Promise<T | null> {
  const body = await input.objectPort.readExact(input.path)
  if (!body) return null
  if (
    !Buffer.isBuffer(body)
    || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES
  ) throw conflict('source_visual_evidence_authority_bytes_invalid')
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('source_visual_evidence_authority_json_invalid')
  }
  const parsed = input.parse(value)
  if (body.toString('utf8') !== stableAuthorityStringify(parsed)) {
    throw conflict('source_visual_evidence_authority_not_canonical')
  }
  return parsed
}

function assertRecordDigest(
  record: Record<string, unknown>,
  payload: unknown,
): void {
  if (
    record.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_AUTHORITY_REPOSITORY_VERSION
    || typeof record.recordDigestSha256 !== 'string'
    || !RAW_SHA256.test(record.recordDigestSha256)
    || record.recordDigestSha256 !== sha256AuthorityValue(payload)
  ) throw conflict('source_visual_evidence_authority_digest_invalid')
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  assertPlainSerializedData(value, 'source_visual_evidence_authority_record')
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw conflict('source_visual_evidence_authority_shape_invalid')
  }
  const record = value as Record<string, unknown>
  const actual = Reflect.ownKeys(record)
  if (
    actual.some((key) => typeof key !== 'string')
    || actual.length !== keys.length
    || keys.some((key) => !Object.hasOwn(record, key))
  ) throw conflict('source_visual_evidence_authority_shape_invalid')
  return record
}

function parseScope(
  value: CanonicalSourceTranscriptOrchestraReadScope,
): CanonicalSourceTranscriptOrchestraReadScope {
  assertPlainSerializedData(value, 'source_visual_evidence_authority_scope')
  const required = [
    'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
    'analysisRunId', 'sourceSequenceItemId', 'mediaAssetId', 'uploadedOrder',
    'checksumSha256', 'byteLength', 'durationFrames', 'sourceFrameAuthority',
    'finalizedMediaAuthorityRef', 'sourceProbeAuthorityRef',
  ]
  const record = exactRecord(value, required)
  let sourceFrameAuthority
  try {
    sourceFrameAuthority = canonicalSourceLedSourceFrameAuthoritySchema.parse(
      record.sourceFrameAuthority,
    )
  } catch {
    throw conflict('source_visual_evidence_authority_frame_scope_invalid')
  }
  const recreatedFrameAuthority = createCanonicalSourceLedSourceFrameAuthority({
    fpsNumerator: sourceFrameAuthority.fpsNumerator,
    fpsDenominator: sourceFrameAuthority.fpsDenominator,
    frameCount: sourceFrameAuthority.frameCount,
    timeBaseNumerator: sourceFrameAuthority.timeBaseNumerator,
    timeBaseDenominator: sourceFrameAuthority.timeBaseDenominator,
  })
  for (const key of [
    'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
    'analysisRunId', 'sourceSequenceItemId', 'mediaAssetId',
  ]) requireSafeId(record[key])
  if (
    !Number.isSafeInteger(record.uploadedOrder)
    || (record.uploadedOrder as number) < 1
    || (record.uploadedOrder as number) > 8
    || !Number.isSafeInteger(record.byteLength)
    || (record.byteLength as number) < 1
    || !Number.isSafeInteger(record.durationFrames)
    || (record.durationFrames as number) < 1
    || typeof record.checksumSha256 !== 'string'
    || !RAW_SHA256.test(record.checksumSha256)
    || sourceFrameAuthority.frameCount !== record.durationFrames
    || stableAuthorityStringify(sourceFrameAuthority)
      !== stableAuthorityStringify(recreatedFrameAuthority)
  ) throw conflict('source_visual_evidence_authority_scope_invalid')
  return Object.freeze({
    ...structuredClone(value),
    sourceFrameAuthority,
    finalizedMediaAuthorityRef: parseRef(record.finalizedMediaAuthorityRef),
    sourceProbeAuthorityRef: parseRef(record.sourceProbeAuthorityRef),
  })
}

function parseRef(value: unknown): VisualIntelligenceEvidenceRef {
  const record = exactRecord(value, ['id', 'version', 'contentHash'])
  const id = requireSafeId(record.id)
  if (
    !Number.isSafeInteger(record.version)
    || (record.version as number) < 1
    || typeof record.contentHash !== 'string'
    || !PREFIXED_SHA256.test(record.contentHash)
  ) throw conflict('source_visual_evidence_authority_ref_invalid')
  return Object.freeze({
    id,
    version: record.version as number,
    contentHash: record.contentHash,
  })
}

function triggerRef(
  trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: trigger.requestId,
    version: 1,
    contentHash: `sha256:${trigger.triggerHash}`,
  })
}

function admissionReference(
  admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: admission.admissionId,
    version: 1,
    contentHash: `sha256:${admission.admissionHash}`,
  })
}

function cloneRef(
  value: VisualIntelligenceEvidenceRef,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({ ...parseRef(value) })
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function requireSafeId(value: unknown): string {
  if (
    typeof value !== 'string'
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value)
    || value.includes('..')
  ) throw conflict('source_visual_evidence_authority_id_invalid')
  return value
}

function requireRawSha(value: unknown): string {
  if (typeof value !== 'string' || !RAW_SHA256.test(value)) {
    throw conflict('source_visual_evidence_authority_sha_invalid')
  }
  return value
}

function admissionPath(prefix: string, requestId: string): string {
  return `${prefix}/admissions/${requireSafeId(requestId)}.json`
}

function releasePath(
  prefix: string,
  releaseRef: VisualIntelligenceEvidenceRef,
): string {
  const exact = parseRef(releaseRef)
  return `${prefix}/releases/${exact.id}/v${exact.version}/`
    + `${exact.contentHash.slice(7)}.json`
}

function terminalPath(prefix: string, invocationId: string): string {
  return `${prefix}/terminals/${requireSafeId(invocationId)}.json`
}

function cloudRunOperationPath(prefix: string, invocationId: string): string {
  return `${prefix}/cloud-run-operations/${requireSafeId(invocationId)}.json`
}

function requireCloudRunJobResource(value: unknown): string {
  if (
    typeof value !== 'string'
    || !/^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/reeditpro-professional-l4$/u.test(
      value,
    )
  ) throw conflict('source_visual_evidence_cloud_run_job_invalid')
  return value
}

function requireCloudRunOperationResource(value: unknown): string {
  if (
    typeof value !== 'string'
    || !/^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/operations\/[A-Za-z0-9._-]+$/u.test(
      value,
    )
  ) throw conflict('source_visual_evidence_cloud_run_operation_invalid')
  return value
}

function normalizePrefix(value: string): string {
  const prefix = value.replace(/^\/+|\/+$/gu, '')
  if (
    !prefix
    || prefix.includes('..')
    || prefix.includes('//')
    || !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,800}$/u.test(prefix)
  ) throw conflict('source_visual_evidence_authority_prefix_invalid')
  return prefix
}

function rawBufferSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical L4 visual evidence authority conflicts with its source.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical L4 visual evidence authority repository is not ready.',
    503,
    { requiredGate },
  )
}
