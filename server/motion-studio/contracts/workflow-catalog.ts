import type {
  MotionStudioArtifactKind,
  MotionStudioStage,
  MotionStudioWorkflowBoundary,
  MotionStudioWorkflowDefinition,
  ProductionMode,
} from '../../../src/types/motion-studio'

const allModes: ProductionMode[] = [
  'generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed',
]

function boundary(description: string, durableRecordKinds: string[], idempotencyRequired = true): MotionStudioWorkflowBoundary {
  return { description, durableRecordKinds, idempotencyRequired }
}

function workflow(input: {
  id: string
  label: string
  stage: MotionStudioStage
  inputs: MotionStudioArtifactKind[]
  outputs: MotionStudioArtifactKind[]
  skills: string[]
  tools: string[]
  modes?: ProductionMode[]
  approval?: string
  transaction?: string
  job?: string
  cost?: string
}): MotionStudioWorkflowDefinition {
  return {
    id: input.id,
    label: input.label,
    stage: input.stage,
    supportedProductionModes: input.modes ?? allModes,
    inputArtifactKinds: input.inputs,
    outputArtifactKinds: input.outputs,
    skillNodeIds: input.skills,
    toolCapabilityIds: input.tools,
    approval: boundary(input.approval ?? 'Exact input versions must be reviewed before the workflow advances.', ['approval_record', 'approved_snapshot'], false),
    transaction: boundary(input.transaction ?? 'Create the immutable output version, dependency edges, audit event, and pointer update atomically.', ['artifact_version', 'artifact_dependency', 'audit_event']),
    job: boundary(input.job ?? 'Derive durable work only from an approved snapshot; no browser-owned execution.', ['work_item', 'job', 'job_attempt']),
    cost: boundary(input.cost ?? 'Estimate internal cost, freeze rate-card versions, and enforce maximum authorization before paid work.', ['production_cost_estimate', 'production_cost_budget', 'production_usage_event']),
    retryPolicy: ['Record every attempt separately.', 'Remain inside approved fallback and maximum internal-cost authorization.'],
    cancellationPolicy: ['Stop unsent work.', 'Retain incurred attempt usage.', 'Release unused internal-cost authorization.'],
    failureRecovery: ['Isolate local failures.', 'Use only approved fallback routes.', 'Request review or new approval for material changes.'],
    observabilityEvidence: ['approved snapshot identity', 'artifact input/output digests', 'job and attempt lineage', 'cost usage evidence', 'QA result'],
    completionEvidence: ['immutable output version', 'dependency reconciliation', 'quality-gate result', 'audit event'],
    runtimeImplemented: false,
  }
}

