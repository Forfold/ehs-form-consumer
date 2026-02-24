export function isOverdue(dueDate: string): boolean {
  return !!dueDate && new Date(dueDate) < new Date()
}

export function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
