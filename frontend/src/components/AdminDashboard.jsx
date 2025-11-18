import React, { useEffect, useState, useMemo } from "react";
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

  function statusBadge(status) {
    const klass =
      status.toLowerCase() === "completed"
        ? "badge completed"
        : status.toLowerCase() === "pending"
        ? "badge pending"
        : "badge failed";
    return <span className={klass}>{status}</span>;
  }

  const recentActivity = useMemo(() => {
    return [...activity].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
  }, [activity]);

  return (
    <div className="layout-right">
      {/* System Summary */}
      <div className="card">
        <h2>System Summary</h2>
        {error && <p className="error-text">{error}</p>}
        {loadingSummary ? (
          <p>Loading summary...</p>
        ) : summary ? (
          <div className="summary-grid">
            <div className="summary-item">
              <div className="label">Total Users</div>
              <div className="value">{summary.total_users}</div>
            </div>
            <div className="summary-item">
              <div className="label">Total Wallet Value</div>
              <div className="value">
                {summary.total_value.toFixed(2)} {summary.currency}
              </div>
            </div>
            <div className="summary-item">
              <div className="label">Total Transfers</div>
              <div className="value">{summary.total_transfers}</div>
            </div>
            <div className="summary-item">
              <div className="label">Total Withdrawals</div>
              <div className="value">{summary.total_withdrawals}</div>
            </div>
          </div>
        ) : (
          <p>No summary available.</p>
        )}
      </div>

      {/* Transactions Table */}
      <div className="card">
        <h2>Transactions</h2>
        {loadingActivity ? (
          <p>Loading transactions...</p>
        ) : activity.length === 0 ? (
          <p className="small-text">No transactions yet.</p>
        ) : (
          <div className="table-wrapper">
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
                    <td>{statusBadge(t.status)}</td>
                    <td>{t.amount.toFixed(2)}</td>
                    <td>{t.from_user_id || "-"}</td>
                    <td>{t.to_user_id || "-"}</td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {lastUpdated && <p className="last-updated">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
      </div>

      {/* Recent Activity Feed */}
      <div className="card">
        <h2>Recent Activity Feed</h2>
        {loadingActivity ? (
          <p>Loading activity feed...</p>
        ) : recentActivity.length === 0 ? (
          <p className="small-text">No activity yet.</p>
        ) : (
          <ul className="activity-feed">
            {recentActivity.map((t) => (
              <li key={t.id}>
                <strong>#{t.id}</strong> {t.type.toLowerCase()} of{" "}
                {t.amount.toFixed(2)} from {t.from_user_id || "-"} to {t.to_user_id || "-"} at{" "}
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
        .summary-item .label {
          font-size: 12px;
          color: #6b7280;
        }
        .summary-item .value {
          font-size: 18px;
          font-weight: bold;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 6px;
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
        .completed {
          background-color: #4ade80;
        }
        .pending {
          background-color: #facc15;
        }
        .failed {
          background-color: #f87171;
        }

        .table-wrapper {
          overflow-x: auto;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
        }
        .table th,
        .table td {
          padding: 8px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
          font-size: 13px;
        }

        .activity-feed {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 13px;
        }
        .activity-feed li {
          margin-bottom: 6px;
        }

        .small-text {
          font-size: 13px;
          color: #6b7280;
        }

        .error-text {
          color: #ef4444;
          font-size: 13px;
        }

        .last-updated {
          font-size: 12px;
          color: #6b7280;
          margin-top: 6px;
        }

        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          }
          .table th,
          .table td {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
