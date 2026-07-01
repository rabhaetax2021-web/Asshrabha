'use client'

import Button from '@/components/ui/Button'

interface Props {
  label: string
  className?: string
}

export default function PrintReportButton({ label, className }: Props) {
  const handlePrint = () => {
    const printClass = 'print-report-only'
    const removePrintClass = () => {
      document.body.classList.remove(printClass)
      window.removeEventListener('afterprint', removePrintClass)
    }

    document.body.classList.add(printClass)
    window.addEventListener('afterprint', removePrintClass)
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print()
      }, 0)
    })
  }

  return (
    <Button type="button" variant="ghost" className={className} onClick={handlePrint}>
      {label}
    </Button>
  )
}
