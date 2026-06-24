import React from 'react'
import AdminsManager from '@/components/admin/AdminsManager'
import MarketingMessenger from '@/components/admin/MarketingMessenger'
import TemplateEditor from '@/components/admin/TemplateEditor'

const sections = [
  { id: 'admin-accounts', title: 'Admin Accounts' },
  { id: 'marketing-messenger', title: 'Marketing Messenger' },
  { id: 'templates', title: 'Templates' },
]

export default function AdminSettingsPage() {
  return (
    <section className="admin-settings container" style={{ padding: '24px 0', scrollBehavior: 'smooth' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Settings</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', maxWidth: 640 }}>
            Manage system configuration, admin accounts, marketing messages, and templates from one place.
          </p>
        </div>
      </div>

      <div className="admin-settings-nav">
        {sections.map(section => (
          <a key={section.id} href={`#${section.id}`} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            {section.title}
          </a>
        ))}
      </div>

      <div className="admin-settings-grid" style={{ display: 'grid', gap: 24, marginTop: 24 }}>
        <div id="admin-accounts" className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Admin Accounts</h2>
          <AdminsManager />
        </div>

        <div id="marketing-messenger" className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Marketing Messenger</h2>
          <MarketingMessenger />
        </div>

        <div id="templates" className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Templates</h2>
          <TemplateEditor />
        </div>
      </div>
    </section>
  )
}
