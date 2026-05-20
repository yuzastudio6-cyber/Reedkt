import type { EditPlan } from '../types/reeditpro'
import type {
  TestingReadinessCategory,
  TestingReadinessCheck,
  TestingReadinessReport,
  TestingReadinessStatus,
} from '../types/testing-readiness'
import { openSourceToolProfiles } from './tool-registry'

type CheckInput = {
  id: string
  category: TestingReadinessCategory
  label: string
  passed: boolean
  message: string
  recommendation?: string
  severity?: TestingReadinessCheck['severity']
  status?: TestingReadinessStatus
}

const noExecutionClaims = [
  'provider api called',
  'openai api called',
  'supabase sql executed',
  'ffmpeg executed',
  'playwright executed',
  'remotion render executed',
  'cloud worker deployed',
  'stripe charged',
]

function check(input: CheckInput): TestingReadinessCheck {
  const severity = input.severity ?? (input.passed ? 'info' : 'warning')

  return {
    id: input.id,
    category: input.category,
    label: input.label,
    status: input.status ?? (input.passed ? 'ready' : severity === 'blocking' || severity === 'error' ? 'blocked' : 'warning'),
    severity,
    passed: input.passed,
    message: input.message,
    recommendation: input.recommendation,
  }
}

function textIncludesPlanClaim(plan: EditPlan | undefined, claims: string[]) {
  const text = JSON.stringify(plan ?? {}).toLowerCase()
  return claims.some((claim) => text.includes(claim))
}

function tool(id: string) {
  return openSourceToolProfiles.find((profile) => profile.id === id)
}

function launchToolStackChecks(): TestingReadinessCheck[] {
  const audioflux = tool('audioflux')
  const signalsmith = tool('signalsmith_stretch')
  const ffmpeg = tool('ffmpeg')
  const vapoursynth = tool('vapoursynth')
  const sharp = tool('sharp')
  const essentia = tool('essentia')
  const rubberBand = tool('rubber_band')

  return [
    check({
      id: 'testing-readiness-audioflux-launch-candidate',
      category: 'launch_tool_stack',
      label: 'AudioFlux launch candidate',
      passed: audioflux?.adoptionStage === 'launch_core',
      message: 'AudioFlux should be the launch audio analysis candidate for SoundSync timing and feature planning.',
      recommendation: 'Keep Essentia out of default launch chains unless a future review re-enables it.',
    }),
    check({
      id: 'testing-readiness-signalsmith-launch-candidate',
      category: 'launch_tool_stack',
      label: 'Signalsmith Stretch launch candidate',
      passed: signalsmith?.adoptionStage === 'launch_core',
      message: 'Signalsmith Stretch should be the launch stretch/pitch candidate.',
      recommendation: 'Keep Rubber Band as future/evaluation only unless legal/product review re-enables it.',
    }),
    check({
      id: 'testing-readiness-ffmpeg-lgpl',
      category: 'launch_tool_stack',
      label: 'FFmpeg LGPL configuration',
      passed: Boolean(ffmpeg?.licenseNotes.some((note) => /lgpl/i.test(note))),
      message: 'FFmpeg must remain treated as an LGPL configuration candidate until reviewed.',
    }),
    check({
      id: 'testing-readiness-vapoursynth-worker-only',
      category: 'launch_tool_stack',
      label: 'VapourSynth worker-only',
      passed: Boolean(vapoursynth?.executionMode === 'future_worker' && vapoursynth.productionNotes.some((note) => /plugin/i.test(note))),
      message: 'VapourSynth should remain worker-only and plugins require separate review.',
    }),
    check({
      id: 'testing-readiness-sharp-libvips-review',
      category: 'launch_tool_stack',
      label: 'Sharp + libvips review tracked',
      passed: Boolean(sharp?.licenseNotes.some((note) => /libvips|lgpl/i.test(note))),
      message: 'Sharp + libvips must keep dependency/security/LGPL review notes before production use.',
    }),
    check({
      id: 'testing-readiness-essentia-not-launch-default',
      category: 'launch_tool_stack',
      label: 'Essentia not launch default',
      passed: essentia?.adoptionStage !== 'launch_core',
      message: 'Essentia should stay future/evaluation only for launch readiness.',
    }),
    check({
      id: 'testing-readiness-rubber-band-not-launch-default',
      category: 'launch_tool_stack',
      label: 'Rubber Band not launch default',
      passed: rubberBand?.adoptionStage !== 'launch_core',
      message: 'Rubber Band should stay future/evaluation only for launch readiness.',
    }),
  ]
}

