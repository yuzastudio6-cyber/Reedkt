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
import {
  CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_BINDING_VERSION,
  CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_OPERATION,
  assertCanonicalMotionStudioRemotionDependencyArtifact,
  canonicalMotionStudioRemotionPreviewBindingSchema,
  canonicalMotionStudioTimingAuthorityDigest,
} from '../edit-architecture/canonical-motion-studio-remotion-preview-authority'
import {
  CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION,
  CANONICAL_VISUAL_CALIBRATION_PROVIDER_PLANNING_OPERATION,
  createCanonicalVisualCalibrationObjectiveQaPlanningPayload,
  createCanonicalVisualCalibrationProviderPlanningPayload,
} from '../edit-architecture/canonical-visual-calibration-objective-qa-authority'
import { OFFLINE_MEDIA_BINARY_OPERATIONS } from
  '../tool-execution/media-binary-execution'
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
import {
  buildCanonicalIdeaFirstSourceBindingManifestCandidate,
} from '../services/canonical-motion-studio-storytelling-production-authority-service'
import { buildCurrentPlanningInputAuthorityExpectation } from '../services/planning-input-authority-binding-service'
import { createUploadService } from '../services/upload-service'
import { createCanonicalEditExecutionPackageService } from '../services/canonical-edit-execution-package-service'
import { withCanonicalExecutionDomainLock } from '../services/canonical-execution-domain-lock'
import { createCanonicalWorkerLeaseAuthorityService } from '../services/canonical-worker-lease-authority-service'
import { withCanonicalWorkGraphPackageLock } from '../services/canonical-work-graph-package-lock'
import { readPrivateCanonicalWorkerLeaseAggregate } from '../services/private-canonical-worker-lease-store'
import { createCanonicalPrivateToolDispatchAuthorityService } from '../services/canonical-private-tool-dispatch-authority-service'
import { readPrivateArtifactQaAggregate } from '../services/private-artifact-qa-authority-store'
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
import { readPrivateUploadMediaAuthorityAggregate } from '../services/private-upload-media-authority-store'
import { clearLocalProjectMemoryForSmoke, createProjectService } from '../services/project-service'
import type { ServiceContext } from '../types'
import {
  PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
  type PublishCanonicalEditPlanBody,
} from '../validation/edit-planning-authority-schemas'
import type { PlanningInputAuthorityExpectation } from '../validation/planning-input-authority-binding-schemas'
import type { SourceMediaAuthorityExpectation } from '../validation/source-media-authority-schemas'
import {
  CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION,
  canonicalMotionStudioStorytellingProductionAuthoritySchema,
  type CanonicalMotionStudioStorytellingProductionAuthority,
} from '../validation/canonical-motion-studio-storytelling-production-authority-schemas'
import { buildProfessionalExportCreditCoverage } from '../../src/lib/professional-export-policy'
import {
  projectCanonicalStorytellingStyleAuthority,
  type CanonicalStorytellingStylePlanReviewSource,
} from '../../src/lib/canonical-planning-draft'
import {
  CANONICAL_PRIVATE_TOOL_DISPATCH_RECORD_VERSION,
  type CanonicalPrivateToolDispatchRecord,
} from '../validation/canonical-private-tool-dispatch-schemas'
import { canonicalEditJourneyResponseSchema } from '../validation/canonical-edit-journey-schemas'
import { canonicalPlanApprovalReceiptSchema } from '../validation/canonical-plan-approval-schemas'
import { canonicalExecutionPackageRequestReceiptSchema } from '../validation/canonical-execution-package-request-schemas'
import { canonicalPrivateEditPreparationReceiptSchema } from '../validation/canonical-private-edit-preparation-schemas'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'
import { VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE } from
  './fixtures/visual-calibration-reference-frame-fixture'

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
  { workspaceId: 'workspace-storytelling-style-authority', userId, role: 'owner' },
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
  'edit-session-stale-export-duration',
  'edit-session-tampered-export-cost',
  'edit-session-cycle',
  'edit-session-unknown-tool',
  'edit-session-missing-tool-operation',
  'edit-session-spoofed-tool-operation',
  'edit-session-policy-blocked-tool',
  'edit-session-undeclared-tool-authority',
  'edit-session-missing-exact-operation-authority',
  'edit-session-unproven-required-tool',
  'edit-session-invalid-tool-payload',
  'edit-session-invalid-tool-binding',
  'edit-session-invalid-tool-output-content-type',
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
const expectedApprovedMaximumCredits = Number(publishedEstimate.approvedMaximumCredits)
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
assert.equal(
  persistedToolExecutionAuthority.schemaVersion,
  'canonical-tool-execution-authority-v2',
)
assert.match(String(persistedToolExecutionAuthority.authorityHash), /^[a-f0-9]{64}$/)
assert.equal(asRecord(persistedToolExecutionAuthority.summary).workGraphToolCount, 4)
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
  ['ffmpeg', 'ffprobe', 'libass', 'remotion'],
)
assert.ok(persistedToolEntries.every((entry) =>
  String(entry.stableToolIdentity).startsWith('reeditpro.tool.') &&
  /^[a-f0-9]{64}$/.test(String(entry.identityHash)) &&
  /^[a-f0-9]{64}$/.test(String(entry.proofHash)) &&
  asRecord(entry.readiness).privateInternalEndToEndReady === true &&
  asRecord(entry.readiness).privateInternalJobAdapterReady === true))
const persistedResourcePlacementAuthority = asRecord(
  persistedToolExecutionAuthority.resourcePlacementAuthority,
)
const persistedResourcePlacements =
  persistedResourcePlacementAuthority.placements as Record<string, unknown>[]
assert.equal(
  persistedResourcePlacementAuthority.schemaVersion,
  'canonical-approved-work-graph-resource-placement-authority-v1',
)
assert.equal(persistedResourcePlacements.length, 5)
assert.equal(
  asRecord(persistedResourcePlacementAuthority.boundaries)
    .approvedSnapshotHashBindingRequired,
  true,
)
assert.ok(persistedResourcePlacements.every((placement) =>
  /^[a-f0-9]{64}$/.test(String(placement.placementHash))))
const toolPayloadAuthorityRef = asRecord(
  publishedComponentRefs.canonicalToolPayloadAuthority,
)
const persistedToolPayloadAuthority = asRecord(await readPrivateAuthorityJsonBlob({
  localStorageRoot,
  ref: {
    sha256: String(toolPayloadAuthorityRef.sha256),
    byteLength: Number(toolPayloadAuthorityRef.byteLength),
  },
}))
assert.equal(
  persistedToolPayloadAuthority.source,
  'server_exact_runner_payload_reconciliation',
)
assert.match(String(persistedToolPayloadAuthority.authorityHash), /^[a-f0-9]{64}$/)
assert.deepEqual(
  (persistedToolPayloadAuthority.validatedWorkItems as Record<string, unknown>[])
    .map((entry) => entry.validatorFamily),
  ['libass_caption', 'remotion_final_composition', 'media_ffprobe', 'media_ffmpeg'],
)
assert.equal(asRecord(persistedToolPayloadAuthority.summary).validatedWorkItemCount, 4)
assert.equal(asRecord(persistedToolPayloadAuthority.summary).validationRunsBeforeApproval, true)

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
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-stale-export-duration', {
    planningRequestId: 'planning-stale-export-duration',
    idempotencyKey: 'publish-stale-export-duration',
    mutateBody(body) {
      body.canonicalPlan.components.confirmedSettings.professionalExportCoverage.durationSeconds = 10
    },
  })),
  'VALIDATION_FAILED',
  'The 4K estimate duration must match the canonical frame timing.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-tampered-export-cost', {
    planningRequestId: 'planning-tampered-export-cost',
    idempotencyKey: 'publish-tampered-export-cost',
    mutateBody(body) {
      const coverage = body.canonicalPlan.components.confirmedSettings.professionalExportCoverage
      coverage.lowInternalToolCostCredits += 1
      coverage.expectedInternalToolCostCredits += 1
      coverage.maximumInternalToolCostCredits += 1
      const exportLine = body.canonicalPlan.estimate.lineItems.find((line) =>
        line.label === '4K UHD render and export ceiling')
      assert.ok(exportLine)
      exportLine.estimatedCredits = coverage.maximumInternalToolCostCredits
    },
  })),
  'VALIDATION_FAILED',
  'The 4K estimate cost must be derived from the versioned rate card and canonical timing.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-cycle', {
    planningRequestId: 'planning-cycle',
    idempotencyKey: 'publish-cycle',
    mutateBody(body) {
      body.canonicalPlan.workItems[1]!.dependencyKeys = ['final-export']
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
        toolIds: ['ffmpeg', 'ffprobe', 'libass', 'remotion'],
        exactOperationIds: [
          'tool.ffprobe.inspect_approved_media.v1',
          'tool.libass.render_approved_caption_track.v1',
          'tool.remotion.render_approved_composition.v1',
        ],
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
        toolIds: ['sam2', 'ffprobe', 'libass', 'remotion'],
        exactOperationIds: [
          'tool.sam2.segment_and_track_subject.v1',
          'tool.ffprobe.inspect_approved_media.v1',
          'tool.libass.render_approved_caption_track.v1',
          'tool.remotion.render_approved_composition.v1',
        ],
      }
    },
  })),
  'TOOL_NOT_READY',
  'A required tool without canonical lifecycle and job-adapter evidence must not enter an approvable plan.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-invalid-tool-payload', {
    planningRequestId: 'planning-invalid-tool-payload',
    idempotencyKey: 'publish-invalid-tool-payload',
    mutateBody(body) {
      const sourceTrim = body.canonicalPlan.workItems.find((workItem) =>
        workItem.workItemKey === 'source-trim')
      assert.ok(sourceTrim)
      ;(sourceTrim.executionInput.structuredPayload as Record<string, unknown>).allowUnreviewedCodec = true
    },
  })),
  'TOOL_NOT_READY',
  'A schema-valid plan must fail before persistence when its exact runner payload is invalid.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(project.id, 'edit-session-invalid-tool-binding', {
    planningRequestId: 'planning-invalid-tool-binding',
    idempotencyKey: 'publish-invalid-tool-binding',
    mutateBody(body) {
      const sourceTrim = body.canonicalPlan.workItems.find((workItem) =>
        workItem.workItemKey === 'source-trim')
      assert.ok(sourceTrim)
      sourceTrim.dependencyKeys = ['snapshot-validation']
    },
  })),
  'TOOL_NOT_READY',
  'A runner payload with unsupported source, cleanup, or dependency binding must fail before approval.',
)

