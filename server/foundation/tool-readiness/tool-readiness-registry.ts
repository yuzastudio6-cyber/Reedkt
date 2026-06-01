import {
  FUTURE_ACTIVATION_NOTE,
  REQUIRED_TOOL_IDS,
} from "./tool-readiness-policy.js";
import type {
  ToolReadinessFamily,
  ToolReadinessState,
  ToolReadinessTrack,
  ToolRuntimeRequirement,
} from "./tool-readiness-types.js";

type ToolReadinessEntryInput = Pick<
  ToolRuntimeRequirement,
  "toolId" | "displayName" | "family" | "track" | "readinessState"
> &
  Partial<
    Omit<
      ToolRuntimeRequirement,
      "toolId" | "displayName" | "family" | "track" | "readinessState"
    >
  >;

const BLOCKED_STATES = new Set<ToolReadinessState>([
  "blocked_missing_runtime",
  "blocked_missing_approval",
  "blocked_missing_secret",
  "blocked_by_policy",
  "disabled",
  "never_public",
  "not_configured",
]);

function defaultBlockedReason(state: ToolReadinessState): string | null {
  if (!BLOCKED_STATES.has(state)) {
    return null;
  }

  return `Tool is ${state} in Prompt 13; ${FUTURE_ACTIVATION_NOTE}`;
}

function entry(input: ToolReadinessEntryInput): ToolRuntimeRequirement {
  return {
    allowedInPlanning: true,
    allowedInReadinessCheck: false,
    allowedInMock: false,
    allowedInRuntime: false,
    requiresWorker: false,
    requiredWorkerType: null,
    requiresDockerImage: false,
    requiresCloudRunJob: false,
    requiresGPU: false,
    allowedGpuType: null,
    requiresModelArtifact: false,
    modelArtifactRequiredPath: null,
    requiresSecret: false,
    secretNames: [],
    requiresProvider: false,
    requiresStorageRead: false,
    requiresStorageWrite: false,
    requiresSignedUrl: false,
    requiresFrontendExecution: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    broadRealMediaAllowed: false,
    blockedReason: defaultBlockedReason(input.readinessState),
    nextRequiredPhase: FUTURE_ACTIVATION_NOTE,
    ...input,
  };
}

function workerReady(
  toolId: string,
  displayName: string,
  family: ToolReadinessFamily,
  track: ToolReadinessTrack,
  requiredWorkerType: string,
  options: Partial<ToolRuntimeRequirement> = {},
): ToolRuntimeRequirement {
  return entry({
    toolId,
    displayName,
    family,
    track,
    readinessState: "ready_for_future_activation",
    allowedInReadinessCheck: true,
    requiresWorker: true,
    requiredWorkerType,
    requiresDockerImage: true,
    requiresCloudRunJob: true,
    requiresStorageRead: true,
    requiresStorageWrite: true,
    blockedReason: null,
    ...options,
  });
}

function planningOnly(
  toolId: string,
  displayName: string,
  family: ToolReadinessFamily,
  track: ToolReadinessTrack,
  options: Partial<ToolRuntimeRequirement> = {},
): ToolRuntimeRequirement {
  return entry({
    toolId,
    displayName,
    family,
    track,
    readinessState: "planning_only",
    nextRequiredPhase: "Future tool approval/download/runtime milestone.",
    ...options,
  });
}

