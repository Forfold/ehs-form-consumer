'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EditMetaBadge from './EditMetaBadge'
import type { ChecklistStatus, EditMeta, InspectionData } from '@/lib/types/inspection'

export type { InspectionData }

interface Props {
  data: InspectionData
  currentUserName?: string
  onEdit?: (updated: InspectionData) => void
}

const bmpChipProps: Record<ChecklistStatus, { label: string; color: 'success' | 'error' | 'default' }> = {
  pass: { label: 'Pass', color: 'success' },
  fail: { label: 'Fail', color: 'error'   },
  na:   { label: 'N/A',  color: 'default' },
}

// ── Edit type chip selector ────────────────────────────────────────────────────
function EditTypeSelector({
  value,
  onChange,
}: {
  value: EditMeta['editType'] | null
  onChange: (v: EditMeta['editType']) => void
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        Edit type:
      </Typography>
      {(['correction', 'update'] as const).map((t) => (
        <Chip
          key={t}
          label={t === 'correction' ? 'Correction' : 'Update'}
          size="small"
          color={t === 'correction' ? 'warning' : 'success'}
          variant={value === t ? 'filled' : 'outlined'}
          onClick={() => onChange(t)}
          sx={{ cursor: 'pointer', fontWeight: value === t ? 700 : 400 }}
        />
      ))}
    </Box>
  )
}

// ── Section heading ────────────────────────────────────────────────────────────
function SectionHeading({ children, large }: { children: React.ReactNode; large?: boolean }) {
  return (
    <Typography
      variant="overline"
      sx={{
        color: 'text.secondary',
        fontWeight: 600,
        letterSpacing: '0.08em',
        display: 'block',
        mb: 1.5,
        fontSize: large ? '0.8rem' : undefined,
      }}
    >
      {children}
    </Typography>
  )
}

