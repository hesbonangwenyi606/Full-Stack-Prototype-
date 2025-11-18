# Nissmart Micro-Savings & Payout Platform – Architecture

## a) System Overview

This prototype implements a simple micro-savings and payout platform where users can:
- Hold balances in a single wallet (KES).
- Make deposits (simulated).
- Transfer funds internally between users.
- Withdraw funds (simulated payout).
- View their transaction history and current balance.

Operations and finance teams can:
- View system-level statistics (total users, total value in wallets, total transfers, total withdrawals).
- Monitor a consolidated transaction ledger.
- See recent activity to support reconciliation and incident triage.

The system is intentionally small but structured as a real financial product, with a clear separation between API, data layer, ledger model, and dashboards.

## b) Architecture Components

### API Service

- **Framework:** FastAPI (Python).
- **Responsibilities:**
  - Exposes REST endpoints for users, deposits, transfers, withdrawals, balances, and transaction history.
  - Performs validation and orchestrates calls into the data/ledger layer.
  - Handles error mapping (e.g., validation errors → 400, not found → 404, unexpected → 500).
  - Enables CORS for the frontend React application.

### Database

- **Engine:** SQLite (file `nissmart.db` for simplicity).
- **ORM:** SQLAlchemy.
- Justification:
  - Simple to spin up for a prototype, no external dependency.
  - Still supports transactions and constraints like a production relational database.
  - Schema can be migrated later to PostgreSQL/MySQL without major code changes.

### Ledger / Transaction Tables

- `users`: User profile.
- `accounts`: One primary wallet per user, stores balance in **cents** (integer) to avoid floating-point issues.
- `transactions`: Immutable record of all deposits, internal transfers, and withdrawals.
  - Fields include: `type`, `status`, `amount_cents`, `from_account_id`, `to_account_id`, `created_at`, `description`.
  - Acts as the **ledger** for auditing and reconciliation.

Balance is stored on the account (`balance_cents`) and updated atomically with each transaction, but the ledger contains enough information to recompute balances if needed.

### Dashboard Service

- No separate backend service; the dashboard uses the same API service under `/admin/*` endpoints.
- **User Dashboard** calls:
  - `/users`, `/balance/{user_id}`, `/transactions/{user_id}`, `/deposit`, `/transfer`, `/withdraw`.
- **Admin Dashboard** calls:
  - `/admin/summary` – aggregate stats.
  - `/admin/activity` – recent transactions.

### Background Processing (optional / conceptual)

In a real system, payouts and external deposits would be processed asynchronously using a queue and worker (e.g., Celery, Sidekiq, SQS + Lambda).

In this prototype, “external system” interactions (e.g., payout provider) are mocked as synchronous success in the `/withdraw` endpoint.

## c) Data Model

### Users

- `id` (PK)
- `name`
- `email` (optional, unique)
- `created_at`

### Accounts

- `id` (PK)
- `user_id` (FK → users.id)
- `currency` (string, e.g. `"KES"`)
- `balance_cents` (integer)
- `created_at`

Rationale: A separate `accounts` table allows multiple wallets per user in the future (e.g., multi-currency or savings vs. current).

### Transactions

- `id` (PK)
- `type` (`DEPOSIT`, `TRANSFER`, `WITHDRAW`)
- `status` (`PENDING`, `SUCCESS`, `FAILED`)
- `amount_cents` (integer)
- `from_account_id` (FK → accounts.id, nullable)
- `to_account_id` (FK → accounts.id, nullable)
- `created_at`
- `description`

Rationale:
- Single table covers all flows.
- Symmetric structure makes querying for “all user’s activity” easy.
- Acts as the ledger of record.

### TransferRequests / Withdrawals

The required concepts of `TransferRequests` and `Withdrawals` are represented as rows in the `transactions` table. In a more advanced version you could have separate tables for pending/failed requests, but for this prototype “request + result” is captured by a single transaction row with a status.

## d) Transaction Safety

### Avoiding Negative Balances

- For **transfer** and **withdraw** operations, we:
  - Load the source account row inside a transaction.
  - Check `balance_cents >= amount_cents`.
  - If not, raise a validation error → HTTP 400.
  - Otherwise, update balances and insert a ledger row, then commit.

### Avoiding Double Spend

- All balance modifications happen within a single database transaction using the ORM session (`db.commit()`).
- For the prototype and SQLite, this is sufficient to prevent race conditions in a single-process setting.
- In a production system, we would:
  - Use row-level locking (e.g., `SELECT ... FOR UPDATE`).
  - Use an **idempotency key** to deduplicate client retries.

### Ensuring Atomicity

- Each high-level money operation (deposit/transfer/withdraw) is a single database transaction:
  - Insert a `Transaction` row with status `PENDING`.
  - Apply balance changes.
  - Mark transaction as `SUCCESS` and commit.
- If any step fails, the error bubbles up and the whole transaction is rolled back.

### Idempotency

- Conceptual design:
  - Clients send an `Idempotency-Key` header for deposit/transfer/withdraw.
  - The server stores it with the transaction and returns the existing result if called again.
- For simplicity the prototype does not persist idempotency keys but is structured so that they can be added without changing the API shape.

### Validation

- Pydantic schemas enforce:
  - Positive amounts.
  - Required fields.
- Business rules enforce:
  - User and account existence.
  - Sufficient balance for transfer/withdraw.
  - No transfers to self.

## e) Error Handling

- **Failed transfers / withdrawals (business validation):**
  - Raise `ValueError` in the CRUD layer with a clear message.
  - FastAPI catches it and returns `400 Bad Request` with `{ "detail": "Insufficient balance" }` or other message.
- **Unexpected backend errors (e.g., DB issues):**
  - Logged with stack trace via Python `logging`.
  - Client receives `500 Internal Server Error` with a generic message.
- **Not found:**
  - e.g., querying balance for a non-existent user results in `404`.

The frontend surfaces error messages inline in a small red text block so that the tester can see what went wrong during the demo.

## f) Assumptions & Trade-offs

- Single currency (KES) – simplifies balances and reporting.
- Single primary wallet per user – model can be extended later.
- SQLite for persistence – ideal for a portable prototype; in production we would migrate to PostgreSQL.
- No authentication – focus is on transaction flows rather than identity management.
- External payout and funding rails are mocked as “always successful” – real integration would be asynchronous and idempotent.
- Idempotency is described in the design but not fully implemented to keep the code short and easy to review within the assignment timebox.
