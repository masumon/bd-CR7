"""
SUMONIX AI Engine — No-LLM intelligent assistant.

Architecture:
  1. Language detection  (langdetect)
  2. Fuzzy intent match  (rapidfuzz)
  3. Role-based DB query  (Supabase, role-filtered)
  4. Prediction engine    (pure math — linear trend)
  5. Internet layer       (httpx — exchange rate, public APIs)
  6. Response formatter   (original language)
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ─── Multilingual Intent Map ─────────────────────────────────────────────────
# key → (canonical intent, list of trigger phrases in EN / BN / Banglish)
INTENT_PHRASES: dict[str, list[str]] = {
    "greeting": [
        "hello", "hi", "hey", "good morning", "good afternoon",
        "assalamualaikum", "salam", "namaskar",
        "হ্যালো", "সালাম", "হাই", "শুভ সকাল", "কেমন আছেন", "নমস্কার",
        "helllo", "helo", "hii", "sallam", "salaam",
    ],
    "help": [
        "help", "what can you do", "what do you know", "guide me",
        "module list", "features", "capabilities",
        "কি কি পারো", "কি কি করতে পারো", "সাহায্য", "কি কি আছে", "কিভাবে কাজ করো",
        "ki ki acho", "sahajjo", "help koro",
    ],
    "dashboard": [
        "dashboard", "summary", "overview", "total", "balance", "kpi",
        "how much", "current status", "today status", "quick summary",
        "ড্যাশবোর্ড", "সারসংক্ষেপ", "সার সংক্ষেপ", "মোট", "ব্যালেন্স", "তহবিল",
        "apnar status", "ki obostha", "abostha",
    ],
    "finance": [
        "finance", "expense", "fund", "money", "payment", "account", "cash",
        "approved expense", "pending expense", "how much spent",
        "ফাইন্যান্স", "ব্যয়", "খরচ", "ফান্ড", "টাকা", "পেমেন্ট", "হিসাব",
        "khoroch", "taka", "fund ache koto", "koto taka",
    ],
    "worker": [
        "worker", "workers", "employee", "attendance", "workforce", "labour",
        "labor", "who is present", "absent workers", "who came today",
        "শ্রমিক", "কর্মী", "উপস্থিতি", "হাজিরা", "কে আসছে", "কে আসেনি",
        "shromik", "hajira", "worker ache koto", "koto shromik",
    ],
    "material": [
        "material", "materials", "stock", "inventory", "low stock", "reorder",
        "cement", "rod", "sand", "brick", "supply",
        "মালামাল", "স্টক", "ইনভেন্টরি", "সিমেন্ট", "রড", "বালি", "ইট",
        "malamal", "stock koto", "koto maal ache",
    ],
    "project": [
        "project", "projects", "site", "construction", "progress", "phase",
        "deadline", "timeline", "how many projects", "project status",
        "প্রজেক্ট", "সাইট", "নির্মাণ", "অগ্রগতি", "ফেজ", "ডেডলাইন",
        "project er obostha", "koto project", "project ki obostha",
    ],
    "anomaly": [
        "anomaly", "anomalies", "risk", "suspicious", "unusual", "fraud",
        "weird", "strange transaction", "high risk",
        "ঝুঁকি", "অস্বাভাবিক", "সন্দেহজনক", "রিস্ক",
        "jhuki", "oshovabik", "risk ache ki", "suspicious transaction",
    ],
    "prediction": [
        "predict", "forecast", "future", "estimate", "next month",
        "will finish", "when complete", "expected cost", "budget forecast",
        "পূর্বাভাস", "ভবিষ্যৎ", "আনুমানিক", "কবে শেষ হবে", "পরের মাস কেমন যাবে",
        "purba vash", "estimation", "budget shesh hobe kobe",
    ],
    "contractor": [
        "contractor", "contractors", "vendor", "subcontractor", "agreement",
        "ঠিকাদার", "চুক্তি", "ভেন্ডর",
        "thikadar", "thika", "vendor list",
    ],
    "sales": [
        "sales", "pos", "sell", "revenue", "sold", "retail",
        "বিক্রয়", "বিক্রি", "রিটেইল",
        "bikroy", "bikri", "koto bikri hoyeche",
    ],
    "audit": [
        "audit", "log", "history", "who changed", "activity log",
        "অডিট", "ইতিহাস", "লগ", "কে পরিবর্তন করেছে",
        "log dekhao", "activity",
    ],
    "exchange_rate": [
        "exchange rate", "usd", "dollar", "bdt", "currency", "taka rate",
        "ডলার", "এক্সচেঞ্জ রেট", "কারেন্সি",
        "dollar rate", "usd to bdt", "1 dollar koto taka",
    ],
    "my_info": [
        "my expense", "my attendance", "my wage", "my salary", "my work",
        "আমার খরচ", "আমার হাজিরা", "আমার বেতন", "আমার কাজ",
        "amar khoroch", "amar hajira", "ami ki ki korchi",
    ],
}

# ─── Role → readable label ────────────────────────────────────────────────────
ROLE_LABELS: dict[str, str] = {
    "super_admin": "Super Admin",
    "admin": "Admin",
    "checker": "Checker",
    "maker": "Maker",
    "engineer": "Engineer",
    "supervisor": "Supervisor",
    "mason": "Mason",
    "worker": "Worker",
}

# ─── Roles that can see full data ─────────────────────────────────────────────
PRIVILEGED_ROLES = {"super_admin", "admin", "checker"}
PROJECT_ROLES = {"super_admin", "admin", "engineer", "supervisor"}
FINANCE_ROLES = {"super_admin", "admin", "checker", "maker"}


# ─── Language Detection ───────────────────────────────────────────────────────

def detect_language(text: str) -> str:
    """Return ISO 639-1 language code. Falls back to 'en'."""
    try:
        from langdetect import detect  # type: ignore
        return detect(text)
    except Exception:
        return "en"


def translate_to_english(text: str, source_lang: str) -> str:
    """Translate text to English if not already English. Returns original on failure."""
    if source_lang in ("en", "unknown"):
        return text
    try:
        from deep_translator import GoogleTranslator  # type: ignore
        translated = GoogleTranslator(source=source_lang, target="en").translate(text)
        return translated or text
    except Exception:
        return text


def translate_response(text: str, target_lang: str) -> str:
    """Translate response back to the user's language."""
    if target_lang in ("en", "unknown"):
        return text
    try:
        from deep_translator import GoogleTranslator  # type: ignore
        translated = GoogleTranslator(source="en", target=target_lang).translate(text)
        return translated or text
    except Exception:
        return text


