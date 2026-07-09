import type { CreativeSkillKey } from '../types'

export type ProjectEditPlanDirectionSource =
  | 'saved_edit_brief'
  | 'chat_prompt'
  | 'default_professional_direction'

export type ProjectEditSkillActivityId =
  | 'story_cleanup'
  | 'captions_readability'
  | 'voice_polish'
  | 'visual_clarity'
  | 'motion_restraint'
  | 'color_finish'
  | 'private_review_qa'

export interface ProjectEditSkillPlanActivity {
  id: ProjectEditSkillActivityId
  label: string
  summary: string
  skillKeys: CreativeSkillKey[]
  approvalRequired: boolean
  executionMode: 'planning_only'
  productReady: false
}

export interface ProjectEditSkillPlanSummary {
  version: 'project-edit-skill-plan-v1'
  directionSource: ProjectEditPlanDirectionSource
  directionSummary: string
  activities: ProjectEditSkillPlanActivity[]
  selectedSkillKeys: CreativeSkillKey[]
  blockedSkillKeys: CreativeSkillKey[]
  planningOnly: true
  exposesInternalToolNames: false
  productReady: false
  warnings: string[]
}

export interface BuildProjectEditSkillPlanInput {
  briefSaved: boolean
  directionText?: string
  sourceDurationSeconds?: number
}

const defaultProfessionalDirection =
  'Create a clean professional edit with source-order preservation, phrase-safe pacing, readable captions when speech is present, voice-first audio, natural color, and no unapproved generated visuals.'

function normalizeDirection(value?: string): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

