import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createReeditProApiApp } from '../app'
import {
  CANONICAL_ATOMIC_EXECUTION_DESCRIPTOR_VERSION,
  compileCanonicalWorkItems,
} from '../edit-architecture/canonical-work-item-compiler'
import { ApiError } from '../errors/api-error'
import { loadRuntimeEnv } from '../config/env'
import { createEditPlanningAuthorityService } from '../services/edit-planning-authority-service'
import { createCanonicalPlanPublicationRequestService } from '../services/canonical-plan-publication-request-service'
import { createCanonicalPlanningHandoffService } from '../services/canonical-planning-handoff-service'
import { createExactEditPreferenceService } from '../services/exact-edit-preference-service'
import {
  buildEditBriefAuthorityPublicationBinding,
  createEditBriefAuthorityService,
} from '../services/edit-brief-authority-service'
import { createPreferenceIntelligenceService } from '../services/preference-intelligence-service'
import { createSourceMediaAuthorityService } from '../services/source-media-authority-service'
import { createUploadService } from '../services/upload-service'
import { createCanonicalEditExecutionPackageService } from '../services/canonical-edit-execution-package-service'
import { withCanonicalExecutionDomainLock } from '../services/canonical-execution-domain-lock'
import { createCanonicalWorkerLeaseAuthorityService } from '../services/canonical-worker-lease-authority-service'
import { readPrivateCanonicalWorkerLeaseAggregate } from '../services/private-canonical-worker-lease-store'
import { createCanonicalPrivateToolDispatchAuthorityService } from '../services/canonical-private-tool-dispatch-authority-service'
import {
  canonicalPrivateToolDispatchImmutableHash,
  mutatePrivateCanonicalToolDispatchAggregate,
  readPrivateCanonicalToolDispatchAggregate,
} from '../services/private-canonical-tool-dispatch-store'
import {
  clearPrivateEditAuthorityProcessStateForSmoke,
  readPrivateAuthorityJsonBlob,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
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
import {
  CANONICAL_PRIVATE_TOOL_DISPATCH_RECORD_VERSION,
  type CanonicalPrivateToolDispatchRecord,
} from '../validation/canonical-private-tool-dispatch-schemas'
import { canonicalEditJourneyResponseSchema } from '../validation/canonical-edit-journey-schemas'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'

const localStorageRoot = canonicalAuthoritySmokeRoot
const workspaceId = 'workspace-authority-smoke'
const cancellationWorkspaceId = 'workspace-authority-cancellation-smoke'
const userId = 'user-authority-smoke'
await rm(localStorageRoot, { force: true, recursive: true })
clearLocalProjectMemoryForSmoke()
clearPrivateEditAuthorityProcessStateForSmoke()
clearPrivateExactEditPreferenceProcessStateForSmoke()

const memberships = [
  { workspaceId, userId, role: 'owner' },
  { workspaceId, userId: 'other-authority-user', role: 'editor' },
  { workspaceId: 'workspace-authority-route-smoke', userId, role: 'owner' },
  { workspaceId: 'workspace-authority-route-smoke', userId: 'other-authority-user', role: 'editor' },
  { workspaceId: cancellationWorkspaceId, userId, role: 'owner' },
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
  REEDITPRO_INTERNAL_SERVICE_TOKEN: 'rp-authority-smoke-secret-7Gk2Wm9Qx4Nb8Lv5',
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
  'edit-session-undeclared-tool-authority',
  'edit-session-missing-exact-operation-authority',
  'edit-session-unproven-required-tool',
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

const primaryPublishInput = createPublishInput(project.id, 'edit-session-authority-1')
const primaryPublishInputHash = sha256AuthorityValue(primaryPublishInput)
const published = await service.publishCanonicalPlan(primaryPublishInput)
assert.equal(
  sha256AuthorityValue(primaryPublishInput),
  primaryPublishInputHash,
  'Server reconciliation must never mutate the hash-bound publication request.',
)
const publishedAuthority = asRecord(published.authority)
const publishedPlan = asRecord(publishedAuthority.plan)
const publishedEstimate = asRecord(publishedAuthority.estimate)
assert.equal(publishedAuthority.authorityRevision, 1)
assert.equal(publishedPlan.status, 'presented')
assert.match(String(publishedPlan.planHash), /^[a-f0-9]{64}$/)
assert.match(String(publishedEstimate.estimateHash), /^[a-f0-9]{64}$/)
assert.equal('compiledIntent' in publishedPlan, false, 'Plan response should expose content references, not duplicate raw plan payloads.')
const publishedComponentRefs = asRecord(publishedPlan.componentRefs)
const toolExecutionAuthorityRef = asRecord(
  publishedComponentRefs.canonicalToolExecutionAuthority,
)
const persistedToolExecutionAuthority = asRecord(await readPrivateAuthorityJsonBlob({
  localStorageRoot,
  ref: {
    sha256: String(toolExecutionAuthorityRef.sha256),
    byteLength: Number(toolExecutionAuthorityRef.byteLength),
  },
}))
assert.equal(
  persistedToolExecutionAuthority.source,
  'server_proven_tool_identity_catalog_reconciliation',
)
assert.match(String(persistedToolExecutionAuthority.authorityHash), /^[a-f0-9]{64}$/)
assert.equal(asRecord(persistedToolExecutionAuthority.summary).workGraphToolCount, 2)
assert.equal(
  asRecord(persistedToolExecutionAuthority.summary).allRequiredToolsPrivateEndToEndReady,
  true,
)
assert.equal(
  asRecord(persistedToolExecutionAuthority.summary).allRequiredToolsPrivateJobAdapterReady,
  true,
)
const persistedToolEntries = persistedToolExecutionAuthority.tools as Record<string, unknown>[]
assert.deepEqual(
  persistedToolEntries.map((entry) => entry.canonicalToolId),
  ['ffmpeg', 'ffprobe'],
)
assert.ok(persistedToolEntries.every((entry) =>
  String(entry.stableToolIdentity).startsWith('reeditpro.tool.') &&
  /^[a-f0-9]{64}$/.test(String(entry.identityHash)) &&
  /^[a-f0-9]{64}$/.test(String(entry.proofHash)) &&
  asRecord(entry.readiness).privateInternalEndToEndReady === true &&
  asRecord(entry.readiness).privateInternalJobAdapterReady === true))

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
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-undeclared-tool-authority', {
    planningRequestId: 'planning-undeclared-tool-authority',
    idempotencyKey: 'publish-undeclared-tool-authority',
    mutateBody(body) {
      body.canonicalPlan.components.toolStrategyPlan = {
        toolIds: ['ffprobe'],
        exactOperationIds: ['tool.ffprobe.inspect_approved_media.v1'],
      }
    },
  })),
  'VALIDATION_FAILED',
  'A work-item tool absent from the approved tool strategy must fail before plan persistence.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-missing-exact-operation-authority', {
    planningRequestId: 'planning-missing-exact-operation-authority',
    idempotencyKey: 'publish-missing-exact-operation-authority',
    mutateBody(body) {
      body.canonicalPlan.components.toolStrategyPlan = {
        toolIds: ['ffmpeg', 'ffprobe'],
        exactOperationIds: ['tool.ffprobe.inspect_approved_media.v1'],
      }
    },
  })),
  'VALIDATION_FAILED',
  'Exact tool strategy authority must include every work-graph operation identity.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-unproven-required-tool', {
    planningRequestId: 'planning-unproven-required-tool',
    idempotencyKey: 'publish-unproven-required-tool',
    mutateBody(body) {
      const sourceTrim = body.canonicalPlan.workItems.find((workItem) =>
        workItem.workItemKey === 'source-trim')
      assert.ok(sourceTrim)
      sourceTrim.approvedToolIds = ['sam2']
      sourceTrim.executionInput.approvedToolOperationIds = [
        'tool.sam2.segment_and_track_subject.v1',
      ]
      body.canonicalPlan.components.toolStrategyPlan = {
        toolIds: ['sam2', 'ffmpeg', 'ffprobe'],
        exactOperationIds: [
          'tool.sam2.segment_and_track_subject.v1',
          'tool.ffmpeg.execute_approved_media_recipe.v1',
          'tool.ffprobe.inspect_approved_media.v1',
        ],
      }
    },
  })),
  'TOOL_NOT_READY',
  'A required tool without canonical lifecycle and job-adapter evidence must not enter an approvable plan.',
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
assert.equal(loadedExecutionAuthority.toolExecutionAuthority.authorityHash, persistedToolExecutionAuthority.authorityHash)
assert.deepEqual(
  loadedExecutionAuthority.toolExecutionAuthority.tools.map((tool) => tool.canonicalToolId),
  ['ffmpeg', 'ffprobe'],
)

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

const toolAuthoritySha = String(toolExecutionAuthorityRef.sha256)
const toolAuthorityPath = join(
  localStorageRoot,
  'edit-authority',
  'blobs',
  'sha256',
  toolAuthoritySha.slice(0, 2),
  `${toolAuthoritySha}.json`,
)
const originalToolAuthorityEnvelope = await readFile(toolAuthorityPath, 'utf8')
try {
  const tamperedEnvelope = JSON.parse(originalToolAuthorityEnvelope) as {
    value: { tools: Array<{ identityHash: string }> }
  }
  tamperedEnvelope.value.tools[0]!.identityHash = '0'.repeat(64)
  await writeFile(toolAuthorityPath, `${JSON.stringify(tamperedEnvelope)}\n`, 'utf8')
  await expectApiError(
    () => service.loadApprovedExecutionAuthority(String(snapshot.snapshotId), workspaceId),
    'VALIDATION_FAILED',
    'Tampered frozen tool identity authority must fail before execution packaging.',
  )
} finally {
  await writeFile(toolAuthorityPath, originalToolAuthorityEnvelope, 'utf8')
}

