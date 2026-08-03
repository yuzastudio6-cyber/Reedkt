import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  readPrivateFileIfExistsWithinRoot,
  readPrivateTextFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../../../security/private-local-persistence'
import { hashSkillValue } from '../../../edit-skills/core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../../edit-skills/core/skill-capability-manifest-schema'
import {
  assertBrollProviderWorkAuthorizationV5,
  brollProviderAuthorizationRequestHashV5,
  type BrollProviderRequestPackageV5,
  type BrollProviderWorkAuthorizationV5,
} from './b-roll-provider-authority-v5'
import {
  BROLL_GEMINI_FILES_ENDPOINT,
  BROLL_GEMINI_INTERACTIONS_ENDPOINT,
  BROLL_GEMINI_UPLOAD_ENDPOINT,
  buildBrollGeminiOfficialInteractionRequest,
  parseBrollGeminiFileStatus,
  parseBrollGeminiInteractionResponse,
  type BrollGeminiEphemeralSourceMedia,
  type BrollGeminiParsedInteraction,
} from './b-roll-gemini-official-contract'
import type { BrollGeminiSecretResolver } from './b-roll-gemini-secret-resolver'
import { createBrollProviderLifecyclePolicyV5 } from './b-roll-provider-lifecycle-policy-v5'

export const BROLL_GEMINI_REST_TRANSPORT_VERSION =
  'b_roll_gemini_omni_rest_transport_v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })

const requestCountsSchema = z.object({
  secretPayloadReads: z.literal(1),
  reconciliationSecretPayloadReads: z.union([z.literal(0), z.literal(1)]),
  uploadNegotiationRequests: z.union([z.literal(0), z.literal(1)]),
  uploadDataRequests: z.union([z.literal(0), z.literal(1)]),
  sourceUploadStatusReads: z.number().int().nonnegative().max(20),
  generationSubmissions: z.union([z.literal(0), z.literal(1)]),
  interactionStatusReads: z.number().int().nonnegative().max(20),
  reconciliationStatusReads: z.number().int().nonnegative().max(20),
  resultMetadataReads: z.number().int().nonnegative().max(2),
  resultFileStatusReads: z.number().int().nonnegative().max(40),
  binaryDownloads: z.number().int().nonnegative().max(2),
  redirects: z.literal(0),
  automaticRetries: z.literal(0),
  alternateProviderFallbacks: z.literal(0),
  totalHttpRequests: z.number().int().nonnegative().max(90),
}).strict()

const privateOutputSchema = z.object({
  outputId: identity,
  artifactType: z.literal('provider_b_roll_candidate_video_mp4'),
  contentType: z.literal('video/mp4'),
  privateObjectRelativePath: z.string().regex(/^b-roll\/provider-v5\/live-objects\/[a-f0-9]{64}\.mp4$/u),
  privateObjectIdentityHash: skillSha256Schema,
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(67_108_864),
  providerGenerated: z.literal(true),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  publicArtifactCreated: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
}).strict()

