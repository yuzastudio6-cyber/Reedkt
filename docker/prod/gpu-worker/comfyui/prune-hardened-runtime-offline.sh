#!/bin/sh
set -eu

if [ "$#" -ne 0 ]; then
  echo "Living Frame runtime pruner accepts no arguments." >&2
  exit 64
fi

if [ "$(id -u)" != "0" ] || [ "$(id -g)" != "0" ]; then
  echo "Living Frame runtime pruner requires build-root." >&2
  exit 65
fi

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PATH
export DEBIAN_FRONTEND=noninteractive
export PIP_DISABLE_PIP_VERSION_CHECK=1
export PIP_NO_INDEX=1
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1
export PYTHONDONTWRITEBYTECODE=1
export PYTHONUNBUFFERED=1

RUNTIME_ROOT=/opt/reeditpro/gpu-operations/comfyui
VENV_ROOT="${RUNTIME_ROOT}/venv"
VENV_SITE_PACKAGES="${VENV_ROOT}/lib/python3.10/site-packages"

"${VENV_ROOT}/bin/python" -m pip uninstall --yes pip setuptools

if find "${VENV_SITE_PACKAGES}" -mindepth 1 -maxdepth 1 \
  \( -name 'pip-*.dist-info' -o -name 'setuptools-*.dist-info' \) \
  -print -quit | grep -q .; then
  echo "Operation-local installer metadata remains after pruning." >&2
  exit 66
fi

for executable in pip pip3 pip3.10; do
  if [ -e "${VENV_ROOT}/bin/${executable}" ]; then
    echo "Operation-local installer executable remains after pruning." >&2
    exit 67
  fi
done

apt-get purge \
  --yes \
  --no-download \
  linux-libc-dev \
  nodejs \
  libnode72 \
  libnode-dev \
  npm \
  dirmngr \
  gnupg \
  gnupg-l10n \
  gnupg-utils \
  gnupg2 \
  gpg \
  gpg-agent \
  gpg-wks-client \
  gpg-wks-server \
  gpgconf \
  gpgsm \
  openssl \
  build-essential \
  gcc \
  g++ \
  make \
  python3-dev \
  git \
  ninja-build \
  pkg-config

dpkg --purge --force-depends apt gpgv

FORBIDDEN_PACKAGES='
apt
build-essential
dirmngr
g++
gcc
git
gnupg
gnupg-l10n
gnupg-utils
gnupg2
gpg
gpg-agent
gpg-wks-client
gpg-wks-server
gpgconf
gpgsm
gpgv
libnode-dev
libnode72
linux-libc-dev
make
ninja-build
nodejs
npm
openssl
pkg-config
python3-dev
'

for package_name in ${FORBIDDEN_PACKAGES}; do
  package_status="$(
    dpkg-query \
      -W \
      -f='${db:Status-Status}' \
      "${package_name}" \
      2>/dev/null \
      || true
  )"
  if [ "${package_status}" = "installed" ]; then
    echo "Build-only or network-enabling package remains installed." >&2
    exit 68
  fi
done

find /var/lib/apt/lists -depth -mindepth 1 -delete
find /var/cache/apt/archives -depth -mindepth 1 -delete

"${RUNTIME_ROOT}/verify-installed-layout.sh"

echo "Living Frame hardened runtime pruned."
