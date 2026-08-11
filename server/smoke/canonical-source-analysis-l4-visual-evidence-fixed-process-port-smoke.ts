import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const port = source(
  'server/services/canonical-source-analysis-l4-visual-evidence-fixed-process-port.ts',
)
const runner = source('docker/prod/gpu-worker/visual-evidence/runner.py')
const capsuleVerifier = source(
  'docker/prod/gpu-worker/visual-evidence/verify-private-build-input.py',
)
const docker = source(
  'docker/prod/gpu-worker/visual-evidence/Dockerfile.candidate',
)
const provenance = source(
  'docker/prod/gpu-worker/visual-evidence/source-provenance.lock',
)
const deploy = source('scripts/gcp/prod/10-deploy-gpu-worker-job.example.sh')
const admission = source(
  'server/services/canonical-source-analysis-l4-visual-evidence-admission-owner.ts',
)
const build = source(
  'scripts/docker/prod/04-build-l4-visual-evidence-image.example.sh',
)

assert.match(port, /\.file\(source\.storagePath, \{ generation: source\.storageGeneration \}\)/u)
assert.equal((port.match(/file\.getMetadata\(\)/gu) ?? []).length, 2)
assert.match(port, /createReadStream\(\{ validation: 'crc32c' \}\)/u)
assert.match(port, /open\(input\.sourcePath, 'wx', 0o600\)/u)
assert.match(port, /writeAll\(handle, chunk\)/u)
assert.match(port, /open\(join\(input\.invocationRoot, 'task\.json'\), 'wx', 0o600\)/u)
assert.match(port, /const PYTHON = '\/opt\/weeditpro\/visual-evidence\/venv\/bin\/python'/u)
assert.match(port, /const RUNNER = '\/opt\/weeditpro\/visual-evidence\/runner\.py'/u)
assert.match(port, /shell: false/u)
assert.match(port, /await rm\(invocationRoot, \{ recursive: true, force: true \}\)/u)
assert.match(port, /MAXIMUM_SOURCE_BYTES = 10 \* 1024 \* 1024 \* 1024/u)
assert.match(port, /720_000/u)
assert.match(port, /LD_LIBRARY_PATH/u)
assert.match(port, /PADDLE_PDX_CACHE_HOME/u)
assert.match(port, /XDG_CACHE_HOME/u)
assert.match(port, /for \(const directory of \['home', 'tmp', 'cache'\]\)/u)
assert.doesNotMatch(port, /signedUrl|process\.argv|execFile|shell: true/u)
assert.match(admission, /const MAXIMUM_SOURCE_BYTES = 10 \* 1024 \*\* 3/u)
assert.match(
  admission,
  /source_visual_evidence_admission_source_bound_exceeded/u,
)
assert.match(
  admission,
  /const MAXIMUM_PRIVATE_ARTIFACT_BYTES = 24 \* 1024 \*\* 3/u,
)

assert.match(docker, /paddlex3\.0\.1-paddlepaddle3\.0\.0-gpu-cuda12\.6-cudnn9\.5-trt10\.5@sha256:555a291/u)
assert.match(docker, /node:24-bookworm@sha256:c63c141/u)
assert.match(docker, /io\.weeditpro\.runtime\.qualification="candidate-only"/u)
assert.match(docker, /--no-index/u)
assert.match(docker, /--require-hashes/u)
assert.match(docker, /--ignore-installed/u)
assert.match(docker, /venv --system-site-packages/u)
assert.match(docker, /pip check/u)
assert.match(docker, /h264_nvenc/u)
assert.match(docker, /hasattr\(cv2,'cudacodec'\)/u)
assert.match(docker, /paddle\.is_compiled_with_cuda\(\)/u)
assert.match(docker, /m\.version\('paddlepaddle-gpu'\) == '3\.0\.0'/u)
assert.match(docker, /m\.version\('paddlex'\) == '3\.7\.0'/u)
assert.match(docker, /m\.version\('paddleocr'\) == '3\.7\.0'/u)
assert.match(docker, /USER 65532:65532/u)
assert.doesNotMatch(docker, /curl|wget|git clone|huggingface-cli/u)
assert.match(
  docker,
  /WEEDITPRO_VISUAL_EVIDENCE_PRIVATE_CAPSULE_MANIFEST_SHA256/u,
)
assert.match(docker, /verify-private-build-input\.py/u)

