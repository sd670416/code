# smart-code 开发规范

## 1. 总体原则

代码风格要求简练、清晰、可维护。优先使用已有封装和公共能力，不在业务代码中重复造轮子。

核心要求：

- Controller 不写复杂业务逻辑。
- 接口层、逻辑层、持久层职责清晰。
- 通用能力必须封装，避免复制粘贴。
- 统一返回结构。
- 错误码分类明确。
- VO、BO、DTO、Entity、Query 等模型职责明确。
- 文件结构稳定，按模块聚合，便于维护。
- 前端 Vue 代码同样遵守分层、封装、简练原则。
- 全局变量、跨模块常量必须集中定义在常量类或枚举类中，减少散落在普通类中的静态属性。

## 2. 后端分层规范

推荐后端分层：

```text
controller
  HTTP 接口层，只负责参数接收、鉴权注解、基础校验、调用 application/service、返回结果

application
  应用编排层，负责跨领域流程编排、事务边界、权限校验、状态流转

domain
  领域层，负责核心业务规则、状态机、策略、领域服务

infrastructure
  基础设施层，负责数据库、Redis、Camunda Client、文件、消息、第三方接口

mapper/repository
  持久层，负责 SQL、MyBatis Mapper、数据读取和写入
```

Controller 禁止：

- 直接写复杂业务判断。
- 直接操作 Mapper。
- 直接拼接 SQL。
- 直接调用多个底层依赖完成流程编排。
- 直接处理 Camunda 复杂动作。
- 大量 if/else 写在接口方法中。

Controller 允许：

- 接收 DTO。
- 使用注解做权限控制。
- 调用一个明确的 Service/Application 方法。
- 返回统一结果。

示例：

```java
@PostMapping("/submit")
public ApiResult<FormRecordVO> submit(@Valid @RequestBody FormSubmitDTO dto) {
    return ApiResult.ok(formRecordAppService.submit(dto));
}
```

## 3. 后端模块职责

```text
smart-system
  租户、用户、部门、岗位、平台角色、平台菜单、平台权限

smart-app
  应用、应用菜单、应用角色、应用权限、应用发布

smart-form
  表单定义、表单版本、字段模型、页面 Schema

smart-data
  表单记录、无流程提交、动态数据索引、数据查询

smart-workflow
  流程元数据、表单流程绑定、流程实例映射、任务快照、审批历史

smart-integration
  Camunda 客户端、外部服务回调、同步修复

smart-common
  返回结构、错误码、异常、工具类、基础模型、常量、枚举
```

模块之间调用要求：

- Controller 只能调用本模块 Application/Service。
- 跨模块调用优先通过 Application Service，不直接访问对方 Mapper。
- `smart-common` 不依赖业务模块。
- `smart-workflow` 不直接操作 Camunda 引擎，只通过 `smart-integration` 调用 `camunda`。
- `camunda` 不直接操作低代码业务表。

## 4. 模型命名规范

| 类型 | 命名 | 用途 | 是否对外 |
| --- | --- | --- | --- |
| Entity | `XxxEntity` | 数据库表映射 | 否 |
| DTO | `XxxCreateDTO`、`XxxUpdateDTO`、`XxxSubmitDTO` | 接口入参 | 是 |
| Query | `XxxPageQuery`、`XxxListQuery` | 查询入参 | 是 |
| VO | `XxxVO`、`XxxDetailVO`、`XxxOptionVO` | 接口返回 | 是 |
| BO | `XxxBO` | 内部业务对象 | 否 |
| Command | `XxxCommand` | 应用层操作命令 | 否 |
| Event | `XxxEvent` | 领域事件或集成事件 | 否 |

使用要求：

- Controller 入参使用 DTO 或 Query，不直接使用 Entity。
- Controller 返回使用 VO，不直接返回 Entity。
- Service 内部复杂传递使用 BO 或 Command。
- Entity 只表达持久化结构，不承载复杂接口语义。
- DTO/VO 按接口场景拆分，避免一个大对象到处复用。

示例：

```text
FormDefEntity
FormCreateDTO
FormUpdateDTO
FormPageQuery
FormDefVO
FormDetailVO
FormPublishCommand
FormSchemaBO
```

## 5. 统一返回结构

后端统一返回：

```json
{
  "code": "0",
  "message": "success",
  "data": {},
  "traceId": "xxx",
  "timestamp": 1780000000000
}
```

