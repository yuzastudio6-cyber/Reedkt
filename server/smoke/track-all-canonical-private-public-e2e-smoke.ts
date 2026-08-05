import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  BROLL_PROVIDER_OPERATIONS,
  BROLL_TOOL_OPERATIONS,
} from '../edit-skills/b-roll'
import {
  DurablePrivateEditSkillArtifactStore,
  createEditSkillPlanApproval,
  skillManifestReference,
  type EditSkillArtifactReference,
  type SkillAssignment,
} from '../edit-skills/core'
import { createEditSkillRuntimeRegistries } from '../edit-skills/registry'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TRACK_ALL_SAM_OPERATION_V2,
  TRACK_ALL_TOOL_OPERATIONS,
  TrackAllCanonicalPrivateCompositeOperationDriver,
  TrackAllCanonicalPrivateExecutionCoordinator,
  createPrivacyPolicySnapshot,
  createTrackAllCanonicalPrivateRuntime,
  trackAllAtomicExecutionEvidenceSchema,
  trackAllPlanSchema,
  trackAllPublicWorkProjectionEvidenceSchema,
  trackAllWorkGraphArtifactSchema,
} from '../edit-skills/track-all'
import {
  LocalPrivateTrackAllMediaSink,
  TrackAllCanonicalPrivateDeterministicOperationDriver,
} from '../edit-skills/track-all/private/canonical-private-operation-driver'
import {
  TRACK_ALL_FIXTURE_SCOPE,
  createTrackAllAuthorityFixture,
  createTrackAllCaptionZonesFixture,
  createTrackAllPriorGraphFixture,
  createTrackAllPriorRepairEvidenceFixture,
  reviseTrackAllPublicAssignment,
  type TrackAllAuthorityFixture,
} from './track-all-fixtures'
import { activatePrivateOfflineMediaBinaryRuntime } from '../tool-execution/media-binary-execution'
import { createPrivateOfflinePythonStructuredExecutionRuntime } from '../tool-execution/python-runner-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution'

process.env.REEDITPRO_TRACK_ALL_QUALIFICATION_GENERATING = '1'
process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING = '1'

type ScenarioKind =
  | 'no_action'
  | 'planar'
  | 'repair'
  | 'privacy'
  | 'focus'
  | 'reframe'
  | 'blocked_sam'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-track-all-public-execution-'))
