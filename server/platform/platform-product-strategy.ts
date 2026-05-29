import type { AppBoundary } from './platform-boundary-types'

export const WEB_LAUNCH_TRACK = 'web'

export const DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES = [
  '@tauri-apps/api',
  '@tauri-apps/cli',
  'tauri',
  'electron',
  'electron-forge',
  '@electron-forge/cli',
  'electron-builder',
]

export const PLATFORM_APP_BOUNDARIES: AppBoundary[] = [
  {
    appId: 'apps/web',
    displayName: 'ReeditPro Web App',
    track: 'web',
    status: 'planned',
    owns: [
      'web UI',
      'editor shell',
      'project dashboard',
      'upload flow',
      'timeline UI',
      'artifact review UI',
      'QA report UI',
      'private export review UI',
      'browser capability profile later',
    ],
    mustNotOwn: [
      'server workers',
      'service role secrets',
      'model weights',
      'Cloud Run job execution logic',
      'heavy AI tools',
      'provider calls',
    ],
    allowedDependencies: [
      'React UI dependencies',
      'browser-safe shared types',
      'browser-safe UI packages',
      'API client helpers that do not contain secrets',
    ],
    forbiddenDependencies: [
      '@google-cloud/storage',
      'service role SDK clients',
      'model weight files',
      'provider SDK direct clients',
      'Cloud Run job execution modules',
      ...DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
    ],
    notes: [
      'Web is the launch path.',
      'Heavy editing remains cloud-backed through server-owned workers and private artifacts.',
      'Phase 44A creates the boundary only; Phase 44B moves web structure.',
    ],
  },
  {
    appId: 'apps/desktop',
    displayName: 'ReeditPro Desktop App',
    track: 'desktop',
    status: 'future',
    owns: [
      'desktop shell later',
      'install capability wizard later',
      'local worker bridge later',
      'local cache later',
      'local preview tools later',
    ],
    mustNotOwn: [
      'active Mac/Windows runtime',
      'Tauri/Electron packages',
      'local AI execution',
      'installer scripts',
      'hardware scan execution',
    ],
    allowedDependencies: [
      'documentation only in Phase 44A',
      'future platform-neutral shared types after approval',
    ],
    forbiddenDependencies: [
      ...DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
      'local worker runtime packages',
      'hardware scan packages',
      'local AI model runtimes',
      'installer tooling',
    ],
    notes: [
      'Desktop is deferred until the web product path is finished enough to justify a second shell.',
      'No desktop framework decision is made in Phase 44A.',
      'No local worker or local AI execution is introduced.',
    ],
  },
  {
    appId: 'packages/shared',
    displayName: 'Shared Pure Types And Utilities',
    track: 'shared',
    status: 'planned',
    owns: [
      'shared pure types/utilities',
      'no server secrets',
      'no browser-specific heavy logic',
    ],
    mustNotOwn: [
      'service role secrets',
      'model weights',
      'provider clients',
      'Cloud Run mutation logic',
      'desktop runtime hooks',
    ],
    allowedDependencies: [
      'TypeScript type-only dependencies',
      'pure validation helpers',
      'serializable constants',
    ],
    forbiddenDependencies: [
      '@google-cloud/storage',
      'provider SDK direct clients',
      'model weight files',
      ...DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
    ],
    notes: [
      'Shared code must stay platform-neutral and pure.',
    ],
  },
  {
    appId: 'packages/ui',
    displayName: 'Reusable UI Components',
    track: 'shared',
    status: 'planned',
    owns: [
      'reusable UI components',
      'browser-safe design primitives',
      'no server/GCP/model code',
    ],
    mustNotOwn: [
      'server/GCP/model code',
      'provider calls',
      'service role secrets',
      'media execution',
      'desktop runtime packages',
    ],
    allowedDependencies: [
      'React components',
      'browser-safe styling utilities',
      'shared UI tokens',
    ],
    forbiddenDependencies: [
      '@google-cloud/storage',
      'provider SDK direct clients',
      'model weight files',
      ...DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
    ],
    notes: [
      'UI components must not smuggle runtime ownership into shared packages.',
    ],
  },
  {
    appId: 'packages/platform',
    displayName: 'Platform Policy Types',
    track: 'shared',
    status: 'planned',
    owns: [
      'product mode types',
      'platform boundary types',
      'future capability profile types',
    ],
    mustNotOwn: [
      'runtime hardware scans',
      'local worker execution',
      'Cloud Run job execution',
      'provider calls',
      'model execution',
    ],
    allowedDependencies: [
      'type-only platform contracts',
      'static policy metadata',
    ],
    forbiddenDependencies: [
      'hardware scan packages',
      'local worker runtime packages',
      '@google-cloud/storage',
      ...DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
    ],
    notes: [
      'Capability profiles are future types, not active scans.',
    ],
  },
  {
    appId: 'packages/editor-core',
    displayName: 'Editor Core',
    track: 'shared',
    status: 'planned',
    owns: [
      'timeline/editor pure logic',
      'deterministic timeline utilities',
      'caption/transcript transforms without runtime execution',
    ],
    mustNotOwn: [
      'direct Cloud Run/gcloud/provider calls',
      'service role secrets',
      'model execution',
      'media processing',
      'browser-only shell code',
    ],
    allowedDependencies: [
      'pure timeline utilities',
      'type-only editor contracts',
    ],
    forbiddenDependencies: [
      '@google-cloud/storage',
      'provider SDK direct clients',
      'gcloud command wrappers',
      'model weight files',
      ...DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
    ],
    notes: [
      'Editor logic should be reusable without owning cloud or desktop runtime behavior.',
    ],
  },
  {
    appId: 'packages/compute-routing',
    displayName: 'Compute Routing Policy',
    track: 'local_worker_future',
    status: 'future',
    owns: [
      'ToolRouteManifest later',
      'DeviceComputeProfile later',
      'WebCapabilityProfile later',
      'compute decision policy later',
    ],
    mustNotOwn: [
      'active local worker execution',
      'hardware scan execution',
      'local AI execution',
      'provider calls',
      'Cloud Run job execution',
    ],
    allowedDependencies: [
      'future type-only route manifests',
      'future static capability profiles',
    ],
    forbiddenDependencies: [
      'hardware scan packages',
      'local AI runtime packages',
      'local worker runtime packages',
      ...DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
    ],
    notes: [
      'Compute routing is reserved for later; cloud-backed server execution remains primary.',
    ],
  },
  {
    appId: 'server',
    displayName: 'Server Runtime And Activation Stack',
    track: 'server',
    status: 'ready',
    owns: [
      'activation runtime',
      'workers',
      'Cloud Run job orchestration',
      'tool execution',
      'private artifacts',
      'model policies',
      'cost/security/readiness',
    ],
    mustNotOwn: [
      'browser UI components',
      'desktop shell',
      'desktop installer flow',
      'unapproved local hardware scans',
    ],
    allowedDependencies: [
      'server runtime dependencies',
      'worker orchestration dependencies',
      'private storage adapters',
      'readiness and activation policy modules',
    ],
    forbiddenDependencies: [
      ...DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
      'desktop installer tooling',
    ],
    notes: [
      'The backend activation stack remains the owner for heavy tools, Cloud Run jobs, private artifacts, and launch safety.',
      'Server readiness does not make the web app production-ready.',
    ],
  },
]

export function findPlatformBoundary(appId: string): AppBoundary | undefined {
  return PLATFORM_APP_BOUNDARIES.find((boundary) => boundary.appId === appId)
}
