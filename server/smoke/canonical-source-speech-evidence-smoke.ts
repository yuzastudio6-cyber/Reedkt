import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { buildProfessionalExportCreditCoverage } from '../../src/lib/professional-export-policy'
import {
  canonicalPlanComponentsSchema,
  type CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_LOCATOR_VERSION,
  canonicalSourceSpeechEvidencePackageSchema,
  createCanonicalSourceSpeechEvidencePackage,
  type CanonicalSourceSpeechEvidenceRecordDraft,
  verifyCanonicalSourceSpeechEvidencePackage,
} from '../source-speech-evidence/canonical-source-speech-evidence-contract'
import {
  PrivateCanonicalSourceSpeechEvidenceRepository,
} from '../source-speech-evidence/private-canonical-source-speech-evidence-repository'
import {
  CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_RESULT_VERSION,
  createCanonicalSourceSpeechEvidenceCaptureReader,
  createCanonicalSourceSpeechEvidenceCaptureReaderResult,
  type CanonicalSourceSpeechEvidenceCaptureReaderPort,
  type CanonicalSourceSpeechEvidenceContext,
  persistCanonicalSourceSpeechEvidence,
  readCurrentCanonicalSourceSpeechEvidence,
} from '../services/canonical-source-speech-evidence-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const WORKSPACE_ID = 'workspace-source-speech-smoke'
const PROJECT_ID = 'project-source-speech-smoke'
const EDIT_SESSION_ID = 'edit-source-speech-smoke'
const SOURCE_ITEM_ID = 'source-sequence-source-speech-1'
const MEDIA_ASSET_ID = 'media-source-speech-1'
const SOURCE_CHECKSUM = digest('source-speech-video-bytes')
const CAPTURE_LOCATOR_ID = 'source-speech-worker-capture-smoke-1'
const CAPTURE_SNAPSHOT_ID = 'source-speech-worker-snapshot-smoke-1'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-source-speech-evidence-'))
const repository = new PrivateCanonicalSourceSpeechEvidenceRepository()
const repositoryScope = {
  localStorageRoot: root,
  ownerUserId: 'owner-source-speech-smoke',
  workspaceId: WORKSPACE_ID,
}
const components = createComponents()
const canonicalContext = {
  workspaceId: WORKSPACE_ID,
  projectId: PROJECT_ID,
  editSessionId: EDIT_SESSION_ID,
  components,
}
const exactRecord = createSpeechRecord()