# ─── Fuzzy Intent Classifier ─────────────────────────────────────────────────

def classify_intent(text: str) -> str:
    """
    Match user text to an intent using fuzzy string matching.
    Returns the best matching intent key, or 'general' if no match.
    """
    try:
        from rapidfuzz import fuzz, process as rfprocess  # type: ignore
    except ImportError:
        return _keyword_fallback(text)

    normalized = text.lower().strip()
    best_intent = "general"
    best_score = 0

    for intent, phrases in INTENT_PHRASES.items():
        # Partial ratio handles when the phrase is a substring of the message
        result = rfprocess.extractOne(
            normalized,
            phrases,
            scorer=fuzz.partial_ratio,
            score_cutoff=55,
        )
        if result and result[1] > best_score:
            best_score = result[1]
            best_intent = intent

    return best_intent


def _keyword_fallback(text: str) -> str:
    """Simple substring fallback when rapidfuzz is unavailable."""
    t = text.lower()
    for intent, phrases in INTENT_PHRASES.items():
        if any(p in t for p in phrases):
            return intent
    return "general"


# ─── DB Query Handlers (Role-Filtered) ────────────────────────────────────────

def _supa():
    from core.supabase import supabase_service
    return supabase_service


def _fmt(n: Any) -> str:
    try:
        return f"৳{float(n):,.0f}"
    except Exception:
        return "৳0"


