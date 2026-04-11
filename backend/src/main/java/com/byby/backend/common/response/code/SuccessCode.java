package com.byby.backend.common.response.code;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SuccessCode implements Code {

    OK(200, "요청이 성공적으로 처리되었습니다."),
    CREATED(201, "리소스가 성공적으로 생성되었습니다."),
    ACCEPTED(202, "요청이 수락되었지만 아직 처리되지 않았습니다."),
    NO_CONTENT(204, "요청이 성공적으로 처리되었지만 반환할 콘텐츠가 없습니다."),
    ;

    private final int statusCode;
    private final String message;

}
