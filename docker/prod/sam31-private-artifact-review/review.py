#!/usr/bin/env python3
"""Network-isolated exact-byte SAM 3.1 source/checkpoint review owner.

The job downloads only generation-bound private GCS artifacts into its
ephemeral filesystem, performs deterministic archive/checkpoint inspection and
ClamAV scans, deletes the bytes, then publishes canonical byte-free evidence.
It never imports torch, unpickles the checkpoint, or executes the model.
"""

from __future__ import annotations

from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import pickletools
import re
import shutil
import stat
import subprocess
import tarfile
import tempfile
from typing import Any
from urllib.error import HTTPError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen
import zipfile


PROJECT_ID = "reeditpro"
CONTROL_BUCKET = "reeditpro-production-reeditpro-control-plane-state"
MODEL_BUCKET = "reeditpro-production-reeditpro-model-artifacts"
JOB = "weeditpro-sam31-private-artifact-review"
CONFIRMATION = "review-exact-published-sam31-private-artifacts"
PUBLICATION_VERSION = (
    "canonical-sam3_1-official-artifact-publication-receipt-v1"
)
TERMS_VERSION = "canonical-sam3_1-authorized-terms-acceptance-v1"
CANDIDATE_VERSION = "canonical-sam3_1-source-runtime-candidate-v4"
ANALYSIS_VERSION = "canonical-sam3_1-private-artifact-static-analysis-v1"
REVIEW_VERSION = "canonical-sam3_1-private-artifact-review-bundle-v1"
SOURCE_REPOSITORY = "https://github.com/facebookresearch/sam3.git"
SOURCE_REVISION = "96914d2425f90a64f45ca977c2b5165418099543"
SOURCE_SIZE = 73_605_120
SOURCE_SHA256 = (
    "5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a"
)
SOURCE_LICENSE_SHA256 = (
    "4dea99bfaa016e21bc860d73f344236bd1e5c4977d1a9a8fd32f822b500ae1be"
)
CHECKPOINT_REPOSITORY = "facebook/sam3.1"
CHECKPOINT_REVISION = "daa63191845a41281374e725f4c9e51c7a824460"
CHECKPOINT_FILE = "sam3.1_multiplex.pt"
CHECKPOINT_SIZE = 3_502_755_717
CHECKPOINT_SHA256 = (
    "0567debeec80ba4ac6369540c6c248025283cb3ff2b92827509e57e2b3541cb6"
)
MAX_JSON_BYTES = 4 * 1024 * 1024
MAX_TAR_ENTRIES = 100_000
MAX_ZIP_ENTRIES = 1_000_000
MAX_PICKLE_BYTES = 256 * 1024 * 1024
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$")
RAW_SHA256 = re.compile(r"^[a-f0-9]{64}$")
PREFIXED_SHA256 = re.compile(r"^sha256:[a-f0-9]{64}$")
CONTROL_CHARACTERS = re.compile(r"[\x00-\x1f\x7f]")
DANGEROUS_PICKLE_TOKENS = (
    b"cposix\nsystem\n",
    b"cos\nsystem\n",
    b"csubprocess\n",
    b"cbuiltins\neval\n",
    b"cbuiltins\nexec\n",
    b"cbuiltins\nopen\n",
    b"cbuiltins\n__import__\n",
    b"cmarshal\n",
    b"csocket\n",
    b"curllib\n",
    b"crequests\n",
)


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def digest_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def digest_value(value: Any) -> str:
    return digest_bytes(canonical_bytes(value))


def safe_id(value: Any, label: str) -> str:
    if (
        not isinstance(value, str)
        or SAFE_ID.fullmatch(value) is None
        or ".." in value
    ):
        raise ValueError(f"{label} is invalid")
    return value


def exact_hash(value: Any, label: str, *, prefixed: bool = False) -> str:
    pattern = PREFIXED_SHA256 if prefixed else RAW_SHA256
    if not isinstance(value, str) or pattern.fullmatch(value) is None:
        raise ValueError(f"{label} is invalid")
    return value


def exact_object(value: Any, keys: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value.keys()) != keys:
        raise ValueError(f"{label} shape is invalid")
    return value


def metadata_token() -> str:
    request = Request(
        "http://metadata.google.internal/computeMetadata/v1/instance/"
        "service-accounts/default/token",
        headers={"Metadata-Flavor": "Google"},
        method="GET",
    )
    with urlopen(request, timeout=10) as response:
        value = json.loads(response.read(MAX_JSON_BYTES).decode("utf-8"))
    token = value.get("access_token") if isinstance(value, dict) else None
    if not isinstance(token, str) or len(token) < 32:
        raise ValueError("workload identity token is unavailable")
    return token


