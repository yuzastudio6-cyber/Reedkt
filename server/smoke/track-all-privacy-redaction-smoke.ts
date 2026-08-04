import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile, spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import {
  activatePrivateOfflineMediaBinaryRuntime,
  compileOfflineTrackAllPrivacyRedactionFfmpegCommand,
  OFFLINE_TRACK_ALL_PRIVACY_REDACTION_PROFILE,
  validateOfflineFfmpegExecutionRequest,
  validateOfflineFfmpegPlanningPayload,
} from '../tool-execution/media-binary-execution'
import {
  createTrackGraphV2,
  trackGraphV2Schema,
} from '../edit-skills/shared/track-graph/track-graph-schemas'
import {
  canonicalSkillJson,
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import { TRACK_ALL_CAPABILITY_MANIFEST } from '../edit-skills/track-all/track-all-capability-manifest'
import {
  trackAllPrivacyQaReportSchema,
  trackedRedactionPlanSchema,
  trackedRedactionResultSchema,
  trackBoxSequenceSchema,
} from '../edit-skills/track-all/track-all-active-artifact-contracts'
import { createPrivacyPolicySnapshot } from '../edit-skills/track-all/track-all-schemas'
import { normalizeTrackAllFfprobeSourceTruth } from '../edit-skills/track-all/private/deterministic-geometry-runtime'
import {
  buildTrackAllPrivacyRedactionExecutionRequest,
  compileTrackAllPrivacyRedaction,
  deriveTrackAllPrivacyQaReport,
  finalizeTrackAllPrivacyRedaction,
  inspectTrackAllPrivacyPreview,
} from '../edit-skills/track-all/private/privacy-redaction-runtime'

const execFileAsync = promisify(execFile)
const directory = await mkdtemp(join(tmpdir(), 'reeditpro-track-all-privacy-'))
const sourcePath = join(directory, 'source.mp4')
const hash = (seed: string) => hashSkillValue({ seed })
const scope = {
  ownerUserId: 'privacy-user',
  workspaceId: 'privacy-workspace',
  projectId: 'privacy-project',
}
const ref = (artifactType: string, sha256: string, byteLength = 1_024) => ({
  artifactType,
  sha256,
  byteLength,
  ...scope,
})

try {
  const ffmpegVersion = await execFileAsync('ffmpeg', ['-version'])
  const ffprobeVersion = await execFileAsync('ffprobe', ['-version'])
  assert.match(ffmpegVersion.stdout, /^ffmpeg version /u)
  assert.match(ffprobeVersion.stdout, /^ffprobe version /u)
  await execFileAsync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'lavfi',
      '-i',
      'testsrc2=size=320x180:rate=24:duration=1',
      '-vf',
      'drawbox=x=92:y=66:w=116:h=48:color=white:t=fill,' +
        'drawgrid=x=92:y=66:w=8:h=8:color=black@1:t=2',
      '-an',
      '-c:v',
      'mpeg4',
      '-q:v',
      '2',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-y',
      sourcePath,
    ],
    { maxBuffer: 2 * 1024 * 1024 },
  )
  const sourceBytes = await readFile(sourcePath)
  const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
  const ffprobe = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-count_frames',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=index,codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames,duration:stream_side_data=rotation',
    '-show_entries',
    'format=duration',
    '-of',
    'json',
    sourcePath,
  ])
  const sourceTruth = normalizeTrackAllFfprobeSourceTruth({
    sourceSha256,
    document: JSON.parse(ffprobe.stdout) as unknown,
  })
  assert.equal(sourceTruth.frameCount, 24)
  assert.equal(sourceTruth.width, 320)
  assert.equal(sourceTruth.height, 180)
  const sourceFrames = await decodeRgb24(sourceBytes)
  assert.equal(sourceFrames.byteLength, 320 * 180 * 3 * 24)

  const reliable = fixture(sourceSha256, false)
  const policy = createPrivacyPolicySnapshot({
    schemaVersion: 'privacy_policy_snapshot_v1',
    ...scope,
    policyVersion: 1,
    failClosed: true,
    allowedTreatments: [
      'gaussian_blur',
      'pixelate',
      'mosaic',
      'solid_fill',
      'conservative_region_cover',
      'tracked_crop_exclusion',
    ],
  })
  const treatmentEvidence: Record<string, string> = {}
  const offlineRuntime = await activatePrivateOfflineMediaBinaryRuntime()
  let confinedRuntimeEvidenceHash = ''
  let forgedInspectionRejected = false
  let unchangedPreviewRejected = false
  for (const treatment of ['gaussian_blur', 'pixelate', 'mosaic', 'solid_fill'] as const) {
    const compiled = compileTrackAllPrivacyRedaction({
      trackGraph: reliable.graph,
      boxSequences: [reliable.boxSequence],
      privacyPolicy: policy,
      sourceTruth,
      targetTrackIds: ['license_plate_001'],
      treatment,
      reflectionRegions: [
        {
          startFrameInclusive: 2,
          endFrameExclusive: 6,
          box: { x: 0.03, y: 0.05, width: 0.15, height: 0.2 },
          groundingEvidenceHash: hash('reflection-grounding'),
        },
      ],
    })
    assert.equal(compiled.conservativeCoverageApplied, false)
    assert.equal(compiled.recipe.treatment, treatment)
    assert.equal(trackedRedactionPlanSchema.parse(compiled.plan).flattenedPreviewRequired, true)
    const request = buildTrackAllPrivacyRedactionExecutionRequest({
      compiled,
      sourceBytes,
    })
    const validatedRequest = validateOfflineFfmpegExecutionRequest(request)
    if (validatedRequest.payload.recipeProfileId !== OFFLINE_TRACK_ALL_PRIVACY_REDACTION_PROFILE) {
      throw new Error('Privacy request resolved to the wrong fixed profile.')
    }
    assert.equal(validatedRequest.payload.publicArtifact, false)
    const command = compileOfflineTrackAllPrivacyRedactionFfmpegCommand(validatedRequest.payload)
    assert.ok(command.includes('-filter_complex'))
    assert.equal(
      command.some((argument) => /https?:|file:|\/tmp\//u.test(argument)),
      false,
    )
    const output = treatment === 'solid_fill'
      ? await (async () => {
          const runtimeResult = await offlineRuntime.execute(validatedRequest)
          assert.equal(runtimeResult.resultArtifact.mimeType, 'video/x-matroska')
          assert.equal(runtimeResult.evidence.semanticEvidence.recipeProfileId,
            OFFLINE_TRACK_ALL_PRIVACY_REDACTION_PROFILE)
          assert.equal(runtimeResult.evidence.semanticEvidence.publicArtifact, false)
          assert.equal(runtimeResult.readiness.privateInternalOnly, true)
          assert.equal(runtimeResult.readiness.productionReady, false)
          if (!('bytes' in runtimeResult.resultArtifact)) {
            throw new Error('Confined privacy runtime did not return its private buffered fixture output.')
          }
          confinedRuntimeEvidenceHash = hashSkillValue({
            imageIdentityHash: runtimeResult.image.imageIdentityHash,
            attestationHash: runtimeResult.attestation.attestationHash,
            resultSha256: runtimeResult.resultArtifact.sha256,
            resourceObservationHash:
              runtimeResult.evidence.resourceObservation.observationHash,
          })
          return runtimeResult.resultArtifact.bytes
        })()
      : await runBinary('ffmpeg', command, sourceBytes)
    assert.ok(output.byteLength > 64)
    const outputSha256 = createHash('sha256').update(output).digest('hex')
    assert.notEqual(outputSha256, sourceSha256)
    const outputFrames = await decodeRgb24(output)
    assert.equal(outputFrames.byteLength, sourceFrames.byteLength)
    const inspection = inspectTrackAllPrivacyPreview({
      compiled,
      sourceFramesRgb24: sourceFrames,
      outputFramesRgb24: outputFrames,
      sourceSha256,
      outputSha256,
    })
    assert.equal(inspection.everyExpectedPrivacyFrameCovered, true)
    assert.equal(inspection.reflectionFramesCovered, true)
    const privateMediaRef = ref(
      'private_flattened_track_all_redaction_preview_v1',
      outputSha256,
      output.byteLength,
    )
    const qa = deriveTrackAllPrivacyQaReport({
      compiled,
      inspection,
      flattenedPreviewRef: privateMediaRef,
      reflectionInspectionRequired: true,
    })
    assert.equal(trackAllPrivacyQaReportSchema.parse(qa).disposition, 'pass')
    const result = finalizeTrackAllPrivacyRedaction({
      compiled,
      privateMediaRef,
      privacyQaReport: qa,
    })
    assert.equal(trackedRedactionResultSchema.parse(result).publicArtifact, false)
    treatmentEvidence[treatment] = hashSkillValue({
      outputSha256,
      inspectionHash: inspection.inspectionHash,
      qaHash: qa.artifactHash,
      resultHash: result.artifactHash,
    })
    if (treatment === 'gaussian_blur') {
      assert.throws(
        () =>
          deriveTrackAllPrivacyQaReport({
            compiled,
            inspection: {
              ...inspection,
              inspectionHash: hash('forged-inspection'),
            },
            flattenedPreviewRef: privateMediaRef,
            reflectionInspectionRequired: true,
          }),
        /stale|forged/iu,
      )
      forgedInspectionRejected = true
      const unchangedInspection = inspectTrackAllPrivacyPreview({
        compiled,
        sourceFramesRgb24: sourceFrames,
        outputFramesRgb24: sourceFrames,
        sourceSha256,
        outputSha256: hash('unchanged-output'),
      })
      const unchangedMediaRef = ref(
        'private_flattened_track_all_redaction_preview_v1',
        unchangedInspection.outputSha256,
        sourceFrames.byteLength,
      )
      const failedQa = deriveTrackAllPrivacyQaReport({
        compiled,
        inspection: unchangedInspection,
        flattenedPreviewRef: unchangedMediaRef,
        reflectionInspectionRequired: true,
      })
      assert.equal(failedQa.disposition, 'critical')
      assert.equal(failedQa.sensitiveExposureDetected, true)
      assert.throws(
        () => finalizeTrackAllPrivacyRedaction({
          compiled,
          privateMediaRef: unchangedMediaRef,
          privacyQaReport: failedQa,
        }),
        /requires the exact independently passed/iu,
      )
      unchangedPreviewRejected = true
    }
  }

  const uncertain = fixture(sourceSha256, true)
  const conservative = compileTrackAllPrivacyRedaction({
    trackGraph: uncertain.graph,
    boxSequences: [uncertain.boxSequence],
    privacyPolicy: policy,
    sourceTruth,
    targetTrackIds: ['license_plate_001'],
    treatment: 'gaussian_blur',
    reflectionRegions: [],
  })
  assert.equal(conservative.conservativeCoverageApplied, true)
  assert.equal(conservative.recipe.treatment, 'solid_fill')
  assert.ok(
    conservative.recipe.maskRegions.some(
      (region) =>
        region.evidenceKind === 'conservative_uncertainty_cover' &&
        region.x === 0 &&
        region.y === 0 &&
        region.width === 320 &&
        region.height === 180 &&
        region.startFrameInclusive <= 10 &&
      region.endFrameExclusive >= 13,
    ),
  )
  const conservativeRequest = buildTrackAllPrivacyRedactionExecutionRequest({
    compiled: conservative,
    sourceBytes,
  })
  if (
    conservativeRequest.payload.recipeProfileId !==
    OFFLINE_TRACK_ALL_PRIVACY_REDACTION_PROFILE
  ) throw new Error('Conservative privacy request resolved to the wrong recipe.')
  const conservativeOutput = await runBinary(
    'ffmpeg',
    compileOfflineTrackAllPrivacyRedactionFfmpegCommand(
      conservativeRequest.payload,
    ),
    sourceBytes,
  )
  const conservativeOutputSha256 = createHash('sha256')
    .update(conservativeOutput).digest('hex')
  const conservativeInspection = inspectTrackAllPrivacyPreview({
    compiled: conservative,
    sourceFramesRgb24: sourceFrames,
    outputFramesRgb24: await decodeRgb24(conservativeOutput),
    sourceSha256,
    outputSha256: conservativeOutputSha256,
  })
  assert.equal(conservativeInspection.conservativeUncertaintyFramesCovered, true)
  const conservativeMediaRef = ref(
    'private_flattened_track_all_redaction_preview_v1',
    conservativeOutputSha256,
    conservativeOutput.byteLength,
  )
  const conservativeQa = deriveTrackAllPrivacyQaReport({
    compiled: conservative,
    inspection: conservativeInspection,
    flattenedPreviewRef: conservativeMediaRef,
    reflectionInspectionRequired: false,
  })
  const conservativeResult = finalizeTrackAllPrivacyRedaction({
    compiled: conservative,
    privateMediaRef: conservativeMediaRef,
    privacyQaReport: conservativeQa,
  })
  assert.equal(conservativeResult.noSensitiveExposure, true)

  assert.throws(
    () =>
      validateOfflineFfmpegPlanningPayload({
        ...conservative.recipe,
        filterComplex: 'movie=/tmp/private.mp4',
      }),
    /outside|contract/iu,
  )
  assert.throws(
    () =>
      validateOfflineFfmpegExecutionRequest({
        ...buildTrackAllPrivacyRedactionExecutionRequest({
          compiled: conservative,
          sourceBytes,
        }),
        command: 'ffmpeg -i /tmp/private.mp4',
      }),
    /outside|contract/iu,
  )
  assert.throws(
    () =>
      validateOfflineFfmpegPlanningPayload({
        ...conservative.recipe,
        publicArtifact: true,
      }),
    /outside|contract/iu,
  )
  assert.throws(
    () =>
      buildTrackAllPrivacyRedactionExecutionRequest({
        compiled: conservative,
        sourceBytes: Buffer.from(sourceBytes).fill(0, 100, 120),
      }),
    /source bytes/iu,
  )
  assert.throws(
    () =>
      compileTrackAllPrivacyRedaction({
        trackGraph: reliable.graph,
        boxSequences: [reliable.boxSequence],
        privacyPolicy: { ...policy, workspaceId: 'other-workspace' },
        sourceTruth,
        targetTrackIds: ['license_plate_001'],
        treatment: 'solid_fill',
        reflectionRegions: [],
      }),
    /hash|stale|forged|authorit/iu,
  )
  assert.throws(
    () =>
      compileTrackAllPrivacyRedaction({
        trackGraph: reliable.graph,
        boxSequences: [reliable.boxSequence],
        privacyPolicy: policy,
        sourceTruth,
        targetTrackIds: ['license_plate_001'],
        treatment: 'tracked_crop_exclusion',
        reflectionRegions: [],
      }),
    /tracked-reframe route/iu,
  )

  console.log(
    JSON.stringify({
      status: 'ok',
      ffmpegVersion: ffmpegVersion.stdout.split('\n')[0],
      ffprobeVersion: ffprobeVersion.stdout.split('\n')[0],
      sourceSha256,
      sourceTruthHash: sourceTruth.technicalTruthHash,
      treatments: treatmentEvidence,
      reliableTrackGraphHash: reliable.graph.graphHash,
      conservativeTrackGraphHash: uncertain.graph.graphHash,
    conservativeRecipeHash: hashSkillValue(conservative.recipe),
    conservativeInspectionHash: conservativeInspection.inspectionHash,
    conservativeQaHash: conservativeQa.artifactHash,
    conservativeResultHash: conservativeResult.artifactHash,
    confinedRuntimeEvidenceHash,
    confinedRuntimeImageIdentityHash: offlineRuntime.image.imageIdentityHash,
      lostTrackFramesFailClosed: true,
      flattenedPrivatePreviewQa: true,
      reflectionCoverageInspected: true,
      forgedInspectionRejected,
      unchangedPreviewRejected,
      rawFilterRejected: true,
      callerCommandRejected: true,
      callerPathAndUrlRejected: true,
      publicArtifactRejected: true,
      outsideAuthorizedRangeModified: false,
    }),
  )
} finally {
  await rm(directory, { recursive: true, force: true })
}