function planLayerChecks(plan: EditPlan | undefined): TestingReadinessCheck[] {
  return [
    check({
      id: 'testing-readiness-plan-exists',
      category: 'mock_edit_plan',
      label: 'Mock EditPlan exists',
      passed: Boolean(plan),
      severity: plan ? 'info' : 'blocking',
      message: 'Testing readiness needs a mock EditPlan to inspect.',
    }),
    check({
      id: 'testing-readiness-source-sequence',
      category: 'required_user_gates',
      label: 'Source order gate represented',
      passed: Boolean(plan?.sourceSequenceReview),
      severity: 'blocking',
      message: 'Source order must be represented and confirmable before approval.',
    }),
    check({
      id: 'testing-readiness-aspect-ratio-gate',
      category: 'required_user_gates',
      label: 'Aspect ratio gate represented',
      passed: Boolean(plan?.aspectRatioFramePlan),
      severity: 'blocking',
      message: 'Output frame/aspect ratio must be represented before approval.',
    }),
    check({
      id: 'testing-readiness-cleanup-gate',
      category: 'required_user_gates',
      label: 'Source cleanup gate represented',
      passed: Boolean(plan?.sourceCleanupPlan),
      severity: 'blocking',
      message: 'Source cleanup preference and trim decisions must be represented before approval.',
    }),
    check({
      id: 'testing-readiness-trim-review',
      category: 'mock_edit_plan',
      label: 'Trim review plan exists',
      passed: Boolean(plan?.trimReviewPlan),
      message: 'Retake selection and meaning preservation should be visible for local/staging tests.',
    }),
    check({
      id: 'testing-readiness-master-timing',
      category: 'mock_edit_plan',
      label: 'Master timing exists',
      passed: Boolean(plan?.masterTimingPlan),
      message: 'Frame-accurate master timing should exist before render/runtime testing.',
    }),
    check({
      id: 'testing-readiness-caption-visual-cue-timing',
      category: 'mock_edit_plan',
      label: 'Caption + visual cue timing exists',
      passed: Boolean(plan?.captionVisualCueTimingPlan),
      message: 'Caption and visual cue timing should be represented for end-to-end test readiness.',
    }),
    check({
      id: 'testing-readiness-soundsync-transition-timing',
      category: 'mock_edit_plan',
      label: 'SoundSync transition timing exists',
      passed: Boolean(plan?.soundSyncTransitionTimingPlan),
      message: 'SoundSync beat/transition/SFX timing should be represented for launch testing.',
    }),
    check({
      id: 'testing-readiness-timing-validation',
      category: 'required_user_gates',
      label: 'Timing validation gate represented',
      passed: Boolean(plan?.timingValidationPlan),
      severity: 'blocking',
      message: 'Timing validation must be represented before approval/testing of generation paths.',
    }),
    check({
      id: 'testing-readiness-editing-agent-execution',
      category: 'editing_agent_execution',
      label: 'Editing agent execution plan exists',
      passed: Boolean(plan?.editingAgentExecutionPlan),
      message: 'Future worker work graph should be planned but not executed.',
    }),
    check({
      id: 'testing-readiness-async-reconciliation',
      category: 'async_reconciliation',
      label: 'Async reconciliation plan exists',
      passed: Boolean(plan?.asyncAssetReconciliationPlan),
      message: 'Future async asset merge/checkback policy should be visible for staging readiness.',
    }),
    check({
      id: 'testing-readiness-agent-qa-fallback',
      category: 'agent_qa_fallback',
      label: 'Agent QA/fallback plan exists',
      passed: Boolean(plan?.agentQAFallbackPlan),
      message: 'Future failure/fallback decision policy should be represented before runtime testing.',
    }),
    check({
      id: 'testing-readiness-worker-runtime',
      category: 'worker_runtime',
      label: 'Worker/runtime boundary represented',
      passed: Boolean(plan?.editingAgentExecutionPlan || plan?.agentQAFallbackPlan),
      message: 'Workers must remain future approved-snapshot executors, not frontend execution paths.',
    }),
    check({
      id: 'testing-readiness-supabase-production-readiness',
      category: 'supabase_migrations',
      label: 'Supabase production-test readiness represented',
      passed: Boolean(plan?.supabaseProductionReadinessPlan),
      message: 'Supabase local/staging test readiness should be visible without running SQL.',
    }),
    check({
      id: 'testing-readiness-production-readiness',
      category: 'provider_safety',
      label: 'Production readiness represented',
      passed: Boolean(plan?.planningSystemAuditReport),
      message: 'Planning audit or production readiness metadata should be present before launch testing.',
    }),
    check({
      id: 'testing-readiness-credit-estimate',
      category: 'credit_estimate',
      label: 'Credit estimate exists',
      passed: Boolean(plan?.creditEstimate?.total !== undefined),
      severity: 'blocking',
      message: 'Credit estimates must exist before any generation/render/testing path claims readiness.',
    }),
  ]
}

