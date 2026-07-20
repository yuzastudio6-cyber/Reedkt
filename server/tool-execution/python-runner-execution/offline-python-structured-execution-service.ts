import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../../security/private-local-persistence'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { normalizePrivateEmbeddedProcessResourceObservation } from '../private-embedded-process-resource-observation'
import {
  inspectExistingOfflinePythonStructuredDockerRuntime,
  prepareOfflinePythonStructuredDockerRuntime,
  runOfflinePythonStructuredContainer,
} from './offline-python-structured-docker-runtime'
import {
  OFFLINE_PYTHON_STRUCTURED_CONTAINER_PROTOCOL,
  OFFLINE_PYTHON_STRUCTURED_OPERATIONS,
  offlinePythonStructuredRequestSha256,
  stableStringify,
  validateOfflinePythonStructuredExecutionRequest,
  type OfflinePythonStructuredExecutionRequest,
  type OfflinePythonStructuredToolId,
} from './offline-python-structured-execution-protocol'
import {
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_ATTESTATION_VERSION,
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_RECORD_VERSION,
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_RESULT_VERSION,
  OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RECORD_VERSION,
  OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_VERSION,
  type OfflinePythonStructuredExecutionAttestation,
  type OfflinePythonStructuredExecutionEvidence,
  type OfflinePythonStructuredExecutionResult,
  type OfflinePythonStructuredImageEvidence,
  type OfflinePythonStructuredRuntimeAuthority,
  type PersistedOfflinePythonStructuredExecutionAttestation,
  type PersistedOfflinePythonStructuredRuntimeAuthority,
} from './offline-python-structured-execution-types'

export const OFFLINE_PYTHON_STRUCTURED_EXECUTION_STORAGE_ROOT =
  '/tmp/reeditpro-offline-python-structured-execution' as const
export const OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH =
  'runtime-authority/offline-python-structured-runtime-v1.json' as const

export const OFFLINE_PYTHON_STRUCTURED_PACKAGE_IDENTITIES = Object.freeze({
  duckdb: { packageName: 'duckdb', version: '1.5.4' },
  polars: { packageName: 'polars', version: '1.42.1' },
  opentimelineio: { packageName: 'opentimelineio', version: '0.18.1' },
  pyav: { packageName: 'pyav', version: '18.0.0' },
  opencv: { packageName: 'opencv-python-headless', version: '5.0.0' },
  pyscenedetect: { packageName: 'scenedetect', version: '0.7' },
  scipy: { packageName: 'scipy', version: '1.18.0' },
  pyloudnorm: { packageName: 'pyloudnorm', version: '0.2.0' },
  pydub: { packageName: 'pydub', version: '0.25.1' },
  pydub_effects: { packageName: 'pydub', version: '0.25.1' },
  ebu_r128_pyloudnorm: { packageName: 'pyloudnorm', version: '0.2.0' },
  audioread: { packageName: 'audioread', version: '3.1.0' },
  resampy: { packageName: 'resampy', version: '0.4.3' },
  pedalboard: { packageName: 'pedalboard', version: '0.9.24' },
  mir_eval: { packageName: 'mir_eval', version: '0.8.2' },
  mido: { packageName: 'mido', version: '1.3.3' },
  pretty_midi: { packageName: 'pretty_midi', version: '0.2.11' },
  noisereduce: { packageName: 'noisereduce', version: '3.0.3' },
  librosa: { packageName: 'librosa', version: '0.11.0' },
} as const)
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const BLOCKERS = Object.freeze([
  'Execution evidence is private-local only and is not deployed worker-fleet, multi-architecture, or service-identity evidence.',
  'Canonical dispatch, lease, artifact, QA, cost, render, export, settlement, and delivery integration is not yet complete for this Python runner class.',
  'Only the enumerated structured data, media, and audio fixed operations are implemented; media bytes must be server-injected from approved source authority and no caller SQL, Python, path, URL, command, environment, network, or general code execution is enabled.',
  'Product, external-beta, and production promotion still require image scanning, distributed recovery, observability, retention, quota, and incident-response evidence.',
] as const)

