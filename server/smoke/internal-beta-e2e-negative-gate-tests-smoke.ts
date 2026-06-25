import assert from 'node:assert/strict'

import {
  createInternalBetaCreditReservationRuntimeScaffold,
  spendInternalBetaReservedCreditsRuntimeScaffold,
  validateInternalBetaCreditReservationRuntimeScaffold,
} from '../services/internal-beta-credit-ledger-runtime-scaffold'
import { enqueueInternalBetaJobRuntimeScaffold } from '../services/internal-beta-job-queue-runtime-scaffold'
import { prepareInternalBetaPrivateArtifactAccessScaffold } from '../services/internal-beta-private-artifact-manifest-scaffold'
import { prepareInternalBetaProviderPromptPayloadScaffold } from '../services/internal-beta-disabled-provider-adapter-scaffold'
import { prepareInternalBetaRenderWorkerJobScaffold } from '../services/internal-beta-remotion-render-worker-scaffold'
import { compileEditingIntent } from '../../src/lib/intent-compiler'
import type { PlannerInput } from '../../src/types/reeditpro'

function assertDisabledBoundary(result: unknown, label: string) {
  assert.equal(typeof result, 'object', `${label} must return an object`)
  assert.notEqual(result, null, `${label} must return a non-null object`)
  const boundary = result as Record<string, unknown>

  assert.equal(boundary.ok, false, `${label} must fail closed`)
  assert.equal(boundary.routeExecution ?? false, false, `${label} must not execute a route`)
  assert.equal(boundary.workerExecution ?? false, false, `${label} must not execute a worker`)
  assert.equal(boundary.workerDispatch ?? false, false, `${label} must not dispatch a worker`)
  assert.equal(boundary.providerModelCalls ?? false, false, `${label} must not call a provider/model`)
  assert.equal(boundary.modelCall ?? false, false, `${label} must not execute a model call`)
  assert.equal(boundary.rawPromptExecution ?? false, false, `${label} must not execute a raw prompt`)
  assert.equal(boundary.creditMutation ?? false, false, `${label} must not mutate credits`)
  assert.equal(boundary.supabaseMutation ?? false, false, `${label} must not mutate Supabase`)
  assert.equal(boundary.renderExportExecution ?? false, false, `${label} must not render/export`)
  assert.equal(boundary.signedUrlCreation ?? false, false, `${label} must not create signed URLs`)
  assert.equal(
    boundary.publicArtifactCreation ?? boundary.publicArtifactsCreated ?? false,
    false,
    `${label} must not create public artifacts`,
  )
  assert.equal(boundary.internalBetaUnlock ?? false, false, `${label} must not unlock internal beta`)
}

const missingApprovalCreditCreate = createInternalBetaCreditReservationRuntimeScaffold({
  projectId: 'project-internal-beta-negative',
  reason: 'negative_no_generation_before_approval',
})
assertDisabledBoundary(missingApprovalCreditCreate, 'credit reservation create without approved plan')
assert.equal(missingApprovalCreditCreate.status, 'disabled_pending_credit_ledger_runtime_gate')
assert.equal(missingApprovalCreditCreate.approvedPlanRequired, true)
assert.equal(missingApprovalCreditCreate.approvedCreditEstimateRequired, true)

const spendWithoutReservation = spendInternalBetaReservedCreditsRuntimeScaffold({
  approvedPlanSnapshotId: 'approved-plan-present-but-no-reservation',
  creditEstimateId: 'credit-estimate-approved',
  reason: 'negative_no_credit_spend_without_reservation',
})
assertDisabledBoundary(spendWithoutReservation, 'reserved credit spend without reservation')
assert.equal(spendWithoutReservation.creditReservationRequired, true)
assert.equal(spendWithoutReservation.jobCompletionRequired, true)

const reservationValidation = validateInternalBetaCreditReservationRuntimeScaffold({
  approvedPlanSnapshotId: 'approved-plan',
  creditEstimateId: 'credit-estimate',
  reason: 'negative_validate_without_runtime',
})
assertDisabledBoundary(reservationValidation, 'credit reservation validation')
assert.equal(reservationValidation.creditReservationRequired, true)