await expectApiError(
  () => service.publishCanonicalPlan(createPublishInput(
    project.id,
    'edit-session-invalid-tool-output-content-type',
    {
      planningRequestId: 'planning-invalid-tool-output-content-type',
      idempotencyKey: 'publish-invalid-tool-output-content-type',
      mutateBody(body) {
        const sourceTrim = body.canonicalPlan.workItems.find((workItem) =>
          workItem.workItemKey === 'source-trim')
        assert.ok(sourceTrim)
        sourceTrim.expectedOutputs[0]!.contentType = 'video/mp4'
      },
    },
  )),
  'TOOL_NOT_READY',
  'A tool output content type without exact private artifact evidence must fail before approval.',
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
assert.equal(reservation.reservedCredits, expectedApprovedMaximumCredits)
assert.match(String(snapshot.snapshotHash), /^[a-f0-9]{64}$/)
assert.equal(snapshot.schemaVersion, 'private-edit-authority-approved-snapshot-v3')
assert.match(String(snapshot.approvedAssetManifestHash), /^[a-f0-9]{64}$/)
assert.match(String(asRecord(snapshot.approvedAssetManifestRef).sha256), /^[a-f0-9]{64}$/)
assert.match(String(snapshot.approvedSourceAssetManifestHash), /^[a-f0-9]{64}$/)
assert.match(String(asRecord(snapshot.approvedSourceAssetManifestRef).sha256), /^[a-f0-9]{64}$/)
assert.equal('sourcePlan' in snapshot, false, 'Snapshot must remain a compact manifest, not a duplicated multi-megabyte source plan.')
assert.ok(Buffer.byteLength(stableAuthorityStringify(snapshot), 'utf8') < 64 * 1024)
assert.equal(jobs.length, 5)
assert.equal(jobs.filter((job) => job.status === 'ready').length, 3)
assert.equal(jobs.filter((job) => job.status === 'blocked').length, 2)
assert.ok(jobs.every((job) => Array.isArray(job.expectedAssetIds) && job.expectedAssetIds.length === 1))
const loadedExecutionAuthority = await service.loadApprovedExecutionAuthority(String(snapshot.snapshotId), workspaceId)
assert.equal(loadedExecutionAuthority.assetManifest.entries.length, 5)
assert.equal(loadedExecutionAuthority.assetManifest.requiredAssetCount, 5)
assert.equal(loadedExecutionAuthority.assetManifest.manifestHash, snapshot.approvedAssetManifestHash)
assert.equal(loadedExecutionAuthority.sourceAssetManifest.bindings.length, 2)
assert.equal(loadedExecutionAuthority.sourceAssetManifest.requiredBindingCount, 2)
assert.equal(loadedExecutionAuthority.sourceAssetManifest.manifestHash, snapshot.approvedSourceAssetManifestHash)
assert.equal(loadedExecutionAuthority.toolExecutionAuthority.authorityHash, persistedToolExecutionAuthority.authorityHash)
assert.equal(
  loadedExecutionAuthority.toolExecutionAuthority.resourcePlacementAuthority.authorityHash,
  persistedResourcePlacementAuthority.authorityHash,
)
assert.equal(loadedExecutionAuthority.toolPayloadAuthority.authorityHash, persistedToolPayloadAuthority.authorityHash)
assert.deepEqual(
  loadedExecutionAuthority.toolExecutionAuthority.tools.map((tool) => tool.canonicalToolId),
  ['ffmpeg', 'ffprobe', 'libass', 'remotion'],
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
assert.equal(executionPackage.plannedAssetCount, 5)
assert.equal(executionPackage.requiredPlannedAssetCount, 5)
assert.equal(executionPackage.approvedSourceAssetManifestHash, snapshot.approvedSourceAssetManifestHash)
assert.equal(executionPackage.sourceBindingCount, 2)
assert.equal(executionPackage.requiredSourceBindingCount, 2)
assert.equal(JSON.stringify(executionPackage).includes('bucketName'), false)
assert.equal(JSON.stringify(executionPackage).includes('objectPath'), false)
assert.deepEqual(executionPackage.jobs.map((job) => job.id).sort(), jobs.map((job) => String(job.id)).sort())
assert.deepEqual(executionPackage.approvedToolIds.sort(), ['ffmpeg', 'ffprobe', 'libass', 'remotion'])
assert.deepEqual(executionPackage.approvedToolOperationIds, [
  'tool.ffmpeg.execute_approved_media_recipe.v1',
  'tool.ffprobe.inspect_approved_media.v1',
  'tool.libass.render_approved_caption_track.v1',
  'tool.remotion.render_approved_composition.v1',
])
assert.equal(executionPackage.toolOperationBindingCount, 4)
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
assert.equal(packagedLeft.toolCapabilityManifest.operationBindingCount, 4)
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
assert.equal(packagedLeft.toolCapabilityManifest.tools.length, 4)
assert.equal(
  packagedLeft.toolExecutionAuthority.resourcePlacementAuthority.authorityHash,
  persistedResourcePlacementAuthority.authorityHash,
)

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
assert.equal(aggregate.jobs.length, 5)
assert.equal(aggregate.executionPackages.length, 1)
assert.equal(aggregate.wallet.availableCredits, 10_000 - expectedApprovedMaximumCredits)
assert.equal(aggregate.wallet.reservedCredits, expectedApprovedMaximumCredits)
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

const toolPayloadAuthoritySha = String(toolPayloadAuthorityRef.sha256)
const toolPayloadAuthorityPath = join(
  localStorageRoot,
  'edit-authority',
  'blobs',
  'sha256',
  toolPayloadAuthoritySha.slice(0, 2),
  `${toolPayloadAuthoritySha}.json`,
)
const originalToolPayloadAuthorityEnvelope = await readFile(toolPayloadAuthorityPath, 'utf8')
try {
  const tamperedEnvelope = JSON.parse(originalToolPayloadAuthorityEnvelope) as {
    value: { validatedWorkItems: Array<{ structuredPayloadHash: string }> }
  }
  tamperedEnvelope.value.validatedWorkItems[0]!.structuredPayloadHash = '0'.repeat(64)
  await writeFile(toolPayloadAuthorityPath, `${JSON.stringify(tamperedEnvelope)}\n`, 'utf8')
  await expectApiError(
    () => service.loadApprovedExecutionAuthority(String(snapshot.snapshotId), workspaceId),
    'VALIDATION_FAILED',
    'Tampered exact runner payload authority must fail before execution packaging.',
  )
} finally {
  await writeFile(toolPayloadAuthorityPath, originalToolPayloadAuthorityEnvelope, 'utf8')
}

await provePreferenceAndBriefCanonicalBinding(context)
await proveAtomicWorkItemCompilation(context)
await proveCanonicalStorytellingStyleAuthority(context)
await proveCanonicalIdeaFirstStorytellingProductionAuthority(context)

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
  const revisionPlanPresentationUrl =
    `${routeBaseUrl}/v1/projects/${routeProjectId}/edit-sessions/route-edit-session/` +
    'canonical-revision-plan-presentations'
  const unauthenticatedRevisionPresentation = await fetch(
    revisionPlanPresentationUrl,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    },
  )
  assert.equal(unauthenticatedRevisionPresentation.status, 401)
  const malformedRevisionPresentation = await fetch(
    revisionPlanPresentationUrl,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'malformed-revision-plan-presentation',
      },
      body: JSON.stringify({}),
    },
  )
  assert.equal(malformedRevisionPresentation.status, 400)

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
  const exactPreferenceBeforeRejectedHandoff = await createExactEditPreferenceService(context).getCurrent(
    routeWorkspaceId,
    routeProjectId,
    'route-edit-session',
  )
  assert.ok(exactPreferenceBeforeRejectedHandoff.preferenceRecord)
  const mismatchedPreferenceHandoffResponse = await fetch(planningHandoffUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({
      ...planningHandoffBody,
      canonicalPlanComponents: {
        ...planningHandoffBody.canonicalPlanComponents,
        confirmedSettings: {
          ...planningHandoffBody.canonicalPlanComponents.confirmedSettings,
          targetPlatform: 'youtube',
        },
      },
    }),
  })
  assert.equal(mismatchedPreferenceHandoffResponse.status, 409)
  const exactPreferenceAfterRejectedHandoff = await createExactEditPreferenceService(context).getCurrent(
    routeWorkspaceId,
    routeProjectId,
    'route-edit-session',
  )
  assert.equal(
    exactPreferenceAfterRejectedHandoff.preferenceRecord?.recordRevision,
    exactPreferenceBeforeRejectedHandoff.preferenceRecord.recordRevision,
    'A rejected preference-mismatched handoff must not promote source or frame evidence.',
  )
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
  const preHandoffPlanningExpectation = requirePlanningInputExpectation('route-edit-session')
  const handoffPlanningExpectation = routePlanningHandoff.planningInputAuthority as PlanningInputAuthorityExpectation
  assert.equal(
    handoffPlanningExpectation.exactEditPreference.recordRevision,
    preHandoffPlanningExpectation.exactEditPreference.recordRevision + 1,
    'Handoff preparation must promote verified source/frame evidence into exact preference authority before binding it.',
  )
  assert.equal(
    handoffPlanningExpectation.exactEditPreference.preferenceRevision,
    preHandoffPlanningExpectation.exactEditPreference.preferenceRevision,
  )
  assert.equal(
    handoffPlanningExpectation.exactEditPreference.preferenceFingerprintSha256,
    preHandoffPlanningExpectation.exactEditPreference.preferenceFingerprintSha256,
  )
  assert.deepEqual(handoffPlanningExpectation.preferenceApplication, preHandoffPlanningExpectation.preferenceApplication)
  assert.deepEqual(handoffPlanningExpectation.editBrief, preHandoffPlanningExpectation.editBrief)
  planningInputExpectations.set('route-edit-session', handoffPlanningExpectation)
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
  const planPresentationUrl =
    `${routeBaseUrl}/v1/projects/${routeProjectId}/edit-sessions/route-edit-session/` +
    `canonical-planning-handoffs/${String(routePlanningHandoff.handoffId)}/plan-presentations`
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
  const unauthenticatedPlanPresentation = await fetch(planPresentationUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(persistedHandoffPublishBody),
  })
  assert.equal(unauthenticatedPlanPresentation.status, 401)
  const crossUserPlanPresentation = await fetch(planPresentationUrl, {
    method: 'POST',
    headers: {
      authorization: 'Bearer verified-other-authority-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify(persistedHandoffPublishBody),
  })
  assert.equal(crossUserPlanPresentation.status, 404)
  const [publishResponse, concurrentPublishResponse] = await Promise.all([
    fetch(planPresentationUrl, {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(persistedHandoffPublishBody),
    }),
    fetch(planPresentationUrl, {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(persistedHandoffPublishBody),
    }),
  ])
  assert.equal(publishResponse.status, 201)
  assert.equal(concurrentPublishResponse.status, 201)
  const publishEnvelope = await publishResponse.json() as {
    data?: { canonicalPlanPublicationRequest?: Record<string, unknown> }
  }
  const publishedPublicationRequest = asRecord(
    publishEnvelope.data?.canonicalPlanPublicationRequest,
  )
  const concurrentPublishEnvelope = await concurrentPublishResponse.json() as {
    data?: { canonicalPlanPublicationRequest?: Record<string, unknown> }
  }
  assert.deepEqual(
    concurrentPublishEnvelope.data?.canonicalPlanPublicationRequest,
    publishedPublicationRequest,
    'Concurrent plan-presentation requests must converge on one exact published candidate.',
  )
  assert.equal(publishedPublicationRequest.publicationStatus, 'published')
  const publishedPlanProjection = asRecord(publishedPublicationRequest.publication)
  assert.equal(
    publishedPlanProjection.planStatus,
    'presented',
  )
  assert.equal(publishedPublicationRequest.requestBodyReturned, false)
  const routePlanAuthorityResponse = await fetch(
    `${routeBaseUrl}/v1/edit-plans/${String(publishedPlanProjection.planId)}/authority?workspaceId=${routeWorkspaceId}`,
    { headers: routeAuthHeaders },
  )
  assert.equal(routePlanAuthorityResponse.status, 200)
  const routePlanAuthorityEnvelope = await routePlanAuthorityResponse.json() as {
    data?: { authority?: Record<string, unknown> }
  }
  const routePublishedAuthority = asRecord(routePlanAuthorityEnvelope.data?.authority)
  const routePlan = asRecord(routePublishedAuthority.plan)
  const routeEstimate = asRecord(routePublishedAuthority.estimate)
  assert.equal(routePlan.status, 'presented')
  assert.equal(routePlan.id, publishedPlanProjection.planId)
  assert.equal(routePlan.planHash, publishedPlanProjection.planHash)
  assert.equal('snapshot' in routePublishedAuthority, false)
  assert.equal('jobs' in routePublishedAuthority, false)
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
  assert.equal(
    asRecord(planApprovalJourney.journey.nextAction).routeTemplate,
    `/v1/edit-plans/${String(routePlan.id)}/canonical-approval`,
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
  const persistedHandoffPublishReplay = await fetch(planPresentationUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
    },
    body: JSON.stringify(persistedHandoffPublishBody),
  })
  assert.equal(persistedHandoffPublishReplay.status, 201)
  const persistedHandoffPublishReplayEnvelope = await persistedHandoffPublishReplay.json() as {
    data?: { canonicalPlanPublicationRequest?: Record<string, unknown> }
  }
  assert.deepEqual(
    persistedHandoffPublishReplayEnvelope.data?.canonicalPlanPublicationRequest,
    publishedPublicationRequest,
    'Exact plan-presentation replay must return the existing published candidate inspection.',
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

  const canonicalApprovalUrl =
    `${routeBaseUrl}/v1/edit-plans/${String(routePlan.id)}/canonical-approval`
  const canonicalApprovalBody = {
    workspaceId: routeWorkspaceId,
    expectedProjectId: routeProjectId,
    expectedEditSessionId: 'route-edit-session',
    expectedPlanVersion: routePlan.planVersion,
    expectedPlanHash: routePlan.planHash,
    expectedEstimateId: routeEstimate.id,
    expectedEstimateHash: routeEstimate.estimateHash,
    expectedMaximumCredits: routeEstimate.approvedMaximumCredits,
  }
  const unauthenticatedCanonicalApproval = await fetch(canonicalApprovalUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(canonicalApprovalBody),
  })
  assert.equal(unauthenticatedCanonicalApproval.status, 401)
  const substitutedCanonicalApproval = await fetch(canonicalApprovalUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({ ...canonicalApprovalBody, expectedEstimateHash: 'f'.repeat(64) }),
  })
  assert.equal(substitutedCanonicalApproval.status, 409)
  const [approveResponse, concurrentApproveResponse] = await Promise.all([
    fetch(canonicalApprovalUrl, {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(canonicalApprovalBody),
    }),
    fetch(canonicalApprovalUrl, {
      method: 'POST',
      headers: { ...routeAuthHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(canonicalApprovalBody),
    }),
  ])
  assert.equal(approveResponse.status, 201)
  assert.equal(concurrentApproveResponse.status, 201)
  const approveEnvelope = await approveResponse.json() as {
    data?: { canonicalPlanApproval?: Record<string, unknown> }
  }
  const concurrentApproveEnvelope = await concurrentApproveResponse.json() as {
    data?: { canonicalPlanApproval?: Record<string, unknown> }
  }
  const routeApprovalReceipt = canonicalPlanApprovalReceiptSchema.parse(
    approveEnvelope.data?.canonicalPlanApproval,
  )
  const concurrentApprovalReceipt = canonicalPlanApprovalReceiptSchema.parse(
    concurrentApproveEnvelope.data?.canonicalPlanApproval,
  )
  assert.deepEqual(concurrentApprovalReceipt.plan, routeApprovalReceipt.plan)
  assert.deepEqual(concurrentApprovalReceipt.approval, routeApprovalReceipt.approval)
  assert.deepEqual(
    [routeApprovalReceipt.disposition, concurrentApprovalReceipt.disposition].sort(),
    ['approved_now', 'exact_replay'],
  )
  assert.equal(routeApprovalReceipt.rawAuthorityReturned, false)
  assert.equal(routeApprovalReceipt.pathOrCredentialReturned, false)
  assert.equal(routeApprovalReceipt.boundaries.jobExecutionStarted, false)
  assert.equal(routeApprovalReceipt.boundaries.toolExecutionStarted, false)
  assert.equal(routeApprovalReceipt.boundaries.providerCallStarted, false)
  assert.equal(routeApprovalReceipt.boundaries.renderStarted, false)
  assert.equal(routeApprovalReceipt.boundaries.paidBillingExecuted, false)
  assert.equal('jobs' in routeApprovalReceipt, false)
  assert.equal('wallet' in routeApprovalReceipt, false)
  assert.equal('componentRefs' in routeApprovalReceipt, false)
  const routeApprovedAuthorityRead = await createEditPlanningAuthorityService(
    context,
  ).getApprovedSnapshot(routeApprovalReceipt.approval.snapshotId, routeWorkspaceId)
  const routeApprovedAuthority = asRecord(routeApprovedAuthorityRead.authority)
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
  assert.equal(
    asRecord(approvedSnapshotJourney.journey.nextAction).routeTemplate,
    `/v1/approved-snapshots/${String(routeSnapshot.snapshotId)}/canonical-execution-package`,
  )

  const packageRequestUrl =
    `${routeBaseUrl}/v1/approved-snapshots/${String(routeSnapshot.snapshotId)}/` +
    'canonical-execution-package'
  const packageRequestBody = {
    workspaceId: routeWorkspaceId,
    expectedProjectId: routeProjectId,
    expectedEditSessionId: 'route-edit-session',
    expectedSnapshotHash: routeSnapshot.snapshotHash,
    purpose: 'request_canonical_execution_package',
  }
  const unauthenticatedPackageRequest = await fetch(packageRequestUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'route-package-unauthenticated' },
    body: JSON.stringify(packageRequestBody),
  })
  assert.equal(unauthenticatedPackageRequest.status, 401)
  const substitutedPackageRequest = await fetch(packageRequestUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-package-substituted' },
    body: JSON.stringify({ ...packageRequestBody, expectedEditSessionId: 'route-edit-session-foreign' }),
  })
  assert.equal(substitutedPackageRequest.status, 409)
  const packageResponse = await fetch(packageRequestUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-canonical-package' },
    body: JSON.stringify(packageRequestBody),
  })
  assert.equal(packageResponse.status, 201)
  const packageEnvelope = await packageResponse.json() as {
    data?: { canonicalExecutionPackageRequest?: Record<string, unknown> }
  }
  const packageReceipt = canonicalExecutionPackageRequestReceiptSchema.parse(
    packageEnvelope.data?.canonicalExecutionPackageRequest,
  )
  assert.equal(packageReceipt.disposition, 'package_available')
  assert.equal(packageReceipt.identity.workspaceId, routeWorkspaceId)
  assert.equal(packageReceipt.identity.projectId, routeProjectId)
  assert.equal(packageReceipt.identity.editSessionId, 'route-edit-session')
  assert.equal(packageReceipt.executionPackage.approvedPlanSnapshotId, routeSnapshot.snapshotId)
  assert.equal(packageReceipt.executionPackage.snapshotHash, routeSnapshot.snapshotHash)
  assert.equal(packageReceipt.boundaries.executionPackageAvailable, true)
  assert.equal(packageReceipt.boundaries.workGraphStarted, false)
  assert.equal(packageReceipt.boundaries.workerDispatchStarted, false)
  assert.equal(packageReceipt.boundaries.jobExecutionStarted, false)
  assert.equal(packageReceipt.boundaries.toolExecutionStarted, false)
  assert.equal(packageReceipt.boundaries.providerCallStarted, false)
  assert.equal(packageReceipt.boundaries.renderStarted, false)
  assert.equal(packageReceipt.boundaries.paidBillingExecuted, false)
  assert.equal(packageReceipt.boundaries.customerWalletMutation, false)
  assert.equal(packageReceipt.rawAuthorityReturned, false)
  assert.equal(packageReceipt.jobOrToolDetailsReturned, false)
  assert.equal(packageReceipt.pathOrCredentialReturned, false)
  const serializedPackageReceipt = JSON.stringify(packageReceipt)
  assert.doesNotMatch(
    serializedPackageReceipt,
    /componentRefs|approvedWorkItems|"jobs"|toolCapabilityManifest|toolIds|workerClass|localPath|signedUrl|secret|accessToken/i,
  )
  const packageReplayResponse = await fetch(packageRequestUrl, {
    method: 'POST',
    headers: { ...routeAuthHeaders, 'content-type': 'application/json', 'idempotency-key': 'route-canonical-package' },
    body: JSON.stringify(packageRequestBody),
  })
  assert.equal(packageReplayResponse.status, 201)
  const packageReplayEnvelope = await packageReplayResponse.json() as {
    data?: { canonicalExecutionPackageRequest?: Record<string, unknown> }
  }
  const packageReplayReceipt = canonicalExecutionPackageRequestReceiptSchema.parse(
    packageReplayEnvelope.data?.canonicalExecutionPackageRequest,
  )
  assert.deepEqual(
    packageReplayReceipt,
    packageReceipt,
    'Exact browser handoff replay must return the same bounded receipt.',
  )
  const packageRead = await fetch(
    `${routeBaseUrl}/v1/edit-executions/packages/${packageReceipt.executionPackage.packageRecordId}?workspaceId=${routeWorkspaceId}`,
    { headers: routeAuthHeaders },
  )
  assert.equal(packageRead.status, 200)
  const packageReadEnvelope = await packageRead.json() as {
    data?: { approvedEditExecutionPackage?: Record<string, unknown> }
  }
  const routeExecutionPackage = asRecord(packageReadEnvelope.data?.approvedEditExecutionPackage)
  assert.equal(routeExecutionPackage.source, 'canonical_edit_authority')
  assert.equal(routeExecutionPackage.approvedPlanSnapshotId, routeSnapshot.snapshotId)
  const executionJourney = await readCanonicalJourney()
  assert.equal(executionJourney.response.status, 200)
  assert.equal(executionJourney.journey.stage, 'execution_in_progress')
  assert.equal(
    asRecord(executionJourney.journey.nextAction).code,
    'prepare_private_edit_review',
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
      routeTemplate: '/v1/edit-executions/packages/foreign-package/canonical-private-edit-preparation',
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
      code: 'prepare_private_edit_review',
      actor: 'authenticated_user',
      method: 'POST',
      routeTemplate:
        `/v1/edit-executions/packages/${String(routeExecutionPackage.packageRecordId)}/canonical-private-edit-preparation`,
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
  const routeReadinessHashes = asRecord(routeReadiness.authorityHashes)
  const routeResourcePlacement = asRecord(routeReadiness.resourcePlacement)
  assert.match(String(routeReadinessHashes.toolExecutionAuthorityHash), /^[a-f0-9]{64}$/)
  assert.match(String(routeReadinessHashes.resourcePlacementAuthorityHash), /^[a-f0-9]{64}$/)
  assert.match(String(routeReadinessHashes.resourcePlacementHash), /^[a-f0-9]{64}$/)
  assert.equal(routeResourcePlacement.snapshotBound, true)
  assert.equal(routeResourcePlacement.currentRuntimeCompatible, true)
  assert.equal(routeResourcePlacement.callerSelectedPlacement, false)
  assert.equal(routeResourcePlacement.cloudDispatchAuthorized, false)
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
  assert.equal(
    canonicalJobExecution.status,
    201,
    await canonicalJobExecution.clone().text(),
  )
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
  sourceTrimValidationItem.workItemType = 'prepare_source_trim'
  sourceTrimValidationItem.workerClass = 'authority_worker'
  sourceTrimValidationItem.executionInput = { operation: 'validate_approved_source_trim_plan' }
  sourceTrimValidationItem.expectedOutputs = [{
    outputKey: 'source-trim-validation-evidence',
    artifactType: 'source_trim_validation_evidence',
    assetRole: 'qa',
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'application/json',
    segmentIds: ['segment-1'],
    timingIds: ['master-timing-plan'],
    rendererLayerIds: [],
  }]
  sourceTrimValidationItem.approvedToolIds = []
  sourceTrimValidationItem.dependencyKeys = ['snapshot-validation']
  sourceTrimValidationItem.maximumCreditBudget = 0
  const captionCapabilityItem = workGraphPlanBody.canonicalPlan.workItems.find((workItem) =>
    workItem.workItemKey === 'caption-overlay')
  assert.ok(captionCapabilityItem)
  captionCapabilityItem.executionInput = { operation: 'future_caption_overlay_capability' }
  captionCapabilityItem.approvedToolIds = []
  captionCapabilityItem.maximumCreditBudget = 0
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
  const workGraphScheduling = asRecord(workGraphRun.scheduling)
  const workGraphQueue = asRecord(workGraphRun.queue)
  const workGraphJobOutcomes = workGraphRun.jobs as Record<string, unknown>[]
  const sourceTrimValidationOutcome = workGraphJobOutcomes.find((job) =>
    job.workItemKey === 'source-trim')
  assert.ok(sourceTrimValidationOutcome)
  assert.equal(sourceTrimValidationOutcome.status, 'completed_private_test')
  assert.equal(sourceTrimValidationOutcome.contentType, 'application/json')
  assert.equal(typeof sourceTrimValidationOutcome.artifactId, 'string')
  assert.equal(typeof sourceTrimValidationOutcome.sha256, 'string')
  assert.equal(workGraphRun.status, 'blocked_required_jobs')
  assert.equal(workGraphRunSummary.totalJobCount, 5)
  assert.equal(workGraphRunSummary.completedJobCount, 2)
  assert.equal(workGraphRunSummary.replayedJobCount, 0)
  assert.equal(workGraphRunSummary.capabilityBlockedJobCount, 1)
  assert.equal(workGraphRunSummary.dependencyBlockedJobCount, 2)
  assert.equal(workGraphRunSummary.requiredBlockedJobCount, 3)
  assert.equal(workGraphRunReadiness.privateInternalWorkGraphCompleted, false)
  assert.equal(workGraphRunReadiness.privateReviewReady, false)
  assert.equal(workGraphRunReadiness.nextRequiredGate, 'canonical_job_capability_blockers')
  assert.equal(workGraphScheduling.immutableSnapshotPlacementBindingProven, true)
  assert.match(String(workGraphScheduling.toolExecutionAuthorityHash), /^[a-f0-9]{64}$/)
  assert.match(
    String(workGraphScheduling.approvedResourcePlacementAuthorityHash),
    /^[a-f0-9]{64}$/,
  )
  assert.equal(workGraphScheduling.cloudDispatchAuthorized, false)
  assert.equal(workGraphRun.schemaVersion, 'canonical-private-work-graph-run-response-v3')
  assert.match(String(workGraphQueue.definitionHash), /^[a-f0-9]{64}$/)
  assert.match(String(workGraphQueue.aggregateHash), /^[a-f0-9]{64}$/)
  assert.equal(workGraphQueue.totalJobCount, 5)
  assert.equal(workGraphQueue.completedJobCount, 2)
  assert.equal(workGraphQueue.queuedJobCount, 3)
  assert.equal(workGraphQueue.leasedJobCount, 0)
  assert.equal(workGraphQueue.recoveredCompletedJobCount, 0)
  assert.equal(workGraphQueue.completedReplayCount, 0)
  assert.equal(workGraphQueue.claimedJobCount, 3)
  assert.equal(workGraphQueue.claimCompletionCount, 2)
  assert.equal(workGraphQueue.claimReleaseCount, 1)
  assert.equal(workGraphQueue.expiredClaimRecoveryCount, 0)
  assert.equal(workGraphQueue.hostRestartRecoveryAvailable, true)
  assert.equal(workGraphQueue.completedJobReplayWithoutExecution, true)
  assert.equal(workGraphQueue.immutableSnapshotAndPlacementBinding, true)
  assert.equal(workGraphQueue.plaintextClaimCredentialsPersisted, false)
  assert.equal(workGraphQueue.claimCredentialDigestsPersisted, true)
  assert.equal(workGraphQueue.browserClaimAllowed, false)
  assert.equal(workGraphQueue.crossProcessAtomicClaimProven, true)
  assert.equal(workGraphQueue.distributedTransactionProven, false)
  assert.equal(workGraphQueue.cloudServiceIdentityVerified, false)
  assert.equal(workGraphQueue.cloudDispatchAuthorized, false)
  assert.equal(workGraphQueue.productionAuthority, false)
  assert.equal(JSON.stringify(workGraphRun).includes('"claimCredential":'), false)
  assert.equal(JSON.stringify(workGraphRun).includes('"credentialSha256":'), false)
  assert.equal(JSON.stringify(workGraphRun).includes('"workerIdentityHash":'), false)
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
  assert.equal(asRecord(workGraphJourney.nextAction).code, 'prepare_private_edit_review')
  const workGraphProgress = asRecord(workGraphJourney.workGraphProgress)
  assert.equal(workGraphProgress.packageRecordId, workGraphPackage.packageRecordId)
  assert.equal(workGraphProgress.approvedPlanSnapshotId, workGraphSnapshot.snapshotId)
  assert.equal(workGraphProgress.status, 'blocked_required_jobs')
  assert.equal(workGraphProgress.runFinished, true)
  assert.equal(workGraphProgress.totalJobCount, 5)
  assert.equal(workGraphProgress.completedJobCount, 2)
  assert.equal(workGraphProgress.capabilityBlockedJobCount, 1)
  assert.equal(workGraphProgress.dependencyBlockedJobCount, 2)
  assert.equal(workGraphProgress.pendingJobCount, 0)
  assert.equal(workGraphProgress.requiredIncompleteJobCount, 3)
  assert.equal(workGraphProgress.allRequiredJobsCompleted, false)
  assert.equal(workGraphProgress.nextRequiredGate, 'canonical_job_capability_blockers')
  assert.equal(typeof workGraphProgress.checkpointHash, 'string')
  assert.equal(Number(workGraphProgress.checkpointSequence) > 0, true)

  const privatePreparationUrl =
    `${routeBaseUrl}/v1/edit-executions/packages/${String(workGraphPackage.packageRecordId)}/` +
    'canonical-private-edit-preparation'
  const privatePreparationBody = {
    workspaceId: routeWorkspaceId,
    expectedProjectId: routeProjectId,
    expectedEditSessionId: workGraphEditSessionId,
    expectedSnapshotId: String(workGraphSnapshot.snapshotId),
    expectedSnapshotHash: String(workGraphSnapshot.snapshotHash),
    expectedPackageHash: String(workGraphPackage.packageHash),
    purpose: 'prepare_canonical_private_edit_review',
  }
  const callerSuppliedPreparationJobs = await fetch(privatePreparationUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-private-preparation-reject-jobs',
    },
    body: JSON.stringify({ ...privatePreparationBody, jobs: [] }),
  })
  assert.equal(callerSuppliedPreparationJobs.status, 400)

  const privatePreparationResponse = await fetch(privatePreparationUrl, {
    method: 'POST',
    headers: {
      ...routeAuthHeaders,
      'content-type': 'application/json',
      'idempotency-key': 'route-private-preparation-blocked',
    },
    body: JSON.stringify(privatePreparationBody),
  })
  assert.equal(privatePreparationResponse.status, 201)
  const privatePreparationEnvelope = await privatePreparationResponse.json() as {
    data?: { canonicalPrivateEditPreparation?: Record<string, unknown> }
  }
  const privatePreparationReceipt = canonicalPrivateEditPreparationReceiptSchema.parse(
    privatePreparationEnvelope.data?.canonicalPrivateEditPreparation,
  )
  assert.equal(privatePreparationReceipt.disposition, 'blocked')
  assert.equal(privatePreparationReceipt.identity.packageRecordId, workGraphPackage.packageRecordId)
  assert.equal(privatePreparationReceipt.authority.packageHash, workGraphPackage.packageHash)
  assert.equal(privatePreparationReceipt.progress.totalJobCount, 5)
  assert.equal(privatePreparationReceipt.progress.allRequiredJobsCompleted, false)
  assert.equal(privatePreparationReceipt.review, null)
  assert.equal(privatePreparationReceipt.boundaries.browserSuppliedJobsAccepted, false)
  assert.equal(privatePreparationReceipt.boundaries.browserSuppliedToolsAccepted, false)
  assert.equal(privatePreparationReceipt.boundaries.jobOrToolDetailsReturned, false)
  assert.equal(privatePreparationReceipt.boundaries.filesystemPathReturned, false)
  assert.equal(privatePreparationReceipt.boundaries.credentialReturned, false)
  assert.equal(privatePreparationReceipt.boundaries.providerCallStarted, false)
  assert.equal(privatePreparationReceipt.boundaries.productionRenderStarted, false)
  assert.equal(privatePreparationReceipt.boundaries.customerCreditMutation, false)
  assert.equal(privatePreparationReceipt.boundaries.billingStarted, false)
  assert.equal('jobs' in privatePreparationReceipt, false)
  assert.equal('tools' in privatePreparationReceipt, false)
  assert.equal('path' in privatePreparationReceipt, false)
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
  const workGraphContinuationScheduling = asRecord(workGraphContinuation.scheduling)
  const workGraphContinuationQueue = asRecord(workGraphContinuation.queue)
  assert.equal(workGraphContinuation.status, 'blocked_required_jobs')
  assert.equal(workGraphContinuationSummary.completedJobCount, 2)
  assert.equal(workGraphContinuationSummary.replayedJobCount, 2)
  assert.equal(workGraphContinuationSummary.capabilityBlockedJobCount, 1)
  assert.equal(workGraphContinuationScheduling.actualExecutionCount, 1)
  assert.equal(workGraphContinuationQueue.definitionHash, workGraphQueue.definitionHash)
  assert.notEqual(workGraphContinuationQueue.aggregateHash, workGraphQueue.aggregateHash)
  assert.equal(workGraphContinuationQueue.completedJobCount, 2)
  assert.equal(workGraphContinuationQueue.queuedJobCount, 3)
  assert.equal(workGraphContinuationQueue.leasedJobCount, 0)
  assert.equal(workGraphContinuationQueue.recoveredCompletedJobCount, 2)
  assert.equal(workGraphContinuationQueue.completedReplayCount, 0)
  assert.equal(workGraphContinuationQueue.claimedJobCount, 0)
  assert.equal(workGraphContinuationQueue.claimCompletionCount, 0)
  assert.equal(workGraphContinuationQueue.claimReleaseCount, 0)
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
  assert.equal(provenToolIdentitySummary.callableCandidateCount, 60)
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

  const authorityBeforeInFlightCompensation = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  const leasesBeforeInFlightCompensation = await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  const dispatchesBeforeInFlightCompensation = await readPrivateCanonicalToolDispatchAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  assert.ok(authorityBeforeInFlightCompensation)
  assert.ok(leasesBeforeInFlightCompensation)
  assert.ok(dispatchesBeforeInFlightCompensation)
  const inFlightCompensation = await fetch(
    `${routeBaseUrl}/v1/approved-snapshots/${String(leaseFixtureSnapshot.snapshotId)}/compensated-cancel`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-in-flight-compensation-denied',
      },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        expectedAuthorityRevision: authorityBeforeInFlightCompensation.revision,
        expectedSnapshotHash: leaseFixtureSnapshot.snapshotHash,
        expectedReservationId: leaseFixtureReservation.id,
        reason: 'user_cancelled_after_dispatch',
      }),
    },
  )
  assert.equal(inFlightCompensation.status, 409)
  const inFlightCompensationEnvelope = await inFlightCompensation.json() as {
    error?: { code?: string; details?: { requiredGate?: string; inFlightStartedFenceCount?: number } }
  }
  assert.equal(inFlightCompensationEnvelope.error?.code, 'TOOL_NOT_READY')
  assert.equal(
    inFlightCompensationEnvelope.error?.details?.requiredGate,
    'canonical_inflight_execution_quiescence_and_compensation',
  )
  assert.equal(inFlightCompensationEnvelope.error?.details?.inFlightStartedFenceCount, 1)
  assert.equal(
    stableAuthorityStringify(await readPrivateEditAuthorityAggregate({
      localStorageRoot,
      ownerUserId: userId,
      workspaceId: routeWorkspaceId,
    })),
    stableAuthorityStringify(authorityBeforeInFlightCompensation),
  )
  assert.equal(
    stableAuthorityStringify(await readPrivateCanonicalWorkerLeaseAggregate({
      localStorageRoot,
      ownerUserId: userId,
      workspaceId: routeWorkspaceId,
    })),
    stableAuthorityStringify(leasesBeforeInFlightCompensation),
  )
  assert.equal(
    stableAuthorityStringify(await readPrivateCanonicalToolDispatchAggregate({
      localStorageRoot,
      ownerUserId: userId,
      workspaceId: routeWorkspaceId,
    })),
    stableAuthorityStringify(dispatchesBeforeInFlightCompensation),
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
  const incompleteCompletionAuthorityBefore = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  const incompleteCompletionLeasesBefore = await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  const incompleteCompletionDispatchesBefore = await readPrivateCanonicalToolDispatchAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  assert.ok(incompleteCompletionAuthorityBefore)
  assert.ok(incompleteCompletionLeasesBefore)
  assert.ok(incompleteCompletionDispatchesBefore)
  const incompleteCompletionCompensation = await fetch(
    `${routeBaseUrl}/v1/approved-snapshots/${String(leaseFixtureSnapshot.snapshotId)}/compensated-cancel`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-incomplete-adapter-completion-compensation-denied',
      },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        expectedAuthorityRevision: incompleteCompletionAuthorityBefore.revision,
        expectedSnapshotHash: leaseFixtureSnapshot.snapshotHash,
        expectedReservationId: leaseFixtureReservation.id,
        reason: 'user_cancelled_after_dispatch',
      }),
    },
  )
  assert.equal(incompleteCompletionCompensation.status, 409)
  const incompleteCompletionEnvelope = await incompleteCompletionCompensation.json() as {
    error?: { code?: string; details?: { requiredGate?: string } }
  }
  assert.equal(incompleteCompletionEnvelope.error?.code, 'TOOL_NOT_READY')
  assert.equal(
    incompleteCompletionEnvelope.error?.details?.requiredGate,
    'canonical_adapter_completion_quiescence_evidence',
  )
  assert.equal(
    stableAuthorityStringify(await readPrivateEditAuthorityAggregate({
      localStorageRoot,
      ownerUserId: userId,
      workspaceId: routeWorkspaceId,
    })),
    stableAuthorityStringify(incompleteCompletionAuthorityBefore),
  )
  assert.equal(
    stableAuthorityStringify(await readPrivateCanonicalWorkerLeaseAggregate({
      localStorageRoot,
      ownerUserId: userId,
      workspaceId: routeWorkspaceId,
    })),
    stableAuthorityStringify(incompleteCompletionLeasesBefore),
  )
  assert.equal(
    stableAuthorityStringify(await readPrivateCanonicalToolDispatchAggregate({
      localStorageRoot,
      ownerUserId: userId,
      workspaceId: routeWorkspaceId,
    })),
    stableAuthorityStringify(incompleteCompletionDispatchesBefore),
  )
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

  const completedExecutionAuthorityBefore = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  const completedExecutionEvidenceBefore = await readPrivateArtifactQaAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  assert.ok(completedExecutionAuthorityBefore)
  assert.ok(completedExecutionEvidenceBefore)
  const routeSnapshotReservation = asRecord(routeApprovedAuthority.reservation)
  const completedExecutionLeasesBefore = (await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  }))?.leases.filter((lease) => lease.approvedPlanSnapshotId === routeSnapshot.snapshotId) ?? []
  const completedExecutionDispatchesBefore = (await readPrivateCanonicalToolDispatchAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  }))?.grants.filter((grant) =>
    grant.binding.approvedPlanSnapshotId === routeSnapshot.snapshotId) ?? []
  const completedExecutionCompensationRequest = {
    workspaceId: routeWorkspaceId,
    expectedAuthorityRevision: completedExecutionAuthorityBefore.revision,
    expectedSnapshotHash: routeSnapshot.snapshotHash,
    expectedReservationId: routeSnapshotReservation.id,
    reason: 'user_cancelled_after_dispatch',
  } as const
  let releasePackageCompensationLock: () => void = () => undefined
  let markPackageCompensationLockEntered: () => void = () => undefined
  const packageCompensationLockEntered = new Promise<void>((resolve) => {
    markPackageCompensationLockEntered = resolve
  })
  const holdPackageCompensationLock = new Promise<void>((resolve) => {
    releasePackageCompensationLock = resolve
  })
  const packageCompensationLock = withCanonicalWorkGraphPackageLock({
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
    packageRecordId: String(routeExecutionPackage.packageRecordId),
  }, async () => {
    markPackageCompensationLockEntered()
    await holdPackageCompensationLock
  })
  await packageCompensationLockEntered
  let completedExecutionCompensationSettled = false
  const completedExecutionCompensationRequestPromise = fetch(
    `${routeBaseUrl}/v1/approved-snapshots/${String(routeSnapshot.snapshotId)}/compensated-cancel`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-completed-execution-compensation',
      },
      body: JSON.stringify(completedExecutionCompensationRequest),
    },
  ).finally(() => {
    completedExecutionCompensationSettled = true
  })
  await new Promise((resolve) => setTimeout(resolve, 50))
  assert.equal(completedExecutionCompensationSettled, false)
  releasePackageCompensationLock()
  await packageCompensationLock
  const completedExecutionCompensationResponse =
    await completedExecutionCompensationRequestPromise
  assert.equal(completedExecutionCompensationResponse.status, 201)
  const completedExecutionCompensationEnvelope = await completedExecutionCompensationResponse.json() as {
    data?: { canonicalPostDispatchCompensation?: Record<string, unknown> }
  }
  const completedExecutionCompensation = asRecord(
    completedExecutionCompensationEnvelope.data?.canonicalPostDispatchCompensation,
  )
  const completedExecutionLeaseEvidence = asRecord(completedExecutionCompensation.leases)
  const completedExecutionArtifactEvidence = asRecord(completedExecutionCompensation.evidence)
  assert.equal(completedExecutionCompensation.compensationMode, 'completed_execution')
  assert.equal(completedExecutionCompensation.compensationFinalized, true)
  assert.ok(Number(completedExecutionLeaseEvidence.completedFenceCount) > 0)
  assert.equal(completedExecutionLeaseEvidence.inFlightStartedFenceCount, 0)
  assert.equal(completedExecutionCompensation.toolExecutionPreviouslyCompleted, true)
  assert.ok(Number(completedExecutionArtifactEvidence.artifactRecordCount) > 0)
  assert.ok(Number(completedExecutionArtifactEvidence.qaEvaluationRecordCount) > 0)
  assert.ok(Number(completedExecutionArtifactEvidence.reconciliationRecordCount) > 0)
  assert.equal(
    completedExecutionArtifactEvidence.adapterCompletionRecordCount,
    completedExecutionLeaseEvidence.completedFenceCount,
  )
  assert.equal(completedExecutionArtifactEvidence.committedArtifactQaEvidencePreserved, true)
  assert.equal(completedExecutionArtifactEvidence.adapterCompletionEvidencePreserved, true)
  assert.equal(completedExecutionArtifactEvidence.internalAttemptCostEvidencePreserved, true)
  assert.equal(completedExecutionCompensation.customerWalletMutation, false)
  assert.equal(completedExecutionCompensation.customerCreditMutation, false)
  assert.equal(completedExecutionCompensation.billingExecuted, false)
  assert.equal(completedExecutionCompensation.providerCallStarted, false)
  assert.equal(completedExecutionCompensation.renderStarted, false)
  assert.equal(completedExecutionCompensation.publicDeliveryStarted, false)
  assert.equal(
    stableAuthorityStringify(await readPrivateArtifactQaAggregate({
      localStorageRoot,
      ownerUserId: userId,
      workspaceId: routeWorkspaceId,
    })),
    stableAuthorityStringify(completedExecutionEvidenceBefore),
  )
  const completedExecutionAuthorityAfter = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  assert.ok(completedExecutionAuthorityAfter)
  assert.equal(
    completedExecutionAuthorityAfter.wallet.availableCredits,
    completedExecutionAuthorityBefore.wallet.availableCredits +
      Number(routeSnapshotReservation.reservedCredits),
  )
  assert.equal(
    completedExecutionAuthorityAfter.wallet.reservedCredits,
    completedExecutionAuthorityBefore.wallet.reservedCredits -
      Number(routeSnapshotReservation.reservedCredits),
  )
  assert.equal(
    completedExecutionAuthorityAfter.plans.find((plan) => plan.id === routeSnapshot.planId)?.status,
    'cancelled',
  )
  assert.equal(
    completedExecutionAuthorityAfter.reservations.find((reservation) =>
      reservation.id === routeSnapshotReservation.id)?.status,
    'cancelled',
  )
  const completedExecutionJourneyAfterCompensation = await readCanonicalJourney()
  assert.equal(completedExecutionJourneyAfterCompensation.response.status, 200)
  assert.equal(completedExecutionJourneyAfterCompensation.journey.stage, 'replanning_required')
  assert.equal(
    asRecord(completedExecutionJourneyAfterCompensation.journey.nextAction).code,
    'prepare_replacement_plan',
  )
  const completedExecutionLeasesAfter = (await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  }))?.leases.filter((lease) => lease.approvedPlanSnapshotId === routeSnapshot.snapshotId) ?? []
  const completedExecutionDispatchesAfter = (await readPrivateCanonicalToolDispatchAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  }))?.grants.filter((grant) =>
    grant.binding.approvedPlanSnapshotId === routeSnapshot.snapshotId) ?? []
  for (const beforeLease of completedExecutionLeasesBefore) {
    const afterLease = completedExecutionLeasesAfter.find((lease) => lease.id === beforeLease.id)
    assert.ok(afterLease)
    assert.ok(afterLease.status === 'released' || afterLease.status === 'expired')
    assert.deepEqual(afterLease.executionFence, beforeLease.executionFence)
    assert.equal(afterLease.immutableLeaseHash, beforeLease.immutableLeaseHash)
  }
  for (const beforeDispatch of completedExecutionDispatchesBefore) {
    const afterDispatch = completedExecutionDispatchesAfter.find((grant) => grant.id === beforeDispatch.id)
    assert.ok(afterDispatch)
    if (beforeDispatch.status === 'consumed') assert.deepEqual(afterDispatch, beforeDispatch)
    assert.notEqual(afterDispatch.status, 'authorized')
  }
  const completedExecutionCompensationReplay = await fetch(
    `${routeBaseUrl}/v1/approved-snapshots/${String(routeSnapshot.snapshotId)}/compensated-cancel`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-completed-execution-compensation',
      },
      body: JSON.stringify(completedExecutionCompensationRequest),
    },
  )
  assert.equal(completedExecutionCompensationReplay.status, 201)
  const completedExecutionCompensationReplayEnvelope = await completedExecutionCompensationReplay.json() as {
    data?: { canonicalPostDispatchCompensation?: Record<string, unknown> }
  }
  assert.deepEqual(
    completedExecutionCompensationReplayEnvelope.data?.canonicalPostDispatchCompensation,
    completedExecutionCompensation,
  )
  assert.equal(
    (await readPrivateEditAuthorityAggregate({
      localStorageRoot,
      ownerUserId: userId,
      workspaceId: routeWorkspaceId,
    }))?.revision,
    completedExecutionAuthorityAfter.revision,
  )
  const completedExecutionCompensationConflict = await fetch(
    `${routeBaseUrl}/v1/approved-snapshots/${String(routeSnapshot.snapshotId)}/compensated-cancel`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-completed-execution-compensation',
      },
      body: JSON.stringify({
        ...completedExecutionCompensationRequest,
        expectedSnapshotHash: '0'.repeat(64),
      }),
    },
  )
  assert.equal(completedExecutionCompensationConflict.status, 409)
  const completedExecutionCompensationConflictEnvelope =
    await completedExecutionCompensationConflict.json() as { error?: { code?: string } }
  assert.equal(completedExecutionCompensationConflictEnvelope.error?.code, 'IDEMPOTENCY_CONFLICT')

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
  const downstreamLeaseApprovedAuthority = asRecord(
    downstreamLeaseApproveEnvelope.data?.authority,
  )
  const downstreamLeaseSnapshot = asRecord(downstreamLeaseApprovedAuthority.snapshot)
  const downstreamLeaseReservation = asRecord(downstreamLeaseApprovedAuthority.reservation)
  const downstreamLeaseJobs = downstreamLeaseApprovedAuthority.jobs as Record<string, unknown>[]
  const downstreamLeaseRootJob = downstreamLeaseJobs.find((job) =>
    Array.isArray(job.dependencyJobIds) && job.dependencyJobIds.length === 0)
  assert.ok(downstreamLeaseRootJob)
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
  const downstreamLeasePackageEnvelope = await downstreamLeasePackageResponse.json() as {
    data?: { approvedEditExecutionPackage?: Record<string, unknown> }
  }
  const downstreamLeaseExecutionPackage = asRecord(
    downstreamLeasePackageEnvelope.data?.approvedEditExecutionPackage,
  )
  const downstreamLeaseClaim = (await createCanonicalWorkerLeaseAuthorityService(context).claim({
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    editSessionId: downstreamLeaseFixtureEditSessionId,
    jobId: String(downstreamLeaseRootJob.id),
    purpose: 'private_internal_canonical_lease_claim',
    idempotencyKey: 'route-consumed-before-start-compensation-lease-claim',
  })).workerLeaseClaim
  assert.equal(downstreamLeaseClaim.lease.executionFence.state, 'not_started')
  const downstreamAuthority = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  assert.ok(downstreamAuthority)
  const downstreamAuthorityJob = downstreamAuthority.jobs.find((job) =>
    job.id === downstreamLeaseRootJob.id)
  assert.ok(downstreamAuthorityJob)
  const downstreamApprovedWorkItem = downstreamAuthority.approvedWorkItems.find((workItem) =>
    workItem.id === downstreamAuthorityJob.approvedWorkItemId)
  assert.ok(downstreamApprovedWorkItem)
  const downstreamExpectedAssetId = downstreamAuthorityJob.expectedAssetIds[0]
  assert.ok(downstreamExpectedAssetId)
  const downstreamConsumedAt = new Date().toISOString()
  const downstreamConsumedExpiresAt = new Date(
    Date.parse(downstreamConsumedAt) + 30_000,
  ).toISOString()
  const downstreamDependencyAuthority = downstreamLeaseClaim.lease.dependencyAuthority
  const downstreamConsumedDispatchWithoutHash: Omit<
    CanonicalPrivateToolDispatchRecord,
    'immutableGrantHash'
  > = {
    ...consumedDispatchWithoutHash,
    id: 'tool_dispatch_consumed_before_start_compensation_fixture',
    status: 'consumed',
    binding: {
      ...consumedDispatchWithoutHash.binding,
      workspaceId: routeWorkspaceId,
      projectId: routeProjectId,
      editSessionId: downstreamLeaseFixtureEditSessionId,
      jobId: downstreamAuthorityJob.id,
      approvedPlanSnapshotId: String(downstreamLeaseSnapshot.snapshotId),
      approvedWorkItemId: downstreamApprovedWorkItem.id,
      expectedAssetId: downstreamExpectedAssetId,
      leaseId: downstreamLeaseClaim.lease.leaseId,
      leaseAttemptNumber: downstreamLeaseClaim.lease.attemptNumber,
      leaseImmutableHash: downstreamLeaseClaim.lease.immutableLeaseHash,
      leaseDependencyAuthority: {
        state: downstreamDependencyAuthority.state,
        readinessHash: downstreamDependencyAuthority.readinessHash,
        authorityHash: downstreamDependencyAuthority.authorityHash,
        selectedArtifactsHash: sha256AuthorityValue(downstreamDependencyAuthority.selectedArtifacts),
        selectedArtifactCount: downstreamDependencyAuthority.selectedArtifacts.length,
        liveRuntimeEligible: false,
      },
      reservationId: String(downstreamLeaseReservation.id),
      maximumCreditBudget: downstreamApprovedWorkItem.maximumCreditBudget,
      remainingReservedCreditsAtDecision: Number(downstreamLeaseReservation.reservedCredits),
    },
    authorityRevision: Number(downstreamLeaseExecutionPackage.authorityRevision),
    canonicalHashes: { ...downstreamLeaseClaim.lease.canonicalHashes },
    decisionRequestHash: sha256ForSmoke('consumed-before-start-compensation-decision-request'),
    credentialHashSha256: sha256ForSmoke('consumed-before-start-compensation-credential'),
    issuedAt: downstreamConsumedAt,
    expiresAt: downstreamConsumedExpiresAt,
    consumedAt: downstreamConsumedAt,
  }
  const downstreamConsumedDispatch: CanonicalPrivateToolDispatchRecord = {
    ...downstreamConsumedDispatchWithoutHash,
    immutableGrantHash: canonicalPrivateToolDispatchImmutableHash(
      downstreamConsumedDispatchWithoutHash,
    ),
  }
  await mutatePrivateCanonicalToolDispatchAggregate({
    scope: { localStorageRoot, ownerUserId: userId, workspaceId: routeWorkspaceId },
    now: downstreamConsumedAt,
    mutation: (aggregate) => {
      aggregate.grants.push(downstreamConsumedDispatch)
      aggregate.auditEvents.push({
        id: 'tool_dispatch_audit_consumed_before_start_compensation_fixture',
        eventType: 'consumed',
        grantId: downstreamConsumedDispatch.id,
        jobId: downstreamConsumedDispatch.binding.jobId,
        approvedWorkItemId: downstreamConsumedDispatch.binding.approvedWorkItemId,
        expectedAssetId: downstreamConsumedDispatch.binding.expectedAssetId,
        canonicalToolId: downstreamConsumedDispatch.binding.canonicalToolId,
        operationId: downstreamConsumedDispatch.binding.operationId,
        leaseId: downstreamConsumedDispatch.binding.leaseId,
        leaseAttemptNumber: downstreamConsumedDispatch.binding.leaseAttemptNumber,
        createdAt: downstreamConsumedAt,
      })
      return { result: undefined, changed: true }
    },
  })
  const consumedBeforeStartAuthorityBefore = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  })
  assert.ok(consumedBeforeStartAuthorityBefore)
  const consumedBeforeStartCompensationResponse = await fetch(
    `${routeBaseUrl}/v1/approved-snapshots/${String(downstreamLeaseSnapshot.snapshotId)}/compensated-cancel`,
    {
      method: 'POST',
      headers: {
        ...routeAuthHeaders,
        'content-type': 'application/json',
        'idempotency-key': 'route-consumed-before-start-compensation',
      },
      body: JSON.stringify({
        workspaceId: routeWorkspaceId,
        expectedAuthorityRevision: consumedBeforeStartAuthorityBefore.revision,
        expectedSnapshotHash: downstreamLeaseSnapshot.snapshotHash,
        expectedReservationId: downstreamLeaseReservation.id,
        reason: 'user_cancelled_after_dispatch',
      }),
    },
  )
  assert.equal(consumedBeforeStartCompensationResponse.status, 201)
  const consumedBeforeStartCompensationEnvelope = await consumedBeforeStartCompensationResponse.json() as {
    data?: { canonicalPostDispatchCompensation?: Record<string, unknown> }
  }
  const consumedBeforeStartCompensation = asRecord(
    consumedBeforeStartCompensationEnvelope.data?.canonicalPostDispatchCompensation,
  )
  assert.equal(consumedBeforeStartCompensation.compensationMode, 'consumed_before_start')
  assert.equal(asRecord(consumedBeforeStartCompensation.dispatches).consumedCount, 1)
  assert.equal(asRecord(consumedBeforeStartCompensation.leases).notStartedFenceCount, 1)
  assert.equal(asRecord(consumedBeforeStartCompensation.leases).completedFenceCount, 0)
  assert.equal(consumedBeforeStartCompensation.toolExecutionPreviouslyStarted, false)
  assert.equal(consumedBeforeStartCompensation.toolExecutionPreviouslyCompleted, false)
  const downstreamConsumedDispatchAfter = (await readPrivateCanonicalToolDispatchAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  }))?.grants.find((grant) => grant.id === downstreamConsumedDispatch.id)
  const downstreamLeaseAfter = (await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: routeWorkspaceId,
  }))?.leases.find((lease) => lease.id === downstreamLeaseClaim.lease.leaseId)
  assert.deepEqual(downstreamConsumedDispatchAfter, downstreamConsumedDispatch)
  assert.ok(downstreamLeaseAfter?.status === 'released' || downstreamLeaseAfter?.status === 'expired')
  assert.equal(downstreamLeaseAfter?.executionFence.state, 'not_started')

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
    'storytelling_style_authority_content_addressed_through_handoff_plan_snapshot_and_execution',
    'storytelling_style_change_supersedes_presented_plan_and_estimate',
    'approved_storytelling_style_requires_explicit_revision_and_preserves_history',
    'storytelling_style_internal_cost_stays_outside_customer_commercial_authority',
    'storytelling_style_scope_fails_closed_at_handoff_and_publication',
    'idea_first_storytelling_requires_source_verified_production_authority',
    'idea_first_storytelling_zero_source_handoff_plan_estimate_approval_and_snapshot',
    'idea_first_storytelling_approved_source_manifest_has_zero_fabricated_uploads',
    'idea_first_storytelling_animatic_binds_script_scenes_narration_frame_style_and_cost',
    'ordinary_edits_still_require_finalized_uploaded_source_and_cleanup_authority',
    'idea_first_storytelling_private_preview_does_not_authorize_final_delivery_provider_or_commercial_effects',
    'exact_publish_idempotency_replay',
    'changed_publish_idempotency_conflict',
    'server_owned_preference_binding_at_publication',
    'preference_binding_revalidated_at_approval',
    'source_media_authority_bound_and_revalidated',
    'stale_source_media_expectation_rejected',
    'preference_dna_and_edit_brief_frozen_into_plan',
    'edit_brief_post_approval_mutation_blocked',
    'frame_confirmation_gate',
    '4k_estimate_exact_timing_gate',
    '4k_estimate_versioned_cost_derivation_gate',
    'work_graph_cycle_gate',
    'production_tool_registry_gate',
    'server_proven_tool_identity_authority_frozen_into_plan_and_snapshot',
    'server_derived_resource_placement_authority_frozen_into_plan_and_snapshot',
    'exact_resource_placement_hash_bound_through_readiness_lease_and_dispatch',
    'work_graph_scheduler_proves_immutable_snapshot_placement_binding',
    'tool_authority_reconciliation_does_not_mutate_hash_bound_publication_input',
    'tool_strategy_work_graph_and_exact_operation_reconciliation_gate',
    'required_tool_canonical_lifecycle_and_job_adapter_readiness_gate',
    'tool_identity_authority_tamper_rejected_before_execution_packaging',
    'exact_runner_payload_binding_and_output_content_type_validated_before_approval',
    'tool_payload_authority_frozen_into_plan_snapshot_and_execution_lineage',
    'tool_payload_authority_tamper_rejected_before_execution_packaging',
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
    'authenticated_canonical_revision_plan_presentation_route_fails_closed_before_authority',
    'browser_safe_exact_execution_package_request_receipt',
    'exact_execution_package_request_replay_is_stable',
    'execution_package_request_returns_no_jobs_tools_paths_credentials_or_execution_authority',
    'content_addressed_private_planning_handoff_replay',
    'preference_mismatched_handoff_does_not_promote_planning_evidence',
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
    'frontend_safe_plan_presentation_uses_server_owned_internal_publication_coordinator',
    'concurrent_plan_presentations_converge_without_snapshot_credit_job_tool_provider_or_render_authority',
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
    'canonical_work_graph_uses_durable_snapshot_and_placement_bound_package_queue',
    'durable_package_queue_skips_completed_jobs_on_continuation_without_cloud_authority',
    'authenticated_browser_safe_private_preparation_returns_bounded_blockers_without_jobs_tools_paths_or_credentials',
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
    'post_dispatch_compensation_rejects_inflight_execution_without_mutation',
    'post_dispatch_compensation_rejects_completed_fence_without_adapter_completion_without_mutation',
    'post_dispatch_compensation_serializes_behind_active_work_graph_package_lock',
    'post_dispatch_compensation_preserves_consumed_dispatch_and_completed_fence_evidence',
    'post_dispatch_compensation_preserves_artifact_qa_and_reconciliation_evidence',
    'post_dispatch_compensation_releases_unused_synthetic_reservation_with_wallet_conservation',
    'post_dispatch_compensation_is_idempotent_and_changed_request_conflict_safe',
    'post_dispatch_compensation_recovers_journey_to_replanning_required',
    'consumed_before_start_compensation_preserves_dispatch_and_terminals_never_started_lease',
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
  const professionalExportCoverage = buildProfessionalExportCreditCoverage({
    durationSeconds: 5,
    outputFps: 30,
    approvedAspectRatio: '9:16',
  })
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
          outputFrame: { width: 2160, height: 3840, fps: 30 },
          outputFramePurpose: 'private_canonical_4k_master_review',
          professionalExportCoverage,
          outputFrameConfirmed: true,
          sourceOrderConfirmed: true,
          sourceCleanupConfirmed: true,
          editLevel: 'basic',
          targetPlatform: 'tiktok_reels_shorts',
          preferenceSnapshotId: 'server-default-exact-edit-preferences-v1',
          preferenceRevision: 1,
          preferencePlanningInputRevision:
            planningInputAuthority.exactEditPreference.planningInputRevision,
          preferenceFingerprintSha256:
            planningInputAuthority.exactEditPreference.preferenceFingerprintSha256,
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
              action: 'use_as_alt_take',
              startFrame: 0,
              endFrameExclusive: 150,
              reason: 'Preserve the complete second source as an approved alternate take outside the primary final composition.',
              confidence: 0.98,
              meaningPreservationStatus: 'passed',
              userReviewStatus: 'not_required',
            },
          ],
        },
        masterTimingPlan: { status: 'ready', timingBase: { fps: 30 }, totalFrames: 150 },
        captionVisualCueTimingPlan: { status: 'synced', collisionCount: 0 },
        soundSyncTransitionTimingPlan: { status: 'not_needed', speechPriority: true },
        timingValidationPlan: { overallStatus: 'passed', approvalBlocked: false },
        timingSummary: { validationStatus: 'passed', approvalBlocked: false, fps: 30, totalFrames: 150 },
        segments: [
          { segmentId: 'segment-1', startFrame: 0, endFrameExclusive: 150, operationIds: ['operation-trim-1', 'operation-caption-1', 'operation-export-1'] },
        ],
        visualAssetPlan: { assets: [], randomBrollAllowed: false },
        colorPipelinePlan: { status: 'not_provided' },
        rendererPlan: { renderer: 'remotion', frameOwnedByRenderer: true },
        toolStrategyPlan: {
          toolIds: ['ffmpeg', 'ffprobe', 'libass', 'remotion'],
          exactOperationIds: [
            'tool.ffmpeg.execute_approved_media_recipe.v1',
            'tool.ffprobe.inspect_approved_media.v1',
            'tool.libass.render_approved_caption_track.v1',
            'tool.remotion.render_approved_composition.v1',
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
          {
            lineKey: '4k-export-ceiling',
            label: '4K UHD render and export ceiling',
            category: 'render',
            estimatedCredits: professionalExportCoverage.maximumInternalToolCostCredits,
            removable: false,
            metadata: { requiresSeparateExportEstimate: false, allowsAdditionalExportCharge: false },
          },
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
          workItemType: 'process_video_asset',
          workerClass: 'media_processing_worker',
          executionInput: {
            operation: 'execute_approved_media_recipe',
            approvedToolOperationIds: ['tool.ffmpeg.execute_approved_media_recipe.v1'],
            expectedOutputKeys: ['approved-trimmed-source'],
            structuredPayload: {
              recipeProfileId: 'approved_trim_transcode_v1',
              timestampPolicy: 'normalize_from_zero',
              overwriteExistingArtifact: false,
              allowUnreviewedCodec: false,
              trimStartFrame: 0,
              trimEndFrameExclusive: 150,
              frameRate: 30,
            },
          },
          sourceSequenceItemIds: ['source-1'],
          sourceCleanupDecisionIds: ['cleanup-decision-source-1'],
          expectedOutputs: [{
            outputKey: 'approved-trimmed-source',
            artifactType: 'approved_ffv1_nut_intermediate',
            assetRole: 'processed',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'video/x-nut',
            segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: ['source-video-layer'],
          }],
          dependencyKeys: [],
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
          workItemKey: 'caption-overlay',
          workItemType: 'custom',
          workerClass: 'render_worker',
          executionInput: {
            operation: 'render_approved_caption_overlay',
            approvedToolOperationIds: ['tool.libass.render_approved_caption_track.v1'],
            expectedOutputKeys: ['caption-overlay-png'],
            structuredPayload: {
              captionProfileId: 'approved_ass_track_render_v1',
              fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
              collisionPolicy: 'fail_on_reserved_zone_collision',
              preserveSpeechTiming: true,
              width: 2160,
              height: 3840,
              timestampMs: 1000,
              fontSize: 97,
              marginV: 211,
              alignment: 2,
              caption: 'Approved frame accurate caption',
            },
          },
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
          expectedOutputs: [{
            outputKey: 'caption-overlay-png',
            artifactType: 'controlled_libass_caption_overlay_png',
            assetRole: 'processed',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'image/png',
            segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: ['caption-overlay-layer'],
          }],
          dependencyKeys: [],
          approvedToolIds: ['libass'],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 2,
          attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 1,
          required: true,
        },
        {
          workItemKey: 'final-export',
          workItemType: 'render_final_export',
          workerClass: 'render_worker',
          executionInput: {
            operation: 'render_approved_source_caption_final',
            approvedToolOperationIds: ['tool.remotion.render_approved_composition.v1'],
            expectedOutputKeys: ['final-export'],
            structuredPayload: {
              compositionProfileId: 'approved_source_caption_final_v1',
              width: 2160,
              height: 3840,
              fps: 30,
              durationFrames: 150,
              sourceStartFrame: 0,
              sourceEndFrameExclusive: 150,
              sourceFit: 'contain',
              panelBackground: '#000000',
              audioPolicy: 'preserve_source',
              renderPurpose: 'private_4k_delivery_master_v1',
              deliveryProfileId: 'uhd_2160',
              estimateCostBasisProfileId: 'uhd_2160',
              sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
              usesApprovedEditReservation: true,
              requiresSeparateExportEstimate: false,
              allowsAdditionalExportCharge: false,
              captionOverlayPolicy: 'approved_full_frame_rgba',
            },
          },
          sourceSequenceItemIds: ['source-1'],
          sourceCleanupDecisionIds: ['cleanup-decision-source-1'],
          expectedOutputs: [{
            outputKey: 'final-export',
            artifactType: 'private_source_caption_4k_delivery_master_v1',
            assetRole: 'final',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'video/mp4',
            segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: ['source-video-layer', 'caption-overlay-layer'],
          }],
          dependencyKeys: ['source-trim', 'caption-overlay'],
          approvedToolIds: ['remotion'],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 2,
          attemptTimeoutSeconds: 1_800,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 4,
          required: true,
        },
        {
          workItemKey: 'final-qa',
          workItemType: 'run_final_qa',
          workerClass: 'qa_worker',
          executionInput: {
            operation: 'inspect_final_artifact',
            approvedToolOperationIds: ['tool.ffprobe.inspect_approved_media.v1'],
            expectedOutputKeys: ['final-qa-report'],
            structuredPayload: {
              inspectionProfileId: 'final_export_v1',
              countFrames: true,
              verifyDurationAndSync: true,
              emitMachineJsonOnly: true,
            },
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
            segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: ['source-video-layer', 'caption-overlay-layer'],
          }],
          dependencyKeys: ['final-export'],
          approvedToolIds: ['ffprobe'],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 2,
          attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 2,
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
      expectation: handoff.planningInputAuthority as PlanningInputAuthorityExpectation,
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
      planningInputRevision: evidence.preferenceRecord.planning.planningInputRevision,
      preferenceFingerprintSha256: exactEditPreferenceFingerprint(evidence.preferenceRecord.values),
      sourcePreparationEvidenceHash: sha256ForSmoke(
        `source-preparation:${targetWorkspaceId}:${projectId}:${editSessionId}`,
      ),
      sourceCandidateHash: null,
      frameConfirmationId: `frame-confirmation-${editSessionId}`,
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
  sourceTrim.workItemType = 'prepare_source_trim'
  sourceTrim.workerClass = 'authority_worker'
  sourceTrim.executionInput = { operation: 'validate_approved_source_trim_plan' }
  sourceTrim.expectedOutputs = [{
    outputKey: 'source-trim-validation-evidence',
    artifactType: 'source_trim_validation_evidence',
    assetRole: 'qa',
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'application/json',
    segmentIds: ['segment-1'],
    timingIds: ['master-timing-plan'],
    rendererLayerIds: [],
  }]
  sourceTrim.approvedToolIds = []
  sourceTrim.dependencyKeys = ['snapshot-validation']
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
    toolIds: ['libass', 'remotion', 'd3', 'echarts'],
  }

  const preview = compileCanonicalWorkItems(body.canonicalPlan.workItems)
  assert.equal(preview.evidence.sourceWorkItemCount, 6)
  assert.equal(preview.evidence.compiledWorkItemCount, 7)
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
    'final-export',
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
  assert.equal(publishedWorkItems.length, 7)
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
  assert.equal(persistedCompilation.compiledWorkItemCount, 7)
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
  assert.equal(approvedJobs.length, 7)
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
  assert.equal(executionPackage.jobs.length, 7)
  assert.equal(executionPackage.approvedToolIds.includes('d3'), true)
  assert.equal(executionPackage.approvedToolIds.includes('echarts'), true)
  assert.equal(executionPackage.jobs.every((job) =>
    job.approvedToolOperationIds.length <= 1), true)
}

