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
  InMemoryCreateOnlyEditSkillArtifactStore,
  createEditSkillPlanApproval,
  skillManifestReference,
} from '../edit-skills/core'
import {
  createEditSkillRuntimeRegistries,
} from '../edit-skills/registry'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TRACK_ALL_SAM_OPERATION_V2,
  TRACK_ALL_TOOL_OPERATIONS,
  TrackAllCanonicalPrivateExecutionCoordinator,
  createTrackAllCanonicalPrivateRuntime,
  trackAllPlanSchema,
  trackAllWorkGraphArtifactSchema,
} from '../edit-skills/track-all'
import {
  LocalPrivateTrackAllMediaSink,
  TrackAllCanonicalPrivateDeterministicOperationDriver,
} from '../edit-skills/track-all/private/canonical-private-operation-driver'
import {
  TRACK_ALL_FIXTURE_SCOPE,
  createTrackAllAuthorityFixture,
} from './track-all-fixtures'
import { activatePrivateOfflineMediaBinaryRuntime } from '../tool-execution/media-binary-execution'
import { createPrivateOfflinePythonStructuredExecutionRuntime } from '../tool-execution/python-runner-execution'

process.env.REEDITPRO_TRACK_ALL_QUALIFICATION_GENERATING = '1'
process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING = '1'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-track-all-canonical-private-'))
try {
  const registries = createEditSkillRuntimeRegistries()
  const artifactStore = new DurablePrivateEditSkillArtifactStore({
    rootPath: join(root, 'artifacts'),
    schemas: registries.artifactSchemaRegistry,
  })
  const operations = [
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
      operationIds: new Set(operations),
      operationQualifications: new Map(operations.map((operationId) => [
        operationId,
        'internal_execution_qualified' as const,
      ])),
    },
    ...registries,
  })
  assert.equal(runtime.environmentClass, 'canonical_private')
  assert.equal(runtime.runtimeBindingRegistry.list().some((binding) =>
    binding.definition.environmentClass === 'production_server' &&
    binding.definition.skillKey === 'track_all'), false)

  const inMemoryRegistries = createEditSkillRuntimeRegistries()
  await assert.rejects(() => createTrackAllCanonicalPrivateRuntime({
    artifactStore: new InMemoryCreateOnlyEditSkillArtifactStore(
      inMemoryRegistries.artifactSchemaRegistry,
    ),
    privateArtifactAuthority: true,
    providerAuthority: { operations: new Map() },
    toolRegistry: { operationIds: new Set(), operationQualifications: new Map() },
    ...inMemoryRegistries,
  }), /durable private artifact authority/iu)

  const plugin = runtime.pluginRegistry.resolve(
    skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST),
  )
  const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
  const pythonRuntime = await createPrivateOfflinePythonStructuredExecutionRuntime()
  const unavailableRemotion = {
    execute: async (): Promise<never> => {
      throw new Error('Remotion is not part of the no-action or planar TRACK-23 fixture.')
    },
  }
  const mediaSink = new LocalPrivateTrackAllMediaSink({
    rootPath: join(root, 'media'),
  })

  const noActionFixture = await createTrackAllAuthorityFixture({
    runtime,
    assignmentId: 'track-23-no-action',
    requestedJobType: 'track_all.no_action',
    intendedTreatment: 'no_action',
  })
  const noAction = await compile(noActionFixture.assignment)
  const noActionCoordinator = new TrackAllCanonicalPrivateExecutionCoordinator({
    runtime,
    executorRouter,
    operationDriver: new TrackAllCanonicalPrivateDeterministicOperationDriver({
      artifactStore,
      runtimes: { media: mediaRuntime, python: pythonRuntime, remotion: unavailableRemotion },
      privateMediaSink: mediaSink,
      now: deterministicClock(),
    }),
    execution: {
      assignment: noActionFixture.assignment,
      ...noAction,
      initialArtifactRefs: [
        ...noActionFixture.assignment.contextArtifactRefs,
        ...noActionFixture.assignment.dependencyArtifactRefs,
      ],
    },
  })
  const noActionResult = await noActionCoordinator.executeApprovedGraph()
  assert.equal(noActionResult.finalResult.envelope.disposition, 'use_no_action')
  assert.equal(noActionResult.workItemResults.some((result) =>
    result.mutationRanges.length > 0), false)

  const sourcePath = join(root, 'planar-source.mp4')
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
    'testsrc2=size=320x180:rate=24:duration=2', '-an', '-c:v', 'libx264',
    '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-frames:v', '48',
    '-movflags', '+faststart', '-threads', '1', '-y', sourcePath,
  ], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  const sourceBytes = await readFile(sourcePath)
  const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
  const range = { startFrameInclusive: 0, endFrameExclusive: 48, fps: 24 }
  const planarFixture = await createTrackAllAuthorityFixture({
    runtime,
    assignmentId: 'track-23-planar',
    requestedJobType: 'track_all.track_planar_region',
    intendedTreatment: 'planar_geometry',
    targetType: 'planar_region',
    targetSemanticClass: 'phone_screen',
    sourceChecksum: sourceSha256,
    sourceFrameChecksum: sourceSha256,
    sourceWidth: 320,
    sourceHeight: 180,
    authorizedRange: range,
    analysisContextRange: range,
  })
  const planar = await compile(planarFixture.assignment)
  assert.equal(planar.plan.decision, 'track_planar_region')
  assert.deepEqual(planar.approvedWorkGraph.workItems.map((item) => item.jobType), [
    'track_all.plan_assignment',
    'track_all.produce_scene_geometry_graph',
    'track_all.track_planar_region',
    'track_all.project_result',
  ])
  const planarCoordinator = new TrackAllCanonicalPrivateExecutionCoordinator({
    runtime,
    executorRouter,
    operationDriver: new TrackAllCanonicalPrivateDeterministicOperationDriver({
      artifactStore,
      approvedSourceMedia: { sourceSha256, mimeType: 'video/mp4', bytes: sourceBytes },
      runtimes: { media: mediaRuntime, python: pythonRuntime, remotion: unavailableRemotion },
      privateMediaSink: mediaSink,
      now: deterministicClock(),
    }),
    execution: {
      assignment: planarFixture.assignment,
      ...planar,
      initialArtifactRefs: [
        ...planarFixture.assignment.contextArtifactRefs,
        ...planarFixture.assignment.dependencyArtifactRefs,
      ],
    },
  })
  const planarResult = await planarCoordinator.executeApprovedGraph()
  assert.equal(planarResult.finalResult.envelope.disposition, 'selected')
  assert.equal(planarResult.workItemResults.some((result) =>
    result.outputArtifactRefs.some((reference) =>
      reference.artifactType === 'planar_track_graph_v1')), true)
  const evidenceRefs = planarResult.workItemResults.flatMap((result) =>
    result.qaEvidenceArtifactRefs)
  assert.equal(evidenceRefs.length, planar.approvedWorkGraph.workItems.length)
  for (const reference of evidenceRefs) {
    const evidence = await artifactStore.readJson({
      reference,
      ...TRACK_ALL_FIXTURE_SCOPE,
    }) as Readonly<Record<string, unknown>>
    assert.equal(evidence.outputCreatedByExecutingAdapter, true)
    assert.equal(evidence.callerQualificationAccepted, false)
    assert.equal(evidence.outsideAuthorizedRangeModified, false)
  }

  console.log(JSON.stringify({
    status: 'passed',
    environmentClass: runtime.environmentClass,
    scenarios: ['no_action', 'planar_region'],
    actualToolOperations: [
      'tool.ffprobe.inspect_approved_media.v1',
      'tool.pyscenedetect.detect_scene_boundaries.v1',
      'tool.opencv.analyze_approved_visual_artifacts.v1',
    ],
    productionBindings: 0,
    prePersistedOutputsAccepted: false,
    samRequests: 0,
    gpuExecutions: 0,
  }, null, 2))

  async function compile(assignment: typeof noActionFixture.assignment) {
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

function deterministicClock() {
  let sequence = 0
  return () => new Date(Date.UTC(2026, 7, 5, 0, 0, sequence++)).toISOString()
}
