import { createHash } from 'node:crypto'

import type {
  OrchestraEvidenceRef,
  OrchestraSkillCall,
} from '../../src/types/orchestra-skill-capability'
import type { VisualIntelligenceReportRepository } from
  '../visual-intelligence/visual-intelligence-lifecycle-service'
import type { VisualIntelligenceOrchestraJobResultStore } from
  '../visual-intelligence/visual-intelligence-orchestra-job-result-store'
import type {
  VisualIntelligenceOrchestraConsumerBindingPort,
} from '../visual-intelligence/visual-intelligence-orchestra-job-runtime'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  orchestraDigest,
  orchestraEvidenceRef,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  visualIntelligenceCanonicalJson,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  adaptEditReferenceVisualIntelligenceOrchestraResult,
  type EditReferenceVisualIntelligenceExpectedScope,
  type EditReferenceVisualIntelligenceStudy,
} from './edit-reference-visual-intelligence-orchestra-consumer'

export const EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_VERSION =
  'edit-reference-visual-intelligence-orchestra-binding-v1' as const
export const EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_STORE_VERSION =
  'edit-reference-visual-intelligence-orchestra-binding-store-v2' as const
export const EDIT_REFERENCE_VISUAL_INTELLIGENCE_READ_PORT_VERSION =
  'edit-reference-visual-intelligence-orchestra-read-port-v1' as const
export const EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_REQUEST_VERSION =
  'edit-reference-visual-intelligence-orchestra-binding-request-v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v2/consumer-bindings/edit-reference-visual-intelligence'
const MAX_BINDING_BYTES = 64 * 1024
const MAX_CALL_INDEX_BYTES = 8 * 1024
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const DIGEST = /^sha256:[a-f0-9]{64}$/u

export interface EditReferenceVisualIntelligenceBindingScope extends
  EditReferenceVisualIntelligenceExpectedScope {
  readonly sourceEvidenceId: string
  readonly privateAssetId: string
  readonly sourceEvidenceRef: OrchestraEvidenceRef
  readonly studyAuthorityRef: OrchestraEvidenceRef
}

export interface EditReferenceVisualIntelligenceOrchestraBinding {
  readonly schemaVersion:
    typeof EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_VERSION
  readonly bindingId: string
  readonly bindingDigestSha256: string
  readonly scope: EditReferenceVisualIntelligenceBindingScope
  readonly orchestraCallRef: OrchestraEvidenceRef
  readonly orchestraPlanRef: OrchestraEvidenceRef
  readonly orchestraJobRef: OrchestraEvidenceRef
  readonly manifestRef: OrchestraEvidenceRef
  readonly qualificationSnapshotRef: OrchestraEvidenceRef
  readonly expectedOutcomeRefs: readonly OrchestraEvidenceRef[]
  readonly createdAt: string
  readonly persistedBeforeProviderDispatch: true
  readonly exactConsumerScopeRereadRequired: true
  readonly exactOrchestraResultRereadRequired: true
  readonly exactVisualIntelligenceReportRereadRequired: true
  readonly directProviderCallAllowed: false
  readonly localCpuMediaAnalysisAllowed: false
  readonly preferenceDnaApprovalGranted: false
  readonly customerCreditsMutated: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
}

export interface EditReferenceVisualIntelligenceOrchestraBindingRequest {
  readonly schemaVersion:
    typeof EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_REQUEST_VERSION
  readonly requestId: string
  readonly requestDigestSha256: string
  readonly scope: EditReferenceVisualIntelligenceBindingScope
  readonly orchestraCallRef: OrchestraEvidenceRef
  readonly byteFreeRequest: true
  readonly callerProviderDispatchAuthorityAccepted: false
  readonly callerCreditAuthorityAccepted: false
  readonly consumerMutationAuthorityAccepted: false
}

