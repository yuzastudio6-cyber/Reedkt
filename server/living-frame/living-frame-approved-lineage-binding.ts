import { createHash } from 'node:crypto'

import type {
  LivingFrameApprovedLayerLineage,
  LivingFrameApprovedLineageAuthorityBoundary,
  LivingFrameApprovedLineageBinding,
  LivingFrameApprovedLineageBindingDraft,
  LivingFrameApprovedLineageLocator,
  LivingFrameApprovedLineageMetrics,
  LivingFrameApprovedLineageOpenGate,
} from '../../src/types/living-frame-approved-lineage-binding'
import {
  LIVING_FRAME_APPROVED_LINEAGE_BINDING_CLASS,
  LIVING_FRAME_APPROVED_LINEAGE_BINDING_VERSION,
  LIVING_FRAME_APPROVED_LINEAGE_LOCATOR_VERSION,
  LIVING_FRAME_APPROVED_LINEAGE_OPEN_GATES,
  LIVING_FRAME_APPROVED_LINEAGE_READER_VERSION,
} from '../../src/types/living-frame-approved-lineage-binding'
import type {
  LivingFrameChoreographyBinding,
} from '../../src/types/living-frame-choreography-binding'
import type {
  LivingFrameRendererPlanBinding,
} from '../../src/types/living-frame-renderer-plan-binding'
import type {
  CanonicalApprovedExecutionAuthority,
  CanonicalApprovedExecutionWorkItem,
} from '../services/edit-planning-authority-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import type {
  AuthorityPlannedAssetManifest,
  AuthorityPlannedAssetManifestEntry,
} from '../services/private-edit-authority-store'
import {
  PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
} from '../validation/edit-planning-authority-schemas'
import {
  verifyLivingFrameChoreographyBindingDigest,
} from './living-frame-choreography-binding'
import {
  verifyLivingFrameRendererPlanBindingDigest,
} from './living-frame-renderer-plan-binding'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256 = /^[a-f0-9]{64}$/
const MAX_LAYER_COUNT = 128
const registeredReaders = new WeakSet<object>()

const BASE_OPEN_GATES: readonly LivingFrameApprovedLineageOpenGate[] = [
  'canonical_selected_living_frame_scene_component_ref_required',
  'canonical_living_frame_renderer_binding_component_ref_required',
  'canonical_living_frame_choreography_binding_component_ref_required',
  'canonical_renderer_layer_extension_required',
  'canonical_artifact_qa_required',
  'canonical_private_remotion_review_required',
]

