import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import type { OfflineNodeRunnerSvgSemanticEvidence } from '../node-runners'
import { getOfflineNodeRunnerCanonicalOperation } from '../node-runners/offline-node-runner-canonical-operations'
import { OFFLINE_NODE_RUNNER_LIMITS } from '../node-runners/offline-node-runner-types'
import { OFFLINE_NODE_RUNNER_TOOL_IDS } from '../node-runners/offline-node-runner-tool-ids'
import {
  inspectExistingOfflineNodeStructuredDockerRuntime,
  prepareOfflineNodeStructuredDockerRuntime,
  runOfflineNodeStructuredContainer,
  type OfflineNodeStructuredContainerResult,
} from './offline-node-structured-docker-runtime'
import {
  OFFLINE_NODE_STRUCTURED_CONTAINER_PROTOCOL,
  structuredExecutionRequestSha256,
  validateOfflineNodeStructuredExecutionRequest,
  type OfflineNodeStructuredExecutionRequest,
} from './offline-node-structured-execution-protocol'
import {
  OFFLINE_NODE_STRUCTURED_EXECUTION_ATTESTATION_VERSION,
  OFFLINE_NODE_STRUCTURED_EXECUTION_RECORD_VERSION,
  OFFLINE_NODE_STRUCTURED_EXECUTION_RESULT_VERSION,
  OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_RECORD_VERSION,
  OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_VERSION,
  type OfflineNodeStructuredExecutionAttestation,
  type OfflineNodeStructuredExecutionEvidence,
  type OfflineNodeStructuredExecutionImageEvidence,
  type OfflineNodeStructuredExecutionResult,
  type OfflineNodeStructuredRuntimeAuthority,
  type PersistedOfflineNodeStructuredRuntimeAuthority,
  type PersistedOfflineNodeStructuredExecutionAttestation,
} from './offline-node-structured-execution-types'

export const OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT =
  '/tmp/reeditpro-offline-node-structured-execution' as const
export const OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH =
  'runtime-authority/offline-node-structured-runtime-v1.json' as const

const SHA256_PATTERN = /^[a-f0-9]{64}$/
export const OFFLINE_NODE_STRUCTURED_PACKAGE_IDENTITIES = Object.freeze({
  d3: { packageName: 'd3', version: '7.9.0' },
  echarts: { packageName: 'echarts', version: '6.1.0' },
  vega_lite: { packageName: 'vega-lite', version: '6.4.3' },
  vega: { packageName: 'vega', version: '6.2.0' },
  satori: { packageName: 'satori', version: '0.26.0' },
  sharp: { packageName: 'sharp', version: '0.35.3' },
  svg_js: { packageName: '@svgdotjs/svg.js', version: '3.2.5' },
  viz_js: { packageName: '@viz-js/viz', version: '3.28.0' },
  animejs: { packageName: 'animejs', version: '4.5.0' },
  three_js: { packageName: 'three', version: '0.185.1' },
} as const)
const BLOCKERS = Object.freeze([
  'Execution evidence is private-local only and is not deployed worker-fleet, multi-architecture, or service-identity evidence.',
  'Canonical private-local dispatch, approved-snapshot, reservation, lease, artifact, and QA integration exists only for nine bounded SVG operations; distributed workers, render, export, settlement, and delivery remain unintegrated.',
  'The pinned Debian runtime has known unresolved vulnerability findings; product, external-beta, and production promotion require a remediated base decision and fresh image scan.',
  'No deployed observability, quota, recovery, rollback, retention, or incident-response evidence exists for this runtime.',
  'Only nine bounded offline SVG operations are implemented by this bridge; no raw specification, browser, provider, media, shell, network, or general code execution is enabled.',
] as const)

export interface PrivateOfflineNodeStructuredExecutionRuntime {
  readonly image: OfflineNodeStructuredExecutionImageEvidence
  execute(request: unknown): Promise<OfflineNodeStructuredExecutionResult>
}

export async function createPrivateOfflineNodeStructuredExecutionRuntime():
Promise<PrivateOfflineNodeStructuredExecutionRuntime> {
  if (arguments.length !== 0) {
    throw new ApiError('VALIDATION_FAILED', 'Structured Node runtime preparation does not accept caller input.', 400)
  }
  const image = await prepareOfflineNodeStructuredDockerRuntime()
  await persistOfflineNodeStructuredRuntimeAuthority(image)
  return Object.freeze({
    image,
    execute: (request: unknown) => executeWithImage(image, request),
  })
}

