import React, { useEffect, useState } from "react";
import { getSummary, getActivity } from "../api";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [s, a] = await Promise.all([getSummary(), getActivity(20)]);
      setSummary(s);
      setActivity(a.transactions);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

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
    <div className="layout-right">
      <div className="card">
        <h2>System Summary</h2>
        {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
        {summary ? (
          <div className="summary-grid">
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Total users</div>
              <div style={{ fontSize: 18, fontWeight: "bold" }}>{summary.total_users}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Total value in wallets</div>
              <div style={{ fontSize: 18, fontWeight: "bold" }}>
                {summary.total_value.toFixed(2)} {summary.currency}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Total transfers</div>
              <div style={{ fontSize: 18, fontWeight: "bold" }}>{summary.total_transfers}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Total withdrawals</div>
              <div style={{ fontSize: 18, fontWeight: "bold" }}>{summary.total_withdrawals}</div>
            </div>
          </div>
        ) : (
          <p>Loading summary...</p>
        )}
      </div>

      <div className="card">
        <h2>Transactions</h2>
        {activity.length === 0 ? (
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
              {activity.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{typeBadge(t.type)}</td>
                  <td>
                    <span className={`badge ${t.status.toLowerCase()}`}>{t.status}</span>
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

      <div className="card">
        <h2>Recent Activity Feed</h2>
        {activity.length === 0 ? (
          <p style={{ fontSize: 13 }}>No activity yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
            {activity.slice(0, 10).map((t) => (
              <li key={t.id} style={{ marginBottom: 4 }}>
                <strong>#{t.id}</strong> {t.type.toLowerCase()} of {t.amount.toFixed(2)}{" "}
                from {t.from_user_id || "-"} to {t.to_user_id || "-"} at{" "}
                {new Date(t.created_at).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
