import { useEffect, useState } from 'react'
import { Badge } from './Badge'
import { getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import { getLocalMvpStatusSummary, loadLocalMvpSession, LOCAL_MVP_SESSION_EVENT } from '../lib/local-mvp-state'

export function LocalMvpRuntimeStatus() {
  const [projectCount, setProjectCount] = useState(() => loadLocalMvpSession().projects.length)
  const localStatus = getLocalMvpStatusSummary()
  const apiStatus = getFrontendApiClientStatus()

  useEffect(() => {
    function refresh() {
      setProjectCount(loadLocalMvpSession().projects.length)
    }

    window.addEventListener(LOCAL_MVP_SESSION_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(LOCAL_MVP_SESSION_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return (
    <div className="local-runtime-status" title={localStatus.message}>
      <Badge accent={localStatus.supabaseConfigured ? 'success' : 'cyan'}>
        {localStatus.supabaseConfigured ? 'Supabase optional' : 'Local demo'}
      </Badge>
      <Badge accent={apiStatus.mockOnly ? 'violet' : 'success'}>
        {apiStatus.mockOnly ? 'Mock API' : 'Backend URL set'}
      </Badge>
      <span>{projectCount} local project{projectCount === 1 ? '' : 's'}</span>
    </div>
  )
}
