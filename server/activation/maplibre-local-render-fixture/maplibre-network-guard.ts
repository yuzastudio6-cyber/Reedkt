import type { NetworkRequestRecord } from './maplibre-local-render-types'

export function evaluateMapLibreNetworkRequest(url: string, method: string, resourceType: string, localOrigin: string): NetworkRequestRecord {
  const allowed = isAllowedLocalUrl(url, localOrigin)
  return {
    url,
    method,
    resourceType,
    allowed,
    blockedReason: allowed ? undefined : 'external_network_request_blocked_phase50c',
  }
}

export function isAllowedLocalUrl(url: string, localOrigin: string): boolean {
  if (url === 'about:blank') return true
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('file:')) return true
  if (url.startsWith(localOrigin)) return true
  try {
    const parsed = new URL(url)
    return (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') && parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function findForbiddenMapNetworkRequests(records: NetworkRequestRecord[]): NetworkRequestRecord[] {
  return records.filter((record) => {
    const value = record.url.toLowerCase()
    return !record.allowed
      || value.includes('tile')
      || value.includes('mapbox')
      || value.includes('google')
      || value.includes('cesium')
      || value.includes('openstreetmap')
      || value.includes('nominatim')
      || value.includes('geocode')
      || value.includes('routing')
      || value.includes('route')
  })
}
