import type {
  ToolRateCardSnapshot,
  ToolRuntimeStatus,
} from './tool-capability-manifest-types'
import { parseToolRuntimeStatus } from './tool-capability-manifest-registry'

export class ToolRuntimeStatusRegistry {
  readonly #statuses = new Map<string, ToolRuntimeStatus>()

  set(input: unknown): ToolRuntimeStatus {
    const status = parseToolRuntimeStatus(input)
    this.#statuses.set(`${status.toolKey}@${status.toolVersion}`, structuredClone(status))
    return structuredClone(status)
  }

  get(toolKey: string, toolVersion: string): ToolRuntimeStatus | undefined {
    const status = this.#statuses.get(`${toolKey}@${toolVersion}`)
    return status ? structuredClone(status) : undefined
  }

  list(): ToolRuntimeStatus[] {
    return [...this.#statuses.values()]
      .map((status) => structuredClone(status))
      .sort((left, right) => `${left.toolKey}@${left.toolVersion}`
        .localeCompare(`${right.toolKey}@${right.toolVersion}`))
  }
}

export class ToolRateCardSnapshotRegistry {
  readonly #snapshots = new Map<string, ToolRateCardSnapshot>()

  set(snapshot: ToolRateCardSnapshot): ToolRateCardSnapshot {
    if (!Number.isFinite(snapshot.unitCost) || snapshot.unitCost < 0) {
      throw new Error('Tool rate-card native unit cost must be finite and non-negative.')
    }
    if (snapshot.usdConversionStatus === 'known' &&
      (!Number.isFinite(snapshot.unitCostUsd) || (snapshot.unitCostUsd as number) < 0)) {
      throw new Error('Known USD conversion requires a finite, non-negative USD unit cost.')
    }
    if (snapshot.usdConversionStatus === 'unknown' && snapshot.unitCostUsd !== undefined) {
      throw new Error('Unknown USD conversion must not publish a misleading USD unit cost.')
    }
    const existing = this.#snapshots.get(snapshot.rateCardSnapshotId)
    if (existing && JSON.stringify(existing) !== JSON.stringify(snapshot)) {
      throw new Error(`Rate-card snapshot ${snapshot.rateCardSnapshotId} is immutable.`)
    }
    this.#snapshots.set(snapshot.rateCardSnapshotId, structuredClone(snapshot))
    return structuredClone(snapshot)
  }

  get(rateCardSnapshotId: string): ToolRateCardSnapshot | undefined {
    const snapshot = this.#snapshots.get(rateCardSnapshotId)
    return snapshot ? structuredClone(snapshot) : undefined
  }
}

export const canonicalToolRuntimeStatusRegistry = new ToolRuntimeStatusRegistry()
export const canonicalToolRateCardSnapshotRegistry = new ToolRateCardSnapshotRegistry()
