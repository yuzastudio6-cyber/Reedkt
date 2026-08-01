import { createHash } from 'node:crypto'

import type {
  LivingFrameComfyUiDependencyLockAuthority,
  LivingFrameComfyUiDependencyLockEvidence,
  LivingFrameComfyUiDependencyLockEvidenceDraft,
  LivingFrameComfyUiDependencyLockIssue,
  LivingFrameComfyUiDependencyLockIssueCode,
  LivingFrameComfyUiDependencyLockValidationResult,
} from '../../src/types/living-frame-comfyui-dependency-lock-evidence'
import {
  LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_CLASS,
  LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_STATE,
  LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_VERSION,
  LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_ISSUES,
  LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OPEN_GATES,
} from '../../src/types/living-frame-comfyui-dependency-lock-evidence'
import {
  LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION,
  LIVING_FRAME_COMFYUI_LOCKED_BASE_IMAGE_DIGEST_SHA256,
  LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256,
  LIVING_FRAME_COMFYUI_LOCKED_PROMPT_PROBES,
  LIVING_FRAME_COMFYUI_LOCKED_SELECTED_NODE_CLASSES,
  LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES,
  LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS,
  LIVING_FRAME_COMFYUI_LOCKED_WHEEL_MANIFEST_DIGEST_SHA256,
  type LivingFrameComfyUiDependencyLockObservation,
} from './living-frame-comfyui-dependency-lock-manifest'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u

const observationReaders = new WeakSet<object>()
const consumedObservationReaders = new WeakSet<object>()

const AUTHORITY_BOUNDARY:
  LivingFrameComfyUiDependencyLockAuthority =
  Object.freeze({
    controlledDependencyEvidenceAuthority: true,
    offlineRebuildObservationAuthority: true,
    liveEvidenceAuthority: false,
    canonicalRuntimeHostAuthority: false,
    canonicalImageAuthority: false,
    canonicalArtifactRepositoryAuthority: false,
    modelArtifactAuthority: false,
    gpuExecutionAuthority: false,
    providerAuthority: false,
    modelAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    selectedSceneAuthority: false,
    promptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    artifactCreationAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameComfyUiDependencyLockObservationReader {
  readonly readerClass:
    'process_bound_server_owned_living_frame_comfyui_dependency_lock_observation_reader_v1'
  readonly callerJsonAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly callerBytesAccepted: false
  readonly buildAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
  readControlledDependencyLockObservation():
    Promise<unknown>
}

export interface CreateLivingFrameComfyUiDependencyLockEvidenceInput {
  readonly evidenceId: string
  readonly observationReader:
    LivingFrameComfyUiDependencyLockObservationReader | null
}

export class LivingFrameComfyUiDependencyLockEvidenceError
  extends Error {
  readonly issues:
    readonly LivingFrameComfyUiDependencyLockIssue[]

  constructor(
    issues:
      readonly LivingFrameComfyUiDependencyLockIssue[],
  ) {
    super(
      'Living Frame ComfyUI dependency-lock evidence failed.',
    )
    this.name =
      'LivingFrameComfyUiDependencyLockEvidenceError'
    this.issues = issues
  }
}

export function createLivingFrameComfyUiDependencyLockObservationReader(
  input: {
    readonly readControlledDependencyLockObservation:
      LivingFrameComfyUiDependencyLockObservationReader[
        'readControlledDependencyLockObservation'
      ]
  },
): LivingFrameComfyUiDependencyLockObservationReader {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'readControlledDependencyLockObservation',
    ])
    || typeof input.readControlledDependencyLockObservation
      !== 'function'
  ) {
    throw invalid('reader_invalid', '$.observationReader')
  }
  const reader =
    Object.freeze<
      LivingFrameComfyUiDependencyLockObservationReader
    >({
      readerClass:
        'process_bound_server_owned_living_frame_comfyui_dependency_lock_observation_reader_v1',
      callerJsonAccepted: false,
      callerPathAccepted: false,
      callerUrlAccepted: false,
      callerBytesAccepted: false,
      buildAuthority: false,
      runtimeAuthority: false,
      productionReady: false,
      readControlledDependencyLockObservation:
        input.readControlledDependencyLockObservation
          .bind(undefined),
    })
  observationReaders.add(reader)
  return reader
}

