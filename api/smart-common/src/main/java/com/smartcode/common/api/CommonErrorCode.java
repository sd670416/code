package com.smartcode.common.api;

/**
 * 平台通用错误码，覆盖参数、业务和系统级兜底异常。
 *
 * @since 2026-06-29
 */
public enum CommonErrorCode implements ErrorCode {
    /** 参数错误，主要对应请求体缺失、格式错误和 Bean Validation 失败。 */
    PARAM_INVALID("13000", "参数错误"),
    /** 通用业务错误，适用于暂未细分领域错误码的业务失败。 */
    BUSINESS_ERROR("20000", "业务处理失败"),
    /** 系统异常，兜底未知错误，不能向前端暴露内部堆栈。 */
    SYSTEM_ERROR("90000", "系统异常");

    /** 对外返回的错误码。 */
    private final String code;
    /** 对外返回的默认错误消息。 */
    private final String message;

    /**
     * 创建通用错误码枚举项。
     *
     * @param code 错误码
     * @param message 默认错误消息
     */
    CommonErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    /**
     * 获取错误码。
     *
     * @return 错误码字符串
     */
    @Override
    public String code() {
        return code;
    }

    /**
     * 获取默认错误消息。
     *
     * @return 默认错误消息
     */
    @Override
    public String message() {
        return message;
    }
}