await provePreferenceAndBriefCanonicalBinding(context)
await proveAtomicWorkItemCompilation(context)

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
const routeOtherUser = {
  ...routeUser,
  id: 'other-authority-user',
  email: 'authority-other-user-smoke@reeditpro.local',
} as User
const routeServer = createServer(createReeditProApiApp(env, {
  clients: {
    admin,
    public: createPublicAuthClient(new Map([
      ['verified-authority-token', routeUser],
      ['verified-other-authority-token', routeOtherUser],
    ])),
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
  const canonicalJourneyUrl =
    `${routeBaseUrl}/v1/projects/${routeProjectId}/edit-sessions/route-edit-session/` +
    `canonical-journey?workspaceId=${routeWorkspaceId}`
  const readCanonicalJourney = async (
    headers: Record<string, string> = routeAuthHeaders,
  ): Promise<{ response: Response; journey: Record<string, unknown> }> => {
    const response = await fetch(canonicalJourneyUrl, { headers })
    const envelope = await response.clone().json().catch(() => ({})) as {
      data?: { canonicalEditJourney?: Record<string, unknown> }
    }
    return {
      response,
      journey: envelope.data?.canonicalEditJourney
        ? asRecord(envelope.data.canonicalEditJourney)
        : {},
    }
  }
  const initialJourney = await readCanonicalJourney()
  assert.equal(initialJourney.response.status, 200)
  assert.equal(initialJourney.journey.stage, 'planning_handoff_required')
  assert.equal(
    asRecord(initialJourney.journey.nextAction).code,
    'prepare_planning_handoff',
  )
  assert.equal(asRecord(initialJourney.journey.permissions).inspectionOnly, true)
  assert.equal(asRecord(initialJourney.journey.permissions).rawPlanInputsReturned, false)
  assert.equal(asRecord(initialJourney.journey.permissions).toolExecution, false)
  assert.equal(asRecord(initialJourney.journey.permissions).providerCall, false)
  assert.equal(asRecord(initialJourney.journey.permissions).render, false)
  const crossUserJourney = await readCanonicalJourney({
    authorization: 'Bearer verified-other-authority-token',
  })
  assert.equal(crossUserJourney.response.status, 404)

  planningInputExpectations.set(
    'route-edit-session',
    await prepareExactPlanningAuthority(context, routeProjectId, 'route-edit-session', routeWorkspaceId),
  )
  const routeSourceFixture = await prepareSourceMediaAuthority(
    context,
    routeWorkspaceId,
    routeProjectId,
    'route',
  )
  sourceMediaFixtures.set(routeProjectId, routeSourceFixture)
  const routePlanBody = createCanonicalPlanBody(
    'route-planning-request',
    requirePlanningInputExpectation('route-edit-session'),
    requireSourceMediaFixture(routeProjectId),
  )
  routePlanBody.workspaceId = routeWorkspaceId
  const planningHandoffUrl =
    `${routeBaseUrl}/v1/projects/${routeProjectId}/edit-sessions/route-edit-session/canonical-planning-handoff`
  const latestPlanningHandoffInspectionUrl =
    `${routeBaseUrl}/v1/projects/${routeProjectId}/edit-sessions/route-edit-session/` +
    `canonical-planning-handoffs/latest?workspaceId=${routeWorkspaceId}`
  const missingLatestPlanningHandoff = await fetch(latestPlanningHandoffInspectionUrl, {
    headers: routeAuthHeaders,
  })
  assert.equal(missingLatestPlanningHandoff.status, 404)
  const planningHandoffBody = {
    workspaceId: routeWorkspaceId,
    purpose: 'prepare_canonical_planning_handoff',
    orderedSourceItems: routeSourceFixture.sourceSequence,
    canonicalPlanComponents: routePlanBody.canonicalPlan.components,
  }
  const unauthenticatedPlanningHandoff = await fetch(planningHandoffUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(planningHandoffBody),
  })
  assert.equal(unauthenticatedPlanningHandoff.status, 401)
  const planningHandoffResponse = await fetch(planningHandoffUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json' },
    body: JSON.stringify(planningHandoffBody),
  })
  assert.equal(planningHandoffResponse.status, 200)
  const planningHandoffEnvelope = await planningHandoffResponse.json() as {
    data?: { canonicalPlanningHandoff?: Record<string, unknown> }
  }
  const routePlanningHandoff = asRecord(
    planningHandoffEnvelope.data?.canonicalPlanningHandoff,
  )
  assert.deepEqual(routePlanningHandoff.sourceMediaAuthority, routeSourceFixture.expectation)
  assert.deepEqual(
    routePlanningHandoff.planningInputAuthority,
    requirePlanningInputExpectation('route-edit-session'),
  )
  assert.equal(asRecord(routePlanningHandoff.readiness).readyForCanonicalPlanPublication, true)
  assert.equal(routePlanningHandoff.noPlanPublished, true)
  assert.equal(routePlanningHandoff.noSnapshotCreated, true)
  assert.equal(routePlanningHandoff.noCreditReservation, true)
  assert.equal(routePlanningHandoff.noToolExecution, true)
  assert.equal(routePlanningHandoff.noProviderCall, true)
  assert.equal(routePlanningHandoff.noRender, true)
  assert.match(String(routePlanningHandoff.handoffId), /^planning_handoff_[a-f0-9]{64}$/)
  assert.match(String(routePlanningHandoff.handoffHash), /^[a-f0-9]{64}$/)
  assert.match(String(routePlanningHandoff.canonicalPlanComponentsHash), /^[a-f0-9]{64}$/)
  assert.deepEqual(asRecord(routePlanningHandoff.persistence), {
    privateLocal: true,
    tenantScoped: true,
    createOnly: true,
    checksumProtected: true,
    contentAddressed: true,
    distributed: false,
    productionAuthority: false,
  })
  const planningHandoffReplayResponse = await fetch(planningHandoffUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json' },
    body: JSON.stringify(planningHandoffBody),
  })
  assert.equal(planningHandoffReplayResponse.status, 200)
  const planningHandoffReplayEnvelope = await planningHandoffReplayResponse.json() as {
    data?: { canonicalPlanningHandoff?: Record<string, unknown> }
  }
  assert.deepEqual(
    planningHandoffReplayEnvelope.data?.canonicalPlanningHandoff,
    routePlanningHandoff,
    'Exact planning handoff replay must return the same content-addressed private authority.',
  )
  const planningHandoffInspectionUrl =
    `${routeBaseUrl}/v1/projects/${routeProjectId}/edit-sessions/route-edit-session/` +
    `canonical-planning-handoffs/${String(routePlanningHandoff.handoffId)}?workspaceId=${routeWorkspaceId}`
  const unauthenticatedHandoffInspection = await fetch(planningHandoffInspectionUrl)
  assert.equal(unauthenticatedHandoffInspection.status, 401)
  const crossUserHandoffInspection = await fetch(planningHandoffInspectionUrl, {
    headers: { authorization: 'Bearer verified-other-authority-token' },
  })
  assert.equal(crossUserHandoffInspection.status, 404)
  const unpublishedHandoffInspectionResponse = await fetch(planningHandoffInspectionUrl, {
    headers: routeAuthHeaders,
  })
  assert.equal(unpublishedHandoffInspectionResponse.status, 200)
  const unpublishedHandoffInspectionEnvelope = await unpublishedHandoffInspectionResponse.json() as {
    data?: { canonicalPlanningHandoffInspection?: Record<string, unknown> }
  }
  const unpublishedHandoffInspection = asRecord(
    unpublishedHandoffInspectionEnvelope.data?.canonicalPlanningHandoffInspection,
  )
  assert.equal(unpublishedHandoffInspection.publicationStatus, 'unpublished')
  assert.equal(asRecord(unpublishedHandoffInspection.publication).fullRevalidationRequired, true)
  assert.equal(asRecord(unpublishedHandoffInspection.publication).exactReplayOnly, false)
  assert.equal(asRecord(unpublishedHandoffInspection.permissions).inspectionOnly, true)
  assert.equal(unpublishedHandoffInspection.pathOrCredentialReturned, false)
  const latestUnpublishedHandoffInspectionResponse = await fetch(
    latestPlanningHandoffInspectionUrl,
    { headers: routeAuthHeaders },
  )
  assert.equal(latestUnpublishedHandoffInspectionResponse.status, 200)
  const latestUnpublishedHandoffInspectionEnvelope =
    await latestUnpublishedHandoffInspectionResponse.json() as {
      data?: { canonicalPlanningHandoffInspection?: Record<string, unknown> }
    }
  assert.deepEqual(
    latestUnpublishedHandoffInspectionEnvelope.data?.canonicalPlanningHandoffInspection,
    unpublishedHandoffInspection,
  )
  const handoffReadyJourney = await readCanonicalJourney()
  assert.equal(handoffReadyJourney.response.status, 200)
  assert.equal(handoffReadyJourney.journey.stage, 'publication_request_required')
  assert.equal(
    asRecord(handoffReadyJourney.journey.nextAction).code,
    'submit_publication_request',
  )
  assert.equal(
    asRecord(handoffReadyJourney.journey.planningHandoff).handoffId,
    routePlanningHandoff.handoffId,
  )

  const {
    planningInputAuthority: _callerPlanningInputAuthority,
    sourceMediaAuthority: _callerSourceMediaAuthority,
    ...routePlanWithoutCallerAuthorities
  } = routePlanBody
  void _callerPlanningInputAuthority
  void _callerSourceMediaAuthority
  const persistedHandoffPublishUrl =
    `${routeBaseUrl}/v1/projects/${routeProjectId}/edit-sessions/route-edit-session/` +
    `canonical-planning-handoffs/${String(routePlanningHandoff.handoffId)}/publish`
  const persistedHandoffPublishBody = {
    ...routePlanWithoutCallerAuthorities,
    expectedHandoffHash: String(routePlanningHandoff.handoffHash),
  }
  const publicationRequestSubmitUrl =
    `${routeBaseUrl}/v1/projects/${routeProjectId}/edit-sessions/route-edit-session/` +
    `canonical-planning-handoffs/${String(routePlanningHandoff.handoffId)}/publication-requests`
  const latestPublicationRequestInspectionUrl =
    `${publicationRequestSubmitUrl}/latest?workspaceId=${routeWorkspaceId}`
  const missingLatestPublicationRequest = await fetch(
    latestPublicationRequestInspectionUrl,
    { headers: routeAuthHeaders },
  )
  assert.equal(missingLatestPublicationRequest.status, 404)
  const crossUserHandoffResponse = await fetch(persistedHandoffPublishUrl, {
    method: 'POST',
    headers: {
      authorization: 'Bearer verified-other-authority-token',
      'content-type': 'application/json',
      'idempotency-key': 'route-cross-user-handoff-publish',
    },
    body: JSON.stringify(persistedHandoffPublishBody),
  })
  assert.equal(crossUserHandoffResponse.status, 404)
  const wrongHandoffHashResponse = await fetch(persistedHandoffPublishUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-wrong-handoff-hash' },
    body: JSON.stringify({ ...persistedHandoffPublishBody, expectedHandoffHash: 'f'.repeat(64) }),
  })
  assert.equal(wrongHandoffHashResponse.status, 409)
  const changedComponentsPublishBody = structuredClone(persistedHandoffPublishBody)
  changedComponentsPublishBody.canonicalPlan.components.rendererPlan = {
    ...changedComponentsPublishBody.canonicalPlan.components.rendererPlan,
    callerSubstitution: true,
  }
  const changedComponentsResponse = await fetch(persistedHandoffPublishUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-changed-handoff-components' },
    body: JSON.stringify(changedComponentsPublishBody),
  })
  assert.equal(changedComponentsResponse.status, 409)
  const crossUserPublicationRequest = await fetch(publicationRequestSubmitUrl, {
    method: 'POST',
    headers: {
      authorization: 'Bearer verified-other-authority-token',
      'content-type': 'application/json',
      'idempotency-key': 'route-cross-user-publication-request',
    },
    body: JSON.stringify(persistedHandoffPublishBody),
  })
  assert.equal(crossUserPublicationRequest.status, 404)
  const wrongCandidateHandoffHash = await fetch(publicationRequestSubmitUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-wrong-candidate-handoff-hash',
    },
    body: JSON.stringify({
      ...persistedHandoffPublishBody,
      expectedHandoffHash: 'f'.repeat(64),
    }),
  })
  assert.equal(wrongCandidateHandoffHash.status, 409)
  const changedCandidateComponents = await fetch(publicationRequestSubmitUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-changed-candidate-components',
    },
    body: JSON.stringify(changedComponentsPublishBody),
  })
  assert.equal(changedCandidateComponents.status, 409)
  const publicationRequestResponse = await fetch(publicationRequestSubmitUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-submit-publication-request',
    },
    body: JSON.stringify(persistedHandoffPublishBody),
  })
  assert.equal(publicationRequestResponse.status, 201)
  const publicationRequestEnvelope = await publicationRequestResponse.json() as {
    data?: { canonicalPlanPublicationRequest?: Record<string, unknown> }
  }
  const routePublicationRequest = asRecord(
    publicationRequestEnvelope.data?.canonicalPlanPublicationRequest,
  )
  assert.equal(routePublicationRequest.publicationStatus, 'pending_internal_publication')
  const routePublicationRequestIdentity = asRecord(routePublicationRequest.identity)
  assert.match(String(routePublicationRequestIdentity.candidateId), /^publication_request_[a-f0-9]{64}$/)
  assert.match(String(routePublicationRequest.candidateHash), /^[a-f0-9]{64}$/)
  assert.equal(routePublicationRequest.requestBodyReturned, false)
  assert.equal(routePublicationRequest.pathOrCredentialReturned, false)
  assert.equal(asRecord(routePublicationRequest.permissions).inspectionOnly, true)
  assert.equal(asRecord(routePublicationRequest.permissions).internalPublicationRequired, true)
  assert.equal(asRecord(routePublicationRequest.permissions).planMutation, false)
  assert.equal(asRecord(routePublicationRequest.permissions).snapshotCreation, false)
  assert.equal(asRecord(routePublicationRequest.permissions).creditReservation, false)
  assert.equal(asRecord(routePublicationRequest.permissions).toolExecution, false)
  assert.equal(asRecord(routePublicationRequest.permissions).providerCall, false)
  assert.equal(asRecord(routePublicationRequest.permissions).render, false)
  const publicationRequestReplayResponse = await fetch(publicationRequestSubmitUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-submit-publication-request-replay',
    },
    body: JSON.stringify(persistedHandoffPublishBody),
  })
  assert.equal(publicationRequestReplayResponse.status, 201)
  const publicationRequestReplayEnvelope = await publicationRequestReplayResponse.json() as {
    data?: { canonicalPlanPublicationRequest?: Record<string, unknown> }
  }
  assert.deepEqual(
    publicationRequestReplayEnvelope.data?.canonicalPlanPublicationRequest,
    routePublicationRequest,
  )
  const publicationRequestBaseUrl =
    `${publicationRequestSubmitUrl}/${String(routePublicationRequestIdentity.candidateId)}`
  const publicationRequestInspectionUrl =
    `${publicationRequestBaseUrl}?workspaceId=${routeWorkspaceId}`
  const unauthenticatedPublicationRequestInspection = await fetch(publicationRequestInspectionUrl)
  assert.equal(unauthenticatedPublicationRequestInspection.status, 401)
  const crossUserPublicationRequestInspection = await fetch(publicationRequestInspectionUrl, {
    headers: { authorization: 'Bearer verified-other-authority-token' },
  })
  assert.equal(
    crossUserPublicationRequestInspection.status,
    404,
    await crossUserPublicationRequestInspection.clone().text(),
  )
  const pendingPublicationRequestInspection = await fetch(publicationRequestInspectionUrl, {
    headers: routeAuthHeaders,
  })
  assert.equal(pendingPublicationRequestInspection.status, 200)
  const pendingPublicationRequestInspectionEnvelope =
    await pendingPublicationRequestInspection.json() as {
      data?: { canonicalPlanPublicationRequest?: Record<string, unknown> }
    }
  assert.deepEqual(
    pendingPublicationRequestInspectionEnvelope.data?.canonicalPlanPublicationRequest,
    routePublicationRequest,
  )
  const latestPendingPublicationRequestResponse = await fetch(
    latestPublicationRequestInspectionUrl,
    { headers: routeAuthHeaders },
  )
  assert.equal(latestPendingPublicationRequestResponse.status, 200)
  const latestPendingPublicationRequestEnvelope =
    await latestPendingPublicationRequestResponse.json() as {
      data?: { canonicalPlanPublicationRequest?: Record<string, unknown> }
    }
  assert.deepEqual(
    latestPendingPublicationRequestEnvelope.data?.canonicalPlanPublicationRequest,
    routePublicationRequest,
  )
  const crossUserLatestPublicationRequest = await fetch(
    latestPublicationRequestInspectionUrl,
    { headers: { authorization: 'Bearer verified-other-authority-token' } },
  )
  assert.equal(crossUserLatestPublicationRequest.status, 404)
  const publicationPendingJourney = await readCanonicalJourney()
  assert.equal(publicationPendingJourney.response.status, 200)
  assert.equal(publicationPendingJourney.journey.stage, 'internal_publication_pending')
  assert.equal(
    asRecord(publicationPendingJourney.journey.nextAction).code,
    'await_internal_publication',
  )
  assert.equal(
    asRecord(publicationPendingJourney.journey.publicationRequest).candidateId,
    routePublicationRequestIdentity.candidateId,
  )
  const publicationRequestScopeHash = sha256AuthorityValue({
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: 'route-edit-session',
  })
  const publicationRequestRecordPath = join(
    context.env.localStorageRoot,
    'canonical-plan-publication-requests',
    'private-internal-v1',
    `scope-${publicationRequestScopeHash}`,
    `${String(routePublicationRequestIdentity.candidateId)}.json`,
  )
  const originalPublicationRequestRecord = await readFile(
    publicationRequestRecordPath,
    'utf8',
  )
  const tamperedPublicationRequestRecord = JSON.parse(
    originalPublicationRequestRecord,
  ) as { checksumSha256: string }
  tamperedPublicationRequestRecord.checksumSha256 = 'f'.repeat(64)
  try {
    await writeFile(
      publicationRequestRecordPath,
      `${JSON.stringify(tamperedPublicationRequestRecord)}\n`,
      'utf8',
    )
    const tamperedPublicationRequestInspection = await fetch(
      publicationRequestInspectionUrl,
      { headers: routeAuthHeaders },
    )
    assert.equal(tamperedPublicationRequestInspection.status, 409)
  } finally {
    await writeFile(
      publicationRequestRecordPath,
      originalPublicationRequestRecord,
      'utf8',
    )
  }
  const candidatePublishUrl = `${publicationRequestBaseUrl}/publish`
  const unauthenticatedCandidatePublish = await fetch(candidatePublishUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': 'route-unauthenticated-candidate-publish',
    },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      expectedCandidateHash: routePublicationRequest.candidateHash,
    }),
  })
  assert.equal(unauthenticatedCandidatePublish.status, 401)
  const wrongCandidateHashPublish = await fetch(candidatePublishUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-wrong-candidate-hash-publish',
    },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      expectedCandidateHash: 'f'.repeat(64),
    }),
  })
  assert.equal(wrongCandidateHashPublish.status, 409)
  const publishResponse = await fetch(
    candidatePublishUrl,
    {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-publish-plan' },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        expectedCandidateHash: routePublicationRequest.candidateHash,
      }),
    },
  )
  assert.equal(publishResponse.status, 201)
  const publishEnvelope = await publishResponse.json() as {
    data?: {
      authority?: Record<string, unknown>
      canonicalPlanningHandoff?: Record<string, unknown>
      canonicalPlanPublicationRequest?: Record<string, unknown>
    }
  }
  const routePublishedAuthority = asRecord(publishEnvelope.data?.authority)
  const routePublishedHandoff = asRecord(publishEnvelope.data?.canonicalPlanningHandoff)
  const routePlan = asRecord(routePublishedAuthority.plan)
  const routeEstimate = asRecord(routePublishedAuthority.estimate)
  assert.equal(routePlan.status, 'presented')
  assert.equal('snapshot' in routePublishedAuthority, false)
  assert.equal('jobs' in routePublishedAuthority, false)
  assert.equal(routePublishedHandoff.handoffId, routePlanningHandoff.handoffId)
  assert.equal(routePublishedHandoff.handoffHash, routePlanningHandoff.handoffHash)
  assert.equal(routePublishedHandoff.boundToPublishedPlan, true)
  assert.equal(routePublishedHandoff.revalidatedBeforePublication, true)
  assert.equal(routePublishedHandoff.singlePublication, true)
  assert.equal(routePublishedHandoff.publicationReplayed, false)
  assert.match(String(routePublishedHandoff.publicationRequestHash), /^[a-f0-9]{64}$/)
  const publishedPublicationRequest = asRecord(
    publishEnvelope.data?.canonicalPlanPublicationRequest,
  )
  assert.equal(publishedPublicationRequest.publicationStatus, 'published')
  assert.equal(
    asRecord(publishedPublicationRequest.publication).planId,
    routePlan.id,
  )
  assert.equal(publishedPublicationRequest.requestBodyReturned, false)
  const routePlanComponentRefs = asRecord(routePlan.componentRefs)
  assert.match(
    String(asRecord(routePlanComponentRefs.planningHandoffAuthority).sha256),
    /^[a-f0-9]{64}$/,
  )
  const planApprovalJourney = await readCanonicalJourney()
  assert.equal(planApprovalJourney.response.status, 200)
  assert.equal(planApprovalJourney.journey.stage, 'plan_approval_required')
  assert.equal(
    asRecord(planApprovalJourney.journey.nextAction).code,
    'approve_canonical_plan',
  )
  assert.equal(asRecord(planApprovalJourney.journey.plan).planId, routePlan.id)
  assert.equal(
    asRecord(planApprovalJourney.journey.plan).estimateId,
    routeEstimate.id,
  )
  assert.equal('approval' in planApprovalJourney.journey, false)
  const publishedHandoffInspectionResponse = await fetch(planningHandoffInspectionUrl, {
    headers: routeAuthHeaders,
  })
  assert.equal(publishedHandoffInspectionResponse.status, 200)
  const publishedHandoffInspectionEnvelope = await publishedHandoffInspectionResponse.json() as {
    data?: { canonicalPlanningHandoffInspection?: Record<string, unknown> }
  }
  const publishedHandoffInspection = asRecord(
    publishedHandoffInspectionEnvelope.data?.canonicalPlanningHandoffInspection,
  )
  assert.equal(publishedHandoffInspection.publicationStatus, 'published')
  const publishedHandoffInspectionPublication = asRecord(publishedHandoffInspection.publication)
  assert.equal(publishedHandoffInspectionPublication.planId, routePlan.id)
  assert.equal(publishedHandoffInspectionPublication.planHash, routePlan.planHash)
  assert.equal(publishedHandoffInspectionPublication.planStatus, 'presented')
  assert.equal(publishedHandoffInspectionPublication.exactReplayOnly, true)
  assert.equal(publishedHandoffInspectionPublication.newPublicationMayBeAttempted, false)
  const latestPublishedHandoffInspectionResponse = await fetch(
    latestPlanningHandoffInspectionUrl,
    { headers: routeAuthHeaders },
  )
  assert.equal(latestPublishedHandoffInspectionResponse.status, 200)
  const latestPublishedHandoffInspectionEnvelope =
    await latestPublishedHandoffInspectionResponse.json() as {
      data?: { canonicalPlanningHandoffInspection?: Record<string, unknown> }
    }
  assert.deepEqual(
    latestPublishedHandoffInspectionEnvelope.data?.canonicalPlanningHandoffInspection,
    publishedHandoffInspection,
  )
  const freshServiceHandoffInspection = await createCanonicalPlanningHandoffService({
    ...context,
    requestId: 'planning-handoff-fresh-service-recovery',
  }).inspect({
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: 'route-edit-session',
    handoffId: String(routePlanningHandoff.handoffId),
  })
  assert.deepEqual(freshServiceHandoffInspection, publishedHandoffInspection)
  const persistedHandoffPublishReplay = await fetch(candidatePublishUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-publish-plan',
    },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      expectedCandidateHash: routePublicationRequest.candidateHash,
    }),
  })
  assert.equal(persistedHandoffPublishReplay.status, 201)
  const persistedHandoffPublishReplayEnvelope = await persistedHandoffPublishReplay.json() as {
    data?: {
      authority?: Record<string, unknown>
      canonicalPlanningHandoff?: Record<string, unknown>
    }
  }
  assert.deepEqual(persistedHandoffPublishReplayEnvelope.data?.authority, routePublishedAuthority)
  assert.equal(
    asRecord(persistedHandoffPublishReplayEnvelope.data?.canonicalPlanningHandoff)
      .publicationReplayed,
    true,
  )
  const secondKeySameHandoffPublication = await fetch(candidatePublishUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-publish-plan-second-key',
    },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      expectedCandidateHash: routePublicationRequest.candidateHash,
    }),
  })
  assert.equal(secondKeySameHandoffPublication.status, 409)
  const changedWorkGraphPublicationBody = structuredClone(persistedHandoffPublishBody)
  changedWorkGraphPublicationBody.canonicalPlan.workItems[0]!.maximumCreditBudget += 1
  const changedWorkGraphCandidateResponse = await fetch(publicationRequestSubmitUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-submit-changed-work-graph-candidate',
    },
    body: JSON.stringify(changedWorkGraphPublicationBody),
  })
  assert.equal(changedWorkGraphCandidateResponse.status, 201)
  const changedWorkGraphCandidateEnvelope = await changedWorkGraphCandidateResponse.json() as {
    data?: { canonicalPlanPublicationRequest?: Record<string, unknown> }
  }
  const changedWorkGraphCandidate = asRecord(
    changedWorkGraphCandidateEnvelope.data?.canonicalPlanPublicationRequest,
  )
  assert.equal(
    changedWorkGraphCandidate.publicationStatus,
    'superseded_by_competing_candidate',
  )
  const latestChangedCandidateResponse = await fetch(
    latestPublicationRequestInspectionUrl,
    { headers: routeAuthHeaders },
  )
  assert.equal(latestChangedCandidateResponse.status, 200)
  const latestChangedCandidateEnvelope = await latestChangedCandidateResponse.json() as {
    data?: { canonicalPlanPublicationRequest?: Record<string, unknown> }
  }
  assert.deepEqual(
    latestChangedCandidateEnvelope.data?.canonicalPlanPublicationRequest,
    changedWorkGraphCandidate,
  )
  const freshLatestPublicationRequest = await createCanonicalPlanPublicationRequestService({
    ...context,
    requestId: 'latest-publication-request-fresh-service-recovery',
  }).inspectLatest({
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: 'route-edit-session',
    handoffId: String(routePlanningHandoff.handoffId),
  })
  assert.deepEqual(freshLatestPublicationRequest, changedWorkGraphCandidate)
  const latestPublicationRequestPointerPath = join(
    context.env.localStorageRoot,
    'canonical-plan-publication-requests',
    'private-internal-v1',
    `scope-${publicationRequestScopeHash}`,
    `latest-${sha256AuthorityValue({
      handoffId: String(routePlanningHandoff.handoffId),
    })}.json`,
  )
  const originalLatestPublicationRequestPointer = await readFile(
    latestPublicationRequestPointerPath,
    'utf8',
  )
  const tamperedLatestPublicationRequestPointer = JSON.parse(
    originalLatestPublicationRequestPointer,
  ) as { checksumSha256: string }
  tamperedLatestPublicationRequestPointer.checksumSha256 = 'f'.repeat(64)
  try {
    await writeFile(
      latestPublicationRequestPointerPath,
      `${JSON.stringify(tamperedLatestPublicationRequestPointer)}\n`,
      'utf8',
    )
    const tamperedLatestPublicationRequestResponse = await fetch(
      latestPublicationRequestInspectionUrl,
      { headers: routeAuthHeaders },
    )
    assert.equal(tamperedLatestPublicationRequestResponse.status, 409)
  } finally {
    await writeFile(
      latestPublicationRequestPointerPath,
      originalLatestPublicationRequestPointer,
      'utf8',
    )
  }
  const changedWorkGraphCandidateIdentity = asRecord(changedWorkGraphCandidate.identity)
  const changedWorkGraphSameHandoffPublication = await fetch(
    `${publicationRequestSubmitUrl}/${String(changedWorkGraphCandidateIdentity.candidateId)}/publish`,
    {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-publish-plan-changed-work-graph',
    },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      expectedCandidateHash: changedWorkGraphCandidate.candidateHash,
    }),
  })
  assert.equal(changedWorkGraphSameHandoffPublication.status, 409)
  const changedWorkGraphConflictEnvelope = await changedWorkGraphSameHandoffPublication.json() as {
    error?: { details?: { requiredGate?: string } }
  }
  assert.equal(
    changedWorkGraphConflictEnvelope.error?.details?.requiredGate,
    'one_handoff_one_canonical_plan_publication',
  )
  const legacyDirectCanonicalPublish = await fetch(
    `${routeBaseUrl}/v1/projects/${routeProjectId}/edit-sessions/route-edit-session/canonical-plans`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-legacy-direct-canonical-publish',
      },
      body: JSON.stringify(routePlanBody),
    },
  )
  assert.equal(legacyDirectCanonicalPublish.status, 503)
  const legacyDirectCanonicalPublishEnvelope = await legacyDirectCanonicalPublish.json() as {
    error?: { code?: string; details?: { replacementRoute?: string; requiredGate?: string } }
  }
  assert.equal(legacyDirectCanonicalPublishEnvelope.error?.code, 'TOOL_NOT_READY')
  assert.equal(
    legacyDirectCanonicalPublishEnvelope.error?.details?.requiredGate,
    'persisted_server_loaded_planning_handoff_authority',
  )
  assert.equal(
    legacyDirectCanonicalPublishEnvelope.error?.details?.replacementRoute,
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publish',
  )

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
  const routeSnapshotComponentRefs = asRecord(routeSnapshot.componentRefs)
  assert.deepEqual(
    routeSnapshotComponentRefs.planningHandoffAuthority,
    routePlanComponentRefs.planningHandoffAuthority,
    'Approval must preserve the exact planning-handoff reference in immutable snapshot lineage.',
  )
  const routeLoadedExecutionAuthority = await createEditPlanningAuthorityService(
    context,
  ).loadApprovedExecutionAuthority(String(routeSnapshot.snapshotId), routeWorkspaceId)
  assert.equal(
    routeLoadedExecutionAuthority.planningHandoffAuthority?.handoffId,
    routePlanningHandoff.handoffId,
  )
  assert.equal(
    routeLoadedExecutionAuthority.planningHandoffAuthority?.handoffHash,
    routePlanningHandoff.handoffHash,
  )
  const approvedSnapshotJourney = await readCanonicalJourney()
  assert.equal(approvedSnapshotJourney.response.status, 200)
  assert.equal(approvedSnapshotJourney.journey.stage, 'approved_snapshot_available')
  assert.equal(
    asRecord(approvedSnapshotJourney.journey.nextAction).code,
    'request_execution_package',
  )
  assert.equal(
    asRecord(approvedSnapshotJourney.journey.approval).snapshotId,
    routeSnapshot.snapshotId,
  )
  assert.equal(
    asRecord(approvedSnapshotJourney.journey.approval).reservationId,
    asRecord(routeApprovedAuthority.reservation).id,
  )
  assert.equal(
    asRecord(approvedSnapshotJourney.journey.approval).jobCount,
    (routeApprovedAuthority.jobs as unknown[]).length,
  )

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
  const executionJourney = await readCanonicalJourney()
  assert.equal(executionJourney.response.status, 200)
  assert.equal(executionJourney.journey.stage, 'execution_in_progress')
  assert.equal(
    asRecord(executionJourney.journey.nextAction).code,
    'run_private_work_graph',
  )
  assert.equal(
    asRecord(executionJourney.journey.execution).packageRecordId,
    routeExecutionPackage.packageRecordId,
  )
  assert.equal(
    asRecord(executionJourney.journey.execution).snapshotId,
    routeSnapshot.snapshotId,
  )
  assert.equal(asRecord(executionJourney.journey.permissions).inspectionOnly, true)
  assert.equal(asRecord(executionJourney.journey.permissions).toolExecution, false)
  assert.equal(asRecord(executionJourney.journey.permissions).render, false)
  const parsedExecutionJourney = canonicalEditJourneyResponseSchema.parse(
    executionJourney.journey,
  )
  assert.equal(canonicalEditJourneyResponseSchema.safeParse({
    ...parsedExecutionJourney,
    nextAction: {
      ...parsedExecutionJourney.nextAction,
      code: 'await_public_delivery_authorization',
    },
  }).success, false)
  assert.equal(canonicalEditJourneyResponseSchema.safeParse({
    ...parsedExecutionJourney,
    nextAction: {
      ...parsedExecutionJourney.nextAction,
      routeTemplate: '/v1/edit-executions/packages/foreign-package/private-internal-work-graph-runs',
    },
  }).success, false)
  assert.equal(canonicalEditJourneyResponseSchema.safeParse({
    ...parsedExecutionJourney,
    execution: {
      ...parsedExecutionJourney.execution!,
      snapshotId: 'foreign-snapshot',
    },
  }).success, false)
  assert.equal(canonicalEditJourneyResponseSchema.safeParse({
    ...parsedExecutionJourney,
    stage: 'private_review_accepted',
    nextAction: {
      code: 'await_public_delivery_authorization',
      actor: 'internal_service',
      method: 'GET',
      routeTemplate:
        `/v1/projects/${routeProjectId}/edit-sessions/route-edit-session/canonical-journey`,
    },
  }).success, false)
  assert.equal(canonicalEditJourneyResponseSchema.safeParse({
    ...parsedExecutionJourney,
    stage: 'private_review_assembly_required',
    nextAction: {
      code: 'assemble_private_review',
      actor: 'internal_service',
      method: 'POST',
      routeTemplate:
        `/v1/edit-executions/packages/${String(routeExecutionPackage.packageRecordId)}/private-review-assemblies`,
    },
  }).success, false)

  await proveLatestHandoffDiscovery({
    serviceContext: context,
    routeBaseUrl,
    routeAuthHeaders,
    routeWorkspaceId,
  })

  await provePersistedHandoffStaleAuthorityRejection({
    serviceContext: context,
    routeBaseUrl,
    routeAuthHeaders,
    routeWorkspaceId,
  })

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

  const callerSelectedJobExecution = await fetch(
    `${routeBaseUrl}/v1/edit-executions/jobs/${String(routeRootJob.id)}/private-internal-execution`,
    {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-caller-selected-job-tool' },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        projectId: routeProjectId,
        editSessionId: 'route-edit-session',
        purpose: 'execute_canonical_private_job',
        requestedToolName: 'ffmpeg',
      }),
    },
  )
  assert.equal(callerSelectedJobExecution.status, 400)

  const canonicalJobExecutionRequest = {
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: 'route-edit-session',
    purpose: 'execute_canonical_private_job',
  }
  const canonicalJobExecutionUrl =
    `${routeBaseUrl}/v1/edit-executions/jobs/${String(routeRootJob.id)}/private-internal-execution`
  const canonicalJobExecution = await fetch(canonicalJobExecutionUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-canonical-job-execution' },
    body: JSON.stringify(canonicalJobExecutionRequest),
  })
  assert.equal(canonicalJobExecution.status, 201)
  const canonicalJobExecutionEnvelope = await canonicalJobExecution.json() as {
    data?: { canonicalPrivateJobExecution?: Record<string, unknown> }
  }
  const routeCanonicalJobExecution = asRecord(canonicalJobExecutionEnvelope.data?.canonicalPrivateJobExecution)
  const routeCanonicalJobIdentity = asRecord(routeCanonicalJobExecution.identity)
  const routeCanonicalJobResult = asRecord(routeCanonicalJobExecution.result)
  const routeCanonicalJobEvidence = asRecord(routeCanonicalJobExecution.evidence)
  const routeCanonicalJobPermissions = asRecord(routeCanonicalJobExecution.permissions)
  assert.equal(routeCanonicalJobIdentity.jobId, routeRootJob.id)
  assert.equal(routeCanonicalJobIdentity.canonicalToolId, null)
  assert.equal(routeCanonicalJobIdentity.runnerClass, 'canonical_authority_validation_runner_v1')
  assert.equal(routeCanonicalJobResult.qaOutcome, 'passed')
  assert.equal(routeCanonicalJobResult.privateTestDependencySatisfied, true)
  assert.equal(routeCanonicalJobEvidence.serverDerivedCanonicalJob, true)
  assert.equal(routeCanonicalJobEvidence.idempotentAdapterReplay, false)
  assert.equal(routeCanonicalJobPermissions.providerCall, false)
  assert.equal(routeCanonicalJobPermissions.walletMutation, false)
  assert.equal(routeCanonicalJobPermissions.billing, false)

  const canonicalJobExecutionReplay = await fetch(canonicalJobExecutionUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-canonical-job-execution' },
    body: JSON.stringify(canonicalJobExecutionRequest),
  })
  assert.equal(canonicalJobExecutionReplay.status, 201)
  assert.equal(canonicalJobExecutionReplay.headers.get('idempotency-replayed'), 'true')
  const canonicalJobExecutionReplayEnvelope = await canonicalJobExecutionReplay.json() as {
    data?: { canonicalPrivateJobExecution?: Record<string, unknown> }
  }
  const routeCanonicalJobExecutionReplay = asRecord(
    canonicalJobExecutionReplayEnvelope.data?.canonicalPrivateJobExecution,
  )
  assert.equal(
    asRecord(routeCanonicalJobExecutionReplay.result).artifactId,
    routeCanonicalJobResult.artifactId,
  )
  assert.equal(asRecord(routeCanonicalJobExecutionReplay.evidence).idempotentAdapterReplay, false)

  const differentRouteJob = routeJobs.find((job) => job.id !== routeRootJob.id)
  assert.ok(differentRouteJob)
  const canonicalJobExecutionConflict = await fetch(
    `${routeBaseUrl}/v1/edit-executions/jobs/${String(differentRouteJob.id)}/private-internal-execution`,
    {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-canonical-job-execution' },
      body: JSON.stringify(canonicalJobExecutionRequest),
    },
  )
  assert.equal(canonicalJobExecutionConflict.status, 409)

  const workGraphEditSessionId = 'route-work-graph-session'
  const workGraphPlanningAuthority = await prepareExactPlanningAuthority(
    context,
    routeProjectId,
    workGraphEditSessionId,
    routeWorkspaceId,
  )
  const workGraphSourceFixture = await prepareSourceMediaAuthority(
    context,
    routeWorkspaceId,
    routeProjectId,
    'route-work-graph',
  )
  const workGraphPlanBody = createCanonicalPlanBody(
    'route-work-graph-planning-request',
    workGraphPlanningAuthority,
    workGraphSourceFixture,
  )
  const sourceTrimValidationItem = workGraphPlanBody.canonicalPlan.workItems.find((workItem) =>
    workItem.workItemKey === 'source-trim')
  assert.ok(sourceTrimValidationItem)
  sourceTrimValidationItem.workerClass = 'authority_worker'
  sourceTrimValidationItem.executionInput = { operation: 'validate_approved_source_trim_plan' }
  sourceTrimValidationItem.expectedOutputs = [{
    outputKey: 'source-trim-validation-evidence',
    artifactType: 'source_trim_validation_evidence',
    assetRole: 'qa',
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'application/json',
    segmentIds: ['segment-1', 'segment-2'],
    timingIds: ['master-timing-plan'],
    rendererLayerIds: [],
  }]
  sourceTrimValidationItem.approvedToolIds = []
  sourceTrimValidationItem.maximumCreditBudget = 0
  workGraphPlanBody.workspaceId = routeWorkspaceId
  const workGraphPublishResponse = await publishCanonicalPlanThroughPersistedHandoffRoute({
    routeBaseUrl,
    routeAuthHeaders,
    projectId: routeProjectId,
    editSessionId: workGraphEditSessionId,
    planBody: workGraphPlanBody,
    idempotencyKey: 'route-work-graph-publish',
  })
  assert.equal(workGraphPublishResponse.status, 201)
  const workGraphPublishEnvelope = await workGraphPublishResponse.json() as {
    data?: { authority?: Record<string, unknown> }
  }
  const workGraphPublishedAuthority = asRecord(workGraphPublishEnvelope.data?.authority)
  const workGraphPlan = asRecord(workGraphPublishedAuthority.plan)
  const workGraphEstimate = asRecord(workGraphPublishedAuthority.estimate)
  const workGraphApproveResponse = await fetch(
    `${routeBaseUrl}/v1/edit-plans/${String(workGraphPlan.id)}/approve`,
    {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-work-graph-approve' },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        expectedAuthorityRevision: workGraphPublishedAuthority.authorityRevision,
        expectedPlanHash: workGraphPlan.planHash,
        expectedEstimateHash: workGraphEstimate.estimateHash,
      }),
    },
  )
  assert.equal(workGraphApproveResponse.status, 201)
  const workGraphApproveEnvelope = await workGraphApproveResponse.json() as {
    data?: { authority?: Record<string, unknown> }
  }
  const workGraphApprovedAuthority = asRecord(workGraphApproveEnvelope.data?.authority)
  const workGraphSnapshot = asRecord(workGraphApprovedAuthority.snapshot)
  const workGraphPackageResponse = await fetch(`${routeBaseUrl}/v1/edit-executions/packages`, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-work-graph-package' },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      approvedPlanSnapshotId: workGraphSnapshot.snapshotId,
      expectedSnapshotHash: workGraphSnapshot.snapshotHash,
      purpose: 'private_internal_execution_handoff',
    }),
  })
  assert.equal(workGraphPackageResponse.status, 201)
  const workGraphPackageEnvelope = await workGraphPackageResponse.json() as {
    data?: { approvedEditExecutionPackage?: Record<string, unknown> }
  }
  const workGraphPackage = asRecord(workGraphPackageEnvelope.data?.approvedEditExecutionPackage)
  const workGraphRunUrl = `${routeBaseUrl}/v1/edit-executions/packages/${String(workGraphPackage.packageRecordId)}/private-internal-work-graph-runs`
  const callerSelectedWorkGraph = await fetch(workGraphRunUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-work-graph-caller-job-list' },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      purpose: 'run_canonical_private_work_graph',
      jobIds: (workGraphApprovedAuthority.jobs as Record<string, unknown>[]).map((job) => job.id),
    }),
  })
  assert.equal(callerSelectedWorkGraph.status, 400)

  const workGraphRunBody = {
    workspaceId: routeWorkspaceId,
    purpose: 'run_canonical_private_work_graph',
  }
  const workGraphRunResponse = await fetch(workGraphRunUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-work-graph-run-1' },
    body: JSON.stringify(workGraphRunBody),
  })
  assert.equal(workGraphRunResponse.status, 201)
  const workGraphRunEnvelope = await workGraphRunResponse.json() as {
    data?: { canonicalPrivateWorkGraphRun?: Record<string, unknown> }
  }
  const workGraphRun = asRecord(workGraphRunEnvelope.data?.canonicalPrivateWorkGraphRun)
  const workGraphRunSummary = asRecord(workGraphRun.summary)
  const workGraphRunReadiness = asRecord(workGraphRun.readiness)
  const workGraphJobOutcomes = workGraphRun.jobs as Record<string, unknown>[]
  const sourceTrimValidationOutcome = workGraphJobOutcomes.find((job) =>
    job.workItemKey === 'source-trim')
  assert.ok(sourceTrimValidationOutcome)
  assert.equal(sourceTrimValidationOutcome.status, 'completed_private_test')
  assert.equal(sourceTrimValidationOutcome.contentType, 'application/json')
  assert.equal(typeof sourceTrimValidationOutcome.artifactId, 'string')
  assert.equal(typeof sourceTrimValidationOutcome.sha256, 'string')
  assert.equal(workGraphRun.status, 'blocked_required_jobs')
  assert.equal(workGraphRunSummary.totalJobCount, 4)
  assert.equal(workGraphRunSummary.completedJobCount, 2)
  assert.equal(workGraphRunSummary.replayedJobCount, 0)
  assert.equal(workGraphRunSummary.capabilityBlockedJobCount, 1)
  assert.equal(workGraphRunSummary.dependencyBlockedJobCount, 1)
  assert.equal(workGraphRunSummary.requiredBlockedJobCount, 2)
  assert.equal(workGraphRunReadiness.privateInternalWorkGraphCompleted, false)
  assert.equal(workGraphRunReadiness.privateReviewReady, false)
  assert.equal(workGraphRunReadiness.nextRequiredGate, 'canonical_job_capability_blockers')
  assert.equal(asRecord(workGraphRun.permissions).providerCall, false)
  assert.equal(asRecord(workGraphRun.permissions).billing, false)

  const workGraphJourneyUrl =
    `${routeBaseUrl}/v1/projects/${routeProjectId}/edit-sessions/${workGraphEditSessionId}/` +
    `canonical-journey?workspaceId=${routeWorkspaceId}`
  const workGraphJourneyResponse = await fetch(workGraphJourneyUrl, { headers: routeAuthHeaders })
  assert.equal(workGraphJourneyResponse.status, 200)
  const workGraphJourneyEnvelope = await workGraphJourneyResponse.json() as {
    data?: { canonicalEditJourney?: Record<string, unknown> }
  }
  const workGraphJourney = asRecord(workGraphJourneyEnvelope.data?.canonicalEditJourney)
  assert.equal(workGraphJourney.stage, 'execution_in_progress')
  assert.equal(asRecord(workGraphJourney.nextAction).code, 'run_private_work_graph')
  const workGraphProgress = asRecord(workGraphJourney.workGraphProgress)
  assert.equal(workGraphProgress.packageRecordId, workGraphPackage.packageRecordId)
  assert.equal(workGraphProgress.approvedPlanSnapshotId, workGraphSnapshot.snapshotId)
  assert.equal(workGraphProgress.status, 'blocked_required_jobs')
  assert.equal(workGraphProgress.runFinished, true)
  assert.equal(workGraphProgress.totalJobCount, 4)
  assert.equal(workGraphProgress.completedJobCount, 2)
  assert.equal(workGraphProgress.capabilityBlockedJobCount, 1)
  assert.equal(workGraphProgress.dependencyBlockedJobCount, 1)
  assert.equal(workGraphProgress.pendingJobCount, 0)
  assert.equal(workGraphProgress.requiredIncompleteJobCount, 2)
  assert.equal(workGraphProgress.allRequiredJobsCompleted, false)
  assert.equal(workGraphProgress.nextRequiredGate, 'canonical_job_capability_blockers')
  assert.equal(typeof workGraphProgress.checkpointHash, 'string')
  assert.equal(Number(workGraphProgress.checkpointSequence) > 0, true)
  for (const forbiddenKey of [
    'jobs', 'artifacts', 'filesystemPath', 'localFilePath', 'credential', 'lease', 'dispatch', 'signedUrl',
  ]) assert.equal(forbiddenKey in workGraphProgress, false)
  const parsedWorkGraphJourney = canonicalEditJourneyResponseSchema.parse(workGraphJourney)
  assert.equal(canonicalEditJourneyResponseSchema.safeParse({
    ...parsedWorkGraphJourney,
    workGraphProgress: {
      ...parsedWorkGraphJourney.workGraphProgress!,
      packageRecordId: 'foreign-package',
    },
  }).success, false)
  assert.equal(canonicalEditJourneyResponseSchema.safeParse({
    ...parsedWorkGraphJourney,
    workGraphProgress: {
      ...parsedWorkGraphJourney.workGraphProgress!,
      completedJobCount: 4,
    },
  }).success, false)

  const workGraphProgressRoot = canonicalWorkGraphProgressRoot({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: workGraphEditSessionId,
    packageRecordId: String(workGraphPackage.packageRecordId),
    approvedPlanSnapshotId: String(workGraphSnapshot.snapshotId),
  })
  const workGraphProgressPointerPath = join(workGraphProgressRoot, 'latest.json')
  const workGraphProgressPointerBeforeContinuation = await readFile(
    workGraphProgressPointerPath,
    'utf8',
  )

  const workGraphRunReplay = await fetch(workGraphRunUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-work-graph-run-1' },
    body: JSON.stringify(workGraphRunBody),
  })
  assert.equal(workGraphRunReplay.status, 201)
  assert.equal(workGraphRunReplay.headers.get('idempotency-replayed'), 'true')

  const workGraphContinuationResponse = await fetch(workGraphRunUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-work-graph-run-2' },
    body: JSON.stringify(workGraphRunBody),
  })
  assert.equal(workGraphContinuationResponse.status, 201)
  const workGraphContinuationEnvelope = await workGraphContinuationResponse.json() as {
    data?: { canonicalPrivateWorkGraphRun?: Record<string, unknown> }
  }
  const workGraphContinuation = asRecord(workGraphContinuationEnvelope.data?.canonicalPrivateWorkGraphRun)
  const workGraphContinuationSummary = asRecord(workGraphContinuation.summary)
  assert.equal(workGraphContinuation.status, 'blocked_required_jobs')
  assert.equal(workGraphContinuationSummary.completedJobCount, 2)
  assert.equal(workGraphContinuationSummary.replayedJobCount, 2)
  assert.equal(workGraphContinuationSummary.capabilityBlockedJobCount, 1)
  assert.equal(
    await readFile(workGraphProgressPointerPath, 'utf8'),
    workGraphProgressPointerBeforeContinuation,
  )

  const progressPointer = JSON.parse(workGraphProgressPointerBeforeContinuation) as {
    checkpointHash: string
    checksumSha256: string
  }
  const workGraphProgressCheckpointPath = join(
    workGraphProgressRoot,
    'checkpoints',
    `${progressPointer.checkpointHash}.json`,
  )
  const originalWorkGraphProgressCheckpoint = await readFile(
    workGraphProgressCheckpointPath,
    'utf8',
  )
  const tamperedProgressPointer = JSON.parse(workGraphProgressPointerBeforeContinuation) as {
    checksumSha256: string
  }
  tamperedProgressPointer.checksumSha256 = '0'.repeat(64)
  try {
    await writeFile(workGraphProgressPointerPath, `${JSON.stringify(tamperedProgressPointer)}\n`)
    const response = await fetch(workGraphJourneyUrl, { headers: routeAuthHeaders })
    assert.equal(response.status, 409)
  } finally {
    await writeFile(workGraphProgressPointerPath, workGraphProgressPointerBeforeContinuation)
  }
  const tamperedProgressCheckpoint = JSON.parse(originalWorkGraphProgressCheckpoint) as {
    checkpoint: { checkpointHash: string }
  }
  tamperedProgressCheckpoint.checkpoint.checkpointHash = '0'.repeat(64)
  try {
    await writeFile(
      workGraphProgressCheckpointPath,
      `${JSON.stringify(tamperedProgressCheckpoint)}\n`,
    )
    const response = await fetch(workGraphJourneyUrl, { headers: routeAuthHeaders })
    assert.equal(response.status, 409)
  } finally {
    await writeFile(workGraphProgressCheckpointPath, originalWorkGraphProgressCheckpoint)
  }
  const restoredWorkGraphJourney = await fetch(workGraphJourneyUrl, { headers: routeAuthHeaders })
  assert.equal(restoredWorkGraphJourney.status, 200)

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
  assert.equal(provenToolIdentitySummary.canonicalEndToEndVerifiedCount, 50)
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

  const leaseFixtureEditSessionId = 'route-current-source-lease-fixture-session'
  const leaseFixturePlanningAuthority = await prepareExactPlanningAuthority(
    context,
    routeProjectId,
    leaseFixtureEditSessionId,
    routeWorkspaceId,
  )
  const leaseFixturePlanBody = createCanonicalPlanBody(
    'route-current-source-lease-fixture-planning-request',
    leaseFixturePlanningAuthority,
    workGraphSourceFixture,
  )
  leaseFixturePlanBody.workspaceId = routeWorkspaceId
  const leaseFixturePublishResponse = await publishCanonicalPlanThroughPersistedHandoffRoute({
    routeBaseUrl,
    routeAuthHeaders,
    projectId: routeProjectId,
    editSessionId: leaseFixtureEditSessionId,
    planBody: leaseFixturePlanBody,
    idempotencyKey: 'route-current-source-lease-fixture-publish',
  })
  assert.equal(leaseFixturePublishResponse.status, 201)
  const leaseFixturePublishEnvelope = await leaseFixturePublishResponse.json() as {
    data?: { authority?: Record<string, unknown> }
  }
  const leaseFixturePublishedAuthority = asRecord(leaseFixturePublishEnvelope.data?.authority)
  const leaseFixturePlan = asRecord(leaseFixturePublishedAuthority.plan)
  const leaseFixtureEstimate = asRecord(leaseFixturePublishedAuthority.estimate)
  const leaseFixtureApproveResponse = await fetch(
    `${routeBaseUrl}/v1/edit-plans/${String(leaseFixturePlan.id)}/approve`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-current-source-lease-fixture-approve',
      },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        expectedAuthorityRevision: leaseFixturePublishedAuthority.authorityRevision,
        expectedPlanHash: leaseFixturePlan.planHash,
        expectedEstimateHash: leaseFixtureEstimate.estimateHash,
      }),
    },
  )
  assert.equal(leaseFixtureApproveResponse.status, 201)
  const leaseFixtureApproveEnvelope = await leaseFixtureApproveResponse.json() as {
    data?: { authority?: Record<string, unknown> }
  }
  const leaseFixtureApprovedAuthority = asRecord(leaseFixtureApproveEnvelope.data?.authority)
  const leaseFixtureSnapshot = asRecord(leaseFixtureApprovedAuthority.snapshot)
  const leaseFixturePackageResponse = await fetch(`${routeBaseUrl}/v1/edit-executions/packages`, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-current-source-lease-fixture-package',
    },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      approvedPlanSnapshotId: leaseFixtureSnapshot.snapshotId,
      expectedSnapshotHash: leaseFixtureSnapshot.snapshotHash,
      purpose: 'private_internal_execution_handoff',
    }),
  })
  assert.equal(leaseFixturePackageResponse.status, 201)
  const leaseFixturePackageEnvelope = await leaseFixturePackageResponse.json() as {
    data?: { approvedEditExecutionPackage?: Record<string, unknown> }
  }
  const leaseFixtureExecutionPackage = asRecord(
    leaseFixturePackageEnvelope.data?.approvedEditExecutionPackage,
  )
  const leaseFixtureReservation = asRecord(leaseFixtureApprovedAuthority.reservation)
  const leaseFixtureJobs = leaseFixtureApprovedAuthority.jobs as Record<string, unknown>[]
  const leaseFixtureRootJob = leaseFixtureJobs.find((job) =>
    Array.isArray(job.dependencyJobIds) && job.dependencyJobIds.length === 0)
  assert.ok(leaseFixtureRootJob)
  const leaseFixtureClaim = (await createCanonicalWorkerLeaseAuthorityService(context).claim({
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: leaseFixtureEditSessionId,
    jobId: String(leaseFixtureRootJob.id),
    purpose: 'private_internal_canonical_lease_claim',
    idempotencyKey: 'route-consumed-dispatch-cancellation-lease-claim',
  })).workerLeaseClaim

  const cancellationEditSessionId = 'route-pre-execution-cancellation-session'
  const cancellationProjectResponse = await fetch(`${routeBaseUrl}/v1/projects`, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-pre-execution-cancellation-project',
    },
    body: JSON.stringify({
      workspaceId: cancellationWorkspaceId,
      name: 'Route pre-execution cancellation project',
    }),
  })
  assert.equal(cancellationProjectResponse.status, 201)
  const cancellationProjectEnvelope = await cancellationProjectResponse.json() as {
    data?: { project?: { id?: string } }
  }
  const cancellationProjectId = cancellationProjectEnvelope.data?.project?.id
  assert.ok(cancellationProjectId)
  const cancellationPlanningAuthority = await prepareExactPlanningAuthority(
    context,
    cancellationProjectId,
    cancellationEditSessionId,
    cancellationWorkspaceId,
  )
  const cancellationSourceFixture = await prepareSourceMediaAuthority(
    context,
    cancellationWorkspaceId,
    cancellationProjectId,
    'route-pre-execution-cancellation',
  )
  const cancellationPlanBody = createCanonicalPlanBody(
    'route-pre-execution-cancellation-planning-request',
    cancellationPlanningAuthority,
    cancellationSourceFixture,
  )
  cancellationPlanBody.workspaceId = cancellationWorkspaceId
  const cancellationPublishResponse = await publishCanonicalPlanThroughPersistedHandoffRoute({
    routeBaseUrl,
    routeAuthHeaders,
    projectId: cancellationProjectId,
    editSessionId: cancellationEditSessionId,
    planBody: cancellationPlanBody,
    idempotencyKey: 'route-pre-execution-cancellation-publish',
  })
  const cancellationPublishEnvelope = await cancellationPublishResponse.json() as {
    data?: { authority?: Record<string, unknown> }
    error?: unknown
  }
  assert.equal(
    cancellationPublishResponse.status,
    201,
    `Cancellation fixture plan publication failed: ${JSON.stringify(cancellationPublishEnvelope.error)}`,
  )
  const cancellationPublishedAuthority = asRecord(cancellationPublishEnvelope.data?.authority)
  const cancellationPlan = asRecord(cancellationPublishedAuthority.plan)
  const cancellationEstimate = asRecord(cancellationPublishedAuthority.estimate)
  const cancellationApproveResponse = await fetch(
    `${routeBaseUrl}/v1/edit-plans/${String(cancellationPlan.id)}/approve`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-pre-execution-cancellation-approve',
      },
      body: JSON.stringify({
        workspaceId: cancellationWorkspaceId,
        expectedAuthorityRevision: cancellationPublishedAuthority.authorityRevision,
        expectedPlanHash: cancellationPlan.planHash,
        expectedEstimateHash: cancellationEstimate.estimateHash,
      }),
    },
  )
  assert.equal(cancellationApproveResponse.status, 201)
  const cancellationApproveEnvelope = await cancellationApproveResponse.json() as {
    data?: { authority?: Record<string, unknown> }
  }
  const cancellationApprovedAuthority = asRecord(cancellationApproveEnvelope.data?.authority)
  const cancellationSnapshot = asRecord(cancellationApprovedAuthority.snapshot)
  const cancellationReservation = asRecord(cancellationApprovedAuthority.reservation)
  const cancellationWalletBefore = asRecord(cancellationApprovedAuthority.wallet)
  const cancellationJobsBefore = cancellationApprovedAuthority.jobs as Record<string, unknown>[]
  const cancellationPackageResponse = await fetch(`${routeBaseUrl}/v1/edit-executions/packages`, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-pre-execution-cancellation-package',
    },
    body: JSON.stringify({
      workspaceId: cancellationWorkspaceId,
      approvedPlanSnapshotId: cancellationSnapshot.snapshotId,
      expectedSnapshotHash: cancellationSnapshot.snapshotHash,
      purpose: 'private_internal_execution_handoff',
    }),
  })
  assert.equal(cancellationPackageResponse.status, 201)
  const cancellationPackageEnvelope = await cancellationPackageResponse.json() as {
    data?: { approvedEditExecutionPackage?: Record<string, unknown> }
  }
  const cancellationExecutionPackage = asRecord(
    cancellationPackageEnvelope.data?.approvedEditExecutionPackage,
  )
  const cancellationRootJob = cancellationJobsBefore.find((job) =>
    Array.isArray(job.dependencyJobIds) && job.dependencyJobIds.length === 0)
  assert.ok(cancellationRootJob)
  const cancellationLeaseClaim = (await createCanonicalWorkerLeaseAuthorityService(context).claim({
    workspaceId: cancellationWorkspaceId,
    projectId: cancellationProjectId,
    editSessionId: cancellationEditSessionId,
    jobId: String(cancellationRootJob.id),
    purpose: 'private_internal_canonical_lease_claim',
    idempotencyKey: 'route-cancellation-never-started-lease-claim',
  })).workerLeaseClaim
  assert.equal(cancellationLeaseClaim.lease.status, 'active')
  assert.equal(cancellationLeaseClaim.lease.executionFence.state, 'not_started')
  const executionDomainScope = {
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: cancellationWorkspaceId,
    projectId: cancellationProjectId,
    editSessionId: cancellationEditSessionId,
  }
  const cancellationAuthorityBeforeDispatch = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: cancellationWorkspaceId,
  })
  assert.ok(cancellationAuthorityBeforeDispatch)
  const cancellationAuthorityJob = cancellationAuthorityBeforeDispatch.jobs.find((job) =>
    job.id === cancellationRootJob.id)
  assert.ok(cancellationAuthorityJob)
  const cancellationApprovedWorkItem = cancellationAuthorityBeforeDispatch.approvedWorkItems.find((workItem) =>
    workItem.id === cancellationAuthorityJob.approvedWorkItemId)
  assert.ok(cancellationApprovedWorkItem)
  const cancellationExpectedOutput = cancellationApprovedWorkItem.expectedOutputs[0]
  const cancellationExpectedAssetId = cancellationAuthorityJob.expectedAssetIds[0]
  assert.ok(cancellationExpectedOutput)
  assert.ok(cancellationExpectedAssetId)
  let releaseFirstExecutionDomainLock: () => void = () => undefined
  let markFirstExecutionDomainLockEntered: () => void = () => undefined
  const firstExecutionDomainLockEntered = new Promise<void>((resolve) => {
    markFirstExecutionDomainLockEntered = resolve
  })
  const holdFirstExecutionDomainLock = new Promise<void>((resolve) => {
    releaseFirstExecutionDomainLock = resolve
  })
  const executionDomainOrder: string[] = []
  const firstExecutionDomainOperation = withCanonicalExecutionDomainLock(
    executionDomainScope,
    async () => {
      executionDomainOrder.push('first_entered')
      markFirstExecutionDomainLockEntered()
      await holdFirstExecutionDomainLock
      executionDomainOrder.push('first_released')
    },
  )
  await firstExecutionDomainLockEntered
  let dispatchLockProbeError: unknown
  const dispatchLockProbe = createCanonicalPrivateToolDispatchAuthorityService(context).authorize({
    workspaceId: cancellationWorkspaceId,
    projectId: cancellationProjectId,
    editSessionId: cancellationEditSessionId,
    jobId: cancellationAuthorityJob.id,
    approvedWorkItemId: cancellationApprovedWorkItem.id,
    expectedAssetId: cancellationExpectedAssetId,
    requestedToolName: 'ffmpeg',
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
    purpose: 'private_internal_canonical_tool_dispatch_authorization',
    idempotencyKey: 'route-cancellation-dispatch-lock-probe',
  }, {
    leaseId: cancellationLeaseClaim.lease.leaseId,
    leaseCredential: cancellationLeaseClaim.leaseCredential,
  }).then(
    () => executionDomainOrder.push('dispatch_settled'),
    (error: unknown) => {
      dispatchLockProbeError = error
      executionDomainOrder.push('dispatch_settled')
    },
  )
  await new Promise((resolve) => setTimeout(resolve, 50))
  assert.deepEqual(executionDomainOrder, ['first_entered'])
  releaseFirstExecutionDomainLock()
  await Promise.all([firstExecutionDomainOperation, dispatchLockProbe])
  assert.deepEqual(executionDomainOrder, ['first_entered', 'first_released', 'dispatch_settled'])
  assert.ok(dispatchLockProbeError instanceof ApiError)

  const dispatchIssuedAt = new Date().toISOString()
  const dispatchExpiresAt = new Date(Date.parse(dispatchIssuedAt) + 30_000).toISOString()
  const dependencyAuthority = cancellationLeaseClaim.lease.dependencyAuthority
  const cancellationDispatchWithoutHash: Omit<CanonicalPrivateToolDispatchRecord, 'immutableGrantHash'> = {
    schemaVersion: CANONICAL_PRIVATE_TOOL_DISPATCH_RECORD_VERSION,
    id: 'tool_dispatch_cancellation_unconsumed_fixture',
    status: 'authorized',
    binding: {
      workspaceId: cancellationWorkspaceId,
      projectId: cancellationProjectId,
      editSessionId: cancellationEditSessionId,
      jobId: cancellationAuthorityJob.id,
      approvedPlanSnapshotId: String(cancellationSnapshot.snapshotId),
      approvedWorkItemId: cancellationApprovedWorkItem.id,
      expectedAssetId: cancellationExpectedAssetId,
      requestedToolName: 'ffmpeg',
      canonicalToolId: 'ffmpeg',
      operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
      leaseId: cancellationLeaseClaim.lease.leaseId,
      leaseAttemptNumber: cancellationLeaseClaim.lease.attemptNumber,
      leaseImmutableHash: cancellationLeaseClaim.lease.immutableLeaseHash,
      leaseDependencyAuthority: {
        state: dependencyAuthority.state,
        readinessHash: dependencyAuthority.readinessHash,
        authorityHash: dependencyAuthority.authorityHash,
        selectedArtifactsHash: sha256AuthorityValue(dependencyAuthority.selectedArtifacts),
        selectedArtifactCount: dependencyAuthority.selectedArtifacts.length,
        liveRuntimeEligible: false,
      },
      leaseExecutionFenceState: 'not_started',
      reservationId: String(cancellationReservation.id),
      maximumCreditBudget: cancellationApprovedWorkItem.maximumCreditBudget,
      remainingReservedCreditsAtDecision: Number(cancellationReservation.reservedCredits),
      expectedOutput: {
        outputKey: cancellationExpectedOutput.outputKey,
        artifactType: cancellationExpectedOutput.artifactType,
        assetRole: cancellationExpectedOutput.assetRole,
        required: cancellationExpectedOutput.required,
        previewPlaceholderAllowed: cancellationExpectedOutput.previewPlaceholderAllowed,
        ...(cancellationExpectedOutput.contentType
          ? { contentType: cancellationExpectedOutput.contentType }
          : {}),
        segmentIds: [...cancellationExpectedOutput.segmentIds],
        timingIds: [...cancellationExpectedOutput.timingIds],
        rendererLayerIds: [...cancellationExpectedOutput.rendererLayerIds],
      },
    },
    authorityRevision: Number(cancellationExecutionPackage.authorityRevision),
    canonicalHashes: { ...cancellationLeaseClaim.lease.canonicalHashes },
    toolOperationSpecHash: sha256ForSmoke('cancellation-dispatch-tool-operation-spec'),
    runtimeEvidenceAuthorityHash: sha256ForSmoke('cancellation-dispatch-runtime-authority'),
    runtimeEvidenceRecordHash: sha256ForSmoke('cancellation-dispatch-runtime-record'),
    privateRuntimeAuthorityHash: sha256ForSmoke('cancellation-dispatch-private-runtime-authority'),
    privateRuntimeImageIdentityHash: sha256ForSmoke('cancellation-dispatch-private-image-identity'),
    specPrivateInternalReady: true,
    runtimePrivateInternalReady: true,
    specProductReady: false,
    runtimeProductReady: false,
    exactOperationApproved: true,
    offlineExecutionOnly: true,
    decisionRequestHash: sha256ForSmoke('cancellation-dispatch-decision-request'),
    credentialHashSha256: sha256ForSmoke('cancellation-dispatch-credential'),
    blockers: [],
    issuedAt: dispatchIssuedAt,
    expiresAt: dispatchExpiresAt,
  }
  const cancellationDispatchRecord: CanonicalPrivateToolDispatchRecord = {
    ...cancellationDispatchWithoutHash,
    immutableGrantHash: canonicalPrivateToolDispatchImmutableHash(cancellationDispatchWithoutHash),
  }
  await mutatePrivateCanonicalToolDispatchAggregate({
    scope: {
      localStorageRoot,
      ownerUserId: userId,
      workspaceId: cancellationWorkspaceId,
    },
    now: dispatchIssuedAt,
    mutation: (aggregate) => {
      aggregate.grants.push(cancellationDispatchRecord)
      aggregate.idempotencyRecords.push({
        operation: 'authorize',
        keyHash: sha256ForSmoke('cancellation-dispatch-idempotency-key'),
        requestHash: cancellationDispatchRecord.decisionRequestHash,
        grantId: cancellationDispatchRecord.id,
        createdAt: dispatchIssuedAt,
      })
      aggregate.auditEvents.push({
        id: 'tool_dispatch_audit_cancellation_unconsumed_fixture',
        eventType: 'authorized',
        grantId: cancellationDispatchRecord.id,
        jobId: cancellationDispatchRecord.binding.jobId,
        approvedWorkItemId: cancellationDispatchRecord.binding.approvedWorkItemId,
        expectedAssetId: cancellationDispatchRecord.binding.expectedAssetId,
        canonicalToolId: cancellationDispatchRecord.binding.canonicalToolId,
        operationId: cancellationDispatchRecord.binding.operationId,
        leaseId: cancellationDispatchRecord.binding.leaseId,
        leaseAttemptNumber: cancellationDispatchRecord.binding.leaseAttemptNumber,
        createdAt: dispatchIssuedAt,
      })
      return { result: undefined, changed: true }
    },
  })
  const cancellationBody = {
    workspaceId: cancellationWorkspaceId,
    expectedAuthorityRevision: cancellationExecutionPackage.authorityRevision,
    expectedSnapshotHash: cancellationSnapshot.snapshotHash,
    expectedReservationId: cancellationReservation.id,
    reason: 'user_cancelled_before_execution',
  }
  const cancellationUrl =
    `${routeBaseUrl}/v1/approved-snapshots/${String(cancellationSnapshot.snapshotId)}/cancel`
  const unauthenticatedCancellation = await fetch(cancellationUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'route-cancel-unauthenticated' },
    body: JSON.stringify(cancellationBody),
  })
  assert.equal(unauthenticatedCancellation.status, 401)
  const cancellationResponse = await fetch(cancellationUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-cancel-before-execution',
    },
    body: JSON.stringify(cancellationBody),
  })
  assert.equal(cancellationResponse.status, 201)
  const cancellationEnvelope = await cancellationResponse.json() as {
    data?: { canonicalPreExecutionCancellation?: Record<string, unknown> }
  }
  const cancellation = asRecord(cancellationEnvelope.data?.canonicalPreExecutionCancellation)
  const cancelledReservation = asRecord(cancellation.reservation)
  const cancellationWalletAfter = asRecord(cancellation.wallet)
  assert.equal(cancelledReservation.status, 'cancelled')
  assert.equal(cancellation.planStatus, 'cancelled')
  assert.equal(cancellation.estimateStatus, 'cancelled')
  assert.equal(cancelledReservation.spentCredits, 0)
  assert.equal(cancelledReservation.refundedCredits, 0)
  assert.equal(cancelledReservation.releasedCredits, cancellationReservation.reservedCredits)
  assert.equal(
    cancellationWalletAfter.availableCredits,
    Number(cancellationWalletBefore.availableCredits) + Number(cancellationReservation.reservedCredits),
  )
  assert.equal(
    cancellationWalletAfter.reservedCredits,
    Number(cancellationWalletBefore.reservedCredits) - Number(cancellationReservation.reservedCredits),
  )
  assert.deepEqual(
    cancellation.derivedJobIds,
    cancellationJobsBefore.map((job) => job.id),
  )
  assert.equal(cancellation.snapshotRemainsImmutable, true)
  assert.equal(cancellation.derivedJobsRemainUnmodified, true)
  assert.equal(cancellation.executionPackagePresent, true)
  assert.equal(cancellation.executionPackageRecordId, cancellationExecutionPackage.packageRecordId)
  assert.equal(cancellation.executionPackageRecordPreserved, true)
  assert.equal(cancellation.leaseRecordCount, 1)
  assert.equal(cancellation.releasedLeaseCount, 1)
  assert.equal(cancellation.expiredLeaseCount, 0)
  assert.equal(cancellation.allLeaseExecutionFencesNotStarted, true)
  assert.equal(cancellation.dispatchRecordCount, 1)
  assert.equal(cancellation.revokedDispatchCount, 1)
  assert.equal(cancellation.expiredDispatchCount, 0)
  assert.equal(cancellation.deniedDispatchCount, 0)
  assert.equal(cancellation.allDispatchGrantsUnconsumed, true)
  assert.equal(cancellation.internalTestWalletMutated, true)
  assert.equal(cancellation.customerWalletMutation, false)
  assert.equal(cancellation.customerCreditMutation, false)
  assert.equal(cancellation.billingExecuted, false)
  assert.equal(cancellation.toolExecutionStarted, false)
  assert.equal(cancellation.providerCallStarted, false)
  assert.equal(cancellation.renderStarted, false)
  assert.equal(cancellation.publicDeliveryStarted, false)
  const cancellationReplay = await fetch(cancellationUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-cancel-before-execution',
    },
    body: JSON.stringify(cancellationBody),
  })
  assert.equal(cancellationReplay.status, 201)
  const cancellationReplayEnvelope = await cancellationReplay.json() as {
    data?: { canonicalPreExecutionCancellation?: Record<string, unknown> }
  }
  assert.deepEqual(cancellationReplayEnvelope.data?.canonicalPreExecutionCancellation, cancellation)
  const cancellationConflict = await fetch(cancellationUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-cancel-before-execution',
    },
    body: JSON.stringify({ ...cancellationBody, expectedSnapshotHash: '0'.repeat(64) }),
  })
  assert.equal(cancellationConflict.status, 409)
  const cancelledPackageResponse = await fetch(`${routeBaseUrl}/v1/edit-executions/packages`, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-cancelled-snapshot-package',
    },
    body: JSON.stringify({
      workspaceId: cancellationWorkspaceId,
      approvedPlanSnapshotId: cancellationSnapshot.snapshotId,
      expectedSnapshotHash: cancellationSnapshot.snapshotHash,
      purpose: 'private_internal_execution_handoff',
    }),
  })
  assert.equal(cancelledPackageResponse.status, 409)
  const cancelledPackageEnvelope = await cancelledPackageResponse.json() as {
    error?: { code?: string }
  }
  assert.equal(cancelledPackageEnvelope.error?.code, 'APPROVED_SNAPSHOT_REQUIRED')
  const cancelledSnapshotRead = await fetch(
    `${routeBaseUrl}/v1/approved-snapshots/${String(cancellationSnapshot.snapshotId)}/authority?workspaceId=${cancellationWorkspaceId}`,
    { headers: routeAuthHeaders },
  )
  assert.equal(cancelledSnapshotRead.status, 200)
  const cancelledSnapshotEnvelope = await cancelledSnapshotRead.json() as {
    data?: { authority?: Record<string, unknown> }
  }
  const cancelledSnapshotAuthority = asRecord(cancelledSnapshotEnvelope.data?.authority)
  assert.equal(asRecord(cancelledSnapshotAuthority.reservation).status, 'cancelled')
  assert.deepEqual(
    (cancelledSnapshotAuthority.jobs as Record<string, unknown>[]).map((job) => ({ id: job.id, status: job.status })),
    cancellationJobsBefore.map((job) => ({ id: job.id, status: job.status })),
  )
  const cancelledPreferenceView = await createExactEditPreferenceService(context).getCurrent(
    cancellationWorkspaceId,
    cancellationProjectId,
    cancellationEditSessionId,
  )
  assert.equal(cancelledPreferenceView.preferenceRecord?.lifecycle.locked, false)
  assert.equal(cancelledPreferenceView.preferenceRecord?.lifecycle.phase, 'planning')
  const cancelledLeaseAggregate = await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: cancellationWorkspaceId,
  })
  assert.equal(
    cancelledLeaseAggregate?.leases.find((lease) =>
      lease.id === cancellationLeaseClaim.lease.leaseId)?.status,
    'released',
  )
  const cancelledDispatchAggregate = await readPrivateCanonicalToolDispatchAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: cancellationWorkspaceId,
  })
  const revokedCancellationDispatch = cancelledDispatchAggregate?.grants.find((grant) =>
    grant.id === cancellationDispatchRecord.id)
  assert.equal(revokedCancellationDispatch?.status, 'revoked')
  assert.ok(revokedCancellationDispatch?.revokedAt)

  const routeAuthorityBeforeConsumedDispatch = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  assert.ok(routeAuthorityBeforeConsumedDispatch)
  const leaseFixtureAuthorityJob = routeAuthorityBeforeConsumedDispatch.jobs.find((job) =>
    job.id === leaseFixtureRootJob.id)
  assert.ok(leaseFixtureAuthorityJob)
  const leaseFixtureApprovedWorkItem = routeAuthorityBeforeConsumedDispatch.approvedWorkItems.find((workItem) =>
    workItem.id === leaseFixtureAuthorityJob.approvedWorkItemId)
  assert.ok(leaseFixtureApprovedWorkItem)
  const leaseFixtureExpectedAssetId = leaseFixtureAuthorityJob.expectedAssetIds[0]
  assert.ok(leaseFixtureExpectedAssetId)
  const consumedDispatchAt = new Date().toISOString()
  const consumedDispatchExpiresAt = new Date(Date.parse(consumedDispatchAt) + 30_000).toISOString()
  const consumedDependencyAuthority = leaseFixtureClaim.lease.dependencyAuthority
  const consumedDispatchWithoutHash: Omit<CanonicalPrivateToolDispatchRecord, 'immutableGrantHash'> = {
    ...cancellationDispatchWithoutHash,
    id: 'tool_dispatch_cancellation_consumed_fixture',
    status: 'consumed',
    binding: {
      ...cancellationDispatchWithoutHash.binding,
      workspaceId: routeWorkspaceId,
      projectId: routeProjectId,
      editSessionId: leaseFixtureEditSessionId,
      jobId: leaseFixtureAuthorityJob.id,
      approvedPlanSnapshotId: String(leaseFixtureSnapshot.snapshotId),
      approvedWorkItemId: leaseFixtureApprovedWorkItem.id,
      expectedAssetId: leaseFixtureExpectedAssetId,
      leaseId: leaseFixtureClaim.lease.leaseId,
      leaseAttemptNumber: leaseFixtureClaim.lease.attemptNumber,
      leaseImmutableHash: leaseFixtureClaim.lease.immutableLeaseHash,
      leaseDependencyAuthority: {
        state: consumedDependencyAuthority.state,
        readinessHash: consumedDependencyAuthority.readinessHash,
        authorityHash: consumedDependencyAuthority.authorityHash,
        selectedArtifactsHash: sha256AuthorityValue(consumedDependencyAuthority.selectedArtifacts),
        selectedArtifactCount: consumedDependencyAuthority.selectedArtifacts.length,
        liveRuntimeEligible: false,
      },
      reservationId: String(leaseFixtureReservation.id),
      maximumCreditBudget: leaseFixtureApprovedWorkItem.maximumCreditBudget,
      remainingReservedCreditsAtDecision: Number(leaseFixtureReservation.reservedCredits),
    },
    authorityRevision: Number(leaseFixtureExecutionPackage.authorityRevision),
    canonicalHashes: { ...leaseFixtureClaim.lease.canonicalHashes },
    decisionRequestHash: sha256ForSmoke('consumed-dispatch-cancellation-decision-request'),
    credentialHashSha256: sha256ForSmoke('consumed-dispatch-cancellation-credential'),
    issuedAt: consumedDispatchAt,
    expiresAt: consumedDispatchExpiresAt,
    consumedAt: consumedDispatchAt,
  }
  const consumedDispatchRecord: CanonicalPrivateToolDispatchRecord = {
    ...consumedDispatchWithoutHash,
    immutableGrantHash: canonicalPrivateToolDispatchImmutableHash(consumedDispatchWithoutHash),
  }
  await mutatePrivateCanonicalToolDispatchAggregate({
    scope: { localStorageRoot, ownerUserId: userId, workspaceId: routeWorkspaceId },
    now: consumedDispatchAt,
    mutation: (aggregate) => {
      aggregate.grants.push(consumedDispatchRecord)
      aggregate.auditEvents.push({
        id: 'tool_dispatch_audit_cancellation_consumed_fixture',
        eventType: 'consumed',
        grantId: consumedDispatchRecord.id,
        jobId: consumedDispatchRecord.binding.jobId,
        approvedWorkItemId: consumedDispatchRecord.binding.approvedWorkItemId,
        expectedAssetId: consumedDispatchRecord.binding.expectedAssetId,
        canonicalToolId: consumedDispatchRecord.binding.canonicalToolId,
        operationId: consumedDispatchRecord.binding.operationId,
        leaseId: consumedDispatchRecord.binding.leaseId,
        leaseAttemptNumber: consumedDispatchRecord.binding.leaseAttemptNumber,
        createdAt: consumedDispatchAt,
      })
      return { result: undefined, changed: true }
    },
  })
  const consumedDispatchCancellation = await fetch(
    `${routeBaseUrl}/v1/approved-snapshots/${String(leaseFixtureSnapshot.snapshotId)}/cancel`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-consumed-dispatch-cancellation-denied',
      },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        expectedAuthorityRevision: leaseFixtureExecutionPackage.authorityRevision,
        expectedSnapshotHash: leaseFixtureSnapshot.snapshotHash,
        expectedReservationId: leaseFixtureReservation.id,
        reason: 'user_cancelled_before_execution',
      }),
    },
  )
  assert.equal(consumedDispatchCancellation.status, 409)
  const consumedDispatchCancellationEnvelope = await consumedDispatchCancellation.json() as {
    error?: { code?: string; details?: { requiredGate?: string } }
  }
  assert.equal(consumedDispatchCancellationEnvelope.error?.code, 'TOOL_NOT_READY')
  assert.equal(
    consumedDispatchCancellationEnvelope.error?.details?.requiredGate,
    'canonical_consumed_dispatch_cancellation_and_compensation',
  )
  const leaseFixtureExecutionDomainScope = {
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: leaseFixtureEditSessionId,
  }
  let releaseBeginFenceLock: () => void = () => undefined
  let markBeginFenceLockEntered: () => void = () => undefined
  const beginFenceLockEntered = new Promise<void>((resolve) => {
    markBeginFenceLockEntered = resolve
  })
  const holdBeginFenceLock = new Promise<void>((resolve) => {
    releaseBeginFenceLock = resolve
  })
  const beginFenceLock = withCanonicalExecutionDomainLock(leaseFixtureExecutionDomainScope, async () => {
    markBeginFenceLockEntered()
    await holdBeginFenceLock
  })
  await beginFenceLockEntered
  let beginFenceSettled = false
  const beginFence = createCanonicalWorkerLeaseAuthorityService(context).beginInternalExecution({
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: leaseFixtureEditSessionId,
    jobId: leaseFixtureAuthorityJob.id,
    leaseId: leaseFixtureClaim.lease.leaseId,
    leaseCredential: leaseFixtureClaim.leaseCredential,
    runnerClass: 'canonical_execution_domain_lock_probe_v1',
  }).finally(() => {
    beginFenceSettled = true
  })
  await new Promise((resolve) => setTimeout(resolve, 50))
  assert.equal(beginFenceSettled, false)
  releaseBeginFenceLock()
  await beginFenceLock
  const begunFence = await beginFence
  assert.equal(begunFence.executionFence.state, 'started')
  assert.equal(begunFence.replayed, false)
  const begunFenceReplay = await createCanonicalWorkerLeaseAuthorityService(context).beginInternalExecution({
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: leaseFixtureEditSessionId,
    jobId: leaseFixtureAuthorityJob.id,
    leaseId: leaseFixtureClaim.lease.leaseId,
    leaseCredential: leaseFixtureClaim.leaseCredential,
    runnerClass: 'canonical_execution_domain_lock_probe_v1',
  })
  assert.equal(begunFenceReplay.replayed, true)
  assert.equal(
    begunFenceReplay.executionFence.executionAttemptId,
    begunFence.executionFence.executionAttemptId,
  )

  let releaseCompleteFenceLock: () => void = () => undefined
  let markCompleteFenceLockEntered: () => void = () => undefined
  const completeFenceLockEntered = new Promise<void>((resolve) => {
    markCompleteFenceLockEntered = resolve
  })
  const holdCompleteFenceLock = new Promise<void>((resolve) => {
    releaseCompleteFenceLock = resolve
  })
  const completeFenceLock = withCanonicalExecutionDomainLock(leaseFixtureExecutionDomainScope, async () => {
    markCompleteFenceLockEntered()
    await holdCompleteFenceLock
  })
  await completeFenceLockEntered
  let completeFenceSettled = false
  const completeFence = createCanonicalWorkerLeaseAuthorityService(context).completeInternalExecution({
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: leaseFixtureEditSessionId,
    jobId: leaseFixtureAuthorityJob.id,
    leaseId: leaseFixtureClaim.lease.leaseId,
    leaseCredential: leaseFixtureClaim.leaseCredential,
    runnerClass: 'canonical_execution_domain_lock_probe_v1',
    executionAttemptId: begunFence.executionFence.executionAttemptId,
  }).finally(() => {
    completeFenceSettled = true
  })
  await new Promise((resolve) => setTimeout(resolve, 50))
  assert.equal(completeFenceSettled, false)
  releaseCompleteFenceLock()
  await completeFenceLock
  const completedFence = await completeFence
  assert.equal(completedFence.executionFence.state, 'completed')
  assert.equal(completedFence.replayed, false)
  const completedFenceReplay = await createCanonicalWorkerLeaseAuthorityService(context).completeInternalExecution({
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: leaseFixtureEditSessionId,
    jobId: leaseFixtureAuthorityJob.id,
    leaseId: leaseFixtureClaim.lease.leaseId,
    leaseCredential: leaseFixtureClaim.leaseCredential,
    runnerClass: 'canonical_execution_domain_lock_probe_v1',
    executionAttemptId: begunFence.executionFence.executionAttemptId,
  })
  assert.equal(completedFenceReplay.replayed, true)
  const routeDispatchAggregate = await readPrivateCanonicalToolDispatchAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  assert.equal(
    routeDispatchAggregate?.grants.filter((grant) =>
      grant.binding.approvedPlanSnapshotId === routeSnapshot.snapshotId).length ?? 0,
    0,
  )
  const leasedSnapshotCancellation = await fetch(
    `${routeBaseUrl}/v1/approved-snapshots/${String(routeSnapshot.snapshotId)}/cancel`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-leased-snapshot-cancellation-blocked',
      },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        expectedAuthorityRevision: cancellation.authorityRevision,
        expectedSnapshotHash: routeSnapshot.snapshotHash,
        expectedReservationId: asRecord(routeApprovedAuthority.reservation).id,
        reason: 'user_cancelled_before_execution',
      }),
    },
  )
  assert.equal(leasedSnapshotCancellation.status, 409)
  const leasedSnapshotCancellationEnvelope = await leasedSnapshotCancellation.json() as {
    error?: { code?: string; details?: { requiredGate?: string } }
  }
  assert.equal(leasedSnapshotCancellationEnvelope.error?.code, 'TOOL_NOT_READY')
  assert.equal(
    leasedSnapshotCancellationEnvelope.error?.details?.requiredGate,
    'canonical_started_execution_cancellation_and_compensation',
  )

  const downstreamLeaseFixtureEditSessionId = 'route-downstream-worker-lease-fixture-session'
  const downstreamLeasePlanningAuthority = await prepareExactPlanningAuthority(
    context,
    routeProjectId,
    downstreamLeaseFixtureEditSessionId,
    routeWorkspaceId,
  )
  const downstreamLeasePlanBody = createCanonicalPlanBody(
    'route-downstream-worker-lease-fixture-planning-request',
    downstreamLeasePlanningAuthority,
    workGraphSourceFixture,
  )
  downstreamLeasePlanBody.workspaceId = routeWorkspaceId
  const downstreamLeasePublishResponse = await publishCanonicalPlanThroughPersistedHandoffRoute({
    routeBaseUrl,
    routeAuthHeaders,
    projectId: routeProjectId,
    editSessionId: downstreamLeaseFixtureEditSessionId,
    planBody: downstreamLeasePlanBody,
    idempotencyKey: 'route-downstream-worker-lease-fixture-publish',
  })
  assert.equal(downstreamLeasePublishResponse.status, 201)
  const downstreamLeasePublishEnvelope = await downstreamLeasePublishResponse.json() as {
    data?: { authority?: Record<string, unknown> }
  }
  const downstreamLeasePublishedAuthority = asRecord(downstreamLeasePublishEnvelope.data?.authority)
  const downstreamLeasePlan = asRecord(downstreamLeasePublishedAuthority.plan)
  const downstreamLeaseEstimate = asRecord(downstreamLeasePublishedAuthority.estimate)
  const downstreamLeaseApproveResponse = await fetch(
    `${routeBaseUrl}/v1/edit-plans/${String(downstreamLeasePlan.id)}/approve`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-downstream-worker-lease-fixture-approve',
      },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        expectedAuthorityRevision: downstreamLeasePublishedAuthority.authorityRevision,
        expectedPlanHash: downstreamLeasePlan.planHash,
        expectedEstimateHash: downstreamLeaseEstimate.estimateHash,
      }),
    },
  )
  assert.equal(downstreamLeaseApproveResponse.status, 201)
  const downstreamLeaseApproveEnvelope = await downstreamLeaseApproveResponse.json() as {
    data?: { authority?: Record<string, unknown> }
  }
  const downstreamLeaseSnapshot = asRecord(
    asRecord(downstreamLeaseApproveEnvelope.data?.authority).snapshot,
  )
  const downstreamLeasePackageResponse = await fetch(`${routeBaseUrl}/v1/edit-executions/packages`, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-downstream-worker-lease-fixture-package',
    },
    body: JSON.stringify({
      workspaceId: routeWorkspaceId,
      approvedPlanSnapshotId: downstreamLeaseSnapshot.snapshotId,
      expectedSnapshotHash: downstreamLeaseSnapshot.snapshotHash,
      purpose: 'private_internal_execution_handoff',
    }),
  })
  assert.equal(downstreamLeasePackageResponse.status, 201)

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
    'server_proven_tool_identity_authority_frozen_into_plan_and_snapshot',
    'tool_authority_reconciliation_does_not_mutate_hash_bound_publication_input',
    'tool_strategy_work_graph_and_exact_operation_reconciliation_gate',
    'required_tool_canonical_lifecycle_and_job_adapter_readiness_gate',
    'tool_identity_authority_tamper_rejected_before_execution_packaging',
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
    'grouped_planner_tool_work_compiles_into_atomic_one_tool_one_required_output_jobs',
    'atomic_compilation_preserves_internal_and_external_dependency_lineage',
    'atomic_compilation_conserves_exact_work_item_budget_and_rejects_missing_mapping',
    'atomic_compilation_rejects_output_substitution_provider_groups_and_ambiguous_terminal_authority',
    'atomic_compilation_evidence_is_content_addressed_and_frozen_into_plan_authority',
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
    'content_addressed_private_planning_handoff_replay',
    'persisted_planning_handoff_cross_user_scope_hidden',
    'persisted_planning_handoff_hash_and_component_substitution_rejected',
    'persisted_planning_handoff_checksum_tamper_rejected',
    'persisted_planning_handoff_stale_preference_and_source_authority_rejected',
    'persisted_planning_handoff_binding_frozen_into_canonical_plan_authority',
    'persisted_planning_handoff_exact_publication_replay_recovers_from_canonical_plan_binding',
    'persisted_planning_handoff_second_key_and_work_graph_substitution_rejected',
    'authenticated_handoff_inspection_reports_unpublished_and_published_state_without_authority',
    'handoff_inspection_is_cross_user_hidden_checksum_fail_closed_and_fresh_service_recoverable',
    'latest_handoff_discovery_recovers_newest_serialized_preparation_without_hiding_prior_authority',
    'latest_handoff_pointer_is_cross_user_hidden_checksum_fail_closed_and_fresh_service_recoverable',
    'browser_safe_publication_request_candidate_is_content_addressed_and_exact_replay_safe',
    'publication_request_candidate_is_cross_user_hidden_and_checksum_fail_closed',
    'publication_request_inspection_returns_no_request_body_path_credential_or_execution_authority',
    'latest_publication_request_discovery_recovers_the_newest_candidate_after_refresh',
    'latest_publication_request_pointer_is_cross_user_hidden_checksum_fail_closed_and_restart_safe',
    'canonical_journey_recovery_reports_handoff_candidate_plan_and_snapshot_stages',
    'canonical_journey_recovery_reports_execution_package_without_granting_runtime_authority',
    'canonical_journey_schema_rejects_cross_stage_action_route_snapshot_and_review_substitution',
    'canonical_journey_schema_rejects_fabricated_review_assembly_readiness_without_completion_evidence',
    'canonical_journey_recovery_returns_one_exact_next_action_without_execution_authority',
    'canonical_journey_recovery_is_authenticated_and_cross_user_hidden',
    'internal_publication_loads_the_persisted_candidate_and_binds_the_exact_handoff_request',
    'competing_publication_request_candidate_cannot_replace_the_published_handoff',
    'concurrent_same_key_handoff_publications_converge_on_one_plan',
    'concurrent_competing_key_handoff_publications_have_one_winner',
    'legacy_direct_canonical_publication_http_route_fails_closed',
    'all_authenticated_canonical_route_fixtures_publish_through_persisted_handoffs',
    'authenticated_canonical_execution_readiness_http_route',
    'authenticated_canonical_single_job_execution_http_route_with_replay_and_conflict',
    'authenticated_canonical_work_graph_advances_ready_job_and_persists_exact_blockers',
    'canonical_work_graph_persists_content_addressed_monotonic_package_progress',
    'canonical_journey_recovers_bounded_blocked_work_graph_progress_without_job_or_artifact_details',
    'work_graph_progress_schema_rejects_package_and_count_substitution',
    'work_graph_progress_pointer_and_checkpoint_tamper_fail_closed',
    'canonical_source_trim_plan_validation_executes_after_snapshot_dependency',
    'canonical_work_graph_continuation_reuses_completed_job_without_duplicate_execution',
    'authenticated_pre_execution_cancellation_releases_only_unused_synthetic_reservation',
    'cancellation_preserves_snapshot_jobs_and_blocks_execution_package_creation',
    'cancellation_unlocks_planning_inputs_for_a_new_plan_version',
    'cancellation_is_idempotent_conflict_safe_and_has_no_customer_tool_provider_render_or_delivery_side_effect',
    'packaged_unconsumed_dispatch_is_revoked_and_never_started_lease_is_released_before_cancellation_finalizes',
    'shared_execution_domain_fence_serializes_dispatch_authorization_lease_creation_and_cancellation',
    'shared_execution_domain_fence_serializes_worker_execution_begin_and_complete',
    'cancellation_fails_closed_after_dispatch_consumption',
    'cancellation_fails_closed_after_execution_fence_start',
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
        toolStrategyPlan: {
          toolIds: ['ffmpeg', 'ffprobe'],
          exactOperationIds: [
            'tool.ffmpeg.execute_approved_media_recipe.v1',
            'tool.ffprobe.inspect_approved_media.v1',
          ],
        },
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

