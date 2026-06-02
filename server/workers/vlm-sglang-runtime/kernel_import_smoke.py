#!/usr/bin/env python3
from __future__ import annotations

import ctypes
import importlib
import importlib.metadata
import json
import os
import platform
import subprocess
import sys
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from google.cloud import storage


QA_BUCKET = "reeditpro-staging-reeditpro-qa-artifacts"
REPORT_NAME = "phase_39c_sg_kernel_import_smoke_report.json"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def safe_version(package: str) -> Dict[str, Any]:
    try:
        return {"package": package, "version": importlib.metadata.version(package), "status": "present"}
    except Exception as exc:
        return {"package": package, "version": None, "status": "missing", "error": str(exc)[:240]}


def safe_run(command: List[str], timeout: int = 30) -> Dict[str, Any]:
    try:
        result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=timeout)
        return {
            "command": command,
            "returncode": result.returncode,
            "stdoutExcerpt": result.stdout[-2000:],
            "stderrExcerpt": result.stderr[-2000:],
        }
    except Exception as exc:
        return {"command": command, "returncode": None, "error": str(exc)[:500]}


def attempt_import(module_name: str) -> Dict[str, Any]:
    try:
        module = importlib.import_module(module_name)
        return {
            "module": module_name,
            "status": "passed",
            "path": str(getattr(module, "__file__", ""))[:500],
        }
    except Exception as exc:
        return {
            "module": module_name,
            "status": "blocked",
            "exceptionClass": exc.__class__.__name__,
            "message": str(exc)[:1000],
            "tracebackExcerpt": traceback.format_exc()[-3000:],
        }


def cuda_symbol_probe() -> Dict[str, Any]:
    result: Dict[str, Any] = {"status": "not_checked", "symbols": {}}
    try:
        libcuda = ctypes.CDLL("libcuda.so.1")
        result["status"] = "loaded"
        for symbol in ["cuInit", "cuDriverGetVersion", "cuGreenCtxDestroy"]:
            try:
                getattr(libcuda, symbol)
                result["symbols"][symbol] = "present"
            except AttributeError:
                result["symbols"][symbol] = "missing"
    except Exception as exc:
        result = {"status": "blocked", "error": str(exc)[:500], "symbols": {}}
    return result


def torch_diagnostics() -> Dict[str, Any]:
    diagnostics: Dict[str, Any] = {"status": "not_imported"}
    try:
        import torch

        diagnostics = {
            "status": "passed",
            "version": str(torch.__version__),
            "cudaVersion": str(torch.version.cuda),
            "cudaAvailable": bool(torch.cuda.is_available()),
            "deviceCount": int(torch.cuda.device_count()) if torch.cuda.is_available() else 0,
            "devices": [],
        }
        if torch.cuda.is_available():
            for index in range(torch.cuda.device_count()):
                props = torch.cuda.get_device_properties(index)
                diagnostics["devices"].append({
                    "index": index,
                    "name": props.name,
                    "major": props.major,
                    "minor": props.minor,
                    "totalMemoryBytes": props.total_memory,
                })
    except Exception as exc:
        diagnostics = {
            "status": "blocked",
            "exceptionClass": exc.__class__.__name__,
            "message": str(exc)[:1000],
            "tracebackExcerpt": traceback.format_exc()[-3000:],
        }
    return diagnostics


def validate_env(blockers: List[str]) -> None:
    required = {
        "GCP_PROJECT_ID": "reeditpro",
        "GCP_REGION": "us-central1",
        "REEDITPRO_ENV": "staging",
        "REEDITPRO_CONFIRM_VLM_SGLANG_KERNEL_COMPAT": "true",
        "REEDITPRO_CONFIRM_VLM_SGLANG_IMPORT_SMOKE_JOB": "true",
        "REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD": "true",
        "REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE": "true",
        "GENERATED_VLM_FIXTURES_ONLY": "true",
        "HF_HUB_OFFLINE": "1",
        "TRANSFORMERS_OFFLINE": "1",
        "MODEL_DOWNLOADS_ENABLED": "false",
        "PROVIDER_EXECUTION_ENABLED": "false",
        "RAW_VLM_PROMPT_ENABLED": "false",
        "MEDIA_PROCESSING_ENABLED": "false",
        "REAL_MEDIA_INPUT_ENABLED": "false",
        "ARBITRARY_MEDIA_INPUT_ENABLED": "false",
        "PUBLIC_OUTPUT_ENABLED": "false",
        "REEDITPRO_PRODUCTION_READY": "false",
        "REEDITPRO_INTERNAL_BETA_READY": "false",
        "REEDITPRO_EXTERNAL_BETA_READY": "false",
        "REEDITPRO_BROAD_REAL_MEDIA_READY": "false",
        "TRACK_A_EXECUTION_ENABLED": "false",
    }
    for key, expected in required.items():
        if os.environ.get(key) != expected:
            blockers.append(f"env_guard_mismatch:{key}")
    if os.environ.get("REEDITPRO_VLM_MODEL_GCS_PATH"):
        blockers.append("import_smoke_must_not_receive_model_gcs_path")
    if os.environ.get("REEDITPRO_VLM_EXPECTED_ASSETS_JSON"):
        blockers.append("import_smoke_must_not_receive_model_asset_manifest")