def handle_dashboard(role: str, user_id: str) -> str:
    supa = _supa()
    if supa is None:
        return "Database not connected."

    # Balance — all roles see this
    accounts = supa.table("fund_accounts").select("balance").limit(100).execute()
    balance = sum(float(r["balance"]) for r in (accounts.data or []))

    # Expenses — filtered by role
    exp_q = supa.table("expenses").select("amount,status").limit(500)
    if role not in PRIVILEGED_ROLES:
        exp_q = exp_q.eq("maker_id", user_id)
    exps = exp_q.execute().data or []

    total_exp = sum(float(r["amount"]) for r in exps)
    pending = sum(1 for r in exps if r.get("status") == "pending")

    lines = [
        f"📊 Dashboard Summary [{ROLE_LABELS.get(role, role)}]",
        f"💰 Fund Balance: {_fmt(balance)}",
        f"💸 Total Expenses: {_fmt(total_exp)}",
        f"⏳ Pending Approvals: {pending}",
    ]

    if role in PROJECT_ROLES | PRIVILEGED_ROLES:
        projects = supa.table("projects").select("id", count="exact").limit(1).execute()
        lines.append(f"🏗️ Projects: {projects.count or 0}")

    if role in PRIVILEGED_ROLES | PROJECT_ROLES:
        workers = supa.table("workers").select("id", count="exact").eq("is_active", True).limit(1).execute()
        lines.append(f"👷 Active Workers: {workers.count or 0}")

    return "\n".join(lines)


def handle_finance(role: str, user_id: str) -> str:
    supa = _supa()
    if supa is None:
        return "Database not connected."

    q = supa.table("expenses").select("amount,status,description,created_at").order("created_at", desc=True).limit(10)
    if role not in PRIVILEGED_ROLES:
        q = q.eq("maker_id", user_id)
    rows = q.execute().data or []

    if not rows:
        return "No expense records found for your account."

    lines = [f"💸 Recent Expenses [{ROLE_LABELS.get(role, role)}]:"]
    for r in rows[:5]:
        lines.append(f"  • {_fmt(r['amount'])} — {r.get('description','—')} [{r.get('status','?')}]")

    approved = sum(float(r["amount"]) for r in rows if r.get("status") == "approved")
    pending = sum(float(r["amount"]) for r in rows if r.get("status") == "pending")
    lines.append(f"\n✅ Approved: {_fmt(approved)}")
    lines.append(f"⏳ Pending: {_fmt(pending)}")
    return "\n".join(lines)


def handle_worker(role: str, user_id: str) -> str:
    supa = _supa()
    if supa is None:
        return "Database not connected."

    if role in PRIVILEGED_ROLES | PROJECT_ROLES:
        # Show team-level data
        workers = supa.table("workers").select("name,daily_wage,is_active").limit(10).execute().data or []
        if not workers:
            return "No worker records found."
        lines = [f"👷 Workers [{ROLE_LABELS.get(role, role)}]:"]
        for w in workers[:8]:
            status = "Active" if w.get("is_active") else "Inactive"
            lines.append(f"  • {w.get('name','Unknown')} — {_fmt(w.get('daily_wage', 0))}/day [{status}]")

        try:
            logs = supa.table("worker_logs").select("attendance_status").limit(100).execute().data or []
            present = sum(1 for l in logs if str(l.get("attendance_status", "")).lower() == "present")
            absent = sum(1 for l in logs if str(l.get("attendance_status", "")).lower() == "absent")
            lines.append(f"\n📋 Recent Attendance: ✅ Present={present} | ❌ Absent={absent}")
        except Exception:
            pass
        return "\n".join(lines)

    # Worker sees own data only
    return (
        f"👤 Your role is [{ROLE_LABELS.get(role, role)}]. "
        "Contact your supervisor for attendance details."
    )


def handle_material(role: str) -> str:
    supa = _supa()
    if supa is None:
        return "Database not connected."

    if role not in (PRIVILEGED_ROLES | PROJECT_ROLES):
        return "You don't have access to material data."

    try:
        rows = supa.table("material_logs").select("item_name,quantity,low_stock_threshold").limit(100).execute().data or []
        if not rows:
            return "No material records found."
        low = [r for r in rows if r.get("low_stock_threshold") and float(r.get("quantity", 0)) <= float(r["low_stock_threshold"])]
        lines = [f"🧱 Materials [{ROLE_LABELS.get(role, role)}]:"]
        for r in rows[:6]:
            flag = " ⚠️ LOW" if r in low else ""
            lines.append(f"  • {r.get('item_name','?')}: {r.get('quantity','?')} units{flag}")
        if low:
            lines.append(f"\n⚠️ Low stock items: {', '.join(r.get('item_name','?') for r in low[:3])}")
        return "\n".join(lines)
    except Exception:
        return "Material data unavailable."


