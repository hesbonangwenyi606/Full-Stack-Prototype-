from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging

from . import models, schemas, crud
from .database import engine, Base, get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nissmart")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nissmart Micro-Savings API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating user: {user.email}")
    try:
        return crud.create_user(db, user)
    except Exception as e:
        logger.exception("Error creating user")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/deposit")
def deposit(request: schemas.DepositRequest, db: Session = Depends(get_db)):
    logger.info(f"Deposit request: {request}")
    try:
        tx = crud.deposit(db, request)
        return {"status": "success", "transaction_id": tx.id}
    except ValueError as e:
        logger.warning(f"Deposit validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during deposit")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/transfer")
def transfer(request: schemas.TransferRequest, db: Session = Depends(get_db)):
    logger.info(f"Transfer request: {request}")
    try:
        tx = crud.transfer(db, request)
        return {"status": "success", "transaction_id": tx.id}
    except ValueError as e:
        logger.warning(f"Transfer validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during transfer")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/withdraw")
def withdraw(request: schemas.WithdrawRequest, db: Session = Depends(get_db)):
    logger.info(f"Withdraw request: {request}")
    try:
        tx = crud.withdraw(db, request)
        return {"status": "success", "transaction_id": tx.id}
    except ValueError as e:
        logger.warning(f"Withdraw validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during withdrawal")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/balance/{user_id}", response_model=schemas.BalanceResponse)
def get_balance(user_id: int, db: Session = Depends(get_db)):
    try:
        return crud.get_balance(db, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/transactions/{user_id}", response_model=schemas.TransactionsResponse)
def get_transactions(user_id: int, db: Session = Depends(get_db)):
    try:
        txs = crud.get_transactions_for_user(db, user_id)
        result = []
        for t in txs:
            from_user_id = t.from_account.user_id if t.from_account else None
            to_user_id = t.to_account.user_id if t.to_account else None
            result.append(
                schemas.Transaction(
                    id=t.id,
                    type=t.type.value,
                    status=t.status.value,
                    amount=t.amount_cents / 100.0,
                    from_user_id=from_user_id,
                    to_user_id=to_user_id,
                    created_at=t.created_at,
                    description=t.description,
                )
            )
        return {"transactions": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/admin/summary", response_model=schemas.SummaryStats)
def get_summary(db: Session = Depends(get_db)):
    return crud.get_summary_stats(db)


@app.get("/admin/activity", response_model=schemas.TransactionsResponse)
def get_activity(limit: int = 10, db: Session = Depends(get_db)):
    txs = crud.get_recent_activity(db, limit)
    result = []
    for t in txs:
        from_user_id = t.from_account.user_id if t.from_account else None
        to_user_id = t.to_account.user_id if t.to_account else None
        result.append(
            schemas.Transaction(
                id=t.id,
                type=t.type.value,
                status=t.status.value,
                amount=t.amount_cents / 100.0,
                from_user_id=from_user_id,
                to_user_id=to_user_id,
                created_at=t.created_at,
                description=t.description,
            )
        )
    return {"transactions": result}
