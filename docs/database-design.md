# 低代码 SaaS 工作流平台数据库设计

## 1. 设计原则

- 使用 MySQL 8。
- 表名使用小写下划线。
- 主键使用 `bigint`，可采用雪花算法生成。
- 所有核心表包含 `tenant_id`。
- 应用内资源表包含 `app_id`。
- 所有表包含 `created_by`、`created_at`、`updated_by`、`updated_at`、`deleted`。
- 逻辑删除字段 `deleted`：`0` 正常，`1` 删除。
- 状态字段统一使用 `status`：`0` 禁用，`1` 启用。
- 编码字段在租户或应用范围内唯一。

公共字段建议：

```sql
id bigint primary key,
tenant_id bigint not null,
created_by bigint null,
created_at datetime not null default current_timestamp,
updated_by bigint null,
updated_at datetime not null default current_timestamp on update current_timestamp,
deleted tinyint not null default 0
```

## 2. 核心关系

```text
sys_tenant 1--n sys_user
sys_user 1--1 sys_user_preference
sys_tenant 1--n low_app
sys_user n--n sys_role
low_app 1--n app_menu
low_app 1--n form_def
low_app 1--n flow_def
sys_role n--n app_menu
sys_role n--n auth_permission
sys_role n--n data_rule
form_def 1--n form_field
form_def 1--n form_record
form_def 1--n flow_form_bind
flow_def 1--n flow_deploy
form_record 1--n flow_instance
flow_business_type 1--n flow_form_bind
flow_instance 1--n flow_task_snapshot
flow_version 1--n flow_node_button
flow_version 1--n flow_node_form_permission
flow_task_snapshot 1--n flow_task_relation
```

## 3. 租户与组织

### 3.1 sys_tenant 租户表

```sql
create table sys_tenant (
  id bigint primary key comment '租户ID',
  tenant_code varchar(64) not null comment '租户编码',
  tenant_name varchar(128) not null comment '租户名称',
  contact_name varchar(64) null comment '联系人',
  contact_phone varchar(32) null comment '联系电话',
  expire_at datetime null comment '到期时间',
  status tinyint not null default 1 comment '状态：0禁用 1启用',
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_tenant_code (tenant_code)
) engine=InnoDB default charset=utf8mb4 comment='租户表';
```

### 3.2 sys_dept 部门表

```sql
create table sys_dept (
  id bigint primary key,
  tenant_id bigint not null,
  parent_id bigint not null default 0,
  dept_code varchar(64) not null,
  dept_name varchar(128) not null,
  leader_user_id bigint null,
  sort_no int not null default 0,
  status tinyint not null default 1,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_dept_code (tenant_id, dept_code),
  key idx_dept_parent (tenant_id, parent_id)
) engine=InnoDB default charset=utf8mb4 comment='部门表';
```

### 3.3 sys_user 用户表

```sql
create table sys_user (
  id bigint primary key,
  tenant_id bigint not null,
  dept_id bigint null,
  username varchar(64) not null,
  password_hash varchar(255) not null,
  nickname varchar(64) not null,
  mobile varchar(32) null,
  email varchar(128) null,
  avatar_url varchar(512) null,
  status tinyint not null default 1,
  last_login_at datetime null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_user_username (tenant_id, username),
  key idx_user_dept (tenant_id, dept_id)
) engine=InnoDB default charset=utf8mb4 comment='用户表';
```

### 3.4 sys_user_preference 用户偏好表

```sql
create table sys_user_preference (
  id bigint primary key comment '偏好ID',
  tenant_id bigint not null comment '租户ID',
  user_id bigint not null comment '用户ID',
  theme_scheme varchar(32) not null default 'deep-blue' comment '后台主题方案：deep-blue深海蓝 cyber-cyan赛博青',
  layout_density varchar(32) not null default 'default' comment '布局密度：default默认 compact紧凑',
  language varchar(32) not null default 'zh-CN' comment '界面语言',
  extra_json json null comment '扩展偏好配置',
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_user_preference_user (tenant_id, user_id)
) engine=InnoDB default charset=utf8mb4 comment='用户偏好表';
```

说明：