const AUTHORITY_BOUNDARY:
  LivingFrameApprovedLineageAuthorityBoundary = Object.freeze({
    controlledLineageObservationOnly: true,
    selectedSceneAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    assetManifestMutationAuthority: false,
    qaApprovalAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    remotionExecutionAuthority: false,
    privateReviewAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameApprovedLineageReaderResult {
  readonly authority: CanonicalApprovedExecutionAuthority
  readonly rendererPlanBinding: LivingFrameRendererPlanBinding
  readonly choreographyBinding: LivingFrameChoreographyBinding
}

export interface LivingFrameApprovedLineageReaderPort {
  readonly schemaVersion:
    typeof LIVING_FRAME_APPROVED_LINEAGE_READER_VERSION
  readonly sourceAuthority:
    'controlled_canonical_approved_execution_fixture_reader'
  readonly evidenceClass: 'controlled_non_promotable_lineage_reader'
  readonly productionReady: false
  readCurrentByServerOwnedLocator(
    locator: LivingFrameApprovedLineageLocator,
  ): Promise<unknown>
}

export function registerLivingFrameApprovedLineageReader<
  T extends LivingFrameApprovedLineageReaderPort,
>(reader: T): T {
  assertReaderShape(reader)
  registeredReaders.add(reader)
  return reader
}

export async function bindLivingFrameApprovedLineage(input: {
  readonly locator: unknown
  readonly reader: LivingFrameApprovedLineageReaderPort | null | undefined
}): Promise<LivingFrameApprovedLineageBinding> {
  const locator = parseLocator(input.locator)
  assertRegisteredReader(input.reader)
  const raw = await input.reader.readCurrentByServerOwnedLocator(locator)
  const result = parseReaderResult(raw)
  assertCanonicalAuthority(result.authority, locator)
  assertCandidateBindings(
    result.authority,
    result.rendererPlanBinding,
    result.choreographyBinding,
  )

  const rendererLayerLineage = compileLayerLineage(
    result.rendererPlanBinding,
    result.authority.workItems,
    result.authority.assetManifest,
  )
  const metrics = compileMetrics(rendererLayerLineage)
  const openGateCodes = compileOpenGates(rendererLayerLineage)
  const bindingState = rendererLayerLineage.every((entry) =>
    entry.lineageState ===
      'covered_by_exact_approved_work_output_and_planned_asset')
    ? 'blocked_by_canonical_living_frame_component_admission'
    : 'blocked_by_work_or_asset_lineage'
  const rendererPlanRef =
    result.authority.snapshot.componentRefs.rendererPlan
  if (!rendererPlanRef) {
    throw invalid('Canonical renderer-plan component reference is missing.')
  }
  const draft: LivingFrameApprovedLineageBindingDraft = {
    contractVersion: LIVING_FRAME_APPROVED_LINEAGE_BINDING_VERSION,
    bindingClass: LIVING_FRAME_APPROVED_LINEAGE_BINDING_CLASS,
    sceneId: result.rendererPlanBinding.sceneId,
    canonicalScope: {
      workspaceId: result.authority.snapshot.workspaceId,
      projectId: result.authority.snapshot.projectId,
      editSessionId: result.authority.snapshot.editSessionId,
    },
    sourceBindings: {
      approvedSnapshotId: result.authority.snapshot.snapshotId,
      approvedSnapshotHashSha256:
        result.authority.snapshot.snapshotHash,
      approvedPlanId: result.authority.plan.id,
      approvedPlanVersion: result.authority.plan.planVersion,
      approvedPlanHashSha256: result.authority.plan.planHash,
      approvedWorkGraphHashSha256:
        result.authority.plan.workGraphHash,
      approvedTimingHashSha256: result.authority.plan.timingHash,
      approvedAssetManifestHashSha256:
        result.authority.assetManifest.manifestHash,
      canonicalRendererPlanRefSha256: rendererPlanRef.sha256,
      canonicalRendererPlanDigestSha256:
        sha256AuthorityValue(result.authority.components.rendererPlan),
      rendererPlanBindingDigestSha256:
        result.rendererPlanBinding.bindingDigestSha256,
      choreographyBindingDigestSha256:
        result.choreographyBinding.bindingDigestSha256,
    },
    rendererLayerLineage,
    bindingState,
    openGateCodes,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    canonicalApprovedSnapshotWasReadByRegisteredServerPort: true,
    existingCanonicalSnapshotRemainsImmutable: true,
    existingCanonicalWorkGraphRemainsAuthority: true,
    existingCanonicalAssetManifestRemainsAuthority: true,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
    containsProviderToolJobQueueCostOrCommercialRoute: false,
    containsExecutableCodeOrCommands: false,
    subjectSpecificRouting: false,
  }
  return {
    ...draft,
    bindingDigestSha256: digest(draft),
  }
}

export function verifyLivingFrameApprovedLineageBindingDigest(
  value: unknown,
): value is LivingFrameApprovedLineageBinding {
  try {
    if (!isRecord(value)) return false
    const binding = value as unknown as LivingFrameApprovedLineageBinding
    if (!hasExactKeys(value, [
      'contractVersion',
      'bindingClass',
      'sceneId',
      'canonicalScope',
      'sourceBindings',
      'rendererLayerLineage',
      'bindingState',
      'openGateCodes',
      'metrics',
      'authorityBoundary',
      'canonicalApprovedSnapshotWasReadByRegisteredServerPort',
      'existingCanonicalSnapshotRemainsImmutable',
      'existingCanonicalWorkGraphRemainsAuthority',
      'existingCanonicalAssetManifestRemainsAuthority',
      'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
      'containsProviderToolJobQueueCostOrCommercialRoute',
      'containsExecutableCodeOrCommands',
      'subjectSpecificRouting',
      'bindingDigestSha256',
    ])) return false
    const { bindingDigestSha256, ...draft } = binding
    if (
      !SHA256.test(String(bindingDigestSha256))
      || bindingDigestSha256 !== digest(draft)
      || binding.contractVersion !==
        LIVING_FRAME_APPROVED_LINEAGE_BINDING_VERSION
      || binding.bindingClass !==
        LIVING_FRAME_APPROVED_LINEAGE_BINDING_CLASS
      || !SAFE_ID.test(binding.sceneId)
      || !validateScope(binding.canonicalScope)
      || !validateSourceBindings(binding.sourceBindings)
      || !validateLayerLineage(binding.rendererLayerLineage)
      || !validateBoundary(binding.authorityBoundary)
      || binding.canonicalApprovedSnapshotWasReadByRegisteredServerPort
        !== true
      || binding.existingCanonicalSnapshotRemainsImmutable !== true
      || binding.existingCanonicalWorkGraphRemainsAuthority !== true
      || binding.existingCanonicalAssetManifestRemainsAuthority !== true
      || binding.containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
        !== false
      || binding.containsProviderToolJobQueueCostOrCommercialRoute
        !== false
      || binding.containsExecutableCodeOrCommands !== false
      || binding.subjectSpecificRouting !== false
    ) return false
    const expectedMetrics = compileMetrics(binding.rendererLayerLineage)
    const expectedGates = compileOpenGates(binding.rendererLayerLineage)
    const expectedState = binding.rendererLayerLineage.every((entry) =>
      entry.lineageState ===
        'covered_by_exact_approved_work_output_and_planned_asset')
      ? 'blocked_by_canonical_living_frame_component_admission'
      : 'blocked_by_work_or_asset_lineage'
    return stableAuthorityStringify(binding.metrics)
        === stableAuthorityStringify(expectedMetrics)
      && stableAuthorityStringify(binding.openGateCodes)
        === stableAuthorityStringify(expectedGates)
      && binding.bindingState === expectedState
  } catch {
    return false
  }
}

function parseLocator(value: unknown): LivingFrameApprovedLineageLocator {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'schemaVersion',
      'workspaceId',
      'projectId',
      'editSessionId',
      'snapshotId',
    ])
    || value.schemaVersion !== LIVING_FRAME_APPROVED_LINEAGE_LOCATOR_VERSION
    || [
      value.workspaceId,
      value.projectId,
      value.editSessionId,
      value.snapshotId,
    ].some((item) => typeof item !== 'string' || !SAFE_ID.test(item))
  ) throw invalid('Living Frame approved-lineage locator is invalid.')
  return value as unknown as LivingFrameApprovedLineageLocator
}

