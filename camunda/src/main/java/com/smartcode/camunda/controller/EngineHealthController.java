package com.smartcode.camunda.controller;

import org.camunda.bpm.engine.ProcessEngine;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Camunda 引擎健康检查接口，用于确认外置流程服务和流程引擎可用。
 *
 * @since 2026-06-29
 */
@RestController
@RequestMapping("/engine/health")
public class EngineHealthController {
    /** Camunda 流程引擎，用于读取当前引擎名称并验证引擎 Bean 已初始化。 */
    private final ProcessEngine processEngine;

    /**
     * 创建 Camunda 健康检查控制器。
     *
     * @param processEngine Camunda 流程引擎
     */
    public EngineHealthController(ProcessEngine processEngine) {
        this.processEngine = processEngine;
    }

    /**
     * 查询 Camunda 外置服务健康状态。
     *
     * @return 服务名称、状态和 Camunda 引擎名称
     */
    @GetMapping
    public Map<String, String> health() {
        return Map.of(
                "service", "camunda-backend",
                "status", "UP",
                "engine", processEngine.getName()
        );
    }
}