export interface PrivateOfflinePythonStructuredExecutionRuntime {
  readonly image: OfflinePythonStructuredImageEvidence
  execute(request: unknown): Promise<OfflinePythonStructuredExecutionResult>
}

export async function createPrivateOfflinePythonStructuredExecutionRuntime():
Promise<PrivateOfflinePythonStructuredExecutionRuntime> {
  if (arguments.length !== 0) throw validationFailure('Python runtime activation accepts no caller input.')
  const image = await prepareOfflinePythonStructuredDockerRuntime()
  await persistRuntimeAuthority(image)
  return Object.freeze({ image, execute: (request: unknown) => executeWithImage(image, request) })
}

export async function openPersistedPrivateOfflinePythonStructuredExecutionRuntime():
Promise<PrivateOfflinePythonStructuredExecutionRuntime> {
  if (arguments.length !== 0) throw validationFailure('Python runtime open accepts no caller input.')
  const authority = await readPersistedOfflinePythonStructuredRuntimeAuthority()
  if (!authority || !authority.readiness.privateInternalExecutionReady) {
    throw runtimeFailure('Verified private structured Python runtime authority is unavailable.')
  }
  const image = await inspectExistingOfflinePythonStructuredDockerRuntime()
  if (
    image.imageIdentityHash !== authority.image.imageIdentityHash ||
    stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)
  ) {
    throw runtimeFailure('Existing structured Python image no longer matches persisted authority.')
  }
  return Object.freeze({ image, execute: (request: unknown) => executeWithImage(image, request) })
}

export async function readPersistedOfflinePythonStructuredRuntimeAuthority():
Promise<OfflinePythonStructuredRuntimeAuthority | undefined> {
  if (arguments.length !== 0) throw validationFailure('Python runtime authority read accepts no caller input.')
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: OFFLINE_PYTHON_STRUCTURED_EXECUTION_STORAGE_ROOT,
    relativePath: OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH,
  })
  if (!content) return undefined
  const record = asRecord(parseJson(content, 'Python runtime authority'), 'Python runtime authority')
  assertExactKeys(record, ['recordVersion', 'source', 'authority', 'checksumSha256'])
  const authority = asRecord(record.authority, 'Python runtime authority body')
  if (
    record.recordVersion !== OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RECORD_VERSION ||
    record.source !== 'private_local_checksum_protected_python_runtime_authority' ||
    record.checksumSha256 !== sha256AuthorityValue(authority)
  ) {
    throw runtimeFailure('Persisted Python runtime authority checksum is invalid.')
  }
  const { authorityHash, ...withoutHash } = authority
  if (authorityHash !== sha256AuthorityValue(withoutHash)) {
    throw runtimeFailure('Persisted Python runtime authority content hash is invalid.')
  }
  assertRuntimeAuthority(authority)
  return authority as unknown as OfflinePythonStructuredRuntimeAuthority
}

export async function readPersistedOfflinePythonStructuredExecutionAttestation(
  recordId: string,
): Promise<OfflinePythonStructuredExecutionAttestation | undefined> {
  if (!SHA256_PATTERN.test(recordId)) throw validationFailure('Python execution attestation identity is invalid.')
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: OFFLINE_PYTHON_STRUCTURED_EXECUTION_STORAGE_ROOT,
    relativePath: attestationRelativePath(recordId),
  })
  if (!content) return undefined
  const record = asRecord(parseJson(content, 'Python execution attestation'), 'Python execution attestation')
  assertExactKeys(record, ['recordVersion', 'source', 'attestation', 'checksumSha256'])
  const attestation = asRecord(record.attestation, 'Python execution attestation body')
  if (
    record.recordVersion !== OFFLINE_PYTHON_STRUCTURED_EXECUTION_RECORD_VERSION ||
    record.source !== 'private_local_checksum_protected_python_execution' ||
    record.checksumSha256 !== sha256AuthorityValue(attestation) ||
    attestation.recordId !== recordId
  ) {
    throw runtimeFailure('Persisted Python execution attestation is invalid.')
  }
  const { attestationHash, ...withoutHash } = attestation
  if (attestationHash !== sha256AuthorityValue(withoutHash)) {
    throw runtimeFailure('Persisted Python execution attestation hash is invalid.')
  }
  return attestation as unknown as OfflinePythonStructuredExecutionAttestation
}

