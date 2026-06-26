#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import socket
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple


DECISION = "qwen2_5_vl_7b_private_loader_gate_blocked_missing_runtime_dependencies_no_inference"
MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct"
SOURCE_REVISION = "cc594898137f460bfe9f0759e9844b3ce807cfb5"
DEFAULT_MODEL_DIR = (
    "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/"
    "cc594898137f460bfe9f0759e9844b3ce807cfb5"
)
CHECKSUM_MANIFEST_SHA256 = "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b"
NEXT_PROMPT = "QWEN2_5_VL_STACK_TOOL_4: controlled Qwen2.5-VL runtime dependency install plan, no inference"

EXPECTED_FILES: List[Tuple[str, int, str]] = [
    (".gitattributes", 1519, "11ad7efa24975ee4b0c3c3a38ed18737f0658a5f75a0a96787b576a78a023361"),
    ("README.md", 18574, "1fa65dbb08bc9ffe0b020409c8686f08b23008c5a68554353305fd2de6f2b81e"),
    ("chat_template.json", 1050, "ad60d90252ed0b0705ba14e2d0ad0fec0beac1ea955642b54059b36052d8bc96"),
    ("config.json", 1374, "77d9ec7321cc572e3579e2c84799c9cadaded63c49ce93b101733349fc330c43"),
    ("generation_config.json", 216, "0a3aea82869fe29f20dc95ccf3e2bcff380eca1f5ad6447a4a4b37110b08e43e"),
    ("merges.txt", 1671839, "599bab54075088774b1733fde865d5bd747cbcc7a547c5bc12610e874e26f5e3"),
    ("model-00001-of-00005.safetensors", 3900233256, "e97b877e47fde53a6c6e77aafb36e58e91ee9d95c4a3eeac6f1b5c0e6a1c986e"),
    ("model-00002-of-00005.safetensors", 3864726320, "a9a300a43b4724eee2abe7c18ceb26768d0ab011eb0cad19d9bfd2476a24d024"),
    ("model-00003-of-00005.safetensors", 3864726424, "111223d173e00bbee81cba1216fad28668df3476706b7fd26f4d5b50f8b3a507"),
    ("model-00004-of-00005.safetensors", 3864733680, "ef47f634fa57d46ee134edcc09f34085a47da1e16c12a2abe0d67118be6d72ed"),
    ("model-00005-of-00005.safetensors", 1089994880, "0c859795ad3a627a9b95bcb762e059d5b768a4a36fdd4affeff269d93fdecc67"),
    ("model.safetensors.index.json", 57619, "73b333b0b16e5286ddba615d2caebcd495cf7e616f52eb217a81781393d79de9"),
    ("preprocessor_config.json", 350, "f2058c716eef96ccaed1cc1e2d0c08306b62586d535b28d9d08e691b2fab7ca0"),
    ("tokenizer.json", 7031645, "c0382117ea329cdf097041132f6d735924b697924d6f6fc3945713e96ce87539"),
    ("tokenizer_config.json", 5702, "4abd3520120e266da84c0864fee064d1fb10806f02225911a47253dd38dc5f56"),
    ("vocab.json", 2776833, "ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910"),
]

REQUIRED_ENV = {
    "HF_HUB_OFFLINE": "1",
    "TRANSFORMERS_OFFLINE": "1",
    "MODEL_DOWNLOADS_ENABLED": "false",
    "PROVIDER_EXECUTION_ENABLED": "false",
}

LOADER_DEPENDENCIES = ["transformers", "torch", "qwen_vl_utils"]
RUNTIME_DEPENDENCIES = ["vllm", "sglang"]

