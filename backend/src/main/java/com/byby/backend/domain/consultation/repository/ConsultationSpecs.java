package com.byby.backend.domain.consultation.repository;

import com.byby.backend.common.enums.Nationality;
import com.byby.backend.common.enums.ReportStatus;
import com.byby.backend.domain.consultation.entity.Consultation;
import com.byby.backend.domain.patient.entity.PatientCenter;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.UUID;

/**
 * AD-보고서-4 필터링(작성일자순 / 환자 국적별 / 병원별 / 통번역가별) 조합용 Specification 모음.
 * 각 팩토리는 필터가 비어 있으면 null 을 반환하고, {@link #allOf} 가 null 을 건너뛴다.
 */
public final class ConsultationSpecs {

    private ConsultationSpecs() {}

    @SafeVarargs
    public static Specification<Consultation> allOf(Specification<Consultation>... specs) {
        Specification<Consultation> result = null;
        for (Specification<Consultation> spec : specs) {
            if (spec == null) continue;
            result = (result == null) ? spec : result.and(spec);
        }
        return result;
    }

    /**
     * 통번역가 소속 센터 또는 이주민 소속 센터가 일치하면 센터 소관 건으로 본다.
     * 이주민 쪽은 상관 서브쿼리(EXISTS)로 확인해 결과 행이 중복되지 않게 한다.
     */
    public static Specification<Consultation> inCenter(UUID centerId) {
        return (root, query, cb) -> {
            Predicate byInterpreterCenter = cb.equal(
                    root.join("interpreter", JoinType.LEFT)
                        .join("center", JoinType.LEFT).get("id"), centerId);
            if (query == null) return byInterpreterCenter;

            Subquery<Integer> sub = query.subquery(Integer.class);
            Root<PatientCenter> pc = sub.from(PatientCenter.class);
            sub.select(cb.literal(1)).where(
                    cb.equal(pc.get("patient").get("id"), root.get("patient").get("id")),
                    cb.equal(pc.get("center").get("id"), centerId));

            return cb.or(byInterpreterCenter, cb.exists(sub));
        };
    }

    public static Specification<Consultation> reportStatusIn(Collection<ReportStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) return null;
        return (root, query, cb) -> root.get("reportStatus").in(statuses);
    }

    public static Specification<Consultation> nationality(Nationality nationality) {
        if (nationality == null) return null;
        return (root, query, cb) -> cb.equal(root.get("patient").get("nationality"), nationality);
    }

    public static Specification<Consultation> interpreterId(UUID interpreterId) {
        if (interpreterId == null) return null;
        return (root, query, cb) -> cb.equal(
                root.join("interpreter", JoinType.LEFT).get("id"), interpreterId);
    }

    public static Specification<Consultation> hospitalId(UUID hospitalId) {
        if (hospitalId == null) return null;
        return (root, query, cb) -> cb.equal(
                root.join("hospital", JoinType.LEFT).get("id"), hospitalId);
    }

    /** 병원 엔티티 연결 건과 자유 입력 병원명을 함께 매칭한다. */
    public static Specification<Consultation> hospitalNameLike(String hospitalName) {
        if (!StringUtils.hasText(hospitalName)) return null;
        String pattern = "%" + hospitalName.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(cb.coalesce(root.get("hospitalName"), "")), pattern),
                cb.like(cb.lower(cb.coalesce(
                        root.join("hospital", JoinType.LEFT).get("name"), "")), pattern));
    }

    public static Specification<Consultation> dateFrom(LocalDateTime from) {
        if (from == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("consultationDate"), from);
    }

    public static Specification<Consultation> dateTo(LocalDateTime to) {
        if (to == null) return null;
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("consultationDate"), to);
    }

    public static Specification<Consultation> patientQuery(String query) {
        if (!StringUtils.hasText(query)) return null;
        String pattern = "%" + query.trim().toLowerCase() + "%";
        return (root, q, cb) -> cb.or(
                cb.like(cb.lower(root.get("patient").get("name")), pattern),
                cb.like(cb.lower(cb.coalesce(root.get("patient").get("phone"), "")), pattern),
                cb.like(cb.lower(cb.coalesce(root.get("patient").get("region"), "")), pattern));
    }
}
