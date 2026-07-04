import type {
  ProjectEditSessionMemoryLayer,
} from '../../types/project-edit-session'
import type {
  ProjectEditSessionMemorySafetyStatus,
} from '../../types/project-edit-session-memory'

export interface MockProjectEditSessionMemoryScenario {
  id: string
  title: string
  input: string
  expectedOk: boolean
  expectedTargetLayers: ProjectEditSessionMemoryLayer[]
  expectedSafetyStatus: ProjectEditSessionMemorySafetyStatus
  mockOnly: true
}

function scenario(
  id: string,
  title: string,
  input: string,
  expectedTargetLayers: ProjectEditSessionMemoryLayer[],
  expectedSafetyStatus: ProjectEditSessionMemorySafetyStatus = 'safe_mock_update',
  expectedOk = true,
): MockProjectEditSessionMemoryScenario {
  return { id, title, input, expectedOk, expectedTargetLayers, expectedSafetyStatus, mockOnly: true }
}

export const mockProjectEditSessionMemoryScenarios: MockProjectEditSessionMemoryScenario[] = [
  scenario('memory-layer-project-memory', 'Layer registry lists project memory.', 'project memory', ['project_memory']),
  scenario('memory-layer-session-memory', 'Layer registry lists session memory.', 'session memory', ['session_memory']),
  scenario('memory-layer-source-memory', 'Layer registry lists source memory.', 'source memory', ['source_memory']),
  scenario('memory-layer-preference-memory', 'Layer registry lists preference memory.', 'preference memory', ['preference_memory']),
  scenario('memory-layer-dna-application-memory', 'Layer registry lists DNA application memory.', 'dna memory', ['dna_application_memory']),
  scenario('memory-layer-revision-memory', 'Layer registry lists revision memory.', 'revision memory', ['revision_memory']),
  scenario('memory-layer-approval-memory', 'Layer registry lists approval memory.', 'approval memory', ['approval_memory']),
  scenario('memory-layer-preview-memory', 'Layer registry lists preview memory.', 'preview memory', ['preview_memory']),
  scenario('memory-layer-user-instruction-memory', 'Layer registry lists user instruction memory.', 'user instruction memory', ['user_instruction_memory']),
  scenario('message-faster-revision', 'Message make it faster extracts revision memory.', 'make it faster', ['revision_memory', 'user_instruction_memory']),
  scenario('message-captions-smaller', 'Message captions smaller extracts user instruction memory.', 'captions smaller', ['user_instruction_memory', 'session_memory']),
  scenario('message-less-sfx', 'Message less SFX extracts DNA/application warning.', 'use less SFX', ['user_instruction_memory', 'dna_application_memory']),
  scenario('message-no-fake-sounds', 'Message no fake sounds extracts do-not-copy style warning.', 'no fake sounds', ['user_instruction_memory', 'dna_application_memory']),
  scenario('message-clip-important', 'Message clip 2 is important extracts source memory.', 'clip 2 is important', ['source_memory']),
  scenario('message-keep-version', 'Message keep this version extracts approval memory.', 'keep this version', ['approval_memory', 'preview_memory']),
  scenario('message-preview-good', 'Message preview looks good extracts preview memory.', 'preview looks good', ['preview_memory']),
  scenario('message-unknown-noop', 'Unknown message creates no-op extraction.', 'hello there', []),
  scenario('revision-request', 'Revision request extraction works.', 'revise captions and make it faster', ['revision_memory', 'user_instruction_memory', 'session_memory']),
  scenario('source-note', 'Source note extraction works.', 'source clip opening is most important', ['source_memory']),
  scenario('preference-dna', 'Preference DNA extraction works.', 'DNA applied with do-not-copy active', ['dna_application_memory', 'preference_memory']),
  scenario('approval-event', 'Approval event extraction works.', 'approved current mock plan', ['approval_memory']),
  scenario('preview-event', 'Preview event extraction works.', 'preview version ready', ['preview_memory']),
  scenario('plan-append-fact', 'Update plan creates append fact action.', 'clip 2 is important', ['source_memory']),
  scenario('plan-append-preference', 'Update plan creates append preference action.', 'make captions smaller', ['user_instruction_memory', 'session_memory']),
  scenario('plan-append-warning', 'Update plan creates append warning action.', 'no fake sounds', ['user_instruction_memory', 'dna_application_memory']),
  scenario('plan-replace-summary', 'Update plan creates summary replacement.', 'make it more premium', ['session_memory', 'preference_memory']),
  scenario('merge-dedupe-facts', 'Memory merge de-duplicates facts.', 'source clip 2 is important', ['source_memory']),
  scenario('merge-dedupe-preferences', 'Memory merge de-duplicates preferences.', 'captions smaller', ['user_instruction_memory', 'session_memory']),
  scenario('merge-preserve-warnings', 'Memory merge preserves warnings.', 'less sfx no fake sounds', ['user_instruction_memory', 'dna_application_memory']),
  scenario('package-counts-facts', 'Memory package counts facts.', 'source clip 2 important', ['source_memory']),
  scenario('package-counts-preferences', 'Memory package counts preferences.', 'make it faster', ['revision_memory', 'user_instruction_memory']),
  scenario('package-counts-warnings', 'Memory package counts warnings.', 'no fake sounds', ['user_instruction_memory', 'dna_application_memory']),
  scenario('policy-blocks-secret', 'Safety policy blocks secret-like fact.', 'api_key should be remembered', [], 'blocked_sensitive', false),
  scenario('policy-blocks-identity', 'Safety policy blocks identity or biometric guess.', 'identify this person by face id', [], 'blocked_sensitive', false),
  scenario('policy-allows-edit-preference', 'Safety policy allows edit preference fact.', 'use @lifestyle-travel-vlog premium style', ['session_memory', 'preference_memory']),
  scenario('validation-extraction', 'Validation passes for mock extraction.', 'make it faster', ['revision_memory', 'user_instruction_memory']),
  scenario('validation-plan', 'Validation passes for update plan.', 'captions smaller', ['user_instruction_memory', 'session_memory']),
  scenario('validation-package', 'Validation passes for package.', 'preview version ready', ['preview_memory']),
  scenario('validation-side-effects', 'Validation blocks side-effect flags.', 'providerCallMade true', [], 'failed_validation', false),
  scenario('ui-layer-cards', 'UI adapter creates layer card models.', 'source clip note', ['source_memory']),
  scenario('ui-update-notice', 'UI adapter creates update notice.', 'make it faster', ['revision_memory', 'user_instruction_memory']),
  scenario('summary-chat', 'Chat summary readable.', 'captions smaller', ['user_instruction_memory', 'session_memory']),
  scenario('summary-debug', 'Debug summary readable.', 'preview version ready', ['preview_memory']),
  scenario('no-qwen-call', 'No Qwen call made.', 'make it faster', ['revision_memory', 'user_instruction_memory']),
  scenario('no-deepseek-call', 'No DeepSeek call made.', 'make it faster', ['revision_memory', 'user_instruction_memory']),
  scenario('no-provider-call', 'No provider call made.', 'make it faster', ['revision_memory', 'user_instruction_memory']),
  scenario('no-supabase-write', 'No Supabase write made.', 'make it faster', ['revision_memory', 'user_instruction_memory']),
  scenario('no-worker-render-credit', 'No worker/render/credit side effect.', 'make it faster', ['revision_memory', 'user_instruction_memory']),
  scenario('api-memory-persist', 'Memory update can persist through API route where safe.', 'captions smaller', ['user_instruction_memory', 'session_memory']),
  scenario('api-revision-memory-persist', 'Revision memory update can persist through API route where safe.', 'make it faster and use less sfx', ['revision_memory', 'user_instruction_memory', 'dna_application_memory']),
]