export interface EditReferenceVisualIntelligenceBindingStore {
  readonly schemaVersion:
    typeof EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_STORE_VERSION
  persistCreateOnly(binding: unknown): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly binding: EditReferenceVisualIntelligenceOrchestraBinding
    readonly bindingRef: OrchestraEvidenceRef
  }>
  readExact(
    scope: EditReferenceVisualIntelligenceBindingScope,
  ): Promise<EditReferenceVisualIntelligenceOrchestraBinding | null>
}

export interface EditReferenceVisualIntelligenceOrchestraReadPort {
  readonly schemaVersion:
    typeof EDIT_REFERENCE_VISUAL_INTELLIGENCE_READ_PORT_VERSION
  readCompletedReferenceAnalysis(
    scope: EditReferenceVisualIntelligenceBindingScope,
  ): Promise<EditReferenceVisualIntelligenceStudy | null>
}

interface EditReferenceVisualIntelligenceCallIndex {
  readonly schemaVersion:
    'edit-reference-visual-intelligence-orchestra-call-index-v1'
  readonly callRef: OrchestraEvidenceRef
  readonly consumerScopeDigestSha256: string
  readonly bindingId: string
  readonly indexDigestSha256: string
}

export function createEditReferenceVisualIntelligenceOrchestraBindingRequest(
  input: {
    readonly requestId: string
    readonly scope: EditReferenceVisualIntelligenceBindingScope
    readonly orchestraCallRef: OrchestraEvidenceRef
  },
): EditReferenceVisualIntelligenceOrchestraBindingRequest {
  if (!SAFE_ID.test(input.requestId)) throw conflict(
    'edit_reference_vi_binding_request_id_invalid',
  )
  assertScope(input.scope)
  if (!exactRef(input.orchestraCallRef)) throw conflict(
    'edit_reference_vi_binding_request_call_ref_invalid',
  )
  const withoutDigest = {
    schemaVersion:
      EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_REQUEST_VERSION,
    requestId: input.requestId,
    scope: structuredClone(input.scope),
    orchestraCallRef: structuredClone(input.orchestraCallRef),
    byteFreeRequest: true as const,
    callerProviderDispatchAuthorityAccepted: false as const,
    callerCreditAuthorityAccepted: false as const,
    consumerMutationAuthorityAccepted: false as const,
  }
  return freeze({
    ...withoutDigest,
    requestDigestSha256: orchestraDigest(withoutDigest),
  })
}

/**
 * Called by the Orchestra owner before provider dispatch. The Edit Reference
 * consumer cannot create this binding for itself.
 */
