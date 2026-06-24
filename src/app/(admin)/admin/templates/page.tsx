import React from 'react'
import TemplateEditor from '@/components/admin/TemplateEditor'

export default async function AdminTemplatesPage() {
  return (
    <section className="admin-templates container">
      <h1>Message Templates</h1>
      <TemplateEditor />
    </section>
  )
}