const transportStateCoreSchema = z.object({
  schemaVersion: z.literal(BROLL_GEMINI_REST_TRANSPORT_VERSION),
  attemptId: skillSha256Schema,
  authorizationHash: skillSha256Schema,
  requestPackageHash: skillSha256Schema,
  operationId: z.literal('provider.google.generate_b_roll_candidate.v1'),
  providerRouteId: z.literal('gemini_omni_flash'),
  configuredModelAlias: z.literal('gemini-omni-flash-preview'),
  acceptedRuntimeModel: identity.nullable(),
  immutableProviderRevision: z.null(),
  providerRevisionStatus: z.literal('preview_alias_unpinned'),
  officialContractSource: z.literal('https://ai.google.dev/gemini-api/docs/omni'),
  status: z.enum(['completed', 'failed', 'unknown_reconciliation_required']),
  interactionId: identity.nullable(),
  interactionIdDigest: skillSha256Schema.nullable(),
  providerResponseDigest: skillSha256Schema.nullable(),
  providerUsageDigest: skillSha256Schema.nullable(),
  output: privateOutputSchema.nullable(),
  sanitizedFailureCode: identity.nullable(),
  requestCounts: requestCountsSchema,
  providerCost: z.object({
    currency: z.literal('USD'),
    requestedGeneratedSeconds: z.number().int().min(3).max(10),
    rateAuthoritySnapshotId: identity,
    rateAuthoritySnapshotDigest: skillSha256Schema,
    costMicrosPerGeneratedSecond: z.number().int().nonnegative(),
    accountedProviderCostMicros: z.number().int().nonnegative(),
    evidenceClass: z.literal('approved_canary_ceiling_rate_times_requested_seconds'),
    failedOrUnknownCostRetained: z.boolean(),
    serviceFeeIncluded: z.literal(false),
    productionRateQualified: z.literal(false),
  }).strict(),
  infrastructureCost: z.object({
    accountedInfrastructureCostMicros: z.literal(0),
    evidenceClass: z.literal('not_observed_transport_only'),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  secretEvidence: z.object({
    schemaVersion: z.literal('b_roll_gemini_secret_resolver_v1'),
    configurationKey: z.literal('GOOGLE_SECRET_GEMINI_API_KEY_NAME'),
    projectId: identity,
    secretId: z.literal('reeditpro-prod-gemini-api-key'),
    numericVersion: z.string().regex(/^[1-9][0-9]{0,18}$/u),
    payloadReadCount: z.literal(1),
    reconciliationPayloadReadCount: z.union([z.literal(0), z.literal(1)]),
    payloadPersisted: z.literal(false),
    payloadLogged: z.literal(false),
    browserExposureAllowed: z.literal(false),
  }).strict(),
  rawProviderRequestPersisted: z.literal(false),
  rawProviderResponsePersisted: z.literal(false),
  providerUrlPersisted: z.literal(false),
  temporaryDownloadUrlPersisted: z.literal(false),
  apiKeyPersisted: z.literal(false),
  productionEligible: z.literal(false),
  completedAt: timestamp,
}).strict()

export const brollGeminiRestTransportStateSchema = transportStateCoreSchema.extend({
  stateHash: skillSha256Schema,
}).strict().superRefine((state, context) => {
  const { stateHash, ...core } = state
  const completed = state.status === 'completed'
  if (
    hashSkillValue(core) !== stateHash ||
    completed !== Boolean(state.output) ||
    ((state.status !== 'completed') !== Boolean(state.sanitizedFailureCode)) ||
    state.providerCost.accountedProviderCostMicros !==
      state.providerCost.requestedGeneratedSeconds * state.providerCost.costMicrosPerGeneratedSecond *
        state.requestCounts.generationSubmissions ||
    state.requestCounts.totalHttpRequests !==
      state.requestCounts.uploadNegotiationRequests + state.requestCounts.uploadDataRequests +
      state.requestCounts.sourceUploadStatusReads + state.requestCounts.generationSubmissions +
      state.requestCounts.interactionStatusReads + state.requestCounts.reconciliationStatusReads +
      state.requestCounts.resultMetadataReads + state.requestCounts.resultFileStatusReads +
      state.requestCounts.binaryDownloads ||
    state.secretEvidence.reconciliationPayloadReadCount !==
      state.requestCounts.reconciliationSecretPayloadReads
  ) context.addIssue({ code: 'custom', message: 'Gemini B-roll REST transport state is inconsistent.' })
})

export type BrollGeminiRestTransportState = z.infer<
  typeof brollGeminiRestTransportStateSchema
>

export async function executeBrollGeminiRestTransport(input: {
  localStorageRoot: string
  authorization: BrollProviderWorkAuthorizationV5
  requestPackage: BrollProviderRequestPackageV5
  sourceMedia?: BrollGeminiEphemeralSourceMedia
  secretResolver: BrollGeminiSecretResolver
  fetchImplementation?: typeof fetch
  externalNetworkEnabled: true
  explicitExecutionConfirmed: true
  approvedSafeFixture: true
  privateOutputDestinationConfirmed: true
  publicArtifactAllowed: false
  timelineMutationAllowed: false
  automaticRetryAllowed: false
  fallbackProviderAllowed: false
  delivery?: 'inline' | 'uri'
  now?: () => string
  pollWait?: () => Promise<void>
  requestTimeoutMs?: number
}): Promise<{ disposition: 'executed' | 'completed_replay'; state: BrollGeminiRestTransportState }> {
  const authorization = assertBrollProviderWorkAuthorizationV5({
    value: input.authorization,
    requestPackage: input.requestPackage,
  })
  assertLiveExecutionGates(input)
  assertLiveCanaryAuthority(authorization)
  const now = input.now ?? (() => new Date().toISOString())
  if (Date.parse(now()) < Date.parse(authorization.authorizedAt) ||
    Date.parse(now()) >= Date.parse(authorization.expiresAt)) {
    throw new Error('Gemini B-roll canary authorization is not current.')
  }
  const attemptId = hashSkillValue({
    domain: 'reeditpro:b-roll-gemini-live-attempt:v1',
    authorizationRequestHash: brollProviderAuthorizationRequestHashV5(authorization),
  })
  const resultPath = resultPathFor(attemptId)
  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: `b-roll/provider-v5/live-locks/${attemptId}.lock`,
    operation: async () => {
      const existing = await readExistingResult(input.localStorageRoot, resultPath)
      if (existing) {
        assertReplay(existing, authorization, input.requestPackage)
        if (existing.output) await assertOutputReadback(input.localStorageRoot, existing.output)
        return { disposition: 'completed_replay', state: existing }
      }
      const dispatchMarkerPath = `b-roll/provider-v5/live-dispatch/${attemptId}.json`
      const marker = Buffer.from(`${JSON.stringify({
        schemaVersion: 'b_roll_gemini_live_dispatch_marker_v1',
        attemptId,
        authorizationHash: authorization.authorityHash,
        requestPackageHash: input.requestPackage.requestPackageHash,
        oneUse: true,
      })}\n`, 'utf8')
      const dispatch = await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: dispatchMarkerPath,
        content: marker,
      })
      if (!dispatch.created) {
        throw new Error('Gemini B-roll attempt was already dispatched and requires reconciliation; resubmission is forbidden.')
      }
      const counters = emptyCounters()
      const secret = await input.secretResolver.resolveOnce()
      const secretEvidence = {
        ...input.secretResolver.evidence(),
        reconciliationPayloadReadCount: 0 as const,
      }
      if (secretEvidence.payloadReadCount !== 1) throw new Error('Gemini secret read accounting is invalid.')
      const fetchImplementation = input.fetchImplementation ?? globalThis.fetch
      const timeoutMs = input.requestTimeoutMs ?? 120_000
      if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 300_000) {
        throw new Error('Gemini request timeout is outside the server-owned range.')
      }
      let acceptedRuntimeModel: string | null = null
      let interactionId: string | null = null
      let interactionIdDigest: string | null = null
      let providerResponseDigest: string | null = null
      let providerUsageDigest: string | null = null
      let output: z.infer<typeof privateOutputSchema> | null = null
      let status: BrollGeminiRestTransportState['status']
      let sanitizedFailureCode: string | null = null
      try {
        let uploadedVideoFileUri: string | undefined
        if (input.requestPackage.taskMode === 'edit_uploaded_video') {
          if (!input.sourceMedia || input.sourceMedia.mimeType !== 'video/mp4') {
            throw new TerminalTransportError('approved_video_source_missing')
          }
          uploadedVideoFileUri = await uploadApprovedVideo({
            source: input.sourceMedia,
            apiKey: secret.apiKey,
            fetchImplementation,
            timeoutMs,
            counters,
            pollWait: input.pollWait,
          })
        }
        const official = buildBrollGeminiOfficialInteractionRequest({
          requestPackage: input.requestPackage,
          ...(input.sourceMedia ? { sourceMedia: input.sourceMedia } : {}),
          ...(uploadedVideoFileUri ? { uploadedVideoFileUri } : {}),
          delivery: input.delivery ?? 'inline',
        })
        counters.generationSubmissions += 1
        const initial = await fetchJson({
          fetchImplementation,
          url: BROLL_GEMINI_INTERACTIONS_ENDPOINT,
          method: 'POST',
          apiKey: secret.apiKey,
          headers: official.fixedHeaders,
          body: Buffer.from(JSON.stringify(official.body), 'utf8'),
          maximumResponseBytes: 96 * 1024 * 1024,
          timeoutMs,
          unknownOnNetworkError: true,
        })
        let parsed = parseBrollGeminiInteractionResponse({
          httpStatus: initial.status,
          value: initial.value,
        })
        for (let index = 0; parsed.state === 'in_progress' && index < 20; index += 1) {
          await (input.pollWait?.() ?? wait(5_000))
          counters.interactionStatusReads += 1
          const polled = await fetchJson({
            fetchImplementation,
            url: `${BROLL_GEMINI_INTERACTIONS_ENDPOINT}/${encodeURIComponent(parsed.interactionId)}`,
            method: 'GET',
            apiKey: secret.apiKey,
            headers: {},
            maximumResponseBytes: 96 * 1024 * 1024,
            timeoutMs,
            unknownOnNetworkError: true,
          })
          parsed = parseBrollGeminiInteractionResponse({ httpStatus: polled.status, value: polled.value })
        }
        acceptedRuntimeModel = parsed.acceptedRuntimeModel
        interactionId = parsed.interactionId
        interactionIdDigest = parsed.interactionIdDigest
        providerResponseDigest = parsed.responseDigest
        providerUsageDigest = parsed.usageDigest
        if (parsed.state === 'failed') {
          status = 'failed'
          sanitizedFailureCode = parsed.sanitizedFailureCode
        } else if (parsed.state === 'in_progress') {
          status = 'unknown_reconciliation_required'
          sanitizedFailureCode = 'interaction_poll_ceiling_exhausted'
        } else {
          const bytes = parsed.state === 'completed_inline'
            ? parsed.bytes
            : await downloadGeneratedFile({
                fileId: parsed.fileId,
                apiKey: secret.apiKey,
                fetchImplementation,
                timeoutMs,
                counters,
                pollWait: input.pollWait,
              })
          output = await persistLiveOutput({
            localStorageRoot: input.localStorageRoot,
            authorization,
            requestPackage: input.requestPackage,
            attemptId,
            bytes,
          })
          status = 'completed'
        }
      } catch (error) {
        status = error instanceof TerminalTransportError
          ? 'failed'
          : 'unknown_reconciliation_required'
        sanitizedFailureCode = error instanceof TerminalTransportError
          ? error.code
          : 'network_or_unrecognized_outcome_after_dispatch'
      }
      const totalHttpRequests = Object.values(counters).reduce((sum, count) => sum + count, 0)
      const requestCounts = requestCountsSchema.parse({
        secretPayloadReads: 1,
        reconciliationSecretPayloadReads: 0,
        ...counters,
        redirects: 0,
        automaticRetries: 0,
        alternateProviderFallbacks: 0,
        totalHttpRequests,
      })
      const providerCostMicros = input.requestPackage.output.durationSeconds *
        authorization.providerRateAuthority.costMicrosPerGeneratedSecond *
        counters.generationSubmissions
      if (providerCostMicros > authorization.maximumAuthorizedProviderCostMicros) {
        throw new Error('Gemini B-roll canary cost exceeds its exact authority ceiling.')
      }
      const core = transportStateCoreSchema.parse({
        schemaVersion: BROLL_GEMINI_REST_TRANSPORT_VERSION,
        attemptId,
        authorizationHash: authorization.authorityHash,
        requestPackageHash: input.requestPackage.requestPackageHash,
        operationId: authorization.operationId,
        providerRouteId: authorization.providerRouteId,
        configuredModelAlias: authorization.configuredModelAlias,
        acceptedRuntimeModel,
        immutableProviderRevision: null,
        providerRevisionStatus: 'preview_alias_unpinned',
        officialContractSource: 'https://ai.google.dev/gemini-api/docs/omni',
        status,
        interactionId,
        interactionIdDigest,
        providerResponseDigest,
        providerUsageDigest,
        output,
        sanitizedFailureCode,
        requestCounts,
        providerCost: {
          currency: 'USD',
          requestedGeneratedSeconds: input.requestPackage.output.durationSeconds,
          rateAuthoritySnapshotId: authorization.providerRateAuthority.snapshotId,
          rateAuthoritySnapshotDigest: authorization.providerRateAuthority.snapshotDigest,
          costMicrosPerGeneratedSecond: authorization.providerRateAuthority.costMicrosPerGeneratedSecond,
          accountedProviderCostMicros: providerCostMicros,
          evidenceClass: 'approved_canary_ceiling_rate_times_requested_seconds',
          failedOrUnknownCostRetained: status !== 'completed',
          serviceFeeIncluded: false,
          productionRateQualified: false,
        },
        infrastructureCost: {
          accountedInfrastructureCostMicros: 0,
          evidenceClass: 'not_observed_transport_only',
          serviceFeeIncluded: false,
        },
        secretEvidence,
        rawProviderRequestPersisted: false,
        rawProviderResponsePersisted: false,
        providerUrlPersisted: false,
        temporaryDownloadUrlPersisted: false,
        apiKeyPersisted: false,
        productionEligible: false,
        completedAt: now(),
      })
      const state = brollGeminiRestTransportStateSchema.parse({
        ...core,
        stateHash: hashSkillValue(core),
      })
      await writePrivateTextFileAtomicWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: resultPath,
        content: `${JSON.stringify(state)}\n`,
      })
      return { disposition: 'executed', state }
    },
  })
}