FALSE_RUNTIME_GATES = {
    "autoDownloadAllowed": False,
    "loaderImportAttempted": False,
    "modelInferenceRun": False,
    "cudaInitialized": False,
    "vllmStarted": False,
    "sglangStarted": False,
    "apiServerStarted": False,
    "generatedVideoCreated": False,
    "generatedAssetsCreated": False,
    "providerCallsMade": False,
    "workersDispatched": False,
    "supabaseTouched": False,
    "sqlExecuted": False,
    "gcpMutationCreated": False,
    "dockerRun": False,
    "publicArtifactsCreated": False,
    "signedUrlsCreated": False,
    "creditMutationCreated": False,
    "betaUnlocked": False,
    "productionUnlocked": False,
    "dryRunPassedClaimed": False,
    "generatedLocalFixturePassedClaimed": False,
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def dependency_status(names: Iterable[str]) -> Dict[str, bool]:
    return {name: importlib.util.find_spec(name) is not None for name in names}


def verify_env() -> Tuple[Dict[str, bool], List[str]]:
    statuses: Dict[str, bool] = {}
    blockers: List[str] = []
    for key, expected in REQUIRED_ENV.items():
        statuses[key] = os.environ.get(key) == expected
        if not statuses[key]:
            blockers.append(f"env_guard_mismatch:{key}")
    return statuses, blockers


def verify_files(model_dir: Path) -> Tuple[List[Dict[str, Any]], List[str]]:
    results: List[Dict[str, Any]] = []
    blockers: List[str] = []
    for relative_path, expected_size, expected_sha256 in EXPECTED_FILES:
        file_path = model_dir / relative_path
        entry: Dict[str, Any] = {
            "relativePath": relative_path,
            "expectedSizeBytes": expected_size,
            "expectedSha256": expected_sha256,
            "exists": file_path.exists(),
            "sizeMatches": False,
            "sha256Matches": False,
        }
        if not file_path.exists():
            blockers.append(f"missing_file:{relative_path}")
            results.append(entry)
            continue
        actual_size = file_path.stat().st_size
        actual_sha256 = sha256_file(file_path)
        entry.update({
            "actualSizeBytes": actual_size,
            "actualSha256": actual_sha256,
            "sizeMatches": actual_size == expected_size,
            "sha256Matches": actual_sha256 == expected_sha256,
        })
        if actual_size != expected_size:
            blockers.append(f"size_mismatch:{relative_path}")
        if actual_sha256 != expected_sha256:
            blockers.append(f"sha256_mismatch:{relative_path}")
        results.append(entry)
    return results, blockers


def count_sidecars(model_dir: Path) -> int:
    if not model_dir.exists():
        return 0
    return sum(1 for path in model_dir.rglob("._*") if path.is_file())


@contextmanager
def block_network() -> Any:
    original_socket = socket.socket

    def guarded_socket(*_args: Any, **_kwargs: Any) -> Any:
        raise RuntimeError("network access blocked during Qwen2.5-VL private loader gate")

    socket.socket = guarded_socket  # type: ignore[assignment]
    try:
        yield
    finally:
        socket.socket = original_socket  # type: ignore[assignment]


def maybe_attempt_metadata_import(model_dir: Path, allow_metadata_import: bool, loader_dependencies: Dict[str, bool]) -> Dict[str, Any]:
    if not allow_metadata_import:
        return {
            "attempted": False,
            "status": "skipped_by_policy",
            "localFilesOnly": True,
            "trustRemoteCode": True,
        }
    missing = [name for name, present in loader_dependencies.items() if not present]
    if missing:
        return {
            "attempted": False,
            "status": "blocked_missing_dependencies",
            "missingDependencies": missing,
            "localFilesOnly": True,
            "trustRemoteCode": True,
        }
    try:
        with block_network():
            from transformers import AutoConfig, AutoProcessor  # type: ignore

            config = AutoConfig.from_pretrained(str(model_dir), trust_remote_code=True, local_files_only=True)
            processor = AutoProcessor.from_pretrained(str(model_dir), trust_remote_code=True, local_files_only=True)
        return {
            "attempted": True,
            "status": "passed_metadata_import_only",
            "configClass": config.__class__.__name__,
            "processorClass": processor.__class__.__name__,
            "localFilesOnly": True,
            "trustRemoteCode": True,
        }
    except Exception as exc:
        return {
            "attempted": True,
            "status": "blocked_import_error",
            "exceptionClass": exc.__class__.__name__,
            "message": str(exc)[:500],
            "localFilesOnly": True,
            "trustRemoteCode": True,
        }


def build_report(args: argparse.Namespace) -> Dict[str, Any]:
    repo_root = Path.cwd().resolve()
    model_dir = Path(args.model_dir).expanduser().resolve()
    blockers: List[str] = []
    warnings: List[str] = []

    if not model_dir.exists():
        blockers.append("model_dir_missing")
    if repo_root == model_dir or repo_root in model_dir.parents:
        blockers.append("model_dir_inside_repo")

    env_status, env_blockers = verify_env()
    blockers.extend(env_blockers)

    file_results, file_blockers = verify_files(model_dir)
    blockers.extend(file_blockers)

    sidecar_file_count = count_sidecars(model_dir)
    if sidecar_file_count:
        blockers.append("appledouble_sidecars_present")

    loader_dependencies = dependency_status(LOADER_DEPENDENCIES)
    runtime_dependencies = dependency_status(RUNTIME_DEPENDENCIES)
    for name, present in loader_dependencies.items():
        if not present:
            blockers.append(f"dependency_missing:{name}")
    for name, present in runtime_dependencies.items():
        if not present:
            warnings.append(f"future_runtime_dependency_missing:{name}")

    metadata_import = maybe_attempt_metadata_import(model_dir, args.allow_metadata_import, loader_dependencies)
    if metadata_import.get("attempted"):
        FALSE_RUNTIME_GATES["loaderImportAttempted"] = True
    if metadata_import.get("status") not in {"skipped_by_policy", "passed_metadata_import_only"}:
        blockers.append("metadata_import_blocked")

    file_verification_passed = all(
        entry.get("exists") and entry.get("sizeMatches") and entry.get("sha256Matches")
        for entry in file_results
    )
    private_cache_verified = model_dir.exists() and file_verification_passed and sidecar_file_count == 0
    loader_import_ready = (
        private_cache_verified
        and all(env_status.values())
        and all(loader_dependencies.values())
        and metadata_import.get("status") == "passed_metadata_import_only"
    )

    status = "ready_for_no_inference_metadata_import" if loader_import_ready else "blocked"
    dependency_blockers = [blocker for blocker in blockers if blocker.startswith("dependency_missing:")]

    return {
        "ok": True,
        "decision": DECISION,
        "status": status,
        "workstream": "AI_VIDEO_BROLL_GENERATION",
        "toolId": "qwen_vl",
        "modelId": MODEL_ID,
        "sourceRevision": SOURCE_REVISION,
        "modelDir": str(model_dir),
        "modelDirInsideRepo": repo_root == model_dir or repo_root in model_dir.parents,
        "privateCacheVerified": private_cache_verified,
        "localChecksumVerified": file_verification_passed,
        "fileVerificationPassed": file_verification_passed,
        "expectedFileCount": len(EXPECTED_FILES),
        "verifiedFileCount": sum(1 for entry in file_results if entry.get("sha256Matches")),
        "totalSizeBytes": sum(size for _, size, _ in EXPECTED_FILES),
        "checksumManifestSha256": CHECKSUM_MANIFEST_SHA256,
        "sidecarFileCount": sidecar_file_count,
        "offlineEnv": env_status,
        "autoDownloadAllowed": False,
        "loaderDependencies": loader_dependencies,
        "runtimeDependencies": runtime_dependencies,
        "metadataImport": metadata_import,
        "loaderImportAttempted": bool(metadata_import.get("attempted")),
        "loaderImportReady": loader_import_ready,
        "modelInferenceRun": False,
        "selectedGpu": "nvidia_l4_google_cloud_g2_first",
        "recommendedInitialVmShape": "g2-standard-8",
        "minimumImportSmokeVmShape": "g2-standard-4",
        "maxModelLen": 2048,
        "maxNumSeqs": 1,
        "imageInputCapPx": 384,
        "fileResults": file_results,
        "blockers": blockers,
        "dependencyBlockers": dependency_blockers,
        "warnings": warnings,
        "runtimeGates": FALSE_RUNTIME_GATES,
        "nextPrompt": NEXT_PROMPT,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Qwen2.5-VL private loader gate with no inference.")
    parser.add_argument("--model-dir", default=DEFAULT_MODEL_DIR)
    parser.add_argument("--report-path")
    parser.add_argument("--allow-metadata-import", action="store_true")
    args = parser.parse_args()

    report = build_report(args)
    text = json.dumps(report, indent=2, sort_keys=True)
    if args.report_path:
        report_path = Path(args.report_path)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