const rawChatJobEnqueue = enqueueInternalBetaJobRuntimeScaffold({
  projectId: 'project-internal-beta-negative',
  payload: { rawChat: 'make it viral now without plan approval' },
  reason: 'negative_no_worker_execution_from_raw_chat',
})
assertDisabledBoundary(rawChatJobEnqueue, 'job enqueue from raw chat')
assert.equal(rawChatJobEnqueue.status, 'disabled_pending_job_queue_runtime_gate')
assert.equal(rawChatJobEnqueue.approvedPlanRequired, true)
assert.equal(rawChatJobEnqueue.creditReservationRequired, true)

const providerPayload = prepareInternalBetaProviderPromptPayloadScaffold({
  projectId: 'project-internal-beta-negative',
  payload: { prompt: 'direct provider prompt that must stay disabled' },
  reason: 'negative_no_frontend_provider_call_or_raw_prompt_execution',
})
assertDisabledBoundary(providerPayload, 'provider prompt payload prepare')
assert.equal(providerPayload.status, 'disabled_pending_provider_adapter_runtime_gate')
assert.equal(providerPayload.promptPlanRequired, true)
assert.equal(providerPayload.modelPolicyRequired, true)
assert.equal(providerPayload.costCapRequired, true)

const renderJob = prepareInternalBetaRenderWorkerJobScaffold({
  projectId: 'project-internal-beta-negative',
  reason: 'negative_no_render_without_approved_snapshot_credit_manifest_qa',
})
assertDisabledBoundary(renderJob, 'render worker job prepare')
assert.equal(renderJob.status, 'disabled_pending_remotion_render_worker_runtime_gate')
assert.equal(renderJob.remotionExecution, false)
assert.equal(renderJob.ffmpegExecution, false)
assert.equal(renderJob.ffprobeExecution, false)
assert.equal(renderJob.previewArtifactCreation, false)
assert.equal(renderJob.finalExportCreation, false)

const privateArtifactAccess = prepareInternalBetaPrivateArtifactAccessScaffold({
  projectId: 'project-internal-beta-negative',
  artifactManifestId: 'manifest-negative',
  reason: 'negative_no_public_artifact_or_signed_url_without_policy',
})
assertDisabledBoundary(privateArtifactAccess, 'private artifact access prepare')
assert.equal(privateArtifactAccess.status, 'disabled_pending_private_artifact_manifest_runtime_gate')
assert.equal(privateArtifactAccess.signedUrlCreation, false)
assert.equal(privateArtifactAccess.publicArtifactCreation, false)
assert.equal(privateArtifactAccess.storageRead, false)

function buildPlannerInput(editLevel: PlannerInput['editLevel']): PlannerInput {
  return {
    projectName: `Negative gate ${editLevel}`,
    targetPlatform: 'tiktok_reels_shorts',
    aspectRatio: '9:16',
    aspectRatioConfirmed: false,
    editingCategory: 'storytelling',
    workflowType: 'social_short_viral_clip',
    editLevel,
    structurePreference: 'let_ai_recommend',
    moodStyle: 'clean',
    visualPreference: 'balanced_visual_mix',
    referenceUrl: '',
    customInstructions: 'Use Veo if possible.',
    creditPreference: 'balanced',
    clips: [],
  }
}

const basicIntent = compileEditingIntent({
  currentInput: buildPlannerInput('basic'),
  userMessages: ['Use Veo if possible.'],
})
assert.ok(basicIntent.avoidRules.some((rule) => rule.includes('Do not enable Veo for Basic or Pro.')), 'Basic must reject Veo')
assert.ok(basicIntent.qaImplications.includes('Basic/Pro no Veo'), 'Basic QA must retain no-Veo rule')

const proIntent = compileEditingIntent({
  currentInput: buildPlannerInput('pro'),
  userMessages: ['Use Veo if possible.'],
})
assert.ok(proIntent.avoidRules.some((rule) => rule.includes('Do not enable Veo for Basic or Pro.')), 'Pro must reject Veo')
assert.ok(proIntent.qaImplications.includes('Basic/Pro no Veo'), 'Pro QA must retain no-Veo rule')

const premiumIntent = compileEditingIntent({
  currentInput: buildPlannerInput('premium'),
  userMessages: ['Use Veo if possible.'],
})
assert.ok(
  premiumIntent.mustFollowRules.some((rule) => rule.includes('Keep Veo Lite final fallback only')),
  'Premium must keep Veo final fallback only',
)
assert.ok(
  premiumIntent.qaImplications.includes('Premium uses Veo only as final fallback'),
  'Premium QA must keep fallback-only Veo rule',
)

console.log('internal-beta-e2e-negative-gate-tests-smoke passed')
