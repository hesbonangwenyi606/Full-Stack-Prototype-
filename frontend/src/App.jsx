import React, { useState } from "react";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [activeTab, setActiveTab] = useState("user");

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Nissmart Micro-Savings Platform</h1>
        <div>
          <button
            onClick={() => setActiveTab("user")}
            className={activeTab === "user" ? "" : "secondary"}
          >
            User Dashboard
          </button>{" "}
          <button
            onClick={() => setActiveTab("admin")}
            className={activeTab === "admin" ? "" : "secondary"}
          >
            Admin Dashboard
          </button>
        </div>
      </header>
      <main className="app-main">
        {activeTab === "user" ? <UserDashboard /> : <AdminDashboard />}
      </main>
    </div>
  );
}
