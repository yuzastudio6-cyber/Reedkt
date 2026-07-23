import { createHash } from 'node:crypto'

import {
  MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID,
  MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID,
  MOTION_STUDIO_WAN_LIVE_ADAPTER_ID,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'
import type { MotionStudioLiveGenerationService } from '../live-generation/service'
import type { MotionStudioLiveFollowupResultStatus } from '../live-generation/types'
import {
  downloadTemporaryProviderMedia,
  type MotionStudioBoundedProviderTransport,
  type MotionStudioDownloadedProviderMedia,
  type MotionStudioProviderTransportResult,
} from './bounded-provider-transport'
import {
  meterGptImage2ProviderUsage,
  meterHailuoProviderUsage,
  meterHailuoProviderUsageFromPersistedEvidence,
  meterMotionStudioLiveMediaQaCpuUsage,
  meterWanProviderUsage,
  meterWanProviderUsageFromPersistedEvidence,
  type MotionStudioGptImage2CostAuthority,
  type MotionStudioHailuoCostAuthority,
  type MotionStudioLiveInfrastructureCostAuthority,
  type MotionStudioWanCostAuthority,
} from './live-cost-metering'
import {
  parseGptImage2LiveResponse,
  digestOpaqueProviderIdentifier,
  parseHailuoFileResponse,
  parseHailuoQueryResponse,
  parseHailuoSubmitResponse,
  parseWanQueryResponse,
  parseWanSubmitResponse,
  type GptImage2LiveEditBody,
  type GptImage2LiveGenerationBody,
  type Hailuo23FastLiveBody,
  type MotionStudioCompiledProviderRequest,
  type MotionStudioLiveImageInput,
  type ParsedHailuoFileResponse,
  type ParsedHailuoQueryResponse,
  type ParsedHailuoSubmitResponse,
  type ParsedWanQueryResponse,
  type ParsedWanSubmitResponse,
  type Wan27LiveBody,
} from './live-provider-adapters'
import type { MotionStudioProtectedProviderOperationIdentityStore } from './protected-provider-operation-identity-store'
import {
  ingestMotionStudioLiveProviderMedia,
  type MotionStudioPrivateLiveMediaIngestResult,
} from './live-media-qa'

type LiveAuthorityPort = Pick<MotionStudioLiveGenerationService,
  | 'issuePermit'
  | 'consumePermit'
  | 'consumeFollowupCall'
  | 'recordFollowupCallResult'
  | 'recordProviderEvent'
  | 'completeCandidate'
  | 'recoverCandidate'
  | 'finishAttempt'
>

type LiveMediaIngestor = typeof ingestMotionStudioLiveProviderMedia
type LiveMediaDownloader = (input: { temporaryUrl: string }) => Promise<MotionStudioDownloadedProviderMedia>
type CpuUsageReader = () => { user: number; system: number }
type CurrentTimeReader = () => string

interface SanitizedProviderHttpEvidence {
  outcome: 'known_http_rejection' | 'ambiguous_http_response'
  httpStatus: number
  responseDigest: string
  providerRequestIdDigest?: string
  providerErrorType?: string
  providerErrorCode?: string
  providerCostIncurred: boolean
  reconciliationRequired: boolean
  automaticRetryAllowed: false
}

export interface MotionStudioLiveSubmissionAuthority {
  operationId: string
  permitId: string
  leaseId: string
  leaseCredential: string
  executionAuthorityId: string
  executionAuthorityDigest: string
  credentialReferenceId: string
  issuedAt: string
  expiresAt: string
}

export interface MotionStudioLiveFollowupAuthority {
  operationId: string
  callId: string
  callSequence: number
  leaseId: string
  leaseCredential: string
  executionAuthorityId: string
  executionAuthorityDigest: string
  credentialReferenceId: string
  issuedAt: string
  expiresAt: string
}

export interface MotionStudioLiveMediaIngestAuthority {
  localStorageRoot: string
  providerRequestDigest: string
  providerResponseDigest: string
  approvedFirstFrame?: MotionStudioLiveImageInput
  ffmpegBin: string
  ffprobeBin: string
}

export interface MotionStudioLiveCandidateCompletionAuthority {
  mediaAssetId: string
  mediaAssetVersionId: string
  safetyStatus: 'passed' | 'review_required'
  idempotencyKey: string
}

export type MotionStudioLiveVideoCostEvidence =
  | {
    kind: 'wan_provider_result'
    queryResult: ParsedWanQueryResponse
    authority: MotionStudioWanCostAuthority
  }
  | {
    kind: 'hailuo_provider_result'
    queryResult: ParsedHailuoQueryResponse
    fileResult: ParsedHailuoFileResponse
    authority: MotionStudioHailuoCostAuthority
  }

export type MotionStudioLiveCandidateCompletionResult = Awaited<
  ReturnType<LiveAuthorityPort['completeCandidate']>
>['data']

export interface MotionStudioGptImageRunResult {
  operationId: string
  requestDigest: string
  responseDigest: string
  usage: ReturnType<typeof parseGptImage2LiveResponse>['usage']
  ingested: MotionStudioPrivateLiveMediaIngestResult
  candidateCompletion: MotionStudioLiveCandidateCompletionResult
  providerCallMade: true
  networkCallCount: 1
  automaticRetryAllowed: false
}

export interface MotionStudioRecoveredVideoResult {
  operationId: string
  providerSourceMediaSha256: string
  ingested: MotionStudioPrivateLiveMediaIngestResult
  candidateCompletion: Awaited<ReturnType<LiveAuthorityPort['recoverCandidate']>>['data']
  providerCallMade: false
  providerDownloadMade: false
  networkCallCount: 0
  automaticRetryAllowed: false
}

export type MotionStudioRecoveredWanResult = MotionStudioRecoveredVideoResult

export interface MotionStudioAsyncSubmitResult<TParsed> {
  operationId: string
  requestDigest: string
  parsed: TParsed
  providerCallMade: true
  networkCallCount: 1
  automaticRetryAllowed: false
  automaticPollingAllowed: false
}

export interface MotionStudioAsyncFollowupResult<TParsed> {
  operationId: string
  callId: string
  callSequence: number
  parsed: TParsed
  providerCallMade: true
  networkCallCount: 1
  automaticRetryAllowed: false
  automaticPollingAllowed: false
}

export interface MotionStudioLiveVideoDownloadResult {
  operationId: string
  callId: string
  callSequence: number
  downloaded: Omit<MotionStudioDownloadedProviderMedia, 'bytes'>
  ingested: MotionStudioPrivateLiveMediaIngestResult
  candidateCompletion: MotionStudioLiveCandidateCompletionResult
  providerCallMade: true
  networkCallCount: 1
  automaticRetryAllowed: false
  automaticPollingAllowed: false
  sourceUrlPersisted: false
}

export class MotionStudioLiveOperationRunner {
  private readonly authority: LiveAuthorityPort
  private readonly transport: MotionStudioBoundedProviderTransport
  private readonly mediaDownloader: LiveMediaDownloader
  private readonly mediaIngestor: LiveMediaIngestor
  private readonly readCpuUsage: CpuUsageReader
  private readonly readCurrentTime: CurrentTimeReader
  private readonly protectedProviderOperationIdentities?: MotionStudioProtectedProviderOperationIdentityStore

  constructor(input: {
    authority: LiveAuthorityPort
    transport: MotionStudioBoundedProviderTransport
    mediaDownloader?: LiveMediaDownloader
    mediaIngestor?: LiveMediaIngestor
    readCpuUsage?: CpuUsageReader
    readCurrentTime?: CurrentTimeReader
    protectedProviderOperationIdentities?: MotionStudioProtectedProviderOperationIdentityStore
  }) {
    this.authority = input.authority
    this.transport = input.transport
    this.mediaDownloader = input.mediaDownloader ?? ((request) => downloadTemporaryProviderMedia(request))
    this.mediaIngestor = input.mediaIngestor ?? ingestMotionStudioLiveProviderMedia
    this.readCpuUsage = input.readCpuUsage ?? (() => process.cpuUsage())
    this.readCurrentTime = input.readCurrentTime ?? (() => new Date().toISOString())
    this.protectedProviderOperationIdentities = input.protectedProviderOperationIdentities
  }

  async executeGptImageOnce(input: {
    operationKind: 'gpt_image_generation' | 'gpt_image_edit'
    request: MotionStudioCompiledProviderRequest<GptImage2LiveGenerationBody | GptImage2LiveEditBody>
    submission: MotionStudioLiveSubmissionAuthority
    ingest: Omit<MotionStudioLiveMediaIngestAuthority, 'providerRequestDigest' | 'providerResponseDigest' | 'approvedFirstFrame'>
    completion: MotionStudioLiveCandidateCompletionAuthority
    costAuthority: MotionStudioGptImage2CostAuthority
    infrastructureCostAuthority: MotionStudioLiveInfrastructureCostAuthority
    occurredAt: string
  }): Promise<MotionStudioGptImageRunResult> {
    requireAdapter(input.request, MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID)
    const transportResult = await this.executeSubmission(input.request, input.submission)
    const response = await this.requireSubmissionResponse({
      result: transportResult,
      submission: input.submission,
      requestDigest: input.request.requestDigest,
      occurredAt: input.occurredAt,
      providerCostIncurred: true,
    })
    let parsed: ReturnType<typeof parseGptImage2LiveResponse>
    try {
      parsed = parseGptImage2LiveResponse(response.responseBody)
    } catch (error) {
      await this.recordUnrecognizedSubmission(
        input.submission.operationId,
        input.request.requestDigest,
        response.responseBodyDigest,
        input.occurredAt,
        true,
      )
      throw error
    }
    const meteredUsage = meterGptImage2ProviderUsage({
      operationKind: input.operationKind,
      usage: parsed.usage,
      responseDigest: parsed.responseDigest,
      authority: input.costAuthority,
      measuredAt: input.occurredAt,
    })
    let ingested: MotionStudioPrivateLiveMediaIngestResult
    const cpuStart = this.readCpuUsage()
    try {
      ingested = await this.mediaIngestor({
        localStorageRoot: input.ingest.localStorageRoot,
        operationId: input.submission.operationId,
        operationKind: input.operationKind,
        providerAdapterId: MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID,
        providerModelVersion: parsed.modelSnapshot,
        requestDigest: input.request.requestDigest,
        responseDigest: parsed.responseDigest,
        bytes: parsed.bytes,
        mimeType: 'image/png',
        expectedSha256: parsed.sha256,
        ffmpegBin: input.ingest.ffmpegBin,
        ffprobeBin: input.ingest.ffprobeBin,
      })
    } catch (error) {
      const infrastructureUsage = this.meterMediaQaCpuUsage({
        operationId: input.submission.operationId,
        requestDigest: input.request.requestDigest,
        responseDigest: parsed.responseDigest,
        cpuStart,
        authority: input.infrastructureCostAuthority,
        measuredAt: input.occurredAt,
      })
      await this.recordSubmissionEvent({
        operationId: input.submission.operationId,
        requestDigest: input.request.requestDigest,
        responseDigest: parsed.responseDigest,
        normalizedStatus: 'failed',
        providerCostIncurred: true,
        occurredAt: input.occurredAt,
      })
      await this.finishKnownFailure({
        operationId: input.submission.operationId,
        leaseId: input.submission.leaseId,
        leaseCredential: input.submission.leaseCredential,
        failureCategory: 'live_media_ingest_failed',
        errorClass: safeErrorClass(error),
        requestDigest: input.request.requestDigest,
        responseDigest: parsed.responseDigest,
        usage: [meteredUsage.usageLine, infrastructureUsage],
        occurredAt: input.occurredAt,
      })
      throw error
    }
    await this.recordSubmissionEvent({
      operationId: input.submission.operationId,
      requestDigest: input.request.requestDigest,
      responseDigest: parsed.responseDigest,
      normalizedStatus: 'completed',
      providerCostIncurred: true,
      occurredAt: input.occurredAt,
    })
    const infrastructureUsage = this.meterMediaQaCpuUsage({
      operationId: input.submission.operationId,
      requestDigest: input.request.requestDigest,
      responseDigest: parsed.responseDigest,
      qaEvidenceDigest: ingested.qaEvidenceDigest,
      cpuStart,
      authority: input.infrastructureCostAuthority,
      measuredAt: input.occurredAt,
    })
    const candidateCompletion = await this.completeIngestedCandidate({
      operationId: input.submission.operationId,
      leaseId: input.submission.leaseId,
      leaseCredential: input.submission.leaseCredential,
      requestDigest: input.request.requestDigest,
      responseDigest: parsed.responseDigest,
      ingested,
      completion: { ...input.completion, usage: [meteredUsage.usageLine, infrastructureUsage] },
    })
    return {
      operationId: input.submission.operationId,
      requestDigest: input.request.requestDigest,
      responseDigest: parsed.responseDigest,
      usage: parsed.usage,
      ingested,
      candidateCompletion,
      providerCallMade: true,
      networkCallCount: 1,
      automaticRetryAllowed: false,
    }
  }

  async submitWanOnce(input: {
    request: MotionStudioCompiledProviderRequest<Wan27LiveBody>
    submission: MotionStudioLiveSubmissionAuthority
    occurredAt: string
  }): Promise<MotionStudioAsyncSubmitResult<ParsedWanSubmitResponse>> {
    requireAdapter(input.request, MOTION_STUDIO_WAN_LIVE_ADAPTER_ID)
    return this.submitAsyncOnce(input, parseWanSubmitResponse)
  }

  async submitHailuoOnce(input: {
    request: MotionStudioCompiledProviderRequest<Hailuo23FastLiveBody>
    submission: MotionStudioLiveSubmissionAuthority
    occurredAt: string
  }): Promise<MotionStudioAsyncSubmitResult<ParsedHailuoSubmitResponse>> {
    requireAdapter(input.request, MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID)
    return this.submitAsyncOnce(input, parseHailuoSubmitResponse)
  }

  async queryWanOnce(input: {
    request: MotionStudioCompiledProviderRequest<null>
    followup: MotionStudioLiveFollowupAuthority
    occurredAt: string
  }): Promise<MotionStudioAsyncFollowupResult<ParsedWanQueryResponse>> {
    requireAdapter(input.request, MOTION_STUDIO_WAN_LIVE_ADAPTER_ID)
    const expectedTaskDigest = expectedWanTaskDigest(input.request)
    return this.queryAsyncOnce(input, parseWanQueryResponse, (parsed) => {
      if (parsed.status === 'SUCCEEDED') return 'download_ready'
      if (parsed.status === 'FAILED') return 'failed'
      if (parsed.status === 'CANCELED') return 'cancelled'
      if (parsed.status === 'UNKNOWN') return 'outcome_unknown'
      return 'processing'
    }, (parsed) => {
      if (parsed.taskIdDigest !== expectedTaskDigest) {
        throw blocked('Wan query response changed the exact provider task identity.')
      }
    })
  }

  async queryHailuoOnce(input: {
    request: MotionStudioCompiledProviderRequest<null>
    followup: MotionStudioLiveFollowupAuthority
    occurredAt: string
  }): Promise<MotionStudioAsyncFollowupResult<ParsedHailuoQueryResponse>> {
    requireAdapter(input.request, MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID)
    const expectedTaskDigest = expectedMiniMaxIdentifierDigest(input.request, 'task_id')
    return this.queryAsyncOnce(input, parseHailuoQueryResponse, (parsed) => {
      if (parsed.status === 'Success') return 'download_ready'
      if (parsed.status === 'Fail') return 'failed'
      return 'processing'
    }, (parsed) => {
      if (parsed.taskIdDigest !== expectedTaskDigest) {
        throw blocked('Hailuo query response changed the exact provider task identity.')
      }
      if (parsed.status === 'Success' && (parsed.width !== 1364 || parsed.height !== 768)) {
        throw blocked('Hailuo query result does not match the provider-native 1364x768 evidence profile.')
      }
    })
  }

  async retrieveHailuoFileOnce(input: {
    request: MotionStudioCompiledProviderRequest<null>
    followup: MotionStudioLiveFollowupAuthority
    occurredAt: string
  }): Promise<MotionStudioAsyncFollowupResult<ParsedHailuoFileResponse>> {
    requireAdapter(input.request, MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID)
    const expectedFileDigest = expectedMiniMaxIdentifierDigest(input.request, 'file_id')
    return this.followupOnce({
      ...input,
      purpose: 'file_retrieve',
      parse: parseHailuoFileResponse,
      normalize: () => 'download_ready',
      validate: (parsed) => {
        if (parsed.fileIdDigest !== expectedFileDigest) {
          throw blocked('Hailuo file response changed the exact provider file identity.')
        }
        if (parsed.declaredBytes > 100 * 1024 * 1024) {
          throw blocked('Hailuo declared media exceeds the private ingest ceiling.')
        }
      },
    })
  }

  async downloadVideoOnce(input: {
    operationKind: 'wan_image_to_video' | 'hailuo_image_to_video_fallback'
    providerAdapterId: typeof MOTION_STUDIO_WAN_LIVE_ADAPTER_ID | typeof MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID
    providerModelVersion: string
    temporaryUrl: string
    followup: MotionStudioLiveFollowupAuthority
    ingest: MotionStudioLiveMediaIngestAuthority & { approvedFirstFrame: MotionStudioLiveImageInput }
    completion: MotionStudioLiveCandidateCompletionAuthority
    costEvidence: MotionStudioLiveVideoCostEvidence
    infrastructureCostAuthority: MotionStudioLiveInfrastructureCostAuthority
    occurredAt: string
  }): Promise<MotionStudioLiveVideoDownloadResult> {
    const usage = this.meterVideoProviderUsage(input)
    const temporaryUrlDigest = sha256Text(input.temporaryUrl)
    const requestDigest = sha256CanonicalJson({
      schemaVersion: 'motion-studio-live-media-download-request-v1',
      operationId: input.followup.operationId,
      providerAdapterId: input.providerAdapterId,
      temporaryUrlDigest,
      expectedMimeType: 'video/mp4',
      maximumNetworkCalls: 1,
    })
    await this.consumeFollowupAuthority({
      followup: input.followup,
      purpose: 'media_download',
      providerAdapterId: input.providerAdapterId,
      requestDigest,
    })
    let downloaded: MotionStudioDownloadedProviderMedia
    let ingested: MotionStudioPrivateLiveMediaIngestResult
    const cpuStart = this.readCpuUsage()
    try {
      downloaded = await this.mediaDownloader({ temporaryUrl: input.temporaryUrl })
      const responseDigest = sha256CanonicalJson({
        schemaVersion: 'motion-studio-live-media-download-result-v1',
        mediaSha256: downloaded.sha256,
        byteLength: downloaded.byteLength,
        contentType: downloaded.contentType,
        redirectCount: downloaded.redirectCount,
      })
      ingested = await this.mediaIngestor({
        localStorageRoot: input.ingest.localStorageRoot,
        operationId: input.followup.operationId,
        operationKind: input.operationKind,
        providerAdapterId: input.providerAdapterId,
        providerModelVersion: input.providerModelVersion,
        requestDigest: input.ingest.providerRequestDigest,
        responseDigest: input.ingest.providerResponseDigest,
        bytes: downloaded.bytes,
        mimeType: 'video/mp4',
        expectedSha256: downloaded.sha256,
        approvedFirstFrame: input.ingest.approvedFirstFrame,
        ffmpegBin: input.ingest.ffmpegBin,
        ffprobeBin: input.ingest.ffprobeBin,
      })
      await this.recordFollowupResult(
        input.followup,
        'media_received',
        requestDigest,
        responseDigest,
        input.occurredAt,
      )
    } catch (error) {
      const infrastructureUsage = this.meterMediaQaCpuUsage({
        operationId: input.followup.operationId,
        requestDigest: input.ingest.providerRequestDigest,
        responseDigest: input.ingest.providerResponseDigest,
        cpuStart,
        authority: input.infrastructureCostAuthority,
        measuredAt: input.occurredAt,
      })
      const failureDigest = sha256CanonicalJson({
        schemaVersion: 'motion-studio-live-media-download-failure-v1',
        operationId: input.followup.operationId,
        requestDigest,
        errorClass: safeErrorClass(error),
      })
      await this.recordFollowupResult(
        input.followup,
        'failed',
        requestDigest,
        failureDigest,
        input.occurredAt,
      )
      await this.finishKnownFailure({
        operationId: input.followup.operationId,
        leaseId: input.followup.leaseId,
        leaseCredential: input.followup.leaseCredential,
        failureCategory: 'live_media_download_or_ingest_failed',
        errorClass: safeErrorClass(error),
        requestDigest: input.ingest.providerRequestDigest,
        responseDigest: input.ingest.providerResponseDigest,
        usage: [usage, infrastructureUsage],
        occurredAt: input.occurredAt,
      })
      throw error
    }
    const infrastructureUsage = this.meterMediaQaCpuUsage({
      operationId: input.followup.operationId,
      requestDigest: input.ingest.providerRequestDigest,
      responseDigest: input.ingest.providerResponseDigest,
      qaEvidenceDigest: ingested.qaEvidenceDigest,
      cpuStart,
      authority: input.infrastructureCostAuthority,
      measuredAt: input.occurredAt,
    })
    const candidateCompletion = await this.completeIngestedCandidate({
      operationId: input.followup.operationId,
      leaseId: input.followup.leaseId,
      leaseCredential: input.followup.leaseCredential,
      requestDigest: input.ingest.providerRequestDigest,
      responseDigest: input.ingest.providerResponseDigest,
      ingested,
      completion: { ...input.completion, usage: [usage, infrastructureUsage] },
    })
    return {
      operationId: input.followup.operationId,
      callId: input.followup.callId,
      callSequence: input.followup.callSequence,
      downloaded: {
        sha256: downloaded.sha256,
        byteLength: downloaded.byteLength,
        contentType: downloaded.contentType,
        redirectCount: downloaded.redirectCount,
        safeToPersistSourceUrl: false,
      },
      ingested,
      candidateCompletion,
      providerCallMade: true,
      networkCallCount: 1,
      automaticRetryAllowed: false,
      automaticPollingAllowed: false,
      sourceUrlPersisted: false,
    }
  }

  async recoverWanFromExistingPrivateMedia(input: {
    operationId: string
    leaseId: string
    leaseCredential: string
    providerModelVersion: string
    operationKind?: 'wan_image_to_video' | 'hailuo_image_to_video_fallback'
    sourceBytes: Buffer
    expectedProviderSourceMediaSha256: string
    readyResponseDigest: string
    failedDownloadResponseDigest: string
    ingest: Omit<MotionStudioLiveMediaIngestAuthority, 'providerResponseDigest'> & {
      approvedFirstFrame: MotionStudioLiveImageInput
    }
    completion: MotionStudioLiveCandidateCompletionAuthority
    costAuthority: MotionStudioWanCostAuthority | MotionStudioHailuoCostAuthority
    infrastructureCostAuthority: MotionStudioLiveInfrastructureCostAuthority
    occurredAt: string
  }): Promise<MotionStudioRecoveredVideoResult> {
    const operationKind = input.operationKind ?? 'wan_image_to_video'
    const providerAdapterId = operationKind === 'hailuo_image_to_video_fallback'
      ? MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID : MOTION_STUDIO_WAN_LIVE_ADAPTER_ID
    const providerSourceMediaSha256 = createHash('sha256').update(input.sourceBytes).digest('hex')
    if (providerSourceMediaSha256 !== input.expectedProviderSourceMediaSha256) {
      throw blocked('Recovered Wan source bytes do not match the exact private quarantine checksum.')
    }
    const cpuStart = this.readCpuUsage()
    const ingested = await this.mediaIngestor({
      localStorageRoot: input.ingest.localStorageRoot,
      operationId: input.operationId,
      operationKind,
      providerAdapterId,
      providerModelVersion: input.providerModelVersion,
      requestDigest: input.ingest.providerRequestDigest,
      responseDigest: input.readyResponseDigest,
      bytes: input.sourceBytes,
      mimeType: 'video/mp4',
      expectedSha256: providerSourceMediaSha256,
      approvedFirstFrame: input.ingest.approvedFirstFrame,
      ffmpegBin: input.ingest.ffmpegBin,
      ffprobeBin: input.ingest.ffprobeBin,
    })
    if (ingested.providerSourceMediaSha256 !== providerSourceMediaSha256) {
      throw blocked('Recovered provider ingest did not retain the exact provider-source checksum.')
    }
    const providerUsage = operationKind === 'hailuo_image_to_video_fallback'
      ? meterHailuoProviderUsageFromPersistedEvidence({
          providerResponseDigest: input.readyResponseDigest,
          providerNativeWidth: 1364,
          providerNativeHeight: 768,
          authority: input.costAuthority as MotionStudioHailuoCostAuthority,
        })
      : meterWanProviderUsageFromPersistedEvidence({
          providerResponseDigest: input.readyResponseDigest,
          usage: {
            billedDurationSeconds: 6,
            outputDurationSeconds: 6,
            videoCount: 1,
            resolution: 720,
          },
          authority: input.costAuthority as MotionStudioWanCostAuthority,
        }).usageLine
    const infrastructureUsage = this.meterMediaQaCpuUsage({
      operationId: input.operationId,
      requestDigest: input.ingest.providerRequestDigest,
      responseDigest: input.readyResponseDigest,
      qaEvidenceDigest: ingested.qaEvidenceDigest,
      cpuStart,
      authority: input.infrastructureCostAuthority,
      measuredAt: input.occurredAt,
    })
    const recoveryEvidenceDigest = sha256CanonicalJson({
      schemaVersion: 'motion-studio-live-local-media-recovery-v1',
      operationId: input.operationId,
      providerAdapterId,
      providerModelVersion: input.providerModelVersion,
      providerRequestDigest: input.ingest.providerRequestDigest,
      readyResponseDigest: input.readyResponseDigest,
      failedDownloadResponseDigest: input.failedDownloadResponseDigest,
      providerSourceMediaSha256,
      normalizedMediaSha256: ingested.mediaSha256,
      normalizationVersion: ingested.normalizationVersion ?? null,
      privateObjectIdentityHash: ingested.privateObjectIdentityHash,
      qaEvidenceDigest: ingested.qaEvidenceDigest,
      providerCallMade: false,
      providerDownloadMade: false,
      networkCallCount: 0,
      attemptCountChanged: false,
      measuredAt: input.occurredAt,
    })
    const usage = [providerUsage, infrastructureUsage] as const
    const outcomeDigest = sha256CanonicalJson({
      schemaVersion: 'motion-studio-live-recovered-candidate-outcome-v1',
      operationId: input.operationId,
      recoveryEvidenceDigest,
      mediaAssetId: input.completion.mediaAssetId,
      mediaAssetVersionId: input.completion.mediaAssetVersionId,
      mediaSha256: ingested.mediaSha256,
      provenanceDigest: ingested.provenanceDigest,
      qaEvidenceDigest: ingested.qaEvidenceDigest,
      usage,
    })
    const candidateCompletion = await this.authority.recoverCandidate({
      operationId: input.operationId,
      leaseId: input.leaseId,
      leaseCredential: input.leaseCredential,
      providerSourceMediaSha256,
      readyResponseDigest: input.readyResponseDigest,
      failedDownloadResponseDigest: input.failedDownloadResponseDigest,
      mediaAssetId: input.completion.mediaAssetId,
      mediaAssetVersionId: input.completion.mediaAssetVersionId,
      privateObjectIdentityHash: ingested.privateObjectIdentityHash,
      mediaSha256: ingested.mediaSha256,
      byteLength: ingested.byteLength,
      mimeType: 'video/mp4',
      width: ingested.width,
      height: ingested.height,
      durationFrames: requireNumber(ingested.durationFrames, 'recovered Wan duration frames'),
      fpsNumerator: requireNumber(ingested.fpsNumerator, 'recovered Wan frame-rate numerator'),
      fpsDenominator: requireNumber(ingested.fpsDenominator, 'recovered Wan frame-rate denominator'),
      provenanceDigest: ingested.provenanceDigest,
      qaEvidenceDigest: ingested.qaEvidenceDigest,
      safetyStatus: input.completion.safetyStatus,
      usage,
      recoveryEvidenceDigest,
      outcomeDigest,
      occurredAt: input.occurredAt,
      idempotencyKey: input.completion.idempotencyKey,
    })
    return {
      operationId: input.operationId,
      providerSourceMediaSha256,
      ingested,
      candidateCompletion: candidateCompletion.data,
      providerCallMade: false,
      providerDownloadMade: false,
      networkCallCount: 0,
      automaticRetryAllowed: false,
    }
  }

  private async completeIngestedCandidate(input: {
    operationId: string
    leaseId: string
    leaseCredential: string
    requestDigest: string
    responseDigest: string
    ingested: MotionStudioPrivateLiveMediaIngestResult
    completion: MotionStudioLiveCandidateCompletionAuthority & {
      usage: readonly MotionStudioAttemptUsageLine[]
    }
  }): Promise<MotionStudioLiveCandidateCompletionResult> {
    const outcomeDigest = sha256CanonicalJson({
      schemaVersion: 'motion-studio-live-runner-candidate-outcome-v1',
      operationId: input.operationId,
      requestDigest: input.requestDigest,
      responseDigest: input.responseDigest,
      mediaAssetId: input.completion.mediaAssetId,
      mediaAssetVersionId: input.completion.mediaAssetVersionId,
      privateObjectIdentityHash: input.ingested.privateObjectIdentityHash,
      mediaSha256: input.ingested.mediaSha256,
      byteLength: input.ingested.byteLength,
      mimeType: input.ingested.mimeType,
      width: input.ingested.width,
      height: input.ingested.height,
      durationFrames: input.ingested.durationFrames ?? null,
      fpsNumerator: input.ingested.fpsNumerator ?? null,
      fpsDenominator: input.ingested.fpsDenominator ?? null,
      provenanceDigest: input.ingested.provenanceDigest,
      qaEvidenceDigest: input.ingested.qaEvidenceDigest,
      safetyStatus: input.completion.safetyStatus,
      usage: input.completion.usage,
    })
    const completed = await this.authority.completeCandidate({
      operationId: input.operationId,
      leaseId: input.leaseId,
      leaseCredential: input.leaseCredential,
      mediaAssetId: input.completion.mediaAssetId,
      mediaAssetVersionId: input.completion.mediaAssetVersionId,
      privateObjectIdentityHash: input.ingested.privateObjectIdentityHash,
      mediaSha256: input.ingested.mediaSha256,
      byteLength: input.ingested.byteLength,
      mimeType: input.ingested.mimeType,
      width: input.ingested.width,
      height: input.ingested.height,
      ...(input.ingested.durationFrames === undefined ? {} : { durationFrames: input.ingested.durationFrames }),
      ...(input.ingested.fpsNumerator === undefined ? {} : { fpsNumerator: input.ingested.fpsNumerator }),
      ...(input.ingested.fpsDenominator === undefined ? {} : { fpsDenominator: input.ingested.fpsDenominator }),
      provenanceDigest: input.ingested.provenanceDigest,
      qaEvidenceDigest: input.ingested.qaEvidenceDigest,
      safetyStatus: input.completion.safetyStatus,
      usage: input.completion.usage,
      outcomeDigest,
      idempotencyKey: input.completion.idempotencyKey,
    })
    return completed.data
  }

  private async finishKnownFailure(input: {
    operationId: string
    leaseId: string
    leaseCredential: string
    failureCategory:
      | 'live_media_ingest_failed'
      | 'live_media_download_or_ingest_failed'
      | 'live_provider_http_rejected'
    errorClass: string
    requestDigest: string
    responseDigest: string
    usage: readonly MotionStudioAttemptUsageLine[]
    occurredAt: string
  }): Promise<void> {
    const outcomeDigest = sha256CanonicalJson({
      schemaVersion: 'motion-studio-live-known-failure-outcome-v1',
      operationId: input.operationId,
      failureCategory: input.failureCategory,
      errorClass: input.errorClass,
      requestDigest: input.requestDigest,
      responseDigest: input.responseDigest,
      usage: input.usage,
      occurredAt: input.occurredAt,
    })
    await this.authority.finishAttempt({
      operationId: input.operationId,
      leaseId: input.leaseId,
      leaseCredential: input.leaseCredential,
      outcome: 'failed',
      failureCategory: input.failureCategory,
      usage: input.usage,
      outcomeDigest,
      idempotencyKey: `live-failure-${input.operationId}-${outcomeDigest.slice(0, 32)}`,
    })
  }

  private meterVideoProviderUsage(input: {
    operationKind: 'wan_image_to_video' | 'hailuo_image_to_video_fallback'
    providerAdapterId: typeof MOTION_STUDIO_WAN_LIVE_ADAPTER_ID | typeof MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID
    temporaryUrl: string
    ingest: MotionStudioLiveMediaIngestAuthority
    costEvidence: MotionStudioLiveVideoCostEvidence
  }): MotionStudioAttemptUsageLine {
    if (input.costEvidence.kind === 'wan_provider_result') {
      if (
        input.operationKind !== 'wan_image_to_video' ||
        input.providerAdapterId !== MOTION_STUDIO_WAN_LIVE_ADAPTER_ID
      ) throw blocked('Wan provider-cost evidence does not match the exact video operation route.')
      const result = input.costEvidence.queryResult
      if (
        result.status !== 'SUCCEEDED' ||
        result.transientDownloadUrl !== input.temporaryUrl ||
        result.responseDigest !== input.ingest.providerResponseDigest
      ) throw blocked('Wan download and cost evidence do not match the exact successful provider result.')
      return meterWanProviderUsage({ result, authority: input.costEvidence.authority }).usageLine
    }
    if (
      input.operationKind !== 'hailuo_image_to_video_fallback' ||
      input.providerAdapterId !== MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID
    ) throw blocked('Hailuo provider-cost evidence does not match the exact fallback operation route.')
    const query = input.costEvidence.queryResult
    const file = input.costEvidence.fileResult
    if (
      query.status !== 'Success' || !query.fileIdDigest ||
      query.fileIdDigest !== file.fileIdDigest ||
      file.transientDownloadUrl !== input.temporaryUrl ||
      file.responseDigest !== input.ingest.providerResponseDigest
    ) throw blocked('Hailuo download and cost evidence do not match the exact successful provider/file result chain.')
    return meterHailuoProviderUsage({ result: query, authority: input.costEvidence.authority })
  }

  private meterMediaQaCpuUsage(input: {
    operationId: string
    requestDigest: string
    responseDigest: string
    qaEvidenceDigest?: string
    cpuStart: { user: number; system: number }
    authority: MotionStudioLiveInfrastructureCostAuthority
    measuredAt: string
  }): MotionStudioAttemptUsageLine {
    const cpuEnd = this.readCpuUsage()
    const cpuUsageMicroseconds =
      Math.max(0, cpuEnd.user - input.cpuStart.user) +
      Math.max(0, cpuEnd.system - input.cpuStart.system)
    return meterMotionStudioLiveMediaQaCpuUsage({
      operationId: input.operationId,
      requestDigest: input.requestDigest,
      responseDigest: input.responseDigest,
      ...(input.qaEvidenceDigest ? { qaEvidenceDigest: input.qaEvidenceDigest } : {}),
      cpuUsageMicroseconds,
      authority: input.authority,
      measuredAt: input.measuredAt,
    })
  }

  private async submitAsyncOnce<TBody, TParsed>(input: {
    request: MotionStudioCompiledProviderRequest<TBody>
    submission: MotionStudioLiveSubmissionAuthority
    occurredAt: string
  }, parse: (value: unknown) => TParsed & {
    responseDigest: string
    taskIdDigest: string
    transientTaskId: string
  }): Promise<MotionStudioAsyncSubmitResult<TParsed>> {
    const transportResult = await this.executeSubmission(input.request, input.submission)
    const response = await this.requireSubmissionResponse({
      result: transportResult,
      submission: input.submission,
      requestDigest: input.request.requestDigest,
      occurredAt: input.occurredAt,
      providerCostIncurred: true,
    })
    let parsed: TParsed & {
      responseDigest: string
      taskIdDigest: string
      transientTaskId: string
    }
    try {
      parsed = parse(response.responseBody)
    } catch (error) {
      await this.recordUnrecognizedSubmission(
        input.submission.operationId,
        input.request.requestDigest,
        response.responseBodyDigest,
        input.occurredAt,
        true,
      )
      throw error
    }
    if (!this.protectedProviderOperationIdentities) {
      throw blocked('Asynchronous provider submission requires protected resumable task-identity storage.')
    }
    await this.protectedProviderOperationIdentities.persist({
      operationId: input.submission.operationId,
      providerAdapterId: input.request.providerAdapterId,
      externalOperationId: parsed.transientTaskId,
      externalOperationIdHash: parsed.taskIdDigest,
      persistedAt: input.occurredAt,
    })
    await this.recordSubmissionEvent({
      operationId: input.submission.operationId,
      requestDigest: input.request.requestDigest,
      responseDigest: parsed.responseDigest,
      normalizedStatus: 'submitted',
      externalOperationIdHash: parsed.taskIdDigest,
      providerCostIncurred: true,
      occurredAt: input.occurredAt,
    })
    return {
      operationId: input.submission.operationId,
      requestDigest: input.request.requestDigest,
      parsed,
      providerCallMade: true,
      networkCallCount: 1,
      automaticRetryAllowed: false,
      automaticPollingAllowed: false,
    }
  }

  private async queryAsyncOnce<TParsed>(input: {
    request: MotionStudioCompiledProviderRequest<null>
    followup: MotionStudioLiveFollowupAuthority
    occurredAt: string
  }, parse: (value: unknown) => TParsed & { responseDigest: string }, normalize: (parsed: TParsed) => MotionStudioLiveFollowupResultStatus, validate?: (parsed: TParsed) => void): Promise<MotionStudioAsyncFollowupResult<TParsed>> {
    return this.followupOnce({ ...input, purpose: 'status_query', parse, normalize, validate })
  }

  private async followupOnce<TParsed>(input: {
    request: MotionStudioCompiledProviderRequest<null>
    followup: MotionStudioLiveFollowupAuthority
    occurredAt: string
    purpose: 'status_query' | 'file_retrieve'
    parse: (value: unknown) => TParsed & { responseDigest: string }
    normalize: (parsed: TParsed) => MotionStudioLiveFollowupResultStatus
    validate?: (parsed: TParsed) => void
  }): Promise<MotionStudioAsyncFollowupResult<TParsed>> {
    const consumed = await this.consumeFollowupAuthority({
      followup: input.followup,
      purpose: input.purpose,
      providerAdapterId: input.request.providerAdapterId,
      requestDigest: input.request.requestDigest,
    })
    const transportResult = await this.transport.execute({
      request: input.request,
      permit: consumed.data.transportPermit,
      now: this.readCurrentTime(),
    })
    const response = await this.requireFollowupResponse({
      result: transportResult,
      followup: input.followup,
      requestDigest: input.request.requestDigest,
      occurredAt: input.occurredAt,
    })
    let parsed: TParsed & { responseDigest: string }
    try {
      parsed = input.parse(response.responseBody)
      input.validate?.(parsed)
    } catch (error) {
      await this.recordFollowupResult(
        input.followup,
        'unrecognized_response',
        input.request.requestDigest,
        response.responseBodyDigest,
        input.occurredAt,
      )
      throw error
    }
    const resultStatus = input.normalize(parsed)
    await this.recordFollowupResult(
      input.followup,
      resultStatus,
      input.request.requestDigest,
      parsed.responseDigest,
      input.occurredAt,
    )
    if (['failed', 'cancelled', 'outcome_unknown', 'unrecognized_response'].includes(resultStatus)) {
      throw blocked('Provider follow-up reached a non-success terminal or unknown outcome. Reconciliation is required; retry and fallback are forbidden.')
    }
    return {
      operationId: input.followup.operationId,
      callId: input.followup.callId,
      callSequence: input.followup.callSequence,
      parsed,
      providerCallMade: true,
      networkCallCount: 1,
      automaticRetryAllowed: false,
      automaticPollingAllowed: false,
    }
  }

  private async executeSubmission<TBody>(
    request: MotionStudioCompiledProviderRequest<TBody>,
    submission: MotionStudioLiveSubmissionAuthority,
  ): Promise<MotionStudioProviderTransportResult> {
    const issued = await this.authority.issuePermit({
      operationId: submission.operationId,
      permitId: submission.permitId,
      leaseId: submission.leaseId,
      leaseCredential: submission.leaseCredential,
      executionAuthorityId: submission.executionAuthorityId,
      executionAuthorityDigest: submission.executionAuthorityDigest,
      providerAdapterId: request.providerAdapterId,
      requestDigest: request.requestDigest,
      credentialReferenceId: submission.credentialReferenceId,
      issuedAt: submission.issuedAt,
      expiresAt: submission.expiresAt,
    })
    await this.authority.consumePermit({
      permitId: submission.permitId,
      leaseId: submission.leaseId,
      leaseCredential: submission.leaseCredential,
      requestDigest: request.requestDigest,
    })
    return this.transport.execute({
      request,
      permit: issued.data.transportPermit,
      now: this.readCurrentTime(),
    })
  }

  private async consumeFollowupAuthority(input: {
    followup: MotionStudioLiveFollowupAuthority
    purpose: 'status_query' | 'file_retrieve' | 'media_download'
    providerAdapterId: MotionStudioCompiledProviderRequest<unknown>['providerAdapterId']
    requestDigest: string
  }) {
    return this.authority.consumeFollowupCall({
      operationId: input.followup.operationId,
      callId: input.followup.callId,
      callPurpose: input.purpose,
      callSequence: input.followup.callSequence,
      leaseId: input.followup.leaseId,
      leaseCredential: input.followup.leaseCredential,
      executionAuthorityId: input.followup.executionAuthorityId,
      executionAuthorityDigest: input.followup.executionAuthorityDigest,
      providerAdapterId: input.providerAdapterId,
      requestDigest: input.requestDigest,
      credentialReferenceId: input.followup.credentialReferenceId,
      issuedAt: input.followup.issuedAt,
      expiresAt: input.followup.expiresAt,
    })
  }

  private async requireSubmissionResponse(input: {
    result: MotionStudioProviderTransportResult
    submission: MotionStudioLiveSubmissionAuthority
    requestDigest: string
    occurredAt: string
    providerCostIncurred: boolean
  }) {
    if (input.result.status === 'response_received' && input.result.httpStatus >= 200 && input.result.httpStatus < 300) {
      return input.result
    }
    if (input.result.status === 'response_received') {
      const fields = extractSafeProviderErrorFields(input.result.responseBody)
      const knownRejection = isKnownProviderHttpRejection(input.result.httpStatus, fields)
      const evidence: SanitizedProviderHttpEvidence = {
        outcome: knownRejection ? 'known_http_rejection' : 'ambiguous_http_response',
        httpStatus: input.result.httpStatus,
        responseDigest: input.result.responseBodyDigest,
        ...(input.result.providerRequestIdDigest
          ? { providerRequestIdDigest: input.result.providerRequestIdDigest }
          : {}),
        ...(fields.providerErrorType ? { providerErrorType: fields.providerErrorType } : {}),
        ...(fields.providerErrorCode ? { providerErrorCode: fields.providerErrorCode } : {}),
        providerCostIncurred: knownRejection ? false : input.providerCostIncurred,
        reconciliationRequired: !knownRejection,
        automaticRetryAllowed: false,
      }
      if (knownRejection) {
        await this.recordSubmissionEvent({
          operationId: input.submission.operationId,
          requestDigest: input.requestDigest,
          responseDigest: input.result.responseBodyDigest,
          normalizedStatus: 'failed',
          providerCostIncurred: false,
          occurredAt: input.occurredAt,
        })
        await this.finishKnownFailure({
          operationId: input.submission.operationId,
          leaseId: input.submission.leaseId,
          leaseCredential: input.submission.leaseCredential,
          failureCategory: 'live_provider_http_rejected',
          errorClass: `provider_http_${input.result.httpStatus}`,
          requestDigest: input.requestDigest,
          responseDigest: input.result.responseBodyDigest,
          usage: [],
          occurredAt: input.occurredAt,
        })
        throw blocked(
          'Provider rejected the exact submission without creating a usable output. Retry remains forbidden.',
          { providerEvidence: evidence },
        )
      }
      await this.recordUnrecognizedSubmission(
        input.submission.operationId,
        input.requestDigest,
        input.result.responseBodyDigest,
        input.occurredAt,
        input.providerCostIncurred,
      )
      throw blocked(
        'Provider returned an ambiguous HTTP response after dispatch. Reconciliation is required; retry is forbidden.',
        { providerEvidence: evidence },
      )
    }
    const responseDigest = input.result.status === 'unrecognized_response'
      ? input.result.responseBodyDigest
      : sha256CanonicalJson({ status: input.result.status, reason: input.result.reason })
    await this.recordUnrecognizedSubmission(
      input.submission.operationId,
      input.requestDigest,
      responseDigest,
      input.occurredAt,
      input.providerCostIncurred,
    )
    throw blocked('Provider submission did not return one recognized successful response. Reconciliation is required; retry is forbidden.')
  }

  private async requireFollowupResponse(input: {
    result: MotionStudioProviderTransportResult
    followup: MotionStudioLiveFollowupAuthority
    requestDigest: string
    occurredAt: string
  }) {
    if (input.result.status === 'response_received' && input.result.httpStatus >= 200 && input.result.httpStatus < 300) {
      return input.result
    }
    const resultStatus: MotionStudioLiveFollowupResultStatus = input.result.status === 'outcome_unknown'
      ? 'outcome_unknown' : 'unrecognized_response'
    const responseDigest = input.result.status === 'response_received' || input.result.status === 'unrecognized_response'
      ? input.result.responseBodyDigest
      : sha256CanonicalJson({ status: input.result.status, reason: input.result.reason })
    await this.recordFollowupResult(
      input.followup,
      resultStatus,
      input.requestDigest,
      responseDigest,
      input.occurredAt,
    )
    throw blocked('Provider follow-up did not return one recognized successful response. No automatic retry or polling loop is allowed.')
  }

  private async recordUnrecognizedSubmission(
    operationId: string,
    requestDigest: string,
    responseDigest: string,
    occurredAt: string,
    providerCostIncurred: boolean,
  ): Promise<void> {
    await this.recordSubmissionEvent({
      operationId,
      requestDigest,
      responseDigest,
      normalizedStatus: 'outcome_unknown',
      providerCostIncurred,
      occurredAt,
    })
  }

  private async recordSubmissionEvent(input: {
    operationId: string
    requestDigest: string
    responseDigest: string
    normalizedStatus: 'submitted' | 'outcome_unknown' | 'completed' | 'failed'
    externalOperationIdHash?: string
    providerCostIncurred: boolean
    occurredAt: string
  }): Promise<void> {
    const eventDigest = sha256CanonicalJson({
      schemaVersion: 'motion-studio-live-runner-provider-event-v1',
      operationId: input.operationId,
      requestDigest: input.requestDigest,
      responseDigest: input.responseDigest,
      normalizedStatus: input.normalizedStatus,
      externalOperationIdHash: input.externalOperationIdHash ?? null,
      providerCostIncurred: input.providerCostIncurred,
      occurredAt: input.occurredAt,
    })
    await this.authority.recordProviderEvent({
      operationId: input.operationId,
      eventSource: 'synchronous',
      normalizedStatus: input.normalizedStatus,
      eventDigest,
      responseDigest: input.responseDigest,
      ...(input.externalOperationIdHash ? { externalOperationIdHash: input.externalOperationIdHash } : {}),
      providerCostIncurred: input.providerCostIncurred,
      occurredAt: input.occurredAt,
    })
  }

  private async recordFollowupResult(
    followup: MotionStudioLiveFollowupAuthority,
    resultStatus: MotionStudioLiveFollowupResultStatus,
    requestDigest: string,
    responseDigest: string,
    occurredAt: string,
  ): Promise<void> {
    const eventDigest = sha256CanonicalJson({
      schemaVersion: 'motion-studio-live-runner-followup-event-v1',
      operationId: followup.operationId,
      callId: followup.callId,
      callSequence: followup.callSequence,
      requestDigest,
      responseDigest,
      resultStatus,
      occurredAt,
    })
    await this.authority.recordFollowupCallResult({
      callId: followup.callId,
      leaseCredential: followup.leaseCredential,
      resultStatus,
      eventDigest,
      responseDigest,
      occurredAt,
    })
  }
}

function requireAdapter<TBody>(
  request: MotionStudioCompiledProviderRequest<TBody>,
  expected: MotionStudioCompiledProviderRequest<unknown>['providerAdapterId'],
): void {
  if (request.providerAdapterId !== expected || request.maximumProviderCallCount !== 1) {
    throw blocked('Live operation runner request does not match the exact one-call provider route.')
  }
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function requireNumber(value: number | undefined, label: string): number {
  if (!Number.isSafeInteger(value) || value === undefined || value <= 0) {
    throw blocked(`${label} is missing from technically complete media evidence.`)
  }
  return value
}

function expectedWanTaskDigest(request: MotionStudioCompiledProviderRequest<null>): string {
  const url = new URL(request.endpoint)
  const encodedTaskId = url.pathname.split('/').filter(Boolean).at(-1)
  if (!encodedTaskId) throw blocked('Wan query request is missing its exact provider task identity.')
  return digestOpaqueProviderIdentifier(decodeURIComponent(encodedTaskId))
}

function expectedMiniMaxIdentifierDigest(
  request: MotionStudioCompiledProviderRequest<null>,
  key: 'task_id' | 'file_id',
): string {
  const value = request.query?.[key]
  if (!value || Object.keys(request.query ?? {}).length !== 1) {
    throw blocked(`MiniMax ${key} request is not bound to one exact provider identity.`)
  }
  return digestOpaqueProviderIdentifier(value)
}

function safeErrorClass(error: unknown): string {
  if (error instanceof ApiError) return error.code
  if (error instanceof Error && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(error.name)) return error.name
  return 'unknown_error'
}

function extractSafeProviderErrorFields(value: unknown): {
  providerErrorType?: string
  providerErrorCode?: string
} {
  if (!isRecord(value)) return {}
  const nested = isRecord(value.error) ? value.error : undefined
  const baseResponse = isRecord(value.base_resp) ? value.base_resp : undefined
  const providerErrorType = safeProviderErrorIdentifier(
    nested?.type ?? value.type ?? baseResponse?.status,
  )
  const providerErrorCode = safeProviderErrorIdentifier(
    nested?.code ?? value.code ?? baseResponse?.status_code,
  )
  return {
    ...(providerErrorType ? { providerErrorType } : {}),
    ...(providerErrorCode ? { providerErrorCode } : {}),
  }
}

function isKnownProviderHttpRejection(
  status: number,
  fields: { providerErrorType?: string; providerErrorCode?: string },
): boolean {
  if (status < 400 || status >= 500 || [408, 409, 425].includes(status)) return false
  return Boolean(fields.providerErrorType || fields.providerErrorCode)
}

function safeProviderErrorIdentifier(value: unknown): string | undefined {
  const normalized = typeof value === 'number' && Number.isSafeInteger(value)
    ? String(value)
    : typeof value === 'string'
      ? value.trim()
      : ''
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(normalized) ? normalized : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function blocked(message: string, details?: unknown): ApiError {
  return new ApiError('PROVIDER_ROUTE_BLOCKED', message, 409, details)
}
