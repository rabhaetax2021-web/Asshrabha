import React from "react";
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CustomerActions from '@/components/admin/CustomerActions'

export default async function CustomersPage() {
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, orderBy: { createdAt: 'desc' }, take: 200 })

  return (
    <section className="admin-customers container">
      <h1>Customers</h1>
      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Status</th>
              <th className="hide-sm">Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={4}>No customers found.</td>
              </tr>
            )}

            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.nameEN || c.nameAR || '-'}</td>
                <td>{c.mobile}</td>
                <td>{c.status ?? 'PENDING'}</td>
                <td className="hide-sm">{new Date(c.createdAt).toLocaleString()}</td>
                <td><CustomerActions userId={c.id} status={c.status ?? undefined} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