export function createEditReferenceVisualIntelligenceOrchestraBinding(input: {
  readonly scope: EditReferenceVisualIntelligenceBindingScope
  readonly orchestraCall: unknown
  readonly createdAt: string
}): EditReferenceVisualIntelligenceOrchestraBinding {
  assertScope(input.scope)
  const call = parseOrchestraSkillCall(input.orchestraCall)
  assertReferencePreferenceCall(call, input.scope)
  const withoutDigest = {
    schemaVersion: EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_VERSION,
    bindingId: `edit-reference-vi-binding-${orchestraDigest({
      scope: input.scope,
      callRef: callRef(call),
    }).slice(7, 39)}`,
    scope: structuredClone(input.scope),
    orchestraCallRef: callRef(call),
    orchestraPlanRef: structuredClone(call.orchestraPlanRef),
    orchestraJobRef: structuredClone(call.orchestraJobRef),
    manifestRef: structuredClone(call.manifestRef),
    qualificationSnapshotRef: structuredClone(
      call.qualificationSnapshotRef,
    ),
    expectedOutcomeRefs: structuredClone(call.expectedOutcomeRefs),
    createdAt: requireIso(input.createdAt),
    persistedBeforeProviderDispatch: true as const,
    exactConsumerScopeRereadRequired: true as const,
    exactOrchestraResultRereadRequired: true as const,
    exactVisualIntelligenceReportRereadRequired: true as const,
    directProviderCallAllowed: false as const,
    localCpuMediaAnalysisAllowed: false as const,
    preferenceDnaApprovalGranted: false as const,
    customerCreditsMutated: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return freeze({
    ...withoutDigest,
    bindingDigestSha256: orchestraDigest(withoutDigest),
  })
}

export function createEditReferenceVisualIntelligenceBindingStore(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): EditReferenceVisualIntelligenceBindingStore {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const readExact = async (
    scopeValue: EditReferenceVisualIntelligenceBindingScope,
  ) => {
    assertScope(scopeValue)
    const body = await input.objectPort.readExact(bindingPath(prefix, scopeValue))
    if (!body) return null
    const binding = parseBinding(parseJson(body), scopeValue)
    const indexBody = await input.objectPort.readExact(callIndexPath(
      prefix,
      binding.orchestraCallRef,
    ))
    if (!indexBody) throw conflict(
      'edit_reference_vi_binding_call_index_missing',
    )
    const index = parseCallIndex(parseJson(
      indexBody,
      MAX_CALL_INDEX_BYTES,
    ))
    if (
      !sameRef(index.callRef, binding.orchestraCallRef)
      || index.consumerScopeDigestSha256 !== orchestraDigest(binding.scope)
      || index.bindingId !== binding.bindingId
    ) throw conflict('edit_reference_vi_binding_call_index_mismatch')
    return binding
  }
  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_STORE_VERSION,

    async persistCreateOnly(value: unknown) {
      const binding = parseBinding(value)
      const body = Buffer.from(visualIntelligenceCanonicalJson(binding), 'utf8')
      if (body.byteLength < 2 || body.byteLength > MAX_BINDING_BYTES) {
        throw conflict('edit_reference_vi_binding_size_invalid')
      }
      const existingBinding = await readExact(binding.scope)
      if (existingBinding) {
        if (
          visualIntelligenceCanonicalJson(existingBinding)
            !== visualIntelligenceCanonicalJson(binding)
        ) throw conflict('edit_reference_vi_binding_scope_conflict')
        return Object.freeze({
          disposition: 'identical_replay' as const,
          binding: existingBinding,
          bindingRef: orchestraEvidenceRef(
            existingBinding.bindingId,
            existingBinding.bindingDigestSha256,
          ),
        })
      }
      const callIndex = createCallIndex(binding)
      const callIndexBody = Buffer.from(
        visualIntelligenceCanonicalJson(callIndex),
        'utf8',
      )
      if (
        callIndexBody.byteLength < 2
        || callIndexBody.byteLength > MAX_CALL_INDEX_BYTES
      ) throw conflict('edit_reference_vi_binding_call_index_size_invalid')
      await input.objectPort.createOnly({
        objectPath: callIndexPath(prefix, binding.orchestraCallRef),
        body: callIndexBody,
        contentSha256: rawSha256(callIndexBody),
      })
      const callIndexReread = await input.objectPort.readExact(callIndexPath(
        prefix,
        binding.orchestraCallRef,
      ))
      if (
        !callIndexReread
        || visualIntelligenceCanonicalJson(parseCallIndex(parseJson(
          callIndexReread,
          MAX_CALL_INDEX_BYTES,
        ))) !== visualIntelligenceCanonicalJson(callIndex)
      ) throw conflict('edit_reference_vi_binding_call_index_conflict')
      const disposition = await input.objectPort.createOnly({
        objectPath: bindingPath(prefix, binding.scope),
        body,
        contentSha256: rawSha256(body),
      })
      const reread = await readExact(binding.scope)
      if (!reread
        || visualIntelligenceCanonicalJson(reread)
          !== visualIntelligenceCanonicalJson(binding)) {
        throw conflict('edit_reference_vi_binding_reread_mismatch')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        binding: reread,
        bindingRef: orchestraEvidenceRef(
          reread.bindingId,
          reread.bindingDigestSha256,
        ),
      })
    },

    readExact,
  })
}