async function executeWithImage(
  image: OfflinePythonStructuredImageEvidence,
  requestValue: unknown,
): Promise<OfflinePythonStructuredExecutionResult> {
  let request: OfflinePythonStructuredExecutionRequest
  try {
    request = validateOfflinePythonStructuredExecutionRequest(requestValue)
  } catch {
    throw validationFailure('Structured Python execution request was rejected.')
  }
  const container = await runOfflinePythonStructuredContainer({
    image,
    serializedRequest: stableStringify(request),
  })
  if (container.exitCode !== 0 || container.oomKilled || container.stderr.trim()) {
    throw runtimeFailure(
      'Validated structured Python container failed closed.',
      new Error([
        `exitCode=${container.exitCode}`,
        `oomKilled=${container.oomKilled}`,
        container.stderr.slice(-4_000),
        container.stdout.slice(-4_000),
      ].join('\n')),
    )
  }
  const wire = asRecord(parseJson(container.stdout, 'Python runner output'), 'Python runner output')
  assertExactKeys(wire, [
    'schemaVersion', 'ok', 'toolId', 'operationId', 'status', 'actualToolPackageExecuted',
    'packageIdentity', 'requestEnvelopeSha256', 'result', 'resultCanonicalJson', 'resultSha256', 'semanticEvidence',
    'runtimeIdentity', 'processResourceUsage', 'resourceObservation', 'confinementExpectations', 'readiness',
  ])
  const packageIdentity = asRecord(wire.packageIdentity, 'Python package identity')
  const runtimeIdentity = asRecord(wire.runtimeIdentity, 'Python runtime identity')
  const semanticEvidence = asRecord(wire.semanticEvidence, 'Python semantic evidence')
  const processResourceUsage = numericRecord(wire.processResourceUsage, 'Python resource usage')
  const resourceObservation = normalizePrivateEmbeddedProcessResourceObservation({
    wireObservation: wire.resourceObservation,
    measurementAgentDigest: image.runnerSha256,
    containerIdentityDigest: container.containerIdentityDigest,
  })
  const result = asRecord(wire.result, 'Python result')
  if (typeof wire.resultCanonicalJson !== 'string') {
    throw runtimeFailure('Structured Python result canonical JSON is unavailable.')
  }
  const canonicalResult = asRecord(
    parseJson(wire.resultCanonicalJson, 'Python canonical result'),
    'Python canonical result',
  )
  const requestHash = offlinePythonStructuredRequestSha256(request)
  const resultHash = sha256Text(wire.resultCanonicalJson)
  if (
    wire.schemaVersion !== OFFLINE_PYTHON_STRUCTURED_CONTAINER_PROTOCOL || wire.ok !== true ||
    wire.toolId !== request.toolId || wire.operationId !== request.operationId ||
    wire.status !== 'actual_library_operation_completed' || wire.actualToolPackageExecuted !== true ||
    packageIdentity.packageName !== OFFLINE_PYTHON_STRUCTURED_PACKAGE_IDENTITIES[request.toolId].packageName ||
    packageIdentity.version !== OFFLINE_PYTHON_STRUCTURED_PACKAGE_IDENTITIES[request.toolId].version ||
    wire.requestEnvelopeSha256 !== requestHash || wire.resultSha256 !== resultHash ||
    stableStringify(canonicalResult) !== stableStringify(result) ||
    runtimeIdentity.pythonVersion !== '3.13.11' || runtimeIdentity.platform !== 'linux' ||
    typeof runtimeIdentity.architecture !== 'string' || runtimeIdentity.uid !== 10_001 || runtimeIdentity.gid !== 10_001
  ) {
    throw runtimeFailure('Structured Python runner identity or result commitment is invalid.')
  }
  verifyWireConfinement(wire.confinementExpectations)
  verifyWireReadiness(wire.readiness)
  verifySemanticEvidence(request.toolId, semanticEvidence)
  const resultBytes = Buffer.from(wire.resultCanonicalJson, 'utf8')
  if (resultBytes.byteLength <= 1 || resultBytes.byteLength > 8 * 1024 * 1024) {
    throw runtimeFailure('Structured Python result exceeded its fixed byte ceiling.')
  }
  const evidence: OfflinePythonStructuredExecutionEvidence = {
    toolId: request.toolId,
    operationId: request.operationId,
    packageName: OFFLINE_PYTHON_STRUCTURED_PACKAGE_IDENTITIES[request.toolId].packageName,
    packageVersion: OFFLINE_PYTHON_STRUCTURED_PACKAGE_IDENTITIES[request.toolId].version,
    requestEnvelopeSha256: requestHash,
    resultSha256: resultHash,
    semanticEvidence,
    runtimeIdentity: {
      pythonVersion: '3.13.11', platform: 'linux', architecture: String(runtimeIdentity.architecture),
      uid: 10_001, gid: 10_001,
    },
    processResourceUsage,
    resourceObservation,
    confinement: container.confinement,
    containerExitCode: 0,
    oomKilled: false,
  }
  const attestation = await persistAttestation(image, request, evidence)
  return {
    schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_RESULT_VERSION,
    resultJson: {
      mimeType: 'application/json', bytes: resultBytes, document: result,
      sha256: resultHash, byteLength: resultBytes.byteLength,
    },
    evidence,
    attestation,
    readiness: attestation.readiness,
  }
}

