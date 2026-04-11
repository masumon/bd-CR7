import os
import sys
from pathlib import Path

from mangum import Mangum


def _bootstrap_python_path() -> None:
	root_dir = Path(__file__).resolve().parent.parent
	api_pkg_dir = root_dir / "apps" / "api"
	for candidate in (root_dir, api_pkg_dir):
		candidate_str = str(candidate)
		if candidate_str not in sys.path:
			sys.path.insert(0, candidate_str)


def _bootstrap_vercel_env() -> None:
	# Prevent full cold-start failure when Redis is not configured in Vercel.
	is_vercel_runtime = bool(os.getenv("VERCEL_ENV")) or os.getenv("VERCEL") == "1"
	if is_vercel_runtime and not os.getenv("REDIS_URL"):
		os.environ.setdefault("REQUIRE_REDIS_IN_PRODUCTION", "false")


_bootstrap_python_path()
_bootstrap_vercel_env()

from apps.api.main import app

# Vercel serverless function handler
handler = Mangum(app)