export async function createLivingFrameComfyUiDependencyLockEvidence(
  input: CreateLivingFrameComfyUiDependencyLockEvidenceInput,
): Promise<LivingFrameComfyUiDependencyLockEvidence> {
  assertInput(input)
  const reader = requireReader(input.observationReader)
  consumedObservationReaders.add(reader)
  let packet: unknown
  try {
    packet =
      await reader
        .readControlledDependencyLockObservation()
  } catch {
    throw invalid('reader_failed', '$.observationReader')
  }
  assertObservation(packet)
  const draft = compileDraft(input.evidenceId)
  assertOutputSafe(draft)
  return deepFreeze({
    ...draft,
    evidenceDigestSha256: digest(draft),
  })
}

export function verifyLivingFrameComfyUiDependencyLockEvidence(
  value: unknown,
): LivingFrameComfyUiDependencyLockValidationResult {
  try {
    if (
      !isRecord(value)
      || typeof value.evidenceId !== 'string'
      || !SAFE_ID.test(value.evidenceId)
    ) {
      return failure('input_invalid', '$')
    }
    const draft = compileDraft(value.evidenceId)
    assertOutputSafe(draft)
    const expected = {
      ...draft,
      evidenceDigestSha256: digest(draft),
    }
    if (canonicalJson(value) !== canonicalJson(expected)) {
      return failure(
        'digest_mismatch',
        '$.evidenceDigestSha256',
      )
    }
    return {
      ok: true,
      evidence:
        deepFreeze(
          expected,
        ) as LivingFrameComfyUiDependencyLockEvidence,
    }
  } catch (error) {
    if (
      error instanceof
        LivingFrameComfyUiDependencyLockEvidenceError
    ) {
      return { ok: false, issues: error.issues }
    }
    return failure('input_invalid', '$')
  }
}

function compileDraft(
  evidenceId: string,
): LivingFrameComfyUiDependencyLockEvidenceDraft {
  return {
    contractVersion:
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_VERSION,
    evidenceClass:
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_CLASS,
    evidenceId,
    evidenceState:
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_STATE,
    targetPlatform:
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
        .targetPlatform,
    baseImage:
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
        .baseImage,
    wheelLock:
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
        .wheelLock,
    sourceLock:
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
        .sourceLock,
    controlledOfflineBuild:
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
        .controlledOfflineBuild,
    controlledRuntimeProbe:
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
        .controlledRuntimeProbe,
    openGateCodes:
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    processBoundSingleUseReaderConsumed: true,
    exactWheelArtifactsObserved: true,
    exactSourceArchivesObserved: true,
    offlineRebuildObserved: true,
    deterministicCpuPromptProbesObserved: true,
    containsUrlPathCredentialSecretRawBytesOrExecutableCode:
      false,
    providerTransportCalled: false,
    canonicalOperationDispatched: false,
    selectedSceneCreated: false,
    artifactPersistedToCanonicalRepository: false,
    productionReady: false,
  }
}

function assertInput(
  input: CreateLivingFrameComfyUiDependencyLockEvidenceInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'evidenceId',
      'observationReader',
    ])
    || typeof input.evidenceId !== 'string'
    || !SAFE_ID.test(input.evidenceId)
  ) {
    throw invalid('input_invalid', '$')
  }
}

