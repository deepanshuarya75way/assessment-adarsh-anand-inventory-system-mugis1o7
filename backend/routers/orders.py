from typing import Annotated, List
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Customer, Order, OrderItem, Product
from schemas import OrderCreate, OrderDetailResponse, OrderResponse

router = APIRouter()

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post("", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreate, db: DbDep):
    # 1. Verify customer exists
    cust_result = await db.execute(select(Customer).where(Customer.id == payload.customer_id))
    customer = cust_result.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # 2. Validate all products and stock levels upfront (before any mutations)
    resolved_items: list[tuple[Product, int]] = []
    for item_in in payload.items:
        prod_result = await db.execute(select(Product).where(Product.id == item_in.product_id))
        product = prod_result.scalars().first()
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item_in.product_id} not found",
            )
        if product.quantity < item_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock for product {product.name}: "
                    f"available {product.quantity}, requested {item_in.quantity}"
                ),
            )
        resolved_items.append((product, item_in.quantity))

    # 3. Create the Order record
    order = Order(customer_id=payload.customer_id, total_amount=Decimal("0.00"), status="pending")
    db.add(order)
    await db.flush()  # get order.id without committing

    # 4. Create OrderItems and deduct stock
    total_amount = Decimal("0.00")
    for product, qty in resolved_items:
        unit_price = Decimal(str(product.price))
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            unit_price=unit_price,
        )
        db.add(order_item)
        product.quantity -= qty
        total_amount += unit_price * qty

    # 5. Update total_amount
    order.total_amount = total_amount

    # 6. Commit everything in one transaction
    await db.commit()

    # 7. Reload with eager relations for response
    detail_result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.customer))
        .where(Order.id == order.id)
    )
    order_detail = detail_result.scalars().first()
    return order_detail


@router.get("", response_model=List[OrderResponse])
async def list_orders(db: DbDep):
    result = await db.execute(
        select(Order).options(selectinload(Order.items))
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(order_id: UUID, db: DbDep):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.customer))
        .where(Order.id == order_id)
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/confirm", response_model=OrderDetailResponse)
async def confirm_order(order_id: UUID, db: DbDep):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.customer))
        .where(Order.id == order_id)
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "pending":
        raise HTTPException(status_code=400, detail=f"Order is already {order.status}")
    order.status = "confirmed"
    await db.commit()
    await db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_order(order_id: UUID, db: DbDep):
    # 1. Load order with items
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "confirmed":
        raise HTTPException(status_code=400, detail="Confirmed orders cannot be cancelled")
    if order.status == "cancelled":
        raise HTTPException(status_code=400, detail="Order is already cancelled")

    # 2. Restore stock for each item
    for item in order.items:
        prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = prod_result.scalars().first()
        if product:
            product.quantity += item.quantity

    # 3. Mark as cancelled — keep the record for history
    order.status = "cancelled"
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