function safetyChecks(plan: EditPlan | undefined): TestingReadinessCheck[] {
  const text = JSON.stringify(plan ?? {}).toLowerCase()
  const editLevel = plan?.compiledIntent?.resolvedSettings.editLevel
  const hasVeo = text.includes('veo_3_1_lite')
  const hasPrimaryVeo = /"primarymodel"\s*:\s*"veo_3_1_lite"/i.test(JSON.stringify(plan ?? {}))

  return [
    check({
      id: 'testing-readiness-basic-pro-no-veo',
      category: 'provider_safety',
      label: 'Basic/Pro no Veo',
      passed: editLevel === 'premium' || !hasVeo,
      severity: 'blocking',
      message: 'Basic and Pro plans must not include Veo routes or fallback execution.',
    }),
    check({
      id: 'testing-readiness-premium-veo-not-primary',
      category: 'provider_safety',
      label: 'Premium Veo fallback only',
      passed: !hasPrimaryVeo,
      severity: 'blocking',
      message: 'Veo must never be primary/default, even in Premium.',
    }),
    check({
      id: 'testing-readiness-no-default-1080p',
      category: 'provider_safety',
      label: 'No default 1080P generation',
      passed: !text.includes('1080p'),
      severity: 'blocking',
      message: 'Generated AI video routes must not default to 1080P.',
    }),
    check({
      id: 'testing-readiness-no-transparent-ai-video-default',
      category: 'provider_safety',
      label: 'No transparent AI-video default',
      passed: !text.includes('transparent ai-video background'),
      severity: 'blocking',
      message: 'AI video should default to matching frame/panel backgrounds, not transparent backgrounds.',
    }),
    check({
      id: 'testing-readiness-provider-models-separated',
      category: 'tool_registry',
      label: 'Provider models separate from tools',
      passed: Boolean(plan?.toolRegistrySummary) && !openSourceToolProfiles.some((profile) => /gpt-image|wan|hailuo|veo/i.test(`${profile.id} ${profile.label}`)),
      severity: 'blocking',
      message: 'GPT-Image-2, Wan, Hailuo, and Veo must remain provider models, not open-source tools.',
    }),
    check({
      id: 'testing-readiness-no-real-execution',
      category: 'no_real_execution',
      label: 'No real execution implied',
      passed: !textIncludesPlanClaim(plan, noExecutionClaims),
      severity: 'blocking',
      message: 'Testing readiness must not imply provider, tool, Supabase, cloud, Stripe, or rendering execution.',
    }),
    check({
      id: 'testing-readiness-manual-supabase-required',
      category: 'supabase_migrations',
      label: 'Supabase testing remains manual',
      passed: true,
      status: 'warning',
      severity: 'warning',
      message: 'Migrations and SQL test files are readiness inputs only; this report does not run Supabase, SQL, or remote checks.',
    }),
    check({
      id: 'testing-readiness-build-not-run-in-report',
      category: 'frontend_build',
      label: 'Build must be run outside report',
      passed: true,
      status: 'not_checked',
      severity: 'warning',
      message: 'The EditPlan readiness report records that build must be run separately with npm.cmd run build.',
    }),
    check({
      id: 'testing-readiness-lint-not-run-in-report',
      category: 'frontend_lint',
      label: 'Lint must be run outside report',
      passed: true,
      status: 'not_checked',
      severity: 'warning',
      message: 'The EditPlan readiness report records that lint must be run separately with npm.cmd run lint.',
    }),
  ]
}

