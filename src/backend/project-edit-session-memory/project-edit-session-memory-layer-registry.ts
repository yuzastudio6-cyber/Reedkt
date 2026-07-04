import type {
  ProjectEditSessionMemoryLayer,
} from '../../types/project-edit-session'
import type {
  ProjectEditSessionMemoryLayerDefinition,
} from '../../types/project-edit-session-memory'

export const PROJECT_EDIT_SESSION_MEMORY_LAYER_REGISTRY: ProjectEditSessionMemoryLayerDefinition[] = [
  {
    layer: 'project_memory',
    displayName: 'Project Memory',
    purpose: 'Project-wide purpose, campaign, brand, client, and shared constraints.',
    examples: ['Campaign goal', 'Client or brand note', 'Shared avoid rule'],
    futureQwenRole: 'main_reasoning_agent',
    mockOnly: true,
  },
  {
    layer: 'session_memory',
    displayName: 'Session Memory',
    purpose: 'This Edit Chat direction, desired outcome, tone, aspect ratio, platform, and status.',
    examples: ['Video goal', 'Platform target', 'Tone direction'],
    futureQwenRole: 'main_reasoning_agent',
    mockOnly: true,
  },
  {
    layer: 'source_memory',
    displayName: 'Source Memory',
    purpose: 'Metadata-only source labels, source order, clip importance, and user source notes.',
    examples: ['Clip 2 is important', 'Use b-roll as optional context', 'Source order note'],
    mockOnly: true,
  },
  {
    layer: 'preference_memory',
    displayName: 'Preference Memory',
    purpose: 'Selected Edit Preference handle, version, basic preference rules, and legacy fallback.',
    examples: ['Selected @lifestyle-travel-vlog', 'Premium preference tone', 'Legacy no-DNA fallback'],
    futureQwenRole: 'preference_dna_analyst',
    mockOnly: true,
  },
  {
    layer: 'dna_application_memory',
    displayName: 'DNA Application Memory',
    purpose: 'Preference DNA application status, QA status, top layers, do-not-copy rules, and review warnings.',
    examples: ['DNA applied', 'Do-not-copy active', 'No fake source sound warning'],
    futureQwenRole: 'preference_dna_analyst',
    mockOnly: true,
  },
  {
    layer: 'revision_memory',
    displayName: 'Revision Memory',
    purpose: 'Requested changes, approval reset reasons, avoid rules, and project-only learning.',
    examples: ['Make captions smaller', 'Use less SFX', 'Approval reset after revision'],
    futureQwenRole: 'revision_learning_agent',
    mockOnly: true,
  },
  {
    layer: 'approval_memory',
    displayName: 'Approval Memory',
    purpose: 'Approval request, approval, rejection, and reset state.',
    examples: ['Keep this version', 'Approval reset after revision', 'Plan not requested'],
    mockOnly: true,
  },
  {
    layer: 'preview_memory',
    displayName: 'Preview Memory',
    purpose: 'Latest placeholder preview, latest version, preview status, and future render state.',
    examples: ['Preview looks good', 'Latest mock preview', 'Render remains future'],
    mockOnly: true,
  },
  {
    layer: 'user_instruction_memory',
    displayName: 'User Instruction Memory',
    purpose: 'Explicit user edit preferences and avoid rules expressed in chat.',
    examples: ['Make it faster', 'No fake sounds', 'Keep it calm'],
    futureQwenRole: 'main_reasoning_agent',
    mockOnly: true,
  },
]

export function listProjectEditSessionMemoryLayers(): ProjectEditSessionMemoryLayerDefinition[] {
  return [...PROJECT_EDIT_SESSION_MEMORY_LAYER_REGISTRY]
}

export function getProjectEditSessionMemoryLayerDefinition(
  layer: ProjectEditSessionMemoryLayer,
): ProjectEditSessionMemoryLayerDefinition | undefined {
  return PROJECT_EDIT_SESSION_MEMORY_LAYER_REGISTRY.find((definition) => definition.layer === layer)
}

export function createProjectEditSessionMemoryLayerRegistrySummary(): {
  layerCount: number
  layers: ProjectEditSessionMemoryLayer[]
  mockOnly: true
  noQwenCallMade: true
} {
  return {
    layerCount: PROJECT_EDIT_SESSION_MEMORY_LAYER_REGISTRY.length,
    layers: PROJECT_EDIT_SESSION_MEMORY_LAYER_REGISTRY.map((definition) => definition.layer),
    mockOnly: true,
    noQwenCallMade: true,
  }
}
