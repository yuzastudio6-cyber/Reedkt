import assert from 'node:assert/strict'

import {
  assertCanonicalApprovedEditExecutionPackageMatchesAuthority,
  assertCanonicalToolAuthorizationManifestMatchesAuthority,
  createCanonicalApprovedEditExecutionPackage,
  createCanonicalToolAuthorizationManifest,
  type CanonicalToolAuthorizationManifest,
} from '../edit-architecture/canonical-approved-edit-execution-package'
import type {
  CanonicalApprovedExecutionAuthority,
  CanonicalApprovedExecutionWorkItem,
} from '../services/edit-planning-authority-service'
import {
  sha256AuthorityValue,
  type AuthorityExecutionPackageRecord,
} from '../services/private-edit-authority-store'
import { resolveCompleteProfessionalToolOperationSpec } from '../tool-execution/core-registry-operations/core-registry-operation-specs'

const SHA = 'a'.repeat(64)
const REF = { sha256: SHA, byteLength: 1 }
const FFMPEG_OPERATION = 'tool.ffmpeg.execute_approved_media_recipe.v1'
const FFPROBE_OPERATION = 'tool.ffprobe.inspect_approved_media.v1'
const NOW = '2026-07-10T12:00:00.000Z'

const toolFree = workItem({
  id: 'approved_work_item_authority',
  workItemKey: 'authority-root',
  approvedToolIds: [],
  executionInput: { operation: 'validate_snapshot_manifest' },
})
const trim = workItem({
  id: 'approved_work_item_trim',
  workItemKey: 'source-trim',
  approvedToolIds: ['ffmpeg'],
  executionInput: {
    operation: 'approved_trim',
    approvedToolOperationIds: [FFMPEG_OPERATION],
  },
})
const finalQa = workItem({
  id: 'approved_work_item_qa',
  workItemKey: 'final-qa',
  approvedToolIds: ['ffprobe'],
  executionInput: {
    operation: 'inspect_final',
    approvedToolOperationIds: [FFPROBE_OPERATION],
  },
})
const finalExport = workItem({
  id: 'approved_work_item_export',
  workItemKey: 'final-export',
  approvedToolIds: ['ffmpeg'],
  executionInput: {
    operation: 'render_approved_export',
    approvedToolOperationIds: [FFMPEG_OPERATION],
  },
})
const authority = buildAuthority([trim, toolFree, finalExport, finalQa])
const manifest = createCanonicalToolAuthorizationManifest(authority)

assert.equal(manifest.schemaVersion, 'canonical-tool-authorization-manifest-v2')
assert.deepEqual(manifest.toolIds, ['ffmpeg', 'ffprobe'])
assert.deepEqual(manifest.operationIds, [FFMPEG_OPERATION, FFPROBE_OPERATION])
assert.equal(manifest.operationBindingCount, 3)
assert.equal(manifest.operationBindings.length, 3)
assert.equal(manifest.operationBindingsHash, sha256AuthorityValue(manifest.operationBindings))
assert.match(manifest.manifestHash, /^[a-f0-9]{64}$/)
assert.equal(manifest.productReadyCount, 0)
assert.equal(manifest.runtimeEvidenceReadyCount, 0)
assert.equal(manifest.workerDispatchAuthorized, false)
assert.equal(manifest.productionExecutionAllowed, false)
assert.ok(manifest.operationBindings.every((binding) =>
  binding.bindingHash === sha256AuthorityValue(withoutBindingHash(binding)) &&
  binding.productReady === false &&
  binding.runtimeEvidenceReady === false &&
  binding.workerDispatchAuthorized === false &&
  binding.policyBlocks.length === 0))
assert.deepEqual(
  createCanonicalToolAuthorizationManifest(buildAuthority([...authority.workItems].reverse())),
  manifest,
  'Operation authority must be deterministic regardless of approved-work-item read order.',
)
assert.deepEqual(assertCanonicalToolAuthorizationManifestMatchesAuthority(structuredClone(manifest), authority), manifest)

