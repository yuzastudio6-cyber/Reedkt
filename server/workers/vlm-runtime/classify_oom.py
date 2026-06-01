from __future__ import annotations

import re
from typing import Any, Dict, Optional


OOM_RE = re.compile(
    r"Tried to allocate (?P<requested>[0-9.]+) GiB\. GPU 0 has a total capacity of (?P<total>[0-9.]+) GiB of which (?P<free>[0-9.]+) GiB is free\. Process (?P<process>[0-9]+) has (?P<process_gib>[0-9.]+) GiB memory in use\. Of the allocated memory (?P<allocated>[0-9.]+) GiB is allocated by PyTorch, and (?P<reserved>[0-9.]+) MiB is reserved by PyTorch but unallocated",
    re.MULTILINE,
)


def classify_oom(text: str, *, enforce_eager: Optional[bool] = None) -> Dict[str, Any]:
    lowered = text.lower()
    is_cuda_oom = "cuda out of memory" in lowered or "torch.outofmemoryerror" in lowered
    stage = "not_oom"
    if is_cuda_oom:
        if "llm = llm(" in lowered or "enginecoreclient.make_client" in lowered or "wait_for_engine_startup" in lowered:
            stage = "vllm_engine_initialization"
        elif "profile" in lowered and ("kv" in lowered or "cache" in lowered):
            stage = "scheduler_or_kv_cache_profile"
        elif "cuda graph" in lowered or "cudagraph" in lowered:
            stage = "cuda_graph_capture"
        elif "generate(" in lowered or "llm.generate" in lowered:
            stage = "generated_fixture_inference"
        else:
            stage = "unclassified_cuda_oom"
    if is_cuda_oom and enforce_eager is True and stage == "cuda_graph_capture":
        stage = "vllm_engine_initialization"

    memory: Dict[str, Any] = {}
    match = OOM_RE.search(text)
    if match:
        memory = {
            "requestedGiB": float(match.group("requested")),
            "gpuTotalGiB": float(match.group("total")),
            "gpuFreeGiB": float(match.group("free")),
            "processId": match.group("process"),
            "processMemoryGiB": float(match.group("process_gib")),
            "torchAllocatedGiB": float(match.group("allocated")),
            "torchReservedUnallocatedMiB": float(match.group("reserved")),
        }

    return {
        "isCudaOom": is_cuda_oom,
        "stage": stage,
        "enforceEager": enforce_eager,
        "cudaGraphLikely": bool(is_cuda_oom and ("cuda graph" in lowered or "cudagraph" in lowered) and enforce_eager is not True),
        "fixtureInferenceReached": "llm.generate" in lowered or "generated fixture" in lowered and "fixtureResults" in text,
        "memory": memory,
        "safeSummary": summarize_oom(text, stage, memory),
    }


def summarize_oom(text: str, stage: str, memory: Dict[str, Any]) -> str:
    if not ("cuda out of memory" in text.lower() or "torch.outofmemoryerror" in text.lower()):
        return "No CUDA OOM signature detected."
    if memory:
        return (
            f"CUDA OOM during {stage}: requested {memory['requestedGiB']} GiB with "
            f"{memory['gpuFreeGiB']} GiB free on {memory['gpuTotalGiB']} GiB L4; "
            f"process used {memory['processMemoryGiB']} GiB and PyTorch had "
            f"{memory['torchAllocatedGiB']} GiB allocated."
        )
    return f"CUDA OOM during {stage}; memory counters were not fully parseable."
