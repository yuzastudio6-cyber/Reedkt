import { createHash } from 'node:crypto'

import type {
  LivingFrameIpAdapterExtensionAuthorityBoundary,
  LivingFrameIpAdapterExtensionDependencyBoundary,
  LivingFrameIpAdapterExtensionEvaluation,
  LivingFrameIpAdapterExtensionEvaluationDraft,
  LivingFrameIpAdapterExtensionIssue,
  LivingFrameIpAdapterExtensionIssueCode,
  LivingFrameIpAdapterExtensionNodeBoundary,
  LivingFrameIpAdapterExtensionSourceFileCode,
  LivingFrameIpAdapterExtensionSourceFileObservation,
  LivingFrameIpAdapterExtensionValidationResult,
} from '../../src/types/living-frame-controlled-illustration-ipadapter-extension'
import {
  LIVING_FRAME_IPADAPTER_EXTENSION_BLOCKED_NODE_CLASSES,
  LIVING_FRAME_IPADAPTER_EXTENSION_EVALUATION_CLASS,
  LIVING_FRAME_IPADAPTER_EXTENSION_EVALUATION_VERSION,
  LIVING_FRAME_IPADAPTER_EXTENSION_GENERIC_NODE_CLASSES,
  LIVING_FRAME_IPADAPTER_EXTENSION_OPEN_GATE_CODES,
  LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_FILE_CODES,
  LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_REVISION,
  LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_TREE,
} from '../../src/types/living-frame-controlled-illustration-ipadapter-extension'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/

const SOURCE_FILE_DIGESTS: Readonly<
Record<LivingFrameIpAdapterExtensionSourceFileCode, string>
> = Object.freeze({
  license:
    '3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986',
  pyproject:
    '2d5e8fbb4900676dbbdc7046ce3c410496b36a26b197f7b0b86d35fc67e52dad',
  package_init:
    '9d96e97512e15d079b48a67aef4b42b25fde78df697bb8672d3f70ddd9ad8e85',
  ipadapter_plus:
    '356f68d9472450ee7af556280e24ccbd1908f91e1bb8d722553cc8427d17e5d0',
  utils:
    '1174018754abea857d76f5e2bc139e6d2b4673c85489a5410a6001153f894a3d',
  cross_attention_patch:
    'f448afe83d4c19d3bac0f94ff6e8a54c52981212892a83f133901af4bcb186a4',
  image_projection_models:
    '35f7bb34fb420b9659b02ba9288229430788397b271504e6536a08676073cb8b',
  readme:
    '321868d05f73cc5c9806512a8b0c55d51b38160f2e2dd570debcdfbf335f4123',
})

const NODE_BOUNDARY: LivingFrameIpAdapterExtensionNodeBoundary =
  Object.freeze({
    genericAllowlistedNodeClasses:
      LIVING_FRAME_IPADAPTER_EXTENSION_GENERIC_NODE_CLASSES,
    explicitlyBlockedNodeClasses:
      LIVING_FRAME_IPADAPTER_EXTENSION_BLOCKED_NODE_CLASSES,
    genericDirectModelLoaderOnly: true,
    genericAdvancedApplyOnly: true,
    unifiedLoaderAllowed: false,
    faceIdNodeAllowed: false,
    insightFaceLoaderAllowed: false,
    customFileIoNodeAllowed: false,
    arbitraryPluginNodeAllowed: false,
    runtimeFilenameSelectionAllowed: false,
    runtimeDownloadAllowed: false,
  })

const DEPENDENCY_BOUNDARY:
  LivingFrameIpAdapterExtensionDependencyBoundary = Object.freeze({
    pluginVersionObservation: '2.0.0',
    declaredSourceLicenseObservation: 'gpl-3.0',
    sourceRepositoryMetadataPointsToOriginalCubiqProject: true,
    sourceCommitDateObservation: '2024-09-13',
    torchDependencyObserved: true,
    einopsDependencyObserved: true,
    comfyUiInternalApiDependencyObserved: true,
    optionalInsightFaceCodeObserved: true,
    networkDownloadImportObservedInReviewedPythonFiles: false,
    dependencyLockPresent: false,
    genericIpAdapterWeightManifestPresent: false,
    clipVisionWeightManifestPresent: false,
    baseModelCompatibilityManifestPresent: false,
    modelLicensesIndependentlyApproved: false,
    sourceLicenseLegallyApprovedForDeployment: false,
    comfyUiCompatibilityProven: false,
  })

