import axios from 'axios';

/**
 * 后端统一返回结构，前端请求封装只暴露 data 给页面使用。
 *
 * @template T 业务数据类型
 */
export interface ApiResult<T> {
  /** 错误码，成功固定为 0。 */
  code: string;
  /** 响应消息，失败时用于错误提示。 */
  message: string;
  /** 业务数据载荷。 */
  data: T;
  /** 链路追踪 ID，排查接口问题时使用。 */
  traceId: string;
  /** 服务端响应时间戳，单位毫秒。 */
  timestamp: number;
}

/**
 * 平台统一 Axios 实例，后续在这里集中挂载 Token、租户和应用上下文。
 */
export const request = axios.create({
  timeout: 15000
});

/**
 * 发起 GET 请求并解包统一返回结构。
 *
 * @param url 接口地址
 * @returns 后端响应中的业务数据
 * @throws Error 当后端返回非成功错误码时抛出
 */
export async function getData<T>(url: string): Promise<T> {
  const response = await request.get<ApiResult<T>>(url);
  if (response.data.code !== '0') {
    throw new Error(response.data.message);
  }
  return response.data.data;
}
