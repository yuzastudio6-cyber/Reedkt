import {
  applyReeditProApiAuthorizationHeaders,
  getFrontendApiClientStatus,
} from '../backend/api/frontend-api-client'
import { getBackendApiBaseUrl } from '../backend/api/backend-runtime-config'
import type { CanonicalEditJourney } from './canonical-edit-journey'
import {
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/
const MAX_ACCEPTED_FINAL_BYTES = 512 * 1024 * 1024
const ACCEPTED_FINAL_TIMEOUT_MS = 120_000

export type CanonicalPrivateFinalDownload = {
  blob: Blob
  fileName: string
  mimeType: 'video/mp4'
  byteSize: number
  sha256: string
}

export type CanonicalPrivateFinalDownloadClientResult =
  | {
      status: 'ready'
      message: string
      retryable: false
      download: CanonicalPrivateFinalDownload
      warnings: string[]
    }
  | {
      status:
        | 'blocked'
        | 'not_configured'
        | 'access_denied'
        | 'invalid_response'
        | 'unavailable'
      message: string
      retryable: boolean
      warnings: string[]
    }

export type DownloadCanonicalPrivateFinalInput = {
  scope: ProjectPersistenceScope
  projectId: string
  editSessionId: string
  journey: CanonicalEditJourney
}

type FinalDownloadAuthority = NonNullable<
  CanonicalEditJourney['privateFinalDownloadAuthority']
>

const inFlightRequests = new Map<
  string,
  Promise<CanonicalPrivateFinalDownloadClientResult>
>()

export function downloadCanonicalPrivateFinal(
  input: DownloadCanonicalPrivateFinalInput,
): Promise<CanonicalPrivateFinalDownloadClientResult> {
  const authority = finalAuthority(input)
  if (!authority.ok) return Promise.resolve(authority.result)
  const requestKey = [
    input.scope.authMode,
    input.scope.userId,
    input.scope.backendUserId ?? '',
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
    authority.reviewAssemblyId,
    authority.packageRecordId,
    authority.expectedDecisionManifestSha256,
    authority.expectedFinalArtifactSha256,
  ].join('\u001f')
  const existing = inFlightRequests.get(requestKey)
  if (existing) return existing

  const request = performDownload(input, authority)
  inFlightRequests.set(requestKey, request)
  void request.then(
    () => clearInFlight(requestKey, request),
    () => clearInFlight(requestKey, request),
  )
  return request
}

async function performDownload(
  input: DownloadCanonicalPrivateFinalInput,
  authority: FinalDownloadAuthority,
): Promise<CanonicalPrivateFinalDownloadClientResult> {
  const runtime = getFrontendApiClientStatus()
  const apiBaseUrl = getBackendApiBaseUrl()
  if (runtime.mockOnly || !apiBaseUrl) {
    return failure(
      'not_configured',
      'Verified final download is available when the reviewed private backend is connected.',
      false,
      runtime.warnings,
    )
  }

  const abortController = new AbortController()
  const timeout = globalThis.setTimeout(
    () => abortController.abort(),
    ACCEPTED_FINAL_TIMEOUT_MS,
  )
  try {
    const url = buildDownloadUrl(apiBaseUrl, input, authority)
    const headers = new Headers({
      accept: 'video/mp4',
      'x-request-id':
        `canonical-private-final-${newAttemptToken()}`,
    })
    await applyReeditProApiAuthorizationHeaders(headers)
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      headers,
      signal: abortController.signal,
    })
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        invalidateProjectPersistenceScope(input.scope)
        return failure(
          'access_denied',
          'The accepted final is not available to this signed-in workspace.',
          false,
          [],
        )
      }
      if (response.status === 404 || response.status === 409) {
        return failure(
          'blocked',
          'The accepted review or final artifact changed. Refresh the saved workflow before downloading.',
          false,
          [],
        )
      }
      return failure(
        'unavailable',
        'The accepted final could not be downloaded. It is safe to try again.',
        true,
        [],
      )
    }

    if (
      !hasNoStore(response) ||
      !/^video\/mp4\b/i.test(response.headers.get('content-type') ?? '') ||
      response.headers.get('x-reeditpro-artifact-sha256') !==
        authority.expectedFinalArtifactSha256 ||
      response.headers.get('x-reeditpro-review-assembly-id') !==
        authority.reviewAssemblyId ||
      response.headers.get(
        'x-reeditpro-review-decision-manifest-sha256',
      ) !== authority.expectedDecisionManifestSha256
    ) {
      return failure(
        'invalid_response',
        'The final response did not match the exact accepted review and privacy authority.',
        false,
        [],
      )
    }

    const contentLength = response.headers.get('content-length')
    const declaredLength = Number(contentLength)
    if (
      !contentLength ||
      !Number.isSafeInteger(declaredLength) ||
      declaredLength < 12 ||
      declaredLength > MAX_ACCEPTED_FINAL_BYTES
    ) {
      return failure(
        'invalid_response',
        'The final response declared an invalid media size.',
        false,
        [],
      )
    }

    const blob = await response.blob()
    const sha256 = await sha256Blob(blob)
    if (
      blob.size !== declaredLength ||
      blob.size > MAX_ACCEPTED_FINAL_BYTES ||
      sha256 !== authority.expectedFinalArtifactSha256 ||
      !(await hasMp4FileTypeBox(blob))
    ) {
      return failure(
        'invalid_response',
        'The accepted final bytes failed exact MP4 integrity verification.',
        false,
        [],
      )
    }

    return {
      status: 'ready',
      message:
        'The accepted QA-backed MP4 was verified and downloaded without creating a public link.',
      retryable: false,
      download: {
        blob,
        fileName: parseFileName(
          response.headers.get('content-disposition'),
        ),
        mimeType: 'video/mp4',
        byteSize: blob.size,
        sha256,
      },
      warnings: [
        'This is an authenticated private no-store download of the exact accepted review artifact.',
      ],
    }
  } catch {
    return failure(
      'unavailable',
      'The accepted final could not be downloaded. It is safe to try again.',
      true,
      [],
    )
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

function finalAuthority(
  input: DownloadCanonicalPrivateFinalInput,
):
  | ({ ok: true } & FinalDownloadAuthority)
  | { ok: false; result: CanonicalPrivateFinalDownloadClientResult } {
  const authority = input.journey.privateFinalDownloadAuthority
  const expectedRoute = authority
    ? `/v1/edit-executions/private-review-assemblies/${
        authority.reviewAssemblyId
      }/accepted-final-artifact`
    : ''
  if (
    input.journey.identity.workspaceId !== input.scope.workspaceId ||
    input.journey.identity.projectId !== input.projectId ||
    input.journey.identity.editSessionId !== input.editSessionId ||
    input.journey.stage !== 'private_review_accepted' ||
    input.journey.review?.decision !== 'accept_private_internal_review' ||
    input.journey.review.decisionStatus !==
      'private_internal_review_accepted' ||
    !authority ||
    !isSafeId(authority.reviewAssemblyId) ||
    !isSafeId(authority.packageRecordId) ||
    !isSha(authority.expectedDecisionManifestSha256) ||
    !isSha(authority.expectedFinalArtifactSha256) ||
    authority.routeTemplate !== expectedRoute
  ) {
    return {
      ok: false,
      result: failure(
        'blocked',
        'The accepted final-download authority is not current. Refresh the saved workflow before downloading.',
        false,
        [],
      ),
    }
  }
  return { ok: true, ...authority }
}

function buildDownloadUrl(
  apiBaseUrl: string,
  input: DownloadCanonicalPrivateFinalInput,
  authority: FinalDownloadAuthority,
): string {
  const base = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`
  const url = new URL(authority.routeTemplate, base)
  url.searchParams.set('workspaceId', input.scope.workspaceId)
  url.searchParams.set('packageRecordId', authority.packageRecordId)
  url.searchParams.set(
    'expectedDecisionManifestSha256',
    authority.expectedDecisionManifestSha256,
  )
  url.searchParams.set(
    'expectedFinalArtifactSha256',
    authority.expectedFinalArtifactSha256,
  )
  url.searchParams.set(
    'purpose',
    'download_accepted_canonical_private_final_artifact',
  )
  return url.toString()
}

function failure(
  status: Exclude<CanonicalPrivateFinalDownloadClientResult['status'], 'ready'>,
  message: string,
  retryable: boolean,
  warnings: string[],
): CanonicalPrivateFinalDownloadClientResult {
  return { status, message, retryable, warnings }
}

function clearInFlight(
  key: string,
  request: Promise<CanonicalPrivateFinalDownloadClientResult>,
): void {
  if (inFlightRequests.get(key) === request) inFlightRequests.delete(key)
}

function isSafeId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 200 &&
    SAFE_ID.test(value) &&
    value === value.trim() &&
    !value.includes('..')
  )
}

function isSha(value: unknown): value is string {
  return typeof value === 'string' && SHA256.test(value)
}

function hasNoStore(response: Response): boolean {
  return /(?:^|,)\s*(?:private\s*,\s*)?no-store(?:\s*(?:,|$))/i.test(
    response.headers.get('cache-control') ?? '',
  )
}

function parseFileName(disposition: string | null): string {
  const match = disposition?.match(/filename="?([^";]+)"?/i)
  const value = match?.[1]?.trim()
  if (
    !value ||
    value.includes('/') ||
    value.includes('\\') ||
    !value.toLowerCase().endsWith('.mp4')
  ) {
    return 'weeditpro-private-final.mp4'
  }
  return value.slice(0, 255)
}

async function hasMp4FileTypeBox(blob: Blob): Promise<boolean> {
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer())
  return (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  )
}

async function sha256Blob(blob: Blob): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    await blob.arrayBuffer(),
  )
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')
}

function newAttemptToken(): string {
  const bytes = new Uint8Array(8)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(
    bytes,
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')
}
