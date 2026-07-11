import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createReeditProApiApp } from '../app'
import { ApiError } from '../errors/api-error'
import { loadRuntimeEnv } from '../config/env'
import { createEditPlanningAuthorityService } from '../services/edit-planning-authority-service'
import { createExactEditPreferenceService } from '../services/exact-edit-preference-service'
import {
  buildEditBriefAuthorityPublicationBinding,
  createEditBriefAuthorityService,
} from '../services/edit-brief-authority-service'
import { createPreferenceIntelligenceService } from '../services/preference-intelligence-service'
import { createSourceMediaAuthorityService } from '../services/source-media-authority-service'
import { createUploadService } from '../services/upload-service'
import { createCanonicalEditExecutionPackageService } from '../services/canonical-edit-execution-package-service'
import {
  clearPrivateEditAuthorityProcessStateForSmoke,
  readPrivateEditAuthorityAggregate,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  clearPrivateExactEditPreferenceProcessStateForSmoke,
  exactEditPreferenceFingerprint,
} from '../services/private-exact-edit-preference-store'
import { preferenceIntelligenceHash } from '../services/private-preference-intelligence-store'
import { readPrivateEditBriefAuthorityAggregate } from '../services/private-edit-brief-authority-store'
import { clearLocalProjectMemoryForSmoke, createProjectService } from '../services/project-service'
import type { ServiceContext } from '../types'
import {
  PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
  type PublishCanonicalEditPlanBody,
} from '../validation/edit-planning-authority-schemas'
import type { PlanningInputAuthorityExpectation } from '../validation/planning-input-authority-binding-schemas'
import type { SourceMediaAuthorityExpectation } from '../validation/source-media-authority-schemas'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'

const localStorageRoot = canonicalAuthoritySmokeRoot
const workspaceId = 'workspace-authority-smoke'
const userId = 'user-authority-smoke'
await rm(localStorageRoot, { force: true, recursive: true })
clearLocalProjectMemoryForSmoke()
clearPrivateEditAuthorityProcessStateForSmoke()
clearPrivateExactEditPreferenceProcessStateForSmoke()

const memberships = [
  { workspaceId, userId, role: 'owner' },
  { workspaceId, userId: 'other-authority-user', role: 'editor' },
  { workspaceId: 'workspace-authority-route-smoke', userId, role: 'owner' },
  { workspaceId: 'workspace-planning-binding-integration', userId, role: 'owner' },
]
const admin = createMembershipAdminClient(memberships)

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  SUPABASE_URL: 'https://edit-planning-authority-smoke.supabase.co',
  SUPABASE_ANON_KEY: 'edit-planning-authority-smoke-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'edit-planning-authority-smoke-service-role',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
  LOCAL_STORAGE_ROOT: localStorageRoot,
})
const context: ServiceContext = {
  env,
  clients: { admin, public: null },
  requestId: 'edit-planning-authority-smoke',
  auth: { userId, accessToken: 'verified-authority-token', isMockUser: false },
}
const project = (await createProjectService(context).createProject({
  workspaceId,
  name: 'Authority smoke project',
})).project
const service = createEditPlanningAuthorityService(context)
const planningInputExpectations = new Map<string, PlanningInputAuthorityExpectation>()
const sourceMediaFixtures = new Map<string, SourceMediaFixture>()
for (const editSession of [
  'edit-session-authority-1',
  'edit-session-invalid-frame',
  'edit-session-cycle',
  'edit-session-unknown-tool',
  'edit-session-missing-tool-operation',
  'edit-session-spoofed-tool-operation',
  'edit-session-policy-blocked-tool',
  'edit-session-tool-free-final-export',
  'edit-session-veo-basic',
  'edit-session-default-trim-blocked',
  'edit-session-duplicate-output-blocked',
  'edit-session-insufficient',
  'edit-session-stale-expectation',
  'edit-session-stale-source-expectation',
  'edit-session-preference-changed-after-publish',
  'production-blocked',
]) {
  planningInputExpectations.set(editSession, await prepareExactPlanningAuthority(context, project.id, editSession))
}
sourceMediaFixtures.set(project.id, await prepareSourceMediaAuthority(context, workspaceId, project.id, 'main'))

const published = await service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-authority-1'))
const publishedAuthority = asRecord(published.authority)
const publishedPlan = asRecord(publishedAuthority.plan)
const publishedEstimate = asRecord(publishedAuthority.estimate)
assert.equal(publishedAuthority.authorityRevision, 1)
assert.equal(publishedPlan.status, 'presented')
assert.match(String(publishedPlan.planHash), /^[a-f0-9]{64}$/)
assert.match(String(publishedEstimate.estimateHash), /^[a-f0-9]{64}$/)
assert.equal('compiledIntent' in publishedPlan, false, 'Plan response should expose content references, not duplicate raw plan payloads.')

const replayedPublish = await service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-authority-1'))
assert.deepEqual(replayedPublish.authority, published.authority, 'Exact plan publish replay must return the exact persisted response.')

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-authority-1', {
    planningRequestId: 'different-request-with-reused-idempotency',
  })),
  'IDEMPOTENCY_CONFLICT',
  'Changed publish request must conflict when the idempotency key is reused.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-invalid-frame', {
    planningRequestId: 'planning-invalid-frame',
    idempotencyKey: 'publish-invalid-frame',
    mutateBody(body) {
      ;(body.canonicalPlan.components.confirmedSettings as { outputFrameConfirmed: boolean }).outputFrameConfirmed = false
    },
  })),
  'VALIDATION_FAILED',
  'Unconfirmed output frame must fail before canonical persistence.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-cycle', {
    planningRequestId: 'planning-cycle',
    idempotencyKey: 'publish-cycle',
    mutateBody(body) {
      body.canonicalPlan.workItems[0]!.dependencyKeys = ['final-export']
    },
  })),
  'VALIDATION_FAILED',
  'Dependency cycle must fail before canonical persistence.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-unknown-tool', {
    planningRequestId: 'planning-unknown-tool',
    idempotencyKey: 'publish-unknown-tool',
    mutateBody(body) {
      body.canonicalPlan.workItems[1]!.approvedToolIds = ['not-a-production-tool']
    },
  })),
  'VALIDATION_FAILED',
  'Unknown tool ID must fail before canonical persistence.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-veo-basic', {
    planningRequestId: 'planning-veo-basic',
    idempotencyKey: 'publish-veo-basic',
    mutateBody(body) {
      body.canonicalPlan.components.providerPolicy = {
        veoPolicy: 'final_fallback_only',
        approvedRoutes: ['veo_3_1_lite'],
      }
      body.canonicalPlan.workItems[1]!.approvedProviderRoute = 'veo_3_1_lite'
      body.canonicalPlan.workItems[1]!.providerExecutionMode = 'final_fallback'
    },
  })),
  'PROVIDER_MODEL_ROLE_FORBIDDEN',
  'Basic plan must never receive Veo authority.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-default-trim-blocked', {
    planningRequestId: 'planning-default-trim-blocked',
    idempotencyKey: 'publish-default-trim-blocked',
    mutateBody(body) {
      body.canonicalPlan.workItems[1]!.sourceCleanupDecisionIds = []
    },
  })),
  'JOB_DEPENDENCY_NOT_READY',
  'Source trimming must never infer a full-file/default range without approved cleanup decisions.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-duplicate-output-blocked', {
    planningRequestId: 'planning-duplicate-output-blocked',
    idempotencyKey: 'publish-duplicate-output-blocked',
    mutateBody(body) {
      body.canonicalPlan.workItems[0]!.expectedOutputs.push({
        ...body.canonicalPlan.workItems[0]!.expectedOutputs[0]!,
      })
    },
  })),
  'VALIDATION_FAILED',
  'Expected output keys must be unique within each canonical work item.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-stale-expectation', {
    planningRequestId: 'planning-stale-preference-expectation',
    idempotencyKey: 'publish-stale-preference-expectation',
    mutateBody(body) {
      body.planningInputAuthority.exactEditPreference.preferenceFingerprintSha256 = 'f'.repeat(64)
    },
  })),
  'IDEMPOTENCY_CONFLICT',
  'Canonical publication must reject stale exact-edit preference expectations.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-stale-source-expectation', {
    planningRequestId: 'planning-stale-source-expectation',
    idempotencyKey: 'publish-stale-source-expectation',
    mutateBody(body) {
      body.sourceMediaAuthority.candidateHash = 'f'.repeat(64)
    },
  })),
  'UPLOAD_SOURCE_MISMATCH',
  'Canonical publication must reject stale or caller-substituted source-media authority.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-missing-tool-operation', {
    planningRequestId: 'planning-missing-tool-operation',
    idempotencyKey: 'publish-missing-tool-operation',
    mutateBody(body) {
      delete body.canonicalPlan.workItems[1]!.executionInput.approvedToolOperationIds
    },
  })),
  'VALIDATION_FAILED',
  'Every tool-backed work item must freeze its exact canonical operation identity.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-spoofed-tool-operation', {
    planningRequestId: 'planning-spoofed-tool-operation',
    idempotencyKey: 'publish-spoofed-tool-operation',
    mutateBody(body) {
      body.canonicalPlan.workItems[1]!.executionInput.approvedToolOperationIds = ['tool.ffmpeg.unapproved.v1']
    },
  })),
  'VALIDATION_FAILED',
  'A canonical work item must reject an operation identity that does not match its approved tool.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-policy-blocked-tool', {
    planningRequestId: 'planning-policy-blocked-tool',
    idempotencyKey: 'publish-policy-blocked-tool',
    mutateBody(body) {
      body.canonicalPlan.workItems[1]!.approvedToolIds = ['mediapipe']
      body.canonicalPlan.workItems[1]!.executionInput.approvedToolOperationIds = [
        'tool.mediapipe.analyze_future_landmark_regions.v1',
      ]
    },
  })),
  'TOOL_NOT_READY',
  'Future, evaluation, planning-only, or license-blocked tools must not enter an approved execution work item.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-tool-free-final-export', {
    planningRequestId: 'planning-tool-free-final-export',
    idempotencyKey: 'publish-tool-free-final-export',
    mutateBody(body) {
      const finalExport = body.canonicalPlan.workItems.find((workItem) =>
        workItem.workItemType === 'render_final_export')
      assert.ok(finalExport)
      finalExport.approvedToolIds = []
      delete finalExport.executionInput.approvedToolOperationIds
    },
  })),
  'TOOL_NOT_READY',
  'Final export must always freeze a callable renderer/media-tool operation; providers never own the final canvas.',
)

