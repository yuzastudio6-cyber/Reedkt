#!/bin/sh
set -eu

if [ "$#" -ne 0 ]; then
  echo "Living Frame ComfyUI layout verifier does not accept arguments." >&2
  exit 64
fi

PATH=/usr/sbin:/usr/bin:/sbin:/bin
export PATH
export PYTHONDONTWRITEBYTECODE=1
export PYTHONUNBUFFERED=1
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1

TARGET_ROOT=/opt/reeditpro/gpu-operations/comfyui
SOURCE_ROOT=/opt/reeditpro/gpu-operations/comfyui/source
CUSTOM_NODE_ROOT=/opt/reeditpro/gpu-operations/comfyui/custom_nodes
RUNTIME_ROOT=/opt/reeditpro/gpu-operations/comfyui/runtime
PRIVATE_INPUT_ROOT=/mnt/reeditpro/private-input
MODEL_ARTIFACT_ROOT=/mnt/reeditpro/model-artifacts

fail() {
  echo "Living Frame ComfyUI installed layout is invalid." >&2
  exit "$1"
}

require_directory() {
  if [ ! -d "$1" ] || [ -L "$1" ]; then
    fail 65
  fi
}

require_regular_file() {
  if [ ! -f "$1" ] || [ -L "$1" ]; then
    fail 66
  fi
}

require_empty_directory() {
  require_directory "$1"
  if find -P "$1" -mindepth 1 -print -quit | grep -q .; then
    fail 67
  fi
}

require_directory "${TARGET_ROOT}"
require_directory "${SOURCE_ROOT}"
require_directory "${CUSTOM_NODE_ROOT}"
require_directory "${RUNTIME_ROOT}"
require_directory "${TARGET_ROOT}/venv"
require_directory "${PRIVATE_INPUT_ROOT}"

require_regular_file "${SOURCE_ROOT}/main.py"
require_regular_file \
  "${CUSTOM_NODE_ROOT}/ComfyUI_IPAdapter_plus/__init__.py"
require_regular_file \
  "${CUSTOM_NODE_ROOT}/comfyui_controlnet_aux/__init__.py"
require_regular_file "${TARGET_ROOT}/requirements.lock.txt"
require_regular_file "${TARGET_ROOT}/source-provenance.lock"
require_regular_file "${TARGET_ROOT}/extra_model_paths.yaml"
require_regular_file "${TARGET_ROOT}/verify-installed-layout.sh"
if [ ! -x "${TARGET_ROOT}/venv/bin/python" ]; then
  fail 66
fi

actual_custom_nodes="$(
  find -P "${CUSTOM_NODE_ROOT}" -mindepth 1 -maxdepth 1 \
    -type d -printf '%f\n' | LC_ALL=C sort
)"
expected_custom_nodes="$(
  printf '%s\n' ComfyUI_IPAdapter_plus comfyui_controlnet_aux \
    | LC_ALL=C sort
)"
custom_node_entry_count="$(
  find -P "${CUSTOM_NODE_ROOT}" -mindepth 1 -maxdepth 1 \
    -print | wc -l | tr -d ' '
)"
if [ "${actual_custom_nodes}" != "${expected_custom_nodes}" ] \
  || [ "${custom_node_entry_count}" != "2" ]; then
  fail 68
fi

actual_runtime_directories="$(
  find -P "${RUNTIME_ROOT}" -mindepth 1 -maxdepth 1 \
    -type d -printf '%f\n' | LC_ALL=C sort
)"
expected_runtime_directories="$(
  printf '%s\n' custom_nodes input models output temp user \
    | LC_ALL=C sort
)"
runtime_entry_count="$(
  find -P "${RUNTIME_ROOT}" -mindepth 1 -maxdepth 1 \
    -print | wc -l | tr -d ' '
)"
if [ "${actual_runtime_directories}" != "${expected_runtime_directories}" ] \
  || [ "${runtime_entry_count}" != "6" ]; then
  fail 69
fi

require_empty_directory "${RUNTIME_ROOT}/custom_nodes"
require_empty_directory "${RUNTIME_ROOT}/input"
require_empty_directory "${RUNTIME_ROOT}/models"
require_empty_directory "${RUNTIME_ROOT}/output"
require_empty_directory "${RUNTIME_ROOT}/temp"
require_empty_directory "${RUNTIME_ROOT}/user"
require_empty_directory "${PRIVATE_INPUT_ROOT}"

if find -P "${SOURCE_ROOT}" "${CUSTOM_NODE_ROOT}" \
  -type d -perm /022 -print -quit | grep -q .; then
  fail 70
fi
if find -P "${SOURCE_ROOT}" "${CUSTOM_NODE_ROOT}" \
  -type f -perm /022 -print -quit | grep -q .; then
  fail 71
fi

printf '%s  %s\n' \
  "6dfa8623619ee854cb220ce3be538533b91b4b3703a3e8c79639d25e8909294e" \
  "${TARGET_ROOT}/requirements.lock.txt" \
  | sha256sum --check --strict --status
printf '%s  %s\n' \
  "c3088d74dd5ddef884c373f3da8544de69cfa81e386f12a38c3fb5123f8c8040" \
  "${TARGET_ROOT}/source-provenance.lock" \
  | sha256sum --check --strict --status
printf '%s  %s\n' \
  "4fa61cadb61d595ed32ffac4f8fdcaa0d665fd8e5011de308a69ae4075391b60" \
  "${TARGET_ROOT}/extra_model_paths.yaml" \
  | sha256sum --check --strict --status

"${TARGET_ROOT}/venv/bin/python" -I -B -c \
  'import sys; assert sys.version_info[:3] == (3, 10, 12)'
"${TARGET_ROOT}/venv/bin/python" -I -B -c \
  'import importlib.metadata as m; assert m.version("aiohttp") == "3.14.3"; assert m.version("comfyui_frontend_package") == "1.47.10"; assert m.version("torchsde") == "0.2.6"'

if [ -e "${MODEL_ARTIFACT_ROOT}" ] \
  && find -P "${MODEL_ARTIFACT_ROOT}" \
    -type f -print -quit | grep -q .; then
  fail 72
fi

printf '%s\n' \
  '{"status":"passed","layout":"fixed_offline_comfyui_package","modelWeightsBakedIntoImage":false,"runtimeDownloadsAllowed":false,"productionQualified":false}'
