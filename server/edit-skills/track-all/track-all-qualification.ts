import type { SkillQualificationFixtureDefinition } from '../core/skill-capability-manifest-types'

export const TRACK_ALL_QUALIFICATION_FIXTURE_KEYS = [
  'track_all.fixture.authority_rejections',
  'track_all.fixture.selected_targets',
  'track_all.fixture.concept_exclusions',
  'track_all.fixture.target_ambiguity',
  'track_all.fixture.occlusion_reentry_identity',
  'track_all.fixture.shot_chunk_overlap',
  'track_all.fixture.multiplex_budgets',
  'track_all.fixture.privacy_fail_closed',
  'track_all.fixture.flattened_privacy_preview',
  'track_all.fixture.camera_motion',
  'track_all.fixture.planar_homography',
  'track_all.fixture.focus_treatments',
  'track_all.fixture.reframe_trajectories',
  'track_all.fixture.visual_intelligence_dependency',
  'track_all.fixture.track_graph_compatibility',
  'track_all.fixture.bounded_repairs',
  'track_all.fixture.session_terminal_close',
  'track_all.fixture.runtime_security',
  'track_all.fixture.public_plugin_lifecycle',
  'track_all.fixture.legacy_retirement',
  'track_all.fixture.qualification_integrity',
] as const

export const TRACK_ALL_QUALIFICATION_FIXTURES: readonly SkillQualificationFixtureDefinition[] =
  TRACK_ALL_QUALIFICATION_FIXTURE_KEYS.map((fixtureKey) => ({
    fixtureKey,
    minimumStatus: 'planning_qualified' as const,
    description: `Track All ${fixtureKey.split('.').at(-1)?.replaceAll('_', ' ')} evidence.`,
  }))

export const TRACK_ALL_ROUTE_QUALIFICATION_KEYS = [
  'planning_core_route',
  'deterministic_geometry_route',
  'planar_tracking_route',
  'existing_track_repair_route',
  'privacy_redaction_route',
  'focus_route',
  'reframe_route',
  'public_plugin_lifecycle_route',
  'sam3_1_masklet_route',
  'production_worker_route',
] as const

export type TrackAllRouteQualificationKey =
  (typeof TRACK_ALL_ROUTE_QUALIFICATION_KEYS)[number]
