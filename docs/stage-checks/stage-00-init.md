# 阶段 0：项目初始化验收记录

## 1. 阶段目标

- 创建主平台后端 `api`。
- 创建统一前端 `web`。
- 创建外置工作流后端 `camunda`。
- 明确流程设计器页面后续直接集成到统一前端 `web`。
- 建立统一返回、错误码、异常处理、TraceId 基础封装。

## 2. 已完成内容

- `api` 已创建 Maven 多模块工程。
- `api/smart-common` 已提供 `ApiResult`、`ErrorCode`、`BusinessException`、全局异常处理和 TraceId 过滤器。
- `api/smart-api` 已提供启动类和健康检查接口。
- `camunda` 已创建 Spring Boot 2.7 + Camunda 7.19 骨架。
- `camunda` 已提供 Camunda 引擎健康检查接口。
- `web` 已创建 Vue 3 + Vite + TypeScript + Naive UI 骨架。
- `web` 已提供统一主布局和阶段 0 状态页。
- `web` 已明确为唯一前端入口，后续承载 BPMN 设计器和流程配置页面。

## 3. 数据库变更

- 阶段 0 暂未接入 MySQL。
- `camunda` 开发环境暂用 H2 内存库，后续阶段切换 MySQL 8。

## 4. 后端接口

| 服务 | 接口 | 说明 |
| --- | --- | --- |
| `api` | `GET /system/health` | 主平台健康检查 |
| `camunda` | `GET /engine/health` | Camunda 引擎健康检查 |

## 5. 前端页面

- `GET /`：阶段 0 初始化状态页。
- 左侧菜单预留工作台、应用管理、流程管理、系统管理。

## 6. 测试结果

| 测试项 | 结果 | 备注 |
| --- | --- | --- |
| `api` 干净构建 | 通过 | `mvn clean -pl smart-api -am -DskipTests package` |
| `api` 本地仓库安装 | 通过 | `mvn -DskipTests install`，已写入新的 Maven 本地仓库 |
| `api` 启动验证 | 通过 | `GET /system/health` 返回 `smart-api / UP` |
| `camunda` 干净构建 | 通过 | `mvn clean -DskipTests package` |
| `camunda` 启动验证 | 通过 | `GET /engine/health` 返回 `camunda-backend / default / UP` |
| `web` 构建 | 通过 | `pnpm build` |
| `web` 启动验证 | 通过 | `GET /` 返回 200，标题为 `smart-code` |

## 7. 演示路径

- `http://localhost:18082`
- `http://localhost:18080/system/health`
- `http://localhost:18081/engine/health`

## 8. 遗留问题

- 阶段 0 尚未接入 MySQL、Redis。
- 阶段 0 尚未实现登录、租户、菜单、权限。
- 阶段 0 尚未迁移 BPMN 设计器。
- `web` 当前生产构建存在 Vite 大包提示，后续接入路由懒加载和手动分包处理。
- `camunda` 当前开发环境使用 H2，阶段 1/2 切换为 MySQL 8。

## 9. 是否允许进入下一阶段

结论：允许进入阶段 1

原因：

- 阶段 0 的工程骨架、统一返回结构、前端 Naive UI 骨架、Camunda 外置服务骨架已完成。
- 主平台后端、Camunda 服务、统一前端均已完成构建和本地启动验证。
