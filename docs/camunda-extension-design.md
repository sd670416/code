# Camunda 外置工作流服务二次开发方案

## 1. 参考结论

本方案参考了旧项目：

- 后端：`F:\project\gongcheng\smart-boot\smart-flow`
- 前端：`F:\project\gongcheng\smart-web\src\views\flow`、`F:\project\gongcheng\smart-web\src\components\flow`
- BPMN 设计器：`F:\project\vite-vue-bpmn-process-dev`

旧系统采用 Camunda 7.19，`smart-flow` 模块直接集成 Camunda Engine，并实现了流程定义、流程设计、流程监控、任务中心、我的流程、发起流程、业务类型绑定、审批记录、候选人解析、节点按钮配置和多种审批动作。

新平台要求 JDK 21、Spring Boot 4.1，同时要求 Camunda 外置。结合旧系统能力，建议采用：

```text
smart-code/api               JDK 21 + Spring Boot 4.1，低代码平台主服务
smart-code/camunda           外置 Camunda 7 工作流服务，承接流程引擎和二次开发
smart-code/web               Vue3 + Vite + TypeScript + Naive UI，统一前端入口，承载 BPMN 设计器和流程配置页面
```

不建议第一版直接采用 Camunda 8 / Zeebe。原因是旧系统必须保留的 `reject`、`rejectFirst`、`rejectCustom`、`getBack`、复杂多实例退回等能力，强依赖 Camunda 7 的 `ProcessInstanceModificationBuilder`、历史任务、活动实例和运行时执行树。Camunda 8 的流程实例修改语义不同，迁移成本和行为风险都更高。

## 2. 新旧职责调整

旧系统：

```text
smart-web
  -> smart-boot/smart-flow
       -> Camunda 7 内嵌引擎
       -> 业务模块回调
```

新系统：

```text
web
  -> api 主平台
       -> camunda 外置工作流服务
            -> Camunda 7 Engine
       -> form/data/app/iam 模块
```

职责边界：

| 模块 | 职责 |
| --- | --- |
| `web` | 统一前端入口，承载平台管理、应用管理、表单运行、流程设计、节点属性、按钮配置、字段权限、候选人配置和任务中心 |
| `api` | 应用、表单、业务数据、权限、租户隔离、流程业务编排 |
| `camunda` | Camunda 部署、实例运行、任务推进、退回拿回、候选人解析、流程历史 |
| MySQL 平台库 | 低代码平台元数据、业务数据、工作流扩展表 |
| Camunda 库 | Camunda 7 原生运行时表、历史表 |

前端不拆成两套后台。`web` 的页面和组件最终通过主平台 `web` 的路由、菜单、权限加载，用户只登录一个系统。

## 3. 服务拆分方案

### 3.1 api 主平台

技术栈：

- JDK 21
- Spring Boot 4.1
- Spring Security
- MyBatis-Plus
- MySQL 8
- Redis

核心模块：

- `system`：租户、用户、部门、岗位、角色、字典。
- `app`：应用、应用菜单、应用权限。
- `form`：表单定义、字段、页面 Schema、版本。
- `data`：动态业务数据、索引、数据权限。
- `workflow`：流程定义元数据、表单流程绑定、流程发起、审批动作编排、任务快照、审批记录。
- `integration`：调用 `camunda` 的客户端。

### 3.2 camunda 外置工作流服务

技术栈建议：

- JDK 17 或 JDK 8。
- Spring Boot 2.7。
- Camunda 7.19 或后续 7.x LTS。
- MyBatis-Plus。
- MySQL 8。

说明：

- `api` 保持 JDK 21 / Spring Boot 4.1，不直接依赖 Camunda 7 starter，规避兼容性问题。
- `camunda` 单独维护 Camunda 7 运行时和二次开发能力，对 `api` 暴露 HTTP API。
- 如果后续确认 Camunda 7 与 Spring Boot 4.1 的组合可稳定运行，也可以合并，但第一版不建议冒这个险。

## 4. 保留旧系统能力

旧系统已实现的能力应迁移为平台标准能力：