try {
  const sourcePath = join(root, 'source.mp4')
  const sourceProcess = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
    'testsrc2=size=320x180:rate=24:duration=1', '-an', '-c:v', 'mpeg4',
    '-q:v', '2', '-pix_fmt', 'yuv420p', '-frames:v', '24',
    '-movflags', '+faststart', '-threads', '1', '-y', sourcePath,
  ], { encoding: 'utf8' })
  assert.equal(sourceProcess.status, 0, sourceProcess.stderr)
  const sourceBytes = await readFile(sourcePath)
  const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
  const range = { startFrameInclusive: 0, endFrameExclusive: 24, fps: 24 }

  const registries = createEditSkillRuntimeRegistries()
  const artifactStore = new DurablePrivateEditSkillArtifactStore({
    rootPath: join(root, 'artifacts'),
    schemas: registries.artifactSchemaRegistry,
  })
  const operationIds = [
    ...BROLL_TOOL_OPERATIONS,
    ...TRACK_ALL_TOOL_OPERATIONS,
    TRACK_ALL_SAM_OPERATION_V2,
  ]
  const { runtime, executorRouter } = await createTrackAllCanonicalPrivateRuntime({
    artifactStore,
    privateArtifactAuthority: true,
    providerAuthority: {
      operations: new Map(BROLL_PROVIDER_OPERATIONS.map((operationId) => [
        operationId,
        'internal_execution_qualified' as const,
      ])),
    },
    toolRegistry: {
      operationIds: new Set(operationIds),
      operationQualifications: new Map(operationIds.map((operationId) => [
        operationId,
        'internal_execution_qualified' as const,
      ])),
    },
    ...registries,
  })
  const plugin = runtime.pluginRegistry.resolve(
    skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST),
  )
  const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
  const pythonRuntime = await createPrivateOfflinePythonStructuredExecutionRuntime()
  await prepareOfflineRemotionDockerRuntime()
  const remotionRuntime = await activatePrivateOfflineRemotionRenderRuntime()
  const mediaSink = new LocalPrivateTrackAllMediaSink({
    rootPath: join(root, 'media'),
  })

  const summaries: Array<{
    scenario: ScenarioKind
    decision: string
    disposition: string
    toolOperationIds: readonly string[]
    workResultCount: number
    mutationCount: number
  }> = []
  for (const scenario of [
    'no_action',
    'planar',
    'repair',
    'privacy',
    'focus',
    'reframe',
    'blocked_sam',
  ] as const) {
    const assignmentId = `track-24-${scenario}`
    const priorGraphRef = ['repair', 'privacy', 'focus', 'reframe'].includes(scenario)
      ? await createTrackAllPriorGraphFixture({
          runtime,
          nextAssignmentId: assignmentId,
          authorizedRange: range,
          sourceSha256,
          boxConfidence: scenario === 'privacy' ? 0.5 : undefined,
        })
      : undefined
    const fixture = await createFixture({
      scenario,
      assignmentId,
      priorGraphRef,
    })
    const assignment = await withConditionalAuthorities({
      scenario,
      fixture,
      priorGraphRef,
    })
    const compiled = await compile(assignment)
    const atomicSamWork = compiled.pluginWorkGraph.atomicWorkItems.filter((item) =>
      item.operationId === TRACK_ALL_SAM_OPERATION_V2 || item.createsGpuWork)
    assert.equal(atomicSamWork.length, 0)
    if (scenario === 'blocked_sam') {
      assert.equal(compiled.plan.decision, 'blocked_external_sam_prerequisites')
      assert.equal(compiled.publicPlan.envelope.disposition, 'blocked')
    }
    const coordinator = new TrackAllCanonicalPrivateExecutionCoordinator({
      runtime,
      executorRouter,
      operationDriver: new TrackAllCanonicalPrivateCompositeOperationDriver({
        artifactStore,
        deterministicStageExecutor: new TrackAllCanonicalPrivateDeterministicOperationDriver({
          artifactStore,
          approvedSourceMedia: {
            sourceSha256,
            mimeType: 'video/mp4',
            bytes: sourceBytes,
          },
          runtimes: {
            media: mediaRuntime,
            python: pythonRuntime,
            remotion: remotionRuntime,
          },
          privateMediaSink: mediaSink,
          now: deterministicClock(scenario),
        }),
        now: deterministicClock(scenario),
      }),
      execution: {
        assignment,
        ...compiled,
        initialArtifactRefs: [
          ...assignment.contextArtifactRefs,
          ...assignment.dependencyArtifactRefs,
        ],
      },
    })
    const result = await coordinator.executeApprovedGraph()
    assert.equal(result.workItemResults.length,
      compiled.approvedWorkGraph.workItems.length)
    assert.equal(result.runtimeDispatchReceiptHashes.length,
      compiled.approvedWorkGraph.workItems.length)
    assert.equal(result.workItemResults.every((workResult) =>
      workResult.status === 'succeeded' &&
      !workResult.callerSelectedExecutable &&
      !workResult.outsideAuthorizedRangeModified), true)
    const toolOperationIds = new Set<string>()
    for (const workResult of result.workItemResults) {
      assert.equal(workResult.qaEvidenceArtifactRefs.length, 1)
      const projection = trackAllPublicWorkProjectionEvidenceSchema.parse(
        await artifactStore.readJson({
          reference: workResult.qaEvidenceArtifactRefs[0]!,
          ...TRACK_ALL_FIXTURE_SCOPE,
        }),
      )
      assert.equal(projection.outputCreatedByExecutingAdapter, true)
      assert.equal(projection.callerQualificationAccepted, false)
      assert.equal(projection.privateArtifactsOnly, true)
      assert.equal(projection.outsideAuthorizedRangeModified, false)
      const atomic = trackAllAtomicExecutionEvidenceSchema.parse(
        await artifactStore.readJson({
          reference: projection.atomicExecutionEvidenceRef,
          ...TRACK_ALL_FIXTURE_SCOPE,
        }),
      )
      assert.equal(atomic.prePersistedOutputAccepted, false)
      assert.equal(atomic.executionCounts.actualSamRequestCount, 0)
      assert.equal(atomic.executionCounts.actualGpuExecutionCount, 0)
      assert.equal(
        atomic.executionCounts.executionEvidenceClass,
        'deterministic_private_execution',
      )
      for (const operationId of atomic.actualToolOperationIds) {
        toolOperationIds.add(operationId)
      }
    }
    assert.equal(result.executionCounts.actualSamRequestCount, 0)
    assert.equal(result.executionCounts.actualGpuExecutionCount, 0)
    assertScenarioEvidence(scenario, toolOperationIds)
    summaries.push({
      scenario,
      decision: compiled.plan.decision,
      disposition: result.finalResult.envelope.disposition,
      toolOperationIds: [...toolOperationIds].sort(),
      workResultCount: result.workItemResults.length,
      mutationCount: result.workItemResults.reduce((count, workResult) =>
        count + workResult.mutationRanges.length, 0),
    })
  }

  assert.equal(runtime.runtimeBindingRegistry.list().some((binding) =>
    binding.definition.skillKey === 'track_all' &&
    binding.definition.environmentClass === 'production_server'), false)
  assert.equal(summaries.find((entry) => entry.scenario === 'no_action')?.mutationCount, 0)
  assert.equal(summaries.find((entry) => entry.scenario === 'blocked_sam')?.mutationCount, 0)
  assert.equal(summaries.find((entry) => entry.scenario === 'blocked_sam')?.disposition,
    'blocked')

  console.log(JSON.stringify({
    status: 'passed',
    orchestrationBoundaryPublicPluginOnly: true,
    canonicalAdapterSetupPrivate: true,
    scenarioCount: summaries.length,
    scenarios: summaries,
    exactArtifactFedDispatch: true,
    outputCreatedDuringAdapterExecution: true,
    prePersistedOutputsAccepted: false,
    publicArtifactCount: 0,
    productionMutationCount: 0,
    productionBindings: 0,
    actualSamRequestCount: 0,
    actualGpuExecutionCount: 0,
  }, null, 2))

  async function createFixture(input: {
    scenario: ScenarioKind
    assignmentId: string
    priorGraphRef?: EditSkillArtifactReference
  }) {
    const common = {
      runtime,
      assignmentId: input.assignmentId,
      sourceChecksum: sourceSha256,
      sourceFrameChecksum: sourceSha256,
      sourceWidth: 320,
      sourceHeight: 180,
      authorizedRange: range,
      analysisContextRange: range,
      priorTrackGraphRefs: input.priorGraphRef ? [input.priorGraphRef] : [],
    }
    switch (input.scenario) {
      case 'planar': return createTrackAllAuthorityFixture({
        ...common,
        requestedJobType: 'track_all.track_planar_region',
        intendedTreatment: 'planar_geometry',
        targetType: 'planar_region',
        targetSemanticClass: 'phone_screen',
      })
      case 'repair': return createTrackAllAuthorityFixture({
        ...common,
        requestedJobType: 'track_all.repair_track',
        intendedTreatment: 'repair',
        targetType: 'existing_track',
        groundingKind: 'existing_track_reference',
        groundingArtifactRef: input.priorGraphRef,
      })
      case 'privacy': return createTrackAllAuthorityFixture({
        ...common,
        requestedJobType: 'track_all.apply_privacy_redaction',
        intendedTreatment: 'privacy_redaction',
        targetSemanticClass: 'face',
        privacyClassification: 'high_assurance',
        targetCriticality: 'privacy_critical',
        privacyCriticality: 'high',
      })
      case 'focus': return createTrackAllAuthorityFixture({
        ...common,
        requestedJobType: 'track_all.apply_tracked_focus',
        intendedTreatment: 'tracked_focus',
        targetSemanticClass: 'product',
      })
      case 'reframe': return createTrackAllAuthorityFixture({
        ...common,
        requestedJobType: 'track_all.prepare_tracked_reframe',
        intendedTreatment: 'tracked_reframe',
        targetSemanticClass: 'speaker',
      })
      case 'blocked_sam': return createTrackAllAuthorityFixture({
        ...common,
        requestedJobType: 'track_all.produce_selected_target_graph',
        intendedTreatment: 'geometry_only',
        targetType: 'selected_instance',
      })
      case 'no_action': return createTrackAllAuthorityFixture({
        ...common,
        requestedJobType: 'track_all.no_action',
        intendedTreatment: 'no_action',
      })
    }
  }

  async function withConditionalAuthorities(input: {
    scenario: ScenarioKind
    fixture: TrackAllAuthorityFixture
    priorGraphRef?: EditSkillArtifactReference
  }): Promise<SkillAssignment> {
    const extras: EditSkillArtifactReference[] = []
    if (input.priorGraphRef) extras.push(input.priorGraphRef)
    if (input.scenario === 'repair') {
      extras.push(await createTrackAllPriorRepairEvidenceFixture({
        runtime,
        fixture: input.fixture,
        trackGraphRef: input.priorGraphRef!,
      }))
    }
    if (input.scenario === 'privacy') {
      const policy = createPrivacyPolicySnapshot({
        schemaVersion: 'privacy_policy_snapshot_v1',
        ...TRACK_ALL_FIXTURE_SCOPE,
        policyVersion: 1,
        failClosed: true,
        allowedTreatments: [
          'solid_fill',
          'pixelate',
          'mosaic',
          'conservative_region_cover',
          'tracked_crop_exclusion',
        ],
      })
      extras.push(await artifactStore.putJson({
        artifactType: 'privacy_policy_snapshot_v1',
        value: policy,
        ...TRACK_ALL_FIXTURE_SCOPE,
      }))
    }
    if (input.scenario === 'reframe') {
      extras.push(await createTrackAllCaptionZonesFixture({
        runtime,
        assignment: input.fixture.assignment,
        specializedAssignmentHash: input.fixture.specializedAssignment.assignmentHash,
      }))
    }
    return extras.length === 0
      ? input.fixture.assignment
      : reviseTrackAllPublicAssignment(input.fixture.assignment, [
          ...input.fixture.assignment.contextArtifactRefs,
          ...extras,
        ])
  }

  async function compile(assignment: SkillAssignment) {
    const publicPlan = await plugin.planAssignment({ assignment })
    const plan = trackAllPlanSchema.parse(await artifactStore.readJson({
      reference: publicPlan.payloadRef,
      ...TRACK_ALL_FIXTURE_SCOPE,
    }))
    const approval = createEditSkillPlanApproval({
      schemaVersion: 'edit-skill-plan-approval-v1',
      assignmentId: assignment.assignmentId,
      assignmentHash: assignment.assignmentHash,
      planId: publicPlan.envelope.planId,
      planHash: publicPlan.envelope.planHash,
      manifestRef: assignment.manifestRef,
      authorizedRange: assignment.authorizedRange,
      approved: true,
      approvedAt: '2026-08-05T00:00:00.000Z',
    })
    const approvedWorkGraph = await plugin.compileApprovedWorkGraph({
      assignment,
      plan: publicPlan,
      approval,
    })
    const pluginWorkGraph = trackAllWorkGraphArtifactSchema.parse(
      await artifactStore.readJson({
        reference: approvedWorkGraph.pluginWorkGraphRef!,
        ...TRACK_ALL_FIXTURE_SCOPE,
      }),
    )
    return { publicPlan, plan, approval, approvedWorkGraph, pluginWorkGraph }
  }
} finally {
  await rm(root, { recursive: true, force: true })
}

