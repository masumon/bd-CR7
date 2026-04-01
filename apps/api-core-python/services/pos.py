import logging
from decimal import Decimal

from core.auth import UserContext
from core.supabase import supabase_service
from schemas.pos import SaleCreate

logger = logging.getLogger(__name__)


def create_sale_atomic(payload: SaleCreate, user: UserContext) -> dict[str, str]:
    if supabase_service is None:
        raise RuntimeError("Supabase service client is not configured")

    line_items = [
        {
            "product_id": item.product_id,
            "quantity": str(Decimal(item.quantity)),
        }
        for item in payload.items
    ]

    try:
        result = supabase_service.rpc(
            "create_sale_atomic",
            {
                "p_customer_id": payload.customer_id,
                "p_cashier_id": user.user_id,
                "p_items": line_items,
            },
        ).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("pos_create_sale_rpc_failed user_id=%s", user.user_id)
        raise RuntimeError("Sale creation failed") from exc

    if not result.data:
        raise RuntimeError("Sale creation returned no data")

    row = result.data[0] if isinstance(result.data, list) else result.data
    return {
        "id": str(row.get("sale_id")),
        "total_amount": str(row.get("total_amount")),
    }