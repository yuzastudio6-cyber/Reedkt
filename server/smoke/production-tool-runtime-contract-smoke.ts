import {
  assertArtifactUsesStorageReference,
  assertLicenseAllowedForProduction,
  assertModelWeightAllowedForCommercialUse,
  assertNoRawPromptExecutionPayload,
  assertQualityGatesAllowFinalExport,
  assertToolExecutionPlanIsApproved,
} from '../../src/backend/contracts/production-tool-runtime-validation'
import type { LicenseReviewRecord, ModelWeightManifest } from '../../src/backend/contracts/model-license-contracts'
import type { QualityGateResult } from '../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../src/backend/contracts/tool-artifact-contracts'
import type { ToolExecutionPlan } from '../../src/backend/contracts/tool-execution-contracts'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function expectFailure(label: string, run: () => void): string {
  let failed = false
  try {
    run()
  } catch {
    failed = true
  }
  assert(failed, `${label} should fail.`)
  return label
}

const now = new Date().toISOString()

const approvedPlan: ToolExecutionPlan = {
  id: 'tool-plan-smoke',
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  mediaAssetId: 'media-smoke',
  approvedSnapshotId: 'approved-snapshot-smoke',
  editPlanId: 'edit-plan-smoke',
  mediaAnalysisReportId: 'analysis-smoke',
  recipeIds: ['caption_recipe_v1'],
  status: 'approved',
  createdAt: now,
  updatedAt: now,
  requestedBy: 'user-smoke',
  executionMode: 'dry_run',
  workerPlan: {
    workerType: 'qa_worker',
    workerJobIds: [],
    notes: 'Smoke validation only.',
  },
  toolSteps: [],
  expectedArtifacts: [],
  requiredQualityGates: [],
  fallbackPlan: {
    allowedActions: ['block_final_export', 'request_user_review'],
    fallbackRecipeIds: [],
    fallbackToolIds: [],
    requiresUserApprovalWhen: ['quality_gate_failed'],
  },
  creditReservationId: 'credit-reservation-smoke',
  idempotencyKey: 'prod-runtime-contract-smoke',
  approvalRequired: true,
  approvedAt: now,
  userIntentSummary: 'Create a smoke-safe contract validation plan.',
  approvedDirectiveSummary: 'Use approved snapshot records only.',
}

assertToolExecutionPlanIsApproved(approvedPlan)

const goodArtifact: ToolArtifact = {
  id: 'artifact-smoke',
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  mediaAssetId: 'media-smoke',
  toolRunId: 'tool-run-smoke',
  artifactType: 'qa_report',
  storageBucketPurpose: 'qa_artifacts',
  storageObjectPath: 'workspaces/workspace-smoke/projects/project-smoke/qa/report.json',
  contentType: 'application/json',
  sizeBytes: 512,
  checksum: 'sha256:smoke',
  createdAt: now,
  isPrivate: true,
  metadata: {},
  previewAllowed: false,
  sourceOfTruth: true,
}

assertArtifactUsesStorageReference(goodArtifact)

const passingGate: QualityGateResult = {
  id: 'gate-pass',
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  mediaAssetId: 'media-smoke',
  toolExecutionPlanId: approvedPlan.id,
  recipeId: 'caption_recipe_v1',
  gateType: 'final_delivery',
  status: 'passed',
  score: 1,
  threshold: 0.95,
  required: true,
  blocking: false,
  checkedAt: now,
  checkedByWorkerType: 'qa_worker',
  inputArtifactIds: [goodArtifact.id],
  outputArtifactIds: [],
  issues: [],
  recommendations: [],
  fallbackRequired: false,
  blocksPreview: true,
  blocksFinalExport: true,
  humanReviewRequired: false,
}

assertQualityGatesAllowFinalExport([passingGate])

const goodModelWeight: ModelWeightManifest = {
  id: 'model-weight-ok',
  toolId: 'faster_whisper',
  modelName: 'smoke-model',
  modelVersion: 'v1',
  source: 'mock://model-card',
  license: 'reviewed',
  commercialUseAllowed: true,
  redistributionAllowed: false,
  requiresAttribution: false,
  reviewStatus: 'approved',
  riskNotes: [],
  createdAt: now,
  updatedAt: now,
}

assertModelWeightAllowedForCommercialUse(goodModelWeight)

const goodLicense: LicenseReviewRecord = {
  id: 'license-ok',
  toolId: 'ffmpeg',
  packageName: 'ffmpeg-lgpl-build',
  packageVersion: 'mock',
  license: 'LGPL-reviewed-placeholder',
  licenseFamily: 'copyleft',
  commercialUseAllowed: true,
  distributionRisk: 'medium',
  networkUseRisk: 'low',
  reviewStatus: 'approved',
  notes: [],
  createdAt: now,
  updatedAt: now,
}

assertLicenseAllowedForProduction(goodLicense)

const failedChecks = [
  expectFailure('raw_prompt_execution_payload', () => assertNoRawPromptExecutionPayload({ rawPrompt: 'run this directly' })),
  expectFailure('blocking_quality_gate_blocks_final_export', () => assertQualityGatesAllowFinalExport([{
    ...passingGate,
    id: 'gate-fail',
    status: 'failed',
    blocking: true,
    issues: [{
      code: 'FINAL_QA_FAILED',
      message: 'Final export QA failed.',
      severity: 'blocking',
    }],
  }])),
  expectFailure('signed_url_artifact_source', () => assertArtifactUsesStorageReference({
    ...goodArtifact,
    id: 'artifact-signed-url',
    storageObjectPath: 'https://storage.example.com/signed/path?X-Goog-Signature=abc',
    signedUrl: 'https://storage.example.com/signed/path',
  } as ToolArtifact)),
  expectFailure('non_commercial_model_weight', () => assertModelWeightAllowedForCommercialUse({
    ...goodModelWeight,
    id: 'model-weight-blocked',
    commercialUseAllowed: false,
  })),
  expectFailure('blocked_license_record', () => assertLicenseAllowedForProduction({
    ...goodLicense,
    id: 'license-blocked',
    reviewStatus: 'blocked',
    distributionRisk: 'blocked',
  })),
]

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_approved_execution_plan_passes',
    'storage_reference_artifact_passes',
    'passing_quality_gate_allows_final_export',
    'commercial_model_weight_passes',
    'approved_license_record_passes',
    ...failedChecks,
  ],
}))