def authorized_request(url: str, *, method: str = "GET", body: bytes | None = None,
                       content_type: str | None = None) -> Request:
    headers = {"Authorization": f"Bearer {metadata_token()}"}
    if content_type:
        headers["Content-Type"] = content_type
    return Request(url, data=body, headers=headers, method=method)


def object_metadata(bucket: str, object_name: str,
                    generation: str | None = None) -> dict[str, Any]:
    query = {"fields": "bucket,name,generation,etag,size,contentType,metadata"}
    if generation:
        query["generation"] = generation
    url = (
        "https://storage.googleapis.com/storage/v1/b/"
        f"{quote(bucket, safe='')}/o/{quote(object_name, safe='')}?"
        f"{urlencode(query)}"
    )
    with urlopen(authorized_request(url), timeout=60) as response:
        value = json.loads(response.read(MAX_JSON_BYTES).decode("utf-8"))
    if not isinstance(value, dict):
        raise ValueError("GCS object metadata is invalid")
    return value


def validate_coordinate(value: Any, label: str, *, expected_size: int,
                        expected_hash: str) -> dict[str, Any]:
    coordinate = exact_object(value, {
        "projectId", "bucketName", "objectName", "generation", "etag",
        "byteLength", "sha256",
    }, label)
    if (
        coordinate["projectId"] != PROJECT_ID
        or coordinate["bucketName"] != MODEL_BUCKET
        or not isinstance(coordinate["objectName"], str)
        or not coordinate["objectName"].startswith("private/model-artifacts/sam3_1/")
        or ".." in coordinate["objectName"]
        or "\\" in coordinate["objectName"]
        or not isinstance(coordinate["generation"], str)
        or not re.fullmatch(r"[1-9][0-9]{0,30}", coordinate["generation"])
        or not isinstance(coordinate["etag"], str)
        or not coordinate["etag"]
        or coordinate["byteLength"] != expected_size
        or coordinate["sha256"] != expected_hash
    ):
        raise ValueError(f"{label} coordinate changed")
    return coordinate


def exact_metadata(coordinate: dict[str, Any], content_type: str) -> dict[str, Any]:
    value = object_metadata(
        coordinate["bucketName"], coordinate["objectName"],
        coordinate["generation"],
    )
    if (
        value.get("bucket") != coordinate["bucketName"]
        or value.get("name") != coordinate["objectName"]
        or value.get("generation") != coordinate["generation"]
        or value.get("etag") != coordinate["etag"]
        or int(value.get("size", -1)) != coordinate["byteLength"]
        or value.get("contentType") != content_type
    ):
        raise ValueError("GCS artifact metadata changed")
    return value


def read_json_object(bucket: str, object_name: str, generation: str | None = None) -> Any:
    query = {"alt": "media"}
    if generation:
        query["generation"] = generation
    url = (
        "https://storage.googleapis.com/download/storage/v1/b/"
        f"{quote(bucket, safe='')}/o/{quote(object_name, safe='')}?"
        f"{urlencode(query)}"
    )
    with urlopen(authorized_request(url), timeout=60) as response:
        body = response.read(MAX_JSON_BYTES + 1)
    if len(body) < 2 or len(body) > MAX_JSON_BYTES:
        raise ValueError("canonical JSON object byte length is invalid")
    value = json.loads(body.decode("utf-8"))
    if canonical_bytes(value) != body:
        raise ValueError("canonical JSON object serialization changed")
    return value


def download_artifact(coordinate: dict[str, Any], destination: Path,
                      content_type: str) -> None:
    before = exact_metadata(coordinate, content_type)
    url = (
        "https://storage.googleapis.com/download/storage/v1/b/"
        f"{quote(coordinate['bucketName'], safe='')}/o/"
        f"{quote(coordinate['objectName'], safe='')}?"
        f"{urlencode({'alt': 'media', 'generation': coordinate['generation']})}"
    )
    digest = hashlib.sha256()
    observed = 0
    request = authorized_request(url)
    with urlopen(request, timeout=14_400) as response, destination.open("xb") as target:
        while True:
            chunk = response.read(8 * 1024 * 1024)
            if not chunk:
                break
            observed += len(chunk)
            if observed > coordinate["byteLength"]:
                raise ValueError("artifact exceeded its exact byte length")
            digest.update(chunk)
            target.write(chunk)
        target.flush()
        os.fsync(target.fileno())
    after = exact_metadata(coordinate, content_type)
    if (
        observed != coordinate["byteLength"]
        or digest.hexdigest() != coordinate["sha256"]
        or before != after
    ):
        raise ValueError("artifact changed during exact generation reread")


