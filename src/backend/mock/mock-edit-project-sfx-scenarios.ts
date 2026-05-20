import type { EditComplexity, SFXProvider, SFXTargetLayer } from '../../types'
import type { CreateEditProjectSFXIntegrationRequest, EditProjectSFXStatus } from '../contracts/sfx-director-contracts'

export interface MockEditProjectSFXScenario {
  id: string
  label: string
  description: string
  input: CreateEditProjectSFXIntegrationRequest
  expectedSFXEvents: SFXTargetLayer[]
  expectedProviderRoutes: SFXProvider[]
  expectedPromptProviders: SFXProvider[]
  expectedCreditStatus: 'not_needed' | 'awaiting_approval' | 'approved_reserved'
  expectedWorkerStatus: 'not_queued' | 'queued' | 'mock_generated' | 'blocked' | 'failed'
  expectedQAStatus: 'not_run' | 'passed' | 'failed' | 'warning'
  expectedLibraryDecision: Extract<EditProjectSFXStatus, 'project_only' | 'library_candidate' | 'skipped_no_sfx' | 'blocked' | 'qa_failed'>
}

const workspaceId = 'mock-workspace-reeditpro'

function scenario(input: {
  id: string
  label: string
  description: string
  editComplexity: EditComplexity
  videoTone?: string
  userInstructions: string[]
  avoidInstructions?: string[]
  editPlanApproved?: boolean
  creditApproved?: boolean
  creditReserved?: boolean
  runMockWorker?: boolean
  simulateApprovedLibraryMatch?: boolean
  simulateMockApproval?: boolean
  simulateQAFailure?: boolean
  providerUnavailable?: boolean
  expectedSFXEvents: SFXTargetLayer[]
  expectedProviderRoutes: SFXProvider[]
  expectedPromptProviders: SFXProvider[]
  expectedCreditStatus: MockEditProjectSFXScenario['expectedCreditStatus']
  expectedWorkerStatus: MockEditProjectSFXScenario['expectedWorkerStatus']
  expectedQAStatus: MockEditProjectSFXScenario['expectedQAStatus']
  expectedLibraryDecision: MockEditProjectSFXScenario['expectedLibraryDecision']
}): MockEditProjectSFXScenario {
  return {
    id: input.id,
    label: input.label,
    description: input.description,
    input: {
      workspaceId,
      projectId: `mock-project-sfx-${input.id}`,
      editPlanId: `mock-edit-plan-sfx-${input.id}`,
      chatSessionId: `mock-chat-sfx-${input.id}`,
      editComplexity: input.editComplexity,
      videoTone: input.videoTone,
      userInstructions: input.userInstructions,
      avoidInstructions: input.avoidInstructions,
      mockOnly: true,
      editPlanApproved: input.editPlanApproved ?? true,
      creditApproved: input.creditApproved ?? true,
      creditReserved: input.creditReserved ?? true,
      runMockWorker: input.runMockWorker ?? true,
      simulateApprovedLibraryMatch: input.simulateApprovedLibraryMatch,
      simulateMockApproval: input.simulateMockApproval,
      simulateQAFailure: input.simulateQAFailure,
      providerUnavailable: input.providerUnavailable,
    },
    expectedSFXEvents: input.expectedSFXEvents,
    expectedProviderRoutes: input.expectedProviderRoutes,
    expectedPromptProviders: input.expectedPromptProviders,
    expectedCreditStatus: input.expectedCreditStatus,
    expectedWorkerStatus: input.expectedWorkerStatus,
    expectedQAStatus: input.expectedQAStatus,
    expectedLibraryDecision: input.expectedLibraryDecision,
  }
}