export const TOOL_READINESS_REGISTRY: ToolRuntimeRequirement[] = [
  workerReady("ffmpeg", "FFmpeg", "visual_video", "track_a_visual_video", "video-tool-worker", {
    allowedInMock: true,
  }),
  workerReady("ffprobe", "FFprobe", "visual_video", "track_a_visual_video", "video-tool-worker", {
    allowedInMock: true,
  }),
  workerReady("libass", "libass", "visual_video", "track_a_visual_video", "render-hardening-worker"),
  workerReady("remotion", "Remotion", "visual_video", "track_a_visual_video", "render-worker"),
  workerReady(
    "opentimelineio",
    "OpenTimelineIO",
    "visual_video",
    "track_a_visual_video",
    "timeline-worker",
  ),
  workerReady("opencolorio", "OpenColorIO", "visual_video", "track_a_visual_video", "color-worker"),
  workerReady("openimageio", "OpenImageIO", "visual_video", "track_a_visual_video", "image-worker"),
  workerReady("kornia", "Kornia", "visual_video", "track_a_visual_video", "color-image-worker"),
  workerReady("birefnet", "BiRefNet", "visual_video", "track_a_visual_video", "mask-worker", {
    requiresGPU: true,
    allowedGpuType: "nvidia-l4",
    requiresModelArtifact: true,
    modelArtifactRequiredPath: "private staging model artifact evidence required before runtime activation",
  }),
  workerReady("sam2", "SAM2", "visual_video", "track_a_visual_video", "mask-worker", {
    requiresGPU: true,
    allowedGpuType: "nvidia-l4",
    requiresModelArtifact: true,
    modelArtifactRequiredPath: "private staging SAM2 model artifact evidence required before runtime activation",
  }),
  workerReady(
    "real-esrgan",
    "Real-ESRGAN",
    "visual_video",
    "track_a_visual_video",
    "upscale-worker",
    {
      requiresGPU: true,
      allowedGpuType: "nvidia-l4",
      requiresModelArtifact: true,
      modelArtifactRequiredPath: "private staging Real-ESRGAN model artifact evidence required before runtime activation",
    },
  ),
  workerReady("film", "FILM", "visual_video", "track_a_visual_video", "interpolation-worker", {
    requiresGPU: true,
    allowedGpuType: "nvidia-l4",
    requiresModelArtifact: true,
    modelArtifactRequiredPath: "private staging FILM model artifact evidence required before runtime activation",
  }),

  workerReady(
    "deepfilternet",
    "DeepFilterNet",
    "audio",
    "track_b_audio",
    "audio-cleanup-worker",
    {
      readinessState: "readiness_check_only",
      requiresModelArtifact: true,
      modelArtifactRequiredPath: "private staging DeepFilterNet artifact evidence required before runtime activation",
      blockedReason: null,
      nextRequiredPhase: "Future worker execution contract hardening before runtime activation.",
    },
  ),
  entry({
    toolId: "demucs",
    displayName: "Demucs",
    family: "audio",
    track: "track_b_audio",
    readinessState: "blocked_missing_approval",
    allowedInPlanning: true,
    requiresWorker: true,
    requiredWorkerType: "audio-separation-worker",
    requiresDockerImage: true,
    requiresCloudRunJob: true,
    requiresModelArtifact: true,
    modelArtifactRequiredPath: "models/demucs/approved/htdemucs-or-company-model/approval.json",
    requiresStorageRead: true,
    requiresStorageWrite: true,
    blockedReason:
      "Demucs runtime remains blocked until model license, provenance, approval manifest, and checksum evidence are company-approved outside git.",
    nextRequiredPhase: "Demucs approved model artifact gate.",
  }),
  planningOnly("paddleocr", "PaddleOCR", "ocr", "track_b_ocr", {
    requiresWorker: true,
    requiredWorkerType: "ocr-worker",
    requiresDockerImage: true,
    requiresCloudRunJob: true,
    requiresModelArtifact: true,
    modelArtifactRequiredPath: "private staging PaddleOCR artifact selection deferred to a later phase",
  }),
  planningOnly("paddlepaddle", "PaddlePaddle", "ocr", "track_b_ocr", {
    requiresWorker: true,
    requiredWorkerType: "ocr-worker",
    requiresDockerImage: true,
    requiresCloudRunJob: true,
  }),
  entry({
    toolId: "qwen-vl",
    displayName: "Qwen VL",
    family: "vlm",
    track: "track_b_vlm",
    readinessState: "blocked_by_policy",
    allowedInPlanning: true,
    requiresWorker: true,
    requiredWorkerType: "vlm-worker",
    requiresDockerImage: true,
    requiresCloudRunJob: true,
    requiresGPU: true,
    allowedGpuType: "nvidia-l4",
    requiresModelArtifact: true,
    modelArtifactRequiredPath: "future approved smaller, quantized, or redesigned VLM artifact required",
    requiresStorageRead: true,
    requiresStorageWrite: true,
    blockedReason:
      "VLM is excluded from initial internal testing; the approved Qwen VL path is blocked on L4/vLLM CUDA OOM and needs a later approved resolution.",
    nextRequiredPhase: "Future VLM blocker resolution or exclusion update.",
  }),
  entry({
    toolId: "vllm",
    displayName: "vLLM",
    family: "vlm",
    track: "track_b_vlm",
    readinessState: "blocked_by_policy",
    allowedInPlanning: true,
    requiresWorker: true,
    requiredWorkerType: "vlm-worker",
    requiresDockerImage: true,
    requiresCloudRunJob: true,
    requiresGPU: true,
    allowedGpuType: "nvidia-l4",
    requiresModelArtifact: true,
    modelArtifactRequiredPath: "future approved VLM runtime profile required",
    requiresStorageRead: true,
    requiresStorageWrite: true,
    blockedReason:
      "vLLM runtime is excluded from initial internal testing after the approved L4 profile hit CUDA OOM during engine initialization.",
    nextRequiredPhase: "Future VLM runtime redesign or alternate approved model/GPU profile.",
  }),
  planningOnly("playwright", "Playwright", "web_capture", "track_b_hybrid", {
    requiresWorker: true,
    requiredWorkerType: "browser-capture-worker",
    requiresDockerImage: true,
    requiresCloudRunJob: true,
  }),
  planningOnly("sharp", "Sharp/libvips", "visual_video", "track_b_hybrid", {
    requiresWorker: true,
    requiredWorkerType: "image-tool-worker",
    requiresDockerImage: true,
    requiresCloudRunJob: true,
  }),
  planningOnly("searxng", "SearXNG", "data", "track_b_data"),
  planningOnly("readability", "Readability", "data", "track_b_data"),
  planningOnly("maplibre", "MapLibre", "maps", "track_b_hybrid"),
  planningOnly("turf", "Turf", "maps", "track_b_hybrid"),
  planningOnly("deckgl", "deck.gl", "maps", "track_b_hybrid"),
  planningOnly("cesium", "Cesium", "maps", "track_b_hybrid"),
  planningOnly("d3", "D3", "charts", "track_b_hybrid"),
  planningOnly("opencv", "OpenCV", "visual_video", "track_b_hybrid", {
    requiresWorker: true,
    requiredWorkerType: "video-analysis-worker",
    requiresDockerImage: true,
    requiresCloudRunJob: true,
  }),
  planningOnly("pyav", "PyAV", "visual_video", "track_b_hybrid", {
    requiresWorker: true,
    requiredWorkerType: "video-analysis-worker",
    requiresDockerImage: true,
    requiresCloudRunJob: true,
  }),
  planningOnly("pyscenedetect", "PySceneDetect", "visual_video", "track_b_hybrid", {
    requiresWorker: true,
    requiredWorkerType: "video-analysis-worker",
    requiresDockerImage: true,
    requiresCloudRunJob: true,
  }),
  planningOnly("duckdb", "DuckDB", "data", "track_b_data"),
  planningOnly("polars", "Polars", "data", "track_b_data"),
  entry({
    toolId: "provider-gateway",
    displayName: "Provider gateway",
    family: "provider",
    track: "blocked_provider",
    readinessState: "disabled",
    allowedInPlanning: false,
    requiresSecret: true,
    secretNames: ["future_provider_secret_reference"],
    requiresProvider: true,
    blockedReason:
      "Provider execution is explicitly disabled in Prompt 13 and remains backend/worker-only for future approved phases.",
    nextRequiredPhase: "Future provider approval, secret-boundary, billing, and worker execution phase.",
  }),
];

export const TOOL_READINESS_TOOL_IDS = TOOL_READINESS_REGISTRY.map((tool) => tool.toolId);

export function listToolReadinessEntries(): ToolRuntimeRequirement[] {
  return TOOL_READINESS_REGISTRY.map((tool) => ({ ...tool, secretNames: [...tool.secretNames] }));
}

export function getToolReadinessEntry(toolId: string): ToolRuntimeRequirement | null {
  const normalizedToolId = toolId.trim().toLowerCase();
  const tool = TOOL_READINESS_REGISTRY.find((entry) => entry.toolId === normalizedToolId);
  return tool ? { ...tool, secretNames: [...tool.secretNames] } : null;
}

export function getMissingRequiredToolIds(): string[] {
  const known = new Set(TOOL_READINESS_TOOL_IDS);
  return REQUIRED_TOOL_IDS.filter((toolId) => !known.has(toolId));
}
