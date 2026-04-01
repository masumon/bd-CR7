from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from core.auth import UserContext, get_current_user, require_roles
from core.supabase import supabase_service
from schemas.pos import CustomerCreate, ProductUpsert, SaleCreate

router = APIRouter()


@router.post("/products")
async def upsert_product(payload: ProductUpsert, user: UserContext = Depends(require_roles("admin", "maker"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")

    existing = supabase_service.table("products").select("id").eq("barcode", payload.barcode).limit(1).execute()
    if existing.data:
        product_id = existing.data[0]["id"]
        supabase_service.table("products").update(
            {
                "name": payload.name,
                "purchase_price": str(payload.purchase_price),
                "sell_price": str(payload.sell_price),
                "stock_qty": str(payload.stock_qty),
            }
        ).eq("id", product_id).execute()
        return {"id": product_id, "message": "product updated"}

    product_id = str(uuid4())
    supabase_service.table("products").insert(
        {
            "id": product_id,
            "name": payload.name,
            "barcode": payload.barcode,
            "purchase_price": str(payload.purchase_price),
            "sell_price": str(payload.sell_price),
            "stock_qty": str(payload.stock_qty),
        }
    ).execute()
    return {"id": product_id, "message": "product created"}


@router.get("/products")
async def list_products(user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    rows = (
        supabase_service.table("products")
        .select("id,name,barcode,purchase_price,sell_price,stock_qty,created_at,updated_at")
        .order("updated_at", desc=True)
        .limit(500)
        .execute()
    )
    return rows.data or []


@router.get("/products/{product_id}")
async def get_product(product_id: str, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    row = (
        supabase_service.table("products")
        .select("id,name,barcode,purchase_price,sell_price,stock_qty,created_at,updated_at")
        .eq("id", product_id)
        .limit(1)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return row.data[0]


@router.patch("/products/{product_id}")
async def update_product(product_id: str, payload: ProductUpsert, user: UserContext = Depends(require_roles("admin", "maker"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    updated = (
        supabase_service.table("products")
        .update(
            {
                "name": payload.name,
                "barcode": payload.barcode,
                "purchase_price": str(payload.purchase_price),
                "sell_price": str(payload.sell_price),
                "stock_qty": str(payload.stock_qty),
            }
        )
        .eq("id", product_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "product updated"}


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: UserContext = Depends(require_roles("admin"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    deleted = supabase_service.table("products").delete().eq("id", product_id).execute()
    if not deleted.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "product deleted"}


@router.get("/products/barcode/{barcode}")
async def barcode_lookup(barcode: str, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    row = (
        supabase_service.table("products")
        .select("id,name,barcode,stock_qty,sell_price")
        .eq("barcode", barcode)
        .limit(1)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return row.data[0]


@router.post("/customers")
async def create_customer(payload: CustomerCreate, user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    customer_id = str(uuid4())
    supabase_service.table("customers").insert(
        {
            "id": customer_id,
            "name": payload.name,
            "phone": payload.phone,
            "email": payload.email,
            "created_by": user.user_id,
        }
    ).execute()
    return {"id": customer_id}


@router.post("/sales")
async def create_sale(payload: SaleCreate, user: UserContext = Depends(require_roles("admin", "maker"))):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    sale_id = str(uuid4())
    total_amount = Decimal("0")
    product_ids = [item.product_id for item in payload.items]
    products = (
        supabase_service.table("products")
        .select("id,stock_qty,sell_price")
        .in_("id", product_ids)
        .execute()
    )
    product_map = {row["id"]: row for row in (products.data or [])}
    sale_items: list[dict[str, str]] = []

    for item in payload.items:
        product = product_map.get(item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")

        stock_qty = Decimal(str(product["stock_qty"]))
        qty = Decimal(item.quantity)
        if stock_qty < qty:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {item.product_id}")

        unit_price = Decimal(str(product["sell_price"]))
        line_total = qty * unit_price
        total_amount += line_total

        supabase_service.table("products").update(
            {"stock_qty": str(stock_qty - qty)}
        ).eq("id", item.product_id).execute()
        sale_items.append(
            {
                "id": str(uuid4()),
                "sale_id": sale_id,
                "product_id": item.product_id,
                "quantity": str(qty),
                "unit_price": str(unit_price),
                "line_total": str(line_total),
            }
        )

    supabase_service.table("sales").insert(
        {
            "id": sale_id,
            "customer_id": payload.customer_id,
            "cashier_id": user.user_id,
            "total_amount": str(total_amount),
        }
    ).execute()
    supabase_service.table("sale_items").insert(sale_items).execute()

    return {"id": sale_id, "total_amount": str(total_amount)}


@router.get("/sales")
async def sales_history(user: UserContext = Depends(get_current_user)):
    if supabase_service is None:
        raise HTTPException(status_code=500, detail="Supabase service client is not configured")
    sales = (
        supabase_service.table("sales")
        .select("id,customer_id,cashier_id,total_amount,created_at")
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    rows = sales.data or []
    customer_ids = [row["customer_id"] for row in rows if row.get("customer_id")]
    customer_map: dict[str, str] = {}
    if customer_ids:
        customers = (
            supabase_service.table("customers")
            .select("id,name")
            .in_("id", customer_ids)
            .execute()
        )
        customer_map = {row["id"]: row["name"] for row in (customers.data or [])}
    return [
        {
            "id": row["id"],
            "total_amount": row["total_amount"],
            "created_at": row["created_at"],
            "customer_name": customer_map.get(row.get("customer_id"), None),
        }
        for row in rows
    ]
