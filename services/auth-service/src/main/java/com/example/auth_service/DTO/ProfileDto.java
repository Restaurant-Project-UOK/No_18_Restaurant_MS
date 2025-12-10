package com.example.auth_service.DTO;

import com.example.auth_service.Entity.Profile;
import com.example.auth_service.Entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDto {

    // User fields
    private Integer id;
    private String email;
    private Integer role;
    private Integer provider;

    // Profile fields
    private String fullName;
    private String phone;
    private String address;

    // Custom constructor to map from entities
    public ProfileDto(User user, Profile profile) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.role = user.getRole();
     //   this.provider = user.getProvider();

        if (profile != null) {
            this.fullName = profile.getFullName();
            this.phone = profile.getPhone();
            this.address = profile.getAddress();
        }
    }
}
