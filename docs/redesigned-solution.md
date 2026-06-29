# smart-code 低代码 SaaS 平台新技术方案

## 1. 方案定位

`smart-code` 不是简单复制旧工程，而是在旧工程工作流经验基础上重构为平台化低代码 SaaS：

- 主平台采用 JDK 21 + Spring Boot 3。
- 前端采用 Vue3 + Vite + TypeScript + Naive UI。
- 工作流采用外置 Camunda 7 工作流服务。
- BPMN 设计器参考 `vite-vue-bpmn-process-dev`，改造成平台内流程设计器。
- 旧 `gongcheng` 的流程业务能力迁移为通用低代码能力。

核心判断：

旧系统审批操作完整度较高，尤其是退回、任意退回、拿回、多实例、网关处理等能力依赖 Camunda 7。新平台如果直接切 Camunda 8，会丢失或重写大量能力。因此第一版选型为外置 Camunda 7 服务。

## 2. 工程结构建议

```text
code
  api
    smart-api              主启动模块
    smart-system           租户、用户、组织、角色、权限
    smart-app              应用、菜单、应用资源
    smart-form             表单设计、表单版本
    smart-data             动态业务数据
    smart-workflow         平台工作流编排和任务快照
    smart-integration      外部服务客户端
    smart-common           公共能力

  camunda
    backend
      engine-app           Camunda 7 外置服务启动模块
      engine-api           对 api 暴露的接口 DTO
      engine-core          Camunda 7 二次开发
      engine-listener      FlowListener、TaskListener
      engine-adapter       Camunda 操作封装
    web
      bpmn-designer        BPMN 设计器源码和流程配置组件

  web
    src
      views
        app
        form
        workflow
        system
      components
        lowcode
        workflow
        bpmn-designer
```

前端只保留一个用户入口：`code/web`。`code/camunda/web` 不作为第二套后台独立部署，定位是流程设计器和流程配置组件的源码目录，成熟后集成到主平台 `web` 的路由、菜单和权限体系中。

## 3. 模块职责

### 3.1 主平台 api

主平台负责 SaaS 和低代码业务：

- 租户隔离。
- 应用管理。
- 菜单权限、操作权限、数据权限。
- 表单设计和动态数据。
- 流程和业务绑定。
- 发起流程前后的业务校验。
- 任务快照和审批历史。
- 对外统一 API。

### 3.2 camunda

`camunda/backend` 负责 Camunda 运行态：

- 流程部署。
- 流程实例启动。
- 任务完成。
- 退回、拿回、终止。
- 转办、委托、解决。
- 下一节点解析。
- 候选人解析。
- Camunda 监听器。
- Camunda 历史查询。

`camunda/web` 负责流程设计器组件沉淀：

- BPMN 设计器。
- 节点属性面板。
- 审批按钮配置。
- 字段权限配置。
- 候选人规则配置。
- 流程图预览组件。

这些组件最终由主平台 `web` 使用，统一登录、统一菜单、统一权限。

### 3.3 web

主平台前端负责平台操作界面：

- 应用工作台。
- 表单设计器。
- 流程设计器。
- 动态业务页面。
- 任务中心。
- 流程监控。
- 权限配置。

## 4. 旧系统映射

| 旧系统模块 | 新系统模块 |
| --- | --- |
| `smart-flow` | `camunda` + `api/smart-workflow` |
| `act_ext_business` | `flow_business_type` 或 `form_def` 分类 |
| `act_ext_business_ref` | `flow_form_bind` |
| `act_ext_history` | `flow_approval_log` |
| `TaskOperateController` | `api` 统一动作接口 + `camunda` 动作接口 |
| `ProcessDefinitionController` | `api` 流程定义 API + `camunda` 部署 API |
| `FlowListener` | `camunda` 监听器 + 回调 `api` |
| `buttonsSetting` | `flow_node_button` |
| `formEditable` | `flow_node_form_permission` |
| `businessKey` | `app_id + form_id + record_id + scene_code` |

## 5. 工作流菜单

新平台保留旧系统菜单能力，并做平台化：

- 发起流程。
- 流程设计。
- 流程定义。
- 流程监控。
- 任务中心。
- 我的流程。
- 业务类型。
- 流程统计。

其中“业务类型”在低代码平台中可表现为：

- 应用业务分类。
- 表单分类。
- 流程场景。

## 6. 核心数据流

### 6.1 无流程表单提交

```text
用户填写业务表单
  -> api 校验表单、字段规则和数据权限
  -> api 保存 form_record
  -> api 设置 record_status = SUBMITTED
  -> api 设置 workflow_mode = NONE、flow_status = NONE
  -> web 返回提交成功或打开详情页
```

适用场景：

- 基础台账。
- 普通信息采集。
- 不需要审批的业务登记。
- 只需要保存和查询的数据表单。

### 6.2 有流程表单保存草稿