export async function openPersistedPrivateOfflineNodeStructuredExecutionRuntime():
Promise<PrivateOfflineNodeStructuredExecutionRuntime> {
  if (arguments.length !== 0) {
    throw new ApiError('VALIDATION_FAILED', 'Structured Node runtime open accepts no caller input.', 400)
  }
  const authority = await readPersistedOfflineNodeStructuredRuntimeAuthority()
  if (!authority || !authority.readiness.privateInternalExecutionReady) {
    throw new ApiError('TOOL_NOT_READY', 'Verified private structured runtime authority is unavailable.', 409)
  }
  const image = await inspectExistingOfflineNodeStructuredDockerRuntime()
  if (
    image.imageIdentityHash !== authority.image.imageIdentityHash ||
    stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)
  ) {
    throw evidenceFailure('Existing structured runtime image no longer matches persisted authority.')
  }
  return Object.freeze({
    image,
    execute: (request: unknown) => executeWithImage(image, request),
  })
}

export async function readPersistedOfflineNodeStructuredRuntimeAuthority():
Promise<OfflineNodeStructuredRuntimeAuthority | undefined> {
  if (arguments.length !== 0) {
    throw new ApiError('VALIDATION_FAILED', 'Structured runtime authority read accepts no caller input.', 400)
  }
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT,
    relativePath: OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH,
  })
  if (!content) return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw evidenceFailure('Persisted structured runtime authority is not valid JSON.')
  }
  const record = asRecord(parsed, 'Persisted structured runtime authority')
  assertExactKeys(record, ['recordVersion', 'source', 'authority', 'checksumSha256'])
  if (
    record.recordVersion !== OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_RECORD_VERSION ||
    record.source !== 'private_local_checksum_protected_structured_runtime_authority' ||
    typeof record.checksumSha256 !== 'string'
  ) {
    throw evidenceFailure('Persisted structured runtime authority record shape is invalid.')
  }
  const authority = asRecord(record.authority, 'Structured runtime authority')
  if (record.checksumSha256 !== sha256AuthorityValue(authority)) {
    throw evidenceFailure('Persisted structured runtime authority checksum is invalid.')
  }
  const authorityHash = authority.authorityHash
  if (typeof authorityHash !== 'string' || !SHA256_PATTERN.test(authorityHash)) {
    throw evidenceFailure('Persisted structured runtime authority hash is invalid.')
  }
  const withoutHash = Object.fromEntries(
    Object.entries(authority).filter(([key]) => key !== 'authorityHash'),
  )
  if (authorityHash !== sha256AuthorityValue(withoutHash)) {
    throw evidenceFailure('Persisted structured runtime authority content hash is invalid.')
  }
  assertRuntimeAuthorityBoundary(authority)
  return authority as unknown as OfflineNodeStructuredRuntimeAuthority
}

async function persistOfflineNodeStructuredRuntimeAuthority(
  image: OfflineNodeStructuredExecutionImageEvidence,
): Promise<OfflineNodeStructuredRuntimeAuthority> {
  const withoutHash = {
    schemaVersion: OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_VERSION,
    source: 'private_local_offline_node_structured_runtime_authority' as const,
    activatedAt: new Date().toISOString(),
    image,
    supportedOperations: OFFLINE_NODE_RUNNER_TOOL_IDS.map((toolId) => ({
      toolId,
      operationId: getOfflineNodeRunnerCanonicalOperation(toolId).operationId,
    })),
    readiness: {
      privateInternalExecutionReady: true as const,
      exactStructuredPayloadOnly: true as const,
      canonicalDispatchMayReference: true as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
    },
    blockers: BLOCKERS,
  }
  const authority: OfflineNodeStructuredRuntimeAuthority = {
    ...withoutHash,
    authorityHash: sha256AuthorityValue(withoutHash),
  }
  const persisted: PersistedOfflineNodeStructuredRuntimeAuthority = {
    recordVersion: OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_RECORD_VERSION,
    source: 'private_local_checksum_protected_structured_runtime_authority',
    authority,
    checksumSha256: sha256AuthorityValue(authority),
  }
  const content = `${stableAuthorityStringify(persisted)}\n`
  if (Buffer.byteLength(content, 'utf8') > 256 * 1024) {
    throw evidenceFailure('Structured runtime authority exceeded its private byte ceiling.')
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT,
    relativePath: OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH,
    content,
  })
  return authority
}