export async function reconcileBrollGeminiUnknownTransport(input: {
  localStorageRoot: string
  authorization: BrollProviderWorkAuthorizationV5
  requestPackage: BrollProviderRequestPackageV5
  secretResolver: BrollGeminiSecretResolver
  fetchImplementation?: typeof fetch
  externalNetworkEnabled: true
  explicitReconciliationConfirmed: true
  generationResubmissionAllowed: false
  automaticRetryAllowed: false
  fallbackProviderAllowed: false
  now?: () => string
  pollWait?: () => Promise<void>
  requestTimeoutMs?: number
}): Promise<{
  disposition: 'reconciled' | 'already_terminal' | 'manual_account_reconciliation_required'
  state: BrollGeminiRestTransportState
}> {
  const authorization = assertBrollProviderWorkAuthorizationV5({
    value: input.authorization,
    requestPackage: input.requestPackage,
  })
  if (
    input.externalNetworkEnabled !== true ||
    input.explicitReconciliationConfirmed !== true ||
    input.generationResubmissionAllowed !== false ||
    input.automaticRetryAllowed !== false ||
    input.fallbackProviderAllowed !== false
  ) throw new Error('Gemini B-roll reconciliation gates are not exact.')
  assertLiveCanaryAuthority(authorization)
  const attemptId = hashSkillValue({
    domain: 'reeditpro:b-roll-gemini-live-attempt:v1',
    authorizationRequestHash: brollProviderAuthorizationRequestHashV5(authorization),
  })
  const resultPath = resultPathFor(attemptId)
  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: `b-roll/provider-v5/live-locks/${attemptId}.lock`,
    operation: async () => {
      const existing = await readExistingResult(input.localStorageRoot, resultPath)
      if (!existing) throw new Error('Gemini B-roll reconciliation state is missing.')
      assertReplay(existing, authorization, input.requestPackage)
      if (existing.status !== 'unknown_reconciliation_required') {
        return { disposition: 'already_terminal', state: existing }
      }
      if (!existing.interactionId) {
        return { disposition: 'manual_account_reconciliation_required', state: existing }
      }
      const secret = await input.secretResolver.resolveOnce()
      const reconciliationSecretEvidence = input.secretResolver.evidence()
      if (reconciliationSecretEvidence.payloadReadCount !== 1) {
        throw new Error('Gemini reconciliation secret read accounting is invalid.')
      }
      const fetchImplementation = input.fetchImplementation ?? globalThis.fetch
      const timeoutMs = input.requestTimeoutMs ?? 120_000
      const counters: MutableRequestCounts = {
        uploadNegotiationRequests: existing.requestCounts.uploadNegotiationRequests,
        uploadDataRequests: existing.requestCounts.uploadDataRequests,
        sourceUploadStatusReads: existing.requestCounts.sourceUploadStatusReads,
        generationSubmissions: existing.requestCounts.generationSubmissions,
        interactionStatusReads: existing.requestCounts.interactionStatusReads,
        reconciliationStatusReads: existing.requestCounts.reconciliationStatusReads,
        resultMetadataReads: existing.requestCounts.resultMetadataReads,
        resultFileStatusReads: existing.requestCounts.resultFileStatusReads,
        binaryDownloads: existing.requestCounts.binaryDownloads,
      }
      let status: BrollGeminiRestTransportState['status']
      let output = existing.output
      let sanitizedFailureCode: string | null
      let acceptedRuntimeModel = existing.acceptedRuntimeModel
      let interactionId = existing.interactionId
      let interactionIdDigest = existing.interactionIdDigest
      let providerResponseDigest = existing.providerResponseDigest
      let providerUsageDigest = existing.providerUsageDigest
      try {
        let parsed: BrollGeminiParsedInteraction | undefined
        for (let index = 0; index < 20; index += 1) {
          if (index > 0) await (input.pollWait?.() ?? wait(5_000))
          counters.reconciliationStatusReads += 1
          const read = await fetchJson({
            fetchImplementation,
            url: `${BROLL_GEMINI_INTERACTIONS_ENDPOINT}/${encodeURIComponent(existing.interactionId)}`,
            method: 'GET',
            apiKey: secret.apiKey,
            headers: {},
            maximumResponseBytes: 96 * 1024 * 1024,
            timeoutMs,
            unknownOnNetworkError: true,
          })
          parsed = parseBrollGeminiInteractionResponse({ httpStatus: read.status, value: read.value })
          if (parsed.state !== 'in_progress') break
        }
        if (!parsed || parsed.state === 'in_progress') {
          status = 'unknown_reconciliation_required'
          sanitizedFailureCode = 'reconciliation_poll_ceiling_exhausted'
        } else {
          acceptedRuntimeModel = parsed.acceptedRuntimeModel ?? acceptedRuntimeModel
          interactionId = parsed.interactionId ?? interactionId
          interactionIdDigest = parsed.interactionIdDigest ?? interactionIdDigest
          providerResponseDigest = parsed.responseDigest
          providerUsageDigest = parsed.usageDigest
          if (parsed.state === 'failed') {
            status = 'failed'
            sanitizedFailureCode = parsed.sanitizedFailureCode
          } else {
            const bytes = parsed.state === 'completed_inline'
              ? parsed.bytes
              : await downloadGeneratedFile({
                  fileId: parsed.fileId,
                  apiKey: secret.apiKey,
                  fetchImplementation,
                  timeoutMs,
                  counters,
                  pollWait: input.pollWait,
                })
            output = await persistLiveOutput({
              localStorageRoot: input.localStorageRoot,
              authorization,
              requestPackage: input.requestPackage,
              attemptId,
              bytes,
            })
            status = 'completed'
            sanitizedFailureCode = null
          }
        }
      } catch (error) {
        status = error instanceof TerminalTransportError
          ? 'failed'
          : 'unknown_reconciliation_required'
        sanitizedFailureCode = error instanceof TerminalTransportError
          ? error.code
          : 'reconciliation_network_or_response_unknown'
      }
      const totalHttpRequests = Object.values(counters).reduce((sum, count) => sum + count, 0)
      const requestCounts = requestCountsSchema.parse({
        secretPayloadReads: 1,
        reconciliationSecretPayloadReads: 1,
        ...counters,
        redirects: 0,
        automaticRetries: 0,
        alternateProviderFallbacks: 0,
        totalHttpRequests,
      })
      const priorCore = { ...existing } as Partial<BrollGeminiRestTransportState>
      delete priorCore.stateHash
      const core = transportStateCoreSchema.parse({
        ...priorCore,
        status,
        acceptedRuntimeModel,
        interactionId,
        interactionIdDigest,
        providerResponseDigest,
        providerUsageDigest,
        output,
        sanitizedFailureCode,
        requestCounts,
        providerCost: {
          ...existing.providerCost,
          failedOrUnknownCostRetained: status !== 'completed',
        },
        secretEvidence: {
          ...existing.secretEvidence,
          reconciliationPayloadReadCount: 1,
        },
        completedAt: (input.now ?? (() => new Date().toISOString()))(),
      })
      const state = brollGeminiRestTransportStateSchema.parse({
        ...core,
        stateHash: hashSkillValue(core),
      })
      await writePrivateTextFileAtomicWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: resultPath,
        content: `${JSON.stringify(state)}\n`,
      })
      return { disposition: 'reconciled', state }
    },
  })
}

