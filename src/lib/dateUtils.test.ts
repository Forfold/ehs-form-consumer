import { isOverdue, formatTime } from './dateUtils'

describe('isOverdue', () => {
  it('returns true for a past date', () => {
    expect(isOverdue('2000-01-01')).toBe(true)
  })

  it('returns false for a future date', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    expect(isOverdue(future)).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isOverdue('')).toBe(false)
  })
})

describe('formatTime', () => {
  it('formats a valid ISO string', () => {
    const result = formatTime('2024-06-15T14:30:00.000Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns the original string when parsing fails', () => {
    expect(formatTime('not-a-date')).toBe('not-a-date')
  })
})
