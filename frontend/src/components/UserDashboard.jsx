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
  const [toasts, setToasts] = useState([]);
  const [fullScreenMessage, setFullScreenMessage] = useState(null);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferToUserId, setTransferToUserId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

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

  const addToast = (message, type) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const showFullScreenMessage = (name, actionType) => {
    setFullScreenMessage({ name, actionType });
    setTimeout(() => setFullScreenMessage(null), 3000);
  };

  const overlayColor = (actionType) => {
    switch (actionType) {
      case "Deposit Successful!": return "#4ade80";
      case "Transfer Successful!": return "#60a5fa";
      case "Withdrawal Successful!": return "#f87171";
      case "User Created Successfully!": return "#a78bfa";
      default: return "#fff";
    }
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
      showFullScreenMessage(user.name, "User Created Successfully!");
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
      showFullScreenMessage(
        users.find(u => u.id === activeUserId)?.name,
        "Deposit Successful!"
      );
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
      showFullScreenMessage(
        users.find(u => u.id === activeUserId)?.name,
        "Transfer Successful!"
      );
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
      showFullScreenMessage(
        users.find(u => u.id === activeUserId)?.name,
        "Withdrawal Successful!"
      );
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
      case "deposit": return "#4ade80";
      case "transfer": return "#60a5fa";
      case "withdraw": return "#f87171";
      case "create": return "#a78bfa";
      default: return "#333";
    }
  };

  return (
    <div className="layout-left">
      {fullScreenMessage && (
        <div
          className="fullscreen-overlay"
          style={{ backgroundColor: overlayColor(fullScreenMessage.actionType) }}
        >
          <div className="message">
            <h1>{fullScreenMessage.name}</h1>
            <p>{fullScreenMessage.actionType}</p>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast" style={{ backgroundColor: toastColor(t.type) }}>
            {t.message}
          </div>
        ))}
      </div>

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

      <style jsx>{`
        .form-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .badge { padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 500; color: white; }
        .deposit { background-color: #4ade80; }
        .transfer { background-color: #60a5fa; }
        .withdraw { background-color: #f87171; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 6px 8px; border: 1px solid #ddd; font-size: 13px; text-align: left; }
        .spinner { width: 16px; height: 16px; border: 3px solid #ccc; border-top: 3px solid #333; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .toast-container { position: fixed; top: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 9999; }
        .toast { padding: 10px 16px; border-radius: 6px; color: white; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); transform: translateX(300px); opacity: 0; animation: slideIn 0.5s forwards, fadeOut 0.5s 2.5s forwards; }
        @keyframes slideIn { to { transform: translateX(0); opacity: 0.95; } }
        @keyframes fadeOut { to { transform: translateX(300px); opacity: 0; } }

        .fullscreen-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 99999;
          color: #fff;
          animation: fadeScaleIn 0.5s ease, fadeScaleOut 0.5s ease 2.5s;
        }
        .fullscreen-overlay .message { text-align: center; color: white; }
        .fullscreen-overlay h1 { font-size: 4rem; margin: 0; }
        .fullscreen-overlay p { font-size: 2rem; margin: 0; }
        @keyframes fadeScaleIn {
          0% { opacity: 0; transform: translateY(-50px) scale(0.5); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeScaleOut {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.5); }
        }
      `}</style>
    </div>
  );
}
