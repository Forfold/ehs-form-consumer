import { render, screen, fireEvent } from '@testing-library/react'
import PdfSection from '../PdfSection'

// Mock heavy child components — their own tests cover their behavior.
jest.mock('../PdfViewer', () => ({
  __esModule: true,
  default: function MockPdfViewer({ url }: { url: string }) {
    return <div data-testid="pdf-viewer" data-url={url} />
  },
}))

jest.mock('../PdfUploadButton', () => ({
  __esModule: true,
  default: function MockPdfUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
    return (
      <button data-testid="pdf-upload-button" onClick={() => onUploaded('https://blob.vercel.com/new.pdf')}>
        Attach original PDF
      </button>
    )
  },
}))

describe('PdfSection', () => {
  it('shows the empty state message when no PDF is attached', () => {
    render(<PdfSection submissionId="sub-1" initialPdfUrl={null} />)

    expect(screen.getByText('No original PDF attached.')).toBeInTheDocument()
  })

  it('shows the upload button when no PDF is attached', () => {
    render(<PdfSection submissionId="sub-1" initialPdfUrl={null} />)

    expect(screen.getByTestId('pdf-upload-button')).toBeInTheDocument()
    expect(screen.queryByTestId('pdf-viewer')).not.toBeInTheDocument()
  })

  it('renders the PDF viewer when an initial URL is provided', () => {
    render(<PdfSection submissionId="sub-1" initialPdfUrl="https://blob.vercel.com/form.pdf" />)

    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
    expect(screen.getByTestId('pdf-viewer')).toHaveAttribute('data-url', 'https://blob.vercel.com/form.pdf')
    expect(screen.queryByText('No original PDF attached.')).not.toBeInTheDocument()
  })

  it('shows the replace button alongside the viewer when a PDF is present', () => {
    render(<PdfSection submissionId="sub-1" initialPdfUrl="https://blob.vercel.com/form.pdf" />)

    expect(screen.getByTestId('pdf-upload-button')).toBeInTheDocument()
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
  })

  it('switches to the viewer after a PDF is uploaded', async () => {
    render(<PdfSection submissionId="sub-1" initialPdfUrl={null} />)

    expect(screen.queryByTestId('pdf-viewer')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('pdf-upload-button'))

    expect(await screen.findByTestId('pdf-viewer')).toBeInTheDocument()
    expect(screen.getByTestId('pdf-viewer')).toHaveAttribute('data-url', 'https://blob.vercel.com/new.pdf')
  })

  it('updates the viewer URL when a replacement PDF is uploaded', async () => {
    render(<PdfSection submissionId="sub-1" initialPdfUrl="https://blob.vercel.com/old.pdf" />)

    fireEvent.click(screen.getByTestId('pdf-upload-button'))

    expect(await screen.findByTestId('pdf-viewer')).toHaveAttribute('data-url', 'https://blob.vercel.com/new.pdf')
  })
})