| 旧能力 | 新设计 |
| --- | --- |
| `act_ext_business` 业务类型 | 升级为 `flow_business_type`，应用内业务对象或表单分类 |
| `act_ext_business_ref` 业务流程绑定 | 升级为 `flow_form_bind`，按 `app_id + form_id + scene_code` 绑定 |
| `act_ext_history` 审批历史 | 升级为 `flow_approval_log` + `flow_task_snapshot` |
| `TaskOperateController` 多动作接口 | 升级为统一动作接口，也保留语义清晰的独立接口 |
| `buttonsSetting` | 继续支持 BPMN 扩展属性，发布时解析落库 |
| `formEditable` | 升级为节点表单权限，兼容整体可编辑开关 |
| `FlowListener` | 迁移到 `camunda`，并通过事件回调 `api` |
| `CamundaFactory` 业务回调 | 升级为业务回调注册表和平台事件总线 |
| 候选用户 U/D/P/R/S | 升级为候选人规则：用户、部门、岗位、角色、关系、表达式 |

## 5. 工作流总体链路

### 5.1 流程设计

1. 前端打开 BPMN 设计器。
2. 设计器使用 `vite-vue-bpmn-process-dev` 的能力作为基础。
3. 继续使用 BPMN.js、Naive UI、Camunda moddle、`SmartProperty` 扩展。
4. 节点配置包括候选人、按钮、表单权限、超时、是否自动选人、是否隐藏选人、是否允许改派。
5. 保存草稿到 `api` 的 `flow_def`、`flow_version`。

### 5.2 流程发布

1. `api` 校验流程所属租户、应用、表单和权限。
2. `api` 解析 BPMN XML 中的扩展配置：
   - `buttonsSetting`
   - `formEditable`
   - `candidateUsers`
   - `canChange`
   - `hideSelect`
   - `autoSelect`
   - task listener / execution listener
3. `api` 将节点按钮、节点表单权限、候选人规则落库。
4. `api` 调用 `camunda` 部署 BPMN。
5. `camunda` 使用 Camunda 7 RepositoryService 部署。
6. `camunda` 返回 `deploymentId`、`processDefinitionId`、`processDefinitionKey`、`version`。
7. `api` 更新 `flow_version` 发布信息。

### 5.3 流程发起

1. 业务表单保存草稿或直接提交。
2. `api` 根据 `app_id + form_id + scene_code` 找到已发布流程版本。
3. `api` 校验表单、数据权限和发起权限。
4. `api` 组装流程变量：
   - `tenantId`
   - `appId`
   - `formId`
   - `formVersionId`
   - `recordId`
   - `businessKey`
   - `businessType`
   - `processInstanceName`
   - `startUser`
   - `form`
   - `form_字段编码`
5. `api` 调用 `camunda` 启动流程。
6. `camunda` 创建 Camunda 实例并返回首批任务。
7. `api` 写入 `flow_instance`、`flow_task_snapshot`、`flow_approval_log`。
8. 如果首节点是拟稿节点，可按旧系统模式自动办理并弹出下一节点选人。

### 5.4 任务办理

1. 前端打开待办。
2. `api` 返回业务表单、当前节点字段权限、可用按钮、候选人、审批历史。
3. 用户点击审批按钮。
4. 前端提交动作编码、意见、附件、目标用户、目标节点、表单数据。
5. `api` 统一校验租户、应用、菜单权限、操作权限、数据权限、任务权限、按钮配置。
6. `api` 调用 `camunda` 执行动作。
7. `camunda` 推进或修改 Camunda 实例。
8. `api` 同步任务快照、审批记录、业务状态。

## 6. BPMN 设计器改造方案

基于 `F:\project\vite-vue-bpmn-process-dev` 继续改造，而不是重写。

可复用部分：

- `src/components/Designer`：BPMN Modeler 初始化。
- `src/components/Toolbar`：打开、导出、预览、缩放、撤销重做。
- `src/components/Panel`：右侧属性面板。
- `src/components/buttons-select/buttons-select.vue`：审批按钮选择。
- `src/components/user-select`：用户、部门、岗位、角色选择。
- `src/bo-utils/smartPropertyUtil.ts`：`SmartProperty` 读写。
- `src/utils/EmptyXML.ts`：默认流程模板。
- `src/moddle-extensions/camunda.json`：Camunda 扩展。

需要改造部分：

