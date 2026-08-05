import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'

import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../../security/private-local-persistence'

import type {
  EditSkillArtifactReference,
  EditSkillArtifactStore,
} from '../../core/edit-skill-artifact-store'
import {
  canonicalSkillJson,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'
import { createSkillQaFinding } from '../../core/skill-qa-registry'
import { createCaptionReservedZonesV1 } from '../../shared/assignment-authorities'
import {
  projectTrackGraphV1,
  trackGraphV1Schema,
  trackGraphV2Schema,
  type TrackGraphV2,
} from '../../shared/track-graph/track-graph-schemas'
import type { PrivateOfflineMediaBinaryRuntime } from '../../../tool-execution/media-binary-execution'
import type { PrivateOfflinePythonStructuredExecutionRuntime } from '../../../tool-execution/python-runner-execution'
import type { PrivateOfflineRemotionRenderRuntime } from '../../../tool-execution/remotion-render-execution'
import type {
  TrackAllCanonicalPrivateAtomicResult,
  TrackAllCanonicalPrivateAtomicStageExecutor,
  TrackAllCanonicalPrivateExecutionPackage,
  TrackAllCanonicalPrivateOperationDriver,
  TrackAllCanonicalPrivateOperationResult,
  TrackAllCanonicalPrivatePublicOutputProjector,
} from '../track-all-canonical-private-runtime'
import {
  aggregateTrackAllCanonicalPrivateExecutionCounts,
  deterministicTrackAllCanonicalPrivateExecutionCounts,
} from '../track-all-canonical-private-runtime'
import type { TrackAllPublicJobType } from '../track-all-work-graph'
import {
  trackAllContextManifestSchema,
  trackAllCrossSkillHandoffSchema,
  trackAllIntegrationQaReportSchema,
  trackAllPrivacyQaReportSchema,
  trackAllRepairReceiptSchema,
  trackAllTargetQaReportSchema,
  trackAllTemporalQaReportSchema,
  trackedFocusPlanSchema,
  trackedFocusResultSchema,
  trackedRedactionPlanSchema,
  trackedRedactionResultSchema,
  trackedReframePlanSchema,
  trackedReframeResultSchema,
  trackBoxSequenceSchema,
} from '../track-all-active-artifact-contracts'
import {
  createTrackAllResultReceipt,
  createTrackAllSceneContext,
  privacyPolicySnapshotSchema,
  priorTrackRepairEvidenceSchema,
  sourceFrameAuthoritySchema,
  trackAllCaptionReservedZonesSchema,
  trackAllResultReceiptSchema,
  trackAllTargetSpecificationSchema,
} from '../track-all-schemas'
import {
  buildTrackAllFfprobeRequest,
  buildTrackAllOpenCvGeometryRequest,
  buildTrackAllSceneDetectionRequest,
  createTrackAllCameraMotionGraph,
  createTrackAllPlanarTrackGraph,
  normalizeTrackAllFfprobeSourceTruth,
  normalizeTrackAllShotBoundaryEvidence,
} from './deterministic-geometry-runtime'
import {
  buildTrackAllPrivacyRedactionExecutionRequest,
  compileTrackAllPrivacyRedaction,
  deriveTrackAllPrivacyQaReport,
  finalizeTrackAllPrivacyRedaction,
  inspectTrackAllPrivacyPreview,
  type CompiledTrackAllPrivacyRedaction,
} from './privacy-redaction-runtime'
import {
  buildTrackAllTreatmentRemotionRequest,
  compileTrackAllFocus,
  compileTrackAllReframe,
  deriveTrackAllTreatmentIntegrationQa,
  finalizeTrackAllFocus,
  finalizeTrackAllReframe,
  type CompiledTrackAllFocus,
  type CompiledTrackAllReframe,
} from './focus-reframe-runtime'
import { compileTrackAllCrossSkillHandoffs } from './cross-skill-handoff-runtime'

export interface TrackAllApprovedPrivateSourceMedia {
  sourceSha256: string
  mimeType: 'video/mp4'
  bytes: Buffer
}

export interface TrackAllCanonicalPrivateMediaSink {
  persist(input: {
    artifactType: string
    ownerUserId: string
    workspaceId: string
    projectId: string
    bytes: Buffer
    sha256: string
    evidenceHash: string
  }): Promise<EditSkillArtifactReference>
}

export class LocalPrivateTrackAllMediaSink implements TrackAllCanonicalPrivateMediaSink {
  readonly #rootPath: string

  constructor(input: { rootPath: string }) {
    if (!input.rootPath.trim()) {
      throw new Error('Track All private media sink requires a server-owned root.')
    }
    this.#rootPath = input.rootPath
  }

  async persist(input: {
    artifactType: string
    ownerUserId: string
    workspaceId: string
    projectId: string
    bytes: Buffer
    sha256: string
    evidenceHash: string
  }): Promise<EditSkillArtifactReference> {
    if (
      !/^[a-z][a-z0-9_.-]{2,127}$/u.test(input.artifactType) ||
      input.bytes.byteLength < 64 ||
      input.bytes.byteLength > 2 * 1024 * 1024 * 1024 ||
      sha256(input.bytes) !== input.sha256 ||
      !/^[a-f0-9]{64}$/u.test(input.evidenceHash)
    ) throw new Error('Track All private media failed its bounded content authority.')
    const reference: EditSkillArtifactReference = {
      artifactType: input.artifactType,
      sha256: input.sha256,
      byteLength: input.bytes.byteLength,
      ownerUserId: input.ownerUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
    }
    const identity = hashSkillValue({
      schemaVersion: 'track_all_private_media_identity_v1',
      reference,
      evidenceHash: input.evidenceHash,
    })
    const relativePath = [
      'track-all-media',
      'private-v1',
      identity.slice(0, 2),
      `${identity}.bin`,
    ].join('/')
    await writePrivateFileCreateOnlyWithinRoot({
      rootPath: this.#rootPath,
      relativePath,
      content: input.bytes,
    })
    const stored = await readPrivateFileIfExistsWithinRoot({
      rootPath: this.#rootPath,
      relativePath,
    })
    if (!stored || !stored.equals(input.bytes) || sha256(stored) !== reference.sha256) {
      throw new Error('Track All private media changed during create-only persistence.')
    }
    return Object.freeze(reference)
  }
}

export interface TrackAllCanonicalPrivateToolRuntimes {
  media: Pick<PrivateOfflineMediaBinaryRuntime, 'execute'>
  python: Pick<PrivateOfflinePythonStructuredExecutionRuntime, 'execute'>
  remotion: Pick<PrivateOfflineRemotionRenderRuntime, 'execute'>
}

interface StageExecution {
  value: unknown
  evidenceHashes: readonly string[]
  actualToolOperationIds: readonly string[]
}

interface SourceTruthExecution {
  value: ReturnType<typeof normalizeTrackAllFfprobeSourceTruth>
  evidenceHashes: string[]
}

interface SceneContextExecution {
  value: ReturnType<typeof createTrackAllSceneContext>
  evidenceHashes: string[]
}

interface CameraMotionExecution {
  value: ReturnType<typeof createTrackAllCameraMotionGraph>
  evidenceHashes: string[]
}

interface PrivacyExecution {
  compiled: CompiledTrackAllPrivacyRedaction
  projectedPlan: ReturnType<typeof trackedRedactionPlanSchema.parse>
  qa: ReturnType<typeof deriveTrackAllPrivacyQaReport>
  result: ReturnType<typeof finalizeTrackAllPrivacyRedaction>
  projectedQa: ReturnType<typeof trackAllPrivacyQaReportSchema.parse>
  projectedResult: ReturnType<typeof trackedRedactionResultSchema.parse>
  privateMediaRef: EditSkillArtifactReference
  evidenceHashes: string[]
}

interface FocusExecution {
  compiled: CompiledTrackAllFocus
  projectedPlan: ReturnType<typeof trackedFocusPlanSchema.parse>
  qa: ReturnType<typeof deriveTrackAllTreatmentIntegrationQa>
  result: ReturnType<typeof finalizeTrackAllFocus>
  projectedQa: ReturnType<typeof trackAllIntegrationQaReportSchema.parse>
  projectedResult: ReturnType<typeof trackedFocusResultSchema.parse>
  privateMediaRef: EditSkillArtifactReference
  evidenceHashes: string[]
}

interface ReframeExecution {
  compiled: CompiledTrackAllReframe
  projectedPlan: ReturnType<typeof trackedReframePlanSchema.parse>
  qa: ReturnType<typeof deriveTrackAllTreatmentIntegrationQa>
  result: ReturnType<typeof finalizeTrackAllReframe>
  projectedQa: ReturnType<typeof trackAllIntegrationQaReportSchema.parse>
  projectedResult: ReturnType<typeof trackedReframeResultSchema.parse>
  privateMediaRef: EditSkillArtifactReference
  evidenceHashes: string[]
}

/**
 * Executes the fixed canonical-private deterministic routes. It contains no
 * SAM implementation and fails closed if a SAM/GPU atomic item reaches it.
 */
export class TrackAllCanonicalPrivateDeterministicOperationDriver
implements TrackAllCanonicalPrivateOperationDriver,
TrackAllCanonicalPrivateAtomicStageExecutor,
TrackAllCanonicalPrivatePublicOutputProjector {
  readonly #artifactStore: EditSkillArtifactStore
  readonly #source: TrackAllApprovedPrivateSourceMedia | undefined
  readonly #runtimes: TrackAllCanonicalPrivateToolRuntimes
  readonly #mediaSink: TrackAllCanonicalPrivateMediaSink
  readonly #now: () => string
  readonly #atomicResults = new Map<string, TrackAllCanonicalPrivateAtomicResult>()
  readonly #atomicToolOperations = new Map<string, readonly string[]>()
  readonly #reportedAtomicKeys = new Set<string>()
  #sourceTruth?: SourceTruthExecution
  #sceneContext?: SceneContextExecution
  #cameraMotion?: CameraMotionExecution
  #planar?: ReturnType<typeof createTrackAllPlanarTrackGraph>
  #planarEvidenceHashes: string[] = []
  #temporalQa?: ReturnType<typeof trackAllTemporalQaReportSchema.parse>
  #handoff?: ReturnType<typeof trackAllCrossSkillHandoffSchema.parse>
  #privacy?: PrivacyExecution
  #privacyCompilation?: Pick<PrivacyExecution, 'compiled' | 'projectedPlan'>
  #privacyRender?: Pick<PrivacyExecution, 'privateMediaRef' | 'evidenceHashes'> & {
    outputBytes: Buffer
    outputSha256: string
  }
  #privacyInspection?: {
    value: ReturnType<typeof inspectTrackAllPrivacyPreview>
    evidenceHashes: string[]
  }
  #focus?: FocusExecution
  #focusCompilation?: Pick<FocusExecution, 'compiled' | 'projectedPlan'>
  #focusRender?: Pick<FocusExecution, 'privateMediaRef' | 'evidenceHashes'> & {
    render: Awaited<ReturnType<TrackAllCanonicalPrivateToolRuntimes['remotion']['execute']>>
  }
  #reframe?: ReframeExecution
  #reframeCompilation?: Pick<ReframeExecution, 'compiled' | 'projectedPlan'>
  #reframeRender?: Pick<ReframeExecution, 'privateMediaRef' | 'evidenceHashes'> & {
    render: Awaited<ReturnType<TrackAllCanonicalPrivateToolRuntimes['remotion']['execute']>>
  }
  #repair?: ReturnType<typeof trackAllRepairReceiptSchema.parse>

  constructor(input: {
    artifactStore: EditSkillArtifactStore
    approvedSourceMedia?: TrackAllApprovedPrivateSourceMedia
    runtimes: TrackAllCanonicalPrivateToolRuntimes
    privateMediaSink: TrackAllCanonicalPrivateMediaSink
    now?: () => string
  }) {
    if (input.artifactStore.storageClass !== 'durable') {
      throw new Error('Track All deterministic operation driver requires durable private storage.')
    }
    if (input.approvedSourceMedia && (
      input.approvedSourceMedia.bytes.byteLength < 64 ||
      sha256(input.approvedSourceMedia.bytes) !== input.approvedSourceMedia.sourceSha256
    )) throw new Error('Track All approved private source bytes fail their exact checksum authority.')
    this.#artifactStore = input.artifactStore
    this.#source = input.approvedSourceMedia
    this.#runtimes = input.runtimes
    this.#mediaSink = input.privateMediaSink
    this.#now = input.now ?? (() => new Date().toISOString())
  }

  async executeAtomicStage(input: Parameters<
    TrackAllCanonicalPrivateAtomicStageExecutor['executeAtomicStage']
  >[0]) {
    if (
      input.item.operationId === 'tool.sam3_1.track_masklets.v2' ||
      input.item.createsGpuWork
    ) throw new Error(
      'Track All deterministic stage executor rejected SAM/GPU atomic work.',
    )
    const stage = await this.#executeStage(input.item.stageId, input.execution)
    return {
      ...stage,
      executionCounts: deterministicTrackAllCanonicalPrivateExecutionCounts(),
    }
  }

  async projectPublicOutput(input: Parameters<
    TrackAllCanonicalPrivatePublicOutputProjector['projectPublicOutput']
  >[0]): Promise<unknown> {
    return this.#publicOutput(input.jobType, input.execution)
  }

  async execute(input: Parameters<TrackAllCanonicalPrivateOperationDriver['execute']>[0]):
  Promise<TrackAllCanonicalPrivateOperationResult> {
    if (input.execution.plan.samWorkPlanned || input.execution.pluginWorkGraph.atomicWorkItems.some((item) =>
      item.createsGpuWork || item.operationId === 'tool.sam3_1.track_masklets.v2')) {
      throw new Error('Blocked SAM/GPU work cannot enter the deterministic canonical-private driver.')
    }
    const publicItem = input.execution.approvedWorkGraph.workItems.find((item) =>
      item.workItemKey === input.invocation.workItemKey)
    if (!publicItem || publicItem.jobType !== input.jobType) {
      throw new Error('Track All deterministic driver received work outside the approved public graph.')
    }
    const atomicItems = input.execution.pluginWorkGraph.atomicWorkItems.filter((item) =>
      item.parentJobType === input.jobType)
    if (atomicItems.length === 0) {
      throw new Error(`Track All public job ${input.jobType} has no approved atomic work.`)
    }
    for (const item of atomicItems) await this.#executeAtomic(item.workItemKey, input.execution)
    const outputArtifact = await this.projectPublicOutput({
      jobType: input.jobType,
      execution: input.execution,
    })
    const closureKeys = atomicClosureKeys(
      atomicItems.map((item) => item.workItemKey),
      input.execution.pluginWorkGraph.atomicWorkItems,
    )
    const results = input.execution.pluginWorkGraph.atomicWorkItems
      .filter((item) => closureKeys.has(item.workItemKey) &&
        !this.#reportedAtomicKeys.has(item.workItemKey))
      .map((item) => this.#atomicResults.get(item.workItemKey)!)
    if (results.length === 0) {
      throw new Error('Track All canonical public work produced no new atomic execution evidence.')
    }
    for (const result of results) this.#reportedAtomicKeys.add(result.workItemKey)
    return {
      outputArtifact: { artifactType: input.definition.output, value: outputArtifact },
      atomicResults: results,
      actualToolOperationIds: [...new Set(results.flatMap((result) =>
        this.#atomicToolOperations.get(result.workItemKey) ?? []))],
      executionCounts: aggregateTrackAllCanonicalPrivateExecutionCounts(
        results.map((result) => result.executionCounts),
      ),
    }
  }

  async #executeAtomic(
    workItemKey: string,
    execution: TrackAllCanonicalPrivateExecutionPackage,
  ): Promise<TrackAllCanonicalPrivateAtomicResult> {
    const replay = this.#atomicResults.get(workItemKey)
    if (replay) return replay
    const item = execution.pluginWorkGraph.atomicWorkItems.find((candidate) =>
      candidate.workItemKey === workItemKey)
    if (!item) throw new Error('Track All atomic executor received unapproved work.')
    if (item.createsGpuWork || item.operationId === 'tool.sam3_1.track_masklets.v2') {
      throw new Error('Track All deterministic executor rejected SAM/GPU atomic work.')
    }
    const dependencies: TrackAllCanonicalPrivateAtomicResult[] = []
    for (const dependencyKey of item.dependencyKeys) {
      dependencies.push(await this.#executeAtomic(dependencyKey, execution))
    }
    const inputArtifactRefs = this.#atomicInputs(
      item.inputArtifactTypes,
      dependencies,
      execution,
    )
    const startedAt = this.#now()
    const stage = await this.executeAtomicStage({
      item,
      execution,
      inputArtifactRefs,
      dependencyResults: dependencies,
    })
    const outputArtifactRef = await this.#artifactStore.putJson({
      artifactType: item.outputArtifactType,
      value: stage.value,
      ...scope(execution),
    })
    const completedAt = this.#now()
    const operationEvidenceHash = hashSkillValue({
      schemaVersion: 'track_all_canonical_private_atomic_operation_evidence_v1',
      approvedWorkGraphHash: execution.approvedWorkGraph.approvedWorkGraphHash,
      pluginWorkGraphHash: execution.pluginWorkGraph.artifactHash,
      workItemHash: item.workItemHash,
      operationId: item.operationId,
      inputArtifactHashes: inputArtifactRefs.map((reference) => reference.sha256),
      dependencyOutputHashes: dependencies.map((result) => result.outputArtifactRef.sha256),
      outputArtifactHash: outputArtifactRef.sha256,
      stageEvidenceHashes: stage.evidenceHashes,
      actualToolOperationIds: stage.actualToolOperationIds,
      executionCounts: stage.executionCounts,
      outsideAuthorizedRangeModified: false,
    })
    const result: TrackAllCanonicalPrivateAtomicResult = {
      workItemKey: item.workItemKey,
      workItemHash: item.workItemHash,
      stageId: item.stageId,
      parentJobType: item.parentJobType,
      operationId: item.operationId,
      workerClass: item.workerClass,
      inputArtifactRefs,
      dependencyOutputRefs: dependencies.map((value) => value.outputArtifactRef),
      outputArtifactRef,
      evidenceHashes: [...new Set([...stage.evidenceHashes, operationEvidenceHash])],
      executionCounts: stage.executionCounts,
      status: 'succeeded',
      startedAt,
      completedAt,
      outsideAuthorizedRangeModified: false,
    }
    this.#atomicResults.set(item.workItemKey, result)
    this.#atomicToolOperations.set(item.workItemKey, stage.actualToolOperationIds)
    return result
  }

  async #executeStage(
    stageId: string,
    execution: TrackAllCanonicalPrivateExecutionPackage,
  ): Promise<StageExecution> {
    switch (stageId) {
      case 'validate_assignment':
        return this.#assignmentContext(execution)
      case 'validate_target_authority':
        return this.#targetQa(execution)
      case 'no_action':
      case 'project_track_all_result':
        return this.#projectResult(execution)
      case 'inspect_source': {
        const analysis = await this.#ensureSourceTruth(execution)
        return {
          value: await this.#readInitial('source_frame_authority_v1', execution),
          evidenceHashes: analysis.evidenceHashes,
          actualToolOperationIds: ['tool.ffprobe.inspect_approved_media.v1'],
        }
      }
      case 'detect_shot_boundaries': {
        const analysis = await this.#ensureSceneContext(execution)
        return {
          value: analysis.value,
          evidenceHashes: analysis.evidenceHashes,
          actualToolOperationIds: ['tool.pyscenedetect.detect_scene_boundaries.v1'],
        }
      }
      case 'estimate_camera_motion':
      case 'build_camera_motion_graph': {
        const analysis = await this.#ensureCameraMotion(execution)
        return {
          value: analysis.value,
          evidenceHashes: analysis.evidenceHashes,
          actualToolOperationIds: ['tool.opencv.analyze_approved_visual_artifacts.v1'],
        }
      }
      case 'choose_initialization_frame':
      case 'prepare_tracking_chunks':
      case 'allocate_multiplex_buckets':
        return {
          value: execution.plan,
          evidenceHashes: [execution.plan.planHash, execution.plan.preflightObservationHash!],
          actualToolOperationIds: [],
        }
      case 'extract_planar_features':
      case 'calculate_homography':
      case 'build_planar_track_graph': {
        const planar = await this.#ensurePlanar(execution)
        return {
          value: planar,
          evidenceHashes: [planar.artifactHash, ...this.#planarEvidenceHashes],
          actualToolOperationIds: ['tool.opencv.analyze_approved_visual_artifacts.v1'],
        }
      }
      case 'validate_reprojection':
        return this.#planarQa(execution)
      case 'validate_existing_track_graph':
      case 'run_repair_qa':
        return this.#temporalQaStage(execution)
      case 'direct_track_repair':
        return this.#repairStage(execution)
      case 'prepare_composition_layer':
        return this.#handoffStage(execution)
      case 'build_redaction_plan': {
        const privacy = await this.#ensurePrivacyCompilation(execution)
        return {
          value: privacy.projectedPlan,
          evidenceHashes: [privacy.compiled.compilationEvidenceHash, privacy.projectedPlan.artifactHash],
          actualToolOperationIds: [],
        }
      }
      case 'compile_redaction_effect': {
        const privacy = await this.#ensurePrivacyCompilation(execution)
        return {
          value: privacy.projectedPlan,
          evidenceHashes: [privacy.compiled.compilationEvidenceHash, privacy.projectedPlan.artifactHash],
          actualToolOperationIds: [],
        }
      }
      case 'render_private_redaction_preview': {
        const privacy = await this.#ensurePrivacyRender(execution)
        return {
          value: (await this.#ensurePrivacyCompilation(execution)).projectedPlan,
          evidenceHashes: privacy.evidenceHashes,
          actualToolOperationIds: ['tool.ffmpeg.execute_approved_media_recipe.v1'],
        }
      }
      case 'project_redaction_result': {
        const privacy = await this.#ensurePrivacy(execution)
        return {
          value: privacy.projectedResult,
          evidenceHashes: privacy.evidenceHashes,
          actualToolOperationIds: [],
        }
      }
      case 'run_flattened_privacy_qa': {
        const privacy = await this.#ensurePrivacy(execution)
        return {
          value: privacy.projectedQa,
          evidenceHashes: privacy.evidenceHashes,
          actualToolOperationIds: [
            'tool.ffmpeg.execute_approved_media_recipe.v1',
            'tool.opencv.inspect_track_all_privacy_preview.v1',
          ],
        }
      }
      case 'compile_focus_treatment': {
        const focus = await this.#ensureFocusCompilation(execution)
        return {
          value: focus.projectedPlan,
          evidenceHashes: [focus.projectedPlan.artifactHash, focus.compiled.trajectoryHash],
          actualToolOperationIds: [],
        }
      }
      case 'render_focus_preview': {
        const rendered = await this.#ensureFocusRender(execution)
        return {
          value: (await this.#ensureFocus(execution)).projectedResult,
          evidenceHashes: rendered.evidenceHashes,
          actualToolOperationIds: ['tool.remotion.render_approved_composition.v1'],
        }
      }
      case 'run_focus_integration_qa': {
        const focus = await this.#ensureFocus(execution)
        return { value: focus.projectedQa, evidenceHashes: focus.evidenceHashes, actualToolOperationIds: [] }
      }
      case 'project_focus_result': {
        const focus = await this.#ensureFocus(execution)
        return { value: focus.projectedResult, evidenceHashes: focus.evidenceHashes, actualToolOperationIds: [] }
      }
      case 'calculate_reframe_trajectory': {
        const reframe = await this.#ensureReframeCompilation(execution)
        return {
          value: reframe.projectedPlan,
          evidenceHashes: [reframe.projectedPlan.artifactHash, reframe.compiled.trajectoryHash],
          actualToolOperationIds: [],
        }
      }
      case 'validate_crop_and_safe_zones': {
        const reframe = await this.#ensureReframeCompilation(execution)
        return this.#reframePlanQa(reframe.projectedPlan, execution)
      }
      case 'run_reframe_integration_qa': {
        const reframe = await this.#ensureReframe(execution)
        return { value: reframe.projectedQa, evidenceHashes: reframe.evidenceHashes, actualToolOperationIds: [] }
      }
      case 'render_reframe_preview': {
        const rendered = await this.#ensureReframeRender(execution)
        return {
          value: (await this.#ensureReframe(execution)).projectedResult,
          evidenceHashes: rendered.evidenceHashes,
          actualToolOperationIds: ['tool.remotion.render_approved_composition.v1'],
        }
      }
      case 'project_reframe_result': {
        const reframe = await this.#ensureReframe(execution)
        return { value: reframe.projectedResult, evidenceHashes: reframe.evidenceHashes, actualToolOperationIds: [] }
      }
      default:
        throw new Error(`Track All canonical-private deterministic stage is unimplemented: ${stageId}.`)
    }
  }

  async #publicOutput(
    jobType: TrackAllPublicJobType,
    execution: TrackAllCanonicalPrivateExecutionPackage,
  ): Promise<unknown> {
    switch (jobType) {
      case 'track_all.plan_assignment': return execution.plan
      case 'track_all.produce_scene_geometry_graph':
        return (await this.#ensureCameraMotion(execution)).value
      case 'track_all.track_planar_region': return this.#ensurePlanar(execution)
      case 'track_all.repair_track': return this.#ensureRepair(execution)
      case 'track_all.apply_privacy_redaction':
        return (await this.#ensurePrivacy(execution)).projectedResult
      case 'track_all.apply_tracked_focus':
        return (await this.#ensureFocus(execution)).projectedResult
      case 'track_all.prepare_tracked_reframe':
        return (await this.#ensureReframe(execution)).projectedResult
      case 'track_all.validate_track_graph': return this.#ensureTemporalQa(execution)
      case 'track_all.prepare_composition_layer': return this.#ensureHandoff(execution)
      case 'track_all.integrate_preview':
        if (execution.plan.decision === 'apply_privacy_redaction') {
          return projectIntegrationFromPrivacy(await this.#ensurePrivacy(execution), execution)
        }
        if (execution.plan.decision === 'apply_tracked_focus') {
          return (await this.#ensureFocus(execution)).projectedQa
        }
        if (execution.plan.decision === 'prepare_tracked_reframe') {
          return (await this.#ensureReframe(execution)).projectedQa
        }
        throw new Error('Track All preview integration has no approved treatment result.')
      case 'track_all.no_action':
      case 'track_all.project_result': return this.#resultReceipt(execution)
      case 'track_all.produce_selected_target_graph':
      case 'track_all.produce_concept_instance_graph':
        throw new Error('Track All deterministic runtime cannot execute a SAM-backed public job.')
    }
  }

  #assignmentContext(execution: TrackAllCanonicalPrivateExecutionPackage): StageExecution {
    const assignmentRef = oneRef('track_all_assignment_v1', execution)
    const targetRef = oneRef('track_all_target_specification_v1', execution)
    const sourceInventoryRef = oneRef('source_inventory_v1', execution)
    const timingRef = oneRef('master_timing_plan_v1', execution)
    const sourceFrameAuthorityRef = oneRef('source_frame_authority_v1', execution)
    const ownershipRef = oneRef('visual_ownership_manifest_v1', execution)
    const sceneContextRef = oneRef('track_all_scene_context_v1', execution)
    const core = {
      schemaVersion: 'track_all_context_manifest_v1' as const,
      ...lineage(execution),
      assignmentRef,
      targetRef,
      sourceInventoryRef,
      timingRef,
      sourceFrameAuthorityRef,
      ownershipRef,
      sceneContextRef,
      readOnlyContext: true as const,
    }
    const value = trackAllContextManifestSchema.parse({ ...core, artifactHash: hashSkillValue(core) })
    return { value, evidenceHashes: [assignmentRef.sha256, targetRef.sha256], actualToolOperationIds: [] }
  }

  async #targetQa(execution: TrackAllCanonicalPrivateExecutionPackage): Promise<StageExecution> {
    const target = trackAllTargetSpecificationSchema.parse(
      await this.#readInitial('track_all_target_specification_v1', execution),
    )
    const correct = target.assignmentId === execution.assignment.assignmentId &&
      target.expectedMaximumCount >= target.expectedMinimumCount &&
      target.groundingEvidence.length > 0
    const finding = createSkillQaFinding({
      qaKey: 'track_all.output.target_authority',
      validatorVersion: 'track_all_canonical_target_authority_validator_v1',
      disposition: correct ? 'pass' : 'blocking',
      summary: correct
        ? 'The exact approved target authority is bounded and independently validated.'
        : 'The target authority is stale, ambiguous, or ungrounded.',
      evidenceHashes: [target.targetHash, execution.assignment.assignmentHash],
      observations: {
        expectedMinimumCount: target.expectedMinimumCount,
        expectedMaximumCount: target.expectedMaximumCount,
        groundingEvidenceCount: target.groundingEvidence.length,
      },
    })
    if (!correct) throw new Error('Track All canonical target authority failed closed.')
    const core = {
      schemaVersion: 'track_all_target_qa_report_v1' as const,
      ...lineage(execution),
      findings: [finding],
      disposition: 'pass' as const,
      correctTarget: true,
      exclusionsPreserved: true,
      expectedCountRespected: true,
    }
    const value = trackAllTargetQaReportSchema.parse({ ...core, artifactHash: hashSkillValue(core) })
    return { value, evidenceHashes: [value.artifactHash], actualToolOperationIds: [] }
  }

  async #ensureSourceTruth(
    execution: TrackAllCanonicalPrivateExecutionPackage,
  ): Promise<SourceTruthExecution> {
    if (this.#sourceTruth) return this.#sourceTruth
    const source = this.#requireSource(execution)
    const sourceAuthority = sourceFrameAuthoritySchema.parse(
      await this.#readInitial('source_frame_authority_v1', execution),
    )
    const ffprobe = await this.#runtimes.media.execute(buildTrackAllFfprobeRequest(source.bytes))
    const sourceTruth = normalizeTrackAllFfprobeSourceTruth({
      sourceSha256: source.sourceSha256,
      document: ffprobe.resultJson.document,
    })
    if (
      sourceTruth.width !== sourceAuthority.width ||
      sourceTruth.height !== sourceAuthority.height ||
      sourceTruth.fps !== sourceAuthority.range.fps ||
      sourceTruth.frameCount < sourceAuthority.range.endFrameExclusive
    ) throw new Error('Track All FFprobe source truth differs from approved frame authority.')
    this.#sourceTruth = {
      value: sourceTruth,
      evidenceHashes: [
        ffprobe.attestation.attestationHash,
        sourceTruth.technicalTruthHash,
      ],
    }
    return this.#sourceTruth
  }

  async #ensureSceneContext(
    execution: TrackAllCanonicalPrivateExecutionPackage,
  ): Promise<SceneContextExecution> {
    if (this.#sceneContext) return this.#sceneContext
    const source = this.#requireSource(execution)
    const scene = await this.#runtimes.python.execute(buildTrackAllSceneDetectionRequest({
      sourceBytes: source.bytes,
      contentThreshold: 18,
      minimumSceneFrames: 4,
      downscaleFactor: 1,
    }))
    const shotEvidence = normalizeTrackAllShotBoundaryEvidence({
      sourceSha256: source.sourceSha256,
      authorizedRange: execution.assignment.authorizedRange,
      document: scene.resultJson.document,
    })
    const sceneContext = createTrackAllSceneContext({
      schemaVersion: 'track_all_scene_context_v1',
      assignmentId: execution.assignment.assignmentId,
      analysisContextRange: execution.assignment.authorizedRange,
      authorizedWriteRange: execution.assignment.authorizedRange,
      wholeVideoEvidenceReadOnly: true,
      sceneIds: shotEvidence.shots.map((shot) => shot.shotId),
      shotBoundaries: shotEvidence.shots.slice(1).map((shot) => shot.startFrameInclusive),
    })
    this.#sceneContext = {
      value: sceneContext,
      evidenceHashes: [
        scene.attestation.attestationHash,
        shotEvidence.evidenceHash,
        sceneContext.contextHash,
      ],
    }
    return this.#sceneContext
  }

  async #ensureCameraMotion(
    execution: TrackAllCanonicalPrivateExecutionPackage,
  ): Promise<CameraMotionExecution> {
    if (this.#cameraMotion) return this.#cameraMotion
    const source = this.#requireSource(execution)
    const camera = await this.#runtimes.python.execute(buildTrackAllOpenCvGeometryRequest({
      sourceBytes: source.bytes,
      profile: 'track_all_camera_motion_v1',
      range: execution.assignment.authorizedRange,
      initializationFrameIndex: execution.plan.initializationFrame ??
        execution.assignment.authorizedRange.startFrameInclusive,
      maximumFeatures: 512,
      ransacReprojectionThreshold: 3,
    }))
    const cameraMotion = createTrackAllCameraMotionGraph({
      document: camera.resultJson.document,
      lineage: lineage(execution),
    })
    this.#cameraMotion = {
      value: cameraMotion,
      evidenceHashes: [
        camera.attestation.attestationHash,
        cameraMotion.artifactHash,
      ],
    }
    return this.#cameraMotion
  }

  async #ensurePlanar(execution: TrackAllCanonicalPrivateExecutionPackage) {
    if (this.#planar) return this.#planar
    const source = this.#requireSource(execution)
    await this.#ensureCameraMotion(execution)
    const target = trackAllTargetSpecificationSchema.parse(
      await this.#readInitial('track_all_target_specification_v1', execution),
    )
    const boxEvidence = target.groundingEvidence.find((evidence) =>
      evidence.kind === 'bounding_box')
    const box = boxEvidence && 'box' in boxEvidence
      ? boxEvidence.box
      : { x: 0.15, y: 0.15, width: 0.7, height: 0.7 }
    const corners = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x + box.width, y: box.y + box.height },
      { x: box.x, y: box.y + box.height },
    ] as const
    const planar = await this.#runtimes.python.execute(buildTrackAllOpenCvGeometryRequest({
      sourceBytes: source.bytes,
      profile: 'track_all_planar_homography_v1',
      range: execution.assignment.authorizedRange,
      initializationFrameIndex: execution.plan.initializationFrame ??
        execution.assignment.authorizedRange.startFrameInclusive,
      maximumFeatures: 512,
      ransacReprojectionThreshold: 3,
      planarCornersNormalized: corners,
    }))
    this.#planar = createTrackAllPlanarTrackGraph({
      document: planar.resultJson.document,
      lineage: lineage(execution),
      surfaceId: target.targetId,
      surfaceClass: planarSurfaceClass(target.semanticClass),
      coordinateInterpretation: target.targetType === 'camera_relative_region'
        ? 'camera_relative'
        : 'world_relative',
    })
    this.#planarEvidenceHashes = [planar.attestation.attestationHash, this.#planar.artifactHash]
    return this.#planar
  }

  async #planarQa(execution: TrackAllCanonicalPrivateExecutionPackage): Promise<StageExecution> {
    const planar = await this.#ensurePlanar(execution)
    const maximumObservedError = Math.max(...planar.frames.map((frame) => frame.reprojectionError))
    const minimumConfidence = Math.min(...planar.frames.map((frame) => frame.confidence))
    const reliableFrames = planar.frames.filter((frame) => frame.confidence >= 0.25)
    const reliableFrameRatio = reliableFrames.length / planar.frames.length
    const maximumError = reliableFrames.length > 0
      ? Math.max(...reliableFrames.map((frame) => frame.reprojectionError))
      : Number.POSITIVE_INFINITY
    const passed = Number.isFinite(maximumError) && maximumError <= 5 && reliableFrameRatio >= 0.75
    const finding = createSkillQaFinding({
      qaKey: 'track_all.output.planar_reprojection',
      validatorVersion: 'track_all_canonical_planar_reprojection_validator_v2',
      disposition: passed ? 'pass' : 'blocking',
      summary: passed
        ? 'Reliable OpenCV homography frames remained within the fixed reprojection bound.'
        : 'Reliable planar reprojection or reliable-frame coverage exceeded the qualified bound.',
      evidenceHashes: [...new Set([planar.artifactHash, ...this.#planarEvidenceHashes])],
      observations: {
        maximumError,
        maximumObservedError,
        minimumConfidence,
        reliableFrameRatio,
        reliableFrameCount: reliableFrames.length,
        frameCount: planar.frames.length,
      },
    })
    if (!passed) throw new Error(
      `Track All canonical planar reprojection QA failed closed ` +
      `(maximumError=${maximumError}, reliableFrameRatio=${reliableFrameRatio}).`,
    )
    const core = {
      schemaVersion: 'track_all_integration_qa_report_v1' as const,
      ...lineage(execution),
      findings: [finding],
      disposition: 'pass' as const,
      outsideAuthorizedRangeModified: false,
      sourceAndTimingExact: true,
      privateOutput: true,
      publicUrlPresent: false,
      layerOrderValid: true,
    }
    const value = trackAllIntegrationQaReportSchema.parse({
      ...core,
      artifactHash: hashSkillValue(core),
    })
    return { value, evidenceHashes: [value.artifactHash], actualToolOperationIds: [] }
  }

  async #ensureTemporalQa(execution: TrackAllCanonicalPrivateExecutionPackage) {
    if (this.#temporalQa) return this.#temporalQa
    const graph = await this.#existingGraph(execution)
    const missingSpanCount = graph.tracks.reduce((count, track) => {
      const covered = track.visibilitySpans.reduce((total, span) =>
        total + span.endFrameExclusive - span.startFrameInclusive, 0)
      return count + (covered < track.endFrameExclusive - track.startFrameInclusive ? 1 : 0)
    }, 0)
    const jumpCount = graph.tracks.reduce((count, track) =>
      count + track.identitySwitchWarnings.length, 0)
    const shotResetsValid = graph.shots.every((shot) => shot.sceneCutResetsIdentity)
    const passed = missingSpanCount === 0 && jumpCount === 0 && shotResetsValid
    const finding = createSkillQaFinding({
      qaKey: 'track_all.output.existing_graph_temporal',
      validatorVersion: 'track_all_canonical_existing_graph_temporal_validator_v1',
      disposition: passed ? 'pass' : 'needs_review',
      summary: passed
        ? 'The exact existing Track Graph has complete spans, no silent identity switch, and valid shot resets.'
        : 'The existing Track Graph contains temporal uncertainty requiring review.',
      evidenceHashes: [graph.graphHash, ...graph.finalQaRefs.map((ref) => ref.sha256)],
      observations: { missingSpanCount, jumpCount, shotResetsValid },
    })
    const core = {
      schemaVersion: 'track_all_temporal_qa_report_v1' as const,
      ...lineage(execution),
      findings: [finding],
      disposition: passed ? 'pass' as const : 'needs_review' as const,
      missingSpanCount,
      jumpCount,
      shotResetsValid,
    }
    this.#temporalQa = trackAllTemporalQaReportSchema.parse({
      ...core,
      artifactHash: hashSkillValue(core),
    })
    return this.#temporalQa
  }

  async #temporalQaStage(execution: TrackAllCanonicalPrivateExecutionPackage): Promise<StageExecution> {
    const value = await this.#ensureTemporalQa(execution)
    return { value, evidenceHashes: [value.artifactHash], actualToolOperationIds: [] }
  }

  async #ensureRepair(execution: TrackAllCanonicalPrivateExecutionPackage) {
    if (this.#repair) return this.#repair
    const graph = await this.#existingGraph(execution)
    const prior = priorTrackRepairEvidenceSchema.parse(
      await this.#readInitial('prior_track_repair_evidence_v1', execution),
    )
    const graphRef = oneRef('track_graph_v2', execution)
    if (
      prior.trackGraphRef.sha256 !== graphRef.sha256 ||
      prior.repairCount >= 2 ||
      !graph.tracks.some((track) => track.trackId === prior.trackId)
    ) throw new Error('Track All canonical deterministic repair lacks exact bounded prior evidence.')
    const action = graph.tracks.some((track) => track.identitySwitchWarnings.length > 0)
      ? 'reassign_identity' as const
      : 'increase_overlap' as const
    const core = {
      schemaVersion: 'track_all_repair_receipt_v1' as const,
      ...lineage(execution),
      priorTrackGraphRef: graphRef,
      repairIndex: prior.repairCount + 1,
      action,
      repairedRange: execution.assignment.authorizedRange,
      evidenceHashes: [prior.evidenceHash, graph.graphHash, hashSkillValue({ action })],
      result: 'accepted' as const,
    }
    this.#repair = trackAllRepairReceiptSchema.parse({
      ...core,
      artifactHash: hashSkillValue(core),
    })
    return this.#repair
  }

  async #repairStage(execution: TrackAllCanonicalPrivateExecutionPackage): Promise<StageExecution> {
    const value = await this.#ensureRepair(execution)
    return { value, evidenceHashes: [value.artifactHash], actualToolOperationIds: [] }
  }

  async #ensureHandoff(execution: TrackAllCanonicalPrivateExecutionPackage) {
    if (this.#handoff) return this.#handoff
    const graph = await this.#existingGraph(execution)
    const boxSequences = await this.#graphArtifacts(graph, 'track_box_sequence_v1', trackBoxSequenceSchema)
    const compiled = compileTrackAllCrossSkillHandoffs({
      trackGraph: graph,
      boxSequences,
      maskSequences: [],
      anchorGraphs: [],
      planarTrackGraphs: [],
    })
    const original = compiled.b_roll
    const priorProjection = projectTrackGraphV1(graph)
    const trackGraphV1 = trackGraphV1Schema.parse({
      ...priorProjection,
      assignmentId: execution.assignment.assignmentId,
      assignmentHash: execution.assignment.assignmentHash,
      authorizedRange: execution.assignment.authorizedRange,
      authorizedRangeHash: hashSkillValue(execution.assignment.authorizedRange),
      fps: execution.assignment.authorizedRange.fps,
    })
    const trackGraphV1Ref = await this.#artifactStore.putJson({
      artifactType: 'track_graph_v1',
      value: trackGraphV1,
      ...scope(execution),
    })
    const core = {
      ...withoutArtifactHash(original),
      ...lineage(execution),
      trackGraphV1Ref,
      trackGraphV2Ref: oneRef('track_graph_v2', execution),
    }
    this.#handoff = trackAllCrossSkillHandoffSchema.parse({
      ...core,
      artifactHash: hashSkillValue(core),
    })
    return this.#handoff
  }

  async #handoffStage(execution: TrackAllCanonicalPrivateExecutionPackage): Promise<StageExecution> {
    const value = await this.#ensureHandoff(execution)
    return { value, evidenceHashes: [value.artifactHash], actualToolOperationIds: [] }
  }

  async #ensurePrivacyCompilation(execution: TrackAllCanonicalPrivateExecutionPackage) {
    if (this.#privacyCompilation) return this.#privacyCompilation
    const graph = await this.#existingGraph(execution)
    const sourceTruth = await this.#ensureSourceTruth(execution)
    const policy = privacyPolicySnapshotSchema.parse(
      await this.#readInitial('privacy_policy_snapshot_v1', execution),
    )
    const boxSequences = await this.#graphArtifacts(graph, 'track_box_sequence_v1', trackBoxSequenceSchema)
    const targetTrackIds = graph.tracks.map((track) => track.trackId)
    const treatment = policy.allowedTreatments.includes('gaussian_blur')
      ? 'gaussian_blur' as const
      : policy.allowedTreatments[0]!
    const compiled = compileTrackAllPrivacyRedaction({
      trackGraph: graph,
      boxSequences,
      privacyPolicy: policy,
      sourceTruth: sourceTruth.value,
      targetTrackIds,
      treatment,
      reflectionRegions: [],
    })
    const projectedPlan = relineageArtifact(
      compiled.plan,
      execution,
      trackedRedactionPlanSchema,
      { trackGraphRef: oneRef('track_graph_v2', execution) },
    )
    this.#privacyCompilation = { compiled, projectedPlan }
    return this.#privacyCompilation
  }

  async #ensurePrivacyRender(execution: TrackAllCanonicalPrivateExecutionPackage) {
    if (this.#privacyRender) return this.#privacyRender
    const source = this.#requireSource(execution)
    const { compiled } = await this.#ensurePrivacyCompilation(execution)
    const runtimeResult = await this.#runtimes.media.execute(
      buildTrackAllPrivacyRedactionExecutionRequest({ compiled, sourceBytes: source.bytes }),
    )
    if (!('bytes' in runtimeResult.resultArtifact) ||
      runtimeResult.resultArtifact.mimeType !== 'video/x-matroska') {
      throw new Error('Track All privacy runtime returned a non-private media artifact.')
    }
    const privateMediaRef = await this.#mediaSink.persist({
      artifactType: 'private_flattened_track_all_redaction_preview_v1',
      ...scope(execution),
      bytes: runtimeResult.resultArtifact.bytes,
      sha256: runtimeResult.resultArtifact.sha256,
      evidenceHash: runtimeResult.attestation.attestationHash,
    })
    this.#privacyRender = {
      privateMediaRef,
      outputBytes: runtimeResult.resultArtifact.bytes,
      outputSha256: runtimeResult.resultArtifact.sha256,
      evidenceHashes: [
        runtimeResult.attestation.attestationHash,
        runtimeResult.evidence.resourceObservation.observationHash,
        privateMediaRef.sha256,
      ],
    }
    return this.#privacyRender
  }

  async #ensurePrivacyInspection(execution: TrackAllCanonicalPrivateExecutionPackage) {
    if (this.#privacyInspection) return this.#privacyInspection
    const source = this.#requireSource(execution)
    const { compiled } = await this.#ensurePrivacyCompilation(execution)
    const rendered = await this.#ensurePrivacyRender(execution)
    const sourceFrames = await decodeRgb24Range({
      bytes: source.bytes,
      range: execution.assignment.authorizedRange,
    })
    const outputFrames = await decodeRgb24Range({
      bytes: rendered.outputBytes,
      range: {
        startFrameInclusive: 0,
        endFrameExclusive:
          execution.assignment.authorizedRange.endFrameExclusive -
          execution.assignment.authorizedRange.startFrameInclusive,
        fps: execution.assignment.authorizedRange.fps,
      },
    })
    const inspection = inspectTrackAllPrivacyPreview({
      compiled,
      sourceFramesRgb24: sourceFrames,
      outputFramesRgb24: outputFrames,
      sourceSha256: source.sourceSha256,
      outputSha256: rendered.outputSha256,
    })
    this.#privacyInspection = {
      value: inspection,
      evidenceHashes: [inspection.inspectionHash, ...rendered.evidenceHashes],
    }
    return this.#privacyInspection
  }

  async #ensurePrivacy(execution: TrackAllCanonicalPrivateExecutionPackage): Promise<PrivacyExecution> {
    if (this.#privacy) return this.#privacy
    const { compiled, projectedPlan } = await this.#ensurePrivacyCompilation(execution)
    const rendered = await this.#ensurePrivacyRender(execution)
    const inspected = await this.#ensurePrivacyInspection(execution)
    const inspection = inspected.value
    const qa = deriveTrackAllPrivacyQaReport({
      compiled,
      inspection,
      flattenedPreviewRef: rendered.privateMediaRef,
      reflectionInspectionRequired: false,
    })
    const result = finalizeTrackAllPrivacyRedaction({
      compiled,
      privateMediaRef: rendered.privateMediaRef,
      privacyQaReport: qa,
    })
    const projectedQa = relineageQa(qa, execution, trackAllPrivacyQaReportSchema)
    const resultCore = {
      ...withoutArtifactHash(result),
      ...lineage(execution),
      trackGraphRef: oneRef('track_graph_v2', execution),
      planRef: localRef('tracked_redaction_plan_v1', projectedPlan, execution),
      privacyQaRef: localRef('track_all_privacy_qa_report_v1', projectedQa, execution),
    }
    const projectedResult = trackedRedactionResultSchema.parse({
      ...resultCore,
      artifactHash: hashSkillValue(resultCore),
    })
    this.#privacy = {
      compiled,
      projectedPlan,
      qa,
      result,
      projectedQa,
      projectedResult,
      privateMediaRef: rendered.privateMediaRef,
      evidenceHashes: [
        ...rendered.evidenceHashes,
        ...inspected.evidenceHashes,
        projectedPlan.artifactHash,
        qa.artifactHash,
        projectedQa.artifactHash,
        projectedResult.artifactHash,
      ],
    }
    return this.#privacy
  }

  async #ensureFocusCompilation(execution: TrackAllCanonicalPrivateExecutionPackage) {
    if (this.#focusCompilation) return this.#focusCompilation
    const graph = await this.#existingGraph(execution)
    const sourceAuthority = sourceFrameAuthoritySchema.parse(
      await this.#readInitial('source_frame_authority_v1', execution),
    )
    const boxSequences = await this.#graphArtifacts(graph, 'track_box_sequence_v1', trackBoxSequenceSchema)
    const zones = await this.#zonesForGraph(graph, execution)
    const targetTrackIds = graph.tracks.map((track) => track.trackId).slice(0, 16)
    const compiled = compileTrackAllFocus({
      trackGraph: graph,
      boxSequences,
      sourceWidth: sourceAuthority.width,
      sourceHeight: sourceAuthority.height,
      targetTrackIds,
      captionReservedZones: zones,
      treatment: 'tracked_spotlight',
      handoffs: [{ trackId: targetTrackIds[0]!, range: graph.authorizedRange }],
    })
    const projectedPlan = relineageArtifact(
      compiled.plan,
      execution,
      trackedFocusPlanSchema,
      { trackGraphRef: oneRef('track_graph_v2', execution) },
    )
    this.#focusCompilation = { compiled, projectedPlan }
    return this.#focusCompilation
  }

  async #ensureFocusRender(execution: TrackAllCanonicalPrivateExecutionPackage) {
    if (this.#focusRender) return this.#focusRender
    const source = this.#requireSource(execution)
    const { compiled } = await this.#ensureFocusCompilation(execution)
    const render = await this.#runtimes.remotion.execute(buildTrackAllTreatmentRemotionRequest({
      compiled,
      source: { mimeType: source.mimeType, bytes: source.bytes, sha256: source.sourceSha256 },
    }))
    const privateMediaRef = await this.#mediaSink.persist({
      artifactType: 'track_all_private_focus_preview_v1',
      ...scope(execution),
      bytes: render.artifact.bytes,
      sha256: render.artifact.sha256,
      evidenceHash: render.attestation.attestationHash,
    })
    this.#focusRender = {
      privateMediaRef,
      render,
      evidenceHashes: [
        render.attestation.attestationHash,
        render.evidence.resourceObservation.observationHash,
        privateMediaRef.sha256,
      ],
    }
    return this.#focusRender
  }

  async #ensureFocus(execution: TrackAllCanonicalPrivateExecutionPackage): Promise<FocusExecution> {
    if (this.#focus) return this.#focus
    const { compiled, projectedPlan } = await this.#ensureFocusCompilation(execution)
    const rendered = await this.#ensureFocusRender(execution)
    const qa = deriveTrackAllTreatmentIntegrationQa({
      compiled,
      renderResult: rendered.render,
      privatePreviewRef: rendered.privateMediaRef,
    })
    const result = finalizeTrackAllFocus({
      compiled,
      privatePreviewRef: rendered.privateMediaRef,
      integrationQa: qa,
    })
    const projectedQa = relineageQa(qa, execution, trackAllIntegrationQaReportSchema)
    const resultCore = {
      ...withoutArtifactHash(result),
      ...lineage(execution),
      trackGraphRef: oneRef('track_graph_v2', execution),
      planRef: localRef('tracked_focus_plan_v1', projectedPlan, execution),
      integrationQaRef: localRef('track_all_integration_qa_report_v1', projectedQa, execution),
    }
    const projectedResult = trackedFocusResultSchema.parse({
      ...resultCore,
      artifactHash: hashSkillValue(resultCore),
    })
    this.#focus = {
      compiled,
      projectedPlan,
      qa,
      result,
      projectedQa,
      projectedResult,
      privateMediaRef: rendered.privateMediaRef,
      evidenceHashes: [
        ...rendered.evidenceHashes,
        projectedPlan.artifactHash,
        qa.artifactHash,
        projectedQa.artifactHash,
        projectedResult.artifactHash,
      ],
    }
    return this.#focus
  }

  async #ensureReframeCompilation(execution: TrackAllCanonicalPrivateExecutionPackage) {
    if (this.#reframeCompilation) return this.#reframeCompilation
    const graph = await this.#existingGraph(execution)
    const sourceAuthority = sourceFrameAuthoritySchema.parse(
      await this.#readInitial('source_frame_authority_v1', execution),
    )
    const boxSequences = await this.#graphArtifacts(graph, 'track_box_sequence_v1', trackBoxSequenceSchema)
    const zones = await this.#zonesForGraph(graph, execution)
    const targetTrackIds = graph.tracks.map((track) => track.trackId).slice(0, 16)
    const compiled = compileTrackAllReframe({
      trackGraph: graph,
      boxSequences,
      sourceWidth: sourceAuthority.width,
      sourceHeight: sourceAuthority.height,
      targetTrackIds,
      captionReservedZones: zones,
      outputAspectRatio: '9:16',
      maximumZoom: 2,
      lowConfidenceBehavior: 'widen_crop',
    })
    const projectedPlan = relineageArtifact(
      compiled.plan,
      execution,
      trackedReframePlanSchema,
      { trackGraphRef: oneRef('track_graph_v2', execution) },
    )
    this.#reframeCompilation = { compiled, projectedPlan }
    return this.#reframeCompilation
  }

  async #ensureReframeRender(execution: TrackAllCanonicalPrivateExecutionPackage) {
    if (this.#reframeRender) return this.#reframeRender
    const source = this.#requireSource(execution)
    const { compiled } = await this.#ensureReframeCompilation(execution)
    const render = await this.#runtimes.remotion.execute(buildTrackAllTreatmentRemotionRequest({
      compiled,
      source: { mimeType: source.mimeType, bytes: source.bytes, sha256: source.sourceSha256 },
    }))
    const privateMediaRef = await this.#mediaSink.persist({
      artifactType: 'track_all_private_reframe_preview_v1',
      ...scope(execution),
      bytes: render.artifact.bytes,
      sha256: render.artifact.sha256,
      evidenceHash: render.attestation.attestationHash,
    })
    this.#reframeRender = {
      privateMediaRef,
      render,
      evidenceHashes: [
        render.attestation.attestationHash,
        render.evidence.resourceObservation.observationHash,
        privateMediaRef.sha256,
      ],
    }
    return this.#reframeRender
  }

  #reframePlanQa(
    plan: ReturnType<typeof trackedReframePlanSchema.parse>,
    execution: TrackAllCanonicalPrivateExecutionPackage,
  ): StageExecution {
    const range = execution.assignment.authorizedRange
    const outsideRange = plan.frames.some((frame) =>
      frame.frameIndex < range.startFrameInclusive || frame.frameIndex >= range.endFrameExclusive)
    const collisionCount = plan.frames.filter((frame) => frame.safeZoneCollision).length
    const passed = !outsideRange && collisionCount === 0 && plan.maximumZoom <= 2
    const finding = createSkillQaFinding({
      qaKey: 'track_all.integration.reframe_safe_zones',
      validatorVersion: 'track_all_canonical_reframe_safe_zone_validator_v1',
      disposition: passed ? 'pass' : 'blocking',
      summary: passed
        ? 'The content-derived reframe remains in range and clear of reserved caption zones.'
        : 'The reframe exceeds range, zoom, or reserved safe-zone authority.',
      evidenceHashes: [plan.artifactHash, execution.assignment.assignmentHash],
      observations: {
        outsideRange,
        collisionCount,
        maximumZoom: plan.maximumZoom,
        frameCount: plan.frames.length,
      },
    })
    if (!passed) throw new Error('Track All canonical reframe safe-zone QA failed closed.')
    const core = {
      schemaVersion: 'track_all_integration_qa_report_v1' as const,
      ...lineage(execution),
      findings: [finding],
      disposition: 'pass' as const,
      outsideAuthorizedRangeModified: false as const,
      sourceAndTimingExact: true as const,
      privateOutput: true as const,
      publicUrlPresent: false as const,
      layerOrderValid: true as const,
    }
    const value = trackAllIntegrationQaReportSchema.parse({
      ...core,
      artifactHash: hashSkillValue(core),
    })
    return { value, evidenceHashes: [value.artifactHash], actualToolOperationIds: [] }
  }

  async #ensureReframe(execution: TrackAllCanonicalPrivateExecutionPackage): Promise<ReframeExecution> {
    if (this.#reframe) return this.#reframe
    const { compiled, projectedPlan } = await this.#ensureReframeCompilation(execution)
    const rendered = await this.#ensureReframeRender(execution)
    const qa = deriveTrackAllTreatmentIntegrationQa({
      compiled,
      renderResult: rendered.render,
      privatePreviewRef: rendered.privateMediaRef,
    })
    const result = finalizeTrackAllReframe({ compiled, integrationQa: qa })
    const projectedQa = relineageQa(qa, execution, trackAllIntegrationQaReportSchema)
    const resultCore = {
      ...withoutArtifactHash(result),
      ...lineage(execution),
      trackGraphRef: oneRef('track_graph_v2', execution),
      planRef: localRef('tracked_reframe_plan_v1', projectedPlan, execution),
      integrationQaRef: localRef('track_all_integration_qa_report_v1', projectedQa, execution),
    }
    const projectedResult = trackedReframeResultSchema.parse({
      ...resultCore,
      artifactHash: hashSkillValue(resultCore),
    })
    this.#reframe = {
      compiled,
      projectedPlan,
      qa,
      result,
      projectedQa,
      projectedResult,
      privateMediaRef: rendered.privateMediaRef,
      evidenceHashes: [
        ...rendered.evidenceHashes,
        projectedPlan.artifactHash,
        qa.artifactHash,
        projectedQa.artifactHash,
        projectedResult.artifactHash,
      ],
    }
    return this.#reframe
  }

  async #projectResult(execution: TrackAllCanonicalPrivateExecutionPackage): Promise<StageExecution> {
    const value = this.#resultReceipt(execution)
    return { value, evidenceHashes: [value.receiptHash], actualToolOperationIds: [] }
  }

  #resultReceipt(execution: TrackAllCanonicalPrivateExecutionPackage) {
    const acceptedArtifactRefs = [...this.#atomicResults.values()]
      .map((result) => result.outputArtifactRef)
      .filter((reference) => reference.artifactType !== 'track_all_result_receipt_v1')
      .slice(0, 100)
    return trackAllResultReceiptSchema.parse(createTrackAllResultReceipt({
      schemaVersion: 'track_all_result_receipt_v1',
      resultId: `track-all-canonical-${execution.plan.planHash.slice(0, 20)}`,
      assignmentId: execution.assignment.assignmentId,
      assignmentHash: execution.assignment.assignmentHash,
      planHash: execution.plan.planHash,
      manifestRef: execution.assignment.manifestRef,
      decision: execution.plan.decision,
      authorizedRange: execution.assignment.authorizedRange,
      acceptedArtifactRefs,
      qaEvidenceHashes: [...new Set([...this.#atomicResults.values()].flatMap((result) =>
        result.evidenceHashes))].slice(0, 100),
      outsideAuthorizedRangeModified: false,
      anonymousIdentitiesOnly: true,
      privateArtifactsOnly: true,
      status: resultStatus(execution.plan.decision),
    }))
  }

  async #existingGraph(execution: TrackAllCanonicalPrivateExecutionPackage): Promise<TrackGraphV2> {
    return trackGraphV2Schema.parse(await this.#readInitial('track_graph_v2', execution))
  }

  async #zonesForGraph(
    graph: TrackGraphV2,
    execution: TrackAllCanonicalPrivateExecutionPackage,
  ) {
    const current = execution.initialArtifactRefs.find((reference) =>
      reference.artifactType === 'caption_reserved_zones_v1')
    const zones = current
      ? trackAllCaptionReservedZonesSchema.parse(await this.#artifactStore.readJson({
          reference: current,
          ...scope(execution),
        })).zones
      : []
    return createCaptionReservedZonesV1({
      schemaVersion: 'caption_reserved_zones_v1',
      ownerUserId: graph.ownerUserId,
      workspaceId: graph.workspaceId,
      projectId: graph.projectId,
      editSessionId: graph.editSessionId,
      assignmentId: graph.assignmentId,
      assignmentHash: graph.assignmentHash,
      manifestRef: graph.manifestRef,
      authorizedRange: graph.authorizedRange,
      zones: zones.map((zone) => ({ ...zone, frameRange: graph.authorizedRange })),
      readOnly: true,
    })
  }

  async #graphArtifacts<T>(
    graph: TrackGraphV2,
    artifactType: string,
    schema: { parse(value: unknown): T },
  ): Promise<T[]> {
    const refs = graph.tracks.flatMap((track) => {
      if (artifactType === 'track_box_sequence_v1') return [track.boxSequenceRef]
      return []
    })
    const unique = [...new Map(refs.map((reference) => [canonicalSkillJson(reference), reference])).values()]
    const values: T[] = []
    for (const reference of unique) {
      values.push(schema.parse(await this.#artifactStore.readJson({
        reference,
        ownerUserId: graph.ownerUserId,
        workspaceId: graph.workspaceId,
        projectId: graph.projectId,
      })))
    }
    return values
  }

  async #readInitial(
    artifactType: string,
    execution: TrackAllCanonicalPrivateExecutionPackage,
  ): Promise<unknown> {
    const reference = oneRef(artifactType, execution)
    return this.#artifactStore.readJson({ reference, ...scope(execution) })
  }

  #requireSource(execution: TrackAllCanonicalPrivateExecutionPackage) {
    const source = this.#source
    if (!source || source.sourceSha256 !== execution.pluginWorkGraph.sourceSha256) {
      throw new Error('Track All canonical deterministic route lacks exact approved source bytes.')
    }
    return source
  }

  #atomicInputs(
    artifactTypes: readonly string[],
    dependencies: readonly TrackAllCanonicalPrivateAtomicResult[],
    execution: TrackAllCanonicalPrivateExecutionPackage,
  ): EditSkillArtifactReference[] {
    return artifactTypes.map((artifactType) => {
      const dependency = [...dependencies].reverse().find((result) =>
        result.outputArtifactRef.artifactType === artifactType)
      if (dependency) return dependency.outputArtifactRef
      if (artifactType === 'track_all_plan_v1') return execution.publicPlan.payloadRef
      const initial = execution.initialArtifactRefs.filter((reference) =>
        reference.artifactType === artifactType)
      if (initial.length === 1) return initial[0]!
      const completed = [...this.#atomicResults.values()].reverse().find((result) =>
        result.outputArtifactRef.artifactType === artifactType)
      if (completed) return completed.outputArtifactRef
      throw new Error(`Track All atomic work lacks exact ${artifactType} input authority.`)
    })
  }
}

