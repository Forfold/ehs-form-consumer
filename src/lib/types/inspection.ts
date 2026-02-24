import { z } from 'zod'

export const checklistStatusSchema = z.enum(['pass', 'fail', 'na'])
export const overallStatusSchema = z.enum([
  'compliant',
  'non-compliant',
  'needs-attention',
])

export const editMetaSchema = z.object({
  editedBy: z.string(), // user display name
  editedAt: z.string(), // ISO timestamp
  editType: z.enum(['correction', 'update']),
})

export const checklistItemSchema = z.object({
  section: z.string().optional(),
  description: z.string(),
  status: checklistStatusSchema,
  notes: z.string(),
  editMeta: editMetaSchema.optional(),
})

export const correctiveActionSchema = z.object({
  description: z.string(),
  dueDate: z.string(),
  completed: z.boolean(),
  editMeta: editMetaSchema.optional(),
})

export const inspectionDataSchema = z.object({
  facilityName: z.string().min(1),
  facilityAddress: z.string().min(1),
  permitNumber: z.string().min(1),
  inspectionDate: z.string().min(1),
  inspectorName: z.string().min(1),
  weatherConditions: z.string().optional(),
  rainEventDuringInspection: z.boolean().nullable().optional(),
  overallStatus: overallStatusSchema,
  checklistItems: z.array(checklistItemSchema),
  correctiveActions: z.array(correctiveActionSchema),
  summary: z.string(),
  deadletter: z.record(z.string(), z.unknown()).optional(),
  /** Edit attribution for top-level fields, keyed by field name */
  fieldEdits: z.record(z.string(), editMetaSchema).optional(),
  /** Deadletter fields manually resolved by a user */
  resolvedDeadletterFields: z
    .array(editMetaSchema.extend({ key: z.string(), value: z.string() }))
    .optional(),
})

export type ChecklistStatus = z.infer<typeof checklistStatusSchema>
export type OverallStatus = z.infer<typeof overallStatusSchema>
export type EditMeta = z.infer<typeof editMetaSchema>
export type ChecklistItem = z.infer<typeof checklistItemSchema>
export type CorrectiveAction = z.infer<typeof correctiveActionSchema>
export type InspectionData = z.infer<typeof inspectionDataSchema>

export interface InspectionFieldHints {
  facilityName?: string
  facilityAddress?: string
  permitNumber?: string
  inspectionDate?: string
  inspectorName?: string
  weatherConditions?: string
}
