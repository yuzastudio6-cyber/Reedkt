#!/usr/bin/env bash
set -Eeuo pipefail

trap 'status=$?; printf "ERROR: SAM 3.1 production capsule failed at line %s (exit %s)\n" "${LINENO}" "${status}" >&2; exit "${status}"' ERR

readonly ROOT='/opt/weeditpro-production-capsule-builder'
readonly WORK='/tmp/weeditpro-sam31-production-capsule'
readonly BUILD_SOURCE="${WORK}/build-source"
readonly PRIVATE_ROOT="${BUILD_SOURCE}/sam31_private_build_input"
readonly STAGING="${ROOT}/private-staging"
readonly BUILD_ID="${WEEDITPRO_BUILD_ID:?missing Cloud Build id}"
readonly REPOSITORY_COMMIT="${WEEDITPRO_REPOSITORY_COMMIT:?missing repository commit}"
readonly REPOSITORY_TREE="${WEEDITPRO_REPOSITORY_TREE:?missing repository tree}"

rm -rf "${WORK}" /output
mkdir -p "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/patches" \
  "${PRIVATE_ROOT}/release-receipts" /output

python -I -B - \
  "${STAGING}/source-qualification-capsule.tar.gz" \
  "${STAGING}/source-qualification-capsule-manifest.json" \
  "${STAGING}/source-checkpoint-qualification-release.json" \
  "${STAGING}/private-artifact-build-binding.json" \
  "${BUILD_SOURCE}" "${WORK}/validated-inputs.json" <<'PY'
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys
import tarfile

capsule_path, manifest_path, release_path, binding_path, output_root, metadata_path = (
    Path(value) for value in sys.argv[1:]
)

def canonical(value):
    return json.dumps(
        # These are generation-bound records written by the canonical
        # JavaScript owner. Preserve their exact observed wire-key order when
        # recomputing embedded hashes; Python's lexical key order is not the
        # producer's canonical comparator. The raw object SHA was verified by
        # the preceding Cloud Build step.
        value, sort_keys=False, separators=(",", ":"), ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")

def sha(body):
    return hashlib.sha256(body).hexdigest()

def read_canonical(path, hash_key):
    body = path.read_bytes()
    value = json.loads(body)
    if not isinstance(value, dict) or value.get(hash_key) is None:
        raise SystemExit(f"{path.name} is not a closed hashed record")
    payload = dict(value)
    embedded = payload.pop(hash_key)
    if not re.fullmatch(r"[a-f0-9]{64}", str(embedded)):
        raise SystemExit(f"{path.name} hash is malformed")
    if sha(canonical(payload)) != embedded or canonical(value) != body:
        raise SystemExit(f"{path.name} canonical hash changed")
    return value, body

def safe_ref(value):
    return (
        isinstance(value, dict)
        and set(value) == {"id", "version", "contentHash"}
        and isinstance(value["id"], str)
        and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:-]{0,239}", value["id"])
        and ".." not in value["id"]
        and value["version"] == 1
        and isinstance(value["contentHash"], str)
        and re.fullmatch(r"sha256:[a-f0-9]{64}", value["contentHash"])
    )

manifest, _ = read_canonical(manifest_path, "manifestHash")
release, _ = read_canonical(release_path, "releaseHash")
binding, binding_body = read_canonical(binding_path, "bindingHash")
qualification = release.get("qualification")
if not isinstance(qualification, dict):
    raise SystemExit("qualification release omitted qualification")
qualification_payload = dict(qualification)
qualification_hash = qualification_payload.pop("qualificationHash", None)
qualification_body = canonical(qualification)
if (
    not isinstance(qualification_hash, str)
    or sha(canonical(qualification_payload)) != qualification_hash
    or release.get("status") != "qualified_for_private_image_build"
    or release.get("sourceCheckpointQualificationGranted") is not True
    or release.get("privateImageBuildReviewEligible") is not True
    or release.get("imageBuildStarted") is not False
    or release.get("runtimeReleaseGranted") is not False
    or release.get("productionReady") is not False
):
    raise SystemExit("final source/checkpoint qualification is not admissible")

