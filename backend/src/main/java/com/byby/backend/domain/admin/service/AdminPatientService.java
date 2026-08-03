package com.byby.backend.domain.admin.service;

import com.byby.backend.common.enums.ReportStatus;
import com.byby.backend.common.exception.BusinessException;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.BusinessErrorCode;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.admin.dto.AdminPatientResponse;
import com.byby.backend.domain.center.entity.Center;
import com.byby.backend.domain.consultation.dto.ConsultationResponse;
import com.byby.backend.domain.consultation.repository.ConsultationRepository;
import com.byby.backend.domain.matching.entity.PatientMatch;
import com.byby.backend.domain.matching.repository.PatientMatchRepository;
import com.byby.backend.domain.patient.dto.PatientRequest;
import com.byby.backend.domain.patient.entity.Patient;
import com.byby.backend.domain.patient.repository.PatientCenterRepository;
import com.byby.backend.domain.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** AD-04 이주민 관리 — 목록·검색 · 기본/거주정보 · 이용이력 · 담당 히스토리 · 진료 기록 연결 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPatientService {

    private final AdminService adminService;
    private final PatientRepository patientRepository;
    private final PatientCenterRepository patientCenterRepository;
    private final PatientMatchRepository patientMatchRepository;
    private final ConsultationRepository consultationRepository;

    // ─── AD-04-1 목록·검색 ──────────────────────────────────────────────────

    public Page<AdminPatientResponse.Item> getPatients(String query, Pageable pageable, UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        return patientRepository.searchByCenterIdentity(
                        center.getId(), center.getName(), compactName(center.getName()), query, pageable)
                .map(p -> AdminPatientResponse.Item.from(
                        p, activeMatch(p.getId()),
                        consultationRepository.countByPatientId(p.getId()),
                        consultationRepository.findLastConsultationDateByPatientId(p.getId())));
    }

    // ─── AD-04-2/3 기본정보 · 거주정보 ──────────────────────────────────────

    public AdminPatientResponse.Detail getDetail(UUID patientId, UserPrincipal principal) {
        Patient patient = findInCenter(patientId, principal);
        return AdminPatientResponse.Detail.from(patient, activeMatch(patientId));
    }

    @Transactional
    public AdminPatientResponse.Detail update(UUID patientId, PatientRequest.Update req, UserPrincipal principal) {
        Patient patient = findInCenter(patientId, principal);
        patient.updateInfo(req.name(), req.phone(), req.region(), req.visaNote(), req.visaType(), req.workplace());
        return AdminPatientResponse.Detail.from(patient, activeMatch(patientId));
    }

    // ─── AD-04-4 이용이력 ───────────────────────────────────────────────────

    public AdminPatientResponse.UsageSummary getUsageSummary(UUID patientId, UserPrincipal principal) {
        findInCenter(patientId, principal);
        return new AdminPatientResponse.UsageSummary(
                patientId,
                consultationRepository.countByPatientId(patientId),
                consultationRepository.countByPatientIdAndReportStatusIn(patientId, List.of(ReportStatus.APPROVED)),
                consultationRepository.countByPatientIdAndReportStatusIn(
                        patientId, List.of(ReportStatus.DRAFT, ReportStatus.PENDING, ReportStatus.REJECTED)),
                consultationRepository.findFirstConsultationDateByPatientId(patientId),
                consultationRepository.findLastConsultationDateByPatientId(patientId));
    }

    /** AD-04-4/AD-04-6 이용 이력 전체 · 케이스별 보고서 연결 열람 */
    public Page<ConsultationResponse.Detail> getConsultations(UUID patientId, Pageable pageable,
                                                              UserPrincipal principal) {
        findInCenter(patientId, principal);
        return consultationRepository
                .findByPatientId(patientId, PageRequest.of(pageable.getPageNumber(), pageable.getPageSize()))
                .map(ConsultationResponse.Detail::from);
    }

    // ─── AD-04-5 담당 히스토리 ──────────────────────────────────────────────

    public List<AdminPatientResponse.AssignmentHistoryItem> getAssignmentHistory(UUID patientId,
                                                                                 UserPrincipal principal) {
        findInCenter(patientId, principal);
        return patientMatchRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(AdminPatientResponse.AssignmentHistoryItem::from)
                .toList();
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private PatientMatch activeMatch(UUID patientId) {
        return patientMatchRepository.findByPatientIdAndActiveTrue(patientId).stream()
                .findFirst().orElse(null);
    }

    private Patient findInCenter(UUID patientId, UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));
        if (!patientCenterRepository.existsByPatientIdAndCenterId(patientId, center.getId())) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN, "다른 센터 이주민입니다");
        }
        return patient;
    }

    private String compactName(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[\\s-]+", "");
    }
}
