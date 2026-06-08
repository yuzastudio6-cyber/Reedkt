import type {
  PrivateAudioArtifactManifest,
  SoundAgentPlannerResult,
  SoundAgentPlan,
  SoundBlockedUseReason,
  SoundCueFamily,
  SoundCuePlan,
  SoundDraftCreditEstimateMetadata,
  SoundExecutionGateResult,
  SoundExecutionMode,
  SoundHandoffReadiness,
  SoundHandoffStatus,
  SoundProviderId,
  SoundProviderPolicy,
  SoundRelatedWorkstreamId,
  SoundRuntimeTarget,
  SoundToolRequest,
  SoundToolResult,
  TimingAwareSoundCueManifest,
} from '../../../types/audio-music'
import type { SoundMusicAudioHandoffEvidenceReview } from './buildSoundMusicAudioHandoffEvidenceReview'
import type { SoundMusicAudioDryRunEvidenceDisplay } from './buildSoundMusicAudioDryRunEvidence'

export type SoundMusicAudioPlanCardMode = Extract<SoundExecutionMode, 'planning_only' | 'mock_preview_only'>

export interface SoundMusicAudioCueGroups {
  actionFoley: SoundCuePlan[]
  ambience: SoundCuePlan[]
  music: SoundCuePlan[]
  other: SoundCuePlan[]
}

export interface SoundMusicAudioPlanSummary {
  cueCount: number
  actionFoleyCueCount: number
  ambienceCueCount: number
  musicCueCount: number
  duckingCueCount: number
  blockedCueCount: number
  estimatedCreditsMin?: number
  estimatedCreditsMax?: number
  noSpendOccurred: true
  realGenerationBlocked: true
  mayCallProvider: false
  mayDispatchWorker: false
  mayCreateGeneratedAsset: false
  publicArtifactAllowed: false
}

export interface SoundMusicAudioProviderSummary {
  providerId: SoundProviderId
  status: SoundProviderPolicy['status']
  generationEnabled: false
  allowedForPlanning: boolean
  runtimeTarget: SoundRuntimeTarget
  commercialExportAllowed: SoundProviderPolicy['commercialExportAllowed']
  licenseStatus: SoundProviderPolicy['licensePolicy']['licenseStatus']
  providerGatewayRequired: boolean
  planningRole: 'sfx_foley' | 'ambience' | 'music_soundtrack' | 'analysis_processing' | 'disabled_or_review'
  notes: string[]
}

export interface SoundMusicAudioRuntimeSummary {
  policyKey: string
  runtimeTarget: SoundRuntimeTarget
  planningAllowed: boolean
  generationAllowed: false
  mayCallProvider: false
  mayDispatchWorker: boolean
  mayCreateGeneratedAsset: boolean
  requiredHandoffs: SoundRelatedWorkstreamId[]
  blockedReasons: SoundBlockedUseReason[]
}

export interface SoundMusicAudioLyriaPlanningMetadata {
  present: boolean
  providerId: Extract<SoundProviderId, 'lyria_mock'>
  allowedFamilies: Extract<SoundCueFamily, 'music_cue' | 'soundtrack_layer' | 'audio_mood_design'>[]
  usedForSfxFoleyAmbience: false
  providerGatewayRequired: true
  generationEnabled: false
  commercialExportAllowed: false
  notes: string[]
}

export interface SoundMusicAudioHandoffDisplayItem {
  label: string
  workstream?: SoundRelatedWorkstreamId
  status: SoundHandoffStatus
  finalExportReady?: false
  requiredEvidence: string[]
  notes: string[]
}

export interface SoundMusicAudioAccessSafetySummary {
  storageScope: PrivateAudioArtifactManifest['storageScope'] | 'not_declared'
  publicArtifactAllowed: false
  signedUrlExposure: false
  providerSecretExposure: false
  serviceRoleKeyExposure: false
}

export interface SoundMusicAudioPlanCardProps {
  plan: SoundAgentPlan
  timingManifest?: TimingAwareSoundCueManifest
  privateArtifactManifest?: PrivateAudioArtifactManifest
  handoffReadiness?: SoundHandoffReadiness
  draftCreditEstimate?: SoundDraftCreditEstimateMetadata
  toolRequests?: SoundToolRequest[]
  toolResults?: SoundToolResult[]
  executionGateResults?: SoundExecutionGateResult[]
  handoffMetadata?: SoundAgentPlannerResult['handoffMetadata']
  mode?: SoundMusicAudioPlanCardMode
  cueGroups?: SoundMusicAudioCueGroups
  summary?: SoundMusicAudioPlanSummary
  providerSummaries?: SoundMusicAudioProviderSummary[]
  runtimeSummaries?: SoundMusicAudioRuntimeSummary[]
  lyriaPlanning?: SoundMusicAudioLyriaPlanningMetadata
  handoffItems?: SoundMusicAudioHandoffDisplayItem[]
  qaNotes?: string[]
  soundSyncNotes?: string[]
  accessSafety?: SoundMusicAudioAccessSafetySummary
  evidenceReview?: SoundMusicAudioHandoffEvidenceReview
  dryRunEvidence?: SoundMusicAudioDryRunEvidenceDisplay
  onApproveMock?: () => void
  onReviseMock?: () => void
  onRemoveCueMock?: (cueId: string) => void
  onViewHandoffDetailsMock?: () => void
}

