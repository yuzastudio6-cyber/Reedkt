import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  assertCanonicalSam31SourceRuntimeCandidate,
  createCanonicalSam31SourceRuntimeCandidate,
  type CanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  getNonE2EToolCapabilityProfile,
  getProductionToolProfile,
  isProductionToolId,
} from '../tool-registry'
import {
  createCanonicalGpuWorkerOperationRuntimePort,
} from '../model-artifacts/canonical-gpu-worker-operation-router'
import type {
  CanonicalGpuWorkerOperationId,
} from '../model-artifacts/canonical-gpu-worker-operation-router-types'
import {
  createCanonicalGpuWorkerSam2SubprocessRuntimePort,
} from '../model-artifacts/canonical-gpu-worker-sam2-subprocess-runtime'
import {
  getGpuModelWeightManifestTemplate,
} from '../model-weights'
import { openSourceToolProfiles } from '../../src/lib/tool-registry'

const candidate = assertCanonicalSam31SourceRuntimeCandidate(
  createCanonicalSam31SourceRuntimeCandidate(),
)
assert.equal(candidate.registryIdentity.canonicalToolId, 'sam3_1')
assert.equal(candidate.operationId,
  'tool.sam3_1.segment_and_track_subject.v1')
assert.equal(candidate.replacement.supersedesForNewPlans, 'sam2')
assert.equal(
  candidate.replacement.sam2MayAuthorizeNewPlanWorkFallbackOrRepair,
  false,
)
assert.equal(
  candidate.replacement.livingFrameEstimateProjectionVersion,
  'canonical-living-frame-estimate-work-asset-projection-v7',
)
assert.equal(
  candidate.replacement.livingFrameWorkGraphProjectionVersion,
  'canonical-living-frame-work-graph-projection-v9',
)
assert.equal(
  candidate.replacement.livingFrameTemporalMaskUsesSam31Operation,
  true,
)
assert.equal(
  candidate.replacement.directSam2SubprocessSpawnerAvailable,
  false,
)
assert.equal(candidate.officialSource.release, 'SAM 3.1')
assert.equal(candidate.officialSource.deterministicGitArchiveFormat,
  'git_archive_tar_uncompressed')
assert.equal(candidate.officialSource.sourceTree,
  '573deb167702e014829a5b830de8ae62abe891d5')
assert.equal(candidate.officialSource.deterministicGitArchiveByteLength,
  73_605_120)
assert.equal(candidate.officialSource.deterministicGitArchiveSha256,
  '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a')
assert.equal(candidate.officialSource.submodulesRequired, false)
assert.equal(candidate.officialCheckpoint.gatedRepositoryAccessRequired, true)
assert.equal(candidate.officialCheckpoint.automatedTermsAcceptanceAllowed, false)
assert.equal(candidate.officialCheckpoint.exactDownloadedSha256, null)
assert.equal(
  candidate.officialCheckpoint.thirdPartyMirrorOrScanMaySatisfyCanonicalIngest,
  false,
)
assert.equal(candidate.officialCheckpoint.repositoryGating, 'manual')
assert.equal(candidate.officialCheckpoint.hostedInferenceProviderAvailable,
  false)
assert.equal(candidate.officialCheckpoint.transformersIntegrationAvailable,
  false)
assert.equal(candidate.officialCheckpoint.knownPublicCompatibilityIssueNumber,
  526)
assert.equal(
  candidate.officialCheckpoint.knownPublicCompatibilityIssueStateAtReview,
  'open',
)
assert.equal(
  candidate.officialCheckpoint.pinnedSourceAndCheckpointMayBeAssumedCompatible,
  false,
)
assert.equal(candidate.officialCheckpoint.unreviewedCheckpointKeyRewriteAllowed,
  false)
assert.equal(
  candidate.officialCheckpoint
    .partialTrackerLoadWarningMayQualifyCompatibility,
  false,
)
assert.equal(
  candidate.officialCheckpoint
    .strictFinalAssembledVideoModelMayQualifyWithoutIssueClosure,
  true,
)
assert.equal(
  candidate.officialCheckpoint.strictQualificationRequiresSingleCheckpointLoad,
  true,
)
assert.equal(
  candidate.officialCheckpoint.strictQualificationRequiresExactModelKeySet,
  true,
)
assert.equal(
  candidate.officialCheckpoint.strictQualificationRequiresCompleteVideoProbe,
  true,
)
assert.equal(candidate.fixedApi.builder,
  'build_sam3_multiplex_video_predictor')
