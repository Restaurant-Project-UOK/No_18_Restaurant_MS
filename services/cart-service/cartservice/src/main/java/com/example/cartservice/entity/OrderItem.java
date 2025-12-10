package com.example.cartservice.entity;

import java.math.BigDecimal;
import java. time.LocalDateTime;

import jakarta.persistence. Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta. persistence.GeneratedValue;
import jakarta.persistence. GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence. JoinColumn;
import jakarta.persistence. ManyToOne;
import jakarta.persistence. PrePersist;
import jakarta.persistence. Table;
import lombok.AllArgsConstructor;
import lombok. Builder;
import lombok. Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Order order;
    
    @Column(nullable = false)
    private Long menuItemId;
    
    @Column(nullable = false)
    private String itemName;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(length = 500)
    private String note;
    
    private LocalDateTime addedAt;
    
    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
    }
    
    public BigDecimal getSubtotal() {
        return price.multiply(BigDecimal.valueOf(quantity));
    }
}