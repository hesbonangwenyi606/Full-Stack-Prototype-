from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from . import models
from . import schemas


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(name=user.name, email=user.email)
    db.add(db_user)
    db.flush()
    account = models.Account(user_id=db_user.id, currency="KES", balance_cents=0)
    db.add(account)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_primary_account(db: Session, user_id: int) -> models.Account:
    return db.query(models.Account).filter(models.Account.user_id == user_id).first()


def deposit(db: Session, request: schemas.DepositRequest) -> models.Transaction:
    account = get_user_primary_account(db, request.user_id)
    if not account:
        raise ValueError("User not found")

    amount_cents = int(round(request.amount * 100))
    if amount_cents <= 0:
        raise ValueError("Amount must be positive")

    tx = models.Transaction(
        type=models.TransactionType.DEPOSIT,
        status=models.TransactionStatus.PENDING,
        amount_cents=amount_cents,
        to_account_id=account.id,
        description=request.description,
    )
    db.add(tx)
    account.balance_cents += amount_cents
    tx.status = models.TransactionStatus.SUCCESS
    db.commit()
    db.refresh(tx)
    return tx


def transfer(db: Session, request: schemas.TransferRequest) -> models.Transaction:
    if request.from_user_id == request.to_user_id:
        raise ValueError("Cannot transfer to the same user")

    from_account = get_user_primary_account(db, request.from_user_id)
    to_account = get_user_primary_account(db, request.to_user_id)
    if not from_account or not to_account:
        raise ValueError("One or both users not found")

    amount_cents = int(round(request.amount * 100))
    if amount_cents <= 0:
        raise ValueError("Amount must be positive")

    if from_account.balance_cents < amount_cents:
        raise ValueError("Insufficient balance")

    tx = models.Transaction(
        type=models.TransactionType.TRANSFER,
        status=models.TransactionStatus.PENDING,
        amount_cents=amount_cents,
        from_account_id=from_account.id,
        to_account_id=to_account.id,
        description=request.description,
    )
    db.add(tx)
    from_account.balance_cents -= amount_cents
    to_account.balance_cents += amount_cents
    tx.status = models.TransactionStatus.SUCCESS
    db.commit()
    db.refresh(tx)
    return tx


def withdraw(db: Session, request: schemas.WithdrawRequest) -> models.Transaction:
    account = get_user_primary_account(db, request.user_id)
    if not account:
        raise ValueError("User not found")

    amount_cents = int(round(request.amount * 100))
    if amount_cents <= 0:
        raise ValueError("Amount must be positive")

    if account.balance_cents < amount_cents:
        raise ValueError("Insufficient balance")

    tx = models.Transaction(
        type=models.TransactionType.WITHDRAW,
        status=models.TransactionStatus.PENDING,
        amount_cents=amount_cents,
        from_account_id=account.id,
        description=request.description,
    )
    db.add(tx)
    account.balance_cents -= amount_cents
    tx.status = models.TransactionStatus.SUCCESS
    db.commit()
    db.refresh(tx)
    return tx


def get_balance(db: Session, user_id: int) -> schemas.BalanceResponse:
    account = get_user_primary_account(db, user_id)
    if not account:
        raise ValueError("User not found")
    return schemas.BalanceResponse(
        user_id=user_id, balance=account.balance_cents / 100.0, currency=account.currency
    )


def get_transactions_for_user(db: Session, user_id: int):
    account = get_user_primary_account(db, user_id)
    if not account:
        raise ValueError("User not found")

    q = (
        db.query(models.Transaction)
        .filter(
            or_(
                models.Transaction.from_account_id == account.id,
                models.Transaction.to_account_id == account.id,
            )
        )
        .order_by(models.Transaction.created_at.desc())
    )
    return q.all()


def get_summary_stats(db: Session) -> schemas.SummaryStats:
    total_users = db.query(models.User).count()
    total_value_cents = db.query(func.sum(models.Account.balance_cents)).scalar() or 0
    total_transfers = (
        db.query(models.Transaction)
        .filter(models.Transaction.type == models.TransactionType.TRANSFER)
        .count()
    )
    total_withdrawals = (
        db.query(models.Transaction)
        .filter(models.Transaction.type == models.TransactionType.WITHDRAW)
        .count()
    )

    return schemas.SummaryStats(
        total_users=total_users,
        total_value=total_value_cents / 100.0,
        total_transfers=total_transfers,
        total_withdrawals=total_withdrawals,
        currency="KES",
    )


def get_recent_activity(db: Session, limit: int = 10):
    return (
        db.query(models.Transaction)
        .order_by(models.Transaction.created_at.desc())
        .limit(limit)
        .all()
    )