const AUTHORITY_BOUNDARY:
  LivingFrameIpAdapterExtensionAuthorityBoundary = Object.freeze({
    controlledSourceEvaluationOnly: true,
    currentSourceAuthority: false,
    legalReviewAuthority: false,
    installationAuthority: false,
    packageAuthority: false,
    containerAuthority: false,
    modelWeightAuthority: false,
    providerAuthority: false,
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
    identityDecisionAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameIpAdapterExtensionEvaluationInput {
  readonly evaluationId: string
  readonly controlledIllustrationQualificationDigestSha256: string
  readonly controlledIllustrationSourceObservationDigestSha256: string
  readonly stockComfyUiGraphExpectationDigestSha256: string
}

export class LivingFrameIpAdapterExtensionEvaluationError extends Error {
  readonly issues: readonly LivingFrameIpAdapterExtensionIssue[]

  constructor(issues: readonly LivingFrameIpAdapterExtensionIssue[]) {
    super('Living Frame IP-Adapter extension evaluation failed.')
    this.name = 'LivingFrameIpAdapterExtensionEvaluationError'
    this.issues = issues
  }
}

export function createLivingFrameIpAdapterExtensionEvaluation(
  input: CreateLivingFrameIpAdapterExtensionEvaluationInput,
): LivingFrameIpAdapterExtensionEvaluation {
  assertInput(input)
  const sourceFileObservations =
    LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_FILE_CODES.map(
      (fileCode, index): LivingFrameIpAdapterExtensionSourceFileObservation => ({
        fileCode,
        order: index + 1,
        digestSha256: SOURCE_FILE_DIGESTS[fileCode],
        controlledSourceObservationOnly: true,
        currentUpstreamTruthAuthority: false,
        legalReviewAuthority: false,
        runtimeArtifactAuthority: false,
      }),
    )
  const draft: LivingFrameIpAdapterExtensionEvaluationDraft = {
    contractVersion: LIVING_FRAME_IPADAPTER_EXTENSION_EVALUATION_VERSION,
    resultClass: LIVING_FRAME_IPADAPTER_EXTENSION_EVALUATION_CLASS,
    evaluationId: input.evaluationId,
    sourceBindings: {
      repositoryLocatorCode: 'github_comfyorg_comfyui_ipadapter',
      immutableRevisionSha1:
        LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_REVISION,
      sourceTreeSha1: LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_TREE,
      controlledIllustrationQualificationDigestSha256:
        input.controlledIllustrationQualificationDigestSha256,
      controlledIllustrationSourceObservationDigestSha256:
        input.controlledIllustrationSourceObservationDigestSha256,
      stockComfyUiGraphExpectationDigestSha256:
        input.stockComfyUiGraphExpectationDigestSha256,
    },
    sourceFileObservations,
    nodeBoundary: NODE_BOUNDARY,
    dependencyBoundary: DEPENDENCY_BOUNDARY,
    openGateCodes: [...LIVING_FRAME_IPADAPTER_EXTENSION_OPEN_GATE_CODES],
    authorityBoundary: AUTHORITY_BOUNDARY,
    genericRouteStructurallyRepresentable: true,
    genericRouteQualified: false,
    faceIdRouteQualified: false,
    auraFaceUsedAsGenerationAdapter: false,
    executableWorkflowPresent: false,
    packageInstalled: false,
    runtimeArtifactPresent: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    ...draft,
    evaluationDigestSha256: digest(draft),
  }
}

export function verifyLivingFrameIpAdapterExtensionEvaluation(
  value: unknown,
): value is LivingFrameIpAdapterExtensionEvaluation {
  return validateLivingFrameIpAdapterExtensionEvaluation(value).ok
}

export function validateLivingFrameIpAdapterExtensionEvaluation(
  value: unknown,
): LivingFrameIpAdapterExtensionValidationResult {
  const issues: LivingFrameIpAdapterExtensionIssue[] = []
  if (!isRecord(value)) {
    return { ok: false, issues: [{ code: 'input_invalid', path: '$' }] }
  }
  exactKeys(value, [
    'contractVersion',
    'resultClass',
    'evaluationId',
    'sourceBindings',
    'sourceFileObservations',
    'nodeBoundary',
    'dependencyBoundary',
    'openGateCodes',
    'authorityBoundary',
    'genericRouteStructurallyRepresentable',
    'genericRouteQualified',
    'faceIdRouteQualified',
    'auraFaceUsedAsGenerationAdapter',
    'executableWorkflowPresent',
    'packageInstalled',
    'runtimeArtifactPresent',
    'subjectSpecificRouting',
    'productionReady',
    'evaluationDigestSha256',
  ], '$', issues)
  if (issues.length > 0) return { ok: false, issues }

  const evaluation =
    value as unknown as LivingFrameIpAdapterExtensionEvaluation
  if (
    evaluation.contractVersion
      !== LIVING_FRAME_IPADAPTER_EXTENSION_EVALUATION_VERSION
    || evaluation.resultClass
      !== LIVING_FRAME_IPADAPTER_EXTENSION_EVALUATION_CLASS
    || typeof evaluation.evaluationId !== 'string'
    || !SAFE_ID.test(evaluation.evaluationId)
  ) push(issues, 'input_invalid', '$')
  validateSourceBindings(evaluation.sourceBindings, issues)
  validateFileObservations(evaluation.sourceFileObservations, issues)
  if (canonicalJson(evaluation.nodeBoundary) !== canonicalJson(NODE_BOUNDARY)) {
    push(issues, 'node_boundary_invalid', '$.nodeBoundary')
  }
  if (
    canonicalJson(evaluation.dependencyBoundary)
      !== canonicalJson(DEPENDENCY_BOUNDARY)
  ) push(issues, 'dependency_boundary_invalid', '$.dependencyBoundary')
  if (
    canonicalJson(evaluation.openGateCodes)
      !== canonicalJson(LIVING_FRAME_IPADAPTER_EXTENSION_OPEN_GATE_CODES)
  ) push(issues, 'gate_set_invalid', '$.openGateCodes')
  if (
    canonicalJson(evaluation.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
  ) push(issues, 'authority_promotion_forbidden', '$.authorityBoundary')
  if (
    evaluation.genericRouteStructurallyRepresentable !== true
    || evaluation.genericRouteQualified !== false
    || evaluation.auraFaceUsedAsGenerationAdapter !== false
    || evaluation.executableWorkflowPresent !== false
    || evaluation.packageInstalled !== false
    || evaluation.runtimeArtifactPresent !== false
    || evaluation.productionReady !== false
  ) push(issues, 'authority_promotion_forbidden', '$')
  if (evaluation.faceIdRouteQualified !== false) {
    push(issues, 'faceid_promotion_forbidden', '$.faceIdRouteQualified')
  }
  if (evaluation.subjectSpecificRouting !== false) {
    push(issues, 'subject_specific_routing_forbidden', '$.subjectSpecificRouting')
  }
  if (
    typeof evaluation.evaluationDigestSha256 !== 'string'
    || !SHA256.test(evaluation.evaluationDigestSha256)
  ) {
    push(issues, 'digest_mismatch', '$.evaluationDigestSha256')
  } else {
    const { evaluationDigestSha256, ...draft } = evaluation
    if (digest(draft) !== evaluationDigestSha256) {
      push(issues, 'digest_mismatch', '$.evaluationDigestSha256')
    }
  }
  return issues.length > 0
    ? { ok: false, issues: dedupe(issues) }
    : { ok: true, evaluation }
}

function assertInput(
  input: CreateLivingFrameIpAdapterExtensionEvaluationInput,
): void {
  const issues: LivingFrameIpAdapterExtensionIssue[] = []
  if (!isRecord(input)) {
    throw new LivingFrameIpAdapterExtensionEvaluationError([
      { code: 'input_invalid', path: '$' },
    ])
  }
  exactKeys(
    input as unknown as Record<string, unknown>,
    [
      'evaluationId',
      'controlledIllustrationQualificationDigestSha256',
      'controlledIllustrationSourceObservationDigestSha256',
      'stockComfyUiGraphExpectationDigestSha256',
    ],
    '$',
    issues,
  )
  if (
    typeof input.evaluationId !== 'string'
    || !SAFE_ID.test(input.evaluationId)
  ) push(issues, 'unsafe_input', '$.evaluationId')
  for (const [key, value] of Object.entries({
    controlledIllustrationQualificationDigestSha256:
      input.controlledIllustrationQualificationDigestSha256,
    controlledIllustrationSourceObservationDigestSha256:
      input.controlledIllustrationSourceObservationDigestSha256,
    stockComfyUiGraphExpectationDigestSha256:
      input.stockComfyUiGraphExpectationDigestSha256,
  })) {
    if (typeof value !== 'string' || !SHA256.test(value)) {
      push(issues, 'source_binding_invalid', `$.${key}`)
    }
  }
  if (issues.length > 0) {
    throw new LivingFrameIpAdapterExtensionEvaluationError(dedupe(issues))
  }
}

function validateSourceBindings(
  value: unknown,
  issues: LivingFrameIpAdapterExtensionIssue[],
): void {
  if (!isRecord(value)) {
    push(issues, 'source_binding_invalid', '$.sourceBindings')
    return
  }
  exactKeys(value, [
    'repositoryLocatorCode',
    'immutableRevisionSha1',
    'sourceTreeSha1',
    'controlledIllustrationQualificationDigestSha256',
    'controlledIllustrationSourceObservationDigestSha256',
    'stockComfyUiGraphExpectationDigestSha256',
  ], '$.sourceBindings', issues)
  if (
    value.repositoryLocatorCode !== 'github_comfyorg_comfyui_ipadapter'
    || value.immutableRevisionSha1
      !== LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_REVISION
    || value.sourceTreeSha1 !== LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_TREE
  ) push(issues, 'source_binding_invalid', '$.sourceBindings')
  for (const key of [
    'controlledIllustrationQualificationDigestSha256',
    'controlledIllustrationSourceObservationDigestSha256',
    'stockComfyUiGraphExpectationDigestSha256',
  ] as const) {
    if (typeof value[key] !== 'string' || !SHA256.test(value[key])) {
      push(issues, 'source_binding_invalid', `$.sourceBindings.${key}`)
    }
  }
}

function validateFileObservations(
  value: unknown,
  issues: LivingFrameIpAdapterExtensionIssue[],
): void {
  if (!Array.isArray(value)
    || value.length !== LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_FILE_CODES.length) {
    push(issues, 'file_observation_invalid', '$.sourceFileObservations')
    return
  }
  const seen = new Set<string>()
  value.forEach((entry, index) => {
    const path = `$.sourceFileObservations[${index}]`
    if (!isRecord(entry)) {
      push(issues, 'file_observation_invalid', path)
      return
    }
    exactKeys(entry, [
      'fileCode',
      'order',
      'digestSha256',
      'controlledSourceObservationOnly',
      'currentUpstreamTruthAuthority',
      'legalReviewAuthority',
      'runtimeArtifactAuthority',
    ], path, issues)
    const expectedCode =
      LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_FILE_CODES[index]
    if (entry.fileCode !== expectedCode) {
      push(issues, 'file_observation_order_invalid', `${path}.fileCode`)
    }
    if (entry.order !== index + 1) {
      push(issues, 'file_observation_order_invalid', `${path}.order`)
    }
    if (typeof entry.fileCode !== 'string' || seen.has(entry.fileCode)) {
      push(issues, 'duplicate_file_observation', `${path}.fileCode`)
    } else seen.add(entry.fileCode)
    if (
      !expectedCode
      || entry.digestSha256 !== SOURCE_FILE_DIGESTS[expectedCode]
      || entry.controlledSourceObservationOnly !== true
      || entry.currentUpstreamTruthAuthority !== false
      || entry.legalReviewAuthority !== false
      || entry.runtimeArtifactAuthority !== false
    ) push(issues, 'file_observation_invalid', path)
  })
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  issues: LivingFrameIpAdapterExtensionIssue[],
): void {
  const expectedSet = new Set(expected)
  for (const key of Object.keys(value)) {
    if (!expectedSet.has(key)) push(issues, 'unknown_key', `${path}.${key}`)
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) push(issues, 'unknown_key', `${path}.${key}`)
  }
}

function push(
  issues: LivingFrameIpAdapterExtensionIssue[],
  code: LivingFrameIpAdapterExtensionIssueCode,
  path: string,
): void {
  issues.push({ code, path })
}

function dedupe(
  issues: readonly LivingFrameIpAdapterExtensionIssue[],
): readonly LivingFrameIpAdapterExtensionIssue[] {
  return [...new Map(
    issues.map((issue) => [`${issue.code}:${issue.path}`, issue]),
  ).values()]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  )
}
