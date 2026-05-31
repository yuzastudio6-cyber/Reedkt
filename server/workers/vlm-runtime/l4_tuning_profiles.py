from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional


MATRIX_ID = "l4-oom-remediation-v1"


@dataclass(frozen=True)
class L4TuningProfile:
    profile_id: str
    description: str
    max_model_len: Optional[int]
    max_num_seqs: int
    max_num_batched_tokens: int
    max_tokens: int
    image_max_size: int
    enforce_eager: bool
    gpu_memory_utilization: float
    mm_processor_cache_gb: Optional[float]
    cpu_offload_gb: Optional[float]
    expected_memory_effect: str
    diagnostic_only: bool = False
    fixture_ids: Optional[List[str]] = None
    unsupported_reason: Optional[str] = None

    def to_report(self) -> Dict[str, Any]:
        launch_args = {
            "max_model_len": self.max_model_len,
            "max_num_seqs": self.max_num_seqs,
            "max_num_batched_tokens": self.max_num_batched_tokens,
            "limit_mm_per_prompt": {"image": 1},
            "enforce_eager": self.enforce_eager,
            "gpu_memory_utilization": self.gpu_memory_utilization,
            "mm_processor_cache_gb": self.mm_processor_cache_gb,
            "cpu_offload_gb": self.cpu_offload_gb,
        }
        return {
            "profileId": self.profile_id,
            "description": self.description,
            "matrixId": MATRIX_ID,
            "launchArgs": {key: value for key, value in launch_args.items() if value is not None},
            "fixtureImageConstraints": {
                "generatedOnly": True,
                "maxSizePx": self.image_max_size,
                "imageCountPerPrompt": 1,
            },
            "promptOutputTokenBudget": {
                "temperature": 0,
                "topP": 1,
                "maxTokens": self.max_tokens,
            },
            "expectedMemoryEffect": self.expected_memory_effect,
            "safetyStatus": "allowed" if self.unsupported_reason is None else "skipped_unsupported",
            "diagnosticOnly": self.diagnostic_only,
            "fixtureIds": self.fixture_ids,
            "passCriteria": [
                "Uses verified local Phase 39B model directory only.",
                "Runs generated fixtures only with bounded prompt templates.",
                "Returns structured JSON that passes Phase 39C QA gates.",
            ],
            "blockCriteria": [
                "Any runtime model auto-download attempt.",
                "Any provider, raw prompt, real media, public output, or Track A behavior.",
                "vLLM initialization, inference, schema, object-region, safe-zone, hallucination, or upload failure.",
            ],
            "unsupportedReason": self.unsupported_reason,
        }


PROFILES: Dict[str, L4TuningProfile] = {
    "conservative-eager-short-context": L4TuningProfile(
        profile_id="conservative-eager-short-context",
        description="Short context, eager execution, one image per prompt, and tiny multimodal cache to reduce startup/KV pressure on L4.",
        max_model_len=2048,
        max_num_seqs=1,
        max_num_batched_tokens=1024,
        max_tokens=128,
        image_max_size=384,
        enforce_eager=True,
        gpu_memory_utilization=0.92,
        mm_processor_cache_gb=0,
        cpu_offload_gb=None,
        expected_memory_effect="Reduces context/KV and multimodal processor cache while avoiding CUDA graph capture.",
    ),
    "conservative-cuda-graph-lower-reservation": L4TuningProfile(
        profile_id="conservative-cuda-graph-lower-reservation",
        description="Lower GPU reservation and smaller generated fixtures while allowing CUDA graph behavior if vLLM selects it.",
        max_model_len=2048,
        max_num_seqs=1,
        max_num_batched_tokens=1024,
        max_tokens=128,
        image_max_size=256,
        enforce_eager=False,
        gpu_memory_utilization=0.82,
        mm_processor_cache_gb=0,
        cpu_offload_gb=None,
        expected_memory_effect="Leaves more unreserved L4 memory and reduces image token pressure.",
    ),
    "auto-fit-context": L4TuningProfile(
        profile_id="auto-fit-context",
        description="Reserved for a vLLM-supported safe auto-fit context mode.",
        max_model_len=None,
        max_num_seqs=1,
        max_num_batched_tokens=1024,
        max_tokens=128,
        image_max_size=256,
        enforce_eager=True,
        gpu_memory_utilization=0.9,
        mm_processor_cache_gb=0,
        cpu_offload_gb=None,
        expected_memory_effect="Would allow vLLM to choose a smaller safe context if a supported auto-fit API exists.",
        unsupported_reason="vLLM 0.11.0 LLM API does not expose a safe max_model_len auto-fit value for this worker path.",
    ),
    "cpu-offload-short-context": L4TuningProfile(
        profile_id="cpu-offload-short-context",
        description="Short context plus CPU offload for the same approved model assets; requires 64Gi Cloud Run memory.",
        max_model_len=2048,
        max_num_seqs=1,
        max_num_batched_tokens=1024,
        max_tokens=128,
        image_max_size=256,
        enforce_eager=True,
        gpu_memory_utilization=0.9,
        mm_processor_cache_gb=0,
        cpu_offload_gb=8,
        expected_memory_effect="Moves up to 8Gi of model weights/activation pressure to CPU memory while keeping the L4 GPU class.",
    ),
    "minimal-smoke-one-fixture": L4TuningProfile(
        profile_id="minimal-smoke-one-fixture",
        description="Diagnostic-only one-fixture smoke to determine whether any generated VLM inference can run on L4.",
        max_model_len=1024,
        max_num_seqs=1,
        max_num_batched_tokens=512,
        max_tokens=64,
        image_max_size=224,
        enforce_eager=True,
        gpu_memory_utilization=0.9,
        mm_processor_cache_gb=0,
        cpu_offload_gb=None,
        expected_memory_effect="Smallest approved L4 smoke envelope; cannot complete Phase 39C by itself.",
        diagnostic_only=True,
        fixture_ids=["generated-object-layout"],
    ),
}


DEFAULT_PROFILE_IDS = [
    "conservative-eager-short-context",
    "conservative-cuda-graph-lower-reservation",
    "auto-fit-context",
]


def get_profile(profile_id: str) -> L4TuningProfile:
    if profile_id not in PROFILES:
        raise ValueError(f"unknown Phase 39C L4 tuning profile: {profile_id}")
    return PROFILES[profile_id]


def profile_ids_from_env(value: Optional[str]) -> List[str]:
    if not value:
        return DEFAULT_PROFILE_IDS
    ids = [item.strip() for item in value.split(",") if item.strip()]
    if not ids:
        return DEFAULT_PROFILE_IDS
    for profile_id in ids:
        get_profile(profile_id)
    return ids


def all_profile_reports() -> List[Dict[str, Any]]:
    return [profile.to_report() for profile in PROFILES.values()]