function requireReader(
  reader:
    LivingFrameComfyUiDependencyLockObservationReader | null,
): LivingFrameComfyUiDependencyLockObservationReader {
  if (
    !reader
    || !observationReaders.has(reader)
    || !hasExactKeys(reader, [
      'readerClass',
      'callerJsonAccepted',
      'callerPathAccepted',
      'callerUrlAccepted',
      'callerBytesAccepted',
      'buildAuthority',
      'runtimeAuthority',
      'productionReady',
      'readControlledDependencyLockObservation',
    ])
    || reader.readerClass
      !==
        'process_bound_server_owned_living_frame_comfyui_dependency_lock_observation_reader_v1'
    || reader.callerJsonAccepted !== false
    || reader.callerPathAccepted !== false
    || reader.callerUrlAccepted !== false
    || reader.callerBytesAccepted !== false
    || reader.buildAuthority !== false
    || reader.runtimeAuthority !== false
    || reader.productionReady !== false
  ) {
    throw invalid('reader_invalid', '$.observationReader')
  }
  if (consumedObservationReaders.has(reader)) {
    throw invalid('reader_reused', '$.observationReader')
  }
  return reader
}

function assertObservation(
  value: unknown,
): asserts value is LivingFrameComfyUiDependencyLockObservation {
  if (!isRecord(value)) {
    throw invalid('observation_invalid', '$.observation')
  }
  if (
    !hasExactKeys(value, [
      'targetPlatform',
      'baseImage',
      'wheelLock',
      'sourceLock',
      'controlledOfflineBuild',
      'controlledRuntimeProbe',
    ])
  ) {
    throw invalid('observation_invalid', '$.observation')
  }
  assertExactPart(
    value.targetPlatform,
    LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
      .targetPlatform,
    'observation_invalid',
    '$.observation.targetPlatform',
  )
  assertExactPart(
    value.baseImage,
    LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
      .baseImage,
    'base_image_mismatch',
    '$.observation.baseImage',
  )
  assertWheelLock(value.wheelLock)
  assertSourceLock(value.sourceLock)
  assertExactPart(
    value.controlledOfflineBuild,
    LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
      .controlledOfflineBuild,
    'offline_build_mismatch',
    '$.observation.controlledOfflineBuild',
  )
  assertRuntimeProbe(value.controlledRuntimeProbe)
}

function assertWheelLock(value: unknown): void {
  if (!isRecord(value)) {
    throw invalid(
      'wheel_count_mismatch',
      '$.observation.wheelLock',
    )
  }
  if (value.wheelArtifactCount !== 35) {
    throw invalid(
      'wheel_count_mismatch',
      '$.observation.wheelLock.wheelArtifactCount',
    )
  }
  if (
    !Array.isArray(value.artifacts)
    || value.artifacts.length !== 35
  ) {
    throw invalid(
      'wheel_count_mismatch',
      '$.observation.wheelLock.artifacts',
    )
  }
  for (
    let index = 0;
    index < LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS.length;
    index += 1
  ) {
    const actual = value.artifacts[index]
    const expected =
      LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS[index]
    if (
      !isRecord(actual)
      || actual.order !== index
    ) {
      throw invalid(
        'wheel_order_mismatch',
        `$.observation.wheelLock.artifacts[${index}]`,
      )
    }
    assertExactPart(
      actual,
      expected,
      'wheel_artifact_mismatch',
      `$.observation.wheelLock.artifacts[${index}]`,
    )
  }
  if (
    value.wheelArtifactTotalByteLength
      !== 486_459_097
  ) {
    throw invalid(
      'wheel_total_byte_length_mismatch',
      '$.observation.wheelLock.wheelArtifactTotalByteLength',
    )
  }
  if (
    value.wheelManifestDigestSha256
      !==
        LIVING_FRAME_COMFYUI_LOCKED_WHEEL_MANIFEST_DIGEST_SHA256
    || wheelManifestDigest(value.artifacts)
      !==
        LIVING_FRAME_COMFYUI_LOCKED_WHEEL_MANIFEST_DIGEST_SHA256
  ) {
    throw invalid(
      'wheel_manifest_digest_mismatch',
      '$.observation.wheelLock.wheelManifestDigestSha256',
    )
  }
  assertExactPart(
    value,
    LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
      .wheelLock,
    'wheel_artifact_mismatch',
    '$.observation.wheelLock',
  )
}

