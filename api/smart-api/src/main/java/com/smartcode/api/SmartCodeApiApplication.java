package com.smartcode.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 主平台后端启动类，负责启动低代码 SaaS 平台 API 服务。
 *
 * @since 2026-06-29
 */
@SpringBootApplication(scanBasePackages = "com.smartcode")
public class SmartCodeApiApplication {
    /**
     * 应用启动入口。
     *
     * @param args JVM 启动参数
     */
    public static void main(String[] args) {
        SpringApplication.run(SmartCodeApiApplication.class, args);
    }
}