export function createEditReferenceVisualIntelligenceOrchestraReadPort(input: {
  readonly bindingStore: Pick<EditReferenceVisualIntelligenceBindingStore,
    'readExact'>
  readonly resultStore: Pick<VisualIntelligenceOrchestraJobResultStore,
    'readExact'>
  readonly reportRepository: Pick<VisualIntelligenceReportRepository,
    'readAcceptedByRef'>
}): EditReferenceVisualIntelligenceOrchestraReadPort {
  if (
    !input.bindingStore
    || typeof input.bindingStore.readExact !== 'function'
    || !input.resultStore
    || typeof input.resultStore.readExact !== 'function'
    || !input.reportRepository
    || typeof input.reportRepository.readAcceptedByRef !== 'function'
  ) throw conflict('edit_reference_vi_read_dependencies_invalid')
  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_VISUAL_INTELLIGENCE_READ_PORT_VERSION,

    async readCompletedReferenceAnalysis(
      scope: EditReferenceVisualIntelligenceBindingScope,
    ) {
      assertScope(scope)
      const binding = await input.bindingStore.readExact(scope)
      if (!binding) return null
      const result = await input.resultStore.readExact(
        binding.orchestraCallRef,
      )
      if (!result) return null
      if (
        !sameRef(result.callRef, binding.orchestraCallRef)
        || !sameRef(result.manifestRef, binding.manifestRef)
        || !sameRef(
          result.qualificationSnapshotRef,
          binding.qualificationSnapshotRef,
        )
      ) throw conflict('edit_reference_vi_result_binding_mismatch')
      const reportRef = result.producedArtifactRefs.length === 1
        ? result.producedArtifactRefs[0]!
        : null
      if (!reportRef) throw conflict(
        'edit_reference_vi_result_report_ref_invalid',
      )
      const report = await input.reportRepository.readAcceptedByRef(reportRef)
      if (!report) return null
      return adaptEditReferenceVisualIntelligenceOrchestraResult({
        sourceEvidenceId: scope.sourceEvidenceId,
        privateAssetId: scope.privateAssetId,
        expectedScope: scope,
        orchestraResult: result,
        report,
      })
    },
  })
}

export function createEditReferenceVisualIntelligenceConsumerBindingPort(
  input: {
    readonly bindingStore: Pick<EditReferenceVisualIntelligenceBindingStore,
      'persistCreateOnly' | 'readExact'>
    readonly now?: () => Date
  },
): VisualIntelligenceOrchestraConsumerBindingPort {
  if (
    !input.bindingStore
    || typeof input.bindingStore.persistCreateOnly !== 'function'
    || typeof input.bindingStore.readExact !== 'function'
    || (input.now !== undefined && typeof input.now !== 'function')
  ) throw conflict('edit_reference_vi_binding_port_dependencies_invalid')
  const now = input.now ?? (() => new Date())
  return Object.freeze({
    async bindBeforeProviderExecution(
      value: Parameters<
        VisualIntelligenceOrchestraConsumerBindingPort[
          'bindBeforeProviderExecution'
        ]
      >[0],
    ) {
      const call = parseOrchestraSkillCall(value.call)
      if (value.compiled.jobType !== 'reference_preference_analysis') {
        if (
          value.consumerBindingRequest !== null
          && value.consumerBindingRequest !== undefined
        ) throw conflict('unexpected_edit_reference_vi_binding_request')
        return null
      }
      const request = parseBindingRequest(value.consumerBindingRequest)
      if (
        value.compiled.phase !== 'planning'
        || value.compiled.scope.scopeType !== 'video'
        || value.compiled.request.scope.ownerUserId
          !== value.authenticatedOwnerUserId
        || value.compiled.request.scope.workspaceId
          !== value.expectedWorkspaceId
        || request.scope.ownerUserId !== value.authenticatedOwnerUserId
        || request.scope.workspaceId !== value.expectedWorkspaceId
        || request.scope.editReferenceId
          !== value.compiled.request.scope.projectId
        || request.scope.studySessionId
          !== value.compiled.request.scope.editSessionId
        || value.compiled.request.scope.approvedSnapshotId !== null
        || !sameRef(request.orchestraCallRef, value.compiled.callRef)
        || !sameRef(request.orchestraCallRef, callRef(call))
      ) throw conflict('edit_reference_vi_binding_compiled_scope_mismatch')
      const existing = await input.bindingStore.readExact(request.scope)
      if (existing) {
        if (!sameRef(existing.orchestraCallRef, request.orchestraCallRef)) {
          throw conflict('edit_reference_vi_binding_replay_call_mismatch')
        }
        return orchestraEvidenceRef(
          existing.bindingId,
          existing.bindingDigestSha256,
        )
      }
      const persisted = await input.bindingStore.persistCreateOnly(
        createEditReferenceVisualIntelligenceOrchestraBinding({
          scope: request.scope,
          orchestraCall: call,
          createdAt: now().toISOString(),
        }),
      )
      return persisted.bindingRef
    },
  })
}