qualification_ref = release.get("sourceCheckpointQualificationRef")
if not isinstance(qualification_ref, dict):
    raise SystemExit("qualification ref is absent")
if (
    qualification_ref.get("schemaVersion")
    != "canonical-sam3_1-source-checkpoint-compatibility-qualification-v2"
    or qualification_ref.get("version") != 2
    or qualification_ref.get("contentHash") != f"sha256:{qualification_hash}"
):
    raise SystemExit("qualification ref crossed final receipt")

worker_request = qualification.get("workerRequest")
if not isinstance(worker_request, dict):
    raise SystemExit("Vertex qualification worker request is absent")
dependency_closure = worker_request.get("dependencyClosure")
if not isinstance(dependency_closure, dict):
    raise SystemExit("Vertex qualification dependency closure is absent")
source_capsule_ref = dependency_closure.get("artifactRef")
if not safe_ref(source_capsule_ref):
    raise SystemExit("source qualification capsule ref is malformed")
manifest_ref = {
    "id": manifest.get("manifestId"),
    "version": manifest.get("manifestVersion"),
    "contentHash": f"sha256:{manifest.get('manifestHash')}",
}
if source_capsule_ref != manifest_ref:
    raise SystemExit("qualification did not use this exact source capsule")
if (
    binding.get("status") != "private_artifacts_admitted"
    or binding.get("schemaVersion")
       != "canonical-sam3_1-image-build-artifact-binding-v3"
    or binding.get("sourceCheckpointQualificationRef") != qualification_ref
    or binding.get("qualificationTruth", {}).get(
        "exactVertexA100ExecutionReread"
    ) is not True
    or binding.get("qualificationTruth", {}).get(
        "legacyBatchCastOrRelabelUsed"
    ) is not False
    or binding.get("authority", {}).get("sourceCheckpointQualificationReread")
       is not True
    or binding.get("authority", {}).get("imageBuildAuthorized") is not False
):
    raise SystemExit("private artifact build binding crossed qualification")

coordinate = manifest.get("capsule", {}).get("coordinate", {})
capsule_body = capsule_path.read_bytes()
if (
    manifest.get("status") != "private_capsule_verified"
    or manifest.get("securityBoundary", {}).get("checkpointBytesIncluded")
       is not False
    or coordinate.get("sha256") != sha(capsule_body)
    or coordinate.get("byteLength") != len(capsule_body)
):
    raise SystemExit("source qualification capsule bytes changed")

fixed_paths = {
    "sam31_private_build_input/source/sam3-96914d2425f90a64f45ca977c2b5165418099543.tar",
    "sam31_private_build_input/source/sam3-96914d2425f90a64f45ca977c2b5165418099543-reeditpro-gpu-decode.tar",
    "sam31_private_build_input/source/source-patch-application-receipt.json",
    "sam31_private_build_input/dependency-closure/requirements.lock.txt",
    "sam31_private_build_input/dependency-closure/dependency-closure-receipt.json",
    "sam31_private_build_input/dependency-closure/ffmpeg/ffmpeg-8.0.3.tar.gz",
    "sam31_private_build_input/dependency-closure/ffmpeg/pkgconf-3.0.4.tar.gz",
    "sam31_private_build_input/dependency-closure/ffmpeg/nv-codec-headers-n12.2.72.0.tar.gz",
    "sam31_private_build_input/dependency-closure/ffmpeg/ffmpeg-closure-receipt.json",
    "sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb",
    "sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json",
    "sam31_private_build_input/dependency-closure/cuda-npp/libnpp-12-8_12.3.3.100-1_amd64.deb",
    "sam31_private_build_input/dependency-closure/cuda-npp/cuda-npp-runtime-receipt.json",
    "sam31_private_build_input/dependency-closure/os-security-updates/openssl_3.0.13-0ubuntu3.12_amd64.deb",
    "sam31_private_build_input/dependency-closure/os-security-updates/libssl3t64_3.0.13-0ubuntu3.12_amd64.deb",
    "sam31_private_build_input/dependency-closure/os-security-updates/libssl-dev_3.0.13-0ubuntu3.12_amd64.deb",
    "sam31_private_build_input/dependency-closure/os-security-updates/security-update-receipt.json",
    "sam31_private_build_input/dependency-closure/python-ingest/einops/einops-ingest-receipt.json",
    "sam31_private_build_input/dependency-closure/python-ingest/pycocotools/pycocotools-ingest-receipt.json",
}
wheel_pattern = re.compile(
    r"sam31_private_build_input/dependency-closure/wheelhouse/"
    r"[A-Za-z0-9][A-Za-z0-9._+\-]{0,199}\.whl"
)
manifest_entries = manifest.get("capsule", {}).get("archiveEntries")
if not isinstance(manifest_entries, list):
    raise SystemExit("source capsule entry manifest is absent")
