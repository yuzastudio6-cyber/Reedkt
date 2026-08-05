#!/usr/bin/env python3
"""Fixed Track All SAM 3.1 Object Multiplex V2 private worker.

This is a source-complete, one-attempt worker for
``tool.sam3_1.track_masklets.v2``. It reads one server-created task from a
fixed private invocation mount and never accepts stdin, a caller path/URL,
model, checkpoint, command, GPU, retry, fallback, or price. The candidate is
not execution-admissible until every server route gate passes.
"""

from __future__ import annotations

import contextlib
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import re
import signal
import stat
import struct
import sys
import time
from typing import Any


TASK_VERSION = "track_all_sam3_1_real_private_worker_task_v1"
RESPONSE_VERSION = "track_all_sam3_1_real_private_worker_protocol_v1"
OPERATION_ID = "tool.sam3_1.track_masklets.v2"
SOURCE_REVISION = "96914d2425f90a64f45ca977c2b5165418099543"
CHECKPOINT_REVISION = "daa63191845a41281374e725f4c9e51c7a824460"
CHECKPOINT_PATH = Path(
    "/mnt/reeditpro/model-artifacts/sam3_1/sam3.1_multiplex.pt"
)
INVOCATION_PARENT = Path(
    "/mnt/reeditpro/private/track_all/sam3_1/v2/invocations"
)
MAX_TASK_BYTES = 2 * 1024 * 1024
MAX_CHECKPOINT_BYTES = 8 * 1024 * 1024 * 1024
MAX_SOURCE_BYTES = 2 * 1024 * 1024 * 1024
MAX_FRAMES = 240
MAX_OBJECTS = 16
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,179}$")
SHA256 = re.compile(r"^[a-f0-9]{64}$")
PREFIXED_SHA256 = re.compile(r"^sha256:[a-f0-9]{64}$")
OBJECT_ID = re.compile(r"^object_([0-9]{3})$")
FORBIDDEN_TEXT = re.compile(
    r"(?:[a-z]+://|file:|data:|blob:|javascript:|\\|\.\.|\$\(|`|&&|\|\||;)",
    re.IGNORECASE,
)

cancel_requested = False
stage = "bootstrap"


def stable_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def exact_keys(value: Any, keys: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != keys:
        raise ValueError(f"{label} shape is invalid")
    return value


def exact_id(value: Any, label: str) -> str:
    if (
        not isinstance(value, str)
        or SAFE_ID.fullmatch(value) is None
        or ".." in value
    ):
        raise ValueError(f"{label} is invalid")
    return value


def exact_sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or SHA256.fullmatch(value) is None:
        raise ValueError(f"{label} is invalid")
    return value


def exact_prefixed_sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or PREFIXED_SHA256.fullmatch(value) is None:
        raise ValueError(f"{label} is invalid")
    return value


def exact_int(value: Any, minimum: int, maximum: int, label: str) -> int:
    if (
        isinstance(value, bool)
        or not isinstance(value, int)
        or value < minimum
        or value > maximum
    ):
        raise ValueError(f"{label} is invalid")
    return value


def exact_ref(value: Any, label: str) -> dict[str, Any]:
    value = exact_keys(value, {"id", "version", "contentHash"}, label)
    exact_id(value["id"], f"{label} id")
    exact_int(value["version"], 1, 2**31 - 1, f"{label} version")
    exact_prefixed_sha(value["contentHash"], f"{label} content hash")
    return value


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace(
        "+00:00", "Z"
    )


def read_regular_file(
    path: Path, maximum_bytes: int, *, retain: bool = False
) -> tuple[int, str, bytes | None]:
    if path.is_symlink():
        raise ValueError("private artifact symlinks are forbidden")
    flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0)
    flags |= getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(path, flags)
    digest = hashlib.sha256()
    chunks: list[bytes] | None = [] if retain else None
    observed = 0
    try:
        initial = os.fstat(descriptor)
        if (
            not stat.S_ISREG(initial.st_mode)
            or initial.st_size <= 0
            or initial.st_size > maximum_bytes
        ):
            raise ValueError("private artifact size or type is invalid")
        while True:
            chunk = os.read(descriptor, 1024 * 1024)
            if not chunk:
                break
            observed += len(chunk)
            if observed > maximum_bytes:
                raise ValueError("private artifact exceeded its byte bound")
            digest.update(chunk)
            if chunks is not None:
                chunks.append(chunk)
        final = os.fstat(descriptor)
        if (
            observed != initial.st_size
            or final.st_dev != initial.st_dev
            or final.st_ino != initial.st_ino
            or final.st_size != initial.st_size
            or final.st_mtime_ns != initial.st_mtime_ns
        ):
            raise ValueError("private artifact changed during reread")
        return observed, digest.hexdigest(), (
            b"".join(chunks) if chunks is not None else None
        )
    finally:
        os.close(descriptor)


