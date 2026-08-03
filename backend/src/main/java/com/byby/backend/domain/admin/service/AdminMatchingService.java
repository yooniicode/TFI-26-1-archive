package com.byby.backend.domain.admin.service;

import com.byby.backend.common.enums.MatchingStatus;
import com.byby.backend.common.exception.BusinessException;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.BusinessErrorCode;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.admin.dto.AdminMatchingRequest;
import com.byby.backend.domain.admin.dto.AdminMatchingResponse;
import com.byby.backend.domain.center.entity.Center;
import com.byby.backend.domain.consultation.entity.Consultation;
import com.byby.backend.domain.consultation.repository.ConsultationRepository;
import com.byby.backend.domain.interpreter.entity.Interpreter;
import com.byby.backend.domain.interpreter.repository.InterpreterRepository;
import com.byby.backend.domain.matching.entity.PatientMatch;
import com.byby.backend.domain.matching.repository.PatientMatchRepository;
import com.byby.backend.domain.patient.entity.Patient;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/** AD-06 매칭 관리 — 요청 목록 · 통번역가 배정 · 매칭 현황 · 일정 캘린더 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMatchingService {

    /** 요청 목록·캘린더 조회 시 기간을 지정하지 않았을 때의 기본 범위 */
    private static final LocalDateTime MIN_DATE = LocalDate.of(2000, 1, 1).atStartOfDay();
    private static final LocalDateTime MAX_DATE = LocalDate.of(2999, 12, 31).atTime(23, 59, 59);

    private final AdminService adminService;
    private final ConsultationRepository consultationRepository;
    private final InterpreterRepository interpreterRepository;
    private final PatientMatchRepository patientMatchRepository;

    // ─── AD-06-1 요청 목록 ──────────────────────────────────────────────────

    public Page<AdminMatchingResponse.RequestItem> getRequests(
            MatchingStatus status, LocalDate from, LocalDate to, Pageable pageable, UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        List<MatchingStatus> statuses = status != null
                ? List.of(status)
                : List.of(MatchingStatus.values());
        return consultationRepository.findRequestsByCenter(
                        center.getId(), statuses, startOf(from), endOf(to), pageable)
                .map(AdminMatchingResponse.RequestItem::from);
    }

    // ─── AD-06-2 통번역가 배정 ──────────────────────────────────────────────

    /** 요청의 언어·일정을 기준으로 배정 후보 통번역가를 정렬해 반환한다. */
    public List<AdminMatchingResponse.InterpreterCandidate> getCandidates(
            UUID consultationId, String language, UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);

        String targetLanguage = language;
        if (!StringUtils.hasText(targetLanguage) && consultationId != null) {
            Consultation c = findInCenter(consultationId, center);
            if (c.getPatient().getNationality() != null) {
                targetLanguage = c.getPatient().getNationality().getLanguageCode();
            }
        }
        final String matchLanguage = normalize(targetLanguage);

        YearMonth month = YearMonth.now();
        LocalDateTime monthStart = month.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = month.atEndOfMonth().atTime(23, 59, 59);

        return interpreterRepository.findByCenterId(center.getId()).stream()
                .filter(Interpreter::isActive)
                .map(i -> AdminMatchingResponse.InterpreterCandidate.from(
                        i,
                        matchesLanguage(i, matchLanguage),
                        patientMatchRepository.countByInterpreterIdAndActiveTrue(i.getId()),
                        consultationRepository.countByInterpreterIdAndDateBetween(i.getId(), monthStart, monthEnd),
                        consultationRepository.sumDurationHoursByInterpreterIdAndDateTimeBetween(
                                i.getId(), monthStart, monthEnd)))
                // 언어가 맞는 통번역가를 먼저, 그 다음 담당 부하가 적은 순서로
                .sorted(Comparator
                        .comparing(AdminMatchingResponse.InterpreterCandidate::languageMatched).reversed()
                        .thenComparingLong(AdminMatchingResponse.InterpreterCandidate::activePatientCount)
                        .thenComparing(AdminMatchingResponse.InterpreterCandidate::name,
                                Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    @Transactional
    public AdminMatchingResponse.RequestItem assign(UUID consultationId, AdminMatchingRequest.Assign req,
                                                    UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        Consultation consultation = findInCenter(consultationId, center);

        if (consultation.getInterpreter() != null) {
            throw new BusinessException(BusinessErrorCode.CONSULTATION_ALREADY_ACCEPTED);
        }

        Interpreter interpreter = interpreterRepository.findById(req.interpreterId())
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));
        requireSameCenter(interpreter, center);
        if (!interpreter.isActive()) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST, "비활성 통번역가에게는 배정할 수 없습니다");
        }

        consultation.assignByAdmin(interpreter, req.consultationDate(), principal.getAuthUserId());

        if (req.shouldCreateMatch()) {
            ensureActiveMatch(consultation.getPatient(), interpreter, principal.getAuthUserId());
        }
        return AdminMatchingResponse.RequestItem.from(consultation);
    }

    /** 배정된 통번역가를 다른 통번역가로 교체한다. */
    @Transactional
    public AdminMatchingResponse.RequestItem reassign(UUID consultationId, AdminMatchingRequest.Assign req,
                                                      UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        Consultation consultation = findInCenter(consultationId, center);

        Interpreter interpreter = interpreterRepository.findById(req.interpreterId())
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));
        requireSameCenter(interpreter, center);

        Interpreter previous = consultation.getInterpreter();
        consultation.assignByAdmin(interpreter, req.consultationDate(), principal.getAuthUserId());

        if (req.shouldCreateMatch()) {
            if (previous != null && !previous.getId().equals(interpreter.getId())) {
                patientMatchRepository
                        .findByPatientIdAndInterpreterIdAndActiveTrue(
                                consultation.getPatient().getId(), previous.getId())
                        .ifPresent(PatientMatch::deactivate);
            }
            ensureActiveMatch(consultation.getPatient(), interpreter, principal.getAuthUserId());
        }
        return AdminMatchingResponse.RequestItem.from(consultation);
    }

    @Transactional
    public AdminMatchingResponse.RequestItem reject(UUID consultationId, AdminMatchingRequest.Reject req,
                                                    UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        Consultation consultation = findInCenter(consultationId, center);
        if (consultation.getInterpreter() != null) {
            throw new BusinessException(BusinessErrorCode.CONSULTATION_ALREADY_ACCEPTED);
        }
        consultation.rejectRequest(req.reason().trim(), principal.getAuthUserId());
        return AdminMatchingResponse.RequestItem.from(consultation);
    }

    /** 배정 취소 — 요청을 다시 미배정 상태로 되돌린다. */
    @Transactional
    public AdminMatchingResponse.RequestItem unassign(UUID consultationId, UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        Consultation consultation = findInCenter(consultationId, center);
        Interpreter previous = consultation.getInterpreter();
        if (previous == null) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST, "아직 배정되지 않은 요청입니다");
        }
        consultation.unassign();
        patientMatchRepository
                .findByPatientIdAndInterpreterIdAndActiveTrue(consultation.getPatient().getId(), previous.getId())
                .ifPresent(PatientMatch::deactivate);
        return AdminMatchingResponse.RequestItem.from(consultation);
    }

    // ─── AD-06-3 매칭 현황 ──────────────────────────────────────────────────

    public AdminMatchingResponse.StatusSummary getStatusSummary(UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        return new AdminMatchingResponse.StatusSummary(
                consultationRepository.countByCenterAndMatchingStatusIn(
                        center.getId(), List.of(MatchingStatus.ASSIGNED)),
                consultationRepository.countByCenterAndMatchingStatusIn(
                        center.getId(), List.of(MatchingStatus.PENDING)),
                consultationRepository.countByCenterAndMatchingStatusIn(
                        center.getId(), List.of(MatchingStatus.REJECTED, MatchingStatus.CANCELLED)));
    }

    // ─── AD-06-4 일정 캘린더 ────────────────────────────────────────────────

    public List<AdminMatchingResponse.CalendarDay> getCalendar(LocalDate from, LocalDate to,
                                                               UserPrincipal principal) {
        Center center = adminService.getAdminCenter(principal);
        LocalDate start = from != null ? from : YearMonth.now().atDay(1);
        LocalDate end = to != null ? to : YearMonth.from(start).atEndOfMonth();

        Map<LocalDate, List<AdminMatchingResponse.CalendarItem>> byDate = new LinkedHashMap<>();
        consultationRepository
                .findCalendarByCenter(center.getId(), start.atStartOfDay(), end.atTime(23, 59, 59))
                .forEach(c -> byDate
                        .computeIfAbsent(c.getConsultationDate().toLocalDate(), k -> new java.util.ArrayList<>())
                        .add(AdminMatchingResponse.CalendarItem.from(c)));

        return byDate.entrySet().stream()
                .map(e -> new AdminMatchingResponse.CalendarDay(
                        e.getKey(),
                        e.getValue().size(),
                        e.getValue().stream()
                                .filter(i -> i.matchingStatus() == MatchingStatus.ASSIGNED).count(),
                        e.getValue().stream()
                                .filter(i -> i.matchingStatus() == MatchingStatus.PENDING).count(),
                        e.getValue()))
                .toList();
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private void ensureActiveMatch(Patient patient, Interpreter interpreter, UUID adminAuthUserId) {
        if (patientMatchRepository.existsByPatientIdAndInterpreterIdAndActiveTrue(
                patient.getId(), interpreter.getId())) {
            return;
        }
        patientMatchRepository.save(PatientMatch.builder()
                .patient(patient)
                .interpreter(interpreter)
                .assignedByAuthUserId(adminAuthUserId)
                .build());
    }

    private Consultation findInCenter(UUID consultationId, Center center) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.CONSULTATION_NOT_FOUND));
        boolean byInterpreter = consultation.getInterpreter() != null
                && consultation.getInterpreter().getCenter() != null
                && consultation.getInterpreter().getCenter().getId().equals(center.getId());
        boolean byPatient = consultation.getPatient().getPatientCenters().stream()
                .anyMatch(pc -> pc.getCenter().getId().equals(center.getId()));
        if (!byInterpreter && !byPatient) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN, "다른 센터의 요청입니다");
        }
        return consultation;
    }

    private void requireSameCenter(Interpreter interpreter, Center center) {
        if (interpreter.getCenter() == null || !interpreter.getCenter().getId().equals(center.getId())) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN, "같은 센터 통번역가에게만 배정할 수 있습니다");
        }
    }

    private boolean matchesLanguage(Interpreter interpreter, String language) {
        if (language == null) return false;
        return interpreter.getLanguages().stream()
                .anyMatch(l -> language.equals(normalize(l)));
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : null;
    }

    private LocalDateTime startOf(LocalDate date) {
        return date != null ? date.atStartOfDay() : MIN_DATE;
    }

    private LocalDateTime endOf(LocalDate date) {
        return date != null ? date.atTime(23, 59, 59) : MAX_DATE;
    }
}
