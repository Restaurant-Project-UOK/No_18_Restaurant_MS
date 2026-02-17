package com.example.auth_service.DTO;

import java.time.LocalDateTime;

import com.example.auth_service.Entity.Profile;
import com.example.auth_service.Entity.User;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ProfileDto {

    private Long id;           // same as user.id
    private String email;         // from user entity
    private String fullName;
    private String phone;
    private String address;
    private String additionalInfo; // JSON as string
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Simple constructor for basic profile info */
    public ProfileDto(String fullName, String phone, String address) {
        this.fullName = fullName;
        this.phone = phone;
        this.address = address;
    }

    /** Full constructor */
    public ProfileDto(Long id, String email, String fullName, String phone, String address,
                      String additionalInfo, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.address = address;
        this.additionalInfo = additionalInfo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /** Constructor from User and Profile entities */
    public ProfileDto(User user, Profile profile) {
        this.id = user.getId();
        this.email = user.getEmail();
        if (profile != null) {
            this.fullName = profile.getFullName();
            this.phone = profile.getPhone();
            this.address = profile.getAddress();
            this.additionalInfo = profile.getAdditionalInfo();
            this.createdAt = profile.getCreatedAt();
            this.updatedAt = profile.getUpdatedAt();
        }
    }

    /** Mapping method from Profile entity */
    public static ProfileDto fromEntity(Profile profile) {
        return new ProfileDto(
            profile.getUser().getId(),
            profile.getUser().getEmail(),
            profile.getFullName(),
            profile.getPhone(),
            profile.getAddress(),
            profile.getAdditionalInfo(),
            profile.getCreatedAt(),
            profile.getUpdatedAt()
        );
    }
}