assert.equal(candidate.fixedApi.useFlashAttention3, false)
assert.equal(candidate.fixedApi.maximumTrackedObjectsProductCap, 16)
assert.equal(candidate.fixedApi.multiplexBucketSize, 16)
assert.deepEqual(candidate.fixedApi.lifecycleRequestOrder, [
  'start_session',
  'add_prompt',
  'propagate_in_video',
  'close_session',
])
assert.equal(candidate.fixedApi.streamingRequestApi, 'handle_stream_request')
assert.deepEqual(candidate.fixedApi.reeditproGpuAdmissibleSourceMediaForms,
  ['private_read_only_mp4'])
assert.equal(candidate.fixedApi.gpuDecodeBackend,
  'torchcodec_0_10_cuda_nvdec')
assert.equal(candidate.runtimeClosure.reeditproGpuDecodePatchSemanticAuditPassed,
  true)
assert.equal(
  candidate.candidateHash,
  'a619bd95c0223cab1247fd6e3e9d21276a0aea99a905d789ea6534c7f726b444',
)
assert.equal(candidate.runtimeClosure.reeditproPatchedSourceTree,
  'f3a58b95a0e460d76e1cf38abff0382a7307f67d')
assert.equal(candidate.runtimeClosure.deterministicPatchedSourceArchiveSha256,
  'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb')
assert.equal(
  candidate.runtimeClosure.callerSuppliedPatchedSourceArchiveHashAllowed,
  false,
)
assert.equal(candidate.runtimeClosure.candidateBaseImage.resolvedDigestSha256,
  'b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca')
assert.equal(
  candidate.runtimeClosure.candidateBaseImage.dependencyClosureQualified,
  false,
)
assert.equal(candidate.runtimeClosure.candidateBaseImage.imageBuildUseAuthorized,
  false)
assert.equal(
  candidate.runtimeClosure.cudaDriverCompatibility
    .cloudRunL4DocumentedDriverBranch,
  '535.x',
)
assert.equal(
  candidate.runtimeClosure.cudaDriverCompatibility
    .cudaForwardCompatibilityPackageVersion,
  '570.211.01-0ubuntu1',
)
assert.equal(
  candidate.runtimeClosure.cudaDriverCompatibility
    .cudaForwardCompatibilitySha256,
  'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
)
assert.equal(
  candidate.runtimeClosure.cudaDriverCompatibility
    .runtimeDriverVersionAndLoadedLibraryPathEvidenceRequired,
  true,
)
assert.equal(
  candidate.runtimeClosure.cudaDriverCompatibility.l4CompatibilityQualified,
  false,
)
assert.equal(candidate.fixedApi.cpuOpenCvOrPillowDecodeAllowed, false)
assert.equal(candidate.fixedApi.strictCheckpointLoadRequired, true)
assert.equal(candidate.fixedApi.cudaOutputTensorsRequired, true)
assert.equal(candidate.fixedApi.boundedCpuOutputSerializationOnly, true)
assert.equal(candidate.fixedApi.outputBinaryMasksField, 'out_binary_masks')
assert.equal(candidate.fixedApi.serverCompiledApprovedSubjectPromptRequired,
  true)
assert.equal(candidate.fixedApi.runtimeNetworkOrHuggingFaceDownloadAllowed,
  false)
assert.equal(candidate.compute.primaryProfileId,
  'quality_a100_80gb_user_triggered_heavy_job_v1')
assert.equal(candidate.compute.fallbackProfileId,
  'quality_l4_user_triggered_heavy_fallback_job_v1')
assert.equal(candidate.compute.noApprovedWorkMeansZeroGpuJobs, true)
assert.equal(candidate.compute.cpuOnlyHeavyExecutionAllowed, false)
assert.equal(candidate.compute.modelQuantizationAllowed, false)
assert.equal(candidate.cost.coldStartAndModelLoadIncluded, true)
assert.equal(candidate.cost.systemFailureChargedToUser, false)
assert.equal(
  candidate.runtimeClosure.checkpointAndPinnedSourceCompatibilityQualified,
  false,
)
assert.equal(candidate.qa.temporalStabilityRequired, true)
assert.equal(candidate.authority.runtimeExecuted, false)
assert.equal(candidate.authority.productionReady, false)

assert.equal(isProductionToolId('sam3_1'), false)
assert.equal(getProductionToolProfile('sam3_1'), undefined)
assert.equal(getNonE2EToolCapabilityProfile('sam3_1')?.productionStatus,
  'needs_license_review')
