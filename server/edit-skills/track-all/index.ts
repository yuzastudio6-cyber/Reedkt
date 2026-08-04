import type { EditSkillArtifactSchemaRegistry, EditSkillArtifactStore } from '../core/edit-skill-artifact-store'
import type { EditSkillPluginRegistry } from '../core/edit-skill-plugin-registry'
import type { SkillJobRuntimeBindingRegistry, SkillWorkGraphJobDefinition } from '../core/edit-skill-runtime-binding'
import type { SkillCapabilityRegistry } from '../core/skill-capability-registry'
import type { SkillReferenceCatalog } from '../core/skill-capability-validator'
import type { SkillEstimatorRegistry } from '../core/skill-estimator-registry'
import type { SkillQaRegistry } from '../core/skill-qa-registry'
import type { SkillQualificationRegistry } from '../core/skill-qualification-registry'
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
  TRACK_ALL_WORK_GRAPH_JOB_DEFINITIONS,
} from './track-all-work-graph'

export * from './track-all-artifact-types'
export * from './track-all-capability-manifest'
export * from './track-all-edit-skill-plugin'
export * from './track-all-plan-compiler'
export * from './track-all-qa-policy'
export * from './track-all-schemas'
export * from './track-all-skill-service'
export * from './track-all-work-graph'

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
  catalog: SkillReferenceCatalog
}): void {
  void input.qualifications
  registerTrackAllArtifactSchemas(input.artifacts)
  registerTrackAllQaPolicies(input.qa)
  input.estimators.registerTime('track_all.time.v1', (value) => {
    const frames = typeof value.durationFrames === 'number' ? Math.max(0, value.durationFrames) : 0
    const chunks = typeof value.chunkCount === 'number' ? Math.max(0, value.chunkCount) : 0
    const sessions = typeof value.sessionCount === 'number' ? Math.max(0, value.sessionCount) : 0
    const expectedSeconds = value.noAction === true ? 0 : Math.ceil(frames / 24) + chunks * 4 + sessions * 18
    return { minimumSeconds: expectedSeconds === 0 ? 0 : Math.max(1, Math.floor(expectedSeconds * 0.6)), expectedSeconds, maximumSeconds: expectedSeconds * 2, evidence: ['range_frames', 'shot_chunks', 'sam_sessions', 'selected_treatments'] }
  })
  input.estimators.registerCredit('track_all.credit.v1', (value) => {
    const chunks = typeof value.chunkCount === 'number' ? Math.max(0, value.chunkCount) : 0
    const sessions = typeof value.sessionCount === 'number' ? Math.max(0, value.sessionCount) : 0
    const expectedCredits = value.noAction === true ? 0 : chunks + sessions * 4
    return { minimumCredits: expectedCredits === 0 ? 0 : Math.max(1, Math.floor(expectedCredits * 0.5)), expectedCredits, maximumCredits: expectedCredits * 2, internalToolCostOnly: true, evidence: ['deterministic_chunks', 'gpu_sessions_without_customer_markup'] }
  })
  for (const value of TRACK_ALL_JOB_TYPES) input.catalog.jobTypes.add(value)
  for (const value of [...TRACK_ALL_TOOL_OPERATIONS, TRACK_ALL_SAM_OPERATION_V2]) input.catalog.toolOperations.add(value)
  input.catalog.sourceOperations.add('track_all.existing_track_graph.v1')
  input.catalog.noActionOperations.add(TRACK_ALL_NO_ACTION_OPERATION)
  for (const value of TRACK_ALL_PHASES) input.catalog.phases.add(value)
  input.capabilities.registerManifest(TRACK_ALL_CAPABILITY_MANIFEST)
  registerTrackAllRuntimeBindings(input.runtimeBindings)
  input.workGraphJobs.push(...TRACK_ALL_WORK_GRAPH_JOB_DEFINITIONS)
  const plugin = new TrackAllEditSkillPlugin({ artifacts: input.artifactStore })
  input.plugins.register(plugin)
  input.capabilities.registerHandler({ skillKey: 'track_all', skillVersion: '1.0.0', handler: new TrackAllSkillService(plugin) })
}
