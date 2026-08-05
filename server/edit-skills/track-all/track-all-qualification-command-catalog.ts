import type {
  TrackAllRouteQualificationKey,
} from './track-all-qualification'
import { TRACK_ALL_QUALIFICATION_FIXTURE_KEYS } from './track-all-qualification'

export const TRACK_ALL_QUALIFICATION_SCRIPTS = [
  'test:edit-skill-shared-assignment-authorities',
  'test:edit-skill-route-qualification',
  'test:track-all-capability-manifest',
  'test:track-all-authority',
  'test:track-all-planning',
  'test:track-all-artifact-contracts',
  'test:track-all-deterministic-geometry',
  'test:track-all-sam3.1-operation-authority',
  'test:track-all-sam3.1-route-gates',
  'test:track-all-sam3.1-injected-session',
  'test:track-all-chunk-identity',
  'test:track-all-privacy-redaction',
  'test:track-all-focus-reframe',
  'test:track-all-cross-skill-handoffs',
  'test:track-all-independent-qa-repair',
  'test:track-all-runtime-bindings',
  'test:track-all-public-plugin-e2e',
  'test:track-all-qualification-evidence',
  'test:track-all-retirement',
  'validate:skill-capability-manifests',
  'test:edit-skill-capability-kernel',
  'smoke:runtime-api-security',
  'smoke:edit-execution-security-boundary',
  'build',
  'typecheck:server',
  'lint',
  'check:frontend-boundary',
] as const

export const TRACK_ALL_QUALIFICATION_COMMAND_IDS = TRACK_ALL_QUALIFICATION_SCRIPTS.map(
  (script) => `npm.${script}` as const,
)

export const TRACK_ALL_FIXTURE_COMMAND = {
  'track_all.fixture.authority_rejections': 'npm.test:track-all-authority',
  'track_all.fixture.selected_targets': 'npm.test:track-all-public-plugin-e2e',
  'track_all.fixture.concept_exclusions': 'npm.test:track-all-public-plugin-e2e',
  'track_all.fixture.target_ambiguity': 'npm.test:track-all-planning',
  'track_all.fixture.occlusion_reentry_identity': 'npm.test:track-all-chunk-identity',
  'track_all.fixture.shot_chunk_overlap': 'npm.test:track-all-chunk-identity',
  'track_all.fixture.multiplex_budgets': 'npm.test:track-all-planning',
  'track_all.fixture.privacy_fail_closed': 'npm.test:track-all-privacy-redaction',
  'track_all.fixture.flattened_privacy_preview': 'npm.test:track-all-privacy-redaction',
  'track_all.fixture.camera_motion': 'npm.test:track-all-deterministic-geometry',
  'track_all.fixture.planar_homography': 'npm.test:track-all-deterministic-geometry',
  'track_all.fixture.focus_treatments': 'npm.test:track-all-focus-reframe',
  'track_all.fixture.reframe_trajectories': 'npm.test:track-all-focus-reframe',
  'track_all.fixture.visual_intelligence_dependency': 'npm.test:track-all-public-plugin-e2e',
  'track_all.fixture.track_graph_compatibility': 'npm.test:track-all-cross-skill-handoffs',
  'track_all.fixture.bounded_repairs': 'npm.test:track-all-independent-qa-repair',
  'track_all.fixture.session_terminal_close': 'npm.test:track-all-sam3.1-injected-session',
  'track_all.fixture.runtime_security': 'npm.test:track-all-sam3.1-operation-authority',
  'track_all.fixture.public_plugin_lifecycle': 'npm.test:track-all-public-plugin-e2e',
  'track_all.fixture.legacy_retirement': 'npm.test:track-all-retirement',
  'track_all.fixture.qualification_integrity': 'npm.test:track-all-qualification-evidence',
} as const satisfies Record<(typeof TRACK_ALL_QUALIFICATION_FIXTURE_KEYS)[number], string>

export const TRACK_ALL_ROUTE_COMMANDS = {
  planning_core_route: [
    'npm.test:track-all-capability-manifest',
    'npm.test:track-all-authority',
    'npm.test:track-all-planning',
  ],
  deterministic_geometry_route: ['npm.test:track-all-deterministic-geometry'],
  planar_tracking_route: ['npm.test:track-all-deterministic-geometry'],
  existing_track_repair_route: ['npm.test:track-all-independent-qa-repair'],
  privacy_redaction_route: ['npm.test:track-all-privacy-redaction'],
  focus_route: ['npm.test:track-all-focus-reframe'],
  reframe_route: ['npm.test:track-all-focus-reframe'],
  public_plugin_lifecycle_route: ['npm.test:track-all-public-plugin-e2e'],
  sam3_1_masklet_route: [
    'npm.test:track-all-sam3.1-operation-authority',
    'npm.test:track-all-sam3.1-route-gates',
    'npm.test:track-all-sam3.1-injected-session',
  ],
  production_worker_route: ['npm.test:track-all-runtime-bindings'],
} as const satisfies Record<TrackAllRouteQualificationKey, readonly string[]>