const staleAfterPublish = await service.publishCanonicalPlan(createPublishInput(
  project.id,
  'edit-session-preference-changed-after-publish',
  {
    planningRequestId: 'planning-preference-changed-after-publish',
    idempotencyKey: 'publish-preference-changed-after-publish',
  },
))
const staleAfterPublishAuthority = asRecord(staleAfterPublish.authority)
const staleAfterPublishPlan = asRecord(staleAfterPublishAuthority.plan)
const staleAfterPublishEstimate = asRecord(staleAfterPublishAuthority.estimate)
const staleExpectation = requirePlanningInputExpectation('edit-session-preference-changed-after-publish')
await createExactEditPreferenceService(context).updateCurrent({
  workspaceId,
  projectId: project.id,
  editSessionId: 'edit-session-preference-changed-after-publish',
  expectedRevision: staleExpectation.exactEditPreference.recordRevision,
  patch: { moodStyle: 'energetic' },
  idempotencyKey: 'mutate-preference-after-plan-publish',
})
await expectApiError(
  () => service.approveAndFundCanonicalPlan(createApprovalInput(
    staleAfterPublishAuthority,
    staleAfterPublishPlan,
    staleAfterPublishEstimate,
    { idempotencyKey: 'approve-stale-preference-binding' },
  )),
  'IDEMPOTENCY_CONFLICT',
  'Approval must revalidate and reject a planning-input authority changed after publication.',
)

const wrongHashApproval = createApprovalInput(publishedAuthority, publishedPlan, publishedEstimate, {
  expectedPlanHash: 'f'.repeat(64),
  expectedAuthorityRevision: Number(staleAfterPublishAuthority.authorityRevision),
  idempotencyKey: 'approve-wrong-plan-hash',
})
await expectApiError(
  () => service.approveAndFundCanonicalPlan(wrongHashApproval),
  'IDEMPOTENCY_CONFLICT',
  'Approval must bind to the exact server plan hash.',
)

const approvalInput = createApprovalInput(publishedAuthority, publishedPlan, publishedEstimate, {
  expectedAuthorityRevision: Number(staleAfterPublishAuthority.authorityRevision),
})
const [approvedLeft, approvedRight] = await Promise.all([
  service.approveAndFundCanonicalPlan(approvalInput),
  service.approveAndFundCanonicalPlan(approvalInput),
])
assert.deepEqual(approvedLeft.authority, approvedRight.authority, 'Concurrent exact approval replay must return one exact response.')
const approvedAuthority = asRecord(approvedLeft.authority)
const snapshot = asRecord(approvedAuthority.snapshot)
const reservation = asRecord(approvedAuthority.reservation)
const jobs = approvedAuthority.jobs as Record<string, unknown>[]
assert.equal(approvedAuthority.authorityRevision, 3)
assert.equal(reservation.status, 'reserved')
assert.equal(reservation.reservedCredits, 15)
assert.match(String(snapshot.snapshotHash), /^[a-f0-9]{64}$/)
assert.equal(snapshot.schemaVersion, 'private-edit-authority-approved-snapshot-v3')
assert.match(String(snapshot.approvedAssetManifestHash), /^[a-f0-9]{64}$/)
assert.match(String(asRecord(snapshot.approvedAssetManifestRef).sha256), /^[a-f0-9]{64}$/)
assert.match(String(snapshot.approvedSourceAssetManifestHash), /^[a-f0-9]{64}$/)
assert.match(String(asRecord(snapshot.approvedSourceAssetManifestRef).sha256), /^[a-f0-9]{64}$/)
assert.equal('sourcePlan' in snapshot, false, 'Snapshot must remain a compact manifest, not a duplicated multi-megabyte source plan.')
assert.ok(Buffer.byteLength(stableAuthorityStringify(snapshot), 'utf8') < 64 * 1024)
assert.equal(jobs.length, 4)
assert.equal(jobs.filter((job) => job.status === 'ready').length, 1)
assert.equal(jobs.filter((job) => job.status === 'blocked').length, 3)
assert.ok(jobs.every((job) => Array.isArray(job.expectedAssetIds) && job.expectedAssetIds.length === 1))
const loadedExecutionAuthority = await service.loadApprovedExecutionAuthority(String(snapshot.snapshotId), workspaceId)
assert.equal(loadedExecutionAuthority.assetManifest.entries.length, 4)
assert.equal(loadedExecutionAuthority.assetManifest.requiredAssetCount, 4)
assert.equal(loadedExecutionAuthority.assetManifest.manifestHash, snapshot.approvedAssetManifestHash)
assert.equal(loadedExecutionAuthority.sourceAssetManifest.bindings.length, 2)
assert.equal(loadedExecutionAuthority.sourceAssetManifest.requiredBindingCount, 2)
assert.equal(loadedExecutionAuthority.sourceAssetManifest.manifestHash, snapshot.approvedSourceAssetManifestHash)

