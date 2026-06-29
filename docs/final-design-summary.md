# smart-code 最终设计总结

## 1. 参考项目定位

本次设计参考了三个已有项目，但三者职责不同，不能简单合并：

| 项目 | 路径 | 定位 | 新平台采用方式 |
| --- | --- | --- | --- |
| Smart 基础框架 | `F:\project\smart` | 通用后台框架，业务少，包含系统、权限、租户、代码生成、文件、任务、消息、前端 TS/Naive UI 版本 | 作为 `smart-code` 的平台底座参考 |
| 工程管理系统 | `F:\project\gongcheng` | 业务系统，包含你之前写的 Camunda 7 二次开发和工程业务集成 | 作为工作流实战经验和审批动作参考 |
| BPMN 设计器 | `F:\project\vite-vue-bpmn-process-dev` | 独立 BPMN 设计器项目 | 作为流程设计器组件参考 |

结论：

- 新平台不是复制 `gongcheng`。
- 新平台应以 `F:\project\smart` 的框架能力作为基础。
- 工作流能力吸收 `gongcheng` 的 Camunda 7 二次开发经验。
- BPMN 设计器吸收 `vite-vue-bpmn-process-dev` 和 `smart-web2/src/components/bpmn` 的实现。

## 2. Smart 基础框架分析

### 2.1 后端 `smart-boot`

路径：

```text
F:\project\smart\smart-boot
```

技术栈：

- Java 8。
- Spring Boot 2.7.9。
- MyBatis-Plus。
- Spring Security OAuth2 / JWT。
- Redis。
- MySQL 8。
- Camunda 7.19。
- Xxl-Job。
- 文件存储：本地、Minio、OSS、COS。

主要模块：

```text
smart-app          启动模块
smart-auth         认证、Token、路由
smart-system       租户、用户、部门、岗位、角色、菜单、按钮、数据权限
smart-service      通用 Service
smart-entity       实体
smart-mybatis      MyBatis-Plus 封装
smart-aop          权限、日志、切面
smart-gen          代码生成器
smart-file         文件管理
smart-job          定时任务
smart-message      消息通知
smart-flow         Camunda 工作流
smart-report       报表
smart-tools        工具能力
```

可复用价值：

- 租户、用户、部门、岗位、角色、菜单、按钮、数据权限的业务模型。
- `@HasPermission` 权限注解思想。
- 角色分配菜单、按钮、数据权限的管理页面和接口模式。
- 路由由后端菜单生成的模式。
- 操作日志、异常日志、登录日志。
- 文件存储、消息通知、定时任务、代码生成器。
- MyBatis-Plus 基础封装。

需要改造的点：

- 新平台主后端要求 JDK 21 + Spring Boot 3，不能直接照搬 Java 8 / Spring Boot 2.7 的工程。
- Spring Security OAuth2 老版本不适合直接迁移到 Spring Boot 3，建议改为 Sa-Token 或 Spring Security 6 + JWT。
- 原框架角色菜单偏平台后台，需要扩展为“平台级权限 + 应用级权限”两层。
- 原工作流 `smart-flow` 仍是内嵌 Camunda，新平台应拆到 `code/camunda/backend` 外置服务。
- 原接口返回多为字符串 JSON，新平台建议统一为强类型 DTO。

### 2.2 前端 `smart-web2`

路径：

```text
F:\project\smart\smart-web2
```

技术栈：

- Vue 3。
- Vite 5。
- TypeScript。
- Naive UI。
- Pinia。
- Vue Router。
- UnoCSS。
- Soybean Admin。
- bpmn-js 13.2。
- camunda-bpmn-moddle。
- bpmn-js-properties-panel。
- lucide-vue-next。

已有能力：

- 登录、Token、刷新 Token。
- 租户请求头 `Tenant-Id`。
- 当前菜单请求头 `Menu-Id`。
- 身份请求头 `Identity-Id`。
- 动态路由。
- 菜单管理。
- 角色管理。
- 菜单授权、按钮授权、数据权限授权。
- 系统管理页面。
- 流程管理页面：
  - 业务类型。
  - 流程设计。
  - 流程定义。
  - 流程实例。
  - 发起流程。
  - 任务中心。
  - 我的发起。
  - 流程统计。
