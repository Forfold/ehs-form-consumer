import { submissionToHistoryItem, type SubmissionForHistory } from './submissionUtils'

const base: SubmissionForHistory = {
  id: 'abc-123',
  processedAt: '2024-06-15T12:00:00.000Z',
  displayName: 'Acme Site',
  facilityName: 'Acme Facility',
  facilityAddress: '123 Main St',
  permitNumber: 'PERMIT-001',
  inspectionDate: '2024-06-15',
  inspectorName: 'Jane Smith',
  data: {},
  teams: [],
}

describe('submissionToHistoryItem', () => {
  it('maps id and processedAt', () => {
    const item = submissionToHistoryItem(base)
    expect(item.id).toBe('abc-123')
    expect(item.processedAt).toBe('2024-06-15T12:00:00.000Z')
  })

  it('uses facilityName from the dedicated column', () => {
    expect(submissionToHistoryItem(base).facilityName).toBe('Acme Facility')
  })

  it('uses permitNumber from the dedicated column', () => {
    expect(submissionToHistoryItem(base).permitNumber).toBe('PERMIT-001')
  })

  it('passes data through unchanged', () => {
    const data = { extra: 'value' }
    const item = submissionToHistoryItem({ ...base, data })
    expect(item.data).toBe(data)
  })

  it('passes teams through unchanged', () => {
    const teams = [{ id: 't1', name: 'Team A' }]
    const item = submissionToHistoryItem({ ...base, teams })
    expect(item.teams).toBe(teams)
  })
})