- 主题方案属于用户个人偏好，不写死在前端。
- 登录后主平台返回用户偏好，前端按 `theme_scheme` 应用主题。
- 用户切换主题后调用偏好保存接口，后端更新 `sys_user_preference`。
- 前端本地存储只作为未登录或接口失败时的临时缓存。

## 4. 应用与菜单

### 4.1 low_app 应用表

```sql
create table low_app (
  id bigint primary key,
  tenant_id bigint not null,
  app_code varchar(64) not null,
  app_name varchar(128) not null,
  app_icon varchar(128) null,
  description varchar(512) null,
  status tinyint not null default 1,
  published_version varchar(32) null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_app_code (tenant_id, app_code)
) engine=InnoDB default charset=utf8mb4 comment='低代码应用表';
```

### 4.2 platform_menu 平台菜单表

```sql
create table platform_menu (
  id bigint primary key,
  tenant_id bigint not null,
  parent_id bigint not null default 0,
  menu_name varchar(128) not null,
  menu_type varchar(32) not null comment 'CATALOG、MENU、BUTTON',
  route_path varchar(255) null,
  component varchar(255) null,
  icon varchar(128) null,
  permission_code varchar(128) null,
  sort_no int not null default 0,
  visible tinyint not null default 1,
  status tinyint not null default 1,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  key idx_platform_menu_tree (tenant_id, parent_id),
  key idx_platform_menu_permission (tenant_id, permission_code)
) engine=InnoDB default charset=utf8mb4 comment='平台菜单表';
```

### 4.3 app_menu 应用菜单表

```sql
create table app_menu (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  parent_id bigint not null default 0,
  menu_name varchar(128) not null,
  menu_type varchar(32) not null comment '目录、菜单、按钮',
  route_path varchar(255) null,
  component varchar(255) null,
  icon varchar(128) null,
  permission_code varchar(128) null,
  form_id bigint null comment '绑定表单ID',
  sort_no int not null default 0,
  visible tinyint not null default 1,
  status tinyint not null default 1,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  key idx_menu_tree (tenant_id, app_id, parent_id),
  key idx_menu_permission (tenant_id, app_id, permission_code)
) engine=InnoDB default charset=utf8mb4 comment='应用菜单表';
```

## 5. 权限模型

### 5.1 sys_role 角色表

```sql
create table sys_role (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null default 0 comment '0 表示平台级角色，非 0 表示应用级角色',
  role_code varchar(64) not null,
  role_name varchar(128) not null,
  role_type varchar(32) not null comment 'PLATFORM、APP',
  status tinyint not null default 1,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_role_code (tenant_id, app_id, role_code)
) engine=InnoDB default charset=utf8mb4 comment='角色表';
```

### 5.2 sys_user_role 用户角色表

```sql
create table sys_user_role (
  id bigint primary key,
  tenant_id bigint not null,
  user_id bigint not null,
  role_id bigint not null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_user_role (tenant_id, user_id, role_id),
  key idx_user_role_user (tenant_id, user_id)
) engine=InnoDB default charset=utf8mb4 comment='用户角色关联表';
```

### 5.3 auth_permission 操作权限表

```sql
create table auth_permission (
  id bigint primary key,
  tenant_id bigint not null,
  scope_type varchar(32) not null comment 'PLATFORM、APP',
  app_id bigint not null default 0 comment '平台级权限为 0，应用级权限为应用ID',
  permission_code varchar(128) not null,
  permission_name varchar(128) not null,
  resource_type varchar(32) not null comment 'MENU、BUTTON、API、FLOW',
  resource_id bigint null,
  api_method varchar(16) null,
  api_path varchar(255) null,
  status tinyint not null default 1,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_permission_code (tenant_id, scope_type, app_id, permission_code)
) engine=InnoDB default charset=utf8mb4 comment='操作权限表';
```

### 5.4 auth_role_permission 角色操作权限表

```sql
create table auth_role_permission (
  id bigint primary key,
  tenant_id bigint not null,
  scope_type varchar(32) not null comment 'PLATFORM、APP',
  app_id bigint not null default 0,
  role_id bigint not null,
  permission_id bigint not null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_role_permission (tenant_id, scope_type, app_id, role_id, permission_id)
) engine=InnoDB default charset=utf8mb4 comment='角色操作权限关联表';
```