function scope(input: TrackAllCanonicalPrivateExecutionPackage) {
  const assignment = input.assignment
  return {
    ownerUserId: assignment.ownerUserId,
    workspaceId: assignment.workspaceId,
    projectId: assignment.projectId,
  }
}

function atomicClosureKeys(
  rootKeys: readonly string[],
  items: TrackAllCanonicalPrivateExecutionPackage['pluginWorkGraph']['atomicWorkItems'],
): ReadonlySet<string> {
  const byKey = new Map(items.map((item) => [item.workItemKey, item]))
  const closure = new Set<string>()
  const visit = (key: string): void => {
    if (closure.has(key)) return
    const item = byKey.get(key)
    if (!item) throw new Error(`Track All atomic closure references unknown work ${key}.`)
    for (const dependencyKey of item.dependencyKeys) visit(dependencyKey)
    closure.add(key)
  }
  for (const rootKey of rootKeys) visit(rootKey)
  return closure
}

function oneRef(
  artifactType: string,
  execution: TrackAllCanonicalPrivateExecutionPackage,
): EditSkillArtifactReference {
  const candidates = [
    ...execution.initialArtifactRefs,
    execution.publicPlan.payloadRef,
    ...execution.publicPlan.evidenceRefs,
  ].filter((reference) => reference.artifactType === artifactType)
  const unique = [...new Map(candidates.map((reference) => [canonicalSkillJson(reference), reference])).values()]
  if (unique.length !== 1) {
    throw new Error(`Track All canonical execution requires one exact ${artifactType} authority; found ${unique.length}.`)
  }
  return unique[0]!
}