by_path = {}
for entry in manifest_entries:
    if not isinstance(entry, dict) or set(entry) != {"path", "byteLength", "sha256"}:
        raise SystemExit("source capsule entry shape changed")
    path = entry["path"]
    if path in by_path:
        raise SystemExit("source capsule entry is duplicated")
    by_path[path] = entry
selected = sorted(fixed_paths | {
    path for path in by_path if wheel_pattern.fullmatch(path)
})
if not fixed_paths.issubset(by_path) or len(selected) <= len(fixed_paths):
    raise SystemExit("source capsule production dependency closure is incomplete")
wheels = [by_path[path] for path in selected if wheel_pattern.fullmatch(path)]
private_input = manifest.get("privateInput", {})
if (
    len(wheels) != private_input.get("dependencyWheelCount")
    or sha(canonical(wheels)) != private_input.get("dependencyWheelManifestSha256")
    or dependency_closure.get("lockSha256")
       != private_input.get("dependencyLockSha256")
    or dependency_closure.get("receiptSha256")
       != private_input.get("dependencyClosureReceiptSha256")
    or dependency_closure.get("wheelManifestSha256")
       != private_input.get("dependencyWheelManifestSha256")
):
    raise SystemExit("source capsule dependency lineage changed")

output_root.mkdir(parents=True, exist_ok=True)
with tarfile.open(capsule_path, mode="r:gz") as archive:
    members = archive.getmembers()
    names = set()
    for member in members:
        path = PurePosixPath(member.name)
        if (
            member.name.startswith("/")
            or "\\" in member.name
            or any(part in ("", ".", "..") for part in path.parts)
            or not (member.isfile() or member.isdir())
            or member.name in names
        ):
            raise SystemExit("source capsule contains an unsafe archive member")
        names.add(member.name)
    for path in selected:
        member = archive.getmember(path)
        if not member.isfile():
            raise SystemExit(f"source capsule entry is not a file: {path}")
        handle = archive.extractfile(member)
        if handle is None:
            raise SystemExit(f"source capsule entry is unreadable: {path}")
        body = handle.read()
        expected = by_path[path]
        if len(body) != expected["byteLength"] or sha(body) != expected["sha256"]:
            raise SystemExit(f"source capsule entry bytes changed: {path}")
        destination = output_root / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(body)

release_receipts = output_root / "sam31_private_build_input/release-receipts"
release_receipts.mkdir(parents=True, exist_ok=True)
(release_receipts / "private-artifact-build-binding.json").write_bytes(
    binding_body
)
(release_receipts / "source-checkpoint-compatibility-receipt.json").write_bytes(
    qualification_body
)
metadata = {
    "sourceCheckpointQualificationRef": qualification_ref,
    "sourceQualificationCapsuleRef": source_capsule_ref,
    "artifactBindingRef": {
        "id": f"sam31-vertex-build-binding-{binding['bindingHash'][:24]}",
        "version": 1,
        "contentHash": f"sha256:{binding['bindingHash']}",
    },
    "artifactBuildBindingRecordHash": binding["bindingHash"],
    "artifactBuildBindingFileSha256": sha(binding_body),
    "sourceCheckpointQualificationRecordHash": qualification_hash,
    "sourceCheckpointCompatibilityReceiptSha256": sha(qualification_body),
    "dependencyWheelCount": len(wheels),
    "dependencyWheelManifestSha256": sha(canonical(wheels)),
    "dependencyLockSha256": by_path[
        "sam31_private_build_input/dependency-closure/requirements.lock.txt"
    ]["sha256"],
    "dependencyClosureReceiptSha256": by_path[
        "sam31_private_build_input/dependency-closure/dependency-closure-receipt.json"
    ]["sha256"],
    "patchApplicationReceiptSha256": by_path[
        "sam31_private_build_input/source/source-patch-application-receipt.json"
    ]["sha256"],
    "cudaForwardCompatIngestReceiptSha256": by_path[
        "sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json"
    ]["sha256"],
}
metadata_path.write_bytes(canonical(metadata))
PY