const executionPackageInput = {
  workspaceId,
  approvedPlanSnapshotId: String(snapshot.snapshotId),
  expectedSnapshotHash: String(snapshot.snapshotHash),
  purpose: 'private_internal_execution_handoff' as const,
  idempotencyKey: 'canonical-execution-package-1',
  requestPath: '/v1/edit-executions/packages',
}
const packageService = createCanonicalEditExecutionPackageService(context)
const [packagedLeft, packagedRight] = await Promise.all([
  packageService.createPackage(executionPackageInput),
  packageService.createPackage(executionPackageInput),
])
assert.deepEqual(packagedLeft.approvedEditExecutionPackage, packagedRight.approvedEditExecutionPackage)
const executionPackage = packagedLeft.approvedEditExecutionPackage
assert.equal(executionPackage.source, 'canonical_edit_authority')
assert.equal(executionPackage.approvedPlanSnapshotId, snapshot.snapshotId)
assert.equal(executionPackage.reservationId, reservation.id)
assert.equal(executionPackage.workerDispatchReady, false)
assert.equal(executionPackage.liveExecutionReady, false)
assert.equal(executionPackage.approvedAssetManifestHash, snapshot.approvedAssetManifestHash)
assert.equal(executionPackage.plannedAssetCount, 4)
assert.equal(executionPackage.requiredPlannedAssetCount, 4)
assert.equal(executionPackage.approvedSourceAssetManifestHash, snapshot.approvedSourceAssetManifestHash)
assert.equal(executionPackage.sourceBindingCount, 2)
assert.equal(executionPackage.requiredSourceBindingCount, 2)
assert.equal(JSON.stringify(executionPackage).includes('bucketName'), false)
assert.equal(JSON.stringify(executionPackage).includes('objectPath'), false)
assert.deepEqual(executionPackage.jobs.map((job) => job.id).sort(), jobs.map((job) => String(job.id)).sort())
assert.deepEqual(executionPackage.approvedToolIds.sort(), ['ffmpeg', 'ffprobe'])
assert.deepEqual(executionPackage.approvedToolOperationIds, [
  'tool.ffmpeg.execute_approved_media_recipe.v1',
  'tool.ffprobe.inspect_approved_media.v1',
])
assert.equal(executionPackage.toolOperationBindingCount, 3)
assert.match(executionPackage.toolOperationBindingsHash, /^[a-f0-9]{64}$/)
assert.match(executionPackage.toolCapabilityManifestHash, /^[a-f0-9]{64}$/)
assert.ok(executionPackage.approvedWorkItems.every((workItem) =>
  workItem.approvedToolOperationIds.length === workItem.approvedToolIds.length &&
  /^[a-f0-9]{64}$/.test(workItem.toolOperationBindingsHash)))
assert.ok(executionPackage.jobs.every((job) => {
  const workItem = executionPackage.approvedWorkItems.find((candidate) => candidate.id === job.approvedWorkItemId)
  return workItem &&
    stableAuthorityStringify(job.approvedToolOperationIds) === stableAuthorityStringify(workItem.approvedToolOperationIds) &&
    job.toolOperationBindingsHash === workItem.toolOperationBindingsHash
}))
assert.equal(packagedLeft.toolCapabilityManifest.schemaVersion, 'canonical-tool-authorization-manifest-v2')
assert.deepEqual(packagedLeft.toolCapabilityManifest.operationIds, executionPackage.approvedToolOperationIds)
assert.equal(packagedLeft.toolCapabilityManifest.operationBindingCount, 3)
assert.equal(
  packagedLeft.toolCapabilityManifest.operationBindingsHash,
  sha256ForSmoke(stableAuthorityStringify(packagedLeft.toolCapabilityManifest.operationBindings)),
)
assert.equal(packagedLeft.toolCapabilityManifest.manifestHash, executionPackage.toolCapabilityManifestHash)
assert.equal(packagedLeft.toolCapabilityManifest.productReadyCount, 0)
assert.equal(packagedLeft.toolCapabilityManifest.productionExecutionAllowed, false)
assert.ok(packagedLeft.toolCapabilityManifest.operationBindings.every((binding) =>
  binding.productReady === false &&
  binding.runtimeEvidenceReady === false &&
  binding.workerDispatchAuthorized === false &&
  binding.policyBlocks.length === 0 &&
  /^[a-f0-9]{64}$/.test(binding.bindingHash)))
assert.equal(packagedLeft.toolCapabilityManifest.workerDispatchAuthorized, false)
assert.equal(packagedLeft.toolCapabilityManifest.runtimeEvidenceReadyCount, 0)
assert.equal(packagedLeft.toolCapabilityManifest.tools.length, 2)

await expectApiError(
  () => packageService.createPackage({
    ...executionPackageInput,
    approvedSnapshot: { callerAuthored: true },
  } as typeof executionPackageInput),
  'VALIDATION_FAILED',
  'Canonical execution package service must reject caller-authored legacy authority fields.',
)

await expectApiError(
  () => service.approveAndFundCanonicalPlan({ ...approvalInput, expectedAuthorityRevision: 3 }),
  'IDEMPOTENCY_CONFLICT',
  'Changed exact replay request must conflict even after approval commits.',
)

const highCostPublished = await service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-insufficient', {
  planningRequestId: 'planning-insufficient',
  idempotencyKey: 'publish-insufficient',
  mutateBody(body) {
    body.canonicalPlan.estimate.lineItems[0]!.estimatedCredits = 10_001
    body.canonicalPlan.estimate.fallbackAllowanceCredits = 0
    body.canonicalPlan.workItems[0]!.maximumCreditBudget = 10_001
    for (const workItem of body.canonicalPlan.workItems.slice(1)) workItem.maximumCreditBudget = 0
  },
}))
const highCostAuthority = asRecord(highCostPublished.authority)
const highCostPlan = asRecord(highCostAuthority.plan)
const highCostEstimate = asRecord(highCostAuthority.estimate)
await expectApiError(
  () => service.approveAndFundCanonicalPlan(createApprovalInput(highCostAuthority, highCostPlan, highCostEstimate, {
    idempotencyKey: 'approve-insufficient',
  })),
  'INSUFFICIENT_CREDITS',
  'Insufficient funding must roll back approval, reservation, snapshot, ledger, and jobs.',
)

clearPrivateEditAuthorityProcessStateForSmoke()
clearLocalProjectMemoryForSmoke()
const readAfterRestart = await createEditPlanningAuthorityService(context).getApprovedSnapshot(String(snapshot.snapshotId), workspaceId)
assert.equal(asRecord(asRecord(readAfterRestart.authority).snapshot).snapshotHash, snapshot.snapshotHash)
const packageReadAfterRestart = await createCanonicalEditExecutionPackageService(context).getPackage(
  executionPackage.packageRecordId,
  workspaceId,
)
assert.equal(packageReadAfterRestart.approvedEditExecutionPackage.packageHash, executionPackage.packageHash)
const packageReplayAfterRestart = await createCanonicalEditExecutionPackageService(context).createPackage(executionPackageInput)
assert.deepEqual(packageReplayAfterRestart.approvedEditExecutionPackage, executionPackage)

const aggregate = await readPrivateEditAuthorityAggregate({ localStorageRoot, ownerUserId: userId, workspaceId })
assert.ok(aggregate)
assert.equal(aggregate.approvals.length, 1)
assert.equal(aggregate.snapshots.length, 1)
assert.equal(aggregate.reservations.length, 1)
assert.equal(aggregate.jobs.length, 4)
assert.equal(aggregate.executionPackages.length, 1)
assert.equal(aggregate.wallet.availableCredits, 9_985)
assert.equal(aggregate.wallet.reservedCredits, 15)
assert.equal(aggregate.wallet.fundedCredits, aggregate.wallet.availableCredits + aggregate.wallet.reservedCredits + aggregate.wallet.spentCredits)
assert.equal(aggregate.ledgerEntries.length, 2)
assert.equal(aggregate.reservationEvents.length, 1)
const insufficientPlan = aggregate.plans.find((plan) => plan.id === highCostPlan.id)
assert.equal(insufficientPlan?.status, 'presented')

const assetManifestRef = asRecord(snapshot.approvedAssetManifestRef)
const assetManifestSha = String(assetManifestRef.sha256)
const assetManifestPath = join(
  localStorageRoot,
  'edit-authority',
  'blobs',
  'sha256',
  assetManifestSha.slice(0, 2),
  `${assetManifestSha}.json`,
)
const originalAssetManifestEnvelope = await readFile(assetManifestPath, 'utf8')
try {
  const tamperedEnvelope = JSON.parse(originalAssetManifestEnvelope) as {
    value: { entries: Array<{ outputKey: string }> }
  }
  tamperedEnvelope.value.entries[0]!.outputKey = 'tampered-output-key'
  await writeFile(assetManifestPath, `${JSON.stringify(tamperedEnvelope)}\n`, 'utf8')
  await expectApiError(
    () => service.loadApprovedExecutionAuthority(String(snapshot.snapshotId), workspaceId),
    'VALIDATION_FAILED',
    'A tampered planned-asset manifest must fail content-addressed authority loading.',
  )
} finally {
  await writeFile(assetManifestPath, originalAssetManifestEnvelope, 'utf8')
}

