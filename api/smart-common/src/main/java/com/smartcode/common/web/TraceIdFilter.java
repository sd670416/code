package com.smartcode.common.web;

import com.smartcode.common.api.TraceId;
import com.smartcode.common.constant.CommonHeaderConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * TraceId 过滤器，负责从请求头读取链路编号并写回响应头。
 *
 * @since 2026-06-29
 */
public class TraceIdFilter extends OncePerRequestFilter {
    /**
     * 为当前请求绑定 TraceId。
     *
     * @param request HTTP 请求对象
     * @param response HTTP 响应对象
     * @param filterChain Servlet 过滤器链
     * @throws ServletException 下游 Servlet 处理异常
     * @throws IOException 下游 IO 处理异常
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String traceId = request.getHeader(CommonHeaderConstants.TRACE_ID);
            if (traceId != null && !traceId.isBlank()) {
                TraceId.set(traceId);
            }
            response.setHeader(CommonHeaderConstants.TRACE_ID, TraceId.current());
            filterChain.doFilter(request, response);
        } finally {
            TraceId.clear();
        }
    }
}