const packageRecord = buildPackageRecord(manifest)
const executionPackage = createCanonicalApprovedEditExecutionPackage({
  authority,
  executionPackageRecord: packageRecord,
  toolCapabilityManifest: manifest,
})
assert.equal(executionPackage.schemaVersion, 'canonical-approved-edit-execution-package-v5')
assert.deepEqual(executionPackage.approvedToolOperationIds, manifest.operationIds)
assert.equal(executionPackage.toolOperationBindingCount, manifest.operationBindingCount)
assert.equal(executionPackage.toolOperationBindingsHash, manifest.operationBindingsHash)
assert.equal(executionPackage.toolCapabilityManifestHash, manifest.manifestHash)
for (const item of executionPackage.approvedWorkItems) {
  const expectedBindings = manifest.operationBindings.filter((binding) => binding.approvedWorkItemId === item.id)
  assert.deepEqual(item.approvedToolOperationIds, [...new Set(expectedBindings.map((binding) => binding.operationId))].sort())
  assert.equal(item.toolOperationBindingsHash, sha256AuthorityValue(expectedBindings))
}
for (const job of executionPackage.jobs) {
  const item = executionPackage.approvedWorkItems.find((candidate) => candidate.id === job.approvedWorkItemId)
  assert.ok(item)
  assert.deepEqual(job.approvedToolOperationIds, item.approvedToolOperationIds)
  assert.equal(job.toolOperationBindingsHash, item.toolOperationBindingsHash)
}
assert.deepEqual(assertCanonicalApprovedEditExecutionPackageMatchesAuthority({
  value: structuredClone(executionPackage),
  authority,
  executionPackageRecord: packageRecord,
  toolCapabilityManifest: manifest,
}), executionPackage)

expectRejected('missing operation identity', mutateWorkItem(authority, trim.id, (item) => {
  delete item.executionInput.approvedToolOperationIds
}))
expectRejected('spoofed operation identity', mutateWorkItem(authority, trim.id, (item) => {
  item.executionInput.approvedToolOperationIds = ['tool.ffmpeg.spoofed.v1']
}))
expectRejected('duplicate operation identity', mutateWorkItem(authority, trim.id, (item) => {
  item.executionInput.approvedToolOperationIds = [FFMPEG_OPERATION, FFMPEG_OPERATION]
}))
expectRejected('tool-free operation smuggling', mutateWorkItem(authority, toolFree.id, (item) => {
  item.executionInput.approvedToolOperationIds = [FFMPEG_OPERATION]
}))
expectRejected('tool alias as execution identity', mutateWorkItem(authority, trim.id, (item) => {
  item.approvedToolIds = ['FFmpeg']
}))
const blockedSpec = resolveCompleteProfessionalToolOperationSpec('mediapipe')
assert.ok(blockedSpec)
expectRejected('policy-blocked tool operation', mutateWorkItem(authority, trim.id, (item) => {
  item.approvedToolIds = ['mediapipe']
  item.executionInput.approvedToolOperationIds = [blockedSpec.allowedOperationIds[0]]
}))
const badExecutionHash = structuredClone(authority)
badExecutionHash.workItems.find((item) => item.id === trim.id)!.executionInputHash = 'b'.repeat(64)
expectRejected('execution input hash mismatch', badExecutionHash)

expectManifestRejected({ ...manifest, extraAuthority: true }, authority)
const spoofedManifest = structuredClone(manifest)
spoofedManifest.operationBindings[0]!.operationId = 'tool.ffmpeg.spoofed.v1'
expectManifestRejected(spoofedManifest, authority)
const badBindingHashManifest = structuredClone(manifest)
badBindingHashManifest.operationBindings[0]!.bindingHash = 'f'.repeat(64)
expectManifestRejected(badBindingHashManifest, authority)
const productReadyManifest = structuredClone(manifest) as unknown as { productReadyCount: number }
productReadyManifest.productReadyCount = 1
expectManifestRejected(productReadyManifest, authority)

