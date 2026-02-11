package com.restaurant.menu_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @ManyToMany(mappedBy = "categories")
    @JsonIgnore
    @Builder.Default
    private Set<MenuItem> menuItems = new HashSet<>();

}