def handle_project(role: str) -> str:
    supa = _supa()
    if supa is None:
        return "Database not connected."

    if role not in (PRIVILEGED_ROLES | PROJECT_ROLES):
        return "You don't have access to project data."

    rows = supa.table("projects").select("name,status,end_date").limit(10).execute().data or []
    if not rows:
        return "No projects found."

    now = datetime.now(timezone.utc).date()
    lines = [f"🏗️ Projects [{ROLE_LABELS.get(role, role)}]:"]
    for r in rows[:6]:
        end = r.get("end_date")
        deadline_note = ""
        if end:
            try:
                d = datetime.fromisoformat(str(end)).date()
                days = (d - now).days
                if days < 0:
                    deadline_note = f" ❌ OVERDUE {abs(days)}d"
                elif days <= 7:
                    deadline_note = f" ⚠️ Due in {days}d"
                else:
                    deadline_note = f" ✅ {days}d left"
            except Exception:
                pass
        lines.append(f"  • {r.get('name','?')} [{r.get('status','?')}]{deadline_note}")
    return "\n".join(lines)


def handle_my_info(role: str, user_id: str) -> str:
    supa = _supa()
    if supa is None:
        return "Database not connected."

    lines = [f"👤 Your Information [{ROLE_LABELS.get(role, role)}]"]

    if role in ("worker", "mason"):
        try:
            logs = supa.table("worker_logs").select("work_date,attendance_status,hours_worked,daily_wage").eq("worker_id", user_id).order("work_date", desc=True).limit(7).execute().data or []
            if logs:
                lines.append("📋 Recent Attendance:")
                for l in logs[:5]:
                    lines.append(f"  • {l.get('work_date','?')} — {l.get('attendance_status','?')} | Wage: {_fmt(l.get('daily_wage', 0))}")
            else:
                lines.append("No attendance records found for your account.")
        except Exception:
            lines.append("Attendance data unavailable.")
    else:
        # Show own expenses for maker/engineer etc.
        exps = supa.table("expenses").select("amount,description,status,created_at").eq("maker_id", user_id).order("created_at", desc=True).limit(5).execute().data or []
        if exps:
            lines.append("💸 Your Recent Expenses:")
            for e in exps:
                lines.append(f"  • {_fmt(e.get('amount', 0))} — {e.get('description','—')} [{e.get('status','?')}]")
        else:
            lines.append("No expense records found for your account.")

    return "\n".join(lines)


# ─── Prediction Engine (pure math, no sklearn) ────────────────────────────────