function assertReaderShape(
  reader: LivingFrameApprovedLineageReaderPort,
): void {
  if (
    !isRecord(reader)
    || reader.schemaVersion !== LIVING_FRAME_APPROVED_LINEAGE_READER_VERSION
    || reader.sourceAuthority !==
      'controlled_canonical_approved_execution_fixture_reader'
    || reader.evidenceClass !==
      'controlled_non_promotable_lineage_reader'
    || reader.productionReady !== false
    || typeof reader.readCurrentByServerOwnedLocator !== 'function'
  ) throw invalid('Living Frame approved-lineage reader is invalid.')
}

function assertRegisteredReader(
  reader: LivingFrameApprovedLineageReaderPort | null | undefined,
): asserts reader is LivingFrameApprovedLineageReaderPort {
  if (!reader || !registeredReaders.has(reader)) {
    throw invalid(
      'Living Frame approved-lineage reader must be registered in this process.',
    )
  }
  assertReaderShape(reader)
}

function parseReaderResult(
  value: unknown,
): LivingFrameApprovedLineageReaderResult {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'authority',
      'rendererPlanBinding',
      'choreographyBinding',
    ])
    || !verifyLivingFrameRendererPlanBindingDigest(
      value.rendererPlanBinding,
    )
    || !verifyLivingFrameChoreographyBindingDigest(
      value.choreographyBinding,
    )
  ) throw invalid('Living Frame approved-lineage reader result is invalid.')
  return value as unknown as LivingFrameApprovedLineageReaderResult
}

