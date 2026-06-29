package com.smartcode.api.system.controller;

import com.smartcode.common.api.ApiResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 主平台健康检查接口，用于前端和部署环境确认 API 服务存活。
 *
 * @since 2026-06-29
 */
@RestController
@RequestMapping("/system/health")
public class HealthController {
    /**
     * 查询主平台 API 健康状态。
     *
     * @return 统一响应，包含服务名称和 UP 状态
     */
    @GetMapping
    public ApiResult<Map<String, String>> health() {
        return ApiResult.ok(Map.of("service", "smart-api", "status", "UP"));
    }
}