function lineage(execution: TrackAllCanonicalPrivateExecutionPackage) {
  return {
    ownerUserId: execution.assignment.ownerUserId,
    workspaceId: execution.assignment.workspaceId,
    projectId: execution.assignment.projectId,
    editSessionId: execution.assignment.editSessionId,
    assignmentId: execution.assignment.assignmentId,
    assignmentHash: execution.assignment.assignmentHash,
    planHash: execution.plan.planHash,
    manifestRef: execution.assignment.manifestRef,
    sourceSha256: execution.pluginWorkGraph.sourceSha256,
    authorizedRange: execution.assignment.authorizedRange,
  }
}

function localRef(
  artifactType: string,
  value: unknown,
  execution: TrackAllCanonicalPrivateExecutionPackage,
): EditSkillArtifactReference {
  return {
    artifactType,
    sha256: hashSkillValue(value),
    byteLength: Buffer.byteLength(canonicalSkillJson(value), 'utf8'),
    ...scope(execution),
  }
}

function withoutArtifactHash<T extends { artifactHash: string }>(value: T): Omit<T, 'artifactHash'> {
  const { artifactHash: _artifactHash, ...core } = value
  void _artifactHash
  return core
}

function relineageQa<T extends { artifactHash: string }>(
  value: T,
  execution: TrackAllCanonicalPrivateExecutionPackage,
  schema: { parse(value: unknown): T },
): T {
  const core = { ...withoutArtifactHash(value), ...lineage(execution) }
  return schema.parse({ ...core, artifactHash: hashSkillValue(core) })
}

