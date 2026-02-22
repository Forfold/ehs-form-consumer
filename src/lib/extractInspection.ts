export async function extractInspection(file: File) {
  const base64 = await fileToBase64(file)

  const res = await fetch('/api/extract', { // relative URL — works locally and in prod
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mediaType: 'application/pdf' })
  })

  if (!res.ok) throw new Error('Extraction failed')
  return res.json()
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}