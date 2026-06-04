import type { NetworkRequestRecord } from '../maplibre-local-render-fixture'

const forbiddenExternalPatterns = [
  /mapbox/i,
  /maps\.googleapis/i,
  /googleapis/i,
  /cesium/i,
  /tile/i,
  /openstreetmap/i,
  /pmtiles/i,
  /geocod/i,
  /routing/i,
  /route\?/i,
  /directions/i,
  /nominatim/i,
  /pelias/i,
  /photon/i,
  /osrm/i,
  /valhalla/i,
]

export function evaluateDeckGlNetworkRequest(url: string, method: string, resourceType: string, localOrigin: string): NetworkRequestRecord {
  const allowed = isAllowedLocalFixtureUrl(url, localOrigin)
  if (allowed) return { url, method, resourceType, allowed }
  return { url, method, resourceType, allowed: false, blockedReason: classifyBlockedNetworkRequest(url) }
}

export function findForbiddenDeckGlNetworkRequests(records: NetworkRequestRecord[]): NetworkRequestRecord[] {
  return records.filter((record) => !record.allowed || (!isAllowedLocalFixtureLogUrl(record.url) && forbiddenExternalPatterns.some((pattern) => pattern.test(record.url))))
}

function isAllowedLocalFixtureUrl(url: string, localOrigin: string): boolean {
  if (url === 'about:blank') return true
  if (url.startsWith('data:')) return true
  if (url.startsWith('blob:')) return true
  if (url.startsWith('file:')) return true
  try {
    const parsed = new URL(url)
    const local = new URL(localOrigin)
    return parsed.protocol === 'http:' && parsed.hostname === '127.0.0.1' && parsed.port === local.port
      || parsed.protocol === 'http:' && parsed.hostname === 'localhost' && parsed.port === local.port
  } catch {
    return false
  }
}

function classifyBlockedNetworkRequest(url: string): string {
  if (/tile|openstreetmap/i.test(url)) return 'live tile or public OSM tile request blocked'
  if (/mapbox/i.test(url)) return 'Mapbox provider request blocked'
  if (/google/i.test(url)) return 'Google Maps provider request blocked'
  if (/cesium/i.test(url)) return 'Cesium ion/provider request blocked'
  if (/geocod|nominatim|pelias|photon/i.test(url)) return 'geocoding request blocked'
  if (/routing|route\?|directions|osrm|valhalla/i.test(url)) return 'routing request blocked'
  return 'external network request blocked'
}

function isAllowedLocalFixtureLogUrl(url: string): boolean {
  if (url === 'about:blank') return true
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('file:')) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' && (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost')
  } catch {
    return false
  }
}