def parse_invocation() -> tuple[str, Path, Path, Path, Path]:
    invocation_id = exact_id(
        os.environ.get("REEDITPRO_GPU_INVOCATION_ID"), "invocation id"
    )
    accelerator = os.environ.get("WEEDITPRO_GPU_ACCELERATOR_CLASS")
    if accelerator not in {"nvidia_a100_80gb", "nvidia_l4"}:
        raise ValueError("fixed accelerator environment is invalid")
    invocation_root = INVOCATION_PARENT / invocation_id
    if invocation_root.is_symlink() or not invocation_root.is_dir():
        raise ValueError("private invocation root is unavailable")
    return (
        invocation_id,
        invocation_root / "task.json",
        invocation_root / "mask-proxy.mp4",
        invocation_root / "masklets",
        invocation_root / "response.json",
    )


def verify_hash_record(value: dict[str, Any], hash_key: str, label: str) -> None:
    digest = exact_sha(value.get(hash_key), f"{label} hash")
    core = dict(value)
    core.pop(hash_key)
    if sha256_bytes(stable_json_bytes(core)) != digest:
        raise ValueError(f"{label} hash changed")


def validate_range(value: Any, label: str) -> dict[str, Any]:
    value = exact_keys(
        value, {"startFrameInclusive", "endFrameExclusive", "fps"}, label
    )
    start = exact_int(value["startFrameInclusive"], 0, 2**31 - 1, f"{label} start")
    end = exact_int(value["endFrameExclusive"], 1, 2**31 - 1, f"{label} end")
    if end <= start or value["fps"] not in {24, 25, 30, 50, 60}:
        raise ValueError(f"{label} is invalid")
    return value


