import { openSourceToolProfiles } from './tool-registry'
import type { OpenSourceToolId, ToolProfile } from '../types/reeditpro'

export interface FrontendToolInstallSummary {
  installedCount: number
  lazyLoadCount: number
  workerOnlyCount: number
  futureCount: number
  installedToolIds: OpenSourceToolId[]
  workerOnlyToolIds: OpenSourceToolId[]
  futureToolIds: OpenSourceToolId[]
  notes: string[]
}

function installInfo(tool: ToolProfile) {
  return tool.frontendInstallInfo
}

export function getFrontendInstalledTools() {
  return openSourceToolProfiles.filter((tool) =>
    installInfo(tool)?.installedInFrontend &&
    installInfo(tool)?.installStatus === 'installed',
  )
}

export function getFrontendWorkerOnlyTools() {
  return openSourceToolProfiles.filter((tool) =>
    installInfo(tool)?.installStatus === 'worker_only',
  )
}

export function getFrontendFutureTools() {
  return openSourceToolProfiles.filter((tool) => {
    const status = installInfo(tool)?.installStatus
    return status === 'future' || status === 'planned_only' || status === 'not_installed'
  })
}

export function getFrontendToolInstallSummary(): FrontendToolInstallSummary {
  const installed = getFrontendInstalledTools()
  const workerOnly = getFrontendWorkerOnlyTools()
  const future = getFrontendFutureTools()
  const lazyLoadCount = installed.filter((tool) => installInfo(tool)?.lazyLoadRecommended).length

  return {
    installedCount: installed.length,
    lazyLoadCount,
    workerOnlyCount: workerOnly.length,
    futureCount: future.length,
    installedToolIds: installed.map((tool) => tool.id),
    workerOnlyToolIds: workerOnly.map((tool) => tool.id),
    futureToolIds: future.map((tool) => tool.id),
    notes: [
      'Browser-safe packages are installed for future controlled preview components only.',
      'Installed frontend tools are lazy-load recommended and are not executed automatically.',
      'Worker-only tools such as FFmpeg, OpenCV, Playwright, and Essentia are not installed in the frontend.',
      'Open-source tool installation does not change approval, credit, Remotion, or Veo/model-routing rules.',
    ],
  }
}
