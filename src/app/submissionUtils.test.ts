import { submissionToHistoryItem, type SubmissionForHistory } from './submissionUtils'

const base: SubmissionForHistory = {
  id: 'abc-123',
  processedAt: '2024-06-15T12:00:00.000Z',
  displayName: 'Acme Site',
  data: {},
  teams: [],
}

describe('submissionToHistoryItem', () => {
  it('prefers facilityName from data over displayName', () => {
    const s = { ...base, data: { facilityName: 'Data Facility' } }
    expect(submissionToHistoryItem(s).facilityName).toBe('Data Facility')
  })

  it('falls back to displayName when facilityName absent from data', () => {
    expect(submissionToHistoryItem(base).facilityName).toBe('Acme Site')
  })

  it('returns null when neither facilityName nor displayName available', () => {
    const s = { ...base, displayName: null }
    expect(submissionToHistoryItem(s).facilityName).toBeNull()
  })

  it('falls back to empty string when permitNumber absent', () => {
    expect(submissionToHistoryItem(base).permitNumber).toBe('')
  })
})
