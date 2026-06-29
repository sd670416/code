# 旧 Camunda 7 二次开发代码评估报告

## 1. 评估范围

参考代码：

- 后端：`F:\project\gongcheng\smart-boot\smart-flow`
- 前端：`F:\project\gongcheng\smart-web\src\components\flow`、`F:\project\gongcheng\smart-web\src\views\flow`
- BPMN 设计器：`F:\project\vite-vue-bpmn-process-dev`

重点评估：

- `TaskOperateServiceImpl`
- `TaskQueryServiceImpl`
- `ProcessDefinitionServiceImpl`
- `FlowUtil`
- `FlowListener`
- BPMN 设计器的 `buttonsSetting`、`formEditable`、候选人配置
- 前端任务操作枚举和接口调用

## 2. 总体结论

旧代码有明显价值，不是应该推倒重写的类型。

它已经解决了 Camunda 7 在传统 OA 审批里最麻烦的一批问题：

- 普通办理。
- 退回至上一节点。
- 退回至发起人。
- 任意退回。
- 终止。
- 加签。
- 减签。
- 转办。
- 委托。
- 解决。
- 拿回。
- 下一节点选人。
- 候选人按用户、部门、岗位、角色、关系解析。
- 审批历史。
- 节点按钮配置。
- 表单可编辑配置。
- 网关和多实例的部分处理。

但这套实现目前更像“业务项目里的强力补丁集合”，还没有达到“平台级工作流内核”的稳定度。主要问题是：核心逻辑集中在单个大 Service，退回/拿回/多实例/网关状态修复强依赖历史表和执行树推断，缺少统一动作模型、测试矩阵、幂等控制、并发控制和可观测性。

新平台建议不要直接复制旧代码，而是把旧代码拆成可测试的工作流动作处理器，并收口第一版支持范围。

## 3. 可复用资产

### 3.1 审批动作语义

旧系统的 `TaskOperateType` 定义较完整，可直接作为新平台动作枚举基础：

- `start`
- `draft`
- `approve`
- `reject`
- `rejectFirst`
- `rejectCustom`
- `jump`
- `stop`
- `addAssignee`
- `removeAssignee`
- `transfer`
- `delegate`
- `resolve`
- `getBack`
- `completed`
- `cancel`

建议新平台保留动作编码，避免前端、设计器和历史数据迁移时出现语义断裂。

### 3.2 BPMN 设计器扩展

`vite-vue-bpmn-process-dev` 里已有较好的基础：

- 基于 BPMN.js。
- 使用 Naive UI。
- 支持 Camunda moddle。
- 通过 `camunda:smartProperty` 写入扩展属性。
- 已有按钮设置弹窗。
- 已有用户、部门、岗位、角色选择组件。
- 已有 `buttonsSetting` 和 `formEditable`。

建议保留这套交互，改为平台内组件，并在发布时解析扩展属性落库。

### 3.3 候选人解析

旧系统支持：

- 用户。
- 部门。
- 岗位。
- 角色。
- 关系。

这部分很适合迁移，但需要改为结构化 JSON，而不是长期依赖 `U_`、`D_`、`P_`、`R_`、`S_` 字符串拼接。

### 3.4 审批历史字段

`act_ext_history` 保存的信息很有价值：

- 业务标识。
- 流程定义 ID。
- 流程实例 ID。
- 节点 ID、节点名称、节点类型。
- 当前任务、下一任务。
- 操作类型。
- 当前办理人、下一办理人。
- 开始时间、结束时间、耗时。
- 意见、附件。
- 执行 ID、父执行 ID、活动实例 ID。
- 变量快照。
- 是否拿回、是否关闭、是否隐藏。

新平台的 `flow_approval_log` 和 `flow_task_snapshot` 应吸收这些字段。

## 4. 主要风险

### 4.1 核心类过大，动作边界不清

`TaskOperateServiceImpl` 约 3000 行，包含办理、退回、转办、委托、加签、减签、拿回、终止、历史记录、变量处理、网关处理、多实例处理。

风险：

- 改一个动作容易影响其他动作。
- 很难补齐单元测试。
- 回归成本高。
- 平台化后难以维护。

建议：

```text
FlowActionService
  -> ApproveActionHandler
  -> RejectActionHandler
  -> RejectFirstActionHandler
  -> RejectCustomActionHandler
  -> StopActionHandler
  -> TransferActionHandler
  -> DelegateActionHandler
  -> ResolveActionHandler
  -> AddAssigneeActionHandler
  -> RemoveAssigneeActionHandler
  -> GetBackActionHandler
```

公共能力拆到：

- `TaskValidator`
- `FlowVariableService`
- `FlowHistoryRecorder`
- `BpmnNodeResolver`
- `CandidateUserResolver`
- `ProcessModificationService`

### 4.2 退回和拿回依赖执行树推断，复杂流程风险较高

旧代码大量使用：

- `runtimeService.createProcessInstanceModification`
- `cancelActivityInstance`
- `cancelAllForActivity`
- `startBeforeActivity`
- `setVariable`
- `setVariableLocal`
- `executionParentId`
- `activityInstanceId`
- `groupMark`

