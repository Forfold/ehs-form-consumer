'use client'

import { Fragment } from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import type { ChecklistItem, CorrectiveAction, InspectionData, OverallStatus } from '@/lib/types/inspection'

interface Props {
  data: InspectionData
  onChange: (data: InspectionData) => void
}

function deriveOverallStatus(items: ChecklistItem[]): OverallStatus {
  if (items.some(i => i.status === 'fail')) return 'non-compliant'
  if (items.every(i => i.status === 'pass' || i.status === 'na')) return 'compliant'
  return 'needs-attention'
}

export default function PostReviewStep({ data, onChange }: Props) {
  function setField<K extends keyof InspectionData>(key: K, value: InspectionData[K]) {
    onChange({ ...data, [key]: value })
  }

  // Checklist items
  function setChecklistItem(index: number, patch: Partial<ChecklistItem>) {
    const updated = data.checklistItems.map((item, i) => i === index ? { ...item, ...patch } : item)
    onChange({ ...data, checklistItems: updated, overallStatus: deriveOverallStatus(updated) })
  }
  function addChecklistItem() {
    const updated = [...data.checklistItems, { section: '', description: '', status: 'na' as const, notes: '' }]
    onChange({ ...data, checklistItems: updated, overallStatus: deriveOverallStatus(updated) })
  }
  function removeChecklistItem(index: number) {
    const updated = data.checklistItems.filter((_, i) => i !== index)
    onChange({ ...data, checklistItems: updated, overallStatus: deriveOverallStatus(updated) })
  }

  // Corrective actions
  function setAction(index: number, patch: Partial<CorrectiveAction>) {
    onChange({ ...data, correctiveActions: data.correctiveActions.map((a, i) => i === index ? { ...a, ...patch } : a) })
  }
  function addAction() {
    onChange({ ...data, correctiveActions: [...data.correctiveActions, { description: '', dueDate: '', completed: false }] })
  }
  function removeAction(index: number) {
    onChange({ ...data, correctiveActions: data.correctiveActions.filter((_, i) => i !== index) })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Facility info */}
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.08em' }}>
          Facility Information
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
          <TextField label="Facility Name"    size="small" value={data.facilityName    ?? ''} onChange={e => setField('facilityName',    e.target.value)} />
          <TextField label="Permit Number"    size="small" value={data.permitNumber    ?? ''} onChange={e => setField('permitNumber',    e.target.value)} />
          <TextField label="Inspection Date"  size="small" value={data.inspectionDate  ?? ''} onChange={e => setField('inspectionDate',  e.target.value)} />
          <TextField label="Inspector"        size="small" value={data.inspectorName   ?? ''} onChange={e => setField('inspectorName',   e.target.value)} />
        </Box>
      </Box>

      <Divider />

      {/* Overall status + summary */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl size="small" sx={{ maxWidth: 260 }}>
          <InputLabel>Overall Status</InputLabel>
          <Select
            label="Overall Status"
            value={data.overallStatus}
            onChange={e => setField('overallStatus', e.target.value as OverallStatus)}
          >
            <MenuItem value="compliant">Compliant</MenuItem>
            <MenuItem value="non-compliant">Non-Compliant</MenuItem>
            <MenuItem value="needs-attention">Needs Attention</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Summary"
          multiline
          minRows={2}
          size="small"
          value={data.summary ?? ''}
          onChange={e => setField('summary', e.target.value)}
        />
      </Box>

      <Divider />

      {/* Checklist items */}
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.08em' }}>
          Inspection Items
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {data.checklistItems.map((item, i) => (
            <Fragment key={i}>
              {i > 0 && <Divider />}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <TextField
                  label="Section"
                  size="small"
                  value={item.section ?? ''}
                  onChange={e => setChecklistItem(i, { section: e.target.value })}
                />
                <FormControl size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={item.status}
                    onChange={e => setChecklistItem(i, { status: e.target.value as ChecklistItem['status'] })}
                  >
                    <MenuItem value="pass">Pass</MenuItem>
                    <MenuItem value="fail">Fail</MenuItem>
                    <MenuItem value="na">N/A</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  label="Description"
                  size="small"
                  value={item.description}
                  onChange={e => setChecklistItem(i, { description: e.target.value })}
                />
                <TextField
                  label="Notes"
                  size="small"
                  value={item.notes}
                  onChange={e => setChecklistItem(i, { notes: e.target.value })}
                />
                <IconButton size="small" onClick={() => removeChecklistItem(i)} sx={{ mt: 0.5 }}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Fragment>
          ))}
        </Box>
        <Button size="small" startIcon={<AddIcon />} onClick={addChecklistItem} sx={{ mt: 1.5 }}>
          Add Item
        </Button>
      </Box>

      <Divider />

      {/* Corrective actions */}
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.08em' }}>
          Corrective Actions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
          {data.correctiveActions.map((action, i) => (
            <Fragment key={i}>
              {i > 0 && <Divider />}
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 140px auto auto', gap: 1, alignItems: 'center' }}>
                <TextField
                  label="Description"
                  size="small"
                  value={action.description}
                  onChange={e => setAction(i, { description: e.target.value })}
                />
                <TextField
                  label="Due Date"
                  size="small"
                  value={action.dueDate}
                  onChange={e => setAction(i, { dueDate: e.target.value })}
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={action.completed} onChange={e => setAction(i, { completed: e.target.checked })} />}
                  label={<Typography variant="body2">Done</Typography>}
                  sx={{ mx: 0 }}
                />
                <IconButton size="small" onClick={() => removeAction(i)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Fragment>
          ))}
        </Box>
        <Button size="small" startIcon={<AddIcon />} onClick={addAction} sx={{ mt: 1.5 }}>
          Add Action
        </Button>
      </Box>

    </Box>
  )
}
