import { webSearchMapPlanningConfig } from './web-search-map-planning-policy'
import type { LocationCandidate, PlanningSourceRecord } from './web-search-map-planning-types'

const coordinates: Array<[number, number]> = [
  [-73.9801, 40.7421],
  [-73.9738, 40.7394],
  [-73.9692, 40.7335],
  [-73.9866, 40.7359],
  [-73.9912, 40.7452],
  [-73.9782, 40.7298],
]

export function normalizePlanningSourcesToLocationCandidates(sources: PlanningSourceRecord[]): LocationCandidate[] {
  return sources.slice(0, webSearchMapPlanningConfig.maxLocationCandidates).map((source, index) => ({
    candidateId: `generated-location-${String(index + 1).padStart(3, '0')}`,
    sourceId: source.sourceId,
    name: generatedName(index),
    role: index === 0 ? 'planning_anchor' : index === 5 ? 'context_area' : index % 2 === 0 ? 'route_node' : 'candidate_location',
    coordinates: coordinates[index],
    confidence: Math.round((0.94 - index * 0.035) * 1000) / 1000,
    generatedFixture: true,
    realWorldVerified: false,
    userLocationUsed: false,
    liveGeocodingUsed: false,
    liveRoutingUsed: false,
    evidenceSummary: source.sourceSummary,
  }))
}

function generatedName(index: number): string {
  return [
    'North Evidence Planning Node',
    'Search Source Review Marker',
    'Capture Policy Route Node',
    'Private Artifact Control Point',
    'Network Guard Boundary Marker',
    'Readiness Scope Context Area',
  ][index] ?? `Generated Planning Candidate ${index + 1}`
}
