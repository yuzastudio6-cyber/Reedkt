import { getBackendRuntimeStatus } from '../backend/api/backend-runtime-config'

export function E2ERuntimeStatusMarker() {
  if (import.meta.env.VITE_E2E_BROWSER_TEST !== 'true') return null

  const status = getBackendRuntimeStatus()

  return (
    <div
      aria-hidden="true"
      data-api-mode={status.mode}
      data-backend-origin={toOrigin(status.configuredApiBaseUrl)}
      data-has-backend-url={String(status.hasBackendUrl)}
      data-mock-only={String(status.mockOnly)}
      data-testid="e2e-runtime-status"
      hidden
    />
  )
}

function toOrigin(value: string | undefined): string {
  if (!value) return ''

  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}
