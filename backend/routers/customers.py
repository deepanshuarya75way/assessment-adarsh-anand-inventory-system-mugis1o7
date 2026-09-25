from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Customer, Order
from schemas import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter()

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(payload: CustomerCreate, db: DbDep):
    # Check email uniqueness
    result = await db.execute(select(Customer).where(Customer.email == payload.email))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    customer = Customer(**payload.model_dump())
    db.add(customer)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email already exists")
    await db.refresh(customer)
    return customer


@router.get("", response_model=List[CustomerResponse])
async def list_customers(db: DbDep):
    result = await db.execute(select(Customer))
    return result.scalars().all()


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: UUID, db: DbDep):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: UUID, payload: CustomerUpdate, db: DbDep):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    updates = payload.model_dump(exclude_unset=True)

    if "email" in updates:
        conflict = await db.execute(
            select(Customer).where(Customer.email == updates["email"], Customer.id != customer_id)
        )
        if conflict.scalars().first():
            raise HTTPException(status_code=409, detail="Email already in use by another customer")

    for field, value in updates.items():
        setattr(customer, field, value)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email already in use by another customer")
    await db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: UUID, db: DbDep):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Block deletion if the customer has any orders on record
    order_count = await db.scalar(
        select(func.count()).select_from(Order).where(Order.customer_id == customer_id)
    )
    if order_count:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Cannot delete '{customer.full_name}' — they have {order_count} "
                f"order(s) on record. Remove those orders first."
            ),
        )

    try:
        await db.delete(customer)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cannot delete this customer because they have existing orders.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