def upload_report(report: Dict[str, Any], local_path: Path) -> Dict[str, Any]:
    local_path.parent.mkdir(parents=True, exist_ok=True)
    local_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    if os.environ.get("REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD") != "true":
        raise RuntimeError("artifact_upload_confirmation_missing")
    bucket_name = os.environ.get("REEDITPRO_PHASE39C_QA_BUCKET", QA_BUCKET)
    prefix = os.environ.get("REEDITPRO_PHASE39C_QA_PREFIX")
    if not prefix:
        raise RuntimeError("REEDITPRO_PHASE39C_QA_PREFIX missing")
    object_name = f"{prefix.rstrip('/')}/{REPORT_NAME}"
    client = storage.Client(project=os.environ.get("GCP_PROJECT_ID", "reeditpro"))
    blob = client.bucket(bucket_name).blob(object_name)
    blob.upload_from_filename(str(local_path), content_type="application/json", if_generation_match=0)
    blob.reload()
    return {
        "gcsUri": f"gs://{bucket_name}/{object_name}",
        "sizeBytes": local_path.stat().st_size,
        "generation": str(blob.generation) if blob.generation is not None else None,
        "crc32c": blob.crc32c,
        "md5Hash": blob.md5_hash,
    }


def main() -> int:
    run_id = os.environ.get("REEDITPRO_PHASE39C_RUN_ID", f"phase39c-sg-kernel-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}")
    profile_id = os.environ.get("REEDITPRO_VLM_SGLANG_KERNEL_PROFILE_ID", "unknown-profile")
    created_at = now_iso()
    blockers: List[str] = []
    warnings: List[str] = []
    validate_env(blockers)

    import_targets = [
        "torch",
        "sglang",
        "sglang.srt",
        "sglang.srt.layers.rotary_embedding",
        "sgl_kernel",
        "sgl_kernel.common_ops",
        "xgrammar",
        "guidance",
    ]
    import_results = [attempt_import(module_name) for module_name in import_targets]
    for result in import_results:
        message = str(result.get("message", ""))
        traceback_excerpt = str(result.get("tracebackExcerpt", ""))
        if result["module"] in {"torch", "sglang", "sglang.srt", "sglang.srt.layers.rotary_embedding"} and result["status"] != "passed":
            blockers.append(f"required_import_failed:{result['module']}")
        if "cuGreenCtxDestroy" in message or "cuGreenCtxDestroy" in traceback_excerpt:
            blockers.append("cuGreenCtxDestroy_import_error_persisting")

    torch_info = torch_diagnostics()
    if torch_info.get("status") != "passed":
        blockers.append("torch_cuda_diagnostics_failed")
    elif not torch_info.get("cudaAvailable"):
        blockers.append("torch_cuda_not_available_on_l4_job")

    launch_help = safe_run([sys.executable, "-m", "sglang.launch_server", "--help"], timeout=90)
    if launch_help.get("returncode") != 0:
        stderr = str(launch_help.get("stderrExcerpt", ""))
        stdout = str(launch_help.get("stdoutExcerpt", ""))
        warnings.append(f"sglang_launch_server_help_nonzero:{stderr[-500:] or stdout[-500:]}")
        if "cuGreenCtxDestroy" in stderr or "cuGreenCtxDestroy" in stdout:
            blockers.append("cuGreenCtxDestroy_launch_server_help_error")

    report: Dict[str, Any] = {
        "phase": "39C-SG-KERNEL",
        "reportId": "phase_39c_sg_kernel_import_smoke_report",
        "runId": run_id,
        "profileId": profile_id,
        "createdAt": created_at,
        "status": "passed" if not blockers else "blocked",
        "python": {
            "version": sys.version,
            "executable": sys.executable,
            "platform": platform.platform(),
        },
        "packages": [
            safe_version("sglang"),
            safe_version("sgl-kernel"),
            safe_version("sglang-kernel"),
            safe_version("torch"),
            safe_version("xgrammar"),
            safe_version("guidance"),
            safe_version("transformers"),
        ],
        "torch": torch_info,
        "nvidiaSmi": safe_run(["nvidia-smi", "--query-gpu=name,driver_version,memory.total,compute_cap", "--format=csv,noheader"], timeout=30),
        "cudaSymbolProbe": cuda_symbol_probe(),
        "importResults": import_results,
        "launchServerHelp": launch_help,
        "modelPayloadCopied": False,
        "inferenceRan": False,
        "processedImages": False,
        "providerCalls": False,
        "realMedia": False,
        "publicOutput": False,
        "blockers": sorted(set(blockers)),
        "warnings": sorted(set(warnings)),
        "privateArtifact": None,
        "vlmToolFamilyBetaStatus": "blocked",
    }
    local_path = Path("/tmp/reeditpro-vlm-sglang-kernel-import-smoke") / run_id / REPORT_NAME
    try:
        private_artifact = upload_report(report, local_path)
        report["privateArtifact"] = private_artifact
        local_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    except Exception as exc:
        report["status"] = "blocked"
        report["blockers"] = sorted(set(list(report["blockers"]) + [f"private_import_smoke_artifact_upload_failed:{str(exc)[:240]}"]))
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps(report, separators=(",", ":")))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