- 去除独立 App 形态，封装成低代码平台内的 `FlowDesigner` 页面组件。
- API 层改为调用新平台 `/api/apps/{appId}/flows/**`。
- 按钮设置从固定数组升级为后端返回的内置按钮 + 应用自定义按钮。
- `formEditable` 从简单 0/1 升级为字段级权限配置。
- 候选人选择接入平台组织架构、应用角色、数据权限。
- 发布前增加模型校验结果面板。
- 保存时同时保存 `bpmnXml` 和解析后的 `configJson`。

设计器扩展属性建议：

```xml
<camunda:smartProperty name="buttonsSetting" values="..." />
<camunda:smartProperty name="formEditable" values="1" />
<camunda:smartProperty name="formPermission" values="..." />
<camunda:smartProperty name="canChange" values="1" />
<camunda:smartProperty name="hideSelect" values="0" />
<camunda:smartProperty name="autoSelect" values="1" />
```

## 7. 审批按钮模型

最低保留按钮：

| 编码 | 名称 | 意见默认 | 旧系统状态 |
| --- | --- | --- | --- |
| `approve` | 办理 | 必填 | 已有 |
| `reject` | 退回至上一节点 | 必填 | 已有 |
| `rejectFirst` | 退回至发起人 | 必填 | 已有 |
| `rejectCustom` | 任意退回 | 必填 | 已有 |
| `stop` | 终止 | 必填 | 已有 |
| `addAssignee` | 加签 | 必填 | 已有 |
| `removeAssignee` | 减签 | 必填 | 已有 |
| `transfer` | 转办 | 必填 | 已有 |
| `delegate` | 委托 | 必填 | 已有 |
| `resolve` | 解决 | 必填 | 已有 |
| `getBack` | 拿回 | 非必填 | 已有 |

旧系统还有 `start`、`draft`、`jump`、`completed`、`cancel`，新系统保留为内部操作类型，不默认暴露给普通审批按钮。

按钮配置结构：

```json
{
  "defaultName": "退回至上一节点",
  "customName": "驳回",
  "code": "reject",
  "commentRequired": true,
  "attachmentRequired": false,
  "setting": {
    "eventSetting": null,
    "classSetting": null,
    "apiSetting": null
  }
}
```

安全约束：

- `eventSetting` 不允许直接在后端执行前端传入脚本。
- `classSetting` 只允许选择后端白名单处理器。
- `apiSetting` 只允许配置平台内部白名单 API 或预注册 webhook。

## 8. 候选人规则

旧系统候选人配置支持：

- 用户 `U`
- 部门 `D`
- 岗位 `P`
- 角色 `R`
- 关系 `S`

新系统继续保留，并扩展为结构化规则：

```json
{
  "users": ["1001"],
  "depts": ["2001"],
  "posts": ["3001"],
  "roles": ["4001"],
  "ships": ["starter", "loginUser", "lastAssignee", "starterDeptLeader"],
  "expression": null,
  "autoSelect": true,
  "hideSelect": false,
  "canChange": true
}
```

关系类规则：

- 发起人。
- 当前登录人。
- 上一节点办理人。
- 发起人部门。
- 发起人机构。
- 发起人岗位。
- 发起人角色。
- 当前登录人部门/岗位/角色。
- 上一办理人部门/岗位/角色。
- 部门负责人。
- 项目负责人，后续可由业务字段映射。

## 9. 审批动作实现

### 9.1 approve 办理

迁移旧逻辑：

- 设置下一节点办理人变量。
- 支持普通任务和多实例任务。
- 根据网关和条件表达式计算后续节点。
- 保存表单变量到 `form` 和 `form_字段编码`。
- 完成任务。
- 写审批记录。
- 检查流程是否结束。

新设计：

- `api` 负责业务表单保存和权限校验。
- `camunda` 负责 Camunda complete 和下一任务解析。
- `api` 负责将返回任务写入 `flow_task_snapshot`。

### 9.2 reject / rejectFirst / rejectCustom 退回

迁移旧逻辑：

- 基于历史人工任务查找目标节点。
- 使用 `ProcessInstanceModificationBuilder` 取消当前活动实例。
- 使用 `startBeforeActivity` 启动目标节点。
- 设置目标办理人变量。
- 对多实例节点重置局部变量。
- 对并行/相容网关处理批量分支。

