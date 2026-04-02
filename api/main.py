import sys
import importlib.util
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
API_CORE_PATH = PROJECT_ROOT / "apps" / "api-core-python"

if str(API_CORE_PATH) not in sys.path:
    sys.path.insert(0, str(API_CORE_PATH))

spec = importlib.util.spec_from_file_location("bdcr7_api_main", API_CORE_PATH / "main.py")
if spec is None or spec.loader is None:
    raise RuntimeError("Failed to load FastAPI main module")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
fastapi_app = module.app

app = fastapi_app
