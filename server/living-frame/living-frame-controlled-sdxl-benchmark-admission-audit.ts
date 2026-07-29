import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlBenchmarkAdmissionAudit,
  LivingFrameControlledSdxlBenchmarkAdmissionAuditAuthority,
  LivingFrameControlledSdxlBenchmarkAdmissionAuditDraft,
  LivingFrameControlledSdxlBenchmarkAdmissionAuditIssue,
  LivingFrameControlledSdxlBenchmarkAdmissionAuditIssueCode,
  LivingFrameControlledSdxlBenchmarkAdmissionAuditOpenGate,
  LivingFrameControlledSdxlBenchmarkAdmissionAuditState,
  LivingFrameControlledSdxlBenchmarkRegistryObservation,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-admission-audit'
import {
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_VERSION,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-admission-audit'
import type {
  LivingFrameComfyUiReadOnlyModelMount,
} from '../../src/types/living-frame-comfyui-read-only-model-mount'
import type {
  LivingFrameControlledSdxlCanonicalArtifactBinding,
} from '../../src/types/living-frame-controlled-sdxl-canonical-artifact-binding'
import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkSpec,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  getNonE2EToolCapabilityProfile,
  isProductionToolId,
} from '../tool-registry'
import {
  resolveProfessionalToolOperationSpec,
} from '../tool-execution/professional-tool-operation-spec-registry'
import type {
  BindLivingFrameControlledSdxlCanonicalArtifactsInput,
} from './living-frame-controlled-sdxl-canonical-artifact-binding'
import {
  verifyLivingFrameControlledSdxlCanonicalArtifactBinding,
} from './living-frame-controlled-sdxl-canonical-artifact-binding'
import type {
  CreateLivingFrameControlledSdxlCompatibilityBenchmarkSpecInput,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  verifyLivingFrameControlledSdxlCompatibilityBenchmarkSpec,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  verifyLivingFrameComfyUiReadOnlyModelMount,
} from './living-frame-comfyui-read-only-model-mount'

export type LivingFrameControlledSdxlBenchmarkExactArtifactEvidence =
  | {
      readonly state: 'not_injected'
    }
  | {
      readonly state: 'injected'
      readonly canonicalArtifactBinding:
        LivingFrameControlledSdxlCanonicalArtifactBinding
      readonly canonicalArtifactBindingInput:
        BindLivingFrameControlledSdxlCanonicalArtifactsInput
      readonly readOnlyModelMount:
        LivingFrameComfyUiReadOnlyModelMount
    }

