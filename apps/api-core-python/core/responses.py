from typing import Any


def ok(data: Any) -> dict[str, Any]:
    return {"success": True, "data": data}


def err(message: str, data: Any = None) -> dict[str, Any]:
    return {"success": False, "data": data, "error": message}
