package com.smartcode.camunda;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Camunda 外置服务启动类，承载 Camunda 7 引擎和二次开发接口。
 *
 * @since 2026-06-29
 */
@SpringBootApplication
public class SmartCamundaApiApplication {
    /**
     * 应用启动入口。
     *
     * @param args JVM 启动参数
     */
    public static void main(String[] args) {
        SpringApplication.run(SmartCamundaApiApplication.class, args);
    }
}