建议 Java 模型：

```java
public class ApiResult<T> {
    private String code;
    private String message;
    private T data;
    private String traceId;
    private Long timestamp;
}
```

分页返回：

```json
{
  "records": [],
  "total": 100,
  "pageNo": 1,
  "pageSize": 20
}
```

要求：

- 正常返回统一使用 `ApiResult.ok(data)`。
- 失败统一抛业务异常，不在 Controller 中手工拼失败 JSON。
- 分页统一使用 `PageResult<T>`。
- 前端请求封装只识别这一套返回结构。

## 6. 错误码规范

错误码按分类设计：

| 分类 | 范围 | 说明 |
| --- | --- | --- |
| SUCCESS | `0` | 成功 |
| AUTH | `10000-10999` | 登录、Token、身份认证 |
| PERMISSION | `11000-11999` | 菜单、按钮、数据权限 |
| TENANT | `12000-12999` | 租户、应用隔离 |
| PARAM | `13000-13999` | 参数校验 |
| BUSINESS | `20000-29999` | 通用业务错误 |
| FORM | `30000-30999` | 表单设计、表单数据 |
| WORKFLOW | `31000-31999` | 流程定义、流程实例、任务 |
| CAMUNDA | `32000-32999` | Camunda 外置服务调用和引擎错误 |
| DATA | `33000-33999` | 动态数据、索引、查询 |
| FILE | `34000-34999` | 文件上传下载 |
| SYSTEM | `90000-99999` | 系统异常、未知异常 |

要求：

- 错误码集中定义在 `smart-common`。
- 每个错误码必须有默认消息。
- 业务异常必须携带错误码。
- 系统异常统一转换为 `SYSTEM` 分类错误。
- 对外错误消息要清晰，不暴露 SQL、堆栈、服务器路径。
- 日志中保留 `traceId`，方便排查。

## 7. 异常处理规范

统一异常类型：

```text
BusinessException      业务异常
AuthException          认证异常
PermissionException    权限异常
ValidationException    参数异常
IntegrationException   外部服务异常
WorkflowException      工作流异常
```

统一处理：

- 使用全局异常处理器。
- Controller 不捕获业务异常。
- 需要补偿或降级的异常在 Application 层处理。
- Camunda 调用异常转换为 `WorkflowException` 或 `IntegrationException`。

## 8. Service 设计规范

Service 方法要求：

- 一个方法只表达一个明确业务动作。
- 方法名使用业务动词，不使用模糊命名。
- 复杂动作拆成私有小方法或策略类。
- 超过 150 行的方法必须考虑拆分。
- 审批动作使用 `ActionHandler` 策略，不写超大 if/else。

推荐：

```text
FormRecordAppService.saveDraft()
FormRecordAppService.submitWithoutWorkflow()
FormRecordAppService.startWorkflow()
WorkflowActionAppService.execute()
ApproveActionHandler.handle()
RejectActionHandler.handle()
GetBackActionHandler.handle()
```

不推荐：

```text
FormService.save()
FlowService.doSomething()
TaskService.operate()
```

## 9. 持久层规范

Mapper/Repository 要求：

- 只负责数据库访问。
- 不写业务状态判断。
- 不处理权限逻辑。
- SQL 参数必须显式传入租户和应用上下文。
- 禁止拼接不可信 SQL。
- 常用查询字段建立索引。

动态数据查询：

- 表单完整数据以 `form_record.data_json` 为准。
- 高频查询字段走 `form_record_index`。
- 复杂查询统一通过 Query Service 封装。

## 10. 工作流代码规范

`smart-workflow` 和 `camunda` 必须分工清晰：

| 模块 | 职责 |
| --- | --- |
| `smart-workflow` | 业务流程编排、权限校验、表单绑定、任务快照、审批日志 |
| `camunda` | Camunda 部署、启动、完成、退回、拿回、转办、监听器 |

审批动作规范：

- 每个动作一个 Handler。
- 所有动作必须先做权限校验。
- 所有动作必须写审批日志。
- 所有动作必须同步任务快照。
- 所有动作必须支持幂等。
- 高风险动作必须加分布式锁。

第一期动作：

- `approve`
- `reject`
- `rejectFirst`
- `stop`
- `getBack`

第二期动作：

