package com.example.waiter_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderReadyEvent {
    private String tableNumber;
    private String customerName;
    private String itemName;
}