assert.equal(getNonE2EToolCapabilityProfile('sam3_1')?.cpuAllowed, false)
assert.equal(getNonE2EToolCapabilityProfile('sam2')?.productionStatus,
  'blocked')
assert.equal(getGpuModelWeightManifestTemplate('sam2_checkpoint'), undefined)
assert.equal(openSourceToolProfiles.some((profile) =>
  profile.id === 'sam3_1'), true)
assert.equal(openSourceToolProfiles.some((profile) =>
  profile.id === 'sam2'), false)
assert.equal(openSourceToolProfiles.find((profile) =>
  profile.id === 'sam3_1')?.label, 'SAM 3.1')
assert.throws(() => createCanonicalGpuWorkerOperationRuntimePort({
  evidenceClass: 'controlled_source_fixture',
  supportedOperationIds: [
    'tool.sam2.segment_and_track_subject.v1' as CanonicalGpuWorkerOperationId,
  ],
  async execute() {
    throw new Error('SAM 2 runtime must never be invoked for new work.')
  },
}))
assert.throws(
  () => createCanonicalGpuWorkerSam2SubprocessRuntimePort(),
  /sam2_historical_only_new_dispatch_blocked/u,
)

const activeGpuDockerfile = readFileSync(resolve(
  process.cwd(),
  'docker/prod/gpu-worker/Dockerfile',
), 'utf8')
assert(!activeGpuDockerfile.includes('/opt/reeditpro/model-weights/sam2'))

for (const relativePath of [
  'server/routes/edit-execution-routes.ts',
  'src/backend/api/mock-api-router.ts',
]) {
  const source = readFileSync(resolve(process.cwd(), relativePath), 'utf8')
  const imageCleanupAliases = source.match(
    /id:\s*'image_cleanup',\s*aliases:\s*\[([\s\S]*?)\]/u,
  )?.[1]
  assert.ok(
    imageCleanupAliases,
    `${relativePath} must declare the active image-cleanup adapter aliases.`,
  )
  assert.match(imageCleanupAliases, /'sam3_1'/u)
  assert.doesNotMatch(imageCleanupAliases, /'sam2'/u)
}