### 5.5 auth_role_menu 角色菜单权限表

```sql
create table auth_role_menu (
  id bigint primary key,
  tenant_id bigint not null,
  scope_type varchar(32) not null comment 'PLATFORM、APP',
  app_id bigint not null default 0 comment '平台菜单为 0，应用菜单为应用ID',
  role_id bigint not null,
  menu_id bigint not null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_role_menu (tenant_id, scope_type, app_id, role_id, menu_id)
) engine=InnoDB default charset=utf8mb4 comment='角色菜单权限关联表';
```

说明：

- 平台级菜单使用 `platform_menu`，例如租户管理、用户管理、系统配置、应用管理、流程监控。
- 应用级菜单使用 `app_menu`，例如某个应用内的业务表单、报表、流程入口。
- `sys_role.role_type = PLATFORM` 时 `app_id = 0`，可授权平台菜单和平台 API。
- `sys_role.role_type = APP` 时 `app_id = 应用ID`，可授权应用菜单、应用按钮和应用 API。
- `auth_role_menu.scope_type` 决定 `menu_id` 指向 `platform_menu` 还是 `app_menu`。

### 5.6 data_rule 数据权限规则表

```sql
create table data_rule (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  rule_code varchar(64) not null,
  rule_name varchar(128) not null,
  scope_type varchar(32) not null comment 'SELF、DEPT、DEPT_TREE、CUSTOM_DEPT、CUSTOM_USER、FIELD_CONDITION',
  form_id bigint null,
  rule_json json null comment '规则配置JSON',
  status tinyint not null default 1,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_data_rule_code (tenant_id, app_id, rule_code)
) engine=InnoDB default charset=utf8mb4 comment='数据权限规则表';
```

### 5.7 auth_role_data_rule 角色数据权限表

```sql
create table auth_role_data_rule (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  role_id bigint not null,
  data_rule_id bigint not null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_role_data_rule (tenant_id, app_id, role_id, data_rule_id)
) engine=InnoDB default charset=utf8mb4 comment='角色数据权限关联表';
```

## 6. 表单模型

### 6.1 form_def 表单定义表

```sql
create table form_def (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  form_code varchar(64) not null,
  form_name varchar(128) not null,
  version_no int not null default 1,
  current_version_id bigint null,
  workflow_mode varchar(32) not null default 'NONE' comment 'NONE、OPTIONAL、REQUIRED',
  storage_type varchar(32) not null default 'JSON' comment 'JSON、PHYSICAL_TABLE',
  physical_table varchar(128) null,
  status varchar(32) not null default 'DRAFT' comment 'DRAFT、PUBLISHED、DISABLED',
  description varchar(512) null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_form_code (tenant_id, app_id, form_code)
) engine=InnoDB default charset=utf8mb4 comment='表单定义表';
```

### 6.2 form_version 表单版本表

```sql
create table form_version (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  form_id bigint not null,
  version_no int not null,
  schema_json json not null comment '页面布局和组件Schema',
  list_schema_json json null comment '列表页Schema',
  detail_schema_json json null comment '详情页Schema',
  status varchar(32) not null default 'DRAFT',
  published_at datetime null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_form_version (tenant_id, app_id, form_id, version_no)
) engine=InnoDB default charset=utf8mb4 comment='表单版本表';
```

### 6.3 form_field 表单字段表

```sql
create table form_field (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  form_id bigint not null,
  version_id bigint not null,
  field_code varchar(64) not null,
  field_name varchar(128) not null,
  data_type varchar(32) not null comment 'STRING、NUMBER、DECIMAL、DATE、DATETIME、BOOLEAN、JSON',
  component_type varchar(64) not null,
  required tinyint not null default 0,
  searchable tinyint not null default 0,
  list_visible tinyint not null default 0,
  default_value varchar(512) null,
  options_json json null,
  validate_json json null,
  sort_no int not null default 0,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_form_field (tenant_id, app_id, version_id, field_code),
  key idx_form_field_form (tenant_id, app_id, form_id)
) engine=InnoDB default charset=utf8mb4 comment='表单字段表';
```