export const mockEditProjectSFXScenarios: MockEditProjectSFXScenario[] = [
  scenario({
    id: 'basic-no-sfx-needed',
    label: 'Basic edit, no SFX needed',
    description: 'A clean talking-head edit chooses no SFX and skips generation.',
    editComplexity: 'basic_edit',
    videoTone: 'talking-head clean edit',
    userInstructions: ['Simple talking-head jump cuts only.', 'No extra sound design.'],
    avoidInstructions: ['No SFX.'],
    creditApproved: false,
    creditReserved: false,
    runMockWorker: false,
    expectedSFXEvents: ['none'],
    expectedProviderRoutes: ['no_sfx'],
    expectedPromptProviders: [],
    expectedCreditStatus: 'not_needed',
    expectedWorkerStatus: 'not_queued',
    expectedQAStatus: 'not_run',
    expectedLibraryDecision: 'skipped_no_sfx',
  }),
  scenario({
    id: 'basic-mmaudio-draft-transition',
    label: 'Basic edit, MMAudio draft transition fallback',
    description: 'A subtle transition is planned library-first with MMAudio fallback for a low-cost draft.',
    editComplexity: 'basic_edit',
    videoTone: 'basic clean social edit',
    userInstructions: ['One subtle transition whoosh if it helps the edit.'],
    expectedSFXEvents: ['transition'],
    expectedProviderRoutes: ['reeditpro_internal_library', 'mmaudio_v2'],
    expectedPromptProviders: ['reeditpro_internal_library'],
    expectedCreditStatus: 'approved_reserved',
    expectedWorkerStatus: 'mock_generated',
    expectedQAStatus: 'passed',
    expectedLibraryDecision: 'project_only',
  }),
  scenario({
    id: 'pro-library-no-match-mmaudio',
    label: 'Pro edit, internal library first then MMAudio draft',
    description: 'A Pro edit starts with library-first routing and falls back to MMAudio when no approved match is supplied.',
    editComplexity: 'pro_edit',
    videoTone: 'polished pro lifestyle',
    userInstructions: ['Use tasteful transition polish for the scene change.'],
    expectedSFXEvents: ['transition'],
    expectedProviderRoutes: ['reeditpro_internal_library', 'mmaudio_v2'],
    expectedPromptProviders: ['reeditpro_internal_library'],
    expectedCreditStatus: 'approved_reserved',
    expectedWorkerStatus: 'mock_generated',
    expectedQAStatus: 'passed',
    expectedLibraryDecision: 'project_only',
  }),
  scenario({
    id: 'pro-mirelo-important-transition',
    label: 'Pro edit, important transition routed to Mirelo',
    description: 'An important production transition in a Pro edit is routed to Mirelo with MMAudio fallback.',
    editComplexity: 'pro_edit',
    videoTone: 'high polish pro reveal',
    userInstructions: ['Important title transition needs production polish.', 'Make the transition feel premium.'],
    expectedSFXEvents: ['title_card', 'transition'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5', 'reeditpro_internal_library'],
    expectedPromptProviders: ['mirelo_sfx_v1_5', 'reeditpro_internal_library'],
    expectedCreditStatus: 'approved_reserved',
    expectedWorkerStatus: 'mock_generated',
    expectedQAStatus: 'passed',
    expectedLibraryDecision: 'project_only',
  }),
  scenario({
    id: 'signature-stroke-motion-mirelo',
    label: 'Signature edit, Stroke Motion draw routed to Mirelo',
    description: 'Stroke Motion line draw SFX uses Mirelo as the production provider.',
    editComplexity: 'signature_edit',
    videoTone: 'signature education',
    userInstructions: ['Use Stroke Motion with a subtle line draw sound.'],
    expectedSFXEvents: ['stroke_motion'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5'],
    expectedPromptProviders: ['mirelo_sfx_v1_5'],
    expectedCreditStatus: 'approved_reserved',
    expectedWorkerStatus: 'mock_generated',
    expectedQAStatus: 'passed',
    expectedLibraryDecision: 'project_only',
  }),
  scenario({
    id: 'signature-graphic-reveal-mirelo',
    label: 'Signature edit, Graphic Design reveal routed to Mirelo',
    description: 'Graphic Design reveal SFX is planned for production polish.',
    editComplexity: 'signature_edit',
    videoTone: 'visual explain signature',
    userInstructions: ['Graphic Design card reveal needs subtle premium SFX.'],
    expectedSFXEvents: ['graphic_design'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5'],
    expectedPromptProviders: ['mirelo_sfx_v1_5'],
    expectedCreditStatus: 'approved_reserved',
    expectedWorkerStatus: 'mock_generated',
    expectedQAStatus: 'passed',
    expectedLibraryDecision: 'project_only',
  }),
  scenario({
    id: 'signature-real-motion-mirelo',
    label: 'Signature edit, Real Motion object settle routed to Mirelo',
    description: 'Real Motion object settle sound is routed to Mirelo with voice-first constraints.',
    editComplexity: 'signature_edit',
    videoTone: 'real motion product demo',
    userInstructions: ['Real Motion object enters and settles; add a quiet realistic settle sound.'],
    expectedSFXEvents: ['real_motion'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5'],
    expectedPromptProviders: ['mirelo_sfx_v1_5'],
    expectedCreditStatus: 'approved_reserved',
    expectedWorkerStatus: 'mock_generated',
    expectedQAStatus: 'passed',
    expectedLibraryDecision: 'project_only',
  }),
  scenario({
    id: 'premium-multiple-mirelo-production',
    label: 'Premium signature edit, multiple Mirelo production SFX',
    description: 'Premium signature edit plans multiple production SFX moments.',
    editComplexity: 'premium_signature_edit',
    videoTone: 'premium signature launch film',
    userInstructions: ['Premium title hit.', 'Graphic card reveal.', 'Real Motion object settle.', 'CTA resolve hit.'],
    expectedSFXEvents: ['title_card', 'graphic_design', 'real_motion', 'cta_reveal'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5'],
    expectedPromptProviders: ['mirelo_sfx_v1_5'],
    expectedCreditStatus: 'approved_reserved',
    expectedWorkerStatus: 'mock_generated',
    expectedQAStatus: 'passed',
    expectedLibraryDecision: 'project_only',
  }),
  scenario({
    id: 'lake-como-lifestyle-project',
    label: 'Lake Como lifestyle project SFX',
    description: 'Lake Como edit wires title hit, transition whoosh, montage accent, and ambience protection.',
    editComplexity: 'premium_signature_edit',
    videoTone: 'luxury Lake Como lifestyle vacation',
    userInstructions: ['Coming-up teaser title hit.', 'Soft premium transition whoosh.', 'Boat montage accent.', 'Food/social ambience must stay natural.'],
    avoidInstructions: ['Do not add fake water everywhere.', 'Do not cover dialogue.'],
    simulateMockApproval: true,
    expectedSFXEvents: ['title_card', 'transition', 'montage_hit', 'ambient_bridge'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5', 'reeditpro_internal_library'],
    expectedPromptProviders: ['mirelo_sfx_v1_5', 'reeditpro_internal_library'],
    expectedCreditStatus: 'approved_reserved',
    expectedWorkerStatus: 'mock_generated',
    expectedQAStatus: 'passed',
    expectedLibraryDecision: 'library_candidate',
  }),
  scenario({
    id: 'faith-teaching-no-sfx',
    label: 'Faith teaching avoids SFX',
    description: 'Serious teaching avoids distracting SFX and skips generation.',
    editComplexity: 'pro_edit',
    videoTone: 'faith serious teaching',
    userInstructions: ['Preserve emotional pauses.', 'Voice and subtle music only.'],
    avoidInstructions: ['Avoid SFX.', 'No cheap hits.', 'No whooshes.'],
    creditApproved: false,
    creditReserved: false,
    runMockWorker: false,
    expectedSFXEvents: ['none'],
    expectedProviderRoutes: ['no_sfx'],
    expectedPromptProviders: [],
    expectedCreditStatus: 'not_needed',
    expectedWorkerStatus: 'not_queued',
    expectedQAStatus: 'not_run',
    expectedLibraryDecision: 'skipped_no_sfx',
  }),
  scenario({
    id: 'missing-credit-approval-blocks',
    label: 'Credit approval missing blocks generation',
    description: 'SFX planning and prompts exist, but the worker cannot queue without credit approval.',
    editComplexity: 'signature_edit',
    videoTone: 'signature transition',
    userInstructions: ['Plan an important transition SFX.'],
    creditApproved: false,
    creditReserved: false,
    runMockWorker: false,
    expectedSFXEvents: ['transition'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5'],
    expectedPromptProviders: ['mirelo_sfx_v1_5'],
    expectedCreditStatus: 'awaiting_approval',
    expectedWorkerStatus: 'not_queued',
    expectedQAStatus: 'not_run',
    expectedLibraryDecision: 'blocked',
  }),
  scenario({
    id: 'missing-credit-reservation-blocks',
    label: 'Credit reservation missing blocks worker',
    description: 'Credit estimate is approved, but missing reservation prevents generation request and worker queue.',
    editComplexity: 'signature_edit',
    videoTone: 'signature graphic reveal',
    userInstructions: ['Graphic reveal sound should be generated after approval.'],
    creditApproved: true,
    creditReserved: false,
    runMockWorker: false,
    expectedSFXEvents: ['graphic_design'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5'],
    expectedPromptProviders: ['mirelo_sfx_v1_5'],
    expectedCreditStatus: 'awaiting_approval',
    expectedWorkerStatus: 'not_queued',
    expectedQAStatus: 'not_run',
    expectedLibraryDecision: 'blocked',
  }),
  scenario({
    id: 'provider-no-sfx-skips-generation',
    label: 'Provider route no_sfx skips generation',
    description: 'No-SFX routing is preserved as a first-class professional choice.',
    editComplexity: 'basic_edit',
    videoTone: 'clean business explanation',
    userInstructions: ['Simple jump cuts only.'],
    avoidInstructions: ['No decorative SFX.'],
    creditApproved: false,
    creditReserved: false,
    runMockWorker: false,
    expectedSFXEvents: ['none'],
    expectedProviderRoutes: ['no_sfx'],
    expectedPromptProviders: [],
    expectedCreditStatus: 'not_needed',
    expectedWorkerStatus: 'not_queued',
    expectedQAStatus: 'not_run',
    expectedLibraryDecision: 'skipped_no_sfx',
  }),
  scenario({
    id: 'qa-fails-recommends-regeneration',
    label: 'Mock provider output QA fails',
    description: 'A generated cue is allowed through the mock worker, then QA recommends regeneration.',
    editComplexity: 'signature_edit',
    videoTone: 'luxury title reveal',
    userInstructions: ['Title card hit should feel premium.'],
    simulateQAFailure: true,
    expectedSFXEvents: ['title_card'],
    expectedProviderRoutes: ['mirelo_sfx_v1_5'],
    expectedPromptProviders: ['mirelo_sfx_v1_5'],
    expectedCreditStatus: 'approved_reserved',
    expectedWorkerStatus: 'failed',
    expectedQAStatus: 'failed',
    expectedLibraryDecision: 'qa_failed',
  }),
  scenario({
    id: 'qa-pass-project-only-asset',
    label: 'QA-passed generated SFX becomes project-only',
    description: 'A generated transition cue passes QA and remains project-only.',
    editComplexity: 'pro_edit',
    videoTone: 'professional social transition',
    userInstructions: ['Soft transition whoosh for one scene change.'],
    expectedSFXEvents: ['transition'],
    expectedProviderRoutes: ['reeditpro_internal_library', 'mmaudio_v2'],
    expectedPromptProviders: ['reeditpro_internal_library'],
    expectedCreditStatus: 'approved_reserved',
    expectedWorkerStatus: 'mock_generated',
    expectedQAStatus: 'passed',
    expectedLibraryDecision: 'project_only',
  }),
  scenario({
    id: 'library-candidate-general-whoosh',
    label: 'QA-passed general whoosh becomes library candidate',
    description: 'A reusable whoosh passes QA and mock provenance, becoming a library candidate.',
    editComplexity: 'pro_edit',
    videoTone: 'general-purpose clean transition',
    userInstructions: ['Reusable soft whoosh for a standard transition.'],
    simulateMockApproval: true,
    expectedSFXEvents: ['transition'],
    expectedProviderRoutes: ['reeditpro_internal_library', 'mmaudio_v2'],
    expectedPromptProviders: ['reeditpro_internal_library'],
    expectedCreditStatus: 'approved_reserved',
    expectedWorkerStatus: 'mock_generated',
    expectedQAStatus: 'passed',
    expectedLibraryDecision: 'library_candidate',
  }),
]

export function getMockEditProjectSFXScenarioById(id: string): MockEditProjectSFXScenario | undefined {
  return mockEditProjectSFXScenarios.find((scenarioItem) => scenarioItem.id === id)
}

export function getDefaultMockEditProjectSFXScenario(): MockEditProjectSFXScenario {
  return getMockEditProjectSFXScenarioById('lake-como-lifestyle-project') ?? mockEditProjectSFXScenarios[0]
}
