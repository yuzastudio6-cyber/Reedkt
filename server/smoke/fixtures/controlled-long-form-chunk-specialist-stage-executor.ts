import { createHash } from 'node:crypto'
import { chmod, lstat, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ExecuteEditReferenceLongFormChunkMediaStageInput } from '../../edit-references/edit-reference-long-form-chunk-media-executor'
import { EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS } from '../../edit-references/edit-reference-long-form-specialist-stage-contract'
import {
  createEditReferenceLongFormStudyWorkOutput,
  type EditReferenceLongFormStudyOutputArtifact,
  type EditReferenceLongFormStudyWorkOutput,
} from '../../edit-references/edit-reference-long-form-study-work-output'
import { createUnmeteredEditReferenceLongFormStudyUsage } from '../../edit-references/edit-reference-long-form-study-usage-contract'

/**
 * Rights-safe orchestration fixture. It proves scheduling, persistence,
 * lineage, and fail-closed readiness only. It must never be used as product
 * semantic authority.
 */
export async function executeControlledLongFormChunkSpecialistStage(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
): Promise<EditReferenceLongFormStudyWorkOutput> {
  const base = {
    runId: input.runId,
    planId: input.plan.planId,
    planDigestSha256: input.plan.planDigestSha256,
    workItemId: input.workItem.workItemId,
    chunkId: input.workItem.chunkId,
    privateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
    sourceCoverageStartSeconds: input.workItem.sourceCoverageStartSeconds,
    sourceCoverageEndSeconds: input.workItem.sourceCoverageEndSeconds,
    originalRemainsImmutable: true as const,
    rawProcessOutputPersisted: false as const,
    signedUrlPersisted: false as const,
    localFilePathPersisted: false as const,
    providerCallMade: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    remoteMutationMade: false as const,
    createdAt: input.createdAt,
  }
  let result: EditReferenceLongFormStudyWorkOutput['result']
  let artifacts: readonly EditReferenceLongFormStudyOutputArtifact[] = []

  if (input.workItem.stageId === 'speech_transcript') {
    const audio = requireChunkDependency(input, 'audio_extract')
    const transcriptPath = path.join(input.outputDirectory, 'private-transcript.json')
    const transcript = {
      controlledFixture: true,
      chunkId: input.workItem.chunkId,
      segments: [{
        segmentId: `controlled-segment-${input.workItem.chunkId}`,
        startSeconds: input.workItem.sourceCoverageStartSeconds,
        endSeconds: input.workItem.sourceCoverageEndSeconds,
        text: 'Controlled rights-safe transcript evidence for orchestration verification only.',
      }],
    }
    await writeFile(transcriptPath, `${JSON.stringify(transcript)}\n`, { mode: 0o600 })
    await chmod(transcriptPath, 0o600)
    const transcriptBytes = await readFile(transcriptPath)
    const checksumSha256 = sha256(transcriptBytes)
    const stat = await lstat(transcriptPath)
    artifacts = [{
      role: 'private_transcript',
      storageObjectPath: 'private-transcript.json',
      contentType: 'application/json',
      sizeBytes: stat.size,
      checksumSha256,
    }]
    result = {
      kind: 'speech_transcript',
      sourceAudioOutputDigestSha256: audio.outputDigestSha256,
      privateTranscriptArtifactId: `private-transcript-${input.workItem.chunkId}`,
      transcriptArtifactChecksumSha256: checksumSha256,
      speechPresent: true,
      segmentCount: 1,
      wordCount: 8,
      segmentTimingRanges: [],
      languageCode: 'en',
      confidence: 1,
      segmentTimingCoverageRatio: 1,
      wordTimingMode: 'not_available',
      speakerSegmentationMode: 'not_requested',
      fullCoreCoverage: true,
      transcriptTextPersistedInWorkOutput: false,
      rawAudioPersisted: false,
      interpolatedWordTimingUsed: false,
    }
  } else if (input.workItem.stageId === 'caption_ocr') {
    const visual = requireChunkDependency(input, 'visual_sampling')
    if (visual.result.kind !== 'visual_sampling') throw new Error('Controlled OCR fixture lacks visual sampling.')
    const times = [...visual.result.sampleTimesSeconds]
    result = {
      kind: 'caption_ocr',
      framePlanDigestSha256: sha256(JSON.stringify(times)),
      requestedFrameTimesSeconds: times,
      analyzedFrameTimesSeconds: times,
      failedFrameTimesSeconds: [],
      framesWithVisibleText: 0,
      textRegionCount: 0,
      averageRegionConfidence: 0,
      ocrToolId: 'controlled_specialist_fixture',
      ocrEngineExecuted: false,
      fullPlannedFrameCoverage: true,
      rawOcrOutputPersisted: false,
      recognizedTextPersisted: false,
      exactCaptionWordingRetained: false,
    }
  } else if (input.workItem.stageId === 'semantic_chunk_synthesis') {
    const dependencyDigests = input.dependencyOutputs.map((output) => output.outputDigestSha256)
    if (dependencyDigests.length < 6) throw new Error('Controlled semantic fixture lacks complete dependencies.')
    result = {
      kind: 'semantic_chunk_synthesis',
      inputOutputDigestsSha256: dependencyDigests,
      semanticWindowPlanDigestSha256: sha256(`controlled-semantic-window-plan:${input.workItem.chunkId}`),
      specialistCoverage: EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS.map((specialistId) => ({
        specialistId,
        status: 'analyzed' as const,
        confidence: 1,
        runtimeSource: 'verified_local' as const,
        semanticResultDigestSha256: sha256(`controlled-specialist:${specialistId}:${input.workItem.chunkId}`),
        evidenceOutputDigestsSha256: [dependencyDigests[0] as string],
      })),
      synthesisRuntime: {
        runtimeSource: 'verified_mock',
        adapterId: 'controlled_long_form_semantic_fixture',
        adapterVersion: 'v1',
        providerId: null,
        modelId: 'controlled_fixture',
        modelRevision: 'v1',
        modelAggregateSha256: sha256('controlled-long-form-semantic-fixture-v1'),
        modelRoutingPolicyVersion: 'controlled_test_only',
        synthesisInstructionDigestSha256: sha256(`controlled-synthesis:${input.workItem.chunkId}`),
        reasoningRouteId: null,
        reasoningAttemptId: null,
        reasoningRouteAuthorizationDigestSha256: null,
        providerCallMade: false,
        modelCallMade: false,
      },
      findings: [
        {
          findingId: `controlled-visual-${input.workItem.chunkId}`,
          category: 'visual_language',
          summary: 'Controlled fixture verifies bounded visual evidence can remain linked to one exact source section.',
          confidence: 1,
          evidenceOutputDigestsSha256: [dependencyDigests[0] as string],
          transferable: true,
          targetAdaptationRequired: true,
          exactCopyInstructionCreated: false,
        },
        {
          findingId: `controlled-story-${input.workItem.chunkId}`,
          category: 'story_structure',
          summary: 'Controlled fixture verifies section findings can be reconciled without copying exact source timing or sequence.',
          confidence: 1,
          evidenceOutputDigestsSha256: [dependencyDigests.at(-1) as string],
          transferable: true,
          targetAdaptationRequired: true,
          exactCopyInstructionCreated: false,
        },
      ],
      chunkSummary: 'Controlled fixture output proves schema, lineage, privacy, checkpointing, and cross-section dependency behavior only.',
      fullChunkEvidenceReconciled: true,
      rawProviderPayloadPersisted: false,
      rawTranscriptPersistedInWorkOutput: false,
      referenceMediaCopiedToTarget: false,
      executableTargetInstructionsCreated: false,
    }
  } else {
    throw new Error(`Controlled chunk-specialist fixture does not own ${input.workItem.stageId}.`)
  }

  return createEditReferenceLongFormStudyWorkOutput({
    ...base,
    stageId: result.kind,
    toolIds: ['controlled_specialist_fixture'],
    artifacts,
    result,
    runtimeSource: 'verified_mock',
    completionAuthority: 'controlled_mock',
    usage: createUnmeteredEditReferenceLongFormStudyUsage({
      mode: 'controlled_test_unmetered',
      observedWallClockMs: 1,
      inputMediaSeconds: input.workItem.sourceCoverageEndSeconds - input.workItem.sourceCoverageStartSeconds,
      outputBytes: artifacts.reduce((sum, artifact) => sum + artifact.sizeBytes, 0),
    }),
  })
}

function requireChunkDependency(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  stageId: EditReferenceLongFormStudyWorkOutput['stageId'],
): EditReferenceLongFormStudyWorkOutput {
  const output = input.dependencyOutputs.find((candidate) => (
    candidate.stageId === stageId && candidate.chunkId === input.workItem.chunkId
  ))
  if (!output) throw new Error(`Controlled chunk-specialist fixture is missing ${stageId}.`)
  return output
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
