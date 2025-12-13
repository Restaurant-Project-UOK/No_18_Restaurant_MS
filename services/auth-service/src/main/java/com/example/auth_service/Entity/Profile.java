package com.example.auth_service.Entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    private Integer id; // Same as User.id

    private String fullName;
    private String phone;
    private String address;



    private LocalDateTime createdAt; // Profile creation timestamp
    private LocalDateTime updatedAt; // Profile last update timestamp

    // One-to-one relationship with User
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId // Profile ID comes from User ID
    @JoinColumn(name = "id") // Foreign key to User.id
    private User user;
}