import type { ToolReadinessPolicySummary } from "./tool-readiness-types.js";

export const TOOL_READINESS_PROMPT = "13" as const;

export const TOOL_READINESS_POLICY: ToolReadinessPolicySummary = {
  prompt: TOOL_READINESS_PROMPT,
  scope:
    "Backend-safe tool readiness classification, static worker runtime compatibility checks, and fail-closed diagnostics only.",
  defaultState: "not_configured",
  runtimeExecutionAllowed: false,
  providerExecutionAllowed: false,
  mediaProcessingAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  productionAllowed: false,
  externalBetaAllowed: false,
  broadRealMediaAllowed: false,
};

export const TOOL_READINESS_NO_SCOPE = [
  "tool package installation",
  "tool runtime execution",
  "provider calls",
  "media processing",
  "browser capture",
  "rendering",
  "export",
  "job creation",
  "worker claim or execution",
  "credit mutation",
  "storage transfer",
  "signed URL creation",
  "remote Supabase migration",
  "SQL execution",
  "deployment",
  "Stripe flow",
  "production or beta unlock",
] as const;

export const HEAVY_TOOL_FAMILIES = [
  "visual_video",
  "audio",
  "ocr",
  "vlm",
  "web_capture",
] as const;

export const REQUIRED_TOOL_IDS = [
  "ffmpeg",
  "ffprobe",
  "libass",
  "remotion",
  "opentimelineio",
  "opencolorio",
  "openimageio",
  "kornia",
  "birefnet",
  "sam2",
  "real-esrgan",
  "film",
  "deepfilternet",
  "demucs",
  "paddleocr",
  "paddlepaddle",
  "qwen-vl",
  "vllm",
  "playwright",
  "sharp",
  "searxng",
  "readability",
  "maplibre",
  "turf",
  "deckgl",
  "cesium",
  "d3",
] as const;

export const FUTURE_ACTIVATION_NOTE =
  "Future activation requires an approved immutable plan snapshot, private artifact evidence, worker boundary enforcement, and explicit runtime phase approval.";
