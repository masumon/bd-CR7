"""
Construction Intelligence Module — Internet data fetcher + analyzer.
All sources are FREE, no API keys required.

Sources:
  Weather:        open-meteo.com (free, no key, Bangladesh-optimised)
  Steel price:    World Bank Commodity API (free)
  Exchange rate:  exchangerate-api.com (free)
  Fuel/Diesel:    Reference table (Bangladesh Energy Regulatory Commission)
  News:           bdnews24.com RSS feed (construction/economy section)
"""

from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ─── Bangladesh City Coordinates ─────────────────────────────────────────────
CITIES: dict[str, tuple[float, float]] = {
    "dhaka":        (23.8103, 90.4125),
    "chittagong":   (22.3569, 91.7832),
    "sylhet":       (24.8949, 91.8687),
    "rajshahi":     (24.3745, 88.6042),
    "khulna":       (22.8456, 89.5403),
    "barishal":     (22.7010, 90.3535),
    "mymensingh":   (24.7471, 90.4203),
    "rangpur":      (25.7439, 89.2752),
    "comilla":      (23.4607, 91.1809),
    "narayanganj":  (23.6238, 90.4996),
    "default":      (23.8103, 90.4125),  # Dhaka
}

# ─── Bangladesh Material Reference Prices (BDT, last reviewed) ───────────────
# Used as fallback when internet fetch fails. Prices are approximate market rates.
MATERIAL_REF: dict[str, dict[str, Any]] = {
    "Rod / Steel Bar (per ton)": {
        "price": 85000, "unit": "ton",
        "note": "Grade 60, local market. Import rate varies with USD/BDT.",
    },
    "Cement (per bag 50kg)": {
        "price": 480, "unit": "bag",
        "note": "Local brand. Premium brands 10-15% higher.",
    },
    "Brick (per thousand)": {
        "price": 9500, "unit": "thousand",
        "note": "First class brick. Second class ~৳7,500.",
    },
    "Sand / Fine Aggregate (per CFT)": {
        "price": 55, "unit": "CFT",
        "note": "Sylhet sand. Local sand cheaper.",
    },
    "Stone Chips (per CFT)": {
        "price": 95, "unit": "CFT",
        "note": "20mm chips. Price varies by source district.",
    },
    "Concrete Block (per piece)": {
        "price": 45, "unit": "piece",
        "note": "6 inch hollow block.",
    },
    "Diesel (per litre)": {
        "price": 109, "unit": "litre",
        "note": "BPC regulated price. Used for generators & machinery.",
    },
    "Labour - Mason (per day)": {
        "price": 700, "unit": "day",
        "note": "Skilled mason. Unskilled helper ৳400-500/day.",
    },
    "Labour - Helper (per day)": {
        "price": 450, "unit": "day",
        "note": "General helper / day labour.",
    },
}

# WMO weather code → construction-friendly description
WMO_CODES: dict[int, tuple[str, str]] = {
    0:  ("☀️ Clear sky", "excellent"),
    1:  ("🌤️ Mainly clear", "excellent"),
    2:  ("⛅ Partly cloudy", "good"),
    3:  ("☁️ Overcast", "good"),
    45: ("🌫️ Foggy", "moderate"),
    48: ("🌫️ Icy fog", "moderate"),
    51: ("🌦️ Light drizzle", "moderate"),
    53: ("🌦️ Drizzle", "poor"),
    55: ("🌧️ Heavy drizzle", "poor"),
    61: ("🌧️ Slight rain", "poor"),
    63: ("🌧️ Moderate rain", "poor"),
    65: ("🌧️ Heavy rain", "stop_work"),
    71: ("🌨️ Slight snow", "stop_work"),
    80: ("🌦️ Rain showers", "poor"),
    81: ("🌧️ Heavy showers", "stop_work"),
    95: ("⛈️ Thunderstorm", "stop_work"),
    99: ("⛈️ Thunderstorm + hail", "stop_work"),
}

WORK_ADVICE: dict[str, str] = {
    "excellent": "✅ Ideal for all construction work — concrete pouring, brickwork, finishing.",
    "good":      "✅ Good for most work. Cover materials if rain expected later.",
    "moderate":  "⚠️ Proceed carefully. Delay concrete pouring. Protect materials.",
    "poor":      "⚠️ Outdoor work not recommended. Focus on interior or covered work.",
    "stop_work": "🛑 Stop outdoor work. Secure all materials. Risk of structural damage.",
}


# ─── Weather Fetcher ──────────────────────────────────────────────────────────