async function proveCanonicalStorytellingStyleAuthority(
  serviceContext: ServiceContext,
): Promise<void> {
  const targetWorkspaceId = 'workspace-storytelling-style-authority'
  const editSessionId = 'edit-session-storytelling-style-authority'
  const project = (await createProjectService(serviceContext).createProject({
    workspaceId: targetWorkspaceId,
    name: 'Storytelling style authority integration',
  })).project
  const planningInputAuthority = await prepareExactPlanningAuthority(
    serviceContext,
    project.id,
    editSessionId,
    targetWorkspaceId,
  )
  const sourceMediaFixture = await prepareSourceMediaAuthority(
    serviceContext,
    targetWorkspaceId,
    project.id,
    'storytelling-style-authority',
  )
  const styleSource = createStorytellingStylePlanReviewSource({
    workspaceId: targetWorkspaceId,
    projectId: project.id,
    editSessionId,
    productionId: 'production-storytelling-style-authority',
    revision: 1,
  })
  const firstStyle = projectCanonicalStorytellingStyleAuthority(styleSource)
  const firstBody = createCanonicalPlanBody(
    'planning-storytelling-style-authority-v1',
    planningInputAuthority,
    sourceMediaFixture,
  )
  firstBody.workspaceId = targetWorkspaceId
  firstBody.canonicalPlan.components.motionStudioStorytellingStyleAuthority = firstStyle

  const handoffService = createCanonicalPlanningHandoffService(serviceContext)
  const orderedSourceItems = sourceMediaFixture.sourceSequence.map((item) => ({
    ...item,
    checksumSha256: String(item.checksumSha256),
  }))
  const firstHandoff = await handoffService.prepare({
    workspaceId: targetWorkspaceId,
    projectId: project.id,
    editSessionId,
    purpose: 'prepare_canonical_planning_handoff',
    orderedSourceItems,
    canonicalPlanComponents: firstBody.canonicalPlan.components,
  })
  assert.match(firstHandoff.canonicalPlanComponentsHash, /^[a-f0-9]{64}$/)
  const crossScopeHandoffComponents = structuredClone(firstBody.canonicalPlan.components)
  crossScopeHandoffComponents.motionStudioStorytellingStyleAuthority!.projectId =
    'project-substituted-style-handoff'
  await expectApiError(
    () => handoffService.prepare({
      workspaceId: targetWorkspaceId,
      projectId: project.id,
      editSessionId,
      purpose: 'prepare_canonical_planning_handoff',
      orderedSourceItems,
      canonicalPlanComponents: crossScopeHandoffComponents,
    }),
    'IDEMPOTENCY_CONFLICT',
    'Cross-project Storytelling style authority must fail before handoff persistence.',
  )
  firstBody.planningInputAuthority = firstHandoff.planningInputAuthority

  const service = createEditPlanningAuthorityService(serviceContext)
  const firstPublished = await service.publishCanonicalPlan({
    ...firstBody,
    projectId: project.id,
    editSessionId,
    idempotencyKey: 'publish-storytelling-style-authority-v1',
  })
  const firstAuthority = asRecord(firstPublished.authority)
  const firstPlan = asRecord(firstAuthority.plan)
  const firstEstimate = asRecord(firstAuthority.estimate)
  const firstStyleRef = asRecord(asRecord(firstPlan.componentRefs)
    .motionStudioStorytellingStyleAuthority)
  assert.match(String(firstStyleRef.sha256), /^[a-f0-9]{64}$/)
  const persistedFirstStyle = await readPrivateAuthorityJsonBlob({
    localStorageRoot: serviceContext.env.localStorageRoot,
    ref: {
      sha256: String(firstStyleRef.sha256),
      byteLength: Number(firstStyleRef.byteLength),
    },
  })
  assert.deepEqual(persistedFirstStyle, firstStyle)

  const changedSource = createStorytellingStylePlanReviewSource({
    workspaceId: targetWorkspaceId,
    projectId: project.id,
    editSessionId,
    productionId: styleSource.productionId,
    revision: 2,
  })
  const changedStyle = projectCanonicalStorytellingStyleAuthority(changedSource)
  const changedBody = createCanonicalPlanBody(
    'planning-storytelling-style-authority-v2',
    planningInputAuthority,
    sourceMediaFixture,
  )
  changedBody.workspaceId = targetWorkspaceId
  changedBody.canonicalPlan.components.motionStudioStorytellingStyleAuthority = changedStyle
  const changedHandoff = await handoffService.prepare({
    workspaceId: targetWorkspaceId,
    projectId: project.id,
    editSessionId,
    purpose: 'prepare_canonical_planning_handoff',
    orderedSourceItems,
    canonicalPlanComponents: changedBody.canonicalPlan.components,
  })
  assert.notEqual(
    changedHandoff.canonicalPlanComponentsHash,
    firstHandoff.canonicalPlanComponentsHash,
    'Changed style authority must create a fresh planning handoff identity.',
  )
  changedBody.planningInputAuthority = changedHandoff.planningInputAuthority
  const changedPublished = await service.publishCanonicalPlan({
    ...changedBody,
    projectId: project.id,
    editSessionId,
    idempotencyKey: 'publish-storytelling-style-authority-v2',
  })
  const changedAuthority = asRecord(changedPublished.authority)
  const changedPlan = asRecord(changedAuthority.plan)
  const changedEstimate = asRecord(changedAuthority.estimate)
  const changedStyleRef = asRecord(asRecord(changedPlan.componentRefs)
    .motionStudioStorytellingStyleAuthority)
  assert.notEqual(changedStyleRef.sha256, firstStyleRef.sha256)
  assert.notEqual(changedPlan.planHash, firstPlan.planHash)

  const aggregateAfterChange = await readPrivateEditAuthorityAggregate({
    localStorageRoot: serviceContext.env.localStorageRoot,
    ownerUserId: userId,
    workspaceId: targetWorkspaceId,
  })
  assert.ok(aggregateAfterChange)
  assert.equal(
    aggregateAfterChange.plans.find((plan) => plan.id === firstPlan.id)?.status,
    'superseded',
  )
  assert.equal(
    aggregateAfterChange.estimates.find((estimate) => estimate.id === firstEstimate.id)?.status,
    'superseded',
  )

  const approved = await service.approveAndFundCanonicalPlan({
    workspaceId: targetWorkspaceId,
    editPlanId: String(changedPlan.id),
    expectedAuthorityRevision: Number(changedAuthority.authorityRevision),
    expectedPlanHash: String(changedPlan.planHash),
    expectedEstimateHash: String(changedEstimate.estimateHash),
    idempotencyKey: 'approve-storytelling-style-authority-v2',
  })
  const snapshot = asRecord(asRecord(approved.authority).snapshot)
  const snapshotStyleRef = asRecord(asRecord(snapshot.componentRefs)
    .motionStudioStorytellingStyleAuthority)
  assert.deepEqual(snapshotStyleRef, changedStyleRef)
  const loaded = await service.loadApprovedExecutionAuthority(
    String(snapshot.snapshotId),
    targetWorkspaceId,
  )
  assert.deepEqual(loaded.components.motionStudioStorytellingStyleAuthority, changedStyle)
  assert.equal(
    loaded.components.motionStudioStorytellingStyleAuthority?.internalCostEnvelope
      .customerPriceIncluded,
    false,
  )
  assert.equal(
    loaded.components.motionStudioStorytellingStyleAuthority?.internalCostEnvelope
      .customerCreditsIncluded,
    false,
  )
  assert.equal(
    loaded.components.motionStudioStorytellingStyleAuthority?.internalCostEnvelope
      .serviceFeeIncluded,
    false,
  )
  assert.equal(
    loaded.components.motionStudioStorytellingStyleAuthority?.internalCostEnvelope.unit,
    'usd_micros',
  )
  assert.equal(
    loaded.components.motionStudioStorytellingStyleAuthority?.customerCommercialAuthorityGranted,
    false,
  )
  assert.equal(
    loaded.components.motionStudioStorytellingStyleAuthority?.sourceRepositoryReverified,
    false,
  )

  const postApprovalStyleSource = createStorytellingStylePlanReviewSource({
    workspaceId: targetWorkspaceId,
    projectId: project.id,
    editSessionId,
    productionId: styleSource.productionId,
    revision: 3,
  })
  const postApprovalBody = createCanonicalPlanBody(
    'planning-storytelling-style-authority-v3',
    planningInputAuthority,
    sourceMediaFixture,
  )
  postApprovalBody.workspaceId = targetWorkspaceId
  postApprovalBody.planningInputAuthority = await buildCurrentPlanningInputAuthorityExpectation({
    context: serviceContext,
    scope: {
      localStorageRoot: serviceContext.env.localStorageRoot,
      ownerUserId: userId,
      workspaceId: targetWorkspaceId,
      projectId: project.id,
      editSessionId,
    },
  })
  postApprovalBody.canonicalPlan.components.motionStudioStorytellingStyleAuthority =
    projectCanonicalStorytellingStyleAuthority(postApprovalStyleSource)
  await expectApiError(
    () => service.publishCanonicalPlan({
      ...postApprovalBody,
      projectId: project.id,
      editSessionId,
      idempotencyKey: 'publish-storytelling-style-authority-v3-without-revision',
    }),
    'PLAN_NOT_APPROVED',
    'Changed approved style must require the existing explicit revision flow and a new immutable snapshot cycle.',
  )
  const historical = await service.loadApprovedExecutionAuthority(
    String(snapshot.snapshotId),
    targetWorkspaceId,
  )
  assert.equal(historical.snapshot.snapshotHash, snapshot.snapshotHash)
  assert.deepEqual(historical.components.motionStudioStorytellingStyleAuthority, changedStyle)

  const crossScopeBody = structuredClone(changedBody)
  crossScopeBody.canonicalPlan.components.motionStudioStorytellingStyleAuthority!.projectId =
    'project-substituted-style-authority'
  await expectApiError(
    () => service.publishCanonicalPlan({
      ...crossScopeBody,
      planningRequestId: 'planning-storytelling-style-cross-scope',
      projectId: project.id,
      editSessionId,
      idempotencyKey: 'publish-storytelling-style-cross-scope',
    }),
    'IDEMPOTENCY_CONFLICT',
    'Cross-project Storytelling style authority must fail before persistence.',
  )
}

