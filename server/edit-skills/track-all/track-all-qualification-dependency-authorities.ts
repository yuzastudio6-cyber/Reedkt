import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { SkillQualificationDependencyAuthorityHash } from '../core/skill-qualification-evidence'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'

interface Definition {
  authorityKey: string
  profileVersion: string
  files: readonly string[]
}

const DEFINITIONS = [
  {
    authorityKey: 'shared_assignment_authorities',
    profileVersion: 'track_all_dependency_authority.shared_assignment_authorities.v1',
    files: [
      'server/edit-skills/shared/assignment-authorities/assignment-authority-schemas.ts',
      'server/edit-skills/shared/assignment-authorities/index.ts',
    ],
  },
  {
    authorityKey: 'generic_edit_skill_kernel',
    profileVersion: 'track_all_dependency_authority.generic_edit_skill_kernel.v1',
    files: [
      'server/edit-skills/core/edit-skill-plugin.ts',
      'server/edit-skills/core/edit-skill-plugin-registry.ts',
      'server/edit-skills/core/edit-skill-runtime-binding.ts',
      'server/edit-skills/core/edit-skill-runtime-dispatcher.ts',
      'server/edit-skills/core/skill-route-qualification.ts',
      'server/edit-skills/core/skill-qualification-receipt.ts',
    ],
  },
  {
    authorityKey: 'generic_route_qualification_registry',
    profileVersion: 'track_all_dependency_authority.generic_route_qualification_registry.v1',
    files: [
      'server/edit-skills/core/skill-route-qualification.ts',
      'server/edit-skills/core/skill-qualification-registry.ts',
    ],
  },
  {
    authorityKey: 'generic_runtime_dispatch_qualification_resolver',
    profileVersion: 'track_all_dependency_authority.generic_runtime_dispatch_qualification_resolver.v1',
    files: [
      'server/edit-skills/core/edit-skill-runtime-binding.ts',
      'server/edit-skills/core/edit-skill-runtime-dispatcher.ts',
    ],
  },
  {
    authorityKey: 'track_all_manifest_and_plugin',
    profileVersion: 'track_all_dependency_authority.manifest_and_plugin.v1',
    files: [
      'server/edit-skills/track-all/track-all-capability-manifest.ts',
      'server/edit-skills/track-all/track-all-edit-skill-plugin.ts',
      'server/edit-skills/track-all/track-all-skill-service.ts',
    ],
  },
  {
    authorityKey: 'track_all_artifact_schema_catalog',
    profileVersion: 'track_all_dependency_authority.artifact_schema_catalog.v1',
    files: [
      'server/edit-skills/track-all/track-all-active-artifact-contracts.ts',
      'server/edit-skills/track-all/track-all-artifact-types.ts',
      'server/edit-skills/track-all/track-all-schemas.ts',
    ],
  },
  {
    authorityKey: 'track_all_work_graph_and_bindings',
    profileVersion: 'track_all_dependency_authority.work_graph_and_bindings.v1',
    files: [
      'server/edit-skills/track-all/track-all-work-graph.ts',
      'server/edit-skills/track-all/track-all-route-qualification.ts',
    ],
  },
  {
    authorityKey: 'shared_track_graph_v1_v2',
    profileVersion: 'track_all_dependency_authority.shared_track_graph.v1',
    files: [
      'server/edit-skills/shared/track-graph/track-graph-schemas.ts',
      'server/edit-skills/shared/track-graph/index.ts',
    ],
  },
  {
    authorityKey: 'planning_and_independent_qa',
    profileVersion: 'track_all_dependency_authority.planning_and_qa.v1',
    files: [
      'server/edit-skills/track-all/private/planning-mini-skills.ts',
      'server/edit-skills/track-all/private/planning-qa-validators.ts',
      'server/edit-skills/track-all/track-all-plan-compiler.ts',
      'server/edit-skills/track-all/track-all-planning-authorities.ts',
      'server/edit-skills/track-all/private/qa-repair-runtime.ts',
    ],
  },
  {
    authorityKey: 'track_all_runtime_profile',
    profileVersion: 'track_all_dependency_authority.runtime_profile.v2',
    files: [
      'server/edit-skills/track-all/track-all-planning-authorities.ts',
      'server/edit-skills/track-all/private/sam3_1-real-private-runtime-identity.ts',
    ],
  },
  {
    authorityKey: 'track_all_preflight_observation_schema',
    profileVersion: 'track_all_dependency_authority.preflight_observation_schema.v1',
    files: ['server/edit-skills/track-all/track-all-planning-authorities.ts'],
  },
  {
    authorityKey: 'route_coherent_planner',
    profileVersion: 'track_all_dependency_authority.route_coherent_planner.v1',
    files: [
      'server/edit-skills/track-all/track-all-plan-compiler.ts',
      'server/edit-skills/track-all/private/planning-qa-validators.ts',
    ],
  },
  {
    authorityKey: 'route_coherent_work_graph',
    profileVersion: 'track_all_dependency_authority.route_coherent_work_graph.v1',
    files: ['server/edit-skills/track-all/track-all-work-graph.ts'],
  },
  {
    authorityKey: 'canonical_private_executor',
    profileVersion: 'track_all_dependency_authority.canonical_private_executor.v2',
    files: [
      'server/edit-skills/track-all/track-all-canonical-private-runtime.ts',
      'server/edit-skills/track-all/private/canonical-private-operation-driver.ts',
      'server/edit-skills/track-all/private/canonical-private-composite-operation-driver.ts',
    ],
  },
  {
    authorityKey: 'canonical_private_execution_accounting',
    profileVersion: 'track_all_dependency_authority.canonical_private_execution_accounting.v1',
    files: [
      'server/edit-skills/track-all/track-all-active-artifact-contracts.ts',
      'server/edit-skills/track-all/track-all-canonical-private-runtime.ts',
      'server/smoke/track-all-canonical-private-execution-accounting-smoke.ts',
    ],
  },
  {
    authorityKey: 'canonical_private_composite_driver',
    profileVersion: 'track_all_dependency_authority.canonical_private_composite_driver.v1',
    files: [
      'server/edit-skills/track-all/private/canonical-private-composite-operation-driver.ts',
      'server/smoke/track-all-canonical-private-composite-driver-smoke.ts',
    ],
  },
  {
    authorityKey: 'canonical_execution_coordinator',
    profileVersion: 'track_all_dependency_authority.canonical_execution_coordinator.v1',
    files: ['server/edit-skills/track-all/track-all-canonical-private-runtime.ts'],
  },
  {
    authorityKey: 'producer_consumer_support_bridge',
    profileVersion: 'track_all_dependency_authority.producer_consumer_support_bridge.v1',
    files: [
      'server/edit-skills/core/edit-skill-support-bridge.ts',
      'server/edit-skills/track-all/track-all-peer-support-bridge.ts',
      'server/edit-skills/b-roll/b-roll-tracking-support-bridge.ts',
    ],
  },
  {
    authorityKey: 'b_roll_track_graph_consumer',
    profileVersion: 'track_all_dependency_authority.b_roll_track_graph_consumer.v1',
    files: [
      'server/edit-skills/b-roll/b-roll-edit-skill-plugin.ts',
      'server/edit-skills/b-roll/b-roll-tracking-support-bridge.ts',
      'server/smoke/b-roll-public-plugin-e2e-smoke.ts',
    ],
  },
  {
    authorityKey: 'canonical_private_public_e2e',
    profileVersion: 'track_all_dependency_authority.canonical_private_public_e2e.v1',
    files: ['server/smoke/track-all-canonical-private-public-e2e-smoke.ts'],
  },
  {
    authorityKey: 'sam3_1_activation_bridge',
    profileVersion: 'track_all_dependency_authority.sam3_1_activation_bridge.v1',
    files: [
      'server/edit-skills/track-all/private/sam3_1-canonical-private-activation-bridge.ts',
      'server/edit-skills/track-all/private/sam3_1-real-private-session-owner.ts',
      'server/edit-skills/track-all/track-all-work-graph.ts',
    ],
  },
  {
    authorityKey: 'sam3_1_real_output_track_graph_adapter',
    profileVersion: 'track_all_dependency_authority.sam3_1_real_output_track_graph_adapter.v1',
    files: [
      'server/edit-skills/track-all/private/sam3_1-canonical-private-activation-bridge.ts',
      'server/edit-skills/track-all/private/canonical-private-operation-driver.ts',
      'server/edit-skills/track-all/private/chunk-identity-graph-runtime.ts',
      'server/edit-skills/shared/track-graph/track-graph-schemas.ts',
    ],
  },
  {
    authorityKey: 'sam3_1_protocol_wiring',
    profileVersion: 'track_all_dependency_authority.sam3_1_protocol_wiring.v1',
    files: [
      'server/edit-skills/track-all/private/sam3_1-protocol-wiring-test-port.ts',
      'server/smoke/track-all-sam3_1-protocol-wiring-smoke.ts',
    ],
  },
  {
    authorityKey: 'sam3_1_canonical_private_e2e',
    profileVersion: 'track_all_dependency_authority.sam3_1_canonical_private_e2e.v1',
    files: [
      'server/edit-skills/track-all/private/sam3_1-canonical-private-public-e2e.ts',
      'server/cli/track-all-sam3_1-canonical-private-e2e.ts',
    ],
  },
  {
    authorityKey: 'track_all_dedicated_ci',
    profileVersion: 'track_all_dependency_authority.dedicated_ci.v1',
    files: ['.github/workflows/track-all-skill-qa.yml'],
  },
  {
    authorityKey: 'ffprobe_ffmpeg_private_media',
    profileVersion: 'track_all_dependency_authority.ffprobe_ffmpeg_private_media.v1',
    files: [
      'server/tool-execution/media-binary-execution/offline-media-binary-protocol.ts',
      'server/tool-execution/media-binary-execution/offline-media-binary-runtime.ts',
    ],
  },
  {
    authorityKey: 'opencv_pyscenedetect_geometry',
    profileVersion: 'track_all_dependency_authority.opencv_pyscenedetect_geometry.v1',
    files: [
      'server/edit-skills/track-all/private/deterministic-geometry-runtime.ts',
      'server/tool-execution/python-runner-execution/offline-python-structured-execution-protocol.ts',
      'server/tool-execution/python-runner-execution/offline-python-structured-execution-service.ts',
    ],
  },
  {
    authorityKey: 'remotion_private_track_all_treatments',
    profileVersion: 'track_all_dependency_authority.remotion_private_treatments.v1',
    files: [
      'server/tool-execution/remotion-render-execution/offline-remotion-track-all-treatment-protocol.ts',
      'server/edit-skills/track-all/private/focus-reframe-runtime.ts',
    ],
  },
  {
    authorityKey: 'privacy_redaction_runtime',
    profileVersion: 'track_all_dependency_authority.privacy_redaction_runtime.v1',
    files: ['server/edit-skills/track-all/private/privacy-redaction-runtime.ts'],
  },
  {
    authorityKey: 'visual_intelligence_dependency_contract',
    profileVersion: 'track_all_dependency_authority.visual_intelligence_dependency.v1',
    files: ['server/edit-skills/track-all/track-all-active-artifact-contracts.ts'],
  },
  {
    authorityKey: 'sam3_1_track_masklets_v2_operation',
    profileVersion: 'track_all_dependency_authority.sam3_1_track_masklets_v2.v2',
    files: [
      'server/edit-skills/track-all/private/sam3_1-track-masklets-operation.ts',
      'server/edit-skills/track-all/private/sam3_1-v2-route-qualification-gate.ts',
      'server/edit-skills/track-all/private/sam3_1-injected-session-owner.ts',
      'server/edit-skills/track-all/private/sam3_1-real-private-runtime-identity.ts',
      'server/edit-skills/track-all/private/sam3_1-real-private-session-owner.ts',
      'server/edit-skills/track-all/private/sam3_1-private-canary.ts',
    ],
  },
  {
    authorityKey: 'sam3_1_source_checkpoint_authority',
    profileVersion: 'track_all_dependency_authority.sam3_1_source_checkpoint.v1',
    files: [
      'server/model-artifacts/canonical-sam3_1-source-runtime-candidate.ts',
      'server/model-artifacts/canonical-sam3_1-source-checkpoint-qualification.ts',
      'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
    ],
  },
  {
    authorityKey: 'sam3_1_runtime_image_authority',
    profileVersion: 'track_all_dependency_authority.sam3_1_runtime_image.v2',
    files: [
      'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
      'docker/prod/gpu-worker/sam3_1/runner.py',
      'docker/prod/gpu-worker/sam3_1/track_all_runner.py',
      'docker/prod/gpu-worker/sam3_1/track_all_entrypoint.sh',
      'server/workers/masks/canonical-sam3_1-gpu-runtime-contract.ts',
      'server/workers/masks/canonical-sam3_1-gpu-runtime-release.ts',
    ],
  },
] as const satisfies readonly Definition[]