function assertRuntimeAuthorityBoundary(authority: Record<string, unknown>): void {
  assertExactKeys(authority, [
    'schemaVersion',
    'source',
    'activatedAt',
    'image',
    'supportedOperations',
    'readiness',
    'blockers',
    'authorityHash',
  ])
  const readiness = asRecord(authority.readiness, 'Structured runtime readiness')
  assertExactKeys(readiness, [
    'privateInternalExecutionReady',
    'exactStructuredPayloadOnly',
    'canonicalDispatchMayReference',
    'productReady',
    'externalBetaReady',
    'productionReady',
  ])
  const expectedOperations = OFFLINE_NODE_RUNNER_TOOL_IDS.map((toolId) => ({
    toolId,
    operationId: getOfflineNodeRunnerCanonicalOperation(toolId).operationId,
  }))
  if (
    authority.schemaVersion !== OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_VERSION ||
    authority.source !== 'private_local_offline_node_structured_runtime_authority' ||
    typeof authority.activatedAt !== 'string' ||
    !Number.isFinite(Date.parse(authority.activatedAt)) ||
    stableAuthorityStringify(authority.supportedOperations) !== stableAuthorityStringify(expectedOperations) ||
    readiness.privateInternalExecutionReady !== true ||
    readiness.exactStructuredPayloadOnly !== true ||
    readiness.canonicalDispatchMayReference !== true ||
    readiness.productReady !== false ||
    readiness.externalBetaReady !== false ||
    readiness.productionReady !== false ||
    !Array.isArray(authority.blockers) ||
    authority.blockers.length === 0
  ) {
    throw evidenceFailure('Persisted structured runtime authority boundary is invalid.')
  }
}

export async function readPersistedOfflineNodeStructuredExecutionAttestation(
  recordId: string,
): Promise<OfflineNodeStructuredExecutionAttestation | undefined> {
  if (!SHA256_PATTERN.test(recordId)) {
    throw new ApiError('VALIDATION_FAILED', 'Structured execution attestation identity is invalid.', 400)
  }
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT,
    relativePath: attestationRelativePath(recordId),
  })
  if (!content) return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw evidenceFailure('Persisted structured execution attestation is not valid JSON.')
  }
  const record = asRecord(parsed, 'Persisted structured execution record')
  assertExactKeys(record, ['recordVersion', 'source', 'attestation', 'checksumSha256'])
  if (
    record.recordVersion !== OFFLINE_NODE_STRUCTURED_EXECUTION_RECORD_VERSION ||
    record.source !== 'private_local_checksum_protected_structured_execution' ||
    typeof record.checksumSha256 !== 'string'
  ) {
    throw evidenceFailure('Persisted structured execution record shape is invalid.')
  }
  const attestation = asRecord(record.attestation, 'Structured execution attestation')
  if (record.checksumSha256 !== sha256AuthorityValue(attestation)) {
    throw evidenceFailure('Persisted structured execution checksum is invalid.')
  }
  if (attestation.recordId !== recordId || typeof attestation.attestationHash !== 'string') {
    throw evidenceFailure('Persisted structured execution identity is invalid.')
  }
  const withoutHash = Object.fromEntries(
    Object.entries(attestation).filter(([key]) => key !== 'attestationHash'),
  )
  if (attestation.attestationHash !== sha256AuthorityValue(withoutHash)) {
    throw evidenceFailure('Persisted structured execution attestation hash is invalid.')
  }
  assertAttestationBoundary(attestation)
  return attestation as unknown as OfflineNodeStructuredExecutionAttestation
}

async function executeWithImage(
  image: OfflineNodeStructuredExecutionImageEvidence,
  requestValue: unknown,
): Promise<OfflineNodeStructuredExecutionResult> {
  let request: OfflineNodeStructuredExecutionRequest
  try {
    request = validateOfflineNodeStructuredExecutionRequest(requestValue)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Structured Node execution request was rejected.', 400)
  }
  const serializedRequest = stableAuthorityStringify(request)
  const container = await runOfflineNodeStructuredContainer({ image, serializedRequest })
  if (container.exitCode !== 0 || container.oomKilled || container.stderr.trim()) {
    throw evidenceFailure('A validated structured Node execution container failed closed.')
  }
  const verified = verifySuccessfulContainerOutput({ request, container })
  const attestation = await createAndPersistAttestation({
    image,
    request,
    evidence: verified.evidence,
  })
  return {
    schemaVersion: OFFLINE_NODE_STRUCTURED_EXECUTION_RESULT_VERSION,
    svg: verified.svg,
    verificationJson: verified.verificationJson,
    evidence: verified.evidence,
    attestation,
    readiness: attestation.readiness,
  }
}