const sourceLock = readFileSync(resolve(
  process.cwd(),
  'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
), 'utf8')
assert(sourceLock.includes(
  `official_source_revision=${candidate.officialSource.sourceRevision}`,
))
assert(sourceLock.includes(
  'private_artifact_ingest_schema=canonical-sam3_1-private-artifact-ingest-receipt-v3',
))
assert(sourceLock.includes(
  'source_checkpoint_qualification_schema=canonical-sam3_1-source-checkpoint-compatibility-qualification-v1',
))
assert(sourceLock.includes(
  'cloud_image_build_authority_schema=canonical-sam3_1-cloud-image-build-authority-v4',
))
assert(sourceLock.includes(
  'cloud_image_supply_chain_release_schema=canonical-sam3_1-cloud-image-supply-chain-release-v1',
))
assert(sourceLock.includes(
  'canonical_model_artifact_bucket=reeditpro-production-reeditpro-model-artifacts',
))
assert(sourceLock.includes(
  'canonical_image_build_input_bucket=reeditpro-production-reeditpro-image-build-inputs',
))
assert(sourceLock.includes('checkpoint_bytes_in_image_build_capsule=false'))
assert(sourceLock.includes('local_developer_install_allowed=false'))
assert(sourceLock.includes('image_supply_chain_qualified=false'))
assert(sourceLock.includes(
  `source_git_archive_sha256=${candidate.officialSource.deterministicGitArchiveSha256}`,
))
assert(sourceLock.includes(
  `checkpoint_repository_revision=${candidate.officialCheckpoint.repositoryRevision}`,
))
assert(sourceLock.includes('checkpoint_exact_downloaded_sha256=pending_'))
assert(sourceLock.includes(
  'checkpoint_known_public_compatibility_issue=facebookresearch_sam3_526',
))
assert(sourceLock.includes(
  'checkpoint_pinned_source_compatibility_may_be_assumed=false',
))
assert(sourceLock.includes('checkpoint_unreviewed_key_rewrite_allowed=false'))
assert(sourceLock.includes(
  'checkpoint_deterministic_runtime_buffer_derivation_policy=sam3_1_real_rope_cache_from_complex_buffer_v1',
))
assert(sourceLock.includes(
  'checkpoint_deterministic_runtime_buffer_derivation_source_count=32',
))
assert(sourceLock.includes(
  'checkpoint_deterministic_runtime_buffer_derivation_output_count=64',
))
assert(sourceLock.includes(
  'checkpoint_deterministic_runtime_buffer_derivation_synthesizes_learned_parameters=false',
))
assert(sourceLock.includes('minimum_idle_a100_jobs=0'))
assert(sourceLock.includes('minimum_idle_l4_jobs=0'))
assert(sourceLock.includes('runtime_download_allowed=false'))
assert(sourceLock.includes('cpu_only_heavy_execution_allowed=false'))
for (const gpuMemoryPolicy of [
  'fixed_gpu_decode_loading_mode=asynchronous_cuda_nvdec_with_bounded_join_before_inference',
  'fixed_gpu_decode_complete_frame_store_required_before_inference=true',
  'fixed_a100_gpu_memory_profile=a100_full_gpu_state_v1',
  'fixed_l4_gpu_memory_profile=l4_gpu_only_full_semantic_streamed_grounding_postprocess_trimmed_memory_v6',
  'fixed_l4_gpu_memory_profile_uses_upstream_trim_past_non_cond_mem_for_eval=true',
  'fixed_l4_gpu_memory_profile_preserves_complete_prompt_semantic_object_set=true',
  'fixed_l4_gpu_memory_profile_detector_object_removal_allowed=false',
  'fixed_l4_gpu_memory_profile_streams_upstream_postprocess_one_frame_at_a_time=true',
  'fixed_l4_gpu_memory_profile_streams_upstream_grounding_one_frame_at_a_time=true',
  'fixed_l4_gpu_memory_profile_requires_exact_a100_mask_parity=true',
  'fixed_l4_gpu_memory_profile_num_maskmem=7',
  'fixed_l4_gpu_memory_profile_cpu_state_or_output_offload_allowed=false',
] as const) assert(sourceLock.includes(gpuMemoryPolicy))
assert(sourceLock.includes(
  `reeditpro_gpu_decode_patch_sha256=${candidate.runtimeClosure.reeditproGpuDecodePatchSha256}`,
))
assert(sourceLock.includes(
  `reeditpro_patched_source_archive_sha256=${candidate.runtimeClosure.deterministicPatchedSourceArchiveSha256}`,
))
assert(sourceLock.includes(
  'caller_supplied_patched_source_archive_hash_allowed=false',
))
assert(sourceLock.includes(
  `exact_base_image_digest_observed=${candidate.runtimeClosure.candidateBaseImage.resolvedDigestSha256}`,
))
assert(sourceLock.includes(
  `cuda_forward_compat_package_sha256=${candidate.runtimeClosure.cudaDriverCompatibility.cudaForwardCompatibilitySha256}`,
))
for (const einopsProvenance of [
  'candidate_einops=0.8.2',
  'candidate_einops_private_object_generation=1786106120404202',
  'candidate_einops_ingest_receipt_generation=1786106528199762',
  'candidate_einops_ingest_receipt_sha256=d882124bbea8f586e16df53c7062ffce3d9e1499c350ae1ccec0b25fab870608',
  'candidate_einops_private_malware_scan_passed=true',
  'candidate_einops_developer_machine_install_performed=false',
  'sam_core_unconditionally_imports_einops=true',
] as const) assert(sourceLock.includes(einopsProvenance))
for (const pycocotoolsProvenance of [
  'candidate_pycocotools=2.0.11',
  'candidate_pycocotools_private_object_generation=1786112742762071',
  'candidate_pycocotools_ingest_receipt_generation=1786112748711226',
  'candidate_pycocotools_ingest_receipt_sha256=a47f679998c2a8d93d1f8e579a94a00bf4c9ca6ac9f7f40a9486a645177fdea3',
  'candidate_pycocotools_native_extension_import_verified=true',
  'candidate_pycocotools_private_malware_scan_passed=true',
  'candidate_pycocotools_developer_machine_install_performed=false',
  'sam_core_unconditionally_imports_pycocotools=true',
] as const) assert(sourceLock.includes(pycocotoolsProvenance))

