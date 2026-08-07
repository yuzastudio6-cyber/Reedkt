import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  CANONICAL_CAPTION_BROLL_APPROVED_PLAN_HARNESS_VERSION,
  createCanonicalCaptionBrollApprovedPlanHarness,
  type CanonicalCaptionBrollApprovedPlanHarnessInput,
} from '../internal-testing/canonical-caption-broll-approved-plan-harness'
import {
  CANONICAL_BROLL_SKILL_COMPONENT_V2_VERSION,
} from '../edit-skills/b-roll/b-roll-canonical-plan-component'
import { hashSkillValue } from '../edit-skills/core'
import { revalidateCanonicalBrollPlanAuthority } from '../services/canonical-broll-plan-component-service'

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
    canonicalMasterTimingPlan: {
      schemaVersion: 'canonical-master-timing-smoke-v1',
      masterTimingPlanId: 'master.caption-broll.approved-plan',
      fps: 24,
      totalFrames: 240,
    },
    canonicalTimingSummary: {
      validationStatus: 'passed',
      approvalBlocked: false,
      fps: 24,
      totalFrames: 240,
    },
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
      frameRateNumerator: 24,
      frameRateDenominator: 1,
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
  'The B-roll assignment must consume its exact bounded timing projection.')
  check(result.masterTimingBinding.brollTimingProjectionDigestSha256 ===
    result.masterTimingPlan.timingHash
    && result.masterTimingBinding
      .canonicalMasterTimingRemainsSoleClockAuthority,
  'The B-roll timing projection must bind to, and never replace, canonical MasterTiming.')
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
  const persistedComponent = result.persistedComponent.component
  check(
    persistedComponent.schemaVersion ===
      CANONICAL_BROLL_SKILL_COMPONENT_V2_VERSION
      && persistedComponent.restartSafeExecutionInputsPersisted,
    'The immutable B-roll component must persist versioned restart-safe execution inputs.',
  )
  if (persistedComponent.schemaVersion !==
    CANONICAL_BROLL_SKILL_COMPONENT_V2_VERSION) {
    throw new Error('The Caption+B-roll harness requires the V2 execution component.')
  }
  const reread = await revalidateCanonicalBrollPlanAuthority({
    localStorageRoot,
    component: persistedComponent,
    masterTimingBinding: result.masterTimingBinding,
    canonicalMasterTimingPlan: input.canonicalMasterTimingPlan,
    canonicalTimingSummary: input.canonicalTimingSummary,
    canonicalWorkItems: result.canonicalWorkItems,
  })
  check(
    reread.executionAuthorities?.sourceMediaArtifacts[0]?.sourceId ===
      input.source.sourceSequenceItemId
      && reread.executionAuthorities.sourceMediaArtifacts[0]?.objectSha256 ===
        input.source.objectSha256
      && reread.executionAuthorities.masterTimingProjection.timingHash ===
        result.masterTimingPlan.timingHash
      && reread.executionAuthorities.visualOwnership.assignmentId ===
        input.assignmentId,
    'Restart-safe reread must recover the exact source, timing, and ownership authorities.',
  )
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

  const { componentHash, ...componentCore } =
    persistedComponent
  check(
    hashSkillValue(componentCore) === componentHash,
    'The persisted V2 component digest must cover every restart-safe authority reference.',
  )
  const crossedSourceCore = {
    ...componentCore,
    sourceMediaArtifactRefs: persistedComponent.sourceMediaArtifactRefs.map(
      (item, index) => index === 0
        ? { ...item, sourceId: 'source.caption-broll.crossed-restart' }
        : item,
    ),
  }
  await assert.rejects(
    () => revalidateCanonicalBrollPlanAuthority({
      localStorageRoot,
      component: {
        ...crossedSourceCore,
        componentHash: hashSkillValue(crossedSourceCore),
      },
      masterTimingBinding: result.masterTimingBinding,
      canonicalMasterTimingPlan: input.canonicalMasterTimingPlan,
      canonicalTimingSummary: input.canonicalTimingSummary,
      canonicalWorkItems: result.canonicalWorkItems,
    }),
    /crossed immutable assignment authority/u,
  )
  checks += 1

  const missingSourceCore = {
    ...componentCore,
    sourceMediaArtifactRefs: [],
  }
  await assert.rejects(
    () => revalidateCanonicalBrollPlanAuthority({
      localStorageRoot,
      component: {
        ...missingSourceCore,
        componentHash: hashSkillValue(missingSourceCore),
      },
      masterTimingBinding: result.masterTimingBinding,
      canonicalMasterTimingPlan: input.canonicalMasterTimingPlan,
      canonicalTimingSummary: input.canonicalTimingSummary,
      canonicalWorkItems: result.canonicalWorkItems,
    }),
    /crossed immutable assignment authority/u,
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
  await assert.rejects(
    () => createCanonicalCaptionBrollApprovedPlanHarness({
      ...input,
      assignmentId: 'assignment.caption-broll.fractional-source-rate',
      source: {
        ...input.source,
        frameRateNumerator: 30000,
        frameRateDenominator: 1001,
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
