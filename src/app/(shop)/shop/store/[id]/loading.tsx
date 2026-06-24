export default function Loading() {
  return (
    <div className="container" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
      <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>⏳</div>
      <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>Loading store...</h3>
      <p style={{ color: 'var(--text-muted)' }}>Fetching provider information and products.</p>
    </div>
  )
}
