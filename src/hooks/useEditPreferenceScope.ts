import { useEffect, useMemo, useState } from 'react'
import { useAuthSession } from '../auth/useAuthSession'
import { getCurrentWorkspace } from '../backend/auth/workspace-bootstrap-service'
import {
  resolveEditPreferenceScope,
  type EditPreferenceScopeResolution,
} from '../lib/edit-preference-repository'

export function useEditPreferenceScope(): EditPreferenceScopeResolution {
  const auth = useAuthSession()
  const [supabaseWorkspace, setSupabaseWorkspace] = useState<{
    userId: string
    workspaceId?: string
  }>()

  useEffect(() => {
    let active = true
    const userId = auth.identity?.id

    if (auth.mode !== 'supabase' || auth.status !== 'signed_in' || !userId) {
      return () => {
        active = false
      }
    }

    void getCurrentWorkspace()
      .then((result) => {
        if (!active) return
        setSupabaseWorkspace({
          userId,
          workspaceId: result.ok ? result.workspaceId : undefined,
        })
      })
      .catch(() => {
        if (active) setSupabaseWorkspace({ userId })
      })

    return () => {
      active = false
    }
  }, [auth.identity?.id, auth.mode, auth.status])

  const workspaceId = auth.mode === 'supabase'
    && supabaseWorkspace?.userId === auth.identity?.id
    ? supabaseWorkspace?.workspaceId
    : undefined

  return useMemo(() => resolveEditPreferenceScope({
    authMode: auth.mode,
    identity: auth.identity,
    status: auth.status,
    workspaceId,
  }), [auth.identity, auth.mode, auth.status, workspaceId])
}
