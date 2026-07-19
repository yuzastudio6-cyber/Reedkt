import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { ApiError } from '../errors/api-error'
import {
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID,
} from '../edit-architecture/professional-long-form-first-child-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID,
} from '../edit-architecture/professional-long-form-source-authority-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID,
} from '../edit-architecture/professional-long-form-master-timing-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID,
} from '../edit-architecture/professional-long-form-cross-chunk-color-continuity-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID,
} from '../edit-architecture/professional-long-form-master-assembly-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID,
} from '../edit-architecture/professional-long-form-private-master-qa-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
} from '../edit-architecture/professional-long-form-first-object-chunk-execution-contract'
import {
  PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS,
  beginPrivateInternalAttemptCostEvidence,
  privateInternalAttemptCostEvidenceSchema,
  readPrivateInternalAttemptCostEvidence,
  type PrivateInternalAttemptCostClock,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-internal-attempt-cost-'))

try {
  const common = {
    localStorageRoot: root,
    workspaceId: 'workspace-cost-proof',
    projectId: 'project-cost-proof',
    editSessionId: 'edit-cost-proof',
    approvedPlanSnapshotId: 'snapshot-cost-proof',
    approvedWorkItemId: 'work-item-cost-proof',
    jobId: 'job-cost-proof',
    executionAttemptId: 'attempt-cost-proof-1',
    retryAttempt: 0,
    toolId: 'deepfilternet' as const,
    operationId: 'tool.deepfilternet.enhance_voice.v1' as const,
  }
  const linkedCanonicalOutcomeHash = 'a'.repeat(64)
  const first = await beginPrivateInternalAttemptCostEvidence(common, clock([
    1_000_000_000n,
    2_500_000_000n,
  ], ['2026-07-11T12:00:00.000Z']))
  const inserted = await first.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 384_214,
    linkedCanonicalOutcomeHash,
  })
  assert.equal(inserted.idempotencyStatus, 'inserted')
  assert.equal(inserted.evidence.boundary, 'internal_production_cost_only')
  assert.equal(inserted.evidence.evidenceClassification, 'provisional_local_metered')
  assert.equal(inserted.evidence.rateCardVersion, 'rp-ratecard-01-mock-safe')
  assert.equal(inserted.evidence.resourceUsage.wallTimeMilliseconds, 1_500)
  assert.equal(inserted.evidence.resourceUsage.billableMilliseconds, 1_500)
  assert.equal(inserted.evidence.resourceUsage.vcpuCount, 4)
  assert.equal(inserted.evidence.resourceUsage.memoryGib, 4)
  assert.equal(inserted.evidence.resourceUsage.gpuCount, 0)
  assert.equal(inserted.evidence.resourceUsage.outputByteLength, 384_214)
  assert(Number.isSafeInteger(inserted.evidence.actualInternalCostMicros))
  assert(inserted.evidence.actualInternalCostMicros > 0)
  assert.equal(inserted.evidence.linkedCanonicalOutcomeHash, linkedCanonicalOutcomeHash)
  assert.equal(inserted.evidence.persistence.privateLocalCreateOnly, true)
  assert.equal(inserted.evidence.persistence.databaseBacked, false)
  assert.equal(inserted.evidence.persistence.productionDurability, false)
  assert.equal(inserted.evidence.persistence.invoiceReconciled, false)
  assertNoCommercialKeys(inserted.evidence)

  const persisted = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: root,
    workspaceId: common.workspaceId,
    projectId: common.projectId,
    executionAttemptId: common.executionAttemptId,
  })
  assert.deepEqual(persisted, inserted.evidence)

  const replayMeter = await beginPrivateInternalAttemptCostEvidence(common, clock([
    3_000_000_000n,
    9_000_000_000n,
  ], ['2026-07-11T12:01:00.000Z']))
  const replay = await replayMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 384_214,
    linkedCanonicalOutcomeHash,
  })
  assert.equal(replay.idempotencyStatus, 'duplicate_returned')
  assert.deepEqual(replay.evidence, inserted.evidence)

  await expectCode(() => beginPrivateInternalAttemptCostEvidence({
    ...common,
    jobId: 'different-job',
  }), 'IDEMPOTENCY_CONFLICT')

  const failedInput = {
    ...common,
    executionAttemptId: 'attempt-cost-proof-2',
    retryAttempt: 1,
  }
  const failedMeter = await beginPrivateInternalAttemptCostEvidence(failedInput, clock([
    10_000_000_000n,
    11_250_000_000n,
  ], ['2026-07-11T12:02:00.000Z']))
  const failed = await failedMeter.finalize({
    status: 'failed',
    failureCategory: 'reeditpro_error_absorbed',
    outputByteLength: null,
    linkedCanonicalOutcomeHash: null,
  })
  assert.equal(failed.idempotencyStatus, 'inserted')
  assert.equal(failed.evidence.outcome.status, 'failed')
  assert.equal(failed.evidence.identity.retryAttempt, 1)
  assert.equal(failed.evidence.resourceUsage.outputByteLength, null)
  assert(failed.evidence.actualInternalCostMicros > 0)
  assert.notEqual(failed.evidence.evidenceHash, inserted.evidence.evidenceHash)
  assertNoCommercialKeys(failed.evidence)

  const remotionInput = {
    ...common,
    approvedWorkItemId: 'work-item-remotion-chunk-cost-proof',
    jobId: 'job-remotion-chunk-cost-proof',
    executionAttemptId: 'attempt-cost-remotion-chunk-proof',
    toolId: 'remotion' as const,
    operationId: 'tool.remotion.render_approved_composition.v1' as const,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.remotionFourKSourceSliceChunk,
  }
  const remotionMeter = await beginPrivateInternalAttemptCostEvidence(
    remotionInput,
    clock([20_000_000_000n, 24_250_000_000n], ['2026-07-11T12:03:00.000Z']),
  )
  const remotion = await remotionMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 24_000_000,
    linkedCanonicalOutcomeHash: 'b'.repeat(64),
  })
  assert.equal(remotion.evidence.identity.toolId, 'remotion')
  assert.equal(remotion.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.remotionFourKSourceSliceChunk)
  assert.equal(remotion.evidence.resourceUsage.vcpuCount, 2)
  assert.equal(remotion.evidence.resourceUsage.memoryGib, 4)
  assert.equal(remotion.evidence.resourceUsage.gpuCount, 0)
  assertNoCommercialKeys(remotion.evidence)
  assert.equal(privateInternalAttemptCostEvidenceSchema.safeParse({
    ...remotion.evidence,
    resourceUsage: { ...remotion.evidence.resourceUsage, vcpuCount: 4 },
  }).success, false)
  assert.equal(privateInternalAttemptCostEvidenceSchema.safeParse({
    ...remotion.evidence,
    customerCredits: 1,
  }).success, false)
  await expectCode(() => beginPrivateInternalAttemptCostEvidence({
    ...remotionInput,
    workloadProfileId: undefined,
  } as never), 'VALIDATION_FAILED')

  const ffmpegInput = {
    ...common,
    approvedWorkItemId: 'work-item-ffmpeg-finalizer-cost-proof',
    jobId: 'job-ffmpeg-finalizer-cost-proof',
    executionAttemptId: 'attempt-cost-ffmpeg-finalizer-proof',
    toolId: 'ffmpeg' as const,
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1' as const,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization,
  }
  const ffmpegMeter = await beginPrivateInternalAttemptCostEvidence(
    ffmpegInput,
    clock([30_000_000_000n, 32_750_000_000n], ['2026-07-11T12:04:00.000Z']),
  )
  const ffmpeg = await ffmpegMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 32_000_000,
    linkedCanonicalOutcomeHash: 'c'.repeat(64),
  })
  assert.equal(ffmpeg.evidence.identity.toolId, 'ffmpeg')
  assert.equal(ffmpeg.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization)
  assert.equal(ffmpeg.evidence.resourceUsage.vcpuCount, 2)
  assert.equal(ffmpeg.evidence.resourceUsage.memoryGib, 4)
  assert.equal(ffmpeg.evidence.resourceUsage.gpuCount, 0)
  assertNoCommercialKeys(ffmpeg.evidence)

  const finalMasterVideoQaInput = {
    ...common,
    approvedWorkItemId: 'work-item-final-master-decoded-video-qa-cost-proof',
    jobId: 'job-final-master-decoded-video-qa-cost-proof',
    executionAttemptId: 'attempt-final-master-decoded-video-qa-cost-proof',
    toolId: 'ffmpeg' as const,
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1' as const,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa,
  }
  const finalMasterVideoQaMeter = await beginPrivateInternalAttemptCostEvidence(
    finalMasterVideoQaInput,
    clock([33_000_000_000n, 34_500_000_000n], ['2026-07-11T12:04:10.000Z']),
  )
  const finalMasterVideoQa = await finalMasterVideoQaMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 16_384,
    linkedCanonicalOutcomeHash: '3'.repeat(64),
  })
  assert.equal(finalMasterVideoQa.evidence.identity.toolId, 'ffmpeg')
  assert.equal(
    finalMasterVideoQa.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa,
  )
  assert.deepEqual(
    {
      vcpuCount: finalMasterVideoQa.evidence.resourceUsage.vcpuCount,
      memoryGib: finalMasterVideoQa.evidence.resourceUsage.memoryGib,
      gpuCount: finalMasterVideoQa.evidence.resourceUsage.gpuCount,
      networkEgressMib: finalMasterVideoQa.evidence.resourceUsage.networkEgressMib,
    },
    { vcpuCount: 2, memoryGib: 2, gpuCount: 0, networkEgressMib: 0 },
  )
  assert(finalMasterVideoQa.evidence.actualInternalCostMicros > 0)
  assertNoCommercialKeys(finalMasterVideoQa.evidence)
  assert.equal(privateInternalAttemptCostEvidenceSchema.safeParse({
    ...finalMasterVideoQa.evidence,
    resourceUsage: {
      ...finalMasterVideoQa.evidence.resourceUsage,
      memoryGib: 4,
    },
  }).success, false)

  const finalMasterAudioQaInput = {
    ...common,
    approvedWorkItemId: 'work-item-final-master-decoded-audio-qa-cost-proof',
    jobId: 'job-final-master-decoded-audio-qa-cost-proof',
    executionAttemptId: 'attempt-final-master-decoded-audio-qa-cost-proof',
    toolId: 'ffmpeg' as const,
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1' as const,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa,
  }
  const finalMasterAudioQaMeter = await beginPrivateInternalAttemptCostEvidence(
    finalMasterAudioQaInput,
    clock([34_500_000_000n, 35_500_000_000n], ['2026-07-11T12:04:20.000Z']),
  )
  const finalMasterAudioQa = await finalMasterAudioQaMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 12_288,
    linkedCanonicalOutcomeHash: '4'.repeat(64),
  })
  assert.equal(finalMasterAudioQa.evidence.identity.toolId, 'ffmpeg')
  assert.equal(
    finalMasterAudioQa.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa,
  )
  assert.deepEqual(
    {
      vcpuCount: finalMasterAudioQa.evidence.resourceUsage.vcpuCount,
      memoryGib: finalMasterAudioQa.evidence.resourceUsage.memoryGib,
      gpuCount: finalMasterAudioQa.evidence.resourceUsage.gpuCount,
      networkEgressMib: finalMasterAudioQa.evidence.resourceUsage.networkEgressMib,
    },
    { vcpuCount: 2, memoryGib: 2, gpuCount: 0, networkEgressMib: 0 },
  )
  assert(finalMasterAudioQa.evidence.actualInternalCostMicros > 0)
  assertNoCommercialKeys(finalMasterAudioQa.evidence)

  const objectChunkRenderInput = {
    ...common,
    approvedWorkItemId: 'long-form-object-chunk-1-render',
    jobId: 'long-form-object-chunk-render-job-cost-proof',
    executionAttemptId: 'attempt-long-form-object-chunk-render-cost-proof',
    toolId: 'ffmpeg' as const,
    operationId: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKObjectMezzanineChunk,
  }
  const objectChunkRenderMeter = await beginPrivateInternalAttemptCostEvidence(
    objectChunkRenderInput,
    clock([35_000_000_000n, 38_000_000_000n], ['2026-07-11T12:04:30.000Z']),
  )
  const objectChunkRender = await objectChunkRenderMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 28_000_000,
    linkedCanonicalOutcomeHash: '1'.repeat(64),
  })
  assert.equal(objectChunkRender.evidence.identity.toolId, 'ffmpeg')
  assert.equal(
    objectChunkRender.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKObjectMezzanineChunk,
  )
  assert.deepEqual(
    {
      vcpuCount: objectChunkRender.evidence.resourceUsage.vcpuCount,
      memoryGib: objectChunkRender.evidence.resourceUsage.memoryGib,
      gpuCount: objectChunkRender.evidence.resourceUsage.gpuCount,
    },
    { vcpuCount: 2, memoryGib: 4, gpuCount: 0 },
  )
  assertNoCommercialKeys(objectChunkRender.evidence)

  const objectChunkQaInput = {
    ...common,
    approvedWorkItemId: 'long-form-object-chunk-1-qa',
    jobId: 'long-form-object-chunk-qa-job-cost-proof',
    executionAttemptId: 'attempt-long-form-object-chunk-qa-cost-proof',
    toolId: 'ffprobe' as const,
    operationId: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeFourKObjectMezzanineChunkQa,
  }
  const objectChunkQaMeter = await beginPrivateInternalAttemptCostEvidence(
    objectChunkQaInput,
    clock([38_000_000_000n, 38_750_000_000n], ['2026-07-11T12:04:45.000Z']),
  )
  const objectChunkQa = await objectChunkQaMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 12_000,
    linkedCanonicalOutcomeHash: '2'.repeat(64),
  })
  assert.equal(objectChunkQa.evidence.identity.toolId, 'ffprobe')
  assert.equal(
    objectChunkQa.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeFourKObjectMezzanineChunkQa,
  )
  assert.deepEqual(
    {
      vcpuCount: objectChunkQa.evidence.resourceUsage.vcpuCount,
      memoryGib: objectChunkQa.evidence.resourceUsage.memoryGib,
      gpuCount: objectChunkQa.evidence.resourceUsage.gpuCount,
    },
    { vcpuCount: 2, memoryGib: 4, gpuCount: 0 },
  )
  assertNoCommercialKeys(objectChunkQa.evidence)

  const longFormValidationInput = {
    ...common,
    approvedWorkItemId: 'long-form-validate-approved-snapshot',
    jobId: 'long-form-child-job-cost-proof',
    executionAttemptId: 'attempt-long-form-snapshot-validation-cost-proof',
    toolId: 'reeditpro_internal' as const,
    operationId: PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.professionalLongFormSnapshotValidation,
  }
  const longFormValidationMeter = await beginPrivateInternalAttemptCostEvidence(
    longFormValidationInput,
    clock([40_000_000_000n, 40_250_000_000n], ['2026-07-11T12:05:00.000Z']),
  )
  const longFormValidation = await longFormValidationMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 8_192,
    linkedCanonicalOutcomeHash: 'd'.repeat(64),
  })
  assert.equal(longFormValidation.evidence.identity.toolId, 'reeditpro_internal')
  assert.equal(longFormValidation.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.professionalLongFormSnapshotValidation)
  assert.equal(longFormValidation.evidence.resourceUsage.vcpuCount, 2)
  assert.equal(longFormValidation.evidence.resourceUsage.memoryGib, 4)
  assert.equal(longFormValidation.evidence.resourceUsage.gpuCount, 0)
  assertNoCommercialKeys(longFormValidation.evidence)

  const longFormSourceAuthorityInput = {
    ...common,
    approvedWorkItemId: 'long-form-validate-private-sources',
    jobId: 'long-form-source-authority-job-cost-proof',
    executionAttemptId: 'attempt-long-form-source-authority-cost-proof',
    toolId: 'reeditpro_internal' as const,
    operationId: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS
        .professionalLongFormSourceAuthorityValidation,
  }
  const longFormSourceAuthorityMeter =
    await beginPrivateInternalAttemptCostEvidence(
      longFormSourceAuthorityInput,
      clock([50_000_000_000n, 50_375_000_000n], [
        '2026-07-11T12:06:00.000Z',
      ]),
    )
  const longFormSourceAuthority = await longFormSourceAuthorityMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 16_384,
    linkedCanonicalOutcomeHash: 'e'.repeat(64),
  })
  assert.equal(
    longFormSourceAuthority.evidence.identity.toolId,
    'reeditpro_internal',
  )
  assert.equal(
    longFormSourceAuthority.evidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID,
  )
  assert.equal(
    longFormSourceAuthority.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS
      .professionalLongFormSourceAuthorityValidation,
  )
  assert.equal(longFormSourceAuthority.evidence.resourceUsage.vcpuCount, 2)
  assert.equal(longFormSourceAuthority.evidence.resourceUsage.memoryGib, 4)
  assert.equal(longFormSourceAuthority.evidence.resourceUsage.gpuCount, 0)
  assertNoCommercialKeys(longFormSourceAuthority.evidence)

  const longFormMasterTimingInput = {
    ...common,
    approvedWorkItemId: 'long-form-validate-master-timing',
    jobId: 'long-form-master-timing-job-cost-proof',
    executionAttemptId: 'attempt-long-form-master-timing-cost-proof',
    toolId: 'reeditpro_internal' as const,
    operationId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS
        .professionalLongFormMasterTimingValidation,
  }
  const longFormMasterTimingMeter =
    await beginPrivateInternalAttemptCostEvidence(
      longFormMasterTimingInput,
      clock([60_000_000_000n, 60_500_000_000n], [
        '2026-07-11T12:07:00.000Z',
      ]),
    )
  const longFormMasterTiming = await longFormMasterTimingMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 12_288,
    linkedCanonicalOutcomeHash: 'f'.repeat(64),
  })
  assert.equal(longFormMasterTiming.evidence.identity.toolId, 'reeditpro_internal')
  assert.equal(
    longFormMasterTiming.evidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID,
  )
  assert.equal(
    longFormMasterTiming.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS
      .professionalLongFormMasterTimingValidation,
  )
  assert.equal(longFormMasterTiming.evidence.resourceUsage.vcpuCount, 2)
  assert.equal(longFormMasterTiming.evidence.resourceUsage.memoryGib, 4)
  assert.equal(longFormMasterTiming.evidence.resourceUsage.gpuCount, 0)
  assertNoCommercialKeys(longFormMasterTiming.evidence)

  const longFormCrossChunkColorInput = {
    ...common,
    approvedWorkItemId: 'long-form-validate-cross-chunk-color-continuity',
    jobId: 'long-form-cross-chunk-color-job-cost-proof',
    executionAttemptId: 'attempt-long-form-cross-chunk-color-cost-proof',
    toolId: 'ffmpeg' as const,
    operationId: PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegCrossChunkColorContinuity,
  }
  const longFormCrossChunkColorMeter =
    await beginPrivateInternalAttemptCostEvidence(
      longFormCrossChunkColorInput,
      clock([70_000_000_000n, 72_250_000_000n], [
        '2026-07-11T12:08:00.000Z',
      ]),
    )
  const longFormCrossChunkColor = await longFormCrossChunkColorMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 24_576,
    linkedCanonicalOutcomeHash: '0'.repeat(64),
  })
  assert.equal(longFormCrossChunkColor.evidence.identity.toolId, 'ffmpeg')
  assert.equal(
    longFormCrossChunkColor.evidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID,
  )
  assert.equal(
    longFormCrossChunkColor.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegCrossChunkColorContinuity,
  )
  assert.deepEqual(
    {
      vcpuCount: longFormCrossChunkColor.evidence.resourceUsage.vcpuCount,
      memoryGib: longFormCrossChunkColor.evidence.resourceUsage.memoryGib,
      gpuCount: longFormCrossChunkColor.evidence.resourceUsage.gpuCount,
    },
    { vcpuCount: 2, memoryGib: 4, gpuCount: 0 },
  )
  assertNoCommercialKeys(longFormCrossChunkColor.evidence)

  const longFormMasterAssemblyInput = {
    ...common,
    approvedWorkItemId: 'long-form-finalize-private-4k-master',
    jobId: 'long-form-master-assembly-job-cost-proof',
    executionAttemptId: 'attempt-long-form-master-assembly-cost-proof',
    toolId: 'ffmpeg' as const,
    operationId: PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegLongFormMasterAssembly,
  }
  const longFormMasterAssemblyMeter =
    await beginPrivateInternalAttemptCostEvidence(
      longFormMasterAssemblyInput,
      clock([73_000_000_000n, 76_500_000_000n], [
        '2026-07-11T12:09:00.000Z',
      ]),
    )
  const longFormMasterAssembly = await longFormMasterAssemblyMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 64_000_000,
    linkedCanonicalOutcomeHash: '9'.repeat(64),
  })
  assert.equal(longFormMasterAssembly.evidence.identity.toolId, 'ffmpeg')
  assert.equal(
    longFormMasterAssembly.evidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID,
  )
  assert.equal(
    longFormMasterAssembly.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegLongFormMasterAssembly,
  )
  assert.deepEqual(
    {
      vcpuCount: longFormMasterAssembly.evidence.resourceUsage.vcpuCount,
      memoryGib: longFormMasterAssembly.evidence.resourceUsage.memoryGib,
      gpuCount: longFormMasterAssembly.evidence.resourceUsage.gpuCount,
    },
    { vcpuCount: 2, memoryGib: 4, gpuCount: 0 },
  )
  assertNoCommercialKeys(longFormMasterAssembly.evidence)

  const longFormPrivateMasterQaInput = {
    ...common,
    approvedWorkItemId: 'long-form-qa-private-4k-master',
    jobId: 'long-form-private-master-qa-job-cost-proof',
    executionAttemptId: 'attempt-long-form-private-master-qa-cost-proof',
    toolId: 'ffprobe' as const,
    operationId: PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID,
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeLongFormPrivateMasterQa,
  }
  const longFormPrivateMasterQaMeter =
    await beginPrivateInternalAttemptCostEvidence(
      longFormPrivateMasterQaInput,
      clock([77_000_000_000n, 79_250_000_000n], [
        '2026-07-11T12:10:00.000Z',
      ]),
    )
  const longFormPrivateMasterQa = await longFormPrivateMasterQaMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 24_000,
    linkedCanonicalOutcomeHash: '8'.repeat(64),
  })
  assert.equal(longFormPrivateMasterQa.evidence.identity.toolId, 'ffprobe')
  assert.equal(
    longFormPrivateMasterQa.evidence.identity.operationId,
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID,
  )
  assert.equal(
    longFormPrivateMasterQa.evidence.identity.workloadProfileId,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeLongFormPrivateMasterQa,
  )
  assert.deepEqual(
    {
      vcpuCount: longFormPrivateMasterQa.evidence.resourceUsage.vcpuCount,
      memoryGib: longFormPrivateMasterQa.evidence.resourceUsage.memoryGib,
      gpuCount: longFormPrivateMasterQa.evidence.resourceUsage.gpuCount,
    },
    { vcpuCount: 2, memoryGib: 4, gpuCount: 0 },
  )
  assertNoCommercialKeys(longFormPrivateMasterQa.evidence)

  await expectCode(() => beginPrivateInternalAttemptCostEvidence({
    ...ffmpegInput,
    jobId: remotionInput.jobId,
    approvedWorkItemId: remotionInput.approvedWorkItemId,
    executionAttemptId: remotionInput.executionAttemptId,
  }), 'IDEMPOTENCY_CONFLICT')

  await expectCode(async () => {
    const conflict = await beginPrivateInternalAttemptCostEvidence(failedInput)
    await conflict.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: 384_214,
      linkedCanonicalOutcomeHash,
    })
  }, 'IDEMPOTENCY_CONFLICT')

  console.log(JSON.stringify({
    ok: true,
    schemaVersion: inserted.evidence.schemaVersion,
    rateCardVersion: inserted.evidence.rateCardVersion,
    successfulAttemptCostMicros: inserted.evidence.actualInternalCostMicros,
    failedAttemptCostMicros: failed.evidence.actualInternalCostMicros,
    remotionChunkAttemptCostMicros: remotion.evidence.actualInternalCostMicros,
    ffmpegFinalizationAttemptCostMicros: ffmpeg.evidence.actualInternalCostMicros,
    finalMasterDecodedVideoQaAttemptCostMicros:
      finalMasterVideoQa.evidence.actualInternalCostMicros,
    finalMasterDecodedAudioQaAttemptCostMicros:
      finalMasterAudioQa.evidence.actualInternalCostMicros,
    ffmpegObjectChunkAttemptCostMicros:
      objectChunkRender.evidence.actualInternalCostMicros,
    ffprobeObjectChunkQaAttemptCostMicros:
      objectChunkQa.evidence.actualInternalCostMicros,
    longFormSnapshotValidationAttemptCostMicros:
      longFormValidation.evidence.actualInternalCostMicros,
    longFormSourceAuthorityValidationAttemptCostMicros:
      longFormSourceAuthority.evidence.actualInternalCostMicros,
    longFormMasterTimingValidationAttemptCostMicros:
      longFormMasterTiming.evidence.actualInternalCostMicros,
    longFormCrossChunkColorAttemptCostMicros:
      longFormCrossChunkColor.evidence.actualInternalCostMicros,
    longFormMasterAssemblyAttemptCostMicros:
      longFormMasterAssembly.evidence.actualInternalCostMicros,
    longFormPrivateMasterQaAttemptCostMicros:
      longFormPrivateMasterQa.evidence.actualInternalCostMicros,
    replayHash: replay.evidence.evidenceHash,
    checks: [
      'attempt_level_internal_cost_only',
      'integer_micros_and_versioned_rate_card',
      'create_only_checksum_protected_private_persistence',
      'same_attempt_replay_returns_same_record',
      'conflicting_replay_fails_closed',
      'retry_attempt_has_distinct_cost_record',
      'executed_failure_retains_internal_cost',
      'remotion_4k_chunk_profile_is_2vcpu_4gib_cpu_only',
      'ffmpeg_4k_finalization_profile_is_2vcpu_4gib_cpu_only',
      'ffmpeg_final_master_decoded_video_qa_profile_is_2vcpu_2gib_cpu_only',
      'ffmpeg_final_master_decoded_audio_qa_profile_is_2vcpu_2gib_cpu_only',
      'ffmpeg_4k_object_chunk_profile_is_2vcpu_4gib_cpu_only',
      'ffprobe_4k_object_chunk_qa_profile_is_2vcpu_4gib_cpu_only',
      'professional_long_form_snapshot_validation_profile_is_2vcpu_4gib_cpu_only',
      'professional_long_form_source_authority_validation_profile_is_2vcpu_4gib_cpu_only',
      'professional_long_form_master_timing_validation_profile_is_2vcpu_4gib_cpu_only',
      'ffmpeg_cross_chunk_color_continuity_profile_is_2vcpu_4gib_cpu_only',
      'ffmpeg_long_form_master_assembly_profile_is_2vcpu_4gib_cpu_only',
      'ffprobe_long_form_private_master_qa_profile_is_2vcpu_4gib_cpu_only',
      'cross_profile_attempt_identity_conflict_fails_closed',
      'resource_profile_and_commercial_field_mutations_fail_schema_validation',
      'commercial_pricing_credit_and_wallet_fields_absent',
    ],
  }))
} finally {
  await rm(root, { recursive: true, force: true })
}

