export type PlatformProductTrack =
  | 'web'
  | 'desktop'
  | 'shared'
  | 'server'
  | 'local_worker_future'

export type PlatformReadinessStatus =
  | 'ready'
  | 'planned'
  | 'blocked'
  | 'future'
  | 'not_started'
  | 'deprecated'

export interface AppBoundary {
  appId: string
  displayName: string
  track: PlatformProductTrack
  status: PlatformReadinessStatus
  owns: string[]
  mustNotOwn: string[]
  allowedDependencies: string[]
  forbiddenDependencies: string[]
  notes: string[]
}

export interface PlatformReadinessSummary {
  status: PlatformReadinessStatus
  summary: string
  readyFor: string[]
  notReadyFor: string[]
}

export interface PlatformRoadmapPhase {
  phaseId: string
  title: string
  track: PlatformProductTrack
  status: PlatformReadinessStatus
  summary: string
  mustNotDo: string[]
}

export interface RevideoPlatformReadiness {
  status: 'blocked'
  policy: 'evaluation_only'
  coreDependencyAllowed: false
  notes: string[]
}

export interface ProductStrategyReport {
  reportId: string
  createdAt: string
  launchTrack: PlatformProductTrack
  deferredTracks: PlatformProductTrack[]
  repoBoundaries: AppBoundary[]
  webReadiness: PlatformReadinessSummary
  desktopReadiness: PlatformReadinessSummary
  sharedPackageReadiness: PlatformReadinessSummary
  revideoReadiness: RevideoPlatformReadiness
  blockers: string[]
  warnings: string[]
  nextActions: string[]
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealMediaAllowed: false
}

export type WebAppStructureMode = 'moved' | 'transitional' | 'scaffolded'

export interface WebAppStructureReport {
  reportId: string
  createdAt: string
  structureMode: WebAppStructureMode
  webAppPath: string
  currentSourcePath: string
  viteEntryPath: string
  publicAssetsPath: string
  rootScriptsPreserved: string[]
  webScriptsAdded: string[]
  desktopStatus: PlatformReadinessStatus
  forbiddenFindings: string[]
  blockers: string[]
  warnings: string[]
  nextActions: string[]
  revideoReadiness: RevideoPlatformReadiness
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealMediaAllowed: false
}