const gpuDecodePatch = readFileSync(resolve(
  process.cwd(),
  'docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch',
), 'utf8')
assert.equal(
  createHash('sha256').update(gpuDecodePatch).digest('hex'),
  candidate.runtimeClosure.reeditproGpuDecodePatchSha256,
)
for (const requiredPatchFragment of [
  'gpu_acceleration: bool = False',
  'gpu_device: Optional[torch.device] = None',
  'init_kwargs["use_torchcodec"] = True',
  'init_kwargs["gpu_acceleration"] = True',
  'init_kwargs["gpu_device"] = torch.device("cuda")',
  'offload_state_to_cpu=False',
  'gpu_accelerated_decode=False',
  'gpu_accelerated_decode=gpu_accelerated_decode',
  'checkpoint_path=None',
  'strict_checkpoint_load: bool = False',
  'strict=strict_checkpoint_load',
  'return_cuda_output_tensors: bool = False',
  'reeditpro_return_cuda_output_tensors',
  '"out_binary_masks": out_binary_masks',
  'frame_to_result = {result[0]: result for result in final_results}',
  '"out_binary_masks": masks',
  'out_sam2_probs.unsqueeze(1).to(out_masks.device)',
]) assert(gpuDecodePatch.includes(requiredPatchFragment))
assert(gpuDecodePatch.includes('-                out_sam2_probs_cpu'))
assert(!gpuDecodePatch.includes('\n+                out_sam2_probs_cpu'))
const batchedCudaReturnIndex = gpuDecodePatch.indexOf(
  'frame_to_result = {result[0]: result for result in final_results}',
)
const batchedPinnedCpuBufferIndex = gpuDecodePatch.indexOf(
  '# ========== Phase 7: Concatenate for batched GPU→CPU copy ==========',
)
assert(batchedCudaReturnIndex >= 0)
assert(batchedPinnedCpuBufferIndex > batchedCudaReturnIndex)