const spoofedPackage = structuredClone(executionPackage)
spoofedPackage.approvedWorkItems.find((item) => item.id === trim.id)!.approvedToolOperationIds = [
  'tool.ffmpeg.spoofed.v1',
]
assert.throws(() => assertCanonicalApprovedEditExecutionPackageMatchesAuthority({
  value: spoofedPackage,
  authority,
  executionPackageRecord: packageRecord,
  toolCapabilityManifest: manifest,
}))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'exact_tool_operation_ids_derived_only_from_approved_work_items',
    'deterministic_per_tool_per_work_item_operation_bindings',
    'operation_spec_execution_input_binding_and_manifest_hashes',
    'package_work_item_and_job_operation_authority_frozen',
    'tool_alias_missing_duplicate_spoofed_and_policy_blocked_operations_rejected',
    'manifest_extra_field_binding_hash_product_ready_and_package_tamper_rejected',
    'product_runtime_dispatch_and_production_readiness_remain_false',
  ],
}))

function workItem(input: {
  id: string
  workItemKey: string
  approvedToolIds: string[]
  executionInput: Record<string, unknown>
}): CanonicalApprovedExecutionWorkItem {
  return {
    id: input.id,
    snapshotId: 'snapshot_operation_contract',
    sourceWorkItemId: `source_${input.id}`,
    workItemKey: input.workItemKey,
    workItemType: input.workItemKey,
    workerClass: 'private_test_worker',
    executionInputRef: { sha256: sha256AuthorityValue(input.executionInput), byteLength: 1 },
    sourceSequenceItemIds: [],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [],
    dependencyKeys: [],
    approvedToolIds: [...input.approvedToolIds],
    providerExecutionMode: 'none',
    fallbackPolicyRef: REF,
    maxAttempts: 1,
    attemptTimeoutSeconds: 60,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 1,
    required: true,
    executionInputHash: sha256AuthorityValue(input.executionInput),
    createdAt: NOW,
    executionInput: structuredClone(input.executionInput),
    fallbackPolicy: {},
  }
}

function buildAuthority(workItems: CanonicalApprovedExecutionWorkItem[]): CanonicalApprovedExecutionAuthority {
  return {
    authorityRevision: 1,
    snapshot: {
      schemaVersion: 'private-edit-authority-approved-snapshot-v3',
      snapshotId: 'snapshot_operation_contract',
      workspaceId: 'workspace_operation_contract',
      projectId: 'project_operation_contract',
      editSessionId: 'session_operation_contract',
      planId: 'plan_operation_contract',
      planVersion: 1,
      estimateId: 'estimate_operation_contract',
      approvalId: 'approval_operation_contract',
      reservationId: 'reservation_operation_contract',
      approvedByUserId: 'user_operation_contract',
      approvedAt: NOW,
      componentRefs: {},
      approvedWorkItemIds: workItems.map((item) => item.id),
      planHash: SHA,
      estimateHash: SHA,
      workGraphHash: SHA,
      sourceSequenceHash: SHA,
      timingHash: SHA,
      approvedAssetManifestRef: REF,
      approvedAssetManifestHash: SHA,
      approvedSourceAssetManifestRef: REF,
      approvedSourceAssetManifestHash: SHA,
      snapshotHash: SHA,
    },
    plan: {} as CanonicalApprovedExecutionAuthority['plan'],
    estimate: { approvedMaximumCredits: 10 } as CanonicalApprovedExecutionAuthority['estimate'],
    reservation: {
      reservedCredits: 10,
      spentCredits: 0,
      releasedCredits: 0,
      refundedCredits: 0,
      status: 'reserved',
    } as CanonicalApprovedExecutionAuthority['reservation'],
    approval: {} as CanonicalApprovedExecutionAuthority['approval'],
    components: {} as CanonicalApprovedExecutionAuthority['components'],
    assetManifest: { entries: [], requiredAssetCount: 0 } as unknown as CanonicalApprovedExecutionAuthority['assetManifest'],
    planningInputAuthority: {} as CanonicalApprovedExecutionAuthority['planningInputAuthority'],
    sourceAssetManifest: { bindings: [], requiredBindingCount: 0 } as unknown as CanonicalApprovedExecutionAuthority['sourceAssetManifest'],
    workItems: structuredClone(workItems),
    jobs: workItems.map((item) => ({
      id: `job_${item.id}`,
      snapshotId: 'snapshot_operation_contract',
      reservationId: 'reservation_operation_contract',
      approvedWorkItemId: item.id,
      workItemKey: item.workItemKey,
      jobType: item.workItemType,
      workerClass: item.workerClass,
      executionInputRef: item.executionInputRef,
      sourceSequenceItemIds: [],
      sourceCleanupDecisionIds: [],
      expectedAssetIds: [],
      dependencyJobIds: [],
      status: 'ready',
      maxAttempts: 1,
      attemptTimeoutSeconds: 60,
      scheduledFor: NOW,
      createdAt: NOW,
    })),
    testOnly: true,
  }
}

