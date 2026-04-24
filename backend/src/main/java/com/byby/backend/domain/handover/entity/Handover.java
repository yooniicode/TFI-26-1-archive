package com.byby.backend.domain.handover.entity;

import com.byby.backend.common.entity.BaseEntity;
import com.byby.backend.domain.Interpreter.entity.Interpreter;
import com.byby.backend.domain.consultation.entity.Consultation;
import com.byby.backend.domain.patient.entity.Patient;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "handover")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Handover extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_interpreter_id")
    private Interpreter fromInterpreter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_interpreter_id")
    private Interpreter toInterpreter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id")
    private Consultation consultation;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String notes; // 인수인계 메모

    @Builder
    public Handover(Patient patient, Interpreter fromInterpreter, Interpreter toInterpreter,
                    Consultation consultation, String reason, String notes) {
        this.patient = patient;
        this.fromInterpreter = fromInterpreter;
        this.toInterpreter = toInterpreter;
        this.consultation = consultation;
        this.reason = reason;
        this.notes = notes;
    }

    public void assign(Interpreter interpreter) {
        this.toInterpreter = interpreter;
    }
}