这说明旧系统已经进入 Camunda 7 比较深的运行态修改区。

风险：

- 并行网关 + 多实例 + 退回场景容易出现残留 execution。
- 任意退回跨多个网关时逻辑不稳定。
- 拿回依赖历史记录和下一任务 ID，一旦历史记录被隐藏、关闭或并发处理，容易误判。
- 子流程、事件子流程、边界事件、补偿事件目前基本没有保护。

旧代码自己也标了类似风险：

- “任意退回会途径多个网关导致 bug”
- “串行节点退回应该退回到第一个人还是最后一个人”
- “网关 + 多实例时会出现多级父级执行 ID 无法全部修改”

建议新平台第一版限制：

- 只支持普通串行人工任务退回。
- 只支持退回上一人工节点和退回发起人。
- 任意退回先限制在同一主干、无并行网关、无子流程。
- 拿回只支持下一节点未处理的普通串行任务。
- 多实例、并行网关、子流程中的退回拿回放到第二阶段并做专项测试。

### 4.3 权限校验不足以支撑 SaaS 平台

旧接口通过 `@HasPermission({"task:handle", "*:handleTask"})` 做了操作权限，但 `checkTask` 只校验任务存在：

```java
taskService.createTaskQuery()
  .processInstanceId(processInstanceId)
  .taskId(taskId)
  .singleResult()
```

风险：

- 没有在工作流服务层明确校验当前用户是否是任务办理人、候选人、委托人或管理员。
- 没有租户、应用隔离。
- 没有按钮级权限。
- 没有数据权限。
- SaaS 环境下不能只依赖前端传参和菜单权限。

建议：

所有动作统一经过：

```text
租户校验
应用校验
任务状态校验
办理人/候选人校验
按钮配置校验
操作权限校验
数据权限校验
节点特殊规则校验
```

### 4.4 缺少幂等和并发控制

审批动作没有看到明确的幂等键、分布式锁或版本号控制。

风险场景：

- 用户双击办理。
- 多端同时办理同一任务。
- 移动端和 PC 端同时提交。
- 同一任务同时退回和转办。
- 拿回时下一节点刚好办理。

建议：

- 每次动作带 `requestId`。
- 使用 Redis 锁：`workflow:task:{taskId}:action`。
- 校验 Camunda task revision 或平台任务版本。
- 动作成功后记录幂等结果，重复提交直接返回上次结果。

### 4.5 平台历史和 Camunda 状态耦合过深

旧 `act_ext_history` 不只是审批日志，还承担了拿回、退回、关闭记录、隐藏记录、分支判断等状态机职责。

风险：

- 审批历史既是展示数据，又是业务判断数据，容易互相污染。
- 为了展示隐藏某些记录，可能影响拿回和退回判断。
- 修复历史数据可能破坏运行中流程。

建议拆分：

- `flow_approval_log`：只负责不可变审批日志。
- `flow_task_snapshot`：负责待办/已办状态。
- `flow_task_relation`：负责转办、委托、加签、拿回、退回关系。
- `flow_execution_marker`：如确实需要，单独保存网关、多实例辅助标记。

### 4.6 流程变量模型不够标准化

旧代码会把表单数据写入：

- `form`
- `form_antValue`
- `form_naiveValue`
- `form_字段名`

风险：

- 变量命名分散。
- 表单字段改名后历史流程难处理。
- 条件表达式依赖动态字段，发布后缺少稳定校验。
- JSON 表单数据和流程变量可能不一致。

建议：

- 完整业务数据以业务表或 `form_record` 为准。
- 流程变量只保存流程判断需要的稳定字段。
- 发布流程时声明变量映射。
- 条件表达式只能引用已声明变量。

### 4.7 表达式执行需要安全边界

`FlowUtil.checkExpression` 使用 JUEL 计算表达式。

风险：

- 如果表达式来源于前端设计器且缺少限制，可能出现不受控表达式访问。
- 类型转换异常会直接影响节点解析。
- 表达式复杂时难定位问题。

建议：

- 发布时校验表达式。
- 限定表达式只允许访问流程变量白名单。
- 执行失败时给出明确错误。
- 记录表达式、变量快照和计算结果。

### 4.8 日志和可观测性不足

旧代码存在大量 `System.out.println`、`System.err.println`。

风险：

- 生产日志不可控。
- 无法按实例、任务、用户、动作检索。
- 异常定位困难。

建议：

- 改为结构化日志。
- 日志字段包含 `tenantId`、`appId`、`processInstanceId`、`taskId`、`actionCode`、`operatorId`。
- 增加 `flow_sync_log` 和 `flow_action_log`。

## 5. 已发现明确问题

### 5.1 前端拿回枚举值错误

文件：`F:\project\gongcheng\smart-web\src\constants\flow\task-const.js`

问题：

```js
getBack: {
  value: 'delegate',
  color: '#c0bb20',
  label: '拿回',
}
```

