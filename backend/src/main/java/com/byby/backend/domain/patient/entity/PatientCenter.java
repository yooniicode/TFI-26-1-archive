package com.byby.backend.domain.patient.entity;

import com.byby.backend.common.entity.BaseEntity;
import com.byby.backend.domain.center.entity.Center;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "patient_center",
        uniqueConstraints = @UniqueConstraint(columnNames = {"patient_id", "center_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PatientCenter extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "center_id", nullable = false)
    private Center center;

    @Builder
    public PatientCenter(Patient patient, Center center) {
        this.patient = patient;
        this.center = center;
    }
}