function clock(nanoseconds: bigint[], timestamps: string[]): PrivateInternalAttemptCostClock {
  return {
    monotonicNanoseconds() {
      const value = nanoseconds.shift()
      if (value === undefined) throw new Error('Monotonic smoke clock exhausted.')
      return value
    },
    nowIso() {
      const value = timestamps.shift()
      if (value === undefined) throw new Error('Timestamp smoke clock exhausted.')
      return value
    },
  }
}

async function expectCode(action: () => unknown | Promise<unknown>, code: string) {
  await assert.rejects(async () => action(), (error: unknown) => {
    assert(error instanceof ApiError)
    assert.equal(error.code, code)
    return true
  })
}

function assertNoCommercialKeys(value: unknown): void {
  const keys: string[] = []
  visit(value, keys)
  const forbidden = keys.filter((key) => {
    const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
    return normalized.includes('customerprice') || normalized.includes('customercredit') ||
      normalized.includes('servicefee') || normalized.includes('markup') ||
      normalized.includes('margin') || normalized.includes('discount') ||
      normalized.includes('wallet') || normalized.includes('settlement') ||
      normalized.includes('billabletouser') || normalized.includes('toolcostcredit') ||
      normalized === 'credits' || normalized === 'tax' || normalized.startsWith('tax')
  })
  assert.deepEqual(forbidden, [])
}

function visit(value: unknown, keys: string[]): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry) => visit(entry, keys))
    return
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    keys.push(key)
    visit(entry, keys)
  }
}
