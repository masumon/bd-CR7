#!/usr/bin/env bash
set -euo pipefail

# When Vercel runs from apps/api-core-python, move to repo root for pnpm workspace install.
if [ -f "../../pnpm-lock.yaml" ]; then
  cd ../..
fi

corepack enable
corepack prepare pnpm@10.17.1 --activate
pnpm install --frozen-lockfile

# Vendor Python runtime deps into the API package directory so serverless runtime can import them.
python -m pip install --disable-pip-version-check -r apps/api-core-python/requirements.txt -t apps/api-core-python
