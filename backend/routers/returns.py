from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Return, ReturnItem
from schemas import (
  ReturnCreate,
  ReturnResponse,
  ReturnItemDecision
)

router = APIRouter(
  prefix="/returns",
  tags=["Returns"]
)

# return
@router.post("/", response_model=ReturnResponse)
def create_retrun(
  data: ReturnCreate,
  db: Session = Depends(get_db)
):

    order = db.execute(
      text("""
      SELECT id
      FROM orders
      WHERE id = :order_id """),
    

    { 
         "order_id": data.order_id
    }
).fetchone()

if not order:
      raise HTTPException(
        status_code=404,
        detail="Order not found"
      )

if not data.items:
      raise HTTPException(
        status_code=400,
        detail="At least one item must be there"
      ) 

return_record = Return(
      order_id=data.order_id,
      status="Pending"
     )

# db update
db.add(return_record)
db.flush()

for item in data.items:
  order_item = db.execute(
     text("""
      SELECT
       id, 
       product_name, 
       quantity
      FROM order_items
      WHERE id = item_id
      AND order_id = :order_id"""),
      

     {
        "item_id": item.order_item_id,
        "order_id": data.order_id
     })

  if not order_item:
      db.rollback()
      raise HTTPException(
        status_code=404,
        detail=f"Order item not found"
      )
      
# Previous returns
      previous_retruns = db.query(
        ReturnItem
      ).join(
        Return
      ).filter(
        Return.order_id == data.order_id,
        ReturnItem.order_item_id == item.order_item_id,
        ReturnItem.decision.in_( [
          "Pending" "Accepted"
        ])
      ).all()

# calculation
      already_returns = sum(
        x.quantitty for x in previous_retruns
      )

      available_to_return = (
        order_item.quantity - already_returns
      )

# validation
  if item.quantity > available_to_return:
        db.rollback()

        raise HTTPException(
          status_code = 400,
          detail=(
            f"Cannot return said units"
          )
        )
  if not item.reason.strip(): # give reason
        db.rollback()

        raise HTTPException(
          status_code = 400,
          detail=(
            f"Give return reason"
          )
        )
        return_item = ReturnItem(
          return_id=return_record.id,
          order_item_id=item.order_item_id,
          product_name=order_item.product_name,
          quantity=item.quantity,
          reason=item.reason,
          classification=default,
          decision=default
        )
# update the db
db.add(return_item)
db.commit()
db.refresh(return_record)

return return_record


# returning results
@router.get("/")
def get_returns(
        db: Session = Depends(get_db)
      ):

       returns = db.query(Return).order_by(
        Return.created_at.description()
       ).all()

       result = []

       for r in returns:
        result.append({
          "id": id,
          "order_id": order_id,
          "items": [
            {"id": item.id,
            "order_item_id": item.order_item_id,
            "product_name": item.product_name,
            "quantity": item.quantity,
            "reason": item.reason,
            "classification": default,
            "decision": default
            }
            for item in r.items
          ]
        })

        return result


# Return accepted or not
@router.patch("/return_id/items/item_id")
def decide_whether_to_return_item(
  return_id: UUID,
  item_id: UUID,
  data: ReturnItemDecision,
  db: Session = Depends(get_db)
):

 if data.classification not in [
  "Sellable"
  "Damaged"
  "Awaiting Review"
]:
  raise HTTPException(
    status_code= 400,
    detail="Invaild classification"
  )

  if data.decision not in [
  "Accepted"
  "Rejected"
]:
   raise HTTPException(
    status_code= 400,
    detail="Decision must be done, Aceepted or Rejected"
  )

  return_item = db.query(ReturnItem).filter(
    ReturnItem.id == item_id,
    ReturnItem.return_id == return_id
  )
  if not return_item:
    raise HTTPException(
      status_code=400,
      detail="Retun item is not there"
    )

# prevent duplicacy
if return_item.decision == "Accepted":
  raise HTTPException(
    status_code=400,
    detail="This item has already been accepted for return"
  ) 

#  stock update condition
if (data.classification == "Sellable" and data.decision == "Accepted"):

  stock = db.execute(
    text("""
    SELECT id, quantity
    FROM stock
    WHERE product_name = product_name"""
  ),
  {
    "product_name":
    return_item.product_name
  }
  ).fetchone()

  if stock:
    db.execute(
      text("""
      UPDATE stock
      SET quantity = quantity + :quantity
      WHERE id = :inventory_id"""),
      {
        "quantity": return_item.quantity,
        "inventory_id": inventory.id
      }
    )
  else:
    db.execute(
      text("""INSERT INTO stock (product_name, quantity)
      VALUES(:product_name, :quantity)"""),
      {
        "product_name": return_item.product_name,
        "quantity": return_item.quantity
      }
    )

 
# At last, update return status 
return_record = db.query(Return).filter(
  Return.id == return_id
).first()

all_items = return_record.items

if all(
  item.decision in ["Accepted", "Rejected"]
  for item in all_items
):

  if all(
    item.decision == "Rejected"
    for item in all_items
  ):
   return_record.status = "Rejected"
  else:
    return_record.status = "Processed"
else:
    return_record.status = "Under Review"

db.commit()  # Final db commit

return{
    "message": "Return decision updated successfully",
    "return_id": return_id,
    "item_id": item_id,
    "classification": return_item.classification,
    "decision": return_item.decision,
    "status": return_record.status
   }  