function assertCanonicalAuthority(
  authority: CanonicalApprovedExecutionAuthority,
  locator: LivingFrameApprovedLineageLocator,
): void {
  const { snapshot, plan, assetManifest, workItems } = authority
  if (
    authority.testOnly !== true
    || snapshot.schemaVersion !==
      'private-edit-authority-approved-snapshot-v3'
    || snapshot.workspaceId !== locator.workspaceId
    || snapshot.projectId !== locator.projectId
    || snapshot.editSessionId !== locator.editSessionId
    || snapshot.snapshotId !== locator.snapshotId
    || plan.id !== snapshot.planId
    || plan.projectId !== snapshot.projectId
    || plan.editSessionId !== snapshot.editSessionId
    || plan.planVersion !== snapshot.planVersion
    || plan.status !== 'approved'
    || authority.estimate.id !== snapshot.estimateId
    || authority.estimate.status !== 'approved'
    || authority.estimate.estimateHash !== snapshot.estimateHash
    || authority.approval.snapshotId !== snapshot.snapshotId
    || authority.approval.planId !== snapshot.planId
    || authority.approval.estimateId !== snapshot.estimateId
    || authority.approval.reservationId !== snapshot.reservationId
    || authority.reservation.snapshotId !== snapshot.snapshotId
    || authority.reservation.planId !== snapshot.planId
    || authority.reservation.estimateId !== snapshot.estimateId
    || authority.reservation.id !== snapshot.reservationId
    || workItems.some((workItem) =>
      workItem.snapshotId !== snapshot.snapshotId
      || workItem.executionInputHash !== workItem.executionInputRef.sha256)
    || stableAuthorityStringify(snapshot.approvedWorkItemIds)
      !== stableAuthorityStringify(workItems.map((item) => item.id))
    || stableAuthorityStringify(plan.workItemIds)
      !== stableAuthorityStringify(
        workItems.map((item) => item.sourceWorkItemId),
      )
    || stableAuthorityStringify(plan.componentRefs)
      !== stableAuthorityStringify(snapshot.componentRefs)
  ) throw invalid('Canonical approved execution scope or lineage is invalid.')

  const workGraphHash = calculateWorkGraphHash(workItems)
  const planHash = sha256AuthorityValue({
    schemaVersion: PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
    componentRefs: plan.componentRefs,
    workGraphHash,
  })
  const timingHash = sha256AuthorityValue({
    masterTimingPlan: plan.componentRefs.masterTimingPlan,
    captionVisualCueTimingPlan:
      plan.componentRefs.captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan:
      plan.componentRefs.soundSyncTransitionTimingPlan,
    timingValidationPlan: plan.componentRefs.timingValidationPlan,
    timingSummary: plan.componentRefs.timingSummary,
  })
  const { snapshotHash, ...snapshotWithoutHash } = snapshot
  const { manifestHash, ...manifestWithoutHash } = assetManifest
  if (
    workGraphHash !== plan.workGraphHash
    || workGraphHash !== snapshot.workGraphHash
    || planHash !== plan.planHash
    || planHash !== snapshot.planHash
    || timingHash !== plan.timingHash
    || timingHash !== snapshot.timingHash
    || plan.componentRefs.sourceSequence?.sha256
      !== snapshot.sourceSequenceHash
    || snapshotHash !== sha256AuthorityValue(snapshotWithoutHash)
    || manifestHash !== sha256AuthorityValue(manifestWithoutHash)
    || manifestHash !== snapshot.approvedAssetManifestHash
    || snapshot.approvedAssetManifestRef.sha256
      !== sha256AuthorityValue(assetManifest)
    || assetManifest.snapshotId !== snapshot.snapshotId
    || assetManifest.planId !== plan.id
    || assetManifest.planHash !== plan.planHash
    || assetManifest.workGraphHash !== plan.workGraphHash
    || !plan.componentRefs.rendererPlan
    || plan.componentRefs.rendererPlan.sha256
      !== sha256AuthorityValue(authority.components.rendererPlan)
  ) throw invalid('Canonical approved execution hashes are invalid.')
  assertManifestMatchesWorkItems(assetManifest, workItems)
}

