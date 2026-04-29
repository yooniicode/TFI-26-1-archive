package com.byby.backend.domain.admin.entity;

import com.byby.backend.common.entity.BaseEntity;
import com.byby.backend.domain.patient.entity.Patient;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "center_patient_memo")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CenterPatientMemo extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID adminAuthUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(columnDefinition = "TEXT")
    private String publicMemo;

    @Column(columnDefinition = "TEXT")
    private String privateMemo;

    @Column(nullable = false)
    private boolean interpreterVisible;

    @Builder
    public CenterPatientMemo(UUID adminAuthUserId, Patient patient, String publicMemo,
                             String privateMemo, boolean interpreterVisible) {
        this.adminAuthUserId = adminAuthUserId;
        this.patient = patient;
        this.publicMemo = publicMemo;
        this.privateMemo = privateMemo;
        this.interpreterVisible = interpreterVisible;
    }

    public void update(String publicMemo, String privateMemo, boolean interpreterVisible) {
        this.publicMemo = publicMemo;
        this.privateMemo = privateMemo;
        this.interpreterVisible = interpreterVisible;
    }
}
