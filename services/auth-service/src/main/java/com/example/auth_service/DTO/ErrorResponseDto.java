package com.example.auth_service.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Standardized error response DTO for consistent error handling across the API.
 * 
 * @author Ishanka Senadeera
 * @since 2026-02-15
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponseDto {
    
    private int status;
    private String error;
    private String message;
    private String path;
    private LocalDateTime timestamp;
    private String errorCode;
    private List<FieldError> fieldErrors;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldError {
        private String field;
        private String message;
        private Object rejectedValue;
    }
    
    /**
     * Create a simple error response
     */
    public static ErrorResponseDto of(int status, String error, String message, String path) {
        return ErrorResponseDto.builder()
                .status(status)
                .error(error)
                .message(message)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Create error response with error code
     */
    public static ErrorResponseDto of(int status, String error, String message, String path, String errorCode) {
        return ErrorResponseDto.builder()
                .status(status)
                .error(error)
                .message(message)
                .path(path)
                .errorCode(errorCode)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
