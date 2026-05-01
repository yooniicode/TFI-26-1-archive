-- =====================================================
-- V1: 초기 스키마 생성
-- =====================================================

-- 이주민 (Patient)
CREATE TABLE patient (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id    UUID,                          -- Supabase Auth FK (PATIENT 로그인)
    name            VARCHAR(100) NOT NULL,
    nationality     VARCHAR(50)  NOT NULL,
    gender          VARCHAR(10)  NOT NULL,
    visa_type       VARCHAR(20)  NOT NULL,
    visa_note       TEXT,
    birth_date      DATE,
    phone           VARCHAR(20),
    region          VARCHAR(100),
    workplace_name  VARCHAR(200),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_auth_user_id ON patient(auth_user_id);
CREATE INDEX idx_patient_nationality  ON patient(nationality);

-- 센터
CREATE TABLE center (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(200) NOT NULL UNIQUE,
    address    VARCHAR(300),
    phone      VARCHAR(20),
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_center_name ON center(name);

-- 통번역가 (Interpreter)
CREATE TABLE interpreter (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID         NOT NULL UNIQUE,   -- Supabase Auth FK
    name         VARCHAR(100) NOT NULL,
    phone        VARCHAR(20),
    role         VARCHAR(50)  NOT NULL,
    center_id    UUID                  REFERENCES center(id),
    availability_note VARCHAR(500),
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interpreter_auth_user_id ON interpreter(auth_user_id);
CREATE INDEX idx_interpreter_center_id ON interpreter(center_id);

-- 센터 관리자 프로필
CREATE TABLE admin_profile (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID         NOT NULL UNIQUE,
    center_name  VARCHAR(200),
    center_id    UUID                  REFERENCES center(id),
    nickname     VARCHAR(100),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_profile_auth_user_id ON admin_profile(auth_user_id);
CREATE INDEX idx_admin_profile_center_id ON admin_profile(center_id);

-- 센터장 근무일지
CREATE TABLE admin_work_log (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID      NOT NULL,
    work_date    DATE      NOT NULL,
    memo         TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_work_log_auth_date ON admin_work_log(auth_user_id, work_date DESC);

CREATE TABLE admin_work_log_task (
    work_log_id UUID         NOT NULL REFERENCES admin_work_log(id) ON DELETE CASCADE,
    content     VARCHAR(500) NOT NULL,
    checked     BOOLEAN      NOT NULL DEFAULT FALSE
);

-- 통번역가 사용 언어 (ElementCollection)
CREATE TABLE interpreter_language (
    interpreter_id UUID         NOT NULL REFERENCES interpreter(id) ON DELETE CASCADE,
    language       VARCHAR(50)  NOT NULL
);

-- 병원 (Hospital)
CREATE TABLE hospital (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(200) NOT NULL,
    address    TEXT,
    phone      VARCHAR(20),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hospital_name ON hospital(name);

-- 상담/통역 보고서 (Consultation)
CREATE TABLE consultation (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_date     DATE         NOT NULL,
    patient_id            UUID         NOT NULL REFERENCES patient(id),
    interpreter_id        UUID                  REFERENCES interpreter(id),
    hospital_id           UUID                  REFERENCES hospital(id),
    department            VARCHAR(100),
    doctor_name           VARCHAR(100),
    issue_type            VARCHAR(50)  NOT NULL,
    method                VARCHAR(50),
    processing            VARCHAR(50),
    memo                  TEXT,
    patient_comment       TEXT,
    treatment_result      TEXT,
    diagnosis_content     TEXT,
    diagnosis_name_code   VARCHAR(200),
    medication_instruction TEXT,
    counselor_name        VARCHAR(100),
    work_description      TEXT,
    doctor_confirmation_signature TEXT,
    duration_hours        NUMERIC(4,1),
    fee                   INTEGER,
    next_appointment_date DATE,
    confirmed_at          DATE,
    confirmed_by          VARCHAR(100),
    confirmed_by_phone    VARCHAR(20),
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consultation_patient_id     ON consultation(patient_id);
CREATE INDEX idx_consultation_interpreter_id ON consultation(interpreter_id);
CREATE INDEX idx_consultation_date           ON consultation(consultation_date DESC);

-- 인수인계 (Handover)
CREATE TABLE handover (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID NOT NULL REFERENCES patient(id),
    from_interpreter_id UUID          REFERENCES interpreter(id),
    to_interpreter_id   UUID          REFERENCES interpreter(id),
    consultation_id     UUID          REFERENCES consultation(id),
    reason              TEXT,
    notes               TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_handover_patient_id ON handover(patient_id);

-- 센터 관리자-이주민 메모
CREATE TABLE center_patient_memo (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_auth_user_id  UUID      NOT NULL,
    patient_id          UUID      NOT NULL REFERENCES patient(id),
    public_memo         TEXT,
    private_memo        TEXT,
    interpreter_visible BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_center_patient_memo_patient_id ON center_patient_memo(patient_id);
CREATE INDEX idx_center_patient_memo_admin_id ON center_patient_memo(admin_auth_user_id);

-- Center announcements shown in the migrant home feed
CREATE TABLE center_announcement (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id           UUID         NOT NULL REFERENCES center(id),
    author_auth_user_id UUID         NOT NULL,
    category            VARCHAR(30)  NOT NULL,
    title               VARCHAR(120) NOT NULL,
    content             TEXT         NOT NULL,
    link_url            VARCHAR(500),
    pinned              BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_center_announcement_center ON center_announcement(center_id, pinned DESC, created_at DESC);

-- 통번역가-이주민 매칭 (PatientMatch)
CREATE TABLE patient_match (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id     UUID    NOT NULL REFERENCES patient(id),
    interpreter_id UUID    NOT NULL REFERENCES interpreter(id),
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_match_patient_id     ON patient_match(patient_id);
CREATE INDEX idx_patient_match_interpreter_id ON patient_match(interpreter_id);
-- 환자당 활성 매칭은 1개만 허용
CREATE UNIQUE INDEX uq_patient_active_match
    ON patient_match(patient_id) WHERE active = TRUE;

-- 의료 대본 (MedicalScript)
CREATE TABLE medical_script (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID        NOT NULL REFERENCES patient(id),
    consultation_id UUID                 REFERENCES consultation(id),
    script_type     VARCHAR(20) NOT NULL,
    content_ko      TEXT        NOT NULL,
    content_origin  TEXT,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medical_script_patient_id ON medical_script(patient_id);

-- ─── 채팅 ─────────────────────────────────────────────────────
-- 채팅방
CREATE TABLE chat_room (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 채팅방 참여자
CREATE TABLE chat_room_member (
    room_id      UUID        NOT NULL REFERENCES chat_room(id) ON DELETE CASCADE,
    auth_user_id UUID        NOT NULL,
    member_name  VARCHAR(100),
    role         VARCHAR(20) NOT NULL,
    last_read_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (room_id, auth_user_id)
);

CREATE INDEX idx_chat_room_member_user ON chat_room_member(auth_user_id);

-- 채팅 메시지
CREATE TABLE chat_message (
    id                  UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id             UUID      NOT NULL REFERENCES chat_room(id) ON DELETE CASCADE,
    sender_auth_user_id UUID      NOT NULL,
    sender_name         VARCHAR(100),
    content             TEXT      NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_message_room ON chat_message(room_id, created_at);

-- Supabase Realtime: chat_message 테이블 구독 허용
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_message;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

-- RLS (Supabase Realtime이 auth.uid()로 필터링)
ALTER TABLE chat_room        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_room_select_member" ON chat_room
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM chat_room_member m
                WHERE m.room_id = chat_room.id AND m.auth_user_id = auth.uid())
    );

CREATE POLICY "chat_room_member_select" ON chat_room_member
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM chat_room_member me
                WHERE me.room_id = chat_room_member.room_id AND me.auth_user_id = auth.uid())
    );

CREATE POLICY "chat_message_select_member" ON chat_message
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM chat_room_member m
                WHERE m.room_id = chat_message.room_id AND m.auth_user_id = auth.uid())
    );

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['patient','center','interpreter','admin_profile','admin_work_log',
                              'hospital','consultation','handover','center_patient_memo','center_announcement',
                              'patient_match','medical_script','chat_room']
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
            t, t
        );
    END LOOP;
END;
$$;
