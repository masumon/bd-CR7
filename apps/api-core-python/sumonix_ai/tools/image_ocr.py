from __future__ import annotations

import re
from pathlib import Path
from typing import Any


def extract_structured_fields(raw_text: str) -> dict[str, Any]:
	amount_match = re.search(r"(?:amount|total)\s*[:\-]?\s*([0-9]+(?:\.[0-9]{1,2})?)", raw_text, re.IGNORECASE)
	invoice_match = re.search(r"(?:invoice|voucher|bill)\s*(?:no|#)?\s*[:\-]?\s*([A-Za-z0-9\-_/]+)", raw_text, re.IGNORECASE)
	date_match = re.search(r"(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})", raw_text)

	return {
		"amount": float(amount_match.group(1)) if amount_match else None,
		"document_no": invoice_match.group(1) if invoice_match else None,
		"document_date": date_match.group(1) if date_match else None,
		"raw_text": raw_text,
	}


def ocr_image_to_structured(image_path: str) -> dict[str, Any]:
	path = Path(image_path)
	if not path.exists():
		raise FileNotFoundError(f"image not found: {image_path}")

	raw_text = ""
	try:
		import pytesseract  # type: ignore
		from PIL import Image  # type: ignore

		raw_text = pytesseract.image_to_string(Image.open(path))
	except Exception:
		raw_text = ""

	return extract_structured_fields(raw_text)
