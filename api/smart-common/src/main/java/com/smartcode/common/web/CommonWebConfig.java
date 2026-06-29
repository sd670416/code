package com.smartcode.common.web;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 公共 Web 配置，注册所有业务服务通用的 Servlet 组件。
 *
 * @since 2026-06-29
 */
@Configuration
public class CommonWebConfig {
    /**
     * 注册 TraceId 过滤器，并让它尽早执行以覆盖后续日志和异常响应。
     *
     * @return TraceId 过滤器注册信息
     */
    @Bean
    public FilterRegistrationBean<TraceIdFilter> traceIdFilter() {
        FilterRegistrationBean<TraceIdFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new TraceIdFilter());
        registration.setOrder(Integer.MIN_VALUE);
        return registration;
    }
}