function wheelManifestDigest(
  artifacts: readonly unknown[],
): string {
  const rows = artifacts.map((artifact) => {
    if (!isRecord(artifact)) {
      throw invalid(
        'wheel_artifact_mismatch',
        '$.observation.wheelLock.artifacts',
      )
    }
    return {
      byteLength: artifact.byteLength,
      filename: artifact.artifactFileName,
      name: artifact.distributionName,
      sha256: artifact.sha256,
      version: artifact.version,
    }
  })
  return digest(rows)
}

function assertSourceLock(value: unknown): void {
  if (!isRecord(value)) {
    throw invalid(
      'source_archive_count_mismatch',
      '$.observation.sourceLock',
    )
  }
  if (
    value.sourceArchiveCount !== 3
    || !Array.isArray(value.archives)
    || value.archives.length !== 3
  ) {
    throw invalid(
      'source_archive_count_mismatch',
      '$.observation.sourceLock',
    )
  }
  for (
    let index = 0;
    index < LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES.length;
    index += 1
  ) {
    const actual = value.archives[index]
    const expected =
      LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES[index]
    if (
      !isRecord(actual)
      || actual.order !== index
    ) {
      throw invalid(
        'source_archive_order_mismatch',
        `$.observation.sourceLock.archives[${index}]`,
      )
    }
    assertExactPart(
      actual,
      expected,
      'source_archive_mismatch',
      `$.observation.sourceLock.archives[${index}]`,
    )
  }
  assertExactPart(
    value,
    LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
      .sourceLock,
    'source_archive_mismatch',
    '$.observation.sourceLock',
  )
}

function assertRuntimeProbe(value: unknown): void {
  if (!isRecord(value)) {
    throw invalid(
      'runtime_inventory_mismatch',
      '$.observation.controlledRuntimeProbe',
    )
  }
  if (
    value.objectInfoNodeClassCount !== 920
    || value.objectInfoNodeClassSetDigestSha256
      !==
        '1b0a6e1fb0e6e2d779705d6f005bdf0138fb62350a20a38f0ad5c5988e1f1454'
    || value.selectedNodeSchemaCount !== 12
    || value.selectedNodeSchemaDigestSha256
      !==
        '070e5fa7190218fe6fae2067915b6e5e751817308878e8d6de583b5b1df24dd0'
    || canonicalJson(value.selectedNodeClasses)
      !== canonicalJson(
        LIVING_FRAME_COMFYUI_LOCKED_SELECTED_NODE_CLASSES,
      )
  ) {
    throw invalid(
      'node_schema_mismatch',
      '$.observation.controlledRuntimeProbe',
    )
  }
  if (
    value.deterministicPromptProbeCount !== 5
    || !Array.isArray(value.deterministicPromptProbes)
    || value.deterministicPromptProbes.length !== 5
  ) {
    throw invalid(
      'prompt_probe_count_mismatch',
      '$.observation.controlledRuntimeProbe.deterministicPromptProbes',
    )
  }
  for (
    let index = 0;
    index < LIVING_FRAME_COMFYUI_LOCKED_PROMPT_PROBES.length;
    index += 1
  ) {
    const actual = value.deterministicPromptProbes[index]
    const expected =
      LIVING_FRAME_COMFYUI_LOCKED_PROMPT_PROBES[index]
    if (
      !isRecord(actual)
      || actual.order !== index
    ) {
      throw invalid(
        'prompt_probe_order_mismatch',
        `$.observation.controlledRuntimeProbe.deterministicPromptProbes[${index}]`,
      )
    }
    assertExactPart(
      actual,
      expected,
      'prompt_probe_mismatch',
      `$.observation.controlledRuntimeProbe.deterministicPromptProbes[${index}]`,
    )
  }
  assertExactPart(
    value,
    LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION
      .controlledRuntimeProbe,
    'runtime_inventory_mismatch',
    '$.observation.controlledRuntimeProbe',
  )
}