function assertCandidateBindings(
  authority: CanonicalApprovedExecutionAuthority,
  renderer: LivingFrameRendererPlanBinding,
  choreography: LivingFrameChoreographyBinding,
): void {
  const rendererPlan = authority.components.rendererPlan
  if (
    renderer.sceneId !== choreography.sceneId
    || renderer.sourceBindings.rendererCompositionPlanId
      !== rendererPlan.id
    || renderer.sourceBindings.rendererCompositionPlanDigestSha256
      !== sha256AuthorityValue(rendererPlan)
    || renderer.sourceBindings.masterTimingPlanId
      !== choreography.sourceBindings.masterTimingPlanId
    || renderer.sourceBindings.masterTimingPlanDigestSha256
      !== choreography.sourceBindings.masterTimingPlanDigestSha256
    || renderer.sourceBindings.outputFrameId
      !== choreography.sourceBindings.outputFrameId
    || renderer.sourceBindings.outputFrameDigestSha256
      !== choreography.sourceBindings.outputFrameDigestSha256
    || renderer.bindingState !==
      'candidate_pending_canonical_snapshot_projection'
    || choreography.bindingState !==
      'candidate_pending_canonical_timing_soundsync_and_snapshot'
  ) throw invalid('Living Frame candidate bindings are stale or blocked.')
  if (
    renderer.sourceBindings.masterTimingPlanDigestSha256
      !== sha256AuthorityValue(authority.components.masterTimingPlan)
  ) throw invalid('Living Frame canonical timing lineage is stale.')
}

function compileLayerLineage(
  renderer: LivingFrameRendererPlanBinding,
  workItems: readonly CanonicalApprovedExecutionWorkItem[],
  manifest: AuthorityPlannedAssetManifest,
): LivingFrameApprovedLayerLineage[] {
  return renderer.layerBindings.map((layer, order) => {
    const matches = workItems.flatMap((workItem) =>
      workItem.expectedOutputs
        .filter((output) =>
          output.rendererLayerIds.includes(layer.rendererLayerId))
        .map((output) => ({ workItem, output })))
    if (matches.length > 1) {
      throw invalid('Living Frame renderer layer has ambiguous work lineage.')
    }
    const match = matches[0]
    if (!match) {
      return {
        order,
        sceneId: renderer.sceneId,
        projectedComponentId: layer.projectedComponentId,
        rendererLayerId: layer.rendererLayerId,
        approvedWorkItemId: null,
        approvedWorkItemKey: null,
        outputKey: null,
        plannedAssetManifestEntryId: null,
        required: null,
        previewPlaceholderAllowed: null,
        lineageState: 'missing_approved_work_output',
      }
    }
    const assets = manifest.entries.filter((entry) =>
      entry.approvedWorkItemId === match.workItem.id
      && entry.outputKey === match.output.outputKey
      && entry.rendererLayerIds.includes(layer.rendererLayerId))
    if (assets.length > 1) {
      throw invalid('Living Frame renderer layer has ambiguous asset lineage.')
    }
    const asset = assets[0]
    return {
      order,
      sceneId: renderer.sceneId,
      projectedComponentId: layer.projectedComponentId,
      rendererLayerId: layer.rendererLayerId,
      approvedWorkItemId: match.workItem.id,
      approvedWorkItemKey: match.workItem.workItemKey,
      outputKey: match.output.outputKey,
      plannedAssetManifestEntryId: asset?.id ?? null,
      required: asset?.required ?? null,
      previewPlaceholderAllowed:
        asset?.previewPlaceholderAllowed ?? null,
      lineageState: asset
        ? 'covered_by_exact_approved_work_output_and_planned_asset'
        : 'missing_planned_asset',
    }
  })
}

function compileMetrics(
  lineage: readonly LivingFrameApprovedLayerLineage[],
): LivingFrameApprovedLineageMetrics {
  return {
    projectedLayerCount: lineage.length,
    workOutputCoveredLayerCount: lineage.filter((entry) =>
      entry.approvedWorkItemId !== null).length,
    assetManifestCoveredLayerCount: lineage.filter((entry) =>
      entry.plannedAssetManifestEntryId !== null).length,
    requiredAssetCount: lineage.filter((entry) =>
      entry.required === true).length,
    placeholderAllowedAssetCount: lineage.filter((entry) =>
      entry.previewPlaceholderAllowed === true).length,
  }
}

