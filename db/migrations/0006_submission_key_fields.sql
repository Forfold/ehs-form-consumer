-- Add required key-field columns to form_submissions.
-- DEFAULT '' handles any pre-existing rows; backfill populates them from JSONB
-- before the default is dropped so future inserts must supply real values.

ALTER TABLE form_submissions ADD COLUMN facility_name    text NOT NULL DEFAULT '';
ALTER TABLE form_submissions ADD COLUMN facility_address text NOT NULL DEFAULT '';
ALTER TABLE form_submissions ADD COLUMN permit_number    text NOT NULL DEFAULT '';
ALTER TABLE form_submissions ADD COLUMN inspection_date  text NOT NULL DEFAULT '';
ALTER TABLE form_submissions ADD COLUMN inspector_name   text NOT NULL DEFAULT '';

-- Backfill existing rows from the JSONB data column.
-- facilityAddress may be absent in old data — falls back to empty string.
UPDATE form_submissions SET
  facility_name    = COALESCE(data->>'facilityName',    ''),
  facility_address = COALESCE(data->>'facilityAddress', ''),
  permit_number    = COALESCE(data->>'permitNumber',    ''),
  inspection_date  = COALESCE(data->>'inspectionDate',  ''),
  inspector_name   = COALESCE(data->>'inspectorName',   '');

-- Remove the defaults so future inserts are forced to provide values explicitly.
ALTER TABLE form_submissions ALTER COLUMN facility_name    DROP DEFAULT;
ALTER TABLE form_submissions ALTER COLUMN facility_address DROP DEFAULT;
ALTER TABLE form_submissions ALTER COLUMN permit_number    DROP DEFAULT;
ALTER TABLE form_submissions ALTER COLUMN inspection_date  DROP DEFAULT;
ALTER TABLE form_submissions ALTER COLUMN inspector_name   DROP DEFAULT;

-- Indexes for common query patterns.
CREATE INDEX form_submissions_facility_name_idx   ON form_submissions (facility_name);
CREATE INDEX form_submissions_permit_number_idx   ON form_submissions (permit_number);
CREATE INDEX form_submissions_inspection_date_idx ON form_submissions (inspection_date);