## 7. 动态业务数据

### 7.1 form_record 表单记录表

```sql
create table form_record (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  form_id bigint not null,
  form_version_id bigint not null,
  record_no varchar(64) null,
  data_json json not null,
  owner_user_id bigint null comment '数据负责人',
  owner_dept_id bigint null comment '数据所属部门',
  record_status varchar(32) not null default 'DRAFT' comment 'DRAFT、SUBMITTED、PROCESSING、COMPLETED、CANCELED',
  workflow_mode varchar(32) not null default 'NONE' comment 'NONE、OPTIONAL、REQUIRED',
  flow_status varchar(32) not null default 'NONE' comment 'NONE、DRAFT、PROCESSING、APPROVED、REJECTED、CANCELED',
  submitted_at datetime null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  key idx_record_form (tenant_id, app_id, form_id, created_at),
  key idx_record_owner_user (tenant_id, app_id, owner_user_id),
  key idx_record_owner_dept (tenant_id, app_id, owner_dept_id),
  key idx_record_status (tenant_id, app_id, record_status),
  key idx_record_flow_status (tenant_id, app_id, flow_status)
) engine=InnoDB default charset=utf8mb4 comment='表单业务记录表';
```

### 7.2 form_record_index 表单记录索引表

```sql
create table form_record_index (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  form_id bigint not null,
  record_id bigint not null,
  field_code varchar(64) not null,
  string_value varchar(512) null,
  number_value decimal(24,6) null,
  datetime_value datetime null,
  created_at datetime not null default current_timestamp,
  key idx_index_string (tenant_id, app_id, form_id, field_code, string_value),
  key idx_index_number (tenant_id, app_id, form_id, field_code, number_value),
  key idx_index_datetime (tenant_id, app_id, form_id, field_code, datetime_value),
  key idx_index_record (tenant_id, app_id, record_id)
) engine=InnoDB default charset=utf8mb4 comment='表单记录查询索引表';
```

说明：

- `form_record.data_json` 保存完整业务数据。
- `form_record_index` 只保存需要搜索、排序、统计的字段。
- 设计器中字段勾选 `searchable` 后，保存业务数据时同步写索引表。
- `workflow_mode = NONE` 表示无流程表单，提交后 `record_status = SUBMITTED`，`flow_status = NONE`。
- `workflow_mode = REQUIRED` 表示有审批流表单，允许先保存草稿，发起流程后 `record_status = PROCESSING`，`flow_status = PROCESSING`。
- `workflow_mode = OPTIONAL` 表示表单可按场景选择是否走流程，适合后续扩展。
- `record_status` 负责业务记录生命周期，`flow_status` 只负责审批生命周期，不混用。

## 8. 工作流模型

### 8.1 flow_def 流程定义表

```sql
create table flow_def (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  flow_code varchar(64) not null,
  flow_name varchar(128) not null,
  current_version_id bigint null,
  status varchar(32) not null default 'DRAFT' comment 'DRAFT、PUBLISHED、DISABLED',
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_flow_code (tenant_id, app_id, flow_code)
) engine=InnoDB default charset=utf8mb4 comment='流程定义表';
```

### 8.2 flow_version 流程版本表

```sql
create table flow_version (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  flow_id bigint not null,
  version_no int not null,
  bpmn_xml longtext not null,
  config_json json null comment '节点候选人、按钮、表单权限、变量映射',
  camunda_process_key varchar(128) null,
  camunda_definition_id varchar(128) null,
  status varchar(32) not null default 'DRAFT',
  published_at datetime null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_flow_version (tenant_id, app_id, flow_id, version_no)
) engine=InnoDB default charset=utf8mb4 comment='流程版本表';
```

### 8.3 flow_business_type 流程业务类型表

```sql
create table flow_business_type (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  parent_id bigint not null default 0,
  business_code varchar(64) not null,
  business_name varchar(128) not null,
  ancestors varchar(512) null,
  sort_no int not null default 0,
  status tinyint not null default 1,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_flow_business_code (tenant_id, app_id, business_code),
  key idx_flow_business_parent (tenant_id, app_id, parent_id)
) engine=InnoDB default charset=utf8mb4 comment='流程业务类型表';
```

