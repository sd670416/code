package com.smartcode.common.api;

import java.util.UUID;

/**
 * 当前请求线程的 TraceId 持有器，用于统一响应和日志追踪。
 *
 * @since 2026-06-29
 */
public final class TraceId {
    /** 当前线程绑定的 TraceId，Filter 会在请求结束时清理。 */
    private static final ThreadLocal<String> HOLDER = new ThreadLocal<>();

    private TraceId() {
    }

    /**
     * 获取当前线程 TraceId；不存在时自动生成，避免响应缺少追踪编号。
     *
     * @return 当前 TraceId
     */
    public static String current() {
        String traceId = HOLDER.get();
        if (traceId == null) {
            traceId = UUID.randomUUID().toString().replace("-", "");
            HOLDER.set(traceId);
        }
        return traceId;
    }

    /**
     * 设置当前线程 TraceId，通常来自请求头。
     *
     * @param traceId 外部传入的链路追踪 ID
     */
    public static void set(String traceId) {
        HOLDER.set(traceId);
    }

    /**
     * 清理当前线程 TraceId，防止线程复用时串号。
     */
    public static void clear() {
        HOLDER.remove();
    }
}