function relineageArtifact<T extends { artifactHash: string }>(
  value: T,
  execution: TrackAllCanonicalPrivateExecutionPackage,
  schema: { parse(value: unknown): T },
  overrides: Readonly<Record<string, unknown>> = {},
): T {
  const core = {
    ...withoutArtifactHash(value),
    ...lineage(execution),
    ...overrides,
  }
  return schema.parse({ ...core, artifactHash: hashSkillValue(core) })
}

function planarSurfaceClass(semanticClass: string):
  'phone_screen' | 'laptop_screen' | 'television' | 'sign' | 'document' |
  'whiteboard' | 'wall' | 'window' | 'picture_frame' | 'billboard' |
  'selected_planar_area' {
  const map: Record<string, ReturnType<typeof planarSurfaceClass>> = {
    phone_screen: 'phone_screen',
    laptop_screen: 'laptop_screen',
    television: 'television',
    sign: 'sign',
    document: 'document',
    whiteboard: 'whiteboard',
    wall: 'wall',
    window: 'window',
    picture_frame: 'picture_frame',
    billboard: 'billboard',
  }
  return map[semanticClass] ?? 'selected_planar_area'
}

function projectIntegrationFromPrivacy(
  privacy: PrivacyExecution,
  execution: TrackAllCanonicalPrivateExecutionPackage,
) {
  const finding = createSkillQaFinding({
    qaKey: 'track_all.integration.privacy_private_preview',
    validatorVersion: 'track_all_canonical_privacy_integration_validator_v1',
    disposition: privacy.projectedQa.disposition === 'pass' ? 'pass' : 'critical',
    summary: privacy.projectedQa.disposition === 'pass'
      ? 'The exact flattened private privacy preview passed independent pixel inspection.'
      : 'The privacy preview did not pass independent inspection.',
    evidenceHashes: [privacy.projectedQa.artifactHash, privacy.privateMediaRef.sha256],
    observations: {
      noSensitiveExposure: privacy.projectedResult.noSensitiveExposure,
      publicArtifact: privacy.projectedResult.publicArtifact,
    },
  })
  const core = {
    schemaVersion: 'track_all_integration_qa_report_v1' as const,
    ...lineage(execution),
    findings: [finding],
    disposition: finding.disposition,
    outsideAuthorizedRangeModified: false,
    sourceAndTimingExact: true,
    privateOutput: true,
    publicUrlPresent: false,
    layerOrderValid: true,
  }
  return trackAllIntegrationQaReportSchema.parse({ ...core, artifactHash: hashSkillValue(core) })
}