async function persistRuntimeAuthority(
  image: OfflinePythonStructuredImageEvidence,
): Promise<OfflinePythonStructuredRuntimeAuthority> {
  const withoutHash = {
    schemaVersion: OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_VERSION,
    source: 'private_local_offline_python_structured_runtime_authority' as const,
    activatedAt: new Date().toISOString(),
    image,
    supportedOperations: (Object.keys(OFFLINE_PYTHON_STRUCTURED_OPERATIONS) as OfflinePythonStructuredToolId[])
      .map((toolId) => ({ toolId, operationId: OFFLINE_PYTHON_STRUCTURED_OPERATIONS[toolId] })),
    readiness: {
      privateInternalExecutionReady: true as const, exactStructuredPayloadOnly: true as const,
      canonicalDispatchMayReference: true as const, productReady: false as const,
      externalBetaReady: false as const, productionReady: false as const,
    },
    blockers: BLOCKERS,
  }
  const authority: OfflinePythonStructuredRuntimeAuthority = {
    ...withoutHash,
    authorityHash: sha256AuthorityValue(withoutHash),
  }
  const persisted: PersistedOfflinePythonStructuredRuntimeAuthority = {
    recordVersion: OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RECORD_VERSION,
    source: 'private_local_checksum_protected_python_runtime_authority',
    authority,
    checksumSha256: sha256AuthorityValue(authority),
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_PYTHON_STRUCTURED_EXECUTION_STORAGE_ROOT,
    relativePath: OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH,
    content: `${stableAuthorityStringify(persisted)}\n`,
  })
  return authority
}

async function persistAttestation(
  image: OfflinePythonStructuredImageEvidence,
  request: OfflinePythonStructuredExecutionRequest,
  evidence: OfflinePythonStructuredExecutionEvidence,
): Promise<OfflinePythonStructuredExecutionAttestation> {
  const completedAt = new Date().toISOString()
  const recordId = sha256AuthorityValue({
    completedAt, imageIdentityHash: image.imageIdentityHash,
    requestEnvelopeSha256: evidence.requestEnvelopeSha256,
    resultSha256: evidence.resultSha256,
    processResourceUsage: evidence.processResourceUsage,
    resourceObservationHash: evidence.resourceObservation.observationHash,
  })
  const withoutHash = {
    schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_ATTESTATION_VERSION,
    source: 'private_local_docker_structured_python_execution' as const,
    recordId,
    completedAt,
    requestIdentity: {
      toolId: request.toolId,
      operationId: request.operationId,
      requestEnvelopeSha256: evidence.requestEnvelopeSha256,
    },
    image,
    execution: evidence,
    readiness: {
      privateInternalOnly: true as const, productReady: false as const,
      externalBetaReady: false as const, productionReady: false as const,
      canonicalDispatchIntegrated: false as const,
    },
    blockers: BLOCKERS,
  }
  const attestation: OfflinePythonStructuredExecutionAttestation = {
    ...withoutHash,
    attestationHash: sha256AuthorityValue(withoutHash),
  }
  const persisted: PersistedOfflinePythonStructuredExecutionAttestation = {
    recordVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_RECORD_VERSION,
    source: 'private_local_checksum_protected_python_execution',
    attestation,
    checksumSha256: sha256AuthorityValue(attestation),
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_PYTHON_STRUCTURED_EXECUTION_STORAGE_ROOT,
    relativePath: attestationRelativePath(recordId),
    content: `${stableAuthorityStringify(persisted)}\n`,
  })
  return attestation
}

