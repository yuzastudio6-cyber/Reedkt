import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  CANONICAL_CAPTION_BROLL_APPROVED_PLAN_HARNESS_VERSION,
  createCanonicalCaptionBrollApprovedPlanHarness,
  type CanonicalCaptionBrollApprovedPlanHarnessInput,
} from '../internal-testing/canonical-caption-broll-approved-plan-harness'

let checks = 0
function check(value: unknown, message: string): void {
  assert.ok(value, message)
  checks += 1
}

const localStorageRoot = await mkdtemp(join(
  tmpdir(),
  'reeditpro-caption-broll-approved-plan-',
))
try {
  const input: CanonicalCaptionBrollApprovedPlanHarnessInput = {
    localStorageRoot,
    ownerUserId: 'owner.caption-broll.approved-plan',
    workspaceId: 'workspace.caption-broll.approved-plan',
    projectId: 'project.caption-broll.approved-plan',
    editSessionId: 'edit.caption-broll.approved-plan',
    planningRequestId: 'planning.caption-broll.approved-plan',
    assignmentId: 'assignment.caption-broll.approved-plan',
    editPlanVersion: 1,
    timelineRange: {
      startFrameInclusive: 0,
      endFrameExclusive: 240,
      fps: 24,
    },
    authorizedRange: {
      startFrameInclusive: 120,
      endFrameExclusive: 192,
      fps: 24,
    },
    segmentIds: ['scene.caption-broll.approved-plan'],
    confirmedAspectRatio: '16:9',
    approvedAt: '2026-08-07T14:00:00.000Z',
    source: {
      sourceSequenceItemId: 'source.caption-broll.approved-plan',
      objectSha256: '1'.repeat(64),
      byteLength: 1_024,
      durationFrames: 96,
      fps: 24,
      width: 320,
      height: 180,
      sourceRange: {
        startFrameInclusive: 12,
        endFrameExclusive: 84,
        fps: 24,
      },
    },
  }
  const result = await createCanonicalCaptionBrollApprovedPlanHarness(input)

  check(result.harnessVersion ===
    CANONICAL_CAPTION_BROLL_APPROVED_PLAN_HARNESS_VERSION,
  'The internal qualification harness must expose one versioned identity.')
  check(result.masterTimingPlan.timingHash ===
    result.brollAssignment.masterTimingHash,
  'The B-roll assignment must consume the exact canonical MasterTiming digest.')
  check(result.sourceManifest.sourceId ===
    input.source.sourceSequenceItemId
    && result.sourceManifest.objectSha256 === input.source.objectSha256,
  'The selected B-roll source must retain exact source-sequence and byte lineage.')
  check(result.publicPlan.envelope.disposition === 'use_skill'
    && result.canonicalWorkGraph.route === 'existing_source',
  'The registered B-roll planner must select its existing-source route.')
  check(result.publicApprovedWorkGraph.pluginWorkGraphHash ===
    result.canonicalWorkGraph.workGraphHash,
  'The public approval and canonical B-roll work graph must be identical.')
  check(result.canonicalWorkItems.length === 12
    && result.canonicalWorkItems.every((item) =>
      item.sourceSequenceItemIds.join('|') ===
        input.source.sourceSequenceItemId
      && item.expectedOutputs.every((output) =>
        output.timingIds.join('|') ===
          result.masterTimingPlan.timingHash)),
  'Every B-roll work item must retain exact source and MasterTiming lineage.')
  check(result.canonicalWorkItems.every((item) =>
    item.approvedProviderRoute === undefined
    && item.providerExecutionMode === 'none'),
  'Existing-source planning must emit no provider route or execution mode.')
  check(result.persistedComponent.component.assignmentHash ===
    result.brollAssignment.assignmentHash
    && result.persistedComponent.component.workGraphHash ===
      result.canonicalWorkGraph.workGraphHash,
  'The immutable B-roll component must bind the exact assignment and graph.')
  check(result.estimatedCredits > 0,
  'The approved B-roll plan must expose an estimate input without billing.')
  check(!result.providerWorkPlanned && !result.runtimeDispatched
    && !result.assetCreated && !result.finalQaApproved
    && !result.publicDeliveryCreated
    && !result.productionAuthorityGranted,
  'The source harness must not promote runtime, asset, QA, delivery, or production authority.')

  await assert.rejects(
    () => createCanonicalCaptionBrollApprovedPlanHarness({
      ...input,
      assignmentId: 'assignment.caption-broll.crossed-time',
      source: { ...input.source, fps: 30 },
    }),
    /one exact contained timing/u,
  )
  checks += 1
  await assert.rejects(
    () => createCanonicalCaptionBrollApprovedPlanHarness({
      ...input,
      assignmentId: 'assignment.caption-broll.crossed-source',
      source: {
        ...input.source,
        sourceRange: {
          startFrameInclusive: 12,
          endFrameExclusive: 120,
          fps: 24,
        },
      },
    }),
    /one exact contained timing/u,
  )
  checks += 1

  console.log(JSON.stringify({
    smoke: 'canonical_caption_broll_approved_plan_harness',
    status: 'passed',
    checks,
    canonicalWorkItems: result.canonicalWorkItems.length,
    exactMasterTimingBound: true,
    existingOwnerImplementationsReused: true,
    centralOrchestraImplemented: false,
    runtimeDispatched: false,
    providerCalled: false,
    assetCreated: false,
    finalQaApproved: false,
    publicDeliveryCreated: false,
    productionAuthorityGranted: false,
  }, null, 2))
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
}