interface MutableRequestCounts {
  uploadNegotiationRequests: 0 | 1
  uploadDataRequests: 0 | 1
  sourceUploadStatusReads: number
  generationSubmissions: 0 | 1
  interactionStatusReads: number
  reconciliationStatusReads: number
  resultMetadataReads: number
  resultFileStatusReads: number
  binaryDownloads: number
}

function emptyCounters(): MutableRequestCounts {
  return {
    uploadNegotiationRequests: 0,
    uploadDataRequests: 0,
    sourceUploadStatusReads: 0,
    generationSubmissions: 0,
    interactionStatusReads: 0,
    reconciliationStatusReads: 0,
    resultMetadataReads: 0,
    resultFileStatusReads: 0,
    binaryDownloads: 0,
  }
}

async function uploadApprovedVideo(input: {
  source: BrollGeminiEphemeralSourceMedia
  apiKey: string
  fetchImplementation: typeof fetch
  timeoutMs: number
  counters: MutableRequestCounts
  pollWait?: () => Promise<void>
}): Promise<string> {
  const bytes = Buffer.isBuffer(input.source.bytes) ? input.source.bytes : Buffer.from(input.source.bytes)
  input.counters.uploadNegotiationRequests = 1
  const started = await fetchRaw({
    fetchImplementation: input.fetchImplementation,
    url: BROLL_GEMINI_UPLOAD_ENDPOINT,
    method: 'POST',
    apiKey: input.apiKey,
    headers: {
      'content-type': 'application/json',
      'x-goog-upload-protocol': 'resumable',
      'x-goog-upload-command': 'start',
      'x-goog-upload-header-content-length': String(bytes.byteLength),
      'x-goog-upload-header-content-type': 'video/mp4',
    },
    body: Buffer.from(JSON.stringify({ file: { display_name: 'approved-b-roll-source' } }), 'utf8'),
    maximumResponseBytes: 1_048_576,
    timeoutMs: input.timeoutMs,
    unknownOnNetworkError: true,
  })
  if (started.status < 200 || started.status >= 300) throw new TerminalTransportError('file_upload_start_rejected')
  const uploadUrl = validateUploadUrl(started.headers.get('x-goog-upload-url'))
  input.counters.uploadDataRequests = 1
  const uploaded = await fetchJson({
    fetchImplementation: input.fetchImplementation,
    url: uploadUrl,
    method: 'POST',
    apiKey: input.apiKey,
    headers: {
      'content-type': 'video/mp4',
      'content-length': String(bytes.byteLength),
      'x-goog-upload-offset': '0',
      'x-goog-upload-command': 'upload, finalize',
    },
    body: bytes,
    maximumResponseBytes: 2 * 1024 * 1024,
    timeoutMs: input.timeoutMs,
    unknownOnNetworkError: true,
  })
  if (uploaded.status < 200 || uploaded.status >= 300) throw new TerminalTransportError('file_upload_rejected')
  let file = parseBrollGeminiFileStatus(uploaded.value)
  for (let index = 0; file.state === 'processing' && index < 20; index += 1) {
    await (input.pollWait?.() ?? wait(5_000))
    input.counters.sourceUploadStatusReads += 1
    const read = await fetchJson({
      fetchImplementation: input.fetchImplementation,
      url: `${BROLL_GEMINI_FILES_ENDPOINT}/${file.fileId}`,
      method: 'GET',
      apiKey: input.apiKey,
      headers: {},
      maximumResponseBytes: 2 * 1024 * 1024,
      timeoutMs: input.timeoutMs,
      unknownOnNetworkError: true,
    })
    if (read.status < 200 || read.status >= 300) throw new TerminalTransportError('file_status_rejected')
    file = parseBrollGeminiFileStatus(read.value)
  }
  if (file.state === 'failed') throw new TerminalTransportError('file_processing_failed')
  if (file.state !== 'active' || !file.fileUri) throw new UnknownTransportError()
  return file.fileUri
}

