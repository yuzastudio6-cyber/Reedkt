import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

interface AuditCase {
  readonly id: string
  readonly relativePath: string
  readonly expectedJsonStatus?: 'passed' | 'conflict_observed'
  readonly validate?: (receipt: Record<string, unknown>) => void
}

const repositoryRoot = process.cwd()
const tsxEntrypoint = join(
  repositoryRoot,
  'node_modules',
  '.bin',
  'tsx',
)
assert.equal(
  existsSync(tsxEntrypoint),
  true,
  'Private Living Frame audit requires the pinned workspace tsx entrypoint.',
)

const cases: readonly AuditCase[] = [
  {
    id: 'parent_skill_and_planning_evidence',
    relativePath:
      'server/smoke/living-frame-planning-evidence-smoke.ts',
    validate(receipt) {
      assert.equal(
        receipt.allRuntimeAuthoritiesClosed,
        true,
      )
      assert.equal(receipt.fixturePromotable, false)
    },
  },
  {
    id: 'parent_and_mini_skill_contract',
    relativePath:
      'server/smoke/living-frame-contract-smoke.ts',
  },
  {
    id: 'subject_neutral_capability_matrix',
    relativePath:
      'server/smoke/living-frame-subject-neutral-capability-matrix-smoke.ts',
  },
  {
    id: 'selected_scene_private_prompt_materialization',
    relativePath:
      'server/smoke/living-frame-controlled-image-selected-scene-private-prompt-materialization-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.dispatchGranted, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id: 'five_modes_depth_attention_captions_sound_and_fallbacks',
    relativePath:
      'server/smoke/living-frame-five-mode-private-render-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.deepEqual(receipt.modesRendered, [
        'living_a_roll',
        'living_still',
        'living_archive',
        'living_diagram',
        'hybrid_expansion',
      ])
      assert.equal(receipt.deliberateNonUseRendered, true)
    },
  },
  {
    id: 'confirmed_non_square_output_frames',
    relativePath:
      'server/smoke/living-frame-confirmed-ratio-private-render-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.exactConfirmedRatioPreserved,
        true,
      )
      assert.equal(
        receipt.squareSubstitutionApplied,
        false,
      )
    },
  },
  {
    id: 'selected_scene_environmental_particle_slice',
    relativePath:
      'server/smoke/living-frame-selected-scene-environmental-particle-internal-test-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.privateInternalParticleSliceEndToEndPassed,
        true,
      )
      assert.equal(receipt.artifactPersisted, true)
      assert.equal(
        receipt.privateReviewEvidenceCompiled,
        true,
      )
    },
  },
  {
    id: 'animation_aware_illustration_component_rig',
    relativePath:
      'server/smoke/living-frame-animation-aware-illustration-private-composite-internal-test-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        Number(receipt.hairSelectedPixelCount) > 350,
        true,
      )
      assert.equal(
        Number(receipt.robeSelectedPixelCount) > 350,
        true,
      )
      assert.equal(
        Number(receipt.hairRegionPixelDelta) > 400,
        true,
      )
      assert.equal(
        Number(receipt.robeRegionPixelDelta) > 400,
        true,
      )
    },
  },
  {
    id: 'semantic_sound_timing_reconciliation',
    relativePath:
      'server/smoke/living-frame-semantic-sound-timing-reconciliation-smoke.ts',
  },
  {
    id: 'canonical_private_review_lineage',
    relativePath:
      'server/smoke/living-frame-canonical-private-review-evidence-smoke.ts',
  },
  {
    id: 'temporal_mask_byte_output_and_measurement',
    relativePath:
      'server/smoke/living-frame-temporal-mask-private-output-contract-internal-test-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.encodingProfile,
        'gray8_ffv1_matroska_mask_sequence_v1',
      )
      assert.equal(
        receipt.losslessFrameReplayVerified,
        true,
      )
      assert.deepEqual(receipt.findingCodes, [])
      assert.equal(receipt.sam2InferenceClaimed, false)
    },
  },
  {
    id: 'temporal_mask_shared_interface_gate',
    relativePath:
      'server/smoke/living-frame-temporal-mask-canonical-work-graph-conflict-smoke.ts',
    expectedJsonStatus: 'conflict_observed',
    validate(receipt) {
      assert.equal(
        receipt.requestedAssetKind,
        'temporal_subject_mask_sequence',
      )
      assert.equal(
        receipt.observedOperationId,
        'tool.rembg.remove_image_background.v1',
      )
      assert.equal(
        receipt.requiredTemporalOperationId,
        'tool.sam2.segment_and_track_subject.v1',
      )
      assert.equal(
        receipt.canonicalOwnerMutationPerformed,
        false,
      )
      assert.equal(receipt.runtimeAuthority, false)
    },
  },
] as const