`getBack.value` 应该是 `getBack`，现在写成了 `delegate`。

影响：

- 拿回在状态颜色、枚举判断、筛选统计中可能被当成委托。
- 如果某些地方用 `value` 提交动作，可能触发错误动作。

建议：

```js
getBack: {
  value: 'getBack',
  color: '#c0bb20',
  label: '拿回',
}
```

### 5.2 `TaskRequest` 同时承担查询、动作、变量提交

`TaskRequest` 里同时包含分页、业务 key、办理人、流程实例、任务、历史、节点、变量等字段。

风险：

- 接口语义不清。
- 参数校验难做。
- 前端误传字段可能影响动作。

建议拆分：

- `TaskPageRequest`
- `TaskActionRequest`
- `StartProcessRequest`
- `RejectRequest`
- `TransferRequest`
- `DelegateRequest`
- `CandidateNodeRequest`

### 5.3 `stop` 动作没有处理业务状态回调边界

旧代码中 `stop` 调用：

```java
runtimeService.deleteProcessInstance(processInstanceId, "终止流程实例", false, false);
```

然后写审批记录。

风险：

- 如果删除成功但写历史失败，Camunda 与平台历史不一致。
- 如果业务表状态更新依赖监听器，删除流程后回调顺序需要验证。
- 没有看到动作幂等和重复终止处理。

建议：

- 先写平台动作日志为处理中。
- 终止 Camunda。
- 同步关闭任务快照。
- 回调业务状态。
- 最后更新动作日志为成功。
- 失败时可补偿修复。

### 5.4 任意退回的可靠性不足

代码中已有注释说明“任意退回会途径多个网关导致 bug”。

建议：

第一版不要开放全局任意退回。先提供“可退回节点计算”，只返回明确安全的节点。

安全节点条件：

- 历史中存在。
- 目标节点仍在当前流程定义中。
- 当前节点到目标节点之间没有并行网关、事件子流程、补偿边界。
- 目标节点不是已关闭分支上的节点。

## 6. 缺失功能清单

结合新平台目标，旧代码还缺：

- 租户隔离。
- 应用隔离。
- 按钮级权限。
- 数据权限。
- 节点字段级表单权限。
- 动作幂等。
- 并发锁。
- 任务快照表。
- 流程动作审计日志。
- Camunda 与平台状态同步修复。
- 发布前模型校验报告。
- 流程版本和表单版本强绑定。
- 可退回节点安全计算。
- 流程变量映射管理。
- 表达式安全校验。
- 超时提醒。
- 抄送。
- 流程统计。
- 流程实例管理员干预记录。
- 自动化测试覆盖。

## 7. 新平台迁移建议

### 7.1 可以直接迁移的部分

- 动作编码。
- 候选人类型。
- BPMN 设计器基础组件。
- 按钮选择交互。
- `SmartProperty` 扩展思路。
- 审批历史字段设计。
- 业务类型绑定流程的思路。
- 部分 `FlowUtil` 图遍历函数。

### 7.2 需要重构后迁移的部分

- `TaskOperateServiceImpl`。
- `TaskQueryServiceImpl`。
- 退回和拿回逻辑。
- 多实例加签减签。
- 网关匹配和执行关闭。
- 表单变量写入。
- 业务回调。

### 7.3 不建议继续沿用的部分

- 用一个大 `TaskRequest` 覆盖所有接口。
- 审批历史同时承担业务状态判断。
- 运行时频繁临时解析 BPMN 扩展属性。
- 生产环境使用 `System.out` / `System.err`。
- 前端按钮配置里的任意脚本执行能力。
- 未加限制的任意退回。

## 8. 建议实施顺序

第一步：补测试和样例流程

- 串行普通审批。
- 串行退回。
- 退回发起人。
- 终止。
- 转办。
- 委托/解决。
- 并行会签。
- 串行会签。
- 并行网关。
- 相容网关。
- 拿回。

第二步：拆动作处理器

- 先拆 `approve`、`reject`、`rejectFirst`、`stop`。
- 每个动作有独立校验、执行、历史记录。
- 共用能力抽到服务。

第三步：建立平台快照表

- 待办不直接查 Camunda。
- 动作后同步快照。
- 定时修复快照。

第四步：限制高风险动作

- 任意退回默认关闭。
- 拿回只支持普通串行。
- 多实例加签减签作为第二阶段。

第五步：迁移 BPMN 设计器

- 继续使用旧设计器。
- 发布时解析扩展属性并落库。
- 运行时从数据库读取按钮和权限。

## 9. 最终建议

旧代码可以作为新平台 `camunda` 的第一版参考实现，但不能原样搬过去。

推荐策略：

```text
保留动作语义
保留设计器交互
保留候选人规则
保留核心 Camunda 7 操作经验

重构动作边界
重构历史与任务状态
补租户、应用、权限、幂等
限制复杂退回和拿回
用测试矩阵逐步放开能力
```

这样能最大化复用你已经做过的工作，同时避免把旧项目里的隐性风险带进新的 SaaS 平台。