async function downloadGeneratedFile(input: {
  fileId: string
  apiKey: string
  fetchImplementation: typeof fetch
  timeoutMs: number
  counters: MutableRequestCounts
  pollWait?: () => Promise<void>
}): Promise<Buffer> {
  input.counters.resultMetadataReads += 1
  let read = await fetchJson({
    fetchImplementation: input.fetchImplementation,
    url: `${BROLL_GEMINI_FILES_ENDPOINT}/${input.fileId}`,
    method: 'GET',
    apiKey: input.apiKey,
    headers: {},
    maximumResponseBytes: 2 * 1024 * 1024,
    timeoutMs: input.timeoutMs,
    unknownOnNetworkError: true,
  })
  if (read.status < 200 || read.status >= 300) throw new TerminalTransportError('result_file_status_rejected')
  let file = parseBrollGeminiFileStatus(read.value)
  for (let index = 0; file.state === 'processing' && index < 19; index += 1) {
    await (input.pollWait?.() ?? wait(5_000))
    input.counters.resultFileStatusReads += 1
    read = await fetchJson({
      fetchImplementation: input.fetchImplementation,
      url: `${BROLL_GEMINI_FILES_ENDPOINT}/${input.fileId}`,
      method: 'GET',
      apiKey: input.apiKey,
      headers: {},
      maximumResponseBytes: 2 * 1024 * 1024,
      timeoutMs: input.timeoutMs,
      unknownOnNetworkError: true,
    })
    file = parseBrollGeminiFileStatus(read.value)
  }
  if (file.state === 'failed') throw new TerminalTransportError('result_file_processing_failed')
  if (file.state !== 'active') throw new UnknownTransportError()
  input.counters.binaryDownloads += 1
  const downloaded = await fetchRaw({
    fetchImplementation: input.fetchImplementation,
    url: `${BROLL_GEMINI_FILES_ENDPOINT}/${input.fileId}:download?alt=media`,
    method: 'GET',
    apiKey: input.apiKey,
    headers: {},
    maximumResponseBytes: 67_108_864,
    timeoutMs: input.timeoutMs,
    unknownOnNetworkError: true,
  })
  if (downloaded.status < 200 || downloaded.status >= 300) {
    throw new TerminalTransportError('result_download_rejected')
  }
  const contentType = downloaded.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (contentType !== 'video/mp4' && contentType !== 'application/octet-stream') {
    throw new TerminalTransportError('result_download_content_type_rejected')
  }
  assertMp4(downloaded.bytes)
  return downloaded.bytes
}

