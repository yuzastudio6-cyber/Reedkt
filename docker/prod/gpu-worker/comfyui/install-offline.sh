#!/bin/sh
set -eu

if [ "$#" -ne 0 ]; then
  echo "Living Frame ComfyUI installer does not accept arguments." >&2
  exit 64
fi

PATH=/usr/sbin:/usr/bin:/sbin:/bin
export PATH
export PIP_DISABLE_PIP_VERSION_CHECK=1
export PIP_NO_INDEX=1
export PYTHONDONTWRITEBYTECODE=1
export PYTHONUNBUFFERED=1
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1

PACKAGE_INPUT_ROOT=/opt/reeditpro/build-inputs/comfyui/package
WHEELHOUSE_ROOT=/opt/reeditpro/build-inputs/comfyui/wheelhouse
SOURCE_ARCHIVE_ROOT=/opt/reeditpro/build-inputs/comfyui/sources
TARGET_ROOT=/opt/reeditpro/gpu-operations/comfyui
SOURCE_ROOT=/opt/reeditpro/gpu-operations/comfyui/source
CUSTOM_NODE_ROOT=/opt/reeditpro/gpu-operations/comfyui/custom_nodes
RUNTIME_ROOT=/opt/reeditpro/gpu-operations/comfyui/runtime
PRIVATE_INPUT_ROOT=/mnt/reeditpro/private-input

COMFYUI_ARCHIVE="${SOURCE_ARCHIVE_ROOT}/comfyui-host.tar"
IPADAPTER_ARCHIVE="${SOURCE_ARCHIVE_ROOT}/generic-ipadapter-extension.tar"
CONTROLNET_AUX_ARCHIVE="${SOURCE_ARCHIVE_ROOT}/controlnet-aux-extension.tar"

require_regular_file() {
  if [ ! -f "$1" ] || [ -L "$1" ]; then
    echo "Required fixed build input is missing or unsafe." >&2
    exit 65
  fi
}

verify_archive() {
  archive_path="$1"
  expected_bytes="$2"
  expected_sha256="$3"
  require_regular_file "${archive_path}"
  actual_bytes="$(stat -c '%s' "${archive_path}")"
  if [ "${actual_bytes}" != "${expected_bytes}" ]; then
    echo "Source archive byte length does not match." >&2
    exit 66
  fi
  printf '%s  %s\n' "${expected_sha256}" "${archive_path}" \
    | sha256sum --check --strict --status
}

require_regular_file "${PACKAGE_INPUT_ROOT}/requirements.lock.txt"
require_regular_file "${PACKAGE_INPUT_ROOT}/source-provenance.lock"
require_regular_file "${PACKAGE_INPUT_ROOT}/extra_model_paths.yaml"

if [ -e "${TARGET_ROOT}" ]; then
  echo "Fixed ComfyUI target root must not already exist." >&2
  exit 67
fi

python3 -I -B -c \
  'import sys; assert sys.version_info[:3] == (3, 10, 12)'

wheel_entry_count="$(
  find -P "${WHEELHOUSE_ROOT}" -mindepth 1 -maxdepth 1 \
    -print | wc -l | tr -d ' '
)"
wheel_file_count="$(
  find -P "${WHEELHOUSE_ROOT}" -mindepth 1 -maxdepth 1 \
    -type f -name '*.whl' -print | wc -l | tr -d ' '
)"
wheel_total_bytes="$(
  find -P "${WHEELHOUSE_ROOT}" -mindepth 1 -maxdepth 1 \
    -type f -name '*.whl' -printf '%s\n' \
    | awk '{ total += $1 } END { printf "%.0f", total }'
)"
if [ "${wheel_entry_count}" != "35" ] \
  || [ "${wheel_file_count}" != "35" ] \
  || [ "${wheel_total_bytes}" != "486459097" ]; then
  echo "Offline wheelhouse closure does not match." >&2
  exit 68
fi

