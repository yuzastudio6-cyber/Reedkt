import { createHash } from 'node:crypto'

import type {
  LivingFrameControlImageSourceBinding,
  LivingFrameControlImageWorkflowBinding,
  LivingFrameControlImageWorkflowBindingAuthorityBoundary,
  LivingFrameControlImageWorkflowBindingDraft,
  LivingFrameControlImageWorkflowBindingIssue,
  LivingFrameControlImageWorkflowBindingIssueCode,
  LivingFrameControlImageWorkflowBindingValidationResult,
} from '../../src/types/living-frame-control-image-workflow-binding'
import {
  LIVING_FRAME_CONTROL_IMAGE_KINDS,
  LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_CLASS,
  LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_OPEN_GATES,
  LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_VERSION,
} from '../../src/types/living-frame-control-image-workflow-binding'
import type {
  LivingFrameControlImageCannyReport,
} from '../../src/types/living-frame-control-image-canny'
import type {
  LivingFrameControlImageDepthReport,
} from '../../src/types/living-frame-control-image-depth'
import type {
  LivingFrameControlImagePoseReport,
} from '../../src/types/living-frame-control-image-pose'
import type {
  LivingFrameControlledComfyUiWorkflowExpectation,
} from '../../src/types/living-frame-controlled-illustration-comfyui-workflow'
import {
  verifyLivingFrameControlImageCannyReport,
} from './living-frame-control-image-canny'
import type {
  CreateLivingFrameControlImageDepthInput,
} from './living-frame-control-image-depth'
import {
  verifyLivingFrameControlImageDepthReport,
} from './living-frame-control-image-depth'
import type {
  CreateLivingFrameControlImagePoseInput,
} from './living-frame-control-image-pose'
import {
  verifyLivingFrameControlImagePoseReport,
} from './living-frame-control-image-pose'
import {
  validateLivingFrameControlledComfyUiWorkflowExpectation,
} from './living-frame-controlled-illustration-comfyui-workflow'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/

