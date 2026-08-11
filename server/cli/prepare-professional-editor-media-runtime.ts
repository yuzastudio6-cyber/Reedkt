import { prepareOfflineMediaBinaryDockerRuntime } from '../tool-execution/media-binary-execution'

const image = await prepareOfflineMediaBinaryDockerRuntime()

console.log(JSON.stringify({
  ok: true,
  imageTag: image.imageTag,
  imageId: image.imageId,
  imageIdentityHash: image.imageIdentityHash,
  productReady: image.productReady,
  h264Encoding: image.h264Encoding,
}))