const sourceManifestRef = asRecord(snapshot.approvedSourceAssetManifestRef)
const sourceManifestSha = String(sourceManifestRef.sha256)
const sourceManifestPath = join(
  localStorageRoot,
  'edit-authority',
  'blobs',
  'sha256',
  sourceManifestSha.slice(0, 2),
  `${sourceManifestSha}.json`,
)
const originalSourceManifestEnvelope = await readFile(sourceManifestPath, 'utf8')
try {
  const tamperedEnvelope = JSON.parse(originalSourceManifestEnvelope) as {
    value: { bindings: Array<{ checksumSha256: string }> }
  }
  tamperedEnvelope.value.bindings[0]!.checksumSha256 = '0'.repeat(64)
  await writeFile(sourceManifestPath, `${JSON.stringify(tamperedEnvelope)}\n`, 'utf8')
  await expectApiError(
    () => service.loadApprovedExecutionAuthority(String(snapshot.snapshotId), workspaceId),
    'VALIDATION_FAILED',
    'A tampered approved source-asset manifest must fail content-addressed authority loading.',
  )
} finally {
  await writeFile(sourceManifestPath, originalSourceManifestEnvelope, 'utf8')
}

await provePreferenceAndBriefCanonicalBinding(context)

const otherUserService = createEditPlanningAuthorityService({
  ...context,
  requestId: 'authority-other-user',
  auth: { userId: 'other-authority-user', accessToken: 'verified-other-authority-token', isMockUser: false },
})
await expectApiError(
  () => otherUserService.getApprovedSnapshot(String(snapshot.snapshotId), workspaceId),
  'APPROVED_SNAPSHOT_REQUIRED',
  'Cross-user snapshot reads must not reveal another authority aggregate.',
)

const productionEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  WORKER_RUNTIME_MODE: 'disabled',
  STORAGE_MODE: 'gcs_disabled',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-placeholder',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: 'internal-placeholder',
})
await expectApiError(
  () => createEditPlanningAuthorityService({
    ...context,
    env: productionEnv,
  }).publishCanonicalPlan(createPublishInput(project.id, 'production-blocked', {
    planningRequestId: 'planning-production-blocked',
    idempotencyKey: 'publish-production-blocked',
  })),
  'TOOL_NOT_READY',
  'Production authority must fail closed until the canonical distributed transaction is proven.',
)