def upload_create_only(bucket: str, object_name: str, value: Any) -> dict[str, Any]:
    body = canonical_bytes(value)
    if len(body) < 2 or len(body) > MAX_JSON_BYTES:
        raise ValueError("review record byte length is invalid")
    query = urlencode({"uploadType": "media", "name": object_name,
                       "ifGenerationMatch": "0"})
    url = (
        "https://storage.googleapis.com/upload/storage/v1/b/"
        f"{quote(bucket, safe='')}/o?{query}"
    )
    with urlopen(authorized_request(
        url, method="POST", body=body, content_type="application/json",
    ), timeout=120) as response:
        metadata = json.loads(response.read(MAX_JSON_BYTES).decode("utf-8"))
    generation = str(metadata.get("generation", ""))
    if (
        metadata.get("bucket") != bucket
        or metadata.get("name") != object_name
        or not re.fullmatch(r"[1-9][0-9]{0,30}", generation)
        or int(metadata.get("size", -1)) != len(body)
        or metadata.get("contentType") != "application/json"
    ):
        raise ValueError("review record create-only metadata is invalid")
    reread = read_json_object(bucket, object_name, generation)
    if canonical_bytes(reread) != body:
        raise ValueError("review record changed during exact reread")
    return {
        "objectName": object_name,
        "generation": generation,
        "etag": metadata.get("etag"),
        "byteLength": len(body),
        "sha256": digest_bytes(body),
    }


def safe_archive_path(value: str) -> str:
    if (
        not value
        or len(value) > 1024
        or value.startswith("/")
        or "\\" in value
        or CONTROL_CHARACTERS.search(value)
    ):
        raise ValueError("archive path is unsafe")
    path = PurePosixPath(value)
    if any(part in ("", ".", "..") for part in path.parts):
        raise ValueError("archive path is unsafe")
    return value.rstrip("/")


def normalized_source_path(value: str, prefix: str) -> str:
    safe = safe_archive_path(value)
    if safe == prefix.rstrip("/"):
        return ""
    if not safe.startswith(prefix):
        raise ValueError("source archive root prefix changed")
    normalized = safe[len(prefix):]
    if not normalized:
        return ""
    return safe_archive_path(normalized)


def inspect_source_archive(path: Path) -> dict[str, Any]:
    entries: list[dict[str, Any]] = []
    observed_paths: set[str] = set()
    regular_count = 0
    directory_count = 0
    total_regular_bytes = 0
    license_bytes: bytes | None = None
    with tarfile.open(path, mode="r:") as archive:
        members = archive.getmembers()
        if not members or len(members) > MAX_TAR_ENTRIES:
            raise ValueError("source archive entry count is invalid")
        roots = {PurePosixPath(member.name.rstrip("/")).parts[0] for member in members}
        expected_root = f"sam3-{SOURCE_REVISION}"
        if roots != {expected_root}:
            raise ValueError("source archive root changed")
        prefix = f"{expected_root}/"
        for member in members:
            normalized = normalized_source_path(member.name, prefix)
            if not normalized:
                if not member.isdir():
                    raise ValueError("source archive root entry is invalid")
                continue
            if normalized in observed_paths:
                raise ValueError("source archive contains duplicate entries")
            observed_paths.add(normalized)
            if member.isdir():
                directory_count += 1
                entries.append({"path": normalized, "type": "directory",
                                "mode": member.mode, "byteLength": 0})
                continue
            if not member.isfile() or member.issparse():
                raise ValueError("source archive contains a forbidden entry type")
            if member.size < 0 or member.size > SOURCE_SIZE:
                raise ValueError("source archive member byte length is invalid")
            stream = archive.extractfile(member)
            if stream is None:
                raise ValueError("source archive regular file is unreadable")
            digest = hashlib.sha256()
            content = bytearray() if normalized == "LICENSE" else None
            observed = 0
            while True:
                chunk = stream.read(1024 * 1024)
                if not chunk:
                    break
                observed += len(chunk)
                digest.update(chunk)
                if content is not None:
                    content.extend(chunk)
            if observed != member.size:
                raise ValueError("source archive member changed during read")
            if content is not None:
                license_bytes = bytes(content)
            regular_count += 1
            total_regular_bytes += observed
            entries.append({
                "path": normalized,
                "type": "regular_file",
                "mode": member.mode,
                "byteLength": observed,
                "sha256": digest.hexdigest(),
            })
    if license_bytes is None or digest_bytes(license_bytes) != SOURCE_LICENSE_SHA256:
        raise ValueError("pinned SAM License bytes changed")
    entries.sort(key=lambda entry: entry["path"])
    if len(entries) != regular_count + directory_count:
        raise ValueError("source archive manifest count changed")
    return {
        "entryCount": len(entries),
        "regularFileCount": regular_count,
        "directoryCount": directory_count,
        "totalRegularFileBytes": total_regular_bytes,
        "entrySetSha256": digest_value(entries),
        "canonicalRegularFilesAndDirectoriesOnly": True,
        "pathTraversalLinksDevicesFifosSocketsAndSparseEntriesAbsent": True,
        "duplicateEntriesAbsent": True,
        "exactArchiveBytesGenerationEtagLengthAndSha256Reread": True,
    }


