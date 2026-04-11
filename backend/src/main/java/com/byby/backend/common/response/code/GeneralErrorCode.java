package com.byby.backend.common.response.code;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GeneralErrorCode implements Code {

    INTERNAL_SERVER_ERROR(500, "서버 내부 오류가 발생했습니다."),
    BAD_REQUEST(400, "잘못된 요청입니다."),
    UNAUTHORIZED(401, "인증이 필요합니다."),
    FORBIDDEN(403, "접근 권한이 없습니다."),
    NOT_FOUND(404, "리소스를 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(405, "지원하지 않는 HTTP 메서드입니다."),
    UNSUPPORTED_MEDIA_TYPE(415, "지원하지 않는 미디어 타입입니다."),

    VALIDATION_ERROR(400, "입력값이 올바르지 않습니다."),

    INVALID_TOKEN(401, "유효하지 않은 토큰입니다."),
    TOKEN_EXPIRED(401, "토큰이 만료되었습니다."),
    REFRESH_TOKEN_EXPIRED(401, "리프레시 토큰이 만료되었습니다. 다시 로그인해 주세요."),

    INVALID_SEARCH_KEYWORD(400, "검색어는 공백일 수 없습니다."),

    INVALID_PAGE_REQUEST(400, "page는 0 이상, size는 1~100 사이여야 합니다."),

    INVALID_REQUEST_PARAMETER(400, "잘못된 요청 파라미터입니다.");

    private final int statusCode;
    private final String message;
}