function verifySuccessfulContainerOutput(input: {
  request: OfflineNodeStructuredExecutionRequest
  container: OfflineNodeStructuredContainerResult
}): {
  evidence: OfflineNodeStructuredExecutionEvidence
  svg: OfflineNodeStructuredExecutionResult['svg']
  verificationJson: OfflineNodeStructuredExecutionResult['verificationJson']
} {
  const wire = asRecord(parseJson(input.container.stdout, 'Structured runner output'), 'Runner output')
  assertExactKeys(wire, [
    'schemaVersion',
    'ok',
    'toolId',
    'operationId',
    'status',
    'actualToolPackageExecuted',
    'source',
    'requestEnvelopeSha256',
    'packageIdentity',
    'bundleIdentity',
    'runtimeIdentity',
    'inputSha256',
    'artifacts',
    'semanticEvidence',
    'processResourceUsage',
    'confinementExpectations',
    'readiness',
  ])
  const requestEnvelopeSha256 = structuredExecutionRequestSha256(input.request)
  if (
    wire.schemaVersion !== OFFLINE_NODE_STRUCTURED_CONTAINER_PROTOCOL ||
    wire.ok !== true ||
    wire.toolId !== input.request.toolId ||
    wire.operationId !== input.request.operationId ||
    wire.status !== 'actual_library_operation_completed' ||
    wire.actualToolPackageExecuted !== true ||
    wire.source !== 'server_resolved_in_memory' ||
    wire.requestEnvelopeSha256 !== requestEnvelopeSha256 ||
    typeof wire.inputSha256 !== 'string' ||
    !SHA256_PATTERN.test(wire.inputSha256)
  ) {
    throw evidenceFailure('Structured runner returned an invalid execution identity.')
  }
  verifyReadiness(wire.readiness)
  verifyConfinementExpectation(wire.confinementExpectations)
  const packageIdentity = verifyPackageIdentity(wire.packageIdentity, input.request.toolId)
  const bundle = verifyBundleIdentity(wire.bundleIdentity)
  const runtimeIdentity = verifyRuntimeIdentity(wire.runtimeIdentity)
  const semanticEvidence = verifySemanticEvidence(wire.semanticEvidence)
  const processResourceUsage = verifyResourceUsage(wire.processResourceUsage)
  const artifacts = arrayValue(wire.artifacts, 'Structured runner artifacts')
  if (artifacts.length !== 2) throw evidenceFailure('Structured runner must emit exactly two artifacts.')
  const svgArtifact = artifactByKind(artifacts, 'svg', 'image/svg+xml')
  const verificationArtifact = artifactByKind(
    artifacts,
    'verification_json',
    'application/json',
  )
  const svgBytes = decodeAndVerifyArtifact(svgArtifact, 'Structured runner SVG')
  const verificationBytes = decodeAndVerifyArtifact(
    verificationArtifact,
    'Structured runner verification JSON',
  )
  if (svgBytes.byteLength > OFFLINE_NODE_RUNNER_LIMITS.maximumSvgBytes) {
    throw evidenceFailure('Structured runner SVG exceeded its fixed output ceiling.')
  }
  if (verificationBytes.byteLength > OFFLINE_NODE_RUNNER_LIMITS.maximumVerificationJsonBytes) {
    throw evidenceFailure('Structured runner verification JSON exceeded its fixed output ceiling.')
  }
  verifySvg(svgBytes.toString('utf8'), input.request.toolId)
  const verificationDocument = verifyVerificationDocument({
    serialized: verificationBytes.toString('utf8'),
    request: input.request,
    packageName: packageIdentity.packageName,
    runnerInputSha256: String(wire.inputSha256),
    svgSha256: String(svgArtifact.sha256),
    svgByteLength: svgBytes.byteLength,
    invokedEntrypoints: packageIdentity.invokedEntrypoints,
    semanticEvidence,
  })
  const evidence: OfflineNodeStructuredExecutionEvidence = {
    toolId: input.request.toolId,
    operationId: input.request.operationId,
    requestEnvelopeSha256,
    runnerInputSha256: String(wire.inputSha256),
    packageName: packageIdentity.packageName,
    packageVersion: packageIdentity.version,
    packageJsonSha256: packageIdentity.packageJsonSha256,
    invokedEntrypoints: packageIdentity.invokedEntrypoints,
    runnerBundleSha256: bundle.sha256,
    runnerBundleByteLength: bundle.byteLength,
    svgSha256: String(svgArtifact.sha256),
    svgByteLength: svgBytes.byteLength,
    verificationJsonSha256: String(verificationArtifact.sha256),
    verificationJsonByteLength: verificationBytes.byteLength,
    semanticEvidence,
    runtimeIdentity,
    processResourceUsage,
    confinement: input.container.confinement,
    containerExitCode: 0,
    oomKilled: false,
  }
  return {
    evidence,
    svg: {
      mimeType: 'image/svg+xml',
      bytes: Buffer.from(svgBytes),
      sha256: evidence.svgSha256,
      byteLength: evidence.svgByteLength,
    },
    verificationJson: {
      mimeType: 'application/json',
      bytes: Buffer.from(verificationBytes),
      document: verificationDocument,
      sha256: evidence.verificationJsonSha256,
      byteLength: evidence.verificationJsonByteLength,
    },
  }
}

