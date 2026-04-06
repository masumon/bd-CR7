from __future__ import annotations

import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def _required_env(name: str) -> str:
    value = (os.getenv(name) or "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def main() -> int:
    api_base = (os.getenv("GOVERNANCE_REFRESH_API_URL") or "https://bd-cr7-api.onrender.com").rstrip("/")
    shared_secret = (os.getenv("GOVERNANCE_REFRESH_SECRET") or "").strip()
    token = (os.getenv("GOVERNANCE_REFRESH_BEARER_TOKEN") or "").strip()

    if not shared_secret and not token:
        raise RuntimeError("Missing auth configuration: set GOVERNANCE_REFRESH_SECRET or GOVERNANCE_REFRESH_BEARER_TOKEN")

    if shared_secret:
        url = f"{api_base}/api/ai-intelligence/suggestions/refresh/internal"
        auth_headers = {"x-governance-refresh-secret": shared_secret}
    else:
        url = f"{api_base}/api/ai-intelligence/suggestions/refresh"
        auth_headers = {"Authorization": f"Bearer {token}"}

    req = Request(
        url=url,
        data=b"{}",
        method="POST",
        headers={
            **auth_headers,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    try:
        with urlopen(req, timeout=30) as response:
            body = response.read().decode("utf-8", errors="replace")
            print(f"status={response.status} url={url}")
            print(body)
            return 0
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"status={exc.code} url={url}")
        print(body)
        return 1
    except URLError as exc:
        print(f"url_error={exc.reason} url={url}")
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"unexpected_error={exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