function assertRuntimeAuthority(authority: Record<string, unknown>): void {
  assertExactKeys(authority, [
    'schemaVersion', 'source', 'activatedAt', 'image', 'supportedOperations',
    'readiness', 'blockers', 'authorityHash',
  ])
  const readiness = asRecord(authority.readiness, 'Python runtime readiness')
  if (
    authority.schemaVersion !== OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_VERSION ||
    authority.source !== 'private_local_offline_python_structured_runtime_authority' ||
    typeof authority.activatedAt !== 'string' || !Number.isFinite(Date.parse(authority.activatedAt)) ||
    readiness.privateInternalExecutionReady !== true || readiness.exactStructuredPayloadOnly !== true ||
    readiness.canonicalDispatchMayReference !== true || readiness.productReady !== false ||
    readiness.externalBetaReady !== false || readiness.productionReady !== false ||
    !Array.isArray(authority.blockers) || authority.blockers.length < 1
  ) {
    throw runtimeFailure('Persisted Python runtime authority boundary is invalid.')
  }
}

function verifySemanticEvidence(toolId: OfflinePythonStructuredToolId, evidence: Record<string, unknown>): void {
  if (toolId === 'duckdb') {
    assertExactKeys(evidence, ['inputRowCount', 'outputRowCount', 'fixedProfileExecuted'])
    if (evidence.fixedProfileExecuted !== true) throw runtimeFailure('DuckDB semantic evidence is invalid.')
  } else if (toolId === 'polars') {
    assertExactKeys(evidence, ['inputRowCount', 'outputRowCount', 'deterministicOrdering'])
    if (evidence.deterministicOrdering !== true) throw runtimeFailure('Polars semantic evidence is invalid.')
  } else {
    if (toolId === 'opentimelineio') {
      assertExactKeys(evidence, ['clipCount', 'roundtripValidated', 'approvedOrderPreserved'])
      if (evidence.roundtripValidated !== true || evidence.approvedOrderPreserved !== true) {
        throw runtimeFailure('OpenTimelineIO semantic evidence is invalid.')
      }
    } else if (toolId === 'pyav') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'streamCount', 'videoSampleCount', 'timestampsPreserved'])
      if (evidence.sourceBytesVerified !== true || evidence.timestampsPreserved !== true) {
        throw runtimeFailure('PyAV semantic evidence is invalid.')
      }
    } else if (toolId === 'opencv') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'sampleCount', 'derivedPixelsEmitted', 'fixedTemporaryPathOnly'])
      if (evidence.sourceBytesVerified !== true || evidence.derivedPixelsEmitted !== false || evidence.fixedTemporaryPathOnly !== true) {
        throw runtimeFailure('OpenCV semantic evidence is invalid.')
      }
    } else if (toolId === 'pyscenedetect') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'sceneCount', 'fixedContentDetectorExecuted', 'fixedTemporaryPathOnly'])
      if (evidence.sourceBytesVerified !== true || evidence.fixedContentDetectorExecuted !== true || evidence.fixedTemporaryPathOnly !== true) {
        throw runtimeFailure('PySceneDetect semantic evidence is invalid.')
      }
    } else if (toolId === 'scipy') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'sampleCount', 'fixedWelchProfileExecuted', 'boundedAudioDecode'])
      if (evidence.sourceBytesVerified !== true || evidence.fixedWelchProfileExecuted !== true || evidence.boundedAudioDecode !== true) {
        throw runtimeFailure('SciPy semantic evidence is invalid.')
      }
    } else if (toolId === 'pyloudnorm') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'sampleCount', 'ebuR128IntegratedLoudnessExecuted', 'boundedAudioDecode'])
      if (evidence.sourceBytesVerified !== true || evidence.ebuR128IntegratedLoudnessExecuted !== true || evidence.boundedAudioDecode !== true) {
        throw runtimeFailure('pyloudnorm semantic evidence is invalid.')
      }
    } else if (toolId === 'pydub') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'sampleCount', 'fixedPydubProfileExecuted', 'boundedWavOutputProduced'])
      if (evidence.sourceBytesVerified !== true || evidence.fixedPydubProfileExecuted !== true || evidence.boundedWavOutputProduced !== true) {
        throw runtimeFailure('pydub semantic evidence is invalid.')
      }
    } else if (toolId === 'pydub_effects') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'sampleCount', 'fixedPydubEffectsRecipeExecuted', 'boundedWavOutputProduced'])
      if (evidence.sourceBytesVerified !== true || evidence.fixedPydubEffectsRecipeExecuted !== true || evidence.boundedWavOutputProduced !== true) {
        throw runtimeFailure('pydub effects semantic evidence is invalid.')
      }
    } else if (toolId === 'ebu_r128_pyloudnorm') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'sampleCount', 'explicitEbuR128GateExecuted', 'boundedAudioDecode'])
      if (evidence.sourceBytesVerified !== true || evidence.explicitEbuR128GateExecuted !== true || evidence.boundedAudioDecode !== true) {
        throw runtimeFailure('Explicit EBU R128 semantic evidence is invalid.')
      }
    } else if (toolId === 'audioread') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'decodedPcmByteCount', 'audioreadAudioOpenExecuted', 'fixedTemporaryWavOnly'])
      if (evidence.sourceBytesVerified !== true || evidence.audioreadAudioOpenExecuted !== true || evidence.fixedTemporaryWavOnly !== true) {
        throw runtimeFailure('audioread semantic evidence is invalid.')
      }
    } else if (toolId === 'resampy') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'outputSampleCount', 'resampyKaiserBestExecuted', 'boundedWavOutputProduced'])
      if (evidence.sourceBytesVerified !== true || evidence.resampyKaiserBestExecuted !== true || evidence.boundedWavOutputProduced !== true) {
        throw runtimeFailure('resampy semantic evidence is invalid.')
      }
    } else if (toolId === 'pedalboard') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'outputSampleCount', 'fixedPedalboardChainExecuted', 'boundedWavOutputProduced'])
      if (evidence.sourceBytesVerified !== true || evidence.fixedPedalboardChainExecuted !== true || evidence.boundedWavOutputProduced !== true) {
        throw runtimeFailure('pedalboard semantic evidence is invalid.')
      }
    } else if (toolId === 'mir_eval') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'referenceBeatCount', 'mirEvalBeatEvaluateExecuted', 'boundedTimingGrid'])
      if (evidence.sourceBytesVerified !== true || evidence.mirEvalBeatEvaluateExecuted !== true || evidence.boundedTimingGrid !== true) {
        throw runtimeFailure('mir_eval semantic evidence is invalid.')
      }
    } else if (toolId === 'mido') {
      assertExactKeys(evidence, ['sourceBytesVerified', 'validatedMidiEventCount', 'midoRoundtripExecuted', 'approvedTimingGridOnly'])
      if (evidence.sourceBytesVerified !== true || evidence.midoRoundtripExecuted !== true || evidence.approvedTimingGridOnly !== true) {
        throw runtimeFailure('mido semantic evidence is invalid.')
      }
    } else if (toolId === 'noisereduce') {
      assertExactKeys(evidence, [
        'sourceBytesVerified', 'outputSampleCount',
        'noisereduceStationarySpectralGateExecuted',
        'boundedVoicePreservingWavOutputProduced',
      ])
      if (
        evidence.sourceBytesVerified !== true ||
        evidence.noisereduceStationarySpectralGateExecuted !== true ||
        evidence.boundedVoicePreservingWavOutputProduced !== true
      ) {
        throw runtimeFailure('noisereduce semantic evidence is invalid.')
      }
    } else if (toolId === 'librosa') {
      assertExactKeys(evidence, [
        'sourceBytesVerified', 'analysisFrameCount',
        'librosaOnsetBeatEnergyExecuted', 'boundedTimingMap',
      ])
      if (
        evidence.sourceBytesVerified !== true ||
        evidence.librosaOnsetBeatEnergyExecuted !== true ||
        evidence.boundedTimingMap !== true
      ) {
        throw runtimeFailure('librosa semantic evidence is invalid.')
      }
    } else {
      assertExactKeys(evidence, [
        'sourceBytesVerified', 'analyzedNoteCount',
        'prettyMidiRoundtripExecuted', 'approvedTimingMapOnly',
      ])
      if (
        evidence.sourceBytesVerified !== true || evidence.prettyMidiRoundtripExecuted !== true ||
        evidence.approvedTimingMapOnly !== true
      ) {
        throw runtimeFailure('pretty_midi semantic evidence is invalid.')
      }
    }
  }
  for (const [key, value] of Object.entries(evidence)) {
    if (key.endsWith('Count') && (!Number.isSafeInteger(value) || Number(value) < 0)) {
      throw runtimeFailure('Python semantic count evidence is invalid.')
    }
  }
}

