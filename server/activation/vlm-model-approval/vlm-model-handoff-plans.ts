import {
  PHASE39A_VLM_FUTURE_CONFIRMATIONS,
} from './vlm-model-approval-policy'
import type {
  VlmControlledRealFramePlan,
  VlmGeneratedFixturePlan,
  VlmHandoffPlan,
  VlmStoragePlan,
  VlmToolPlanningIntegrationPlan,
} from './vlm-model-approval-types'

export function buildVlmDownloadHandoffPlan(storagePlan: VlmStoragePlan): VlmHandoffPlan[] {
  return [
    {
      planId: 'phase39b_exact_revision_file_selection',
      futurePhase: '39B',
      description: 'Select exact Qwen/Qwen3-VL-8B-Instruct revision and file manifest before any model/tokenizer/processor download.',
      executionMode: 'text_only',
      safeToRunNow: false,
      executableCommand: null,
      requiresFutureApproval: true,
      requiredConfirmations: [...PHASE39A_VLM_FUTURE_CONFIRMATIONS.phase39B],
      privateArtifactPrefix: storagePlan.baseStagingPath,
      blockedReason: 'Phase 39A is approval/planning only and cannot download model files.',
      allowedOnlyAfter: [
        'Exact Hugging Face revision is selected.',
        'Exact file manifest is selected.',
        'Human legal review confirms model-card/source terms are unchanged or acceptable.',
      ],
      stillBlocked: [
        'vLLM runtime execution',
        'generated-fixture inference',
        'controlled real-frame inference',
        'beta',
        'production',
      ],
      warnings: [
        'Do not use mutable main/latest model references.',
        'Do not commit model, tokenizer, or processor payloads.',
      ],
    },
    {
      planId: 'phase39b_private_gcs_checksum_manifest',
      futurePhase: '39B',
      description: 'Compute SHA-256 for selected files and stage them only in private generated-assets GCS storage.',
      executionMode: 'text_only',
      safeToRunNow: false,
      executableCommand: null,
      requiresFutureApproval: true,
      requiredConfirmations: [...PHASE39A_VLM_FUTURE_CONFIRMATIONS.phase39B],
      privateArtifactPrefix: storagePlan.baseStagingPath,
      blockedReason: 'No private model object creation or GCS upload is allowed in Phase 39A.',
      allowedOnlyAfter: [
        'Phase 39B current-shell confirmations are set.',
        'Active project/bucket privacy preflight passes.',
        'Temp download path is outside the repo.',
      ],
      stillBlocked: [
        'runtime auto-download',
        'media processing',
        'public model artifacts',
        'Docker push',
        'Cloud Run deploy',
      ],
      warnings: [
        'GCS object metadata may not expose SHA-256; keep local checksum manifest as evidence.',
      ],
    },
  ]
}

export function buildVlmRuntimeHandoffPlan(): VlmHandoffPlan[] {
  return [
    {
      planId: 'phase39c_generated_fixture_vlm_runtime',
      futurePhase: '39C',
      description: 'Run generated-fixture VLM runtime verification only after Phase 39B private model assets and checksums pass.',
      executionMode: 'text_only',
      safeToRunNow: false,
      executableCommand: null,
      requiresFutureApproval: true,
      requiredConfirmations: [...PHASE39A_VLM_FUTURE_CONFIRMATIONS.phase39C],
      privateArtifactPrefix: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/<run-id>/',
      blockedReason: 'Phase 39A cannot run vLLM/Transformers or generated fixture inference.',
      allowedOnlyAfter: [
        'Phase 39B private model asset checksum verification passes.',
        'Runtime dependency versions are pinned and reviewed.',
        'Network/model-download guard is implemented and tested.',
      ],
      stillBlocked: [
        'real media',
        'controlled real frames',
        'arbitrary media',
        'provider calls',
        'beta',
        'production',
      ],
      warnings: [
        'Runtime must use local private paths only.',
        'JSON-only outputs must avoid raw prompt dumps and unsafe media paths.',
      ],
    },
    {
      planId: 'phase39d_controlled_real_frame_vlm',
      futurePhase: '39D',
      description: 'Use exactly one approved private controlled real frame/sample after generated runtime passes.',
      executionMode: 'text_only',
      safeToRunNow: false,
      executableCommand: null,
      requiresFutureApproval: true,
      requiredConfirmations: [...PHASE39A_VLM_FUTURE_CONFIRMATIONS.phase39D],
      privateArtifactPrefix: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39d/controlled-real-frame-vlm/<run-id>/',
      blockedReason: 'Phase 39A cannot process real frames or media bytes.',
      allowedOnlyAfter: [
        'Phase 39C generated-fixture runtime verification passes.',
        'Phase 39D gate selects exactly one approved private sample/window.',
        'Frame count and prompt scope are bounded by the Phase 39D gate.',
      ],
      stillBlocked: [
        'broad real-video VLM',
        'arbitrary media',
        'public output',
        'Track A execution code',
        'beta',
        'production',
      ],
      warnings: [
        'Phase 39D may compare to Phase 37 OCR safe-zone metadata but must not broaden OCR/VLM scope automatically.',
      ],
    },
  ]
}

