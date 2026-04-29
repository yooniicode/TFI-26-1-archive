package com.byby.backend.domain.patient.entity;

import com.byby.backend.common.entity.BaseEntity;
import com.byby.backend.common.enums.Gender;
import com.byby.backend.common.enums.Nationality;
import com.byby.backend.common.enums.VisaType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "patient")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Patient extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID authUserId; // Supabase Auth user id (PATIENT 역할 로그인용)

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Nationality nationality;

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private VisaType visaType;

    @Column(columnDefinition = "TEXT")
    private String visaNote;

    private LocalDate birthDate;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String region;

    @Column(length = 200)
    private String workplaceName;

    @Builder
    public Patient(UUID authUserId, String name, Nationality nationality, Gender gender,
                   VisaType visaType, String visaNote, LocalDate birthDate,
                   String phone, String region, String workplaceName) {
        this.authUserId = authUserId;
        this.name = name;
        this.nationality = nationality;
        this.gender = gender;
        this.visaType = visaType;
        this.visaNote = visaNote;
        this.birthDate = birthDate;
        this.phone = phone;
        this.region = region;
        this.workplaceName = workplaceName;
    }

    public void updateInfo(String phone, String region, String workplaceName,
                           String visaNote, VisaType visaType) {
        if (phone != null) this.phone = phone;
        if (region != null) this.region = region;
        if (workplaceName != null) this.workplaceName = workplaceName;
        if (visaNote != null) this.visaNote = visaNote;
        if (visaType != null) this.visaType = visaType;
    }

    public void linkAuthUser(UUID authUserId) {
        this.authUserId = authUserId;
    }
}