export interface CreateLivingFrameControlledSdxlBenchmarkAdmissionAuditInput {
  readonly auditId: string
  readonly benchmarkSpecification:
    LivingFrameControlledSdxlCompatibilityBenchmarkSpec
  readonly benchmarkSpecificationInput:
    CreateLivingFrameControlledSdxlCompatibilityBenchmarkSpecInput
  readonly exactArtifactEvidence:
    LivingFrameControlledSdxlBenchmarkExactArtifactEvidence
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const EXPECTED_TOOL_ID = 'comfyui' as const
const EXPECTED_OPERATION_ID =
  'tool.comfyui.generate_controlled_image.v1' as const

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlBenchmarkAdmissionAuditAuthority =
  deepFreeze({
    deterministicAdmissionAuditAuthority: true,
    benchmarkSpecificationAuthority: false,
    artifactRepositoryAuthority: false,
    artifactBindingAuthority: false,
    artifactMountAuthority: false,
    canonicalToolRegistryAuthority: false,
    canonicalOperationAuthority: false,
    gpuExecutionAuthority: false,
    benchmarkResultAuthority: false,
    legalReviewAuthority: false,
    commercialUseAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
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

const SHARED_OPEN_GATES:
  readonly LivingFrameControlledSdxlBenchmarkAdmissionAuditOpenGate[] =
  deepFreeze([
    'lora_base_version_mismatch_disposition_required',
    'canonical_comfyui_production_identity_required',
    'canonical_comfyui_operation_contract_required',
    'dependency_locked_scanned_signed_gpu_image_required',
    'distributed_private_model_mount_required',
    'current_gpu_node_schema_revalidation_required',
    'server_owned_benchmark_fixture_artifacts_required',
    'canonical_gpu_attempt_and_internal_cost_evidence_required',
    'canonical_gpu_metric_attestation_required',
    'license_and_paid_use_review_required',
    'selected_scene_snapshot_work_asset_qa_and_private_review_required',
  ])

export class LivingFrameControlledSdxlBenchmarkAdmissionAuditError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlBenchmarkAdmissionAuditIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlBenchmarkAdmissionAuditIssue[],
  ) {
    super(
      'Living Frame controlled SDXL benchmark admission audit failed.',
    )
    this.name =
      'LivingFrameControlledSdxlBenchmarkAdmissionAuditError'
    this.issues = issues
  }
}

export function readLivingFrameControlledSdxlBenchmarkRegistryObservation():
  LivingFrameControlledSdxlBenchmarkRegistryObservation {
  const profile =
    getNonE2EToolCapabilityProfile(EXPECTED_TOOL_ID)
  const operation =
    resolveProfessionalToolOperationSpec(EXPECTED_TOOL_ID)
  return deepFreeze({
    expectedCapabilityId: EXPECTED_TOOL_ID,
    expectedOperationId: EXPECTED_OPERATION_ID,
    nonE2eCapabilityCatalogEntryPresent:
      profile?.toolId === EXPECTED_TOOL_ID,
    nonE2eEvaluationOnly:
      profile?.productionStatus === 'evaluation_only'
      && profile.executionMode === 'evaluation_only',
    gpuWorkerCandidateDeclared:
      profile?.workerType === 'gpu_ai_worker',
    gpuRequired: profile?.gpuRequired === true,
    cpuFallbackForbidden: profile?.cpuAllowed === false,
    exactModelWeightReviewRequired:
      profile?.modelWeightPolicy.required === true,
    productionToolIdentityPresent:
      isProductionToolId(EXPECTED_TOOL_ID),
    exactOperationContractPresent:
      operation !== undefined
      && String(operation.canonicalToolId) === EXPECTED_TOOL_ID
      && operation.allowedOperationIds.length === 1
      && operation.allowedOperationIds[0] === EXPECTED_OPERATION_ID,
    privateGpuRunnerVerified: false,
    productReady: false,
  })
}

export async function createLivingFrameControlledSdxlBenchmarkAdmissionAudit(
  input:
    CreateLivingFrameControlledSdxlBenchmarkAdmissionAuditInput,
): Promise<LivingFrameControlledSdxlBenchmarkAdmissionAudit> {
  assertInput(input)
  if (
    !await verifyLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
      input.benchmarkSpecification,
      input.benchmarkSpecificationInput,
    )
  ) throw invalid(
    'benchmark_spec_invalid',
    '$.benchmarkSpecification',
  )