function verifyWireConfinement(value: unknown): void {
  const record = asRecord(value, 'Python confinement expectations')
  assertExactKeys(record, [
    'networkMode', 'readOnlyRootFilesystem', 'nonRootUid', 'noCallerMounts',
    'noCallerEnvironment', 'noCallerCommandOrEntrypoint',
    'noCallerPathsUrlsCommandsCodeSqlOrSecrets',
  ])
  if (
    record.networkMode !== 'none' || record.readOnlyRootFilesystem !== true ||
    record.nonRootUid !== 10_001 || record.noCallerMounts !== true ||
    record.noCallerEnvironment !== true || record.noCallerCommandOrEntrypoint !== true ||
    record.noCallerPathsUrlsCommandsCodeSqlOrSecrets !== true
  ) throw runtimeFailure('Python runner confinement expectations are invalid.')
}

function verifyWireReadiness(value: unknown): void {
  const record = asRecord(value, 'Python readiness')
  assertExactKeys(record, ['privateInternalOnly', 'productReady', 'externalBetaReady', 'productionReady'])
  if (
    record.privateInternalOnly !== true || record.productReady !== false ||
    record.externalBetaReady !== false || record.productionReady !== false
  ) throw runtimeFailure('Python runner readiness boundary is invalid.')
}

