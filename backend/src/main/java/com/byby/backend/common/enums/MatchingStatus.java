package com.byby.backend.common.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 통번역 요청 배정 상태 (AD-06 매칭 관리) */
@Getter
@RequiredArgsConstructor
public enum MatchingStatus {
    PENDING("배정 대기"),
    ASSIGNED("배정 확정"),
    REJECTED("거절"),
    CANCELLED("취소");

    private final String label;
}
