import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'

import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation,
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal,
  canonicalTrackAllSam31L4TaskQaCloudBuildListEndpoint,
  canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationRef,
  canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef,
  createCanonicalTrackAllSam31L4TaskQaCloudImageBuildObserver,
  type CanonicalTrackAllSam31L4TaskQaBuildObservationReadPort,
  type CanonicalTrackAllSam31L4TaskQaCloudBuildReadTransport,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-runtime'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_OBSERVATION_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation-repository-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_GOOGLE_CLOUD_BUILD_READ_TRANSPORT_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-google-cloud-build-read-transport-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PREFIX =
  'private/track-all/sam3_1/v1/l4-task-qa/cloud-image-build-observations'
const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
const BUILD_ENDPOINT_PATTERN =
  /^https:\/\/cloudbuild\.googleapis\.com\/v1\/projects\/reeditpro\/locations\/us-central1\/builds\/[a-f0-9-]{36}$/u
type EvidenceRef = ReturnType<
  typeof canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationRef
>
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export interface CanonicalTrackAllSam31L4TaskQaCloudImageBuildObservationRepository {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_OBSERVATION_REPOSITORY_VERSION
  persistReconciliationCreateOnly(input: {
    readonly reconciliation:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation
  }): Promise<EvidenceRef>
  rereadReconciliation(input: {
    readonly reconciliationRef: EvidenceRef
  }): Promise<CanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation | null>
  persistTerminalCreateOnly(input: {
    readonly terminal: CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal
  }): Promise<ReturnType<
    typeof canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef
  >>
  rereadTerminal(input: {
    readonly terminalRef: ReturnType<
      typeof canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef
    >
  }): Promise<CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal | null>
}

export function createCanonicalTrackAllSam31L4TaskQaCloudImageBuildObservationRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort },
): CanonicalTrackAllSam31L4TaskQaCloudImageBuildObservationRepository {
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_OBSERVATION_REPOSITORY_VERSION,
    async persistReconciliationCreateOnly({ reconciliation }: {
      readonly reconciliation:
        CanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation
    }) {
      const record =
        assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation(
          reconciliation,
        )
      const ref =
        canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationRef(record)
      await persistExact(
        input.objectPort,
        `${PREFIX}/reconciliations/${ref.contentHash.slice(7)}.json`,
        record,
      )
      return ref
    },
    async rereadReconciliation({ reconciliationRef }: {
      readonly reconciliationRef: EvidenceRef
    }) {
      const record = await readRecord(
        input.objectPort,
        `${PREFIX}/reconciliations/${reconciliationRef.contentHash.slice(7)}.json`,
        assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliation,
      )
      if (record && !sameRef(
        reconciliationRef,
        canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationRef(record),
      )) throw new Error('track_all_l4_build_reconciliation_ref_mismatch')
      return record
    },
    async persistTerminalCreateOnly({ terminal }: {
      readonly terminal: CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal
    }) {
      const record =
        assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal(terminal)
      const ref = canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef(
        record,
      )
      await persistExact(
        input.objectPort,
        `${PREFIX}/terminals/${ref.contentHash.slice(7)}.json`,
        record,
      )
      return ref
    },
    async rereadTerminal({ terminalRef }: {
      readonly terminalRef: ReturnType<
        typeof canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef
      >
    }) {
      const record = await readRecord(
        input.objectPort,
        `${PREFIX}/terminals/${terminalRef.contentHash.slice(7)}.json`,
        assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal,
      )
      if (record && !sameRef(
        terminalRef,
        canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef(record),
      )) throw new Error('track_all_l4_build_terminal_ref_mismatch')
      return record
    },
  })
}

export function createCanonicalTrackAllSam31L4TaskQaGoogleCloudBuildReadTransport(
  input: {
    readonly auth?: GoogleAuthRequest
    readonly timeoutMilliseconds?: number
  } = {},
): CanonicalTrackAllSam31L4TaskQaCloudBuildReadTransport & {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_GOOGLE_CLOUD_BUILD_READ_TRANSPORT_VERSION
} {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const timeout = input.timeoutMilliseconds ?? 30_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw new Error('track_all_l4_build_read_timeout_invalid')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_GOOGLE_CLOUD_BUILD_READ_TRANSPORT_VERSION,
    async request(request: {
      readonly method: 'GET'
      readonly url: string
    }) {
      if (request.method !== 'GET'
        || (request.url !== canonicalTrackAllSam31L4TaskQaCloudBuildListEndpoint
          && !BUILD_ENDPOINT_PATTERN.test(request.url))) {
        throw new Error('track_all_l4_build_read_url_not_allowlisted')
      }
      const response = await auth.request<unknown>({
        url: request.url,
        method: request.method,
        timeout,
        retry: false,
        maxRedirects: 0,
        responseType: 'json',
        validateStatus: () => true,
      })
      return { status: response.status, json: structuredClone(response.data) }
    },
  })
}

export function createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildObservationRuntime(
  input: {
    readonly storage?: Storage
    readonly auth?: GoogleAuthRequest
    readonly transport?: CanonicalTrackAllSam31L4TaskQaCloudBuildReadTransport
    readonly now?: () => string
  } = {},
) {
  const storage = input.storage ?? new Storage({
    projectId: PROJECT_ID,
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  const buildRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime({ storage })
  const observationRepository =
    createCanonicalTrackAllSam31L4TaskQaCloudImageBuildObservationRepository({
      objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
        storage,
        bucketName: CONTROL_PLANE_BUCKET,
      }),
    })
  const readPort: CanonicalTrackAllSam31L4TaskQaBuildObservationReadPort = {
    rereadBuildAuthority:
      buildRuntime.repository.rereadBuildAuthority.bind(
        buildRuntime.repository,
      ),
    rereadSubmission: buildRuntime.repository.rereadSubmission.bind(
      buildRuntime.repository,
    ),
    rereadReconciliation:
      observationRepository.rereadReconciliation.bind(observationRepository),
  }
  const observer =
    createCanonicalTrackAllSam31L4TaskQaCloudImageBuildObserver({
      readPort,
      transport: input.transport
        ?? createCanonicalTrackAllSam31L4TaskQaGoogleCloudBuildReadTransport({
          auth: input.auth,
        }),
      now: input.now,
    })
  return Object.freeze({
    async reconcileUnknownSubmission(value: Parameters<
      typeof observer.reconcileUnknownSubmission
    >[0]) {
      const reconciliation = await observer.reconcileUnknownSubmission(value)
      const reconciliationRef =
        await observationRepository.persistReconciliationCreateOnly({
          reconciliation,
        })
      return Object.freeze({ reconciliation, reconciliationRef })
    },
    async observeTerminal(value: Parameters<typeof observer.observeTerminal>[0]) {
      const terminal = await observer.observeTerminal(value)
      const terminalRef =
        await observationRepository.persistTerminalCreateOnly({ terminal })
      return Object.freeze({ terminal, terminalRef })
    },
    repository: observationRepository,
    buildRepository: buildRuntime.repository,
    projectId: PROJECT_ID,
    controlPlaneStateBucketName: CONTROL_PLANE_BUCKET,
    automaticRetryAllowed: false as const,
    gpuJobDispatched: false as const,
    customerCreditsMutated: false as const,
    runtimeReleaseGranted: false as const,
  })
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: unknown,
): Promise<void> {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  await port.createOnly({
    objectPath: path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw new Error('track_all_l4_build_observation_reread_failed')
  }
}

async function readRecord<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength > 16 * 1024 * 1024) {
    throw new Error('track_all_l4_build_observation_too_large')
  }
  return parse(JSON.parse(body.toString('utf8')))
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}
