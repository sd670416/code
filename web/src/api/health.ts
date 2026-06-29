import { getData } from './request';

/**
 * 健康检查返回对象。
 */
export interface HealthVO {
  /** 服务名称。 */
  service: string;
  /** 服务状态，正常为 UP。 */
  status: string;
  /** Camunda 引擎名称，仅工作流服务返回。 */
  engine?: string;
}

/**
 * 查询主平台 API 健康状态。
 *
 * @returns 主平台健康检查结果
 * @throws Error 当后端返回非成功错误码时抛出
 */
export function getApiHealth() {
  return getData<HealthVO>('/api/system/health');
}

/**
 * 查询 Camunda 外置服务健康状态。
 *
 * @returns Camunda 健康检查结果
 * @throws Error 当服务不可访问或响应非 2xx 时抛出
 */
export async function getCamundaHealth() {
  const response = await fetch('/camunda-api/engine/health');
  if (!response.ok) {
    throw new Error('Camunda health check failed');
  }
  return response.json() as Promise<HealthVO>;
}
