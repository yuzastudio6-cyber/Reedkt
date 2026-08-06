"""Fixed private ComfyUI GPU operation runner.

The runner accepts one server-compiled request on stdin, starts one loopback
ComfyUI process, executes one allowlisted API graph, captures one websocket
PNG, and emits a digest-only response. It accepts no caller command, path,
URL, environment, model choice, or network route.
"""

from __future__ import annotations

import asyncio
import hashlib
import io
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import threading
import time
from typing import Any


OPERATION_ID = "tool.comfyui.generate_controlled_image.v1"
REQUEST_VERSION = "canonical-comfyui-gpu-runtime-request-v1"
RESPONSE_VERSION = "canonical-comfyui-gpu-runtime-response-v1"
MAX_REQUEST_BYTES = 1_048_576
MAX_OUTPUT_BYTES = 67_108_864
MAX_LOG_BYTES = 262_144
READY_TIMEOUT_SECONDS = 90.0
EXECUTION_TIMEOUT_SECONDS = 600.0
STOP_TIMEOUT_SECONDS = 10.0

PACKAGE_ROOT = Path("/opt/reeditpro/gpu-operations/comfyui")
PYTHON = PACKAGE_ROOT / "venv/bin/python"
SOURCE_ROOT = PACKAGE_ROOT / "source"
MAIN_PATH = SOURCE_ROOT / "main.py"
IPADAPTER_NODE_ROOT = PACKAGE_ROOT / "custom_nodes/ComfyUI_IPAdapter_plus"
CONTROLNET_AUX_NODE_ROOT = (
    PACKAGE_ROOT / "custom_nodes/comfyui_controlnet_aux"
)
EXTRA_MODEL_PATHS = PACKAGE_ROOT / "extra_model_paths.yaml"
RUNTIME_ROOT = PACKAGE_ROOT / "runtime"
PRIVATE_INPUT_ROOT = Path("/mnt/reeditpro/private-input")
PRIVATE_OUTPUT_ROOT = Path("/mnt/reeditpro/private-output")
OUTPUT_FILE = PRIVATE_OUTPUT_ROOT / "generated.png"

SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$")
DIGEST = re.compile(r"^[a-f0-9]{64}$")
NODE_ID = re.compile(r"^[1-9][0-9]{0,2}$")
PRIVATE_FILE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,126}$")
URL_LIKE = re.compile(r"(?:https?://|file://|data:|javascript:)", re.I)
SECRET_LIKE = re.compile(
    r"(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|"
    r"sk-[A-Za-z0-9_-]{16,})"
)

ALLOWED_NODE_CLASSES = frozenset(
    {
        "CheckpointLoaderSimple",
        "LoraLoader",
        "CLIPTextEncode",
        "ControlNetLoader",
        "LoadImage",
        "ControlNetApplyAdvanced",
        "EmptyLatentImage",
        "CLIPVisionLoader",
        "IPAdapterModelLoader",
        "IPAdapterAdvanced",
        "KSampler",
        "VAEDecode",
        "SaveImageWebsocket",
    }
)

MODEL_FILES = (
    {
        "canonicalOrder": 0,
        "role": "base_checkpoint",
        "slotId": "base_checkpoint_artifact",
        "fileName": "sd_xl_base_1.0.safetensors",
        "path": Path(
            "/mnt/reeditpro/model-artifacts/checkpoints/"
            "sd_xl_base_1.0.safetensors"
        ),
        "byteLength": 6_938_078_334,
        "contentSha256": (
            "31e35c80fc4829d14f90153f4c74cd59"
            "c90b779f6afe05a74cd6120b893f7e5b"
        ),
    },
    {
        "canonicalOrder": 1,
        "role": "controlnet_checkpoint",
        "slotId": "controlnet_checkpoint_artifact",
        "fileName": "diffusion_pytorch_model.fp16.safetensors",
        "path": Path(
            "/mnt/reeditpro/model-artifacts/controlnet/"
            "diffusion_pytorch_model.fp16.safetensors"
        ),
        "byteLength": 320_237_179,
        "contentSha256": (
            "fde4888a5f0a5648118991cc50e0ac4d"
            "60a2356dbaddf5e0649dd69c1119a2f9"
        ),
    },
    {
        "canonicalOrder": 2,
        "role": "lora_adapter",
        "slotId": "lora_adapter_artifact",
        "fileName": "sd_xl_offset_example-lora_1.0.safetensors",
        "path": Path(
            "/mnt/reeditpro/model-artifacts/loras/"
            "sd_xl_offset_example-lora_1.0.safetensors"
        ),
        "byteLength": 49_553_604,
        "contentSha256": (
            "4852686128f953d0277d0793e2f03353"
            "52f96a919c9c16a09787d77f55cbdf6f"
        ),
    },
    {
        "canonicalOrder": 3,
        "role": "generic_ipadapter_checkpoint",
        "slotId": "generic_ipadapter_checkpoint_artifact",
        "fileName": "ip-adapter_sdxl.safetensors",
        "path": Path(
            "/mnt/reeditpro/model-artifacts/ipadapter/"
            "ip-adapter_sdxl.safetensors"
        ),
        "byteLength": 702_585_376,
        "contentSha256": (
            "ba1002529e783604c5f326d49f012202"
            "5392d1d20ac8d573b3eeb3e6dea4ebb6"
        ),
    },
    {
        "canonicalOrder": 4,
        "role": "clip_vision_checkpoint",
        "slotId": "clip_vision_checkpoint_artifact",
        "fileName": "model.safetensors",
        "path": Path(
            "/mnt/reeditpro/model-artifacts/clip_vision/model.safetensors"
        ),
        "byteLength": 3_689_912_664,
        "contentSha256": (
            "657723e09f46a7c3957df651601029f6"
            "6b1748afb12b419816330f16ed45d64d"
        ),
    },
)

INPUT_FILES = {
    "control_image_artifact": PRIVATE_INPUT_ROOT / "control-image.png",
    "reference_image_artifact": PRIVATE_INPUT_ROOT / "reference-image.png",
}

