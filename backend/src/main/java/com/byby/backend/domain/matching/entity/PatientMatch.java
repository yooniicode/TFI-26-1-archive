package com.byby.backend.domain.matching.entity;

import com.byby.backend.common.entity.BaseEntity;
import com.byby.backend.domain.interpreter.entity.Interpreter;
import com.byby.backend.domain.patient.entity.Patient;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "patient_match",
        uniqueConstraints = @UniqueConstraint(columnNames = {"patient_id", "active"}, name = "uq_patient_active_match"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PatientMatch extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interpreter_id", nullable = false)
    private Interpreter interpreter;

    @Column(nullable = false)
    private boolean active = true;

    @Builder
    public PatientMatch(Patient patient, Interpreter interpreter) {
        this.patient = patient;
        this.interpreter = interpreter;
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public void reassign(Interpreter newInterpreter) {
        this.interpreter = newInterpreter;
    }
}
