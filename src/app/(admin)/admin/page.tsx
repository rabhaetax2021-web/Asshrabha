import React from "react";

export default function AdminDashboardPage() {
  return (
    <section className="admin-dashboard container">
      <h1>Admin Dashboard</h1>
      <div className="kpi-grid">
        <div className="kpi-card">Total Revenue<br/><strong>—</strong></div>
        <div className="kpi-card">Orders Today<br/><strong>—</strong></div>
        <div className="kpi-card">Active Providers<br/><strong>—</strong></div>
        <div className="kpi-card">Pending Approvals<br/><strong>—</strong></div>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <p>No activity yet.</p>
      </div>
    </section>
  );
}