说明：

- 该表承接旧系统 `act_ext_business` 的能力。
- 在低代码平台中可用于应用内业务分类、表单分类或流程场景分类。

### 8.4 flow_form_bind 表单流程绑定表

```sql
create table flow_form_bind (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  business_type_id bigint null comment '流程业务类型ID',
  form_id bigint not null,
  flow_id bigint not null,
  bind_mode varchar(32) not null default 'REQUIRED' comment 'OPTIONAL、REQUIRED',
  scene_code varchar(64) not null default 'default',
  scene_name varchar(128) not null default '默认流程',
  status tinyint not null default 1,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_form_flow_scene (tenant_id, app_id, form_id, scene_code),
  key idx_flow_form_business (tenant_id, app_id, business_type_id)
) engine=InnoDB default charset=utf8mb4 comment='表单流程绑定表';
```

### 8.5 flow_instance 流程实例表

```sql
create table flow_instance (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  form_id bigint not null,
  record_id bigint not null,
  flow_id bigint not null,
  flow_version_id bigint not null,
  camunda_instance_id varchar(128) not null,
  title varchar(255) not null,
  initiator_user_id bigint not null,
  status varchar(32) not null comment 'RUNNING、COMPLETED、REJECTED、CANCELED',
  started_at datetime not null,
  ended_at datetime null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  key idx_flow_instance_record (tenant_id, app_id, record_id),
  key idx_flow_instance_user (tenant_id, app_id, initiator_user_id),
  key idx_flow_instance_status (tenant_id, app_id, status)
) engine=InnoDB default charset=utf8mb4 comment='流程实例表';
```

### 8.6 flow_task_snapshot 流程任务快照表

```sql
create table flow_task_snapshot (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  instance_id bigint not null,
  camunda_task_id varchar(128) not null,
  task_key varchar(128) not null,
  task_name varchar(128) not null,
  assignee_user_id bigint null,
  candidate_json json null comment '候选用户、角色、部门',
  status varchar(32) not null comment 'PENDING、CLAIMED、DELEGATED、COMPLETED、CANCELED、RETURNED、TRANSFERRED',
  delegated_from_user_id bigint null comment '委托人',
  source_task_id bigint null comment '来源任务ID，用于加签、转办、拿回',
  arrived_at datetime not null,
  completed_at datetime null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_camunda_task (tenant_id, app_id, camunda_task_id),
  key idx_task_assignee (tenant_id, app_id, assignee_user_id, status),
  key idx_task_instance (tenant_id, app_id, instance_id)
) engine=InnoDB default charset=utf8mb4 comment='流程任务快照表';
```

### 8.7 flow_approval_log 审批记录表

```sql
create table flow_approval_log (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  instance_id bigint not null,
  task_id bigint null,
  action varchar(32) not null comment 'SUBMIT、APPROVE、REJECT、REJECT_FIRST、REJECT_CUSTOM、STOP、ADD_ASSIGNEE、REMOVE_ASSIGNEE、TRANSFER、DELEGATE、RESOLVE、GET_BACK',
  operator_user_id bigint not null,
  target_user_id bigint null comment '目标用户',
  target_node_key varchar(128) null comment '目标节点',
  comment varchar(1000) null,
  attachment_json json null,
  operated_at datetime not null,
  created_at datetime not null default current_timestamp,
  key idx_approval_instance (tenant_id, app_id, instance_id, operated_at)
) engine=InnoDB default charset=utf8mb4 comment='审批记录表';
```

### 8.8 flow_button_def 流程按钮定义表

```sql
create table flow_button_def (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint null comment '为空表示平台内置按钮',
  button_code varchar(64) not null,
  default_name varchar(128) not null,
  action_type varchar(64) not null comment 'APPROVE、REJECT、REJECT_FIRST、REJECT_CUSTOM、STOP、ADD_ASSIGNEE、REMOVE_ASSIGNEE、TRANSFER、DELEGATE、RESOLVE、GET_BACK',
  built_in tinyint not null default 0,
  default_comment_required tinyint not null default 1,
  status tinyint not null default 1,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_flow_button_code (tenant_id, app_id, button_code)
) engine=InnoDB default charset=utf8mb4 comment='流程按钮定义表';
```

