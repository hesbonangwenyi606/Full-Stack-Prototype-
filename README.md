# Nissmart Full-Stack Assignment Prototype

This repository contains a working prototype of the Nissmart micro-savings & payout platform.

Structure:

- `backend/` – FastAPI + SQLite transaction engine and ledger
- `frontend/` – React (Vite) user and admin dashboards
- `docs/architecture.md` – Architecture and reasoning
- `docs/flow_diagram.png` – High-level flow diagram

> Note: You will still need to record the required 2–5 minute video walkthrough yourself using this running prototype.

## Running the Backend

### 1. Create and activate a virtual environment (optional but recommended)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Start the API server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- The SQLite database file `nissmart.db` will be created automatically.
- API docs will be available at: `http://localhost:8000/docs`

---

## Running the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

- The app will start on `http://localhost:5173`.

If your backend is not on `http://localhost:8000`, set:

```bash
# in the frontend directory
echo "VITE_API_BASE_URL=http://your-backend-host:port" > .env
```

---

## Key API Endpoints

- `POST /users` – Create a new user (and primary wallet)
- `POST /deposit` – Simulate a deposit
- `POST /transfer` – Internal transfer between users
- `POST /withdraw` – Simulate a withdrawal
- `GET /balance/{user_id}` – Get current wallet balance
- `GET /transactions/{user_id}` – Get transaction history

Admin endpoints:

- `GET /admin/summary` – Aggregate statistics for dashboards
- `GET /admin/activity?limit=20` – Recent transaction feed

---

## Frontend Features

### User Dashboard

- Select or create a user
- View real-time wallet balance
- Perform deposits, transfers and withdrawals
- View transaction history (with type, status, counterparty and timestamp)

### Admin Dashboard

- System summary cards:
  - Total users
  - Total value in wallets
  - Total transfers
  - Total withdrawals
- Transactions table (ID, type, status, amount, from, to, timestamp)
- Recent activity feed with concise human-readable messages

The admin view auto-refreshes every 5 seconds to make the demo more dynamic.


## Video Walkthrough (What to Record)

When you are ready, start the backend and frontend, then record a 2–5 minute screen capture where you:

1. Open the **Admin Dashboard** and show the system summary (likely zero at first).
2. Switch to **User Dashboard**:
   - Create two users (e.g., Alice and Bob).
   - Deposit money into Alice's wallet.
   - Show that Alice's balance and transaction history updated.
3. Perform an internal transfer from Alice to Bob.
4. Perform a withdrawal from Bob.
5. Switch back to the **Admin Dashboard**:
   - Show that the summary totals and transaction table have updated.
   - Scroll through the recent activity feed.
6. Briefly explain your architecture choices using `docs/architecture.md` as your talking points.

This will satisfy the “video walkthrough” deliverable from the assignment.