function assertReferencePreferenceCall(
  call: OrchestraSkillCall,
  scope: EditReferenceVisualIntelligenceBindingScope,
): void {
  if (
    call.targetSkillKey !== 'visual_intelligence'
    || call.jobType !== 'reference_preference_analysis'
    || call.phase !== 'planning'
    || call.scope.scopeType !== 'video'
    || !sameRef(call.scope.sourceArtifactRef, scope.sourceArtifactRef)
    || call.scope.completeSourceCoverageRequired !== true
    || call.scope.outputId !== null
    || call.sourceArtifactRefs.length !== 1
    || !sameRef(call.sourceArtifactRefs[0]!, scope.sourceArtifactRef)
    || call.comparisonArtifactRefs.length !== 0
    || call.expectedOutcomeRefs.length === 0
    || call.approvedSnapshotRef !== null
    || call.orchestraDispatchAuthorized !== true
    || call.directProviderCallAllowed !== false
    || call.directTimelineMutationAllowed !== false
    || call.directArtifactMutationAllowed !== false
    || call.scopeExpansionAllowed !== false
    || call.peerSkillExecutionAuthorityAccepted !== false
  ) throw conflict('edit_reference_vi_orchestra_call_mismatch')
}

function parseBinding(
  value: unknown,
  expectedScope?: EditReferenceVisualIntelligenceBindingScope,
): EditReferenceVisualIntelligenceOrchestraBinding {
  if (!plainRecord(value)) throw conflict(
    'edit_reference_vi_binding_invalid',
  )
  const expectedKeys = [
    'schemaVersion', 'bindingId', 'bindingDigestSha256', 'scope',
    'orchestraCallRef', 'orchestraPlanRef', 'orchestraJobRef', 'manifestRef',
    'qualificationSnapshotRef', 'expectedOutcomeRefs', 'createdAt',
    'persistedBeforeProviderDispatch', 'exactConsumerScopeRereadRequired',
    'exactOrchestraResultRereadRequired',
    'exactVisualIntelligenceReportRereadRequired',
    'directProviderCallAllowed', 'localCpuMediaAnalysisAllowed',
    'preferenceDnaApprovalGranted', 'customerCreditsMutated',
    'publicDeliveryGranted', 'productionAuthorityGranted',
  ]
  const descriptors = Object.getOwnPropertyDescriptors(value)
  if (
    Reflect.ownKeys(value).length !== expectedKeys.length
    || expectedKeys.some((key) => !Object.hasOwn(value, key))
    || Object.values(descriptors).some(
      (descriptor) => 'get' in descriptor || 'set' in descriptor,
    )
  ) throw conflict('edit_reference_vi_binding_shape_invalid')
  const binding = value as unknown as
    EditReferenceVisualIntelligenceOrchestraBinding
  const { bindingDigestSha256, ...withoutDigest } = binding
  assertScope(binding.scope)
  if (
    binding.schemaVersion !== EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_VERSION
    || !SAFE_ID.test(binding.bindingId)
    || !DIGEST.test(bindingDigestSha256)
    || orchestraDigest(withoutDigest) !== bindingDigestSha256
    || !exactRef(binding.orchestraCallRef)
    || !exactRef(binding.orchestraPlanRef)
    || !exactRef(binding.orchestraJobRef)
    || !exactRef(binding.manifestRef)
    || !exactRef(binding.qualificationSnapshotRef)
    || !Array.isArray(binding.expectedOutcomeRefs)
    || binding.expectedOutcomeRefs.length === 0
    || binding.expectedOutcomeRefs.some((ref) => !exactRef(ref))
    || new Set(binding.expectedOutcomeRefs.map(refKey)).size
      !== binding.expectedOutcomeRefs.length
    || requireIso(binding.createdAt) !== binding.createdAt
    || binding.persistedBeforeProviderDispatch !== true
    || binding.exactConsumerScopeRereadRequired !== true
    || binding.exactOrchestraResultRereadRequired !== true
    || binding.exactVisualIntelligenceReportRereadRequired !== true
    || binding.directProviderCallAllowed !== false
    || binding.localCpuMediaAnalysisAllowed !== false
    || binding.preferenceDnaApprovalGranted !== false
    || binding.customerCreditsMutated !== false
    || binding.publicDeliveryGranted !== false
    || binding.productionAuthorityGranted !== false
    || (expectedScope && orchestraDigest(binding.scope)
      !== orchestraDigest(expectedScope))
  ) throw conflict('edit_reference_vi_binding_contract_invalid')
  return freeze(structuredClone(binding))
}