async function createAndPersistAttestation(input: {
  image: OfflineNodeStructuredExecutionImageEvidence
  request: OfflineNodeStructuredExecutionRequest
  evidence: OfflineNodeStructuredExecutionEvidence
}): Promise<OfflineNodeStructuredExecutionAttestation> {
  const completedAt = new Date().toISOString()
  const recordId = sha256AuthorityValue({
    completedAt,
    imageIdentityHash: input.image.imageIdentityHash,
    requestEnvelopeSha256: input.evidence.requestEnvelopeSha256,
    runnerInputSha256: input.evidence.runnerInputSha256,
    svgSha256: input.evidence.svgSha256,
    verificationJsonSha256: input.evidence.verificationJsonSha256,
    processResourceUsage: input.evidence.processResourceUsage,
  })
  const withoutHash = {
    schemaVersion: OFFLINE_NODE_STRUCTURED_EXECUTION_ATTESTATION_VERSION,
    source: 'private_local_docker_structured_payload_execution' as const,
    recordId,
    completedAt,
    requestIdentity: {
      toolId: input.request.toolId,
      operationId: input.request.operationId,
      requestEnvelopeSha256: input.evidence.requestEnvelopeSha256,
    },
    image: input.image,
    execution: input.evidence,
    readiness: {
      privateInternalOnly: true as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      canonicalDispatchIntegrated: false as const,
    },
    blockers: BLOCKERS,
  }
  const attestation: OfflineNodeStructuredExecutionAttestation = {
    ...withoutHash,
    attestationHash: sha256AuthorityValue(withoutHash),
  }
  const persisted: PersistedOfflineNodeStructuredExecutionAttestation = {
    recordVersion: OFFLINE_NODE_STRUCTURED_EXECUTION_RECORD_VERSION,
    source: 'private_local_checksum_protected_structured_execution',
    attestation,
    checksumSha256: sha256AuthorityValue(attestation),
  }
  const content = `${stableAuthorityStringify(persisted)}\n`
  if (Buffer.byteLength(content, 'utf8') > 512 * 1024) {
    throw evidenceFailure('Structured execution attestation exceeded its fixed private byte ceiling.')
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT,
    relativePath: attestationRelativePath(recordId),
    content,
  })
  return attestation
}

function verifyReadiness(value: unknown): void {
  const record = asRecord(value, 'Structured runner readiness')
  assertExactKeys(record, [
    'privateInternalOnly',
    'productReady',
    'externalBetaReady',
    'productionReady',
    'canonicalDispatchIntegrated',
  ])
  if (
    record.privateInternalOnly !== true ||
    record.productReady !== false ||
    record.externalBetaReady !== false ||
    record.productionReady !== false ||
    record.canonicalDispatchIntegrated !== false
  ) {
    throw evidenceFailure('Structured runner readiness boundary is invalid.')
  }
}

function verifyConfinementExpectation(value: unknown): void {
  const record = asRecord(value, 'Structured runner confinement expectation')
  assertExactKeys(record, [
    'networkMode',
    'readOnlyRootFilesystem',
    'nonRootUid',
    'noCallerMounts',
    'noCallerEnvironment',
    'noCallerCommandOrEntrypoint',
    'noCallerPathsUrlsCommandsCodeOrSecrets',
  ])
  if (
    record.networkMode !== 'none' ||
    record.readOnlyRootFilesystem !== true ||
    record.nonRootUid !== 10_001 ||
    record.noCallerMounts !== true ||
    record.noCallerEnvironment !== true ||
    record.noCallerCommandOrEntrypoint !== true ||
    record.noCallerPathsUrlsCommandsCodeOrSecrets !== true
  ) {
    throw evidenceFailure('Structured runner confinement expectation is invalid.')
  }
}