const sam31Runner = readFileSync(resolve(
  process.cwd(),
  'docker/prod/gpu-worker/sam3_1/runner.py',
), 'utf8')
for (const requiredRunnerFragment of [
  'REEDITPRO_GPU_INVOCATION_ID',
  'FIXED_TASK_CONTRACT_HASH',
  'privateInputStagingEvidenceVersion',
  'validate_private_input_staging_evidence(',
  'read_task(task_path, invocation_id)',
  'responseMustBeCreateOnlyAndServerRereadBeforeAdmission',
  'persist_create_only_response(response)',
  'os.O_EXCL',
  '/mnt/reeditpro/private/canonical-professional-gpu/',
  '/gcs/reeditpro-production-reeditpro-masks/',
  '/gcs/reeditpro-production-reeditpro-model-artifacts/private/',
  'sam31-weeditpro-official-ingest-20260806-v12-bb0aa9fdb01770a4',
  'configure_execution_mounts(accelerator_class)',
  'execution_platform == "vertex_prediction_endpoint_v1"',
  'execution_platform == "vertex_custom_job_v1"',
  'execution_platform == "cloud_run_job_v1"',
  'VERTEX_PREDICTION_CHECKPOINT_PATH',
  'VERTEX_PREDICTION_PRIVATE_INVOCATION_PARENT',
  'environment value may select a bucket, object, checkpoint, or path.',
  'gpu_accelerated_decode=True',
  'async_loading_frames=True',
  'await_complete_gpu_frame_store(current_state)',
  'configure_gpu_memory_profile(',
  'a100_full_gpu_state_v1',
  'l4_gpu_only_full_semantic_streamed_grounding_postprocess_trimmed_memory_v6',
  'model.postprocess_batch_size = 1',
  'model.batched_grounding_batch_size = 1',
  'for _propagation_pass in range(1):',
  'prompt_object_ids != sorted(prompt_object_ids)',
  'trim_past_non_cond_mem_for_eval = True',
  'pastNonConditioningMemoryTrimmedOnGpu',
  'sam3_1_real_rope_cache_from_complex_buffer_v1',
  'install_sam31_multiplex_session_compatibility_guard(predictor)',
  'SAM 3.1 multiplex init_state signature changed',
  'SAM 3.1 multiplex init_state became open-ended',
  'EXPECTED_DETECTOR_ROPE_BLOCKS = tuple(range(32))',
  'checkpoint augmentation exceeded derived RoPE caches',
  '"offload_video_to_cpu": False',
  '"offload_state_to_cpu": False',
  'with torch.autocast(',
  'verify_bfloat16_autocast(torch)',
  'verify_gpu_frame_store(inference_state)',
  'getattr(mask.device, "type", None) != "cuda"',
  'mask.detach().to(',
  'OUTPUT_PERSISTENCE_WORKERS = 8',
  'MAXIMUM_PENDING_MASK_PERSISTENCE_TASKS = 16',
  'concurrent.futures.ThreadPoolExecutor(',
  'thread_name_prefix="sam31-mask-persistence"',
  'mask_records_by_key[completed_key] = completed_future.result()',
  'getattr(os, "O_NOFOLLOW", 0)',
  'prompt["promptFrameIndex"] != 0',
  'NvdecSampler()',
  'NVDEC_UTILIZATION_OBSERVATION_GRACE_SECONDS = 2.0',
  'self._ready = threading.Event()',
  'if not self._ready.wait(timeout=5):',
  'time.monotonic() < deadline',
  'GpuComputeSampler()',
  'strict_checkpoint_load=True',
  'return_cuda_output_tensors=True',
  'image.save(encoded, format="PNG"',
  'descriptor = os.open(path, flags, 0o600)',
  'digest != sha256_bytes(payload)',
  'WEEDITPRO_GPU_ACCELERATOR_CLASS',
  'WEEDITPRO_CUDA_DRIVER_LIBRARY_MODE',
  'validate_cuda_driver_library()',
  'loaded_cuda_driver_library_path()',
  'verify_ffmpeg_nvdec_runtime()',
  'install_torchcodec_gpu_decode_guard()',
  'core._get_backend_details(decoder._decoder)',
  '"CPU fallback" in details',
  'SAM 3.1 observed no CUDA/NVDEC video decode',
  'nvdec_utilization_not_observed',
  'nvdec_sampler_initialization_timeout',
]) assert(
  sam31Runner.includes(requiredRunnerFragment),
  `SAM 3.1 runner is missing ${requiredRunnerFragment}`,
)
assert.doesNotMatch(sam31Runner, /"type": "remove_object"/u)
assert(!sam31Runner.includes('predictor.remove_object('))
assert(!sam31Runner.includes('async_loading_frames=False'))
assert.equal(
  (sam31Runner.match(/install_sam31_multiplex_session_compatibility_guard/gmu)
    ?? []).length,
  2,
)
assert.match(
  sam31Runner,
  /"offload_state_to_cpu",\s*"async_loading_frames",\s*"use_torchcodec",\s*"use_cv2",\s*"input_is_mp4",\s*"gpu_acceleration",\s*"gpu_device"/u,
)
assert.match(sam31Runner, /SAM 3\.1 multiplex init_state signature changed/u)
assert.match(sam31Runner, /SAM 3\.1 multiplex init_state became open-ended/u)
assert(!sam31Runner.includes('cv2.VideoCapture'))
assert(!sam31Runner.includes('Image.open(SOURCE_PROXY_PATH'))
assert(!sam31Runner.includes('np.asarray(mask)'))
assert(!sam31Runner.includes('image.save(path'))
assert(!sam31Runner.includes('sys.stdin'))
assert(!sam31Runner.includes(
  '/mnt/reeditpro/private-source/mask-proxy.mp4',
))