  const exactEvidence =
    await resolveExactArtifactEvidence(input)
  const observation =
    readLivingFrameControlledSdxlBenchmarkRegistryObservation()
  assertRegistryObservation(observation)
  const auditState = resolveAuditState({
    exactEvidencePresent:
      exactEvidence.state === 'server_revalidated',
    observation,
  })
  const sourceBindings =
    input.benchmarkSpecification.sourceBindings
  const draft:
    LivingFrameControlledSdxlBenchmarkAdmissionAuditDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_CLASS,
    auditId: input.auditId,
    auditState,
    sourceBindings: {
      benchmarkSpecificationId:
        input.benchmarkSpecification.specificationId,
      benchmarkSpecificationDigestSha256:
        input.benchmarkSpecification
          .specificationDigestSha256,
      candidateSetDigestSha256:
        sourceBindings.candidateSetDigestSha256,
      requirementsDigestSha256:
        sourceBindings.requirementsDigestSha256,
      dependencyLockEvidenceDigestSha256:
        sourceBindings.dependencyLockEvidenceDigestSha256,
      exactCanonicalArtifactBindingDigestSha256:
        exactEvidence.exactCanonicalArtifactBindingDigestSha256,
      readOnlyModelPreparationDigestSha256:
        exactEvidence.readOnlyModelPreparationDigestSha256,
    },
    exactArtifactEvidenceState:
      exactEvidence.state === 'server_revalidated'
        ? {
            state: 'server_revalidated',
            exactArtifactCount: 5,
            readOnlyPresentationCount: 5,
          }
        : {
            state: 'not_injected',
            exactArtifactCount: 0,
            readOnlyPresentationCount: 0,
          },
    registryObservation: observation,
    metrics: {
      benchmarkCaseCount:
        input.benchmarkSpecification.metrics.caseCount,
      benchmarkMetricCount:
        input.benchmarkSpecification.metrics.requiredMetricCount,
      expectedArtifactCount:
        input.benchmarkSpecification.metrics.candidateArtifactCount,
      expectedArtifactByteLength:
        input.benchmarkSpecification.metrics
          .candidateArtifactByteLength,
    },
    openGateCodes: openGates({
      exactEvidencePresent:
        exactEvidence.state === 'server_revalidated',
    }),
    authorityBoundary: AUTHORITY_BOUNDARY,
    benchmarkSpecificationRevalidated: true,
    exactArtifactsAndLocalReadOnlyPresentationRevalidated:
      exactEvidence.state === 'server_revalidated',
    currentRegistryReadDirectlyByServer: true,
    exactDependencyGraphAndArtifactLineageBound:
      exactEvidence.state === 'server_revalidated',
    benchmarkRequestReady: false,
    releasedGpuAttemptPresent: false,
    canonicalGpuMetricAttestationPresent: false,
    canonicalInternalCostReceiptPresent: false,
    selectedSceneCreated: false,
    containsRawPromptImagePixelModelBytesPathUrlCredentialOrCommand:
      false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  assertOutputSafe(draft)
  return deepFreeze({
    ...draft,
    auditDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameControlledSdxlBenchmarkAdmissionAudit(
  value: unknown,
  input:
    CreateLivingFrameControlledSdxlBenchmarkAdmissionAuditInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion
        !==
        LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_VERSION
      || value.resultClass
        !==
        LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_CLASS
      || value.productionReady !== false
      || typeof value.auditDigestSha256 !== 'string'
      || !SHA256.test(value.auditDigestSha256)
    ) return false
    const {
      auditDigestSha256,
      ...draft
    } = value
    if (digest(draft) !== auditDigestSha256) return false
    return canonicalJson(value) === canonicalJson(
      await createLivingFrameControlledSdxlBenchmarkAdmissionAudit(
        input,
      ),
    )
  } catch {
    return false
  }
}

async function resolveExactArtifactEvidence(
  input:
    CreateLivingFrameControlledSdxlBenchmarkAdmissionAuditInput,
): Promise<{
  readonly state: 'not_injected' | 'server_revalidated'
  readonly exactCanonicalArtifactBindingDigestSha256:
    string | null
  readonly readOnlyModelPreparationDigestSha256:
    string | null
}> {
  const evidence = input.exactArtifactEvidence
  if (evidence.state === 'not_injected') {
    return {
      state: 'not_injected',
      exactCanonicalArtifactBindingDigestSha256: null,
      readOnlyModelPreparationDigestSha256: null,
    }
  }
  if (
    !await verifyLivingFrameControlledSdxlCanonicalArtifactBinding(
      evidence.canonicalArtifactBinding,
      evidence.canonicalArtifactBindingInput,
    )
  ) throw invalid(
    'exact_artifact_binding_invalid',
    '$.exactArtifactEvidence.canonicalArtifactBinding',
  )
  if (
    !verifyLivingFrameComfyUiReadOnlyModelMount(
      evidence.readOnlyModelMount,
    )
  ) throw invalid(
    'read_only_mount_invalid',
    '$.exactArtifactEvidence.readOnlyModelMount',
  )
  assertExactArtifactLineage(input, evidence)
  return {
    state: 'server_revalidated',
    exactCanonicalArtifactBindingDigestSha256:
      evidence.canonicalArtifactBinding.bindingDigestSha256,
    readOnlyModelPreparationDigestSha256:
      evidence.readOnlyModelMount.preparationDigestSha256,
  }
}

function assertExactArtifactLineage(
  input:
    CreateLivingFrameControlledSdxlBenchmarkAdmissionAuditInput,
  evidence: Extract<
    LivingFrameControlledSdxlBenchmarkExactArtifactEvidence,
    { readonly state: 'injected' }
  >,
): void {
  const specification = input.benchmarkSpecification
  const exact = evidence.canonicalArtifactBinding
  const mount = evidence.readOnlyModelMount
  if (
    exact.sourceBindings.candidateSetDigestSha256
      !== specification.sourceBindings.candidateSetDigestSha256
    || exact.sourceBindings.requirementsDigestSha256
      !== specification.sourceBindings.requirementsDigestSha256
    || exact.metrics.candidateArtifactCount !== 5
    || exact.metrics.totalByteLength !== 11_700_367_157
    || exact.exactBundleCompatibilityProven !== false
    || exact.loraBaseVersionMismatchUnresolved !== true
  ) throw invalid(
    'artifact_lineage_mismatch',
    '$.exactArtifactEvidence.canonicalArtifactBinding',
  )
  if (
    mount.sourceBindings
      .canonicalModelArtifactBindingDigestSha256
      !== exact.sourceBindings
        .canonicalArtifactBindingDigestSha256
    || mount.sourceBindings.requirementsDigestSha256
      !== exact.sourceBindings.requirementsDigestSha256
    || mount.metrics.requiredArtifactCount !== 5
    || mount.metrics.readOnlySourcePresentationCount !== 5
    || mount.metrics.totalByteLength !== 11_700_367_157
    || mount.distributedMountCreated !== false
    || mount.modelInferenceExecuted !== false
    || mount.productionReady !== false
    || mount.entries.some((entry, index) => {
      const exactEntry = exact.entries[index]
      return (
        exactEntry === undefined
        || entry.canonicalOrder !== exactEntry.canonicalOrder
        || entry.role !== exactEntry.role
        || entry.artifactRecordId !== exactEntry.artifactRecordId
        || entry.artifactId !== exactEntry.canonicalArtifactId
        || entry.revision !== exactEntry.canonicalRevision
        || entry.contentSha256 !== exactEntry.contentSha256
      )
    })
  ) throw invalid(
    'mount_lineage_mismatch',
    '$.exactArtifactEvidence.readOnlyModelMount',
  )
}

function assertRegistryObservation(
  observation:
    LivingFrameControlledSdxlBenchmarkRegistryObservation,
): void {
  if (
    observation.expectedCapabilityId !== EXPECTED_TOOL_ID
    || observation.expectedOperationId !== EXPECTED_OPERATION_ID
    || observation.nonE2eCapabilityCatalogEntryPresent !== true
    || observation.nonE2eEvaluationOnly !== true
    || observation.gpuWorkerCandidateDeclared !== true
    || observation.gpuRequired !== true
    || observation.cpuFallbackForbidden !== true
    || observation.exactModelWeightReviewRequired !== true
    || observation.productionToolIdentityPresent !== false
    || observation.exactOperationContractPresent !== false
    || observation.privateGpuRunnerVerified !== false
    || observation.productReady !== false
  ) throw invalid(
    'registry_observation_mismatch',
    '$.registryObservation',
  )
}

function resolveAuditState(input: {
  readonly exactEvidencePresent: boolean
  readonly observation:
    LivingFrameControlledSdxlBenchmarkRegistryObservation
}): LivingFrameControlledSdxlBenchmarkAdmissionAuditState {
  if (!input.exactEvidencePresent) {
    return 'blocked_exact_artifacts_and_mount_required'
  }
  if (!input.observation.productionToolIdentityPresent) {
    return 'blocked_canonical_comfyui_production_identity_required'
  }
  if (!input.observation.exactOperationContractPresent) {
    return 'blocked_canonical_comfyui_operation_required'
  }
  return 'blocked_gpu_image_and_distributed_mount_required'
}

function openGates(input: {
  readonly exactEvidencePresent: boolean
}): readonly LivingFrameControlledSdxlBenchmarkAdmissionAuditOpenGate[] {
  return deepFreeze([
    ...(input.exactEvidencePresent
      ? []
      : [
          'exact_canonical_artifact_binding_required',
          'single_use_read_only_model_mount_required',
        ] as const),
    ...SHARED_OPEN_GATES,
  ])
}

function assertInput(
  input:
    CreateLivingFrameControlledSdxlBenchmarkAdmissionAuditInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'auditId',
      'benchmarkSpecification',
      'benchmarkSpecificationInput',
      'exactArtifactEvidence',
    ])
    || typeof input.auditId !== 'string'
    || !SAFE_ID.test(input.auditId)
    || !isRecord(input.benchmarkSpecification)
    || !isRecord(input.benchmarkSpecificationInput)
    || !isRecord(input.exactArtifactEvidence)
  ) throw invalid('input_invalid', '$')
  const evidence = input.exactArtifactEvidence
  if (
    evidence.state === 'not_injected'
      ? !hasExactKeys(evidence, ['state'])
      : evidence.state === 'injected'
        ? !hasExactKeys(evidence, [
            'state',
            'canonicalArtifactBinding',
            'canonicalArtifactBindingInput',
            'readOnlyModelMount',
          ])
        : true
  ) throw invalid(
    'exact_artifact_evidence_invalid',
    '$.exactArtifactEvidence',
  )
}

function assertOutputSafe(value: unknown): void {
  const serialized = canonicalJson(value)
  if (
    /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu.test(serialized)
    || /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u
      .test(serialized)
    || serialized.includes('/Users/')
    || serialized.includes('/Volumes/')
    || serialized.includes('/private/tmp/')
  ) throw invalid(
    'authority_promotion_forbidden',
    '$',
  )
}

function invalid(
  code:
    LivingFrameControlledSdxlBenchmarkAdmissionAuditIssueCode,
  path: string,
): LivingFrameControlledSdxlBenchmarkAdmissionAuditError {
  if (
    !(LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_ISSUES as
      readonly string[]).includes(code)
  ) throw new Error('Unknown Living Frame admission-audit issue.')
  return new LivingFrameControlledSdxlBenchmarkAdmissionAuditError([
    { code, path },
  ])
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
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

function deepFreeze<T>(value: T): T {
  if (
    typeof value !== 'object'
    || value === null
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const child of Object.values(value)) {
    deepFreeze(child)
  }
  return value
}
