import React, { useState, useEffect } from "react";
import {
  createUser,
  getBalance,
  getTransactions,
  deposit,
  transfer,
  withdraw
} from "../api";

export default function UserDashboard() {
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferToUserId, setTransferToUserId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Auto-refresh user data
  useEffect(() => {
    if (!activeUserId) return;

    async function load() {
      try {
        setLoadingData(true);
        const [bal, txs] = await Promise.all([
          getBalance(activeUserId),
          getTransactions(activeUserId)
        ]);
        setBalance(bal);
        setTransactions(txs.transactions || []);
        setLastUpdated(new Date());
      } catch (e) {
        setError(e?.message || "Failed to load data");
      } finally {
        setLoadingData(false);
      }
    }

    load();
    const intervalId = setInterval(load, 5000);
    return () => clearInterval(intervalId);
  }, [activeUserId]);

  // Show color-coded toast
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function handleCreateUser(e) {
    e.preventDefault();
    if (!newUserName) return;
    setLoadingAction(true);
    setError("");
    try {
      const user = await createUser(newUserName, newUserEmail || null);
      setUsers((prev) => [...prev, user]);
      setActiveUserId(user.id);
      setNewUserName("");
      setNewUserEmail("");
      showToast(`User "${user.name}" created successfully!`, "create");
    } catch (e) {
      setError(e?.message || "Failed to create user");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleDeposit(e) {
    e.preventDefault();
    if (!activeUserId || !depositAmount) return;
    setLoadingAction(true);
    setError("");
    try {
      await deposit(activeUserId, parseFloat(depositAmount), "User deposit");
      setDepositAmount("");
      showToast(`Deposit successful!`, "deposit");
    } catch (e) {
      setError(e?.message || "Deposit failed");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    if (!activeUserId || !transferAmount || !transferToUserId) return;
    setLoadingAction(true);
    setError("");
    try {
      await transfer(
        activeUserId,
        parseInt(transferToUserId, 10),
        parseFloat(transferAmount),
        "Internal transfer"
      );
      setTransferAmount("");
      setTransferToUserId("");
      showToast(`Transfer successful!`, "transfer");
    } catch (e) {
      setError(e?.message || "Transfer failed");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    if (!activeUserId || !withdrawAmount) return;
    setLoadingAction(true);
    setError("");
    try {
      await withdraw(activeUserId, parseFloat(withdrawAmount), "User withdrawal");
      setWithdrawAmount("");
      showToast(`Withdrawal successful!`, "withdraw");
    } catch (e) {
      setError(e?.message || "Withdrawal failed");
    } finally {
      setLoadingAction(false);
    }
  }

  function typeBadge(type) {
    const klass =
      type === "DEPOSIT"
        ? "badge deposit"
        : type === "TRANSFER"
        ? "badge transfer"
        : "badge withdraw";
    return <span className={klass}>{type}</span>;
  }

  const toastColor = (type) => {
    switch (type) {
      case "deposit": return "#4ade80"; // green
      case "transfer": return "#60a5fa"; // blue
      case "withdraw": return "#f87171"; // red
      case "create": return "#a78bfa"; // purple
      default: return "#333";
    }
  };

  return (
    <div className="layout-left">
      {/* Toast notification */}
      {toast && (
        <div className="toast" style={{ backgroundColor: toastColor(toast.type) }}>
          {toast.message}
        </div>
      )}

      <div className="card">
        <h2>Select or Create User</h2>
        <div className="form-row">
          <select
            value={activeUserId || ""}
            onChange={(e) =>
              setActiveUserId(e.target.value ? parseInt(e.target.value, 10) : null)
            }
          >
            <option value="">-- Select user --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} (#{u.id})
              </option>
            ))}
          </select>
        </div>
        <form onSubmit={handleCreateUser}>
          <div className="form-row">
            <input
              placeholder="Full name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
            />
            <input
              placeholder="Email (optional)"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              type="email"
            />
            <button disabled={loadingAction}>
              {loadingAction ? <span className="spinner" /> : "Create"}
            </button>
          </div>
        </form>
        {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
      </div>

      {activeUserId && (
        <>
          <div className="card">
            <h2>Balance</h2>
            {loadingData ? (
              <div className="spinner" />
            ) : balance ? (
              <>
                <p style={{ fontSize: 18, fontWeight: "bold" }}>
                  {balance.balance.toFixed(2)} {balance.currency} (User #{balance.user_id})
                </p>
                {lastUpdated && (
                  <p style={{ fontSize: 12, color: "#6b7280" }}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </>
            ) : (
              <p>Select a user to load balance.</p>
            )}
          </div>

          <div className="card">
            <h2>Actions</h2>
            <form onSubmit={handleDeposit}>
              <div className="form-row">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Deposit amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                />
                <button disabled={loadingAction}>
                  {loadingAction ? <span className="spinner" /> : "Deposit"}
                </button>
              </div>
            </form>
            <form onSubmit={handleTransfer}>
              <div className="form-row">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Transfer amount"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="To user ID"
                  value={transferToUserId}
                  onChange={(e) => setTransferToUserId(e.target.value)}
                  required
                />
                <button disabled={loadingAction}>
                  {loadingAction ? <span className="spinner" /> : "Transfer"}
                </button>
              </div>
            </form>
            <form onSubmit={handleWithdraw}>
              <div className="form-row">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Withdraw amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                />
                <button disabled={loadingAction}>
                  {loadingAction ? <span className="spinner" /> : "Withdraw"}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2>Transaction History</h2>
            {loadingData ? (
              <div className="spinner" />
            ) : transactions.length === 0 ? (
              <p style={{ fontSize: 13 }}>No transactions yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{typeBadge(t.type)}</td>
                      <td>
                        <span className={`badge ${t.status.toLowerCase()}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>{t.amount.toFixed(2)}</td>
                      <td>{t.from_user_id || "-"}</td>
                      <td>{t.to_user_id || "-"}</td>
                      <td>{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {lastUpdated && !loadingData && (
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </>
      )}

      {/* CSS */}
      <style jsx>{`
        .form-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }
        .deposit { background-color: #4ade80; }
        .transfer { background-color: #60a5fa; }
        .withdraw { background-color: #f87171; }
        .table {
          width: 100%;
          border-collapse: collapse;
        }
        .table th,
        .table td {
          padding: 6px 8px;
          border: 1px solid #ddd;
          font-size: 13px;
          text-align: left;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 3px solid #ccc;
          border-top: 3px solid #333;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .toast {
          position: fixed;
          top: 16px;
          right: 16px;
          color: white;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          opacity: 0.95;
          z-index: 9999;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
