from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import OrderItem, Product
from schemas import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter()

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, db: DbDep):
    # Check SKU uniqueness
    result = await db.execute(select(Product).where(Product.sku == payload.sku))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="SKU already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="SKU already exists")
    await db.refresh(product)
    return product


@router.get("", response_model=List[ProductResponse])
async def list_products(
    db: DbDep,
    low_stock: bool = Query(False, description="Filter products with quantity < 10"),
):
    stmt = select(Product)
    if low_stock:
        stmt = stmt.where(Product.quantity < 10)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: DbDep):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: UUID, payload: ProductUpdate, db: DbDep):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    updates = payload.model_dump(exclude_unset=True)

    # Guard: quantity must not go negative
    if "quantity" in updates and updates["quantity"] < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")

    # Guard: SKU must stay unique across other products
    if "sku" in updates:
        conflict = await db.execute(
            select(Product).where(Product.sku == updates["sku"], Product.id != product_id)
        )
        if conflict.scalars().first():
            raise HTTPException(status_code=409, detail="SKU already in use by another product")

    for field, value in updates.items():
        setattr(product, field, value)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="SKU already in use by another product")
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: UUID, db: DbDep):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Block deletion if the product is referenced by any order
    item_count = await db.scalar(
        select(func.count()).select_from(OrderItem).where(OrderItem.product_id == product_id)
    )
    if item_count:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Cannot delete '{product.name}' — it appears in {item_count} "
                f"order(s). Products referenced by existing orders can't be removed."
            ),
        )

    try:
        await db.delete(product)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cannot delete this product because it is referenced by existing orders.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
