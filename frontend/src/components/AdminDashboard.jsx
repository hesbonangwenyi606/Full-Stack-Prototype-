import React, { useEffect, useState } from "react";
import { getSummary, getActivity } from "../api";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function load() {
    try {
      setError("");
      setLoadingSummary(true);
      setLoadingActivity(true);

      const [s, a] = await Promise.all([getSummary(), getActivity(20)]);
      setSummary(s);
      setActivity(a.transactions || []);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoadingSummary(false);
      setLoadingActivity(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
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
        {loadingSummary ? (
          <p>Loading summary...</p>
        ) : summary ? (
          <div className="summary-grid">
            <div>
              <div className="label">Total users</div>
              <div className="value">{summary.total_users}</div>
            </div>
            <div>
              <div className="label">Total value in wallets</div>
              <div className="value">
                {summary.total_value.toFixed(2)} {summary.currency}
              </div>
            </div>
            <div>
              <div className="label">Total transfers</div>
              <div className="value">{summary.total_transfers}</div>
            </div>
            <div>
              <div className="label">Total withdrawals</div>
              <div className="value">{summary.total_withdrawals}</div>
            </div>
          </div>
        ) : (
          <p>No summary available.</p>
        )}
      </div>

      <div className="card">
        <h2>Transactions</h2>
        {loadingActivity ? (
          <p>Loading transactions...</p>
        ) : activity.length === 0 ? (
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
        {lastUpdated && (
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="card">
        <h2>Recent Activity Feed</h2>
        {loadingActivity ? (
          <p>Loading activity feed...</p>
        ) : activity.length === 0 ? (
          <p style={{ fontSize: 13 }}>No activity yet.</p>
        ) : (
          <ul className="activity-feed">
            {activity.slice(0, 10).map((t) => (
              <li key={t.id}>
                <strong>#{t.id}</strong> {t.type.toLowerCase()} of{" "}
                {t.amount.toFixed(2)} from {t.from_user_id || "-"} to{" "}
                {t.to_user_id || "-"} at{" "}
                {new Date(t.created_at).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CSS */}
      <style jsx>{`
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }
        .label {
          font-size: 12px;
          color: #6b7280;
        }
        .value {
          font-size: 18px;
          font-weight: bold;
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
        .activity-feed {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 13px;
        }
        .activity-feed li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}