function verifyPackageIdentity(value: unknown, toolId: OfflineNodeStructuredExecutionRequest['toolId']) {
  const record = asRecord(value, 'Structured runner package identity')
  assertExactKeys(record, ['packageName', 'version', 'packageJsonSha256', 'invokedEntrypoints'])
  const expected = OFFLINE_NODE_STRUCTURED_PACKAGE_IDENTITIES[toolId]
  const invokedEntrypoints = stringArray(record.invokedEntrypoints, 'Invoked package entrypoints')
  if (
    record.packageName !== expected.packageName ||
    record.version !== expected.version ||
    typeof record.packageJsonSha256 !== 'string' ||
    !SHA256_PATTERN.test(record.packageJsonSha256) ||
    invokedEntrypoints.length < 1 ||
    invokedEntrypoints.some((entrypoint) => entrypoint.length > 120)
  ) {
    throw evidenceFailure('Structured runner package identity is invalid.')
  }
  return {
    packageName: expected.packageName,
    version: expected.version,
    packageJsonSha256: record.packageJsonSha256,
    invokedEntrypoints,
  }
}

function verifyBundleIdentity(value: unknown): { sha256: string; byteLength: number } {
  const record = asRecord(value, 'Structured runner bundle identity')
  assertExactKeys(record, ['sha256', 'byteLength'])
  if (
    typeof record.sha256 !== 'string' ||
    !SHA256_PATTERN.test(record.sha256) ||
    !Number.isSafeInteger(record.byteLength) ||
    Number(record.byteLength) < 16_000
  ) {
    throw evidenceFailure('Structured runner bundle identity is invalid.')
  }
  return { sha256: record.sha256, byteLength: Number(record.byteLength) }
}

function verifyRuntimeIdentity(value: unknown): OfflineNodeStructuredExecutionEvidence['runtimeIdentity'] {
  const record = asRecord(value, 'Structured runner runtime identity')
  assertExactKeys(record, ['nodeVersion', 'platform', 'architecture', 'uid', 'gid'])
  if (
    typeof record.nodeVersion !== 'string' ||
    !/^v24\./.test(record.nodeVersion) ||
    record.platform !== 'linux' ||
    typeof record.architecture !== 'string' ||
    record.uid !== 10_001 ||
    record.gid !== 10_001
  ) {
    throw evidenceFailure('Structured runner runtime identity is invalid.')
  }
  return {
    nodeVersion: record.nodeVersion,
    platform: 'linux',
    architecture: record.architecture,
    uid: 10_001,
    gid: 10_001,
  }
}

function verifySemanticEvidence(value: unknown): OfflineNodeRunnerSvgSemanticEvidence {
  const record = asRecord(value, 'Structured runner semantic evidence')
  const integerFields = [
    'svgRootCount',
    'elementCount',
    'textElementCount',
    'pathElementCount',
    'rectElementCount',
    'groupElementCount',
  ] as const
  if (
    integerFields.some((field) => !Number.isSafeInteger(record[field]) || Number(record[field]) < 0) ||
    record.svgRootCount !== 1 ||
    Number(record.elementCount) < 1 ||
    record.unsafeMarkupRejected !== true ||
    record.externalReferencesRejected !== true ||
    record.finiteNumericOutputVerified !== true ||
    (record.declaredWidth !== undefined && (!Number.isFinite(record.declaredWidth) || Number(record.declaredWidth) <= 0)) ||
    (record.declaredHeight !== undefined && (!Number.isFinite(record.declaredHeight) || Number(record.declaredHeight) <= 0)) ||
    (record.viewBox !== undefined && typeof record.viewBox !== 'string')
  ) {
    throw evidenceFailure('Structured runner semantic evidence is invalid.')
  }
  return record as unknown as OfflineNodeRunnerSvgSemanticEvidence
}