// ── Facility field ─────────────────────────────────────────────────────────────
function FacilityField({
  label,
  fieldKey,
  value,
  editMeta,
  onSave,
}: {
  label: string
  fieldKey: string
  value: string | undefined
  editMeta: EditMeta | undefined
  onSave?: (newValue: string, meta: EditMeta) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [editType, setEditType] = useState<EditMeta['editType'] | null>(null)

  function startEdit() {
    setDraft(value ?? '')
    setEditType(null)
    setEditing(true)
  }

  function cancel() { setEditing(false) }

  function save() {
    if (!editType || !onSave) return
    onSave(draft, {
      editType,
      editedBy: '',  // filled in by parent via currentUserName
      editedAt: new Date().toISOString(),
    })
    setEditing(false)
  }

  return (
    <Box key={fieldKey}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
      >
        {label}
      </Typography>

      {editing ? (
        <Box sx={{ mt: 0.5 }}>
          <TextField
            size="small"
            fullWidth
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Escape') cancel() }}
          />
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <EditTypeSelector value={editType} onChange={setEditType} />
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={cancel}><CloseIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="primary" onClick={save} disabled={!editType}>
                <CheckIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1">{value || '—'}</Typography>
            {editMeta && <EditMetaBadge meta={editMeta} />}
          </Box>
          {onSave && (
            <IconButton size="small" onClick={startEdit} sx={{ mt: -0.25, opacity: 0.4, '&:hover': { opacity: 1 } }}>
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function InspectionResults({ data, currentUserName, onEdit }: Props) {
  const canEdit = !!onEdit

  // Fall back to legacy 'bmpItems' key for submissions saved before the rename
  const bmpItems = (data.checklistItems ?? (data as unknown as Record<string, unknown>).bmpItems ?? []) as InspectionData['checklistItems']
  const correctiveActions = data.correctiveActions ?? []
  const pendingCount = correctiveActions.filter(a => !a.completed).length
  const deadletterCount = data.deadletter ? Object.keys(data.deadletter).length : 0

  // Track which checklist row / action is expanded for editing
  const [expandedItem, setExpandedItem]     = useState<number | null>(null)
  const [expandedAction, setExpandedAction] = useState<number | null>(null)
  const [addingItem, setAddingItem]         = useState(false)
  const [addingAction, setAddingAction]     = useState(false)
  const [resolvingKey, setResolvingKey]     = useState<string | null>(null)
  const [resolveValue, setResolveValue]     = useState('')
  const [resolveEditType, setResolveEditType] = useState<EditMeta['editType'] | null>(null)

  function makeMeta(editType: EditMeta['editType']): EditMeta {
    return { editedBy: currentUserName ?? 'Unknown', editedAt: new Date().toISOString(), editType }
  }

  // ── Facility field save ──────────────────────────────────────────────────────
  function saveFacilityField(fieldKey: string, newValue: string, meta: EditMeta) {
    if (!onEdit) return
    onEdit({
      ...data,
      [fieldKey]: newValue,
      fieldEdits: { ...data.fieldEdits, [fieldKey]: { ...meta, editedBy: currentUserName ?? 'Unknown' } },
    })
  }

  // ── Checklist item edit ──────────────────────────────────────────────────────
  function ChecklistEditRow({ index }: { index: number }) {
    const item = bmpItems[index]
    const [desc, setDesc]       = useState(item.description)
    const [status, setStatus]   = useState<ChecklistStatus>(item.status)
    const [notes, setNotes]     = useState(item.notes)
    const [editType, setEditType] = useState<EditMeta['editType'] | null>(null)

    function save() {
      if (!editType || !onEdit) return
      const updated = bmpItems.map((it, i) =>
        i === index ? { ...it, description: desc, status, notes, editMeta: makeMeta(editType) } : it
      )
      onEdit({ ...data, checklistItems: updated })
      setExpandedItem(null)
    }

    return (
      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="Description" size="small" fullWidth multiline
            value={desc} onChange={(e) => setDesc(e.target.value)} autoFocus
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Status:</Typography>
            <ToggleButtonGroup
              exclusive size="small" value={status}
              onChange={(_, v) => { if (v) setStatus(v) }}
            >
              <ToggleButton value="pass" color="success" sx={{ px: 1.5 }}>Pass</ToggleButton>
              <ToggleButton value="fail" color="error"   sx={{ px: 1.5 }}>Fail</ToggleButton>
              <ToggleButton value="na"                   sx={{ px: 1.5 }}>N/A</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <TextField
            label="Notes" size="small" fullWidth multiline
            value={notes} onChange={(e) => setNotes(e.target.value)}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <EditTypeSelector value={editType} onChange={setEditType} />
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={() => setExpandedItem(null)}><CloseIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="primary" onClick={save} disabled={!editType}>
                <CheckIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  // ── New checklist item ───────────────────────────────────────────────────────
  function NewChecklistItemForm() {
    const [desc, setDesc]         = useState('')
    const [status, setStatus]     = useState<ChecklistStatus>('pass')
    const [notes, setNotes]       = useState('')
    const [editType, setEditType] = useState<EditMeta['editType'] | null>(null)

    function save() {
      if (!desc.trim() || !editType || !onEdit) return
      onEdit({
        ...data,
        checklistItems: [...bmpItems, { description: desc, status, notes, editMeta: makeMeta(editType) }],
      })
      setAddingItem(false)
    }

    return (
      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, mt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="Description" size="small" fullWidth multiline
            value={desc} onChange={(e) => setDesc(e.target.value)} autoFocus
            placeholder="Describe the inspection item"
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Status:</Typography>
            <ToggleButtonGroup
              exclusive size="small" value={status}
              onChange={(_, v) => { if (v) setStatus(v) }}
            >
              <ToggleButton value="pass" color="success" sx={{ px: 1.5 }}>Pass</ToggleButton>
              <ToggleButton value="fail" color="error"   sx={{ px: 1.5 }}>Fail</ToggleButton>
              <ToggleButton value="na"                   sx={{ px: 1.5 }}>N/A</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <TextField
            label="Notes" size="small" fullWidth multiline
            value={notes} onChange={(e) => setNotes(e.target.value)}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <EditTypeSelector value={editType} onChange={setEditType} />
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={() => setAddingItem(false)}><CloseIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="primary" onClick={save} disabled={!editType || !desc.trim()}>
                <CheckIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  // ── New corrective action ────────────────────────────────────────────────────
  function NewActionForm() {
    const [desc, setDesc]           = useState('')
    const [dueDate, setDueDate]     = useState('')
    const [completed, setCompleted] = useState(false)
    const [editType, setEditType]   = useState<EditMeta['editType'] | null>(null)

    function save() {
      if (!desc.trim() || !editType || !onEdit) return
      onEdit({
        ...data,
        correctiveActions: [...correctiveActions, { description: desc, dueDate, completed, editMeta: makeMeta(editType) }],
      })
      setAddingAction(false)
    }

    return (
      <Box sx={{ px: 2, pb: 2, pt: 1.5, bgcolor: 'action.hover', borderRadius: 1, mt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="Description" size="small" fullWidth multiline
            value={desc} onChange={(e) => setDesc(e.target.value)} autoFocus
            placeholder="Describe the corrective action"
          />
          <TextField
            label="Due date" size="small"
            value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          />
          <FormControlLabel
            label={<Typography variant="body2">Completed</Typography>}
            control={<Checkbox size="small" checked={completed} onChange={(e) => setCompleted(e.target.checked)} />}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <EditTypeSelector value={editType} onChange={setEditType} />
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={() => setAddingAction(false)}><CloseIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="primary" onClick={save} disabled={!editType || !desc.trim()}>
                <CheckIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  // ── Corrective action edit ───────────────────────────────────────────────────
  function ActionEditRow({ index }: { index: number }) {
    const action = correctiveActions[index]
    const [desc, setDesc]           = useState(action.description)
    const [dueDate, setDueDate]     = useState(action.dueDate)
    const [completed, setCompleted] = useState(action.completed)
    const [editType, setEditType]   = useState<EditMeta['editType'] | null>(null)

    function save() {
      if (!editType || !onEdit) return
      const updated = correctiveActions.map((a, i) =>
        i === index ? { ...a, description: desc, dueDate, completed, editMeta: makeMeta(editType) } : a
      )
      onEdit({ ...data, correctiveActions: updated })
      setExpandedAction(null)
    }

    return (
      <Box sx={{ px: 2, pb: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1.5 }}>
          <TextField
            label="Description" size="small" fullWidth multiline
            value={desc} onChange={(e) => setDesc(e.target.value)} autoFocus
          />
          <TextField
            label="Due date" size="small"
            value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          />
          <FormControlLabel
            label={<Typography variant="body2">Completed</Typography>}
            control={<Checkbox size="small" checked={completed} onChange={(e) => setCompleted(e.target.checked)} />}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <EditTypeSelector value={editType} onChange={setEditType} />
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={() => setExpandedAction(null)}><CloseIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="primary" onClick={save} disabled={!editType}>
                <CheckIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Facility info */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <SectionHeading large>Facility Information</SectionHeading>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {([
            ['facilityName',   'Facility Name'],
            ['permitNumber',   'Permit Number'],
            ['inspectionDate', 'Inspection Date'],
            ['inspectorName',  'Inspector'],
          ] as const).map(([key, label]) => (
            <FacilityField
              key={key}
              label={label}
              fieldKey={key}
              value={data[key] as string | undefined}
              editMeta={data.fieldEdits?.[key]}
              onSave={canEdit ? (v, m) => saveFacilityField(key, v, m) : undefined}
            />
          ))}
        </Box>
      </Paper>

      {/* Summary */}
      {data.summary && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <SectionHeading>Summary</SectionHeading>
          <FacilityField
            label=""
            fieldKey="summary"
            value={data.summary}
            editMeta={data.fieldEdits?.summary}
            onSave={canEdit ? (v, m) => saveFacilityField('summary', v, m) : undefined}
          />
        </Paper>
      )}

      {/* Corrective actions */}
      {(correctiveActions.length > 0 || canEdit) && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SectionHeading>Corrective Actions</SectionHeading>
            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} pending`}
                color="warning"
                size="small"
                sx={{ mb: 1.5 }}
              />
            )}
          </Box>
          <List disablePadding>
            {correctiveActions.map((action, i) => (
              <Box key={i}>
                {i > 0 && <Divider component="li" />}
                <ListItem alignItems="flex-start" disableGutters sx={{ py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                    {action.completed
                      ? <CheckCircleIcon color="success" />
                      : <WarningAmberIcon color="warning" />
                    }
                  </ListItemIcon>
                  <ListItemText
                    primary={action.description}
                    secondary={
                      <>
                        {`Due: ${action.dueDate || 'N/A'} · ${action.completed ? 'Completed' : 'Pending'}`}
                        {action.editMeta && <EditMetaBadge meta={action.editMeta} />}
                      </>
                    }
                    slotProps={{
                      primary: { variant: 'body2', fontWeight: 500 } as object,
                      secondary: { variant: 'caption', component: 'div' } as object,
                    }}
                  />
                  {canEdit && (
                    <IconButton
                      size="small"
                      onClick={() => setExpandedAction(expandedAction === i ? null : i)}
                      sx={{ ml: 1, mt: 0.5, opacity: 0.4, '&:hover': { opacity: 1 } }}
                    >
                      <EditIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  )}
                </ListItem>
                <Collapse in={expandedAction === i} unmountOnExit>
                  <ActionEditRow index={i} />
                </Collapse>
              </Box>
            ))}
          </List>
          {canEdit && (
            <>
              <Collapse in={addingAction} unmountOnExit>
                <NewActionForm />
              </Collapse>
              {!addingAction && (
                <Button
                  size="small" startIcon={<AddIcon />}
                  onClick={() => setAddingAction(true)}
                  sx={{ mt: correctiveActions.length > 0 ? 1 : 0 }}
                >
                  Add corrective action
                </Button>
              )}
            </>
          )}
        </Paper>
      )}

      {/* BMP / checklist items */}
      {(bmpItems.length > 0 || canEdit) && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <SectionHeading>Inspection Items</SectionHeading>
          {bmpItems.length > 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 90 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                    {canEdit && <TableCell sx={{ width: 40 }} />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bmpItems.map((item, i) => {
                    const chip = bmpChipProps[item.status] ?? { label: item.status, color: 'default' as const }
                    return (
                      <>
                        <TableRow
                          key={`row-${i}`}
                          sx={{ bgcolor: item.status === 'fail' ? 'error.50' : undefined }}
                        >
                          <TableCell>
                            {item.description}
                            {item.editMeta && <EditMetaBadge meta={item.editMeta} />}
                          </TableCell>
                          <TableCell>
                            <Chip label={chip.label} color={chip.color} size="small" />
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>{item.notes || '—'}</TableCell>
                          {canEdit && (
                            <TableCell sx={{ p: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => setExpandedItem(expandedItem === i ? null : i)}
                                sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}
                              >
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                        {canEdit && (
                          <TableRow key={`edit-${i}`}>
                            <TableCell colSpan={4} sx={{ p: 0, border: 0 }}>
                              <Collapse in={expandedItem === i} unmountOnExit>
                                <ChecklistEditRow index={i} />
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {canEdit && (
            <>
              <Collapse in={addingItem} unmountOnExit>
                <NewChecklistItemForm />
              </Collapse>
              {!addingItem && (
                <Button
                  size="small" startIcon={<AddIcon />}
                  onClick={() => setAddingItem(true)}
                  sx={{ mt: bmpItems.length > 0 ? 1 : 0 }}
                >
                  Add inspection item
                </Button>
              )}
            </>
          )}
        </Paper>
      )}

      {/* Deadletter */}
      {(deadletterCount > 0 || (data.resolvedDeadletterFields?.length ?? 0) > 0) && (
        <Paper id="deadletter-section" variant="outlined" sx={{ p: 2 }}>
          <SectionHeading>Unprocessable Fields</SectionHeading>

          {/* Unresolved keys */}
          {deadletterCount > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.entries(data.deadletter ?? {}).map(([key, val]) => (
                <Box key={key}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box
                      component="pre"
                      sx={{
                        flex: 1, m: 0, p: 1.5,
                        bgcolor: 'action.hover', borderRadius: 1,
                        fontSize: 12, color: 'text.secondary', overflowX: 'auto',
                        fontFamily: 'var(--font-geist-mono), monospace',
                      }}
                    >
                      {key}: {JSON.stringify(val, null, 2)}
                    </Box>
                    {canEdit && resolvingKey !== key && (
                      <Button
                        size="small" variant="outlined"
                        onClick={() => {
                          setResolvingKey(key)
                          setResolveValue(typeof val === 'string' ? val : '')
                          setResolveEditType(null)
                        }}
                        sx={{ whiteSpace: 'nowrap', mt: 0.25 }}
                      >
                        Mark resolved
                      </Button>
                    )}
                  </Box>
                  <Collapse in={resolvingKey === key} unmountOnExit>
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <TextField
                        label="Resolved value" size="small" fullWidth
                        value={resolveValue}
                        onChange={(e) => setResolveValue(e.target.value)}
                        autoFocus
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <EditTypeSelector value={resolveEditType} onChange={setResolveEditType} />
                        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => setResolvingKey(null)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small" color="primary"
                            disabled={!resolveEditType}
                            onClick={() => {
                              if (!resolveEditType || !onEdit) return
                              const { [key]: _removed, ...remaining } = data.deadletter ?? {}
                              onEdit({
                                ...data,
                                deadletter: Object.keys(remaining).length > 0 ? remaining : undefined,
                                resolvedDeadletterFields: [
                                  ...(data.resolvedDeadletterFields ?? []),
                                  { key, value: resolveValue, ...makeMeta(resolveEditType) },
                                ],
                              })
                              setResolvingKey(null)
                            }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Box>
          )}

          {/* Resolved fields */}
          {(data.resolvedDeadletterFields?.length ?? 0) > 0 && (
            <Box sx={{ mt: deadletterCount > 0 ? 2 : 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Resolved
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.75 }}>
                {data.resolvedDeadletterFields!.map((f, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box
                      component="pre"
                      sx={{
                        flex: 1, m: 0, p: 1.5,
                        bgcolor: 'success.50', borderRadius: 1,
                        fontSize: 12, color: 'text.secondary', overflowX: 'auto',
                        fontFamily: 'var(--font-geist-mono), monospace',
                      }}
                    >
                      {f.key}: {f.value}
                    </Box>
                    <Box sx={{ pt: 0.5 }}>
                      <EditMetaBadge meta={f} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}

    </Box>
  )
}
