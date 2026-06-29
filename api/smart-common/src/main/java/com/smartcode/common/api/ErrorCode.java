package com.smartcode.common.api;

/**
 * 错误码基础接口，所有业务错误码枚举必须实现该接口。
 *
 * @since 2026-06-29
 */
public interface ErrorCode {
    /**
     * 获取错误码。
     *
     * @return 错误码字符串
     */
    String code();

    /**
     * 获取默认错误消息。
     *
     * @return 默认错误消息
     */
    String message();
}
