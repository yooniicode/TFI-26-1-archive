package com.byby.backend.domain.consultation.entity;

import com.byby.backend.common.entity.BaseEntity;
import com.byby.backend.common.enums.ConsultationMethod;
import com.byby.backend.common.enums.IssueType;
import com.byby.backend.common.enums.ProcessingType;
import com.byby.backend.domain.Interpreter.entity.Interpreter;
import com.byby.backend.domain.hospital.entity.Hospital;
import com.byby.backend.domain.patient.entity.Patient;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "consultation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Consultation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private LocalDate consultationDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interpreter_id")
    private Interpreter interpreter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @Column(length = 100)
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private IssueType issueType;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ConsultationMethod method;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ProcessingType processing;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(precision = 4, scale = 1)
    private BigDecimal durationHours;

    private Integer fee;

    private LocalDate nextAppointmentDate;

    private LocalDate confirmedAt;

    @Column(length = 100)
    private String confirmedBy;

    @Column(length = 20)
    private String confirmedByPhone;

    @Builder
    public Consultation(LocalDate consultationDate, Patient patient, Interpreter interpreter,
                        Hospital hospital, String department, IssueType issueType,
                        ConsultationMethod method, ProcessingType processing, String memo,
                        BigDecimal durationHours, Integer fee, LocalDate nextAppointmentDate) {
        this.consultationDate = consultationDate;
        this.patient = patient;
        this.interpreter = interpreter;
        this.hospital = hospital;
        this.department = department;
        this.issueType = issueType;
        this.method = method;
        this.processing = processing;
        this.memo = memo;
        this.durationHours = durationHours;
        this.fee = fee;
        this.nextAppointmentDate = nextAppointmentDate;
    }

    public void confirm(String confirmedBy, String confirmedByPhone) {
        this.confirmedAt = LocalDate.now();
        this.confirmedBy = confirmedBy;
        this.confirmedByPhone = confirmedByPhone;
    }

    public void update(String memo, LocalDate nextAppointmentDate, String department,
                       BigDecimal durationHours, Integer fee) {
        if (memo != null) this.memo = memo;
        if (nextAppointmentDate != null) this.nextAppointmentDate = nextAppointmentDate;
        if (department != null) this.department = department;
        if (durationHours != null) this.durationHours = durationHours;
        if (fee != null) this.fee = fee;
    }

    public boolean isConfirmed() {
        return this.confirmedAt != null;
    }
}