const routeUser = {
  id: userId,
  email: 'authority-smoke@reeditpro.local',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
} as User
const routeServer = createServer(createReeditProApiApp(env, {
  clients: {
    admin,
    public: createPublicAuthClient(new Map([['verified-authority-token', routeUser]])),
  },
}))
await new Promise<void>((resolve) => routeServer.listen(0, '127.0.0.1', resolve))
const routeAddress = routeServer.address() as AddressInfo
const routeBaseUrl = `http://127.0.0.1:${routeAddress.port}`
const routeAuthHeaders = { authorization: 'Bearer verified-authority-token' }
try {
  const routeWorkspaceId = 'workspace-authority-route-smoke'
  const projectResponse = await fetch(`${routeBaseUrl}/v1/projects`, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-authority-project' },
    body: JSON.stringify({ workspaceId: routeWorkspaceId, name: 'Route authority project' }),
  })
  assert.equal(projectResponse.status, 201)
  const projectEnvelope = await projectResponse.json() as { data?: { project?: { id?: string } } }
  const routeProjectId = projectEnvelope.data?.project?.id
  assert.ok(routeProjectId)

  planningInputExpectations.set(
    'route-edit-session',
    await prepareExactPlanningAuthority(context, routeProjectId, 'route-edit-session', routeWorkspaceId),
  )
  sourceMediaFixtures.set(
    routeProjectId,
    await prepareSourceMediaAuthority(context, routeWorkspaceId, routeProjectId, 'route'),
  )
  const routePlanBody = createCanonicalPlanBody(
    'route-planning-request',
    requirePlanningInputExpectation('route-edit-session'),
    requireSourceMediaFixture(routeProjectId),
  )
  routePlanBody.workspaceId = routeWorkspaceId
  const publishResponse = await fetch(
    `${routeBaseUrl}/v1/projects/${routeProjectId}/edit-sessions/route-edit-session/canonical-plans`,
    {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-publish-plan' },
      body: JSON.stringify(routePlanBody),
    },
  )
  assert.equal(publishResponse.status, 201)
  const publishEnvelope = await publishResponse.json() as {
    data?: { authority?: Record<string, unknown> }
  }
  const routePublishedAuthority = asRecord(publishEnvelope.data?.authority)
  const routePlan = asRecord(routePublishedAuthority.plan)
  const routeEstimate = asRecord(routePublishedAuthority.estimate)

  const approveResponse = await fetch(`${routeBaseUrl}/v1/edit-plans/${String(routePlan.id)}/approve`, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-approve-plan' },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      expectedAuthorityRevision: routePublishedAuthority.authorityRevision,
      expectedPlanHash: routePlan.planHash,
      expectedEstimateHash: routeEstimate.estimateHash,
    }),
  })
  assert.equal(approveResponse.status, 201)
  const approveEnvelope = await approveResponse.json() as {
    data?: { authority?: Record<string, unknown> }
  }
  const routeApprovedAuthority = asRecord(approveEnvelope.data?.authority)
  const routeSnapshot = asRecord(routeApprovedAuthority.snapshot)

  const packageResponse = await fetch(`${routeBaseUrl}/v1/edit-executions/packages`, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-canonical-package' },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      approvedPlanSnapshotId: routeSnapshot.snapshotId,
      expectedSnapshotHash: routeSnapshot.snapshotHash,
      purpose: 'private_internal_execution_handoff',
    }),
  })
  assert.equal(packageResponse.status, 201)
  const packageEnvelope = await packageResponse.json() as {
    data?: { approvedEditExecutionPackage?: Record<string, unknown> }
  }
  const routeExecutionPackage = asRecord(packageEnvelope.data?.approvedEditExecutionPackage)
  assert.equal(routeExecutionPackage.source, 'canonical_edit_authority')
  assert.equal(routeExecutionPackage.approvedPlanSnapshotId, routeSnapshot.snapshotId)

  const packageRead = await fetch(
    `${routeBaseUrl}/v1/edit-executions/packages/${String(routeExecutionPackage.packageRecordId)}?workspaceId=${routeWorkspaceId}`,
    { headers: routeAuthHeaders },
  )
  assert.equal(packageRead.status, 200)

  const routeJobs = routeApprovedAuthority.jobs as Record<string, unknown>[]
  const routeRootJob = routeJobs.find((job) => Array.isArray(job.dependencyJobIds) && job.dependencyJobIds.length === 0)
  assert.ok(routeRootJob)
  const readinessResponse = await fetch(
    `${routeBaseUrl}/v1/edit-executions/jobs/${String(routeRootJob.id)}/readiness-inspection`,
    {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        projectId: routeProjectId,
        editSessionId: 'route-edit-session',
        purpose: 'private_internal_dry_run_readiness',
      }),
    },
  )
  assert.equal(readinessResponse.status, 200)
  const readinessEnvelope = await readinessResponse.json() as {
    data?: { executionReadinessEnvelope?: Record<string, unknown> }
  }
  const routeReadiness = asRecord(readinessEnvelope.data?.executionReadinessEnvelope)
  assert.equal(routeReadiness.source, 'immutable_canonical_edit_authority')
  assert.equal(routeReadiness.dispatchAuthorized, false)
  assert.equal(routeReadiness.claimAuthorized, false)
  assert.equal(JSON.stringify(routeReadiness).includes('objectPath'), false)

  const toolEvidenceResponse = await fetch(
    `${routeBaseUrl}/v1/edit-executions/tool-runtime-evidence/inspect`,
    {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ probeMode: 'disabled' }),
    },
  )
  assert.equal(toolEvidenceResponse.status, 200)
  const toolEvidenceEnvelope = await toolEvidenceResponse.json() as {
    data?: {
      toolRuntimeEvidenceAuthority?: Record<string, unknown>
      provenToolIdentitySummary?: Record<string, unknown>
      provenToolIdentityCatalog?: unknown[]
    }
  }
  const routeToolEvidence = asRecord(toolEvidenceEnvelope.data?.toolRuntimeEvidenceAuthority)
  const routeToolCoverage = asRecord(routeToolEvidence.coverage)
  const routeToolSummary = asRecord(routeToolEvidence.summary)
  assert.equal(routeToolCoverage.registryToolIds, 72)
  assert.deepEqual(routeToolSummary.productionReadyTools, [])
  assert.deepEqual(routeToolSummary.authorityExternalBetaReadyTools, [])
  const provenToolIdentitySummary = asRecord(toolEvidenceEnvelope.data?.provenToolIdentitySummary)
  assert.equal(provenToolIdentitySummary.totalRegistryProfiles, 72)
  assert.equal(provenToolIdentitySummary.callableCandidateCount, 61)
  assert.equal(provenToolIdentitySummary.canonicalEndToEndVerifiedCount, 48)
  assert.equal(toolEvidenceEnvelope.data?.provenToolIdentityCatalog?.length, 72)

  const callerAuthoredReadiness = await fetch(
    `${routeBaseUrl}/v1/edit-executions/jobs/${String(routeRootJob.id)}/readiness-inspection`,
    {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        projectId: routeProjectId,
        editSessionId: 'route-edit-session',
        purpose: 'private_internal_dry_run_readiness',
        approvedSnapshot: { callerAuthored: true },
      }),
    },
  )
  assert.equal(callerAuthoredReadiness.status, 400)

  const callerAuthoredPackage = await fetch(`${routeBaseUrl}/v1/edit-executions/packages`, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-caller-authored-package' },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      approvedPlanSnapshotId: routeSnapshot.snapshotId,
      expectedSnapshotHash: routeSnapshot.snapshotHash,
      purpose: 'private_internal_execution_handoff',
      approvedSnapshot: { callerAuthored: true },
      creditReservationId: routeApprovedAuthority.reservation,
      requestedAdapterToolNames: ['ffmpeg'],
      packageReadyToolIds: ['ffmpeg'],
    }),
  })
  assert.equal(callerAuthoredPackage.status, 400)
  const callerAuthoredPackageBody = await callerAuthoredPackage.json() as { error?: { code?: string } }
  assert.equal(callerAuthoredPackageBody.error?.code, 'VALIDATION_FAILED')

  const planRead = await fetch(
    `${routeBaseUrl}/v1/edit-plans/${String(routePlan.id)}/authority?workspaceId=${routeWorkspaceId}`,
    { headers: routeAuthHeaders },
  )
  assert.equal(planRead.status, 200)
  const snapshotRead = await fetch(
    `${routeBaseUrl}/v1/approved-snapshots/${String(routeSnapshot.snapshotId)}/authority?workspaceId=${routeWorkspaceId}`,
    { headers: routeAuthHeaders },
  )
  assert.equal(snapshotRead.status, 200)

  for (const legacyRequest of [
    fetch(`${routeBaseUrl}/v1/edit-plans/${String(routePlan.id)}/approved-snapshots`, { method: 'POST', headers: routeAuthHeaders }),
    fetch(`${routeBaseUrl}/v1/credit-estimates/${String(routeEstimate.id)}/approve`, { method: 'POST', headers: routeAuthHeaders }),
    fetch(`${routeBaseUrl}/v1/credit-estimates/${String(routeEstimate.id)}/reserve`, { method: 'POST', headers: routeAuthHeaders }),
    fetch(`${routeBaseUrl}/v1/jobs`, { method: 'POST', headers: routeAuthHeaders }),
    fetch(`${routeBaseUrl}/v1/job-batches`, { method: 'POST', headers: routeAuthHeaders }),
  ]) {
    const response = await legacyRequest
    assert.equal(response.status, 503)
    const body = await response.json() as { error?: { code?: string } }
    assert.equal(body.error?.code, 'TOOL_NOT_READY')
  }
} finally {
  await new Promise<void>((resolve, reject) => routeServer.close((error) => error ? reject(error) : resolve()))
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'server_sha256_plan_estimate_work_graph_authority',
    'content_addressed_component_blob_manifest',
    'exact_publish_idempotency_replay',
    'changed_publish_idempotency_conflict',
    'server_owned_preference_binding_at_publication',
    'preference_binding_revalidated_at_approval',
    'source_media_authority_bound_and_revalidated',
    'stale_source_media_expectation_rejected',
    'preference_dna_and_edit_brief_frozen_into_plan',
    'edit_brief_post_approval_mutation_blocked',
    'frame_confirmation_gate',
    'work_graph_cycle_gate',
    'production_tool_registry_gate',
    'basic_pro_normal_no_veo_gate',
    'no_default_or_full_file_trim_without_approved_decisions',
    'expected_output_uniqueness_gate',
    'exact_plan_and_estimate_hash_approval',
    'concurrent_approval_reserves_once',
    'wallet_ledger_conservation',
    'compact_snapshot_manifest',
    'content_addressed_approved_asset_manifest',
    'content_addressed_approved_source_asset_manifest',
    'approved_source_asset_manifest_tamper_rejected',
    'planned_asset_manifest_tamper_rejected',
    'job_expected_asset_lineage',
    'approved_work_item_derived_job_graph',
    'canonical_native_execution_package',
    'strict_identity_only_package_contract',
    'server_derived_tool_capability_manifest',
    'canonical_jobs_referenced_without_second_graph',
    'durable_same_host_execution_package_read',
    'durable_same_host_execution_package_idempotent_replay',
    'dependency_roots_only_ready',
    'insufficient_credit_full_rollback',
    'same_host_restart_recovery',
    'cross_user_snapshot_isolation',
    'production_authority_fail_closed',
    'authenticated_canonical_authority_http_routes',
    'authenticated_canonical_execution_readiness_http_route',
    'authenticated_fail_closed_tool_runtime_evidence_http_route',
    'legacy_caller_authority_routes_fail_closed',
    'no_provider_worker_render_or_paid_billing_side_effect',
  ],
}))

type PublishOverrides = {
  planningRequestId?: string
  idempotencyKey?: string
  mutateBody?: (body: PublishCanonicalEditPlanBody) => void
}

function createPublishInput(projectId: string, editSessionId: string, overrides: PublishOverrides = {}) {
  const body = createCanonicalPlanBody(
    overrides.planningRequestId ?? 'planning-authority-1',
    requirePlanningInputExpectation(editSessionId),
    requireSourceMediaFixture(projectId),
  )
  overrides.mutateBody?.(body)
  return {
    ...body,
    projectId,
    editSessionId,
    idempotencyKey: overrides.idempotencyKey ?? 'publish-authority-1',
    requestPath: `/v1/projects/${projectId}/edit-sessions/${editSessionId}/canonical-plans`,
  }
}

