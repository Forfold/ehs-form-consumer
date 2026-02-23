export type ChecklistStatus = "pass" | "fail" | "na";
export type OverallStatus = "compliant" | "non-compliant" | "needs-attention";

export interface EditMeta {
  editedBy: string; // user display name
  editedAt: string; // ISO timestamp
  editType: "correction" | "update";
}

export interface ChecklistItem {
  section?: string;
  description: string;
  status: ChecklistStatus;
  notes: string;
  editMeta?: EditMeta;
}

export interface CorrectiveAction {
  description: string;
  dueDate: string;
  completed: boolean;
  editMeta?: EditMeta;
}

export interface InspectionData {
  facilityName: string;
  permitNumber: string;
  inspectionDate: string;
  inspectorName: string;
  weatherConditions?: string;
  rainEventDuringInspection?: boolean | null;
  overallStatus: OverallStatus;
  checklistItems: ChecklistItem[];
  correctiveActions: CorrectiveAction[];
  summary: string;
  deadletter?: Record<string, unknown>;
  /** Edit attribution for top-level fields, keyed by field name */
  fieldEdits?: Partial<Record<string, EditMeta>>;
  /** Deadletter fields manually resolved by a user */
  resolvedDeadletterFields?: Array<{ key: string; value: string } & EditMeta>;
}

export interface InspectionFieldHints {
  facilityName?: string;
  permitNumber?: string;
  inspectionDate?: string;
  inspectorName?: string;
  weatherConditions?: string;
}
