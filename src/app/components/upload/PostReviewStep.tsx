'use client'

import { Fragment, useState } from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import RemoveIcon from '@mui/icons-material/Remove'
import type {
  ChecklistItem,
  CorrectiveAction,
  InspectionData,
  OverallStatus,
} from '@/lib/types/inspection'

interface Props {
  data: InspectionData
  onChange: (data: InspectionData) => void
}

function deriveOverallStatus(items: ChecklistItem[]): OverallStatus {
  if (items.some((i) => i.status === 'fail')) return 'non-compliant'
  if (items.every((i) => i.status === 'pass' || i.status === 'na')) return 'compliant'
  return 'needs-attention'
}

function uniqueSections(items: ChecklistItem[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of items) {
    const s = item.section?.trim()
    if (s && !seen.has(s)) {
      seen.add(s)
      result.push(s)
    }
  }
  return result
}

export default function PostReviewStep({ data, onChange }: Props) {
  const [sections, setSections] = useState<string[]>(() =>
    uniqueSections(data.checklistItems),
  )
  const [newSection, setNewSection] = useState('')

  function setField<K extends keyof InspectionData>(
    key: K,
    value: InspectionData[K],
  ) {
    onChange({ ...data, [key]: value })
  }

  // Section management
  function commitNewSection() {
    const trimmed = newSection.trim()
    if (trimmed && !sections.includes(trimmed))
      setSections((prev) => [...prev, trimmed])
    setNewSection('')
  }

  // Checklist items
  function setChecklistItem(index: number, patch: Partial<ChecklistItem>) {
    const updated = data.checklistItems.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    )
    onChange({
      ...data,
      checklistItems: updated,
      overallStatus: deriveOverallStatus(updated),
    })
  }
  function addChecklistItem() {
    const updated = [
      ...data.checklistItems,
      {
        section: sections[0] ?? '',
        description: '',
        status: 'na' as const,
        notes: '',
      },
    ]
    onChange({
      ...data,
      checklistItems: updated,
      overallStatus: deriveOverallStatus(updated),
    })
  }
  function removeChecklistItem(index: number) {
    const updated = data.checklistItems.filter((_, i) => i !== index)
    onChange({
      ...data,
      checklistItems: updated,
      overallStatus: deriveOverallStatus(updated),
    })
  }

  // Corrective actions
  function setAction(index: number, patch: Partial<CorrectiveAction>) {
    onChange({
      ...data,
      correctiveActions: data.correctiveActions.map((a, i) =>
        i === index ? { ...a, ...patch } : a,
      ),
    })
  }
  function addAction() {
    onChange({
      ...data,
      correctiveActions: [
        ...data.correctiveActions,
        { description: '', dueDate: '', completed: false },
      ],
    })
  }
  function removeAction(index: number) {
    onChange({
      ...data,
      correctiveActions: data.correctiveActions.filter((_, i) => i !== index),
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Facility info */}
      <Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: '0.08em' }}
        >
          Facility Information
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mt: 1,
          }}
        >
          <TextField
            label="Facility Name"
            size="small"
            value={data.facilityName ?? ''}
            onChange={(e) => setField('facilityName', e.target.value)}
          />
          <TextField
            label="Permit Number"
            size="small"
            value={data.permitNumber ?? ''}
            onChange={(e) => setField('permitNumber', e.target.value)}
          />
          <TextField
            label="Inspection Date"
            size="small"
            value={data.inspectionDate ?? ''}
            onChange={(e) => setField('inspectionDate', e.target.value)}
          />
          <TextField
            label="Inspector"
            size="small"
            value={data.inspectorName ?? ''}
            onChange={(e) => setField('inspectorName', e.target.value)}
          />
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
            onChange={(e) =>
              setField('overallStatus', e.target.value as OverallStatus)
            }
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
          onChange={(e) => setField('summary', e.target.value)}
        />
      </Box>

      <Divider />

      {/* Checklist items */}
      <Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: '0.08em' }}
        >
          Inspection Items
        </Typography>

        {/* Section master list */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mt: 1,
            mb: 2,
            alignItems: 'center',
          }}
        >
          {sections.map((s) => (
            <Chip
              key={s}
              label={s}
              size="small"
              onDelete={() => setSections((prev) => prev.filter((x) => x !== s))}
            />
          ))}
          <TextField
            size="small"
            placeholder="Add section…"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitNewSection()
              }
            }}
            sx={{ width: 180 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      edge="end"
                      onClick={commitNewSection}
                      disabled={!newSection.trim()}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {/* Items */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {data.checklistItems.map((item, i) => {
            // Include item's current section even if removed from master list
            const currentSection = item.section?.trim() ?? ''
            const sectionOptions =
              currentSection && !sections.includes(currentSection)
                ? [...sections, currentSection]
                : sections

            return (
              <Box
                key={i}
                sx={{
                  border: '2px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1.5,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                {/* Section dropdown + delete */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Section</InputLabel>
                    <Select
                      label="Section"
                      value={currentSection}
                      onChange={(e) =>
                        setChecklistItem(i, { section: e.target.value })
                      }
                    >
                      {sectionOptions.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <IconButton
                    size="small"
                    onClick={() => removeChecklistItem(i)}
                    sx={{ flexShrink: 0, color: 'text.secondary' }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Description */}
                <TextField
                  label="Description"
                  size="small"
                  value={item.description}
                  onChange={(e) =>
                    setChecklistItem(i, { description: e.target.value })
                  }
                />

                {/* Status toggle */}
                <ToggleButtonGroup
                  value={item.status}
                  exclusive
                  onChange={(_, val) => {
                    if (val !== null)
                      setChecklistItem(i, { status: val as ChecklistItem['status'] })
                  }}
                  size="small"
                  fullWidth
                >
                  <ToggleButton
                    value="pass"
                    sx={{
                      flex: 1,
                      '&.Mui-selected': {
                        bgcolor: 'success.main',
                        color: 'success.contrastText',
                        '&:hover': { bgcolor: 'success.dark' },
                      },
                    }}
                  >
                    <CheckIcon sx={{ mr: 0.5, fontSize: 16 }} />
                    Pass
                  </ToggleButton>
                  <ToggleButton
                    value="fail"
                    sx={{
                      flex: 1,
                      '&.Mui-selected': {
                        bgcolor: 'error.main',
                        color: 'error.contrastText',
                        '&:hover': { bgcolor: 'error.dark' },
                      },
                    }}
                  >
                    <CloseIcon sx={{ mr: 0.5, fontSize: 16 }} />
                    Fail
                  </ToggleButton>
                  <ToggleButton value="na" sx={{ flex: 1 }}>
                    <RemoveIcon sx={{ mr: 0.5, fontSize: 16 }} />
                    N/A
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Notes */}
                <TextField
                  label="Notes"
                  size="small"
                  value={item.notes}
                  onChange={(e) => setChecklistItem(i, { notes: e.target.value })}
                />
              </Box>
            )
          })}
        </Box>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addChecklistItem}
          sx={{ mt: 1.5 }}
        >
          Add Item
        </Button>
      </Box>

      <Divider />

      {/* Corrective actions */}
      <Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: '0.08em' }}
        >
          Corrective Actions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
          {data.correctiveActions.map((action, i) => (
            <Fragment key={i}>
              {i > 0 && <Divider />}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <TextField
                  label="Description"
                  size="small"
                  value={action.description}
                  onChange={(e) => setAction(i, { description: e.target.value })}
                  sx={{ flex: '1 1 180px', minWidth: 0 }}
                />
                <TextField
                  label="Due Date"
                  size="small"
                  value={action.dueDate}
                  onChange={(e) => setAction(i, { dueDate: e.target.value })}
                  sx={{ width: 140, flexShrink: 0 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={action.completed}
                      onChange={(e) => setAction(i, { completed: e.target.checked })}
                    />
                  }
                  label={<Typography variant="body2">Done</Typography>}
                  sx={{ mx: 0 }}
                />
                <IconButton
                  size="small"
                  onClick={() => removeAction(i)}
                  sx={{ color: 'text.secondary' }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Fragment>
          ))}
        </Box>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addAction}
          sx={{ mt: 1.5 }}
        >
          Add Action
        </Button>
      </Box>
    </Box>
  )
}