新设计：

- `camunda` 提供统一迁移接口。
- `api` 提供可退回节点列表。
- 平台按第一版限制并行网关、多实例、子流程中的任意退回，先支持可控场景，再逐步放开。

### 9.3 stop 终止

- 调用 Camunda 删除或终止流程实例。
- 关闭平台所有待办。
- 业务数据状态改为终止。
- 写 `STOP` 审批记录。

### 9.4 transfer 转办

- 使用 Camunda `taskService.setAssignee`。
- 原办理人失去任务。
- 平台任务快照记录 `TRANSFERRED` 关系。

### 9.5 delegate / resolve 委托与解决

- 委托使用 Camunda `delegateTask`。
- 被委托人处理后调用 `resolveTask`。
- 委托人再执行 `approve`。
- 平台记录委托人、被委托人、委托状态。

### 9.6 addAssignee / removeAssignee 加签减签

第一版建议采用平台扩展任务实现：

- 加签生成平台扩展任务，当前 Camunda 任务暂不完成。
- 加签人完成后回到原任务。
- 减签只允许移除未处理加签任务。

第二版再考虑运行态修改多实例。

### 9.7 getBack 拿回

迁移旧逻辑：

- 查询上一条有效审批历史。
- 校验下一节点未办理。
- 使用流程实例修改回到上一节点。
- 标记被拿回历史记录。
- 写 `GET_BACK` 审批记录。

新限制：

- 第一版只支持串行普通人工任务拿回。
- 并行、多实例、子流程、已被下一节点处理的任务不允许拿回。

## 10. camunda API

流程定义：

- `POST /engine/deploy` 部署 BPMN。
- `GET /engine/definitions/{definitionId}/xml` 获取 XML。
- `POST /engine/definitions/{definitionId}/suspend` 挂起。
- `POST /engine/definitions/{definitionId}/activate` 激活。
- `DELETE /engine/deployments/{deploymentId}` 删除部署。

流程实例：

- `POST /engine/instances/start` 启动流程。
- `GET /engine/instances/{instanceId}` 获取实例。
- `GET /engine/instances/{instanceId}/variables` 获取变量。
- `POST /engine/instances/{instanceId}/variables` 更新变量。
- `POST /engine/instances/{instanceId}/terminate` 终止。

任务：

- `GET /engine/tasks/todo` 查询 Camunda 待办。
- `GET /engine/tasks/{taskId}` 任务详情。
- `POST /engine/tasks/{taskId}/complete` 完成。
- `POST /engine/tasks/{taskId}/reject` 退回。
- `POST /engine/tasks/{taskId}/transfer` 转办。
- `POST /engine/tasks/{taskId}/delegate` 委托。
- `POST /engine/tasks/{taskId}/resolve` 解决。
- `POST /engine/tasks/{taskId}/get-back` 拿回。
- `GET /engine/tasks/{taskId}/next-nodes` 下一节点。
- `GET /engine/tasks/{taskId}/last-nodes` 前置节点。
- `GET /engine/tasks/{taskId}/returnable-nodes` 可退回节点。

事件回调：

- `POST /api/workflow/callback/task-created`
- `POST /api/workflow/callback/task-completed`
- `POST /api/workflow/callback/task-deleted`
- `POST /api/workflow/callback/instance-ended`

## 11. api 平台工作流 API

前端只调用平台 API：

- `POST /api/apps/{appId}/flows` 创建流程。
- `POST /api/apps/{appId}/flows/{flowId}/versions` 保存设计。
- `POST /api/apps/{appId}/flows/{flowId}/versions/{versionId}/publish` 发布。
- `GET /api/apps/{appId}/flows/{flowId}/designer` 获取设计器数据。
- `POST /api/apps/{appId}/forms/{formId}/records/{recordId}/start-flow` 发起流程。
- `GET /api/workflow/tasks/todo` 待办。
- `GET /api/workflow/tasks/done` 已办。
- `GET /api/workflow/instances/mine` 我的流程。
- `GET /api/workflow/tasks/{taskId}` 待办详情。
- `GET /api/workflow/tasks/{taskId}/actions` 可用按钮。
- `POST /api/workflow/tasks/{taskId}/actions/{actionCode}` 执行动作。
- `GET /api/workflow/tasks/{taskId}/next-nodes` 下一节点选人。
- `GET /api/workflow/tasks/{taskId}/returnable-nodes` 可退回节点。
- `GET /api/workflow/instances/{instanceId}/timeline` 审批时间线。
- `GET /api/workflow/instances/{instanceId}/diagram` 流程图和高亮信息。