const actionFoleyFamilies: SoundCueFamily[] = [
  'action_foley_sfx',
  'transition_sound',
  'whoosh_hit_riser',
]

const ambienceFamilies: SoundCueFamily[] = [
  'ambient_everyday_soundscape',
  'audio_bed',
  'ambience_match',
]

const musicFamilies: SoundCueFamily[] = [
  'music_cue',
  'soundtrack_layer',
  'audio_mood_design',
]

function isActionFoleyCue(cue: SoundCuePlan): boolean {
  return actionFoleyFamilies.includes(cue.family) || cue.toolId === 'action_foley_sfx_tool'
}

function isAmbienceCue(cue: SoundCuePlan): boolean {
  return ambienceFamilies.includes(cue.family) || cue.toolId === 'ambient_everyday_soundscape_tool' || cue.toolId === 'ambient_sound_planner'
}

function isMusicCue(cue: SoundCuePlan): boolean {
  return musicFamilies.includes(cue.family) || cue.toolId === 'music_cue_planner' || cue.providerCandidate === 'lyria_mock'
}

function hasBlockedReason(cue: SoundCuePlan): boolean {
  return cue.blockedReasons.length > 0 || cue.providerBlockedReasons.length > 0 || cue.approvalState === 'blocked' || cue.creditGateState === 'blocked'
}

export function buildSoundMusicAudioCueGroups(plan: SoundAgentPlan): SoundMusicAudioCueGroups {
  const groups: SoundMusicAudioCueGroups = {
    actionFoley: [],
    ambience: [],
    music: [],
    other: [],
  }

  for (const cue of plan.cuePlans) {
    if (isMusicCue(cue)) {
      groups.music.push(cue)
    } else if (isAmbienceCue(cue)) {
      groups.ambience.push(cue)
    } else if (isActionFoleyCue(cue)) {
      groups.actionFoley.push(cue)
    } else {
      groups.other.push(cue)
    }
  }

  return groups
}

export function buildSoundMusicAudioPlanSummary(input: {
  plan: SoundAgentPlan
  cueGroups: SoundMusicAudioCueGroups
  draftCreditEstimate?: SoundDraftCreditEstimateMetadata
  executionGateResults?: SoundExecutionGateResult[]
  privateArtifactManifest?: PrivateAudioArtifactManifest
}): SoundMusicAudioPlanSummary {
  return {
    cueCount: input.plan.cuePlans.length,
    actionFoleyCueCount: input.cueGroups.actionFoley.length,
    ambienceCueCount: input.cueGroups.ambience.length,
    musicCueCount: input.cueGroups.music.length,
    duckingCueCount: input.plan.cuePlans.filter((cue) => cue.duckingRequired).length,
    blockedCueCount: input.plan.cuePlans.filter(hasBlockedReason).length,
    estimatedCreditsMin: input.draftCreditEstimate?.totalEstimatedCreditsMin,
    estimatedCreditsMax: input.draftCreditEstimate?.totalEstimatedCreditsMax,
    noSpendOccurred: true,
    realGenerationBlocked: true,
    mayCallProvider: false,
    mayDispatchWorker: false,
    mayCreateGeneratedAsset: false,
    publicArtifactAllowed: input.privateArtifactManifest?.publicArtifactAllowed ?? false,
  }
}

function providerPlanningRole(provider: SoundProviderPolicy): SoundMusicAudioProviderSummary['planningRole'] {
  if (provider.providerId === 'lyria_mock' || provider.defaultFor?.some((family) => musicFamilies.includes(family))) return 'music_soundtrack'
  if (provider.defaultFor?.some((family) => ambienceFamilies.includes(family)) || provider.fallbackFor?.some((family) => ambienceFamilies.includes(family))) return 'ambience'
  if (provider.defaultFor?.some((family) => actionFoleyFamilies.includes(family))) return 'sfx_foley'
  if (provider.providerId === 'audioflux_analysis_only' || provider.providerId === 'signalsmith_stretch_processing_only') return 'analysis_processing'
  return provider.allowedForPlanning ? 'disabled_or_review' : 'disabled_or_review'
}