export const MOTION_STUDIO_WORKFLOW_CATALOG: MotionStudioWorkflowDefinition[] = [
  workflow({ id: 'production.create_or_enable', label: 'Create or enable production', stage: 'director_brief', inputs: ['production_brief'], outputs: ['production_brief'], skills: ['motion_studio.domain.project_understanding'], tools: ['ffprobe'], job: 'Reuse existing project and edit-session creation; create only the one-to-one production extension.' }),
  workflow({ id: 'intake.prepared_project', label: 'Prepared-project intake', stage: 'director_brief', inputs: ['production_brief'], outputs: ['story_bible', 'visual_coverage_plan'], skills: ['motion_studio.domain.project_understanding'], tools: ['ffprobe', 'paddleocr'] }),
  workflow({ id: 'story.idea_to_story', label: 'Idea to story', stage: 'story_understanding', inputs: ['production_brief'], outputs: ['story_bible'], skills: ['motion_studio.domain.story_and_script_development'], tools: ['duckdb'] }),
  workflow({ id: 'research.story', label: 'Story research', stage: 'research', inputs: ['story_bible'], outputs: ['research_pack', 'claim_ledger'], skills: ['motion_studio.domain.story_research', 'motion_studio.domain.claim_verification'], tools: ['playwright', 'paddleocr'] }),
  workflow({ id: 'research.visual_assets', label: 'Visual asset research', stage: 'research', inputs: ['research_pack'], outputs: ['visual_coverage_plan'], skills: ['motion_studio.domain.visual_asset_research'], tools: ['playwright', 'paddleocr'] }),
  workflow({ id: 'reference.analyze', label: 'Reference analysis', stage: 'references', inputs: ['reference_contract'], outputs: ['reference_contract', 'motion_dna'], skills: ['motion_studio.domain.reference_intelligence'], tools: ['ffprobe', 'pyscenedetect'] }),
  workflow({ id: 'script.approve', label: 'Script approval', stage: 'story_script', inputs: ['story_bible', 'claim_ledger'], outputs: ['story_bible'], skills: ['motion_studio.domain.story_and_script_development'], tools: ['faster_whisper'], approval: 'Approve the exact timed script/story version and claim coverage before narration or expensive visuals.' }),
  workflow({ id: 'voice.generate_or_upload', label: 'Voice generation or uploaded narration', stage: 'voice', inputs: ['story_bible', 'voice_bible'], outputs: ['voice_bible'], skills: ['motion_studio.domain.voice'], tools: ['ffmpeg', 'ffprobe', 'faster_whisper'], cost: 'Generated speech requires an authorized internal-cost budget; uploaded narration records processing cost only.' }),
  workflow({ id: 'motion_dna.create', label: 'Motion DNA and Motion Language', stage: 'motion_dna', inputs: ['reference_contract', 'story_bible'], outputs: ['motion_dna', 'motion_language', 'motion_strategy'], skills: ['motion_studio.domain.motion_dna_and_creative_direction'], tools: ['sharp', 'opencv'] }),
  workflow({ id: 'calibration_reel.create', label: 'Calibration reel', stage: 'calibration_reel', inputs: ['motion_dna', 'motion_strategy'], outputs: ['storyboard', 'animatic'], skills: ['motion_studio.domain.motion_dna_and_creative_direction', 'motion_studio.domain.quality_control'], tools: ['remotion', 'ffprobe'], approval: 'Approve representative visual routes before production-scale generation.' }),
  workflow({ id: 'scene.plan', label: 'Scene planning', stage: 'scene_board', inputs: ['story_bible', 'motion_strategy', 'motion_language', 'narrative_function'], outputs: ['scene_graph', 'scene_recipe', 'scene_document'], skills: ['motion_studio.domain.hybrid_composition'], tools: ['opentimelineio', 'hyperframe'] }),
  workflow({ id: 'storyboard.create', label: 'Storyboard', stage: 'storyboard', inputs: ['scene_graph', 'motion_dna', 'motion_language'], outputs: ['storyboard'], skills: ['motion_studio.domain.native_graphic_design'], tools: ['sharp', 'satori'] }),
  workflow({ id: 'animatic.create', label: 'Animatic', stage: 'animatic', inputs: ['storyboard', 'voice_bible'], outputs: ['animatic'], skills: ['motion_studio.domain.editing'], tools: ['remotion', 'ffmpeg', 'libass'] }),
  workflow({ id: 'scene.native_graphics', label: 'Native graphics scene', stage: 'scene_editor', inputs: ['scene_document', 'layer_plan'], outputs: ['scene_document'], skills: ['motion_studio.domain.native_graphic_design'], tools: ['remotion', 'd3', 'echarts', 'svg_js'], modes: ['native_graphics_first', 'hybrid_directed'] }),
  workflow({ id: 'scene.layered_image_motion', label: 'Layered image motion scene', stage: 'scene_editor', inputs: ['scene_document', 'layer_plan'], outputs: ['scene_document'], skills: ['motion_studio.domain.layered_motion'], tools: ['sharp', 'rembg', 'konva', 'remotion'], modes: ['layered_first', 'hybrid_directed'] }),
  workflow({ id: 'scene.generated_motion', label: 'Generated motion scene', stage: 'scene_editor', inputs: ['scene_document', 'motion_dna', 'motion_language'], outputs: ['scene_document'], skills: ['motion_studio.domain.generative_motion'], tools: ['ffprobe', 'remotion'], modes: ['generative_first', 'hybrid_directed'] }),
  workflow({ id: 'scene.footage_edit', label: 'Footage editing scene', stage: 'scene_editor', inputs: ['scene_document', 'layer_plan'], outputs: ['scene_document'], skills: ['motion_studio.domain.footage_motion', 'motion_studio.domain.editing'], tools: ['ffmpeg', 'ffprobe', 'opencolorio'], modes: ['footage_first', 'hybrid_directed'] }),
  workflow({ id: 'scene.hybrid', label: 'Hybrid scene', stage: 'scene_editor', inputs: ['scene_document', 'layer_plan', 'motion_dna'], outputs: ['scene_document'], skills: ['motion_studio.domain.hybrid_composition'], tools: ['remotion', 'ffmpeg', 'sharp'], modes: ['hybrid_directed'] }),
  workflow({ id: 'music.generate', label: 'Music generation', stage: 'sound_music', inputs: ['music_bible', 'cue_sheet'], outputs: ['music_bible', 'cue_sheet'], skills: ['motion_studio.domain.music'], tools: ['audioflux', 'ffmpeg'], cost: 'Generated score requires an authorized internal-cost budget and attempt-level usage.' }),
  workflow({ id: 'music.upload_stems', label: 'Music and stem upload', stage: 'sound_music', inputs: ['music_bible'], outputs: ['music_bible', 'cue_sheet'], skills: ['motion_studio.domain.music'], tools: ['ffprobe', 'ffmpeg'], cost: 'Record storage, processing, analysis, and delivery cost without generation cost.' }),
  workflow({ id: 'audio.synchronized_foley', label: 'Synchronized Foley and ambience', stage: 'sound_music', inputs: ['cue_sheet', 'scene_document'], outputs: ['sound_event_plan', 'cue_sheet'], skills: ['motion_studio.domain.synchronized_foley'], tools: ['ffprobe', 'ffmpeg'], cost: 'Synchronized audio generation requires per-attempt internal-cost authorization.' }),
  workflow({ id: 'picture.lock', label: 'Picture lock', stage: 'picture_lock', inputs: ['animatic', 'scene_document'], outputs: ['fine_cut'], skills: ['motion_studio.domain.editing'], tools: ['opentimelineio', 'ffprobe'], approval: 'Picture lock freezes exact scene/timing versions and creates property locks.' }),
  workflow({ id: 'fine_cut.create', label: 'Fine Cut', stage: 'fine_cut', inputs: ['fine_cut', 'cue_sheet'], outputs: ['fine_cut'], skills: ['motion_studio.domain.editing'], tools: ['remotion', 'ffmpeg', 'libass'] }),
  workflow({ id: 'quality_control.run', label: 'Quality Control', stage: 'quality_control', inputs: ['fine_cut', 'claim_ledger'], outputs: ['quality_report'], skills: ['motion_studio.domain.quality_control'], tools: ['ffprobe', 'opencv', 'pyloudnorm'] }),
  workflow({ id: 'delivery.export', label: 'Delivery and export', stage: 'delivery', inputs: ['fine_cut', 'quality_report'], outputs: ['export_manifest'], skills: ['motion_studio.domain.delivery'], tools: ['remotion', 'ffmpeg', 'ffprobe'], approval: 'Delivery requires exact fine-cut and blocking-QA approval; hand off to the existing export system.' }),
  workflow({ id: 'revision.invalidate_and_replan', label: 'Revision and dependency invalidation', stage: 'scene_editor', inputs: ['scene_document'], outputs: ['scene_document'], skills: ['motion_studio.domain.editing', 'motion_studio.domain.quality_control'], tools: ['opentimelineio'], transaction: 'Create a new artifact version and append invalidations without mutating approved versions.' }),
  workflow({ id: 'cost.estimate_and_reconcile', label: 'Cost estimation and reconciliation', stage: 'quality_control', inputs: ['scene_graph'], outputs: ['quality_report'], skills: ['motion_studio.domain.quality_control'], tools: ['ffprobe'], approval: 'Maximum internal-cost authorization is separate from customer pricing and credits.', transaction: 'Freeze rate-card versions, estimate items, usage, actuals, reconciliation, and adjustments atomically where required.' }),
]

export function listMotionStudioWorkflowDefinitions(): MotionStudioWorkflowDefinition[] {
  return [...MOTION_STUDIO_WORKFLOW_CATALOG]
}
