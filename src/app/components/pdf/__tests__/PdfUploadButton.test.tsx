import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PdfUploadButton from '../PdfUploadButton'
import { uploadPdf } from '@/lib/uploadPdf'
import { gqlFetch } from '@/lib/graphql/client'

jest.mock('@/lib/uploadPdf')
jest.mock('@/lib/graphql/client')

const mockUploadPdf = uploadPdf as jest.MockedFunction<typeof uploadPdf>
const mockGqlFetch = gqlFetch as jest.MockedFunction<typeof gqlFetch>

function selectFile(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })
}

const PDF_FILE = new File(['%PDF-1.4'], 'form.pdf', { type: 'application/pdf' })
const BLOB_URL = 'https://blob.vercel.com/submissions/sub-1.pdf'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PdfUploadButton', () => {
  it('renders the attach button in its idle state', () => {
    render(<PdfUploadButton submissionId="sub-1" onUploaded={jest.fn()} />)

    const btn = screen.getByRole('button', { name: /attach original pdf/i })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })

  it('calls uploadPdf with the file and submissionId', async () => {
    mockUploadPdf.mockResolvedValue(BLOB_URL)
    mockGqlFetch.mockResolvedValue({})

    render(<PdfUploadButton submissionId="sub-1" onUploaded={jest.fn()} />)
    selectFile(PDF_FILE)

    await waitFor(() => expect(mockUploadPdf).toHaveBeenCalledWith(PDF_FILE, 'sub-1'))
  })

  it('calls attachPdfToSubmission mutation with the returned URL', async () => {
    mockUploadPdf.mockResolvedValue(BLOB_URL)
    mockGqlFetch.mockResolvedValue({})

    render(<PdfUploadButton submissionId="sub-1" onUploaded={jest.fn()} />)
    selectFile(PDF_FILE)

    await waitFor(() =>
      expect(mockGqlFetch).toHaveBeenCalledWith(
        expect.stringContaining('attachPdfToSubmission'),
        { id: 'sub-1', pdfStorageKey: BLOB_URL },
      ),
    )
  })

  it('fires onUploaded with the blob URL on success', async () => {
    mockUploadPdf.mockResolvedValue(BLOB_URL)
    mockGqlFetch.mockResolvedValue({})

    const onUploaded = jest.fn()
    render(<PdfUploadButton submissionId="sub-1" onUploaded={onUploaded} />)
    selectFile(PDF_FILE)

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(BLOB_URL))
  })

  it('disables the button and shows loading text while uploading', async () => {
    let resolve!: (url: string) => void
    mockUploadPdf.mockReturnValue(
      new Promise((r) => {
        resolve = r
      }),
    )
    mockGqlFetch.mockResolvedValue({})

    render(<PdfUploadButton submissionId="sub-1" onUploaded={jest.fn()} />)
    selectFile(PDF_FILE)

    const btn = await screen.findByRole('button', { name: /uploading/i })
    expect(btn).toBeDisabled()

    resolve(BLOB_URL)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /attach original pdf/i }),
      ).not.toBeDisabled(),
    )
  })

  it('re-enables the button after an upload error', async () => {
    mockUploadPdf.mockRejectedValue(new Error('network error'))

    render(<PdfUploadButton submissionId="sub-1" onUploaded={jest.fn()} />)
    selectFile(PDF_FILE)

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /attach original pdf/i }),
      ).not.toBeDisabled(),
    )
  })
})