function compileOpenGates(
  lineage: readonly LivingFrameApprovedLayerLineage[],
): LivingFrameApprovedLineageOpenGate[] {
  const gates = new Set(BASE_OPEN_GATES)
  if (lineage.some((entry) =>
    entry.lineageState === 'missing_approved_work_output')) {
    gates.add('approved_work_output_lineage_incomplete')
  }
  if (lineage.some((entry) =>
    entry.lineageState === 'missing_planned_asset')) {
    gates.add('approved_asset_manifest_lineage_incomplete')
  }
  return [...gates].sort()
}

function calculateWorkGraphHash(
  workItems: readonly CanonicalApprovedExecutionWorkItem[],
): string {
  return sha256AuthorityValue(workItems.map((workItem) => ({
    workItemKey: workItem.workItemKey,
    workItemType: workItem.workItemType,
    workerClass: workItem.workerClass,
    sourceSequenceItemIds: workItem.sourceSequenceItemIds,
    sourceCleanupDecisionIds: workItem.sourceCleanupDecisionIds,
    expectedOutputs: workItem.expectedOutputs,
    dependencyKeys: workItem.dependencyKeys,
    approvedToolIds: workItem.approvedToolIds,
    approvedProviderRoute: workItem.approvedProviderRoute,
    providerExecutionMode: workItem.providerExecutionMode,
    maxAttempts: workItem.maxAttempts,
    attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
    scheduledDelaySeconds: workItem.scheduledDelaySeconds,
    maximumCreditBudget: workItem.maximumCreditBudget,
    required: workItem.required,
    executionInputRef: workItem.executionInputRef,
    fallbackPolicyRef: workItem.fallbackPolicyRef,
  })))
}

function assertManifestMatchesWorkItems(
  manifest: AuthorityPlannedAssetManifest,
  workItems: readonly CanonicalApprovedExecutionWorkItem[],
): void {
  const entriesBySlot = new Map<string, AuthorityPlannedAssetManifestEntry>()
  for (const entry of manifest.entries) {
    const key = `${entry.approvedWorkItemId}\u0000${entry.outputKey}`
    if (entriesBySlot.has(key)) {
      throw invalid('Canonical asset manifest has a duplicate output slot.')
    }
    entriesBySlot.set(key, entry)
  }
  const expectedCount = workItems.reduce(
    (total, item) => total + item.expectedOutputs.length,
    0,
  )
  for (const workItem of workItems) {
    for (const output of workItem.expectedOutputs) {
      const entry = entriesBySlot.get(
        `${workItem.id}\u0000${output.outputKey}`,
      )
      if (
        !entry
        || entry.snapshotId !== manifest.snapshotId
        || entry.workItemKey !== workItem.workItemKey
        || stableAuthorityStringify({
          artifactType: entry.artifactType,
          assetRole: entry.assetRole,
          required: entry.required,
          previewPlaceholderAllowed: entry.previewPlaceholderAllowed,
          contentType: entry.contentType,
          segmentIds: entry.segmentIds,
          timingIds: entry.timingIds,
          rendererLayerIds: entry.rendererLayerIds,
        }) !== stableAuthorityStringify({
          artifactType: output.artifactType,
          assetRole: output.assetRole,
          required: output.required,
          previewPlaceholderAllowed: output.previewPlaceholderAllowed,
          contentType: output.contentType,
          segmentIds: output.segmentIds,
          timingIds: output.timingIds,
          rendererLayerIds: output.rendererLayerIds,
        })
      ) throw invalid('Canonical asset manifest does not match work output.')
    }
  }
  if (
    manifest.entries.length !== expectedCount
    || manifest.requiredAssetCount !==
      manifest.entries.filter((entry) => entry.required).length
    || manifest.optionalAssetCount !==
      manifest.entries.filter((entry) => !entry.required).length
  ) throw invalid('Canonical asset manifest counts are invalid.')
}

function validateScope(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['workspaceId', 'projectId', 'editSessionId'])
    && [value.workspaceId, value.projectId, value.editSessionId]
      .every((item) => typeof item === 'string' && SAFE_ID.test(item))
}

