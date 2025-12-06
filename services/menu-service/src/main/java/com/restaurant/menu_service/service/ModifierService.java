package com.restaurant.menu_service.service;

import com.restaurant.menu_service.dto.*;
import com.restaurant.menu_service.entity.Modifier;
import com.restaurant.menu_service.repository.*;
import com.restaurant.menu_service.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModifierService {
    private final ModifierRepository repo;
    private final ItemRepository itemRepo;

    @Transactional
    public ModifierResponseDTO create(ModifierRequestDTO dto) {
        // Ensure item exists
        if (!itemRepo.existsById(dto.getItemId()))
            throw new NotFoundException("Item not found");
        Modifier m = new Modifier();
        m.setItemId(dto.getItemId());
        m.setName(dto.getName());
        m.setType(dto.getType());
        m.setOptions(dto.getOptions());
        Modifier saved = repo.save(m);
        return map(saved);
    }

    @Transactional(readOnly = true)
    public java.util.List<ModifierResponseDTO> listByItem(String itemId) {
        if (!itemRepo.existsById(itemId))
            throw new NotFoundException("Item not found");
        return repo.findByItemId(itemId).stream().map(this::map).collect(Collectors.toList());
    }

    @Transactional
    public ModifierResponseDTO update(String id, ModifierRequestDTO dto) {
        Modifier m = repo.findById(id).orElseThrow(() -> new NotFoundException("Modifier not found"));
        if (dto.getName() != null)
            m.setName(dto.getName());
        if (dto.getType() != null)
            m.setType(dto.getType());
        if (dto.getOptions() != null)
            m.setOptions(dto.getOptions());
        Modifier saved = repo.save(m);
        return map(saved);
    }

    @Transactional
    public void delete(String id) {
        // No special rules here; front-end must ensure not used in cart/order before
        // deletion
        repo.deleteById(id);
    }

    private ModifierResponseDTO map(Modifier m) {
        return ModifierResponseDTO.builder()
                .id(m.getId())
                .itemId(m.getItemId())
                .name(m.getName())
                .type(m.getType())
                .options(m.getOptions())
                .build();
    }
}
