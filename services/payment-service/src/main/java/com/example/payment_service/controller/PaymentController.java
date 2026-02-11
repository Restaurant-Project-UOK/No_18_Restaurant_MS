package com.example.payment_service.controller;

import com.example.payment_service.dto.PaymentRequest;
import com.example.payment_service.service.PayPalService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PayPalService payPalService;

    public PaymentController(PayPalService payPalService) {
        this.payPalService = payPalService;
    }

    @PostMapping("/create")
    public ResponseEntity<String> createPayment(@RequestBody PaymentRequest req) {
        try {
            if (req == null || req.getAmount() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("'amount' field is required in the JSON body");
            }

            String approveUrl = payPalService.createOrder(req.getAmount());
            return ResponseEntity.ok(approveUrl);
        } catch (Exception ex) {
            log.error("Error creating payment: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating payment: " + ex.getMessage());
        }
    }
}
