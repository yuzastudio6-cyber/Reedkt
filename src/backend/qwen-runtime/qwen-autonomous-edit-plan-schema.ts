import { z } from 'zod'
import { CREATIVE_SKILL_KEYS } from '../../types/creative-skills-core'
import type {
  AutonomousEditOperationId,
  AutonomousEditPlanCandidate,
} from '../../types'

const safeText = (max: number) => z.string().trim().min(1).max(max)
const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'Color must be a six-digit hex value.')

const captionExecutionSpecSchema = z.object({
  kind: z.literal('caption'),
  placement: z.enum(['auto_face_safe', 'top_safe', 'middle_safe', 'bottom_safe', 'lower_third']),
  typography: z.enum(['clean_bold', 'editorial_bold', 'minimal', 'documentary']),
  textCase: z.enum(['sentence', 'upper']),
  emphasis: z.enum(['none', 'keyword_color', 'keyword_scale', 'keyword_color_and_scale']),
  animation: z.enum(['none', 'phrase_fade_up', 'keyword_pop', 'word_pop']),
  accentColor: color,
  maxWordsPerCue: z.number().int().min(2).max(9),
  maxLines: z.union([z.literal(1), z.literal(2)]),
  emphasisTerms: z.array(safeText(80)).max(24),
}).strict()

const graphicMotionSchema = z.object({
  enter: z.enum(['none', 'fade', 'fade_up', 'slide_left', 'slide_right']),
  exit: z.enum(['none', 'fade', 'fade_down']),
  enterDurationSeconds: z.number().min(0).max(1.5),
  exitDurationSeconds: z.number().min(0).max(1.5),
}).strict()

const graphicExecutionSpecSchema = z.object({
  kind: z.literal('graphic'),
  graphicId: safeText(120),
  graphicType: z.enum(['label', 'lower_third', 'callout', 'process_steps', 'stat_card', 'evidence_card', 'comparison', 'timeline']),
  title: safeText(180),
  bodyLines: z.array(safeText(180)).max(8),
  sourceLabel: safeText(120).optional(),
  placement: z.enum(['auto_safe', 'top_left', 'top_right', 'middle_left', 'middle_right', 'bottom_left', 'bottom_right', 'center']),
  visualStyle: z.enum(['clean_panel', 'accent_label', 'outline_card', 'editorial_card']),
  accentColor: color,
  startOffsetSeconds: z.number().min(0),
  endOffsetSeconds: z.number().positive(),
  motion: graphicMotionSchema,
  contentEvidenceRefs: z.array(safeText(240)).min(1).max(24),
}).strict().refine((value) => value.endOffsetSeconds > value.startOffsetSeconds, {
  message: 'Graphic end offset must be greater than its start offset.',
})

const graphicMotionExecutionSpecSchema = z.object({
  kind: z.literal('graphic_motion'),
  targetGraphicId: safeText(120),
  enter: graphicMotionSchema.shape.enter,
  exit: graphicMotionSchema.shape.exit,
  enterDurationSeconds: graphicMotionSchema.shape.enterDurationSeconds,
  exitDurationSeconds: graphicMotionSchema.shape.exitDurationSeconds,
}).strict()

const audioExecutionSpecSchema = z.object({
  kind: z.literal('audio'),
  denoise: z.enum(['none', 'light_fft', 'medium_fft']),
  normalize: z.boolean(),
  targetLufs: z.number().min(-24).max(-10),
  truePeakDb: z.number().min(-6).max(-0.1),
  highpassHz: z.union([z.literal(0), z.literal(60), z.literal(70), z.literal(80), z.literal(90), z.literal(100), z.literal(120)]),
  lowpassHz: z.union([z.literal(0), z.literal(12000), z.literal(14000), z.literal(16000), z.literal(18000), z.literal(20000)]),
  voiceCompression: z.enum(['none', 'light']),
  evidenceBasis: z.array(safeText(240)).min(1).max(16),
}).strict()

