package com.example.waiter_service.service;

import com.example.waiter_service.dto.OrderReadyEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "orders-ready", groupId = "waiter-group-v2")
    public void listen(OrderReadyEvent event) {
        System.out.println("Received Order: " + event);
        messagingTemplate.convertAndSend("/topic/orders", event);
    }
}