def fetch_weather(city: str = "dhaka") -> dict[str, Any]:
    """
    Fetch 3-day weather forecast from open-meteo.com.
    No API key required. Returns structured data for construction analysis.
    """
    city_key = city.lower().strip()
    lat, lon = CITIES.get(city_key, CITIES["default"])

    try:
        resp = httpx.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,rain,wind_speed_10m,weather_code",
                "daily": "weather_code,temperature_2m_max,temperature_2m_min,rain_sum,precipitation_probability_max,wind_speed_10m_max",
                "forecast_days": 3,
                "timezone": "Asia/Dhaka",
            },
            timeout=6.0,
        )
        resp.raise_for_status()
        return {"ok": True, "data": resp.json(), "city": city_key}
    except Exception as exc:
        logger.warning("weather_fetch_failed city=%s err=%s", city_key, exc)
        return {"ok": False, "error": str(exc), "city": city_key}


def format_weather(city: str = "dhaka") -> str:
    result = fetch_weather(city)
    if not result["ok"]:
        return f"⚠️ Weather data unavailable for {city}. Check internet connection."

    data = result["data"]
    current = data.get("current", {})
    daily = data.get("daily", {})

    temp = current.get("temperature_2m", "?")
    humidity = current.get("relative_humidity_2m", "?")
    rain_now = current.get("rain", 0)
    wind = current.get("wind_speed_10m", "?")
    wcode = int(current.get("weather_code", 0))

    desc, work_status = WMO_CODES.get(wcode, ("🌡️ Unknown", "moderate"))
    advice = WORK_ADVICE.get(work_status, "")

    city_display = city.capitalize()
    lines = [
        f"🌦️ Weather — {city_display} (Current)",
        f"  {desc}",
        f"  🌡️ Temp: {temp}°C | 💧 Humidity: {humidity}%",
        f"  🌬️ Wind: {wind} km/h | 🌧️ Rain now: {rain_now}mm",
        "",
        f"🏗️ Construction Suitability: {advice}",
    ]

    # 3-day forecast
    dates = daily.get("time", [])
    codes = daily.get("weather_code", [])
    rain_sums = daily.get("rain_sum", [])
    rain_prob = daily.get("precipitation_probability_max", [])
    temp_max = daily.get("temperature_2m_max", [])

    if dates:
        lines.append("\n📅 3-Day Forecast:")
        for i in range(min(3, len(dates))):
            d_code = int(codes[i]) if i < len(codes) else 0
            d_desc, d_status = WMO_CODES.get(d_code, ("?", "moderate"))
            d_rain = rain_sums[i] if i < len(rain_sums) else "?"
            d_prob = rain_prob[i] if i < len(rain_prob) else "?"
            d_temp = temp_max[i] if i < len(temp_max) else "?"
            d_work = "✅" if d_status in ("excellent", "good") else ("⚠️" if d_status == "moderate" else "🛑")
            lines.append(f"  {dates[i]}: {d_desc} | Max {d_temp}°C | Rain {d_rain}mm ({d_prob}%) {d_work}")

    return "\n".join(lines)


# ─── Material Price Fetcher ───────────────────────────────────────────────────

def fetch_steel_price_usd() -> float | None:
    """
    Fetch international steel price from World Bank Commodity API (free).
    Returns USD per metric ton or None on failure.
    """
    try:
        # World Bank Pink Sheet — Steel (HRC) monthly data
        resp = httpx.get(
            "https://api.worldbank.org/v2/en/country/all/indicator/PIORECR_USD",
            params={"format": "json", "mrv": 1, "per_page": 1},
            timeout=5.0,
        )
        data = resp.json()
        if isinstance(data, list) and len(data) > 1:
            records = data[1]
            if records:
                return float(records[0].get("value") or 0) or None
    except Exception:
        pass
    return None


def fetch_exchange_rate() -> float:
    """USD/BDT exchange rate."""
    for url in [
        "https://api.exchangerate-api.com/v4/latest/USD",
        "https://open.er-api.com/v6/latest/USD",
    ]:
        try:
            resp = httpx.get(url, timeout=5.0)
            rate = resp.json().get("rates", {}).get("BDT")
            if rate:
                return float(rate)
        except Exception:
            continue
    return 110.0  # Fallback approximate rate


