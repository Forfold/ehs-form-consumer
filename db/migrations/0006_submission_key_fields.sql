ALTER TABLE form_submissions ADD COLUMN facility_name    text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE form_submissions ADD COLUMN facility_address text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE form_submissions ADD COLUMN permit_number    text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE form_submissions ADD COLUMN inspection_date  text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE form_submissions ADD COLUMN inspector_name   text NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE form_submissions SET
  facility_name    = COALESCE(data->>'facilityName',    ''),
  facility_address = COALESCE(data->>'facilityAddress', ''),
  permit_number    = COALESCE(data->>'permitNumber',    ''),
  inspection_date  = COALESCE(data->>'inspectionDate',  ''),
  inspector_name   = COALESCE(data->>'inspectorName',   '');
--> statement-breakpoint
ALTER TABLE form_submissions ALTER COLUMN facility_name    DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE form_submissions ALTER COLUMN facility_address DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE form_submissions ALTER COLUMN permit_number    DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE form_submissions ALTER COLUMN inspection_date  DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE form_submissions ALTER COLUMN inspector_name   DROP DEFAULT;
--> statement-breakpoint
CREATE INDEX form_submissions_facility_name_idx   ON form_submissions (facility_name);
--> statement-breakpoint
CREATE INDEX form_submissions_permit_number_idx   ON form_submissions (permit_number);
--> statement-breakpoint
CREATE INDEX form_submissions_inspection_date_idx ON form_submissions (inspection_date);