function validateSourceBindings(value: unknown): boolean {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'approvedSnapshotId',
      'approvedSnapshotHashSha256',
      'approvedPlanId',
      'approvedPlanVersion',
      'approvedPlanHashSha256',
      'approvedWorkGraphHashSha256',
      'approvedTimingHashSha256',
      'approvedAssetManifestHashSha256',
      'canonicalRendererPlanRefSha256',
      'canonicalRendererPlanDigestSha256',
      'rendererPlanBindingDigestSha256',
      'choreographyBindingDigestSha256',
    ])
    || !SAFE_ID.test(String(value.approvedSnapshotId))
    || !SAFE_ID.test(String(value.approvedPlanId))
    || !Number.isInteger(value.approvedPlanVersion)
    || Number(value.approvedPlanVersion) < 1
  ) return false
  return [
    value.approvedSnapshotHashSha256,
    value.approvedPlanHashSha256,
    value.approvedWorkGraphHashSha256,
    value.approvedTimingHashSha256,
    value.approvedAssetManifestHashSha256,
    value.canonicalRendererPlanRefSha256,
    value.canonicalRendererPlanDigestSha256,
    value.rendererPlanBindingDigestSha256,
    value.choreographyBindingDigestSha256,
  ].every((item) => typeof item === 'string' && SHA256.test(item))
}

function validateLayerLineage(value: unknown): value is
  readonly LivingFrameApprovedLayerLineage[] {
  if (
    !Array.isArray(value)
    || value.length < 1
    || value.length > MAX_LAYER_COUNT
  ) return false
  const rendererIds = new Set<string>()
  const workOutputSlots = new Set<string>()
  for (const [index, entry] of value.entries()) {
    if (
      !isRecord(entry)
      || !hasExactKeys(entry, [
        'order',
        'sceneId',
        'projectedComponentId',
        'rendererLayerId',
        'approvedWorkItemId',
        'approvedWorkItemKey',
        'outputKey',
        'plannedAssetManifestEntryId',
        'required',
        'previewPlaceholderAllowed',
        'lineageState',
      ])
      || entry.order !== index
      || !SAFE_ID.test(String(entry.sceneId))
      || !SAFE_ID.test(String(entry.projectedComponentId))
      || !SAFE_ID.test(String(entry.rendererLayerId))
      || rendererIds.has(String(entry.rendererLayerId))
      || ![
        'covered_by_exact_approved_work_output_and_planned_asset',
        'missing_approved_work_output',
        'missing_planned_asset',
      ].includes(String(entry.lineageState))
    ) return false
    const nullableIds = [
      entry.approvedWorkItemId,
      entry.approvedWorkItemKey,
      entry.outputKey,
      entry.plannedAssetManifestEntryId,
    ]
    if (nullableIds.some((item) =>
      item !== null
      && (typeof item !== 'string' || !SAFE_ID.test(item)))) return false
    if (
      ![null, true, false].includes(
        entry.required as null | boolean,
      )
      || ![null, true, false].includes(
        entry.previewPlaceholderAllowed as null | boolean,
      )
    ) return false
    if (
      entry.lineageState ===
        'covered_by_exact_approved_work_output_and_planned_asset'
      && nullableIds.some((item) => item === null)
    ) return false
    const workOutputSlot =
      `${String(entry.approvedWorkItemId)}\u0000${String(entry.outputKey)}`
    if (
      entry.approvedWorkItemId !== null
      && entry.outputKey !== null
      && workOutputSlots.has(workOutputSlot)
    ) return false
    rendererIds.add(String(entry.rendererLayerId))
    if (
      entry.approvedWorkItemId !== null
      && entry.outputKey !== null
    ) workOutputSlots.add(workOutputSlot)
  }
  return true
}

function validateBoundary(value: unknown): boolean {
  return stableAuthorityStringify(value)
    === stableAuthorityStringify(AUTHORITY_BOUNDARY)
}

function hasExactKeys(
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(stableAuthorityStringify(value), 'utf8')
    .digest('hex')
}

function invalid(message: string): Error {
  return new Error(message)
}

void LIVING_FRAME_APPROVED_LINEAGE_OPEN_GATES
