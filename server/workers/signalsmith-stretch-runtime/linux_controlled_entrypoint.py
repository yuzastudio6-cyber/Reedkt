#!/usr/bin/env python3
import json
import os
import platform
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


WORK_ROOT = Path(os.environ.get("REEDITPRO_PHASE36J_WORK_ROOT", "/tmp/reeditpro-phase36j-signalsmith-controlled"))
RUN_ID = os.environ["REEDITPRO_PHASE36J_RUN_ID"]
PRIVATE_PREFIX = os.environ["REEDITPRO_PHASE36J_PRIVATE_ARTIFACT_PREFIX"].rstrip("/") + "/"
SOURCE_GCS_URI = os.environ["REEDITPRO_PHASE36J_CONTROLLED_SAMPLE_URI"]
SOURCE_SHA256 = os.environ["REEDITPRO_PHASE36J_CONTROLLED_SAMPLE_SHA256"]
WINDOW_START = os.environ["REEDITPRO_PHASE36J_CONTROLLED_WINDOW_START_SECONDS"]
WINDOW_END = os.environ["REEDITPRO_PHASE36J_CONTROLLED_WINDOW_END_SECONDS"]
REPO_URL = os.environ.get("REEDITPRO_PHASE36J_SIGNALSMITH_REPO_URL", "https://github.com/Signalsmith-Audio/signalsmith-stretch.git")
TAG = os.environ.get("REEDITPRO_PHASE36J_SIGNALSMITH_TAG", "1.1.0")
COMMIT = os.environ.get("REEDITPRO_PHASE36J_SIGNALSMITH_COMMIT", "44c8f865af9da8c29cc4a70a2d5a3ec83639c711")

FORBIDDEN_CONFIRMATIONS = [
    "REEDITPRO_CONFIRM_SIGNALSMITH_GENERATED_AUDIO",
    "REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE",
    "REEDITPRO_CONFIRM_TRACK_A_RUNTIME",
    "REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING",
    "REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT",
    "REEDITPRO_CONFIRM_PROVIDER_CALLS",
    "REEDITPRO_CONFIRM_PRODUCTION_UNLOCK",
    "REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK",
]


def run_command(args, check=False, timeout=300):
    started = time.time()
    proc = subprocess.run(
        args,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=timeout,
        env={**os.environ, "CLOUDSDK_CORE_DISABLE_PROMPTS": "1"},
    )
    result = {
        "args": [str(arg) for arg in args],
        "returncode": proc.returncode,
        "status": "passed" if proc.returncode == 0 else "blocked",
        "durationMs": round((time.time() - started) * 1000),
        "stdoutSummary": "\n".join(proc.stdout.splitlines()[:8]),
        "stderrSummary": "\n".join(proc.stderr.splitlines()[:8]),
    }
    if check and proc.returncode != 0:
        raise RuntimeError(json.dumps(result, indent=2))
    return result


def write_json(path, payload):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def get_access_token():
    request = Request(
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
        headers={"Metadata-Flavor": "Google"},
    )
    try:
        with urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
            return payload["access_token"]
    except Exception:
        result = run_command(["gcloud", "auth", "print-access-token"], check=False, timeout=60)
        if result["status"] == "passed" and result["stdoutSummary"]:
            return result["stdoutSummary"].splitlines()[0].strip()
    raise RuntimeError("gcs_access_token_unavailable")


def parse_gcs_uri(uri):
    if not uri.startswith("gs://"):
        raise RuntimeError(f"private_artifact_target_not_gcs:{uri}")
    bucket_and_object = uri[5:]
    bucket, _, object_name = bucket_and_object.partition("/")
    if not bucket or not object_name:
        raise RuntimeError(f"private_artifact_target_invalid:{uri}")
    return bucket, object_name


def gcs_object_metadata(bucket, object_name, token):
    encoded = quote(object_name, safe="")
    request = Request(
        f"https://storage.googleapis.com/storage/v1/b/{bucket}/o/{encoded}",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        if error.code == 404:
            return None
        raise


def upload_file_to_gcs(path, target, token):
    bucket, object_name = parse_gcs_uri(target)
    existing = gcs_object_metadata(bucket, object_name, token)
    if existing:
        return {
            "status": "passed",
            "mode": "existing",
            "generation": existing.get("generation"),
            "objectSizeBytes": int(existing.get("size", 0)),
        }
    encoded = quote(object_name, safe="")
    upload_url = f"https://storage.googleapis.com/upload/storage/v1/b/{bucket}/o?uploadType=media&ifGenerationMatch=0&name={encoded}"
    request = Request(
        upload_url,
        data=Path(path).read_bytes(),
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/octet-stream",
        },
    )
    started = time.time()
    try:
        with urlopen(request, timeout=300) as response:
            payload = json.loads(response.read().decode("utf-8"))
            return {
                "status": "passed",
                "mode": "uploaded",
                "durationMs": round((time.time() - started) * 1000),
                "generation": payload.get("generation"),
                "objectSizeBytes": int(payload.get("size", 0)),
            }
    except HTTPError as error:
        return {
            "status": "blocked",
            "mode": "upload_failed",
            "durationMs": round((time.time() - started) * 1000),
            "error": f"HTTP {error.code}: {error.reason}",
        }


