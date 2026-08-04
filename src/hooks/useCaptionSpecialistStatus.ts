import { useEffect, useMemo, useState } from 'react'

import {
  buildCaptionRenderedVisualReviewAuthenticatedReadRequest,
} from '../lib/caption-direction/caption-rendered-visual-review-authenticated-read'
import {
  readCaptionRenderedVisualReviewAuthenticated,
} from '../lib/caption-direction/caption-rendered-visual-review-authenticated-read-client'
import {
  createCaptionSpecialistAuthenticatedPresentation,
  parseCaptionSpecialistApprovedSnapshotExtension,
} from '../lib/caption-direction/caption-specialist-integration'
import type {
  CaptionSpecialistApprovedSnapshotExtension,
  CaptionSpecialistChatPresentation,
} from '../types/caption-specialist-integration'
import type { ProjectPersistenceScope } from
  '../lib/project-persistence-scope'

export type CaptionSpecialistStatusHookResult = {
  loading: boolean
  presentation: CaptionSpecialistChatPresentation | null
  retryable: boolean
  message: string | null
}

/** Reload-safe Caption status. No provider or repair work is created here. */
export function useCaptionSpecialistStatus(input: {
  enabled: boolean
  scope: ProjectPersistenceScope
  snapshotExtension:
    CaptionSpecialistApprovedSnapshotExtension | null | undefined
}): CaptionSpecialistStatusHookResult {
  const extension = useMemo(() => {
    if (!input.snapshotExtension) return null
    try {
      return parseCaptionSpecialistApprovedSnapshotExtension(
        input.snapshotExtension)
    } catch {
      return null
    }
  }, [input.snapshotExtension])
  const identity = extension?.extensionDigestSha256 ?? 'caption-status-none'
  const [state, setState] = useState<
    CaptionSpecialistStatusHookResult & { identity: string }
  >({
    identity: 'caption-status-initial',
    loading: false,
    presentation: null,
    retryable: false,
    message: null,
  })

  useEffect(() => {
    if (!input.enabled || !extension
      || extension.selectionDisposition !== 'selected') {
      return
    }
    let active = true
    const request = buildCaptionRenderedVisualReviewAuthenticatedReadRequest({
      scope: {
        workspaceId: extension.workspaceId,
        projectId: extension.projectId,
        editSessionId: extension.editSessionId,
        approvedSnapshotId: extension.approvedSnapshotId,
      },
      confirmedOutputFrameRefs: extension.outputScopes.map((output) =>
        output.confirmedOutputFrameRef),
    })
    void readCaptionRenderedVisualReviewAuthenticated({
      scope: input.scope,
      request,
    }).then((result) => {
      if (!active) return
      if (!result.ok) {
        setState({
          identity,
          loading: false,
          presentation: null,
          retryable: result.retryable,
          message: result.message,
        })
        return
      }
      try {
        setState({
          identity,
          loading: false,
          presentation: createCaptionSpecialistAuthenticatedPresentation({
            snapshotExtension: extension,
            authenticatedRead: result.authenticatedRead,
          }),
          retryable: false,
          message: null,
        })
      } catch {
        setState({
          identity,
          loading: false,
          presentation: null,
          retryable: false,
          message: 'Caption visual-review evidence did not match this exact edit.',
        })
      }
    }).catch(() => {
      if (!active) return
      setState({
        identity,
        loading: false,
        presentation: null,
        retryable: true,
        message: 'Caption visual review could not be refreshed. It is safe to retry.',
      })
    })
    return () => {
      active = false
    }
  }, [extension, identity, input.enabled, input.scope])

  if (!input.enabled || !extension
    || extension.selectionDisposition !== 'selected') {
    return {
      loading: false,
      presentation: null,
      retryable: false,
      message: null,
    }
  }
  if (state.identity !== identity) {
    return {
      loading: true,
      presentation: null,
      retryable: false,
      message: null,
    }
  }
  return state
}