function parseBindingRequest(
  value: unknown,
): EditReferenceVisualIntelligenceOrchestraBindingRequest {
  if (!plainRecord(value)) throw conflict(
    'edit_reference_vi_binding_request_invalid',
  )
  const keys = [
    'schemaVersion', 'requestId', 'requestDigestSha256', 'scope',
    'orchestraCallRef', 'byteFreeRequest',
    'callerProviderDispatchAuthorityAccepted',
    'callerCreditAuthorityAccepted', 'consumerMutationAuthorityAccepted',
  ]
  const descriptors = Object.getOwnPropertyDescriptors(value)
  if (
    Reflect.ownKeys(value).length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || Object.values(descriptors).some(
      (descriptor) => 'get' in descriptor || 'set' in descriptor,
    )
  ) throw conflict('edit_reference_vi_binding_request_shape_invalid')
  const request = value as unknown as
    EditReferenceVisualIntelligenceOrchestraBindingRequest
  const { requestDigestSha256, ...withoutDigest } = request
  assertScope(request.scope)
  if (
    request.schemaVersion
      !== EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_REQUEST_VERSION
    || !SAFE_ID.test(request.requestId)
    || !DIGEST.test(requestDigestSha256)
    || orchestraDigest(withoutDigest) !== requestDigestSha256
    || !exactRef(request.orchestraCallRef)
    || request.byteFreeRequest !== true
    || request.callerProviderDispatchAuthorityAccepted !== false
    || request.callerCreditAuthorityAccepted !== false
    || request.consumerMutationAuthorityAccepted !== false
  ) throw conflict('edit_reference_vi_binding_request_contract_invalid')
  return freeze(structuredClone(request))
}

function createCallIndex(
  binding: EditReferenceVisualIntelligenceOrchestraBinding,
): EditReferenceVisualIntelligenceCallIndex {
  const withoutDigest = {
    schemaVersion:
      'edit-reference-visual-intelligence-orchestra-call-index-v1' as const,
    callRef: structuredClone(binding.orchestraCallRef),
    consumerScopeDigestSha256: orchestraDigest(binding.scope),
    bindingId: binding.bindingId,
  }
  return freeze({
    ...withoutDigest,
    indexDigestSha256: orchestraDigest(withoutDigest),
  })
}

