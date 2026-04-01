from decimal import Decimal


def detect_risk(transaction: dict) -> dict:
    amount = Decimal(str(transaction.get("amount", 0)))
    category = str(transaction.get("category", "")).lower()
    frequency_24h = int(transaction.get("frequency_24h", 0))

    score = 0
    reasons: list[str] = []

    if amount >= Decimal("250000"):
        score += 45
        reasons.append("very_high_amount")
    elif amount >= Decimal("100000"):
        score += 25
        reasons.append("high_amount")

    if frequency_24h >= 8:
        score += 30
        reasons.append("high_frequency")

    if category in {"misc", "emergency", "cash"} and amount > Decimal("50000"):
        score += 20
        reasons.append("sensitive_category_large_amount")

    risk_level = "low"
    if score >= 60:
        risk_level = "high"
    elif score >= 30:
        risk_level = "medium"

    return {"risk_score": score, "risk_level": risk_level, "reasons": reasons}