const sam31Dockerfile = readFileSync(resolve(
  process.cwd(),
  'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
), 'utf8')
for (const requiredDockerfileFragment of [
  'nvidia/cuda@sha256:4b9ed5fa8361736996499f64ecebf25d4ec37ff56e4d11323ccde10aa36e0c43',
  'pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
  'COPY sam31_private_build_input/source/',
  'sam3-patched-source.tar',
  candidate.runtimeClosure.deterministicPatchedSourceArchiveSha256,
  'source-patch-application-receipt.json',
  'private-artifact-build-binding.json',
  'source-checkpoint-compatibility-receipt.json',
  'os-security-update-receipt.json',
  'openssl_3.0.13-0ubuntu3.12_amd64.deb',
  'libssl3t64_3.0.13-0ubuntu3.12_amd64.deb',
  'libssl-dev_3.0.13-0ubuntu3.12_amd64.deb',
  '0002-weeditpro-importlib-resources.patch',
  '6ce1e6954069aff28498284f4cd140cd9530a3f236d04bc507c799fe8ea3521f',
  'python -m pip uninstall --yes --break-system-packages',
  'python -m pip uninstall --yes --break-system-packages pip',
  'dpkg --purge',
  'python3-pip python3-wheel python3-setuptools python3-pkg-resources',
  "-name 'pip3.*'",
  '! command -v pip',
  "importlib.util.find_spec('pip') is None",
  "m.version('pillow') == '12.3.0'",
  "m.version('urllib3') == '2.7.0'",
  "importlib.util.find_spec('setuptools') is None",
  'SAM31_PRIVATE_ARTIFACT_BUILD_BINDING_FILE_SHA256',
  'SAM31_SOURCE_CHECKPOINT_COMPATIBILITY_RECEIPT_SHA256',
  'json.dumps(v,sort_keys=False',
  'SAM31_CUDA_FORWARD_COMPAT_INGEST_RECEIPT_SHA256',
  candidate.runtimeClosure.cudaDriverCompatibility
    .cudaForwardCompatibilityFileName,
  candidate.runtimeClosure.cudaDriverCompatibility
    .cudaForwardCompatibilitySha256,
  'dpkg-deb --extract',
  '/usr/local/cuda-12.8/compat/libcuda.so.1',
  'sys.version_info[:2] == (3, 12)',
  'PIP_NO_INDEX=1',
  'WEEDITPRO_PYTHON_VENV=/opt/weeditpro/python-venv',
  'ffmpeg-8.0.3.tar.gz',
  'pkgconf-3.0.4.tar.gz',
  'libnpp-12-8_12.3.3.100-1_amd64.deb',
  'cuda-npp-runtime-receipt.json',
  '/opt/weeditpro/cuda-npp/lib',
  'libnppicc.so.12',
  '/opt/weeditpro/cuda-npp/LICENSE',
  'cudaNppRuntimeReceiptSha256',
  'nv-codec-headers-n12.2.72.0.tar.gz',
  '/opt/weeditpro/pkgconf/bin/pkg-config',
  'pkgconfBuiltOfflineFromPinnedSource',
  'torchcodecCpuWheelAccepted',
  "m.version('torchcodec') == '0.10.0+cu128'",
  "m.version('einops') == '0.8.2'",
  '--enable-nvdec',
  '--enable-cuvid',
  '--disable-nvenc',
  '--disable-libnpp',
  '--require-hashes',
  '--no-index',
  'USER 65532:65532',
  'NVIDIA_DRIVER_CAPABILITIES=compute,utility,video',
  'ENTRYPOINT ["/opt/reeditpro/sam3_1/entrypoint.sh"]',
]) assert(
  sam31Dockerfile.includes(requiredDockerfileFragment),
  `SAM 3.1 candidate lost ${requiredDockerfileFragment}`,
)
assert(!sam31Dockerfile.includes('json.dumps(v,sort_keys=True'))
assert(sam31Runner.includes('EXPECTED_EINOPS_VERSION = "0.8.2"'))
assert(sam31Runner.includes(
  'importlib.metadata.version("einops") != EXPECTED_EINOPS_VERSION',
))
assert.equal((sam31Dockerfile.match(/^RUN --network=none /gmu) ?? []).length, 0)
assert.equal((sam31Dockerfile.match(/^RUN /gmu) ?? []).length, 3)
for (const forbiddenDockerfileFragment of [
  'ADD http://',
  'ADD https://',
  'curl ',
  'wget ',
  'huggingface-cli',
  'sam3.1_multiplex.pt /',
]) assert(!sam31Dockerfile.includes(forbiddenDockerfileFragment))
assert(!sam31Dockerfile.includes('ARG SAM31_PATCHED_SOURCE_ARCHIVE_SHA256'))

const sam31Entrypoint = readFileSync(resolve(
  process.cwd(),
  'docker/prod/gpu-worker/sam3_1/entrypoint.sh',
), 'utf8')
for (const requiredEntrypointFragment of [
  'WEEDITPRO_GPU_ACCELERATOR_CLASS',
  '/proc/driver/nvidia/version',
  'driver_major}" -ge 535',
  'driver_major}" -lt 570',
  '/usr/local/cuda-12.8/compat',
  'WEEDITPRO_CUDA_DRIVER_LIBRARY_MODE=cuda_compat_12_8',
  'WEEDITPRO_CUDA_DRIVER_LIBRARY_MODE=host_driver',
  '/opt/weeditpro/ffmpeg/lib/libavcodec.so.62',
  'runtime_library_paths=',
  'exec /opt/weeditpro/python-venv/bin/python',
]) assert(sam31Entrypoint.includes(requiredEntrypointFragment))