verify_archive \
  "${COMFYUI_ARCHIVE}" \
  "44175360" \
  "dfc771e822aeef3956a3295834a211b36a72e8dce1a7f2bf6b8327a311af9948"
verify_archive \
  "${IPADAPTER_ARCHIVE}" \
  "778240" \
  "8565104c6a20e2e092bc895a72b8dcf588c0165f0de0f4f01dc0f735d2af50ec"
verify_archive \
  "${CONTROLNET_AUX_ARCHIVE}" \
  "49551360" \
  "6ab94365c94e7c4a02be19d1ad5921c5ac490c0539bd1b38fc0d1516225d9b4e"

umask 022
mkdir -p \
  "${SOURCE_ROOT}" \
  "${CUSTOM_NODE_ROOT}/ComfyUI_IPAdapter_plus" \
  "${CUSTOM_NODE_ROOT}/comfyui_controlnet_aux" \
  "${RUNTIME_ROOT}/custom_nodes" \
  "${RUNTIME_ROOT}/input" \
  "${RUNTIME_ROOT}/models" \
  "${RUNTIME_ROOT}/output" \
  "${RUNTIME_ROOT}/temp" \
  "${RUNTIME_ROOT}/user" \
  "${PRIVATE_INPUT_ROOT}"

python3 -m venv --system-site-packages "${TARGET_ROOT}/venv"
"${TARGET_ROOT}/venv/bin/pip" install \
  --disable-pip-version-check \
  --no-cache-dir \
  --force-reinstall \
  --no-index \
  --no-deps \
  --require-hashes \
  --find-links "${WHEELHOUSE_ROOT}" \
  -r "${PACKAGE_INPUT_ROOT}/requirements.lock.txt"

tar --extract --file "${COMFYUI_ARCHIVE}" \
  --directory "${SOURCE_ROOT}" --no-same-owner --no-same-permissions
tar --extract --file "${IPADAPTER_ARCHIVE}" \
  --directory "${CUSTOM_NODE_ROOT}/ComfyUI_IPAdapter_plus" \
  --no-same-owner --no-same-permissions
tar --extract --file "${CONTROLNET_AUX_ARCHIVE}" \
  --directory "${CUSTOM_NODE_ROOT}/comfyui_controlnet_aux" \
  --no-same-owner --no-same-permissions

require_regular_file "${SOURCE_ROOT}/main.py"
require_regular_file \
  "${CUSTOM_NODE_ROOT}/ComfyUI_IPAdapter_plus/__init__.py"
require_regular_file \
  "${CUSTOM_NODE_ROOT}/comfyui_controlnet_aux/__init__.py"

cp "${PACKAGE_INPUT_ROOT}/requirements.lock.txt" \
  "${TARGET_ROOT}/requirements.lock.txt"
cp "${PACKAGE_INPUT_ROOT}/source-provenance.lock" \
  "${TARGET_ROOT}/source-provenance.lock"
cp "${PACKAGE_INPUT_ROOT}/extra_model_paths.yaml" \
  "${TARGET_ROOT}/extra_model_paths.yaml"

find "${SOURCE_ROOT}" "${CUSTOM_NODE_ROOT}" \
  -type d -exec chmod 0555 {} +
find "${SOURCE_ROOT}" "${CUSTOM_NODE_ROOT}" \
  -type f -exec chmod 0444 {} +
chmod 0444 \
  "${TARGET_ROOT}/requirements.lock.txt" \
  "${TARGET_ROOT}/source-provenance.lock" \
  "${TARGET_ROOT}/extra_model_paths.yaml"

"${TARGET_ROOT}/venv/bin/python" -I -B -c \
  'import importlib.metadata as m; assert m.version("aiohttp") == "3.14.3"; assert m.version("comfyui_frontend_package") == "1.47.10"; assert m.version("torchsde") == "0.2.6"'

echo "Living Frame ComfyUI offline package installed."