- BPMN 设计器组件：
  - `src/components/bpmn`
  - `src/views/flow/bpmn`

可复用价值：

- 新版 `code/web` 可以直接参考 `smart-web2` 的项目结构。
- Naive UI 组件封装、表格页、搜索表单、弹窗、抽屉可以复用设计模式。
- 动态路由、后端菜单、权限按钮模式可作为基础。
- BPMN 设计器依赖和组件目录可迁移到 `code/camunda/web`，再集成到 `code/web`。
- `views/flow` 可作为流程管理页面的第一版参考。

需要改造的点：

- 前端最终只保留一个用户入口：`code/web`。
- `code/camunda/web` 不独立部署，只沉淀流程设计器组件。
- 菜单要区分平台菜单和应用菜单。
- 表单页面要支持无流程、有流程两种运行模式。
- 原流程页面更多围绕 Camunda 流程定义，新平台还要围绕低代码应用、表单、数据记录、流程绑定。

## 3. 新平台最终工程结构

```text
code
  api
    smart-api              主启动模块
    smart-system           租户、用户、组织、角色、平台菜单、平台权限
    smart-app              应用、应用菜单、应用角色、应用权限
    smart-form             表单设计、表单版本、字段模型
    smart-data             动态业务数据、索引、无流程提交
    smart-workflow         流程定义元数据、表单流程绑定、任务快照、审批历史
    smart-integration      Camunda 客户端、回调、同步修复
    smart-common           公共能力

  web
    主平台统一前端入口
    平台管理、应用管理、表单运行、流程设计、任务中心全部在这里访问

  camunda
    backend
      外置 Camunda 7 服务
      流程部署、实例启动、审批动作、监听器、候选人解析
    web
      BPMN 设计器和流程配置组件源码
      不作为独立后台部署
```

## 4. 前端是否拆分的最终结论

不拆成两个用户系统。

用户只访问：

```text
code/web
```

原因：

- 登录态统一。
- 平台菜单和应用菜单统一。
- 平台角色和应用角色统一。
- 表单、流程、任务中心需要共享同一业务上下文。
- 避免流程设计、任务中心、应用表单之间来回跳转到不同系统。

`code/camunda/web` 的定位：

- 存放 BPMN 设计器源码。
- 存放节点属性面板。
- 存放审批按钮配置组件。
- 存放候选人配置组件。
- 存放表单字段权限配置组件。
- 最终被 `code/web` 引用。

## 5. 表单运行模式

低代码表单必须支持两类场景：

### 5.1 无流程表单

适用：

- 台账。
- 档案。
- 基础数据。
- 普通信息采集。

行为：

```text
填写表单
  -> 保存或提交
  -> 写 form_record
  -> record_status = SUBMITTED
  -> workflow_mode = NONE
  -> flow_status = NONE
  -> 不创建 flow_instance
  -> 不调用 Camunda
```

### 5.2 有流程表单

适用：

- 请假。
- 合同。
- 费用。
- 采购。
- 需要审批留痕的业务。

行为：

```text
填写表单
  -> 保存草稿
  -> record_status = DRAFT
  -> flow_status = DRAFT
  -> 不创建 Camunda 实例

发起流程
  -> 保存业务数据
  -> 创建 flow_instance
  -> 调用 camunda/backend 启动流程
  -> 同步 flow_task_snapshot
  -> record_status = PROCESSING
  -> flow_status = PROCESSING
```

### 5.3 可选流程表单

适用：

- 同一个表单部分场景需要审批，部分场景不需要审批。

行为：

- 直接提交时按无流程处理。
- 选择发起审批时按有流程处理。

## 6. 权限模型最终结论

权限分两层：

| 层级 | 菜单表 | 角色类型 | 说明 |
| --- | --- | --- | --- |
| 平台级 | `platform_menu` | `PLATFORM` | 租户、用户、系统配置、应用管理、流程监控等平台能力 |
| 应用级 | `app_menu` | `APP` | 某个应用内的表单、页面、报表、流程入口 |

规则：

- 平台菜单权限可配置到人员。
- 应用菜单权限也可配置到人员。
- 登录后先加载平台菜单。
- 进入应用后加载应用菜单。
- 后端 API 必须同时校验租户、应用、角色、菜单、按钮权限。
- 前端隐藏按钮只是体验优化，不能作为安全边界。