async function persistLiveOutput(input: {
  localStorageRoot: string
  authorization: BrollProviderWorkAuthorizationV5
  requestPackage: BrollProviderRequestPackageV5
  attemptId: string
  bytes: Buffer
}): Promise<z.infer<typeof privateOutputSchema>> {
  assertMp4(input.bytes)
  const sha256 = sha256Bytes(input.bytes)
  const privateObjectIdentityHash = hashSkillValue({
    domain: 'reeditpro:b-roll-gemini-live-output:v1',
    attemptId: input.attemptId,
    expectedOutputId: input.authorization.expectedOutputId,
    requestPackageHash: input.requestPackage.requestPackageHash,
    sha256,
  })
  const privateObjectRelativePath =
    `b-roll/provider-v5/live-objects/${privateObjectIdentityHash}.mp4`
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: privateObjectRelativePath,
    content: input.bytes,
  })
  const readback = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: privateObjectRelativePath,
  })
  if (!readback || !readback.equals(input.bytes) || sha256Bytes(readback) !== sha256) {
    throw new Error('Gemini live output checksum readback failed.')
  }
  return privateOutputSchema.parse({
    outputId: input.authorization.expectedOutputId,
    artifactType: 'provider_b_roll_candidate_video_mp4',
    contentType: 'video/mp4',
    privateObjectRelativePath,
    privateObjectIdentityHash,
    sha256,
    byteLength: input.bytes.byteLength,
    providerGenerated: true,
    createOnly: true,
    checksumReadbackVerified: true,
    publicArtifactCreated: false,
    automaticSelectionAllowed: false,
    timelineMutationAllowed: false,
  })
}