try {
  const helperCaptureResult =
    createCanonicalSourceSpeechEvidenceCaptureReaderResult({
      serverOwnedLocatorId: CAPTURE_LOCATOR_ID,
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      sourceSequenceDigestSha256:
        sha256AuthorityValue(components.sourceSequence),
      captureSnapshotId: CAPTURE_SNAPSHOT_ID,
      captureRevision: 1,
      evidenceRecords: [exactRecord],
    })
  assert.equal(helperCaptureResult.evidenceRecordCount, 1)
  const {
    readerResultDigestSha256: helperCaptureDigest,
    ...helperCaptureDraft
  } = helperCaptureResult
  assert.equal(
    helperCaptureDigest,
    sha256AuthorityValue(helperCaptureDraft),
  )

  const persisted = await persistCanonicalSourceSpeechEvidence(
    persistenceInput({
      records: [exactRecord],
    }),
  )
  assert.equal(persisted.disposition, 'created')
  assert.equal(persisted.persistence, 'backend_local_private_content_addressed')
  assert.equal(persisted.rawMediaPersisted, false)
  assert.equal(persisted.browserPayloadPersisted, false)
  assert.equal(persisted.customerCreditsMutated, false)
  assert.equal(persisted.remoteMutationMade, false)
  assert.match(
    persisted.locator.serverOwnedLocatorId,
    /^source-speech-[a-f0-9]{64}$/u,
  )

  const reread = await readCurrentCanonicalSourceSpeechEvidence({
    repositoryScope,
    canonicalContext,
    locator: persisted.locator,
    repository,
  })
  assert.equal(reread.status, 'available_for_preapproval_reasoning')
  assert.equal(reread.sourceMode, 'uploaded_media')
  assert.equal(reread.evidenceRecordCount, 1)
  assert.equal(reread.evidenceRecords[0]?.evidenceStatus, 'verified_speech')
  assert.equal(
    reread.evidenceRecords[0]?.transcriptionRuntime?.executionPlacement,
    'google_cloud_run_gpu',
  )
  assert.equal(reread.evidenceRecords[0]?.transcriptionRuntime?.device, 'cuda')
  assert.equal(reread.evidenceRecords[0]?.transcriptionRuntime?.cpuFallbackUsed, false)
  assert.equal(reread.authorityBoundary.customerCreditAuthority, false)
  assert.equal(reread.authorityBoundary.selectedSceneAuthority, false)
  assert.equal(reread.authorityBoundary.runtimeAuthority, false)
  assert.equal(
    reread.sourceSequenceDigestSha256,
    sha256AuthorityValue(components.sourceSequence),
  )

  const replay = await persistCanonicalSourceSpeechEvidence(
    persistenceInput({
      records: [exactRecord],
    }),
  )
  assert.equal(replay.disposition, 'idempotent_replay')
  assert.equal(replay.packageDigestSha256, persisted.packageDigestSha256)

  const noSpeechContext = {
    ...canonicalContext,
    editSessionId: `${EDIT_SESSION_ID}-silent`,
  }
  const noSpeechComponents = createComponents({
    sourceSequenceItemId: `${SOURCE_ITEM_ID}-silent`,
    mediaAssetId: `${MEDIA_ASSET_ID}-silent`,
    sourceChecksumSha256: digest('silent-source-video-bytes'),
  })
  const noSpeechRecord = createNoSpeechRecord({
    sourceSequenceItemId: `${SOURCE_ITEM_ID}-silent`,
    mediaAssetId: `${MEDIA_ASSET_ID}-silent`,
    sourceChecksumSha256: digest('silent-source-video-bytes'),
  })
  const silentCanonicalContext = {
      ...noSpeechContext,
      components: noSpeechComponents,
  }
  const silentPersistence = await persistCanonicalSourceSpeechEvidence(
    persistenceInput({
      canonicalContext: silentCanonicalContext,
      locatorId: `${CAPTURE_LOCATOR_ID}-silent`,
      records: [noSpeechRecord],
    }),
  )
  const silent = await readCurrentCanonicalSourceSpeechEvidence({
    repositoryScope,
    canonicalContext: silentCanonicalContext,
    locator: silentPersistence.locator,
    repository,
  })
  assert.equal(silent.evidenceRecords[0]?.evidenceStatus, 'verified_no_speech')
  assert.equal(silent.evidenceRecords[0]?.segments.length, 0)
  assert.equal(silent.evidenceRecords[0]?.transcriptArtifact, null)

  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence({
      ...persistenceInput({ records: [exactRecord] }),
      reader: null,
    }),
    'missing process-bound capture reader',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence({
      ...persistenceInput({ records: [exactRecord] }),
      sourceEvidenceLocator: {
        schemaVersion:
          CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_LOCATOR_VERSION,
        serverOwnedLocatorId: CAPTURE_LOCATOR_ID,
        evidenceRecords: [exactRecord],
      },
    }),
    'caller evidence injected through locator',
  )
  const forgedReader = {
    schemaVersion: 'canonical-source-speech-evidence-capture-reader-v1',
    sourceAuthority:
      'canonical_private_source_speech_worker_evidence_repository',
    evidenceClass: 'process_bound_private_source_speech_evidence_reader',
    productionReady: false,
    callerSuppliedEvidenceAccepted: false,
    readCurrentByServerOwnedLocator: async () => createCaptureResult({
      canonicalContext,
      locatorId: CAPTURE_LOCATOR_ID,
      records: [exactRecord],
    }),
  } as CanonicalSourceSpeechEvidenceCaptureReaderPort
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence({
      ...persistenceInput({ records: [exactRecord] }),
      reader: forgedReader,
    }),
    'structurally forged capture reader',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [exactRecord],
      reader: createCaptureReader({
        canonicalContext,
        locatorId: CAPTURE_LOCATOR_ID,
        resultFactory: () => createCaptureResult({
          canonicalContext,
          locatorId: CAPTURE_LOCATOR_ID,
          records: [exactRecord],
          identityOverrides: {
            workspaceId: 'workspace-wrong-source-speech-smoke',
          },
        }),
      }),
    })),
    'capture reader wrong tenant',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [exactRecord],
      reader: createCaptureReader({
        canonicalContext,
        locatorId: CAPTURE_LOCATOR_ID,
        resultFactory: () => createCaptureResult({
          canonicalContext,
          locatorId: CAPTURE_LOCATOR_ID,
          records: [exactRecord],
          readerResultDigestSha256: digest('forged-reader-result'),
        }),
      }),
    })),
    'capture result digest forgery',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [exactRecord],
      reader: createCaptureReader({
        canonicalContext,
        locatorId: CAPTURE_LOCATOR_ID,
        resultFactory: (invocation) => createCaptureResult({
          canonicalContext,
          locatorId: CAPTURE_LOCATOR_ID,
          records: [{
            ...exactRecord,
            segments: invocation === 1
              ? exactRecord.segments
              : exactRecord.segments.map((segment, index) => (
                  index === 0
                    ? {
                        ...segment,
                        text:
                          'The current reread changed before persistence.',
                      }
                    : segment
                )),
          }],
        }),
      }),
    })),
    'capture reread race',
  )

  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [{
        ...exactRecord,
        sourceChecksumSha256: digest('wrong-source'),
      }],
    })),
    'source checksum substitution',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [{
        ...exactRecord,
        transcriptionRuntime: {
          ...exactRecord.transcriptionRuntime!,
          executionPlacement: 'local_cpu',
        },
      }],
    })),
    'CPU placement substitution',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [{
        ...exactRecord,
        sourceAudioArtifact: {
          ...exactRecord.sourceAudioArtifact,
          contentType: 'video/mp4',
        },
      }],
    })),
    'source audio content-type substitution',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [{
        ...exactRecord,
        transcriptionRuntime: {
          ...exactRecord.transcriptionRuntime!,
          cpuFallbackUsed: true,
        },
      }],
    })),
    'CPU fallback promotion',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [{
        ...exactRecord,
        transcriptionRuntime: {
          ...exactRecord.transcriptionRuntime!,
          customerCreditReservationUsed: true,
        },
      }],
    })),
    'preapproval customer credit use',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [{
        ...exactRecord,
        confidenceBasisPoints: 5_999,
      }],
    })),
    'low confidence transcript',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [{
        ...exactRecord,
        transcriptQa: {
          ...exactRecord.transcriptQa,
          humanReviewRequired: true,
        },
      }],
    })),
    'human review required transcript',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [{
        ...exactRecord,
        segments: [{
          ...exactRecord.segments[0]!,
          text: 'Read https://untrusted.example/private transcript.',
        }],
      }],
    })),
    'URL-bearing transcript',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [{
        ...exactRecord,
        transcriptProjectionPolicy: {
          ...exactRecord.transcriptProjectionPolicy!,
          sourceInstructionAuthority: true,
        },
      }],
    })),
    'source transcript instruction promotion',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      records: [{
        ...exactRecord,
        transcriptArtifact: null,
      }],
    })),
    'missing transcript artifact',
  )
  await expectRejects(
    () => readCurrentCanonicalSourceSpeechEvidence({
      repositoryScope,
      canonicalContext: {
        ...canonicalContext,
        components: createComponents({
          sourceChecksumSha256: digest('current-source-changed'),
        }),
      },
      locator: persisted.locator,
      repository,
    }),
    'stale current source',
  )
  await expectRejects(
    () => readCurrentCanonicalSourceSpeechEvidence({
      repositoryScope: {
        ...repositoryScope,
        ownerUserId: 'different-owner-source-speech-smoke',
      },
      canonicalContext,
      locator: persisted.locator,
      repository,
    }),
    'cross-owner evidence read',
  )

  const rollbackContext = {
    ...canonicalContext,
    editSessionId: `${EDIT_SESSION_ID}-rollback`,
  }
  const rollbackLocatorId = `${CAPTURE_LOCATOR_ID}-rollback`
  const firstRollbackVersion = await persistCanonicalSourceSpeechEvidence(
    persistenceInput({
      canonicalContext: rollbackContext,
      locatorId: rollbackLocatorId,
      records: [exactRecord],
    }),
  )
  const updatedRecord = {
    ...exactRecord,
    segments: exactRecord.segments.map((segment, index) => (
      index === 0
        ? {
            ...segment,
            text: 'A newer verified transcript version remains current.',
          }
        : segment
    )),
  }
  const advancedRollbackVersion =
    await persistCanonicalSourceSpeechEvidence(persistenceInput({
      canonicalContext: rollbackContext,
      locatorId: rollbackLocatorId,
      captureSnapshotId: `${rollbackLocatorId}-snapshot-2`,
      captureRevision: 2,
      records: [updatedRecord],
    }))
  assert.equal(advancedRollbackVersion.disposition, 'advanced_latest')
  assert.notEqual(
    advancedRollbackVersion.packageDigestSha256,
    firstRollbackVersion.packageDigestSha256,
  )
  assert.equal(
    await countStoredEvidenceVersions(
      firstRollbackVersion.locator.serverOwnedLocatorId,
    ),
    2,
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      canonicalContext: rollbackContext,
      locatorId: rollbackLocatorId,
      records: [exactRecord],
    })),
    'historical evidence replay rollback',
  )
  await expectRejects(
    () => persistCanonicalSourceSpeechEvidence(persistenceInput({
      canonicalContext: rollbackContext,
      locatorId: rollbackLocatorId,
      captureSnapshotId: `${rollbackLocatorId}-snapshot-2`,
      captureRevision: 2,
      records: [{
        ...updatedRecord,
        confidenceBasisPoints: 9_100,
      }],
    })),
    'same-revision evidence substitution',
  )
  assert.equal(
    await countStoredEvidenceVersions(
      firstRollbackVersion.locator.serverOwnedLocatorId,
    ),
    2,
  )
  const rollbackReread = await readCurrentCanonicalSourceSpeechEvidence({
    repositoryScope,
    canonicalContext: rollbackContext,
    locator: advancedRollbackVersion.locator,
    repository,
  })
  assert.equal(
    rollbackReread.evidenceRecords[0]?.segments[0]?.text,
    'A newer verified transcript version remains current.',
  )

  const validPackage = createCanonicalSourceSpeechEvidencePackage({
    status: 'available_for_preapproval_reasoning',
    sourceMode: 'uploaded_media',
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    editSessionId: EDIT_SESSION_ID,
    sourceSequenceDigestSha256:
      sha256AuthorityValue(components.sourceSequence),
    evidenceSnapshotId: CAPTURE_SNAPSHOT_ID,
    evidenceRevision: 1,
    ideaFirstAuthorityDigestSha256: null,
    evidenceRecords: [exactRecord],
  })
  assert.equal(
    canonicalSourceSpeechEvidencePackageSchema.safeParse({
      ...validPackage,
      rawTranscript: 'caller-added raw transcript',
    }).success,
    false,
  )
  assert.equal(
    canonicalSourceSpeechEvidencePackageSchema.safeParse({
      ...validPackage,
      authorityBoundary: Object.fromEntries(
        Object.keys(validPackage.authorityBoundary)
          .map((key) => [key, true]),
      ),
    }).success,
    false,
  )
  const ideaFirstPackage = createCanonicalSourceSpeechEvidencePackage({
    status: 'not_applicable_idea_first',
    sourceMode: 'idea_first_no_uploaded_media',
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    editSessionId: `${EDIT_SESSION_ID}-idea-first-contract`,
    sourceSequenceDigestSha256: sha256AuthorityValue([]),
    evidenceSnapshotId: 'idea-first-source-approval-snapshot-v1',
    evidenceRevision: 4,
    ideaFirstAuthorityDigestSha256: digest('idea-first-authority'),
    evidenceRecords: [],
  })
  assert.equal(ideaFirstPackage.evidenceRecordCount, 0)
  assert.equal(ideaFirstPackage.evidenceRevision, 4)
  assert.equal(
    canonicalSourceSpeechEvidencePackageSchema.safeParse({
      ...ideaFirstPackage,
      evidenceRevision: 0,
    }).success,
    false,
  )
  await expectRejects(
    async () => verifyCanonicalSourceSpeechEvidencePackage({
      ...validPackage,
      evidenceRecords: [{
        ...validPackage.evidenceRecords[0]!,
        recordDigestSha256: digest('forged-record-digest'),
      }],
    }),
    'record digest forgery',
  )

  const files = await readdir(root, { recursive: true })
  const latestRelative = files.find((entry) => (
    typeof entry === 'string'
    && entry.endsWith('latest.json')
    && entry.includes(sha256AuthorityValue(
      persisted.locator.serverOwnedLocatorId,
    ))
  ))
  assert.ok(latestRelative, 'Private repository latest pointer must exist.')
  const latestPath = join(root, latestRelative)
  const latestBytes = await readFile(latestPath)
  const tampered = latestBytes.toString('utf8').replace(
    persisted.packageDigestSha256,
    digest('tampered-latest-pointer'),
  )
  assert.notEqual(tampered, latestBytes.toString('utf8'))
  await writeFile(latestPath, tampered)
  await expectRejects(
    () => repository.readByServerOwnedLocator({
      scope: repositoryScope,
      locator: persisted.locator,
    }),
    'persisted latest pointer tamper',
  )

  console.log(JSON.stringify({
    ok: true,
    smoke: 'canonical-source-speech-evidence',
    sourceEvidenceRecords: reread.evidenceRecordCount,
    verifiedSpeechSegments: reread.evidenceRecords[0]?.segments.length,
    gpuPlacementRequired: true,
    cpuFallbackRejected: true,
    privateContentAddressedRepository: true,
    exactSourceChecksumBound: true,
    artifactContentTypesBound: true,
    staleSourceRejected: true,
    crossOwnerReadRejected: true,
    lowConfidenceAndReviewRejected: true,
    unsafeTranscriptRejected: true,
    sourceTranscriptInstructionAuthorityRejected: true,
    noSpeechEvidenceSupported: true,
    processBoundCaptureReaderRequired: true,
    captureRereadRaceRejected: true,
    historicalRollbackRejected: true,
    ideaFirstEvidenceRevisionBound: true,
    customerCreditsUntouched: true,
    planningAndRuntimeAuthorityClosed: true,
    persistedTamperRejected: true,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function createSpeechRecord(): CanonicalSourceSpeechEvidenceRecordDraft {
  return {
    sourceSequenceItemId: SOURCE_ITEM_ID,
    mediaAssetId: MEDIA_ASSET_ID,
    uploadedOrder: 1,
    sourceChecksumSha256: SOURCE_CHECKSUM,
    evidenceStatus: 'verified_speech',
    sourceAudioArtifact: {
      artifactId: 'artifact-source-audio-source-speech-1',
      contentSha256: digest('source-audio-bytes'),
      contentType: 'audio/wav',
      byteLength: 480_000,
    },
    sourceAudioExtractionEvidenceDigestSha256:
      digest('source-audio-extraction-evidence'),
    transcriptArtifact: {
      artifactId: 'artifact-transcript-source-speech-1',
      contentSha256: digest('transcript-json-bytes'),
      contentType: 'application/json',
      byteLength: 12_000,
    },
    wordTimestampArtifact: {
      artifactId: 'artifact-word-timestamps-source-speech-1',
      contentSha256: digest('word-timestamp-json-bytes'),
      contentType: 'application/json',
      byteLength: 22_000,
    },
    transcriptionRuntime: {
      toolId: 'faster_whisper',
      modelWeightManifestId: 'faster-whisper-approved-gpu-model-v1',
      modelName: 'faster-whisper approved multilingual model',
      modelRevisionSha256: digest('faster-whisper-model-revision'),
      executionPlacement: 'google_cloud_run_gpu',
      device: 'cuda',
      cpuFallbackUsed: false,
      modelDownloadDuringRun: false,
      customerCreditReservationUsed: false,
      internalAnalysisBudgetAuthorityDigestSha256:
        digest('internal-analysis-budget-authority'),
      executionEvidenceDigestSha256:
        digest('gpu-transcription-execution-evidence'),
    },
    transcriptQa: {
      status: 'passed',
      transcriptAlignmentPassed: true,
      humanReviewRequired: false,
      blockingIssueCount: 0,
      qaEvidenceDigestSha256: digest('transcript-qa-evidence'),
    },
    transcriptProjectionPolicy: {
      projectionClass: 'bounded_redacted_untrusted_source_transcript',
      sourceInstructionAuthority: false,
      rawTranscriptIncluded: false,
      sensitiveValueRedactionApplied: true,
      browserShareable: false,
    },
    speechAbsenceEvidenceDigestSha256: null,
    languageCode: 'en-US',
    coverageStartMilliseconds: 0,
    coverageEndMillisecondsExclusive: 10_000,
    confidenceBasisPoints: 9_250,
    segments: [{
      segmentId: 'speech-segment-1',
      order: 1,
      startMilliseconds: 0,
      endMillisecondsExclusive: 4_200,
      text: 'The speaker explains why the first visual detail matters.',
      confidenceBasisPoints: 9_300,
    }, {
      segmentId: 'speech-segment-2',
      order: 2,
      startMilliseconds: 4_400,
      endMillisecondsExclusive: 9_700,
      text: 'The explanation then resolves back to the source footage.',
      confidenceBasisPoints: 9_200,
    }],
  }
}

function createNoSpeechRecord(input: {
  sourceSequenceItemId: string
  mediaAssetId: string
  sourceChecksumSha256: string
}): CanonicalSourceSpeechEvidenceRecordDraft {
  return {
    sourceSequenceItemId: input.sourceSequenceItemId,
    mediaAssetId: input.mediaAssetId,
    uploadedOrder: 1,
    sourceChecksumSha256: input.sourceChecksumSha256,
    evidenceStatus: 'verified_no_speech',
    sourceAudioArtifact: {
      artifactId: 'artifact-source-audio-silent',
      contentSha256: digest('silent-source-audio-bytes'),
      contentType: 'audio/wav',
      byteLength: 320_000,
    },
    sourceAudioExtractionEvidenceDigestSha256:
      digest('silent-source-audio-extraction-evidence'),
    transcriptArtifact: null,
    wordTimestampArtifact: null,
    transcriptionRuntime: null,
    transcriptQa: {
      status: 'passed',
      transcriptAlignmentPassed: true,
      humanReviewRequired: false,
      blockingIssueCount: 0,
      qaEvidenceDigestSha256: digest('no-speech-qa-evidence'),
    },
    transcriptProjectionPolicy: null,
    speechAbsenceEvidenceDigestSha256:
      digest('verified-no-speech-evidence'),
    languageCode: null,
    coverageStartMilliseconds: 0,
    coverageEndMillisecondsExclusive: 10_000,
    confidenceBasisPoints: 9_800,
    segments: [],
  }
}

function persistenceInput(input: {
  records: readonly unknown[]
  canonicalContext?: CanonicalSourceSpeechEvidenceContext
  locatorId?: string
  captureSnapshotId?: string
  captureRevision?: number
  reader?: CanonicalSourceSpeechEvidenceCaptureReaderPort | null
}): Parameters<typeof persistCanonicalSourceSpeechEvidence>[0] {
  const currentContext = input.canonicalContext ?? canonicalContext
  const locatorId = input.locatorId ?? CAPTURE_LOCATOR_ID
  const captureSnapshotId =
    input.captureSnapshotId ?? `${locatorId}-snapshot`
  const captureRevision = input.captureRevision ?? 1
  return {
    context: null,
    repositoryScope,
    canonicalContext: currentContext,
    sourceEvidenceLocator: {
      schemaVersion:
        CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_LOCATOR_VERSION,
      serverOwnedLocatorId: locatorId,
    },
    reader: input.reader === undefined
      ? createCaptureReader({
          canonicalContext: currentContext,
          locatorId,
          resultFactory: () => createCaptureResult({
            canonicalContext: currentContext,
            locatorId,
            records: input.records,
            captureSnapshotId,
            captureRevision,
          }),
        })
      : input.reader,
    repository,
  }
}

function createCaptureReader(input: {
  canonicalContext: CanonicalSourceSpeechEvidenceContext
  locatorId: string
  resultFactory: (
    invocation: number,
  ) => unknown
}): CanonicalSourceSpeechEvidenceCaptureReaderPort {
  let invocation = 0
  return createCanonicalSourceSpeechEvidenceCaptureReader(
    async (request) => {
      assert.equal(request.serverOwnedLocatorId, input.locatorId)
      assert.deepEqual(request.expectedScope, {
        workspaceId: input.canonicalContext.workspaceId,
        projectId: input.canonicalContext.projectId,
        editSessionId: input.canonicalContext.editSessionId,
      })
      assert.equal(
        request.expectedSourceSequenceDigestSha256,
        sha256AuthorityValue(input.canonicalContext.components.sourceSequence),
      )
      invocation += 1
      return input.resultFactory(invocation)
    },
  )
}

function createCaptureResult(input: {
  canonicalContext: CanonicalSourceSpeechEvidenceContext
  locatorId: string
  records: readonly unknown[]
  captureSnapshotId?: string
  captureRevision?: number
  identityOverrides?: Partial<{
    workspaceId: string
    projectId: string
    editSessionId: string
    sourceSequenceDigestSha256: string
  }>
  readerResultDigestSha256?: string
}): unknown {
  const draft = {
    schemaVersion:
      CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_RESULT_VERSION,
    sourceAuthority:
      'canonical_private_source_speech_worker_evidence_repository',
    evidenceClass: 'controlled_private_source_speech_worker_evidence',
    productionReady: false,
    callerSuppliedEvidenceAccepted: false,
    serverOwnedLocatorId: input.locatorId,
    captureSnapshotId:
      input.captureSnapshotId ?? `${input.locatorId}-snapshot`,
    captureRevision: input.captureRevision ?? 1,
    identity: {
      workspaceId: input.canonicalContext.workspaceId,
      projectId: input.canonicalContext.projectId,
      editSessionId: input.canonicalContext.editSessionId,
      sourceSequenceDigestSha256: sha256AuthorityValue(
        input.canonicalContext.components.sourceSequence,
      ),
      ...input.identityOverrides,
    },
    evidenceRecords: input.records,
    evidenceRecordCount: input.records.length,
  }
  return {
    ...draft,
    readerResultDigestSha256:
      input.readerResultDigestSha256 ?? sha256AuthorityValue(draft),
  }
}

function createComponents(input?: {
  sourceSequenceItemId?: string
  mediaAssetId?: string
  sourceChecksumSha256?: string
}): CanonicalPlanComponentsInput {
  const sourceSequenceItemId = input?.sourceSequenceItemId ?? SOURCE_ITEM_ID
  return canonicalPlanComponentsSchema.parse({
    compiledIntent: {
      goalSummary: 'Create a professional source-aware edit.',
    },
    professionalEditingDirective: {
      mustFollowRules: ['Preserve narration meaning.'],
    },
    confirmedSettings: {
      aspectRatio: '16:9',
      outputFrame: { width: 3_840, height: 2_160, fps: 30 },
      outputFramePurpose: 'private_canonical_4k_master_review',
      professionalExportCoverage: buildProfessionalExportCreditCoverage({
        durationSeconds: 10,
        outputFps: 30,
        approvedAspectRatio: '16:9',
      }),
      outputFrameConfirmed: true,
      sourceOrderConfirmed: true,
      sourceCleanupConfirmed: true,
      editLevel: 'pro',
      targetPlatform: 'youtube',
      preferencePlanningInputRevision: 0,
      preferenceFingerprintSha256: digest(
        'source-speech-evidence-preference',
      ),
    },
    sourceSequence: [{
      sourceSequenceItemId,
      mediaAssetId: input?.mediaAssetId ?? MEDIA_ASSET_ID,
      uploadedOrder: 1,
      checksumSha256: input?.sourceChecksumSha256 ?? SOURCE_CHECKSUM,
      required: true,
    }],
    sourceCleanupSummary: {
      status: 'confirmed',
      cleanupPreference: 'balanced_cleanup',
      trimValidationStatus: 'passed',
      meaningValidationStatus: 'passed',
      userReviewRequired: false,
    },
    sourceCleanupPlan: {
      status: 'confirmed',
      decisions: [{
        decisionId: `cleanup-${sourceSequenceItemId}`,
        sourceSequenceItemId,
        action: 'preserve',
        startFrame: 0,
        endFrameExclusive: 300,
        reason: 'Preserve the complete source during evidence binding.',
        confidence: 1,
        meaningPreservationStatus: 'passed',
        userReviewStatus: 'not_required',
      }],
    },
    masterTimingPlan: {
      id: 'master-timing-source-speech-smoke',
      status: 'ready',
      timingBase: { fps: 30, totalFrames: 300 },
      totalFrames: 300,
    },
    captionVisualCueTimingPlan: { status: 'synced' },
    soundSyncTransitionTimingPlan: {
      status: 'not_needed',
      speechPriority: true,
    },
    timingValidationPlan: {
      overallStatus: 'passed',
      approvalBlocked: false,
    },
    timingSummary: {
      validationStatus: 'passed',
      approvalBlocked: false,
      fps: 30,
      totalFrames: 300,
    },
    segments: [{
      segmentId: 'segment-source-speech-smoke-1',
      startFrame: 0,
      endFrameExclusive: 300,
      operationIds: ['operation-source-speech-smoke-1'],
    }],
    visualAssetPlan: { status: 'not_needed' },
    colorPipelinePlan: { status: 'not_provided' },
    rendererPlan: { renderer: 'remotion', frameOwnedByRenderer: true },
    toolStrategyPlan: { toolIds: [] },
    qaPlan: { checks: [] },
    qaSummary: { status: 'passed', approvalBlocked: false },
    providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
    fallbackPolicy: { unapprovedFallbackAllowed: false },
  })
}

async function expectRejects(
  operation: () => Promise<unknown>,
  label: string,
): Promise<void> {
  await assert.rejects(operation, label)
}

async function countStoredEvidenceVersions(
  locatorId: string,
): Promise<number> {
  const locatorHash = sha256AuthorityValue(locatorId)
  const files = await readdir(root, { recursive: true })
  return files.filter((entry) => (
    typeof entry === 'string'
    && entry.includes(locatorHash)
    && entry.includes('/versions/')
    && entry.endsWith('.json')
  )).length
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
