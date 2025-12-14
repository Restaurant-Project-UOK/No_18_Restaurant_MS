package com.example.auth_service.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResponseDto {
    private String accessToken;
    private String refreshToken;
    private int tableId;
}