### 8.9 flow_node_button 节点按钮配置表

```sql
create table flow_node_button (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  flow_id bigint not null,
  flow_version_id bigint not null,
  node_key varchar(128) not null,
  button_code varchar(64) not null,
  button_name varchar(128) not null,
  comment_required tinyint not null default 1,
  attachment_required tinyint not null default 0,
  enabled tinyint not null default 1,
  sort_no int not null default 0,
  config_json json null comment '按钮扩展配置，如退回范围、加签策略',
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_node_button (tenant_id, app_id, flow_version_id, node_key, button_code),
  key idx_node_button_node (tenant_id, app_id, flow_version_id, node_key)
) engine=InnoDB default charset=utf8mb4 comment='流程节点按钮配置表';
```

### 8.10 flow_node_form_permission 节点表单字段权限表

```sql
create table flow_node_form_permission (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  flow_id bigint not null,
  flow_version_id bigint not null,
  form_id bigint not null,
  form_version_id bigint not null,
  node_key varchar(128) not null,
  field_code varchar(64) not null,
  permission_type varchar(32) not null comment 'HIDDEN、READONLY、EDITABLE、REQUIRED',
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_node_field_permission (tenant_id, app_id, flow_version_id, node_key, field_code),
  key idx_node_form_permission (tenant_id, app_id, form_version_id, node_key)
) engine=InnoDB default charset=utf8mb4 comment='流程节点表单字段权限表';
```

### 8.11 flow_task_relation 流程任务关系表

```sql
create table flow_task_relation (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  instance_id bigint not null,
  source_task_id bigint null,
  target_task_id bigint null,
  relation_type varchar(32) not null comment 'ADD_ASSIGNEE、REMOVE_ASSIGNEE、TRANSFER、DELEGATE、RESOLVE、GET_BACK、REJECT',
  source_user_id bigint null,
  target_user_id bigint null,
  source_node_key varchar(128) null,
  target_node_key varchar(128) null,
  status varchar(32) not null default 'ACTIVE',
  reason varchar(1000) null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  key idx_task_relation_instance (tenant_id, app_id, instance_id),
  key idx_task_relation_source (tenant_id, app_id, source_task_id),
  key idx_task_relation_target (tenant_id, app_id, target_task_id)
) engine=InnoDB default charset=utf8mb4 comment='流程任务关系表';
```

### 8.12 flow_cc_task 流程抄送任务表

```sql
create table flow_cc_task (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  instance_id bigint not null,
  task_id bigint null,
  user_id bigint not null,
  node_key varchar(128) null,
  status varchar(32) not null default 'UNREAD' comment 'UNREAD、READ',
  read_at datetime null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  key idx_cc_user (tenant_id, app_id, user_id, status),
  key idx_cc_instance (tenant_id, app_id, instance_id)
) engine=InnoDB default charset=utf8mb4 comment='流程抄送任务表';
```

### 8.13 flow_sync_log Camunda 同步日志表

```sql
create table flow_sync_log (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint not null,
  instance_id bigint null,
  camunda_instance_id varchar(128) null,
  sync_type varchar(32) not null comment 'START、TASK_CREATE、TASK_COMPLETE、TASK_CANCEL、INSTANCE_END、MANUAL_FIX',
  sync_status varchar(32) not null comment 'SUCCESS、FAILED',
  request_json json null,
  response_json json null,
  error_message varchar(1000) null,
  created_at datetime not null default current_timestamp,
  key idx_sync_instance (tenant_id, app_id, instance_id, created_at),
  key idx_sync_status (tenant_id, app_id, sync_status, created_at)
) engine=InnoDB default charset=utf8mb4 comment='Camunda同步日志表';
```

## 9. 字典、文件与审计

### 9.1 sys_dict 字典表