export function buildSoundMusicAudioProviderSummaries(plan: SoundAgentPlan): SoundMusicAudioProviderSummary[] {
  return plan.providerPolicies.map((provider) => ({
    providerId: provider.providerId,
    status: provider.status,
    generationEnabled: false,
    allowedForPlanning: provider.allowedForPlanning,
    runtimeTarget: provider.runtimeDefault,
    commercialExportAllowed: provider.commercialExportAllowed,
    licenseStatus: provider.licensePolicy.licenseStatus,
    providerGatewayRequired: provider.runtimeDefault === 'external_provider_gateway' || Boolean(provider.ownerBoundary ?? provider.realExecutionOwnerBoundary),
    planningRole: providerPlanningRole(provider),
    notes: provider.notes,
  }))
}

export function buildSoundMusicAudioRuntimeSummaries(plan: SoundAgentPlan): SoundMusicAudioRuntimeSummary[] {
  return plan.runtimePolicies.map((runtime) => ({
    policyKey: runtime.policyKey,
    runtimeTarget: runtime.runtimeTarget,
    planningAllowed: runtime.planningAllowed,
    generationAllowed: false,
    mayCallProvider: false,
    mayDispatchWorker: runtime.mayDispatchWorker,
    mayCreateGeneratedAsset: runtime.mayCreateGeneratedAsset,
    requiredHandoffs: runtime.requiredHandoffs,
    blockedReasons: runtime.blockedReasons,
  }))
}

export function buildSoundMusicAudioLyriaPlanningMetadata(input: {
  cueGroups: SoundMusicAudioCueGroups
  providerSummaries: SoundMusicAudioProviderSummary[]
}): SoundMusicAudioLyriaPlanningMetadata {
  const present = input.cueGroups.music.some((cue) => cue.providerCandidate === 'lyria_mock') ||
    input.providerSummaries.some((provider) => provider.providerId === 'lyria_mock')

  return {
    present,
    providerId: 'lyria_mock',
    allowedFamilies: ['music_cue', 'soundtrack_layer', 'audio_mood_design'],
    usedForSfxFoleyAmbience: false,
    providerGatewayRequired: true,
    generationEnabled: false,
    commercialExportAllowed: false,
    notes: [
      'Google Lyria is represented only as music, song, and soundtrack planning metadata.',
      'Real Lyria transport belongs to Provider Gateway and remains disabled.',
      'Lyria is not an SFX, foley, transition, whoosh, hit, riser, ambience, or room-tone provider.',
    ],
  }
}

function readinessEvidence(readiness: SoundHandoffReadiness | undefined, checkName: string): string[] {
  return readiness?.readinessChecks.find((check) => check.checkName === checkName)?.requiredEvidence ?? []
}

function readinessNotes(readiness: SoundHandoffReadiness | undefined, checkName: string): string[] {
  return readiness?.readinessChecks.find((check) => check.checkName === checkName)?.notes ?? []
}

export function buildSoundMusicAudioHandoffItems(readiness: SoundHandoffReadiness | undefined): SoundMusicAudioHandoffDisplayItem[] {
  return [
    {
      label: 'Track A final composition',
      workstream: 'TRACK_A_RENDER_EXPORT',
      status: readiness?.trackAStatus ?? 'handoff_required',
      finalExportReady: false,
      requiredEvidence: readinessEvidence(readiness, 'track_a_final_composition_handoff'),
      notes: ['Not ready for final mux/export. Track A owns final composition validation.'],
    },
    {
      label: 'Track B processing',
      workstream: 'TRACK_B_MEDIA_PROCESSING',
      status: readiness?.trackBStatus ?? 'handoff_required',
      requiredEvidence: readinessEvidence(readiness, 'track_b_processing_handoff'),
      notes: ['Handoff only if real audio/media processing is needed.'],
    },
    {
      label: 'Provider Gateway',
      workstream: 'PROVIDER_GATEWAY_MODELS',
      status: readiness?.providerGatewayStatus ?? 'handoff_required',
      requiredEvidence: readinessEvidence(readiness, 'provider_license'),
      notes: ['Required before any real provider transport or fallback.'],
    },
    {
      label: 'Worker Runtime',
      workstream: 'WORKER_RUNTIME_JOBS',
      status: readiness?.workerRuntimeStatus ?? 'blocked',
      requiredEvidence: readinessEvidence(readiness, 'worker_execution'),
      notes: ['Required before execution, dispatch, leases, or jobs.'],
    },
    {
      label: 'Supabase/RLS/Storage',
      workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
      status: readiness?.supabaseStatus ?? 'blocked',
      requiredEvidence: readinessEvidence(readiness, 'supabase_mutation'),
      notes: ['Required before mutation, private bucket writes, storage rows, or signed access.'],
    },
    {
      label: 'Observability/Audit/Cost',
      workstream: 'OBSERVABILITY_AUDIT_COST',
      status: readiness?.observabilityStatus ?? 'handoff_required',
      requiredEvidence: readinessEvidence(readiness, 'observability_audit_cost'),
      notes: readinessNotes(readiness, 'observability_audit_cost'),
    },
    {
      label: 'Billing/Stripe',
      workstream: 'BILLING_STRIPE_CREDITS',
      status: readiness?.billingStatus ?? 'handoff_required',
      requiredEvidence: readinessEvidence(readiness, 'credit_estimate'),
      notes: ['Draft credit metadata only. No credit, approval, reservation, or spend rows exist.'],
    },
  ]
}