async function fetchJson(input: FetchInput): Promise<{ status: number; value: unknown; headers: Headers }> {
  const raw = await fetchRaw(input)
  let value: unknown
  try {
    value = JSON.parse(raw.bytes.toString('utf8'))
  } catch {
    throw new UnknownTransportError()
  }
  return { status: raw.status, value, headers: raw.headers }
}

interface FetchInput {
  fetchImplementation: typeof fetch
  url: string
  method: 'GET' | 'POST'
  apiKey: string
  headers: Record<string, string>
  body?: Buffer
  maximumResponseBytes: number
  timeoutMs: number
  unknownOnNetworkError: boolean
}

async function fetchRaw(input: FetchInput): Promise<{ status: number; bytes: Buffer; headers: Headers }> {
  assertFixedGoogleUrl(input.url)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs)
  try {
    let response: Response
    try {
      response = await input.fetchImplementation(input.url, {
        method: input.method,
        headers: { ...input.headers, 'x-goog-api-key': input.apiKey },
        ...(input.body ? { body: input.body as unknown as BodyInit } : {}),
        redirect: 'manual',
        signal: controller.signal,
      })
    } catch {
      if (input.unknownOnNetworkError) throw new UnknownTransportError()
      throw new TerminalTransportError('network_request_failed_before_dispatch')
    }
    if (response.status >= 300 && response.status < 400) {
      throw new TerminalTransportError('provider_redirect_rejected')
    }
    const declared = response.headers.get('content-length')
    if (declared && Number(declared) > input.maximumResponseBytes) {
      throw new TerminalTransportError('provider_response_too_large')
    }
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.byteLength > input.maximumResponseBytes) {
      throw new TerminalTransportError('provider_response_too_large')
    }
    return { status: response.status, bytes, headers: response.headers }
  } finally {
    clearTimeout(timeout)
  }
}

