package com.smartcode.common.web;

import com.smartcode.common.api.ApiResult;
import com.smartcode.common.api.CommonErrorCode;
import com.smartcode.common.exception.BusinessException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器，将后端异常统一转换为 ApiResult 响应。
 *
 * @since 2026-06-29
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    /**
     * 处理业务异常。
     *
     * @param exception 业务异常
     * @return 统一失败响应
     */
    @ExceptionHandler(BusinessException.class)
    public ApiResult<Void> handleBusinessException(BusinessException exception) {
        return ApiResult.fail(exception.getErrorCode());
    }

    /**
     * 处理请求参数异常，包括参数校验失败和 JSON 请求体无法读取。
     *
     * @param exception 参数异常
     * @return 参数错误响应
     */
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    public ApiResult<Void> handleParamException(Exception exception) {
        return ApiResult.fail(CommonErrorCode.PARAM_INVALID);
    }

    /**
     * 处理未被业务显式捕获的系统异常。
     *
     * @param exception 系统异常
     * @return 系统错误响应
     */
    @ExceptionHandler(Exception.class)
    public ApiResult<Void> handleException(Exception exception) {
        return ApiResult.fail(CommonErrorCode.SYSTEM_ERROR);
    }
}
