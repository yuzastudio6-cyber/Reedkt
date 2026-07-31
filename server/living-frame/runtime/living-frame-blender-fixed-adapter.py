#!/usr/bin/env python3
"""Fixed, reviewed Blender adapter for private Living Frame qualification.

The Head Intelligence never writes or selects this program. Blender starts
from its factory state with auto-execution disabled, and this adapter reads one
fixed relative request envelope from an isolated job directory.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import re
import stat
import sys
import time
from pathlib import Path
from typing import Any

import bpy


ENVELOPE_FILE = Path(".reeditpro-rigging/request-envelope.json")
OUTPUT_ROOT = Path(".reeditpro-rigging/output")
RESULT_FILE = Path(".reeditpro-rigging/result.json")
TEXTURE_FILE = Path(".reeditpro-rigging/input/component-texture.png")
SAFE_ID = re.compile(r"^[a-z0-9][a-z0-9._:-]{0,127}$")
SHA256 = re.compile(r"^[a-f0-9]{64}$")
FLAT_CONTRACT_VERSION = "living-frame-blender-fixed-adapter-internal-request-v1"
TEXTURED_CONTRACT_VERSION = (
    "living-frame-blender-fixed-textured-adapter-internal-request-v2"
)
FLAT_ENVELOPE_VERSION = "living-frame-fixed-adapter-envelope-v1"
TEXTURED_ENVELOPE_VERSION = "living-frame-fixed-textured-adapter-envelope-v2"
MAX_FRAMES = 240
MAX_VERTICES = 4096
MAX_TRIANGLES = 8192
MAX_BONES = 64
MAX_TEXTURE_BYTES = 16 * 1024 * 1024


class AdapterFailure(RuntimeError):
    """A stable, path-free adapter failure."""


def fail(message: str) -> None:
    raise AdapterFailure(message)


def exact_keys(value: dict[str, Any], expected: set[str], label: str) -> None:
    if set(value.keys()) != expected:
        fail(f"{label} has an invalid field set")


def require_dict(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(f"{label} must be an object")
    return value


def require_list(value: Any, label: str) -> list[Any]:
    if not isinstance(value, list):
        fail(f"{label} must be an array")
    return value


def require_string(value: Any, label: str, pattern: re.Pattern[str] | None = None) -> str:
    if not isinstance(value, str):
        fail(f"{label} must be a string")
    if pattern is not None and pattern.fullmatch(value) is None:
        fail(f"{label} has an invalid value")
    return value


def require_bool(value: Any, expected: bool, label: str) -> bool:
    if value is not expected:
        fail(f"{label} has an invalid value")
    return expected


def require_int(value: Any, minimum: int, maximum: int, label: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        fail(f"{label} must be an integer")
    if value < minimum or value > maximum:
        fail(f"{label} is outside the allowed range")
    return value


def require_number(
    value: Any,
    minimum: float,
    maximum: float,
    label: str,
) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        fail(f"{label} must be numeric")
    numeric = float(value)
    if not math.isfinite(numeric) or numeric < minimum or numeric > maximum:
        fail(f"{label} is outside the allowed range")
    return numeric


def read_request() -> dict[str, Any]:
    request_path = (Path.cwd() / ENVELOPE_FILE).resolve()
    job_root = Path.cwd().resolve()
    if job_root not in request_path.parents:
        fail("request confinement failed")
    if not request_path.exists() or request_path.is_symlink():
        fail("request envelope is unavailable")
    request_stat = request_path.stat()
    if not stat.S_ISREG(request_stat.st_mode) or request_stat.st_size > 2_000_000:
        fail("request envelope is invalid")
    envelope = require_dict(json.loads(request_path.read_text("utf-8")), "request envelope")
    exact_keys(
        envelope,
        {"envelopeVersion", "payloadCanonicalJson", "payloadDigestSha256"},
        "request envelope",
    )
    envelope_version = envelope["envelopeVersion"]
    if envelope_version not in (
        FLAT_ENVELOPE_VERSION,
        TEXTURED_ENVELOPE_VERSION,
    ):
        fail("request envelope version is invalid")
    canonical = require_string(
        envelope["payloadCanonicalJson"],
        "canonical payload",
    )
    digest = require_string(
        envelope["payloadDigestSha256"],
        "canonical payload digest",
        SHA256,
    )
    if hashlib.sha256(canonical.encode("utf-8")).hexdigest() != digest:
        fail("request payload digest is invalid")
    payload = require_dict(json.loads(canonical), "request payload")
    expected_envelope_version = (
        TEXTURED_ENVELOPE_VERSION
        if payload.get("contractVersion") == TEXTURED_CONTRACT_VERSION
        else FLAT_ENVELOPE_VERSION
    )
    if envelope_version != expected_envelope_version:
        fail("request envelope and contract versions do not match")
    validate_payload(payload, digest)
    return payload


def validate_payload(payload: dict[str, Any], payload_digest: str) -> None:
    exact_keys(
        payload,
        {
            "contractVersion",
            "requestClass",
            "candidateRequestDigestSha256",
            "riggingPlanDigestSha256",
            "actionPlanDigestSha256",
            "componentId",
            "output",
            "mesh",
            "bones",
            "joints",
            "ik",
            "animation",
            "material",
            "authorityBoundary",
            "payloadDigestBindingSha256",
        },
        "request payload",
    )
    contract_version = payload["contractVersion"]
    if contract_version not in (
        FLAT_CONTRACT_VERSION,
        TEXTURED_CONTRACT_VERSION,
    ):
        fail("request contract version is invalid")
    expected_request_class = (
        "private_internal_fixed_blender_textured_adapter_request"
        if contract_version == TEXTURED_CONTRACT_VERSION
        else "private_internal_fixed_blender_adapter_request"
    )
    if payload["requestClass"] != expected_request_class:
        fail("request class is invalid")
    require_string(payload["candidateRequestDigestSha256"], "candidate digest", SHA256)
    require_string(payload["riggingPlanDigestSha256"], "rigging plan digest", SHA256)
    require_string(payload["actionPlanDigestSha256"], "action plan digest", SHA256)
    require_string(payload["componentId"], "component id", SAFE_ID)
    inner_payload = dict(payload)
    inner_digest = require_string(
        inner_payload.pop("payloadDigestBindingSha256"),
        "payload digest binding",
        SHA256,
    )
    inner_canonical = json.dumps(
        inner_payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    if hashlib.sha256(inner_canonical.encode("utf-8")).hexdigest() != inner_digest:
        fail("payload digest binding is invalid")
    validate_output(require_dict(payload["output"], "output"))
    validate_mesh(require_dict(payload["mesh"], "mesh"))
    validate_bones(require_list(payload["bones"], "bones"))
    validate_joints(require_list(payload["joints"], "joints"), payload["bones"])
    validate_ik(
        require_dict(payload["ik"], "ik"),
        payload["bones"],
        payload["output"],
    )
    validate_animation(
        require_dict(payload["animation"], "animation"),
        payload["output"],
    )
    validate_material(
        require_dict(payload["material"], "material"),
        contract_version == TEXTURED_CONTRACT_VERSION,
    )
    authority = require_dict(payload["authorityBoundary"], "authority boundary")
    exact_keys(
        authority,
        {
            "privateInternalQualificationOnly",
            "runtimeDispatchAuthority",
            "assetPersistenceAuthority",
            "assetManifestAuthority",
            "costAuthority",
            "billingAuthority",
            "qaApprovalAuthority",
            "finalCanvasAuthority",
            "publicDeliveryAuthority",
            "productionAuthority",
            "remotionOwnsFinalCanvas",
        },
        "authority boundary",
    )
    require_bool(authority["privateInternalQualificationOnly"], True, "private scope")
    for key in (
        "runtimeDispatchAuthority",
        "assetPersistenceAuthority",
        "assetManifestAuthority",
        "costAuthority",
        "billingAuthority",
        "qaApprovalAuthority",
        "finalCanvasAuthority",
        "publicDeliveryAuthority",
        "productionAuthority",
    ):
        require_bool(authority[key], False, key)
    require_bool(authority["remotionOwnsFinalCanvas"], True, "final canvas owner")


def validate_output(output: dict[str, Any]) -> None:
    exact_keys(
        output,
        {
            "widthPixels",
            "heightPixels",
            "fps",
            "startFrame",
            "endFrameExclusive",
            "frameStep",
            "transparentRgbaRequired",
            "maskPassRequired",
            "depthPassRequired",
            "previewScale",
        },
        "output",
    )
    require_int(output["widthPixels"], 64, 4096, "output width")
    require_int(output["heightPixels"], 64, 4096, "output height")
    require_int(output["fps"], 1, 120, "output fps")
    start = require_int(output["startFrame"], 0, 1_000_000, "start frame")
    end = require_int(output["endFrameExclusive"], 1, 1_000_001, "end frame")
    if end <= start or end - start > MAX_FRAMES:
        fail("output frame range is invalid")
    frame_step = require_int(output["frameStep"], 1, 60, "output frame step")
    require_bool(output["transparentRgbaRequired"], True, "transparent output")
    require_bool(output["maskPassRequired"], True, "mask pass")
    require_bool(output["depthPassRequired"], True, "depth pass")
    preview_scale = require_number(
        output["previewScale"],
        0.25,
        1.0,
        "preview scale",
    )
    if preview_scale not in (0.25, 1.0):
        fail("preview scale is not an approved profile")
    expected_step = 6 if preview_scale == 0.25 else 1
    if frame_step != expected_step:
        fail("output frame step does not match the approved preview profile")


def normalized_point(value: Any, label: str, include_depth: bool = False) -> tuple[float, ...]:
    point = require_dict(value, label)
    expected = {"x", "y", "z"} if include_depth else {"x", "y"}
    exact_keys(point, expected, label)
    x = require_number(point["x"], 0.0, 1.0, f"{label}.x")
    y = require_number(point["y"], 0.0, 1.0, f"{label}.y")
    if not include_depth:
        return (x, y)
    z = require_number(point["z"], -1.0, 1.0, f"{label}.z")
    return (x, y, z)


def validate_mesh(mesh: dict[str, Any]) -> None:
    exact_keys(mesh, {"meshId", "vertices", "triangles", "weights"}, "mesh")
    require_string(mesh["meshId"], "mesh id", SAFE_ID)
    vertices = require_list(mesh["vertices"], "mesh vertices")
    triangles = require_list(mesh["triangles"], "mesh triangles")
    weights = require_list(mesh["weights"], "mesh weights")
    if len(vertices) < 4 or len(vertices) > MAX_VERTICES or len(weights) != len(vertices):
        fail("mesh vertex or weight count is invalid")
    if len(triangles) < 2 or len(triangles) > MAX_TRIANGLES:
        fail("mesh triangle count is invalid")
    for index, vertex_value in enumerate(vertices):
        vertex = require_dict(vertex_value, f"vertex {index}")
        exact_keys(vertex, {"position", "uv"}, f"vertex {index}")
        normalized_point(vertex["position"], f"vertex {index} position", True)
        uv = normalized_point(vertex["uv"], f"vertex {index} uv")
        if any(not math.isfinite(item) for item in uv):
            fail("mesh uv is invalid")
    used_triangles: set[tuple[int, int, int]] = set()
    for index, triangle_value in enumerate(triangles):
        triangle = require_list(triangle_value, f"triangle {index}")
        if len(triangle) != 3:
            fail("mesh triangle must have three vertices")
        parsed = tuple(
            require_int(item, 0, len(vertices) - 1, f"triangle {index} index")
            for item in triangle
        )
        if len(set(parsed)) != 3 or parsed in used_triangles:
            fail("mesh triangle is degenerate or duplicated")
        used_triangles.add(parsed)
    for index, weight_value in enumerate(weights):
        weight_set = require_list(weight_value, f"vertex weight {index}")
        if not weight_set or len(weight_set) > 4:
            fail("vertex weight set is invalid")
        total = 0.0
        seen_bones: set[str] = set()
        for entry_value in weight_set:
            entry = require_dict(entry_value, f"vertex weight {index} entry")
            exact_keys(entry, {"boneId", "weight"}, f"vertex weight {index} entry")
            bone_id = require_string(entry["boneId"], "weight bone id", SAFE_ID)
            if bone_id in seen_bones:
                fail("vertex weight bone is duplicated")
            seen_bones.add(bone_id)
            total += require_number(entry["weight"], 0.0, 1.0, "vertex weight")
        if abs(total - 1.0) > 0.0001:
            fail("vertex weights do not sum to one")


def validate_bones(bones: list[Any]) -> None:
    if not bones or len(bones) > MAX_BONES:
        fail("bone count is invalid")
    ids: set[str] = set()
    parsed: dict[str, dict[str, Any]] = {}
    for order, bone_value in enumerate(bones):
        bone = require_dict(bone_value, f"bone {order}")
        exact_keys(
            bone,
            {
                "order",
                "boneId",
                "parentBoneId",
                "head",
                "tail",
                "deform",
            },
            f"bone {order}",
        )
        if require_int(bone["order"], order, order, "bone order") != order:
            fail("bone order is invalid")
        bone_id = require_string(bone["boneId"], "bone id", SAFE_ID)
        if bone_id in ids:
            fail("bone id is duplicated")
        ids.add(bone_id)
        parent_id = bone["parentBoneId"]
        if parent_id is not None:
            require_string(parent_id, "parent bone id", SAFE_ID)
        normalized_point(bone["head"], "bone head", True)
        normalized_point(bone["tail"], "bone tail", True)
        if bone["deform"] not in (True, False):
            fail("bone deform flag is invalid")
        parsed[bone_id] = bone
    for bone_id, bone in parsed.items():
        parent = bone["parentBoneId"]
        if parent is not None and parent not in parsed:
            fail("bone parent is missing")
        visited: set[str] = set()
        cursor: str | None = bone_id
        while cursor is not None:
            if cursor in visited:
                fail("bone hierarchy is cyclic")
            visited.add(cursor)
            cursor = parsed[cursor]["parentBoneId"]


def validate_joints(joints: list[Any], bones_value: Any) -> None:
    bone_ids = {
        require_dict(value, "bone")["boneId"]
        for value in require_list(bones_value, "bones")
    }
    seen: set[str] = set()
    for order, joint_value in enumerate(joints):
        joint = require_dict(joint_value, f"joint {order}")
        exact_keys(
            joint,
            {
                "order",
                "jointId",
                "boneId",
                "minimumAngleDegrees",
                "maximumAngleDegrees",
            },
            f"joint {order}",
        )
        require_int(joint["order"], order, order, "joint order")
        joint_id = require_string(joint["jointId"], "joint id", SAFE_ID)
        bone_id = require_string(joint["boneId"], "joint bone id", SAFE_ID)
        if joint_id in seen or bone_id not in bone_ids:
            fail("joint binding is invalid")
        seen.add(joint_id)
        minimum = require_number(
            joint["minimumAngleDegrees"],
            -180.0,
            180.0,
            "joint minimum",
        )
        maximum = require_number(
            joint["maximumAngleDegrees"],
            -180.0,
            180.0,
            "joint maximum",
        )
        if minimum >= maximum:
            fail("joint angle range is invalid")


def validate_ik(
    ik: dict[str, Any],
    bones_value: Any,
    output_value: Any,
) -> None:
    exact_keys(
        ik,
        {
            "effectorBoneId",
            "chainLength",
            "iterationLimit",
            "targetKeyframes",
        },
        "ik",
    )
    bone_ids = {
        require_dict(value, "bone")["boneId"]
        for value in require_list(bones_value, "bones")
    }
    if require_string(ik["effectorBoneId"], "IK effector", SAFE_ID) not in bone_ids:
        fail("IK effector is invalid")
    require_int(ik["chainLength"], 1, len(bone_ids), "IK chain length")
    require_int(ik["iterationLimit"], 1, 256, "IK iteration limit")
    keyframes = require_list(ik["targetKeyframes"], "IK target keyframes")
    if len(keyframes) < 2 or len(keyframes) > 64:
        fail("IK target keyframe count is invalid")
    last_frame = -1
    for index, keyframe_value in enumerate(keyframes):
        keyframe = require_dict(keyframe_value, f"IK target keyframe {index}")
        exact_keys(keyframe, {"frame", "position"}, f"IK target keyframe {index}")
        frame = require_int(keyframe["frame"], 0, 1_000_000, "IK target frame")
        if frame <= last_frame:
            fail("IK target frames are not strictly ordered")
        last_frame = frame
        normalized_point(keyframe["position"], "IK target position", True)
    output = require_dict(output_value, "output")
    if (
        keyframes[0]["frame"] != output["startFrame"]
        or keyframes[-1]["frame"] != output["endFrameExclusive"] - 1
    ):
        fail("IK target keyframes do not match the approved output range")


def validate_animation(animation: dict[str, Any], output_value: Any) -> None:
    exact_keys(
        animation,
        {
            "interpolation",
            "deterministicBakeRequired",
            "secondaryMotionEnabled",
        },
        "animation",
    )
    if animation["interpolation"] != "BEZIER":
        fail("animation interpolation is invalid")
    require_bool(
        animation["deterministicBakeRequired"],
        True,
        "deterministic bake",
    )
    require_bool(animation["secondaryMotionEnabled"], False, "secondary motion")
    output = require_dict(output_value, "output")
    if output["endFrameExclusive"] - output["startFrame"] < 2:
        fail("animation frame range is too short")


def validate_material(
    material: dict[str, Any],
    textured: bool,
) -> None:
    expected_keys = {"baseColorRgba", "roughness"}
    if textured:
        expected_keys.add("texture")
    exact_keys(material, expected_keys, "material")
    color = require_list(material["baseColorRgba"], "material color")
    if len(color) != 4:
        fail("material color is invalid")
    for index, item in enumerate(color):
        require_number(item, 0.0, 1.0, f"material color {index}")
    require_number(material["roughness"], 0.0, 1.0, "material roughness")
    if not textured:
        return
    texture = require_dict(material["texture"], "material texture")
    exact_keys(
        texture,
        {
            "artifactId",
            "contentType",
            "widthPixels",
            "heightPixels",
            "byteLength",
            "sha256",
            "fixedRelativePath",
            "alphaMode",
            "colorSpace",
        },
        "material texture",
    )
    require_string(texture["artifactId"], "texture artifact id", SAFE_ID)
    if (
        texture["contentType"] != "image/png"
        or texture["fixedRelativePath"] != "input/component-texture.png"
        or texture["alphaMode"] != "straight"
        or texture["colorSpace"] != "srgb"
    ):
        fail("material texture profile is invalid")
    width = require_int(
        texture["widthPixels"],
        1,
        4096,
        "texture width",
    )
    height = require_int(
        texture["heightPixels"],
        1,
        4096,
        "texture height",
    )
    if width * height > 8_294_400:
        fail("material texture pixel count is invalid")
    byte_length = require_int(
        texture["byteLength"],
        1,
        MAX_TEXTURE_BYTES,
        "texture byte length",
    )
    expected_digest = require_string(
        texture["sha256"],
        "texture digest",
        SHA256,
    )
    texture_path = (Path.cwd() / TEXTURE_FILE).resolve()
    job_root = Path.cwd().resolve()
    if (
        job_root not in texture_path.parents
        or not texture_path.exists()
        or texture_path.is_symlink()
    ):
        fail("material texture is unavailable")
    texture_stat = texture_path.stat()
    if (
        not stat.S_ISREG(texture_stat.st_mode)
        or texture_stat.st_size != byte_length
        or texture_stat.st_size > MAX_TEXTURE_BYTES
    ):
        fail("material texture file is invalid")
    content = texture_path.read_bytes()
    if (
        len(content) != byte_length
        or hashlib.sha256(content).hexdigest() != expected_digest
        or len(content) < 33
        or content[0:8] != b"\x89PNG\r\n\x1a\n"
        or int.from_bytes(content[8:12], "big") != 13
        or content[12:16] != b"IHDR"
        or int.from_bytes(content[16:20], "big") != width
        or int.from_bytes(content[20:24], "big") != height
        or content[24] != 8
        or content[25] != 6
        or content[26] != 0
        or content[27] != 0
        or content[28] != 0
    ):
        fail("material texture content is invalid")


def point_to_world(point: dict[str, Any], aspect: float) -> tuple[float, float, float]:
    scale_x = 4.0
    scale_y = scale_x / aspect
    return (
        (float(point["x"]) - 0.5) * scale_x,
        (0.5 - float(point["y"])) * scale_y,
        float(point["z"]),
    )


def reset_scene() -> bpy.types.Scene:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.resolution_percentage = 100
    scene.render.use_file_extension = True
    scene.view_layers[0].use_pass_z = True
    return scene


def create_camera(scene: bpy.types.Scene, aspect: float) -> None:
    camera_data = bpy.data.cameras.new("LF_Camera")
    camera = bpy.data.objects.new("LF_Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0.0, 0.0, 10.0)
    camera.rotation_euler = (0.0, 0.0, 0.0)
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 4.0 / aspect
    scene.camera = camera


def create_material(payload: dict[str, Any]) -> bpy.types.Material:
    material_spec = payload["material"]
    material = bpy.data.materials.new("LF_Component_Material")
    material.use_nodes = True
    material.surface_render_method = "DITHERED"
    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled is None:
        fail("Blender material node is unavailable")
    color = tuple(float(item) for item in material_spec["baseColorRgba"])
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Roughness"].default_value = float(material_spec["roughness"])
    if "Emission Color" in principled.inputs:
        principled.inputs["Emission Color"].default_value = color
        principled.inputs["Emission Strength"].default_value = 0.25
    if payload["contractVersion"] == TEXTURED_CONTRACT_VERSION:
        texture_spec = material_spec["texture"]
        texture_path = (Path.cwd() / TEXTURE_FILE).resolve()
        image = bpy.data.images.load(
            str(texture_path),
            check_existing=False,
        )
        if (
            int(image.size[0]) != int(texture_spec["widthPixels"])
            or int(image.size[1]) != int(texture_spec["heightPixels"])
            or image.channels != 4
        ):
            fail("Blender decoded texture dimensions or channels changed")
        image.colorspace_settings.name = "sRGB"
        image.alpha_mode = "STRAIGHT"
        texture_node = material.node_tree.nodes.new("ShaderNodeTexImage")
        texture_node.name = "LF_Component_Texture"
        texture_node.image = image
        texture_node.interpolation = "Linear"
        texture_node.extension = "CLIP"
        links = material.node_tree.links
        links.new(
            texture_node.outputs["Color"],
            principled.inputs["Base Color"],
        )
        links.new(
            texture_node.outputs["Alpha"],
            principled.inputs["Alpha"],
        )
        if "Emission Color" in principled.inputs:
            links.new(
                texture_node.outputs["Color"],
                principled.inputs["Emission Color"],
            )
    return material


def create_armature(
    payload: dict[str, Any],
    aspect: float,
) -> tuple[bpy.types.Object, dict[str, bpy.types.PoseBone]]:
    armature_data = bpy.data.armatures.new("LF_Armature")
    armature_object = bpy.data.objects.new("LF_Armature", armature_data)
    bpy.context.collection.objects.link(armature_object)
    bpy.context.view_layer.objects.active = armature_object
    armature_object.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    edit_bones: dict[str, bpy.types.EditBone] = {}
    for bone_spec in payload["bones"]:
        bone = armature_data.edit_bones.new(bone_spec["boneId"])
        bone.head = point_to_world(bone_spec["head"], aspect)
        bone.tail = point_to_world(bone_spec["tail"], aspect)
        if (bone.tail - bone.head).length < 0.0001:
            fail("bone length is zero")
        bone.use_deform = bool(bone_spec["deform"])
        edit_bones[bone_spec["boneId"]] = bone
    for bone_spec in payload["bones"]:
        parent_id = bone_spec["parentBoneId"]
        if parent_id is not None:
            edit_bones[bone_spec["boneId"]].parent = edit_bones[parent_id]
            edit_bones[bone_spec["boneId"]].use_connect = False
    bpy.ops.object.mode_set(mode="POSE")
    pose_bones = {
        bone.name: bone
        for bone in armature_object.pose.bones
    }
    joint_by_bone = {
        joint["boneId"]: joint
        for joint in payload["joints"]
    }
    for bone_id, joint in joint_by_bone.items():
        pose_bone = pose_bones[bone_id]
        minimum = math.radians(float(joint["minimumAngleDegrees"]))
        maximum = math.radians(float(joint["maximumAngleDegrees"]))
        constraint = pose_bone.constraints.new("LIMIT_ROTATION")
        constraint.owner_space = "LOCAL"
        constraint.use_limit_z = True
        constraint.min_z = minimum
        constraint.max_z = maximum
        pose_bone.lock_ik_x = True
        pose_bone.lock_ik_y = True
        pose_bone.use_ik_limit_z = True
        pose_bone.ik_min_z = minimum
        pose_bone.ik_max_z = maximum
    bpy.ops.object.mode_set(mode="OBJECT")
    armature_object.select_set(False)
    return armature_object, pose_bones


def create_mesh(
    payload: dict[str, Any],
    armature: bpy.types.Object,
    material: bpy.types.Material,
    aspect: float,
) -> bpy.types.Object:
    mesh_spec = payload["mesh"]
    positions = [
        point_to_world(vertex["position"], aspect)
        for vertex in mesh_spec["vertices"]
    ]
    triangles = [
        tuple(int(item) for item in triangle)
        for triangle in mesh_spec["triangles"]
    ]
    mesh_data = bpy.data.meshes.new(mesh_spec["meshId"])
    mesh_data.from_pydata(positions, [], triangles)
    mesh_data.update(calc_edges=True)
    uv_layer = mesh_data.uv_layers.new(name="UVMap")
    for polygon in mesh_data.polygons:
        for loop_index in polygon.loop_indices:
            vertex_index = mesh_data.loops[loop_index].vertex_index
            uv = mesh_spec["vertices"][vertex_index]["uv"]
            uv_layer.data[loop_index].uv = (float(uv["x"]), 1.0 - float(uv["y"]))
    mesh_object = bpy.data.objects.new(payload["componentId"], mesh_data)
    bpy.context.collection.objects.link(mesh_object)
    mesh_object.data.materials.append(material)
    for bone_spec in payload["bones"]:
        mesh_object.vertex_groups.new(name=bone_spec["boneId"])
    for vertex_index, weight_set in enumerate(mesh_spec["weights"]):
        for weight_entry in weight_set:
            group = mesh_object.vertex_groups.get(weight_entry["boneId"])
            if group is None:
                fail("weight references an unavailable bone")
            group.add(
                [vertex_index],
                float(weight_entry["weight"]),
                "REPLACE",
            )
    modifier = mesh_object.modifiers.new("LF_Armature", "ARMATURE")
    modifier.object = armature
    modifier.use_deform_preserve_volume = True
    return mesh_object


def create_ik(payload: dict[str, Any], armature: bpy.types.Object) -> None:
    ik_spec = payload["ik"]
    target = bpy.data.objects.new("LF_IK_Target", None)
    bpy.context.collection.objects.link(target)
    target.empty_display_type = "CIRCLE"
    target.empty_display_size = 0.12
    aspect = payload["output"]["widthPixels"] / payload["output"]["heightPixels"]
    for keyframe in ik_spec["targetKeyframes"]:
        target.location = point_to_world(keyframe["position"], aspect)
        target.keyframe_insert(data_path="location", frame=int(keyframe["frame"]))
    if target.animation_data and target.animation_data.action:
        for curve in target.animation_data.action.fcurves:
            for point in curve.keyframe_points:
                point.interpolation = payload["animation"]["interpolation"]
    pose_bone = armature.pose.bones.get(ik_spec["effectorBoneId"])
    if pose_bone is None:
        fail("IK effector pose bone is unavailable")
    ik_constraint = pose_bone.constraints.new("IK")
    ik_constraint.target = target
    ik_constraint.chain_count = int(ik_spec["chainLength"])
    ik_constraint.iterations = int(ik_spec["iterationLimit"])
    ik_constraint.use_tail = True
    armature.data.pose_position = "POSE"


def configure_compositor(scene: bpy.types.Scene, output_root: Path) -> None:
    scene.use_nodes = True
    nodes = scene.node_tree.nodes
    links = scene.node_tree.links
    nodes.clear()
    render_layers = nodes.new("CompositorNodeRLayers")
    composite = nodes.new("CompositorNodeComposite")
    links.new(render_layers.outputs["Image"], composite.inputs["Image"])

    mask_output = nodes.new("CompositorNodeOutputFile")
    mask_output.base_path = str((output_root / "mask").resolve())
    mask_output.format.file_format = "PNG"
    mask_output.format.color_mode = "BW"
    mask_output.format.color_depth = "8"
    mask_output.file_slots[0].path = "frame_"
    links.new(render_layers.outputs["Alpha"], mask_output.inputs[0])

    depth_output = nodes.new("CompositorNodeOutputFile")
    depth_output.base_path = str((output_root / "depth").resolve())
    depth_output.format.file_format = "OPEN_EXR"
    depth_output.format.color_mode = "BW"
    depth_output.format.color_depth = "32"
    depth_output.file_slots[0].path = "frame_"
    links.new(render_layers.outputs["Depth"], depth_output.inputs[0])


def ensure_private_output_root() -> Path:
    absolute = (Path.cwd() / OUTPUT_ROOT).resolve()
    job_root = Path.cwd().resolve()
    if job_root not in absolute.parents or absolute.exists():
        fail("output root is invalid or already exists")
    absolute.mkdir(parents=True, mode=0o700)
    for child in ("rgba", "mask", "depth"):
        (absolute / child).mkdir(mode=0o700)
    return absolute


def aggregate_files(directory: Path, expected_count: int) -> tuple[int, str]:
    files = sorted(
        path
        for path in directory.iterdir()
        if path.is_file() and not path.is_symlink()
    )
    if len(files) != expected_count:
        fail("render output frame count is invalid")
    aggregate = hashlib.sha256()
    total_bytes = 0
    for index, path in enumerate(files):
        content = path.read_bytes()
        total_bytes += len(content)
        aggregate.update(str(index).encode("ascii"))
        aggregate.update(hashlib.sha256(content).digest())
        os.chmod(path, 0o600)
    return total_bytes, aggregate.hexdigest()


def render(payload: dict[str, Any]) -> dict[str, Any]:
    output = payload["output"]
    output_root = ensure_private_output_root()
    scene = reset_scene()
    width = int(output["widthPixels"])
    height = int(output["heightPixels"])
    aspect = width / height
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.fps = int(output["fps"])
    scene.frame_start = int(output["startFrame"])
    scene.frame_end = int(output["endFrameExclusive"]) - 1
    scene.frame_step = int(output["frameStep"])
    scene.render.filepath = str((output_root / "rgba" / "frame_").resolve())
    create_camera(scene, aspect)
    material = create_material(payload)
    armature, _pose_bones = create_armature(payload, aspect)
    create_mesh(payload, armature, material, aspect)
    create_ik(payload, armature)
    configure_compositor(scene, output_root)

    compile_finished = time.monotonic()
    bpy.ops.render.render(animation=True, write_still=True)
    render_finished = time.monotonic()
    expected_count = len(
        range(scene.frame_start, scene.frame_end + 1, scene.frame_step)
    )
    rgba_bytes, rgba_digest = aggregate_files(output_root / "rgba", expected_count)
    mask_bytes, mask_digest = aggregate_files(output_root / "mask", expected_count)
    depth_bytes, depth_digest = aggregate_files(output_root / "depth", expected_count)
    return {
        "resultVersion": "living-frame-blender-fixed-adapter-result-v1",
        "componentId": payload["componentId"],
        "candidateRequestDigestSha256": payload["candidateRequestDigestSha256"],
        "riggingPlanDigestSha256": payload["riggingPlanDigestSha256"],
        "actionPlanDigestSha256": payload["actionPlanDigestSha256"],
        "payloadDigestSha256": payload["payloadDigestBindingSha256"],
        "frameCount": expected_count,
        "rgbaBytes": rgba_bytes,
        "rgbaAggregateDigestSha256": rgba_digest,
        "maskBytes": mask_bytes,
        "maskAggregateDigestSha256": mask_digest,
        "depthBytes": depth_bytes,
        "depthAggregateDigestSha256": depth_digest,
        "rigCompileDurationMs": round((compile_finished - STARTED_AT) * 1000),
        "renderDurationMs": round((render_finished - compile_finished) * 1000),
        "transparentRgbaProduced": True,
        "maskPassProduced": True,
        "depthPassProduced": True,
        "remotionOwnsFinalCanvas": True,
        "runtimeDispatchAuthority": False,
        "assetPersistenceAuthority": False,
        "qaApprovalAuthority": False,
        "billingAuthority": False,
        "publicDeliveryAuthority": False,
        "productionAuthority": False,
    }


def write_result(result: dict[str, Any]) -> None:
    result_path = (Path.cwd() / RESULT_FILE).resolve()
    job_root = Path.cwd().resolve()
    if job_root not in result_path.parents or result_path.exists():
        fail("result path is invalid or already exists")
    encoded = json.dumps(result, sort_keys=True, separators=(",", ":")).encode("utf-8")
    descriptor = os.open(
        result_path,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0),
        0o600,
    )
    try:
        os.write(descriptor, encoded)
        os.fsync(descriptor)
    finally:
        os.close(descriptor)
    print(encoded.decode("utf-8"), flush=True)


STARTED_AT = time.monotonic()


try:
    request = read_request()
    write_result(render(request))
except AdapterFailure as error:
    print(
        json.dumps(
            {
                "resultVersion": "living-frame-blender-fixed-adapter-failure-v1",
                "errorCode": "FIXED_ADAPTER_VALIDATION_FAILED",
                "message": str(error),
            },
            sort_keys=True,
            separators=(",", ":"),
        ),
        file=sys.stderr,
        flush=True,
    )
    raise SystemExit(2) from error
except Exception:
    print(
        '{"errorCode":"FIXED_ADAPTER_INTERNAL_FAILED",'
        '"message":"The fixed Blender adapter failed."}',
        file=sys.stderr,
        flush=True,
    )
    raise SystemExit(3)