function assertExactPart(
  actual: unknown,
  expected: unknown,
  code: LivingFrameComfyUiDependencyLockIssueCode,
  path: string,
): void {
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    throw invalid(code, path)
  }
}

function assertOutputSafe(
  value: LivingFrameComfyUiDependencyLockEvidenceDraft,
): void {
  if (
    value.baseImage.controlledBaseImageDigestSha256
      !== LIVING_FRAME_COMFYUI_LOCKED_BASE_IMAGE_DIGEST_SHA256
    || value.controlledOfflineBuild.candidateImageDigestSha256
      !==
        LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256
    || !allAuthorityFlagsSafe(value.authorityBoundary)
    || value.productionReady !== false
    || value.providerTransportCalled !== false
    || value.canonicalOperationDispatched !== false
    || value.selectedSceneCreated !== false
  ) {
    throw invalid(
      'authority_promotion_forbidden',
      '$.authorityBoundary',
    )
  }
  visitJson(value, '$')
}

function allAuthorityFlagsSafe(
  authority: LivingFrameComfyUiDependencyLockAuthority,
): boolean {
  return Object.entries(authority).every(
    ([key, value]) =>
      key === 'controlledDependencyEvidenceAuthority'
      || key === 'offlineRebuildObservationAuthority'
        ? value === true
        : value === false,
  )
}

function visitJson(value: unknown, path: string): void {
  if (typeof value === 'string') {
    if (
      containsControlCharacter(value)
      || URL_LIKE.test(value)
      || SECRET_LIKE.test(value)
      || value.length > 512
    ) {
      throw invalid('unsafe_payload_forbidden', path)
    }
    return
  }
  if (
    value === null
    || typeof value === 'boolean'
  ) {
    return
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw invalid('unsafe_payload_forbidden', path)
    }
    return
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      visitJson(value[index], `${path}[${index}]`)
    }
    return
  }
  if (!isRecord(value)) {
    throw invalid('unsafe_payload_forbidden', path)
  }
  for (const [key, child] of Object.entries(value)) {
    visitJson(child, `${path}.${key}`)
  }
}

function containsControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code <= 31 || code === 127) {
      return true
    }
  }
  return false
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(normalizeJson(value))
}

function normalizeJson(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
  ) {
    return value
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw invalid('unsafe_payload_forbidden', '$')
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map(normalizeJson)
  }
  if (!isRecord(value)) {
    throw invalid('unsafe_payload_forbidden', '$')
  }
  const normalized: Record<string, unknown> = {}
  for (const key of Object.keys(value).sort()) {
    const child = value[key]
    if (child === undefined) {
      throw invalid('unsafe_payload_forbidden', '$')
    }
    normalized[key] = normalizeJson(child)
  }
  return normalized
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
  )
}

function hasExactKeys(
  value: object,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return canonicalJson(actual) === canonicalJson(expected)
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(
  code: LivingFrameComfyUiDependencyLockIssueCode,
  path: string,
): LivingFrameComfyUiDependencyLockEvidenceError {
  if (
    !LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_ISSUES
      .includes(code)
  ) {
    return new LivingFrameComfyUiDependencyLockEvidenceError([
      { code: 'input_invalid', path: '$' },
    ])
  }
  return new LivingFrameComfyUiDependencyLockEvidenceError([
    { code, path },
  ])
}

function failure(
  code: LivingFrameComfyUiDependencyLockIssueCode,
  path: string,
): LivingFrameComfyUiDependencyLockValidationResult {
  return {
    ok: false,
    issues: [{ code, path }],
  }
}