cp "${ROOT}/source/Dockerfile.candidate" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/Dockerfile.candidate"
cp "${ROOT}/source/runner.py" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/runner.py"
cp "${ROOT}/source/entrypoint.sh" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/entrypoint.sh"
cp "${ROOT}/source/source-provenance.lock" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/source-provenance.lock"
cp "${ROOT}/source/patches/0001-reeditpro-gpu-decode.patch" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch"
cp "${ROOT}/source/patches/0002-weeditpro-importlib-resources.patch" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/patches/0002-weeditpro-importlib-resources.patch"
cp "${ROOT}/source/patches/0003-weeditpro-multiplex-session-gpu-forwarding.patch" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/patches/0003-weeditpro-multiplex-session-gpu-forwarding.patch"
cp "${ROOT}/source/patches/0004-weeditpro-forward-propagation-frame-count.patch" \
  "${BUILD_SOURCE}/docker/prod/gpu-worker/sam3_1/patches/0004-weeditpro-forward-propagation-frame-count.patch"

test -z "$(find "${BUILD_SOURCE}" -mindepth 1 ! -type d ! -type f -print -quit)"
find "${BUILD_SOURCE}" -type f -exec touch -d '@0' '{}' +
find "${BUILD_SOURCE}" -type d -exec chmod 0555 '{}' +
find "${BUILD_SOURCE}" -type f -exec chmod 0444 '{}' +

readonly UNCOMPRESSED="${WORK}/sam31-production-build-source.tar"
(
  cd "${BUILD_SOURCE}"
  find . -mindepth 1 \( -type d -o -type f \) -printf '%P\0' \
    | sort -z \
    | tar --create --format=ustar --mtime='@0' --owner=0 --group=0 \
        --numeric-owner --no-recursion --file="${UNCOMPRESSED}" \
        --null --files-from=-
)
gzip --no-name --best "${UNCOMPRESSED}"
readonly CAPSULE="${UNCOMPRESSED}.gz"
readonly CAPSULE_SHA256="$(sha256sum "${CAPSULE}" | cut -d' ' -f1)"

python -I -B - "${BUILD_SOURCE}" "${CAPSULE}" \
  "${WORK}/validated-inputs.json" \
  "/output/${CAPSULE_SHA256}.capsule.json" \
  "${BUILD_ID}" "${REPOSITORY_COMMIT}" "${REPOSITORY_TREE}" <<'PY'
import hashlib
import json
from pathlib import Path
import sys

root, capsule, metadata_path, output = map(Path, sys.argv[1:5])
build_id, repository_commit, repository_tree = sys.argv[5:]
canonical = lambda value: json.dumps(
    value, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
    allow_nan=False,
).encode("utf-8")
sha = lambda body: hashlib.sha256(body).hexdigest()
metadata = json.loads(metadata_path.read_bytes())
entries = []
for path in sorted(
    (item for item in root.rglob("*") if item.is_file()),
    key=lambda item: item.relative_to(root).as_posix(),
):
    body = path.read_bytes()
    entries.append({
        "path": path.relative_to(root).as_posix(),
        "byteLength": len(body),
        "sha256": sha(body),
    })
