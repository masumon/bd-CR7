#!/usr/bin/env bash
set -euo pipefail

# When Vercel runs from apps/api, move to repo root for pnpm workspace install.
if [ -f "../../pnpm-lock.yaml" ]; then
  cd ../..
fi

corepack enable
corepack prepare pnpm@10.17.1 --activate
pnpm install --frozen-lockfile

# Vendor Python runtime deps into the API package directory so serverless runtime can import them.
if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN=python3
else
  PYTHON_BIN=python
fi
"$PYTHON_BIN" -m pip install --disable-pip-version-check -r apps/api/requirements.txt -t apps/api