def inspect_checkpoint(path: Path) -> dict[str, Any]:
    if not zipfile.is_zipfile(path):
        raise ValueError("checkpoint is not a PyTorch ZIP64 container")
    members: list[dict[str, Any]] = []
    names: set[str] = set()
    total_compressed = 0
    total_uncompressed = 0
    data_pickle: bytes | None = None
    data_pickle_path = ""
    with zipfile.ZipFile(path, mode="r", allowZip64=True) as archive:
        infos = archive.infolist()
        if not infos or len(infos) > MAX_ZIP_ENTRIES:
            raise ValueError("checkpoint member count is invalid")
        for info in infos:
            name = safe_archive_path(info.filename)
            if name in names:
                raise ValueError("checkpoint contains duplicate members")
            names.add(name)
            mode = (info.external_attr >> 16) & 0xFFFF
            if stat.S_ISLNK(mode) or info.flag_bits & 0x1:
                raise ValueError("checkpoint contains a link or encrypted member")
            if info.file_size < 0 or info.compress_size < 0:
                raise ValueError("checkpoint member size is invalid")
            total_compressed += info.compress_size
            total_uncompressed += info.file_size
            members.append({
                "path": name,
                "compressedBytes": info.compress_size,
                "uncompressedBytes": info.file_size,
                "compressionMethod": info.compress_type,
                "crc32": f"{info.CRC:08x}",
            })
            if name == "data.pkl" or name.endswith("/data.pkl"):
                if data_pickle is not None or info.file_size > MAX_PICKLE_BYTES:
                    raise ValueError("checkpoint data.pkl identity or size is invalid")
                data_pickle = archive.read(info)
                data_pickle_path = name
        if archive.comment:
            raise ValueError("checkpoint ZIP comment is forbidden")
    if data_pickle is None or not data_pickle:
        raise ValueError("checkpoint data.pkl is missing")
    lowered = data_pickle.lower()
    if any(token in lowered for token in DANGEROUS_PICKLE_TOKENS):
        raise ValueError("checkpoint pickle contains a dangerous global reference")
    opcode_names: list[str] = []
    global_refs: set[str] = set()
    for opcode, argument, _position in pickletools.genops(data_pickle):
        opcode_names.append(opcode.name)
        if opcode.name == "GLOBAL":
            if not isinstance(argument, str):
                raise ValueError("checkpoint GLOBAL opcode is malformed")
            global_refs.add(argument)
        elif opcode.name == "STACK_GLOBAL":
            raise ValueError("checkpoint STACK_GLOBAL cannot be statically resolved")
        elif opcode.name in {"EXT1", "EXT2", "EXT4"}:
            raise ValueError("checkpoint pickle extension opcodes are forbidden")
    if not opcode_names:
        raise ValueError("checkpoint pickle contains no opcodes")
    members.sort(key=lambda member: member["path"])
    return {
        "containerFormat": "pytorch_zip64_checkpoint",
        "memberCount": len(members),
        "totalCompressedBytes": total_compressed,
        "totalUncompressedBytes": total_uncompressed,
        "memberSetSha256": digest_value(members),
        "dataPicklePath": data_pickle_path,
        "dataPickleByteLength": len(data_pickle),
        "dataPickleSha256": digest_bytes(data_pickle),
        "pickleOpcodeCount": len(opcode_names),
        "pickleOpcodeSetSha256": digest_value(sorted(set(opcode_names))),
        "pickleGlobalReferenceSetSha256": digest_value(sorted(global_refs)),
        "dangerousGlobalReferenceCount": 0,
        "encryptedMembersAbsent": True,
        "pathTraversalLinksDevicesAndDuplicateMembersAbsent": True,
        "exactCoordinateShaLengthGenerationAndEtagReread": True,
    }


