#!/bin/sh
set -eu

if [ "$#" -ne 0 ]; then
  echo "Living Frame hardened runtime installer accepts no arguments." >&2
  exit 64
fi

if [ "$(id -u)" != "0" ] || [ "$(id -g)" != "0" ]; then
  echo "Living Frame hardened runtime installer requires build-root." >&2
  exit 65
fi

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PATH
export PIP_DISABLE_PIP_VERSION_CHECK=1
export PIP_NO_INDEX=1
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1
export PYTHONDONTWRITEBYTECODE=1
export PYTHONUNBUFFERED=1

CORE_ROOT=/mnt/reeditpro-hardened-core
REMEDIATION_ROOT=/mnt/reeditpro-hardened-remediation
TRANSFORMERS_ROOT=/mnt/reeditpro-hardened-transformers
CONTRACT_ROOT=/opt/reeditpro/gpu-operations/comfyui/hardening

require_read_only_mount() {
  mount_path="$1"
  grep -Eq " ${mount_path} ro(,| )" /proc/self/mountinfo
}

require_exact_wheel_count() {
  wheel_root="$1"
  expected_count="$2"
  actual_count="$(
    find "${wheel_root}" \
      -mindepth 1 \
      -maxdepth 1 \
      -type f \
      -name '*.whl' \
      | wc -l
  )"
  if [ "${actual_count}" != "${expected_count}" ]; then
    echo "Living Frame hardened wheel set is not exact." >&2
    exit 66
  fi
}

require_read_only_mount "${CORE_ROOT}"
require_read_only_mount "${REMEDIATION_ROOT}"
require_read_only_mount "${TRANSFORMERS_ROOT}"

require_exact_wheel_count "${CORE_ROOT}" 4
require_exact_wheel_count "${REMEDIATION_ROOT}" 2
require_exact_wheel_count "${TRANSFORMERS_ROOT}" 27

(
  cd "${CORE_ROOT}"
  sha256sum \
    --check \
    --strict \
    "${CONTRACT_ROOT}/hardened-core.sha256"
)
(
  cd "${REMEDIATION_ROOT}"
  sha256sum \
    --check \
    --strict \
    "${CONTRACT_ROOT}/hardened-remediation.sha256"
)
(
  cd "${TRANSFORMERS_ROOT}"
  sha256sum \
    --check \
    --strict \
    "${CONTRACT_ROOT}/hardened-transformers-closure.sha256"
)

/usr/bin/python3 -m pip install \
  --no-index \
  --no-deps \
  --no-cache-dir \
  --force-reinstall \
  "${CORE_ROOT}"/*.whl \
  "${REMEDIATION_ROOT}"/*.whl \
  "${TRANSFORMERS_ROOT}"/*.whl

/usr/bin/python3 -m pip uninstall --yes wheel

apt-get purge \
  --yes \
  --no-download \
  python3-pip \
  python3-setuptools \
  python3-wheel
rm -rf /var/lib/apt/lists/*

for package_name in python3-pip python3-setuptools python3-wheel; do
  package_status="$(
    dpkg-query \
      -W \
      -f='${db:Status-Status}' \
      "${package_name}" \
      2>/dev/null \
      || true
  )"
  if [ "${package_status}" = "installed" ]; then
    echo "Obsolete Ubuntu Python build package remains installed." >&2
    exit 67
  fi
done

/usr/bin/python3 -m pip check
/opt/reeditpro/gpu-operations/comfyui/verify-installed-layout.sh
