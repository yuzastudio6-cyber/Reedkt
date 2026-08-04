import {
  activatePrivateOfflineLibassCaptionRuntime,
} from '../../server/tool-execution/libass-caption-execution'
import {
  activatePrivateOfflineMediaBinaryRuntime,
} from '../../server/tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../../server/tool-execution/remotion-render-execution'

// The professional editor lane proves the real approved private workflow, so
// activate each reviewed local tool authority before mounting the shared API.
// These capabilities remain process-local, non-production, and provider-free.
await activatePrivateOfflineMediaBinaryRuntime()
await activatePrivateOfflineLibassCaptionRuntime()
await prepareOfflineRemotionDockerRuntime()
await activatePrivateOfflineRemotionRenderRuntime()

await import('./edit-preferences-atomic-api-server')
