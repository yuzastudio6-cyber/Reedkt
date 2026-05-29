import {
  DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
  findPlatformBoundary,
} from './platform-product-strategy'

export const WEB_APP_STRUCTURE_REPORT_ID = 'activation-phase-44b-web-app-structure-migration'
export const WEB_APP_STRUCTURE_MODE = 'transitional'
export const WEB_APP_PATH = 'apps/web'
export const CURRENT_WEB_SOURCE_PATH = 'src'
export const CURRENT_VITE_ENTRY_PATH = 'index.html'
export const CURRENT_PUBLIC_ASSETS_PATH = 'public'
export const NEXT_WEB_APP_PHASE = 'Phase 44C web production shell'

export const WEB_APP_REQUIRED_ROOT_SCRIPTS = [
  'dev',
  'build',
  'lint',
  'preview',
  'build:server',
]

export const WEB_APP_STRUCTURE_SCRIPTS = [
  'smoke:web-app-structure',
  'web:structure:summary',
]

export const WEB_APP_COMPAT_SCRIPTS = [
  'web:dev',
  'web:build',
  'web:lint',
]

export const WEB_APP_MAY_OWN = [
  'React UI',
  'routing',
  'editor shell UI',
  'project dashboard UI',
  'upload UI',
  'timeline UI',
  'transcript/caption display UI',
  'artifact review UI',
  'QA report UI',
  'private export review UI',
  'browser capability profile UI later',
]

export const WEB_APP_MUST_NOT_OWN = [
  'server workers',
  'gcloud logic',
  'service role secrets',
  'provider calls',
  'model weights',
  'Docker build logic',
  'Cloud Run job execution',
  'heavy AI execution',
  'direct private GCS mutation logic',
  'raw tool execution',
]

export const WEB_APP_STRUCTURE_FORBIDDEN_DEPENDENCIES = [
  ...DESKTOP_RUNTIME_FORBIDDEN_DEPENDENCIES,
]

export function getDesktopStructureStatus(): 'future' | 'planned' | 'blocked' {
  const desktopBoundary = findPlatformBoundary('apps/desktop')
  if (desktopBoundary?.status === 'future' || desktopBoundary?.status === 'planned') return desktopBoundary.status
  return 'blocked'
}