## 12. 数据落库策略

Camunda 原生库保存引擎运行数据。

平台库保存：

- 流程定义和版本。
- 设计器 XML 和解析配置。
- 应用/表单/流程绑定。
- 节点按钮配置。
- 节点表单权限。
- 候选人规则。
- 流程实例业务快照。
- 任务快照。
- 审批历史。
- 任务关系。
- 同步日志。

原则：

- 待办列表优先查平台 `flow_task_snapshot`，不直接查 Camunda。
- 每次动作完成后由 `camunda` 返回当前活跃任务，`api` 同步快照。
- 定时同步任务用于修复平台快照和 Camunda 状态不一致。
- 审批历史以平台 `flow_approval_log` 为准，Camunda 历史用于校验和修复。

## 13. 旧代码迁移清单

后端可迁移：

- `TaskOperateType`：升级为平台枚举。
- `TaskOperateController`：拆成平台 API 和 engine API。
- `TaskOperateServiceImpl`：迁移核心动作逻辑到 `camunda`。
- `TaskQueryServiceImpl`：候选人解析、下一节点解析、前置节点解析迁移到 `camunda`，权限过滤留在 `api`。
- `ProcessDefinitionServiceImpl`：部署、挂起、激活、XML 获取迁移到 `camunda`，业务绑定留在 `api`。
- `FlowUtil`：迁移为 BPMN 解析工具。
- `FlowListener`：迁移到 `camunda`，回调 `api`。
- `ActExtHistoryEntity`：字段升级到 `flow_approval_log`。
- `ActExtBusinessEntity`、`ActExtBusinessRefEntity`：升级到应用表单流程绑定。

前端可迁移：

- 流程菜单结构。
- 任务中心、我的流程、流程监控页面思路。
- 审批弹窗和选人弹窗。
- 审批按钮颜色、状态枚举。
- BPMN 设计器的大部分代码。
- 用户/部门/岗位/角色选择组件思路。

需要重写：

- 前端 UI 组件统一改为 Naive UI。
- 接口路径改成新平台 API。
- 表单渲染改成低代码表单 Schema。
- 权限控制改成应用内菜单/操作/数据权限。

## 14. 实施优先级

第一阶段：外置引擎打通

- 建 `camunda` 服务。
- 引入 Camunda 7。
- 完成部署、启动、完成任务、查询任务。
- `api` 能发起流程并同步任务快照。

第二阶段：旧审批动作迁移

- 迁移 `approve`、`reject`、`rejectFirst`、`stop`。
- 迁移审批历史。
- 迁移下一节点选人。
- 迁移业务回调。

第三阶段：设计器接入

- 接入 BPMN 设计器。
- 保存/发布 BPMN。
- 解析 `buttonsSetting`、`formEditable`、候选人规则。
- 节点按钮和表单权限落库。

第四阶段：增强动作

- `rejectCustom`
- `transfer`
- `delegate`
- `resolve`
- `getBack`
- 加签、减签。

第五阶段：平台化完善

- 流程监控。
- 流程统计。
- 同步修复。
- 超时提醒。
- 抄送。
- 多租户应用级权限。

## 15. 关键风险

- Camunda 7 与 Spring Boot 4.1 不直接放在同一服务，避免兼容性问题。
- 退回、拿回在并行网关、多实例、子流程中复杂度高，必须做规则限制。
- 旧系统中部分流程变量使用 `form_字段` 扁平化，新平台要标准化变量映射。
- 旧系统 `eventSetting` 脚本不能原样开放执行，必须白名单化。
- 平台任务快照和 Camunda 运行时可能不一致，需要同步日志和修复任务。
- 多租户下不能让 Camunda 原生接口暴露给前端，所有调用必须经过 `api` 权限校验。

