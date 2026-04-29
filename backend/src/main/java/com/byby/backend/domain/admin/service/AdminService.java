package com.byby.backend.domain.admin.service;

import com.byby.backend.common.exception.BusinessException;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.BusinessErrorCode;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.admin.dto.AdminRequest;
import com.byby.backend.domain.admin.dto.AdminResponse;
import com.byby.backend.domain.admin.entity.AdminProfile;
import com.byby.backend.domain.admin.entity.AdminWorkLog;
import com.byby.backend.domain.admin.entity.AdminWorkLogTask;
import com.byby.backend.domain.admin.entity.CenterPatientMemo;
import com.byby.backend.domain.admin.repository.AdminProfileRepository;
import com.byby.backend.domain.admin.repository.AdminWorkLogRepository;
import com.byby.backend.domain.admin.repository.CenterPatientMemoRepository;
import com.byby.backend.domain.patient.entity.Patient;
import com.byby.backend.domain.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final AdminProfileRepository adminProfileRepository;
    private final AdminWorkLogRepository adminWorkLogRepository;
    private final CenterPatientMemoRepository centerPatientMemoRepository;
    private final PatientRepository patientRepository;

    @Transactional
    public AdminResponse.Profile getProfile(UserPrincipal principal) {
        requireAdmin(principal);
        return AdminResponse.Profile.from(getOrCreateProfile(principal.getAuthUserId()));
    }

    @Transactional
    public AdminResponse.Profile updateProfile(AdminRequest.UpdateProfile req, UserPrincipal principal) {
        requireAdmin(principal);
        AdminProfile profile = getOrCreateProfile(principal.getAuthUserId());
        profile.update(trimToNull(req.centerName()), trimToNull(req.nickname()));
        return AdminResponse.Profile.from(profile);
    }

    public Page<AdminResponse.WorkLog> getWorkLogs(LocalDate from, LocalDate to, Pageable pageable,
                                                   UserPrincipal principal) {
        requireAdmin(principal);
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(30);
        return adminWorkLogRepository
                .findByAuthUserIdAndWorkDateBetweenOrderByWorkDateDescCreatedAtDesc(
                        principal.getAuthUserId(), start, end, pageable)
                .map(AdminResponse.WorkLog::from);
    }

    @Transactional
    public AdminResponse.WorkLog createWorkLog(AdminRequest.UpsertWorkLog req, UserPrincipal principal) {
        requireAdmin(principal);
        AdminWorkLog log = AdminWorkLog.builder()
                .authUserId(principal.getAuthUserId())
                .workDate(req.workDate())
                .memo(trimToNull(req.memo()))
                .tasks(toTasks(req.tasks()))
                .build();
        return AdminResponse.WorkLog.from(adminWorkLogRepository.save(log));
    }

    @Transactional
    public AdminResponse.WorkLog updateWorkLog(UUID id, AdminRequest.UpsertWorkLog req, UserPrincipal principal) {
        requireAdmin(principal);
        AdminWorkLog log = adminWorkLogRepository.findById(id)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        if (!log.getAuthUserId().equals(principal.getAuthUserId())) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }
        log.update(req.workDate(), trimToNull(req.memo()), toTasks(req.tasks()));
        return AdminResponse.WorkLog.from(log);
    }

    @Transactional
    public void deleteWorkLog(UUID id, UserPrincipal principal) {
        requireAdmin(principal);
        AdminWorkLog log = adminWorkLogRepository.findById(id)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        if (!log.getAuthUserId().equals(principal.getAuthUserId())) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }
        adminWorkLogRepository.delete(log);
    }

    public Page<AdminResponse.PatientMemo> getPatientMemos(UUID patientId, Pageable pageable, UserPrincipal principal) {
        requireStaffOrInterpreter(principal);
        if (principal.isAdmin()) {
            return centerPatientMemoRepository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable)
                    .map(memo -> AdminResponse.PatientMemo.from(memo, true));
        }
        return centerPatientMemoRepository
                .findByPatientIdAndInterpreterVisibleTrueOrderByCreatedAtDesc(patientId, pageable)
                .map(memo -> AdminResponse.PatientMemo.from(memo, false));
    }

    @Transactional
    public AdminResponse.PatientMemo createPatientMemo(UUID patientId, AdminRequest.UpsertPatientMemo req,
                                                       UserPrincipal principal) {
        requireAdmin(principal);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));
        CenterPatientMemo memo = CenterPatientMemo.builder()
                .adminAuthUserId(principal.getAuthUserId())
                .patient(patient)
                .publicMemo(trimToNull(req.publicMemo()))
                .privateMemo(trimToNull(req.privateMemo()))
                .interpreterVisible(req.interpreterVisible())
                .build();
        return AdminResponse.PatientMemo.from(centerPatientMemoRepository.save(memo), true);
    }

    @Transactional
    public AdminResponse.PatientMemo updatePatientMemo(UUID memoId, AdminRequest.UpsertPatientMemo req,
                                                       UserPrincipal principal) {
        requireAdmin(principal);
        CenterPatientMemo memo = centerPatientMemoRepository.findById(memoId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        memo.update(trimToNull(req.publicMemo()), trimToNull(req.privateMemo()), req.interpreterVisible());
        return AdminResponse.PatientMemo.from(memo, true);
    }

    @Transactional
    public void deletePatientMemo(UUID memoId, UserPrincipal principal) {
        requireAdmin(principal);
        CenterPatientMemo memo = centerPatientMemoRepository.findById(memoId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        centerPatientMemoRepository.delete(memo);
    }

    @Transactional
    public AdminProfile getOrCreateProfile(UUID authUserId) {
        return adminProfileRepository.findByAuthUserId(authUserId)
                .orElseGet(() -> adminProfileRepository.save(AdminProfile.builder()
                        .authUserId(authUserId)
                        .nickname("관리자")
                        .build()));
    }

    private void requireAdmin(UserPrincipal principal) {
        if (principal == null) throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        if (!principal.isAdmin()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);
    }

    private void requireStaffOrInterpreter(UserPrincipal principal) {
        if (principal == null) throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        if (!principal.isAdmin() && !principal.isInterpreter()) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }
    }

    private List<AdminWorkLogTask> toTasks(List<AdminRequest.WorkLogTask> tasks) {
        if (tasks == null) return List.of();
        return tasks.stream()
                .filter(t -> StringUtils.hasText(t.content()))
                .map(t -> new AdminWorkLogTask(t.content().trim(), t.checked()))
                .toList();
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