assert.doesNotMatch(
  sam31Entrypoint,
  /Kernel Module\[\[:space:\]\]\*\\\(\[0-9\]\[0-9\.\]\*\\\)/u,
)
const sam31DriverParser = sam31Entrypoint.match(
  /driver_version="\$\(\n[ ]{2}awk '\n(?<program>[\s\S]*?)\n[ ]{2}' "\$\{driver_version_file\}"\n\)"/u,
)?.groups?.program
assert.ok(
  sam31DriverParser,
  'the exact SAM 3.1 runtime driver parser must remain testable',
)
const parseSam31DriverVersion = (source: string) => execFileSync(
  'awk',
  [sam31DriverParser],
  { input: source, encoding: 'utf8' },
).trim()
assert.equal(
  parseSam31DriverVersion(
    'NVRM version: NVIDIA UNIX x86_64 Kernel Module  535.216.03  Thu Apr  3 01:14:19 UTC 2025\n',
  ),
  '535.216.03',
)
assert.equal(
  parseSam31DriverVersion(
    'NVRM version: NVIDIA UNIX Open Kernel Module for x86_64  580.95.05  Release Build\n',
  ),
  '580.95.05',
)
assert.equal(
  parseSam31DriverVersion(
    'NVRM version: NVIDIA UNIX Open Kernel Module for x86_64 malformed\n',
  ),
  '',
)
assert.equal(
  parseSam31DriverVersion('compiler: gcc version 12.2.0\n'),
  '',
)

const adversarial: Array<(
  value: CanonicalSam31SourceRuntimeCandidate,
) => void> = [
  (value) => {
    value.replacement.sam2MayAuthorizeNewPlanWorkFallbackOrRepair =
      true as never
  },
  (value) => {
    value.officialCheckpoint.automatedTermsAcceptanceAllowed = true as never
  },
  (value) => {
    value.officialCheckpoint.thirdPartyMirrorOrScanMaySatisfyCanonicalIngest =
      true as never
  },
  (value) => {
    value.officialCheckpoint.thirdPartyMirrorDownloadAllowed = true as never
  },
  (value) => {
    value.fixedApi.useFlashAttention3 = true as never
  },
  (value) => {
    value.fixedApi.maximumTrackedObjectsProductCap = 128 as never
  },
  (value) => {
    value.fixedApi.lifecycleRequestOrder = [
      'start_session',
      'propagate_in_video',
      'add_prompt',
      'close_session',
    ] as never
  },
  (value) => {
    value.fixedApi.callerRawChatOrExecutableTextAllowed = true as never
  },
  (value) => {
    value.fixedApi.cpuOpenCvOrPillowDecodeAllowed = true as never
  },
  (value) => {
    value.fixedApi.runtimeNetworkOrHuggingFaceDownloadAllowed = true as never
  },
  (value) => {
    value.compute.cpuOnlyHeavyExecutionAllowed = true as never
  },
  (value) => {
    value.runtimeClosure.cudaDriverCompatibility
      .networkPackageInstallAllowed = true as never
  },
  (value) => {
    value.runtimeClosure.cudaDriverCompatibility
      .l4CompatibilityQualified = true as never
  },
  (value) => {
    value.compute.costOnlyFallbackAllowed = true as never
  },
  (value) => {
    value.compute.primaryProfileId =
      'quality_l4_user_triggered_heavy_fallback_job_v1' as never
  },
  (value) => {
    value.authority.runtimeExecuted = true as never
  },
  (value) => {
    value.authority.productionReady = true as never
  },
]

for (const mutate of adversarial) {
  const tampered = structuredClone(candidate)
  mutate(tampered)
  const payload = { ...tampered }
  Reflect.deleteProperty(payload, 'candidateHash')
  tampered.candidateHash = sha256AuthorityValue(payload)
  assert.throws(() => assertCanonicalSam31SourceRuntimeCandidate(tampered))
}

const wrongHash = structuredClone(candidate)
wrongHash.candidateHash = '0'.repeat(64)
assert.throws(() => assertCanonicalSam31SourceRuntimeCandidate(wrongHash))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-source-runtime-candidate',
  checks: 154,
  operationId: candidate.operationId,
  sourceRevision: candidate.officialSource.sourceRevision,
  checkpointRevision: candidate.officialCheckpoint.repositoryRevision,
  checkpointCanonicalHashPending:
    candidate.officialCheckpoint.exactDownloadedSha256 === null,
  primaryGpu: candidate.compute.primaryProfileId,
  fallbackGpu: candidate.compute.fallbackProfileId,
  adversarialCases: adversarial.length + 1,
  runtimeExecuted: candidate.authority.runtimeExecuted,
  productionReady: candidate.authority.productionReady,
  candidateHash: candidate.candidateHash,
}))