function assertScenarioEvidence(
  scenario: ScenarioKind,
  operationIds: ReadonlySet<string>,
): void {
  if (scenario === 'planar') {
    for (const required of [
      'tool.ffprobe.inspect_approved_media.v1',
      'tool.pyscenedetect.detect_scene_boundaries.v1',
      'tool.opencv.analyze_approved_visual_artifacts.v1',
    ]) assert.equal(operationIds.has(required), true)
  } else if (scenario === 'privacy') {
    for (const required of [
      'tool.ffprobe.inspect_approved_media.v1',
      'tool.pyscenedetect.detect_scene_boundaries.v1',
      'tool.opencv.analyze_approved_visual_artifacts.v1',
      'tool.ffmpeg.execute_approved_media_recipe.v1',
      'tool.opencv.inspect_track_all_privacy_preview.v1',
    ]) assert.equal(operationIds.has(required), true)
  } else if (scenario === 'focus' || scenario === 'reframe') {
    assert.equal(operationIds.has('tool.remotion.render_approved_composition.v1'), true)
  } else {
    assert.equal(operationIds.size, 0)
  }
}

function deterministicClock(scenario: ScenarioKind) {
  let sequence = 0
  const base = [
    'no_action', 'planar', 'repair', 'privacy', 'focus', 'reframe', 'blocked_sam',
  ].indexOf(scenario) * 1_000
  return () => new Date(Date.UTC(2026, 7, 5, 0, 0, 0, base + sequence++)).toISOString()
}
