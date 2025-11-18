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
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  const [depositAmount, setDepositAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferToUserId, setTransferToUserId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    if (activeUserId) refreshData(activeUserId);
  }, [activeUserId]);

  async function refreshData(userId) {
    try {
      setError("");
      setLoadingData(true);
      const [bal, txs] = await Promise.all([
        getBalance(userId),
        getTransactions(userId)
      ]);
      setBalance(bal);
      setTransactions(txs.transactions || []);
    } catch (e) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoadingData(false);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    if (!newUserName) return;
    setLoading(true);
    setError("");
    try {
      const user = await createUser(newUserName, newUserEmail || null);
      setUsers((prev) => [...prev, user]);
      setActiveUserId(user.id);
      setNewUserName("");
      setNewUserEmail("");
    } catch (e) {
      setError(e?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit(e) {
    e.preventDefault();
    if (!activeUserId || !depositAmount) return;
    setLoading(true);
    setError("");
    try {
      await deposit(activeUserId, parseFloat(depositAmount), "User deposit");
      setDepositAmount("");
      await refreshData(activeUserId);
    } catch (e) {
      setError(e?.message || "Deposit failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    if (!activeUserId || !transferAmount || !transferToUserId) return;
    setLoading(true);
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
      await refreshData(activeUserId);
    } catch (e) {
      setError(e?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    if (!activeUserId || !withdrawAmount) return;
    setLoading(true);
    setError("");
    try {
      await withdraw(activeUserId, parseFloat(withdrawAmount), "User withdrawal");
      setWithdrawAmount("");
      await refreshData(activeUserId);
    } catch (e) {
      setError(e?.message || "Withdrawal failed");
    } finally {
      setLoading(false);
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

  return (
    <div className="layout-left">
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
            <button disabled={loading}>Create</button>
          </div>
        </form>
        {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
      </div>

      {activeUserId && (
        <>
          <div className="card">
            <h2>Balance</h2>
            {loadingData ? (
              <p>Loading balance...</p>
            ) : balance ? (
              <p style={{ fontSize: 18, fontWeight: "bold" }}>
                {balance.balance.toFixed(2)} {balance.currency} (User #{balance.user_id})
              </p>
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
                <button disabled={loading}>Deposit</button>
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
                <button disabled={loading}>Transfer</button>
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
                <button disabled={loading}>Withdraw</button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2>Transaction History</h2>
            {loadingData ? (
              <p>Loading transactions...</p>
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
        .deposit {
          background-color: #4ade80;
        }
        .transfer {
          background-color: #60a5fa;
        }
        .withdraw {
          background-color: #f87171;
        }
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
      `}</style>
    </div>
  );
}
