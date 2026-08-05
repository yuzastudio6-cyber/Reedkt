import type { EditSkillArtifactSchemaRegistry, EditSkillArtifactStore } from '../core/edit-skill-artifact-store'
import type { EditSkillPluginRegistry } from '../core/edit-skill-plugin-registry'
import type { SkillJobRuntimeBindingRegistry, SkillWorkGraphJobDefinition } from '../core/edit-skill-runtime-binding'
import type { SkillCapabilityRegistry } from '../core/skill-capability-registry'
import type { SkillReferenceCatalog } from '../core/skill-capability-validator'
import type { SkillEstimatorRegistry } from '../core/skill-estimator-registry'
import type { SkillQaRegistry } from '../core/skill-qa-registry'
import type { SkillQualificationRegistry } from '../core/skill-qualification-registry'
import type { SkillRouteQualificationRegistry } from '../core/skill-route-qualification'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TRACK_ALL_JOB_TYPES,
  TRACK_ALL_NO_ACTION_OPERATION,
  TRACK_ALL_PHASES,
  TRACK_ALL_SAM_OPERATION_V2,
  TRACK_ALL_TOOL_OPERATIONS,
} from './track-all-capability-manifest'
import { TrackAllEditSkillPlugin } from './track-all-edit-skill-plugin'
import { registerTrackAllQaPolicies } from './track-all-qa-policy'
import { registerTrackAllArtifactSchemas } from './track-all-schemas'
import { TrackAllSkillService } from './track-all-skill-service'
import {
  registerTrackAllRuntimeBindings,
  TRACK_ALL_RUNTIME_BINDINGS,
  createTrackAllCanonicalPrivateRuntimeBindings,
  TRACK_ALL_WORK_GRAPH_JOB_DEFINITIONS,
} from './track-all-work-graph'
import { estimateTrackAllPlan } from './private/planning-mini-skills'
import { tryLoadTrackAllGeneratedQualificationArtifact } from './track-all-qualification-evidence'
import { computeTrackAllQualificationDependencyAuthorityHashes } from './track-all-qualification-dependency-authorities'
import { computeTrackAllRelevantSourceTreeHash } from './track-all-qualification-source-hash'
import {
  createTrackAllInternalRouteQualificationCandidateReceipts,
  createTrackAllRouteQualificationReceipts,
} from './track-all-route-qualification'

export * from './track-all-artifact-types'
export * from './track-all-active-artifact-contracts'
export * from './track-all-capability-manifest'
export * from './track-all-edit-skill-plugin'
export * from './track-all-plan-compiler'
export * from './track-all-planning-authorities'
export * from './track-all-qa-policy'
export * from './track-all-qualification'
export * from './track-all-qualification-command-catalog'
export * from './track-all-qualification-dependency-authorities'
export * from './track-all-qualification-evidence'
export * from './track-all-qualification-source-hash'
export * from './track-all-route-qualification'
export * from './track-all-schemas'
export * from './track-all-skill-service'
export * from './track-all-work-graph'

function estimatorInput(value: Readonly<Record<string, unknown>>) {
  const nonnegative = (key: string) => typeof value[key] === 'number'
    ? Math.max(0, Math.floor(value[key]))
    : 0
  const qaDepth: 'planning' | 'internal' | 'production' =
    value.qaDepth === 'production' || value.qaDepth === 'internal'
      ? value.qaDepth
      : 'planning'
  return {
    frameCount: nonnegative('durationFrames'),
    fps: Math.max(1, nonnegative('fps') || 24),
    chunkCount: nonnegative('chunkCount'),
    overlapFrames: nonnegative('overlapFrames'),
    targetGroupCount: nonnegative('targetGroupCount'),
    objectCount: nonnegative('objectCount'),
    bucketCount: nonnegative('bucketCount'),
    sessionCount: nonnegative('sessionCount'),
    bidirectionalPropagation: value.bidirectionalPropagation === true,
    planarGeometry: value.planarGeometry === true,
    ocr: value.ocr === true,
    landmarks: value.landmarks === true,
    maskRefinement: value.maskRefinement === true,
    privacyTreatment: value.privacyTreatment === true,
    previewRender: value.previewRender === true,
    qaDepth,
    repairAttempts: Math.min(2, nonnegative('repairAttempts')),
    noAction: value.noAction === true,
  }
}

