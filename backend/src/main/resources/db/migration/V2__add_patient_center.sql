-- Add missing patient-center affiliation table used by patient lists and announcements.
CREATE TABLE IF NOT EXISTS patient_center (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID      NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    center_id  UUID      NOT NULL REFERENCES center(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_patient_center_patient_center
    ON patient_center(patient_id, center_id);
CREATE INDEX IF NOT EXISTS idx_patient_center_patient_id
    ON patient_center(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_center_center_id
    ON patient_center(center_id);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'update_updated_at'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_patient_center_updated_at'
    ) THEN
        CREATE TRIGGER trg_patient_center_updated_at
            BEFORE UPDATE ON patient_center
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END;
$$;