```sql
create table sys_dict (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint null,
  dict_type varchar(64) not null,
  dict_label varchar(128) not null,
  dict_value varchar(128) not null,
  sort_no int not null default 0,
  status tinyint not null default 1,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  updated_by bigint null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  deleted tinyint not null default 0,
  unique key uk_dict_value (tenant_id, app_id, dict_type, dict_value)
) engine=InnoDB default charset=utf8mb4 comment='数据字典表';
```

### 9.2 sys_file 文件表

```sql
create table sys_file (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint null,
  file_name varchar(255) not null,
  original_name varchar(255) not null,
  file_ext varchar(32) null,
  mime_type varchar(128) null,
  file_size bigint not null,
  storage_type varchar(32) not null comment 'LOCAL、OSS、S3',
  storage_path varchar(512) not null,
  created_by bigint null,
  created_at datetime not null default current_timestamp,
  deleted tinyint not null default 0,
  key idx_file_tenant_app (tenant_id, app_id, created_at)
) engine=InnoDB default charset=utf8mb4 comment='文件表';
```

### 9.3 audit_log 操作审计表

```sql
create table audit_log (
  id bigint primary key,
  tenant_id bigint not null,
  app_id bigint null,
  user_id bigint null,
  module_name varchar(64) not null,
  action_name varchar(64) not null,
  target_type varchar(64) null,
  target_id bigint null,
  request_method varchar(16) null,
  request_path varchar(255) null,
  request_ip varchar(64) null,
  request_body json null,
  result_status varchar(32) not null,
  error_message varchar(1000) null,
  created_at datetime not null default current_timestamp,
  key idx_audit_user (tenant_id, user_id, created_at),
  key idx_audit_target (tenant_id, app_id, target_type, target_id)
) engine=InnoDB default charset=utf8mb4 comment='操作审计日志表';
```

## 10. 数据权限落库策略

查询动态业务数据时，最终 SQL 必须同时满足：

```text
tenant_id = 当前租户
app_id = 当前应用
form_id = 当前表单
未删除
菜单/操作权限通过
数据权限规则通过
```

数据权限规则转换示例：

| scope_type | SQL 条件 |
| --- | --- |
| SELF | `created_by = 当前用户ID or owner_user_id = 当前用户ID` |
| DEPT | `owner_dept_id = 当前部门ID` |
| DEPT_TREE | `owner_dept_id in 当前部门及下级部门` |
| CUSTOM_DEPT | `owner_dept_id in 规则指定部门` |
| CUSTOM_USER | `owner_user_id in 规则指定用户` |
| FIELD_CONDITION | 通过 `form_record_index` 匹配字段条件 |

多个角色拥有多个规则时，默认取并集，避免用户多角色后权限反而变小。高安全场景可在应用配置中支持交集策略。

## 11. 索引建议

必须建立的复合索引：

- 所有应用资源：`(tenant_id, app_id)`。
- 所有树形结构：`(tenant_id, app_id, parent_id)`。
- 业务记录查询：`(tenant_id, app_id, form_id, created_at)`。
- 待办查询：`(tenant_id, app_id, assignee_user_id, status)`。
- 用户角色查询：`(tenant_id, user_id)`。
- 权限查询：`(tenant_id, app_id, role_id)`。

JSON 字段不直接作为主要查询条件。高频字段必须同步写入索引表或后续生成物理列。

## 12. 初始化数据建议

系统初始化：

- 创建默认租户。
- 创建租户管理员账号。
- 创建平台管理员角色。
- 创建默认应用。
- 创建应用管理员角色。
- 初始化系统菜单、应用管理菜单、权限管理菜单。

应用初始化：

- 创建应用管理员角色。
- 创建默认菜单目录。
- 创建默认权限码。
- 创建应用数据管理员数据权限规则。

## 13. 后续可扩展表

后续阶段可增加：

- `app_version`：应用发布版本。
- `app_release_log`：应用发布记录。
- `form_data_change_log`：业务数据变更日志。
- `message_notice`：站内消息。
- `report_def`：报表定义。
- `integration_api`：外部接口集成。
- `job_schedule`：定时任务。
- `flow_delegate_rule`：流程委托规则。
- `form_physical_table_change`：物理表变更记录。