const results = cases.map(runCase)
const runtimeCaseIds = [
  'five_modes_depth_attention_captions_sound_and_fallbacks',
  'confirmed_non_square_output_frames',
  'selected_scene_environmental_particle_slice',
  'animation_aware_illustration_component_rig',
  'temporal_mask_byte_output_and_measurement',
] as const
for (const runtimeCaseId of runtimeCaseIds) {
  assert.equal(
    results.some((result) =>
      result.id === runtimeCaseId
      && result.exitStatus === 0),
    true,
  )
}

const receipt = {
  smoke:
    'living_frame_private_internal_end_to_end_audit',
  status:
    'passed_with_explicit_blocked_model_runtimes',
  privateInternalOnly: true,
  caseCount: results.length,
  passedCaseCount:
    results.filter((result) =>
      result.exitStatus === 0).length,
  actualMediaRuntimeCaseCount: runtimeCaseIds.length,
  cases: results,
  verifiedCoverage: [
    'composite_parent_and_mini_skill_contract',
    'selected_scene_lineage_and_private_prompt_materialization',
    'all_five_modes_and_deliberate_non_use',
    'flat_shallow_and_deep_2_5d',
    'focus_handoff_attention_restoration_and_low_risk_occlusion',
    'confirmed_portrait_landscape_and_custom_non_square_frames',
    'caption_plane_priority',
    'environmental_particle_runtime_persistence_qa_and_private_review',
    'narration_protected_sound',
    'real_illustration_alpha_destination_composite_and_component_rig',
    'real_gray8_ffv1_temporal_mask_output_decode_measurement_persistence_and_review_frames',
    'render_fallbacks',
    'canonical_private_review_lineage',
  ],
  remainingInternalRuntimeGates: [
    {
      gate:
        'exact_comfyui_controlled_generation_runtime',
      reason:
        'released_five_model_bundle_and_real_l4_execution_evidence_are_unavailable',
    },
    {
      gate:
        'advanced_temporal_living_a_roll_subject_mask',
      reason:
        'byte_output_and_qa_path_passes_but_shared_work_graph_temporal_discriminator_and_approved_sam2_checkpoint_are_unavailable_for_inference',
    },
  ],
  internalEndToEndReadyForOwnerReview: false,
  customerBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}

process.stdout.write(`${JSON.stringify(receipt)}\n`)

function runCase(input: AuditCase): {
  readonly id: string
  readonly exitStatus: 0
  readonly outputDigestSha256: string
  readonly structuredReceiptObserved: boolean
  readonly observedStatus:
    | 'passed'
    | 'conflict_observed'
    | 'not_structured'
} {
  const absolutePath = join(
    repositoryRoot,
    input.relativePath,
  )
  assert.equal(
    existsSync(absolutePath),
    true,
    `Private Living Frame audit case is missing: ${input.id}.`,
  )
  const execution = spawnSync(
    tsxEntrypoint,
    [absolutePath],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 8 * 1024 * 1024,
      timeout: 15 * 60 * 1_000,
    },
  )
  assert.equal(
    execution.status,
    0,
    `Private Living Frame audit case failed: ${input.id}.`,
  )
  const stdout = execution.stdout
  const structuredReceipt = parseLastJsonObject(stdout)
  if (input.expectedJsonStatus) {
    assert.ok(
      structuredReceipt,
      `Private Living Frame audit case did not emit structured evidence: ${input.id}.`,
    )
    assert.equal(
      structuredReceipt.status,
      input.expectedJsonStatus,
    )
  }
  if (input.validate) {
    assert.ok(
      structuredReceipt,
      `Private Living Frame audit case cannot be validated without structured evidence: ${input.id}.`,
    )
    input.validate(structuredReceipt)
  }
  return {
    id: input.id,
    exitStatus: 0,
    outputDigestSha256:
      createHash('sha256')
        .update(stdout)
        .digest('hex'),
    structuredReceiptObserved:
      structuredReceipt != null,
    observedStatus:
      structuredReceipt?.status === 'passed'
      || structuredReceipt?.status === 'conflict_observed'
        ? structuredReceipt.status
        : 'not_structured',
  }
}

function parseLastJsonObject(
  output: string,
): Record<string, unknown> | null {
  const lines = output.trim().split(/\r?\n/u)
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]?.trim()
    if (!line?.startsWith('{')) {
      continue
    }
    try {
      const parsed = JSON.parse(line) as unknown
      if (
        parsed
        && typeof parsed === 'object'
        && !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // Continue to the previous output line.
    }
  }
  return null
}