def clamav_scan(path: Path, profile: str) -> dict[str, Any]:
    archive_scan = profile == "complete_source_archive_with_archive_recursion"
    arguments = [
        "clamscan", "--infected",
        f"--scan-archive={'yes' if archive_scan else 'no'}",
        "--max-filesize=4095M", "--max-scansize=4095M",
        "--max-recursion=32", "--max-files=1000000", "--max-scantime=0",
        str(path),
    ]
    completed = subprocess.run(
        arguments,
        check=False,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=14_400,
        env={"PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
             "TZ": "Etc/UTC"},
    )
    output = completed.stdout
    if completed.returncode != 0:
        raise ValueError(f"ClamAV scan failed with status {completed.returncode}")
    version_line = subprocess.run(
        ["clamscan", "--version"], check=True, stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30,
    ).stdout.strip()
    version_match = re.fullmatch(
        r"ClamAV ([0-9]+\.[0-9]+\.[0-9]+)/([1-9][0-9]*)/(.+)",
        version_line,
    )
    signatures_match = re.search(r"^Known viruses:\s+([1-9][0-9]*)$", output, re.M)
    infected_match = re.search(r"^Infected files:\s+([0-9]+)$", output, re.M)
    scanned_match = re.search(r"^Scanned files:\s+([1-9][0-9]*)$", output, re.M)
    if (
        version_match is None
        or version_match.group(1) != "1.4.3"
        or signatures_match is None
        or int(signatures_match.group(1)) < 1_000_000
        or infected_match is None
        or infected_match.group(1) != "0"
        or scanned_match is None
    ):
        raise ValueError("ClamAV result evidence is incomplete")
    published = parsedate_to_datetime(version_match.group(3))
    if published.tzinfo is None:
        published = published.replace(tzinfo=timezone.utc)
    published = published.astimezone(timezone.utc)
    return {
        "engine": "ClamAV",
        "engineVersion": "1.4.3",
        "signatureDatabaseVersion": version_match.group(2),
        "signatureDatabasePublishedAt": published.isoformat().replace("+00:00", "Z"),
        "scanProfile": profile,
        "exactArtifactBytesScanned": True,
        "signaturesLoaded": int(signatures_match.group(1)),
        "infectedFiles": 0,
        "scanPassed": True,
    }


def validate_publication(value: Any, publication_id: str,
                         publication_hash: str) -> dict[str, Any]:
    publication = exact_object(value, {
        "schemaVersion", "source", "evidenceClass", "status",
        "publicationAttemptId", "operationId", "candidateRef",
        "termsAcceptanceRef", "sourceArchive", "checkpoint", "retryPolicy",
        "runtimeBinding", "privateBoundary", "authority", "publishedAt",
        "publicationReceiptHash",
    }, "publication")
    if (
        publication["schemaVersion"] != PUBLICATION_VERSION
        or publication["source"] != "canonical_weeditpro_sam3_1_official_artifact_publisher"
        or publication["evidenceClass"] != "canonical_private_publication"
        or publication["status"] != "published_pending_security_license_and_compatibility_review"
        or publication["publicationAttemptId"] != publication_id
        or publication["publicationReceiptHash"] != publication_hash
    ):
        raise ValueError("official artifact publication identity changed")
    without_hash = dict(publication)
    without_hash.pop("publicationReceiptHash")
    if digest_value(without_hash) != publication_hash:
        raise ValueError("official artifact publication hash changed")
    source = exact_object(publication["sourceArchive"], {
        "repository", "revision", "archiveFormat", "coordinate",
        "officialPinnedSourceOnly", "expectedByteLengthAndSha256Enforced",
        "createOnlyWriteAndExactGenerationReread",
    }, "publication source")
    checkpoint = exact_object(publication["checkpoint"], {
        "repository", "revision", "fileName", "coordinate",
        "officialGatedRepositoryOnly", "authorizedHumanTermsAcceptanceReread",
        "accessTokenReadFromPinnedSecretVersion",
        "accessTokenOrSignedRedirectPersistedOrReturned",
        "createOnlyWriteAndExactGenerationReread",
    }, "publication checkpoint")
    if (
        source["repository"] != SOURCE_REPOSITORY
        or source["revision"] != SOURCE_REVISION
        or source["archiveFormat"] != "git_archive_tar_uncompressed"
        or source["officialPinnedSourceOnly"] is not True
        or source["expectedByteLengthAndSha256Enforced"] is not True
        or source["createOnlyWriteAndExactGenerationReread"] is not True
        or checkpoint["repository"] != CHECKPOINT_REPOSITORY
        or checkpoint["revision"] != CHECKPOINT_REVISION
        or checkpoint["fileName"] != CHECKPOINT_FILE
        or checkpoint["officialGatedRepositoryOnly"] is not True
        or checkpoint["authorizedHumanTermsAcceptanceReread"] is not True
        or checkpoint["accessTokenReadFromPinnedSecretVersion"] is not True
        or checkpoint["accessTokenOrSignedRedirectPersistedOrReturned"] is not False
        or checkpoint["createOnlyWriteAndExactGenerationReread"] is not True
    ):
        raise ValueError("official source/checkpoint publication changed")
    source["coordinate"] = validate_coordinate(
        source["coordinate"], "source", expected_size=SOURCE_SIZE,
        expected_hash=SOURCE_SHA256,
    )
    checkpoint["coordinate"] = validate_coordinate(
        checkpoint["coordinate"], "checkpoint", expected_size=CHECKPOINT_SIZE,
        expected_hash=CHECKPOINT_SHA256,
    )
    return publication