assert.match(
  capsuleVerifier,
  /weeditpro-l4-visual-evidence-private-build-capsule-v1/u,
)
assert.match(capsuleVerifier, /actual_paths != expected_paths/u)
assert.match(capsuleVerifier, /REQUIRED_ROLES\.issubset/u)
assert.match(capsuleVerifier, /capsule symlink forbidden/u)
assert.match(capsuleVerifier, /containsCredentials/u)
assert.match(capsuleVerifier, /containsCustomerMedia/u)
assert.doesNotMatch(
  capsuleVerifier,
  /requests\.|urllib\.|socket\.|subprocess|os\.system/u,
)

assert.match(runner, /cv2\.cudacodec\.createVideoReader/u)
assert.match(runner, /cv2\.cuda\.createLaplacianFilter/u)
assert.match(runner, /"-hwaccel",\s+"cuda"/u)
assert.match(runner, /"h264_nvenc"/u)
assert.match(runner, /importlib\.metadata\.version\("scenedetect"\) != "0\.7\.1"/u)
assert.match(runner, /"detectionModelName"/u)
assert.match(runner, /"PP-OCRv6_medium_det"/u)
assert.match(runner, /"PP-OCRv6_medium_rec"/u)
assert.match(runner, /"PP-LCNet_x1_0_textline_ori"/u)
assert.match(runner, /"paddle_static"/u)
assert.match(runner, /device="gpu:0"/u)
assert.match(runner, /EDITOR_INSTRUCTION/u)
assert.match(runner, /"instructionsFromTextAreNeverExecuted": True/u)
assert.match(runner, /"textContentIsUntrustedMediaEvidence": True/u)
assert.match(runner, /"allCanonicalSourceFramesAccountedFor": True/u)
assert.match(runner, /"completeTimePixelInspectionClaimAllowed": False/u)
assert.match(runner, /"substantiveCpuMediaProcessingUsed": False/u)
assert.match(runner, /"runtimeNetworkDownloadPerformed": False/u)
assert.doesNotMatch(
  runner,
  /cv2\.VideoCapture|cv2\.imread|requests\.|urllib\.|socket\.|os\.system|shell=True|sys\.argv/u,
)

assert.match(provenance, /product=WeEditPro/u)
assert.match(provenance, /operation_owner=visual_intelligence/u)
assert.match(provenance, /user_triggered_scale_from_zero=true/u)
assert.match(provenance, /substantive_cpu_media_processing_allowed=false/u)
assert.match(provenance, /base_paddlex_version=3\.0\.1/u)
assert.match(provenance, /runtime_paddlex_version=3\.7\.0/u)
assert.match(
  provenance,
  /private_build_capsule_complete_manifest_required=true/u,
)
assert.match(provenance, /production_ready=false/u)
assert.match(
  build,
  /--file docker\/prod\/gpu-worker\/visual-evidence\/Dockerfile\.candidate/u,
)
assert.match(build, /image_name reeditpro-l4-media-worker/u)
assert.match(build, /require_clean_source_identity/u)
assert.match(build, /visual_evidence_private_build_input/u)
assert.doesNotMatch(build, /docker push|gcloud|kubectl/u)
assert.match(
  deploy,
  /--add-volume="name=weeditpro-l4-visual-evidence-scratch,type=in-memory,size-limit=24Gi"/u,
)
assert.match(
  deploy,
  /--add-volume-mount="volume=weeditpro-l4-visual-evidence-scratch,mount-path=\/mnt\/weeditpro-private\/l4-visual-evidence"/u,
)
assert.match(deploy, /--max-retries=0/u)
assert.match(deploy, /--tasks=1/u)
assert.match(deploy, /--parallelism=1/u)

console.log(JSON.stringify({
  ok: true,
  fixedGenerationBoundGcsReread: true,
  fixedPrivateProcessPort: true,
  immutableCandidateBasesPinned: true,
  completePrivateBuildCapsuleVerified: true,
  ffmpegNvdecAndNvencRequired: true,
  openCvCudaFullTimelineMetricsRequired: true,
  pySceneDetectGpuMetricPolicyRequired: true,
  paddleOcrGpuLocalModelsRequired: true,
  mediaInstructionsRemainUntrusted: true,
  substantiveCpuMediaProcessingAllowed: false,
  runtimeDownloadAllowed: false,
  candidateImageQualified: false,
  productionReady: false,
}))

function source(path: string): string {
  return readFileSync(path, 'utf8')
}