def handle_prediction(role: str) -> str:
    if role not in (PRIVILEGED_ROLES | PROJECT_ROLES):
        return "Predictions are available for admin, engineer, and supervisor roles."

    supa = _supa()
    if supa is None:
        return "Database not connected."

    lines = ["📈 Predictions & Forecasts:"]

    # Budget burn rate
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
        exps = supa.table("expenses").select("amount,created_at").gte("created_at", cutoff).eq("status", "approved").limit(500).execute().data or []
        accounts = supa.table("fund_accounts").select("balance").limit(100).execute().data or []
        fund = sum(float(r["balance"]) for r in accounts)

        if exps and fund > 0:
            monthly: dict[str, float] = {}
            for e in exps:
                try:
                    month = e["created_at"][:7]  # YYYY-MM
                    monthly[month] = monthly.get(month, 0) + float(e["amount"])
                except Exception:
                    continue
            if monthly:
                avg_monthly = sum(monthly.values()) / len(monthly)
                months_left = fund / avg_monthly if avg_monthly > 0 else 0
                lines.append(f"💰 Budget Forecast: At current burn rate ({_fmt(avg_monthly)}/month), funds last ~{months_left:.1f} months.")
    except Exception:
        lines.append("Budget forecast: insufficient data.")

    # Project deadline risk
    try:
        projects = supa.table("projects").select("name,status,end_date").limit(50).execute().data or []
        now = datetime.now(timezone.utc).date()
        overdue = [p for p in projects if p.get("end_date") and p.get("status") not in ("completed", "done", "closed") and datetime.fromisoformat(str(p["end_date"])).date() < now]
        at_risk = [p for p in projects if p.get("end_date") and p.get("status") not in ("completed", "done", "closed") and 0 <= (datetime.fromisoformat(str(p["end_date"])).date() - now).days <= 14]
        lines.append(f"🏗️ Project Risk: {len(overdue)} overdue, {len(at_risk)} at risk (due in 14 days).")
    except Exception:
        lines.append("Project risk: insufficient data.")

    # Worker shortage prediction
    try:
        logs = supa.table("worker_logs").select("attendance_status").limit(120).execute().data or []
        if logs:
            absent = sum(1 for l in logs if str(l.get("attendance_status", "")).lower() == "absent")
            ratio = absent / len(logs)
            if ratio >= 0.35:
                lines.append(f"👷 Workforce Warning: {ratio*100:.0f}% absence rate — shortage predicted.")
            else:
                lines.append(f"👷 Workforce: Stable ({ratio*100:.0f}% absence rate).")
    except Exception:
        pass

    return "\n".join(lines) if len(lines) > 1 else "Not enough data for predictions yet."


# ─── Internet Layer ───────────────────────────────────────────────────────────

def handle_exchange_rate() -> str:
    try:
        resp = httpx.get(
            "https://api.exchangerate-api.com/v4/latest/USD",
            timeout=5.0,
        )
        data = resp.json()
        bdt = data.get("rates", {}).get("BDT", None)
        if bdt:
            return f"💱 Exchange Rate (live):\n  1 USD = {bdt:.2f} BDT\n  Source: exchangerate-api.com"
    except Exception:
        pass

    # Fallback: try another free API
    try:
        resp = httpx.get(
            "https://open.er-api.com/v6/latest/USD",
            timeout=5.0,
        )
        data = resp.json()
        bdt = data.get("rates", {}).get("BDT", None)
        if bdt:
            return f"💱 Exchange Rate (live):\n  1 USD = {bdt:.2f} BDT"
    except Exception:
        pass

    return "💱 Exchange rate unavailable right now. Please check https://bdtickets.com or your bank."


# ─── Sales Handler ────────────────────────────────────────────────────────────

def handle_sales(role: str) -> str:
    if role not in PRIVILEGED_ROLES:
        return "Sales data is available for admin and checker roles."
    supa = _supa()
    if supa is None:
        return "Database not connected."
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        rows = supa.table("sales").select("total_amount,created_at").gte("created_at", cutoff).limit(200).execute().data or []
        total = sum(float(r["total_amount"]) for r in rows)
        return f"🛒 Sales (last 30 days):\n  Total: {_fmt(total)}\n  Transactions: {len(rows)}"
    except Exception:
        return "Sales data unavailable."


# ─── Audit Handler ────────────────────────────────────────────────────────────

def handle_audit(role: str) -> str:
    if role not in PRIVILEGED_ROLES:
        return "Audit logs are available for admin and checker roles only."
    supa = _supa()
    if supa is None:
        return "Database not connected."
    rows = supa.table("audit_logs").select("action,entity_type,created_at").order("created_at", desc=True).limit(5).execute().data or []
    if not rows:
        return "No audit log entries found."
    lines = ["🔍 Recent Audit Log:"]
    for r in rows:
        ts = r.get("created_at", "")[:16].replace("T", " ")
        lines.append(f"  • [{ts}] {r.get('action','?')} → {r.get('entity_type','?')}")
    return "\n".join(lines)


# ─── Help / Module Guide ──────────────────────────────────────────────────────