def validate_terms(publication: dict[str, Any]) -> dict[str, Any]:
    ref = exact_object(publication["termsAcceptanceRef"], {
        "id", "version", "contentHash",
    }, "terms ref")
    terms_id = safe_id(ref["id"], "terms ref id")
    terms_hash = exact_hash(ref["contentHash"], "terms ref hash", prefixed=True)[7:]
    if ref["version"] != 1:
        raise ValueError("terms ref version changed")
    object_name = (
        f"private/sam3_1/terms-acceptance/v1/{terms_id}-{terms_hash[:24]}.json"
    )
    terms = read_json_object(CONTROL_BUCKET, object_name)
    if (
        not isinstance(terms, dict)
        or terms.get("schemaVersion") != TERMS_VERSION
        or terms.get("evidenceClass") != "canonical_private_reread"
        or terms.get("acceptanceRecordId") != terms_id
        or terms.get("acceptanceRecordVersion") != 1
        or terms.get("acceptanceRecordHash") != terms_hash
        or terms.get("acceptedByAuthorizedOrganizationRepresentative") is not True
        or terms.get("authorizedRepresentativeAuthorityRereadVerified") is not True
        or terms.get("officialRepositoryAccessGrantedAndReread") is not True
        or terms.get("automatedAcceptanceUsed") is not False
        or terms.get("thirdPartyMirrorUsed") is not False
        or terms.get("browserOrWorkerSecretIncluded") is not False
    ):
        raise ValueError("authenticated SAM terms acceptance changed")
    without_hash = dict(terms)
    without_hash.pop("acceptanceRecordHash")
    if digest_value(without_hash) != terms_hash:
        raise ValueError("authenticated SAM terms hash changed")
    return terms


def reference(value_id: str, content_hash: str) -> dict[str, Any]:
    return {"id": value_id, "version": 1, "contentHash": f"sha256:{content_hash}"}


def build_analysis(publication: dict[str, Any], terms: dict[str, Any],
                   source_manifest: dict[str, Any], source_scan: dict[str, Any],
                   checkpoint_manifest: dict[str, Any],
                   checkpoint_scan: dict[str, Any], reviewed_at: str) -> dict[str, Any]:
    publication_hash = publication["publicationReceiptHash"]
    publication_ref = {
        "id": publication["publicationAttemptId"],
        "version": 1,
        "schemaVersion": PUBLICATION_VERSION,
        "contentHash": f"sha256:{publication_hash}",
    }
    candidate_ref = dict(publication["candidateRef"])
    candidate_ref["schemaVersion"] = CANDIDATE_VERSION
    terms_ref = dict(publication["termsAcceptanceRef"])
    terms_ref["schemaVersion"] = TERMS_VERSION
    source_coordinate = publication["sourceArchive"]["coordinate"]
    checkpoint_coordinate = publication["checkpoint"]["coordinate"]
    payload = {
        "schemaVersion": ANALYSIS_VERSION,
        "source": "canonical_weeditpro_sam3_1_private_artifact_static_analysis_owner",
        "evidenceClass": "canonical_private_exact_byte_review",
        "status": "passed_for_private_artifact_ingest",
        "analysisId": f"sam31-static-analysis-{publication_hash[:24]}",
        "analysisVersion": 1,
        "officialArtifactPublicationRef": publication_ref,
        "candidateRef": candidate_ref,
        "termsAcceptanceRef": terms_ref,
        "sourceArchive": {
            "repository": SOURCE_REPOSITORY,
            "revision": SOURCE_REVISION,
            "coordinate": source_coordinate,
            "artifactRef": reference(
                f"sam31-source-artifact-{SOURCE_SHA256[:24]}", SOURCE_SHA256,
            ),
            "archiveManifest": source_manifest,
            "license": {
                "path": "LICENSE",
                "sha256": SOURCE_LICENSE_SHA256,
                "title": "SAM License",
                "lastUpdated": "2025-11-19",
                "officialPinnedSourceLicenseReread": True,
                "acceptedTermsBindOrganizationUse": True,
                "privateCommercialUseApprovedByAuthorizedOrganizationRepresentative": True,
                "publicRedistributionAuthorized": False,
                "legalCounselApprovalClaimed": False,
            },
            "revisionReview": {
                "commitSignatureStatus": "unsigned",
                "officialRepositoryAndPinnedRevisionExact": True,
                "unsignedRevisionAcceptedForPrivateQualification": True,
                "unsignedRevisionAcceptedForProduction": False,
            },
            "malwareScan": source_scan,
            "securityReviewPassed": True,
            "malwareScanPassed": True,
        },
        "checkpoint": {
            "repository": CHECKPOINT_REPOSITORY,
            "revision": CHECKPOINT_REVISION,
            "fileName": CHECKPOINT_FILE,
            "coordinate": checkpoint_coordinate,
            "artifactRef": reference(
                f"sam31-checkpoint-artifact-{CHECKPOINT_SHA256[:24]}",
                CHECKPOINT_SHA256,
            ),
            "manifest": checkpoint_manifest,
            "malwareScan": checkpoint_scan,
            "checkpointBytesDeserializedDuringReview": False,
            "torchWeightsOnlyLoadRequired": True,
            "executablePickleTrustGranted": False,
            "exactWeightsOnlyLoadMustPassInA100Qualification": True,
            "licenseApprovedForWeEditProPrivateCommercialUse": True,
            "securityReviewPassed": True,
            "malwareScanPassed": True,
        },
        "reviewBoundary": {
            "exactOfficialPublishedCoordinatesOnly": True,
            "checkpointLoadedOrModelExecuted": False,
            "sourceExtractedOrCheckpointPersistedOutsideEphemeralCloudJob": False,
            "developerMachineArtifactCopyCreated": False,
            "thirdPartyScannerUploadUsed": False,
            "callerSecurityLicenseOrMalwareClaimsAccepted": False,
            "sourceAndCheckpointDeletedFromEphemeralStorageAtExit": True,
            "compatibilityQualificationStillRequired": True,
        },
        "authority": {
            "authenticatedStaticReviewEvidenceOnly": True,
            "artifactIngestAuthorized": True,
            "imageBuildAuthorized": False,
            "gpuRuntimeAuthorized": False,
            "providerOrModelExecuted": False,
            "customerCreditsMutated": False,
            "qaApproved": False,
            "publicDeliveryAuthorized": False,
            "productionReady": False,
        },
        "reviewedAt": reviewed_at,
    }
    return {**payload, "analysisHash": digest_value(payload)}