function buildPackageRecord(toolCapabilityManifest: CanonicalToolAuthorizationManifest): AuthorityExecutionPackageRecord {
  const withoutHash = {
    id: 'package_operation_contract',
    source: 'canonical_edit_authority' as const,
    purpose: 'private_internal_execution_handoff' as const,
    snapshotId: 'snapshot_operation_contract',
    planId: 'plan_operation_contract',
    estimateId: 'estimate_operation_contract',
    reservationId: 'reservation_operation_contract',
    projectId: 'project_operation_contract',
    editSessionId: 'session_operation_contract',
    snapshotHash: SHA,
    planHash: SHA,
    estimateHash: SHA,
    workGraphHash: SHA,
    approvedAssetManifestHash: SHA,
    approvedSourceAssetManifestHash: SHA,
    toolCapabilityManifestRef: {
      sha256: sha256AuthorityValue(toolCapabilityManifest),
      byteLength: 1,
    },
    createdByUserId: 'user_operation_contract',
    createdAt: NOW,
  }
  return { ...withoutHash, packageHash: sha256AuthorityValue(withoutHash) }
}

function mutateWorkItem(
  source: CanonicalApprovedExecutionAuthority,
  workItemId: string,
  mutation: (workItem: CanonicalApprovedExecutionWorkItem) => void,
): CanonicalApprovedExecutionAuthority {
  const next = structuredClone(source)
  const item = next.workItems.find((candidate) => candidate.id === workItemId)
  assert.ok(item)
  mutation(item)
  item.executionInputHash = sha256AuthorityValue(item.executionInput)
  item.executionInputRef = { ...item.executionInputRef, sha256: item.executionInputHash }
  return next
}

function expectRejected(label: string, input: CanonicalApprovedExecutionAuthority): void {
  assert.throws(() => createCanonicalToolAuthorizationManifest(input), label)
}

function expectManifestRejected(value: unknown, input: CanonicalApprovedExecutionAuthority): void {
  assert.throws(() => assertCanonicalToolAuthorizationManifestMatchesAuthority(value, input))
}

function withoutBindingHash(
  value: CanonicalToolAuthorizationManifest['operationBindings'][number],
): Omit<CanonicalToolAuthorizationManifest['operationBindings'][number], 'bindingHash'> {
  const withoutHash = { ...value } as Partial<CanonicalToolAuthorizationManifest['operationBindings'][number]>
  delete withoutHash.bindingHash
  return withoutHash as Omit<CanonicalToolAuthorizationManifest['operationBindings'][number], 'bindingHash'>
}
