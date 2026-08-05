import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { SkillQualificationDependencyAuthorityHash } from '../core/skill-qualification-evidence'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'

interface BrollDependencyAuthorityDefinition {
  authorityKey: string
  profileVersion: string
  files: readonly string[]
}

const DEFINITIONS = [
  {
    authorityKey: 'shared_assignment_authorities',
    profileVersion: 'b_roll_dependency_authority.shared_assignment_authorities.v1',
    files: [
      'server/edit-skills/shared/assignment-authorities/assignment-authority-schemas.ts',
      'server/edit-skills/shared/assignment-authorities/index.ts',
    ],
  },
  {
    authorityKey: 'canonical_approved_edit_execution_package',
    profileVersion: 'b_roll_dependency_authority.canonical_approved_edit_execution_package.v1',
    files: ['server/edit-architecture/canonical-approved-edit-execution-package.ts'],
  },
  {
    authorityKey: 'canonical_b_roll_plan_component',
    profileVersion: 'b_roll_dependency_authority.canonical_b_roll_plan_component.v1',
    files: [
      'server/edit-skills/b-roll/b-roll-canonical-plan-component.ts',
      'server/services/canonical-broll-plan-component-service.ts',
    ],
  },
  {
    authorityKey: 'canonical_planning_publication_service_contract',
    profileVersion: 'b_roll_dependency_authority.canonical_planning_publication_service_contract.v1',
    files: [
      'server/services/edit-planning-authority-service.ts',
      'server/validation/edit-planning-authority-schemas.ts',
    ],
  },
  {
    authorityKey: 'ffprobe_approved_media_operation_profile',
    profileVersion: 'b_roll_dependency_authority.ffprobe_approved_media_operation_profile.v1',
    files: [
      'server/tool-execution/media-binary-execution/offline-media-binary-protocol.ts',
      'server/tool-execution/media-binary-execution/offline-media-binary-runtime.ts',
    ],
  },
  {
    authorityKey: 'ffmpeg_approved_media_recipe_operation_profile',
    profileVersion: 'b_roll_dependency_authority.ffmpeg_approved_media_recipe_operation_profile.v1',
    files: [
      'server/tool-execution/media-binary-execution/offline-media-binary-protocol.ts',
      'server/tool-execution/media-binary-execution/offline-media-binary-runtime.ts',
    ],
  },
  {
    authorityKey: 'media_binary_execution_protocol',
    profileVersion: 'b_roll_dependency_authority.media_binary_execution_protocol.v1',
    files: [
      'server/tool-execution/media-binary-execution/offline-media-binary-protocol.ts',
      'server/tool-execution/media-binary-execution/offline-media-binary-types.ts',
    ],
  },
  {
    authorityKey: 'remotion_approved_composition_operation_profile',
    profileVersion: 'b_roll_dependency_authority.remotion_approved_composition_operation_profile.v1',
    files: [
      'server/tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol.ts',
      'server/tool-execution/remotion-render-execution/offline-remotion-render-execution-service.ts',
      'docker/prod/offline-remotion-render-execution/composition.tsx',
      'docker/prod/offline-remotion-render-execution/runner.mjs',
    ],
  },
  {
    authorityKey: 'remotion_execution_protocol',
    profileVersion: 'b_roll_dependency_authority.remotion_execution_protocol.v1',
    files: [
      'server/tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol.ts',
      'server/tool-execution/remotion-render-execution/offline-remotion-render-execution-types.ts',
      'server/tool-execution/remotion-render-execution/offline-remotion-render-docker-runtime.ts',
    ],
  },
  {
    authorityKey: 'remotion_composition_contract',
    profileVersion: 'b_roll_dependency_authority.remotion_composition_contract.v1',
    files: [
      'docker/prod/offline-remotion-render-execution/composition.tsx',
      'docker/prod/offline-remotion-render-execution/entry.tsx',
      'src/types/canonical-private-composition-capacity.ts',
    ],
  },
  {
    authorityKey: 'b_roll_gemini_omni_v5_provider_profile',
    profileVersion: 'b_roll_dependency_authority.gemini_omni_v5_provider_profile.v1',
    files: [
      'server/providers/google/gemini-omni-broll/b-roll-gemini-official-contract.ts',
      'server/providers/google/gemini-omni-broll/b-roll-provider-authority-v5.ts',
    ],
  },
  {
    authorityKey: 'b_roll_gemini_lifecycle_policy',
    profileVersion: 'b_roll_dependency_authority.gemini_lifecycle_policy.v1',
    files: [
      'server/providers/google/gemini-omni-broll/b-roll-provider-lifecycle-policy-v5.ts',
      'server/providers/google/gemini-omni-broll/b-roll-provider-injected-lifecycle-v5.ts',
      'server/providers/google/gemini-omni-broll/b-roll-gemini-rest-transport.ts',
    ],
  },
  {
    authorityKey: 'b_roll_candidate_qa_contract',
    profileVersion: 'b_roll_dependency_authority.candidate_qa_contract.v1',
    files: [
      'server/edit-skills/b-roll/b-roll-candidate-attempt.ts',
      'server/edit-skills/b-roll/b-roll-candidate-qa.ts',
      'server/edit-skills/b-roll/b-roll-candidate-refinement.ts',
    ],
  },
  {
    authorityKey: 'b_roll_planning_qa_contract',
    profileVersion: 'b_roll_dependency_authority.planning_qa_contract.v1',
    files: [
      'server/edit-skills/b-roll/b-roll-planning-qa.ts',
      'server/edit-skills/b-roll/b-roll-qa-policy.ts',
    ],
  },
  {
    authorityKey: 'public_edit_skill_plugin_contract',
    profileVersion: 'b_roll_dependency_authority.public_edit_skill_plugin_contract.v1',
    files: [
      'server/edit-skills/core/edit-skill-plugin.ts',
      'server/edit-skills/core/edit-skill-plugin-registry.ts',
      'server/edit-skills/b-roll/b-roll-edit-skill-plugin.ts',
    ],
  },
  {
    authorityKey: 'edit_skill_artifact_schema_registry_contract',
    profileVersion: 'b_roll_dependency_authority.edit_skill_artifact_schema_registry_contract.v1',
    files: [
      'server/edit-skills/core/edit-skill-artifact-store.ts',
      'server/edit-skills/b-roll/b-roll-artifact-types.ts',
      'server/edit-skills/b-roll/b-roll-active-artifact-contracts.ts',
    ],
  },
  {
    authorityKey: 'edit_skill_runtime_binding_contract',
    profileVersion: 'b_roll_dependency_authority.edit_skill_runtime_binding_contract.v1',
    files: [
      'server/edit-skills/core/edit-skill-runtime-binding.ts',
      'server/edit-skills/core/edit-skill-runtime-dispatcher.ts',
      'server/edit-skills/core/skill-route-qualification.ts',
      'server/edit-skills/b-roll/b-roll-runtime-bindings.ts',
      'server/edit-skills/b-roll/b-roll-route-qualification.ts',
      'server/edit-skills/b-roll/b-roll-canonical-private-runtime.ts',
    ],
  },
  {
    authorityKey: 'visual_intelligence_dependency_contract',
    profileVersion: 'b_roll_dependency_authority.visual_intelligence_dependency_contract.v1',
    files: ['server/edit-skills/b-roll/b-roll-visual-intelligence-dependency.ts'],
  },
  {
    authorityKey: 'track_graph_dependency_contract',
    profileVersion: 'b_roll_dependency_authority.track_graph_dependency_contract.v1',
    files: ['server/edit-skills/b-roll/b-roll-track-graph-dependency.ts'],
  },
] as const satisfies readonly BrollDependencyAuthorityDefinition[]