function verifyResourceUsage(value: unknown): Readonly<Record<string, number>> {
  const record = asRecord(value, 'Structured runner resource usage')
  const fields = [
    'wallTimeMicroseconds',
    'userCpuMicroseconds',
    'systemCpuMicroseconds',
    'maxRssKilobytes',
    'minorPageFaults',
    'majorPageFaults',
    'voluntaryContextSwitches',
    'involuntaryContextSwitches',
    'fsReadOperations',
    'fsWriteOperations',
    'rssBytesBefore',
    'rssBytesAfter',
    'heapUsedBytesBefore',
    'heapUsedBytesAfter',
  ] as const
  assertExactKeys(record, fields)
  if (
    fields.some((field) => !Number.isSafeInteger(record[field]) || Number(record[field]) < 0) ||
    Number(record.wallTimeMicroseconds) === 0 ||
    Number(record.maxRssKilobytes) === 0 ||
    Number(record.rssBytesBefore) === 0 ||
    Number(record.rssBytesAfter) === 0
  ) {
    throw evidenceFailure('Structured runner resource evidence is invalid.')
  }
  return Object.freeze(Object.fromEntries(fields.map((field) => [field, Number(record[field])])))
}

function artifactByKind(
  artifacts: readonly unknown[],
  artifactKind: 'svg' | 'verification_json',
  mimeType: 'image/svg+xml' | 'application/json',
): Record<string, unknown> {
  const matching = artifacts.filter((artifact) => {
    const record = asRecord(artifact, 'Structured runner artifact')
    return record.artifactKind === artifactKind
  })
  if (matching.length !== 1) throw evidenceFailure(`Structured runner must emit one ${artifactKind}.`)
  const artifact = asRecord(matching[0], `${artifactKind} artifact`)
  assertExactKeys(artifact, [
    'artifactKind',
    'mimeType',
    'sha256',
    'byteLength',
    'bytesBase64',
    'privateArtifactRequired',
    'publicUrl',
  ])
  if (
    artifact.artifactKind !== artifactKind ||
    artifact.mimeType !== mimeType ||
    artifact.privateArtifactRequired !== true ||
    artifact.publicUrl !== null ||
    typeof artifact.sha256 !== 'string' ||
    !SHA256_PATTERN.test(artifact.sha256) ||
    !Number.isSafeInteger(artifact.byteLength) ||
    Number(artifact.byteLength) < 1 ||
    typeof artifact.bytesBase64 !== 'string'
  ) {
    throw evidenceFailure(`Structured runner ${artifactKind} identity is invalid.`)
  }
  return artifact
}

function decodeAndVerifyArtifact(artifact: Record<string, unknown>, label: string): Buffer {
  const base64 = String(artifact.bytesBase64)
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) {
    throw evidenceFailure(`${label} is not canonical base64.`)
  }
  const bytes = Buffer.from(base64, 'base64')
  if (
    bytes.toString('base64') !== base64 ||
    bytes.byteLength !== artifact.byteLength ||
    sha256(bytes) !== artifact.sha256
  ) {
    throw evidenceFailure(`${label} hash or byte length is invalid.`)
  }
  return bytes
}