async function proveCanonicalIdeaFirstStorytellingProductionAuthority(
  serviceContext: ServiceContext,
): Promise<void> {
  const targetWorkspaceId = 'workspace-storytelling-style-authority'
  const editSessionId = 'edit-session-idea-first-storytelling-authority'
  const project = (await createProjectService(serviceContext).createProject({
    workspaceId: targetWorkspaceId,
    name: 'Idea-first Storytelling production authority',
  })).project
  const planningInputAuthority = await prepareExactPlanningAuthority(
    serviceContext,
    project.id,
    editSessionId,
    targetWorkspaceId,
  )
  const style = projectCanonicalStorytellingStyleAuthority(
    createStorytellingStylePlanReviewSource({
      workspaceId: targetWorkspaceId,
      projectId: project.id,
      editSessionId,
      productionId: 'production-idea-first-storytelling-authority',
      revision: 1,
    }),
  )
  const body = createCanonicalPlanBody(
    'planning-idea-first-storytelling-authority-v1',
    planningInputAuthority,
    inMemoryPlanBuilderSourcePlaceholder(),
  )
  body.workspaceId = targetWorkspaceId
  body.canonicalPlan.components.compiledIntent = {
    goal: 'Create one private idea-first Storytelling animatic from approved Motion artifacts.',
    sourceMode: 'idea_first_no_uploaded_media',
  }
  body.canonicalPlan.components.professionalEditingDirective = {
    pacing: 'approved_prepared_script_timing',
    mustFollowRules: [
      'Do not fabricate uploaded footage.',
      'Do not authorize live provider transport or final delivery.',
    ],
  }
  body.canonicalPlan.components.sourceSequence = []
  body.canonicalPlan.components.sourceCleanupSummary = {
    status: 'not_applicable',
    cleanupPreference: 'balanced_cleanup',
    trimValidationStatus: 'not_applicable',
    meaningValidationStatus: 'not_applicable',
    userReviewRequired: false,
    reason: 'idea_first_storytelling_has_no_uploaded_media_source',
  }
  body.canonicalPlan.components.sourceCleanupPlan = {
    status: 'not_applicable',
    decisions: [],
    reason: 'idea_first_storytelling_has_no_uploaded_media_source',
  }
  body.canonicalPlan.components.segments = [{
    segmentId: 'segment-1',
    startFrame: 0,
    endFrameExclusive: body.canonicalPlan.components.timingSummary.totalFrames,
    operationIds: [
      'bind-approved-narration',
      'render-approved-storytelling-animatic',
      'validate-private-storytelling-animatic',
    ],
  }]
  body.canonicalPlan.components.visualAssetPlan = {
    assets: [],
    ideaFirstStorytelling: true,
    fabricatedUploadedMediaAllowed: false,
  }
  body.canonicalPlan.components.rendererPlan = {
    renderer: 'remotion',
    compositionProfileId: 'motion_studio_prepared_script_animatic_v1',
    privatePreviewOnly: true,
    finalDeliveryAuthorized: false,
  }
  body.canonicalPlan.components.toolStrategyPlan = {
    toolIds: ['remotion', 'ffmpeg'],
    exactOperationIds: [
      'tool.remotion.render_approved_composition.v1',
      OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    ],
    providerExecutionAuthorized: false,
  }
  body.canonicalPlan.components.qaPlan = {
    status: 'passed',
    checks: ['artifact_lineage', 'timing', 'frame', 'private_preview_only'],
  }
  body.canonicalPlan.components.providerPolicy = {
    veoPolicy: 'forbidden',
    approvedRoutes: ['gemini_omni_flash'],
  }
  body.canonicalPlan.components.fallbackPolicy = {
    unapprovedFallbackAllowed: false,
    providerFallbackAuthorized: false,
  }
  body.canonicalPlan.components.motionStudioStorytellingStyleAuthority = style

  const productionAuthority = createIdeaFirstStorytellingProductionAuthority({
    style,
    components: body.canonicalPlan.components,
  })
  body.canonicalPlan.components.motionStudioStorytellingProductionAuthority =
    productionAuthority
  const sourceCandidate = buildCanonicalIdeaFirstSourceBindingManifestCandidate(
    productionAuthority,
  )
  body.sourceMediaAuthority = {
    authorityKind: 'idea_first_storytelling_v1',
    authorityRevision: sourceCandidate.authorityRevision,
    authorityChecksumSha256: sourceCandidate.authorityChecksumSha256,
    sourceSequenceHash: sourceCandidate.sourceSequenceHash,
    candidateHash: sourceCandidate.candidateHash,
    productionAuthorityHash: sourceCandidate.productionAuthorityHash,
    sourceProposalDigest: sourceCandidate.sourceProposalDigest,
    sourceArtifactApprovalSnapshotId:
      sourceCandidate.sourceArtifactApprovalSnapshotId,
  }
  body.canonicalPlan.workItems = createIdeaFirstStorytellingWorkItems({
    components: body.canonicalPlan.components,
    productionAuthority,
  })
  const animaticWorkItem = body.canonicalPlan.workItems.find((workItem) =>
    workItem.workItemKey === 'idea-first-storytelling-animatic-preview')
  assert.ok(animaticWorkItem)
  assertCanonicalMotionStudioRemotionDependencyArtifact({
    workItem: animaticWorkItem,
    dependency: {
      contentType: 'audio/wav',
      byteLength: productionAuthority.narrationPolicy.mode ===
        'verified_uploaded_narration'
        ? productionAuthority.narrationPolicy.byteLength
        : 0,
      sha256: productionAuthority.narrationPolicy.mode ===
        'verified_uploaded_narration'
        ? productionAuthority.narrationPolicy.checksumSha256
        : sha256ForSmoke('unreachable-generated-narration'),
    },
  })
  assert.throws(
    () => assertCanonicalMotionStudioRemotionDependencyArtifact({
      workItem: animaticWorkItem,
      dependency: {
        contentType: 'audio/wav',
        byteLength: productionAuthority.narrationPolicy.mode ===
          'verified_uploaded_narration'
          ? productionAuthority.narrationPolicy.byteLength
          : 0,
        sha256: sha256ForSmoke('substituted-storytelling-narration'),
      },
    }),
    (error) => error instanceof ApiError && error.code === 'TOOL_NOT_READY',
  )
  const generatedAuthorityWithoutHash = structuredClone(productionAuthority) as Omit<
    CanonicalMotionStudioStorytellingProductionAuthority,
    'authorityHash'
  > & { authorityHash?: string }
  delete generatedAuthorityWithoutHash.authorityHash
  generatedAuthorityWithoutHash.narrationPolicy = {
    mode: 'generated_speech_required',
    requiredByPreviewProfile: true,
    voiceBibleVersion: productionAuthority.narrationPolicy.voiceBibleVersion,
    voiceProfileReference: 'voice-profile-storytelling-approved-v1',
    segmentRequirements: [{
      preparedScriptSegmentId: 'prepared-script-segment-storytelling-1',
      sceneId: productionAuthority.orderedScenes[0]!.sceneId,
      startFrame: 0,
      endFrame: productionAuthority.timingAuthority.durationFrames,
      spokenTextDigest: sha256ForSmoke('prepared-script-spoken-text-storytelling-1'),
    }],
    expectedProviderOperationId:
      'provider.elevenlabs.generate_storytelling_speech_candidate.v1',
    normalizedNarrationRequiredBeforePreview: true,
    providerExecutionAuthorized: false,
  }
  const generatedAuthority =
    canonicalMotionStudioStorytellingProductionAuthoritySchema.parse({
      ...generatedAuthorityWithoutHash,
      authorityHash: sha256AuthorityValue(generatedAuthorityWithoutHash),
    })
  assert.equal(generatedAuthority.narrationPolicy.providerExecutionAuthorized, false)

  const handoffService = createCanonicalPlanningHandoffService(serviceContext)
  const previousReader =
    serviceContext.canonicalMotionStudioStorytellingProductionAuthorityReaderPort
  delete serviceContext.canonicalMotionStudioStorytellingProductionAuthorityReaderPort
  try {
    await expectApiError(
      () => handoffService.prepare({
        workspaceId: targetWorkspaceId,
        projectId: project.id,
        editSessionId,
        purpose: 'prepare_canonical_planning_handoff',
        orderedSourceItems: [],
        canonicalPlanComponents: body.canonicalPlan.components,
      }),
      'TOOL_NOT_READY',
      'Idea-first Storytelling must fail before mutation when its exact server reader is absent.',
    )

    const ordinaryZeroSource = structuredClone(body.canonicalPlan.components)
    delete ordinaryZeroSource.motionStudioStorytellingProductionAuthority
    await expectApiError(
      () => handoffService.prepare({
        workspaceId: targetWorkspaceId,
        projectId: project.id,
        editSessionId,
        purpose: 'prepare_canonical_planning_handoff',
        orderedSourceItems: [],
        canonicalPlanComponents: ordinaryZeroSource,
      }),
      'VALIDATION_FAILED',
      'Ordinary canonical edits must retain exact finalized uploaded-source and cleanup authority.',
    )

    const fabricatedSourceComponents = structuredClone(body.canonicalPlan.components)
    fabricatedSourceComponents.sourceSequence = [{
      sourceSequenceItemId: 'fabricated-idea-first-source',
      mediaAssetId: 'fabricated-idea-first-media',
      uploadedOrder: 1,
      checksumSha256: sha256ForSmoke('fabricated-idea-first-source'),
      required: true,
    }]
    await expectApiError(
      () => handoffService.prepare({
        workspaceId: targetWorkspaceId,
        projectId: project.id,
        editSessionId,
        purpose: 'prepare_canonical_planning_handoff',
        orderedSourceItems: fabricatedSourceComponents.sourceSequence.map((item) => ({
          ...item,
          checksumSha256: String(item.checksumSha256),
        })),
        canonicalPlanComponents: fabricatedSourceComponents,
      }),
      'VALIDATION_FAILED',
      'Idea-first Storytelling must reject fabricated uploaded-source records.',
    )

    let sourceVerifiedAuthority: CanonicalMotionStudioStorytellingProductionAuthority =
      productionAuthority
    let readerCallCount = 0
    serviceContext.canonicalMotionStudioStorytellingProductionAuthorityReaderPort = {
      schemaVersion:
        CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION,
      sourceAuthority: 'motion_studio_storytelling_artifact_repository',
      evidenceClass: 'controlled_local_source_verified_non_promotable',
      productionReady: false,
      async readAndVerifyAuthority(input) {
        readerCallCount += 1
        assert.equal(input.workspaceId, targetWorkspaceId)
        assert.equal(input.projectId, project.id)
        assert.equal(input.editSessionId, editSessionId)
        assert.equal(input.productionId, productionAuthority.productionId)
        assert.equal(
          input.expectedComponentProposalDigest,
          productionAuthority.sourceProposal.componentProposalDigest,
        )
        assert.equal(input.expectedAuthorityHash, productionAuthority.authorityHash)
        return structuredClone(sourceVerifiedAuthority)
      },
    }

    const handoff = await handoffService.prepare({
      workspaceId: targetWorkspaceId,
      projectId: project.id,
      editSessionId,
      purpose: 'prepare_canonical_planning_handoff',
      orderedSourceItems: [],
      canonicalPlanComponents: body.canonicalPlan.components,
    })
    assert.equal(handoff.sourceBindingManifestCandidate.bindings.length, 0)
    assert.equal(handoff.sourceBindingManifestCandidate.requiredBindingCount, 0)
    assert.equal(
      handoff.sourceBindingManifestCandidate.schemaVersion,
      'private-idea-first-source-authority-candidate-v1',
    )
    assert.equal(
      'sourceAuthorityMode' in handoff.readiness &&
        handoff.readiness.sourceAuthorityMode,
      'idea_first_no_uploaded_media',
    )
    assert.equal(handoff.readiness.finalizedSourceMediaVerified, false)
    assert.equal(
      'ideaFirstStorytellingAuthorityVerified' in handoff.readiness &&
        handoff.readiness.ideaFirstStorytellingAuthorityVerified,
      true,
    )
    assert.equal(handoff.noPlanPublished, true)
    assert.equal(handoff.noSnapshotCreated, true)
    assert.equal(handoff.noCreditReservation, true)
    assert.equal(handoff.noToolExecution, true)
    assert.equal(handoff.noProviderCall, true)
    assert.equal(handoff.noRender, true)

    const staleAuthorityWithoutHash = structuredClone(productionAuthority) as Omit<
      CanonicalMotionStudioStorytellingProductionAuthority,
      'authorityHash'
    > & { authorityHash?: string }
    delete staleAuthorityWithoutHash.authorityHash
    staleAuthorityWithoutHash.sourceVerification.sourceRepositoryRevision += 1
    sourceVerifiedAuthority = canonicalMotionStudioStorytellingProductionAuthoritySchema.parse({
      ...staleAuthorityWithoutHash,
      authorityHash: sha256AuthorityValue(staleAuthorityWithoutHash),
    })
    await expectApiError(
      () => handoffService.publishFromPersistedHandoff({
        workspaceId: targetWorkspaceId,
        projectId: project.id,
        editSessionId,
        handoffId: handoff.handoffId,
        planningRequestId: body.planningRequestId,
        canonicalPlan: body.canonicalPlan,
        expectedHandoffHash: handoff.handoffHash,
        idempotencyKey: 'publish-idea-first-storytelling-stale-reader',
      }),
      'IDEMPOTENCY_CONFLICT',
      'Changed Motion source authority must fail before canonical publication.',
    )
    sourceVerifiedAuthority = productionAuthority

    const published = await handoffService.publishFromPersistedHandoff({
      workspaceId: targetWorkspaceId,
      projectId: project.id,
      editSessionId,
      handoffId: handoff.handoffId,
      planningRequestId: body.planningRequestId,
      canonicalPlan: body.canonicalPlan,
      expectedHandoffHash: handoff.handoffHash,
      idempotencyKey: 'publish-idea-first-storytelling-authority-v1',
    })
    const publishedAuthority = asRecord(published.authority)
    const publishedPlan = asRecord(publishedAuthority.plan)
    const publishedEstimate = asRecord(publishedAuthority.estimate)
    assert.equal(publishedPlan.status, 'presented')
    assert.equal(publishedEstimate.status, 'presented')
    assert.ok(
      asRecord(publishedPlan.componentRefs)
        .motionStudioStorytellingProductionAuthority,
    )
    assert.equal(
      body.canonicalPlan.estimate.lineItems.some((line) =>
        line.label === '4K UHD render and export ceiling' && !line.removable),
      true,
    )

    const planningService = createEditPlanningAuthorityService(serviceContext)
    const approved = await planningService.approveAndFundCanonicalPlan({
      workspaceId: targetWorkspaceId,
      editPlanId: String(publishedPlan.id),
      expectedAuthorityRevision: Number(publishedAuthority.authorityRevision),
      expectedPlanHash: String(publishedPlan.planHash),
      expectedEstimateHash: String(publishedEstimate.estimateHash),
      idempotencyKey: 'approve-idea-first-storytelling-authority-v1',
    })
    const snapshot = asRecord(asRecord(approved.authority).snapshot)
    const loaded = await planningService.loadApprovedExecutionAuthority(
      String(snapshot.snapshotId),
      targetWorkspaceId,
    )
    assert.deepEqual(
      loaded.components.motionStudioStorytellingProductionAuthority,
      productionAuthority,
    )
    assert.equal(
      loaded.sourceAssetManifest.schemaVersion,
      'private-approved-idea-first-source-authority-manifest-v1',
    )
    assert.equal(loaded.sourceAssetManifest.bindings.length, 0)
    assert.equal(loaded.sourceAssetManifest.requiredBindingCount, 0)
    if (
      loaded.sourceAssetManifest.schemaVersion ===
      'private-approved-idea-first-source-authority-manifest-v1'
    ) {
      assert.equal(loaded.sourceAssetManifest.fabricatedUploadRecordCount, 0)
      assert.equal(loaded.sourceAssetManifest.productionAuthorityHash, productionAuthority.authorityHash)
      assert.equal(loaded.sourceAssetManifest.editSessionId, editSessionId)
      assert.equal(loaded.sourceAssetManifest.productionId, productionAuthority.productionId)
    }
    assert.equal(loaded.jobs.length, body.canonicalPlan.workItems.length)
    assert.equal(
      loaded.jobs.some((job) => job.jobType === 'render_final_export'),
      false,
    )
    assert.equal(
      loaded.workItems.some((workItem) =>
        workItem.workItemType === 'render_final_export' ||
        workItem.workItemType === 'run_final_qa'),
      false,
    )
    const approvedProviderWork = loaded.workItems.filter((workItem) =>
      workItem.approvedProviderRoute !== undefined)
    assert.equal(approvedProviderWork.length, 1)
    assert.equal(
      approvedProviderWork[0]?.workItemType,
      'generate_visual_calibration_candidate',
    )
    assert.equal(approvedProviderWork[0]?.approvedProviderRoute, 'gemini_omni_flash')
    const visualQaWork = loaded.workItems.find((workItem) =>
      workItem.workItemKey === 'idea-first-visual-calibration-objective-qa')
    assert.deepEqual(
      visualQaWork?.dependencyKeys,
      ['idea-first-visual-calibration-provider'],
    )
    assert.equal(
      loaded.components.motionStudioStorytellingProductionAuthority
        ?.providerExecutionAuthorized,
      false,
    )
    assert.equal(
      loaded.components.motionStudioStorytellingProductionAuthority
        ?.internalCostAuthority.customerPriceIncluded,
      false,
    )
    assert.equal(
      loaded.components.motionStudioStorytellingProductionAuthority
        ?.internalCostAuthority.customerCreditsIncluded,
      false,
    )
    assert.equal(
      loaded.components.motionStudioStorytellingProductionAuthority
        ?.internalCostAuthority.serviceFeeIncluded,
      false,
    )
    const uploadAuthority = await readPrivateUploadMediaAuthorityAggregate({
      localStorageRoot: serviceContext.env.localStorageRoot,
      ownerUserId: userId,
      workspaceId: targetWorkspaceId,
    })
    assert.equal(
      uploadAuthority?.uploadIntents.some((record) => record.projectId === project.id) ?? false,
      false,
    )
    assert.equal(
      uploadAuthority?.mediaAssets.some((record) => record.projectId === project.id) ?? false,
      false,
    )

    sourceVerifiedAuthority = canonicalMotionStudioStorytellingProductionAuthoritySchema.parse({
      ...staleAuthorityWithoutHash,
      authorityHash: sha256AuthorityValue(staleAuthorityWithoutHash),
    })
    await expectApiError(
      () => planningService.loadApprovedExecutionAuthority(
        String(snapshot.snapshotId),
        targetWorkspaceId,
      ),
      'IDEMPOTENCY_CONFLICT',
      'A stale Motion repository read must not silently reinterpret an immutable historical snapshot.',
    )
    sourceVerifiedAuthority = productionAuthority
    const historical = await planningService.loadApprovedExecutionAuthority(
      String(snapshot.snapshotId),
      targetWorkspaceId,
    )
    assert.equal(historical.snapshot.snapshotHash, snapshot.snapshotHash)
    assert.deepEqual(
      historical.components.motionStudioStorytellingProductionAuthority,
      productionAuthority,
    )
    assert.ok(readerCallCount >= 7)
  } finally {
    if (previousReader) {
      serviceContext.canonicalMotionStudioStorytellingProductionAuthorityReaderPort =
        previousReader
    } else {
      delete serviceContext.canonicalMotionStudioStorytellingProductionAuthorityReaderPort
    }
  }
}