export const BROLL_QUALIFICATION_DEPENDENCY_AUTHORITY_KEYS = Object.freeze(
  DEFINITIONS.map((definition) => definition.authorityKey),
)

function fileSha256(repositoryRoot: string, path: string): string {
  const absolutePath = resolve(repositoryRoot, path)
  if (!existsSync(absolutePath)) {
    throw new Error(`B-roll qualification dependency authority file is missing: ${path}.`)
  }
  return createHash('sha256').update(readFileSync(absolutePath)).digest('hex')
}

export function computeBrollQualificationDependencyAuthorityHashes(
  repositoryRoot = process.cwd(),
): readonly SkillQualificationDependencyAuthorityHash[] {
  return Object.freeze(DEFINITIONS.map((definition) => {
    const files = [...definition.files].sort().map((path) => ({
      path,
      sha256: fileSha256(repositoryRoot, path),
    }))
    return Object.freeze({
      authorityKey: definition.authorityKey,
      authorityHash: hashSkillValue({
        schemaVersion: 'b_roll_qualification_dependency_authority_v1',
        authorityKey: definition.authorityKey,
        profileVersion: definition.profileVersion,
        files,
      }),
    })
  }))
}

export function assertBrollQualificationDependencyAuthorityHashes(input: {
  actual: readonly SkillQualificationDependencyAuthorityHash[]
  expected: readonly SkillQualificationDependencyAuthorityHash[]
}): void {
  const actualKeys = input.actual.map((entry) => entry.authorityKey)
  const expectedKeys = input.expected.map((entry) => entry.authorityKey)
  if (
    input.actual.length !== input.expected.length ||
    new Set(actualKeys).size !== actualKeys.length ||
    new Set(expectedKeys).size !== expectedKeys.length ||
    hashSkillValue(actualKeys) !== hashSkillValue(expectedKeys)
  ) throw new Error('B-roll qualification dependency authorities are missing, duplicate, unknown, or out of canonical order.')
  for (let index = 0; index < input.expected.length; index += 1) {
    const actual = input.actual[index]
    const expected = input.expected[index]
    if (
      !actual || !expected || actual.authorityKey !== expected.authorityKey ||
      actual.authorityHash !== expected.authorityHash
    ) throw new Error(`B-roll qualification dependency authority ${expected?.authorityKey ?? 'unknown'} changed or is forged.`)
  }
}
