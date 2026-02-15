package com.restaurant.promotion_service.exception;

public class BadRequestException extends RuntimeException{
    
     public BadRequestException(String message) {
        super(message);
    }
}