def upload_reports(report_dir):
    uploads = []
    blockers = []
    token = get_access_token()
    for path in sorted(Path(report_dir).glob("phase_36j_*.json")):
        target = PRIVATE_PREFIX + "reports/" + path.name
        result = upload_file_to_gcs(path, target, token)
        uploads.append({
            "relativePath": "reports/" + path.name,
            "target": target,
            "status": result["status"],
            "mode": result.get("mode"),
            "durationMs": result.get("durationMs", 0),
            "generation": result.get("generation"),
            "error": result.get("error"),
        })
        if result["status"] != "passed":
            blockers.append(f"upload_failed:{path.name}")
    return {
        "status": "passed" if not blockers else "blocked",
        "privateArtifactPrefix": PRIVATE_PREFIX,
        "uploads": uploads,
        "blockers": blockers,
    }


def smoke(report_dir):
    system = platform.system().lower()
    machine = platform.machine().lower()
    checks = {
        "ffmpeg": run_command(["ffmpeg", "-version"]),
        "ffprobe": run_command(["ffprobe", "-version"]),
        "python3": run_command(["python3", "--version"]),
        "git": run_command(["git", "--version"]),
        "c++": run_command(["c++", "--version"]),
        "gcloud": run_command(["gcloud", "--version"]),
    }
    blockers = []
    if system != "linux" or machine not in ("x86_64", "amd64"):
        blockers.append(f"linux_amd64_required:{system}_{machine}")
    for forbidden in FORBIDDEN_CONFIRMATIONS:
        if os.environ.get(forbidden) == "true":
            blockers.append(f"forbidden_confirmation_set:{forbidden}")
    if checks["ffmpeg"]["status"] != "passed":
        blockers.append("ffmpeg_unavailable_for_bounded_audio_extraction")
    if checks["ffprobe"]["status"] != "passed":
        blockers.append("ffprobe_unavailable_for_bounded_audio_validation")
    if checks["git"]["status"] != "passed":
        blockers.append("git_unavailable_for_exact_source_fetch")
    if checks["c++"]["status"] != "passed":
        blockers.append("signalsmith_cpp_compiler_unavailable")
    if checks["gcloud"]["status"] != "passed":
        blockers.append("gcloud_unavailable_for_private_media_read_or_upload")
    report = {
        "phase": "36J",
        "runId": RUN_ID,
        "status": "passed" if not blockers else "blocked",
        "platform": {"system": system, "machine": machine},
        "checks": checks,
        "signalsmith": {"tag": TAG, "commit": COMMIT},
        "controlledSample": {
            "sourceGcsUri": SOURCE_GCS_URI,
            "sourceSha256": SOURCE_SHA256,
            "windowStartSeconds": float(WINDOW_START),
            "windowEndSeconds": float(WINDOW_END),
        },
        "mediaAccessDuringSmoke": False,
        "blockers": blockers,
    }
    write_json(report_dir / "phase_36j_signalsmith_controlled_ffmpeg_runtime_smoke_report.json", report)
    return report


def main():
    report_dir = WORK_ROOT / "private-artifacts" / "reports"
    artifact_dir = WORK_ROOT / "private-artifacts"
    report_dir.mkdir(parents=True, exist_ok=True)
    smoke_report = smoke(report_dir)
    if smoke_report["status"] != "passed":
        upload_report = upload_reports(report_dir)
        print(json.dumps(upload_report, indent=2, sort_keys=True), file=sys.stderr)
        print(json.dumps(smoke_report, indent=2, sort_keys=True), file=sys.stderr)
        raise RuntimeError(f"phase36j_ffmpeg_runtime_smoke_blocked:{smoke_report['blockers']}")

    worker = Path("/app/server/workers/signalsmith-stretch-runtime/run_signalsmith_controlled_suite.py")
    args = [
        "python3",
        str(worker),
        "--work-root",
        str(WORK_ROOT),
        "--artifact-dir",
        str(artifact_dir),
        "--repo-url",
        REPO_URL,
        "--tag",
        TAG,
        "--commit",
        COMMIT,
        "--private-prefix",
        PRIVATE_PREFIX,
        "--run-id",
        RUN_ID,
        "--source-gcs-uri",
        SOURCE_GCS_URI,
        "--source-sha256",
        SOURCE_SHA256,
        "--window-start",
        WINDOW_START,
        "--window-end",
        WINDOW_END,
        "--keep-temp",
    ]
    result = run_command(args, check=False, timeout=1800)
    write_json(report_dir / "phase_36j_signalsmith_controlled_cloud_worker_command.json", result)
    if result["status"] != "passed":
        upload_report = upload_reports(report_dir)
        print(json.dumps(upload_report, indent=2, sort_keys=True), file=sys.stderr)
        print(json.dumps(result, indent=2, sort_keys=True), file=sys.stderr)
        raise RuntimeError("phase36j_signalsmith_controlled_worker_failed")
    upload_report = upload_reports(report_dir)
    write_json(report_dir / "phase_36j_signalsmith_controlled_entrypoint_upload_report.json", upload_report)
    upload_report = upload_reports(report_dir)
    print(json.dumps(upload_report, indent=2, sort_keys=True))
    if upload_report["status"] != "passed":
        raise RuntimeError(f"phase36j_private_artifact_upload_failed:{upload_report['blockers']}")
    print(result["stdoutSummary"])

    if os.environ.get("REEDITPRO_PHASE36J_KEEP_TEMP") != "true":
        shutil.rmtree(WORK_ROOT, ignore_errors=True)


if __name__ == "__main__":
    main()