export const TRACK_ALL_QUALIFICATION_DEPENDENCY_AUTHORITY_KEYS = Object.freeze(
  DEFINITIONS.map((definition) => definition.authorityKey),
)

function fileSha256(repositoryRoot: string, path: string): string {
  const absolutePath = resolve(repositoryRoot, path)
  if (!existsSync(absolutePath)) {
    throw new Error(`Track All qualification dependency authority file is missing: ${path}.`)
  }
  return createHash('sha256').update(readFileSync(absolutePath)).digest('hex')
}

export function computeTrackAllQualificationDependencyAuthorityHashes(
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
        schemaVersion: 'track_all_qualification_dependency_authority_v1',
        authorityKey: definition.authorityKey,
        profileVersion: definition.profileVersion,
        files,
      }),
    })
  }))
}

export function assertTrackAllQualificationDependencyAuthorityHashes(input: {
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
  ) throw new Error('Track All qualification authorities are missing, duplicate, unknown, or reordered.')
  for (let index = 0; index < input.expected.length; index += 1) {
    const actual = input.actual[index]
    const expected = input.expected[index]
    if (!actual || !expected || actual.authorityKey !== expected.authorityKey ||
      actual.authorityHash !== expected.authorityHash) {
      throw new Error(`Track All qualification authority ${expected?.authorityKey ?? 'unknown'} is stale or forged.`)
    }
  }
}