export function buildSoundMusicAudioQaNotes(result: Pick<SoundAgentPlannerResult, 'qaWarnings' | 'plan'>): string[] {
  const notes = [
    ...result.qaWarnings,
    ...result.plan.warnings,
    'No random SFX policy: cues must support a cut, transition, object motion, gesture, title card, ambience bed, or music/story reason.',
    'Loud SFX under speech are blocked or downgraded to subtle planning.',
    'Ambience under speech must remain subtle/background.',
    'Music over voice requires speech-first ducking before Track A handoff.',
    'Audio QA evidence is required before any final composition handoff.',
  ]

  return [...new Set(notes)]
}

export function buildSoundMusicAudioSoundSyncNotes(input: {
  timingManifest?: TimingAwareSoundCueManifest
  toolRequests?: SoundToolRequest[]
}): string[] {
  const notes = [
    ...(input.timingManifest?.sourceReasoning ?? []),
    ...(input.timingManifest?.speechDuckingNotes ?? []),
    ...(input.timingManifest?.moodNotes ?? []),
  ]

  if (input.toolRequests?.some((request) => request.toolId === 'soundsync_planner')) {
    notes.push('SoundSync planner metadata is present for beat/cut/transition coordination.')
  }

  return [...new Set(notes)]
}

export function buildSoundMusicAudioAccessSafety(privateArtifactManifest?: PrivateAudioArtifactManifest): SoundMusicAudioAccessSafetySummary {
  return {
    storageScope: privateArtifactManifest?.storageScope ?? 'not_declared',
    publicArtifactAllowed: false,
    signedUrlExposure: false,
    providerSecretExposure: false,
    serviceRoleKeyExposure: false,
  }
}

export function buildSoundMusicAudioPlanCardProps(
  result: SoundAgentPlannerResult,
  options: { mode?: SoundMusicAudioPlanCardMode } = {},
): SoundMusicAudioPlanCardProps {
  const cueGroups = buildSoundMusicAudioCueGroups(result.plan)
  const providerSummaries = buildSoundMusicAudioProviderSummaries(result.plan)
  const runtimeSummaries = buildSoundMusicAudioRuntimeSummaries(result.plan)

  return {
    plan: result.plan,
    timingManifest: result.timingAwareCueManifest,
    privateArtifactManifest: result.privateAudioArtifactManifest,
    handoffReadiness: result.handoffReadiness,
    draftCreditEstimate: result.draftCreditEstimate,
    toolRequests: result.toolRequests,
    toolResults: result.toolResults,
    executionGateResults: result.executionGateResults,
    handoffMetadata: result.handoffMetadata,
    mode: options.mode ?? 'planning_only',
    cueGroups,
    summary: buildSoundMusicAudioPlanSummary({
      plan: result.plan,
      cueGroups,
      draftCreditEstimate: result.draftCreditEstimate,
      executionGateResults: result.executionGateResults,
      privateArtifactManifest: result.privateAudioArtifactManifest,
    }),
    providerSummaries,
    runtimeSummaries,
    lyriaPlanning: buildSoundMusicAudioLyriaPlanningMetadata({ cueGroups, providerSummaries }),
    handoffItems: buildSoundMusicAudioHandoffItems(result.handoffReadiness),
    qaNotes: buildSoundMusicAudioQaNotes(result),
    soundSyncNotes: buildSoundMusicAudioSoundSyncNotes({
      timingManifest: result.timingAwareCueManifest,
      toolRequests: result.toolRequests,
    }),
    accessSafety: buildSoundMusicAudioAccessSafety(result.privateAudioArtifactManifest),
  }
}