function resultStatus(decision: TrackAllCanonicalPrivateExecutionPackage['plan']['decision']) {
  if (decision === 'use_no_tracking') return 'use_no_tracking' as const
  if (decision === 'apply_privacy_redaction') return 'accepted' as const
  if (['track_planar_region', 'repair_existing_track', 'produce_track_graph',
    'apply_tracked_focus', 'prepare_tracked_reframe'].includes(decision)) return 'accepted' as const
  if (decision === 'needs_visual_intelligence') return 'needs_visual_intelligence' as const
  if (decision === 'needs_user_selection') return 'needs_user_selection' as const
  if (decision === 'needs_range_expansion') return 'needs_range_expansion' as const
  if (decision === 'needs_manual_keyframe') return 'needs_manual_keyframe' as const
  if (decision === 'needs_user_confirmation') return 'needs_user_confirmation' as const
  if (decision === 'target_not_found') return 'target_not_found' as const
  if (decision === 'multiple_targets_ambiguous') return 'multiple_targets_ambiguous' as const
  if (decision === 'identity_uncertain') return 'identity_uncertain' as const
  if (decision === 'privacy_coverage_blocked') return 'privacy_coverage_blocked' as const
  return 'blocked' as const
}

async function decodeRgb24Range(input: {
  bytes: Buffer
  range: { startFrameInclusive: number; endFrameExclusive: number; fps: number }
}): Promise<Buffer> {
  if (
    input.range.endFrameExclusive <= input.range.startFrameInclusive ||
    ![24, 25, 30, 50, 60].includes(input.range.fps)
  ) throw new Error('Track All pixel inspection received an invalid fixed frame range.')
  return new Promise<Buffer>((resolve, reject) => {
    const process = spawn('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-i', 'pipe:0',
      '-vf', `select='gte(n,${input.range.startFrameInclusive})*lt(n,${input.range.endFrameExclusive})'`,
      '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1',
    ], { stdio: ['pipe', 'pipe', 'pipe'] })
    const chunks: Buffer[] = []
    const errors: Buffer[] = []
    process.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    process.stderr.on('data', (chunk: Buffer) => errors.push(chunk))
    process.once('error', reject)
    process.once('close', (code) => {
      if (code !== 0) reject(new Error(
        `Track All fixed FFmpeg pixel inspection failed: ${Buffer.concat(errors).toString('utf8').slice(0, 500)}`,
      ))
      else resolve(Buffer.concat(chunks))
    })
    process.stdin.end(input.bytes)
  })
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}
