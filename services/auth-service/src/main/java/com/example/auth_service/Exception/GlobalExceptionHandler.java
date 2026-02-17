package com.example.auth_service.Exception;

import com.example.auth_service.DTO.ErrorResponseDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.ArrayList;
import java.util.List;

/**
 * Global exception handler for consistent error responses across the API.
 * 
 * @author Ishanka Senadeera
 * @since 2026-02-15
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle user not found exception
     */
    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<ErrorResponseDto> handleUserNotFound(
            UserNotFoundException ex, 
            HttpServletRequest request) {
        
        log.warn("User not found: {}", ex.getMessage());
        
        ErrorResponseDto error = ErrorResponseDto.of(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage(),
                request.getRequestURI(),
                "USER_NOT_FOUND"
        );
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Handle user already exists exception
     */
    @ExceptionHandler(UserAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<ErrorResponseDto> handleUserAlreadyExists(
            UserAlreadyExistsException ex, 
            HttpServletRequest request) {
        
        log.warn("User already exists: {}", ex.getMessage());
        
        ErrorResponseDto error = ErrorResponseDto.of(
                HttpStatus.CONFLICT.value(),
                "Conflict",
                ex.getMessage(),
                request.getRequestURI(),
                "USER_ALREADY_EXISTS"
        );
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * Handle invalid credentials exception
     */
    @ExceptionHandler(InvalidCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<ErrorResponseDto> handleInvalidCredentials(
            InvalidCredentialsException ex, 
            HttpServletRequest request) {
        
        log.warn("Invalid credentials attempt for path: {}", request.getRequestURI());
        
        ErrorResponseDto error = ErrorResponseDto.of(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                ex.getMessage(),
                request.getRequestURI(),
                "INVALID_CREDENTIALS"
        );
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Handle validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponseDto> handleValidationErrors(
            MethodArgumentNotValidException ex, 
            HttpServletRequest request) {
        
        BindingResult bindingResult = ex.getBindingResult();
        List<ErrorResponseDto.FieldError> fieldErrors = new ArrayList<>();
        
        for (FieldError error : bindingResult.getFieldErrors()) {
            fieldErrors.add(new ErrorResponseDto.FieldError(
                    error.getField(),
                    error.getDefaultMessage(),
                    error.getRejectedValue()
            ));
        }
        
        log.warn("Validation failed: {} field errors", fieldErrors.size());
        
        ErrorResponseDto error = ErrorResponseDto.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message("Validation failed")
                .path(request.getRequestURI())
                .errorCode("VALIDATION_ERROR")
                .fieldErrors(fieldErrors)
                .timestamp(java.time.LocalDateTime.now())
                .build();
        
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Handle malformed JSON
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponseDto> handleMalformedJson(
            HttpMessageNotReadableException ex, 
            HttpServletRequest request) {
        
        log.warn("Malformed JSON request: {}", ex.getMessage());
        
        ErrorResponseDto error = ErrorResponseDto.of(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                "Malformed JSON request",
                request.getRequestURI(),
                "MALFORMED_JSON"
        );
        
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Handle unsupported media type
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    @ResponseStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
    public ResponseEntity<ErrorResponseDto> handleUnsupportedMediaType(
            HttpMediaTypeNotSupportedException ex, 
            HttpServletRequest request) {
        
        log.warn("Unsupported media type: {}", ex.getContentType());
        
        ErrorResponseDto error = ErrorResponseDto.of(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(),
                "Unsupported Media Type",
                "Content-Type '" + ex.getContentType() + "' is not supported. Please use 'application/json'",
                request.getRequestURI(),
                "UNSUPPORTED_MEDIA_TYPE"
        );
        
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(error);
    }

    /**
     * Handle method not allowed
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public ResponseEntity<ErrorResponseDto> handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException ex, 
            HttpServletRequest request) {
        
        log.warn("Method not allowed: {} {}", ex.getMethod(), request.getRequestURI());
        
        ErrorResponseDto error = ErrorResponseDto.of(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                "Method Not Allowed",
                "HTTP method '" + ex.getMethod() + "' is not supported for this endpoint",
                request.getRequestURI(),
                "METHOD_NOT_ALLOWED"
        );
        
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(error);
    }

    /**
     * Handle access denied
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<ErrorResponseDto> handleAccessDenied(
            AccessDeniedException ex, 
            HttpServletRequest request) {
        
        log.warn("Access denied: {}", request.getRequestURI());
        
        ErrorResponseDto error = ErrorResponseDto.of(
                HttpStatus.FORBIDDEN.value(),
                "Forbidden",
                "You don't have permission to access this resource",
                request.getRequestURI(),
                "ACCESS_DENIED"
        );
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    /**
     * Handle bad credentials (Spring Security)
     */
    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<ErrorResponseDto> handleBadCredentials(
            BadCredentialsException ex, 
            HttpServletRequest request) {
        
        log.warn("Bad credentials: {}", request.getRequestURI());
        
        ErrorResponseDto error = ErrorResponseDto.of(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                "Invalid username or password",
                request.getRequestURI(),
                "BAD_CREDENTIALS"
        );
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Handle 404 - No handler found
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<ErrorResponseDto> handleNotFound(
            NoHandlerFoundException ex, 
            HttpServletRequest request) {
        
        log.warn("No handler found: {} {}", ex.getHttpMethod(), ex.getRequestURL());
        
        ErrorResponseDto error = ErrorResponseDto.of(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                "The requested resource was not found",
                request.getRequestURI(),
                "NOT_FOUND"
        );
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ErrorResponseDto> handleGenericException(
            Exception ex, 
            HttpServletRequest request) {
        
        log.error("Unexpected error occurred", ex);
        
        ErrorResponseDto error = ErrorResponseDto.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "An unexpected error occurred. Please try again later.",
                request.getRequestURI(),
                "INTERNAL_ERROR"
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
