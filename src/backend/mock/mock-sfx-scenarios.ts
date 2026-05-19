import type {
  SFXDecisionState,
  SFXProvider,
  SFXTargetLayer,
} from '../../types'
import type { EditComplexity } from '../../types/planning'
import type { SFXPlanningContext } from '../contracts/sfx-director-contracts'

export interface MockSFXScenario extends SFXPlanningContext {
  id: string
  label: string
  expectedSFXDecisions: SFXDecisionState[]
  expectedTargetLayers: SFXTargetLayer[]
  expectedProviderRoutes: SFXProvider[]
  expectedAvoidedSFX: string[]
}

const workspaceId = 'mock-workspace-reeditpro'

function scenario(input: Omit<MockSFXScenario, 'workspaceId' | 'projectId' | 'editPlanId'> & {
  editComplexity: EditComplexity
}): MockSFXScenario {
  return {
    workspaceId,
    projectId: `mock-sfx-project-${input.id}`,
    editPlanId: `mock-sfx-edit-plan-${input.id}`,
    ...input,
  }
}

export const mockSFXScenarios: MockSFXScenario[] = [
  scenario({
    id: 'lake-como-luxury-lifestyle',
    label: 'Lake Como luxury lifestyle vacation',
    userPrompt: 'Create a luxury Lake Como lifestyle vacation edit with teaser, boat movement, chapter cards, food and social scenes, dialogue, and outro.',
    videoType: 'luxury lifestyle vacation',
    workflowContext: 'travel_vlog',
    editComplexity: 'premium_signature_edit',
    transcriptSummary: 'Short dialogue and location notes appear between montage sections.',
    sceneSummaries: ['Terrace opening', 'Boat movement montage', 'Chapter card', 'Restaurant social scene', 'Outro CTA'],
    audioEnvironmentSummary: 'Natural lake and restaurant ambience should be preserved, not replaced.',
    musicPlanSummary: 'Premium music bed with montage lift and voice-first ducking.',
    userSFXInstructions: ['Use subtle premium polish only where it improves transitions and reveals.'],
    avoidSFXInstructions: ['Do not add fake water everywhere.', 'Do not add footsteps by default.', 'Do not cover dialogue.'],
    speechPresent: true,
    musicPresent: true,
    ambienceImportant: true,
    expectedSFXDecisions: ['optional', 'needed'],
    expectedTargetLayers: ['title_card', 'transition', 'chapter_card', 'montage_hit', 'ambient_bridge', 'cta_reveal'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5', 'reeditpro_internal_library', 'mmaudio_v'],
    expectedAvoidedSFX: ['fake water everywhere', 'footsteps by default', 'SFX over dialogue'],
  }),
  scenario({
    id: 'paris-lifestyle-vlog',
    label: 'Paris lifestyle vlog',
    userPrompt: 'Make a polished Paris lifestyle vlog with soft transitions, cafe ambience, and a clean end card.',
    videoType: 'lifestyle travel vlog',
    workflowContext: 'travel_vlog',
    editComplexity: 'pro_edit',
    transcriptSummary: 'Light narration appears over travel B-roll.',
    sceneSummaries: ['Street arrival', 'Cafe detail', 'Soft chapter reveal', 'End card'],
    audioEnvironmentSummary: 'Source ambience is usable and should remain natural.',
    musicPlanSummary: 'Warm social bed, ducked under narration.',
    speechPresent: true,
    musicPresent: true,
    ambienceImportant: true,
    expectedSFXDecisions: ['optional'],
    expectedTargetLayers: ['transition', 'chapter_card', 'ambient_bridge', 'cta_reveal'],
    expectedProviderRoutes: ['reeditpro_internal_library', 'mmaudio_v'],
    expectedAvoidedSFX: ['random street foley', 'footsteps by default'],
  }),
  scenario({
    id: 'simple-talking-head-clean-edit',
    label: 'Simple talking-head clean edit',
    userPrompt: 'Keep this as a simple clean talking-head edit. No sound effects.',
    videoType: 'talking_head',
    workflowContext: 'clean_edit',
    editComplexity: 'basic_edit',
    transcriptSummary: 'Speaker explains one idea directly to camera.',
    sceneSummaries: ['One camera talking-head section'],
    audioEnvironmentSummary: 'Clean voice and room tone.',
    musicPlanSummary: 'No music or very low bed.',
    avoidSFXInstructions: ['No SFX.'],
    speechPresent: true,
    musicPresent: false,
    ambienceImportant: true,
    expectedSFXDecisions: ['avoid', 'not_needed'],
    expectedTargetLayers: ['none'],
    expectedProviderRoutes: ['no_sfx'],
    expectedAvoidedSFX: ['decorative transition hits', 'fake source action sounds'],
  }),
  scenario({
    id: 'faith-bible-teaching',
    label: 'Faith/Bible teaching',
    userPrompt: 'Edit this Bible teaching respectfully. Avoid distracting sound effects.',
    videoType: 'faith teaching',
    workflowContext: 'teaching',
    editComplexity: 'pro_edit',
    transcriptSummary: 'Speaker teaches a serious faith passage with emotional pauses.',
    sceneSummaries: ['Teaching section', 'Reflective pause', 'Simple verse card'],
    audioEnvironmentSummary: 'Voice clarity is the priority.',
    musicPlanSummary: 'Optional low reflective bed only.',
    avoidSFXInstructions: ['Avoid cheap hits.', 'No transition whooshes under teaching.'],
    speechPresent: true,
    musicPresent: true,
    ambienceImportant: true,
    expectedSFXDecisions: ['avoid'],
    expectedTargetLayers: ['none'],
    expectedProviderRoutes: ['no_sfx'],
    expectedAvoidedSFX: ['cheap hits', 'loud whooshes', 'SFX during emotional pause'],
  }),
  scenario({
    id: 'real-estate-luxury-walkthrough',
    label: 'Real estate luxury walkthrough',
    userPrompt: 'Create a premium real estate walkthrough with soft title cards and elegant transitions.',
    videoType: 'luxury real estate',
    workflowContext: 'real_estate',
    editComplexity: 'signature_edit',
    transcriptSummary: 'Agent voiceover appears between room visuals.',
    sceneSummaries: ['Entry title card', 'Living room move', 'Kitchen chapter card', 'Exterior CTA'],
    audioEnvironmentSummary: 'Natural room tone matters.',
    musicPlanSummary: 'Premium soft music under voice.',
    speechPresent: true,
    musicPresent: true,
    ambienceImportant: true,
    expectedSFXDecisions: ['optional', 'needed'],
    expectedTargetLayers: ['title_card', 'transition', 'chapter_card', 'cta_reveal'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5', 'reeditpro_internal_library'],
    expectedAvoidedSFX: ['viral whooshes', 'loud impacts'],
  }),
  scenario({
    id: 'fitness-high-energy-social',
    label: 'Fitness high-energy social',
    userPrompt: 'Make this a high-energy fitness social edit with beat accents in the workout montage.',
    videoType: 'fitness high-energy social',
    workflowContext: 'social_short',
    editComplexity: 'pro_edit',
    transcriptSummary: 'Minimal speech, mostly movement montage.',
    sceneSummaries: ['Warmup', 'Workout montage', 'Transformation title', 'CTA'],
    audioEnvironmentSummary: 'Source workout audio can stay low.',
    musicPlanSummary: 'Beat-driven music bed.',
    speechPresent: false,
    musicPresent: true,
    ambienceImportant: false,
    expectedSFXDecisions: ['optional', 'needed'],
    expectedTargetLayers: ['montage_hit', 'transition', 'title_card', 'cta_reveal'],
    expectedProviderRoutes: ['reeditpro_internal_library', 'mmaudio_v', 'mirelo_sfx_v1_5'],
    expectedAvoidedSFX: ['random gym foley'],
  }),
  scenario({
    id: 'product-saas-demo',
    label: 'Product/SaaS demo',
    userPrompt: 'Turn this SaaS demo into a clean product explanation with VisualExplain cards and a CTA.',
    videoType: 'product demo',
    workflowContext: 'saas_demo',
    editComplexity: 'pro_edit',
    transcriptSummary: 'Presenter explains three product steps.',
    sceneSummaries: ['Dashboard highlight', 'Graphic comparison card', 'CTA reveal'],
    audioEnvironmentSummary: 'Screen recording has no useful source sound.',
    musicPlanSummary: 'Low corporate bed under speech.',
    speechPresent: true,
    musicPresent: true,
    ambienceImportant: false,
    expectedSFXDecisions: ['optional'],
    expectedTargetLayers: ['graphic_design', 'cta_reveal'],
    expectedProviderRoutes: ['reeditpro_internal_library', 'mmaudio_v'],
    expectedAvoidedSFX: ['loud UI clicks under speech'],
  }),
  scenario({
    id: 'stroke-motion-story-explanation',
    label: 'Stroke Motion story explanation',
    userPrompt: 'Use Stroke Motion to explain the story beat with a subtle line draw sound.',
    videoType: 'educational explanation',
    workflowContext: 'stroke_motion',
    editComplexity: 'signature_edit',
    transcriptSummary: 'Speaker explains a concept while a line traces the relationship.',
    sceneSummaries: ['Stroke line draw', 'Circle complete moment'],
    audioEnvironmentSummary: 'Voice remains primary.',
    musicPlanSummary: 'Low educational bed.',
    speechPresent: true,
    musicPresent: true,
    ambienceImportant: false,
    expectedSFXDecisions: ['needed'],
    expectedTargetLayers: ['stroke_motion'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5', 'mmaudio_v'],
    expectedAvoidedSFX: ['loud marker scratch'],
  }),
  scenario({
    id: 'graphic-design-visualexplain',
    label: 'Graphic Design / VisualExplain educational overlay',
    userPrompt: 'Add VisualExplain cards with subtle reveal ticks for key labels.',
    videoType: 'education',
    workflowContext: 'visualexplain',
    editComplexity: 'signature_edit',
    transcriptSummary: 'Voiceover explains a process diagram.',
    sceneSummaries: ['Graphic card reveal', 'Diagram trace', 'List item tick'],
    audioEnvironmentSummary: 'Voice is clean.',
    musicPlanSummary: 'Very low music.',
    speechPresent: true,
    musicPresent: true,
    ambienceImportant: false,
    expectedSFXDecisions: ['optional', 'needed'],
    expectedTargetLayers: ['graphic_design'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5', 'reeditpro_internal_library'],
    expectedAvoidedSFX: ['busy clicks under every label'],
  }),
  scenario({
    id: 'real-motion-object-demonstration',
    label: 'Real Motion object demonstration',
    userPrompt: 'Use Real Motion for the product object entering and settling on the table.',
    videoType: 'product demonstration',
    workflowContext: 'real_motion',
    editComplexity: 'premium_signature_edit',
    transcriptSummary: 'Short product narration with a visual object demo.',
    sceneSummaries: ['Object enters frame', 'Object settles near title card'],
    audioEnvironmentSummary: 'Room tone should match the product scene.',
    musicPlanSummary: 'Clean low bed.',
    speechPresent: true,
    musicPresent: true,
    ambienceImportant: true,
    expectedSFXDecisions: ['needed'],
    expectedTargetLayers: ['real_motion'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5', 'mmaudio_v'],
    expectedAvoidedSFX: ['cinematic boom'],
  }),
  scenario({
    id: 'cta-reveal',
    label: 'CTA reveal',
    userPrompt: 'Add a clean CTA reveal at the end, subtle and not cheesy.',
    videoType: 'brand social',
    workflowContext: 'cta',
    editComplexity: 'pro_edit',
    transcriptSummary: 'Speaker ends with a short call to action.',
    sceneSummaries: ['CTA card reveal'],
    audioEnvironmentSummary: 'Voice ends before the CTA card.',
    musicPlanSummary: 'Music resolves under CTA.',
    speechPresent: false,
    musicPresent: true,
    ambienceImportant: false,
    expectedSFXDecisions: ['optional'],
    expectedTargetLayers: ['cta_reveal'],
    expectedProviderRoutes: ['reeditpro_internal_library', 'mmaudio_v'],
    expectedAvoidedSFX: ['cartoon chime'],
  }),
  scenario({
    id: 'silent-b-roll-source-repair',
    label: 'Silent B-roll source-footage repair',
    userPrompt: 'The B-roll is silent. Repair ambience only where it feels professionally necessary.',
    videoType: 'documentary b-roll',
    workflowContext: 'source_audio_repair',
    editComplexity: 'pro_edit',
    transcriptSummary: 'No speech during the silent B-roll section.',
    sceneSummaries: ['Silent exterior B-roll', 'Room tone missing'],
    audioEnvironmentSummary: 'Missing audio, silent B-roll, ambience repair needed.',
    musicPlanSummary: 'Sparse music bed.',
    userSFXInstructions: ['Repair ambience only.'],
    avoidSFXInstructions: ['Do not fake every action.'],
    speechPresent: false,
    musicPresent: true,
    ambienceImportant: true,
    expectedSFXDecisions: ['needs_user_confirmation'],
    expectedTargetLayers: ['source_footage_repair'],
    expectedProviderRoutes: ['reeditpro_internal_library', 'mmaudio_v'],
    expectedAvoidedSFX: ['fake footsteps', 'random source foley'],
  }),
]

export function getMockSFXScenarioById(id: string) {
  return mockSFXScenarios.find((scenarioItem) => scenarioItem.id === id)
}

export function getDefaultMockSFXScenario() {
  return mockSFXScenarios[0]
}

export function getLakeComoMockSFXScenario() {
  return getMockSFXScenarioById('lake-como-luxury-lifestyle') ?? getDefaultMockSFXScenario()
}

export function getNoSFXMockScenario() {
  return getMockSFXScenarioById('faith-bible-teaching') ?? getDefaultMockSFXScenario()
}

export function getSignatureMockSFXScenario() {
  return getMockSFXScenarioById('stroke-motion-story-explanation') ?? getDefaultMockSFXScenario()
}