```text
用户填写业务表单
  -> 点击保存草稿
  -> api 校验基础字段格式
  -> api 保存或更新 form_record
  -> api 设置 record_status = DRAFT
  -> api 设置 workflow_mode = REQUIRED、flow_status = DRAFT
  -> web 返回草稿保存成功
```

草稿阶段不创建 Camunda 流程实例，也不产生待办。

### 6.3 有流程表单发起流程

```text
用户提交业务表单
  -> api 校验表单和数据权限
  -> api 保存 form_record
  -> api 根据 form_id + scene_code 找流程
  -> api 组装变量
  -> camunda 启动 Camunda 实例
  -> camunda 返回首批任务
  -> api 写 flow_instance 和 flow_task_snapshot
  -> web 打开首个待办或返回提交成功
```

发起成功后：

- `record_status = PROCESSING`。
- `workflow_mode = REQUIRED`。
- `flow_status = PROCESSING`。

### 6.4 办理任务

```text
用户打开待办
  -> api 查询任务快照
  -> api 查询业务数据和字段权限
  -> api 查询节点按钮和候选人
  -> web 渲染表单和审批按钮
  -> 用户提交动作
  -> api 权限校验和业务校验
  -> camunda 执行 Camunda 动作
  -> api 同步任务、历史和业务状态
```

### 6.5 流程发布

```text
BPMN 设计器保存 XML
  -> api 保存 flow_version 草稿
  -> api 解析 SmartProperty
  -> api 校验候选人、按钮、表单权限、网关
  -> camunda 部署 Camunda
  -> api 保存部署结果并设为已发布
```

## 7. 表单与流程结合

旧系统中流程变量保存了完整表单配置和表单值，例如 `form`、`form_antValue`。新平台应标准化：

```json
{
  "tenantId": "1",
  "appId": "100",
  "formId": "200",
  "formVersionId": "201",
  "recordId": "300",
  "businessKey": "100:200:300",
  "businessType": "contract",
  "processInstanceName": "合同审批000XHPW4",
  "startUser": "9001",
  "form": {
    "values": {}
  },
  "form_contractAmount": 1000000
}
```

规则：

- 完整业务数据以 `form_record.data_json` 为准。
- 流程变量只保存流程判断和历史展示所需快照。
- 条件分支使用发布时声明过的变量。
- 节点字段权限从 `flow_node_form_permission` 读取。
- 表单可配置为无流程 `NONE`、可选流程 `OPTIONAL`、必须流程 `REQUIRED`。
- 无流程表单只走业务记录生命周期。
- 有流程表单必须支持保存草稿，草稿不进入 Camunda。

## 8. 权限体系

工作流权限分三层：

- 菜单权限：是否能进入流程设计、任务中心、流程监控等页面。
- 操作权限：是否能办理、退回、终止、转办、委托、加签、拿回。
- 数据权限：是否能看到某应用、某表单、某业务记录、某流程实例。

执行审批动作时必须校验：

- 当前用户属于当前租户。
- 当前用户有当前应用权限。
- 当前用户有任务处理权限。
- 当前节点配置了该按钮。
- 当前角色有按钮操作权限。
- 当前数据权限允许访问业务记录。

## 9. 技术选型

后端主平台：

- JDK 21
- Spring Boot 3
- Spring Security
- MyBatis-Plus
- MySQL 8
- Redis

工作流服务：

- JDK 17 或 JDK 8
- Spring Boot 2.7
- Camunda 7.19+
- MySQL 8

前端：

- Vue 3
- Vite
- TypeScript
- Naive UI
- Pinia
- Vue Router
- BPMN.js
- camunda-bpmn-moddle

## 10. 第一版范围

第一版必须完成：

- 租户、用户、部门、角色。
- 应用、菜单、权限。
- 表单设计和业务数据保存。
- 流程设计器接入。
- 流程发布到外置 Camunda 7。
- 表单绑定流程。
- 发起流程。
- 待办、已办、我的流程。
- 办理、退回至上一节点、退回至发起人、终止。
- 审批历史。
- 节点按钮配置。
- 节点整体表单可编辑配置。

第二版完成：

- 任意退回。
- 转办。
- 委托、解决。
- 拿回。
- 字段级表单权限。
- 流程监控。
- 同步修复。

第三版完成：

- 加签、减签。
- 抄送。
- 超时提醒。
- 流程统计。
- 多实例增强。
- 子流程支持。

## 11. 设计约束

- Camunda 原生 REST 和 Webapp 不暴露给最终用户。
- 所有流程动作必须经过 `api` 权限校验。
- `camunda` 不直接操作业务表。
- `api` 不直接操作 Camunda 表。
- 流程发布后的节点按钮、候选人、表单权限必须固化到版本。
- 历史流程必须使用发起时绑定的表单版本和流程版本。
- 第一版限制复杂并行/多实例退回，避免行为不确定。