def build_review_bundle(publication: dict[str, Any], analysis: dict[str, Any]) -> dict[str, Any]:
    analysis_ref = reference(analysis["analysisId"], analysis["analysisHash"])
    payload = {
        "schemaVersion": REVIEW_VERSION,
        "source": "canonical_weeditpro_sam3_1_private_artifact_review_owner",
        "evidenceClass": "authenticated_private_owner_reread",
        "status": "approved_for_private_artifact_ingest",
        "reviewBundleId": f"sam31-private-artifact-review-{analysis['analysisHash'][:24]}",
        "reviewBundleVersion": 1,
        "officialArtifactPublicationRef": analysis["officialArtifactPublicationRef"],
        "candidateRef": analysis["candidateRef"],
        "termsAcceptanceRef": publication["termsAcceptanceRef"],
        "sourceArchive": {
            "coordinate": analysis["sourceArchive"]["coordinate"],
            "artifactRef": analysis["sourceArchive"]["artifactRef"],
            "licenseRef": analysis_ref,
            "securityReviewRef": analysis_ref,
            "malwareScanRef": analysis_ref,
            "unsignedSourceRevisionAcceptanceRef": analysis_ref,
            "licenseApprovedForWeEditProPrivateCommercialUse": True,
            "securityReviewPassed": True,
            "malwareScanPassed": True,
            "unsignedPinnedRevisionAccepted": True,
        },
        "checkpoint": {
            "coordinate": analysis["checkpoint"]["coordinate"],
            "artifactRef": analysis["checkpoint"]["artifactRef"],
            "manifestRef": analysis_ref,
            "licenseRef": analysis_ref,
            "securityReviewRef": analysis_ref,
            "malwareScanRef": analysis_ref,
            "manifestBindsExactCoordinateShaAndLength": True,
            "licenseApprovedForWeEditProPrivateCommercialUse": True,
            "securityReviewPassed": True,
            "malwareScanPassed": True,
            "torchWeightsOnlyLoadRequired": True,
            "executablePickleTrustGranted": False,
        },
        "reviewBoundary": {
            "exactPublishedSourceAndCheckpointCoordinatesReviewed": True,
            "officialGatedCheckpointOnly": True,
            "thirdPartyMirrorAccepted": False,
            "callerReviewClaimsAccepted": False,
            "callerUrlPathBytesOrCredentialsAccepted": False,
            "termsAuthorityRemainsExternal": True,
            "securityLicenseAndMalwareOwnersRemainExternal": True,
        },
        "authority": {
            "authenticatedReviewEvidenceOnly": True,
            "artifactIngestReceiptCreated": False,
            "imageBuildAuthorized": False,
            "gpuRuntimeAuthorized": False,
            "providerOrModelExecuted": False,
            "customerCreditsMutated": False,
            "qaApproved": False,
            "publicDeliveryAuthorized": False,
            "productionReady": False,
        },
        "reviewedAt": analysis["reviewedAt"],
    }
    return {**payload, "reviewBundleHash": digest_value(payload)}