function verifySvg(svg: string, toolId: OfflineNodeStructuredExecutionRequest['toolId']): void {
  if (
    Buffer.byteLength(svg, 'utf8') < 64 ||
    !svg.startsWith('<svg') ||
    !svg.endsWith('</svg>') ||
    (svg.match(/<svg\b/gi)?.length ?? 0) !== 1 ||
    (svg.match(/<\/svg>/gi)?.length ?? 0) !== 1 ||
    /<(?:script|foreignObject|iframe|object|embed|link|meta|audio|video|canvas)\b/i.test(svg) ||
    /\son[a-z]+\s*=/i.test(svg) ||
    /(?:javascript:|data:|file:|vbscript:|@import\b|expression\s*\()/i.test(svg)
  ) {
    throw evidenceFailure('Structured runner SVG failed active-content verification.')
  }
  for (const match of svg.matchAll(/\b(?:href|xlink:href|src)\s*=\s*(["'])(.*?)\1/gi)) {
    if (!match[2]?.startsWith('#')) {
      throw evidenceFailure('Structured runner SVG contains an external reference.')
    }
  }
  for (const match of svg.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
    if (!match[2]?.startsWith('#')) {
      throw evidenceFailure('Structured runner SVG contains an external CSS reference.')
    }
  }
  const signatures: Readonly<Record<typeof toolId, readonly RegExp[]>> = {
    d3: [/data-reeditpro-library="d3\.line"/],
    echarts: [/reeditpro-zr-/, /ecmeta_series_index=/],
    vega_lite: [/role-mark/],
    vega: [/role-mark/],
    satori: [/<mask\b/, /<path\b/, /satori_/],
    sharp: [/(?!)/],
    svg_js: [/data-reeditpro-library="@svgdotjs\/svg\.js"/],
    viz_js: [/class="graph"/, /class="node"/],
    animejs: [/data-reeditpro-library="animejs\.animate"/, /deterministic seek proof/],
    three_js: [/data-reeditpro-library="three\.Scene"/, /Three\.js camera projection/],
  }
  if (signatures[toolId].some((signature) => !signature.test(svg))) {
    throw evidenceFailure('Structured runner SVG lacks expected library-specific semantics.')
  }
}

function verifyVerificationDocument(input: {
  serialized: string
  request: OfflineNodeStructuredExecutionRequest
  packageName: string
  runnerInputSha256: string
  svgSha256: string
  svgByteLength: number
  invokedEntrypoints: readonly string[]
  semanticEvidence: OfflineNodeRunnerSvgSemanticEvidence
}): Readonly<Record<string, unknown>> {
  const document = asRecord(parseJson(input.serialized, 'Verification JSON'), 'Verification JSON')
  assertExactKeys(document, [
    'schemaVersion',
    'protocol',
    'toolId',
    'operationId',
    'packageName',
    'invokedEntrypoints',
    'actualToolPackageExecuted',
    'source',
    'inputSha256',
    'svgSha256',
    'svgByteLength',
    'semanticEvidence',
    'networkPolicy',
    'frontendExecutionAllowed',
    'readinessScope',
  ])
  if (
    document.schemaVersion !== 'offline-node-runner-verification-v1' ||
    document.protocol !== 'offline-node-runner-v1' ||
    document.toolId !== input.request.toolId ||
    document.operationId !== input.request.operationId ||
    document.packageName !== input.packageName ||
    document.actualToolPackageExecuted !== true ||
    document.source !== 'server_resolved_in_memory' ||
    document.inputSha256 !== input.runnerInputSha256 ||
    document.svgSha256 !== input.svgSha256 ||
    document.svgByteLength !== input.svgByteLength ||
    document.networkPolicy !== 'offline_no_caller_targets_no_provider_calls' ||
    document.frontendExecutionAllowed !== false ||
    document.readinessScope !== 'tool_specific_operation_evidence_only' ||
    stableAuthorityStringify(document.invokedEntrypoints) !== stableAuthorityStringify(input.invokedEntrypoints) ||
    stableAuthorityStringify(document.semanticEvidence) !== stableAuthorityStringify(input.semanticEvidence)
  ) {
    throw evidenceFailure('Verification JSON does not bind the structured runner output.')
  }
  return Object.freeze({ ...document })
}

function assertAttestationBoundary(record: Record<string, unknown>): void {
  const readiness = asRecord(record.readiness, 'Persisted structured execution readiness')
  const requestIdentity = asRecord(record.requestIdentity, 'Persisted request identity')
  const execution = asRecord(record.execution, 'Persisted execution evidence')
  if (
    record.schemaVersion !== OFFLINE_NODE_STRUCTURED_EXECUTION_ATTESTATION_VERSION ||
    record.source !== 'private_local_docker_structured_payload_execution' ||
    readiness.privateInternalOnly !== true ||
    readiness.productReady !== false ||
    readiness.externalBetaReady !== false ||
    readiness.productionReady !== false ||
    readiness.canonicalDispatchIntegrated !== false ||
    typeof requestIdentity.requestEnvelopeSha256 !== 'string' ||
    !SHA256_PATTERN.test(requestIdentity.requestEnvelopeSha256) ||
    execution.requestEnvelopeSha256 !== requestIdentity.requestEnvelopeSha256 ||
    !Array.isArray(record.blockers) ||
    record.blockers.length < 5
  ) {
    throw evidenceFailure('Persisted structured execution attestation boundary is invalid.')
  }
}

function attestationRelativePath(recordId: string): string {
  return `attestations/${recordId.slice(0, 2)}/${recordId}.json`
}

function parseJson(serialized: string, label: string): unknown {
  try {
    return JSON.parse(serialized)
  } catch {
    throw evidenceFailure(`${label} is not valid JSON.`)
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw evidenceFailure(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((nested) => typeof nested !== 'string')) {
    throw evidenceFailure(`${label} must be a string array.`)
  }
  return value
}

function arrayValue(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw evidenceFailure(`${label} must be an array.`)
  return value
}

function assertExactKeys(record: Record<string, unknown>, expected: readonly string[]): void {
  if (Object.keys(record).sort().join('\u0000') !== [...expected].sort().join('\u0000')) {
    throw evidenceFailure('Structured execution evidence contains unsupported or missing fields.')
  }
}

function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex')
}

function evidenceFailure(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503)
}
