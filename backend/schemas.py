from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TransactionType(str, Enum):
    DEPOSIT = "DEPOSIT"
    TRANSFER = "TRANSFER"
    WITHDRAW = "WITHDRAW"


class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: Optional[EmailStr] = None


class User(BaseModel):
    id: int
    name: str
    email: Optional[EmailStr]
    created_at: datetime

    class Config:
        orm_mode = True


class DepositRequest(BaseModel):
    user_id: int
    amount: float = Field(..., gt=0)
    description: Optional[str] = None


class TransferRequest(BaseModel):
    from_user_id: int
    to_user_id: int
    amount: float = Field(..., gt=0)
    description: Optional[str] = None


class WithdrawRequest(BaseModel):
    user_id: int
    amount: float = Field(..., gt=0)
    description: Optional[str] = None


class Transaction(BaseModel):
    id: int
    type: TransactionType
    status: TransactionStatus
    amount: float
    from_user_id: Optional[int]
    to_user_id: Optional[int]
    created_at: datetime
    description: Optional[str]

    class Config:
        orm_mode = True


class BalanceResponse(BaseModel):
    user_id: int
    balance: float
    currency: str


class SummaryStats(BaseModel):
    total_users: int
    total_value: float
    total_transfers: int
    total_withdrawals: int
    currency: str = "KES"


class TransactionsResponse(BaseModel):
    transactions: List[Transaction]