export function createTestingReadinessReport(plan?: EditPlan): TestingReadinessReport {
  const checks = [
    check({
      id: 'testing-readiness-package-scripts-static',
      category: 'package_scripts',
      label: 'Package scripts expected',
      passed: true,
      message: 'Expected scripts are verified by scripts/readiness/check-readiness.mjs: dev, build, lint, preview, and test:readiness.',
    }),
    ...planLayerChecks(plan),
    ...launchToolStackChecks(),
    ...safetyChecks(plan),
    check({
      id: 'testing-readiness-no-secret-leakage-static',
      category: 'no_secret_leakage',
      label: 'Secret scan handled by static script',
      passed: true,
      message: 'The static readiness script checks .env.example for obvious real-looking secrets without printing values.',
    }),
    check({
      id: 'testing-readiness-rls-storage-policy-represented',
      category: 'rls_storage_policy',
      label: 'RLS/storage policy represented',
      passed: Boolean(plan?.supabaseProductionReadinessPlan?.activeMigrationFiles.some((file) => /rls|storage/i.test(file))),
      message: 'RLS and storage policy readiness should be represented for manual local/staging testing.',
    }),
    check({
      id: 'testing-readiness-approved-snapshot-policy',
      category: 'approved_snapshot',
      label: 'Approved snapshot policy represented',
      passed: Boolean(plan?.supabaseProductionReadinessPlan?.checks.some((item) => /snapshot/i.test(item.id) && item.passed)),
      message: 'Approved snapshots should be represented before future workers execute anything.',
    }),
    check({
      id: 'testing-readiness-planner-validation',
      category: 'planner_validation',
      label: 'Planner validation integration expected',
      passed: true,
      message: 'Planner validation will include testing-readiness checks in RP-TEST-01.',
    }),
    check({
      id: 'testing-readiness-planner-regression',
      category: 'planner_regression',
      label: 'Planner regression integration expected',
      passed: true,
      message: 'Planner regression uses validation reports, so demo scenarios will include testing-readiness checks.',
    }),
  ]

  const blockers = checks
    .filter((item) => !item.passed && (item.severity === 'blocking' || item.severity === 'error'))
    .map((item) => item.label)
  const warnings = checks
    .filter((item) => item.severity === 'warning' || (!item.passed && item.severity === 'info'))
    .map((item) => item.message)
  const overallStatus: TestingReadinessStatus = blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'ready'

  return {
    id: 'testing-readiness-report',
    overallStatus,
    summary: overallStatus === 'blocked'
      ? `${blockers.length} blocker(s) must be resolved before local/staging testing can expand.`
      : overallStatus === 'warning'
        ? 'Frontend/mock testing readiness is represented, with manual local/staging checks still required.'
        : 'Frontend/mock testing readiness is complete with no blockers or warnings.',
    checks,
    blockers,
    warnings,
    manualTestSteps: [
      'Run npm.cmd run build.',
      'Run npm.cmd run lint.',
      'Run npm.cmd run test:readiness.',
      'Start Vite manually and verify the chat-native editor renders in Guided, Detailed, and Developer modes.',
      'Run Supabase local/staging SQL tests only in a later explicit validation task.',
    ],
    nextMilestones: [
      'Local/staging frontend smoke testing.',
      'Supabase local/staging validation with explicit approval.',
      'Backend runtime boundary wiring before provider or worker setup.',
      'Google Cloud/provider setup only after approval, credit, snapshot, QA, and secret boundaries are tested.',
    ],
    limitations: [
      'No real Supabase testing runs in this report.',
      'No provider, tool, FFmpeg, Playwright, Remotion, cloud, Stripe, or billing execution runs.',
      'No real media upload, analysis, rendering, or export is implemented.',
      'Warnings remain until manual local/staging validation is performed.',
    ],
  }
}