def validate_invocation() -> tuple[str, str]:
    if (
        os.environ.get("CLOUD_RUN_JOB") != JOB
        or os.environ.get("CLOUD_RUN_TASK_INDEX") != "0"
        or os.environ.get("CLOUD_RUN_TASK_ATTEMPT") != "0"
        or os.environ.get("WEEDITPRO_SAM31_PRIVATE_ARTIFACT_REVIEW_CONFIRM")
        != CONFIRMATION
    ):
        raise ValueError("exact dedicated review job invocation is required")
    safe_id(os.environ.get("CLOUD_RUN_EXECUTION"), "execution id")
    publication_id = safe_id(
        os.environ.get("WEEDITPRO_SAM31_PUBLICATION_ID"), "publication id",
    )
    publication_hash = exact_hash(
        os.environ.get("WEEDITPRO_SAM31_PUBLICATION_SHA256"),
        "publication hash",
    )
    return publication_id, publication_hash


def main() -> None:
    publication_id, publication_hash = validate_invocation()
    publication_object = (
        "private/sam3_1/official-artifact-publication/v1/"
        f"{publication_id}-{publication_hash[:24]}.json"
    )
    publication = validate_publication(
        read_json_object(CONTROL_BUCKET, publication_object),
        publication_id,
        publication_hash,
    )
    terms = validate_terms(publication)
    temporary_root = Path(tempfile.mkdtemp(prefix="sam31-review-", dir="/tmp"))
    os.chmod(temporary_root, 0o700)
    source_path = temporary_root / "sam3-source.tar"
    checkpoint_path = temporary_root / CHECKPOINT_FILE
    try:
        download_artifact(
            publication["sourceArchive"]["coordinate"], source_path,
            "application/x-tar",
        )
        source_manifest = inspect_source_archive(source_path)
        source_scan = clamav_scan(
            source_path, "complete_source_archive_with_archive_recursion",
        )
        download_artifact(
            publication["checkpoint"]["coordinate"], checkpoint_path,
            "application/octet-stream",
        )
        checkpoint_manifest = inspect_checkpoint(checkpoint_path)
        checkpoint_scan = clamav_scan(
            checkpoint_path,
            "complete_checkpoint_raw_bytes_without_archive_execution",
        )
        reviewed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        analysis = build_analysis(
            publication, terms, source_manifest, source_scan,
            checkpoint_manifest, checkpoint_scan, reviewed_at,
        )
        review = build_review_bundle(publication, analysis)
    finally:
        shutil.rmtree(temporary_root, ignore_errors=False)
    if temporary_root.exists():
        raise ValueError("ephemeral review artifacts were not deleted")
    analysis_object = (
        "private/sam3_1/artifact-static-analysis/v1/"
        f"{analysis['analysisId']}-{analysis['analysisHash'][:24]}.json"
    )
    review_object = (
        "private/sam3_1/artifact-review/v1/"
        f"{review['reviewBundleId']}-{review['reviewBundleHash'][:24]}.json"
    )
    analysis_coordinate = upload_create_only(
        CONTROL_BUCKET, analysis_object, analysis,
    )
    review_coordinate = upload_create_only(CONTROL_BUCKET, review_object, review)
    print(json.dumps({
        "operation": "canonical_sam3_1_private_artifact_static_review",
        "status": "approved_for_private_artifact_ingest",
        "analysisRef": reference(analysis["analysisId"], analysis["analysisHash"]),
        "reviewBundleRef": {
            **reference(review["reviewBundleId"], review["reviewBundleHash"]),
            "schemaVersion": REVIEW_VERSION,
        },
        "analysisCoordinate": analysis_coordinate,
        "reviewCoordinate": review_coordinate,
        "checkpointLoadedOrModelExecuted": False,
        "developerMachineArtifactCopyCreated": False,
        "imageBuildStarted": False,
        "gpuRuntimeStarted": False,
        "customerCreditsMutated": False,
        "productionReady": False,
    }, sort_keys=True, separators=(",", ":")))


if __name__ == "__main__":
    try:
        main()
    except HTTPError as error:
        raise RuntimeError(
            f"authenticated Google Cloud object operation failed: {error.code}"
        ) from error