async function proveLatestHandoffDiscovery(input: {
  serviceContext: ServiceContext
  routeBaseUrl: string
  routeAuthHeaders: Record<string, string>
  routeWorkspaceId: string
}): Promise<void> {
  const editSessionId = 'latest-handoff-discovery-session'
  const project = (await createProjectService(input.serviceContext).createProject({
    workspaceId: input.routeWorkspaceId,
    name: 'Latest handoff discovery project',
  })).project
  const planningInputAuthority = await prepareExactPlanningAuthority(
    input.serviceContext,
    project.id,
    editSessionId,
    input.routeWorkspaceId,
  )
  const sourceFixture = await prepareSourceMediaAuthority(
    input.serviceContext,
    input.routeWorkspaceId,
    project.id,
    'latest-handoff-discovery',
  )
  const planBody = createCanonicalPlanBody(
    'latest-handoff-discovery-planning-request',
    planningInputAuthority,
    sourceFixture,
  )
  planBody.workspaceId = input.routeWorkspaceId
  const handoffService = createCanonicalPlanningHandoffService(input.serviceContext)
  const orderedSourceItems = sourceFixture.sourceSequence.map((item) => ({
    ...item,
    checksumSha256: String(item.checksumSha256),
  }))
  const first = await handoffService.prepare({
    workspaceId: input.routeWorkspaceId,
    projectId: project.id,
    editSessionId,
    purpose: 'prepare_canonical_planning_handoff',
    orderedSourceItems,
    canonicalPlanComponents: planBody.canonicalPlan.components,
  })
  const secondComponents = structuredClone(planBody.canonicalPlan.components)
  secondComponents.compiledIntent = {
    ...secondComponents.compiledIntent,
    latestHandoffDiscoveryRevision: 2,
  }
  const second = await handoffService.prepare({
    workspaceId: input.routeWorkspaceId,
    projectId: project.id,
    editSessionId,
    purpose: 'prepare_canonical_planning_handoff',
    orderedSourceItems,
    canonicalPlanComponents: secondComponents,
  })
  assert.notEqual(first.handoffId, second.handoffId)
  const latest = await handoffService.inspectLatest({
    workspaceId: input.routeWorkspaceId,
    projectId: project.id,
    editSessionId,
  })
  assert.equal(latest.identity.handoffId, second.handoffId)
  assert.equal(latest.publicationStatus, 'unpublished')
  const firstInspection = await handoffService.inspect({
    workspaceId: input.routeWorkspaceId,
    projectId: project.id,
    editSessionId,
    handoffId: first.handoffId,
  })
  assert.equal(firstInspection.identity.handoffId, first.handoffId)

  const latestUrl =
    `${input.routeBaseUrl}/v1/projects/${project.id}/edit-sessions/${editSessionId}/` +
    `canonical-planning-handoffs/latest?workspaceId=${input.routeWorkspaceId}`
  const latestResponse = await fetch(latestUrl, { headers: input.routeAuthHeaders })
  assert.equal(latestResponse.status, 200)
  const latestEnvelope = await latestResponse.json() as {
    data?: { canonicalPlanningHandoffInspection?: Record<string, unknown> }
  }
  assert.deepEqual(latestEnvelope.data?.canonicalPlanningHandoffInspection, latest)
  const crossUserLatestResponse = await fetch(latestUrl, {
    headers: { authorization: 'Bearer verified-other-authority-token' },
  })
  assert.equal(crossUserLatestResponse.status, 404)
  const freshServiceLatest = await createCanonicalPlanningHandoffService({
    ...input.serviceContext,
    requestId: 'latest-handoff-fresh-service-recovery',
  }).inspectLatest({
    workspaceId: input.routeWorkspaceId,
    projectId: project.id,
    editSessionId,
  })
  assert.deepEqual(freshServiceLatest, latest)

  const scopeHash = sha256AuthorityValue({
    ownerUserId: userId,
    workspaceId: input.routeWorkspaceId,
    projectId: project.id,
    editSessionId,
  })
  const latestPointerPath = join(
    input.serviceContext.env.localStorageRoot,
    'canonical-planning-handoffs',
    'private-internal-v1',
    `scope-${scopeHash}`,
    'latest.json',
  )
  const originalLatestPointer = await readFile(latestPointerPath, 'utf8')
  const tamperedLatestPointer = JSON.parse(originalLatestPointer) as { checksumSha256: string }
  tamperedLatestPointer.checksumSha256 = 'f'.repeat(64)
  try {
    await writeFile(latestPointerPath, `${JSON.stringify(tamperedLatestPointer)}\n`, 'utf8')
    const tamperedLatestResponse = await fetch(latestUrl, { headers: input.routeAuthHeaders })
    assert.equal(tamperedLatestResponse.status, 409)
  } finally {
    await writeFile(latestPointerPath, originalLatestPointer, 'utf8')
  }
}

