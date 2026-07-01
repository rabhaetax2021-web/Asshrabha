export type ReportPeriod = 'current-month' | 'last-quarter' | 'last-month' | 'this-year' | 'last-year' | 'all-time' | 'custom'

export interface ReportDateRangeOptions {
  period?: ReportPeriod | string | null
  from?: string | null
  to?: string | null
}

export interface ReportDateRange {
  start: Date
  end: Date
  period: ReportPeriod | string
}

function parseDateInput(value?: string | null) {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function getReportDateRange(options: ReportDateRangeOptions = {}, referenceDate = new Date()): ReportDateRange {
  const period = options.period || 'current-month'
  const now = new Date(referenceDate)

  if (period === 'custom') {
    const start = parseDateInput(options.from) || new Date(now.getFullYear(), now.getMonth(), 1)
    const end = parseDateInput(options.to) || new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      start,
      end: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999),
      period,
    }
  }

  const start = new Date(now)
  const end = new Date(now)

  switch (period) {
    case 'last-quarter':
      start.setMonth(start.getMonth() - 2)
      start.setDate(1)
      end.setMonth(end.getMonth(), 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'last-month':
      start.setMonth(start.getMonth() - 1, 1)
      end.setMonth(end.getMonth(), 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'this-year':
      start.setMonth(0, 1)
      end.setFullYear(end.getFullYear(), 11, 31)
      end.setHours(23, 59, 59, 999)
      break
    case 'last-year':
      start.setFullYear(start.getFullYear() - 1, 0, 1)
      end.setFullYear(end.getFullYear() - 1, 11, 31)
      end.setHours(23, 59, 59, 999)
      break
    case 'all-time':
      start.setFullYear(1970, 0, 1)
      end.setHours(23, 59, 59, 999)
      break
    case 'current-month':
    default:
      start.setDate(1)
      end.setMonth(end.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      break
  }

  return { start, end, period }
}
