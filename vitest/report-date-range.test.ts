import { describe, expect, it } from 'vitest'
import { getReportDateRange } from '@/lib/reports/date-range'

describe('getReportDateRange', () => {
  it('uses the custom range when provided', () => {
    const range = getReportDateRange({ period: 'custom', from: '2024-01-10', to: '2024-02-20' }, new Date(2024, 2, 15))

    expect(range.start.getFullYear()).toBe(2024)
    expect(range.start.getMonth()).toBe(0)
    expect(range.start.getDate()).toBe(10)
    expect(range.end.getFullYear()).toBe(2024)
    expect(range.end.getMonth()).toBe(1)
    expect(range.end.getDate()).toBe(20)
  })

  it('defaults to the current month when no period is supplied', () => {
    const range = getReportDateRange({}, new Date(2024, 2, 15))

    expect(range.start.getFullYear()).toBe(2024)
    expect(range.start.getMonth()).toBe(2)
    expect(range.start.getDate()).toBe(1)
    expect(range.end.getFullYear()).toBe(2024)
    expect(range.end.getMonth()).toBe(2)
    expect(range.end.getDate()).toBe(31)
  })
})
