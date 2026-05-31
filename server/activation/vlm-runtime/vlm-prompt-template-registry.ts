import { buildVlmGeneratedFixtureManifest } from './vlm-generated-fixture-registry'
import type { VlmPromptTemplateSpec } from './vlm-runtime-types'

const systemInstruction = [
  'You are a bounded ReeditPro Phase 39C generated-fixture VLM QA worker.',
  'Use only the provided generated synthetic image and this fixed prompt.',
  'Return valid JSON only. Do not call tools, browse, request files, infer secrets, or claim real media processing.',
  'All boxes must be normalized 0..1 and approximate. Mark uncertainty instead of guessing.',
].join(' ')

export function buildVlmPromptTemplateManifest(runId: string, createdAt = new Date().toISOString()) {
  const fixtures = buildVlmGeneratedFixtureManifest(runId, createdAt).specs
  const templates: VlmPromptTemplateSpec[] = fixtures.map((fixture) => ({
    promptTemplateId: `phase39c_${fixture.fixtureId.replaceAll('-', '_')}_json_v1`,
    fixtureId: fixture.fixtureId,
    schemaId: 'phase39c_vlm_fixture_output_v1',
    systemInstruction,
    userInstruction: [
      fixture.safeZoneQuestion,
      'Return JSON with fixture_id, prompt_template_id, model_id, model_revision, runtime, objects, text_like_regions, safe_zone_suggestions, spatial_relations, uncertainty, blocked_actions, and qa_flags.',
      'Do not include markdown fences.',
    ].join(' '),
    rawPromptAllowed: false,
    providerCallAllowed: false,
    toolCallAllowed: false,
    outputFormat: 'json_only',
  }))
  return {
    phase: '39C' as const,
    runId,
    createdAt,
    schemaId: 'phase39c_vlm_fixture_output_v1',
    rawPromptAllowed: false,
    providerCallsAllowed: false,
    toolCallsAllowed: false,
    templates,
  }
}

export const phase39CVlmOutputSchema = {
  type: 'object',
  required: [
    'fixture_id',
    'prompt_template_id',
    'model_id',
    'model_revision',
    'runtime',
    'objects',
    'text_like_regions',
    'safe_zone_suggestions',
    'spatial_relations',
    'uncertainty',
    'blocked_actions',
    'qa_flags',
  ],
  additionalProperties: false,
  properties: {
    fixture_id: { type: 'string' },
    prompt_template_id: { type: 'string' },
    model_id: { type: 'string' },
    model_revision: { type: 'string' },
    runtime: { type: 'string' },
    objects: { type: 'array' },
    text_like_regions: { type: 'array' },
    safe_zone_suggestions: { type: 'array' },
    spatial_relations: { type: 'array' },
    uncertainty: { type: 'object' },
    blocked_actions: { type: 'array' },
    qa_flags: { type: 'array' },
  },
}
