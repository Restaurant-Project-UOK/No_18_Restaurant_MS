package com.example.waiter_service.controller;

import com.example.waiter_service.dto.OrderReadyEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @Autowired
    private KafkaTemplate<String, OrderReadyEvent> kafkaTemplate;

    @PostMapping("/test-publish")
    public String publish(@RequestBody OrderReadyEvent event) {
        kafkaTemplate.send("orders-ready", event);
        return "Message sent to Kafka!";
    }
}