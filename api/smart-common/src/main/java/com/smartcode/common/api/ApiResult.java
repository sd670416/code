package com.smartcode.common.api;

import java.time.Instant;

/**
 * 统一接口返回结构，保证前后端只处理一套响应协议。
 *
 * @param code 错误码，成功固定为 0
 * @param message 响应消息，失败时为可展示错误说明
 * @param data 业务数据载荷，允许为空
 * @param traceId 链路追踪 ID，用于日志排查
 * @param timestamp 服务端响应时间戳，单位毫秒
 * @param <T> 业务数据类型
 * @since 2026-06-29
 */
public record ApiResult<T>(
        String code,
        String message,
        T data,
        String traceId,
        Long timestamp
) {
    /**
     * 构造成功响应。
     *
     * @param data 业务数据载荷
     * @param <T> 业务数据类型
     * @return 统一成功响应
     */
    public static <T> ApiResult<T> ok(T data) {
        return new ApiResult<>("0", "success", data, TraceId.current(), Instant.now().toEpochMilli());
    }

    /**
     * 构造无业务数据的失败响应。
     *
     * @param errorCode 错误码定义
     * @param <T> 业务数据类型
     * @return 统一失败响应
     */
    public static <T> ApiResult<T> fail(ErrorCode errorCode) {
        return fail(errorCode, null);
    }

    /**
     * 构造带业务数据的失败响应，适用于需要附带校验详情的场景。
     *
     * @param errorCode 错误码定义
     * @param data 失败附加数据
     * @param <T> 业务数据类型
     * @return 统一失败响应
     */
    public static <T> ApiResult<T> fail(ErrorCode errorCode, T data) {
        return new ApiResult<>(
                errorCode.code(),
                errorCode.message(),
                data,
                TraceId.current(),
                Instant.now().toEpochMilli()
        );
    }
}