const AUTHORITY_BOUNDARY:
  LivingFrameControlImageWorkflowBindingAuthorityBoundary = Object.freeze({
    controlledCrossContractBindingOnly: true,
    sourceAnalysisAuthority: false,
    poseDetectionAuthority: false,
    poseEvidenceAuthority: false,
    depthEstimationAuthority: false,
    depthEvidenceAuthority: false,
    semanticControlChoiceAuthority: false,
    selectedSceneAuthority: false,
    artifactCreationAuthority: false,
    artifactQaAuthority: false,
    assetManifestAuthority: false,
    modelWeightAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameCannyControlImageWorkflowBindingInput {
  readonly bindingId: string
  readonly controlImageKind: 'canny'
  readonly cannyReport: unknown
  readonly workflowExpectation: unknown
}

export interface CreateLivingFramePoseControlImageWorkflowBindingInput {
  readonly bindingId: string
  readonly controlImageKind: 'pose'
  readonly poseReport: unknown
  readonly poseVerificationInput: CreateLivingFrameControlImagePoseInput
  readonly poseOutputRgbaBytes: Uint8Array
  readonly workflowExpectation: unknown
}

export interface CreateLivingFrameDepthControlImageWorkflowBindingInput {
  readonly bindingId: string
  readonly controlImageKind: 'depth'
  readonly depthReport: unknown
  readonly depthVerificationInput: CreateLivingFrameControlImageDepthInput
  readonly depthOutputRgbaBytes: Uint8Array
  readonly workflowExpectation: unknown
}

export type CreateLivingFrameControlImageWorkflowBindingInput =
  | CreateLivingFrameCannyControlImageWorkflowBindingInput
  | CreateLivingFrameDepthControlImageWorkflowBindingInput
  | CreateLivingFramePoseControlImageWorkflowBindingInput

interface VerifiedControlImage {
  readonly sourceBinding: LivingFrameControlImageSourceBinding
  readonly measuredOutputRgbaDigestSha256: string
  readonly width: number
  readonly height: number
}

export class LivingFrameControlImageWorkflowBindingError extends Error {
  readonly issues: readonly LivingFrameControlImageWorkflowBindingIssue[]

  constructor(issues: readonly LivingFrameControlImageWorkflowBindingIssue[]) {
    super('Living Frame control-image workflow binding failed.')
    this.name = 'LivingFrameControlImageWorkflowBindingError'
    this.issues = issues
  }
}

export function createLivingFrameControlImageWorkflowBinding(
  input: CreateLivingFrameControlImageWorkflowBindingInput,
): LivingFrameControlImageWorkflowBinding {
  const issues = validateCreateInput(input)
  if (issues.length > 0) {
    throw new LivingFrameControlImageWorkflowBindingError(issues)
  }
  const workflowResult =
    validateLivingFrameControlledComfyUiWorkflowExpectation(
      input.workflowExpectation,
    )
  if (!workflowResult.ok) {
    throw issueError(
      'workflow_expectation_invalid',
      '$.workflowExpectation',
    )
  }
  return compileBinding(
    input.bindingId,
    resolveVerifiedControlImage(input),
    workflowResult.expectation,
  )
}

export function validateLivingFrameControlImageWorkflowBinding(
  value: unknown,
): LivingFrameControlImageWorkflowBindingValidationResult {
  const issues: LivingFrameControlImageWorkflowBindingIssue[] = []
  if (!isRecord(value)) return invalidResult('input_invalid', '$')
  pushExactKeys(value, [
    'contractVersion',
    'resultClass',
    'bindingId',
    'sourceBindings',
    'frameExpectation',
    'controlImageBinding',
    'openGateCodes',
    'authorityBoundary',
    'parentContractsRevalidationRequired',
    'rawPixelsPresent',
    'rawLandmarksPresent',
    'filePathOrUrlPresent',
    'providerOrToolIdentifierPresent',
    'workOrQueueIdentifierPresent',
    'executableWorkflowPresent',
    'subjectSpecificRouting',
    'productionReady',
    'bindingDigestSha256',
  ], '$', issues)
  if (issues.length > 0) return { ok: false, issues }
  const binding =
    value as unknown as LivingFrameControlImageWorkflowBinding
  if (
    binding.contractVersion
      !== LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_VERSION
    || binding.resultClass
      !== LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_CLASS
  ) push(issues, 'input_invalid', '$')
  if (!SAFE_ID.test(binding.bindingId)) {
    push(issues, 'unsafe_input', '$.bindingId')
  }
  validateSourceBindings(binding.sourceBindings, issues)
  validateFrame(binding.frameExpectation, issues)
  validateControlBinding(binding.controlImageBinding, issues)
  if (
    !Array.isArray(binding.openGateCodes)
    || canonicalJson(binding.openGateCodes)
      !== canonicalJson(LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_OPEN_GATES)
  ) push(issues, 'gate_set_invalid', '$.openGateCodes')
  if (
    canonicalJson(binding.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
  ) push(issues, 'authority_promotion_forbidden', '$.authorityBoundary')
  if (
    binding.parentContractsRevalidationRequired !== true
    || binding.rawPixelsPresent !== false
    || binding.rawLandmarksPresent !== false
    || binding.filePathOrUrlPresent !== false
    || binding.providerOrToolIdentifierPresent !== false
    || binding.workOrQueueIdentifierPresent !== false
    || binding.executableWorkflowPresent !== false
    || binding.productionReady !== false
  ) push(issues, 'authority_promotion_forbidden', '$')
  if (binding.subjectSpecificRouting !== false) {
    push(
      issues,
      'subject_specific_routing_forbidden',
      '$.subjectSpecificRouting',
    )
  }
  if (
    typeof binding.bindingDigestSha256 !== 'string'
    || !SHA256.test(binding.bindingDigestSha256)
  ) {
    push(issues, 'digest_mismatch', '$.bindingDigestSha256')
  } else {
    const { bindingDigestSha256, ...draft } = binding
    if (digest(draft) !== bindingDigestSha256) {
      push(issues, 'digest_mismatch', '$.bindingDigestSha256')
    }
  }
  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, binding }
}

export function verifyLivingFrameControlImageWorkflowBinding(
  value: unknown,
): value is LivingFrameControlImageWorkflowBinding {
  return validateLivingFrameControlImageWorkflowBinding(value).ok
}

function resolveVerifiedControlImage(
  input: CreateLivingFrameControlImageWorkflowBindingInput,
): VerifiedControlImage {
  if (input.controlImageKind === 'canny') {
    const report = input.cannyReport as LivingFrameControlImageCannyReport
    return {
      sourceBinding: {
        controlImageKind: 'canny',
        controlImageReportDigestSha256: report.reportDigestSha256,
        sourceArtifactId: report.sourceArtifact.artifactId,
        sourceArtifactDigestSha256:
          report.sourceArtifact.artifactDigestSha256,
        measuredSourceRgbaDigestSha256:
          report.sourceArtifact.measuredSourceRgbaDigestSha256,
      },
      measuredOutputRgbaDigestSha256:
        report.outputRaster.measuredOutputRgbaDigestSha256,
      width: report.outputRaster.width,
      height: report.outputRaster.height,
    }
  }
  if (input.controlImageKind === 'depth') {
    const report = input.depthReport as LivingFrameControlImageDepthReport
    return {
      sourceBinding: {
        controlImageKind: 'depth',
        controlImageReportDigestSha256: report.reportDigestSha256,
        sourceArtifactId: report.sourceArtifact.artifactId,
        sourceArtifactDigestSha256:
          report.sourceArtifact.artifactDigestSha256,
        depthSamplePacketId: report.depthSamplePacket.packetId,
        depthSamplePacketDigestSha256:
          report.depthSamplePacket.measuredPacketDigestSha256,
        depthSampleEncoding: 'uint16_big_endian_digest',
        depthPolarity: 'larger_value_is_nearer',
      },
      measuredOutputRgbaDigestSha256:
        report.outputRaster.measuredOutputRgbaDigestSha256,
      width: report.outputRaster.width,
      height: report.outputRaster.height,
    }
  }
  const report = input.poseReport as LivingFrameControlImagePoseReport
  return {
    sourceBinding: {
      controlImageKind: 'pose',
      controlImageReportDigestSha256: report.reportDigestSha256,
      sourceArtifactId: report.sourceArtifact.artifactId,
      sourceArtifactDigestSha256:
        report.sourceArtifact.artifactDigestSha256,
      poseLandmarkPacketId: report.poseLandmarkPacket.packetId,
      poseLandmarkPacketDigestSha256:
        report.poseLandmarkPacket.measuredPacketDigestSha256,
      poseLandmarkSchema: 'coco17',
    },
    measuredOutputRgbaDigestSha256:
      report.outputRaster.measuredOutputRgbaDigestSha256,
    width: report.outputRaster.width,
    height: report.outputRaster.height,
  }
}

function compileBinding(
  bindingId: string,
  controlImage: VerifiedControlImage,
  workflow: LivingFrameControlledComfyUiWorkflowExpectation,
): LivingFrameControlImageWorkflowBinding {
  if (workflow.profile === 'base_txt2img') {
    throw issueError(
      'controlnet_profile_required',
      '$.workflowExpectation.profile',
    )
  }
  if (
    controlImage.width !== workflow.frameExpectation.widthPixels
    || controlImage.height !== workflow.frameExpectation.heightPixels
  ) throw issueError('frame_mismatch', '$.workflowExpectation.frameExpectation')
  const candidates = workflow.externalBindingExpectations.filter(
    (binding) =>
      binding.bindingKind === 'control_image_artifact_expectation',
  )
  if (candidates.length === 0) {
    throw issueError(
      'control_image_binding_missing',
      '$.workflowExpectation.externalBindingExpectations',
    )
  }
  if (candidates.length !== 1) {
    throw issueError(
      'control_image_binding_duplicate',
      '$.workflowExpectation.externalBindingExpectations',
    )
  }
  const controlBinding = candidates[0]
  if (
    controlBinding.bindingDigestSha256
      !== controlImage.measuredOutputRgbaDigestSha256
  ) {
    throw issueError(
      'control_image_digest_mismatch',
      '$.workflowExpectation.externalBindingExpectations',
    )
  }
  const draft: LivingFrameControlImageWorkflowBindingDraft = {
    contractVersion: LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_VERSION,
    resultClass: LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_CLASS,
    bindingId,
    sourceBindings: {
      controlImage: controlImage.sourceBinding,
      measuredControlImageRgbaDigestSha256:
        controlImage.measuredOutputRgbaDigestSha256,
      workflowExpectationId: workflow.workflowExpectationId,
      workflowExpectationDigestSha256: workflow.expectationDigestSha256,
    },
    frameExpectation: {
      widthPixels: controlImage.width,
      heightPixels: controlImage.height,
      controlImageAndWorkflowFramesMatch: true,
      exactOutputFrameRevalidationRequired: true,
    },
    controlImageBinding: {
      bindingExpectationId: controlBinding.bindingExpectationId,
      targetNodeId: controlBinding.targetNodeId,
      targetPort: 'image',
      bindingDigestMatchesMeasuredPixels: true,
      contentAddressedArtifactExpected: true,
      canonicalArtifactIdPresent: false,
      artifactResolved: false,
      artifactQaPassed: false,
    },
    openGateCodes: LIVING_FRAME_CONTROL_IMAGE_WORKFLOW_BINDING_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    parentContractsRevalidationRequired: true,
    rawPixelsPresent: false,
    rawLandmarksPresent: false,
    filePathOrUrlPresent: false,
    providerOrToolIdentifierPresent: false,
    workOrQueueIdentifierPresent: false,
    executableWorkflowPresent: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return { ...draft, bindingDigestSha256: digest(draft) }
}

function validateCreateInput(
  input: CreateLivingFrameControlImageWorkflowBindingInput,
): readonly LivingFrameControlImageWorkflowBindingIssue[] {
  if (!isRecord(input)) return [issue('input_invalid', '$')]
  const issues: LivingFrameControlImageWorkflowBindingIssue[] = []
  if (!LIVING_FRAME_CONTROL_IMAGE_KINDS.includes(
    input.controlImageKind as 'canny' | 'depth' | 'pose',
  )) {
    return [issue('control_image_kind_invalid', '$.controlImageKind')]
  }
  const expectedKeys = input.controlImageKind === 'canny'
    ? ['bindingId', 'controlImageKind', 'cannyReport', 'workflowExpectation']
    : input.controlImageKind === 'depth'
      ? [
          'bindingId',
          'controlImageKind',
          'depthReport',
          'depthVerificationInput',
          'depthOutputRgbaBytes',
          'workflowExpectation',
        ]
      : [
        'bindingId',
        'controlImageKind',
        'poseReport',
        'poseVerificationInput',
        'poseOutputRgbaBytes',
        'workflowExpectation',
      ]
  pushExactKeys(input, expectedKeys, '$', issues)
  if (
    typeof input.bindingId !== 'string'
    || !SAFE_ID.test(input.bindingId)
  ) push(issues, 'unsafe_input', '$.bindingId')
  if (input.controlImageKind === 'canny') {
    if (!verifyLivingFrameControlImageCannyReport(input.cannyReport)) {
      push(issues, 'canny_report_invalid', '$.cannyReport')
    }
  } else if (input.controlImageKind === 'depth') {
    if (
      !(input.depthOutputRgbaBytes instanceof Uint8Array)
      || !verifyLivingFrameControlImageDepthReport(
        input.depthReport,
        input.depthVerificationInput,
        input.depthOutputRgbaBytes,
      )
    ) {
      push(
        issues,
        'depth_verification_context_invalid',
        '$.depthVerificationInput',
      )
    }
  } else if (
    !(input.poseOutputRgbaBytes instanceof Uint8Array)
    || !verifyLivingFrameControlImagePoseReport(
      input.poseReport,
      input.poseVerificationInput,
      input.poseOutputRgbaBytes,
    )
  ) {
    push(
      issues,
      'pose_verification_context_invalid',
      '$.poseVerificationInput',
    )
  }
  if (
    !validateLivingFrameControlledComfyUiWorkflowExpectation(
      input.workflowExpectation,
    ).ok
  ) {
    push(
      issues,
      'workflow_expectation_invalid',
      '$.workflowExpectation',
    )
  }
  return dedupe(issues)
}

function validateSourceBindings(
  value: unknown,
  issues: LivingFrameControlImageWorkflowBindingIssue[],
): void {
  const path = '$.sourceBindings'
  if (!isRecord(value)) {
    push(issues, 'source_lineage_invalid', path)
    return
  }
  pushExactKeys(value, [
    'controlImage',
    'measuredControlImageRgbaDigestSha256',
    'workflowExpectationId',
    'workflowExpectationDigestSha256',
  ], path, issues)
  validateControlImageSourceBinding(value.controlImage, issues)
  if (
    !SAFE_ID.test(String(value.workflowExpectationId))
    || typeof value.measuredControlImageRgbaDigestSha256 !== 'string'
    || !SHA256.test(value.measuredControlImageRgbaDigestSha256)
    || typeof value.workflowExpectationDigestSha256 !== 'string'
    || !SHA256.test(value.workflowExpectationDigestSha256)
  ) push(issues, 'source_lineage_invalid', path)
}

function validateControlImageSourceBinding(
  value: unknown,
  issues: LivingFrameControlImageWorkflowBindingIssue[],
): void {
  const path = '$.sourceBindings.controlImage'
  if (!isRecord(value)) {
    push(issues, 'source_lineage_invalid', path)
    return
  }
  if (value.controlImageKind === 'canny') {
    pushExactKeys(value, [
      'controlImageKind',
      'controlImageReportDigestSha256',
      'sourceArtifactId',
      'sourceArtifactDigestSha256',
      'measuredSourceRgbaDigestSha256',
    ], path, issues)
    if (!validCommonControlSource(value)) {
      push(issues, 'source_lineage_invalid', path)
    }
    if (
      typeof value.measuredSourceRgbaDigestSha256 !== 'string'
      || !SHA256.test(value.measuredSourceRgbaDigestSha256)
    ) push(issues, 'source_lineage_invalid', path)
    return
  }
  if (value.controlImageKind === 'pose') {
    pushExactKeys(value, [
      'controlImageKind',
      'controlImageReportDigestSha256',
      'sourceArtifactId',
      'sourceArtifactDigestSha256',
      'poseLandmarkPacketId',
      'poseLandmarkPacketDigestSha256',
      'poseLandmarkSchema',
    ], path, issues)
    if (
      !validCommonControlSource(value)
      || !SAFE_ID.test(String(value.poseLandmarkPacketId))
      || typeof value.poseLandmarkPacketDigestSha256 !== 'string'
      || !SHA256.test(value.poseLandmarkPacketDigestSha256)
      || value.poseLandmarkSchema !== 'coco17'
    ) push(issues, 'source_lineage_invalid', path)
    return
  }
  if (value.controlImageKind === 'depth') {
    pushExactKeys(value, [
      'controlImageKind',
      'controlImageReportDigestSha256',
      'sourceArtifactId',
      'sourceArtifactDigestSha256',
      'depthSamplePacketId',
      'depthSamplePacketDigestSha256',
      'depthSampleEncoding',
      'depthPolarity',
    ], path, issues)
    if (
      !validCommonControlSource(value)
      || !SAFE_ID.test(String(value.depthSamplePacketId))
      || typeof value.depthSamplePacketDigestSha256 !== 'string'
      || !SHA256.test(value.depthSamplePacketDigestSha256)
      || value.depthSampleEncoding !== 'uint16_big_endian_digest'
      || value.depthPolarity !== 'larger_value_is_nearer'
    ) push(issues, 'source_lineage_invalid', path)
    return
  }
  push(issues, 'control_image_kind_invalid', `${path}.controlImageKind`)
}

function validCommonControlSource(
  value: Record<string, unknown>,
): boolean {
  return SAFE_ID.test(String(value.sourceArtifactId))
    && typeof value.controlImageReportDigestSha256 === 'string'
    && SHA256.test(value.controlImageReportDigestSha256)
    && typeof value.sourceArtifactDigestSha256 === 'string'
    && SHA256.test(value.sourceArtifactDigestSha256)
}

function validateFrame(
  value: unknown,
  issues: LivingFrameControlImageWorkflowBindingIssue[],
): void {
  const path = '$.frameExpectation'
  if (!isRecord(value)) {
    push(issues, 'frame_mismatch', path)
    return
  }
  pushExactKeys(value, [
    'widthPixels',
    'heightPixels',
    'controlImageAndWorkflowFramesMatch',
    'exactOutputFrameRevalidationRequired',
  ], path, issues)
  if (
    !integerBetween(value.widthPixels, 3, 4096)
    || !integerBetween(value.heightPixels, 3, 4096)
    || value.controlImageAndWorkflowFramesMatch !== true
    || value.exactOutputFrameRevalidationRequired !== true
  ) push(issues, 'frame_mismatch', path)
}

function validateControlBinding(
  value: unknown,
  issues: LivingFrameControlImageWorkflowBindingIssue[],
): void {
  const path = '$.controlImageBinding'
  if (!isRecord(value)) {
    push(issues, 'binding_invalid', path)
    return
  }
  pushExactKeys(value, [
    'bindingExpectationId',
    'targetNodeId',
    'targetPort',
    'bindingDigestMatchesMeasuredPixels',
    'contentAddressedArtifactExpected',
    'canonicalArtifactIdPresent',
    'artifactResolved',
    'artifactQaPassed',
  ], path, issues)
  if (
    !SAFE_ID.test(String(value.bindingExpectationId))
    || !SAFE_ID.test(String(value.targetNodeId))
    || value.targetPort !== 'image'
    || value.bindingDigestMatchesMeasuredPixels !== true
    || value.contentAddressedArtifactExpected !== true
    || value.canonicalArtifactIdPresent !== false
    || value.artifactResolved !== false
    || value.artifactQaPassed !== false
  ) push(issues, 'binding_invalid', path)
}

function pushExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  path: string,
  issues: LivingFrameControlImageWorkflowBindingIssue[],
): void {
  const expected = new Set(expectedKeys)
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) push(issues, 'unknown_key', `${path}.${key}`)
  }
  for (const key of expectedKeys) {
    if (!Object.hasOwn(value, key)) push(issues, 'input_invalid', `${path}.${key}`)
  }
}

function integerBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): boolean {
  return Number.isInteger(value)
    && Number(value) >= minimum
    && Number(value) <= maximum
}

function issue(
  code: LivingFrameControlImageWorkflowBindingIssueCode,
  path: string,
): LivingFrameControlImageWorkflowBindingIssue {
  return { code, path }
}

function push(
  issues: LivingFrameControlImageWorkflowBindingIssue[],
  code: LivingFrameControlImageWorkflowBindingIssueCode,
  path: string,
): void {
  issues.push(issue(code, path))
}

function issueError(
  code: LivingFrameControlImageWorkflowBindingIssueCode,
  path: string,
): LivingFrameControlImageWorkflowBindingError {
  return new LivingFrameControlImageWorkflowBindingError([issue(code, path)])
}

function invalidResult(
  code: LivingFrameControlImageWorkflowBindingIssueCode,
  path: string,
): LivingFrameControlImageWorkflowBindingValidationResult {
  return { ok: false, issues: [issue(code, path)] }
}

function dedupe(
  issues: readonly LivingFrameControlImageWorkflowBindingIssue[],
): readonly LivingFrameControlImageWorkflowBindingIssue[] {
  return [...new Map(
    issues.map((entry) => [`${entry.code}:${entry.path}`, entry]),
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
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
}