export function registerTrackAllSkill(input: {
  capabilities: SkillCapabilityRegistry
  estimators: SkillEstimatorRegistry
  qa: SkillQaRegistry
  artifacts: EditSkillArtifactSchemaRegistry
  artifactStore: EditSkillArtifactStore
  plugins: EditSkillPluginRegistry
  runtimeBindings: SkillJobRuntimeBindingRegistry
  workGraphJobs: SkillWorkGraphJobDefinition[]
  qualifications: SkillQualificationRegistry
  routeQualifications: SkillRouteQualificationRegistry
  catalog: SkillReferenceCatalog
  environmentClass: 'internal_fixture' | 'canonical_private' | 'production_server'
}): void {
  const qualificationGenerationMode =
    process.env.REEDITPRO_TRACK_ALL_QUALIFICATION_GENERATING === '1'
  let generatedQualification
  try {
    generatedQualification = tryLoadTrackAllGeneratedQualificationArtifact({
      manifest: TRACK_ALL_CAPABILITY_MANIFEST,
      expectedRelevantSourceTreeHash: computeTrackAllRelevantSourceTreeHash(),
      expectedDependencyAuthorityHashes:
        computeTrackAllQualificationDependencyAuthorityHashes(),
    })
  } catch (error) {
    if (!qualificationGenerationMode) throw error
    generatedQualification = undefined
  }
  if (!generatedQualification && !qualificationGenerationMode) {
    throw new Error(
      'Track All runtime is unqualified: run npm run qualify:track-all:internal for this exact source tree.',
    )
  }
  const canonicalRouteBindings = createTrackAllCanonicalPrivateRuntimeBindings({
    execute: async (_jobType, definition) => ({
      status: 'failed',
      outputArtifactTypes: [definition.output],
      evidenceHashes: [TRACK_ALL_CAPABILITY_MANIFEST.manifestHash],
      providerRequestCount: 0,
      publicArtifactCount: 0,
      productionMutationCount: 0,
      failureCode: 'route_qualification_binding_authority_cannot_execute',
    }),
  })
  const routeBindingDefinitions = [
    ...TRACK_ALL_RUNTIME_BINDINGS,
    ...canonicalRouteBindings,
  ].map((binding) => binding.definition)
  if (generatedQualification) {
    input.qualifications.register(generatedQualification.receipt)
    for (const receipt of createTrackAllRouteQualificationReceipts({
      artifact: generatedQualification,
      bindings: routeBindingDefinitions,
    })) input.routeQualifications.register({
      receipt,
      bindings: routeBindingDefinitions,
    })
  } else {
    for (const receipt of createTrackAllInternalRouteQualificationCandidateReceipts({
      bindings: routeBindingDefinitions,
    })) input.routeQualifications.register({ receipt, bindings: routeBindingDefinitions })
  }
  registerTrackAllArtifactSchemas(input.artifacts)
  registerTrackAllQaPolicies(input.qa)
  input.estimators.registerTime('track_all.time.v1', (value) => {
    const estimate = estimateTrackAllPlan(estimatorInput(value))
    return { ...estimate.time, evidence: [estimate.evidenceHash, 'range_chunks_objects_buckets_tools_qa_repairs'] }
  })
  input.estimators.registerCredit('track_all.credit.v1', (value) => {
    const estimate = estimateTrackAllPlan(estimatorInput(value))
    return { ...estimate.credits, evidence: [estimate.evidenceHash, 'internal_tool_cost_without_customer_markup'] }
  })
  for (const value of TRACK_ALL_JOB_TYPES) input.catalog.jobTypes.add(value)
  for (const value of [...TRACK_ALL_TOOL_OPERATIONS, TRACK_ALL_SAM_OPERATION_V2]) input.catalog.toolOperations.add(value)
  input.catalog.sourceOperations.add('track_all.existing_track_graph.v1')
  input.catalog.noActionOperations.add(TRACK_ALL_NO_ACTION_OPERATION)
  for (const value of TRACK_ALL_PHASES) input.catalog.phases.add(value)
  input.capabilities.registerManifest(TRACK_ALL_CAPABILITY_MANIFEST)
  registerTrackAllRuntimeBindings(input.runtimeBindings)
  input.workGraphJobs.push(...TRACK_ALL_WORK_GRAPH_JOB_DEFINITIONS)
  const plugin = new TrackAllEditSkillPlugin({
    artifacts: input.artifactStore,
    routeQualifications: input.routeQualifications,
    environmentClass: input.environmentClass,
  })
  input.plugins.register(plugin)
  input.capabilities.registerHandler({ skillKey: 'track_all', skillVersion: '1.0.0', handler: new TrackAllSkillService(plugin) })
  if (generatedQualification) {
    input.qualifications.assertClaim(
      input.capabilities.referenceFor('track_all'),
      TRACK_ALL_CAPABILITY_MANIFEST.qualificationStatus,
    )
  }
}
