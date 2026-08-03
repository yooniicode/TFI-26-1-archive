package com.byby.backend.domain.admin.service;

import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.admin.dto.AdminCenterResponse;
import com.byby.backend.domain.center.dto.CenterRequest;
import com.byby.backend.domain.center.dto.CenterResponse;
import com.byby.backend.domain.center.entity.Center;
import com.byby.backend.domain.center.service.CenterService;
import com.byby.backend.domain.consultation.dto.ConsultationResponse;
import com.byby.backend.domain.consultation.service.ConsultationService;
import com.byby.backend.domain.consultation.service.GoogleSheetsExportService;
import com.byby.backend.domain.interpreter.repository.InterpreterRepository;
import com.byby.backend.domain.patient.repository.PatientCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** AD-02 센터 목록 · AD-03 시트 데이터 · AD-설정 센터 기본정보 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCenterService {

    private final AdminService adminService;
    private final CenterService centerService;
    private final ConsultationService consultationService;
    private final GoogleSheetsExportService googleSheetsExportService;
    private final PatientCenterRepository patientCenterRepository;
    private final InterpreterRepository interpreterRepository;

    public AdminCenterResponse.Profile getCenter(UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        return AdminCenterResponse.Profile.from(
                center,
                adminService.getOrCreateProfile(principal.getAuthUserId()).getNickname(),
                patientCenterRepository.countByCenterId(center.getId()),
                interpreterRepository.countByCenter_Id(center.getId()));
    }

    @Transactional
    public CenterResponse.Summary updateCenter(CenterRequest.Upsert req, UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        return centerService.update(center.getId(), req, principal);
    }

    public AdminCenterResponse.SheetLink getSheetLink(UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        return AdminCenterResponse.SheetLink.of(center.getId(), center.getSpreadsheetId());
    }

    /** AD-03 센터 전체 보고서를 구글 시트로 내보낸다. 연결된 시트가 없으면 새로 만들고 ID를 저장한다. */
    @Transactional
    public AdminCenterResponse.SheetLink exportToSheet(UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        List<ConsultationResponse.Detail> rows = consultationService.getDetailsByCenter(center.getId());

        GoogleSheetsExportService.ExportResult result = googleSheetsExportService.createSheet(
                "상담보고서", center.getName(), center.getSpreadsheetId(), rows);

        if (center.getSpreadsheetId() == null) {
            consultationService.saveCenterSpreadsheetId(center.getId(), result.spreadsheetId());
        }
        return AdminCenterResponse.SheetLink.of(center.getId(), result.spreadsheetId());
    }
}