export function resolveProjectEditPlanDirection(input: {
  briefSaved: boolean
  directionText?: string
}): {
  source: ProjectEditPlanDirectionSource
  text: string
} {
  const text = normalizeDirection(input.directionText)
  if (input.briefSaved && text) {
    return { source: 'saved_edit_brief', text }
  }
  if (text) {
    return { source: 'chat_prompt', text }
  }
  return { source: 'default_professional_direction', text: defaultProfessionalDirection }
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function uniqueSkillKeys(activities: ProjectEditSkillPlanActivity[], blockedSkillKeys: CreativeSkillKey[]): CreativeSkillKey[] {
  return [...new Set([
    ...activities.flatMap((activity) => activity.skillKeys),
    ...blockedSkillKeys,
  ])]
}

export function buildProjectEditSkillPlan(input: BuildProjectEditSkillPlanInput): ProjectEditSkillPlanSummary {
  const direction = resolveProjectEditPlanDirection({
    briefSaved: input.briefSaved,
    directionText: input.directionText,
  })
  const normalized = direction.text.toLowerCase()
  const blocksCaptions = hasAny(normalized, [/no captions?/, /without captions?/, /no subtitles?/])
  const blocksMusic = hasAny(normalized, [/no music/, /without music/, /voice only/])
  const blocksMotion = hasAny(normalized, [/no motion/, /no animation/, /static only/])
  const wantsVisuals = hasAny(normalized, [
    /graphic/,
    /diagram/,
    /chart/,
    /callout/,
    /overlay/,
    /visual/,
    /proof/,
    /b-?roll/,
    /explain/,
  ])
  const wantsMotion = !blocksMotion && hasAny(normalized, [/motion/, /animate/, /animated/, /transition/, /beat/])
  const wantsAudio = !blocksMusic && hasAny(normalized, [/music/, /sound/, /sfx/, /beat/, /audio/, /voice/])
  const wantsColor = hasAny(normalized, [/color/, /cinematic/, /natural/, /clean/, /polish/, /finish/])
  const durationSeconds = Math.max(1, Math.min(Math.ceil(input.sourceDurationSeconds ?? 60), 600))
  const activities: ProjectEditSkillPlanActivity[] = [
    {
      id: 'story_cleanup',
      label: 'Story cleanup',
      summary: 'Shape the source into a clear, phrase-safe first pass without changing meaning.',
      skillKeys: [
        'clean_cuts',
        'pacing_cleanup',
        'source_order_preservation',
        'recommended_structure_planning',
      ],
      approvalRequired: true,
      executionMode: 'planning_only',
      productReady: false,
    },
    {
      id: 'captions_readability',
      label: blocksCaptions ? 'Caption restraint' : 'Captions and readability',
      summary: blocksCaptions
        ? 'Respect the request to avoid captions unless a later approval changes it.'
        : 'Plan readable captions with safe placement and speech-first timing.',
      skillKeys: blocksCaptions
        ? ['no_captions']
        : ['caption_design', 'caption_line_breaking', 'caption_readability_qa'],
      approvalRequired: !blocksCaptions,
      executionMode: 'planning_only',
      productReady: false,
    },
    {
      id: 'voice_polish',
      label: 'Voice polish',
      summary: wantsAudio
        ? 'Keep speech clear while planning any music or sound treatment around the voice.'
        : 'Keep audio treatment restrained and voice-first for the initial test plan.',
      skillKeys: wantsAudio
        ? ['voice_cleanup_planning', 'audio_leveling_planning', 'music_ducking_planning']
        : ['voice_cleanup_planning', 'room_tone_preservation'],
      approvalRequired: wantsAudio,
      executionMode: 'planning_only',
      productReady: false,
    },
    {
      id: 'visual_clarity',
      label: wantsVisuals ? 'Visual clarity' : 'Visual restraint',
      summary: wantsVisuals
        ? 'Plan only useful visual support such as callouts, proof cards, or simple explainers.'
        : 'Avoid unnecessary graphics and keep the source video as the visual base layer.',
      skillKeys: wantsVisuals
        ? ['graphic_design_visual_explain', 'feature_callout_design', 'safe_zone_layout']
        : ['no_graphic_design', 'no_overlay', 'safe_zone_layout'],
      approvalRequired: wantsVisuals,
      executionMode: 'planning_only',
      productReady: false,
    },
    {
      id: 'motion_restraint',
      label: wantsMotion ? 'Motivated motion' : 'Motion restraint',
      summary: wantsMotion
        ? 'Use motion only where it helps pacing, readability, or transitions.'
        : 'Keep movement clean and avoid random transitions or effects.',
      skillKeys: wantsMotion
        ? ['motion_design_overlay', 'clean_cut_transition', 'beat_aware_motion']
        : ['no_motion_design', 'clean_cut_transition'],
      approvalRequired: wantsMotion,
      executionMode: 'planning_only',
      productReady: false,
    },
    {
      id: 'color_finish',
      label: 'Color finish',
      summary: wantsColor
        ? 'Plan a believable clean finish that preserves source truth.'
        : 'Keep color natural and avoid an overprocessed look.',
      skillKeys: ['color_mood_planning', 'color_consistency_planning'],
      approvalRequired: false,
      executionMode: 'planning_only',
      productReady: false,
    },
    {
      id: 'private_review_qa',
      label: 'Private review checks',
      summary: `Plan QA for the approved private review path before any final delivery claim. Source duration is capped at ${durationSeconds}s for local planning evidence.`,
      skillKeys: [
        'professional_edit_qa',
        'skill_plan_qa',
        'credit_approval_qa',
        'user_instruction_compliance_qa',
        'source_safety_qa',
      ],
      approvalRequired: true,
      executionMode: 'planning_only',
      productReady: false,
    },
  ]
  const blockedSkillKeys: CreativeSkillKey[] = [
    ...(blocksCaptions ? ['caption_design' as const] : []),
    ...(blocksMusic ? ['soundsync_music_planning' as const, 'sfx_design' as const] : []),
    ...(blocksMotion ? ['motion_design_overlay' as const, 'real_motion_overlay' as const] : []),
  ]

  return {
    version: 'project-edit-skill-plan-v1',
    directionSource: direction.source,
    directionSummary: direction.text,
    activities,
    selectedSkillKeys: uniqueSkillKeys(activities, []),
    blockedSkillKeys,
    planningOnly: true,
    exposesInternalToolNames: false,
    productReady: false,
    warnings: [
      'Skill activity planning is user-facing summary metadata only; it does not execute tools, call providers, render media, or approve production use.',
      'Developer-visible tool names stay out of the normal edit chat activity cards.',
    ],
  }
}