by_path = {item["path"]: item for item in entries}
repository_paths = [
    "docker/prod/gpu-worker/sam3_1/Dockerfile.candidate",
    "docker/prod/gpu-worker/sam3_1/entrypoint.sh",
    "docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch",
    "docker/prod/gpu-worker/sam3_1/patches/0003-weeditpro-multiplex-session-gpu-forwarding.patch",
    "docker/prod/gpu-worker/sam3_1/patches/0004-weeditpro-forward-propagation-frame-count.patch",
    "docker/prod/gpu-worker/sam3_1/runner.py",
    "docker/prod/gpu-worker/sam3_1/source-provenance.lock",
    "docker/prod/gpu-worker/sam3_1/patches/0002-weeditpro-importlib-resources.patch",
]
source_bundle = {
    "repositoryCommit": repository_commit,
    "repositoryTree": repository_tree,
    "files": [by_path[path] for path in repository_paths],
}
capsule_body = capsule.read_bytes()
payload = {
    "schemaVersion": "weeditpro-sam3_1-production-capsule-builder-result-v2",
    "source": "weeditpro_sam3_1_production_capsule_builder",
    "evidenceClass": "canonical_private_cloud_build",
    "buildId": build_id,
    "repositoryCommit": repository_commit,
    "repositoryTree": repository_tree,
    "sourceBundleRef": {
        "id": f"sam31-production-source-bundle-{repository_tree[:24]}",
        "version": 1,
        "contentHash": f"sha256:{sha(canonical(source_bundle))}",
    },
    "sourcePublished": True,
    "sourceClean": True,
    "sourceCheckpointQualificationRef": metadata["sourceCheckpointQualificationRef"],
    "artifactBindingRef": metadata["artifactBindingRef"],
    "sourceQualificationCapsuleRef": metadata["sourceQualificationCapsuleRef"],
    "sourceQualificationCapsuleExactlyReread": True,
    "dockerfileSha256": by_path[repository_paths[0]]["sha256"],
    "runnerSha256": by_path[repository_paths[5]]["sha256"],
    "entrypointSha256": by_path[repository_paths[1]]["sha256"],
    "sourceProvenanceLockSha256": by_path[repository_paths[6]]["sha256"],
    "gpuDecodePatchSha256": by_path[repository_paths[2]]["sha256"],
    "multiplexSessionGpuForwardingPatchSha256": by_path[
        repository_paths[3]
    ]["sha256"],
    "forwardPropagationFrameCountPatchSha256": by_path[
        repository_paths[4]
    ]["sha256"],
    "capsuleSha256": sha(capsule_body),
    "capsuleByteLength": len(capsule_body),
    "archiveEntries": entries,
    "archiveEntrySetSha256": sha(canonical(entries)),
    "dependencyWheelCount": metadata["dependencyWheelCount"],
    "dependencyWheelManifestSha256": metadata["dependencyWheelManifestSha256"],
    "dependencyLockSha256": metadata["dependencyLockSha256"],
    "dependencyClosureReceiptSha256": metadata["dependencyClosureReceiptSha256"],
    "patchApplicationReceiptSha256": metadata["patchApplicationReceiptSha256"],
    "cudaForwardCompatIngestReceiptSha256": metadata["cudaForwardCompatIngestReceiptSha256"],
    "artifactBuildBindingRecordHash": metadata["artifactBuildBindingRecordHash"],
    "artifactBuildBindingFileSha256": metadata["artifactBuildBindingFileSha256"],
    "sourceCheckpointQualificationRecordHash": metadata["sourceCheckpointQualificationRecordHash"],
    "sourceCheckpointCompatibilityReceiptSha256": metadata["sourceCheckpointCompatibilityReceiptSha256"],
    "checkpointIncluded": False,
    "sourceCheckpointQualificationReceiptIncluded": True,
    "vertexQualificationEvidenceBound": True,
    "historicalBatchQualificationCastOrRelabelUsed": False,
    "containsCredentials": False,
    "containsCustomerMedia": False,
    "networkDependencyInstallRequired": False,
    "callerPathUrlCommandImageTagOrBuildArgumentAccepted": False,
}
record = dict(payload)
record["builderResultHash"] = sha(canonical(payload))
output.write_bytes(canonical(record) + b"\n")
PY

mv "${CAPSULE}" "/output/${CAPSULE_SHA256}.tar.gz"
test -s "/output/${CAPSULE_SHA256}.tar.gz"
test -s "/output/${CAPSULE_SHA256}.capsule.json"
