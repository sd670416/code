package com.smartcode.common.exception;

import com.smartcode.common.api.CommonErrorCode;
import com.smartcode.common.api.ErrorCode;

/**
 * 业务异常，表示可预期、可向前端展示的业务失败。
 *
 * @since 2026-06-29
 */
public class BusinessException extends RuntimeException {
    /** 业务错误码，用于统一响应结构和前端错误处理。 */
    private final ErrorCode errorCode;

    /**
     * 使用通用业务错误码创建异常。
     *
     * @param message 业务错误消息
     */
    public BusinessException(String message) {
        this(CommonErrorCode.BUSINESS_ERROR, message);
    }

    /**
     * 使用指定错误码创建异常，错误消息取错误码默认值。
     *
     * @param errorCode 错误码定义
     */
    public BusinessException(ErrorCode errorCode) {
        this(errorCode, errorCode.message());
    }

    /**
     * 使用指定错误码和错误消息创建异常。
     *
     * @param errorCode 错误码定义
     * @param message 业务错误消息
     */
    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    /**
     * 获取业务错误码。
     *
     * @return 错误码定义
     */
    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