function inMemoryPlanBuilderSourcePlaceholder(): SourceMediaFixture {
  return {
    expectation: {
      authorityRevision: 1,
      authorityChecksumSha256: sha256ForSmoke('in-memory-plan-builder-source-authority'),
      sourceSequenceHash: sha256ForSmoke('in-memory-plan-builder-source-sequence'),
      candidateHash: sha256ForSmoke('in-memory-plan-builder-source-candidate'),
    },
    sourceSequence: [{
      sourceSequenceItemId: 'in-memory-plan-builder-source',
      mediaAssetId: 'in-memory-plan-builder-media',
      uploadedOrder: 1,
      checksumSha256: sha256ForSmoke('in-memory-plan-builder-source-bytes'),
      required: true,
    }],
  }
}

function createIdeaFirstStorytellingProductionAuthority(input: {
  style: ReturnType<typeof projectCanonicalStorytellingStyleAuthority>
  components: PublishCanonicalEditPlanBody['canonicalPlan']['components']
}): CanonicalMotionStudioStorytellingProductionAuthority {
  const totalFrames = input.components.timingSummary.totalFrames
  const fps = input.components.timingSummary.fps === 24 ? 24 : 30
  const timingAuthorityDigest = sha256ForSmoke('idea-first-motion-source-timing-authority')
  const preparedScriptVersion = {
    artifactId: 'prepared-script-idea-first-storytelling',
    versionId: 'prepared-script-idea-first-storytelling-v1',
    versionNumber: 1,
    contentDigest: sha256ForSmoke('prepared-script-idea-first-storytelling-v1'),
    state: 'locked' as const,
  }
  const sceneVersion = {
    artifactId: 'scene-document-idea-first-storytelling',
    versionId: 'scene-document-idea-first-storytelling-v1',
    versionNumber: 1,
    contentDigest: sha256ForSmoke('scene-document-idea-first-storytelling-v1'),
    state: 'approved' as const,
  }
  const voiceBibleVersion = {
    artifactId: 'voice-bible-idea-first-storytelling',
    versionId: 'voice-bible-idea-first-storytelling-v1',
    versionNumber: 1,
    contentDigest: sha256ForSmoke('voice-bible-idea-first-storytelling-v1'),
    state: 'locked' as const,
  }
  const authorityWithoutHash = {
    schemaVersion: 'canonical-motion-studio-storytelling-production-authority-v1' as const,
    componentKey: 'motionStudioStorytellingProductionAuthority' as const,
    sourceProposal: {
      schemaVersion: 'motion-studio.storytelling-production-authority-proposal.v1' as const,
      componentProposalDigest: sha256ForSmoke('accepted-motion-storytelling-production-proposal'),
      evidenceClass: 'motion_feature_owned_proposal_backend_admission_pending' as const,
      canonicalBackendAdmissionAuthorized: false as const,
    },
    sourceVerification: {
      readerVersion:
        CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION,
      sourceAuthority: 'motion_studio_storytelling_artifact_repository' as const,
      evidenceClass: 'controlled_local_source_verified_non_promotable' as const,
      sourceRepositoryRevision: 1,
      sourceRepositoryReadDigest: sha256ForSmoke('motion-storytelling-source-repository-read'),
      sourcePayloadDigestsReverified: true as const,
      exactScopeReverified: true as const,
      exactApprovalStatesReverified: true as const,
    },
    workspaceId: input.style.workspaceId,
    projectId: input.style.projectId,
    editSessionId: input.style.editSessionId,
    productionId: input.style.productionId,
    sourceMode: 'idea_first_no_uploaded_media' as const,
    preparedScript: {
      version: preparedScriptVersion,
      scriptId: 'script-idea-first-storytelling',
      userLockedText: true as const,
      narrationSegmentCount: 1,
    },
    sourceArtifactApprovalSnapshotId: 'motion-source-artifact-approval-snapshot-v1',
    orderedScenes: [{
      order: 0,
      sceneId: 'scene-idea-first-storytelling-1',
      chapterId: 'chapter-idea-first-storytelling-1',
      title: 'Approved opening Storytelling scene',
      semanticPurpose: 'Introduce the approved idea with exact narration and timing.',
      productionMode: 'native_graphics_first' as const,
      version: sceneVersion,
      startTimingAnchorId: 'timing-anchor-storytelling-start',
      endTimingAnchorId: 'timing-anchor-storytelling-end',
      startFrame: 0,
      endFrame: totalFrames,
    }],
    narrationPolicy: {
      mode: 'verified_uploaded_narration' as const,
      requiredByPreviewProfile: true as const,
      voiceBibleVersion,
      uploadedNarrationAuthorityDigest: sha256ForSmoke('verified-uploaded-narration-authority'),
      mediaAssetId: 'motion-narration-media-asset-v1',
      storageObjectRecordId: 'motion-narration-storage-object-v1',
      checksumSha256: sha256ForSmoke('verified-uploaded-narration-bytes'),
      mimeType: 'audio/wav' as const,
      byteLength: 48_044,
      durationMilliseconds: Math.ceil((totalFrames / fps) * 1_000),
      normalizedNarrationRequiredBeforePreview: false as const,
      providerExecutionAuthorized: false as const,
    },
    timingAuthority: {
      masterTimingPlanVersionId: 'master-timing-plan-idea-first-storytelling-v1',
      confirmedFrameId: 'confirmed-frame-idea-first-storytelling-v1',
      timingAuthorityDigest,
      frameRate: fps,
      width: input.components.confirmedSettings.outputFrame.width,
      height: input.components.confirmedSettings.outputFrame.height,
      aspectRatio: input.components.confirmedSettings.aspectRatio,
      durationFrames: totalFrames,
      timebase: `${fps}/1`,
    },
    confirmedOutputFrame: {
      confirmedFrameId: 'confirmed-frame-idea-first-storytelling-v1',
      width: input.components.confirmedSettings.outputFrame.width,
      height: input.components.confirmedSettings.outputFrame.height,
      aspectRatio: input.components.confirmedSettings.aspectRatio,
      frameRate: fps,
      durationFrames: totalFrames,
      timingAuthorityDigest,
    },
    storytellingStyleAuthority: {
      componentKey: 'motionStudioStorytellingStyleAuthority' as const,
      componentDigest: sha256AuthorityValue(input.style),
      selectionDigest: input.style.styleSelection.selectionDigest,
      styleProfileId: input.style.styleSelection.styleProfile.styleProfileId,
      motionLanguageDigest: input.style.styleSelection.motionLanguage.motionLanguageDigest,
    },
    sourceCleanup: {
      applicability: 'not_applicable' as const,
      reason: 'idea_first_storytelling_has_no_uploaded_media_source' as const,
      decisionCount: 0 as const,
      fabricatedSourceRecordAllowed: false as const,
    },
    internalCostAuthority: {
      estimateId: input.style.internalCostEnvelope.estimateId,
      estimateDigest: input.style.internalCostEnvelope.estimateDigest,
      maximumAuthorizedInternalProductionCostMicros:
        input.style.internalCostEnvelope.maximumEstimatedInternalProductionCostMicros,
      internalProductionCostOnly: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
    },
    changedScriptSceneNarrationStyleFrameOrTimingRequiresFreshPlanAndEstimate: true as const,
    historicalApprovedSnapshotRemainsImmutable: true as const,
    sourceRepositoryReverified: true as const,
    noUploadedSourceExpected: true as const,
    fabricatedUploadRecordCount: 0 as const,
    privateInternalControlledPlanningOnly: true as const,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
  return canonicalMotionStudioStorytellingProductionAuthoritySchema.parse({
    ...authorityWithoutHash,
    authorityHash: sha256AuthorityValue(authorityWithoutHash),
  })
}

function createIdeaFirstStorytellingWorkItems(input: {
  components: PublishCanonicalEditPlanBody['canonicalPlan']['components']
  productionAuthority: CanonicalMotionStudioStorytellingProductionAuthority
}): PublishCanonicalEditPlanBody['canonicalPlan']['workItems'] {
  const style = input.components.motionStudioStorytellingStyleAuthority
  if (!style) throw new Error('Idea-first Storytelling smoke requires exact style authority.')
  const previewFrame = { width: 360 as const, height: 640 as const, fps: 30 as const }
  const bindingWithoutHash = {
    schemaVersion: CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_BINDING_VERSION,
    sourceAuthority: 'motion_studio_storytelling_compiler' as const,
    evidenceClass: 'controlled_local_content_addressed_non_promotable' as const,
    workspaceId: style.workspaceId,
    projectId: style.projectId,
    editSessionId: style.editSessionId,
    productionId: style.productionId,
    storytellingProductionAuthorityHash: input.productionAuthority.authorityHash,
    compositionProfileId: 'motion_studio_prepared_script_animatic_v1' as const,
    canonicalStyleComponentDigest: sha256AuthorityValue(style),
    styleSelectionDigest: style.styleSelection.selectionDigest,
    motionDna: { ...style.styleSelection.motionDnaVersion },
    referenceContracts: style.styleSelection.referenceContractVersions.map((item) => ({ ...item })),
    sourceAuditDigests: [...style.styleSelection.sourceAuditDigests],
    calibrationPlan: {
      id: style.calibrationPlan.id,
      digest: style.calibrationPlan.planDigest,
    },
    internalCostEnvelope: {
      estimateId: style.internalCostEnvelope.estimateId,
      digest: style.internalCostEnvelope.estimateDigest,
    },
    preparedScript: { ...input.productionAuthority.preparedScript.version },
    sceneDocuments: input.productionAuthority.orderedScenes.map((scene) => ({ ...scene.version })),
    narrationAuthorityDigest: sha256AuthorityValue(input.productionAuthority.narrationPolicy),
    narrationDependencyAuthority: {
      mode: 'verified_uploaded_narration' as const,
      narrationPolicyDigest: sha256AuthorityValue(input.productionAuthority.narrationPolicy),
      mediaAssetId: input.productionAuthority.narrationPolicy.mode ===
        'verified_uploaded_narration'
        ? input.productionAuthority.narrationPolicy.mediaAssetId
        : 'unreachable-generated-narration-media',
      storageObjectRecordId: input.productionAuthority.narrationPolicy.mode ===
        'verified_uploaded_narration'
        ? input.productionAuthority.narrationPolicy.storageObjectRecordId
        : 'unreachable-generated-narration-storage',
      checksumSha256: input.productionAuthority.narrationPolicy.mode ===
        'verified_uploaded_narration'
        ? input.productionAuthority.narrationPolicy.checksumSha256
        : sha256ForSmoke('unreachable-generated-narration'),
      mimeType: 'audio/wav' as const,
      byteLength: input.productionAuthority.narrationPolicy.mode ===
        'verified_uploaded_narration'
        ? input.productionAuthority.narrationPolicy.byteLength
        : 44,
      currentPrivateArtifactPresent: true as const,
      providerExecutionAuthorized: false as const,
    },
    timingAuthorityDigest: canonicalMotionStudioTimingAuthorityDigest(input.components),
    confirmedOutputFrame: { ...input.components.confirmedSettings.outputFrame },
    previewFrame,
    sourceRepositoryReverified: false as const,
    privateInternalControlledExecutionOnly: true as const,
    providerExecutionAuthorized: false as const,
    customerPriceIncluded: false as const,
    customerCreditsIncluded: false as const,
    serviceFeeIncluded: false as const,
    productionReady: false as const,
  }
  const binding = canonicalMotionStudioRemotionPreviewBindingSchema.parse({
    ...bindingWithoutHash,
    bindingHash: sha256AuthorityValue(bindingWithoutHash),
  })
  const calibrationScenarioIndex = style.calibrationPlan.scenarioKinds.indexOf(
    'style_led_motion',
  )
  const calibrationScenarioId =
    style.calibrationPlan.scenarioIds[calibrationScenarioIndex]
  const referenceContract = style.styleSelection.referenceContractVersions[0]
  if (calibrationScenarioIndex < 0 || !calibrationScenarioId || !referenceContract) {
    throw new Error(
      'Idea-first Storytelling smoke requires one visual calibration scenario and reference contract.',
    )
  }
  const firstFrameReference = {
    assetId: VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE.firstFrameAssetId,
    assetVersionId:
      VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE.firstFrameAssetVersionId,
    expectedSha256: VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE.sha256,
  }
  const lastFrameReference = {
    assetId: VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE.lastFrameAssetId,
    assetVersionId:
      VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE.lastFrameAssetVersionId,
    expectedSha256: VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE.sha256,
  }
  const visualCalibrationContext = {
    motionStudioProductionId: input.productionAuthority.productionId,
    storytellingStyleAuthorityRefDigest: sha256AuthorityValue(style),
    storytellingProductionAuthorityRefDigest:
      sha256AuthorityValue(input.productionAuthority),
    styleCalibrationPlanId: style.calibrationPlan.id,
    styleCalibrationPlanVersion: 1,
    styleCalibrationPlanDigest: style.calibrationPlan.planDigest,
    calibrationScenarioId,
    calibrationScenarioDigest: sha256ForSmoke(
      `storytelling-calibration-scenario:${calibrationScenarioId}:style_led_motion`,
    ),
    referenceContractId: referenceContract.artifactId,
    referenceContractVersion: referenceContract.versionNumber,
    referenceContractDigest: referenceContract.contentDigest,
    firstFrameAssetId: firstFrameReference.assetId,
    firstFrameSha256: firstFrameReference.expectedSha256,
    lastFrameAssetId: lastFrameReference.assetId,
    lastFrameSha256: lastFrameReference.expectedSha256,
    continuityContractId: 'storytelling-visual-continuity-contract',
    continuityContractVersion: 1,
    continuityContractDigest: sha256ForSmoke(
      'storytelling-visual-continuity-contract-v1',
    ),
  }
  const providerPlanningPayload =
    createCanonicalVisualCalibrationProviderPlanningPayload({
      visualCalibrationContext,
      maximumAuthorizedProviderCostMicros: 300_000,
      maximumAuthorizedInfrastructureCostMicros: 50_000,
    })
  const qaPlanningPayload =
    createCanonicalVisualCalibrationObjectiveQaPlanningPayload({
      motionStudioProductionId: visualCalibrationContext.motionStudioProductionId,
      storytellingStyleAuthorityRefDigest:
        visualCalibrationContext.storytellingStyleAuthorityRefDigest,
      storytellingProductionAuthorityRefDigest:
        visualCalibrationContext.storytellingProductionAuthorityRefDigest,
      styleCalibrationPlanId: visualCalibrationContext.styleCalibrationPlanId,
      styleCalibrationPlanVersion:
        visualCalibrationContext.styleCalibrationPlanVersion,
      styleCalibrationPlanDigest:
        visualCalibrationContext.styleCalibrationPlanDigest,
      calibrationScenarioId: visualCalibrationContext.calibrationScenarioId,
      calibrationScenarioKind: 'style_led_motion',
      calibrationScenarioDigest:
        visualCalibrationContext.calibrationScenarioDigest,
      visualCalibrationContextDigest:
        providerPlanningPayload.visualCalibrationContextDigest,
      sourceProviderWorkItemKey:
        'idea-first-visual-calibration-provider',
      sourceProviderExpectedOutputId:
        'idea-first-visual-calibration-provider-mp4',
      referenceContractId: visualCalibrationContext.referenceContractId,
      referenceContractVersion:
        visualCalibrationContext.referenceContractVersion,
      referenceContractDigest:
        visualCalibrationContext.referenceContractDigest,
      firstFrameReference,
      lastFrameReference,
      continuityContractId: visualCalibrationContext.continuityContractId,
      continuityContractVersion:
        visualCalibrationContext.continuityContractVersion,
      continuityContractDigest:
        visualCalibrationContext.continuityContractDigest,
      maximumAuthorizedInfrastructureCostMicros: 50_000,
    })
  const common = {
    sourceSequenceItemIds: [] as string[],
    sourceCleanupDecisionIds: [] as string[],
    providerExecutionMode: 'none' as const,
    fallbackPolicy: {},
    maxAttempts: 1,
    scheduledDelaySeconds: 0,
    required: true as const,
  }
  return [{
    workItemKey: 'idea-first-snapshot-validation',
    workItemType: 'validate_approved_snapshot',
    workerClass: 'authority_worker',
    executionInput: { operation: 'validate_snapshot_manifest' },
    ...common,
    expectedOutputs: [{
      outputKey: 'idea-first-snapshot-validation-evidence',
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
    attemptTimeoutSeconds: 60,
    maximumCreditBudget: 1,
  }, {
    workItemKey: 'idea-first-visual-calibration-provider',
    workItemType: 'generate_visual_calibration_candidate',
    workerClass: 'provider_worker',
    executionInput: {
      operation: CANONICAL_VISUAL_CALIBRATION_PROVIDER_PLANNING_OPERATION,
      expectedOutputKeys: ['idea-first-visual-calibration-provider-mp4'],
      structuredPayload: providerPlanningPayload,
    },
    sourceSequenceItemIds: [],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'idea-first-visual-calibration-provider-mp4',
      artifactType: 'provider_visual_calibration_video_mp4',
      assetRole: 'generated',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'video/mp4',
      segmentIds: [],
      timingIds: [],
      rendererLayerIds: [],
    }],
    dependencyKeys: [],
    approvedToolIds: [],
    approvedProviderRoute: 'gemini_omni_flash',
    providerExecutionMode: 'primary',
    fallbackPolicy: {},
    maxAttempts: 1,
    attemptTimeoutSeconds: 900,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 0,
    required: true,
  }, {
    workItemKey: 'idea-first-visual-calibration-objective-qa',
    workItemType: 'run_asset_qa',
    workerClass: 'qa_worker',
    executionInput: {
      operation: CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION,
      approvedToolOperationIds: [OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg],
      expectedOutputKeys: ['idea-first-visual-calibration-objective-qa-json'],
      structuredPayload: qaPlanningPayload,
    },
    ...common,
    expectedOutputs: [{
      outputKey: 'idea-first-visual-calibration-objective-qa-json',
      artifactType: 'visual_calibration_candidate_objective_qa_report',
      assetRole: 'qa',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: [],
      timingIds: [],
      rendererLayerIds: [],
    }],
    dependencyKeys: ['idea-first-visual-calibration-provider'],
    approvedToolIds: ['ffmpeg'],
    attemptTimeoutSeconds: 300,
    maximumCreditBudget: 0,
  }, {
    workItemKey: 'idea-first-approved-narration-authority',
    workItemType: 'custom',
    workerClass: 'media_processing_worker',
    executionInput: { operation: 'bind_verified_uploaded_storytelling_narration' },
    ...common,
    expectedOutputs: [{
      outputKey: 'idea-first-approved-narration-wav',
      artifactType: 'verified_uploaded_storytelling_narration_wav',
      assetRole: 'processed',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'audio/wav',
      segmentIds: ['segment-1'],
      timingIds: ['master-timing-plan'],
      rendererLayerIds: [],
    }],
    dependencyKeys: ['idea-first-snapshot-validation'],
    approvedToolIds: [],
    attemptTimeoutSeconds: 120,
    maximumCreditBudget: 1,
  }, {
    workItemKey: 'idea-first-storytelling-animatic-preview',
    workItemType: 'render_remotion_preview',
    workerClass: 'render_worker',
    executionInput: {
      operation: CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_OPERATION,
      approvedToolOperationIds: ['tool.remotion.render_approved_composition.v1'],
      expectedOutputKeys: ['idea-first-storytelling-animatic-mp4'],
      motionStudioStorytellingAuthority: binding,
      structuredPayload: {
        compositionProfileId: 'motion_studio_prepared_script_animatic_v1',
        ...previewFrame,
        durationFrames: input.productionAuthority.timingAuthority.durationFrames,
        scenes: input.productionAuthority.orderedScenes.map((scene) => ({
          order: scene.order,
          sceneId: scene.sceneId,
          startFrame: scene.startFrame,
          endFrame: scene.endFrame,
          title: scene.title,
          visualDescription: scene.semanticPurpose,
        })),
        panelBackground: '#0F172A',
        accentColor: '#FF4D8D',
      },
    },
    ...common,
    expectedOutputs: [{
      outputKey: 'idea-first-storytelling-animatic-mp4',
      artifactType: 'motion_studio_prepared_script_animatic_private_preview_mp4',
      assetRole: 'preview',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'video/mp4',
      segmentIds: ['segment-1'],
      timingIds: ['master-timing-plan'],
      rendererLayerIds: ['motion-studio-storytelling-animatic-layer'],
    }],
    dependencyKeys: ['idea-first-approved-narration-authority'],
    approvedToolIds: ['remotion'],
    attemptTimeoutSeconds: 300,
    maximumCreditBudget: 3,
  }, {
    workItemKey: 'idea-first-storytelling-animatic-qa',
    workItemType: 'run_asset_qa',
    workerClass: 'qa_worker',
    executionInput: { operation: 'validate_private_storytelling_animatic' },
    ...common,
    expectedOutputs: [{
      outputKey: 'idea-first-storytelling-animatic-qa-report',
      artifactType: 'motion_studio_storytelling_animatic_qa_report',
      assetRole: 'qa',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: ['segment-1'],
      timingIds: ['master-timing-plan'],
      rendererLayerIds: [],
    }],
    dependencyKeys: ['idea-first-storytelling-animatic-preview'],
    approvedToolIds: [],
    attemptTimeoutSeconds: 120,
    maximumCreditBudget: 1,
  }]
}

function createStorytellingStylePlanReviewSource(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  revision: number
}): CanonicalStorytellingStylePlanReviewSource {
  const selectionDigest = sha256ForSmoke(`storytelling-style-selection-${input.revision}`)
  return {
    schemaVersion: 'motion-studio.storytelling-style-plan-review-input.v1',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    productionId: input.productionId,
    styleSelection: {
      schemaVersion: 'motion-studio.storytelling-style-selection.v1',
      id: `storytelling-style-selection-${input.revision}`,
      state: 'selected_for_plan',
      selectionDigest,
      styleProfile: {
        styleProfileId: input.revision === 1
          ? 'storytelling_style.editorial_collage'
          : 'storytelling_style.technical_blueprint',
        styleProfileVersion: `1.0.${input.revision}`,
        styleProfileDigest: sha256ForSmoke(`storytelling-style-profile-${input.revision}`),
      },
      motionLanguage: {
        motionLanguageId: `storytelling-motion-language-${input.revision}`,
        motionLanguageVersion: `1.0.${input.revision}`,
        motionLanguageDigest: sha256ForSmoke(`storytelling-motion-language-${input.revision}`),
      },
      motionDnaVersion: {
        artifactId: 'storytelling-motion-dna',
        versionId: `storytelling-motion-dna-v${input.revision}`,
        versionNumber: input.revision,
        contentDigest: sha256ForSmoke(`storytelling-motion-dna-${input.revision}`),
      },
      referenceContractVersions: [{
        artifactId: 'storytelling-reference-contract',
        versionId: `storytelling-reference-contract-v${input.revision}`,
        versionNumber: input.revision,
        contentDigest: sha256ForSmoke(`storytelling-reference-contract-${input.revision}`),
      }],
      sourceAuditDigests: input.revision === 1
        ? [sha256ForSmoke(`storytelling-source-audit-${input.revision}`)]
        : [],
    },
    calibrationPlan: {
      schemaVersion: 'motion-studio.style-calibration-plan.v1',
      id: `storytelling-style-calibration-${input.revision}`,
      planDigest: sha256ForSmoke(`storytelling-style-calibration-${input.revision}`),
      styleSelectionDigest: selectionDigest,
      routePolicy: { policyId: 'motion_studio_generation_route_policy_v2' },
      scenarios: [
        { id: `style-led-motion-${input.revision}`, kind: 'style_led_motion' },
        { id: `character-continuity-${input.revision}`, kind: 'character_continuity' },
        { id: `first-last-frame-${input.revision}`, kind: 'strict_first_last_frame' },
        { id: `reference-heavy-${input.revision}`, kind: 'reference_heavy' },
        { id: `exact-text-data-${input.revision}`, kind: 'exact_text_data' },
      ],
      estimatedInternalCostRangeMicros: {
        minimum: 100_000 * input.revision,
        maximum: 500_000 * input.revision,
      },
      approvalAuthority: { state: 'planning_only' },
      automaticFallbackAllowed: false,
      fallbackRequiresNewApproval: true,
      bulkGenerationAllowed: false,
    },
    internalCostEstimateId: `storytelling-style-internal-cost-${input.revision}`,
    internalCostEstimateDigest: sha256ForSmoke(`storytelling-style-internal-cost-${input.revision}`),
    internalCostEnvelopeIncludedInPlanReview: true,
    customerPricingCalculatedHere: false,
    customerCreditsMutated: false,
    decisionAuthority: 'existing_plan_review',
    runtimeExecutionAuthorized: false,
    immutable: true,
  }
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