function numericRecord(value: unknown, label: string): Record<string, number> {
  const record = asRecord(value, label)
  if (
    Object.keys(record).length < 1 ||
    Object.values(record).some((entry) => typeof entry !== 'number' || !Number.isFinite(entry) || entry < 0)
  ) throw runtimeFailure(`${label} contains invalid values.`)
  return record as Record<string, number>
}

function assertExactKeys(record: Record<string, unknown>, keys: readonly string[]): void {
  if (stableAuthorityStringify(Object.keys(record).sort()) !== stableAuthorityStringify([...keys].sort())) {
    throw runtimeFailure('Structured Python evidence contains unsupported fields.')
  }
}
function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw runtimeFailure(`${label} is not an object.`)
  return value as Record<string, unknown>
}
function parseJson(value: string, label: string): unknown {
  try { return JSON.parse(value) } catch { throw runtimeFailure(`${label} is not valid JSON.`) }
}
function sha256Text(value: string): string { return createHash('sha256').update(value).digest('hex') }
function attestationRelativePath(recordId: string): string { return `attestations/${recordId.slice(0, 2)}/${recordId}.json` }
function runtimeFailure(message: string, cause?: unknown): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, undefined, {
    ...(cause === undefined ? {} : { cause }),
    internal: cause !== undefined,
  })
}
function validationFailure(message: string): ApiError { return new ApiError('VALIDATION_FAILED', message, 400) }
