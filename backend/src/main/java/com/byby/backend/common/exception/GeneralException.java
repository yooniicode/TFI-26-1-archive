package com.byby.backend.common.exception;

import com.byby.backend.common.response.code.BusinessErrorCode;
import com.byby.backend.common.response.code.GeneralErrorCode;
import lombok.Getter;

@Getter
public class GeneralException extends RuntimeException {

    private final GeneralErrorCode errorCode;

    public GeneralException(GeneralErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public GeneralException(GeneralErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}