function assertFixedGoogleUrl(value: string): void {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.hostname !== 'generativelanguage.googleapis.com' ||
    url.username || url.password || !(
      url.pathname === '/v1beta/interactions' ||
      /^\/v1beta\/interactions\/[A-Za-z0-9._:-]{1,240}$/u.test(url.pathname) ||
      url.pathname === '/upload/v1beta/files' ||
      /^\/upload\/v1beta\/files$/u.test(url.pathname) ||
      /^\/v1beta\/files\/[a-z0-9][a-z0-9-]{0,39}(?::download)?$/u.test(url.pathname)
    )) throw new Error('Gemini transport URL is not allowlisted.')
  if ([...url.searchParams.keys()].some((key) => !['alt', 'upload_id', 'upload_protocol'].includes(key))) {
    throw new Error('Gemini transport URL query is not allowlisted.')
  }
}

function validateUploadUrl(value: string | null): string {
  if (!value) throw new TerminalTransportError('file_upload_url_missing')
  assertFixedGoogleUrl(value)
  const url = new URL(value)
  if (url.pathname !== '/upload/v1beta/files' || !url.searchParams.has('upload_id')) {
    throw new TerminalTransportError('file_upload_url_rejected')
  }
  return url.toString()
}

function assertLiveCanaryAuthority(authorization: BrollProviderWorkAuthorizationV5): void {
  const policy = createBrollProviderLifecyclePolicyV5()
  if (
    authorization.authorityClass !== 'private_owner_confirmed_canary' ||
    !authorization.liveProviderCallAuthorized || authorization.injectedOutputOnly ||
    authorization.productionReady ||
    authorization.providerRateAuthority.evidenceClass !== 'owner_confirmed_canary_ceiling_unqualified' ||
    authorization.maximumSubmissionsThisAttempt !== policy.maximumGenerationSubmissionsPerAttempt ||
    authorization.maximumRetries !== 0 || authorization.maximumFallbacks !== 0 ||
    authorization.alternateProviderFallbackAllowed
  ) throw new Error('Gemini REST transport requires exact owner-confirmed private canary authority.')
}

function assertLiveExecutionGates(input: {
  externalNetworkEnabled: true
  explicitExecutionConfirmed: true
  approvedSafeFixture: true
  privateOutputDestinationConfirmed: true
  publicArtifactAllowed: false
  timelineMutationAllowed: false
  automaticRetryAllowed: false
  fallbackProviderAllowed: false
}): void {
  if (
    input.externalNetworkEnabled !== true || input.explicitExecutionConfirmed !== true ||
    input.approvedSafeFixture !== true || input.privateOutputDestinationConfirmed !== true ||
    input.publicArtifactAllowed !== false || input.timelineMutationAllowed !== false ||
    input.automaticRetryAllowed !== false || input.fallbackProviderAllowed !== false
  ) throw new Error('Gemini B-roll private canary execution gates are not exact.')
}

function assertReplay(
  state: BrollGeminiRestTransportState,
  authorization: BrollProviderWorkAuthorizationV5,
  request: BrollProviderRequestPackageV5,
): void {
  if (state.authorizationHash !== authorization.authorityHash ||
    state.requestPackageHash !== request.requestPackageHash) {
    throw new Error('Gemini B-roll transport replay authority was substituted.')
  }
}

async function readExistingResult(
  localStorageRoot: string,
  relativePath: string,
): Promise<BrollGeminiRestTransportState | undefined> {
  const text = await readPrivateTextFileIfExistsWithinRoot({ rootPath: localStorageRoot, relativePath })
  return text ? brollGeminiRestTransportStateSchema.parse(JSON.parse(text)) : undefined
}

async function assertOutputReadback(
  localStorageRoot: string,
  output: z.infer<typeof privateOutputSchema>,
): Promise<void> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: output.privateObjectRelativePath,
  })
  if (!bytes || bytes.byteLength !== output.byteLength || sha256Bytes(bytes) !== output.sha256) {
    throw new Error('Gemini B-roll live output replay readback failed.')
  }
}

function resultPathFor(attemptId: string): string {
  return `b-roll/provider-v5/live-results/${attemptId.slice(0, 2)}/${attemptId}.json`
}

function assertMp4(bytes: Buffer): void {
  if (bytes.byteLength < 16 || bytes.byteLength > 67_108_864 ||
    bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
    throw new TerminalTransportError('provider_output_not_bounded_mp4')
  }
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

class TerminalTransportError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.code = code
  }
}

class UnknownTransportError extends Error {
  constructor() {
    super('unknown_provider_outcome')
  }
}
