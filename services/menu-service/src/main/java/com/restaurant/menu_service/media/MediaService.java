package com.restaurant.menu_service.media;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.mongodb.gridfs.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.springframework.data.mongodb.gridfs.GridFsResource;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final GridFsTemplate gridFsTemplate;
    private final GridFsOperations gridFsOperations;

    @Value("${media.max-file-size:5242880}")
    private long maxFileSize;

    public String store(MultipartFile file) throws IOException {
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File too large. Max " + (maxFileSize / 1024 / 1024) + "MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image uploads are allowed");
        }
        Document meta = new Document();
        meta.put("originalName", file.getOriginalFilename());
        meta.put("contentType", contentType);
        ObjectId id = gridFsTemplate.store(file.getInputStream(), file.getOriginalFilename(), contentType, meta);
        return id.toHexString();
    }

    public InputStreamResource getFile(String id) throws IOException {
        GridFSFile file = gridFsTemplate.findOne(Query.query(Criteria.where("_id").is(new ObjectId(id))));
        if (file == null)
            throw new RuntimeException("File not found");
        GridFsResource resource = gridFsOperations.getResource(file);
        return new InputStreamResource(resource.getInputStream());
    }

    public void delete(String id) {
        gridFsTemplate.delete(Query.query(Criteria.where("_id").is(new ObjectId(id))));
    }
}
