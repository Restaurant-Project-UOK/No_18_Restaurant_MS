package com.restaurant.menu_service.controller;

import com.restaurant.menu_service.api.ApiResponse;
import com.restaurant.menu_service.dto.*;
import com.restaurant.menu_service.service.ModifierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/items/{itemId}/modifiers")
public class ModifierController {
    private final ModifierService service;

    @PostMapping
    public ResponseEntity<ApiResponse<ModifierResponseDTO>> create(@PathVariable String itemId,
            @Valid @RequestBody ModifierRequestDTO dto) {
        dto.setItemId(itemId);
        ModifierResponseDTO created = service.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<ModifierResponseDTO>builder().success(true).message("Created").data(created).build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ModifierResponseDTO>>> list(@PathVariable String itemId) {
        return ResponseEntity.ok(ApiResponse.<List<ModifierResponseDTO>>builder().success(true).message("OK")
                .data(service.listByItem(itemId)).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ModifierResponseDTO>> update(@PathVariable String itemId, @PathVariable String id,
            @Valid @RequestBody ModifierRequestDTO dto) {
        dto.setItemId(itemId);
        return ResponseEntity.ok(ApiResponse.<ModifierResponseDTO>builder().success(true).message("Updated")
                .data(service.update(id, dto)).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String itemId, @PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }
}