- `transfer`
- `delegate`
- `resolve`
- `addAssignee`
- `removeAssignee`
- `rejectCustom`

## 11. 前端目录规范

前端统一入口：

```text
code/web
```

推荐结构：

```text
src
  api                 接口定义
  assets              静态资源
  components          通用组件
  composables         组合式函数
  constants           常量
  layouts             布局
  router              路由
  stores              Pinia 状态
  styles              全局样式
  types               TS 类型
  utils               工具函数
  views               页面
    system            平台管理
    app               应用管理
    form              表单设计和表单运行
    workflow          流程管理和任务中心
```

流程设计器相关前端代码放在 `code/web/src`：

```text
views/workflow        流程管理和任务中心页面
components/workflow   BPMN 设计器、节点属性、候选人、审批按钮、字段权限组件
api/workflow          流程相关接口
types/workflow        流程相关类型
```

说明：

- `web` 是唯一前端入口。
- 流程设计器不再放到 `code/camunda`。
- 业务用户只访问 `code/web`。

## 12. Vue 代码规范

Vue 文件要求：

- 页面只做展示和事件编排。
- 复杂逻辑放到 composables。
- 接口调用放到 api 层。
- 类型定义放到 types。
- 常量放到 constants。
- 通用弹窗、表格、表单封装为组件。

后台样式要求：

- 整体视觉要有科技感，但保持管理后台的克制、清晰和可长时间使用。
- 主题颜色至少提供两套方案，第一期固定为“深海蓝”和“赛博青”。
- 主题色、背景、菜单、按钮、卡片阴影等变量必须集中在 `src/theme` 和全局样式变量中维护。
- 主题选择必须支持个人偏好持久化，最终保存到后端用户偏好表；前端 localStorage 只能作为未接入接口前的过渡缓存。
- 页面代码禁止散落硬编码主题色，业务组件优先使用 Naive UI theme overrides 和 CSS 变量。
- 后台卡片圆角控制在 8px 以内，避免过度圆润的营销页风格。
- 操作型页面优先保证信息密度、扫描效率和状态可辨识度，不做大面积装饰性渐变。
- 流程设计、监控、统计类页面可以适当增强发光边线、状态色和数据网格，但不能影响表格和表单可读性。

推荐页面结构：

```vue
<script setup lang="ts">
import { useFormList } from './composables/useFormList';

const { loading, rows, searchParams, search, reset } = useFormList();
</script>
```

禁止：

- 一个 `.vue` 文件塞入大量业务逻辑。
- 在模板中写复杂表达式。
- 到处手写重复表格查询逻辑。
- 页面直接拼接 URL。
- 页面直接处理统一错误提示。

## 13. 前端接口规范

接口文件按模块拆分：

```text
src/api/system/user.ts
src/api/system/role.ts
src/api/app/app.ts
src/api/form/form-def.ts
src/api/form/form-record.ts
src/api/workflow/task.ts
src/api/workflow/definition.ts
```

要求：

- 每个接口定义入参类型和返回类型。
- 前端统一请求封装处理 Token、租户、应用上下文、错误提示。
- 页面不直接使用 axios。
- 接口返回使用后端统一 `ApiResult<T>` 的 `data`。
- 错误码由请求封装统一处理。

## 14. 前端模型规范

前端类型命名：

| 类型 | 命名 | 用途 |
| --- | --- | --- |
| DTO | `XxxCreateDTO`、`XxxUpdateDTO` | 提交给后端 |
| Query | `XxxPageQuery` | 查询条件 |
| VO | `XxxVO`、`XxxDetailVO` | 后端返回 |
| Option | `XxxOption` | 下拉、树、选择器 |
| State | `XxxState` | Store 状态 |

要求：

- 不使用 `any` 作为默认方案。
- 复杂 `any` 必须逐步收敛为类型。
- 表单 schema、流程节点配置、审批按钮配置必须有明确类型。

## 15. 前端组件封装规范

优先封装：

- 权限按钮。
- 业务表格。
- 搜索表单。
- 字典选择器。
- 用户选择器。
- 部门选择器。
- 角色选择器。
- 应用选择器。
- 表单运行器。
- 审批动作栏。
- 流程图查看器。

组件设计要求：

- Props 简洁。
- Emits 明确。
- 不直接依赖页面路由。
- 不在通用组件里写具体业务接口。
- 复杂组件拆成小组件。

