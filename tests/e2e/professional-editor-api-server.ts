import {
  activatePrivateOfflineLibassCaptionRuntime,
  prepareOfflineLibassDockerRuntime,
} from '../../server/tool-execution/libass-caption-execution'
import {
  activatePrivateOfflineMediaBinaryRuntime,
  prepareOfflineMediaBinaryDockerRuntime,
} from '../../server/tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../../server/tool-execution/remotion-render-execution'

// The professional editor lane proves the real approved private workflow, so
// prepare and verify every reviewed image before activating any local tool
// authority or mounting the shared API. These capabilities remain process-local,
// non-production, and provider-free.
await prepareOfflineMediaBinaryDockerRuntime()
await prepareOfflineLibassDockerRuntime()
await prepareOfflineRemotionDockerRuntime()
await activatePrivateOfflineMediaBinaryRuntime()
await activatePrivateOfflineLibassCaptionRuntime()
await activatePrivateOfflineRemotionRenderRuntime()

await import('./edit-preferences-atomic-api-server')
