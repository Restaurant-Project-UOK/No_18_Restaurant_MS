package com.restaurant.menu_service.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "modifiers")
@Data
public class Modifier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String type;
    private String options; // Mapped from JSON

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;
}