export function buildVlmGeneratedFixturePlan(): VlmGeneratedFixturePlan {
  return {
    planId: 'phase39c_generated_vlm_fixture_plan_v1',
    futurePhase: '39C',
    fixtureIds: [
      'generated-frame-object-layout-basic',
      'generated-caption-safe-zone-reasoning',
      'generated-ui-text-and-object-grounding',
      'generated-crowded-layout-warning',
      'generated-low-confidence-manual-review',
    ],
    requiredOutputFormat: 'json_only',
    boundedPromptTemplatesRequired: true,
    realMediaAllowed: false,
    providerAllowed: false,
    publicOutputAllowed: false,
    qaMetrics: [
      'schema validity',
      'object/region recall against generated fixture metadata',
      'safe-zone recommendation consistency',
      'confidence/manual-review routing',
      'no network/model download attempts',
    ],
    blockers: [
      'Missing Phase 39B private staged model checksum evidence.',
      'Runtime auto-download attempt.',
      'Output includes raw media bytes, public URLs, or unredacted unsafe paths.',
    ],
    warnings: [
      'VLM safe-zone suggestions are advisory planning hints until later render QA validates them.',
    ],
  }
}

export function buildVlmControlledRealFramePlan(): VlmControlledRealFramePlan {
  return {
    planId: 'phase39d_controlled_real_frame_plan_v1',
    futurePhase: '39D',
    approvedSampleCount: 1,
    selectedSamplePolicy: 'one_approved_private_controlled_frame_or_bounded_sample_only',
    frameCount: 'decided_by_phase39d_gate',
    sourceMediaBytesAllowedInPhase39A: false,
    comparisonInputs: [
      'Phase 39C generated-fixture VLM runtime report',
      'Phase 37D OCR safe-zone metadata, if selected by the Phase 39D gate',
      'Phase 37E caption/render QA metadata, if selected by the Phase 39D gate',
    ],
    blockers: [
      'No controlled real-frame source may be read in Phase 39A.',
      'No frame extraction may occur in Phase 39A.',
      'No raw VLM text for controlled media may be committed.',
    ],
    warnings: [
      'Controlled real-frame VLM evidence should be redacted/hash-only where it derives from private media.',
    ],
  }
}

export function buildVlmToolPlanningIntegrationPlan(): VlmToolPlanningIntegrationPlan {
  return {
    planId: 'phase39e_vlm_tool_planning_integration_v1',
    futurePhase: '39E',
    integrationMode: 'structured_planning_hints_only',
    directToolExecutionAllowed: false,
    rawPromptExecutionAllowed: false,
    userFacingProductionAllowed: false,
    lowConfidenceAutomaticActionsAllowed: false,
    allowedHintTypes: [
      'object-aware caption safe-zone hints',
      'manual-review visual risk flags',
      'layout/crop caution hints',
      'tool-selection confidence annotations',
      'bounded QA observations for internal planning',
    ],
    blockedHintTypes: [
      'automatic render edits',
      'automatic frame crop execution',
      'direct tool calls',
      'raw prompt replay',
      'provider calls',
      'public user-facing claims',
      'low-confidence automatic actions',
    ],
    handoffNotes: [
      'Phase 39E must integrate hints through structured planner fields, not raw model prose.',
      'If runtime or render hooks are needed, defer to a later Track B hook phase instead of modifying Track A execution code.',
    ],
  }
}