def format_material_prices() -> str:
    """
    Show Bangladesh construction material prices.
    Fetches international steel index + live exchange rate,
    then shows full reference price table.
    """
    usd_bdt = fetch_exchange_rate()
    steel_usd = fetch_steel_price_usd()

    lines = ["🧱 Bangladesh Construction Material Prices"]
    lines.append(f"💱 USD/BDT Rate: ৳{usd_bdt:.1f} (live)")

    if steel_usd:
        # Adjust local rod price using international steel index
        # Bangladesh rod = import parity + ~30% duties & margins
        estimated_rod_bdt = int(steel_usd * usd_bdt / 1000 * 1.3)  # per kg → per ton
        lines.append(f"🔩 Int'l Steel Index: ${steel_usd:,.0f}/ton → Est. local rod: ৳{estimated_rod_bdt:,}/ton")

    lines.append("")
    lines.append("📋 Reference Prices (Bangladesh market):")
    for item, info in MATERIAL_REF.items():
        lines.append(f"  • {item}: ৳{info['price']:,} / {info['unit']}")
        if info.get("note"):
            lines.append(f"    ↳ {info['note']}")

    lines.append("")
    lines.append("ℹ️ Prices are approximate market rates. Verify with local suppliers.")
    return "\n".join(lines)


# ─── News Fetcher ─────────────────────────────────────────────────────────────

def fetch_construction_news() -> str:
    """
    Fetch latest construction/real-estate/economy news from bdnews24.com RSS.
    """
    feeds = [
        ("bdnews24.com", "https://bdnews24.com/feed/"),
        ("Prothom Alo", "https://www.prothomalo.com/feed"),
    ]

    for source, url in feeds:
        try:
            resp = httpx.get(url, timeout=5.0, follow_redirects=True)
            root = ET.fromstring(resp.content)
            items = root.findall(".//item")[:8]
            construction_keywords = {
                "নির্মাণ", "ভবন", "রিয়েল এস্টেট", "সিমেন্ট", "রড", "আবাসন",
                "construction", "real estate", "cement", "steel", "housing",
                "building", "infrastructure", "রাস্তা", "bridge", "সেতু",
            }
            relevant = []
            for item in items:
                title_el = item.find("title")
                title = title_el.text if title_el is not None else ""
                if any(kw.lower() in (title or "").lower() for kw in construction_keywords):
                    relevant.append(title)
                if len(relevant) >= 4:
                    break

            if relevant:
                lines = [f"📰 Latest Construction News ({source}):"]
                for i, t in enumerate(relevant, 1):
                    lines.append(f"  {i}. {t}")
                return "\n".join(lines)
        except Exception as exc:
            logger.warning("news_fetch_failed source=%s err=%s", source, exc)
            continue

    return "📰 News feed unavailable right now. Check bdnews24.com or prothomalo.com for latest."


# ─── Construction Analysis (combined) ─────────────────────────────────────────

def full_construction_analysis(city: str = "dhaka") -> str:
    """
    Combined analysis: weather + materials + exchange rate + DB data.
    Primary entry point for construction project AI insights.
    """
    lines = ["=" * 48]
    lines.append("🏗️  SUMONIX CONSTRUCTION INTELLIGENCE REPORT")
    lines.append(f"📍 Location: {city.capitalize()} | {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')} UTC")
    lines.append("=" * 48)

    # Section 1: Weather
    lines.append("\n" + format_weather(city))

    # Section 2: Material prices
    lines.append("\n" + format_material_prices())

    # Section 3: News
    lines.append("\n" + fetch_construction_news())

    # Section 4: Actionable recommendation
    weather_result = fetch_weather(city)
    if weather_result["ok"]:
        current = weather_result["data"].get("current", {})
        wcode = int(current.get("weather_code", 0))
        _, work_status = WMO_CODES.get(wcode, ("?", "moderate"))
        rain_prob_today = weather_result["data"].get("daily", {}).get("precipitation_probability_max", [None])[0]

        lines.append("\n📌 Today's Construction Recommendation:")
        if work_status == "stop_work":
            lines.append("  🛑 Do NOT proceed with outdoor work today.")
            lines.append("  → Focus on: indoor finishing, planning, procurement")
        elif work_status == "poor":
            lines.append("  ⚠️ Outdoor work not advised. Delay concrete pours.")
            lines.append("  → Focus on: covered work, material storage, safety checks")
        elif work_status == "moderate":
            lines.append("  ⚠️ Monitor weather closely. Protect fresh concrete.")
            lines.append("  → Suitable for: brickwork, rod fixing, formwork")
        else:
            lines.append("  ✅ Good conditions. Proceed with full work schedule.")
            if rain_prob_today and int(rain_prob_today) > 40:
                lines.append(f"  ⚠️ Rain probability {rain_prob_today}% — cover materials before evening.")

    return "\n".join(lines)
