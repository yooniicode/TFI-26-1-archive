package com.byby.backend.domain.center.service;

import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.admin.entity.AdminProfile;
import com.byby.backend.domain.admin.repository.AdminProfileRepository;
import com.byby.backend.domain.center.dto.CenterRequest;
import com.byby.backend.domain.center.dto.CenterResponse;
import com.byby.backend.domain.center.entity.Center;
import com.byby.backend.domain.center.repository.CenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CenterService {

    private final CenterRepository centerRepository;
    private final AdminProfileRepository adminProfileRepository;

    public Page<CenterResponse.Summary> list(String query, Pageable pageable) {
        return centerRepository.searchActive(query, pageable).map(CenterResponse.Summary::from);
    }

    @Transactional
    public CenterResponse.Summary create(CenterRequest.Upsert req, UserPrincipal principal) {
        requireAdmin(principal);
        Center center = getOrCreateByName(req.name());
        center.update(req.name().trim(), trimToNull(req.address()), trimToNull(req.phone()), req.active());
        return CenterResponse.Summary.from(center);
    }

    @Transactional
    public CenterResponse.Summary update(UUID id, CenterRequest.Upsert req, UserPrincipal principal) {
        requireAdmin(principal);
        Center center = centerRepository.findById(id)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        requireOwnCenterOrUnassigned(center, principal);
        center.update(req.name().trim(), trimToNull(req.address()), trimToNull(req.phone()), req.active());
        return CenterResponse.Summary.from(center);
    }

    @Transactional
    public Center getOrCreateByName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST, "centerName is required");
        }
        String normalized = name.trim();
        return centerRepository.findByNameIgnoreCase(normalized)
                .orElseGet(() -> centerRepository.save(Center.builder().name(normalized).build()));
    }

    public Center find(UUID id) {
        return centerRepository.findById(id)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
    }

    private void requireOwnCenterOrUnassigned(Center center, UserPrincipal principal) {
        AdminProfile profile = adminProfileRepository.findByAuthUserId(principal.getAuthUserId())
                .orElse(null);
        if (profile == null || profile.getCenter() == null) return;
        if (!profile.getCenter().getId().equals(center.getId())) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }
    }

    private void requireAdmin(UserPrincipal principal) {
        if (principal == null) throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        if (!principal.isAdmin()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