def validate_prompt(value: Any, chunk: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("SAM prompt is invalid")
    prompt_kind = value.get("promptKind")
    common = {"promptKind", "conceptStageId", "objectId", "frameIndex", "rawUserChatIncluded"}
    if prompt_kind == "text_concept":
        exact_keys(value, common | {"compiledConcept", "compiledPromptHash"}, "text prompt")
        concept = value["compiledConcept"]
        if (
            not isinstance(concept, str)
            or not 1 <= len(concept) <= 300
            or FORBIDDEN_TEXT.search(concept) is not None
        ):
            raise ValueError("compiled concept is unsafe")
        exact_sha(value["compiledPromptHash"], "compiled prompt hash")
    elif prompt_kind in {"positive_points", "negative_points"}:
        exact_keys(value, common | {"points"}, "point prompt")
        if not isinstance(value["points"], list) or not 1 <= len(value["points"]) <= 32:
            raise ValueError("point prompt count is invalid")
        for point in value["points"]:
            exact_keys(point, {"x", "y"}, "point")
            if any(
                isinstance(point[key], bool)
                or not isinstance(point[key], (int, float))
                or not 0 <= point[key] <= 1
                for key in ("x", "y")
            ):
                raise ValueError("point geometry is invalid")
    elif prompt_kind == "bounding_box":
        exact_keys(value, common | {"box"}, "box prompt")
        box = exact_keys(value["box"], {"x", "y", "width", "height"}, "box")
        if any(
            isinstance(box[key], bool)
            or not isinstance(box[key], (int, float))
            for key in box
        ) or not (
            0 <= box["x"] < 1
            and 0 <= box["y"] < 1
            and 0 < box["width"] <= 1 - box["x"]
            and 0 < box["height"] <= 1 - box["y"]
        ):
            raise ValueError("box geometry is invalid")
    else:
        raise ValueError("SAM prompt kind is unsupported")
    exact_id(value["conceptStageId"], "concept stage id")
    if OBJECT_ID.fullmatch(value["objectId"]) is None:
        raise ValueError("anonymous object id is invalid")
    frame_index = exact_int(value["frameIndex"], 0, 2**31 - 1, "prompt frame")
    if not chunk["startFrameInclusive"] <= frame_index < chunk["endFrameExclusive"]:
        raise ValueError("prompt is outside the bounded chunk")
    if value["rawUserChatIncluded"] is not False:
        raise ValueError("raw user chat reached SAM")
    return value


def validate_plan(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("session plan is invalid")
    verify_hash_record(value, "sessionPlanHash", "session plan")
    required = {
        "schemaVersion", "operationId", "historicalOperationPreserved",
        "skillManifestRef", "sessionId", "assignmentId", "assignmentHash",
        "ownerUserId", "workspaceId", "projectId", "editSessionId", "planRef",
        "approvedSnapshotRef", "approvedWorkItemRef", "executionAttemptRef",
        "workerLeaseRef", "fundedReservationRef", "source", "targetGroup",
        "objectBudget", "actions", "terminalClosePolicy", "routeAuthority",
        "attemptPolicy", "costAuthority",
        "callerSelectedModelModuleClassCheckpointCommandGpuEndpointPathUrlRetryFallbackOrPriceAccepted",
        "rawUserChatIncluded", "qaApproved", "publicDeliveryAuthorized",
        "productionAuthorityGranted", "sessionPlanHash",
    }
    exact_keys(value, required, "session plan")
    if (
        value["schemaVersion"] != "track_all_sam3_1_masklet_session_plan_v2"
        or value["operationId"] != OPERATION_ID
        or value["rawUserChatIncluded"] is not False
        or value[
            "callerSelectedModelModuleClassCheckpointCommandGpuEndpointPathUrlRetryFallbackOrPriceAccepted"
        ] is not False
        or value["qaApproved"] is not False
        or value["publicDeliveryAuthorized"] is not False
        or value["productionAuthorityGranted"] is not False
    ):
        raise ValueError("session authority is invalid")
    for key in (
        "sessionId", "assignmentId", "ownerUserId", "workspaceId", "projectId",
        "editSessionId",
    ):
        exact_id(value[key], f"plan {key}")
    exact_sha(value["assignmentHash"], "assignment hash")
    source = value["source"]
    if not isinstance(source, dict) or set(source) != {
        "artifactRef", "sourceChecksum", "authorizedRange", "chunkRange",
        "decodedFrameCount", "sourceResolutionPreserved", "sourceRangePreserved",
        "variableFrameRateAllowed", "callerPathOrUrlAccepted",
    }:
        raise ValueError("source authority is invalid")
    exact_sha(source["sourceChecksum"], "source checksum")
    chunk = validate_range(source["chunkRange"], "chunk range")
    authorized = validate_range(source["authorizedRange"], "authorized range")
    frame_count = chunk["endFrameExclusive"] - chunk["startFrameInclusive"]
    if (
        frame_count != exact_int(source["decodedFrameCount"], 1, MAX_FRAMES, "frame count")
        or chunk["fps"] != authorized["fps"]
        or chunk["startFrameInclusive"] < authorized["startFrameInclusive"]
        or chunk["endFrameExclusive"] > authorized["endFrameExclusive"]
        or source["sourceResolutionPreserved"] is not True
        or source["sourceRangePreserved"] is not True
        or source["variableFrameRateAllowed"] is not False
        or source["callerPathOrUrlAccepted"] is not False
    ):
        raise ValueError("source range authority is invalid")
    target = value["targetGroup"]
    if not isinstance(target, dict):
        raise ValueError("target group is invalid")
    object_ids = target.get("objectIds")
    if (
        not isinstance(object_ids, list)
        or not 1 <= len(object_ids) <= MAX_OBJECTS
        or len(set(object_ids)) != len(object_ids)
        or any(OBJECT_ID.fullmatch(item) is None for item in object_ids)
        or target.get("anonymousIdentityOnly") is not True
        or target.get("realWorldIdentityRecognitionAllowed") is not False
    ):
        raise ValueError("anonymous object authority is invalid")
    actions = value["actions"]
    if not isinstance(actions, list) or len(actions) < 3:
        raise ValueError("session actions are invalid")
    for index, action in enumerate(actions, start=1):
        if not isinstance(action, dict) or action.get("sequence") != index:
            raise ValueError("session action sequence is invalid")
        if action.get("action") == "add_prompt":
            validate_prompt(action.get("prompt"), chunk)
        elif action.get("action") == "propagate":
            validate_range(action.get("range"), "propagation range")
        elif action.get("action") not in {
            "start_session", "remove_object", "reset_session", "cancel_session"
        }:
            raise ValueError("session action is unsupported")
    route = value["routeAuthority"]
    if (
        not isinstance(route, dict)
        or route.get("exactSourceRevision") != SOURCE_REVISION
        or route.get("exactCheckpointRevision") != CHECKPOINT_REVISION
        or route.get("exactSourceCheckpointCompatibilityRequired") is not True
        or route.get("strictCheckpointLoadRequired") is not True
        or route.get("runtimeDownloadAllowed") is not False
        or route.get("privateOutputRequired") is not True
        or any(route.get(key) is not False for key in (
            "modelSelectionIncluded", "acceleratorSelectionIncluded",
            "executableSelectionIncluded", "pathOrUrlSelectionIncluded",
            "maskPromptingQualified",
        ))
    ):
        raise ValueError("SAM route authority is invalid")
    attempts = value["attemptPolicy"]
    if (
        not isinstance(attempts, dict)
        or attempts.get("modelSubmissionOrdinal") != 1
        or attempts.get("automaticRetryCount") != 0
        or attempts.get("approvedPromptRefinementCeiling") != 1
        or attempts.get("automaticAlternateModelFallbackCount") != 0
        or attempts.get("unknownOutcomeResubmissionAllowed") is not False
        or attempts.get("reconcileExactAttemptBeforeNewSubmission") is not True
    ):
        raise ValueError("attempt authority is invalid")
    return value


def validate_task(value: Any, invocation_id: str) -> dict[str, Any]:
    value = exact_keys(
        value,
        {
            "schemaVersion", "operationId", "invocationId", "sessionPlan",
            "runtimeProfileHash", "routeGateReportHash", "checkpointSha256",
            "checkpointByteLength", "runtimeImageDigest", "accelerator",
            "explicitPrivateCanaryAuthorityRef", "preparedAt",
            "callerPathUrlBytesCommandModelCheckpointGpuRouteRetryFallbackPriceOrCredentialIncluded",
            "taskHash",
        },
        "worker task",
    )
    verify_hash_record(value, "taskHash", "worker task")
    if (
        value["schemaVersion"] != TASK_VERSION
        or value["operationId"] != OPERATION_ID
        or value["invocationId"] != invocation_id
        or value[
            "callerPathUrlBytesCommandModelCheckpointGpuRouteRetryFallbackPriceOrCredentialIncluded"
        ] is not False
        or value["accelerator"] != os.environ["WEEDITPRO_GPU_ACCELERATOR_CLASS"]
    ):
        raise ValueError("worker task authority is invalid")
    validate_plan(value["sessionPlan"])
    exact_sha(value["runtimeProfileHash"], "runtime profile hash")
    exact_sha(value["routeGateReportHash"], "route gate hash")
    exact_sha(value["checkpointSha256"], "checkpoint hash")
    exact_int(value["checkpointByteLength"], 1, MAX_CHECKPOINT_BYTES, "checkpoint bytes")
    exact_prefixed_sha(value["runtimeImageDigest"], "runtime image digest")
    exact_ref(
        value["explicitPrivateCanaryAuthorityRef"],
        "explicit private canary authority",
    )
    return value


def persist_object_sequence(
    output_root: Path,
    object_id: str,
    frames: dict[int, Any],
    torch_module: Any,
) -> dict[str, Any]:
    import numpy as np

    payload = bytearray()
    width = 0
    height = 0
    for frame_index in sorted(frames):
        mask = frames[frame_index]
        if not torch_module.is_tensor(mask) or mask.device.type != "cuda":
            raise RuntimeError("SAM mask output is not CUDA-resident")
        array = mask.detach().to(dtype=torch_module.bool).cpu().numpy()
        array = np.squeeze(array)
        if array.ndim != 2:
            raise RuntimeError("SAM mask output shape is invalid")
        height, width = int(array.shape[0]), int(array.shape[1])
        packed = np.packbits(array.reshape(-1), bitorder="little").tobytes()
        payload.extend(struct.pack(">II", frame_index, len(packed)))
        payload.extend(packed)
    path = output_root / f"{object_id}.maskbits"
    with path.open("xb") as handle:
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())
    byte_length, digest, _ = read_regular_file(path, 512 * 1024 * 1024)
    return {
        "objectId": object_id,
        "relativeFileName": path.name,
        "byteLength": byte_length,
        "sha256": digest,
        "frameCount": len(frames),
        "width": width,
        "height": height,
        "pixelFormat": "gray8",
    }


def execute(task: dict[str, Any], source_path: Path, output_root: Path) -> dict[str, Any]:
    global stage
    import torch

    plan = task["sessionPlan"]
    chunk = plan["source"]["chunkRange"]
    chunk_start = chunk["startFrameInclusive"]
    frame_count = plan["source"]["decodedFrameCount"]
    if not torch.cuda.is_available() or not torch.cuda.is_bf16_supported():
        raise RuntimeError("CUDA bfloat16 GPU is unavailable")
    source_length, source_hash, _ = read_regular_file(source_path, MAX_SOURCE_BYTES)
    artifact = plan["source"]["artifactRef"]
    if source_hash != plan["source"]["sourceChecksum"] or source_length != artifact["byteLength"]:
        raise RuntimeError("fixed private source bytes changed")
    checkpoint_length, checkpoint_hash, _ = read_regular_file(
        CHECKPOINT_PATH, MAX_CHECKPOINT_BYTES
    )
    if (
        checkpoint_length != task["checkpointByteLength"]
        or checkpoint_hash != task["checkpointSha256"]
    ):
        raise RuntimeError("fixed private checkpoint bytes changed")

    stage = "model_load"
    captured = io.StringIO()
    with contextlib.redirect_stdout(captured), contextlib.redirect_stderr(captured):
        from sam3.model_builder import build_sam3_multiplex_video_predictor

        predictor = build_sam3_multiplex_video_predictor(
            checkpoint_path=str(CHECKPOINT_PATH),
            max_num_objects=MAX_OBJECTS,
            multiplex_count=MAX_OBJECTS,
            use_fa3=False,
            use_rope_real=True,
            compile=False,
            warm_up=False,
            default_output_prob_thresh=0.5,
            async_loading_frames=True,
            gpu_accelerated_decode=True,
            strict_checkpoint_load=True,
            return_cuda_output_tensors=True,
        )
    if "Missing keys" in captured.getvalue() or "Unexpected keys" in captured.getvalue():
        raise RuntimeError("strict source/checkpoint compatibility changed")

    terminal = "failed"
    terminal_observed_at = utc_now()
    object_frames: dict[str, dict[int, Any]] = {
        item: {} for item in plan["targetGroup"]["objectIds"]
    }
    start = time.monotonic()
    timeout_seconds = 1800
    try:
        with torch.autocast(
            device_type="cuda", dtype=torch.bfloat16, enabled=True, cache_enabled=False
        ):
            for action in plan["actions"]:
                if cancel_requested:
                    predictor.handle_request({
                        "type": "cancel_propagation", "session_id": plan["sessionId"]
                    })
                    terminal = "cancelled"
                    break
                if time.monotonic() - start > timeout_seconds:
                    predictor.handle_request({
                        "type": "cancel_propagation", "session_id": plan["sessionId"]
                    })
                    terminal = "timed_out"
                    break
                kind = action["action"]
                stage = kind
                if kind == "start_session":
                    predictor.handle_request({
                        "type": "start_session",
                        "session_id": plan["sessionId"],
                        "resource_path": str(source_path),
                        "offload_video_to_cpu": False,
                        "offload_state_to_cpu": False,
                    })
                elif kind == "add_prompt":
                    prompt = action["prompt"]
                    obj_id = int(OBJECT_ID.fullmatch(prompt["objectId"]).group(1))
                    request: dict[str, Any] = {
                        "type": "add_prompt",
                        "session_id": plan["sessionId"],
                        "frame_index": prompt["frameIndex"] - chunk_start,
                        "obj_id": obj_id,
                        "rel_coordinates": True,
                        "output_prob_thresh": 0.5,
                    }
                    if prompt["promptKind"] == "text_concept":
                        request["text"] = prompt["compiledConcept"]
                    elif prompt["promptKind"] in {"positive_points", "negative_points"}:
                        request["points"] = [[p["x"], p["y"]] for p in prompt["points"]]
                        label = 1 if prompt["promptKind"] == "positive_points" else 0
                        request["point_labels"] = [label] * len(prompt["points"])
                        request["clear_old_points"] = action["refinementOrdinal"] == 0
                    else:
                        box = prompt["box"]
                        request["bounding_boxes"] = [[
                            box["x"], box["y"], box["width"], box["height"]
                        ]]
                        request["bounding_box_labels"] = [1]
                        request["clear_old_boxes"] = action["refinementOrdinal"] == 0
                    predictor.handle_request(request)
                elif kind == "propagate":
                    direction = "both" if action["direction"] == "bidirectional" else action["direction"]
                    for response in predictor.handle_stream_request({
                        "type": "propagate_in_video",
                        "session_id": plan["sessionId"],
                        "propagation_direction": direction,
                        "start_frame_index": plan["targetGroup"]["initializationFrameIndex"] - chunk_start,
                        "max_frame_num_to_track": frame_count,
                        "output_prob_thresh": 0.5,
                    }):
                        if cancel_requested or time.monotonic() - start > timeout_seconds:
                            predictor.handle_request({
                                "type": "cancel_propagation",
                                "session_id": plan["sessionId"],
                            })
                            terminal = (
                                "cancelled" if cancel_requested else "timed_out"
                            )
                            break
                        local_frame = exact_int(response["frame_index"], 0, frame_count - 1, "output frame")
                        global_frame = local_frame + chunk_start
                        outputs = response["outputs"]
                        ids = outputs["out_obj_ids"].tolist()
                        masks = outputs["out_binary_masks"]
                        if len(ids) != len(masks):
                            raise RuntimeError("SAM output arrays lost alignment")
                        for numeric_id, mask in zip(ids, masks):
                            anonymous = f"object_{int(numeric_id):03d}"
                            if anonymous not in object_frames:
                                raise RuntimeError("SAM emitted an unapproved object")
                            prior = object_frames[anonymous].get(global_frame)
                            if prior is not None and not torch.equal(prior, mask):
                                raise RuntimeError("bidirectional mask reconciliation is ambiguous")
                            object_frames[anonymous][global_frame] = mask
                    if terminal in {"cancelled", "timed_out"}:
                        break
                elif kind == "remove_object":
                    numeric = int(OBJECT_ID.fullmatch(action["objectId"]).group(1))
                    predictor.handle_request({
                        "type": "remove_object", "session_id": plan["sessionId"],
                        "frame_index": 0, "obj_id": numeric,
                    })
                    object_frames.pop(action["objectId"], None)
                elif kind == "reset_session":
                    predictor.handle_request({
                        "type": "reset_session", "session_id": plan["sessionId"]
                    })
                    object_frames = {
                        item: {} for item in plan["targetGroup"]["objectIds"]
                    }
                elif kind == "cancel_session":
                    predictor.handle_request({
                        "type": "cancel_propagation", "session_id": plan["sessionId"]
                    })
                    terminal = "cancelled"
                    break
            else:
                terminal = "completed"
        terminal_observed_at = utc_now()
        objects: list[dict[str, Any]] = []
        if terminal == "completed":
            expected_frames = set(range(chunk["startFrameInclusive"], chunk["endFrameExclusive"]))
            if any(set(frames) != expected_frames for frames in object_frames.values()):
                raise RuntimeError("SAM masklet coverage is incomplete")
            output_root.mkdir(mode=0o700, parents=False, exist_ok=False)
            objects = [
                persist_object_sequence(output_root, key, frames, torch)
                for key, frames in sorted(object_frames.items())
            ]
        return {
            "terminalDisposition": terminal,
            "terminalObservedAt": terminal_observed_at,
            "sourceCheckpointStrictLoadObserved": True,
            "cudaInferenceObserved": terminal == "completed",
            "objects": objects,
            "checkpointSha256": checkpoint_hash,
            "close": None,
        }
    except Exception:
        # The server receives a terminal, closed attempt without a receipt-
        # shaped inference claim. Exact server reconciliation remains
        # mandatory before any future submission.
        return {
            "terminalDisposition": "failed",
            "terminalObservedAt": utc_now(),
            "sourceCheckpointStrictLoadObserved": True,
            "cudaInferenceObserved": False,
            "objects": [],
            "checkpointSha256": checkpoint_hash,
            "close": None,
        }
    finally:
        stage = "close_session"
        # Meta's close_session is idempotent, so it is issued even when start
        # failed before the session became visible.
        predictor.handle_request({
            "type": "close_session", "session_id": plan["sessionId"],
            "run_gc_collect": True,
        })


def response_payload(
    task: dict[str, Any], result: dict[str, Any], close_observed_at: str
) -> dict[str, Any]:
    plan = task["sessionPlan"]
    objects = []
    for item in result["objects"]:
        objects.append({
            "objectId": item["objectId"],
            "privateObjectRef": {
                "artifactType": "private_mask_sequence_binary_v1",
                "sha256": item["sha256"],
                "byteLength": item["byteLength"],
                "ownerUserId": plan["ownerUserId"],
                "workspaceId": plan["workspaceId"],
                "projectId": plan["projectId"],
            },
            "frameCount": item["frameCount"],
            "width": item["width"],
            "height": item["height"],
            "pixelFormat": item["pixelFormat"],
            "maskSequenceSha256": item["sha256"],
        })
    core = {
        "schemaVersion": RESPONSE_VERSION,
        "operationId": OPERATION_ID,
        "adapterClass": "canonical_private_execution_adapter",
        "evidenceClass": "canonical_private_reread",
        "sessionPlanHash": plan["sessionPlanHash"],
        "assignmentHash": plan["assignmentHash"],
        "runtimeProfileHash": task["runtimeProfileHash"],
        "routeGateReportHash": task["routeGateReportHash"],
        "sourceRevision": SOURCE_REVISION,
        "checkpointRevision": CHECKPOINT_REVISION,
        "checkpointSha256": result["checkpointSha256"],
        "runtimeImageDigest": task["runtimeImageDigest"],
        "accelerator": task["accelerator"],
        "terminalDisposition": result["terminalDisposition"],
        "exactAttemptReconciled": result["terminalDisposition"] != "reconciliation_required",
        "sourceCheckpointStrictLoadObserved": result["sourceCheckpointStrictLoadObserved"],
        "cudaInferenceObserved": result["cudaInferenceObserved"],
        "modelSubmissionCount": 1,
        "objects": objects,
        "terminalObservedAt": result["terminalObservedAt"],
        "close": {
            "closeOperation": "close_session",
            "closeAttempted": True,
            "closeCompleted": True,
            "closeObservedAt": close_observed_at,
            "gpuMemoryReleaseRequested": True,
        },
        "rawUserChatIncluded": False,
        "callerSelectedModelModuleClassCheckpointCommandGpuEndpointPathUrlRetryFallbackOrPriceAccepted": False,
        "automaticRetryCount": 0,
        "automaticAlternateModelFallbackCount": 0,
        "publicArtifactCount": 0,
        "productionMutationCount": 0,
        "customerCreditsMutated": False,
        "qaApproved": False,
        "publicDeliveryAuthorized": False,
        "productionAuthorityGranted": False,
    }
    return {**core, "responseHash": sha256_bytes(stable_json_bytes(core))}


def persist_create_only(path: Path, value: dict[str, Any]) -> None:
    payload = stable_json_bytes(value)
    descriptor = os.open(
        path,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_CLOEXEC", 0),
        0o600,
    )
    try:
        os.write(descriptor, payload)
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def on_cancel(_signal_number: int, _frame: Any) -> None:
    global cancel_requested
    cancel_requested = True


def main() -> int:
    global stage
    signal.signal(signal.SIGTERM, on_cancel)
    signal.signal(signal.SIGINT, on_cancel)
    task: dict[str, Any] | None = None
    response_path: Path | None = None
    try:
        invocation_id, task_path, source_path, output_root, response_path = parse_invocation()
        _length, _digest, payload = read_regular_file(
            task_path, MAX_TASK_BYTES, retain=True
        )
        if payload is None:
            raise ValueError("private task bytes are unavailable")
        task = validate_task(json.loads(payload.decode("utf-8")), invocation_id)
        result = execute(task, source_path, output_root)
        close_observed_at = utc_now()
        persist_create_only(
            response_path, response_payload(task, result, close_observed_at)
        )
        return 0 if result["terminalDisposition"] == "completed" else 1
    except Exception as error:
        # Do not persist a receipt-shaped real-inference response when plan
        # validation, strict load, execution, close, or exact reread failed.
        print(
            json.dumps({
                "status": "failed_closed",
                "stage": stage,
                "errorClass": type(error).__name__,
            }),
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
