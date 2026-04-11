package com.byby.backend.common.response.code;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BusinessErrorCode implements Code {
    USER_NOT_FOUND(404, "사용자를 찾을 수 없습니다."),
    ;

    private final int statusCode;
    private final String message;
}
