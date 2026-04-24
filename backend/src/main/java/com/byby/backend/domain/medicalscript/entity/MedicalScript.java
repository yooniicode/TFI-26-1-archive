package com.byby.backend.domain.medicalscript.entity;

import com.byby.backend.common.entity.BaseEntity;
import com.byby.backend.common.enums.ScriptType;
import com.byby.backend.domain.consultation.entity.Consultation;
import com.byby.backend.domain.patient.entity.Patient;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "medical_script")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MedicalScript extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id")
    private Consultation consultation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScriptType scriptType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contentKo; // 한국어 대본

    @Column(columnDefinition = "TEXT")
    private String contentOrigin; // 원어 번역본

    @Builder
    public MedicalScript(Patient patient, Consultation consultation,
                         ScriptType scriptType, String contentKo, String contentOrigin) {
        this.patient = patient;
        this.consultation = consultation;
        this.scriptType = scriptType;
        this.contentKo = contentKo;
        this.contentOrigin = contentOrigin;
    }
}