## 7. Camunda 选型最终结论

第一版选择 Camunda 7，不选 Camunda 8。

原因：

- 旧代码已经基于 Camunda 7.19。
- 退回、退回发起人、任意退回、拿回、多实例处理依赖 Camunda 7 的运行时执行树和流程实例修改能力。
- Camunda 8 / Zeebe 的流程实例修改、任务处理、作业模型差异较大，迁移成本高。
- 现阶段目标是先把低代码平台和 OA 审批闭环跑稳。

部署方式：

```text
api: JDK 21 + Spring Boot 3
camunda/backend: Spring Boot 2.7 + Camunda 7.19+
```

这样可以规避 Spring Boot 3 与 Camunda 7 starter 的兼容风险。

## 8. 旧工作流代码采用策略

来自 `gongcheng` 和 `smart-boot/smart-flow` 的旧工作流代码：

可保留思想：

- 审批动作集合。
- 业务类型。
- 流程定义管理。
- 流程实例管理。
- 任务中心。
- 我的发起。
- 审批历史。
- BPMN 扩展属性。
- 候选人解析。
- 监听器回调。

不建议原样搬：

- `TaskOperateServiceImpl` 过大，应拆分为独立 `ActionHandler`。
- 权限校验要按 SaaS 平台重做。
- 幂等、并发锁、重复提交控制要补齐。
- 审批历史和任务快照要拆表。
- 任意退回、复杂网关、多实例退回必须最后做，并建立测试矩阵。

## 9. 推荐开发路线

第一轮 MVP 做到：

1. 平台基础框架。
2. 平台菜单权限。
3. 应用菜单权限。
4. 无流程表单创建、提交、查看。
5. 有流程表单保存草稿。
6. 有流程表单发起审批。
7. Camunda 7 最小流程部署、启动、办理。
8. 流程设计器集成。
9. 审批操作第一期：
   - 办理。
   - 退回上一节点。
   - 退回发起人。
   - 终止。
   - 拿回。
10. 任务中心和审批历史。

第一轮暂不做：

- 任意退回。
- 并行网关退回。
- 包容网关退回。
- 子流程。
- 复杂多实例退回。
- 租户计费。
- 高级报表。

## 10. 最终建议

新版 `smart-code` 的最佳路径是：

```text
以 F:\project\smart 为基础框架底座
  + 吸收 smart-web2 的 Naive UI / TS / 动态路由 / 权限页面
  + 吸收 smart-boot 的租户、用户、角色、菜单、按钮、数据权限、代码生成、文件、日志
  + 吸收 gongcheng 的 Camunda 7 审批动作经验
  + 吸收 vite-vue-bpmn-process-dev 和 smart-web2/components/bpmn 的设计器能力
  = 重构成 smart-code 低代码 SaaS + 工作流平台
```

开发时优先保证：

- 一个前端入口。
- 两层菜单权限。
- 表单可无流程运行。
- 有流程表单可保存草稿。
- Camunda 外置。
- 审批动作逐步开放。
- 每阶段验收后再进入下一阶段。

## 11. 开发规范要求

详细规范见：

```text
code/docs/development-standards.md
```

核心要求：

- 代码风格简练，优先使用公共封装。
- Controller 保持薄层，不写复杂业务逻辑。
- 接口层、应用层、领域层、持久层职责明确。
- 后端统一返回结构 `ApiResult<T>`。
- 错误码按认证、权限、租户、参数、业务、表单、工作流、Camunda、系统异常分类。
- DTO、Query、VO、BO、Entity、Command、Event 分工明确。
- Controller 入参不直接使用 Entity，返回不直接暴露 Entity。
- Service 方法表达明确业务动作，复杂审批动作拆为 `ActionHandler`。
- Mapper 只负责持久化，不写业务规则和权限逻辑。
- 前端统一从 `api` 层调用接口，页面不直接使用 axios。
- Vue 页面保持轻量，复杂逻辑放入 composables，通用能力封装为组件。
- 前端类型要清晰，避免默认使用 `any`。
- 文件结构按模块聚合，长期可维护优先。