function parseCallIndex(
  value: unknown,
): EditReferenceVisualIntelligenceCallIndex {
  if (!plainRecord(value)) throw conflict(
    'edit_reference_vi_binding_call_index_invalid',
  )
  const keys = [
    'schemaVersion', 'callRef', 'consumerScopeDigestSha256', 'bindingId',
    'indexDigestSha256',
  ]
  if (
    Reflect.ownKeys(value).length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
  ) throw conflict('edit_reference_vi_binding_call_index_shape_invalid')
  const index = value as unknown as EditReferenceVisualIntelligenceCallIndex
  const { indexDigestSha256, ...withoutDigest } = index
  if (
    index.schemaVersion
      !== 'edit-reference-visual-intelligence-orchestra-call-index-v1'
    || !exactRef(index.callRef)
    || !DIGEST.test(index.consumerScopeDigestSha256)
    || !SAFE_ID.test(index.bindingId)
    || !DIGEST.test(indexDigestSha256)
    || orchestraDigest(withoutDigest) !== indexDigestSha256
  ) throw conflict('edit_reference_vi_binding_call_index_contract_invalid')
  return freeze(structuredClone(index))
}

function assertScope(scope: EditReferenceVisualIntelligenceBindingScope): void {
  if (!plainRecord(scope)) throw conflict('edit_reference_vi_scope_invalid')
  const keys = [
    'ownerUserId', 'workspaceId', 'editReferenceId', 'studySessionId',
    'sourceArtifactRef', 'sourceEvidenceId', 'privateAssetId',
    'sourceEvidenceRef', 'studyAuthorityRef',
  ]
  if (
    Reflect.ownKeys(scope).length !== keys.length
    || keys.some((key) => !Object.hasOwn(scope, key))
    || [
      scope.ownerUserId,
      scope.workspaceId,
      scope.editReferenceId,
      scope.studySessionId,
      scope.sourceEvidenceId,
      scope.privateAssetId,
    ].some((id) => !SAFE_ID.test(id))
    || scope.sourceArtifactRef.id !== scope.privateAssetId
    || !exactRef(scope.sourceArtifactRef)
    || !exactRef(scope.sourceEvidenceRef)
    || scope.sourceEvidenceRef.id !== scope.sourceEvidenceId
    || !exactRef(scope.studyAuthorityRef)
    || scope.studyAuthorityRef.id !== scope.studySessionId
  ) throw conflict('edit_reference_vi_scope_contract_invalid')
}

function bindingPath(
  prefix: string,
  scope: EditReferenceVisualIntelligenceBindingScope,
): string {
  return `${prefix}/by-consumer/${orchestraDigest(scope).slice(7)}.json`
}

function callIndexPath(
  prefix: string,
  callReference: OrchestraEvidenceRef,
): string {
  return `${prefix}/by-call/${orchestraDigest(callReference).slice(7)}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 1_024
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !SAFE_ID.test(part))
  ) throw conflict('edit_reference_vi_binding_prefix_invalid')
  return normalized
}

function callRef(call: OrchestraSkillCall): OrchestraEvidenceRef {
  return orchestraEvidenceRef(call.callId, call.callDigestSha256)
}

function exactRef(value: unknown): value is OrchestraEvidenceRef {
  if (!plainRecord(value)) return false
  return Reflect.ownKeys(value).length === 3
    && SAFE_ID.test(String(value.id ?? ''))
    && Number.isSafeInteger(value.version)
    && Number(value.version) > 0
    && DIGEST.test(String(value.contentHash ?? ''))
}

function sameRef(
  left: OrchestraEvidenceRef,
  right: OrchestraEvidenceRef,
): boolean {
  return refKey(left) === refKey(right)
}

function refKey(value: OrchestraEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function requireIso(value: string): string {
  if (
    typeof value !== 'string'
    || Number.isNaN(Date.parse(value))
    || new Date(value).toISOString() !== value
  ) throw conflict('edit_reference_vi_binding_timestamp_invalid')
  return value
}

function parseJson(
  body: Buffer,
  maximumBytes = MAX_BINDING_BYTES,
): unknown {
  if (body.byteLength < 2 || body.byteLength > maximumBytes) {
    throw conflict('edit_reference_vi_binding_size_invalid')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw conflict('edit_reference_vi_binding_json_invalid')
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function'
  ) throw conflict('edit_reference_vi_binding_object_port_invalid')
}

function plainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function rawSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      freeze(child)
    }
  }
  return value
}

function conflict(reason: string): Error {
  return new TypeError(reason)
}