## 16. 命名规范

后端：

- 类名：`UpperCamelCase`。
- 方法名：`lowerCamelCase`。
- 常量：`UPPER_SNAKE_CASE`。
- 数据库字段：`snake_case`。
- 枚举值：`UPPER_SNAKE_CASE`。

前端：

- 组件文件：`kebab-case.vue`。
- composable：`useXxx.ts`。
- API 文件：`kebab-case.ts`。
- 类型文件：`xxx.d.ts` 或 `xxx.ts`。
- Store：`useXxxStore`。

常量和枚举：

- 跨模块复用的字符串、数字、请求头、缓存 Key、权限码、流程动作编码，统一放入 `constants` 包下的常量类或枚举类。
- 有固定业务取值范围的字段优先使用枚举，例如流程状态、审批动作、表单模式。
- 普通业务类中避免定义可复用的 `public static final` 字段。
- 禁止使用静态内部类堆叠常量，按业务域拆分为独立常量类或枚举。
- 工具类内部必要的私有静态状态允许保留，但不能作为跨模块全局变量对外暴露。

## 17. 注释规范

要求：

- 后端所有公共类、Controller、Service、Repository、DTO、VO、BO、Entity、枚举必须写类注释。
- 类注释必须说明类的用途和创建时间，格式建议使用 `@since 2026-06-29`。
- 重要字段必须写字段注释，说明业务含义、取值范围、是否允许为空。
- 公共方法、接口方法、核心业务方法必须写方法注释，包含入参、返回结果和可能抛出的异常。
- Controller 方法注释必须说明接口用途、请求参数、返回数据和主要业务异常。
- Service 方法注释必须说明事务边界、幂等要求、权限要求和异常场景。
- 工作流审批动作必须标明适用范围，例如是否支持并行网关、多实例、子流程。
- 前端 TypeScript 接口、API 方法、核心 composable、页面关键状态必须写注释。
- Vue 页面必须对关键状态、核心事件、异步加载逻辑写注释。
- CSS 中影响整体布局、主题或响应式行为的样式块必须写注释。
- 简单 getter/setter、明显的模板文本不写无意义注释。
- 注释优先说明业务意图、边界和风险，不机械复述代码。

后端类注释示例：

```java
/**
 * 表单定义应用服务，负责编排表单草稿、发布和版本切换。
 *
 * @since 2026-06-29
 */
public class FormDefinitionAppService {
}
```

后端方法注释示例：

```java
/**
 * 保存表单草稿。
 *
 * @param command 表单保存命令，必须包含租户、应用和表单 Schema
 * @return 保存后的表单详情
 * @throws BusinessException 当表单编码重复或无应用权限时抛出
 */
public FormDetailVO saveDraft(FormSaveCommand command) {
}
```

前端注释示例：

```ts
/**
 * 查询当前登录用户可见的应用菜单。
 *
 * @param appId 应用 ID
 * @returns 应用菜单树
 * @throws Error 当后端返回非成功错误码时抛出
 */
export function getAppMenus(appId: string): Promise<AppMenuVO[]> {
}
```

## 18. 测试规范

后端至少覆盖：

- Service 单元测试。
- Controller 接口测试。
- 权限校验测试。
- 表单无流程提交测试。
- 表单有流程草稿测试。
- 流程发起和办理测试。
- 审批动作幂等测试。

工作流专项测试：

- 串行流程。
- 排他网关。
- 会签。
- 退回上一节点。
- 退回发起人。
- 拿回。
- 终止。

前端至少覆盖：

- 关键 composable。
- 权限按钮显示。
- 表单运行器。
- 工作流任务页。
- 设计器保存和发布入口。

## 19. 提交和评审规范

每个阶段提交前检查：

- 是否符合分层。
- Controller 是否足够薄。
- 是否复用公共封装。
- 是否存在重复逻辑。
- DTO/VO/BO 是否清晰。
- 错误码是否准确。
- 前端页面是否过重。
- 是否影响无流程表单。
- 是否影响有流程表单草稿。
- 是否补充阶段验收记录。

代码评审优先关注：

- 权限遗漏。
- 租户和应用隔离遗漏。
- 幂等遗漏。
- 事务边界错误。
- 表单版本兼容。
- 流程状态不一致。
- 前端重复代码。
- 文件结构混乱。
