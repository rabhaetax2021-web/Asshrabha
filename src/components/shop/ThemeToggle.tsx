"use client"

import { useTheme } from '@/components/ui/ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      type="button"
      className="btn btn-sm btn-ghost"
      aria-label="Toggle theme"
      aria-pressed={theme === 'dark'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