async function provePersistedHandoffStaleAuthorityRejection(input: {
  serviceContext: ServiceContext
  routeBaseUrl: string
  routeAuthHeaders: Record<string, string>
  routeWorkspaceId: string
}): Promise<void> {
  const prepareFixture = async (suffix: string) => {
    const editSessionId = `handoff-stale-${suffix}`
    const project = (await createProjectService(input.serviceContext).createProject({
      workspaceId: input.routeWorkspaceId,
      name: `Persisted handoff stale ${suffix}`,
    })).project
    const expectation = await prepareExactPlanningAuthority(
      input.serviceContext,
      project.id,
      editSessionId,
      input.routeWorkspaceId,
    )
    const sourceMediaFixture = await prepareSourceMediaAuthority(
      input.serviceContext,
      input.routeWorkspaceId,
      project.id,
      `handoff-stale-${suffix}`,
    )
    const planBody = createCanonicalPlanBody(
      `planning-handoff-stale-${suffix}`,
      expectation,
      sourceMediaFixture,
    )
    planBody.workspaceId = input.routeWorkspaceId
    const handoffUrl =
      `${input.routeBaseUrl}/v1/projects/${project.id}/edit-sessions/${editSessionId}/canonical-planning-handoff`
    const handoffResponse = await fetch(handoffUrl, {
      method: 'POST',
      headers: { ...input.routeAuthHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({
        workspaceId: input.routeWorkspaceId,
        purpose: 'prepare_canonical_planning_handoff',
        orderedSourceItems: sourceMediaFixture.sourceSequence,
        canonicalPlanComponents: planBody.canonicalPlan.components,
      }),
    })
    assert.equal(handoffResponse.status, 200)
    const envelope = await handoffResponse.json() as {
      data?: { canonicalPlanningHandoff?: Record<string, unknown> }
    }
    const handoff = asRecord(envelope.data?.canonicalPlanningHandoff)
    const {
      planningInputAuthority: _planningInputAuthority,
      sourceMediaAuthority: _sourceMediaAuthority,
      ...planWithoutCallerAuthorities
    } = planBody
    void _planningInputAuthority
    void _sourceMediaAuthority
    return {
      project,
      editSessionId,
      expectation,
      handoffId: String(handoff.handoffId),
      publishUrl:
        `${input.routeBaseUrl}/v1/projects/${project.id}/edit-sessions/${editSessionId}/` +
        `canonical-planning-handoffs/${String(handoff.handoffId)}/publish`,
      publishBody: {
        ...planWithoutCallerAuthorities,
        expectedHandoffHash: String(handoff.handoffHash),
      },
    }
  }

  const stalePreference = await prepareFixture('preference')
  await createExactEditPreferenceService(input.serviceContext).updateCurrent({
    workspaceId: input.routeWorkspaceId,
    projectId: stalePreference.project.id,
    editSessionId: stalePreference.editSessionId,
    expectedRevision: stalePreference.expectation.exactEditPreference.recordRevision,
    patch: { moodStyle: 'energetic' },
    idempotencyKey: 'mutate-persisted-handoff-preference',
  })
  const stalePreferenceResponse = await fetch(stalePreference.publishUrl, {
    method: 'POST',
    headers: {
      ...input.routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'publish-stale-persisted-handoff-preference',
    },
    body: JSON.stringify(stalePreference.publishBody),
  })
  assert.equal(stalePreferenceResponse.status, 409)

  const staleSource = await prepareFixture('source')
  await prepareSourceMediaAuthority(
    input.serviceContext,
    input.routeWorkspaceId,
    staleSource.project.id,
    'handoff-source-authority-advanced',
  )
  const staleSourceResponse = await fetch(staleSource.publishUrl, {
    method: 'POST',
    headers: {
      ...input.routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'publish-stale-persisted-handoff-source',
    },
    body: JSON.stringify(staleSource.publishBody),
  })
  assert.equal(staleSourceResponse.status, 409)

  const tamperedHandoff = await prepareFixture('checksum')
  const scopeHash = sha256AuthorityValue({
    ownerUserId: userId,
    workspaceId: input.routeWorkspaceId,
    projectId: tamperedHandoff.project.id,
    editSessionId: tamperedHandoff.editSessionId,
  })
  const handoffRecordPath = join(
    input.serviceContext.env.localStorageRoot,
    'canonical-planning-handoffs',
    'private-internal-v1',
    `scope-${scopeHash}`,
    `${tamperedHandoff.handoffId}.json`,
  )
  const originalHandoffRecord = await readFile(handoffRecordPath, 'utf8')
  const tamperedRecord = JSON.parse(originalHandoffRecord) as { checksumSha256: string }
  tamperedRecord.checksumSha256 = 'f'.repeat(64)
  try {
    await writeFile(handoffRecordPath, `${JSON.stringify(tamperedRecord)}\n`, 'utf8')
    const tamperedHandoffInspectionResponse = await fetch(
      `${input.routeBaseUrl}/v1/projects/${tamperedHandoff.project.id}/` +
      `edit-sessions/${tamperedHandoff.editSessionId}/canonical-planning-handoffs/` +
      `${tamperedHandoff.handoffId}?workspaceId=${input.routeWorkspaceId}`,
      { headers: input.routeAuthHeaders },
    )
    assert.equal(tamperedHandoffInspectionResponse.status, 409)
    const tamperedHandoffResponse = await fetch(tamperedHandoff.publishUrl, {
      method: 'POST',
      headers: {
        ...input.routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'publish-tampered-persisted-handoff',
      },
      body: JSON.stringify(tamperedHandoff.publishBody),
    })
    assert.equal(tamperedHandoffResponse.status, 409)
  } finally {
    await writeFile(handoffRecordPath, originalHandoffRecord, 'utf8')
  }

  const publishFixture = (fixture: Awaited<ReturnType<typeof prepareFixture>>, key: string) =>
    fetch(fixture.publishUrl, {
      method: 'POST',
      headers: {
        ...input.routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': key,
      },
      body: JSON.stringify(fixture.publishBody),
    })

  const concurrentExact = await prepareFixture('concurrent-exact')
  const [concurrentExactLeft, concurrentExactRight] = await Promise.all([
    publishFixture(concurrentExact, 'publish-concurrent-exact-handoff'),
    publishFixture(concurrentExact, 'publish-concurrent-exact-handoff'),
  ])
  assert.deepEqual(
    [concurrentExactLeft.status, concurrentExactRight.status].sort(),
    [201, 201],
  )
  const concurrentExactEnvelopes = await Promise.all([
    concurrentExactLeft.json(),
    concurrentExactRight.json(),
  ]) as Array<{
    data?: {
      authority?: Record<string, unknown>
      canonicalPlanningHandoff?: Record<string, unknown>
    }
  }>
  const concurrentExactPlanIds = concurrentExactEnvelopes.map((envelope) =>
    asRecord(asRecord(envelope.data?.authority).plan).id)
  assert.equal(new Set(concurrentExactPlanIds).size, 1)
  assert.deepEqual(
    concurrentExactEnvelopes.map((envelope) =>
      asRecord(envelope.data?.canonicalPlanningHandoff).publicationReplayed).sort(),
    [false, true],
  )

  const concurrentCompeting = await prepareFixture('concurrent-competing')
  const concurrentCompetingResponses = await Promise.all([
    publishFixture(concurrentCompeting, 'publish-concurrent-competing-left'),
    publishFixture(concurrentCompeting, 'publish-concurrent-competing-right'),
  ])
  assert.deepEqual(
    concurrentCompetingResponses.map((response) => response.status).sort(),
    [201, 409],
  )
  const competingConflict = concurrentCompetingResponses.find((response) => response.status === 409)
  assert.ok(competingConflict)
  const competingConflictEnvelope = await competingConflict.json() as {
    error?: { details?: { requiredGate?: string } }
  }
  assert.equal(
    competingConflictEnvelope.error?.details?.requiredGate,
    'one_handoff_one_canonical_plan_publication',
  )
}

async function publishCanonicalPlanThroughPersistedHandoffRoute(input: {
  routeBaseUrl: string
  routeAuthHeaders: Record<string, string>
  projectId: string
  editSessionId: string
  planBody: PublishCanonicalEditPlanBody
  idempotencyKey: string
}): Promise<Response> {
  const handoffUrl =
    `${input.routeBaseUrl}/v1/projects/${input.projectId}/edit-sessions/${input.editSessionId}/canonical-planning-handoff`
  const handoffResponse = await fetch(handoffUrl, {
    method: 'POST',
    headers: { ...input.routeAuthHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({
      workspaceId: input.planBody.workspaceId,
      purpose: 'prepare_canonical_planning_handoff',
      orderedSourceItems: input.planBody.canonicalPlan.components.sourceSequence.map((item) => {
        assert.match(String(item.checksumSha256), /^[a-f0-9]{64}$/)
        return {
          sourceSequenceItemId: item.sourceSequenceItemId,
          mediaAssetId: item.mediaAssetId,
          uploadedOrder: item.uploadedOrder,
          checksumSha256: item.checksumSha256,
          required: item.required,
        }
      }),
      canonicalPlanComponents: input.planBody.canonicalPlan.components,
    }),
  })
  assert.equal(
    handoffResponse.status,
    200,
    `Persisted planning handoff preparation failed: ${await handoffResponse.clone().text()}`,
  )
  const handoffEnvelope = await handoffResponse.json() as {
    data?: { canonicalPlanningHandoff?: Record<string, unknown> }
  }
  const handoff = asRecord(handoffEnvelope.data?.canonicalPlanningHandoff)
  const publishUrl =
    `${input.routeBaseUrl}/v1/projects/${input.projectId}/edit-sessions/${input.editSessionId}/` +
    `canonical-planning-handoffs/${String(handoff.handoffId)}/publish`
  return fetch(publishUrl, {
    method: 'POST',
    headers: {
      ...input.routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    },
    body: JSON.stringify({
      workspaceId: input.planBody.workspaceId,
      planningRequestId: input.planBody.planningRequestId,
      ...(input.planBody.revisionAuthority
        ? { revisionAuthority: input.planBody.revisionAuthority }
        : {}),
      canonicalPlan: input.planBody.canonicalPlan,
      expectedHandoffHash: handoff.handoffHash,
    }),
  })
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

function canonicalWorkGraphProgressRoot(input: {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
}): string {
  const tenantHash = sha256ForSmoke(`${input.ownerUserId}\u0000${input.workspaceId}`).slice(0, 32)
  const packageHash = sha256ForSmoke([
    tenantHash,
    input.projectId,
    input.editSessionId,
    input.packageRecordId,
    input.approvedPlanSnapshotId,
  ].join('\u0000'))
  return join(
    input.localStorageRoot,
    'private-internal',
    'canonical-work-graph-runs',
    'v1',
    tenantHash,
    'package-progress',
    packageHash,
  )
}

async function proveAtomicWorkItemCompilation(serviceContext: ServiceContext): Promise<void> {
  const targetWorkspaceId = 'workspace-planning-binding-integration'
  const editSessionId = 'edit-session-atomic-work-item-compilation'
  const project = (await createProjectService(serviceContext).createProject({
    workspaceId: targetWorkspaceId,
    name: 'Atomic work-item compilation integration',
  })).project
  const planningInputAuthority = await prepareExactPlanningAuthority(
    serviceContext,
    project.id,
    editSessionId,
    targetWorkspaceId,
  )
  const sourceFixture = await prepareSourceMediaAuthority(
    serviceContext,
    targetWorkspaceId,
    project.id,
    'atomic-work-item-compilation',
  )
  const body = createCanonicalPlanBody(
    'planning-atomic-work-item-compilation',
    planningInputAuthority,
    sourceFixture,
  )
  body.workspaceId = targetWorkspaceId
  const sourceTrim = body.canonicalPlan.workItems.find((workItem) =>
    workItem.workItemKey === 'source-trim')
  assert.ok(sourceTrim)
  sourceTrim.workerClass = 'authority_worker'
  sourceTrim.executionInput = { operation: 'validate_approved_source_trim_plan' }
  sourceTrim.expectedOutputs = [{
    outputKey: 'source-trim-validation-evidence',
    artifactType: 'source_trim_validation_evidence',
    assetRole: 'qa',
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'application/json',
    segmentIds: ['segment-1', 'segment-2'],
    timingIds: ['master-timing-plan'],
    rendererLayerIds: [],
  }]
  sourceTrim.approvedToolIds = []
  sourceTrim.maximumCreditBudget = 0
  const d3OperationId = 'tool.d3.render_chart_or_diagram.v1'
  const echartsOperationId = 'tool.echarts.render_standard_chart.v1'
  const chartPayload = {
    width: 720,
    height: 405,
    title: 'Atomic chart compilation',
    xAxisLabel: 'Stage',
    yAxisLabel: 'Score',
    theme: 'light',
    data: [
      { label: 'Plan', value: 18 },
      { label: 'Execute', value: 27 },
      { label: 'Review', value: 33 },
    ],
  }
  body.canonicalPlan.workItems.splice(2, 0, {
    workItemKey: 'grouped-chart-tools',
    workItemType: 'render_chart_asset',
    workerClass: 'planning_group_only',
    executionInput: {
      approvedToolOperationIds: [d3OperationId, echartsOperationId],
      canonicalAtomicExecution: {
        schemaVersion: CANONICAL_ATOMIC_EXECUTION_DESCRIPTOR_VERSION,
        steps: [
          {
            stepKey: 'd3-chart',
            toolId: 'd3',
            operationId: d3OperationId,
            workerClass: 'controlled_graphics_worker',
            expectedOutputKey: 'd3-chart-svg',
            executionInput: {
              operation: 'render_approved_chart',
              approvedToolOperationIds: [d3OperationId],
              structuredPayload: chartPayload,
            },
            dependencyStepKeys: [],
            maximumCreditBudget: 1,
          },
          {
            stepKey: 'echarts-chart',
            toolId: 'echarts',
            operationId: echartsOperationId,
            workerClass: 'controlled_graphics_worker',
            expectedOutputKey: 'echarts-chart-svg',
            executionInput: {
              operation: 'render_approved_chart',
              approvedToolOperationIds: [echartsOperationId],
              structuredPayload: chartPayload,
            },
            dependencyStepKeys: ['d3-chart'],
            maximumCreditBudget: 1,
          },
        ],
      },
    },
    sourceSequenceItemIds: [],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [
      {
        outputKey: 'd3-chart-svg',
        artifactType: 'controlled_chart_svg',
        assetRole: 'generated',
        required: true,
        previewPlaceholderAllowed: false,
        contentType: 'image/svg+xml',
        segmentIds: ['segment-1'],
        timingIds: ['master-timing-plan'],
        rendererLayerIds: ['d3-chart-layer'],
      },
      {
        outputKey: 'echarts-chart-svg',
        artifactType: 'controlled_chart_svg',
        assetRole: 'generated',
        required: true,
        previewPlaceholderAllowed: false,
        contentType: 'image/svg+xml',
        segmentIds: ['segment-1'],
        timingIds: ['master-timing-plan'],
        rendererLayerIds: ['echarts-chart-layer'],
      },
    ],
    dependencyKeys: ['snapshot-validation'],
    approvedToolIds: ['d3', 'echarts'],
    providerExecutionMode: 'none',
    fallbackPolicy: { groupedPlannerNode: true },
    maxAttempts: 2,
    attemptTimeoutSeconds: 300,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 2,
    required: true,
  })
  const finalQa = body.canonicalPlan.workItems.find((workItem) =>
    workItem.workItemKey === 'final-qa')
  assert.ok(finalQa)
  finalQa.executionInput = { operation: 'future_final_qa_capability' }
  finalQa.approvedToolIds = []
  finalQa.maximumCreditBudget = 0
  finalQa.dependencyKeys.push('grouped-chart-tools')
  body.canonicalPlan.components.toolStrategyPlan = {
    toolIds: ['ffmpeg', 'ffprobe', 'd3', 'echarts'],
  }

  const preview = compileCanonicalWorkItems(body.canonicalPlan.workItems)
  assert.equal(preview.evidence.sourceWorkItemCount, 5)
  assert.equal(preview.evidence.compiledWorkItemCount, 6)
  assert.equal(preview.evidence.decomposedSourceWorkItemCount, 1)
  assert.equal(preview.evidence.mappings[0]?.steps.length, 2)
  const previewD3 = preview.workItems.find((workItem) =>
    workItem.approvedToolIds[0] === 'd3')
  const previewEcharts = preview.workItems.find((workItem) =>
    workItem.approvedToolIds[0] === 'echarts')
  assert.ok(previewD3)
  assert.ok(previewEcharts)
  assert.deepEqual(previewD3.expectedOutputs.map((output) => output.outputKey), ['d3-chart-svg'])
  assert.deepEqual(previewEcharts.expectedOutputs.map((output) => output.outputKey), ['echarts-chart-svg'])
  assert.deepEqual(previewEcharts.dependencyKeys.sort(), [
    'snapshot-validation',
    previewD3.workItemKey,
  ].sort())
  const previewFinalQa = preview.workItems.find((workItem) => workItem.workItemKey === 'final-qa')
  assert.ok(previewFinalQa)
  assert.deepEqual(previewFinalQa.dependencyKeys.sort(), [
    'source-trim',
    previewEcharts.workItemKey,
  ].sort())

  const missingDescriptor = structuredClone(body.canonicalPlan.workItems)
  const missingDescriptorGroup = missingDescriptor.find((workItem) =>
    workItem.workItemKey === 'grouped-chart-tools')!
  delete missingDescriptorGroup.executionInput.canonicalAtomicExecution
  await expectApiError(
    async () => compileCanonicalWorkItems(missingDescriptor),
    'TOOL_NOT_READY',
    'Grouped planner work must fail before publication without an explicit atomic mapping.',
  )
  const changedBudget = structuredClone(body.canonicalPlan.workItems)
  const changedBudgetGroup = changedBudget.find((workItem) =>
    workItem.workItemKey === 'grouped-chart-tools')!
  const changedBudgetDescriptor = asRecord(
    changedBudgetGroup.executionInput.canonicalAtomicExecution,
  )
  const changedBudgetSteps = changedBudgetDescriptor.steps as Record<string, unknown>[]
  changedBudgetSteps[0]!.maximumCreditBudget = 0
  await expectApiError(
    async () => compileCanonicalWorkItems(changedBudget),
    'VALIDATION_FAILED',
    'Atomic compilation must conserve the exact approved work-item budget.',
  )
  const changedOutputMapping = structuredClone(body.canonicalPlan.workItems)
  const changedOutputGroup = changedOutputMapping.find((workItem) =>
    workItem.workItemKey === 'grouped-chart-tools')!
  const changedOutputDescriptor = asRecord(
    changedOutputGroup.executionInput.canonicalAtomicExecution,
  )
  const changedOutputSteps = changedOutputDescriptor.steps as Record<string, unknown>[]
  changedOutputSteps[1]!.expectedOutputKey = 'd3-chart-svg'
  await expectApiError(
    async () => compileCanonicalWorkItems(changedOutputMapping),
    'VALIDATION_FAILED',
    'Atomic compilation must map every approved output exactly once.',
  )
  const providerBackedGroup = structuredClone(body.canonicalPlan.workItems)
  const providerBackedWorkItem = providerBackedGroup.find((workItem) =>
    workItem.workItemKey === 'grouped-chart-tools')!
  providerBackedWorkItem.approvedProviderRoute = 'wan'
  providerBackedWorkItem.providerExecutionMode = 'primary'
  await expectApiError(
    async () => compileCanonicalWorkItems(providerBackedGroup),
    'TOOL_NOT_READY',
    'Atomic private tool compilation must not authorize provider-backed grouped work.',
  )
  const terminalGroupedWork = structuredClone(body.canonicalPlan.workItems)
  const terminalGroupedWorkItem = terminalGroupedWork.find((workItem) =>
    workItem.workItemKey === 'grouped-chart-tools')!
  terminalGroupedWorkItem.workItemType = 'render_final_export'
  await expectApiError(
    async () => compileCanonicalWorkItems(terminalGroupedWork),
    'TOOL_NOT_READY',
    'Terminal render authority must remain one unambiguous canonical job.',
  )

  const service = createEditPlanningAuthorityService(serviceContext)
  const published = await service.publishCanonicalPlan({
    ...body,
    projectId: project.id,
    editSessionId,
    idempotencyKey: 'publish-atomic-work-item-compilation',
  })
  const authority = asRecord(published.authority)
  const plan = asRecord(authority.plan)
  const estimate = asRecord(authority.estimate)
  const publishedWorkItems = authority.workItems as Record<string, unknown>[]
  assert.equal(publishedWorkItems.length, 6)
  assert.equal(publishedWorkItems.some((workItem) =>
    workItem.workItemKey === 'grouped-chart-tools'), false)
  const publishedD3 = publishedWorkItems.find((workItem) =>
    (workItem.approvedToolIds as string[])[0] === 'd3')
  const publishedEcharts = publishedWorkItems.find((workItem) =>
    (workItem.approvedToolIds as string[])[0] === 'echarts')
  assert.ok(publishedD3)
  assert.ok(publishedEcharts)
  assert.equal((publishedD3.approvedToolIds as string[]).length, 1)
  assert.equal((publishedEcharts.approvedToolIds as string[]).length, 1)

  const compilationRef = asRecord(asRecord(plan.componentRefs).canonicalWorkItemCompilation)
  const persistedCompilation = asRecord(await readPrivateAuthorityJsonBlob({
    localStorageRoot: serviceContext.env.localStorageRoot,
    ref: {
      sha256: String(compilationRef.sha256),
      byteLength: Number(compilationRef.byteLength),
    },
  }))
  assert.equal(persistedCompilation.decomposedSourceWorkItemCount, 1)
  assert.equal(persistedCompilation.compiledWorkItemCount, 6)
  assert.equal(typeof persistedCompilation.compilationHash, 'string')

  const approved = await service.approveAndFundCanonicalPlan({
    workspaceId: targetWorkspaceId,
    editPlanId: String(plan.id),
    expectedAuthorityRevision: Number(authority.authorityRevision),
    expectedPlanHash: String(plan.planHash),
    expectedEstimateHash: String(estimate.estimateHash),
    idempotencyKey: 'approve-atomic-work-item-compilation',
  })
  const approvedAuthority = asRecord(approved.authority)
  const snapshot = asRecord(approvedAuthority.snapshot)
  const approvedJobs = approvedAuthority.jobs as Record<string, unknown>[]
  assert.equal(approvedJobs.length, 6)
  const d3Job = approvedJobs.find((job) => job.workItemKey === publishedD3.workItemKey)
  const echartsJob = approvedJobs.find((job) => job.workItemKey === publishedEcharts.workItemKey)
  assert.ok(d3Job)
  assert.ok(echartsJob)
  assert.equal((echartsJob.dependencyJobIds as string[]).includes(String(d3Job.id)), true)
  const finalQaWorkItem = publishedWorkItems.find((workItem) => workItem.workItemKey === 'final-qa')!
  const finalQaJob = approvedJobs.find((job) => job.workItemKey === finalQaWorkItem.workItemKey)!
  assert.equal((finalQaJob.dependencyJobIds as string[]).includes(String(echartsJob.id)), true)

  const executionPackage = (await createCanonicalEditExecutionPackageService(
    serviceContext,
  ).createPackage({
    workspaceId: targetWorkspaceId,
    approvedPlanSnapshotId: String(snapshot.snapshotId),
    expectedSnapshotHash: String(snapshot.snapshotHash),
    purpose: 'private_internal_execution_handoff',
    idempotencyKey: 'package-atomic-work-item-compilation',
  })).approvedEditExecutionPackage
  assert.equal(executionPackage.jobs.length, 6)
  assert.equal(executionPackage.approvedToolIds.includes('d3'), true)
  assert.equal(executionPackage.approvedToolIds.includes('echarts'), true)
  assert.equal(executionPackage.jobs.every((job) =>
    job.approvedToolOperationIds.length <= 1), true)
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