const colorExecutionSpecSchema = z.object({
  kind: z.literal('color'),
  brightness: z.number().min(-0.08).max(0.08),
  contrast: z.number().min(0.85).max(1.2),
  saturation: z.number().min(0.8).max(1.25),
  gamma: z.number().min(0.8).max(1.2),
  warmth: z.number().min(-0.08).max(0.08),
  preserveNaturalSkin: z.boolean(),
  evidenceBasis: z.array(safeText(240)).min(1).max(16),
}).strict()

export const autonomousEditOperationExecutionSpecSchema = z.discriminatedUnion('kind', [
  captionExecutionSpecSchema,
  graphicExecutionSpecSchema,
  graphicMotionExecutionSpecSchema,
  audioExecutionSpecSchema,
  colorExecutionSpecSchema,
])

export const autonomousEditOperationIds = [
  'timeline.select',
  'timeline.trim',
  'timeline.smart_cut',
  'caption.generate',
  'caption.align',
  'caption.style',
  'graphics.compose',
  'graphics.animate',
  'broll.select',
  'broll.generate',
  'audio.cleanup',
  'audio.loudness.normalize',
  'audio.music.plan',
  'audio.sfx.plan',
  'color.correct',
  'color.grade',
  'transition.apply',
  'render.compose',
  'qa.validate',
] as const satisfies readonly AutonomousEditOperationId[]

const operationSchema = z.object({
  operationId: z.enum(autonomousEditOperationIds),
  instruction: safeText(1600),
  rationale: safeText(1200),
  skillKeys: z.array(z.enum(CREATIVE_SKILL_KEYS)).min(1).max(20),
  sourceEvidenceRefs: z.array(safeText(240)).min(1).max(24),
  requiredQaChecks: z.array(safeText(160)).min(1).max(24),
  executionSpec: autonomousEditOperationExecutionSpecSchema.optional(),
}).strict()

const segmentSchema = z.object({
  id: safeText(160),
  role: z.enum(['hook', 'setup', 'context', 'main_body', 'proof', 'transition', 'ending']),
  sourceStartSeconds: z.number().nonnegative(),
  sourceEndSeconds: z.number().positive(),
  objective: safeText(1000),
  narrativeReason: safeText(1200),
  transcriptEvidence: z.array(safeText(600)).max(12),
  visualEvidence: z.array(safeText(600)).max(12),
  operations: z.array(operationSchema).min(1).max(24),
  captionDirection: safeText(1200),
  visualDirection: safeText(1600),
  audioDirection: safeText(1200),
  transitionDirection: safeText(1000),
  requiredQaChecks: z.array(safeText(160)).min(1).max(30),
}).strict().refine((value) => value.sourceEndSeconds > value.sourceStartSeconds, {
  message: 'Segment sourceEndSeconds must be greater than sourceStartSeconds.',
})

export const autonomousEditPlanCandidateSchema = z.object({
  status: z.enum(['ready_for_approval', 'needs_clarification', 'blocked']),
  title: safeText(180),
  summary: safeText(4000),
  userIntentSummary: safeText(3000),
  storyStrategy: safeText(4000),
  segments: z.array(segmentSchema).min(1).max(80),
  skillSelections: z.array(z.object({
    skillKey: z.enum(CREATIVE_SKILL_KEYS),
    reason: safeText(1200),
    required: z.boolean(),
    segmentIds: z.array(safeText(160)).min(1).max(80),
    operationIds: z.array(z.enum(autonomousEditOperationIds)).min(1).max(24),
  }).strict()).min(1).max(120),
  globalQaChecks: z.array(safeText(160)).min(1).max(60),
  clarificationQuestions: z.array(safeText(800)).max(12),
  blockers: z.array(safeText(300)).max(24),
}).strict() satisfies z.ZodType<AutonomousEditPlanCandidate>