FIXED_ENVIRONMENT = {
    "PATH": (
        "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    ),
    "HOME": str(RUNTIME_ROOT / "user"),
    "LANG": "C.UTF-8",
    "LC_ALL": "C.UTF-8",
    "PYTHONHASHSEED": "0",
    "PYTHONDONTWRITEBYTECODE": "1",
    "PYTHONUNBUFFERED": "1",
    "HF_HUB_OFFLINE": "1",
    "TRANSFORMERS_OFFLINE": "1",
    "COMFYUI_MANAGER_DISABLE": "1",
    "CUDA_VISIBLE_DEVICES": "0",
    "NVIDIA_VISIBLE_DEVICES": "0",
    "NO_PROXY": "127.0.0.1,localhost",
    "no_proxy": "127.0.0.1,localhost",
    "LD_LIBRARY_PATH": (
        "/usr/local/nvidia/lib64:/usr/local/cuda/lib64"
    ),
}

IMPORT_GUARD = "\n".join(
    (
        "import importlib.abc",
        "class _ReeditProDeniedImportFinder(importlib.abc.MetaPathFinder):",
        "    def find_spec(self, fullname, path=None, target=None):",
        '        if fullname == "sam2" or fullname.startswith("sam2."):',
        '            raise ImportError("blocked by ComfyUI operation policy")',
        "        return None",
        "sys.meta_path.insert(0, _ReeditProDeniedImportFinder())",
    )
)
BOOTSTRAP = ";".join(
    (
        "import runpy,sys",
        f"exec({IMPORT_GUARD!r})",
        f"sys.path.insert(0, {str(SOURCE_ROOT)!r})",
        f"runpy.run_path({str(MAIN_PATH)!r}, run_name='__main__')",
    )
)


class RuntimeFailure(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


class BoundedCapture:
    def __init__(self, stream: Any) -> None:
        self._stream = stream
        self._hasher = hashlib.sha256()
        self._byte_length = 0
        self._exceeded = False
        self._thread = threading.Thread(target=self._drain, daemon=True)

    def start(self) -> None:
        self._thread.start()

    def finish(self) -> dict[str, Any]:
        self._thread.join(timeout=2.0)
        return {
            "byteLength": self._byte_length,
            "contentSha256": self._hasher.hexdigest(),
            "captureExceeded": self._exceeded,
        }

    def _drain(self) -> None:
        while True:
            chunk = self._stream.read(16_384)
            if not chunk:
                return
            self._byte_length += len(chunk)
            if self._byte_length > MAX_LOG_BYTES:
                self._exceeded = True
            self._hasher.update(chunk)


def canonical_json(value: Any) -> str:
    return json.dumps(
        stable_json_value(value),
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=False,
    )


def stable_json_value(value: Any) -> Any:
    if isinstance(value, list):
        return [stable_json_value(nested) for nested in value]
    if isinstance(value, dict):
        keys = sorted(
            value,
            key=lambda key: (
                0,
                int(key),
            )
            if is_javascript_array_index(key)
            else (1, key),
        )
        return {
            key: stable_json_value(value[key])
            for key in keys
        }
    return value


def is_javascript_array_index(value: Any) -> bool:
    if not isinstance(value, str) or not re.fullmatch(r"(?:0|[1-9][0-9]*)", value):
        return False
    number = int(value)
    return number < 4_294_967_295 and str(number) == value


def digest_value(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def digest_file(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as source:
        while True:
            chunk = source.read(8 * 1_048_576)
            if not chunk:
                return hasher.hexdigest()
            hasher.update(chunk)


def require_exact_keys(
    value: Any,
    expected: set[str],
    code: str,
) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != expected:
        raise RuntimeFailure(code)
    return value


def require_safe_id(value: Any, code: str) -> str:
    if not isinstance(value, str) or not SAFE_ID.fullmatch(value):
        raise RuntimeFailure(code)
    if ".." in value:
        raise RuntimeFailure(code)
    return value


def require_digest(value: Any, code: str) -> str:
    if not isinstance(value, str) or not DIGEST.fullmatch(value):
        raise RuntimeFailure(code)
    return value


def read_request() -> dict[str, Any]:
    raw = sys.stdin.buffer.read(MAX_REQUEST_BYTES + 1)
    if len(raw) < 2 or len(raw) > MAX_REQUEST_BYTES:
        raise RuntimeFailure("REQUEST_SIZE_INVALID")
    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise RuntimeFailure("REQUEST_JSON_INVALID")
    return validate_request(value)


def validate_request(value: Any) -> dict[str, Any]:
    request = require_exact_keys(
        value,
        {
            "schemaVersion",
            "operationId",
            "admissionDigestSha256",
            "dispatch",
            "selectedScene",
            "prompt",
            "modelArtifacts",
            "inputImages",
            "output",
            "settings",
            "requestBindingSha256",
        },
        "REQUEST_SHAPE_INVALID",
    )
    if (
        request["schemaVersion"] != REQUEST_VERSION
        or request["operationId"] != OPERATION_ID
    ):
        raise RuntimeFailure("REQUEST_IDENTITY_INVALID")
    require_digest(request["admissionDigestSha256"], "ADMISSION_INVALID")
    validate_dispatch(request["dispatch"])
    validate_selected_scene(request["selectedScene"])
    validate_model_artifacts(request["modelArtifacts"])
    validate_input_images(request["inputImages"])
    validate_output(request["output"])
    validate_settings(request["settings"])
    validate_prompt(request["prompt"], request)
    binding = require_digest(
        request["requestBindingSha256"],
        "REQUEST_BINDING_INVALID",
    )
    without_binding = dict(request)
    del without_binding["requestBindingSha256"]
    if binding != digest_value(without_binding):
        raise RuntimeFailure("REQUEST_BINDING_INVALID")
    if URL_LIKE.search(canonical_json(request)) or SECRET_LIKE.search(
        canonical_json(request)
    ):
        raise RuntimeFailure("REQUEST_UNSAFE")
    return request


def validate_dispatch(value: Any) -> None:
    dispatch = require_exact_keys(
        value,
        {
            "dispatchIntentId",
            "dispatchBindingHash",
            "attemptPlanHash",
            "runtimeRegion",
        },
        "DISPATCH_INVALID",
    )
    require_safe_id(dispatch["dispatchIntentId"], "DISPATCH_INVALID")
    require_digest(dispatch["dispatchBindingHash"], "DISPATCH_INVALID")
    require_digest(dispatch["attemptPlanHash"], "DISPATCH_INVALID")
    if dispatch["runtimeRegion"] != "europe-west1":
        raise RuntimeFailure("DISPATCH_INVALID")


def validate_selected_scene(value: Any) -> None:
    selected = require_exact_keys(
        value,
        {
            "requestBindingId",
            "requestBindingDigestSha256",
            "approvedSnapshotId",
            "approvedSnapshotHash",
            "workItemId",
            "workItemHash",
            "outputKey",
            "plannedAssetManifestEntryId",
            "confirmedOutputFrameExpectationDigestSha256",
        },
        "SELECTED_SCENE_INVALID",
    )
    for key in (
        "requestBindingId",
        "approvedSnapshotId",
        "workItemId",
        "outputKey",
        "plannedAssetManifestEntryId",
    ):
        require_safe_id(selected[key], "SELECTED_SCENE_INVALID")
    for key in (
        "requestBindingDigestSha256",
        "approvedSnapshotHash",
        "workItemHash",
        "confirmedOutputFrameExpectationDigestSha256",
    ):
        require_digest(selected[key], "SELECTED_SCENE_INVALID")


def validate_model_artifacts(value: Any) -> None:
    if not isinstance(value, list) or len(value) != len(MODEL_FILES):
        raise RuntimeFailure("MODEL_SET_INVALID")
    expected_keys = {
        "canonicalOrder",
        "role",
        "slotId",
        "fileName",
        "byteLength",
        "contentSha256",
        "sourceBindingDigestSha256",
        "readOnlyMountRequired",
    }
    for supplied, expected in zip(value, MODEL_FILES):
        item = require_exact_keys(supplied, expected_keys, "MODEL_SET_INVALID")
        for key in (
            "canonicalOrder",
            "role",
            "slotId",
            "fileName",
            "byteLength",
            "contentSha256",
        ):
            if item[key] != expected[key]:
                raise RuntimeFailure("MODEL_SET_INVALID")
        require_digest(
            item["sourceBindingDigestSha256"],
            "MODEL_SET_INVALID",
        )
        if item["readOnlyMountRequired"] is not True:
            raise RuntimeFailure("MODEL_SET_INVALID")


def validate_input_images(value: Any) -> None:
    if not isinstance(value, list) or len(value) > 2:
        raise RuntimeFailure("INPUT_IMAGE_SET_INVALID")
    seen: set[str] = set()
    expected_keys = {
        "canonicalOrder",
        "slotId",
        "fileName",
        "artifactId",
        "contentSha256",
        "byteLength",
        "width",
        "height",
        "sourceBindingDigestSha256",
        "readOnlyMountRequired",
    }
    for order, supplied in enumerate(value):
        item = require_exact_keys(
            supplied,
            expected_keys,
            "INPUT_IMAGE_SET_INVALID",
        )
        slot_id = item["slotId"]
        expected_path = INPUT_FILES.get(slot_id)
        if (
            item["canonicalOrder"] != order
            or expected_path is None
            or slot_id in seen
            or item["fileName"] != expected_path.name
            or item["readOnlyMountRequired"] is not True
        ):
            raise RuntimeFailure("INPUT_IMAGE_SET_INVALID")
        seen.add(slot_id)
        require_safe_id(item["artifactId"], "INPUT_IMAGE_SET_INVALID")
        require_digest(item["contentSha256"], "INPUT_IMAGE_SET_INVALID")
        require_digest(
            item["sourceBindingDigestSha256"],
            "INPUT_IMAGE_SET_INVALID",
        )
        for key in ("byteLength", "width", "height"):
            if not isinstance(item[key], int) or isinstance(item[key], bool):
                raise RuntimeFailure("INPUT_IMAGE_SET_INVALID")
        if (
            item["byteLength"] < 33
            or item["byteLength"] > 67_108_864
            or item["width"] < 16
            or item["height"] < 16
            or item["width"] > 4_096
            or item["height"] > 4_096
        ):
            raise RuntimeFailure("INPUT_IMAGE_SET_INVALID")


def validate_output(value: Any) -> None:
    output = require_exact_keys(
        value,
        {
            "canvasClass",
            "width",
            "height",
            "imageCount",
            "contentType",
            "transport",
            "opaqueGenerationOutputOnly",
            "finalCanvasCreatedByComfyUi",
        },
        "OUTPUT_INVALID",
    )
    width = output["width"]
    height = output["height"]
    if (
        output["canvasClass"]
        not in (
            "isolated_component_square_1024",
            "confirmed_full_frame_ratio",
        )
        or not isinstance(width, int)
        or isinstance(width, bool)
        or not isinstance(height, int)
        or isinstance(height, bool)
        or width < 256
        or height < 256
        or width > 4_096
        or height > 4_096
        or width * height > 8_294_400
        or width % 8 != 0
        or height % 8 != 0
        or (
            output["canvasClass"] == "isolated_component_square_1024"
            and (width != 1_024 or height != 1_024)
        )
        or output["imageCount"] != 1
        or output["contentType"] != "image/png"
        or output["transport"] != "websocket_image_output"
        or output["opaqueGenerationOutputOnly"] is not True
        or output["finalCanvasCreatedByComfyUi"] is not False
    ):
        raise RuntimeFailure("OUTPUT_INVALID")


def validate_settings(value: Any) -> None:
    settings = require_exact_keys(
        value,
        {
            "device",
            "accelerator",
            "gpuCount",
            "cpuFallbackAllowed",
            "runtimeDownloadAllowed",
            "networkFetchAllowed",
            "deniedTopLevelImports",
            "allFiveModelsMountedReadOnly",
            "verifyModelsBeforeAndAfterInference",
            "oneProcessPerAttempt",
            "outputBatchingAllowed",
        },
        "SETTINGS_INVALID",
    )
    if settings != {
        "device": "cuda",
        "accelerator": "nvidia_l4",
        "gpuCount": 1,
        "cpuFallbackAllowed": False,
        "runtimeDownloadAllowed": False,
        "networkFetchAllowed": False,
        "deniedTopLevelImports": ["sam2"],
        "allFiveModelsMountedReadOnly": True,
        "verifyModelsBeforeAndAfterInference": True,
        "oneProcessPerAttempt": True,
        "outputBatchingAllowed": False,
    }:
        raise RuntimeFailure("SETTINGS_INVALID")


def validate_prompt(value: Any, request: dict[str, Any]) -> None:
    prompt = require_exact_keys(
        value,
        {"graph", "graphDigestSha256", "outputNodeId", "nodeCount"},
        "PROMPT_INVALID",
    )
    graph = prompt["graph"]
    if (
        not isinstance(graph, dict)
        or not 7 <= len(graph) <= 32
        or prompt["nodeCount"] != len(graph)
        or prompt["graphDigestSha256"] != digest_value(graph)
    ):
        raise RuntimeFailure("PROMPT_GRAPH_BINDING_INVALID")
    output_node_id = prompt["outputNodeId"]
    if not isinstance(output_node_id, str) or not NODE_ID.fullmatch(
        output_node_id
    ):
        raise RuntimeFailure("PROMPT_GRAPH_BINDING_INVALID")
    class_counts: dict[str, int] = {}
    flattened_strings: list[str] = []
    for node_id, supplied in graph.items():
        if not isinstance(node_id, str) or not NODE_ID.fullmatch(node_id):
            raise RuntimeFailure("PROMPT_NODE_INVALID")
        node = require_exact_keys(
            supplied,
            {"class_type", "inputs"},
            "PROMPT_NODE_INVALID",
        )
        class_type = node["class_type"]
        if class_type not in ALLOWED_NODE_CLASSES:
            raise RuntimeFailure("PROMPT_NODE_INVALID")
        if not isinstance(node["inputs"], dict):
            raise RuntimeFailure("PROMPT_NODE_INVALID")
        class_counts[class_type] = class_counts.get(class_type, 0) + 1
        try:
            validate_prompt_value(
                node["inputs"],
                graph,
                int(node_id),
                flattened_strings,
            )
        except RuntimeFailure as failure:
            if failure.code == "PROMPT_INVALID":
                raise RuntimeFailure("PROMPT_VALUE_INVALID")
            raise
    if (
        graph.get(output_node_id, {}).get("class_type")
        != "SaveImageWebsocket"
        or class_counts.get("SaveImageWebsocket") != 1
        or class_counts.get("CheckpointLoaderSimple") != 1
        or class_counts.get("CLIPTextEncode") != 2
        or class_counts.get("EmptyLatentImage") != 1
        or class_counts.get("KSampler") != 1
        or class_counts.get("VAEDecode") != 1
        or class_counts.get("LoraLoader", 0) > 1
        or class_counts.get("ControlNetLoader", 0) > 1
        or class_counts.get("ControlNetApplyAdvanced", 0) > 1
        or class_counts.get("CLIPVisionLoader", 0) > 1
        or class_counts.get("IPAdapterModelLoader", 0) > 1
        or class_counts.get("IPAdapterAdvanced", 0) > 1
        or class_counts.get("LoadImage", 0)
        != len(request["inputImages"])
    ):
        raise RuntimeFailure("PROMPT_CLASS_COUNTS_INVALID")
    latent_nodes = [
        node
        for node in graph.values()
        if node["class_type"] == "EmptyLatentImage"
    ]
    latent_inputs = latent_nodes[0]["inputs"]
    if (
        latent_inputs.get("width") != request["output"]["width"]
        or latent_inputs.get("height") != request["output"]["height"]
        or latent_inputs.get("batch_size") != 1
    ):
        raise RuntimeFailure("PROMPT_DIMENSIONS_INVALID")
    try:
        validate_exact_graph_topology(graph, request)
    except RuntimeFailure as failure:
        if failure.code == "PROMPT_INVALID":
            raise RuntimeFailure("PROMPT_TOPOLOGY_INVALID")
        raise
    joined = "\n".join(flattened_strings)
    for model in MODEL_FILES:
        expected_count = 1
        if model["role"] == "controlnet_checkpoint":
            expected_count = class_counts.get("ControlNetLoader", 0)
        elif model["role"] == "lora_adapter":
            expected_count = class_counts.get("LoraLoader", 0)
        elif model["role"] in (
            "generic_ipadapter_checkpoint",
            "clip_vision_checkpoint",
        ):
            expected_count = class_counts.get("IPAdapterAdvanced", 0)
        if joined.count(model["fileName"]) != expected_count:
            raise RuntimeFailure("PROMPT_MODEL_ALIAS_INVALID")
    for image in request["inputImages"]:
        if joined.count(image["fileName"]) != 1:
            raise RuntimeFailure("PROMPT_INPUT_ALIAS_INVALID")


def validate_exact_graph_topology(
    graph: dict[str, Any],
    request: dict[str, Any],
) -> None:
    node_ids = sorted(graph, key=int)
    if node_ids != [str(index) for index in range(1, len(graph) + 1)]:
        raise RuntimeFailure("PROMPT_INVALID")
    cursor = 1

    base = str(cursor)
    require_node_inputs(
        graph,
        base,
        "CheckpointLoaderSimple",
        {"ckpt_name": "sd_xl_base_1.0.safetensors"},
    )
    cursor += 1

    model_source = base
    uses_lora = graph[str(cursor)]["class_type"] == "LoraLoader"
    if uses_lora:
        model_source = str(cursor)
        require_node_inputs(
            graph,
            model_source,
            "LoraLoader",
            {
                "model": [base, 0],
                "clip": [base, 1],
                "lora_name": "sd_xl_offset_example-lora_1.0.safetensors",
                "strength_model": 0.7,
                "strength_clip": 0.55,
            },
        )
        cursor += 1

    positive = str(cursor)
    positive_inputs = require_node_inputs(
        graph,
        positive,
        "CLIPTextEncode",
        None,
    )
    if (
        set(positive_inputs) != {"text", "clip"}
        or not isinstance(positive_inputs["text"], str)
        or positive_inputs["clip"] != [model_source, 1]
    ):
        raise RuntimeFailure("PROMPT_INVALID")
    cursor += 1

    negative = str(cursor)
    negative_inputs = require_node_inputs(
        graph,
        negative,
        "CLIPTextEncode",
        None,
    )
    if (
        set(negative_inputs) != {"text", "clip"}
        or not isinstance(negative_inputs["text"], str)
        or negative_inputs["clip"] != [model_source, 1]
    ):
        raise RuntimeFailure("PROMPT_INVALID")
    cursor += 1

    positive_source = positive
    negative_source = negative
    uses_controlnet = (
        graph[str(cursor)]["class_type"] == "ControlNetLoader"
    )
    if uses_controlnet:
        control_loader = str(cursor)
        require_node_inputs(
            graph,
            control_loader,
            "ControlNetLoader",
            {
                "control_net_name":
                    "diffusion_pytorch_model.fp16.safetensors",
            },
        )
        cursor += 1
        control_image = str(cursor)
        require_node_inputs(
            graph,
            control_image,
            "LoadImage",
            {"image": "control-image.png"},
        )
        cursor += 1
        control_apply = str(cursor)
        require_node_inputs(
            graph,
            control_apply,
            "ControlNetApplyAdvanced",
            {
                "positive": [positive, 0],
                "negative": [negative, 0],
                "control_net": [control_loader, 0],
                "image": [control_image, 0],
                "strength": 0.75 if uses_lora else 0.85,
                "start_percent": 0.1 if uses_lora else 0,
                "end_percent": 1 if uses_lora else 0.9,
            },
        )
        cursor += 1
        positive_source = control_apply
        negative_source = control_apply

    latent = str(cursor)
    require_node_inputs(
        graph,
        latent,
        "EmptyLatentImage",
        {
            "width": request["output"]["width"],
            "height": request["output"]["height"],
            "batch_size": 1,
        },
    )
    cursor += 1

    final_model_source = model_source
    uses_ipadapter = (
        cursor <= len(graph)
        and graph[str(cursor)]["class_type"] == "CLIPVisionLoader"
    )
    if uses_ipadapter:
        clip_vision = str(cursor)
        require_node_inputs(
            graph,
            clip_vision,
            "CLIPVisionLoader",
            {"clip_name": "model.safetensors"},
        )
        cursor += 1
        ipadapter_model = str(cursor)
        require_node_inputs(
            graph,
            ipadapter_model,
            "IPAdapterModelLoader",
            {"ipadapter_file": "ip-adapter_sdxl.safetensors"},
        )
        cursor += 1
        reference_image = str(cursor)
        require_node_inputs(
            graph,
            reference_image,
            "LoadImage",
            {"image": "reference-image.png"},
        )
        cursor += 1
        final_model_source = str(cursor)
        require_node_inputs(
            graph,
            final_model_source,
            "IPAdapterAdvanced",
            {
                "model": [model_source, 0],
                "ipadapter": [ipadapter_model, 0],
                "image": [reference_image, 0],
                "clip_vision": [clip_vision, 0],
                "weight": 0.85,
                "weight_type": "linear",
                "combine_embeds": "average",
                "start_at": 0,
                "end_at": 0.9,
                "embeds_scaling": "v_only",
            },
        )
        cursor += 1

    sampler = str(cursor)
    sampler_inputs = require_node_inputs(
        graph,
        sampler,
        "KSampler",
        None,
    )
    if (
        set(sampler_inputs)
        != {
            "model",
            "positive",
            "negative",
            "latent_image",
            "seed",
            "steps",
            "cfg",
            "sampler_name",
            "scheduler",
            "denoise",
        }
        or sampler_inputs["model"] != [final_model_source, 0]
        or sampler_inputs["positive"] != [positive_source, 0]
        or sampler_inputs["negative"]
        != [negative_source, 1 if uses_controlnet else 0]
        or sampler_inputs["latent_image"] != [latent, 0]
        or not isinstance(sampler_inputs["seed"], int)
        or isinstance(sampler_inputs["seed"], bool)
        or sampler_inputs["seed"] < 0
        or sampler_inputs["seed"] > 9_007_199_254_740_991
        or sampler_inputs["steps"] != 24
        or sampler_inputs["cfg"] != 5.5
        or sampler_inputs["sampler_name"] != "dpmpp_2m"
        or sampler_inputs["scheduler"] != "karras"
        or sampler_inputs["denoise"] != 1
    ):
        raise RuntimeFailure("PROMPT_INVALID")
    cursor += 1

    vae = str(cursor)
    require_node_inputs(
        graph,
        vae,
        "VAEDecode",
        {
            "samples": [sampler, 0],
            "vae": [base, 2],
        },
    )
    cursor += 1

    output = str(cursor)
    require_node_inputs(
        graph,
        output,
        "SaveImageWebsocket",
        {"images": [vae, 0]},
    )
    cursor += 1
    if cursor != len(graph) + 1 or request["prompt"]["outputNodeId"] != output:
        raise RuntimeFailure("PROMPT_INVALID")

    expected_slots: list[str] = []
    if uses_controlnet:
        expected_slots.append("control_image_artifact")
    if uses_ipadapter:
        expected_slots.append("reference_image_artifact")
    if [image["slotId"] for image in request["inputImages"]] != expected_slots:
        raise RuntimeFailure("PROMPT_INVALID")


def require_node_inputs(
    graph: dict[str, Any],
    node_id: str,
    class_type: str,
    expected_inputs: dict[str, Any] | None,
) -> dict[str, Any]:
    node = graph.get(node_id)
    if not isinstance(node, dict) or node.get("class_type") != class_type:
        raise RuntimeFailure("PROMPT_INVALID")
    inputs = node.get("inputs")
    if not isinstance(inputs, dict):
        raise RuntimeFailure("PROMPT_INVALID")
    if expected_inputs is not None and inputs != expected_inputs:
        raise RuntimeFailure("PROMPT_INVALID")
    return inputs


def validate_prompt_value(
    value: Any,
    graph: dict[str, Any],
    current_node: int,
    strings: list[str],
) -> None:
    if value is None or isinstance(value, (bool, int, float)):
        if isinstance(value, float) and not (-1e9 <= value <= 1e9):
            raise RuntimeFailure("PROMPT_INVALID")
        return
    if isinstance(value, str):
        if (
            len(value.encode("utf-8")) > 16_384
            or URL_LIKE.search(value)
            or SECRET_LIKE.search(value)
            or value.startswith("/")
            or re.match(r"^[A-Za-z]:[\\/]", value)
        ):
            raise RuntimeFailure("PROMPT_INVALID")
        strings.append(value)
        return
    if isinstance(value, list):
        if (
            len(value) == 2
            and isinstance(value[0], str)
            and NODE_ID.fullmatch(value[0])
            and isinstance(value[1], int)
            and not isinstance(value[1], bool)
        ):
            if (
                value[0] not in graph
                or int(value[0]) >= current_node
                or value[1] < 0
                or value[1] > 15
            ):
                raise RuntimeFailure("PROMPT_INVALID")
            return
        if len(value) > 64:
            raise RuntimeFailure("PROMPT_INVALID")
        for nested in value:
            validate_prompt_value(nested, graph, current_node, strings)
        return
    if isinstance(value, dict):
        if len(value) > 64:
            raise RuntimeFailure("PROMPT_INVALID")
        for key, nested in value.items():
            if not isinstance(key, str) or len(key) > 128:
                raise RuntimeFailure("PROMPT_INVALID")
            validate_prompt_value(nested, graph, current_node, strings)
        return
    raise RuntimeFailure("PROMPT_INVALID")


def prepare_runtime() -> None:
    if len(sys.argv) != 1:
        raise RuntimeFailure("CALLER_ARGUMENTS_FORBIDDEN")
    if os.getuid() != 65_532 or os.getgid() != 65_532:
        raise RuntimeFailure("NONROOT_IDENTITY_INVALID")
    if os.access("/", os.W_OK):
        raise RuntimeFailure("READ_ONLY_ROOT_REQUIRED")
    for required in (
        PYTHON,
        MAIN_PATH,
        IPADAPTER_NODE_ROOT / "__init__.py",
        CONTROLNET_AUX_NODE_ROOT / "__init__.py",
        EXTRA_MODEL_PATHS,
    ):
        if not required.is_file() or required.is_symlink():
            raise RuntimeFailure("PACKAGE_LAYOUT_INVALID")
    for directory in (
        RUNTIME_ROOT,
        RUNTIME_ROOT / "input",
        RUNTIME_ROOT / "output",
        RUNTIME_ROOT / "temp",
        RUNTIME_ROOT / "user",
        PRIVATE_INPUT_ROOT,
        PRIVATE_OUTPUT_ROOT,
    ):
        if not directory.is_dir() or directory.is_symlink():
            raise RuntimeFailure("RUNTIME_LAYOUT_INVALID")
    if OUTPUT_FILE.exists():
        raise RuntimeFailure("CREATE_ONLY_OUTPUT_REQUIRED")
    os.environ.clear()
    os.environ.update(FIXED_ENVIRONMENT)
    if dict(os.environ) != FIXED_ENVIRONMENT:
        raise RuntimeFailure("ENVIRONMENT_CONFINEMENT_FAILED")


def verify_gpu() -> dict[str, Any]:
    try:
        import torch
    except Exception:
        raise RuntimeFailure("CUDA_RUNTIME_PREFLIGHT_FAILED")
    if (
        torch.__version__ != "2.5.1+cu124"
        or torch.version.cuda != "12.4"
        or not torch.cuda.is_available()
        or torch.cuda.device_count() != 1
    ):
        raise RuntimeFailure("CUDA_RUNTIME_PREFLIGHT_FAILED")
    device_name = torch.cuda.get_device_name(0)
    if device_name != "NVIDIA L4":
        raise RuntimeFailure("L4_ACCELERATOR_REQUIRED")
    return {
        "torchVersion": torch.__version__,
        "cudaBuild": torch.version.cuda,
        "cudaDeviceCount": 1,
        "cudaDeviceName": device_name,
    }


def verify_artifacts(request: dict[str, Any]) -> list[dict[str, Any]]:
    observations: list[dict[str, Any]] = []
    for supplied, expected in zip(request["modelArtifacts"], MODEL_FILES):
        path = expected["path"]
        if (
            not path.is_file()
            or path.is_symlink()
            or path.stat().st_size != expected["byteLength"]
            or digest_file(path) != expected["contentSha256"]
        ):
            raise RuntimeFailure("MODEL_ARTIFACT_VERIFICATION_FAILED")
        observations.append(
            {
                "canonicalOrder": expected["canonicalOrder"],
                "role": expected["role"],
                "byteLength": expected["byteLength"],
                "contentSha256": expected["contentSha256"],
                "sourceBindingDigestSha256": supplied[
                    "sourceBindingDigestSha256"
                ],
            }
        )
    for supplied in request["inputImages"]:
        path = INPUT_FILES[supplied["slotId"]]
        if (
            not path.is_file()
            or path.is_symlink()
            or path.stat().st_size != supplied["byteLength"]
            or digest_file(path) != supplied["contentSha256"]
        ):
            raise RuntimeFailure("INPUT_IMAGE_VERIFICATION_FAILED")
        verify_input_png(
            path,
            supplied["width"],
            supplied["height"],
        )
    return observations


def verify_input_png(path: Path, width: int, height: int) -> None:
    try:
        from PIL import Image

        with Image.open(path) as image:
            if image.format != "PNG":
                raise RuntimeFailure("INPUT_IMAGE_VERIFICATION_FAILED")
            image.verify()
        with Image.open(path) as image:
            if image.size != (width, height):
                raise RuntimeFailure("INPUT_IMAGE_VERIFICATION_FAILED")
            image.load()
    except RuntimeFailure:
        raise
    except Exception:
        raise RuntimeFailure("INPUT_IMAGE_VERIFICATION_FAILED")


def fixed_host_arguments() -> list[str]:
    return [
        str(PYTHON),
        "-I",
        "-B",
        "-c",
        BOOTSTRAP,
        "--listen",
        "127.0.0.1",
        "--port",
        "8188",
        "--disable-auto-launch",
        "--disable-metadata",
        "--disable-api-nodes",
        "--disable-all-custom-nodes",
        "--whitelist-custom-nodes",
        str(IPADAPTER_NODE_ROOT),
        str(CONTROLNET_AUX_NODE_ROOT),
        "--base-directory",
        str(RUNTIME_ROOT),
        "--input-directory",
        str(PRIVATE_INPUT_ROOT),
        "--extra-model-paths-config",
        str(EXTRA_MODEL_PATHS),
        "--preview-method",
        "none",
        "--cache-none",
        "--force-fp16",
        "--cuda-device",
        "0",
    ]


async def wait_until_ready(session: Any) -> None:
    deadline = time.monotonic() + READY_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        try:
            async with session.get(
                "http://127.0.0.1:8188/system_stats",
                timeout=1.0,
                allow_redirects=False,
            ) as response:
                if response.status == 200:
                    body = await response.read()
                    if 2 <= len(body) <= 262_144:
                        return
        except Exception:
            pass
        await asyncio.sleep(0.25)
    raise RuntimeFailure("COMFYUI_READINESS_FAILED")


async def execute_prompt(request: dict[str, Any]) -> tuple[bytes, str]:
    try:
        import aiohttp
    except Exception:
        raise RuntimeFailure("COMFYUI_CLIENT_UNAVAILABLE")
    client_id = (
        "reeditpro-"
        + hashlib.sha256(
            request["selectedScene"]["requestBindingId"].encode("utf-8")
        ).hexdigest()[:32]
    )
    output_node_id = request["prompt"]["outputNodeId"]
    timeout = aiohttp.ClientTimeout(total=EXECUTION_TIMEOUT_SECONDS)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        await wait_until_ready(session)
        async with session.ws_connect(
            f"http://127.0.0.1:8188/ws?clientId={client_id}",
            max_msg_size=MAX_OUTPUT_BYTES + 8,
            autoping=True,
            autoclose=True,
        ) as websocket:
            async with session.post(
                "http://127.0.0.1:8188/prompt",
                json={
                    "prompt": request["prompt"]["graph"],
                    "client_id": client_id,
                },
                allow_redirects=False,
            ) as response:
                body = await response.read()
                if response.status != 200 or len(body) > 65_536:
                    raise RuntimeFailure("COMFYUI_PROMPT_REJECTED")
                try:
                    accepted = json.loads(body.decode("utf-8"))
                except (UnicodeDecodeError, json.JSONDecodeError):
                    raise RuntimeFailure("COMFYUI_PROMPT_REJECTED")
                prompt_id = accepted.get("prompt_id")
                if (
                    not isinstance(prompt_id, str)
                    or not 1 <= len(prompt_id) <= 128
                ):
                    raise RuntimeFailure("COMFYUI_PROMPT_REJECTED")
            current_node: str | None = None
            output: bytes | None = None
            async for message in websocket:
                if message.type == aiohttp.WSMsgType.TEXT:
                    try:
                        event = json.loads(message.data)
                    except json.JSONDecodeError:
                        raise RuntimeFailure("COMFYUI_PROTOCOL_INVALID")
                    if not isinstance(event, dict) or not isinstance(
                        event.get("data"), dict
                    ):
                        raise RuntimeFailure("COMFYUI_PROTOCOL_INVALID")
                    data = event["data"]
                    event_prompt = data.get("prompt_id")
                    if event_prompt is not None and event_prompt != prompt_id:
                        continue
                    if event.get("type") == "executing":
                        current_node = data.get("node")
                        if current_node is None:
                            if output is None:
                                raise RuntimeFailure(
                                    "COMFYUI_OUTPUT_COUNT_INVALID"
                                )
                            return output, prompt_id
                    elif event.get("type") in (
                        "execution_error",
                        "execution_interrupted",
                    ):
                        raise RuntimeFailure("COMFYUI_EXECUTION_FAILED")
                elif message.type == aiohttp.WSMsgType.BINARY:
                    frame = bytes(message.data)
                    if (
                        len(frame) <= 8
                        or int.from_bytes(frame[:4], "big") != 1
                        or int.from_bytes(frame[4:8], "big") != 2
                        or current_node != output_node_id
                        or output is not None
                    ):
                        raise RuntimeFailure("COMFYUI_PROTOCOL_INVALID")
                    output = frame[8:]
                    if len(output) > MAX_OUTPUT_BYTES:
                        raise RuntimeFailure("COMFYUI_OUTPUT_TOO_LARGE")
                elif message.type in (
                    aiohttp.WSMsgType.ERROR,
                    aiohttp.WSMsgType.CLOSED,
                    aiohttp.WSMsgType.CLOSE,
                ):
                    raise RuntimeFailure("COMFYUI_CONNECTION_CLOSED")
    raise RuntimeFailure("COMFYUI_CONNECTION_CLOSED")


def inspect_png(
    png_bytes: bytes,
    width: int,
    height: int,
) -> dict[str, Any]:
    if (
        len(png_bytes) < 33
        or len(png_bytes) > MAX_OUTPUT_BYTES
        or png_bytes[:8] != b"\x89PNG\r\n\x1a\n"
    ):
        raise RuntimeFailure("OUTPUT_PNG_INVALID")
    try:
        from PIL import Image

        with Image.open(io.BytesIO(png_bytes)) as image:
            image.verify()
        with Image.open(io.BytesIO(png_bytes)) as image:
            if image.size != (width, height):
                raise RuntimeFailure("OUTPUT_PNG_INVALID")
            rgba = image.convert("RGBA").tobytes()
    except RuntimeFailure:
        raise
    except Exception:
        raise RuntimeFailure("OUTPUT_PNG_INVALID")
    alpha = rgba[3::4]
    if len(alpha) != width * height or any(value != 255 for value in alpha):
        raise RuntimeFailure("OUTPUT_OPAQUE_CONTRACT_FAILED")
    return {
        "byteLength": len(png_bytes),
        "contentSha256": hashlib.sha256(png_bytes).hexdigest(),
        "decodedRgbaSha256": hashlib.sha256(rgba).hexdigest(),
        "opaquePixelCount": width * height,
    }


def persist_create_only(png_bytes: bytes) -> None:
    try:
        with OUTPUT_FILE.open("xb") as output:
            output.write(png_bytes)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(OUTPUT_FILE, 0o400)
    except FileExistsError:
        raise RuntimeFailure("CREATE_ONLY_OUTPUT_REQUIRED")
    if digest_file(OUTPUT_FILE) != hashlib.sha256(png_bytes).hexdigest():
        raise RuntimeFailure("OUTPUT_READBACK_FAILED")


def start_host() -> tuple[subprocess.Popen[bytes], BoundedCapture, BoundedCapture]:
    process = subprocess.Popen(
        fixed_host_arguments(),
        cwd=str(SOURCE_ROOT),
        env=FIXED_ENVIRONMENT,
        shell=False,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        start_new_session=True,
    )
    if process.stdout is None or process.stderr is None:
        raise RuntimeFailure("COMFYUI_PROCESS_START_FAILED")
    stdout = BoundedCapture(process.stdout)
    stderr = BoundedCapture(process.stderr)
    stdout.start()
    stderr.start()
    return process, stdout, stderr


def stop_host(process: subprocess.Popen[bytes]) -> tuple[int, bool]:
    escalated = False
    if process.poll() is None:
        os.killpg(process.pid, signal.SIGTERM)
        try:
            process.wait(timeout=STOP_TIMEOUT_SECONDS)
        except subprocess.TimeoutExpired:
            escalated = True
            os.killpg(process.pid, signal.SIGKILL)
            process.wait(timeout=5.0)
    return process.returncode if process.returncode is not None else -1, escalated


def run() -> dict[str, Any]:
    request = read_request()
    prepare_runtime()
    gpu = verify_gpu()
    before = verify_artifacts(request)
    started_at = time.time()
    process: subprocess.Popen[bytes] | None = None
    stdout_capture: BoundedCapture | None = None
    stderr_capture: BoundedCapture | None = None
    png_bytes: bytes | None = None
    prompt_id: str | None = None
    process_exit_code = -1
    stop_escalated = False
    try:
        process, stdout_capture, stderr_capture = start_host()
        png_bytes, prompt_id = asyncio.run(execute_prompt(request))
    finally:
        if process is not None:
            process_exit_code, stop_escalated = stop_host(process)
    if (
        png_bytes is None
        or prompt_id is None
        or stdout_capture is None
        or stderr_capture is None
    ):
        raise RuntimeFailure("COMFYUI_EXECUTION_INCOMPLETE")
    stdout = stdout_capture.finish()
    stderr = stderr_capture.finish()
    if (
        stdout["captureExceeded"]
        or stderr["captureExceeded"]
        or stop_escalated
        or process_exit_code not in (0, -signal.SIGTERM)
    ):
        raise RuntimeFailure("COMFYUI_PROCESS_SHUTDOWN_INVALID")
    after = verify_artifacts(request)
    if before != after:
        raise RuntimeFailure("MODEL_ARTIFACT_POST_VERIFY_FAILED")
    output = inspect_png(
        png_bytes,
        request["output"]["width"],
        request["output"]["height"],
    )
    persist_create_only(png_bytes)
    finished_at = time.time()
    return {
        "schemaVersion": RESPONSE_VERSION,
        "ok": True,
        "status": "controlled_comfyui_gpu_generation_completed",
        "operationId": OPERATION_ID,
        "admissionDigestSha256": request["admissionDigestSha256"],
        "requestBindingSha256": request["requestBindingSha256"],
        "dispatchIntentId": request["dispatch"]["dispatchIntentId"],
        "runtimeIdentity": {
            "comfyUiSourceRevision": (
                "093d571b83e7a79833200e199b46b9f5a62217f9"
            ),
            "ipAdapterSourceRevision": (
                "b188a6cb39b512a9c6da7235b880af42c78ccd0d"
            ),
            "controlNetAuxSourceRevision": (
                "e8b689a513c3e6b63edc44066560ca5919c0576e"
            ),
            "wheelManifestSha256": (
                "cc63d5e32c32497953482f864c5cd47bf9ef48ee59dca9ab"
                "484211af665c37e9"
            ),
            **gpu,
            "accelerator": "nvidia_l4",
            "device": "cuda",
            "runtimeRegion": "europe-west1",
            "modelArtifactCount": 5,
            "modelArtifactByteLength": 11_700_367_157,
            "allModelsVerifiedBeforeAndAfterInference": True,
            "sam2ImportDenied": True,
            "cpuFallbackDisabled": True,
        },
        "outputs": [
            {
                "canonicalOrder": 0,
                "artifactKind": "generated_opaque_png",
                "fileName": "generated.png",
                "contentType": "image/png",
                "encodingProfile": "opaque_rgb_or_rgba_png_v1",
                "width": request["output"]["width"],
                "height": request["output"]["height"],
                **output,
            }
        ],
        "processEvidence": [
            {
                "canonicalOrder": 0,
                "processClass": "fixed_supervised_comfyui_host",
                "startedAtUnixMilliseconds": round(started_at * 1000),
                "finishedAtUnixMilliseconds": round(finished_at * 1000),
                "promptIdSha256": hashlib.sha256(
                    prompt_id.encode("utf-8")
                ).hexdigest(),
                "stdoutByteLength": stdout["byteLength"],
                "stdoutSha256": stdout["contentSha256"],
                "stderrByteLength": stderr["byteLength"],
                "stderrSha256": stderr["contentSha256"],
                "gracefulShutdownObserved": True,
                "stopEscalationRequired": False,
            }
        ],
        "receiptBoundaries": {
            "outputBytesIncluded": False,
            "promptTextIncluded": False,
            "modelBytesIncluded": False,
            "inputImageBytesIncluded": False,
            "pathsIncluded": False,
            "urlsIncluded": False,
            "credentialsIncluded": False,
            "cpuFallbackAllowed": False,
            "runtimeDownloadAllowed": False,
            "networkFetchAllowed": False,
            "artifactCommitAuthority": False,
            "qaPassAuthority": False,
            "customerCostAuthority": False,
            "productionReady": False,
        },
    }


def main() -> None:
    try:
        response = run()
        sys.stdout.write(canonical_json(response) + "\n")
        sys.stdout.flush()
    except RuntimeFailure as failure:
        sys.stderr.write(f"COMFYUI_RUNTIME_FAILED:{failure.code}\n")
        sys.stderr.flush()
        raise SystemExit(70)
    except Exception:
        sys.stderr.write("COMFYUI_RUNTIME_FAILED:UNCLASSIFIED\n")
        sys.stderr.flush()
        raise SystemExit(71)


if __name__ == "__main__":
    main()