function fixture(sourceSha256: string, uncertainty: boolean) {
  const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
  const assignmentHash = hash('privacy-assignment')
  const planHash = hash(uncertainty ? 'privacy-plan-uncertain' : 'privacy-plan-reliable')
  const authorizedRange = {
    startFrameInclusive: 0,
    endFrameExclusive: 24,
    fps: 24,
  }
  const lineage = {
    ...scope,
    editSessionId: 'privacy-edit-session',
    assignmentId: 'privacy-assignment',
    assignmentHash,
    planHash,
    manifestRef,
    sourceSha256,
    authorizedRange,
  }
  const boxCore = {
    schemaVersion: 'track_box_sequence_v1' as const,
    ...lineage,
    trackId: 'license_plate_001',
    boxes: Array.from({ length: 24 }, (_, frameIndex) => ({
      frameIndex,
      box: { x: 0.28 + frameIndex * 0.001, y: 0.34, width: 0.4, height: 0.32 },
      confidence: uncertainty && frameIndex >= 10 && frameIndex < 13 ? 0.25 : 0.96,
    })),
  }
  const boxSequence = trackBoxSequenceSchema.parse({
    ...boxCore,
    artifactHash: hashSkillValue(boxCore),
  })
  const boxRef = ref(
    'track_box_sequence_v1',
    boxSequence.artifactHash,
    Buffer.byteLength(canonicalSkillJson(boxSequence)),
  )
  const graph = createTrackGraphV2({
    schemaVersion: 'track_graph_v2',
    modelNeutral: true,
    ...lineage,
    sourceId: 'privacy-source',
    timingHash: hash('privacy-timing'),
    authorizedRangeHash: hashSkillValue(authorizedRange),
    shots: [
      {
        shotId: 'privacy-shot-1',
        range: authorizedRange,
        sceneCutResetsIdentity: true,
      },
    ],
    chunks: [
      {
        chunkId: 'privacy-chunk-1',
        range: authorizedRange,
        bucketIndex: 0,
        attemptRefHash: hash('privacy-attempt'),
      },
    ],
    targets: [
      {
        targetId: 'plate-target',
        targetType: 'selected_instance',
        semanticClass: 'license_plate',
        includeRules: ['selected plate'],
        excludeRules: [],
        privacyClass: 'government_identifier',
        groundingEvidenceHashes: [hash('plate-grounding')],
        expectedMinimumCount: 1,
        expectedMaximumCount: 1,
        ambiguityState: 'none',
      },
    ],
    tracks: [
      {
        trackId: 'license_plate_001',
        targetId: 'plate-target',
        semanticClass: 'license_plate',
        childTrackIds: [],
        startFrameInclusive: 0,
        endFrameExclusive: 24,
        visibilitySpans: uncertainty
          ? [
              {
                startFrameInclusive: 0,
                endFrameExclusive: 10,
                state: 'active' as const,
              },
              {
                startFrameInclusive: 10,
                endFrameExclusive: 13,
                state: 'lost' as const,
              },
              {
                startFrameInclusive: 13,
                endFrameExclusive: 24,
                state: 'reacquired' as const,
              },
            ]
          : [
              {
                startFrameInclusive: 0,
                endFrameExclusive: 24,
                state: 'active' as const,
              },
            ],
        boxSequenceRef: boxRef,
        maskSequenceRef: ref('track_mask_sequence_v1', hash('private-mask-sequence')),
        confidenceSequenceHash: hash('privacy-confidence-sequence'),
        reentryEventHashes: uncertainty ? [hash('privacy-reentry')] : [],
        identitySwitchWarnings: [],
        depthOrder: 0,
        qaRefs: [],
        repairRefs: [],
      },
    ],
    stitchingEvidenceHashes: [hash('privacy-stitching')],
    cameraNormalizationEvidenceHash: hash('privacy-camera-normalization'),
    uncertaintyEventHashes: uncertainty ? [hash('privacy-lost-window')] : [],
    objectBudget: {
      expectedObjects: 1,
      maximumObjects: 1,
      bucketSize: 16,
      bucketCount: 1,
      sessionCount: 1,
    },
    runtimeAttemptRefs: [ref('track_all_runtime_attempt_v1', hash('privacy-runtime-attempt'))],
    finalQaRefs: [ref('track_all_mask_qa_report_v1', hash('privacy-mask-qa'))],
    privateMaskDataPublished: false,
    outsideAuthorizedRangeModified: false,
  })
  return { graph: trackGraphV2Schema.parse(graph), boxSequence }
}

async function decodeRgb24(bytes: Buffer): Promise<Buffer> {
  return runBinary(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-nostdin',
      '-i',
      'pipe:0',
      '-map',
      '0:v:0',
      '-an',
      '-pix_fmt',
      'rgb24',
      '-f',
      'rawvideo',
      'pipe:1',
    ],
    bytes,
  )
}

async function runBinary(binary: string, args: readonly string[], input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, [...args], { stdio: ['pipe', 'pipe', 'pipe'] })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk))
    child.on('error', reject)
    child.on('close', (code) => {
      const diagnostic = Buffer.concat(stderr).toString('utf8')
      if (code !== 0 || diagnostic.length > 0) {
        reject(new Error(`${binary} failed (${String(code)}): ${diagnostic}`))
      } else resolve(Buffer.concat(stdout))
    })
    child.stdin.end(input)
  })
}
