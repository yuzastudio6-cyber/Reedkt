import type {
  CanonicalMusicPlanResult,
  CanonicalMusicSkillService,
} from './canonical-music-skill-service'
import {
  parseCanonicalMusicRequest,
  type CanonicalMusicSkillRequest,
} from '../../music/music-contracts'

export interface LegacyMusicPlanningCompatibilityReceipt {
  schemaVersion: 'legacy-music-planning-compatibility-receipt-v1'
  legacyAuthority: 'fixture_only'
  canonicalRequestId: string
  canonicalMusicSkillVersion: string
  canonicalMusicManifestHash: string
  canonicalPlan: CanonicalMusicPlanResult
  providerDispatchAllowed: false
  workerDispatchAllowed: false
  soundToolDispatchAllowed: false
  finalHandoffAllowed: false
}

/**
 * The only retained legacy caller bridge. It accepts an already canonical,
 * planning-only request and delegates to the public Music service. It cannot
 * translate raw chat into execution authority or dispatch providers/workers.
 */
export class LegacyMusicPlanningCompatibilityAdapter {
  readonly #music: CanonicalMusicSkillService

  constructor(music: CanonicalMusicSkillService) {
    this.#music = music
  }

  async plan(input: CanonicalMusicSkillRequest): Promise<LegacyMusicPlanningCompatibilityReceipt> {
    const request = parseCanonicalMusicRequest(input)
    if (request.requestedExecutionMode !== 'planning') {
      throw new Error('Legacy Music compatibility is planning-only.')
    }
    const plan = await this.#music.plan(request)
    const manifest = this.#music.getCapabilityManifest()
    return Object.freeze({
      schemaVersion: 'legacy-music-planning-compatibility-receipt-v1',
      legacyAuthority: 'fixture_only',
      canonicalRequestId: request.requestId,
      canonicalMusicSkillVersion: manifest.skillVersion,
      canonicalMusicManifestHash: manifest.manifestHash,
      canonicalPlan: plan,
      providerDispatchAllowed: false,
      workerDispatchAllowed: false,
      soundToolDispatchAllowed: false,
      finalHandoffAllowed: false,
    })
  }

  execute(): never {
    throw new Error('Legacy Music compatibility cannot execute; use the canonical Music public service.')
  }
}
