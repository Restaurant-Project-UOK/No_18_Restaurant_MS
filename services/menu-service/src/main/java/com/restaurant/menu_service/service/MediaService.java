package com.restaurant.menu_service.service;

import com.mongodb.client.gridfs.model.GridFSFile;
import com.restaurant.menu_service.exception.BadRequestException;
import com.restaurant.menu_service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaService {

    private final GridFsTemplate gridFsTemplate;

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    /**
     * Upload image to MongoDB GridFS
     */
    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Invalid file type. Allowed types: JPEG, PNG, WEBP");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds maximum limit of 5MB");
        }

        try {
            String filename = file.getOriginalFilename();
            InputStream inputStream = file.getInputStream();

            ObjectId fileId = gridFsTemplate.store(
                    inputStream,
                    filename,
                    contentType
            );

            log.info("Image uploaded successfully with ID: {}", fileId.toString());
            return fileId.toString();

        } catch (IOException e) {
            log.error("Failed to upload image", e);
            throw new BadRequestException("Failed to upload image: " + e.getMessage());
        }
    }

    /**
     * Retrieve image from MongoDB GridFS
     */
    public GridFsResource getImage(String imageId) {
        try {
            ObjectId objectId = new ObjectId(imageId);
            GridFSFile file = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(objectId)));

            if (file == null) {
                throw new ResourceNotFoundException("Image", "id", imageId);
            }

            GridFsResource resource = gridFsTemplate.getResource(file);
            log.info("Image retrieved successfully: {}", imageId);
            return resource;

        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid image ID format");
        }
    }

    /**
     * Delete image from MongoDB GridFS
     */
    public void deleteImage(String imageId) {
        if (imageId == null || imageId.isEmpty()) {
            return;
        }

        try {
            ObjectId objectId = new ObjectId(imageId);
            GridFSFile file = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(objectId)));

            if (file == null) {
                log.warn("Image not found for deletion: {}", imageId);
                return;
            }

            gridFsTemplate.delete(new Query(Criteria.where("_id").is(objectId)));
            log.info("Image deleted successfully: {}", imageId);

        } catch (IllegalArgumentException e) {
            log.error("Invalid image ID format: {}", imageId);
        }
    }

    /**
     * Get content type for image
     */
    public String getContentType(String imageId) {
        try {
            ObjectId objectId = new ObjectId(imageId);
            GridFSFile file = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(objectId)));

            if (file == null) {
                return "application/octet-stream";
            }

            return file.getMetadata() != null && file.getMetadata().get("_contentType") != null
                    ? file.getMetadata().get("_contentType").toString()
                    : "application/octet-stream";

        } catch (IllegalArgumentException e) {
            return "application/octet-stream";
        }
    }

}