def handle_help(role: str) -> str:
    base = [
        "🤖 SUMONIX AI — What I can do:",
        "  📊 Dashboard summary (type: 'dashboard' or 'summary')",
        "  💸 Finance & expenses (type: 'expense' or 'khoroch')",
        "  📈 Predictions & forecast (type: 'predict' or 'purba vash')",
        "  💱 USD/BDT exchange rate (type: 'dollar rate')",
    ]
    if role in PRIVILEGED_ROLES:
        base += [
            "  ⚠️ Anomaly detection (type: 'risk' or 'jhuki')",
            "  🔍 Audit logs (type: 'audit' or 'log')",
            "  🛒 Sales summary (type: 'sales' or 'bikri')",
        ]
    if role in PROJECT_ROLES | PRIVILEGED_ROLES:
        base += [
            "  🏗️ Project status (type: 'project')",
            "  👷 Worker attendance (type: 'worker' or 'shromik')",
            "  🧱 Material stock (type: 'material' or 'malamal')",
        ]
    if role in ("worker", "mason"):
        base.append("  👤 Your attendance & wages (type: 'amar hajira')")
    base.append("\n📝 You can type in Bengali, English, or Banglish!")
    return "\n".join(base)


# ─── Main Entry Point ─────────────────────────────────────────────────────────

def process_message(message: str, role: str, user_id: str) -> dict[str, Any]:
    """
    Main AI processing pipeline.
    Returns dict with: reply, intent, lang, translated_input
    """
    # Step 1 — Detect language
    lang = detect_language(message)

    # Step 2 — Translate to English for intent detection (handles any language)
    english_text = translate_to_english(message, lang) if lang != "en" else message

    # Step 3 — Classify intent using fuzzy matching on English text
    intent = classify_intent(english_text)

    # Also try on original text (catches Banglish that translates poorly)
    if intent == "general":
        intent = classify_intent(message)

    logger.info("ai_engine intent=%s lang=%s role=%s", intent, lang, role)

    # Step 4 — Dispatch to appropriate handler
    if intent == "greeting":
        reply_en = (
            f"Hello! I'm SUMONIX AI. You are logged in as [{ROLE_LABELS.get(role, role)}].\n"
            "I can help with dashboard, finance, workers, materials, projects, predictions, and more.\n"
            "Type in any language — Bengali, English, or Banglish!"
        )
    elif intent == "help":
        reply_en = handle_help(role)
    elif intent == "dashboard":
        reply_en = handle_dashboard(role, user_id)
    elif intent == "finance":
        reply_en = handle_finance(role, user_id)
    elif intent == "worker":
        reply_en = handle_worker(role, user_id)
    elif intent == "material":
        reply_en = handle_material(role)
    elif intent == "project":
        reply_en = handle_project(role)
    elif intent == "anomaly":
        from services.risk import financial_anomalies
        anomalies = financial_anomalies()
        if not anomalies:
            reply_en = "✅ No anomalies detected in recent expenses."
        else:
            lines = [f"⚠️ {len(anomalies)} anomalous transactions found:"]
            for a in anomalies[:3]:
                lines.append(f"  • {_fmt(a.get('amount', 0))} (account: {a.get('account_id','?')}) — {a.get('description','?')}")
            reply_en = "\n".join(lines)
    elif intent == "prediction":
        reply_en = handle_prediction(role)
    elif intent == "contractor":
        if role not in (PRIVILEGED_ROLES | PROJECT_ROLES):
            reply_en = "Contractor data is not available for your role."
        else:
            supa = _supa()
            rows = supa.table("contractor_contracts").select("id", count="exact").limit(1).execute() if supa else None
            count = rows.count if rows else 0
            reply_en = f"📋 Contractor Contracts: {count} active records. Open the Contractor module for details."
    elif intent == "sales":
        reply_en = handle_sales(role)
    elif intent == "audit":
        reply_en = handle_audit(role)
    elif intent == "exchange_rate":
        reply_en = handle_exchange_rate()
    elif intent == "my_info":
        reply_en = handle_my_info(role, user_id)
    else:
        # General fallback — show dashboard summary + guidance
        reply_en = handle_dashboard(role, user_id) + "\n\nAsk me about: expenses, workers, materials, projects, predictions, or type 'help'."

    # Step 5 — Translate response back to user's language
    reply = translate_response(reply_en, lang) if lang not in ("en", "unknown") else reply_en

    return {
        "reply": reply,
        "intent": intent,
        "lang": lang,
        "translated_input": english_text if lang != "en" else None,
    }
