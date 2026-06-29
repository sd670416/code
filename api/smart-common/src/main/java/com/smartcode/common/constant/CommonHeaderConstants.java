package com.smartcode.common.constant;

/**
 * HTTP 请求头常量，集中管理跨模块复用的 Header 名称。
 *
 * @since 2026-06-29
 */
public final class CommonHeaderConstants {
    /** 链路追踪请求头，前后端和网关统一使用该名称传递 TraceId。 */
    public static final String TRACE_ID = "X-Trace-Id";

    private CommonHeaderConstants() {
    }
}
