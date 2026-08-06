import { useCallback, useEffect, useRef, useState } from 'react'
import type { CanonicalEditJourney } from '../lib/canonical-edit-journey'
import {
  downloadCanonicalPrivateFinal,
  type CanonicalPrivateFinalDownloadClientResult,
} from '../lib/canonical-private-final-download-client'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'

export type CanonicalPrivateFinalDownloadHookResult = {
  downloading: boolean
  requestedReviewAssemblyId: string | null
  result: CanonicalPrivateFinalDownloadClientResult | null
  download: (
    journey: CanonicalEditJourney,
  ) => Promise<CanonicalPrivateFinalDownloadClientResult>
  reset: () => void
}

export function useCanonicalPrivateFinalDownload({
  editSessionId,
  enabled,
  projectId,
  scope,
}: {
  editSessionId: string
  enabled: boolean
  projectId: string
  scope: ProjectPersistenceScope
}): CanonicalPrivateFinalDownloadHookResult {
  const identityKey = JSON.stringify([
    scope.authMode,
    scope.userId,
    scope.backendUserId ?? '',
    scope.workspaceId,
    projectId,
    editSessionId,
  ])
  const identityRef = useRef(identityKey)
  const requestVersionRef = useRef(0)
  const [state, setState] = useState<{
    identityKey: string
    downloading: boolean
    requestedReviewAssemblyId: string | null
    result: CanonicalPrivateFinalDownloadClientResult | null
  }>({
    identityKey,
    downloading: false,
    requestedReviewAssemblyId: null,
    result: null,
  })

  useEffect(() => {
    identityRef.current = identityKey
    requestVersionRef.current += 1
  }, [identityKey])

  const download = useCallback(async (journey: CanonicalEditJourney) => {
    const requestIdentity = identityRef.current
    const requestVersion = ++requestVersionRef.current
    const requestedReviewAssemblyId =
      journey.privateFinalDownloadAuthority?.reviewAssemblyId ?? null
    setState({
      identityKey: requestIdentity,
      downloading: true,
      requestedReviewAssemblyId,
      result: null,
    })

    let result: CanonicalPrivateFinalDownloadClientResult
    if (!enabled) {
      result = {
        status: 'not_configured',
        message:
          'Verified final download is available for a signed-in named edit.',
        retryable: false,
        warnings: [],
      }
    } else {
      try {
        result = await downloadCanonicalPrivateFinal({
          scope,
          projectId,
          editSessionId,
          journey,
        })
      } catch {
        result = {
          status: 'unavailable',
          message:
            'The accepted final could not be downloaded. It is safe to try again.',
          retryable: true,
          warnings: [],
        }
      }
    }

    if (
      identityRef.current === requestIdentity &&
      requestVersionRef.current === requestVersion
    ) {
      setState({
        identityKey: requestIdentity,
        downloading: false,
        requestedReviewAssemblyId,
        result,
      })
      if (result.status === 'ready') {
        saveBrowserDownload(
          result.download.blob,
          result.download.fileName,
        )
      }
    }
    return result
  }, [editSessionId, enabled, projectId, scope])

  const reset = useCallback(() => {
    requestVersionRef.current += 1
    setState({
      identityKey,
      downloading: false,
      requestedReviewAssemblyId: null,
      result: null,
    })
  }, [identityKey])

  const current = state.identityKey === identityKey
  return {
    downloading: current ? state.downloading : false,
    requestedReviewAssemblyId:
      current ? state.requestedReviewAssemblyId : null,
    result: current ? state.result : null,
    download,
    reset,
  }
}

function saveBrowserDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  anchor.rel = 'noreferrer'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  globalThis.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
}