function createCanonicalPlanBody(
  planningRequestId: string,
  planningInputAuthority: PlanningInputAuthorityExpectation,
  sourceMediaFixture: SourceMediaFixture,
): PublishCanonicalEditPlanBody {
  return {
    workspaceId,
    planningRequestId,
    planningInputAuthority,
    sourceMediaAuthority: sourceMediaFixture.expectation,
    canonicalPlan: {
      schemaVersion: PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
      components: {
        compiledIntent: { goal: 'Create a professional short product story.' },
        professionalEditingDirective: { pacing: 'clean', mustFollowRules: ['Preserve meaning.'] },
        confirmedSettings: {
          aspectRatio: '9:16',
          outputFrame: { width: 1080, height: 1920, fps: 30 },
          outputFrameConfirmed: true,
          sourceOrderConfirmed: true,
          sourceCleanupConfirmed: true,
          editLevel: 'basic',
          targetPlatform: 'tiktok_reels_shorts',
          preferenceSnapshotId: 'server-default-exact-edit-preferences-v1',
          preferenceRevision: 1,
        },
        sourceSequence: sourceMediaFixture.sourceSequence.map((item) => ({ ...item })),
        sourceCleanupSummary: {
          status: 'confirmed',
          cleanupPreference: 'balanced_cleanup',
          trimValidationStatus: 'passed',
          meaningValidationStatus: 'passed',
          userReviewRequired: false,
        },
        sourceCleanupPlan: {
          status: 'confirmed',
          decisions: [
            {
              decisionId: 'cleanup-decision-source-1',
              sourceSequenceItemId: 'source-1',
              action: 'tighten',
              startFrame: 0,
              endFrameExclusive: 150,
              reason: 'Remove only the approved dead space while preserving the complete first source meaning.',
              confidence: 0.95,
              meaningPreservationStatus: 'passed',
              userReviewStatus: 'not_required',
            },
            {
              decisionId: 'cleanup-decision-source-2',
              sourceSequenceItemId: 'source-2',
              action: 'keep',
              startFrame: 0,
              endFrameExclusive: 150,
              reason: 'Preserve the complete second source because it carries the approved ending context.',
              confidence: 0.98,
              meaningPreservationStatus: 'passed',
              userReviewStatus: 'not_required',
            },
          ],
        },
        masterTimingPlan: { status: 'ready', timingBase: { fps: 30 }, totalFrames: 300 },
        captionVisualCueTimingPlan: { status: 'synced', collisionCount: 0 },
        soundSyncTransitionTimingPlan: { status: 'not_needed', speechPriority: true },
        timingValidationPlan: { overallStatus: 'passed', approvalBlocked: false },
        timingSummary: { validationStatus: 'passed', approvalBlocked: false, fps: 30, totalFrames: 300 },
        segments: [
          { segmentId: 'segment-1', startFrame: 0, endFrameExclusive: 150, operationIds: ['operation-trim-1'] },
          { segmentId: 'segment-2', startFrame: 150, endFrameExclusive: 300, operationIds: ['operation-export-1'] },
        ],
        visualAssetPlan: { assets: [], randomBrollAllowed: false },
        rendererPlan: { renderer: 'remotion', frameOwnedByRenderer: true },
        toolStrategyPlan: { toolIds: ['ffmpeg', 'ffprobe'] },
        qaPlan: { status: 'passed', checks: ['intent', 'timing', 'source_order', 'frame'] },
        qaSummary: { status: 'passed', approvalBlocked: false },
        providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: ['wan'] },
        fallbackPolicy: { unapprovedFallbackAllowed: false },
      },
      estimate: {
        lineItems: [
          { lineKey: 'planning', label: 'Planning', category: 'planning', estimatedCredits: 5, removable: false, metadata: {} },
          { lineKey: 'assembly', label: 'Assembly', category: 'render', estimatedCredits: 7, removable: false, metadata: {} },
        ],
        fallbackAllowanceCredits: 3,
        validForSeconds: 3_600,
      },
      workItems: [
        {
          workItemKey: 'snapshot-validation',
          workItemType: 'validate_approved_snapshot',
          workerClass: 'authority_worker',
          executionInput: { operation: 'validate_snapshot_manifest' },
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
          expectedOutputs: [{
            outputKey: 'snapshot-validation-evidence',
            artifactType: 'authority_validation_evidence',
            assetRole: 'qa',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'application/json',
            segmentIds: [],
            timingIds: [],
            rendererLayerIds: [],
          }],
          dependencyKeys: [],
          approvedToolIds: [],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 1,
          attemptTimeoutSeconds: 60,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 1,
          required: true,
        },
        {
          workItemKey: 'source-trim',
          workItemType: 'prepare_source_trim',
          workerClass: 'cpu_media_worker',
          executionInput: {
            operation: 'approved_trim',
            approvedToolOperationIds: ['tool.ffmpeg.execute_approved_media_recipe.v1'],
            sourceSequenceItemIds: ['source-1', 'source-2'],
          },
          sourceSequenceItemIds: ['source-1', 'source-2'],
          sourceCleanupDecisionIds: ['cleanup-decision-source-1', 'cleanup-decision-source-2'],
          expectedOutputs: [{
            outputKey: 'approved-trimmed-source',
            artifactType: 'trimmed_source_media',
            assetRole: 'processed',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'video/mp4',
            segmentIds: ['segment-1', 'segment-2'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: ['source-video-layer'],
          }],
          dependencyKeys: ['snapshot-validation'],
          approvedToolIds: ['ffmpeg'],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 2,
          attemptTimeoutSeconds: 600,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 3,
          required: true,
        },
        {
          workItemKey: 'final-qa',
          workItemType: 'run_final_qa',
          workerClass: 'qa_worker',
          executionInput: {
            operation: 'final_qa',
            approvedToolOperationIds: ['tool.ffprobe.inspect_approved_media.v1'],
          },
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
          expectedOutputs: [{
            outputKey: 'final-qa-report',
            artifactType: 'final_qa_report',
            assetRole: 'qa',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'application/json',
            segmentIds: [],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: [],
          }],
          dependencyKeys: ['source-trim'],
          approvedToolIds: ['ffprobe'],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 2,
          attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 2,
          required: true,
        },
        {
          workItemKey: 'final-export',
          workItemType: 'render_final_export',
          workerClass: 'render_worker',
          executionInput: {
            operation: 'render_approved_export',
            approvedToolOperationIds: ['tool.ffmpeg.execute_approved_media_recipe.v1'],
          },
          sourceSequenceItemIds: ['source-1', 'source-2'],
          sourceCleanupDecisionIds: ['cleanup-decision-source-1', 'cleanup-decision-source-2'],
          expectedOutputs: [{
            outputKey: 'final-export',
            artifactType: 'final_video_export',
            assetRole: 'final',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'video/mp4',
            segmentIds: ['segment-1', 'segment-2'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: ['source-video-layer'],
          }],
          dependencyKeys: ['final-qa'],
          approvedToolIds: ['ffmpeg'],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 2,
          attemptTimeoutSeconds: 1_800,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 4,
          required: true,
        },
      ],
    },
  }
}

function createApprovalInput(
  authority: Record<string, unknown>,
  plan: Record<string, unknown>,
  estimate: Record<string, unknown>,
  overrides: Partial<{
    expectedPlanHash: string
    expectedEstimateHash: string
    expectedAuthorityRevision: number
    idempotencyKey: string
  }> = {},
) {
  return {
    workspaceId,
    editPlanId: String(plan.id),
    expectedAuthorityRevision: overrides.expectedAuthorityRevision ?? Number(authority.authorityRevision),
    expectedPlanHash: overrides.expectedPlanHash ?? String(plan.planHash),
    expectedEstimateHash: overrides.expectedEstimateHash ?? String(estimate.estimateHash),
    idempotencyKey: overrides.idempotencyKey ?? 'approve-authority-1',
    requestPath: `/v1/edit-plans/${String(plan.id)}/approve`,
  }
}

async function expectApiError(
  action: () => Promise<unknown>,
  expectedCode: ApiError['code'],
  message: string,
): Promise<void> {
  let caught: unknown
  try {
    await action()
  } catch (error) {
    caught = error
  }
  assert.ok(caught instanceof ApiError && caught.code === expectedCode, `${message} Received: ${String(caught)}`)
}

function asRecord(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function requirePlanningInputExpectation(editSessionId: string): PlanningInputAuthorityExpectation {
  const expectation = planningInputExpectations.get(editSessionId)
  assert.ok(expectation, `Planning-input authority was not prepared for ${editSessionId}.`)
  return structuredClone(expectation)
}

type SourceMediaFixture = {
  expectation: SourceMediaAuthorityExpectation
  sourceSequence: PublishCanonicalEditPlanBody['canonicalPlan']['components']['sourceSequence']
}

function requireSourceMediaFixture(projectId: string): SourceMediaFixture {
  const fixture = sourceMediaFixtures.get(projectId)
  assert.ok(fixture, `Source-media authority was not prepared for project ${projectId}.`)
  return structuredClone(fixture)
}

async function prepareSourceMediaAuthority(
  serviceContext: ServiceContext,
  targetWorkspaceId: string,
  projectId: string,
  suffix: string,
): Promise<SourceMediaFixture> {
  const uploadService = createUploadService(serviceContext)
  const finalized = []
  for (const [index, bytes] of [
    Buffer.from(`reeditpro-source-one-${suffix}`),
    Buffer.from(`reeditpro-source-two-${suffix}`),
  ].entries()) {
    const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
    const created = await uploadService.createUploadIntent({
      workspaceId: targetWorkspaceId,
      projectId,
      uploadPurpose: 'source_media',
      originalFileName: `source-${index + 1}-${suffix}.mp4`,
      mimeType: 'video/mp4',
      expectedSizeBytes: bytes.byteLength,
      checksumSha256,
    })
    await uploadService.uploadLocalObject(
      created.uploadIntent.id,
      targetWorkspaceId,
      bytes,
      'video/mp4',
      bytes.byteLength,
    )
    const result = await uploadService.finalizeUploadIntent({
      workspaceId: targetWorkspaceId,
      uploadIntentId: created.uploadIntent.id,
    })
    finalized.push({ result, checksumSha256 })
  }
  const sourceSequence = finalized.map(({ result, checksumSha256 }, index) => ({
    sourceSequenceItemId: `source-${index + 1}`,
    mediaAssetId: result.mediaAsset.id,
    uploadedOrder: index + 1,
    checksumSha256,
    required: true,
  }))
  const candidate = (await createSourceMediaAuthorityService(serviceContext).buildManifestCandidate({
    workspaceId: targetWorkspaceId,
    projectId,
    uploadPurpose: 'source_media',
    orderedItems: sourceSequence,
  })).sourceBindingManifestCandidate
  return {
    expectation: {
      authorityRevision: candidate.authorityRevision,
      authorityChecksumSha256: candidate.authorityChecksumSha256,
      sourceSequenceHash: candidate.sourceSequenceHash,
      candidateHash: candidate.candidateHash,
    },
    sourceSequence,
  }
}

async function prepareExactPlanningAuthority(
  serviceContext: ServiceContext,
  projectId: string,
  editSessionId: string,
  targetWorkspaceId = workspaceId,
): Promise<PlanningInputAuthorityExpectation> {
  const exactService = createExactEditPreferenceService(serviceContext)
  const initialized = await exactService.initialize({
    workspaceId: targetWorkspaceId,
    projectId,
    editSessionId,
    idempotencyKey: `initialize-exact:${editSessionId}`,
  })
  const updated = await exactService.updateCurrent({
    workspaceId: targetWorkspaceId,
    projectId,
    editSessionId,
    expectedRevision: initialized.preferenceRecord.recordRevision,
    patch: {
      editLevel: 'basic',
      targetPlatform: 'tiktok_reels_shorts',
    },
    idempotencyKey: `update-exact:${editSessionId}`,
  })
  const evidence = await exactService.recordPlanningEvidence({
    workspaceId: targetWorkspaceId,
    projectId,
    editSessionId,
    expectedRevision: updated.preferenceRecord.recordRevision,
    sourcePreparation: {
      status: 'ready',
      evidenceHash: sha256ForSmoke(`source-preparation:${targetWorkspaceId}:${projectId}:${editSessionId}`),
    },
    frameConfirmation: {
      status: 'confirmed',
      aspectRatio: '9:16',
      confirmationId: `frame-confirmation-${editSessionId}`,
    },
    idempotencyKey: `planning-evidence:${editSessionId}`,
  })
  return {
    exactEditPreference: {
      recordRevision: evidence.preferenceRecord.recordRevision,
      preferenceRevision: evidence.preferenceRecord.preferenceRevision,
      preferenceFingerprintSha256: exactEditPreferenceFingerprint(evidence.preferenceRecord.values),
    },
    preferenceApplication: { status: 'not_selected', applicationVersion: 0 },
    editBrief: { status: 'not_used' },
  }
}

function sha256ForSmoke(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

async function provePreferenceAndBriefCanonicalBinding(serviceContext: ServiceContext): Promise<void> {
  const integrationWorkspaceId = 'workspace-planning-binding-integration'
  const integrationEditSessionId = 'edit-session-planning-binding-integration'
  const integrationProject = (await createProjectService(serviceContext).createProject({
    workspaceId: integrationWorkspaceId,
    name: 'Preference and Edit Brief canonical binding integration',
  })).project
  const expectation = await prepareExactPlanningAuthority(
    serviceContext,
    integrationProject.id,
    integrationEditSessionId,
    integrationWorkspaceId,
  )
  const sourceMediaFixture = await prepareSourceMediaAuthority(
    serviceContext,
    integrationWorkspaceId,
    integrationProject.id,
    'preference-brief-binding',
  )

  const preferenceService = createPreferenceIntelligenceService(serviceContext)
  const preference = (await preferenceService.createPreference({
    workspaceId: integrationWorkspaceId,
    name: 'Canonical Clean Story Preference',
    description: 'Structured Preference DNA used to prove canonical publication and approval binding.',
    idempotencyKey: 'binding-create-preference',
  })).preference
  const study = (await preferenceService.startStudy({
    workspaceId: integrationWorkspaceId,
    preferenceId: preference.id,
    title: 'Canonical binding preference study',
    idempotencyKey: 'binding-start-study',
  })).study.session
  const evidenceResult = await preferenceService.addEvidence({
    workspaceId: integrationWorkspaceId,
    studySessionId: String(study.id),
    expectedSessionRevision: Number(study.revision),
    evidenceType: 'manual_description',
    label: 'Explicit canonical editing preference',
    manualDescription: 'Use restrained motion, speech-first pacing, and source-adapted graphics.',
    metadata: { sourceKind: 'manual' },
    observations: [
      {
        category: 'pacing',
        instruction: 'Use clean speech-first pacing with restrained motion.',
        reason: 'The user explicitly selected this transferable editing behavior.',
        confidence: 0.96,
        transferability: 'transferable',
        conditions: ['Preserve source meaning and the confirmed output frame.'],
        exceptions: [],
        prohibitedCopy: false,
      },
      {
        category: 'do_not_copy',
        instruction: 'Do not copy exact reference shots, words, creator identity, logos, or music.',
        reason: 'Reference content is not transferable.',
        confidence: 1,
        transferability: 'non_transferable',
        conditions: [],
        exceptions: [],
        prohibitedCopy: true,
      },
    ],
    idempotencyKey: 'binding-add-evidence',
  })
  const built = await preferenceService.buildDna({
    workspaceId: integrationWorkspaceId,
    studySessionId: String(study.id),
    expectedSessionRevision: Number(evidenceResult.study.session.revision),
    idempotencyKey: 'binding-build-dna',
  })
  await preferenceService.runDnaQa({
    workspaceId: integrationWorkspaceId,
    preferenceId: preference.id,
    dnaVersionId: built.dna.id,
    expectedPreferenceRevision: 2,
    idempotencyKey: 'binding-run-dna-qa',
  })
  const approvedDna = await preferenceService.approveDna({
    workspaceId: integrationWorkspaceId,
    preferenceId: preference.id,
    dnaVersionId: built.dna.id,
    expectedPreferenceRevision: 3,
    expectedDnaVersion: built.dna.version,
    idempotencyKey: 'binding-approve-dna',
  })
  const applied = await preferenceService.applyPreference({
    workspaceId: integrationWorkspaceId,
    projectId: integrationProject.id,
    editSessionId: integrationEditSessionId,
    preferenceId: preference.id,
    expectedApplicationVersion: 0,
    source: 'selector',
    idempotencyKey: 'binding-apply-preference',
  })
  expectation.preferenceApplication = {
    status: 'applied',
    applicationId: applied.application.id,
    applicationVersion: applied.application.applicationVersion,
    preferenceId: preference.id,
    dnaVersionId: approvedDna.dna.id,
    dnaVersion: approvedDna.dna.version,
    applicationHash: preferenceIntelligenceHash(applied.application),
  }

  const briefService = createEditBriefAuthorityService(serviceContext)
  const brief = await briefService.createBrief({
    workspaceId: integrationWorkspaceId,
    projectId: integrationProject.id,
    editSessionId: integrationEditSessionId,
    expectedRevision: 0,
    idempotencyKey: 'binding-create-brief',
    brief: {
      goal: 'Create a clean product story while preserving source meaning.',
      audience: 'Prospective product users',
      deliverable: 'Professional short-form vertical edit',
      mustIncludeNotes: ['Keep the proof moment and final CTA.'],
      avoidNotes: ['Avoid exact reference copying.'],
      status: 'ready',
    },
  })
  const exportSettings = await briefService.setExportSettings({
    workspaceId: integrationWorkspaceId,
    projectId: integrationProject.id,
    editSessionId: integrationEditSessionId,
    expectedRevision: brief.aggregateRevision,
    idempotencyKey: 'binding-confirm-export-frame',
    settings: {
      platformTarget: 'tiktok_reels_shorts',
      aspectRatio: '9:16',
      resolution: '1080x1920',
      frameRate: 30,
      confirmationStatus: 'confirmed',
      confirmationId: 'binding-frame-confirmation',
    },
  })
  const marker = await briefService.createMarker({
    workspaceId: integrationWorkspaceId,
    projectId: integrationProject.id,
    editSessionId: integrationEditSessionId,
    expectedRevision: exportSettings.aggregateRevision,
    idempotencyKey: 'binding-create-marker',
    marker: {
      markerType: 'keep',
      timeKind: 'range',
      startSeconds: 2,
      endSeconds: 4,
      priority: 'must_follow',
      title: 'Preserve proof moment',
      note: 'Keep this full proof statement and its qualifying context.',
    },
  })
  const markerIntent = await briefService.setMarkerIntent({
    workspaceId: integrationWorkspaceId,
    projectId: integrationProject.id,
    editSessionId: integrationEditSessionId,
    expectedRevision: marker.aggregateRevision,
    idempotencyKey: 'binding-set-marker-intent',
    markerId: marker.marker.id,
    intent: {
      action: 'preserve_source_range',
      instruction: 'Preserve this proof statement and qualifying context without changing meaning.',
      requiredPrivateAssetIds: [],
      confidence: 1,
      status: 'confirmed',
      plannerHints: ['Speech clarity and proof context outrank retention trimming.'],
      doNotCopy: ['Do not substitute unrelated proof footage.'],
      runtimeState: 'metadata_only',
    },
  })
  const confirmedMarker = await briefService.confirmMarker({
    workspaceId: integrationWorkspaceId,
    projectId: integrationProject.id,
    editSessionId: integrationEditSessionId,
    expectedRevision: markerIntent.aggregateRevision,
    idempotencyKey: 'binding-confirm-marker',
    markerId: marker.marker.id,
  })
  const markerContext = await briefService.buildMarkerContext({
    workspaceId: integrationWorkspaceId,
    projectId: integrationProject.id,
    editSessionId: integrationEditSessionId,
    expectedRevision: confirmedMarker.aggregateRevision,
    idempotencyKey: 'binding-build-marker-context',
    markerId: marker.marker.id,
    nearbyWindowSeconds: 30,
    sourceContext: {
      sourceAssetIds: sourceMediaFixture.sourceSequence.map((item) => item.mediaAssetId),
      sourceDurationSeconds: 10,
      sourceSequenceSummary: 'Two finalized source clips in user-confirmed upload order.',
      transcriptWindowSummary: 'The proof statement and its qualifying context are preserved together.',
      visualWindowSummary: 'The source speaker remains visible during the proof statement.',
      audioWindowSummary: 'Speech clarity remains the priority in this marker window.',
      runtimeState: 'metadata_only',
    },
  })
  const qa = await briefService.runQa({
    workspaceId: integrationWorkspaceId,
    projectId: integrationProject.id,
    editSessionId: integrationEditSessionId,
    expectedRevision: markerContext.aggregateRevision,
    idempotencyKey: 'binding-run-brief-qa',
  })
  assert.equal(qa.qaReport.status, 'passed')
  const hints = await briefService.createPlanHints({
    workspaceId: integrationWorkspaceId,
    projectId: integrationProject.id,
    editSessionId: integrationEditSessionId,
    expectedRevision: qa.aggregateRevision,
    idempotencyKey: 'binding-create-plan-hints',
    latestExplicitUserInstruction: 'Keep the proof moment and use the selected Preference DNA.',
    approvedProjectOverrides: [],
  })
  assert.equal(hints.planHints.readiness, 'ready_for_planning')
  const briefAggregate = await readPrivateEditBriefAuthorityAggregate({
    localStorageRoot: serviceContext.env.localStorageRoot,
    ownerUserId: userId,
    workspaceId: integrationWorkspaceId,
    projectId: integrationProject.id,
    editSessionId: integrationEditSessionId,
  })
  assert.ok(briefAggregate)
  const briefBinding = buildEditBriefAuthorityPublicationBinding(briefAggregate)
  expectation.editBrief = {
    status: 'bound',
    aggregateRevision: briefBinding.aggregateRevision,
    deterministicHash: briefBinding.deterministicHash,
  }

  const body = createCanonicalPlanBody('planning-preference-brief-binding', expectation, sourceMediaFixture)
  body.workspaceId = integrationWorkspaceId
  const canonicalService = createEditPlanningAuthorityService(serviceContext)
  const published = await canonicalService.publishCanonicalPlan({
    ...body,
    projectId: integrationProject.id,
    editSessionId: integrationEditSessionId,
    idempotencyKey: 'publish-preference-brief-binding',
  })
  const publishedAuthority = asRecord(published.authority)
  const publishedPlan = asRecord(publishedAuthority.plan)
  const publishedEstimate = asRecord(publishedAuthority.estimate)
  assert.ok(asRecord(publishedPlan.componentRefs).planningInputAuthority)
  const approved = await canonicalService.approveAndFundCanonicalPlan({
    workspaceId: integrationWorkspaceId,
    editPlanId: String(publishedPlan.id),
    expectedAuthorityRevision: Number(publishedAuthority.authorityRevision),
    expectedPlanHash: String(publishedPlan.planHash),
    expectedEstimateHash: String(publishedEstimate.estimateHash),
    idempotencyKey: 'approve-preference-brief-binding',
  })
  const approvedSnapshot = asRecord(asRecord(approved.authority).snapshot)
  const loaded = await canonicalService.loadApprovedExecutionAuthority(
    String(approvedSnapshot.snapshotId),
    integrationWorkspaceId,
  )
  assert.equal(loaded.planningInputAuthority.preferenceApplication.status, 'applied')
  assert.equal(loaded.planningInputAuthority.editBrief.status, 'bound')
  if (loaded.planningInputAuthority.editBrief.status === 'bound') {
    assert.equal(loaded.planningInputAuthority.editBrief.publicationBinding.confirmedMarkerCount, 1)
    assert.equal(loaded.planningInputAuthority.editBrief.confirmedMarkerHints.length, 1)
  }
  assert.deepEqual(loaded.planningInputAuthority.instructionPriority, [
    'safety_legal_and_do_not_copy',
    'latest_explicit_user_instruction',
    'confirmed_edit_brief_marker',
    'approved_project_override',
    'selected_preference_dna',
    'general_defaults',
    'deterministic_fallback',
  ])
  await expectApiError(
    () => briefService.updateBrief({
      workspaceId: integrationWorkspaceId,
      projectId: integrationProject.id,
      editSessionId: integrationEditSessionId,
      expectedRevision: briefBinding.aggregateRevision,
      idempotencyKey: 'mutate-brief-after-canonical-approval',
      patch: { goal: 'This post-approval mutation must be rejected.' },
    }),
    'PLAN_NOT_APPROVED',
    'Canonical approval must freeze Edit Brief authority until a new revision flow exists.',
  )
}

function createMembershipAdminClient(
  workspaceMemberships: Array<{ workspaceId: string; userId: string; role: string }>,
): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') throw new Error(`Unexpected authority smoke table: ${tableName}`)
      let selectedWorkspaceId = ''
      let selectedUserId = ''
      const query = {
        select() { return query },
        eq(column: string, value: string) {
          if (column === 'workspace_id') selectedWorkspaceId = value
          if (column === 'user_id') selectedUserId = value
          return query
        },
        async maybeSingle() {
          const membership = workspaceMemberships.find((candidate) =>
            candidate.workspaceId === selectedWorkspaceId && candidate.userId === selectedUserId
          )
          return {
            data: membership ? {
              workspace_id: membership.workspaceId,
              user_id: membership.userId,
              role: membership.role,
            } : null,
            error: null,
          }
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}

function createPublicAuthClient(usersByToken: Map<string, User>): SupabaseClient {
  return {
    auth: {
      async getUser(token: string) {
        const user = usersByToken.get(token)
        return {
          data: { user: user ?? null },
          error: user ? null : { message: 'invalid test token' },
        }
      },
    },
  } as unknown as SupabaseClient
}
