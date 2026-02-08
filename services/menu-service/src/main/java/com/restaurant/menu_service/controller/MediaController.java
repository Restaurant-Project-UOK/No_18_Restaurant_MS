package com.restaurant.menu_service.controller;

import com.restaurant.menu_service.service.MediaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

/**
 * Media/Image streaming endpoints
 */
@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
@Slf4j
public class MediaController {

    private final MediaService mediaService;

    /**
     * Stream image from MongoDB GridFS
     * GET /api/media/{imageId}
     */
    @GetMapping("/{imageId}")
    public ResponseEntity<InputStreamResource> getImage(@PathVariable String imageId) {
        log.info("GET /api/media/{}", imageId);

        try {
            GridFsResource resource = mediaService.getImage(imageId);
            String contentType = mediaService.getContentType(imageId);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                    .body(new InputStreamResource(resource.getInputStream()));

        } catch (IOException e) {
            log.error("Error streaming image: {}", imageId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete image (admin only)
     * DELETE /api/media/{imageId}
     */
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable String imageId) {
        log.info("DELETE /api/media/{}", imageId);
        mediaService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }

}

